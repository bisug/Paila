-- Re-run all existing schema on fresh Cloud + add bookings

CREATE TABLE public.user_interests (
  user_id UUID NOT NULL PRIMARY KEY,
  interests TEXT[] NOT NULL DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;
GRANT ALL ON public.user_interests TO service_role;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own interests" ON public.user_interests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interests" ON public.user_interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interests" ON public.user_interests FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER user_interests_touch BEFORE UPDATE ON public.user_interests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.guide_verifications TO authenticated;
GRANT ALL ON public.guide_verifications TO service_role;
ALTER TABLE public.guide_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own verification" ON public.guide_verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can submit their own verification" ON public.guide_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Users can update their own pending verification" ON public.guide_verifications FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE TRIGGER guide_verifications_touch_updated_at BEFORE UPDATE ON public.guide_verifications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('guide-ids', 'guide-ids', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Guide ID owners can read their files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'guide-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Guide ID owners can upload their files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'guide-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Guide ID owners can update their files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'guide-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Guide ID owners can delete their files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'guide-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  account_type text NOT NULL CHECK (account_type IN ('traveller','business')),
  business_type text CHECK (business_type IN ('guide','restaurant','hotel','shop','transport','other')),
  first_name text,
  last_name text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_type_required CHECK (
    (account_type = 'business' AND business_type IS NOT NULL) OR
    (account_type = 'traveller' AND business_type IS NULL)
  )
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_account_type_change_if_guide_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.account_type IS DISTINCT FROM OLD.account_type OR NEW.business_type IS DISTINCT FROM OLD.business_type THEN
    IF EXISTS (SELECT 1 FROM public.guide_verifications WHERE user_id = OLD.user_id AND status IN ('pending','approved')) THEN
      RAISE EXCEPTION 'Cannot change account type while a guide verification is pending or approved' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_lock_account_type_for_guides BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_account_type_change_if_guide_submitted();
REVOKE EXECUTE ON FUNCTION public.prevent_account_type_change_if_guide_submitted() FROM PUBLIC, anon, authenticated;

CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.admin_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  admin_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_settings (id) VALUES (1);
CREATE POLICY "Anyone signed in can view admin settings" ON public.admin_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update admin settings" ON public.admin_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

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
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id, read, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all notifications" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all verifications" ON public.guide_verifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update any verification" ON public.guide_verifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.notify_admins_new_guide_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT ur.user_id, 'guide_submission_new', 'New guide verification',
    NEW.full_name || ' submitted a guide verification for ' || NEW.place, '/admin/guides'
  FROM public.user_roles ur WHERE ur.role = 'admin';
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_guide_submission() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guide_verifications_notify_admins AFTER INSERT ON public.guide_verifications
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_guide_submission();

CREATE OR REPLACE FUNCTION public.notify_guide_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE title_text text; body_text text;
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
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_guide_status_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guide_verifications_notify_guide AFTER UPDATE OF status ON public.guide_verifications
FOR EACH ROW EXECUTE FUNCTION public.notify_guide_status_change();

-- ===== NEW: bookings =====
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
  CONSTRAINT bookings_date_order CHECK (check_out > check_in)
);
CREATE INDEX bookings_user_created_idx ON public.bookings (user_id, created_at DESC);
CREATE INDEX bookings_session_idx ON public.bookings (stripe_session_id);
GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE TRIGGER bookings_touch_updated_at BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.notify_booking_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'booking_confirmed',
      'Booking confirmed: ' || NEW.hotel_name,
      'Your stay (' || NEW.nights || ' night' || CASE WHEN NEW.nights = 1 THEN '' ELSE 's' END || ') is confirmed.',
      '/profile/bookings');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_booking_confirmed() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bookings_notify_confirmed AFTER UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_confirmed();