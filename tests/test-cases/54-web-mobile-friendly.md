# Test Cases — 54 Web and mobile friendly

| | |
|---|---|
| **Story** | [`stories/54-web-mobile-friendly`](../../../stories/54-web-mobile-friendly/story.md) |
| **Spec** | [`specs/54-web-mobile-friendly`](../../../specs/54-web-mobile-friendly/spec.md) |
| **Area** | Platform |
| **Priority** | P4 |
| **Endpoints** | None — this is a front-end requirement |
| **Implementation** | [`frontend/src/app/pages/`](../../../frontend/src/app/pages/) — 6 standalone Angular components |

## Scope

Six routes make up the whole application:

| Route | Page | Heaviest element |
|---|---|---|
| `/` | Dashboard | Three data tables |
| `/customers` | Customers | Create form plus a table |
| `/customers/:id` | Customer detail | Edit form, note form, history table |
| `/tickets` | Tickets | Create form, four filters, a table |
| `/tickets/:id` | Ticket detail | Status buttons, assign, escalate, category/priority selects, AI panel, internal notes |
| `/knowledge-base` | Knowledge base | Search box and chat box |

The recent commits mention responsive work, so these cases verify the result rather than assume
it is absent. Test at three widths: **375 px** (phone), **768 px** (tablet) and **1440 px**
(desktop).

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-54-001 | A viewport meta tag is present | Positive | P4 | The app served | — | 1. Inspect `index.html`. | A `<meta name="viewport" content="width=device-width, initial-scale=1">` is present. Without it every other case here fails automatically, so run this first. | Not Run |
| TC-54-002 | The dashboard is usable at 375 px | Positive | P4 | `SEED-BASE` | — | 1. Open `/` at 375 px. | All three tables are reachable, no text is clipped, and the page does not scroll horizontally as a whole. | Not Run |
| TC-54-003 | The customers page is usable at 375 px | Positive | P4 | `SEED-BASE` | — | 1. Open `/customers` at 375 px. | The create form fields stack rather than sitting side by side, the search box is full width, and the table is reachable. | Not Run |
| TC-54-004 | The tickets page is usable at 375 px | Positive | P4 | `SEED-BASE` | — | 1. Open `/tickets` at 375 px. | The create form and all four filter controls are reachable and operable without zooming. | Not Run |
| TC-54-005 | The ticket detail page is usable at 375 px | Positive | P4 | A ticket with messages and history | — | 1. Open `/tickets/:id` at 375 px. | Every control is reachable: the status buttons, the assign field, the escalate field, both selects, the AI buttons and the internal-note form. This is the densest page — expect problems here first. | Not Run |
| TC-54-006 | The customer detail page is usable at 375 px | Positive | P4 | A customer with notes and history | — | 1. Open `/customers/:id` at 375 px. | The edit form, the note textarea and the history table are all usable. | Not Run |
| TC-54-007 | The knowledge base page is usable at 375 px | Positive | P4 | `SEED-KB` | — | 1. Open `/knowledge-base` at 375 px. | The search box and the chat input are full width and the results list is readable. | Not Run |
| TC-54-008 | No page scrolls horizontally | Edge | P4 | `SEED-BASE` | — | 1. At 375 px, on each of the six pages, check `document.documentElement.scrollWidth` against `clientWidth`. | They are equal on every page. A wider `scrollWidth` means something is overflowing — identify the element. | Not Run |
| TC-54-009 | Wide tables scroll within their own container | Edge | P4 | `SEED-BASE` with long ticket subjects | — | 1. At 375 px, attempt to scroll a data table sideways. | The table scrolls inside its own container while the page body stays fixed. If the table instead widens the page, that is the cause of any TC-54-008 failure. | Not Run |
| TC-54-010 | Long unbroken content does not break the layout | Edge | P4 | A customer whose email is 80 characters with no spaces, and a ticket subject of 200 characters | — | 1. View both at 375 px. | The text wraps or truncates within its cell. A long token must not stretch the table beyond the viewport. | Not Run |
| TC-54-011 | Tap targets are large enough | Edge | P4 | The ticket detail page | — | 1. At 375 px, measure the status buttons, the escalate button and the table row links. | Each is at least roughly 44 × 44 px, and adjacent controls are not so close that a thumb hits the wrong one. The status buttons sit in a row and are the likeliest failure. | Not Run |
| TC-54-012 | Forms are usable at 768 px | Positive | P4 | `SEED-BASE` | — | 1. Open every page at 768 px. | Layouts adapt sensibly between the phone and desktop arrangements, with no overlapping controls at the breakpoint. | Not Run |
| TC-54-013 | The desktop layout is unaffected | Positive | P4 | `SEED-BASE` | — | 1. Open every page at 1440 px. | The full layout renders as intended, with content not stretched to an unreadable line length. | Not Run |
| TC-54-014 | Empty states render at every width | Edge | P4 | `SEED-EMPTY` | — | 1. Open all six pages at 375 px and 1440 px. | Each shows a sensible empty state rather than a broken table header, a spinner that never resolves, or an error. | Not Run |
| TC-54-015 | Arabic content does not break the layout | Edge | P4 | Arabic customers and tickets | — | 1. View the customers and tickets pages at 375 px. | Cells size correctly around the Arabic text. Layout stays LTR, which is the separate issue recorded as GAP-161 in story 53. | Not Run |
| TC-54-016 | The app works in both orientations | Edge | P4 | A phone-sized viewport | — | 1. View at 375 × 667, then rotate to 667 × 375. | Both render usably, with no content trapped off-screen in landscape. | Not Run |
| TC-54-017 | There is no native mobile application | Negative | P4 | The repository | — | 1. Search the repository for a mobile project, and check for a service worker or web app manifest. | Only the Angular web app exists — no native app, no PWA manifest and no offline support. Story 54 says "web and mobile **friendly**", which a responsive web app satisfies; record this so the scope is unambiguous. | Not Run |
| TC-54-018 | The app is not tested against a real device | Edge | P4 | A physical phone on the same network | — | 1. Serve the app and open it on a real device. | It loads and works. Note that the API's CORS policy allows only `http://localhost:4200` and `http://localhost:4300`, so an app served from a LAN address will have every API call blocked — this will look like a UI failure but is a configuration limit. Evidence for GAP-162. | Not Run |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| Usable on a phone | TC-54-002…008, TC-54-011 | |
| Usable on a tablet and desktop | TC-54-012, TC-54-013 | |
| Content adapts rather than overflows | TC-54-009, TC-54-010 | |
| Mobile application | TC-54-017 | Responsive web only, by design |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-162 | The CORS policy allows only the two localhost development origins, so the app cannot be tested from a real device on the network or deployed to any other host without a configuration change. |
