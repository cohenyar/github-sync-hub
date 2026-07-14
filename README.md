# Meridian

**Status: v0.1** — a browser-based game where you write real SQL queries against an embedded SQLite database to bring a city back online. See [`RELEASE_v0.1.md`](./RELEASE_v0.1.md) for the full frozen baseline this README summarizes.

## Overview

Meridian's Records Core has gone dark. Each mission hands you a real SQLite database seeded with the city's own data and a goal written in plain English; you write the query, and a deterministic verifier checks your result against the correct answer row-for-row. There's no scripted "correct answer" typed in — pass or fail is computed live from what your query actually returns.

Correct queries aren't just marked "Pass" — they change the world. Districts shift between Unstable, Stable, and Thriving as their stats update in real time, NPCs reveal themselves as the story unlocks, and Odin, the city's own deterministic narrator, comments on what just happened.

## The gameplay loop

1. **Pick a mission** from the Missions panel — only unlocked ones are selectable, but a completed mission can be revisited any time.
2. **Read the goal and prompt**, then write a SQL query against that mission's tables in the SQL Editor.
3. **Run it.** The Verifier compares your result to the reference answer as multisets of rows — order doesn't matter, but every row does.
4. **Pass** applies that mission's effect to the world (a district's stats change, or the turn advances) and unlocks whatever comes next — a new mission, a new NPC, sometimes both. **Fail** tells you how close you were ("Expected 4 rows, got 1 — your filter may be too narrow") without ever showing you the missing rows.
5. **Odin narrates** the moment, deterministically — no AI, no live model, just a scripted reaction matched to what just happened.
6. Finish all four missions and the campaign closes with a dedicated completion moment, distinct from any single mission passing.

Along the way: Save and Load your progress (with a visible "Saved." confirmation), start over with New Game (which asks you to confirm first), and reload the page any time — a save resumes you exactly where you left off.

## Architecture overview

Meridian is built as a stack of small, mostly-pure layers, each testable on its own, composed together only at the top:

```
UI (React — presentational components; App.tsx is the only orchestrator)
        │
Admin (read-only views + CRUD for Missions/NPCs)
        │
Odin (deterministic, read-only narrator)
        │
Event Bus (decouples every system below from every other)
        │
Unlock Engine  ──  Progression  ──  Campaign
        │
Mission Runtime (Mission Manager + Mission Database)
        │
Verifier (pure row-diffing correctness engine)
        │
SQL Engine (sql.js / WASM SQLite)
        │
World State (pure reducer over districts + turn)
        │
Persistence (Save/Load, versioned schema)
```

A few rules have held for the whole build and are worth knowing before you touch anything:

- **Pure functions first.** Verification, world-state transitions, unlock evaluation, and progression updates are all pure and unit-tested without a browser or database in the loop.
- **One orchestrator.** `App.tsx` is the only component that coordinates multiple systems. Everything else is a Panel: given props, it renders.
- **Events, not direct calls.** Systems react to what happened on the Event Bus instead of calling each other — this is why Odin could be added without touching Mission Manager, Progression, or Unlocks at all.
- **Locked by default.** The Unlock Engine treats anything with no matching rule as locked. No exceptions anywhere in the content.
- **Content is data.** Adding a mission or NPC means writing a data literal, not changing engine code — proven by growing the campaign from 2 to 4 missions and adding NPCs with zero changes to any engine layer.

## Implemented systems

| System | What it does |
|---|---|
| SQL Engine | Runs learner/reference queries against an isolated per-mission SQLite database. |
| Verifier | Deterministic, order-independent row comparison producing pass/fail plus missing/extra rows. |
| World State | Pure reducer over districts (stat bags) and a turn counter; three effect kinds (`ADJUST_STAT`, `SET_STAT`, `ADVANCE_TURN`). |
| Mission Runtime | Fully generic over any mission's setup/reference SQL — this is what makes mission switching and future content additions cheap. |
| Campaign | Mission ordering, "Mission X of Y," completion percentage, campaign-complete detection. |
| Progression | Tracks completed missions and unlock state; pure, idempotent updates. |
| Unlock Engine | Generic rule/condition evaluator, reused identically for missions, districts, and NPCs. |
| Event Bus | Closure-based pub/sub connecting every system above without direct coupling. |
| Odin | Deterministic narrator — matches scripted reactions to real events by specificity, never decides anything, never publishes. |
| NPC System | Content registry + district/unlock-aware world map presentation (no dialogue or behavior yet). |
| Persistence | Versioned save schema, `localStorage`-backed, load-on-boot, New Game reset. |
| Admin Panel | Read-only views of every content type, plus full CRUD for Missions and NPCs. |
| Mission Selection | Load any unlocked mission into the console and switch between them mid-session. |

## Tech stack

React 19 · TypeScript · Vite · [sql.js](https://sql.js.org/) (WASM SQLite) · Vitest + Testing Library · Playwright

## How to run the project

```
npm install
npm run dev
```

## How to run tests

```
npm run test
```

542 unit/integration tests across 98 files, covering everything from pure reducers to full App-level playthroughs.

## How to run Playwright

```
npx playwright test
```

20 end-to-end specs against a real browser and dev server (auto-managed by the Playwright config) — the full four-mission campaign, save/load across real reloads, Admin CRUD, NPC unlock gating, and Odin narration, each asserting zero console errors on the critical paths.

## Building for production

```
npm run build
```

Type-checks with `tsc -b`, then produces a production Vite build.

## Current limitations

- Only 4 missions exist; none use a `JOIN`, `ORDER BY`, a subquery, `HAVING`, or any aggregate beyond `COUNT`.
- NPCs are purely decorative — visible on the map, but not clickable and with no dialogue.
- Odin reacts to success and unlocks only; there's no scripted reaction to a failed query yet.
- Revisiting an already-completed mission shows "Status: In Progress" locally even though "Content: Completed" correctly reflects the real state alongside it (Mission Manager's local runtime resets on every mission switch and doesn't know about persisted completion — cosmetic, not a correctness bug).
- Content created through Admin CRUD can't appear in that session's live gameplay (the Unlock Engine's rule set is a static snapshot built at boot) — documented and tested, not a bug.
- No mobile-purpose-built layout (the grid reflows to one column but wasn't redesigned for small screens) and no first-run onboarding for new visitors.

See [`RELEASE_v0.1.md`](./RELEASE_v0.1.md) for the full breakdown, including technical debt and what was intentionally deferred.

## v0.1.1 roadmap

Three focused additions, each reusing existing systems rather than introducing new ones:

1. **JOIN-based mission chain** — one or two new missions after the current capstone, introducing a second related table and teaching `JOIN` for the first time. Mission Runtime is already fully generic over arbitrary setup SQL, so this needs no engine changes.
2. **NPC click interaction (read-only bio)** — clicking an NPC on the World Map shows the name/role/description that already exists in the registry today. Purely additive UI; no dialogue or behavior system.
3. **Odin failure reactions** — Odin currently only narrates success and unlocks. This adds a scripted reaction to a failed query, which requires one small, necessary addition to the Event Bus (a failure event doesn't exist yet to react to) — Odin's own matching logic needs no changes at all.
