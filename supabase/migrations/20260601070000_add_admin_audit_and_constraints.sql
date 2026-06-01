CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx
  ON public.admin_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_events_target_idx
  ON public.admin_audit_events (target_table, target_id, created_at DESC);

GRANT SELECT ON public.admin_audit_events TO authenticated;
GRANT ALL ON public.admin_audit_events TO service_role;
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit events"
  ON public.admin_audit_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

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

REVOKE EXECUTE ON FUNCTION public.audit_guide_verification_review() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guide_verifications_audit_review ON public.guide_verifications;
CREATE TRIGGER guide_verifications_audit_review
AFTER UPDATE OF status, review_note ON public.guide_verifications
FOR EACH ROW
EXECUTE FUNCTION public.audit_guide_verification_review();

ALTER TABLE public.guide_verifications
  ADD CONSTRAINT guide_verifications_name_len CHECK (char_length(full_name) BETWEEN 2 AND 80),
  ADD CONSTRAINT guide_verifications_id_len CHECK (guide_id_number ~ '^[A-Za-z0-9-]{4,32}$'),
  ADD CONSTRAINT guide_verifications_place_len CHECK (char_length(place) BETWEEN 2 AND 80),
  ADD CONSTRAINT guide_verifications_phone_len CHECK (phone ~ '^\+?[0-9 ()-]{7,20}$');

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_max_stay CHECK (nights <= 30);
