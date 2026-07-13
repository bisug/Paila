-- Admin promotion path (role-based dashboard separation, D3).
-- Reuses the existing editable admin_settings.admin_email as the single source
-- of truth for "who is the admin account": when a user's auth email matches it,
-- they are granted the 'admin' role. No new UI and no separate roles system.

CREATE OR REPLACE FUNCTION public.grant_admin_if_match(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF _email IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id, 'admin'
  FROM auth.users u
  WHERE u.email = _email
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'admin'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_admin_if_match(text) FROM PUBLIC, anon, authenticated;

-- Promote on new signup if the email already matches admin_settings.admin_email.
CREATE OR REPLACE FUNCTION public.promote_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM public.grant_admin_if_match(NEW.email);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.promote_admin_on_signup() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_promote_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.promote_admin_on_signup();

-- When an admin sets admin_email, promote any existing matching account.
CREATE OR REPLACE FUNCTION public.promote_admin_on_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM public.grant_admin_if_match(NEW.admin_email);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.promote_admin_on_settings_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_admin_settings_email_change
  AFTER UPDATE OF admin_email ON public.admin_settings
  FOR EACH ROW
  WHEN (OLD.admin_email IS DISTINCT FROM NEW.admin_email)
  EXECUTE FUNCTION public.promote_admin_on_settings_change();
