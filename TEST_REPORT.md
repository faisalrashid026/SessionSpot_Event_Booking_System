# SessionSpot V1 Final — Verification report

COMP 3540 · Team G13. This finalization preserves the working PHP/MySQL application, consolidates documentation and verifies a clean, independently configured release. It does not count historical results as freshly executed tests.

## Executed final verification

| Check | PASS | FAIL | Scope |
| --- | ---: | ---: | --- |
| Real backend acceptance | 39 | 0 | Independent XAMPP/PHP/MariaDB verification application |
| Security/concurrency/durability follow-up | 21 | 0 | Same isolated verification instance; actual database outage/restart |
| Current reservation/CSV export tests | 8 | 0 | Tests shipped in the clean release |
| Development regression tests | 65 | 0 | Source checkout, including protected historical fixtures |
| Browser workflows after cleanup | 15 | 0 | Real login, booking/history/cancellation, admin access, forms and error feedback |
| Page/render checks | 30 | 0 | All 15 pages at 1440 and 390 CSS pixels |
| Keyboard skip-link checks | 15 | 0 | Every page's link focuses its main region |
| Static page/dependency audit | PASS | 0 | 15 pages, focusable main regions, unique static IDs and relative dependencies |
| Optional sample seed | PASS | 0 | Two labeled samples created in verification DB; repeat creates none |
| Instructor-database fixture guard | PASS | 0 | Test tools refuse the clean instructor database |
| Original CSS/assets preservation | 23 files | 0 | Both stylesheets and 21 font/icon/SVG/license assets unchanged |

The HTTP suites operate on real PHP/PDO/MariaDB records, not local mocks. They verify individual registration, unique emails, actual password hashing/verification, logout/new-session login, persistent profile updates, invalid input rejection, organization creation/ownership/editing/unverified status, personal and organization events, draft privacy, poster storage/delivery, publication and cross-user discovery.

Reservations are tested with mixed paid/free tickets, server-calculated totals, unique references, matching idempotent retries, changed-request rejection and invalid quantities/categories. Simultaneous requests for the last ticket yield one success and one inventory rejection. Simultaneous identical submissions allocate once. Cancellation restores each category once while retaining historical names/prices. Event cancellation releases all allocations; restoration does not revive cancelled bookings.

Administration is provisioned through the private CLI. Tests cover ordinary-user/foreign-event/foreign-booking denial, admin listings, account and organization suspension/reactivation, session invalidation, CSRF and cross-site-origin rejection, HttpOnly/SameSite cookies and protected configuration/Git/storage paths (including an encoded Git path). Secure recovery tokens are single-use, old credentials are rejected after rotation, and password changes revoke prior sessions. A controlled shutdown of only the isolated verification MariaDB yields genuine 503; restart preserves records. No instructor/development database is reset by tests.

Browser checks used the independent verification application and tested actual credentials, a server-calculated CAD 12.50 booking, My Bookings after reload, cancellation/history and restored paid/free capacities, logout and admin access. The mobile conditional organization form remains usable. Normal browser checks produced no warnings/errors. The deliberately unavailable mail request produced its expected 503 and accurate error feedback. One initial booking-list probe ran before asynchronous loading completed; the settled-state rerun passed.

## Commands and reproducibility

Run acceptance suites only in a **fresh disposable verification extraction**, never the instructor/developer instance:

```sh
python3 scripts/start_local.py --port 8081 --database sessionspot_verify_final --base-path /SessionSpot
export SESSIONSPOT_APP_ROOT="$PWD"
export SESSIONSPOT_TEST_URL="http://localhost:8081/SessionSpot"
python3 tests/backend_api.py
python3 tests/stability_v1.py
node --test tests/exports.test.mjs tests/v1_exports.test.mjs
python3 tests/static_audit.py
```

The suites create their own random test credentials privately in that extraction's ignored `.local/`. The helper checks the matching URL/socket and requires a `sessionspot_verify_*`/`sessionspot_test_*` database before permitting fixture operations. The stability suite stops/restarts **only that isolated MariaDB instance**. Node 22+ is optional for JavaScript tests, not application execution. In the development checkout, `node --test tests/*.test.mjs` also exercises historical fixtures; those fixtures are protected under tests and omitted from this release's production JavaScript/package.

A clean allowlisted staging directory is used for packaging. The final ZIP is extracted into a new temporary renamed folder, configured independently on another port, and checked with a fresh schema/database and the real backend suites again. CRC, safe unique entries, extracted hashes, PHP syntax, relative HTML/CSS/JS dependencies, exactly 15 pages/four main documents and absence of secrets/data are verified. The adjacent final-release verification JSON records the artifact checksum, file count, size and independent-extraction results. Raw working evidence is kept in the private external development archive, not in the ZIP.

## Cleanup and database presentation

A private recovery backup outside the active directory preserves the source, Git history/configuration and a consistent snapshot of only the configured SessionSpot development database. All four earlier ZIPs retain their original hashes. Redundant Markdown reports, generated QA images/reports, duplicate baseline copies, old backups and obsolete tools are archived externally. Important page/design/setup/security/testing information is consolidated into README, DATABASE_SETUP, INSTRUCTOR_TESTING_GUIDE and this report. The obsolete local-state module is a protected historical test fixture, never an application import. Confirmation exports always describe real reservations.

All five identified automated development events and every related source record were preserved; no genuine user record was deleted. A separate instructor database was initialized empty; subsequent non-fixture user accounts are preserved. No automated events or bookings are inserted there. Optional sample events are explicitly labeled educational examples, dated relative to seeding and use coherent CAD prices/capacities. No samples, users, passwords or bookings are inserted automatically. Tests use separate isolated databases and never instructor sample data.

The six Figma-derived screens and nine consistent extensions retain their original styles, fonts, SVGs and components. Obsolete fixed demo dates were removed from decorative HTML ticket text without changing styles/dimensions. No Figma extraction or unnecessary pixel-comparison audit was repeated. Exact pixel equality is not claimed for live data/functional copy differences.

## NOT TESTED / limits and readiness

- Outbound reset/support email is **UNCONFIGURED / NOT TESTED**. The failure path is tested and truthful; private CLI/token recovery is documented. Configure/test a relay before enabling delivery.
- Online payments are **OUT OF SCOPE**. CAD reservations remain due at venue; no booking is falsely marked paid.
- Other browser engines, an OS browser-process restart, new OS print/download delivery and external HTTPS deployment are **NOT TESTED in this pass**. Fresh HTTP sessions, page refresh and actual database restart are tested. Export contents and existing handlers are preserved.
- Full production security certification and exact Figma pixel parity are **NOT CLAIMED**. Public deployment requires HTTPS, backups, monitoring and correct host permissions.

The supplied Part 2 technical requirements are met with these documented configuration/testing limits. The final ZIP is ready for manual Moodle upload after the final extraction checks complete successfully; no Moodle submission is performed. Git history remains intact with uncommitted local changes; no commit or GitHub push is performed automatically. The prior V1 results (57 backend, 33 browser, 30 responsive, 65 JavaScript) remain archived historical evidence rather than being substituted for this verification.
