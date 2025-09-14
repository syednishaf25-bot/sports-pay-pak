-- Create enum types
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price INTEGER NOT NULL, -- price in PKR (no decimals)
    currency TEXT DEFAULT 'PKR',
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    sku TEXT UNIQUE NOT NULL,
    inventory INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product variants table
CREATE TABLE public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT,
    color TEXT,
    price INTEGER, -- override price for this variant
    sku TEXT UNIQUE NOT NULL,
    inventory INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    total_amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'PKR',
    shipping_address JSONB,
    pp_txn_ref_no TEXT, -- JazzCash transaction reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    product_name TEXT NOT NULL, -- store name at time of order
    product_sku TEXT NOT NULL
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'jazzcash',
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'PKR',
    status payment_status DEFAULT 'pending',
    transaction_id TEXT,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping cart table for persistent cart
CREATE TABLE public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id, variant_id)
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::TEXT
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1
$$;

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for product variants
CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product variants" 
ON public.product_variants FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view and update their own profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all orders" 
ON public.orders FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for order items
CREATE POLICY "Users can view their order items" 
ON public.order_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create order items for their orders" 
ON public.order_items FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all order items" 
ON public.order_items FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payments
CREATE POLICY "Users can view their payments" 
ON public.payments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = payments.order_id 
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all payments" 
ON public.payments FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cart items
CREATE POLICY "Users can manage their own cart items" 
ON public.cart_items FOR ALL 
USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for timestamp updates
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Create storage policies for product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);

-- Insert sample product data
INSERT INTO public.products (name, slug, description, category, price, sku, inventory, images) VALUES
('Tahir Sports Cricket Jersey', 'cricket-jersey-blue', 'Professional cricket jersey with moisture-wicking fabric', 'Jerseys', 2500, 'TSJ001', 50, ARRAY['cricket-jersey-1.jpg', 'cricket-jersey-2.jpg']),
('Football Training Shorts', 'football-shorts-black', 'Lightweight training shorts for football', 'Shorts', 1200, 'TSS001', 75, ARRAY['football-shorts-1.jpg']),
('Sports Cap - T Sports Logo', 'sports-cap-navy', 'Adjustable sports cap with embroidered logo', 'Accessories', 800, 'TSC001', 100, ARRAY['sports-cap-1.jpg']),
('Athletic Socks Pack', 'athletic-socks-white', 'Pack of 3 athletic socks', 'Accessories', 600, 'TSK001', 120, ARRAY['socks-1.jpg']),
('Training Gloves', 'training-gloves-red', 'Professional training gloves with grip', 'Accessories', 1500, 'TSG001', 30, ARRAY['gloves-1.jpg']);

-- Insert sample variants
INSERT INTO public.product_variants (product_id, size, color, sku, inventory) VALUES
((SELECT id FROM public.products WHERE slug = 'cricket-jersey-blue'), 'S', 'Blue', 'TSJ001-S-BLU', 10),
((SELECT id FROM public.products WHERE slug = 'cricket-jersey-blue'), 'M', 'Blue', 'TSJ001-M-BLU', 15),
((SELECT id FROM public.products WHERE slug = 'cricket-jersey-blue'), 'L', 'Blue', 'TSJ001-L-BLU', 15),
((SELECT id FROM public.products WHERE slug = 'cricket-jersey-blue'), 'XL', 'Blue', 'TSJ001-XL-BLU', 10),
((SELECT id FROM public.products WHERE slug = 'football-shorts-black'), 'S', 'Black', 'TSS001-S-BLK', 20),
((SELECT id FROM public.products WHERE slug = 'football-shorts-black'), 'M', 'Black', 'TSS001-M-BLK', 25),
((SELECT id FROM public.products WHERE slug = 'football-shorts-black'), 'L', 'Black', 'TSS001-L-BLK', 20),
((SELECT id FROM public.products WHERE slug = 'football-shorts-black'), 'XL', 'Black', 'TSS001-XL-BLK', 10);