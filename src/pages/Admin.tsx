import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  inventory: z.number().int().nonnegative('Inventory must be non-negative'),
  images: z.array(z.string().url()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  price: number;
  sku: string;
  inventory: number;
  images?: string[];
  is_active: boolean;
  created_at: string;
}

const categories = ['Jerseys', 'Shorts', 'Accessories', 'Equipment', 'Footwear'];

const Admin = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema)
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Ensure all required fields are present
      if (!data.name || !data.slug || !data.category || !data.price || !data.sku || data.inventory === undefined) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const productData = {
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        category: data.category,
        price: data.price,
        sku: data.sku,
        inventory: data.inventory,
        images: data.images || [],
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      reset();
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setValue('name', product.name);
    setValue('slug', product.slug);
    setValue('description', product.description || '');
    setValue('category', product.category);
    setValue('price', product.price);
    setValue('sku', product.sku);
    setValue('inventory', product.inventory);
    setValue('images', product.images || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleProductStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage your T-Sports product catalog
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingProduct ? 'Edit Product' : 'Create Product'}
              </CardTitle>
              <CardDescription>
                {editingProduct ? 'Update product information' : 'Add a new product to your catalog'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="T-Sports Football Jersey"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      {...register('slug')}
                      placeholder="football-jersey-blue"
                    />
                    {errors.slug && (
                      <p className="text-sm text-destructive">{errors.slug.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="High-quality football jersey made from moisture-wicking fabric..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => setValue('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      {...register('sku')}
                      placeholder="TSJ001"
                    />
                    {errors.sku && (
                      <p className="text-sm text-destructive">{errors.sku.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PKR)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register('price', { valueAsNumber: true })}
                      placeholder="2500"
                    />
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inventory">Inventory</Label>
                    <Input
                      id="inventory"
                      type="number"
                      {...register('inventory', { valueAsNumber: true })}
                      placeholder="50"
                    />
                    {errors.inventory && (
                      <p className="text-sm text-destructive">{errors.inventory.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (editingProduct ? 'Updating...' : 'Creating...') : (editingProduct ? 'Update Product' : 'Create Product')}
                  </Button>
                  {editingProduct && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingProduct(null);
                        reset();
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Products List */}
          <Card>
            <CardHeader>
              <CardTitle>Products ({products.length})</CardTitle>
              <CardDescription>
                Manage your existing products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No products found. Create your first product!
                  </p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {product.category} • SKU: {product.sku}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">{formatPrice(product.price)}</span>
                          <span className="text-muted-foreground">
                            Stock: {product.inventory}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                        >
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;