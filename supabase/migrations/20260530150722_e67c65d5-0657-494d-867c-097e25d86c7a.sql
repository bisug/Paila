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

CREATE INDEX checkpoints_user_id_idx ON public.checkpoints(user_id);
CREATE UNIQUE INDEX checkpoints_user_place_uniq ON public.checkpoints(user_id, place_id) WHERE place_id IS NOT NULL;

GRANT SELECT, INSERT, DELETE ON public.checkpoints TO authenticated;
GRANT ALL ON public.checkpoints TO service_role;

ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own checkpoints" ON public.checkpoints
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own checkpoints" ON public.checkpoints
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own checkpoints" ON public.checkpoints
  FOR DELETE TO authenticated USING (auth.uid() = user_id);