# SessionSpot page index

Exactly 15 application HTML pages are retained. All have been rebuilt and visited in the browser. Six pages have been inspected and compared against actual Figma frames; the other nine are documented extensions with no corresponding frame.

| File | Function | Presentation source |
| --- | --- | --- |
| index.html | Discovery, search/category/date/price filtering, saved events, calendar list, booking preview | Actual Figma node 2:2 |
| register.html | Attendee/organizer segmented signup, confirmation/terms validation, demo continuation | Actual Figma node 2:238 |
| login.html | Demo sign-in, remembered UI mode, SSO preview, account recovery links | Actual Figma node 2:240 |
| reserve.html | Event-aware ticket categories, +/- quantities, bounds, attendee fields, totals, demo booking | Actual Figma node 2:242 |
| dashboard.html | Four derived KPIs, activity chart, next event, searchable published/draft management, export action | Actual Figma node 2:307 |
| my-bookings.html | Upcoming/past/cancelled tabs, search, selected details, download and cancellation | Actual Figma node 2:372 |
| event.html | Selected event, poster, date/time/location, prices, availability and reservation link | Workspace extension |
| confirmation.html | Matching booking reference, attendee/items/amount, print/download controls and cancellation | Workspace extension |
| forgot-password.html | Validated email, honest simulated request, visible sample reset link | Split-auth extension |
| reset-password.html | Password length/number/confirmation validation and simulated completion | Split-auth extension |
| profile.html | Local sample profile edit, password validation preview, role-workspace links, data reset | Workspace extension |
| create-event.html | Create/edit/publish/draft sample events, multiple ticket categories, price/capacity validation, archive | Workspace extension |
| attendees.html | Event selection, attendee search, linked booking references and CSV action | Workspace extension |
| admin.html | Local demo role changes, recoverable sample user removal, event archive/restore | Workspace extension |
| help.html | FAQ disclosures, demo contact validation, terms/privacy explanations | Workspace extension |

## Routing

- Event pages use `?event=summit`, `career`, `coffee`, `market` or an ID from a newly created sample event.
- Confirmation and booking selection use `?booking=SS-20512` or another stored sample reference.
- Discovery supports `?q=coffee`, `?view=saved` and `?view=calendar`.
- Bad event/booking IDs show an explanatory state with a route back to discovery.
- No form submits to a PHP endpoint. Global search uses the existing index page.
- All pages are reachable through the main navigation, footer, account flows or event/booking actions. Documentation, screenshots and backups are not additional web pages.
