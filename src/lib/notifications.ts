// Cross-component signal for the unread badge in the app shell. The
// notifications page writes the badge's data, so it announces changes here
// instead of the shell polling for them.
export const NOTIFICATIONS_CHANGED_EVENT = "paila:notifications-changed";

export function announceNotificationsChanged() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
}
