export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType = "weather" | "trail" | "closure" | "health";

export type LocalAlert = {
  id: number;
  type: AlertType;
  severity: AlertSeverity;
  location: string;
  message: string;
};

export const LOCAL_ALERTS: LocalAlert[] = [
  {
    id: 1,
    type: "weather",
    severity: "info",
    location: "Langtang",
    message: "Clear skies expected for the next 48 hours in Langtang valley.",
  },
  {
    id: 2,
    type: "trail",
    severity: "warning",
    location: "Syabrubesi",
    message: "Minor trail washout reported 2km past Syabrubesi. Proceed with caution.",
  },
];
