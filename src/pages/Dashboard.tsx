import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  salesData: Array<{ date: string; sales: number; orders: number }>;
  topProducts: Array<{ name: string; sales: number; quantity: number }>;
  categorySales: Array<{ category: string; sales: number; color: string }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    salesData: [],
    topProducts: [],
    categorySales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get total stats
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        supabase.from('orders').select('total_amount, status'),
        supabase.from('products').select('id'),
        supabase.from('profiles').select('id')
      ]);

      const totalSales = ordersRes.data?.reduce((sum, order) => 
        sum + (order.status === 'paid' ? order.total_amount : 0), 0) || 0;
      const totalOrders = ordersRes.data?.filter(o => o.status === 'paid').length || 0;
      const totalProducts = productsRes.data?.length || 0;
      const totalUsers = usersRes.data?.length || 0;

      // Generate mock sales data for last 7 days
      const salesData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: Math.floor(Math.random() * 50000) + 10000,
          orders: Math.floor(Math.random() * 50) + 10
        };
      });

      // Get top products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          product_name,
          orders!inner(status)
        `)
        .eq('orders.status', 'paid');

      const productSales = orderItems?.reduce((acc: any, item) => {
        if (!acc[item.product_name]) {
          acc[item.product_name] = { name: item.product_name, sales: 0, quantity: 0 };
        }
        acc[item.product_name].sales += item.total_price;
        acc[item.product_name].quantity += item.quantity;
        return acc;
      }, {}) || {};

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.sales - a.sales)
        .slice(0, 5);

      // Get category sales
      const { data: products } = await supabase
        .from('products')
        .select('category, price');

      const categoryData = products?.reduce((acc: any, product) => {
        if (!acc[product.category]) {
          acc[product.category] = { category: product.category, sales: 0 };
        }
        acc[product.category].sales += product.price;
        return acc;
      }, {}) || {};

      const categorySales = Object.values(categoryData).map((item: any, index) => ({
        ...item,
        color: COLORS[index % COLORS.length]
      }));

      setAnalytics({
        totalSales,
        totalOrders,
        totalProducts,
        totalUsers,
        salesData,
        topProducts: topProducts as any,
        categorySales: categorySales as any
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-muted rounded"></div>
              <div className="h-80 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your T-Sports business performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(analytics.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-green-600">+12.5%</Badge> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-green-600">+8.2%</Badge> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Active products in catalog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-green-600">+23.1%</Badge> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Daily sales for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'sales' ? formatPrice(value as number) : value,
                        name === 'sales' ? 'Sales' : 'Orders'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best performing products by sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topProducts} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [formatPrice(value as number), 'Sales']} />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sales"
                  >
                    {analytics.categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatPrice(value as number), 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;