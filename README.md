# SessionSpot — COMP 3540 Part 2

Team G13 · Thompson Rivers University · HTML5, CSS3 and JavaScript UI prototype.

Functional v3 adds the missing browser-local poster workflow, clarifies payment and role navigation, and verifies the complete instructor journey. Start with `INSTRUCTOR_TESTING_GUIDE.md` for current workflows, changes, test results and Part 3 limits. Both CSS files, all assets/fonts and the 15 page layouts are preserved.

`FUNCTIONAL_IMPROVEMENTS.md`, `FINAL_PART2_AUDIT.md`, `TEST_REPORT.md` and `CHANGED_FILES.md` retain the approved Functional v2 audit history. The v3 evidence is in `qa/instructor/`. Both earlier verified ZIPs remain untouched recovery copies.

## Run the project

Extract the ZIP, open a terminal in its `SessionSpot-Part2` folder, and run:

```sh
python3 -m http.server 8001 --bind 127.0.0.1
```

Open **http://localhost:8001/index.html**. If port 8001 is already in use, choose another port and use that port in the URL. XAMPP Apache can also serve the extracted folder: browse to its location under `htdocs`. All application paths are relative; no original Mac directory is required.

Use HTTP rather than opening files with `file://`, because the application uses JavaScript modules. No build, npm installation, PHP or MySQL is required for Part 2. Inter, icons and all other runtime assets are bundled locally.

## Exactly 15 webpages

| File | Purpose |
| --- | --- |
| `index.html` | Event discovery, search, filters, saved events and calendar list |
| `event.html` | Selected event details, ticket prices and availability |
| `reserve.html` | Ticket quantities, attendee details and order review |
| `confirmation.html` | Demo confirmation, download, print and cancellation |
| `my-bookings.html` | Upcoming, past and cancelled booking management |
| `login.html` | Demonstration sign-in and SSO preview |
| `register.html` | Attendee/organizer registration demonstration |
| `forgot-password.html` | Password recovery request preview |
| `reset-password.html` | New-password validation preview |
| `profile.html` | Sample profile editing and password-change preview |
| `dashboard.html` | Organizer statistics and event management |
| `create-event.html` | Create, edit, draft, publish and archive sample events |
| `attendees.html` | Event-specific attendee search and CSV export |
| `admin.html` | Sample user, role and event administration |
| `help.html` | FAQs, contact preview, demo terms and privacy |

## Try the prototype

1. Search for Coffee, filter by category/date/price, save an event, and open Saved events.
2. Reserve Innovation Summit tickets. General is $25, student $15 and VIP $45; quantities are limited to available sample capacity and 10 per category.
3. Confirm with fictional attendee details. The same booking reference appears in My Bookings and the attendee list. Cancellation releases the sample capacity.
4. Open Manage events to create a draft, edit it, publish it locally, or archive it. Statistics use the same event records.
5. Try registration, demo sign-in, profile editing, recovery forms, admin controls, notifications and help.
6. Settings → Reset sample data restores the initial fixtures in that browser origin.

**Demonstrations:** Authentication, SSO, password changes, email, contact submission, payments, role permissions and reservations are simulated. No real account, credential, message, payment or ticket is created. Passwords are never stored or transmitted. Sample profiles, events, roles, saved IDs and bookings use browser-local storage, independently per origin. Use fictional information only.

The November 2026 dates, greeting and chart labels are approved **reference illustrations**. They remain visually unchanged. The old fixed-date business rule has been removed. Reference event eligibility now advances from a persisted Vancouver calendar anchor: career +8 days, coffee +10, summit +11, market +12, speaking +4, design −17. Reset sample data starts a fresh fixture scenario. Those displayed reference dates are not actual live-event dates.

New events and schedules changed in the editor use the actual entered calendar date/time in **America/Vancouver**. Impossible dates, nonexistent daylight-saving times, reversed ranges and past publishing are rejected; reservations stop at the event's logical start. Seeded aggregate allocations remain separate from the small individual booking list. The activity chart is reference fixture data; inventory/booking metrics derive from the shared records. Historical prices and category names are retained after edits/cancellation. Downloaded confirmations are invalid for real entry. Printing depends on the browser/OS.

## Demo identities and permissions

Use the existing sign-in form with a fictional password meeting the policy below:

- `alex@example.com`: attendee; cannot mutate organizer/admin data or export attendee lists.
- `priya@example.com`: organizer associated with the six seed events and legacy unowned sample events; manages only associated events/attendees.
- `sam@example.com`: administrator; can administer the sample roles/users/events.

This selects a local demonstration identity, without checking a real password. New/registered identities receive **Attendee** only. Choosing Organize events selects a preview continuation, not organizer permission. An administrator can change a sample role through the existing interface. Navigation and read-only fake-data overviews remain visible to preserve the approved design; action/ownership checks run in the data handlers. Client JavaScript/storage can be edited by the user and do not provide real security.

Names use 2–80 letters with normal name punctuation; whitespace is normalized. Email addresses are trimmed/lowercased and cannot impersonate another active or removed sample identity. The consistent password preview policy is **8–72 characters with a number**. Eight retains the approved hint/minimum; 72 adopts the original project's upper bound. No password is persisted or verified against an account.

Booking submissions have a stable per-pending-request identifier/signature, a UI submit lock and a persisted replay record. Matching retries reuse the saved reference; changed details create a distinct request. Local-storage errors roll back mutations and never produce a false confirmation. These are frontend safeguards, not multi-user/database concurrency guarantees.

Sensitive/demo forms use native non-navigating `method="dialog"` semantics plus an independent capture guard. Controllers mark forms ready only after successful initialization. This removes credential GET fallbacks without adding a backend or changing the layout.

## Design and architecture

[Figma reference](https://www.figma.com/design/R4uts93cpB94GfJPufj2mU/Untitled?node-id=0-1).

Six desktop frames cover discovery, reservation, bookings, sign-in, registration and the organizer dashboard. Actual contexts/renders and original SVGs were retrieved in the earlier successful Figma review. The final fresh read reached the Starter-plan call limit. Nine other pages extend the same system and are not claimed as exact Figma matches. Small contrast improvements, SessionSpot branding, truthful demo wording and live sample data are deliberate adaptations.

- `css/style.css`: reusable components, responsive layouts and print rules.
- `css/figma.css`: measured design styles, local Inter font and responsive extensions.
- `js/data.js`: fixtures, storage adapter, booking/inventory rules and statistics.
- `js/ui.js`: escaped rendering helpers and icon mapping.
- `js/exports.js`: independently tested CSV and confirmation content with historical names/prices.
- `js/validation.js`: shared names, email, password and search validation.
- `js/time.js`: Vancouver calendar/time rules, injectable clock and reference scheduling.
- `js/format.js`: pure shared currency formatting.
- `js/form-guard.js`: controller-independent, non-navigating form protection.
- `js/app.js`: page controllers, DOM events, validation and demo actions.
- `assets/`: local assets and Inter's font license.

For Part 3, replace local persistence and demo controllers with validated PHP endpoints, authenticated server sessions/roles, MySQL queries and transactions for reservation inventory. Add server validation and CSRF protection. The current UI and form names provide integration boundaries; browser role controls are not authorization.

## Verification and submission

```sh
node --test tests/data.test.mjs tests/exports.test.mjs tests/improvements.test.mjs
python3 tests/static_audit.py
```

Node 22+ and Python 3 are needed only for these development checks. `FINAL_PART2_AUDIT.md` gives the final status; `TEST_REPORT.md` lists verification and limits. Compact current observations are in `qa/improvements/`; browser JSON files are evidence, not a standalone browser automation runner. `tests/scenario_server.py` is an optional loopback-only static harness for scripts-blocked, failed-initialization and storage-failure scenarios; it is not an application backend. Its baseline-comparison route needs the separately retained approved extraction, which is intentionally excluded from the ZIP.

`scripts/package_submission.py` creates and verifies `submission/SessionSpot-Part2-Functional-v2.zip` with a SHA-256 manifest and refuses to overwrite an existing ZIP. Choose a new `--output` filename for another release. The approved recovery archive `submission/SessionSpot-Part2-Submission.zip` remains unchanged. Pass-critical checks are recorded in the current audit and test report. Backups, caches, design-context exports and screenshots are intentionally excluded. The workspace retains the recoverable original team files and full visual evidence separately. Nothing is submitted to Moodle automatically.
