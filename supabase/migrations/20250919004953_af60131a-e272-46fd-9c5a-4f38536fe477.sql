-- Add screenshot upload and admin approval columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE;

-- Update order status enum to include more states
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_approval';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'confirmed';