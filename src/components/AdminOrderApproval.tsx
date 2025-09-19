import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminOrderApprovalProps {
  order: {
    id: string;
    order_number: string;
    screenshot_url?: string;
    admin_approved?: boolean;
    status: string;
    total_amount: number;
  };
  onUpdate: () => void;
}

export function AdminOrderApproval({ order, onUpdate }: AdminOrderApprovalProps) {
  const [processing, setProcessing] = React.useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(price / 100); // Convert from paisa
  };

  const approveOrder = async () => {
    if (!order.screenshot_url) {
      toast.error('No screenshot uploaded for this order');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          admin_approved: true,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('آرڈر کامیابی سے منظور ہو گیا!');
      onUpdate();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('آرڈر منظور کرنے میں خرابی');
    } finally {
      setProcessing(false);
    }
  };

  const rejectOrder = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          admin_approved: false,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('آرڈر منسوخ کر دیا گیا');
      onUpdate();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('آرڈر منسوخ کرنے میں خرابی');
    } finally {
      setProcessing(false);
    }
  };

  const openScreenshot = () => {
    if (order.screenshot_url) {
      window.open(order.screenshot_url, '_blank');
    }
  };

  if (order.status !== 'awaiting_approval') {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Payment Verification Required</CardTitle>
            <CardDescription>
              Order #{order.order_number} • {formatPrice(order.total_amount)}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Awaiting Approval
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {order.screenshot_url ? (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Payment Screenshot</p>
                  <p className="text-sm text-muted-foreground">Click to view uploaded payment proof</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openScreenshot}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">No payment screenshot uploaded</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={approveOrder}
              disabled={processing || !order.screenshot_url}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Approve Order
            </Button>
            
            <Button
              onClick={rejectOrder}
              disabled={processing}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject Order
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}