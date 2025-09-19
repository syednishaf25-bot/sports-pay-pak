-- Add screenshot upload and admin approval columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE;

-- Update order status enum to include more states
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_approval';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'confirmed';

-- Create admin user with the requested credentials
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'tahir@gmaul.com',
  crypt('tahir123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert admin role for the created user
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'tahir@gmaul.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert admin profile
INSERT INTO profiles (id, full_name)
SELECT id, 'Tahir Yaqoob'
FROM auth.users 
WHERE email = 'tahir@gmaul.com'
ON CONFLICT (id) DO NOTHING;