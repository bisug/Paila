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

CREATE TRIGGER profiles_lock_account_type_for_guides
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_account_type_change_if_guide_submitted();