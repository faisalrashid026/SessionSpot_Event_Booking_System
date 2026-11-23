# SessionSpot Part 2 — functional v2

November 23, 2026 · COMP 3540 · Team G13. Work was confined to `projecPart2`; the original project was read only. The approved ZIP is preserved with SHA-256 `9c2902107dec53efd79422ade512a7054f0a152bd6f4b8737f0cc8b45f4aa070`. Its extracted files were used as the comparison baseline. No Figma file, CSS, typography, spacing, dimensions, background, SVG or font asset was edited.

## Status of the 11 improvements

| # | Status | Implemented behavior |
| --- | --- | --- |
| 1 | Completed | Case-insensitive, whitespace-normalized search includes titles, descriptions, organizers, locations and venue fields, combined with existing category/date/price filters, saved events and calendar. |
| 2 | Completed | Whole, non-negative 0–10 quantities, at least one ticket, valid category identities, per-category stock, eligible published/future events and valid attendee details are checked before mutation. Mixed orders and historical totals remain. |
| 3 | Completed | A pending identifier/signature, synchronous UI lock and persisted submission record prevent duplicate allocation. Matching replays reuse the saved reference; mismatched payloads under an identifier are rejected. A confirmation is returned only after storage succeeds. |
| 4 | Completed | Only confirmed, authorized, not-yet-started reservations can be cancelled. Status/history, reference, items, prices and names remain. Every category is restored once; repeat cancellation does not restore it again. Organizer cancellation uses the same existing controls. |
| 5 | Completed | Drafts stay out of public discovery and booking; authorized draft previews have no reservation link. Archived URLs cannot book. Restore respects the prior draft/published state and time eligibility. Management views update from the same records. |
| 6 | Completed | Editor capacity cannot fall below allocated/confirmed stock; increases recalculate availability. Existing category IDs cannot be replaced/removed, duplicate names/IDs are rejected, and five categories remain supported. Aggregate fixtures do not become fabricated attendee records. |
| 7 | Completed | Shared full-name/email normalization, uniqueness and required-field rules; one 8–72-character/digit password policy; matching confirmation and truthful reset/profile previews. Invalid forms retain values; successful profile updates carry into editable friend/attendee fields. |
| 8 | Completed | Active demo identity, role and event ownership are checked inside mutation/export handlers. Attendees cannot perform organizer/admin actions; organizers are restricted to associated events/attendees. Admin changes persist; current/last-admin protections preserve coherence. Registration cannot self-grant a privileged role. |
| 9 | Completed | Valid calendar dates, ordered time ranges and Vancouver/DST conversion. New/changed schedules use actual time and cannot be newly published in the past. The fixed November 10 business-clock dependency is gone; a persisted relative fixture schedule preserves approved reference dates while allowing expiry and usable sample events. |
| 10 | Completed | Mutations validate a clone, persist first, then reconcile memory. Quota/denied-storage failures throw, keep the last valid state, do not allocate stock and never navigate to a false confirmation. Booking, cancellation, event, profile and role rollback paths are covered. |
| 11 | Completed | Sensitive forms have native non-navigating semantics and a separate controller-independent guard. Native GET credential submission is removed, even without initialized handlers. Both mouse and Enter were exercised with all page scripts blocked and with an intentional initialization exception. |

The password minimum remains eight to preserve the approved visible hint and input policy; the original project's 72-character maximum was adopted. All role checking is a local simulation. Seed-email sign-in selects a demo identity; it is not real authentication. Read-only mock overviews/navigation remain visible, with protected action handlers rather than a redesigned access UI.

## Date and data semantics

Reference dates, greeting and chart remain the approved illustration. Known fixtures get a persisted local anchor and offsets: career +8, coffee +10, summit +11, market +12, speaking +4 and design −17 days. Actual time advances against that anchor, so fixtures expire instead of depending on a fixed 2026 comparison date. Reset re-anchors a fresh scenario. New or changed event schedules use the actual entered date and Vancouver time. This exception applies only to unchanged reference fixtures; it is not a claim that those displayed November dates are real live events.

Aggregate ticket allocations retain their own counts/prices. Individual booking snapshots retain their booked prices/names after current ticket edits. Cancelled amounts are labelled historical sample values. No individual attendee records were invented to account for aggregates.

## Executed verification

| Check | Passed | Failed |
| --- | ---: | ---: |
| Automated tests: original 16 plus 40 new behavior tests | 56 | 0 |
| Browser interaction checks | 74 | 0 |
| Page/viewport checks: 15 × five widths | 75 | 0 |
| Keyboard skip-link checks | 15 | 0 |
| Baseline pixel comparisons: 15 × three widths | 45 | 0 |
| Native form/scenario cases: six forms × two fault modes | 12 | 0 |

All 24 native mouse/Enter paths used valid native fields and remained non-navigating. The disabled-script scenario uses browser-enforced CSP blocking **all page scripts**; the browser's global JavaScript preference was not toggled. The failed-initialization scenario deliberately throws before the controller initializes. Expected fault-console entries are retained separately from the clean normal-console sweep. No sensitive query requests or POST submissions were found in the QA server log.

The final screenshot captures use controller version `9678db2751`. All 45 pairs are exact decoded-pixel matches, including six Figma-reference screens and nine extensions. All 15 presentation trees are unchanged after excluding permitted form/script attributes. Both CSS files and all 21 local asset/font/license files match the approved archive byte for byte. No new Figma read or edit was needed; this is approved-baseline regression verification, not a new Figma-parity claim.

The structural audit passes with 439 local HTML references and native-safe sensitive forms; all eight JavaScript files pass syntax checks. See `TEST_REPORT.md`, the compact `qa/improvements/*.json` records and `CHANGED_FILES.md`. Full screenshots/reference extraction remain in the working folder and are excluded from the submission.

**PASS — stable for the supplied Part 2 UI requirements.** The release-candidate extraction passed 15/15 page checks and 6/6 integration checks, with a clean console. Its runtime fingerprint is `0b2489c00e6684eaefbfc7e5b8d25bcccd50853184ec69b5522b431dc3edecb0`.

The new separately named archive is `submission/SessionSpot-Part2-Functional-v2.zip`. Its final CRC, safe/unique entries, exact allowlist, extraction, all file hashes and 452 HTML/CSS/module references are verified by the package script. Its runtime must match the independently browser-tested extraction byte for byte. The adjacent `SessionSpot-Part2-Functional-v2-verification.json` records the final checksum/file count. The approved `SessionSpot-Part2-Submission.zip` remains untouched. Backups, screenshots, reference copies, caches, request logs, temporary release-candidate pointers and nested ZIPs are excluded. No Moodle submission was made.

## Limits and Part 3 boundary

No requested feature was deferred for visual reasons. Browser download/print handlers and CSV/confirmation contents were rechecked; new OS-level download delivery/print output and Safari/Firefox were not certified in this pass. The approved audit previously verified delivered exports. The native script-off test uses CSP, as described above. Full assistive-technology certification is not claimed.

JavaScript roles, request identifiers and localStorage are not secure authentication, database transactions, permanent persistence or multi-user concurrency protection. Real identity/session/authorization checks, password hashing/recovery, mail, payments, MySQL queries/constraints and transaction-based reservations belong in Part 3. Nothing was submitted to Moodle.

Native fallback behavior follows the [HTML form submission algorithm](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-algorithm): a dialog-method form without a dialog ancestor does not navigate.
