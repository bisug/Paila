-- Guide verification submissions
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

CREATE TRIGGER guide_verifications_touch_updated_at
BEFORE UPDATE ON public.guide_verifications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Private storage bucket for ID card images
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