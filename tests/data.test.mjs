import test from "node:test";
import assert from "node:assert/strict";
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
};
const data = await import("./fixtures/legacy-data.js");
const details = { name: "Alex Morgan", email: "alex@example.com" };
test("seeded event capacities, registrations and booking totals agree", () => {
  data.resetState();
  const s = data.stats();
  assert.deepEqual(s, {
    events: 4,
    capacity: 900,
    sold: 594,
    left: 306,
    value: 5610,
  });
  assert.equal(data.bookingTotal(data.state.bookings[0]), 50);
  assert.equal(data.quantity(data.state.bookings[0]), 2);
  assert.equal(
    data.state.activity.reduce((a, b) => a + b, 0),
    594,
  );
});
test("mixed ticket reservation persists and updates inventory and summary", () => {
  data.resetState();
  const b = data.makeBooking(
    "summit",
    { general: 2, student: 3, vip: 1 },
    details,
  );
  assert.equal(data.bookingTotal(b), 140);
  assert.equal(data.quantity(b), 6);
  assert.equal(data.stats().left, 300);
  assert.equal(data.stats().sold, 600);
  assert.equal(data.stats().value, 5750);
  assert.equal(data.loadState().bookings[0].id, b.id);
});
test("rejects zero, negative, fractional, excessive and sold-out quantities", () => {
  data.resetState();
  for (const n of [0, -1, 0.5, 11, Infinity, NaN])
    assert.throws(() => data.makeBooking("summit", { general: n }, details));
  const e = data.getEvent("coffee");
  e.tickets[0].sold = e.tickets[0].capacity;
  assert.throws(() => data.makeBooking("coffee", { general: 1 }, details));
});
test("rejects missing events, archived events and invalid attendee details", () => {
  data.resetState();
  assert.throws(() => data.makeBooking("unknown", { general: 1 }, details));
  assert.throws(() => data.makeBooking("speaking", { general: 1 }, details));
  assert.throws(() =>
    data.makeBooking("summit", { general: 1 }, { name: " ", email: "bad" }),
  );
});
test("cancellation releases tickets exactly once and preserves the record", () => {
  data.resetState();
  const b = data.makeBooking("summit", { general: 2 }, details);
  assert.equal(data.cancelBooking(b.id), true);
  assert.equal(data.cancelBooking(b.id), false);
  assert.equal(data.stats().left, 306);
  assert.equal(b.status, "Cancelled");
  assert.equal(
    data.state.bookings.some((x) => x.id === b.id),
    true,
  );
});
test("past bookings cannot be cancelled; different bookings have unique IDs", () => {
  data.resetState();
  assert.equal(data.cancelBooking("SS-20340"), false);
  const a = data.makeBooking("summit", { general: 1 }, details),
    b = data.makeBooking("coffee", { general: 1 }, details);
  assert.notEqual(a.id, b.id);
});
test("storage contains no password or credentials", () => {
  data.resetState();
  data.makeBooking("summit", { student: 1 }, details);
  const saved = storage.get("sessionspot-demo-v2");
  assert.doesNotMatch(saved, /password|credential|secret|token/i);
});
test("invalid stored JSON falls back to clean fixtures", () => {
  storage.set("sessionspot-demo-v2", "{broken");
  assert.equal(data.loadState().events.length, 6);
});

test("booking totals retain booked prices after an event price edit", () => {
  data.resetState();
  const b = data.makeBooking("summit", { general: 2 }, details);
  data.getEvent("summit").tickets[0].price = 99;
  assert.equal(data.bookingTotal(b), 50);
});

test("Figma fixture migration preserves saved events and individual bookings", () => {
  data.resetState();
  const old = structuredClone(data.state);
  delete old.figmaFixture;
  old.events.find((e) => e.id === "summit").tickets[0].sold = 120;
  old.events.find((e) => e.id === "summit").tickets[1].sold = 46;
  old.saved = ["summit"];
  old.profile.name = "Sample customized name";
  storage.set("sessionspot-demo-v2", JSON.stringify(old));
  const migrated = data.loadState();
  assert.deepEqual(migrated.saved, ["summit"]);
  assert.equal(migrated.profile.name, "Sample customized name");
  assert.deepEqual(migrated.bookings, old.bookings);
  assert.equal(
    migrated.events.find((e) => e.id === "summit").tickets[0].sold,
    126,
  );
});
test("fixture migration does not overwrite changed aggregate counts", () => {
  data.resetState();
  const old = structuredClone(data.state);
  delete old.figmaFixture;
  old.events.find((e) => e.id === "summit").tickets[0].sold = 135;
  storage.set("sessionspot-demo-v2", JSON.stringify(old));
  assert.equal(
    data.loadState().events.find((e) => e.id === "summit").tickets[0].sold,
    135,
  );
});
