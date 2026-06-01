"use client";

import { useState } from "react";
import { experiences } from "@/lib/data";
import { HomeFeed } from "@/components/views/HomeFeed";
import { BookingModal } from "@/components/modals/BookingModal";

export default function Index() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(experiences[0]);

  return (
    <div className="relative">
      <HomeFeed
        onBook={(experience) => {
          setSelectedExperience(experience);
          setBookingOpen(true);
        }}
      />
      {bookingOpen && (
        <BookingModal experience={selectedExperience} onClose={() => setBookingOpen(false)} />
      )}
    </div>
  );
}
