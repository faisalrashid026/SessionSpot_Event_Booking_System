# SessionSpot functional v2 — test report

November 23, 2026. Current results supersede the approved baseline's earlier totals; the original verified ZIP remains unchanged.

## Automated verification

`node --test tests/data.test.mjs tests/exports.test.mjs tests/improvements.test.mjs`: **56 passed, 0 failed**. The original 16 tests remain intact; 40 new tests cover search, invalid categories/quantities, duplicate requests/replay, mixed cancellation, storage quota/denial and rollback, roles/ownership/lifecycle, capacity/identity preservation, historical prices/names, profile/password rules, invalid dates/times, DST and the relative fixture clock.

`python3 tests/static_audit.py`: passed. Exactly 15 root application pages, one main landmark, English language, unique static IDs, focusable skip destinations, 439 resolving HTML references, independent guards and native-safe sensitive forms. Sensitive inputs require dialog-method demo forms; submitter overrides and credential GET fallbacks are rejected. Eight `node --check` syntax checks pass. `automated-results.json` retains actual stdout/exit codes.

## Browser checks

- **74/74 interactions pass**: search and combined filters, saved/calendar navigation, quantities and $110 mixed totals, double-click/replay deduplication, history/cancellation and restored inventory, profile normalization/carryover and friend details, account/recovery validation, role denials and authorized actions, own/foreign event rules, five-category editing, duplicate names, capacity floors, real-time publishing, archive/restore, attendee search, export triggers, FAQ/contact/notifications and keyboard/mobile navigation.
- **75/75 page/viewport checks pass**, all 15 pages at target widths 1440, 1024, 768, 390 and 375. Fonts/images load, one h1, initialized forms and no document horizontal overflow. Table/nav scrolling remains contained. A resource-load check was synchronized to network idle after a transient incomplete-image observation.
- **15/15 skip links pass** real Tab visibility/outline and Enter focus transfer.
- **12/12 native-form/fault cases pass**, covering six forms with all scripts blocked by CSP and with a deliberate controller exception. All fields were natively valid. Both click and Enter were tested: **24 safe submission paths**, no credential query fields and no POSTs. The engine's global JS setting was not changed. Fault-mode console errors are intentional and separate from the normal console record.
- Normal browser sweep: **0 errors/warnings**. Fault scenarios retain their expected console entries; no global zero-console claim includes deliberate failures.

Sensitive input values are redacted by the browser tool. Profile email normalization was therefore verified through visible sample records and a real demo confirmation, and password error retention through non-empty controls/feedback, supplemented by direct validation tests. Earlier assertions comparing redacted field strings were corrected; no product failure remained.

## Visual regression

**45/45 exact decoded-pixel comparisons pass**, all 15 pages at desktop 1440, tablet 768 and phone 390 widths. Current final controller: `9678db2751`. Six reference-screen captures use the approved 1440 × 1320/1160 frame dimensions. Screenshot rows were recaptured where resource timing or raster capture initially differed; no visual code change or tolerance relaxation was made.

All 15 normalized presentation trees match the approved ZIP. Both CSS files and all 21 local asset/font/license files are unchanged. Full screenshot pairs live under `qa/improvements/screens/`, outside the ZIP. `pixel-regression.json`, `visual-regression.json` and `presentation-integrity.json` record evidence. No literal new live-Figma comparison is claimed in this functional-only pass.

## Export, scope and packaging limits

CSV/booking content tests pass, including formula-leading cells without data loss, quotes/newlines, cancelled/free values and historical snapshots. Authorized browser export handlers were clicked and prepared-file feedback verified. New OS download delivery and print output were not independently certified in this pass; the approved baseline had delivered-file verification. Safari/Firefox, complete WCAG/screen-reader certification and real database concurrency remain outside the executed checks.

**PASS — stable for the supplied Part 2 UI requirements.** The release-candidate extraction passed 15/15 page checks and 6/6 integration checks, with a clean console. Its runtime fingerprint is `0b2489c00e6684eaefbfc7e5b8d25bcccd50853184ec69b5522b431dc3edecb0`.

The new separately named archive is `submission/SessionSpot-Part2-Functional-v2.zip`. Its final CRC, safe/unique entries, exact allowlist, extraction, all file hashes and 452 HTML/CSS/module references are verified by the package script. Its runtime must match the independently browser-tested extraction byte for byte. The adjacent `SessionSpot-Part2-Functional-v2-verification.json` records the final checksum/file count. The approved `SessionSpot-Part2-Submission.zip` remains untouched. Backups, screenshots, reference copies, caches, request logs, temporary release-candidate pointers and nested ZIPs are excluded. No Moodle submission was made.

Browser JSON files are actual observations, not a standalone browser runner. Use `tests/scenario_server.py` only as the loopback static QA harness. It injects fault conditions into responses without changing runtime files or adding an application backend.
