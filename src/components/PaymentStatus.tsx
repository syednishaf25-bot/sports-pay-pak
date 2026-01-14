import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStatusProps {
  type: 'success' | 'failed' | 'processing';
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface OrderDetails {
  id: string;
  total_amount: number;
  status: string;
  customer_name: string;
  order_items?: OrderItem[];
}

const PaymentStatus = ({ type }: PaymentStatusProps) => {
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order');
  const errorMessage = searchParams.get('error');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async (id: string) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          customer_name,
          order_items (
            id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && order) {
        setOrderDetails(order as OrderDetails);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
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

  const getStatusConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: 'Payment Successful!',
          message: 'Your order has been confirmed and will be processed shortly.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'failed':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: 'Payment Failed',
          message: errorMessage || 'There was an issue processing your payment. Please try again.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />,
          title: 'Processing Payment',
          message: 'Please wait while we process your payment...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      default:
        return {
          icon: <XCircle className="h-16 w-16 text-gray-500" />,
          title: 'Unknown Status',
          message: 'Unable to determine payment status.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const config = getStatusConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64 mx-auto"></div>
          <div className="h-64 bg-muted rounded w-96 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {config.icon}
            </div>
            <CardTitle className="text-2xl">{config.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{config.message}</p>
            
            {orderDetails && (
              <div className="bg-background rounded-lg p-4 space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">{orderDetails.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">{formatPrice(orderDetails.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium capitalize ${
                      orderDetails.status === 'paid' 
                        ? 'text-green-600' 
                        : orderDetails.status === 'cancelled'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {orderDetails.status}
                    </span>
                  </div>
                </div>
                
                {orderDetails.order_items && orderDetails.order_items.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">Order Items:</h4>
                    <div className="space-y-1">
                      {orderDetails.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>{formatPrice(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              {type === 'success' ? (
                <>
                  <Link to="/" className="flex-1">
                    <Button className="w-full">Back to Home</Button>
                  </Link>
                  <Link to="/products" className="flex-1">
                    <Button variant="outline" className="w-full">Continue Shopping</Button>
                  </Link>
                </>
              ) : type === 'failed' ? (
                <>
                  <Link to="/checkout" className="flex-1">
                    <Button className="w-full">Try Again</Button>
                  </Link>
                  <Link to="/products" className="flex-1">
                    <Button variant="outline" className="w-full">Continue Shopping</Button>
                  </Link>
                </>
              ) : (
                <Button disabled className="w-full">
                  Processing...
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {type === 'success' && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                You will receive an order confirmation email shortly.
                For any questions, contact our customer support.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
