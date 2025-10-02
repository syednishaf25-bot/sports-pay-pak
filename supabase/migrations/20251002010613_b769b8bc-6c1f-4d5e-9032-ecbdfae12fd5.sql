
-- Update product images to use full Supabase Storage URLs
UPDATE products 
SET images = ARRAY(
  SELECT 'https://mbwpyfclwkfdtnpdpayf.supabase.co/storage/v1/object/public/product-images/' || unnest(images)
)
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0 
  AND NOT images[1] LIKE 'https://%';
