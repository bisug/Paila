import { useState, useEffect, useCallback, useRef } from "react";

export interface Coordinates {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

export function useGeolocationTracker() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [path, setPath] = useState<Coordinates[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const watchId = useRef<number | null>(null);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setError(null);
    setPermissionDenied(false);
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const nextLocation = {
          lat: coords.latitude,
          lng: coords.longitude,
          timestamp: Date.now(),
          accuracy: coords.accuracy,
        };
        setLocation(nextLocation);
        setPath((current) => [...current, nextLocation]);
      },
      (positionError) => {
        setError(positionError.message);
        setPermissionDenied(positionError.code === GeolocationPositionError.PERMISSION_DENIED);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
  }, []);

  const retry = useCallback(() => {
    startWatch();
  }, [startWatch]);

  useEffect(() => {
    startWatch();
    return () => {
      if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    };
  }, [startWatch]);

  const simulateLocation = useCallback((lat: number, lng: number) => {
    const newLoc = { lat, lng, timestamp: Date.now(), accuracy: 10 };
    setLocation(newLoc);
    setPath((p) => [...p, newLoc]);
  }, []);

  return { location, path, error, permissionDenied, retry, simulateLocation };
}
