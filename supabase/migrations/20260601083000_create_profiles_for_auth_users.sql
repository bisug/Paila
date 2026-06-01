ALTER TABLE public.profiles
  ALTER COLUMN account_type SET DEFAULT 'traveller';

UPDATE public.profiles
SET
  full_name = nullif(btrim(full_name), ''),
  first_name = nullif(btrim(first_name), ''),
  last_name = nullif(btrim(last_name), '');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_len
  CHECK (full_name IS NULL OR char_length(full_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT profiles_first_name_len
  CHECK (first_name IS NULL OR char_length(first_name) BETWEEN 1 AND 50),
  ADD CONSTRAINT profiles_last_name_len
  CHECK (last_name IS NULL OR char_length(last_name) BETWEEN 1 AND 50);

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

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user_profile();
