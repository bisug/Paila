-- Guide discovery: /guides and /guides/[guideId] read other users' rows, but
-- RLS (own-rows + admin) meant the listing was permanently empty and every
-- non-mock guide page rendered "Guide not found". Allow reading approved rows.
CREATE POLICY "Anyone signed in can view approved guides"
  ON public.guide_verifications FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Booking cancellation: owner only, only while still pending.
GRANT UPDATE ON public.bookings TO authenticated;

CREATE POLICY "Users cancel own pending bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);