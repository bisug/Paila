-- Consolidated baseline migration for Paila.
-- This replaces the previous incremental migrations and builds the final schema
-- in one pass for fresh Supabase environments.

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_interests (
  user_id uuid NOT NULL PRIMARY KEY,
  interests text[] NOT NULL DEFAULT '{}',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.guide_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  guide_id_number text NOT NULL,
  place text NOT NULL,
  phone text NOT NULL,
  id_card_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  CONSTRAINT guide_verifications_name_len CHECK (char_length(full_name) BETWEEN 2 AND 80),
  CONSTRAINT guide_verifications_id_len CHECK (guide_id_number ~ '^[A-Za-z0-9-]{4,32}$'),
  CONSTRAINT guide_verifications_place_len CHECK (char_length(place) BETWEEN 2 AND 80),
  CONSTRAINT guide_verifications_phone_len CHECK (phone ~ '^\+?[0-9 ()-]{7,20}$')
);

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  account_type text NOT NULL DEFAULT 'traveller' CHECK (account_type IN ('traveller','business')),
  business_type text CHECK (business_type IN ('guide','restaurant','hotel','shop','transport','other')),
  first_name text,
  last_name text,
  full_name text,
  gender text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_type_required CHECK (
    (account_type = 'business' AND business_type IS NOT NULL) OR
    (account_type = 'traveller' AND business_type IS NULL)
  ),
  CONSTRAINT profiles_gender_check CHECK (gender IN ('male','female')),
  CONSTRAINT profiles_full_name_len CHECK (full_name IS NULL OR char_length(full_name) BETWEEN 1 AND 100),
  CONSTRAINT profiles_first_name_len CHECK (first_name IS NULL OR char_length(first_name) BETWEEN 1 AND 50),
  CONSTRAINT profiles_last_name_len CHECK (last_name IS NULL OR char_length(last_name) BETWEEN 1 AND 50)
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.admin_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  admin_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_slug text NOT NULL,
  hotel_name text NOT NULL,
  hotel_location text NOT NULL,
  hotel_image text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests int NOT NULL CHECK (guests > 0),
  nights int NOT NULL CHECK (nights > 0),
  price_per_night_npr int NOT NULL CHECK (price_per_night_npr > 0),
  total_npr int NOT NULL CHECK (total_npr > 0),
  total_usd_cents int NOT NULL CHECK (total_usd_cents > 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','failed')),
  stripe_session_id text,
  stripe_payment_intent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_date_order CHECK (check_out > check_in),
  CONSTRAINT bookings_max_stay CHECK (nights <= 30)
);

CREATE TABLE public.checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id text,
  name text NOT NULL,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX bookings_user_created_idx
  ON public.bookings (user_id, created_at DESC);
CREATE INDEX bookings_session_idx
  ON public.bookings (stripe_session_id);
CREATE INDEX checkpoints_user_id_idx
  ON public.checkpoints (user_id);
CREATE UNIQUE INDEX checkpoints_user_place_uniq
  ON public.checkpoints (user_id, place_id)
  WHERE place_id IS NOT NULL;
CREATE INDEX admin_audit_events_created_idx
  ON public.admin_audit_events (created_at DESC);
CREATE INDEX admin_audit_events_target_idx
  ON public.admin_audit_events (target_table, target_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.guide_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.checkpoints TO authenticated;
GRANT SELECT ON public.admin_audit_events TO authenticated;

GRANT ALL ON public.user_interests TO service_role;
GRANT ALL ON public.guide_verifications TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.admin_settings TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.bookings TO service_role;
GRANT ALL ON public.checkpoints TO service_role;
GRANT ALL ON public.admin_audit_events TO service_role;

ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_settings (id) VALUES (1);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

CREATE POLICY "Users can view their own interests"
  ON public.user_interests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests"
  ON public.user_interests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests"
  ON public.user_interests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own verification"
  ON public.guide_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit their own verification"
  ON public.guide_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can update their own pending verification"
  ON public.guide_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins view all verifications"
  ON public.guide_verifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update any verification"
  ON public.guide_verifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone signed in can view admin settings"
  ON public.admin_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins update admin settings"
  ON public.admin_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users view own checkpoints"
  ON public.checkpoints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own checkpoints"
  ON public.checkpoints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own checkpoints"
  ON public.checkpoints FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view audit events"
  ON public.admin_audit_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('guide-ids', 'guide-ids', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Guide ID owners can read their files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'guide-ids'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Guide ID owners can upload their files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'guide-ids'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Guide ID owners can update their files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'guide-ids'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Guide ID owners can delete their files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'guide-ids'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE OR REPLACE FUNCTION public.prevent_account_type_change_if_guide_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type IS DISTINCT FROM OLD.account_type
     OR NEW.business_type IS DISTINCT FROM OLD.business_type THEN
    IF EXISTS (
      SELECT 1 FROM public.guide_verifications
      WHERE user_id = OLD.user_id
        AND status IN ('pending','approved')
    ) THEN
      RAISE EXCEPTION 'Cannot change account type while a guide verification is pending or approved'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_account_type_change_if_guide_submitted()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_admins_new_guide_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT
    ur.user_id,
    'guide_submission_new',
    'New guide verification',
    NEW.full_name || ' submitted a guide verification for ' || NEW.place,
    '/admin/guides'
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admins_new_guide_submission()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_guide_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  title_text text;
  body_text text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
    IF NEW.status = 'approved' THEN
      title_text := 'Your guide verification was approved';
      body_text := 'Congratulations! Your guide profile is now verified.';
    ELSE
      title_text := 'Your guide verification was rejected';
      body_text := COALESCE(NULLIF(NEW.review_note, ''), 'Please review your submission and try again.');
    END IF;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'guide_status_' || NEW.status, title_text, body_text, '/guide/verify');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_guide_status_change()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_booking_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'booking_confirmed',
      'Booking confirmed: ' || NEW.hotel_name,
      'Your stay (' || NEW.nights || ' night' || CASE WHEN NEW.nights = 1 THEN '' ELSE 's' END || ') is confirmed.',
      '/profile/bookings'
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_booking_confirmed()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.audit_guide_verification_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.review_note IS DISTINCT FROM OLD.review_note THEN
    INSERT INTO public.admin_audit_events (
      actor_id,
      action,
      target_table,
      target_id,
      old_data,
      new_data
    )
    VALUES (
      auth.uid(),
      'guide_verification_review',
      'guide_verifications',
      NEW.id,
      jsonb_build_object('status', OLD.status, 'review_note', OLD.review_note),
      jsonb_build_object('status', NEW.status, 'review_note', NEW.review_note)
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.audit_guide_verification_review()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  raw_full_name text;
  first_name_value text;
  last_name_value text;
  gender_value text;
BEGIN
  raw_full_name := nullif(
    trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')),
    ''
  );

  IF raw_full_name IS NULL AND NEW.email IS NOT NULL THEN
    raw_full_name := nullif(split_part(NEW.email, '@', 1), '');
  END IF;

  IF raw_full_name IS NULL AND NEW.phone IS NOT NULL THEN
    raw_full_name := nullif(NEW.phone, '');
  END IF;

  first_name_value := nullif(split_part(raw_full_name, ' ', 1), '');
  last_name_value := nullif(trim(regexp_replace(coalesce(raw_full_name, ''), '^[^ ]+ ?', '')), '');
  gender_value := CASE
    WHEN NEW.raw_user_meta_data ->> 'gender' IN ('male', 'female')
      THEN NEW.raw_user_meta_data ->> 'gender'
    ELSE NULL
  END;

  INSERT INTO public.profiles (
    user_id,
    account_type,
    business_type,
    first_name,
    last_name,
    full_name,
    gender
  )
  VALUES (
    NEW.id,
    'traveller',
    NULL,
    first_name_value,
    last_name_value,
    raw_full_name,
    gender_value
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = coalesce(public.profiles.first_name, EXCLUDED.first_name),
    last_name = coalesce(public.profiles.last_name, EXCLUDED.last_name),
    full_name = coalesce(public.profiles.full_name, EXCLUDED.full_name),
    gender = coalesce(public.profiles.gender, EXCLUDED.gender);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user_profile()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER user_interests_touch
BEFORE UPDATE ON public.user_interests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER guide_verifications_touch_updated_at
BEFORE UPDATE ON public.guide_verifications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER profiles_touch_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER bookings_touch_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER profiles_lock_account_type_for_guides
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_account_type_change_if_guide_submitted();

CREATE TRIGGER guide_verifications_notify_admins
AFTER INSERT ON public.guide_verifications
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_guide_submission();

CREATE TRIGGER guide_verifications_notify_guide
AFTER UPDATE OF status ON public.guide_verifications
FOR EACH ROW EXECUTE FUNCTION public.notify_guide_status_change();

CREATE TRIGGER bookings_notify_confirmed
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_confirmed();

CREATE TRIGGER guide_verifications_audit_review
AFTER UPDATE OF status, review_note ON public.guide_verifications
FOR EACH ROW EXECUTE FUNCTION public.audit_guide_verification_review();

CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user_profile();
