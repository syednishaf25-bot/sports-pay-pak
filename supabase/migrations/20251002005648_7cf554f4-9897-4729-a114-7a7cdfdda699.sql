-- Ensure RLS is enabled and restrict access to contact_messages to admins only
-- 1) Enable Row Level Security on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 2) Drop legacy broad policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_messages' AND policyname = 'Admins can manage all contact messages'
  ) THEN
    DROP POLICY "Admins can manage all contact messages" ON public.contact_messages;
  END IF;
END $$;

-- 3) Create explicit admin-only policies for all operations
-- Only admins can SELECT
CREATE POLICY "Admins can select contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can INSERT (public submissions must go through Edge Function using service role)
CREATE POLICY "Admins can insert contact messages"
ON public.contact_messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can UPDATE
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can DELETE
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
