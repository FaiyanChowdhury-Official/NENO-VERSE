/** Stable per-browser device id used for the account-sharing limit. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server-render";
  const k = "octopus-device-id";
  let id = localStorage.getItem(k);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(k, id); }
  return id;
}
