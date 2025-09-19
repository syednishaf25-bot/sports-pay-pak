import React, { useState } from 'react';
import { Upload, Camera, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface ScreenshotUploadProps {
  orderId: string;
  onUploadComplete?: () => void;
}

export function ScreenshotUpload({ orderId, onUploadComplete }: ScreenshotUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('برائے کرم صرف تصاویر منتخب کریں');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('تصویر کا سائز 5MB سے کم ہونا چاہیے');
      return;
    }

    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('براہ کرم پہلے تصویر منتخب کریں');
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-screenshot-${orderId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      // Update order with screenshot URL
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          screenshot_url: urlData.publicUrl,
          status: 'awaiting_approval'
        })
        .eq('id', orderId);

      if (updateError) {
        throw updateError;
      }

      setUploaded(true);
      toast.success('تصویر کامیابی سے اپلوڈ ہو گئی! ایڈمن کی منظوری کا انتظار کریں');
      onUploadComplete?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('تصویر اپلوڈ کرنے میں خرابی');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setUploaded(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Payment Screenshot Upload
        </CardTitle>
        <CardDescription>
          اپنی پیمنٹ کی تصویر اپلوڈ کریں تاکہ ایڈمن آپ کے آرڈر کو منظور کر سکے
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploaded && (
          <>
            <div className="space-y-2">
              <Label htmlFor="screenshot">Payment Screenshot</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="screenshot"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG or JPEG (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    id="screenshot"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>

            {preview && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative">
                  <img
                    src={preview}
                    alt="Screenshot preview"
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? 'اپلوڈ ہو رہا ہے...' : 'تصویر اپلوڈ کریں'}
            </Button>
          </>
        )}

        {uploaded && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">اپلوڈ مکمل!</h3>
              <p className="text-sm text-gray-600">
                آپ کا آرڈر ایڈمن کی منظوری کا انتظار کر رہا ہے
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}