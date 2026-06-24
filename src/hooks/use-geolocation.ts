import { useState, useEffect, useCallback } from "react";
import { calculateDistance } from "@/lib/location";

export interface Coordinates {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

const DEMO_LOCATION: Coordinates = {
  lat: 28.2096, // Pokhara Lakeside
  lng: 83.9586,
  timestamp: Date.now(),
  accuracy: 10,
};

export function useGeolocationTracker() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [path, setPath] = useState<Coordinates[]>([DEMO_LOCATION]);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startWatch = useCallback(() => {
    // Demo Mode: always set location immediately without prompting the browser
    setLocation(DEMO_LOCATION);
    setPermissionDenied(false);
    setError(null);
  }, []);

  const retry = useCallback(() => {
    startWatch();
  }, [startWatch]);

  useEffect(() => {
    startWatch();
  }, [startWatch]);

  return { location, path, error, permissionDenied, retry };
}
