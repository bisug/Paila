"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FootprintMap } from "@/components/views/FootprintMap";

function MapPageFallback() {
  return (
    <div className="px-4 py-6 md:px-8" aria-busy="true" aria-label="Loading map">
      <div className="h-[min(70vh,560px)] rounded-card border border-stone-100 bg-stone-200 animate-pulse" />
    </div>
  );
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  return <FootprintMap defaultView={view === "journey" ? "journey" : "pins"} />;
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapPageFallback />}>
      <MapPageContent />
    </Suspense>
  );
}
