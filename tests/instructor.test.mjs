import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
const storage = new Map(); let failWrite = false;
globalThis.localStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => { if (failWrite) throw Error("quota"); storage.set(k, v); } };
const data = await import("../js/data.js");
const { validatePoster, readPoster, MAX_POSTER_BYTES } = await import("../js/poster.js");
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7XQAAAAASUVORK5CYII=";
const password = "DemoPass123", person = { name: "Instructor Attendee", email: "instructor@example.com" };
const input = () => ({ title: "Instructor Workshop", description: "A practical community workshop for instructor testing.", category: "Education", organizer: "SessionSpot", location: "Campus Hall", date: "2026-11-24", time: "10:00 AM – 12:00 PM", status: "Draft", posterImage: png, tickets: [{ id: "general", name: "General admission", price: 12.50, capacity: 8 }, { id: "free", name: "Free student ticket", price: 0, capacity: 4 }] });
const organizer = () => data.loginDemo("priya@example.com", password);
beforeEach(() => { failWrite = false; data.setClock(() => Date.parse("2026-11-23T20:00:00Z")); data.resetState(); });

test("optional poster survives save/reload/edit, and explicit removal restores default artwork", () => {
  organizer(); const e = data.saveEvent(null, input());
  assert.equal(data.loadState().events.find((x) => x.id === e.id).posterImage, png);
  const fields = { ...input(), title: "Updated Instructor Workshop" }; delete fields.posterImage;
  data.saveEvent(e.id, fields); assert.equal(e.posterImage, png);
  data.saveEvent(e.id, { ...fields, posterImage: null }); assert.equal(e.posterImage, null);
  assert.equal(e.tickets[0].price, 12.50); assert.equal(e.tickets[1].price, 0);
});
test("poster input rejects external URLs, SVG, invalid base64, format mismatches and oversized data atomically", () => {
  organizer(); const before = JSON.stringify(data.state);
  for (const value of ["https://example.com/poster.png", "data:image/svg+xml;base64,PHN2Zz4=", "data:image/png;base64,abc!", "data:image/jpeg;base64,aGVsbG8=", png.replace("image/png", "image/webp"), "data:image/png;base64," + "A".repeat(Math.ceil(MAX_POSTER_BYTES / 3) * 4 + 4)])
    assert.throws(() => data.saveEvent(null, { ...input(), posterImage: value }));
  assert.equal(JSON.stringify(data.state), before); assert.equal(validatePoster(null), null);
});
test("poster changes still require the associated organizer or sample admin", () => {
  assert.throws(() => data.saveEvent("summit", { ...data.getEvent("summit"), posterImage: png }), /authorized/);
  organizer(); const e = data.saveEvent(null, input());
  data.loginDemo("sam@example.com", password); data.changeRole("alex", "Organizer");
  data.loginDemo("alex@example.com", password);
  assert.throws(() => data.saveEvent(e.id, { ...e, posterImage: null }), /associated/);
  assert.equal(e.posterImage, png);
});
test("poster storage failure rolls back event metadata and artwork together", () => {
  organizer(); const e = data.saveEvent(null, input()), before = JSON.stringify(data.state), durable = storage.get("sessionspot-demo-v2"); failWrite = true;
  assert.throws(() => data.saveEvent(e.id, { ...e, title: "Unsaved poster change", posterImage: null }), /storage/);
  assert.equal(JSON.stringify(data.state), before); assert.equal(storage.get("sessionspot-demo-v2"), durable);
});
test("browser image reader rejects unsupported or oversized files before decoding", async () => {
  for (const file of [null, { type: "image/svg+xml", size: 20 }, { type: "image/png", size: MAX_POSTER_BYTES + 1 }])
    await assert.rejects(readPoster(file), /PNG, JPEG or WebP/);
});
test("complete instructor lifecycle supports registered identities, admin approval, draft publication and mixed-price cancellation", () => {
  const registered = data.registerDemo(person, password, password, "Organizer", true);
  assert.equal(registered.role, "Attendee"); assert.throws(() => data.saveEvent(null, input()), /authorized/);
  data.loginDemo("sam@example.com", password); data.changeRole(registered.id, "Organizer");
  assert.equal(data.loginDemo(person.email, password).role, "Organizer");
  const e = data.saveEvent(null, input()); assert.equal(e.ownerId, registered.id); assert.equal(data.isBookable(e), false);
  data.changeEventStatus(e.id, "Published"); assert.equal(data.isBookable(e), true);
  data.loginDemo("alex@example.com", password);
  const b = data.makeBooking(e.id, { general: 2, free: 1 }, { name: "Alex Morgan", email: "alex@example.com" });
  assert.equal(data.bookingTotal(b), 25); assert.ok(data.visibleBookings().some((x) => x.id === b.id));
  assert.deepEqual(e.tickets.map(data.available), [6, 3]); data.cancelBooking(b.id);
  assert.equal(b.status, "Cancelled"); assert.deepEqual(e.tickets.map(data.available), [8, 4]);
  assert.equal(data.loadState().bookings.find((x) => x.id === b.id).status, "Cancelled");
});
