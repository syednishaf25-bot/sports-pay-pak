import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSetupAdmin = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('seed-admin');

      if (error) {
        throw error;
      }

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      } else {
        throw new Error(data.error || 'Setup failed');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to set up admin account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Setup</CardTitle>
          <CardDescription>
            Initialize the admin account for first-time setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                {message}
                <br />
                <span className="text-sm">Redirecting to login...</span>
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'idle' && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Admin Credentials:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium">Email:</span> tahir@gmail.com</p>
                  <p><span className="font-medium">Password:</span> tahir</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Click the button below to create the admin account. This only needs to be done once.
              </p>

              <Button 
                onClick={handleSetupAdmin} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>After setup, you can login at <span className="font-medium">/admin/login</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
