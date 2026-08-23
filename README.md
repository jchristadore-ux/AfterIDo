# AfterIDo

**Your new name, everywhere it matters.**

A mobile-first web app that turns changing your name after marriage from a month
of research into an afternoon of tasks. Enter your information once; AfterIDo
works out which of ~40 possible changes apply to you, sequences them in the
order that actually works, fills your details in on every one, and tracks what's
done.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run preview
```

No environment variables, no backend, no account. Open the landing page and
click **"look around with sample data"** to see the whole app populated with a
realistic mid-journey user (Sarah Johnson → Sarah Smith, married in New Jersey).

---

## What it does

| | |
|---|---|
| **Onboarding** | Six short steps. Current name, contact details, new legal name, marriage information, and a checklist of circumstances that switches optional tasks on and off. |
| **Dashboard** | Progress ring, **next best action**, due reminders, what else is unblocked, and the five-phase map. |
| **Checklist** | Every task, viewable in recommended order or by category, filtered to what's open. |
| **Task detail** | Why this step sits where it does, what to bring, state-specific instructions, numbered steps, your details ready to paste, official links, per-account sub-checklists, notes and reminders. |
| **Documents** | A vault for the certificates and IDs your plan asks for, with what each one is used for. |
| **Packet** | Your whole plan as one printable document — information summary, document checklist, every task's instructions and your notes. |
| **Profile** | Edit anything; every task updates with it. |

### The order of operations

The feature that matters most, and the one the app is built around:

1. **Marriage certificate** — certified copies. Everything else asks for one.
2. **Social Security** — the master record every other agency checks against.
3. **Driver's license / state ID** — only once SSA has processed.
4. **Passport** — after your government ID matches.
5. **Everything else** — banks, work, insurance, and the rest.

Tasks declare dependencies (`dependsOn`), and a task whose dependencies aren't
settled renders **locked**, with a link to the one to do first. That's what stops
a wasted trip to the DMV.

---

## Honesty rules

These are enforced in the data and visible in the UI, not just in a disclaimer:

- **AfterIDo never submits anything to an agency.** Every task carries a `weCan`
  flag rendered as a badge — *"We prepare it · you submit"*. There is no code
  path that files anything, and the UI says so where a user might assume
  otherwise.
- **Only official links.** Every URL in the catalog points at a government agency
  or the company itself — never an affiliate. Verified August 2026.
- **No invented requirements.** Facts traceable to a specific official page carry
  a `sourceNote` shown in the task. State guidance carries a `lastReviewed` date.
- **No fabricated government forms.** The app links to the real SS-5, DS-5504 and
  DS-82 rather than reproducing them. The only document it generates is a plain
  courtesy notification letter for organizations that want written notice.
- **States we haven't researched say so.** A `basic`-coverage state gets the real
  agency links and an explicit "we haven't verified this state's specifics yet"
  banner, rather than confident-sounding guesses.

---

## Privacy posture

- **Never collected:** Social Security numbers, driver's license numbers, account
  numbers, passwords. They're absent from the data model entirely. Tasks tell you
  to have them on hand; the app never asks you to type them.
- **Profile data** lives in `localStorage` on your device. There is no server, so
  nothing is transmitted anywhere in this build.
- **Uploaded files** are held in memory for the tab and are *never written to
  disk*. Reload and the bytes are gone; only the metadata (name, size, what it's
  for) persists so the checklist still knows you have it. See the reasoning in
  `src/lib/documentStorage.ts`.

`src/pages/Trust.tsx` states all of this to the user, including what a production
deployment would need to add.

---

## Architecture

```
src/
  types.ts                  Domain model — the contract everything else honors
  data/
    tasks.ts                The task catalog: ~40 definitions with steps,
                            dependencies, official links and prefill keys
    states.ts               State-specific guidance (NJ detailed, rest fall back)
    categories.ts           Categories + the onboarding circumstance questions
    documents.ts            Document kinds and which tasks reference them
    demo.ts                 Sarah Johnson → Sarah Smith, mid-journey
  lib/
    progress.ts             Joins catalog + progress + state guidance; computes
                            next-best-action, phases, blocking, summaries
    prefill.ts              Profile → the fields each organization asks for
    plan.ts                 Plan entitlements + the Stripe integration seam
    storage.ts              Persistence adapter (localStorage today)
    documentStorage.ts      Document store interface (session-only today)
    notifications.ts        Reminder channels (in-app today, email/push stubbed)
    format.ts               Names, addresses, dates, durations
  store/AppContext.tsx      Single reducer + persistence effect
  components/               UI kit, shells, task card, prefill panel, paywall
  pages/                    Landing, onboarding, and the six app screens
```

**The separation that matters:** nothing in the catalog is user-specific, and
nothing in the profile is task-specific. `buildTaskViews()` is the only place
they meet. That's what makes adding a state a one-entry change to `states.ts`,
and adding a task a one-entry change to `tasks.ts` — no component edits either
way.

### Where the real integrations go

Every stub is an interface with a documented production implementation, marked
`INTEGRATION POINT` in the source:

| Seam | Today | Production |
|---|---|---|
| `PersistenceAdapter` (`storage.ts`) | `localStorage` | Authenticated API, encrypted at rest |
| `DocumentStore` (`documentStorage.ts`) | In-memory, session only | Signed upload URLs → KMS-encrypted object storage, audit log |
| `ReminderChannel` (`notifications.ts`) | In-app | Server-side queue + transactional email + Web Push |
| `startCheckout()` (`plan.ts`) | Returns "not enabled" | Stripe Checkout session, entitlement granted by verified webhook |

Government name-change submission is **not** a stub — no agency offers that API
to third parties, and the app says so where a user would expect otherwise.

---

## Plans

`canUse(plan, feature)` gates everything; no feature checks a plan directly.

- **Free** — the full checklist, the order of operations, official links, prefill,
  progress tracking.
- **Premium ($19.99 once)** — state-specific guidance, printable packet,
  notification letters, document vault, reminders.
- **Premium Plus** — reserved for household management and later life events.
  Not built.

There is no payment code in this build. "Unlock preview" flips a local flag and
the UI says exactly that.

---

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · lucide-react.
No state library, no UI framework, no backend.

---

## Brand

`src/brand.ts` is the source of truth; `src/index.css` mirrors the same hexes as
`@theme` tokens, which is what the Tailwind utilities compile against. Change a
color in one and change it in the other.

| Role | Hex | Token |
|---|---|---|
| Primary (rose-gold) | `#D4A5A5` | `primary` |
| Secondary (champagne) | `#E8D5C4` | `champagne` |
| Success (sage) | `#7A9E9F` | `sage` |
| Text (charcoal) | `#2C3E50` | `charcoal` |
| Background | `#FFFFFF` | `canvas` |
| Disabled | `#E0E0E0` | `disabled` |
| Destructive | `#C97B7B` | `destructive` |

Headings are Playfair Display, body and UI are Inter, both from Google Fonts with
a system fallback stack.

### Logo asset

`src/assets/afterido-wordmark.png` is the official logo, trimmed to its artwork
bounds with the cream paper field keyed to transparency, so it composites on any
surface rather than punching a rectangle into tinted ones. The key combines a
luminance test (for the charcoal lettering) with a chroma test (for the rose-gold
ring and ribbon, which sit close to the paper in brightness but are far more
saturated).

The asset is **1.56:1** — the ring and stone sit above the name, so roughly half
the image height is mark rather than wordmark. `Wordmark`'s size steps are about
double what a text-only lockup would use; shrink them and the name stops being
readable. The lettering is charcoal, so place it on white or champagne — on a dark
ground only the rose-gold survives.

The numbered steps around each brand color (`primary-50` … `primary-700`) are
tints and shades derived for surfaces, borders and hover states — a UI needs more
than eight values. The **unnumbered token is always the exact brand hex**, and
that is what every button fill, border and brand accent uses.

### Buttons

One component, six variants, all pill-shaped with soft elevation:
`primary`, `secondary`, `success`, `destructive`, `ghost`, plus the circular
`Fab`. `disabled` is a state rather than a variant, so every variant lands on the
same `#E0E0E0` treatment via `disabled:` utilities.

### Known contrast trade-off

The brand specifies white text on the rose-gold, sage and destructive fills, and
brand-colored text on white for the outline variants. Measured, those pair at
2.16:1, 2.91:1 and 3.18:1 — below the 4.5:1 WCAG AA threshold. **The spec is
implemented as written.** All body copy, headings and labels sit in charcoal on
white or champagne (10.98:1 and 7.71:1), so the shortfall is confined to text on
brand-colored buttons.

`ACCESSIBLE_ALTERNATES` in `src/brand.ts` holds the lightest shade of each hue
that clears 4.5:1 against white, computed rather than eyeballed. Swapping a
token in `index.css` is a one-line change per color if readability should win.
