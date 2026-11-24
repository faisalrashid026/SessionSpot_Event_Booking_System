import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
const storage = new Map();
let failWrite = false, failRead = false;
globalThis.localStorage = {
  getItem: (key) => { if (failRead) throw Error("denied"); return storage.get(key) ?? null; },
  setItem: (key, value) => { if (failWrite) throw Error("QuotaExceededError"); storage.set(key, value); },
};
const data = await import("./fixtures/legacy-data.js");
const validation = await import("../js/validation.js");
const time = await import("../js/time.js");
const { bookingText } = await import("../js/exports.js");
const person = { name: "Alex Morgan", email: "alex@example.com" };
const password = "DemoPass123";
const fixedNow = Date.parse("2026-11-23T20:00:00Z");
const snapshot = () => JSON.stringify(data.state);
const stored = () => storage.get("sessionspot-demo-v2");
const organizer = () => data.loginDemo("priya@example.com", password);
const admin = () => data.loginDemo("sam@example.com", password);
const input = () => ({ title: "A sample workshop", description: "A practical sample workshop for the community.", category: "Education", organizer: "SessionSpot", location: "Sample Hall", date: "2026-11-24", time: "9:00 AM – 5:00 PM", status: "Published", tickets: [{ id: "general", name: "General admission", price: 10, capacity: 50, description: "Workshop access" }] });
beforeEach(() => { failWrite = false; failRead = false; data.setClock(() => fixedNow); data.resetState(); });

test("search includes location, venue, descriptions, titles and organizer with normalized whitespace/case", () => {
  const e = { title: "A New Start", description: "Learn together", organizer: "River Club", location: "City Convention Center", venue: "North Wing" };
  for (const query of ["  CITY   convention ", "NORTH WING", "learn TOGETHER", "a new start", "river club", "   "])
    assert.ok(validation.matchesEvent(e, query), query);
  assert.equal(validation.matchesEvent(e, "unrelated"), false);
});
test("unknown ticket categories are rejected even alongside valid categories, without mutation", () => {
  const before = snapshot(), durable = stored();
  for (const items of [{ other: 1 }, { general: 1, foreign: 0 }, { general: 1, foreign: 2 }]) assert.throws(() => data.makeBooking("summit", items, person));
  assert.equal(snapshot(), before); assert.equal(stored(), durable);
});
test("invalid typed quantities and empty request shapes leave inventory and records untouched", () => {
  const before = snapshot();
  for (const items of [null, [], {}, { general: "" }, { general: true }, { general: "1.5" }, { general: -2 }, { general: 0 }, { general: NaN }]) assert.throws(() => data.makeBooking("summit", items, person));
  assert.equal(snapshot(), before);
});
test("mixed bookings cannot exceed any one category's remaining inventory", () => {
  data.getEvent("summit").tickets[1].sold = 79;
  const before = snapshot();
  assert.throws(() => data.makeBooking("summit", { general: 2, student: 2 }, person));
  assert.equal(snapshot(), before);
});
test("draft, archived, started and entirely sold-out events reject reservations", () => {
  const e = data.getEvent("summit");
  for (const status of ["Draft", "Archived"]) { e.status = status; assert.throws(() => data.makeBooking(e.id, { general: 1 }, person)); }
  e.status = "Published"; e.tickets.forEach((t) => { t.sold = t.capacity; });
  assert.throws(() => data.makeBooking(e.id, { general: 1 }, person));
  data.resetState(); data.setClock(() => fixedNow + 13 * 86400000);
  assert.throws(() => data.makeBooking("summit", { general: 1 }, person));
});
test("same pending submission is idempotent and preserves a single reference and allocation", () => {
  const a = data.makeBooking("summit", { general: 2, student: 1 }, person, "stable-submission");
  const before = snapshot();
  const b = data.makeBooking("summit", { general: 2, student: 1 }, { name: " Alex  Morgan ", email: " ALEX@EXAMPLE.COM " }, "stable-submission");
  assert.equal(a.id, b.id); assert.equal(a, b); assert.equal(snapshot(), before); assert.equal(data.stats().sold, 597);
});
test("idempotency survives persistence/reload and rejects a different payload under the same identifier", () => {
  const b = data.makeBooking("summit", { general: 1 }, person, "persisted-request");
  assert.equal(data.loadState().bookings.find((x) => x.submissionId === "persisted-request").id, b.id);
  const before = snapshot();
  assert.throws(() => data.makeBooking("summit", { general: 2 }, person, "persisted-request"), /already saved/);
  assert.equal(snapshot(), before);
});
test("an idempotent replay after cancellation does not reserve tickets again", () => {
  const b = data.makeBooking("summit", { general: 2 }, person, "cancelled-request");
  data.cancelBooking(b.id);
  assert.equal(data.makeBooking("summit", { general: 2 }, person, "cancelled-request").status, "Cancelled");
  assert.equal(data.stats().sold, 594);
});
test("mixed cancellation restores every category once and retains snapshots and history", () => {
  const before = data.getEvent("summit").tickets.map((t) => t.sold);
  const b = data.makeBooking("summit", { general: 2, student: 3, vip: 1 }, person);
  const historical = JSON.stringify([b.id, b.items, b.prices, b.ticketNames]);
  assert.equal(data.cancelBooking(b.id), true); assert.equal(data.cancelBooking(b.id), false);
  assert.deepEqual(data.getEvent("summit").tickets.map((t) => t.sold), before);
  assert.equal(JSON.stringify([b.id, b.items, b.prices, b.ticketNames]), historical);
  assert.equal(data.loadState().bookings.find((x) => x.id === b.id).status, "Cancelled");
});
test("quota failure rolls back booking creation and inventory, permitting a retry with the same request", () => {
  const before = snapshot(), durable = stored(); failWrite = true;
  assert.throws(() => data.makeBooking("summit", { general: 2, vip: 1 }, person, "retry-request"), /storage/);
  assert.equal(snapshot(), before); assert.equal(stored(), durable);
  failWrite = false;
  assert.equal(data.makeBooking("summit", { general: 2, vip: 1 }, person, "retry-request").status, "Confirmed");
  assert.equal(data.state.bookings.length, 5);
});
test("denied storage cannot confirm reservations or partially update the in-memory state", () => {
  const before = snapshot(); failRead = failWrite = true;
  assert.throws(() => data.makeBooking("summit", { general: 1 }, person), /storage/);
  assert.equal(snapshot(), before); assert.equal(data.loadState().events.length, 6);
});
test("failed cancellation leaves booking status, inventory, prices and durable data unchanged", () => {
  const b = data.makeBooking("summit", { general: 2 }, person), before = snapshot(), durable = stored();
  failWrite = true; assert.throws(() => data.cancelBooking(b.id), /storage/);
  assert.equal(b.status, "Confirmed"); assert.equal(snapshot(), before); assert.equal(stored(), durable);
});
test("failed profile and role writes roll back all related identity fields", () => {
  const before = snapshot(); failWrite = true;
  assert.throws(() => data.updateProfile({ name: "Changed Person", email: "changed@example.com" }), /storage/);
  assert.equal(snapshot(), before);
  failWrite = false; admin(); const adminBefore = snapshot(); failWrite = true;
  assert.throws(() => data.changeRole("alex", "Organizer"), /storage/); assert.equal(snapshot(), adminBefore);
});
test("legacy saveState also restores its last committed snapshot after a failed write", () => {
  const before = snapshot(); data.state.profile.name = "Unsaved Person"; failWrite = true;
  assert.throws(() => data.saveState(), /storage/); assert.equal(snapshot(), before);
});
test("attendee action handlers cannot create/edit/archive/export/administer events or users", () => {
  const before = snapshot();
  for (const action of [() => data.saveEvent(null, input()), () => data.saveEvent("summit", { ...data.getEvent("summit") }), () => data.changeEventStatus("summit", "Archived"), () => data.requireExport("summit"), () => data.changeRole("alex", "Admin"), () => data.removeUser("priya")]) assert.throws(action);
  assert.equal(snapshot(), before);
});
test("organizers can mutate and export only associated events and attendees", () => {
  admin(); const other = data.saveEvent(null, input()); organizer(); const before = snapshot();
  assert.throws(() => data.saveEvent(other.id, { ...other, title: "Hijacked workshop" }));
  assert.throws(() => data.changeEventStatus(other.id, "Archived")); assert.throws(() => data.requireExport(other.id));
  assert.equal(snapshot(), before); assert.ok(!data.managementEvents().some((e) => e.id === other.id));
  assert.doesNotThrow(() => data.requireExport("summit"));
});
test("organizer previews and archived lifecycle states cannot bypass public booking rules", () => {
  organizer(); const draft = data.saveEvent(null, { ...input(), status: "Draft" });
  assert.ok(data.managementEvents().some((e) => e.id === draft.id)); assert.equal(data.isPublished(draft), false);
  assert.throws(() => data.makeBooking(draft.id, { general: 1 }, person));
  data.changeEventStatus(draft.id, "Archived"); data.changeEventStatus(draft.id, "Restore"); assert.equal(draft.status, "Draft");
  data.saveEvent(draft.id, { ...draft, status: "Published" }); assert.equal(data.isBookable(draft), true);
  data.changeEventStatus(draft.id, "Archived"); assert.equal(data.isBookable(draft), false);
  data.changeEventStatus(draft.id, "Restore"); assert.equal(data.isBookable(draft), true);
});
test("registration organizer interest never grants organizer/admin privileges", () => {
  const u = data.registerDemo({ name: "New Person", email: " NEW@EXAMPLE.COM " }, password, password, "Organizer", true);
  assert.equal(u.role, "Attendee"); assert.equal(u.email, "new@example.com");
  assert.throws(() => data.saveEvent(null, input())); assert.throws(() => data.changeRole(u.id, "Admin"));
});
test("admin role changes affect subsequent action checks and preserve at least one administrator", () => {
  admin(); data.changeRole("priya", "Attendee"); data.loginDemo("priya@example.com", password);
  assert.throws(() => data.saveEvent(null, input())); admin();
  assert.throws(() => data.changeRole("sam", "Attendee")); assert.throws(() => data.removeUser("sam"));
  data.removeUser("alex"); assert.throws(() => data.loginDemo("alex@example.com", password));
});
test("another attendee cannot read/cancel a booking, while its associated organizer can cancel it", () => {
  const booking = data.state.bookings.find((b) => b.id === "SS-20512");
  data.registerDemo({ name: "Other Person", email: "other@example.com" }, password, password, "Attendee", true);
  assert.equal(data.canViewBooking(booking), false); assert.throws(() => data.cancelBooking(booking.id));
  organizer(); assert.equal(data.canViewBooking(booking), true); assert.equal(data.cancelBooking(booking.id), true);
});
test("capacity floor includes seeded aggregate allocations, not only the small booking list", () => {
  organizer(); const event = data.getEvent("summit"), fields = structuredClone(event), before = snapshot();
  fields.tickets[0].capacity = 125;
  assert.throws(() => data.saveEvent(event.id, fields), /Capacity/); assert.equal(snapshot(), before);
  fields.tickets[0].capacity = 200; data.saveEvent(event.id, fields);
  assert.equal(data.available(event.tickets[0]), 74); assert.equal(event.tickets[0].sold, 126);
  assert.equal(data.state.bookings.length, 4);
});
test("event editing preserves identities and rejects duplicate category names, IDs and removals", () => {
  organizer(); const event = data.getEvent("summit"), before = snapshot();
  let fields = structuredClone(event); fields.tickets[1].name = "  GENERAL   ADMISSION "; assert.throws(() => data.saveEvent(event.id, fields), /distinct/);
  fields = structuredClone(event); fields.tickets[1].id = "general"; assert.throws(() => data.saveEvent(event.id, fields), /identities/);
  fields = structuredClone(event); fields.tickets.pop(); assert.throws(() => data.saveEvent(event.id, fields), /removed/);
  assert.equal(snapshot(), before);
});
test("five ticket categories remain supported and a sixth is rejected without mutation", () => {
  organizer(); const fields = input(); fields.tickets = Array.from({ length: 5 }, (_, i) => ({ id: `ticket-${i}`, name: `Category ${i}`, price: i, capacity: 10 }));
  const event = data.saveEvent(null, fields); assert.equal(event.tickets.length, 5);
  fields.tickets.push({ id: "sixth", name: "Sixth category", price: 0, capacity: 10 }); const before = snapshot();
  assert.throws(() => data.saveEvent(event.id, fields), /five/); assert.equal(snapshot(), before);
});
test("edited ticket prices/names never rewrite historical booking prices/names or totals", () => {
  const booking = data.makeBooking("summit", { general: 2 }, person); organizer();
  const fields = structuredClone(data.getEvent("summit")); fields.tickets[0].price = 99; fields.tickets[0].name = "Renamed category";
  data.saveEvent("summit", fields);
  assert.equal(data.bookingTotal(booking), 50); assert.equal(data.stats().value, 5660);
  const text = bookingText(booking, data.getEvent("summit")); assert.ok(text.includes("General admission × 2: $50.00"));
  assert.equal(data.cancelBooking(booking.id), true); assert.equal(data.stats().value, 5610);
});
test("event edits cannot change a reserved event into a draft or alter another owner's association", () => {
  organizer(); const e = data.getEvent("summit"), before = snapshot();
  assert.throws(() => data.saveEvent(e.id, { ...e, status: "Draft" }), /allocated/);
  assert.equal(snapshot(), before);
  const result = data.saveEvent(e.id, { ...e, ownerId: "alex" }); assert.equal(result.ownerId, "priya");
});
test("failed event save/status writes leave records, aggregate inventory and bookings intact", () => {
  organizer(); const before = snapshot(); failWrite = true;
  assert.throws(() => data.saveEvent("summit", { ...data.getEvent("summit"), title: "Changed summit title" }), /storage/);
  assert.throws(() => data.changeEventStatus("summit", "Archived"), /storage/); assert.equal(snapshot(), before);
});
test("name/email validation normalizes valid values and rejects invalid profiles without losing values", () => {
  assert.deepEqual(validation.accountDetails({ name: "  Zoë   O’Neil ", email: " ZOE+DEMO@EXAMPLE.COM " }), { name: "Zoë O’Neil", email: "zoe+demo@example.com" });
  const before = snapshot();
  for (const details of [{ name: " ", email: "a@example.com" }, { name: "A", email: "a@example.com" }, { name: "Name <script>", email: "a@example.com" }, { name: "A Person", email: "bad..mail@example.com" }, { name: "A Person", email: "bad@-example.com" }]) assert.throws(() => data.updateProfile(details));
  assert.equal(snapshot(), before);
});
test("profile updates cannot claim another identity's email or role", () => {
  assert.throws(() => data.updateProfile({ name: "Alex Morgan", email: "sam@example.com" }));
  data.updateProfile({ name: "Alex  Updated", email: " UPDATED@EXAMPLE.COM ", role: "Admin" });
  assert.equal(data.state.profile.email, "updated@example.com"); assert.equal(data.currentUser().role, "Attendee");
  assert.equal(data.currentUser().name, "Alex Updated"); assert.deepEqual(data.loadState().profile, data.state.profile);
});
test("one 8–72 character and digit password policy applies consistently and passwords are never persisted", () => {
  for (const value of ["tiny1", "NoNumbersHere", "A".repeat(73) + "1", "Demo\nPass123"]) assert.throws(() => validation.checkPassword(value));
  assert.throws(() => validation.checkPassword(password, "Mismatch123"));
  assert.equal(validation.checkPassword("A".repeat(71) + "1"), true);
  data.registerDemo({ name: "Safe Person", email: "safe@example.com" }, password, password, "Attendee", true);
  assert.ok(!stored().includes(password)); assert.doesNotMatch(stored(), /"password"|"confirm"|"credential"/i);
});
test("calendar validation rejects impossible dates and validates leap years", () => {
  for (const d of ["2026-02-29", "2026-04-31", "2026-13-01", "2026-01-00", "2026-1-2", "bad"]) assert.equal(time.validDate(d), false, d);
  assert.equal(time.validDate("2028-02-29"), true);
  organizer(); assert.throws(() => data.saveEvent(null, { ...input(), date: "2026-02-30" }), /calendar/);
});
test("time parsing rejects invalid/reversed ranges and supports existing 12-hour and 24-hour appearance", () => {
  for (const value of ["25:00 – 26:00", "9:70 AM – 10:00 AM", "5:00 PM – 9:00 AM", "9:00 AM – 9:00 AM", "no time"]) assert.throws(() => time.timeRange(value));
  assert.deepEqual(time.timeRange("09:00-17:00"), { start: 540, end: 1020 });
  assert.deepEqual(time.timeRange("9:00 AM – 5:00 PM"), { start: 540, end: 1020 });
});
test("published user events use the real Vancouver start time and stop accepting at their start", () => {
  organizer(); const before = snapshot();
  assert.throws(() => data.saveEvent(null, { ...input(), date: "2026-11-23", time: "11:00 AM – 1:00 PM" }), /future/);
  assert.equal(snapshot(), before);
  const event = data.saveEvent(null, { ...input(), date: "2026-11-23", time: "1:00 PM – 3:00 PM" }); assert.ok(data.isBookable(event));
  data.setClock(() => Date.parse("2026-11-23T21:00:00Z")); assert.equal(data.isBookable(event), false);
  assert.throws(() => data.makeBooking(event.id, { general: 1 }, person));
});
test("future/past drafts remain manageable, but publishing a past draft is rejected", () => {
  organizer(); const event = data.saveEvent(null, { ...input(), date: "2026-11-20", status: "Draft" });
  assert.equal(event.status, "Draft"); assert.throws(() => data.changeEventStatus(event.id, "Published"), /started/);
});
test("Vancouver local dates and daylight-saving gaps are handled without host-timezone dependence", () => {
  assert.equal(time.localDate(Date.parse("2026-11-24T07:59:00Z")), "2026-11-23");
  assert.equal(time.localDate(Date.parse("2026-11-24T08:00:00Z")), "2026-11-24");
  assert.throws(() => time.zonedEpoch("2027-03-14", 150), /does not exist/);
  assert.equal(new Date(time.zonedEpoch("2026-11-24", 540)).toISOString(), "2026-11-24T17:00:00.000Z");
});
test("reference fixtures retain approved displayed dates but eligibility expires against their persisted relative anchor", () => {
  const event = data.getEvent("career"); assert.equal(event.date, "2026-11-18"); assert.equal(data.daysUntil(event), 8);
  const anchor = data.state.fixtureAnchor; data.setClock(() => fixedNow + 13 * 86400000);
  assert.equal(data.isPublished(event), false); assert.equal(data.loadState().fixtureAnchor, anchor);
});
test("forged reference schedules on new records cannot bypass past-date publishing rules", () => {
  organizer(); assert.throws(() => data.saveEvent(null, { ...input(), date: "2026-11-01", referenceSchedule: { date: "2026-11-01", time: input().time, days: 100 } }), /future/);
});
test("logical event ordering is chronological across reference and user-created schedules", () => {
  organizer(); const e = data.saveEvent(null, input());
  const events = data.state.events.filter((v) => data.isPublished(v)).sort(data.compareEvents);
  assert.equal(events[0].id, e.id); assert.deepEqual(events.slice(1).map((v) => v.id), ["career", "coffee", "summit", "market"]);
});

test("inactive identity emails cannot be claimed through profile edits", () => {
  admin(); data.removeUser("priya"); data.loginDemo("alex@example.com", password);
  const before = snapshot();
  assert.throws(() => data.updateProfile({ name: "Alex Morgan", email: "priya@example.com" }), /another sample user/);
  assert.equal(snapshot(), before);
});
test("only confirmed allocations can be cancelled", () => {
  const b = data.state.bookings[0]; b.status = "Pending";
  const before = snapshot(); assert.equal(data.cancelBooking(b.id), false); assert.equal(snapshot(), before);
});

test("administrator permissions still reject nonexistent event targets", () => {
  admin(); assert.equal(data.canManage(undefined), false);
  assert.throws(() => data.requireExport("missing-event"));
});
