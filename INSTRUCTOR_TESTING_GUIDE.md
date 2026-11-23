# SessionSpot Part 2 — Instructor testing (Functional v3)

Preview: **http://localhost:8001/index.html**. If necessary, run `python3 -m http.server 8001` from the extracted project folder, then open that URL. Keep the same browser and origin throughout a workflow.

## Roles and navigation

This is a browser-local UI simulation. Sign-in selects a sample identity; it does not verify a password. Use a made-up policy-valid password such as `DemoPass123`. Passwords are never saved. Roles and localStorage are not secure authorization or server persistence.

| Identity | Role | Sign-in destination |
| --- | --- | --- |
| `alex@example.com` | Attendee | My Bookings |
| `priya@example.com` | Organizer of the six reference events | Organizer dashboard |
| `sam@example.com` | Admin | Separate admin interface |

Registration offers Attend events and Organize events. Both create a sample **Attendee** initially. Attendee registration continues to My Bookings. Organizer interest explains the role requirement and links to sign-in: use Priya for immediate organizer testing, or use Sam's admin interface to explicitly assign Organizer to the newly registered sample user, then sign in again with that user's email. Registration never self-grants organizer/admin access.

| Pages | Route through the UI |
| --- | --- |
| `index.html`, `event.html`, `reserve.html`, `confirmation.html` | Discover → event details → Reserve tickets → Confirm demo reservation |
| `my-bookings.html` | My bookings → Upcoming / Past / Cancelled → booking details |
| `login.html`, `register.html` | Demo sign in / Create an account |
| `forgot-password.html`, `reset-password.html` | Forgot password → sample reset link; validation only |
| `profile.html` | Settings / account link |
| `dashboard.html`, `create-event.html`, `attendees.html` | Manage events → Create / Manage → Attendees |
| `admin.html` | Demo admin footer link; mutation handlers require simulated Admin |
| `help.html` | Help & support, terms, privacy and reset-sample-data control |

## Complete instructor flow

1. Register a unique sample email with **Organize events**. Confirm password and accept the demo terms. The success message explains that the initial role is Attendee.
2. Follow **Sign in to organizer demo**. Sign in as Sam, find the new user's row in **Users & roles**, choose Organizer and click its Save button. Sign in again as the registered user. Alternatively sign in as Priya to use the existing organizer fixtures.
3. Open **Create event**. Enter a title, description, venue, organizer, a date in the future and a valid same-day time range, interpreted in America/Vancouver. Choose Draft.
4. Choose **Choose an event poster** in the existing Event details description. Select a PNG, JPEG or WebP up to 1 MB and 20 million pixels. Check the preview, choose **Use this poster**, then save the event. Cancel discards the dialog's changes. **Use default poster** followed by **Use this poster** and saving removes custom artwork. Nothing is uploaded to a server; browser storage limits still apply.
5. Set General admission to **CAD 12.50**, capacity **8**. Add a Free student ticket at **CAD 0**, capacity **4**. Up to five distinct categories are supported. Capacity cannot fall below existing allocations. Save; select **Drafts** on the dashboard to find the event.
6. Manage the draft, change Status to Published and save. The published future event becomes discoverable and reservable. Existing CSS poster frames are reused; no Figma frame or layout is replaced.
7. Register another unique sample user with **Attend events**, then continue to My Bookings. Discover the event by its title. Reserve two General admission tickets and one Free student ticket. Check **CAD 25.00**, zero booking fee and **Pay at venue** messaging. With only free tickets selected, the payment note says no payment is required in the simulation. No online payment or real ticket allocation occurs.
8. Confirm the demo reservation. Check its reference, quantities and total. Follow **View my bookings**. The reservation appears under Upcoming with the same reference; reload to check browser-local persistence.
9. Choose **Cancel reservation**, confirm, and select Cancelled. History retains the reference and historical sample value. Reopen event details: all eight paid and four free places are available again. A second cancellation cannot release stock again.
10. As an Attendee, open Demo admin and try saving a role: the action is denied. Organizer actions are limited to associated events. These are simulated handler checks, not a privacy/security boundary; demo administration remains inspectable.

Use Help's **Reset sample data** only when you want to discard that origin's sample changes. The unchanged reference events use their existing relative eligibility window while displaying the approved November 2026 artwork dates; use a newly created future-dated event for unambiguous testing. The dashboard activity chart remains a seeded reference illustration, not live per-user analytics. Its event metrics and booking records are browser-local.

## Initial audit and changes in this version

| Feature | Initial status | Action |
| --- | --- | --- |
| Poster selection and preview | MISSING | Added dialog-based selection, validation, preview, save/reopen, cancellation and removal |
| Ticket types, CAD prices, capacity, free support | WORKING | Preserved existing editor and booking logic |
| Pay at venue messaging | PARTIAL | Clarified the existing payment note, updating for paid/free selections |
| Registration and role navigation | PARTIAL | Replaced misleading dashboard continuation with explicit sign-in/approval guidance; account labels now show the current simulated role |
| Separate admin and restrictions | WORKING | Preserved existing interface, approval and mutation checks |
| Full instructor workflow | PARTIAL | Clarified the handoff and verified the complete registered-user workflow above |

Modified runtime files: `js/app.js`, `js/data.js`, `create-event.html`; all 15 HTML pages also receive the new controller cache version. Added `js/poster.js` and `tests/instructor.test.mjs`. Updated `README.md` to point to this guide and `scripts/package_submission.py` to include the guide and compact verification evidence. Existing tests, both CSS files and all 21 asset/font/license files remain unchanged. The earlier audit documents and QA results describe the approved Functional v2 baseline; this guide and `qa/instructor/` describe v3. The exact modified baseline filenames are recorded in `qa/instructor/source-preservation.json`.

## Verification and Part 3 boundary

Results are recorded in `qa/instructor/results.json` and `qa/instructor/layout-regression.json`: **62 automated tests, 34 browser checks, six geometry pairs, nine JS syntax checks and the 15-page static audit pass, with no remaining failure or browser console warning/error**. The original 56 tests remain unchanged; six targeted tests were added. The static audit resolves 440 local HTML references. Desktop/mobile geometry of the affected editor, reservation and registration pages is compared at 1440 and 390 CSS pixels against the v2 archive; no full pixel rerun was needed because the CSS/assets are unchanged. Live browser checks cover both registration interests, explicit admin approval, role routes, poster preview/persistence/removal, draft/publication, paid/free selection, reservation, My Bookings, reload, cancellation and restricted admin actions.

No required frontend workflow is left incomplete. Poster dimensions/size are deliberately bounded; storage denial/quota errors abort saving without partial changes. The browser-local demonstration has no real uploads, secure sessions, password storage, permanent server persistence, multi-user stock protection, online payment, email or institution SSO. PHP/MySQL, server-side authorization, durable file storage and validation, real reservation transactions, account verification/recovery and any payment integration are deferred to Part 3. Cross-browser and new OS-level print/download delivery were not repeated in this targeted pass.

New submission: `submission/SessionSpot-Part2-Functional-v3.zip`; adjacent verification JSON records its checksum, CRC, extraction, hashes and portable relative references. Both previous verified ZIPs remain recovery copies.
