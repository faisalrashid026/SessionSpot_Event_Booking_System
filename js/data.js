// Non-sensitive fixtures only. This is a browser-local Part 2 prototype.
import { validatePoster } from "./poster.js?v=8e5d6a42e6";
import { accountDetails, checkPassword, cleanText, emailAddress } from "./validation.js?v=cc8bacc99c";
import { now, localDate, validDate, eventWindow, dateLabel } from "./time.js?v=ca0db7923c";
export { dateLabel } from "./time.js?v=ca0db7923c";
import { money } from "./format.js?v=4b3c14e4ea";
export { money } from "./format.js?v=4b3c14e4ea";
export { setClock } from "./time.js?v=ca0db7923c";
const ticket = (id, name, price, capacity, sold, description) => ({
  id,
  name,
  price,
  capacity,
  sold,
  description,
});
export const seedEvents = [
  {
    id: "summit",
    title: "Innovation Summit ’26",
    category: "Community",
    organizer: "SessionSpot",
    date: "2026-11-21",
    time: "9:00 AM – 5:00 PM",
    location: "City Convention Center",
    description:
      "Big ideas. Real connections. Join the people shaping what comes next for a day of inspiring talks, practical sessions and meaningful conversations.",
    theme: "plum",
    poster: "LEARN. CONNECT. BUILD.",
    headline: "Innovation<br>Summit ’26",
    status: "Published",
    tickets: [
      ticket(
        "general",
        "General admission",
        25,
        180,
        126,
        "Full access to talks and networking",
      ),
      ticket(
        "student",
        "Student admission",
        15,
        80,
        40,
        "Valid student ID required at entry",
      ),
      ticket(
        "vip",
        "VIP experience",
        45,
        40,
        20,
        "Priority seating and speaker meetup",
      ),
    ],
  },
  {
    id: "career",
    title: "Design Your Future: Career Fair",
    category: "Education",
    organizer: "Westbridge University",
    date: "2026-11-18",
    time: "10:00 AM – 4:00 PM",
    location: "Westbridge Campus, Main Hall",
    description:
      "Meet inspiring employers, explore new opportunities and take the next step in your career. Your next chapter starts with a conversation.",
    theme: "sage",
    poster: "MEET YOUR FUTURE. / 2026",
    headline: "YOUR NEXT<br>CHAPTER.",
    status: "Published",
    tickets: [
      ticket(
        "general",
        "General admission",
        0,
        200,
        128,
        "Meet employers and join career sessions",
      ),
    ],
  },
  {
    id: "coffee",
    title: "Founders & Coffee",
    category: "Business",
    organizer: "The Business Collective",
    date: "2026-11-20",
    time: "8:30 AM – 10:30 AM",
    location: "The Foundry, Downtown",
    description:
      "Good coffee. Great company. A relaxed morning of conversations with local founders, makers and people with big ideas.",
    theme: "peach",
    poster: "A MORNING FOR BIG IDEAS.",
    headline: "Good coffee.<br>Great company.",
    status: "Published",
    tickets: [
      ticket(
        "general",
        "General admission",
        15,
        100,
        64,
        "Coffee, light breakfast and great conversation",
      ),
    ],
  },
  {
    id: "market",
    title: "Neighborhood Makers Market",
    category: "Community",
    organizer: "Riverside Community",
    date: "2026-11-22",
    time: "11:00 AM – 4:00 PM",
    location: "Riverside Park, East Lawn",
    description:
      "Shop small. Connect big. Discover handmade goods, meet local makers and spend a lovely day with your community.",
    theme: "blue",
    poster: "SHOP SMALL. / CONNECT BIG.",
    headline: "Made local.<br>Loved by all.",
    status: "Published",
    tickets: [
      ticket(
        "general",
        "General admission",
        0,
        300,
        216,
        "Explore the market and meet local makers",
      ),
    ],
  },
  {
    id: "speaking",
    title: "Public Speaking Workshop",
    category: "Education",
    organizer: "Westbridge Learning Center",
    date: "2026-11-14",
    time: "2:00 PM – 4:00 PM",
    location: "Westbridge Learning Center",
    description:
      "Find your voice in a friendly, practical workshop. Build confidence and learn to share your ideas clearly.",
    theme: "lavender",
    poster: "FIND YOUR VOICE.",
    headline: "Ideas worth<br>sharing.",
    status: "Archived",
    tickets: [
      ticket(
        "general",
        "General admission",
        0,
        30,
        20,
        "A hands-on speaking workshop",
      ),
    ],
  },
  {
    id: "design",
    title: "Design for Everyone",
    category: "Arts & culture",
    organizer: "Westbridge Creative Club",
    date: "2026-10-24",
    time: "1:00 PM – 3:00 PM",
    location: "Westbridge Studio",
    description: "A practical introduction to inclusive design.",
    theme: "peach",
    poster: "MAKE SOMETHING MEANINGFUL.",
    headline: "Design for<br>everyone.",
    status: "Archived",
    tickets: [
      ticket(
        "general",
        "General admission",
        0,
        40,
        40,
        "An inclusive design session",
      ),
    ],
  },
];
export const seedBookings = [
  {
    id: "SS-20512",
    eventId: "summit",
    items: { general: 2 },
    name: "Alex Morgan",
    email: "alex@example.com",
    created: "2026-11-10",
    status: "Confirmed",
  },
  {
    id: "SS-20481",
    eventId: "speaking",
    items: { general: 1 },
    name: "Alex Morgan",
    email: "alex@example.com",
    created: "2026-11-08",
    status: "Confirmed",
  },
  {
    id: "SS-20340",
    eventId: "design",
    items: { general: 1 },
    name: "Alex Morgan",
    email: "alex@example.com",
    created: "2026-10-12",
    status: "Confirmed",
  },
  {
    id: "SS-20320",
    eventId: "coffee",
    items: { general: 1 },
    name: "Alex Morgan",
    email: "alex@example.com",
    created: "2026-11-07",
    status: "Cancelled",
  },
];
export const seedUsers = [
  {
    id: "alex",
    name: "Alex Morgan",
    email: "alex@example.com",
    role: "Attendee",
    active: true,
  },
  {
    id: "priya",
    name: "Priya Nair",
    email: "priya@example.com",
    role: "Organizer",
    active: true,
  },
  {
    id: "sam",
    name: "Sam Chen",
    email: "sam@example.com",
    role: "Admin",
    active: true,
  },
];
const KEY = "sessionspot-demo-v2";
const fixtureDays = { career: 8, coffee: 10, summit: 11, market: 12, speaking: 4, design: -17 };
const clone = (value) => structuredClone(value);
const fresh = () => ({
  version: 2, figmaFixture: true, functionalRevision: 1,
  fixtureAnchor: localDate(), currentUserId: "alex",
  events: clone(seedEvents), bookings: clone(seedBookings), users: clone(seedUsers),
  saved: [], profile: { name: "Alex Morgan", email: "alex@example.com" },
  activity: [46, 62, 54, 80, 92, 118, 142],
});
function normalize(value) {
  if (value?.version !== 2 || ![value.events, value.bookings, value.users, value.saved, value.activity].every(Array.isArray) || !value.profile)
    throw Error("Invalid demo state.");
  const data = clone(value);
  if (!data.figmaFixture) {
    const summit = data.events.find((e) => e.id === "summit");
    const general = summit?.tickets.find((t) => t.id === "general"), student = summit?.tickets.find((t) => t.id === "student");
    if (general?.sold === 120 && student?.sold === 46) { general.sold = 126; student.sold = 40; }
    data.figmaFixture = true;
  }
  data.currentUserId ||= "alex";
  if (!validDate(data.fixtureAnchor)) data.fixtureAnchor = localDate();
  if (!data.functionalRevision) {
    const user = data.users.find((u) => u.id === data.currentUserId);
    if (user) Object.assign(user, data.profile);
  }
  for (const event of data.events) {
    if (!Array.isArray(event.tickets) || !validDate(event.date)) throw Error("Invalid demo event.");
    event.ownerId ||= "priya";
    const reference = seedEvents.find((e) => e.id === event.id);
    if (reference && event.date === reference.date && event.time === reference.time && !event.referenceSchedule)
      event.referenceSchedule = { date: reference.date, time: reference.time, days: fixtureDays[event.id] };
    if (event.id === "market" && event.title === "Neighbourhood Makers Market") event.title = "Neighborhood Makers Market";
    for (const ticket of event.tickets) {
      if (![ticket.capacity, ticket.sold, ticket.price].every(Number.isFinite) || !Number.isInteger(ticket.capacity) || !Number.isInteger(ticket.sold) || ticket.sold < 0 || ticket.capacity < ticket.sold || ticket.price < 0)
        throw Error("Invalid stored ticket inventory.");
      const recorded = data.bookings.filter((b) => b.eventId === event.id && b.status === "Confirmed").reduce((sum, b) => sum + (b.items[ticket.id] || 0), 0);
      ticket.aggregateSold ??= Math.max(0, ticket.sold - recorded);
      ticket.aggregatePrice ??= ticket.price;
    }
  }
  for (const booking of data.bookings) {
    booking.ownerId ||= "alex";
    const event = data.events.find((e) => e.id === booking.eventId);
    booking.prices ||= Object.fromEntries((event?.tickets || []).map((t) => [t.id, t.price]));
    booking.ticketNames ||= Object.fromEntries((event?.tickets || []).map((t) => [t.id, t.name]));
  }
  data.functionalRevision = 1;
  return data;
}
export function loadState() {
  try { const raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch {}
  return normalize(fresh());
}
export let state = loadState();
let committed = clone(state);
// Seed/migrate the local anchor once. A denied/quota write does not stop read-only
// previews; every actual mutation below must successfully persist or throw.
try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
function reconcile(target, source) {
  if (Array.isArray(source)) {
    const values = source.map((value, i) => {
      const old = value && typeof value === "object" ? (value.id ? target.find((v) => v?.id === value.id) : target[i]) : null;
      if (old && typeof old === "object") { reconcile(old, value); return old; }
      return clone(value);
    });
    target.splice(0, target.length, ...values);
  } else {
    for (const key of Object.keys(target)) if (!(key in source)) delete target[key];
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === "object" && target[key] && typeof target[key] === "object" && Array.isArray(value) === Array.isArray(target[key])) reconcile(target[key], value);
      else target[key] = clone(value);
    }
  }
}
function commit(next) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); }
  catch { throw Error("Browser storage is unavailable or full. Nothing was saved or reserved. Enable storage and retry."); }
  reconcile(state, next); committed = clone(state); return state;
}
export function saveState() {
  try { commit(clone(state)); return true; }
  catch (error) { reconcile(state, committed); throw error; }
}
function transaction(change) {
  const next = clone(state); const result = change(next); commit(next); return result;
}
export function resetState() { commit(normalize(fresh())); }
export const getEvent = (id) => state.events.find((e) => e.id === id);
export const available = (ticket) => Math.max(0, ticket.capacity - ticket.sold);
export const quantity = (booking) => Object.values(booking.items).reduce((sum, n) => sum + n, 0);
export const bookingTotal = (booking) => Object.entries(booking.items).reduce((sum, [id, n]) => sum + n * (booking.prices?.[id] ?? getEvent(booking.eventId)?.tickets.find((t) => t.id === id)?.price ?? 0), 0);
export const currentUser = (data = state) => data.users.find((u) => u.id === data.currentUserId && u.active);
export function requireRole(roles, data = state) {
  const actor = currentUser(data);
  if (!actor || !roles.includes(actor.role)) throw Error("This demo action requires an authorized organizer or administrator. Use the existing demo sign-in.");
  return actor;
}
export function canManage(event, data = state) {
  const actor = currentUser(data);
  return !!event && !!actor && (actor.role === "Admin" || actor.role === "Organizer" && event.ownerId === actor.id);
}
export function managementEvents() {
  const actor = currentUser();
  // Attendees may inspect the non-sensitive sample overview, but action handlers
  // do not authorize mutations/exports. Organizers see only their association.
  return actor?.role === "Organizer" ? state.events.filter((e) => e.ownerId === actor.id) : state.events;
}
export function isUpcoming(event, data = state) {
  try { return eventWindow(event, data.fixtureAnchor).start > now(); } catch { return false; }
}
export function isPublished(event, data = state) { return !!event && event.status === "Published" && isUpcoming(event, data); }
export function isBookable(event, data = state) { return isPublished(event, data) && event.tickets.some((t) => available(t) > 0); }
export function compareEvents(a, b) {
  try { return eventWindow(a, state.fixtureAnchor).start - eventWindow(b, state.fixtureAnchor).start || a.id.localeCompare(b.id); }
  catch { return String(a.date).localeCompare(String(b.date)); }
}
export function daysUntil(event) {
  return Math.round((new Date(localDate(eventWindow(event, state.fixtureAnchor).start) + "T12:00:00Z") - new Date(localDate() + "T12:00:00Z")) / 86400000);
}
export function visibleBookings() {
  const actor = currentUser(); return state.bookings.filter((b) => b.ownerId === actor?.id);
}
export function canViewBooking(booking, data = state) {
  const actor = currentUser(data); const event = data.events.find((e) => e.id === booking?.eventId);
  return !!booking && !!actor && (booking.ownerId === actor.id || canManage(event, data));
}
export function canCancelBooking(booking, data = state) {
  const event = data.events.find((e) => e.id === booking?.eventId);
  return canViewBooking(booking, data) && booking.status === "Confirmed" && isUpcoming(event, data);
}
export function stats(events = state.events.filter((e) => e.status === "Published")) {
  return {
    events: events.length,
    capacity: events.reduce((s, e) => s + e.tickets.reduce((n, t) => n + t.capacity, 0), 0),
    sold: events.reduce((s, e) => s + e.tickets.reduce((n, t) => n + t.sold, 0), 0),
    left: events.reduce((s, e) => s + e.tickets.reduce((n, t) => n + available(t), 0), 0),
    value: events.reduce((sum, e) => sum + e.tickets.reduce((n, t) => n + t.aggregateSold * t.aggregatePrice, 0) + state.bookings.filter((b) => b.eventId === e.id && b.status === "Confirmed").reduce((n, b) => n + bookingTotal(b), 0), 0),
  };
}
export function submissionIdentifier() {
  return globalThis.crypto?.randomUUID?.() || `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
export function makeBooking(eventId, items, details, submissionId = submissionIdentifier()) {
  const actor = currentUser(); if (!actor) throw Error("Select an active demo account before reserving.");
  const person = accountDetails(details);
  if (!items || typeof items !== "object" || Array.isArray(items) || !Object.keys(items).length) throw Error("Choose at least one ticket.");
  const event = getEvent(eventId);
  if (!event || Object.keys(items).some((id) => !event.tickets.some((t) => t.id === id))) throw Error("A selected ticket category does not belong to this event.");
  if (typeof submissionId !== "string" || !/^[A-Za-z0-9:_-]{1,128}$/.test(submissionId)) throw Error("Invalid demo submission identifier. Reload the form.");
  let count = 0; const safe = {};
  for (const [id, input] of Object.entries(items)) {
    if (typeof input !== "number" && !(typeof input === "string" && /^\d+$/.test(input))) throw Error("Choose whole, non-negative ticket quantities.");
    const n = Number(input);
    if (!Number.isSafeInteger(n) || n < 0 || n > 10) throw Error("Choose 0–10 whole tickets per category.");
    if (n) safe[id] = n; count += n;
  }
  if (!count) throw Error("Choose at least one ticket to continue.");
  const signature = JSON.stringify([eventId, Object.entries(safe).sort(), person.name, person.email]);
  const previous = state.bookings.find((b) => b.ownerId === actor.id && b.submissionId === submissionId);
  if (previous) {
    if (previous.requestSignature !== signature) throw Error("This request was already saved with different details. Start a new reservation.");
    return previous;
  }
  if (!isBookable(event)) throw Error("This event is unavailable.");
  for (const [id, n] of Object.entries(safe)) if (n > available(event.tickets.find((t) => t.id === id))) throw Error("Not enough sample tickets remain. Choose fewer tickets.");
  let id;
  do { id = "SS-" + submissionIdentifier().replace(/[^a-z0-9]/gi, "").slice(-12).toUpperCase(); } while (state.bookings.some((b) => b.id === id));
  transaction((next) => {
    const stored = next.events.find((e) => e.id === eventId);
    const booking = { id, eventId, ownerId: actor.id, items: safe, name: person.name, email: person.email,
      created: localDate(), status: "Confirmed", submissionId, requestSignature: signature,
      prices: Object.fromEntries(stored.tickets.map((t) => [t.id, t.price])),
      ticketNames: Object.fromEntries(stored.tickets.map((t) => [t.id, t.name])) };
    stored.tickets.forEach((t) => { t.sold += safe[t.id] || 0; }); next.bookings.unshift(booking);
  });
  return state.bookings.find((b) => b.id === id);
}
export function cancelBooking(id) {
  const booking = state.bookings.find((b) => b.id === id);
  if (!booking) return false;
  if (!canViewBooking(booking)) throw Error("You cannot cancel another attendee's reservation.");
  if (booking.status !== "Confirmed" || !isUpcoming(getEvent(booking.eventId))) return false;
  transaction((next) => {
    const b = next.bookings.find((b) => b.id === id), e = next.events.find((e) => e.id === b.eventId);
    for (const [ticketId, n] of Object.entries(b.items)) {
      const ticket = e.tickets.find((t) => t.id === ticketId);
      if (!ticket || ticket.sold < n) throw Error("The inventory is inconsistent. No cancellation was saved.");
      ticket.sold -= n;
    }
    b.status = "Cancelled"; b.cancelledAt = now();
  });
  return true;
}
export function attendees(eventId) {
  const event = getEvent(eventId), actor = currentUser();
  return state.bookings.filter((b) => b.eventId === eventId && b.status === "Confirmed" && (canManage(event) || b.ownerId === actor?.id))
    .map((b) => ({ name: b.name, email: b.email, reference: b.id, tickets: quantity(b) }));
}
export function requireExport(eventId) {
  requireRole(["Organizer", "Admin"]);
  if (eventId && !canManage(getEvent(eventId))) throw Error("You can export attendees only for an event you manage.");
}
export function toggleSaved(id) {
  if (!getEvent(id)) throw Error("This event could not be found.");
  transaction((next) => { next.saved = next.saved.includes(id) ? next.saved.filter((v) => v !== id) : [...next.saved, id]; });
}
export function updateProfile(details) {
  const actor = currentUser(); if (!actor) throw Error("Select an active demo account first.");
  const profile = accountDetails(details);
  if (state.users.some((u) => u.id !== actor.id && u.email === profile.email)) throw Error("That email belongs to another sample user.");
  transaction((next) => { next.profile = profile; Object.assign(next.users.find((u) => u.id === actor.id), profile); });
  return profile;
}
export function loginDemo(email, password) {
  const normalized = emailAddress(email); checkPassword(password);
  let user = state.users.find((u) => u.email === normalized);
  if (user && !user.active) throw Error("This sample user is inactive. Reset sample data to restore it.");
  const id = user?.id || "user-" + submissionIdentifier();
  transaction((next) => {
    if (!user) { user = { id, name: "Demo Attendee", email: normalized, role: "Attendee", active: true }; next.users.push(user); }
    next.currentUserId = id; next.profile = { name: user.name, email: user.email };
  });
  return currentUser();
}
export function registerDemo(details, password, confirm, requestedRole, terms) {
  const profile = accountDetails(details); checkPassword(password, confirm);
  if (!terms) throw Error("Agree to the demo terms before continuing.");
  if (!["Attendee", "Organizer"].includes(requestedRole)) throw Error("Choose a valid demo interest.");
  if (state.users.some((u) => u.email === profile.email)) throw Error("That sample email already exists. Use demo sign-in instead.");
  const id = "user-" + submissionIdentifier();
  transaction((next) => {
    next.users.push({ id, ...profile, role: "Attendee", active: true });
    next.currentUserId = id; next.profile = profile;
  });
  return currentUser();
}
function validateEvent(fields, existing) {
  const record = { ...existing };
  if (Object.hasOwn(fields, "posterImage")) record.posterImage = validatePoster(fields.posterImage);
  for (const key of ["title", "description", "location", "organizer", "category", "status", "date", "time"]) record[key] = fields[key];
  record.title = cleanText(fields.title); record.description = String(fields.description ?? "").trim();
  record.location = cleanText(fields.location); record.organizer = cleanText(fields.organizer);
  if (record.title.length < 4 || record.title.length > 140 || record.description.length < 15 || record.description.length > 5000 || record.location.length < 3 || record.location.length > 160 || record.organizer.length < 2 || record.organizer.length > 120)
    throw Error("Check the event title (4–140), description (15–5000), location (3–160) and organizer (2–120 characters).");
  if (!["Education", "Business", "Community", "Arts & culture"].includes(record.category) || !["Draft", "Published"].includes(record.status)) throw Error("Choose a valid category and event status.");
  const window = eventWindow(record, state.fixtureAnchor);
  const changedSchedule = !existing || record.date !== existing.date || record.time !== existing.time;
  if (changedSchedule) delete record.referenceSchedule;
  if (record.status === "Published" && (!existing || existing.status !== "Published" || changedSchedule) && window.start <= now()) throw Error("A published event must start in the future in Vancouver time.");
  if (!Array.isArray(fields.tickets) || fields.tickets.length < 1 || fields.tickets.length > 5) throw Error("Use one to five ticket categories.");
  const names = new Set(), ids = new Set();
  record.tickets = fields.tickets.map((input) => {
    const old = existing?.tickets.find((t) => t.id === input.id), name = cleanText(input.name), normalized = name.toLocaleLowerCase("en-CA");
    if (name.length < 2 || name.length > 80 || names.has(normalized)) throw Error("Use distinct ticket-category names (2–80 characters).");
    if (typeof input.id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(input.id) || ids.has(input.id)) throw Error("Ticket-category identities must be unique and stable.");
    names.add(normalized); ids.add(input.id);
    const reserved = existing ? state.bookings.filter((b) => b.eventId === existing.id && b.status === "Confirmed").reduce((sum, b) => sum + (b.items[input.id] || 0), 0) : 0;
    const sold = Math.max(old?.sold || 0, reserved);
    if (!Number.isSafeInteger(input.capacity) || input.capacity < Math.max(1, sold) || input.capacity > 100000 || !Number.isFinite(input.price) || input.price < 0 || input.price > 10000 || Math.abs(input.price * 100 - Math.round(input.price * 100)) > 0.000001)
      throw Error("Capacity cannot be below allocated tickets; use valid whole capacities and prices with at most two decimals.");
    return { id: input.id, name, price: input.price, capacity: input.capacity, sold, description: String(input.description ?? "").trim().slice(0, 160), aggregateSold: old?.aggregateSold || 0, aggregatePrice: old?.aggregatePrice ?? input.price };
  });
  if (existing?.tickets.some((t) => !ids.has(t.id))) throw Error("Existing ticket categories cannot be removed or replaced.");
  if (record.status === "Draft" && record.tickets.some((t) => t.sold > 0)) throw Error("An event with allocated tickets cannot become a draft. Archive it instead.");
  return record;
}
export function saveEvent(id, fields) {
  const actor = requireRole(["Organizer", "Admin"]), existing = id ? getEvent(id) : null;
  if (id && (!existing || !canManage(existing))) throw Error("You can edit only events associated with your demo organizer.");
  const record = validateEvent(fields, existing);
  record.id = existing?.id || "event-" + submissionIdentifier(); record.ownerId = existing?.ownerId || actor.id;
  record.theme = existing?.theme || "lavender"; record.poster = existing?.poster || "BRING PEOPLE TOGETHER.";
  record.headline = existing?.headline || record.title.split(" ").slice(0, 6).join(" ");
  transaction((next) => { const target = next.events.find((e) => e.id === record.id); if (target) Object.assign(target, record); else next.events.push(record); });
  return getEvent(record.id);
}
export function changeEventStatus(id, action) {
  const event = getEvent(id);
  if (!event || !canManage(event)) throw Error("Only the associated organizer or an administrator can change this event.");
  const status = action === "Restore" ? event.beforeArchive || "Published" : action;
  if (!["Published", "Draft", "Archived"].includes(status)) throw Error("Choose a valid event status.");
  if (status === "Published" && !isUpcoming(event)) throw Error("An event that has started cannot be published or restored.");
  if (status === "Draft" && event.tickets.some((t) => t.sold > 0)) throw Error("An event with allocated tickets cannot become a draft.");
  transaction((next) => { const e = next.events.find((e) => e.id === id); if (status === "Archived" && e.status !== "Archived") e.beforeArchive = e.status; e.status = status; });
}
export function changeRole(id, role) {
  requireRole(["Admin"]);
  const user = state.users.find((u) => u.id === id && u.active);
  if (!user || !["Attendee", "Organizer", "Admin"].includes(role)) throw Error("Choose an active sample user and valid role.");
  if (user.role === "Admin" && role !== "Admin" && state.users.filter((u) => u.active && u.role === "Admin").length < 2) throw Error("Keep at least one active sample administrator.");
  transaction((next) => { next.users.find((u) => u.id === id).role = role; });
}
export function removeUser(id) {
  requireRole(["Admin"]);
  const user = state.users.find((u) => u.id === id && u.active);
  if (!user) throw Error("This sample user is unavailable.");
  if (user.id === state.currentUserId || user.role === "Admin" && state.users.filter((u) => u.active && u.role === "Admin").length < 2) throw Error("Do not remove the current or last sample administrator.");
  transaction((next) => { next.users.find((u) => u.id === id).active = false; });
}
