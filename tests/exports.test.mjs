import test from "node:test";
import assert from "node:assert/strict";
const { csvText, bookingText } = await import("../js/exports.js");

test("CSV retains commas, quotes, Unicode and line breaks with quoted cells", () => {
  assert.equal(csvText([["name", "notes"], ['Alex, “A”', 'Said "hello"\nNext line']]),
    '"name","notes"\r\n"Alex, “A”","Said ""hello""\nNext line"');
});
test("CSV neutralizes formula-leading cells without discarding their first character", () => {
  assert.equal(csvText([["=1+1", "+123", "-42", "@name"]]),
    '"\'=1+1","\'+123","\'-42","\'@name"');
});
test("CSV supports empty exports and nullable sample fields", () => {
  assert.equal(csvText([]), "");
  assert.equal(csvText([[null, undefined, 0]]), '"","","0"');
});
const event = {
  title: "Test Summit", date: "2026-11-21", time: "9 AM", location: "Sample Hall",
  tickets: [{ id: "general", name: "General", price: 99 }, { id: "student", name: "Student", price: 15 }],
};
const booking = {
  id: "SS-TEST", name: "Sample Attendee", status: "Confirmed",
  items: { general: 2, student: 1 }, prices: { general: 25, student: 15 },
};
test("confirmation includes venue-payment terms, reference, details and booked prices", () => {
  const text = bookingText(booking, event);
  for (const expected of ["Payment due at venue in CAD.", "SS-TEST", "Sample Attendee", "Test Summit", "Sample Hall", "General × 2: $50.00", "Student × 1: $15.00", "Total: $65.00", "Status: Confirmed"])
    assert.ok(text.includes(expected), expected);
  assert.ok(!text.includes("$198.00"));
});
test("cancelled and free confirmations preserve their truthful status and total", () => {
  const text = bookingText({ ...booking, status: "Cancelled", items: { student: 1 }, prices: { student: 0 } }, event);
  assert.ok(text.includes("Status: Cancelled"));
  assert.ok(text.includes("Total: $0.00"));
});
