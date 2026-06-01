import type { Libraries } from "@react-google-maps/api";

// Stable, module-scoped reference shared by every useJsApiLoader call in the app.
// @react-google-maps/api uses a singleton loader — all callers must pass identical options.
const LIBRARIES: Libraries = ["geometry"];

export const GOOGLE_MAPS_LOADER_OPTIONS = {
  id: "google-map-script",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  libraries: LIBRARIES,
} as const;
