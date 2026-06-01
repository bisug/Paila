"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FootprintMap } from "@/components/views/FootprintMap";

function MapPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  return <FootprintMap defaultView={view === "journey" ? "journey" : "pins"} />;
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageContent />
    </Suspense>
  );
}
