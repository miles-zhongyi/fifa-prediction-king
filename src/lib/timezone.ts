export const TORONTO_TIME_ZONE = "America/Toronto";

const torontoDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TORONTO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const torontoDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TORONTO_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const torontoTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TORONTO_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const torontoHeadingFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TORONTO_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function getTorontoDateKey(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const parts = torontoDateKeyFormatter.formatToParts(value);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function formatTorontoDateTime(date: string | Date): string {
  return torontoDateTimeFormatter.format(
    typeof date === "string" ? new Date(date) : date,
  );
}

export function formatTorontoKickoffTime(date: string | Date): string {
  return torontoTimeFormatter.format(
    typeof date === "string" ? new Date(date) : date,
  );
}

export function formatTorontoDateHeading(date: string | Date): string {
  return torontoHeadingFormatter.format(
    typeof date === "string" ? new Date(date) : date,
  );
}
