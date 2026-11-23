// File contents are built separately from browser download delivery.
import { money } from "./format.js?v=4b3c14e4ea";
import { dateLabel } from "./time.js?v=ca0db7923c";

export function csvText(rows) {
  return rows.map((row) => row.map((value) => {
    const text = String(value ?? "").replace(/^[=+@-]/, "'$&");
    return '"' + text.replace(/"/g, '""') + '"';
  }).join(",")).join("\r\n");
}

export function bookingText(booking, event) {
  const lines = event.tickets.filter((t) => booking.items[t.id]).map((t) => ({
    label: `${booking.ticketNames?.[t.id] ?? t.name} × ${booking.items[t.id]}`,
    total: (booking.prices?.[t.id] ?? t.price) * booking.items[t.id],
  }));
  const date = dateLabel(event.date, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  return `SESSIONSPOT — DEMO CONFIRMATION\nNot a valid event ticket. No email or payment processed.\n\nBooking: ${booking.id}\nEvent: ${event.title}\nDate: ${date}\nTime: ${event.time}\nVenue: ${event.location}\nAttendee: ${booking.name}\nStatus: ${booking.status}\n${lines.map((line) => `${line.label}: ${money(line.total)}`).join("\n")}\nTotal: ${money(lines.reduce((sum, line) => sum + line.total, 0))}\n`;
}
