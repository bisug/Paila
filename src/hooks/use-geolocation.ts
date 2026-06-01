import { useState, useEffect, useRef, useCallback } from "react";
import { calculateDistance } from "@/lib/location";

export interface Coordinates {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

const STORAGE_KEY = "travelPath";
const MAX_POINTS = 500;
const MAX_ACCURACY_M = 50;
const MIN_MOVE_KM = 0.01;

export function useGeolocationTracker() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [path, setPath] = useState<Coordinates[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const startWatch = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        const newCoord: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          accuracy,
        };
        setLocation(newCoord);
        setPermissionDenied(false);
        setError(null);

        if (typeof accuracy === "number" && accuracy > MAX_ACCURACY_M) return;

        setPath((prev) => {
          const last = prev[prev.length - 1];
          if (last) {
            const km = calculateDistance(
              { lat: last.lat, lng: last.lng },
              { lat: newCoord.lat, lng: newCoord.lng },
            );
            if (km < MIN_MOVE_KM) return prev;
          }
          const next = [...prev, newCoord].slice(-MAX_POINTS);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            /* quota — ignore */
          }
          return next;
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  }, []);

  const retry = useCallback(() => {
    setError(null);
    // Trigger a one-shot prompt; if user has unblocked, watch will succeed too.
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionDenied(false);
          startWatch();
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
          setError(err.message);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      );
    }
  }, [startWatch]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPath(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved path", e);
      }
    }

    startWatch();

    // Auto-recover when the user toggles permission in browser settings.
    let permStatus: PermissionStatus | null = null;
    const onChange = () => {
      if (permStatus?.state === "granted") {
        setPermissionDenied(false);
        startWatch();
      } else if (permStatus?.state === "denied") {
        setPermissionDenied(true);
      }
    };
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          permStatus = status;
          status.addEventListener("change", onChange);
        })
        .catch(() => {
          /* unsupported — ignore */
        });
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (permStatus) permStatus.removeEventListener("change", onChange);
    };
  }, [startWatch]);

  return { location, path, error, permissionDenied, retry };
}
