-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for payment screenshots
CREATE POLICY "Payment screenshots are viewable by admin" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-screenshots' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload their payment screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their payment screenshots" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admin can manage all payment screenshots" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'payment-screenshots' AND EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));