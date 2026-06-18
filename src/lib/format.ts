// Display helpers for dates and market/bet labels.

// Kickoffs are stored as UTC instants but always shown in IST (Asia/Kolkata),
// so every viewer sees the same official Indian Standard Time regardless of
// their own locale/timezone.
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

export function formatKickoff(d: Date): string {
  return `${dateTimeFmt.format(d)} IST`;
}

/** For <input type="datetime-local"> default values (local time, no seconds). */
export function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function matchStatusLabel(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "Open";
    case "LOCKED":
      return "Locked";
    case "SETTLED":
      return "Settled";
    default:
      return status;
  }
}

export function relativeToNow(d: Date, now = new Date()): string {
  const ms = d.getTime() - now.getTime();
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  let text: string;
  if (mins < 60) text = `${mins}m`;
  else if (hrs < 48) text = `${hrs}h`;
  else text = `${days}d`;
  return ms >= 0 ? `in ${text}` : `${text} ago`;
}
