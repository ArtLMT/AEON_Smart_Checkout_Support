# AEON Smart Checkout Support System

An interactive prototype of a digital support system for retail checkout counters. Cashiers request
manager help directly from the POS screen, and the manager receives prioritised requests on a mobile
dashboard, where many of them can be resolved without walking to the counter.

> **This is a demonstration, not an AEON operational system.** It runs entirely in the browser. All
> products, transactions, queues and statistics are simulated, and no real POS or payment system is
> involved.

## The problem

During peak hours, cashiers regularly hit issues they cannot resolve alone: a wrong price, an
unverified promotion, an item scanned by mistake, or a payment failure. Today they find a radio and
call a manager. The checkout stops, the queue grows, and the manager often walks over for something
that only needed a quick approval.

## The idea

| | Journey |
|---|---|
| **Today** | Customer queues → Cashier hits an issue → Finds a radio → Contacts manager → Waits → Manager arrives → Issue resolved → Checkout continues |
| **Proposed** | Customer queues → Cashier hits an issue → One-tap support → System prioritises → Manager notified → Remote approval or visit → Checkout continues |

The prototype aims to show four things: faster support communication, intelligent prioritisation,
fewer unnecessary manager trips, and better checkout continuity.

## Who uses it

### Cashier: POS screen

- Works through a live transaction: add and remove items, change quantities, take a simulated payment.
- Taps an issue type (Price, Promotion, Void, Payment or Other) without leaving the transaction.
  The counter and transaction details are sent automatically, and a note is optional.
- Follows the request in a status bar: its progress, waiting time, manager availability and response.
- Sees the transaction update when the manager approves, then continues checkout.

### Manager: mobile dashboard

- Sees all active requests, sorted by priority, with waiting timers and customer queue risk.
- Receives notifications for new requests, reminders and urgent alerts.
- Opens a request to see the product, transaction, cashier note, recommended action and why it has
  that priority.
- Accepts it, then approves remotely, goes to the counter, or rejects it with a reason.
- Reviews analytics: wait and resolution times, remote resolution rate, escalation rate, requests by
  category and by hour, and request history.

## How requests behave

### Priority

Priority is calculated automatically and recalculated as conditions change.

| Factor | Effect |
|---|---|
| Issue type | Payment starts High; Void, Price and Promotion start Medium; Other starts Low |
| Customer queue | 5 or more waiting raises the level by one; queue length also orders requests within a level |
| Waiting time | 60 seconds unaccepted raises the level by one |

### Escalation

There is only one manager, so escalation increases visibility rather than passing the request to
someone else. It stops once the request is accepted.

| Time unaccepted | What happens |
|---|---|
| 0 seconds | Manager is notified |
| 30 seconds | Reminder |
| 60 seconds | Priority raised, where it is not already High |
| 90 seconds | Urgent alert on the dashboard |

### Resolution

| Issue | Remote approval | Effect on the simulated transaction |
|---|---|---|
| Price Check | Yes | Line changes to the shelf price, if it differs |
| Promotion | Yes | Line changes to the promotional price, if one applies |
| Void Item | Yes | Item comes off the transaction |
| Payment Issue | No, needs a counter visit | Terminal error clears so payment can be retried |
| Other | Manager decides | None |

High-value items show a lock icon. The cashier cannot remove them directly, so removing one opens a
Void request instead.

### Lifecycle

```text
Remote:      PENDING → ACCEPTED → REMOTE_RESOLUTION → RESOLVED
At counter:  PENDING → ACCEPTED → IN_PROGRESS → RESOLVED

Other endings: REJECTED (by the manager), CANCELLED (by the cashier)
```

Each counter can have one open request at a time, and payment is unavailable until it closes.

## Run it locally

You need [Node.js](https://nodejs.org/) (developed on version 22).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173, then open the cashier and manager in **separate tabs of the same browser**.

| Page | Address |
|---|---|
| Home | `#/` |
| Cashier POS | `#/cashier/05` (counters 03, 05, 08, 10 and 12) |
| Manager dashboard | `#/manager` |

## Run the demonstration

Open the **Presenter** panel, available on every page. Setting up a scenario clears open requests and
moves any open cashier tab to the right counter. The cashier and manager actions stay manual.

| Scenario | Cashier | Manager |
|---|---|---|
| **A. Remote promotion** (Counter 05) | Promotion → Send to manager | Open request → Accept → Handle remotely → Approve remotely |
| **B. High-priority payment** (Counter 08) | Payment → Send to manager | Open request → Accept → Go to counter → Arrived at counter → Resolve |
| **C. Smart escalation** (Counter 03) | Price → Send to manager | Wait, or use **Skip ahead 30 seconds**, then accept and resolve |

The panel also has:

- **Customer queues:** change the number of customers waiting at each counter.
- **Busy period:** add requests from other counters, to show the list sorting by priority.
- **Reset demo:** return to the starting data. Do this before presenting, because the browser keeps
  the demo state between visits.

**Presenting tips**

- Click once in the manager tab first. Browsers block alert sounds until the page has been used.
- The statistics are generated sample data. Present them as an illustration, not as measured results.

## How it works

There is no server. The two interfaces share state through browser features:

| Need | How it is met |
|---|---|
| Shared state | One document held in a Zustand store and saved to `localStorage` |
| Live updates between tabs | `BroadcastChannel` sends each change to the other tabs |
| Waiting times and escalation | Calculated from timestamps, so all tabs agree and nothing needs counting |
| Skip ahead | A shared clock offset, applied to every timer |

### Limitation: one browser on one device

Sync only works between tabs of the same browser on the same device.

| Setup | Works? |
|---|---|
| Cashier and manager tabs in one browser | Yes |
| Laptop as cashier, real phone as manager | No |
| Two people on their own devices | No, each has separate data |
| Different browsers, or a normal and a private window | No |

Syncing across devices would need a real-time backend, which is outside this prototype's scope.

## Tech stack

| Layer | Technology |
|---|---|
| Framework and language | React, TypeScript |
| Build tool | Vite |
| Styling and components | Tailwind CSS, shadcn/ui, Lucide icons |
| State | Zustand |
| Charts | Recharts |
| Tests | Vitest |

## Project structure

```text
src/
├── components/
│   ├── cashier/    POS screen: transaction, support panel, status bar, dialogs
│   ├── manager/    Dashboard: overview, request list, details, analytics
│   ├── shared/     Badges, timers and the Presenter panel
│   └── ui/         shadcn/ui components
├── data/           Mock products, counters, baskets and seeded shift history
├── hooks/          Routing, simulated clock and manager alerts
├── pages/          Home, Cashier and Manager pages
├── services/       Business logic: priority, lifecycle, analytics, scenarios, storage, sync
├── stores/         Zustand store; every change goes through commit()
├── types/          Shared TypeScript types
└── utils/          Escalation thresholds and formatting
```

Business rules live in `src/services/` as plain functions, separate from the interface. To change a
rule, start with `priorityService.ts`, `requestService.ts` or `utils/escalationRules.ts`.

## Tests and build

```bash
npm test
```

```bash
npm run build
```

The tests cover the priority rules, escalation timing, the request lifecycle and the analytics.

## Deploying to Vercel

The app builds to static files and needs no environment variables or server. Vercel detects the Vite
settings automatically (build command `npm run build`, output folder `dist`).

Either import the Git repository in the Vercel dashboard, or deploy from this folder with the CLI:

```bash
npx vercel --prod
```

The one-device limitation above still applies after deployment. Preview and production addresses
also keep separate data, so open both tabs on the same address.

## Out of scope

Possible next steps for a real system, none of which are part of this prototype: a backend and
database, real-time communication across devices, employee login, several managers or stores, and
integration with real POS, payment, promotion and queue systems.
