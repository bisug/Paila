-- Phase 1 RBAC Enhancement: Expanded App Roles, Bilateral Booking Ownership, and JWT Custom Claims.

-- 1. Expand app_role enum to support multi-party domain actors
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'host';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guide';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'verifier';

-- 2. Add bilateral ownership and listing metadata to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS host_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_id text,
  ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'hotel' CHECK (listing_type IN ('hotel', 'experience', 'transport'));

CREATE INDEX IF NOT EXISTS bookings_host_user_id_idx
  ON public.bookings (host_user_id, status);

-- 3. Two-sided RLS policies for bookings
-- Hosts can view bookings for listings they own
CREATE POLICY "Hosts view own listing bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = host_user_id);

-- Hosts can confirm or reject pending booking requests for their listings
CREATE POLICY "Hosts update pending listing bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = host_user_id AND status IN ('confirmed', 'cancelled'));

-- Admins can view all bookings for operational dispute resolution
CREATE POLICY "Admins view all bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Sync user_roles into auth.users.raw_app_meta_data for zero-roundtrip edge claims
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id uuid;
  roles_array text[];
BEGIN
  target_user_id := COALESCE(NEW.user_id, OLD.user_id);
  IF target_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(array_agg(role::text), ARRAY[]::text[])
  INTO roles_array
  FROM public.user_roles
  WHERE user_id = target_user_id;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('roles', roles_array)
  WHERE id = target_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_user_roles_to_jwt() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_user_roles_sync_jwt ON public.user_roles;
CREATE TRIGGER on_user_roles_sync_jwt
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles_to_jwt();
