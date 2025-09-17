import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Heart, Share2, Star, Shield, Truck, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
  description: string;
  inventory: number;
  sku: string;
}

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      
      // Fetch main product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError) {
        toast({
          title: "Product not found",
          description: "The requested product could not be found.",
          variant: "destructive",
        });
        navigate('/products');
        return;
      }

      setProduct(productData);

      // Fetch related products from same category
      const { data: relatedData, error: relatedError } = await supabase
        .from('products')
        .select('*')
        .eq('category', productData.category)
        .eq('is_active', true)
        .neq('id', productId)
        .limit(4);

      if (!relatedError && relatedData) {
        const formattedRelated = relatedData.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.images?.[0] || '/placeholder.svg',
          category: p.category,
          rating: 4.5,
          reviews: Math.floor(Math.random() * 100) + 10,
          inStock: p.inventory > 0,
          inventory: p.inventory,
          images: p.images || [],
        }));
        setRelatedProducts(formattedRelated);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error loading product",
        description: "There was an error loading the product details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: quantity,
      image: product.images?.[0] || '/placeholder.svg',
      category: product.category,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg"></div>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-20 h-20 bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-20 bg-muted rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/products')}>
            View All Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <nav className="text-sm text-muted-foreground">
            <span>Home</span> / <span>{product.category}</span> / <span className="text-foreground">{product.name}</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={product.images?.[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square w-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {product.category}
              </p>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < 4 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium ml-1">4.5</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  (127 reviews)
                </span>
                <Badge variant="outline" className="text-xs">
                  SKU: {product.sku}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.inventory > 0 ? (
                  <Badge variant="outline" className="text-accent">
                    In Stock ({product.inventory} available)
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Out of Stock
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-6">{product.description}</p>

              {/* Quantity & Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= product.inventory}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.inventory} available
                  </span>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={handleAddToCart}
                    disabled={product.inventory === 0}
                    className="flex-1 bg-gradient-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {product.inventory > 0 
                      ? `Add to Cart - ${formatPrice(product.price * quantity)}`
                      : 'Out of Stock'
                    }
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Warranty</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-16">
          <CardContent className="p-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="reviews">Reviews (127)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">{product.description}</p>
                  <div>
                    <h4 className="font-semibold mb-2">Product Details:</h4>
                    <div className="grid gap-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">SKU:</span>
                        <span className="text-muted-foreground">{product.sku}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Category:</span>
                        <span className="text-muted-foreground">{product.category}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Availability:</span>
                        <span className={product.inventory > 0 ? 'text-accent' : 'text-destructive'}>
                          {product.inventory > 0 ? `In Stock (${product.inventory})` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="mt-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Detailed specifications will be added based on product category and requirements.
                  </p>
                  <div className="grid gap-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Product Code:</span>
                      <span className="text-muted-foreground">{product.sku}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Brand:</span>
                      <span className="text-muted-foreground">Tahir Sports</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Customer Reviews</h3>
                  <p>Reviews and ratings system coming soon!</p>
                  <p className="text-sm mt-2">Share your experience with this product.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Product;