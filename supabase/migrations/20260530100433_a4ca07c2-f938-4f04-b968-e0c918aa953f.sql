-- Roles
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

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin settings (single row, id = 1)
CREATE TABLE public.admin_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  admin_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_settings (id) VALUES (1);

CREATE POLICY "Anyone signed in can view admin settings" ON public.admin_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update admin settings" ON public.admin_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notifications
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

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all notifications" ON public.notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin access on guide_verifications
CREATE POLICY "Admins view all verifications" ON public.guide_verifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update any verification" ON public.guide_verifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger: notify admins on new submission
CREATE OR REPLACE FUNCTION public.notify_admins_new_guide_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT ur.user_id,
         'guide_submission_new',
         'New guide verification',
         NEW.full_name || ' submitted a guide verification for ' || NEW.place,
         '/admin/guides'
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_guide_submission() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER guide_verifications_notify_admins
  AFTER INSERT ON public.guide_verifications
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_guide_submission();

-- Trigger: notify guide on status change
CREATE OR REPLACE FUNCTION public.notify_guide_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
REVOKE EXECUTE ON FUNCTION public.notify_guide_status_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER guide_verifications_notify_guide
  AFTER UPDATE OF status ON public.guide_verifications
  FOR EACH ROW EXECUTE FUNCTION public.notify_guide_status_change();