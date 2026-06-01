-- Add hotel bookings. Earlier migrations create profiles, guide verification,
-- admin settings, notifications, and shared triggers.

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

CREATE POLICY "Users view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE TRIGGER bookings_touch_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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

REVOKE EXECUTE ON FUNCTION public.notify_booking_confirmed() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER bookings_notify_confirmed
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_confirmed();
