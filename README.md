# SessionSpot V1 — COMP 3540 Part 2

Team G13 · Advanced Web Design and Programming. SessionSpot is a real PHP/MySQL event-registration and ticket-reservation application, with 15 HTML5 pages, reusable CSS and vanilla JavaScript/Fetch. It is not a static frontend or browser-local account simulation.

## Features and accounts

Every individual account can browse/reserve tickets, manage personal bookings, create personal events and edit a profile. A business/organization account is a real person plus an owned organization profile. Categories cover companies, education/universities, nonprofits, community organizations, government/public institutions and Other. Owners can publish organization events immediately; organizations are not automatically verified. One owner per organization is supported.

Events support drafts/publication, validated posters, venues/addresses, Vancouver dates/times, free/priced CAD ticket types and capacities. Reservations use server-calculated prices, InnoDB row locks, transactions and idempotency. Cancellation releases inventory exactly once and preserves history. Organizer/attendee/admin views use the same database records. Admin accounts are provisioned privately, with server-side authorization and moderation controls. No online payment is collected: priced reservations show payment due at venue.

## Install or launch

Unpack `SessionSpot-V1-Fullstack-Final.zip`. Start XAMPP Apache and MariaDB/MySQL, create a **new dedicated database**, import `schema.sql`, and configure `server/config.local.php` from the safe example. Follow [DATABASE_SETUP.md](DATABASE_SETUP.md) for permissions, admin provisioning and troubleshooting.

On the supplied Mac, an optional isolated XAMPP launcher avoids changing existing XAMPP databases:

```sh
python3 scripts/start_local.py
```

It prints the actual local URL; the default is `http://localhost:8080/Faisal/projecPart2/index.html`. Python launches XAMPP binaries; it does not serve PHP. For standard Apache on another computer, the URL depends on that computer's port and htdocs folder, for example `http://localhost/SessionSpot/index.html`. **The developer's localhost is not remotely accessible to the instructor.** No Node/build framework is required to run the app.

A fresh database is empty. Register your own account and create an event. Optional, clearly labeled educational sample events can be added after registration with `scripts/seed_samples.php`; they are not actual third-party events. Automated test fixtures are separate and must never be inserted into the instructor database.

## All 15 webpages

| Page | Purpose |
| --- | --- |
| index.html | Public discovery, search/filters, saved events and calendar view |
| event.html | Event details, prices and availability |
| reserve.html | Quantities, attendee details and reservation confirmation |
| confirmation.html | Saved reference, totals, download/print and cancellation |
| my-bookings.html | Personal upcoming/past/cancelled bookings |
| login.html | Real credential sign-in |
| register.html | Individual or conditional organization registration |
| forgot-password.html | Secure reset-email request; delivery requires configuration |
| reset-password.html | Single-use recovery-token password reset |
| profile.html | Profile/password and organization editing |
| dashboard.html | Owned event statistics and draft/published/cancelled management |
| create-event.html | Event/poster/ticket creation, editing and publication |
| attendees.html | Authorized attendee list/search and CSV export |
| admin.html | Authorized users, organizations, events and booking oversight |
| help.html | Reservation/account/payment guidance and configured contact service |

## Structure and design

- `api/index.php`: JSON/session/CSRF boundary and protected poster delivery.
- `server/`: shared PDO, validation, authentication/authorization and domain helpers; local config excluded from Git/releases.
- `js/`: production controllers, API adapter, formatting/validation and UI helpers. PHP/MySQL is the source of truth; no offline identity/booking fallback exists.
- `css/`, `assets/`: approved design styles, local Inter font/license, SVGs and icons.
- `schema.sql`: ten InnoDB tables, keys/indexes, unique email/reference/idempotency constraints; no accounts or bookings seeded.
- `storage/posters/`: protected writable image storage; private uploaded files are not shipped.
- `scripts/`: XAMPP startup, private admin/recovery, optional sample seeding and allowlisted final-release creation.
- `tests/`: maintained verification tools. The development checkout also retains historical local-state fixtures under protected tests, never as application JavaScript or in this release.
- Four main documents: this README, DATABASE_SETUP, INSTRUCTOR_TESTING_GUIDE and TEST_REPORT.

[Figma design reference](https://www.figma.com/design/R4uts93cpB94GfJPufj2mU/Untitled?node-id=0-1). Six original frames map to index (2:2), register (2:238), login (2:240), reserve (2:242), dashboard (2:307) and my-bookings (2:372); nine other pages extend that system. Both stylesheets, all fonts/SVGs/icons and component styling are preserved. Live data, conditional organization fields and removal of fake SSO/obsolete demo text are intentional functional differences. Decorative ticket text is undated. Exact pixel parity is not claimed; no new Figma extraction was performed for final cleanup.

## Limits and future work

Outbound password-reset/support mail needs a configured, tested relay. Unavailable delivery reports a genuine error; private CLI recovery is available. No institutional SSO, insecure remember-me or online gateway is offered. Use HTTPS, backups and operational monitoring before public deployment. Future work may include verified organizations, team invitations, integrated payments and mail-provider integration.

See [INSTRUCTOR_TESTING_GUIDE.md](INSTRUCTOR_TESTING_GUIDE.md) for acceptance steps and [TEST_REPORT.md](TEST_REPORT.md) for executed PASS/FAIL/NOT TESTED results. Historical reports, screenshots, backups and prior ZIPs are preserved in a private development archive outside the active application. No Git history is rewritten and no commit, GitHub push or Moodle submission is performed automatically.
