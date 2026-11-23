export const TIME_ZONE = "America/Vancouver";
let clock = () => Date.now();
export const now = () => Number(clock());
// Tests can advance time without changing any production dates or page styles.
export function setClock(source = () => Date.now()) { clock = source; }
const dateParts = (epoch) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
}).formatToParts(new Date(epoch)).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
export function localDate(epoch = now()) {
  const p = dateParts(epoch); return `${p.year}-${p.month}-${p.day}`;
}
export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value && value >= "1900-01-01";
}
export function shiftDate(value, days) {
  if (!validDate(value) || !Number.isInteger(days)) throw Error("Choose a valid calendar date.");
  const d = new Date(value + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
function minutes(value) {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) throw Error("Use a start and end time such as 9:00 AM – 5:00 PM.");
  let h = Number(m[1]), min = Number(m[2]);
  if (min > 59 || (m[3] ? h < 1 || h > 12 : h > 23)) throw Error("Choose valid event times.");
  if (m[3]) h = h % 12 + (m[3].toUpperCase() === "PM" ? 12 : 0);
  return h * 60 + min;
}
export function timeRange(value) {
  if (typeof value !== "string") throw Error("Enter starting and ending times.");
  const parts = value.split(/\s*[–—-]\s*/);
  if (parts.length !== 2) throw Error("Enter starting and ending times.");
  const start = minutes(parts[0]), end = minutes(parts[1]);
  if (end <= start) throw Error("The event end time must be later than its start time.");
  return { start, end };
}
export function zonedEpoch(date, minuteOfDay) {
  if (!validDate(date)) throw Error("Choose a valid calendar date.");
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day, Math.floor(minuteOfDay / 60), minuteOfDay % 60);
  let guess = target;
  for (let i = 0; i < 4; i++) {
    const p = dateParts(guess);
    const represented = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
    guess += target - represented;
  }
  const p = dateParts(guess);
  if (`${p.year}-${p.month}-${p.day}` !== date || Number(p.hour) * 60 + Number(p.minute) !== minuteOfDay)
    throw Error("This local time does not exist in the Vancouver timezone. Choose another time.");
  return guess;
}
export function eventWindow(event, anchor) {
  const range = timeRange(event.time);
  // Reference-only fixtures retain their approved displayed dates. Their real
  // eligibility advances from a persisted local anchor; user events use dates
  // entered in the form and the real Vancouver clock.
  const date = event.referenceSchedule && event.date === event.referenceSchedule.date && event.time === event.referenceSchedule.time
    ? shiftDate(anchor, event.referenceSchedule.days) : event.date;
  return { start: zonedEpoch(date, range.start), end: zonedEpoch(date, range.end) };
}
export function dateLabel(date, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!validDate(date)) return "Invalid date";
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-CA", { ...options, timeZone: "UTC" });
}
