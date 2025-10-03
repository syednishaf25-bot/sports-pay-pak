-- Seed admin user with credentials
-- This creates the admin user tahir@gmail.com with password 'tahir' for development
-- Note: In production, force password change on first login

-- Insert admin user into auth.users (Supabase will hash the password)
-- We'll use a secure approach by letting the admin sign up through the app
-- and then we'll upgrade their role to admin

-- First, ensure the admin role exists in our enum (it should already exist)
-- This migration assumes the user will sign up normally first, then we promote them

-- Function to promote a user to admin by email
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from auth.users by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Insert or update user_roles to admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove customer role if exists
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'customer';
END;
$$;