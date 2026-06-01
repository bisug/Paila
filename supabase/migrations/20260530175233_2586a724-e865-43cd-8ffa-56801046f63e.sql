ALTER TABLE public.profiles ADD COLUMN gender text;
UPDATE public.profiles SET gender = 'male' WHERE gender IS NULL;
ALTER TABLE public.profiles ALTER COLUMN gender SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_check CHECK (gender IN ('male','female'));