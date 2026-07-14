# Meridian — v0.1 Release Summary

**Status:** Implementation phase complete. This document is the frozen baseline for the architecture as it stands before v0.1.1 work begins.

Meridian is a browser-based game where the player writes real SQL queries against an embedded SQLite database to progress through a short campaign. Correct queries are verified deterministically and drive a real, visible world-state simulation — nothing about mission completion, world reaction, or unlocks is faked or hardcoded per-step; every layer is a general system fed by data.

---

## 1. Overall Architecture Overview

Meridian is built as a stack of small, mostly-pure layers, each one testable in isolation and composed together only at the top (`App.tsx`). No layer reaches back down into the one below it beyond what it's explicitly given.

```
UI (React components — presentational only, except App.tsx)
        │
Admin (read-only views + CRUD for Missions/NPCs)
        │
Odin (deterministic, read-only narrator)
        │
Event Bus (decouples the systems below from each other)
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

**Principles maintained throughout the build:**
- **Pure functions first.** Verification, world-state transitions, unlock evaluation, progression updates, and campaign math are all pure functions with no side effects — every one of them is unit-tested without a browser, a database, or React.
- **One orchestrator.** `App.tsx` is the only component that owns hooks/state coordinating multiple systems. Every Panel component is presentational: given props, it renders; it does not reach into global state or fire its own side effects (menu/form-local UI state excepted, e.g. the SQL textarea's own draft text).
- **Events decouple systems, not calls.** Mission completion doesn't call Progression directly — it publishes `MissionCompleted` on the Event Bus, and Progression, the Unlock Engine's re-check, and Odin all react independently. This is why Odin could be added in Step 21 without touching Mission Manager, Progression, or Unlocks at all.
- **Locked-by-default.** The Unlock Engine treats any target with no matching rule as locked. This is a security-style default that has held for missions, districts, and NPCs alike without exception.
- **No separate admin data store.** Admin CRUD (Missions, NPCs) validates through the same schema layer real content uses, then mutates the actual registries in place. There is exactly one source of truth for game content, not two kept in sync.
- **Content is data, not code.** Adding a mission or NPC is authoring a data literal, not touching engine logic — proven twice: once when the campaign expanded from 2 to 4 missions, and once when 2 NPCs were added, both times with zero changes to Mission Manager, the Verifier, the Unlock Engine, the Event Bus, or Persistence.

---

## 2. Major Implemented Systems

| System | Responsibility |
|---|---|
| **SQL Engine** | Runs learner and reference queries against an isolated, per-mission SQLite database (sql.js / WASM in the browser; a Node-safe loader in tests). |
| **Verifier** | Pure, deterministic row-level comparison (`normalizeCell`, `rowKey`, `projection`, `multisetDiff`) producing a `Verdict` with pass/fail plus missing/extra rows. |
| **World State Engine** | A pure reducer (`applyEffect`) over districts (id-keyed stat bags) and a turn counter. Three effect kinds: `ADJUST_STAT`, `SET_STAT`, `ADVANCE_TURN`. |
| **Mission Runtime** | `missionManager.ts` (pure phase/completion logic) + `useMissionManager`/`useMissionDatabase` hooks. Fully generic over whatever `MissionConfig` it's given — this is what let mission switching ship with no changes to this layer. |
| **Campaign System** | Orders missions, derives "Mission X of Y," completion percentage, and campaign-complete status from `PlayerProgress`. |
| **Progression** | Tracks completed missions, unlock state, and campaign position; pure, idempotent `recordMissionCompletion`. |
| **Unlock Engine** | Generic rule/condition evaluator (`always`, `missionCompleted`, `campaignCompleted`, `progressionPercentage`) reused identically for missions, districts, and NPCs. |
| **Event Bus** | Closure-based pub/sub (`MissionStarted`, `MissionCompleted`, `WorldStateChanged`, `ContentUnlocked`, `CampaignCompleted`). The seam every cross-system reaction is built on. |
| **Odin** | Deterministic, read-only narrator. Subscribes to the Event Bus, matches scripted `OdinReaction`s by specificity (a targeted reaction beats a generic fallback for the same event), never publishes, never decides anything. |
| **NPC System** | Content registry + district/unlock-aware selectors + World Map presentation. No dialogue, no behavior, no AI — pure content today. |
| **Persistence** | Versioned `SaveGame` schema, `localStorage`-backed with an injectable storage adapter, load-on-boot, New Game reset. |
| **Admin Panel** | Read-only projections of every content type, plus full CRUD (create/edit/delete) for Missions and NPCs. |
| **Mission Selection** | Lets the player load any unlocked mission into the SQL console and switch between them mid-session. |

---

## 3. Gameplay Features

- A 4-mission campaign teaching, in order: `SELECT *` → single-column `WHERE` → compound `WHERE` (`AND` + numeric comparison) → `GROUP BY` + `COUNT`.
- Free mission switching — play any unlocked mission, or revisit a completed one.
- Real-time world reaction: district loyalty/stability/signal stats change immediately and visibly on a correct query.
- 6 NPCs distributed across the 4 districts; 3 are always visible, 3 unlock on real progress milestones (first mission complete, a later mission complete, full campaign complete).
- Odin narrates 12 distinct deterministic beats tied to real gameplay events (mission starts, mission completes, content unlocks, campaign completes).
- A distinct campaign-completion moment: a completion banner plus a segmented progress stepper, separate from ordinary per-mission feedback.
- Save, Load, and New Game (New Game requires an inline confirmation before it resets anything).
- Failing a query shows a row-count comparison ("Expected 4 rows, got 1 — your filter may be too narrow") without ever revealing the missing rows' contents.

---

## 4. Admin Capabilities

Seven sections, all sourced live from the real game-content registries (no separate admin database):

| Section | Status |
|---|---|
| Missions | **CRUD enabled** — create, edit, delete, validated against the shared content schema |
| NPCs | **CRUD enabled** — same pattern |
| SQL Reference Answers | Read-only |
| Districts | Read-only |
| Rewards | Read-only |
| Progression | Read-only |
| Player State | Read-only |

Known boundary: content created or edited through Admin is **not** wired into the Unlock Engine's rule set (`defaultUnlockRules` is a static snapshot built at app boot). A mission or NPC added through Admin is real data immediately, but stays locked-by-default and cannot appear in that session's live gameplay. This is documented, intentional, and verified by a dedicated test — not a bug.

---

## 5. Testing Statistics

- **542** Vitest unit/integration tests across **98** test files.
- **20** Playwright end-to-end tests, covering the full four-mission campaign start to finish, save/load persistence across real page reloads, Admin CRUD, NPC unlock gating, and Odin narration — with explicit zero-console-error assertions on the critical paths.
- **~4,684** lines of test code against **~3,180** lines of non-test source (a ~1.47:1 ratio).
- Every implementation step in this project's history shipped with tests, a production build, and Playwright all green before moving to the next step — no step was ever left in a partially-verified state.

---

## 6. Current Known Limitations

- Only 4 missions exist; no mission uses a `JOIN`, `ORDER BY`, a subquery, `HAVING`, or any aggregate beyond `COUNT`.
- NPCs are purely decorative — no click interaction, no dialogue, no behavior.
- Odin reacts to success and unlocks only; there is no scripted reaction to a failed query.
- Revisiting an already-completed mission via Mission Select shows "Status: In Progress" locally (Mission Manager's runtime resets on every mission switch and has no notion of persisted completion), even though "Content: Completed" correctly shows the true state alongside it. Cosmetic, not a correctness bug.
- Admin-authored content cannot appear in live gameplay in the same session it was created (see §4).
- No mobile-purpose-built layout — the existing grid reflows to a single column but was never redesigned for small screens.
- No first-run onboarding — a new visitor lands directly in the first mission with only in-panel prose to go on.
- Save/Load persists world state and player progress only, not which mission is currently loaded in the SQL console (by design — mission selection is treated as session UI state).
- The Admin "Player State" section's description text ("No save/load system exists yet") is stale — it predates Persistence shipping and was never updated.
- `README.md` is still the default Vite template; it was never rewritten to describe this project.

---

## 7. Technical Debt

- **`progressionPercentage`** is a fully implemented, fully tested Unlock Engine condition kind that no real mission, district, or NPC currently uses. A capability, not dead code — but unexercised by any real content.
- **Stale Admin copy** — the "Player State" description above; a one-line fix whenever convenient.
- **Mission Manager / Progression reconciliation gap** — the "shows In Progress on revisit" limitation above would require a small Mission Manager change (letting it seed its initial phase from persisted completion) to fully resolve. Deliberately deferred each time it surfaced, since it's cosmetic and the fix touches a system this project has otherwise never modified after its initial build.
- **No version control** — this project has been developed without git initialized. "Freezing" v0.1 today is a documentation act, not a tag or branch; initializing git (and tagging this point) is worth doing before v0.1.1 work begins if durable history matters going forward.
- **`README.md`** never updated (see §6) — low priority, but it's the first thing any future contributor or reviewer opens.

---

## 8. Future Extension Points

These are seams already built and proven, ready to carry more weight without engine changes:

- The **Unlock Engine** already supports `campaignCompleted` and `progressionPercentage` conditions beyond what current content uses — deeper gating logic (e.g. "unlock after 75% complete") needs no engine work, only data.
- **Odin's specificity-matching** absorbs new triggers automatically — a new event type just needs reactions added to the data file; the matching logic doesn't change.
- The **Admin CRUD pattern** (validate via the shared `gameContent` schema, mutate the real registry in place) is proven twice (Missions, NPCs) and is directly reusable for a third content type.
- **`WorldEffect`** is a plain discriminated union handled by an exhaustive `switch` — a new effect kind is additive and cannot silently break the existing three.
- **Mission Runtime** is already fully generic over `MissionConfig`, including arbitrarily complex `setupSql` — a multi-table, JOIN-requiring mission needs zero Mission Runtime changes.
- The **Event Bus**'s `GameEvent` union is additive by construction — a new event variant (e.g. a query-failure event) is a small, contained change, not a redesign.

---

## 9. What Was Intentionally Deferred

- **A real, LLM-backed Odin** — the original roadmap explicitly deferred this until the world had significantly more content and persistence. Persistence has since shipped; content is still thin by this review's own assessment, so the deferral still holds.
- **NPC dialogue or behavior** — NPCs were scoped from their introduction as "pure content/data: no dialogue, no behavior, no AI," by design, not by omission.
- **Multiple save slots, autosave, save timestamps** — Save/Load's scope was deliberately kept to one slot, manually triggered.
- **A real light/dark theme toggle** — the polish pass deliberately committed to one finished dark theme instead of maintaining two.
- **An Admin visual redesign** — explicitly deprioritized as a builder/debug tool, not the demo-facing surface.
- **In-editor SQL affordances** (syntax highlighting, autocomplete, inline schema hints) — judged to be real editor features, not polish.
- **Branching mission paths or player choice** — the campaign is intentionally linear in v0.1.
- **A purpose-built mobile layout** — the current responsive reflow was accepted as sufficient for v0.1; a genuine mobile redesign was not attempted.

---

## 10. Repository Overview for Future Contributors

**Stack:** React 19 + TypeScript + Vite · sql.js (WASM SQLite) · Vitest + Testing Library · Playwright.

**Directory map (`src/`):**
```
verifier/        Pure SQL-result comparison engine (no React, no browser)
worldState/      Districts, stats, the pure applyEffect reducer
missions/        MissionConfig registry + Mission Runtime hooks
campaign/        Campaign ordering and summary selectors
progression/     PlayerProgress and its pure updater
unlocks/         Generic rule/condition engine + default rule data
events/          The Event Bus and cross-system reaction handlers
odin/            Deterministic narrator: types, reactions, matching, panel
npcs/            NPC registry, selectors, CRUD mutators
persistence/     Save/Load schema, storage adapter, service layer
admin/           Read-only views + CRUD services for Missions/NPCs
gameContent/     Shared content schemas/validation Admin and CRUD reuse
components/      Presentational UI panels (World Map, Mission, SQL Editor, ...)
App.tsx          The one orchestrating component; everything else is presentational
```

**Testing conventions:**
- Unit/integration tests are colocated as `*.test.ts` / `*.test.tsx` next to the source they cover.
- End-to-end specs live in `e2e/*.spec.ts`, run via Playwright against a real dev server.
- The SQL engine has two loaders: `db/database.ts` (browser, real WASM fetch) and `verifier/testDb.ts` (Node-safe, used in Vitest via `vi.mock('../db/database', ...)`).

**Working conventions established across the build:**
- Prefer pure functions; push side effects to the thinnest possible edge (a hook, an event handler).
- Only `App.tsx` coordinates multiple systems; Panels take props and render.
- Unlock targets are locked unless a rule explicitly says otherwise.
- No code comments beyond a one-line "why" for genuinely non-obvious decisions — no restating what the code already says.
- All theme colors live as CSS custom properties in `index.css`; component CSS modules reference them, never hardcode hex values.

**Common commands:**
```
npm run dev        # start the dev server
npm run test       # run the Vitest suite
npm run build      # type-check + production build
npx playwright test  # run the e2e suite (auto-manages the dev server)
```
