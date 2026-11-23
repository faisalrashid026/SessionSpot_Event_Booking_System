import {
  state,
  resetState,
  getEvent,
  available,
  money,
  dateLabel,
  quantity,
  bookingTotal,
  stats,
  makeBooking,
  cancelBooking,
  attendees,
  currentUser, canManage, requireRole, requireExport, managementEvents,
  isUpcoming, isPublished, isBookable, compareEvents, daysUntil,
  visibleBookings, canViewBooking, canCancelBooking, submissionIdentifier,
  toggleSaved, updateProfile, loginDemo, registerDemo, saveEvent, changeEventStatus, changeRole, removeUser,
} from "./data.js?v=5203cbb22e";
import { icon, esc } from "./ui.js?v=3f86f75c1f";
import { csvText, bookingText } from "./exports.js?v=86694397e4";
import { cleanText, matchesEvent, accountDetails, checkPassword, emailAddress } from "./validation.js?v=cc8bacc99c";
import { readPoster, validatePoster } from "./poster.js?v=8e5d6a42e6";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);
const page = document.body.dataset.page;
const heading = (title, subtitle) =>
  `<div class="page-heading"><div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div></div>`;
const eventURL = (id, file = "event") =>
  `${file}.html?event=${encodeURIComponent(id)}`;
const bookingURL = (id, file = "confirmation") =>
  `${file}.html?booking=${encodeURIComponent(id)}`;
const published = () =>
  state.events.filter((e) => isPublished(e));
const shortDate = (d) => dateLabel(d, { month: "short", day: "numeric" });
const longDate = (d) =>
  dateLabel(d, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const ticketCount = (e) => e.tickets.reduce((s, t) => s + available(t), 0);
const eventCapacity = (e) => e.tickets.reduce((s, t) => s + t.capacity, 0);
const soldCount = (e) => e.tickets.reduce((s, t) => s + t.sold, 0);
const lowest = (e) => Math.min(...e.tickets.map((t) => t.price));
const statusLabel = (status) =>
  `<span class="status ${status === "Cancelled" ? "cancelled" : status === "Draft" ? "draft" : status === "Archived" ? "unavailable" : ""}">${status === "Confirmed" ? "✓ " : ""}${esc(status)}</span>`;
function toast(message) {
  const t = $("#toast");
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    t.hidden = true;
  }, 5500);
}
function feedback(form, message, success = false) {
  const el = $("[data-feedback]", form);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("success", success);
}
function perform(work, form) {
  try { work(); return true; }
  catch (error) { if (form) feedback(form, error.message); else toast(error.message); return false; }
}
function dialog(title, message, confirmText, action) {
  const d = $("#action-dialog");
  $("#dialog-title").textContent = title;
  $("#dialog-message").textContent = message;
  const cancel = $("#dialog-dismiss"),
    confirm = $("#dialog-confirm");
  cancel.textContent = action ? "Keep it" : "Close";
  confirm.hidden = !action;
  confirm.textContent = confirmText || "Continue";
  cancel.onclick = () => d.close();
  confirm.onclick = () => {
    d.close();
    perform(() => action?.());
  };
  d.showModal();
}
function download(name, text, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function exportAttendees(id) {
  perform(() => {
  requireExport(id);
  const all = id
    ? attendees(id)
    : managementEvents().flatMap((e) =>
        attendees(e.id).map((a) => ({ ...a, event: e.title })),
      );
  const cols = id
    ? ["name", "email", "reference", "tickets"]
    : ["event", "name", "email", "reference", "tickets"];
  download(
    "sessionspot-demo-attendees.csv",
    csvText([cols, ...all.map((a) => cols.map((c) => a[c]))]),
    "text/csv;charset=utf-8",
  );
  toast("Sample attendee CSV prepared for download.");
  });
}
function downloadBooking(b) {
  if (!canViewBooking(b)) { toast("You cannot export this sample booking."); return; }
  const e = getEvent(b.eventId);
  download(
    `${b.id}-demo-confirmation.txt`,
    bookingText(b, e),
  );
  toast("Demo confirmation prepared for download.");
}
function refreshShell() {
  const confirmed = visibleBookings().filter(
    (b) => b.status === "Confirmed" && isUpcoming(getEvent(b.eventId)),
  ).length;
  $$("[data-booking-count]").forEach((el) => (el.textContent = confirmed));
  $$("[data-profile-name]").forEach(
    (el) => (el.textContent = state.profile.name),
  );
  $$(".account-text small").forEach((el) => {
    el.textContent = `${currentUser()?.role || "Demo"} account`;
  });
  $$("[data-first-name]").forEach(
    (el) => (el.textContent = state.profile.name.split(" ")[0]),
  );
}
function initShell() {
  refreshShell();
  const sidebar = $(".sidebar"),
    toggle = $(".menu-toggle"),
    backdrop = $(".drawer-backdrop");
  const close = () => {
    sidebar?.classList.remove("open");
    backdrop?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    if (sidebar && matchMedia("(max-width:900px)").matches)
      sidebar.inert = true;
  };
  const setMode = () => {
    if (sidebar)
      sidebar.inert =
        matchMedia("(max-width:900px)").matches &&
        !sidebar.classList.contains("open");
  };
  setMode();
  matchMedia("(max-width:900px)").addEventListener("change", () => {
    close();
    setMode();
  });
  toggle?.addEventListener("click", () => {
    sidebar.inert = false;
    sidebar.classList.add("open");
    backdrop.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    $(".drawer-close").focus();
  });
  $(".drawer-close")?.addEventListener("click", () => {
    close();
    toggle.focus();
  });
  backdrop?.addEventListener("click", () => {
    close();
    toggle.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar?.classList.contains("open")) {
      close();
      toggle.focus();
    }
    if (e.key === "Tab" && sidebar?.classList.contains("open")) {
      const links = $$("a,button", sidebar).filter((el) => !el.disabled),
        first = links[0],
        last = links.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  $$("[data-notifications]").forEach((b) =>
    b.addEventListener("click", () =>
      dialog(
        "You’re on the list",
        "Your sample bookings are ready in My bookings. This prototype does not send push notifications.",
      ),
    ),
  );
  $$("[data-export-all]").forEach((b) =>
    b.addEventListener("click", () => exportAttendees()),
  );
  $("[data-reset-demo]")?.addEventListener("click", () =>
    dialog(
      "Reset sample data?",
      "This restores the original sample events, bookings, profile and roles in this browser.",
      "Reset demo",
      () => {
        resetState();
        location.href = "index.html";
      },
    ),
  );
}
function posterAppearance(e, summary = false) {
  // Invalid hand-edited local state falls back to the original Figma artwork.
  try { return validatePoster(e.posterImage) ? ` style="background-image:${summary ? "linear-gradient(#241c3b99,#241c3b99)," : ""}url('${esc(e.posterImage)}');background-size:cover;background-position:center"` : ""; }
  catch { return ""; }
}
function poster(e, save = false) {
  const artwork = posterAppearance(e), hidden = artwork ? ' style="visibility:hidden" aria-hidden="true"' : "";
  return `<div class="poster ${esc(e.theme)}"${artwork}>${artwork ? `<span class="sr-only">Selected event poster for ${esc(e.title)}</span>` : ""}<div class="eyebrow"${hidden}>${esc({ career: "Westbridge Career Fair", market: "Riverside Makers Market" }[e.id] || e.organizer)}</div><h3${hidden}>${e.headline.split("<br>").map(esc).join("<br>")}</h3><div class="poster-footer"${hidden}><span>${esc(e.poster)}</span><span>${esc(shortDate(e.date).toUpperCase())}</span></div>${save ? `<button class="save-event" type="button" aria-label="Save ${esc(e.title)}" aria-pressed="${state.saved.includes(e.id)}" data-save="${esc(e.id)}">${icon("heart-" + ({ sage: "sage", peach: "peach", blue: "blue" }[e.theme] || "sage"))}</button>` : ""}</div>`;
}
function eventCard(e) {
  const price = lowest(e);
  return `<article class="card event-card">${poster(e, true)}<div class="event-body"><div class="category">${esc(e.category)}</div><h3><a href="${eventURL(e.id)}" style="color:inherit">${esc(e.title)}</a></h3><p class="byline">by ${esc(e.organizer)}</p><p class="meta">${icon("calendar-small")}${esc(dateLabel(e.date, { weekday: "short", month: "short", day: "numeric" }))} · ${esc(e.time.split(" – ")[0])}</p><p class="meta">${icon("location")}${esc(e.location)}</p><div class="event-bottom"><div><strong>${price === 0 ? "Free" : money(price).replace(".00", "")}</strong>${price > 0 ? "<span> / person</span>" : ""}</div><a href="${eventURL(e.id, ticketCount(e) > 0 ? "reserve" : "event")}">${ticketCount(e) > 0 ? "Reserve ticket" : "Sold out · Details"} <span class="direction-arrow" aria-hidden="true">→</span></a></div></div></article>`;
}
function calendarTile(date) {
  return `<div class="calendar-tile" aria-label="${esc(shortDate(date))}">${esc(dateLabel(date, { month: "short" }).toUpperCase())}<strong>${Number(date.slice(-2))}</strong><span class="weekday">${esc(dateLabel(date, { weekday: "short" }).toUpperCase())}</span></div>`;
}
function previewCard(b) {
  const e = getEvent(b.eventId);
  return `<article class="card booking-preview">${calendarTile(e.date)}<div class="preview-main"><h3>${esc(e.title)}</h3><p class="small muted" style="margin:0">${esc(e.organizer)}</p><p class="meta">${esc(dateLabel(e.date, { weekday: "short", month: "short", day: "numeric" }))} · ${esc(e.time)}</p><div class="row">${statusLabel(b.status)}<span class="small muted">${quantity(b)} ${quantity(b) === 1 ? "ticket" : "tickets"} · General admission</span></div><p class="small muted booking-reference" style="font-size:10px;margin:12px 0 0">Booking #${esc(b.id)}</p></div><div class="preview-cta"><div class="eyebrow muted">You’re all set</div><h3>See you there!</h3><a class="btn" href="${bookingURL(b.id)}">View ticket <span class="direction-arrow" aria-hidden="true">→</span></a><p class="small muted" style="font-size:10px;margin:12px 0 0">Your sample ticket, ready to go.</p></div></article>`;
}
function initDiscovery() {
  const input = $("#global-search");
  let category = "",
    view = params.get("view") || "",
    showAll = false;
  input.value = params.get("q") || "";
  if (input.value) showAll = true;
  let allView = view === "saved" || view === "calendar";
  if (allView) {
    showAll = true;
    $("#explore-heading").textContent =
      view === "saved" ? "Your saved events" : "Your event calendar";
    $$(".discover-nav .nav-link").forEach((a) => {
      const active = a.getAttribute("href") === `index.html?view=${view}`;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  function render() {
    const q = cleanText(input.value).toLocaleLowerCase("en-CA"),
      date = $("#event-date").value,
      price = $("#price-filter").value;
    const display = $(".date-display");
    if (display)
      display.textContent = date ? shortDate(date) + " ⌄" : "Any date ⌄";
    let events = published().filter(
      (e) =>
        (view !== "saved" || state.saved.includes(e.id)) &&
        (!category || e.category === category) &&
        (!date || e.date === date) &&
        matchesEvent(e, q) &&
        (price === "all" ||
          (price === "free" ? lowest(e) === 0 : lowest(e) > 0)),
    );
    if (view === "calendar")
      events.sort(compareEvents);
    if (!showAll && !q && !category && !date && price === "all")
      events = events.filter((e) => e.id !== "summit");
    $("#event-grid").innerHTML = events.map(eventCard).join("");
    $("#events-empty").hidden = events.length > 0;
    $("#results-count").textContent = `${events.length} events found`;
    $$("[data-save]").forEach((button) =>
      button.addEventListener("click", () => {
        const id = button.dataset.save;
        perform(() => {
          toggleSaved(id);
          render();
          toast(state.saved.includes(id) ? "Event saved in this browser." : "Event removed from saved events.");
        });
      }),
    );
  }
  const reset = () => {
    category = "";
    input.value = "";
    $("#event-date").value = "";
    $("#price-filter").value = "all";
    showAll = true;
    $$("[data-category]").forEach((b) => {
      const active = !b.dataset.category;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active);
    });
    render();
  };
  input.closest("form").addEventListener("submit", (e) => {
    e.preventDefault();
    showAll = true;
    render();
    $("#explore-heading").scrollIntoView({ block: "start" });
  });
  input.addEventListener("input", render);
  $$("[data-category]").forEach((b) =>
    b.addEventListener("click", () => {
      category = b.dataset.category;
      $$("[data-category]").forEach((x) => {
        x.classList.toggle("active", x === b);
        x.setAttribute("aria-pressed", x === b);
      });
      render();
    }),
  );
  $("#event-date").addEventListener("change", render);
  $("#event-date").addEventListener("click", () => {
    try {
      $("#event-date").showPicker?.();
    } catch {}
  });
  $("#price-filter").addEventListener("change", render);
  $("#filter-toggle").addEventListener("click", () => {
    const panel = $("#extra-filters");
    panel.hidden = !panel.hidden;
    $("#filter-toggle").setAttribute("aria-expanded", !panel.hidden);
  });
  $("#reset-filters").addEventListener("click", reset);
  $("#empty-reset").addEventListener("click", reset);
  $("#view-all-events").addEventListener("click", () => {
    view = "";
    reset();
    $("#explore-heading").textContent = "Explore upcoming events";
  });
  const preview =
    visibleBookings().find(
      (b) => b.eventId === "speaking" && b.status === "Confirmed",
    ) || visibleBookings().find((b) => b.status === "Confirmed");
  $("#booking-preview").innerHTML = preview
    ? previewCard(preview)
    : '<div class="card empty">Your next experience is waiting. Discover an event above.</div>';
  render();
}
function summaryCover(e) {
  const artwork = posterAppearance(e, true);
  return `<div class="summary-cover"${artwork}><div class="eyebrow">${esc(e.organizer)} presents</div><h2>${esc(e.title)}</h2><p>${esc(e.poster)}</p></div>`;
}
function getSelectedEvent() {
  return getEvent(params.get("event") || "summit");
}
function unavailable(element, message = "This event could not be found.") {
  const level = $$("main h1").some((h) => !element.contains(h)) ? 2 : 1;
  element.innerHTML = `<section class="card card-pad"><h${level}>Nothing here just yet</h${level}><p class="muted">${esc(message)}</p><a class="btn" href="index.html">Discover events</a></section>`;
}
function initReservation() {
  const e = getSelectedEvent(),
    form = $("#reservation-form");
  if (!isBookable(e)) {
    unavailable(form, "This event is unavailable for new reservations.");
    $("#back-to-event").href = "index.html";
    $("#back-to-event").textContent = "Back to discovery";
    return;
  }
  $("#back-to-event").href = eventURL(e.id);
  const nameParts = state.profile.name.split(" ");
  $('[name="first"]', form).value = nameParts.shift() || "";
  $('[name="last"]', form).value = nameParts.join(" ");
  $('[name="email"]', form).value = state.profile.email;
  const pendingKey = `sessionspot-pending-${currentUser()?.id}-${e.id}`;
  let pending = null, submitting = false;
  try { pending = JSON.parse(sessionStorage.getItem(pendingKey)); } catch {}
  const qty = Object.fromEntries(
    e.tickets.map((t, i) => [t.id, i === 0 ? Math.min(2, available(t)) : 0]),
  );
  $("#ticket-options").innerHTML = e.tickets
    .map(
      (t) =>
        `<div class="ticket-row" data-ticket-row="${esc(t.id)}"><div><label class="ticket-name" for="qty-${esc(t.id)}">${esc(t.name)}</label><p class="ticket-desc">${available(t) ? esc(t.description) : "Sold out · Unavailable"}</p></div><span class="ticket-price">${t.price ? money(t.price).replace(".00", "") : "Free"}</span><div class="quantity"><button type="button" data-quantity="${esc(t.id)}" data-delta="-1" aria-label="Decrease ${esc(t.name)}">−</button><input id="qty-${esc(t.id)}" type="number" name="qty-${esc(t.id)}" min="0" max="${Math.min(10, available(t))}" step="1" value="${qty[t.id]}" required ${!available(t) ? "disabled" : ""}><button type="button" data-quantity="${esc(t.id)}" data-delta="1" aria-label="Increase ${esc(t.name)}">+</button></div></div>`,
    )
    .join("");
  $("#reservation-summary").innerHTML =
    summaryCover(e) +
    `<div class="summary-content"><strong>${esc(longDate(e.date))}</strong><p class="muted">${esc(e.time)}</p><p class="muted">${esc(e.location)}</p><hr class="divider"><h3>Order summary</h3><div id="order-items" class="order-summary" aria-live="polite"></div><div class="order-line small"><span>Booking fee</span><span>$0.00</span></div><div class="total-line"><span>Total</span><span id="order-total" aria-live="polite"></span></div><p class="payment-note">Demo only. No online payment and no real reservation.</p><button class="btn wide" id="confirm-reservation" type="submit">Confirm demo reservation</button><p class="summary-legal">By reserving, you’re trying a simulated booking flow.</p></div>`;
  function update() {
    let total = 0;
    const errors = [];
    e.tickets.forEach((t) => {
      const input = $(`#qty-${t.id}`),
        n = Number(input.value),
        max = Math.min(10, available(t)),
        valid = Number.isInteger(n) && n >= 0 && n <= max;
      input.setAttribute("aria-invalid", !valid);
      if (!valid) errors.push(`Choose 0–${max} whole tickets for ${t.name}.`);
      qty[t.id] = valid ? n : 0;
      total += qty[t.id] * t.price;
      $(`[data-ticket-row="${t.id}"]`).classList.toggle(
        "chosen",
        qty[t.id] > 0,
      );
      $(`[data-quantity="${t.id}"][data-delta="-1"]`).disabled =
        !valid || n <= 0;
      $(`[data-quantity="${t.id}"][data-delta="1"]`).disabled =
        !valid || n >= max;
    });
    $("#order-items").innerHTML =
      e.tickets
        .filter((t) => qty[t.id] > 0)
        .map(
          (t) =>
            `<div class="order-line"><span>${esc(t.name)} × ${qty[t.id]}</span><span>${money(t.price * qty[t.id])}</span></div>`,
        )
        .join("") || '<p class="small muted">Select at least one ticket.</p>';
    $("#order-total").textContent = money(total);
    $(".payment-note", form).textContent = total > 0
      ? "Pay at venue · CAD. Demo only; no online payment taken."
      : "Free tickets · Demo only; no payment or real reservation.";
    $("#quantity-error").textContent = errors.join(" ");
    return !errors.length;
  }
  $$("[data-quantity]").forEach((button) =>
    button.addEventListener("click", () => {
      const input = $(`#qty-${button.dataset.quantity}`);
      input.value = String(Number(input.value) + Number(button.dataset.delta));
      update();
    }),
  );
  $$(".quantity input").forEach((input) =>
    input.addEventListener("input", update),
  );
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (submitting || !update()) return;
    const data = new FormData(form);
    if (!data.get("first").trim() || !data.get("last").trim()) {
      $("#quantity-error").textContent = "Enter both a first and last name.";
      return;
    }
    try {
      const person = accountDetails({ name: `${data.get("first").trim()} ${data.get("last").trim()}`, email: data.get("email") });
      const signature = JSON.stringify([qty, person]);
      if (!pending || pending.signature !== signature) pending = { id: submissionIdentifier(), signature };
      try { sessionStorage.setItem(pendingKey, JSON.stringify(pending)); } catch {}
      submitting = true;
      $("#confirm-reservation").disabled = true;
      const b = makeBooking(e.id, qty, person, pending.id);
      location.href = bookingURL(b.id);
    } catch (err) {
      submitting = false;
      $("#confirm-reservation").disabled = false;
      $("#quantity-error").textContent = err.message;
      $("#quantity-error").scrollIntoView({ block: "center" });
    }
  });
  update();
}
function renderMetrics(target, admin = false) {
  const s = stats(admin ? undefined : managementEvents().filter((e) => e.status === "Published"));
  const data = admin
    ? [
        [
          state.users.filter((u) => u.active).length,
          "Active demo users",
          "Browser-local role controls",
        ],
        [s.events, "Published events", "Across the sample organization"],
        [s.sold, "Registrations", "Includes seeded aggregate totals"],
        [
          state.bookings.length,
          "Sample bookings",
          "Individual records in this browser",
        ],
      ]
    : [
        [s.events, "Published events", "Across your organization"],
        [
          s.sold,
          "Total registrations",
          `${Math.round((s.sold / s.capacity) * 100) || 0}% of total capacity`,
        ],
        [
          s.left,
          "Tickets available",
          `${s.capacity} tickets across all events`,
        ],
        [
          money(s.value).replace(".00", ""),
          "Booking value",
          "Gross sample value · before refunds",
        ],
      ];
  target.innerHTML = data
    .map(
      ([value, label, note]) =>
        `<div class="card metric"><p>${label}</p><strong>${value}</strong><small>${note}</small></div>`,
    )
    .join("");
}
function initDashboard() {
  renderMetrics($("#dashboard-metrics"));
  const activity = state.activity;
  $("#chart-caption").textContent =
    `${activity.reduce((a, b) => a + b, 0)} sample registrations in the last 7 days`;
  $("#activity-chart").innerHTML =
    `<div class="bar-chart" role="img" aria-label="Registration activity: ${activity.map((v, i) => `November ${i + 4}, ${v} registrations`).join("; ")}"><div class="chart-scale" aria-hidden="true"><span>150</span><span>100</span><span>50</span><span>0</span></div>${activity.map((n, i) => `<div class="chart-column" aria-hidden="true"><span class="bar-value">${n}</span><div class="bar" style="--height:${(n / 150) * 100}%"></div><span class="bar-date">Nov ${i + 4}</span></div>`).join("")}</div>`;
  const next = managementEvents().filter((e) => isPublished(e)).sort(compareEvents)[0];
  $("#up-next").innerHTML = next
    ? `<div class="eyebrow">Up next / ${daysUntil(next)} days away</div><h2>${esc(next.title)}</h2><p>${esc(shortDate(next.date))}, ${next.date.slice(0, 4)} · ${esc(next.time.split(" – ")[0])}</p><p>${esc(next.location)}</p><div class="capacity">${soldCount(next)} / ${eventCapacity(next)} registered<div class="progress-track" style="--progress:${(soldCount(next) / eventCapacity(next)) * 100}%"><span></span></div></div><a class="text-button" href="${eventURL(next.id, "create-event")}">Manage event</a>`
    : '<h2>Your next event starts here.</h2><a class="btn" href="create-event.html">Create an event</a>';
  let status = "Published";
  $("#published-count").textContent = managementEvents().filter(
    (e) => e.status === "Published",
  ).length;
  $("#draft-count").textContent = managementEvents().filter(
    (e) => e.status === "Draft",
  ).length;
  function render() {
    const q = $("#manage-search").value.toLowerCase();
    const rows = managementEvents()
      .filter((e) => e.status === status && e.title.toLowerCase().includes(q))
      .sort(compareEvents);
    $("#manage-events").innerHTML = rows
      .map(
        (e) =>
          `<tr><td><strong>${esc(e.title)}</strong><small>${esc(e.category)} · ${esc(e.organizer)}</small></td><td>${esc(shortDate(e.date))}, ${e.date.slice(0, 4)}</td><td>${soldCount(e)} / ${eventCapacity(e)}</td><td>${statusLabel(e.status)}</td><td><a class="text-button" href="${eventURL(e.id, "create-event")}">Manage <span class="direction-arrow" aria-hidden="true">→</span></a><br><a class="small" href="${eventURL(e.id, "attendees")}">Attendees</a></td></tr>`,
      )
      .join("");
    $("#manage-empty").hidden = rows.length > 0;
    $("#manage-count").textContent =
      `Showing ${rows.length} ${status.toLowerCase()} events`;
  }
  $("#manage-search").addEventListener("input", render);
  $$("[data-event-status]").forEach((b) =>
    b.addEventListener("click", () => {
      status = b.dataset.eventStatus;
      $$("[data-event-status]").forEach((x) => {
        x.classList.toggle("active", x === b);
        x.setAttribute("aria-pressed", x === b);
      });
      render();
    }),
  );
  render();
}
function bookingDetails(b, confirmation = false) {
  const e = getEvent(b.eventId);
  const canCancel = canCancelBooking(b);
  return `<h2>Booking details</h2><h3>${esc(e.title)}</h3><dl class="detail-list"><dt>Booking reference</dt><dd>#${esc(b.id)}</dd><dt>Booked by</dt><dd>${esc(b.name)}</dd><dt>Booking date</dt><dd>${esc(shortDate(b.created))}, ${b.created.slice(0, 4)}</dd><dt>Ticket type</dt><dd>${e.tickets
    .filter((t) => b.items[t.id])
    .map((t) => esc(b.ticketNames?.[t.id] ?? t.name))
    .join(
      ", ",
    )}</dd><dt>Quantity</dt><dd>${quantity(b)} tickets</dd><dt>Reservation status</dt><dd>${esc(b.status)}</dd></dl><div class="total-line"><span>${b.status === "Cancelled" ? "Historical sample value" : "Sample amount due at venue"}</span><strong>${money(bookingTotal(b))}</strong></div>${!confirmation ? `<a class="btn" href="${bookingURL(b.id)}">View tickets <span class="direction-arrow" aria-hidden="true">→</span></a>` : ""}<button type="button" class="btn secondary" data-download-booking="${esc(b.id)}">Download demo confirmation</button><div class="cancel-area"><p>Prototype only. No real ticket or email.</p>${canCancel ? `<button type="button" class="text-button danger" data-cancel-booking="${esc(b.id)}">Cancel reservation</button>` : ""}<a href="help.html">Contact organizer <span class="direction-arrow" aria-hidden="true">→</span></a></div>`;
}
function bindBookingActions(after) {
  $$("[data-download-booking]").forEach((button) =>
    button.addEventListener("click", () =>
      downloadBooking(
        state.bookings.find((b) => b.id === button.dataset.downloadBooking),
      ),
    ),
  );
  $$("[data-cancel-booking]").forEach((button) =>
    button.addEventListener("click", () =>
      dialog(
        "Cancel this demo reservation?",
        "The sample tickets will return to local availability. This does not cancel a real event booking.",
        "Cancel demo reservation",
        () => {
          cancelBooking(button.dataset.cancelBooking);
          refreshShell();
          after();
          toast("Demo reservation cancelled. Sample tickets released.");
        },
      ),
    ),
  );
}
function bookingCard(b, selected) {
  const e = getEvent(b.eventId);
  const rows = e.tickets.filter((t) => b.items[t.id]);
  const compact = e.id !== "summit";
  return `<article class="card booking-card ${selected ? "selected" : ""}">${!compact ? `<div class="booking-cover"><div><div class="eyebrow">${esc(e.organizer)} presents</div><h3>${esc(e.title)}</h3></div>${statusLabel(b.status)}</div>` : ""}<div class="booking-card-body">${compact ? `<div class="booking-compact">${calendarTile(e.date)}<div><h3>${esc(e.title)}</h3><p class="muted">${esc(shortDate(e.date))} · ${esc(e.time)}</p><p class="muted">${esc(e.location)}</p></div></div>` : `<p>${esc(dateLabel(e.date, { weekday: "long", month: "short", day: "numeric", year: "numeric" }))} · ${esc(e.time)}</p><p class="muted">${esc(e.location)}</p>`}<div class="row between"><p class="muted" style="margin:8px 0 0">${quantity(b)} tickets · ${rows.map((t) => esc(b.ticketNames?.[t.id] ?? t.name)).join(", ")} · ${bookingTotal(b) ? money(bookingTotal(b)) + " sample value" : "Free"}</p>${compact ? statusLabel(b.status) : ""}</div><div class="booking-actions"><span>#${esc(b.id)}</span><button class="text-button" type="button" data-select-booking="${esc(b.id)}" aria-pressed="${selected}">View details <span class="direction-arrow" aria-hidden="true">→</span><span class="sr-only"> for ${esc(e.title)}</span></button></div></div></article>`;
}
function initBookings() {
  let tab = "Upcoming",
    selected = params.get("booking") || "SS-20512";
  const classify = (b) =>
    b.status === "Cancelled"
      ? "Cancelled"
      : !isUpcoming(getEvent(b.eventId))
        ? "Past"
        : "Upcoming";
  const selectedRecord = visibleBookings().find((b) => b.id === selected);
  if (selectedRecord) tab = classify(selectedRecord);
  function render() {
    const q = $("#booking-search").value.toLowerCase();
    $$("[data-booking-tab]").forEach((button) => {
      const t = button.dataset.bookingTab;
      button.classList.toggle("active", tab === t);
      button.setAttribute("aria-selected", tab === t);
      button.tabIndex = tab === t ? 0 : -1;
      $(`[data-tab-count="${t}"]`).textContent = visibleBookings().filter(
        (b) => classify(b) === t,
      ).length;
    });
    $("#booking-list").setAttribute(
      "aria-labelledby",
      "tab-" + tab.toLowerCase(),
    );
    const rows = visibleBookings().filter(
      (b) =>
        getEvent(b.eventId) &&
        classify(b) === tab &&
        `${b.id} ${getEvent(b.eventId).title}`.toLowerCase().includes(q),
    );
    if (!rows.some((b) => b.id === selected)) selected = rows[0]?.id;
    const chosen = rows.find((b) => b.id === selected);
    $("#booking-list").innerHTML = rows.length
      ? rows.map((b) => bookingCard(b, b.id === selected)).join("")
      : '<div class="card empty"><h3>No bookings here</h3><p>Try another tab or search.</p><a class="btn secondary" href="index.html">Discover events</a></div>';
    $("#booking-details").innerHTML = chosen
      ? bookingDetails(chosen)
      : '<h2>Booking details</h2><p class="muted small">Select a booking to see its details.</p>';
    $("#booking-count").textContent =
      `Showing ${rows.length} ${tab.toLowerCase()} bookings`;
    const recent = visibleBookings().find(
      (b) =>
        b.status === "Confirmed" && isUpcoming(getEvent(b.eventId)),
    );
    $("#booking-success").innerHTML = recent
      ? `<div class="notice success booking-success">${icon("check")}<div><strong>You’re booked for ${esc(getEvent(recent.eventId).title)}!</strong><p>${quantity(recent)} sample tickets reserved. Demo only — no confirmation email sent.</p></div><span class="booking-ref">Booking #${esc(recent.id)}</span></div>`
      : "";
    $$("[data-select-booking]").forEach((button) =>
      button.addEventListener("click", () => {
        selected = button.dataset.selectBooking;
        history.replaceState(null, "", bookingURL(selected, "my-bookings"));
        render();
      }),
    );
    bindBookingActions(render);
  }
  $$("[data-booking-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      tab = button.dataset.bookingTab;
      render();
    });
    button.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const tabs = $$("[data-booking-tab]");
      let n = tabs.indexOf(button);
      n =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? tabs.length - 1
            : (n + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      tab = tabs[n].dataset.bookingTab;
      render();
      tabs[n].focus();
    });
  });
  $("#booking-search").addEventListener("input", render);
  render();
}
function initEvent() {
  const e = getSelectedEvent();
  if (!e || e.status === "Draft" && !canManage(e)) {
    unavailable($("#event-detail"));
    return;
  }
  const reservable = isBookable(e);
  $("#event-detail").innerHTML =
    heading(
      esc(e.title),
      "Good people. Shared ideas. A little connection goes a long way.",
    ) +
    `<div class="two-col"><div class="stack"><section class="card event-detail-cover">${poster(e)}<div class="card-pad"><div class="category">${esc(e.category)}</div><h2>About this experience</h2><p class="event-description">${esc(e.description)}</p><p class="meta">${icon("calendar")}${esc(longDate(e.date))} · ${esc(e.time)}</p><p class="meta">${icon("location")}${esc(e.location)}</p><p class="small muted">Organized by ${esc(e.organizer)}</p></div></section><section class="card card-pad"><h2>Choose your experience</h2><div class="stack" style="margin-top:20px">${e.tickets.map((t) => `<div class="row between"><div><h3>${esc(t.name)}</h3><p class="small muted" style="margin:0">${esc(t.description)}</p></div><div style="text-align:right"><strong>${t.price ? money(t.price) : "Free"}</strong><div class="small ${available(t) ? "muted" : "danger"}">${available(t) ? available(t) + " sample tickets left" : "Sold out"}</div></div></div>`).join("")}</div></section></div><aside class="card card-pad"><h2>A place for you</h2><p class="muted small">From ${money(lowest(e))} per person · No booking fee</p>${reservable ? `<a class="btn wide" href="${eventURL(e.id, "reserve")}">Reserve tickets</a>` : '<p class="notice">This event is unavailable for new reservations.</p>'}<hr class="divider"><p class="small muted">Part 2 demo. Sample availability is not a real ticket inventory.</p><a href="help.html" class="small">Questions? We’re here to help.</a></aside></div>`;
}
function initConfirmation() {
  const b = state.bookings.find(
    (b) => b.id === (params.get("booking") || "SS-20512"),
  );
  if (!b || !getEvent(b.eventId) || !canViewBooking(b)) {
    unavailable(
      $("#confirmation-detail"),
      "This demo booking could not be found.",
    );
    return;
  }
  const render = () => {
    const e = getEvent(b.eventId);
    $("#confirmation-detail").innerHTML =
      `<div class="confirmation-mark">${icon(b.status === "Cancelled" ? "close" : "check")}</div>${heading(b.status === "Cancelled" ? "Reservation cancelled" : "You’re on the list!", b.status === "Cancelled" ? "Your sample tickets have been released." : "Your next great experience is one step closer.")}<div class="notice success" style="margin-bottom:24px">Prototype confirmation · No real tickets held, payment collected or email sent.</div><div class="two-col"><section class="card ticket-summary">${summaryCover(e)}<div class="summary-content"><h2>${esc(e.title)}</h2><p class="meta">${icon("calendar")}${esc(longDate(e.date))} · ${esc(e.time)}</p><p class="meta">${icon("location")}${esc(e.location)}</p><hr class="divider"><h3>Booking #${esc(b.id)}</h3><p class="muted small">${esc(b.name)} · ${esc(b.email)}</p>${e.tickets
        .filter((t) => b.items[t.id])
        .map(
          (t) =>
            `<div class="order-line"><span>${esc(b.ticketNames?.[t.id] ?? t.name)} × ${b.items[t.id]}</span><strong>${money((b.prices?.[t.id] ?? t.price) * b.items[t.id])}</strong></div>`,
        )
        .join(
          "",
        )}<div class="form-actions"><a class="btn" href="${bookingURL(b.id, "my-bookings")}">View my bookings</a><button class="btn secondary" type="button" id="print-confirmation">Print demo ticket</button></div></div></section><aside class="card card-pad booking-details">${bookingDetails(b, true)}</aside></div>`;
    $("#print-confirmation").addEventListener("click", () => window.print());
    bindBookingActions(render);
  };
  render();
}
function validatePasswords(form) {
  const password = $('[name="password"]', form), confirm = $('[name="confirm"]', form);
  try {
    checkPassword(password.value, confirm?.value);
    if ($('[name="current"]', form)) checkPassword($('[name="current"]', form).value);
    password.removeAttribute("aria-invalid"); confirm?.removeAttribute("aria-invalid");
    return true;
  } catch (error) {
    feedback(form, error.message);
    const field = error.message.includes("do not match") && confirm ? confirm : password;
    field.setAttribute("aria-invalid", "true"); field.focus(); return false;
  }
}
function initAuth() {
  const login = $("#login-form");
  if (login) { try { $("[name=remember]", login).checked = localStorage.getItem("sessionspot-demo-mode") === "selected"; } catch {} }
  login?.addEventListener("submit", (e) => {
    e.preventDefault(); feedback(login, "");
    perform(() => {
      const actor = loginDemo($('[name=email]', login).value, $('[name=password]', login).value);
      const keep = $('[name=remember]', login).checked;
      try { if (keep) localStorage.setItem("sessionspot-demo-mode", "selected"); else localStorage.removeItem("sessionspot-demo-mode"); } catch {}
      $$("input[type=password]", login).forEach((input) => input.value = "");
      feedback(login, "Demo identity selected. No credentials were verified or stored.", true);
      location.href = actor.role === "Admin" ? "admin.html" : actor.role === "Organizer" ? "dashboard.html" : "my-bookings.html";
    }, login);
  });
  const register = $("#register-form");
  if (register) {
    const password = $('[name=password]', register), confirm = $('[name=confirm]', register);
    const reveal = () => { confirm.disabled = !password.value; confirm.closest("label").hidden = !password.value; };
    password.addEventListener("input", reveal); reveal();
  }
  register?.addEventListener("submit", (e) => {
    e.preventDefault(); feedback(register, "");
    if (!validatePasswords(register)) return;
    perform(() => {
      const role = $('[name=role]:checked', register).value;
      registerDemo({ name: $('[name=name]', register).value, email: $('[name=email]', register).value }, $('[name=password]', register).value, $('[name=confirm]', register).value, role, $('[name=terms]', register).checked);
      $$("input[type=password]", register).forEach((input) => input.value = "");
      feedback(register, "Demo account preview complete. No real account or email was created." + (role === "Organizer" ? " Registered as a sample Attendee. For organizer testing, sign in as priya@example.com, or have the sample Admin assign your role." : ""), true);
      const link = document.createElement("a"); link.className = "btn secondary";
      link.href = role === "Organizer" ? "login.html" : "my-bookings.html";
      link.textContent = role === "Organizer" ? "Sign in to organizer demo" : "Continue to sample bookings";
      $("[data-continue]", register)?.remove(); link.dataset.continue = ""; register.append(link);
    }, register);
  });
  $("[data-sso]")?.addEventListener("click", () => dialog("Institution SSO preview", "This button demonstrates where institution sign-in would begin. No institution is connected and no credentials are transmitted."));
  const forgot = $("#forgot-form");
  forgot?.addEventListener("submit", (e) => {
    e.preventDefault(); perform(() => {
      $('[name=email]', forgot).value = emailAddress($('[name=email]', forgot).value);
      feedback(forgot, "Demo reset request validated. No email was sent. Open the sample reset link below.", true);
      $("#reset-preview").hidden = false;
    }, forgot);
  });
  const reset = $("#reset-form");
  reset?.addEventListener("submit", (e) => {
    e.preventDefault(); feedback(reset, ""); if (!validatePasswords(reset)) return;
    $$("input[type=password]", reset).forEach((input) => input.value = "");
    feedback(reset, "Demo reset preview complete. No password was changed or stored.", true);
  });
}
function initProfile() {
  const form = $("#profile-form");
  $('[name=name]', form).value = state.profile.name; $('[name=email]', form).value = state.profile.email;
  form.addEventListener("submit", (e) => {
    e.preventDefault(); feedback(form, "");
    perform(() => {
      updateProfile({ name: $('[name=name]', form).value, email: $('[name=email]', form).value });
      $('[name=name]', form).value = state.profile.name; $('[name=email]', form).value = state.profile.email;
      refreshShell(); feedback(form, "Sample profile saved in this browser.", true);
    }, form);
  });
  const pw = $("#password-form");
  pw.addEventListener("submit", (e) => {
    e.preventDefault(); feedback(pw, ""); if (!validatePasswords(pw)) return;
    $$("input[type=password]", pw).forEach((input) => input.value = "");
    feedback(pw, "Password change validated for the demo. No credential was changed or stored.", true);
  });
}
function initEventForm() {
  const form = $("#event-form"),
    edit = params.get("event"),
    event = edit ? getEvent(edit) : null;
  let posterImage = event?.posterImage || null;
  $("#manage-poster").addEventListener("click", (e) => {
    e.preventDefault();
    if (!perform(() => { requireRole(["Organizer", "Admin"]); if (event && !canManage(event)) throw Error("You cannot edit this event's poster."); }, form)) return;
    dialog("Event poster", "PNG, JPEG or WebP up to 1 MB. Saved in this browser only when you save the event.", "Use this poster", () => { posterImage = pending; feedback(form, "Poster choice ready. Save the event to keep it in this browser.", true); });
    const modal = $("#action-dialog"), controls = document.createElement("div");
    let pending = posterImage, selection = 0, closed = false;
    controls.innerHTML = '<label class="field">Poster image<input type="file" accept="image/png,image/jpeg,image/webp"></label><img alt="Selected event poster preview" hidden style="display:block;width:100%;max-height:220px;object-fit:contain"><p class="feedback" role="status" aria-live="polite"></p><button class="btn secondary sm" type="button">Use default poster</button>';
    $("#dialog-message").after(controls);
    const input = $("input", controls), preview = $("img", controls), status = $("[role=status]", controls), apply = $("#dialog-confirm");
    $("#dialog-dismiss").textContent = "Cancel";
    function renderPreview() { preview.hidden = !pending; if (pending) preview.src = pending; else preview.removeAttribute("src"); }
    renderPreview();
    input.addEventListener("change", async () => {
      const token = ++selection, file = input.files[0];
      if (!file) { apply.disabled = false; status.textContent = ""; return; }
      apply.disabled = true; status.textContent = "Reading poster…";
      try {
        const image = await readPoster(file);
        if (closed || token !== selection) return;
        pending = image; renderPreview(); status.textContent = "Preview ready. Choose Use this poster, then save the event."; apply.disabled = false;
      } catch (error) { if (!closed && token === selection) status.textContent = error.message; }
    });
    $("button", controls).addEventListener("click", () => { ++selection; pending = null; input.value = ""; renderPreview(); status.textContent = "Default artwork selected."; apply.disabled = false; });
    modal.addEventListener("close", () => { closed = true; ++selection; controls.remove(); apply.disabled = false; }, { once: true });
    input.focus();
  });
  let tickets = event
    ? structuredClone(event.tickets)
    : [
        {
          id: "general",
          name: "General admission",
          price: 0,
          capacity: 100,
          sold: 0,
          description: "Full access to this event",
        },
      ];
  if (edit && !event) {
    unavailable(form, "This event could not be found for editing.");
    return;
  }
  if (event) {
    $("#event-form-heading").textContent = "Make your event shine";
    for (const name of [
      "title",
      "description",
      "date",
      "time",
      "location",
      "category",
      "organizer",
    ])
      $(`[name="${name}"]`, form).value = event[name];
    $("[name=status]", form).value =
      event.status === "Draft" ? "Draft" : "Published";
    $("#event-delete-area").hidden = false;
    $("#delete-event").addEventListener("click", () =>
      dialog(
        "Archive this sample event?",
        "It will leave discovery while its existing sample bookings remain available.",
        "Archive event",
        () => {
          changeEventStatus(event.id, "Archived");
          location.href = "dashboard.html";
        },
      ),
    );
  }
  function renderTickets() {
    $("#event-ticket-fields").innerHTML = tickets
      .map(
        (t, i) =>
          `<fieldset class="card card-pad" style="padding:16px"><legend class="small">Ticket category ${i + 1}</legend><div class="form-grid"><label class="field full">Ticket name<input name="ticket-name-${i}" required maxlength="80" value="${esc(t.name)}"></label><label class="field">Price (CAD)<input type="number" name="ticket-price-${i}" min="0" max="10000" step="0.01" required value="${t.price}"></label><label class="field">Capacity · ${t.sold} registered<input type="number" name="ticket-capacity-${i}" min="${Math.max(1, t.sold)}" max="100000" step="1" required value="${t.capacity}"></label><label class="field full">Description<input name="ticket-description-${i}" maxlength="160" value="${esc(t.description)}"></label></div></fieldset>`,
      )
      .join("");
  }
  function collectTickets() {
    return tickets.map((t, i) => ({
      ...t,
      name: $(`[name=ticket-name-${i}]`, form).value.trim(),
      price: Number($(`[name=ticket-price-${i}]`, form).value),
      capacity: Number($(`[name=ticket-capacity-${i}]`, form).value),
      description: $(`[name=ticket-description-${i}]`, form).value.trim(),
    }));
  }
  $("#add-ticket-type").addEventListener("click", () => {
    if (!perform(() => { requireRole(["Organizer", "Admin"]); if (event && !canManage(event)) throw Error("You cannot edit this event's tickets."); }, form)) return;
    if (tickets.length >= 5) {
      toast("This demo supports up to five ticket categories.");
      return;
    }
    tickets = collectTickets();
    tickets.push({
      id: "ticket-" + (tickets.length + 1),
      name: "",
      price: 0,
      capacity: 50,
      sold: 0,
      description: "",
    });
    renderTickets();
    $(`[name=ticket-name-${tickets.length - 1}]`, form).focus();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault(); feedback(form, "");
    perform(() => {
      const data = new FormData(form);
      saveEvent(edit, { title: data.get("title"), description: data.get("description"), date: data.get("date"), time: data.get("time"), location: data.get("location"), category: data.get("category"), organizer: data.get("organizer"), status: data.get("status"), tickets: collectTickets(), posterImage });
      location.href = "dashboard.html";
    }, form);
  });
  renderTickets();
}
function initAttendees() {
  const select = $("#attendee-event");
  select.innerHTML = managementEvents()
    .map((e) => `<option value="${esc(e.id)}">${esc(e.title)}</option>`)
    .join("");
  select.value = managementEvents().find((e) => e.id === params.get("event"))?.id || managementEvents()[0]?.id || "";
  function render() {
    const q = $("#attendee-search").value.toLowerCase();
    const rows = attendees(select.value).filter((a) =>
      `${a.name} ${a.email} ${a.reference}`.toLowerCase().includes(q),
    );
    $("#attendee-rows").innerHTML = rows
      .map(
        (a) =>
          `<tr><td>${esc(a.name)}</td><td>${esc(a.email)}</td><td><a href="${bookingURL(a.reference)}">${esc(a.reference)}</a></td><td>${a.tickets}</td></tr>`,
      )
      .join("");
    $("#attendee-empty").hidden = rows.length > 0;
    $("#attendee-count").textContent =
      `${rows.length} sample attendee records · ${rows.reduce((s, a) => s + a.tickets, 0)} tickets`;
  }
  select.addEventListener("change", () => {
    history.replaceState(null, "", eventURL(select.value, "attendees"));
    render();
  });
  $("#attendee-search").addEventListener("input", render);
  $("[data-export-event]").addEventListener("click", () =>
    exportAttendees(select.value),
  );
  render();
}
function initAdmin() {
  function render() {
    renderMetrics($("#admin-metrics"), true);
    const q = $("#user-search").value.toLowerCase();
    const users = state.users.filter(
      (u) => u.active && `${u.name} ${u.email}`.toLowerCase().includes(q),
    );
    $("#user-rows").innerHTML = users.length
      ? users
          .map(
            (u) =>
              `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><select aria-label="Role for ${esc(u.name)}" data-role="${esc(u.id)}">${["Attendee", "Organizer", "Admin"].map((role) => `<option ${u.role === role ? "selected" : ""}>${role}</option>`).join("")}</select></td><td><div class="row"><button type="button" class="btn secondary sm" data-save-role="${esc(u.id)}">Save</button><button type="button" class="text-button danger" data-remove-user="${esc(u.id)}">Remove</button></div></td></tr>`,
          )
          .join("")
      : '<tr><td colspan="4" class="empty">No matching sample users.</td></tr>';
    $("#admin-event-rows").innerHTML = state.events
      .map(
        (e) =>
          `<tr><td><strong>${esc(e.title)}</strong></td><td>${esc(e.organizer)}</td><td>${statusLabel(e.status)}</td><td><div class="row"><a class="btn secondary sm" href="${eventURL(e.id, "create-event")}">Edit</a><button type="button" class="text-button ${e.status === "Archived" ? "" : "danger"}" data-archive-event="${esc(e.id)}">${e.status === "Archived" ? "Restore" : "Archive"}</button></div></td></tr>`,
      )
      .join("");
    $$("[data-save-role]").forEach((b) =>
      b.addEventListener("click", () => {
        perform(() => {
          changeRole(b.dataset.saveRole, $(`[data-role="${b.dataset.saveRole}"]`).value);
          toast("Demo role saved locally. No secure permissions changed.");
        });
      }),
    );
    $$("[data-remove-user]").forEach((b) =>
      b.addEventListener("click", () =>
        dialog(
          "Remove this sample user?",
          "The demo user will be hidden locally. Reset sample data in Settings to restore it.",
          "Remove sample user",
          () => {
            removeUser(b.dataset.removeUser);
            render();
            toast("Sample user removed locally.");
          },
        ),
      ),
    );
    $$("[data-archive-event]").forEach((b) =>
      b.addEventListener("click", () => {
        const event = getEvent(b.dataset.archiveEvent);
        dialog(
          event.status === "Archived"
            ? "Restore sample event?"
            : "Archive sample event?",
          event.status === "Archived"
            ? "The event will return to published sample events."
            : "The event will leave discovery. Existing sample bookings remain available.",
          event.status === "Archived" ? "Restore event" : "Archive event",
          () => {
            changeEventStatus(event.id, event.status === "Archived" ? "Restore" : "Archived");
            render();
            toast("Sample event status updated.");
          },
        );
      }),
    );
  }
  $("#user-search").addEventListener("input", render);
  render();
}
function initHelp() {
  const form = $("#contact-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!perform(() => { $("[name=email]", form).value = emailAddress($("[name=email]", form).value); }, form)) return;
    if (
      !$("[name=message]", form).value.trim() ||
      $("[name=message]", form).value.trim().length < 10
    ) {
      feedback(form, "Write at least 10 characters about your question.");
      return;
    }
    feedback(
      form,
      "Message preview validated. Demo only — nothing was sent or saved.",
      true,
    );
  });
  if (location.hash) {
    const detail = document.getElementById(location.hash.slice(1));
    if (detail?.tagName === "DETAILS") detail.open = true;
  }
}
const init = {
  index: initDiscovery,
  reserve: initReservation,
  dashboard: initDashboard,
  "my-bookings": initBookings,
  event: initEvent,
  confirmation: initConfirmation,
  login: initAuth,
  register: initAuth,
  "forgot-password": initAuth,
  "reset-password": initAuth,
  profile: initProfile,
  "create-event": initEventForm,
  attendees: initAttendees,
  admin: initAdmin,
  help: initHelp,
};
try {
  initShell();
  init[page]?.();
  $$("form[data-demo-form]").forEach((form) => form.dataset.demoReady = "true");
} catch (error) {
  toast("The demo could not initialize. Reload before submitting: " + error.message);
}
