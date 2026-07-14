# Meridian — Final Architecture Review (v0.2 Baseline)

**Purpose:** A review-only snapshot of the current architecture, taken with v0.2 frozen, to serve as the documented baseline going into v0.3. No code was changed to produce this report.

---

## 1. Overall Architecture Assessment

Meridian is a layered pipeline, consistently applied since v0.1 and never restructured:

```
UI (presentational components, except App.tsx)
Admin (read-only views + CRUD for Missions/NPCs)
Odin (deterministic, read-only narrator)
Event Bus
Unlock Engine — Progression — Campaign
Mission Runtime
Verifier
SQL Engine (sql.js / WASM)
World State (pure reducer)
Persistence
```

Every layer below the UI is pure-function-first and independently unit-tested; React only appears at the thin edges (hooks wrapping pure logic, `App.tsx` wiring hooks together). This discipline has held for the entire project history — ten-plus incremental steps across v0.1, v0.1.1, and v0.2 — without a single architectural rewrite or "we need to redo this layer" moment. That's the headline finding: **the architecture has been battle-tested by real, repeated extension, not just designed well on paper.**

The one place complexity concentrates is `App.tsx` itself, by design ("one orchestrator"). It has grown to ~285 lines coordinating roughly nine distinct concerns (boot/save state, mission runtime wiring, five kinds of event publishing, the unlock-reaction handler's lifecycle, NPC bio state, admin/debug toggles, the New Game confirmation flow). This is still entirely readable today, but it is the one component whose size scales with the *number of systems*, not the amount of content — worth watching, not yet a problem.

---

## 2. Strengths of the Current Design

- **Pure functions first, framework at the edges.** The Verifier, World State reducer, Campaign/Progression/Unlock selectors, and Odin's `matchReaction` are all plain TypeScript functions, testable without React, a browser, or a database. This is why the test suite can run in ~20 seconds and why refactors have been low-risk throughout.
- **Content is data, proven repeatedly.** Missions, NPCs, and Odin reactions have each been extended multiple times (3 new missions, 2 new NPCs, ~10 new Odin reactions since v0.1) with zero changes to the engines that consume them. This isn't a claim — it's been directly validated every time.
- **Event Bus decoupling, proven under real load.** Progression, the Unlock Engine's reaction handler, and Odin all evolved independently. Odin was added in an earlier step with no changes to Mission Manager, Progression, or Unlocks — the clearest evidence the decoupling actually works, not just that it looks decoupled.
- **Anticipated capability, later exercised.** The Verifier's `ordered` option and the Unlock Engine's `progressionPercentage` condition were both built and unit-tested well before any real content used them (v0.2 gave both their first real exercise). Building the general primitive ahead of the specific need, and having it work correctly the first time it was actually used, is a strong signal of sound abstraction boundaries.
- **Locked-by-default unlock semantics, applied uniformly** across missions, districts, and NPCs — a single, simple security-style default with no exceptions found anywhere in the codebase.
- **Extraordinary test discipline.** 593 Vitest tests / 103 files plus 25 Playwright e2e tests, against ~3,434 lines of non-test source — roughly a 1.5:1 test-to-source ratio. Every step in the project's history shipped with tests, build, and e2e all green before the next step began. Ripple effects (percentage text, mission counts) were consistently *caught by the suite*, not discovered later.
- **Backward-compatible extension points, proven twice.** Appending a mission after the current "finale" has now correctly moved campaign-completion to the new mission twice (Linked Records, then Priority Signal) with zero Campaign/Progression/Unlock Engine changes either time.

---

## 3. Technical Debt to Track (Not Fixing Now)

1. **No version control.** The project has no git repository. This is the single largest structural risk independent of code quality: no diffable history, no branching, no bisecting a regression, no rollback path other than manual reasoning across a conversation transcript.
2. **Mission unlock conditions live outside `MissionConfig`.** `MISSION_UNLOCK_CONDITIONS` is an external map in `defaultUnlockRules.ts`, while NPCs carry `unlockConditions` inline on `NpcConfig`. This asymmetry is the direct cause of Admin-authored missions being unable to unlock correctly in the same session they're created (the deferred Step 5 refactor targets exactly this).
3. **`defaultUnlockRules` is computed once, at module load.** It maps over `missionRegistry`/`npcRegistry` a single time when the module first imports. Admin CRUD mutates those registries in place afterward, so a mission or NPC added through Admin never gets its own `UnlockRule` entry — it silently falls back to "locked by default." Documented behavior, not a bug, but worth tracking as the mechanism behind item 2.
4. **A fragile-by-convention ordering dependency in `App.tsx`.** `contentStatus` must be computed *before* the `useMissionManager(...)` call so `initiallyCompleted` can be derived from it. Nothing in the types enforces this ordering — a future edit could silently reintroduce the "shows In Progress on revisit" bug fixed in v0.2 Step 1 by moving that line back below the hook call.
5. **`progressionPercentage` thresholds are relative to total mission count.** Adding a mission changes what percentage every existing mission-completion count maps to, which can silently move a percentage-gated unlock's trigger point (confirmed in v0.2 Step 4, where a 6th mission moved `north-analyst`'s unlock from "after District Ties" to "after South Stability"). Correct, intended behavior — but a real coupling between "how much content exists" and "when existing content unlocks," worth remembering before every future mission addition.
6. **CRUD logic is duplicated four times.** `missions/registry.ts` and `npcs/registry.ts` each hand-roll the same add/update(shallow-merge)/remove shape; `admin/services/missionAdminService.ts` and `npcAdminService.ts` each hand-roll the same validate/create/edit/delete/getDraft shape on top. Four independent implementations of two small, genuinely identical patterns.
7. **Per-mission Odin narration text can go stale when a new mission is appended after it.** This has now happened twice (Full Signal's message in v0.1.1, Linked Records' in v0.2). A regex-based regression test catches each occurrence after the fact, but nothing structurally prevents a third recurrence other than remembering to check during the next mission addition.
8. **Stale Admin copy.** The "Player State" section's description text still predates Persistence shipping (carried over from the v0.1 review, still unfixed).

---

## 4. Unnecessary Complexity That Could Be Simplified (Future, Not Now)

- **Three independent hand-rolled "latest value in a ref" patterns in `App.tsx`** (`recordCompletionRef`, `playerProgressRef`, `previousPhaseRef`) solve the same category of problem — keeping a callback/effect stable across renders while always reading current data. A single shared `useLatestRef` hook would collapse three near-identical instances into one, well-tested utility. Not urgent; each instance today is small and correctly commented.
- **The `unlockReactionHandler`-in-`useState` mechanism** (storing a *function* as state, rebuilt via `setUnlockReactionHandler(() => ...)`, to avoid invoking side effects during render) is correct and tested but is one of the harder corners of `App.tsx` to read cold — it requires understanding both the ref-mirroring pattern and why a handler needs to live in state rather than a plain variable before it makes sense.
- **The `gameContent` layer's six parallel pipelines** (mission, npc, district, reward, progression, sqlChallenge — each split across a type file, a schema file, a validation file, and a registry adapter file) are consistently structured and share a genuinely common validation helper (`requireStringFields`), so there's no duplicated *logic*. But it is a meaningful amount of directory and module ceremony for how thin each type's actual validation currently is (several schema files are a single exported constant array). Reasonable if per-field validation grows richer later; more structure than the current logic strictly needs today.
- **Two coexisting unlock-timing mental models** (mission-completion-based and progression-percentage-based) aren't documented anywhere as a pair — a reader has to piece together how they interact by reading both `defaultUnlockRules.ts` and the NPC registry. Fine at today's scale (one percentage-gated item); would benefit from a short explanatory note if more percentage-gated content is added.

---

## 5. Duplicated Logic / Code Smells Worth Documenting

- The CRUD quadruplication from §3.6 is the most concrete instance in the codebase — same shape, same shallow-merge-preserves-untouched-fields reasoning, copy-pasted across four files rather than shared.
- Each mission content file repeats a similar doc-comment structure explaining its place in the chain and the concept it teaches. Appropriate for six files; worth reconsidering (e.g., a `concept: 'ORDER BY'` field on `MissionConfig` itself) if a much larger number of missions is ever planned, so the curriculum sequence is queryable data rather than only prose.
- **A positive counter-example, worth naming alongside the negatives:** `getCompletionPercentage`'s rounding formula is the single source every "Progress: X%" display and test ultimately depends on — it was never duplicated, even under repeated pressure to add hardcoded percentage strings (that pressure shows up instead as *test* updates, which is the correct place for it to land).

---

## 6. Scalability Assessment

- **Missions:** Scales well. Three additions since v0.1 (Linked Records, and now this version's Priority Signal, plus the earlier South Stability/Full Signal pair) all followed the same low-risk playbook: one content file, one registry entry, one unlock-map entry, two or three Odin reactions, a handful of tests. The recurring, mechanical cost is re-deriving percentage-based text across tests — real but linear, not compounding.
- **NPCs:** Scales well; the one soft constraint is design discipline, not the system. Three unlock mechanisms now exist (mission-completed, campaign-completed, progression-percentage) and nothing enforces that a new NPC's chosen mechanism doesn't accidentally overlap or conflict with another's.
- **Rewards:** Scale for free — a reward is just `mission.successEffect`, and `WorldEffect` is an exhaustively-switched discriminated union, so a new effect kind is additive and caught at compile time if a handler is missed.
- **New SQL concepts:** The Mission Runtime and Verifier are already fully generic over arbitrary SQL — JOIN and ORDER BY both required zero engine changes, strong evidence subqueries, `HAVING`, outer joins, or multi-column sorts would need none either. The real bottleneck is manual curriculum design (each mission needs a small, deterministic, hand-authored dataset) — an inherent content-authoring cost, not an architectural limitation.
- **Admin CRUD:** Proven for 2 of ~6 content types; extending to more would repeat a validated pattern, though it would add a third/fourth copy to the duplication in §3.6 unless factored first.
- **Raw scale ceiling:** None relevant to this project's shape. Every list (missions, NPCs, districts, Odin reactions) is a small in-memory array scanned linearly; nothing here would behave differently at 20 missions than at 6.

---

## 7. Performance Concerns

- **Bundle weight is dominated by the sql.js WASM asset** (~659KB, ~326KB gzipped) versus the app's own JS (~270KB, ~86KB gzipped), fetched once per session. Acceptable for a desktop-first educational demo; would be the first thing to revisit if low-bandwidth or mobile use became a priority (already a known, separate limitation).
- **Each mission switch tears down and reloads a fresh in-memory SQLite database.** Correct and properly isolated per mission, with a small real cost each switch — invisible today given each mission's tiny hand-authored dataset, and structurally unlikely to grow given missions are deliberately small teaching fixtures.
- **No memoization anywhere in the codebase.** `App.tsx` recomputes selectors like `getMissionContentStatus` per mission option and `getUnlockedNpcIds` on every render — all pure functions over arrays of at most ~10 items, so effectively constant-time today. Worth naming as "not yet needed" rather than "solved," since it's a design choice that assumes small content volume, not a guarantee that holds at any scale.
- **The Event Bus is synchronous, in-process, `Set`-based pub/sub** with no batching or async dispatch — trivially fast at this scale and appropriate for a single-tab, single-player game.
- **No virtualization anywhere**, and none needed — every rendered list (missions, NPCs, Odin history capped at 4 visible entries) is small by construction.
- **Overall: no real performance concerns exist today.** There is no scaling cliff visible before the project would hit a fundamentally different problem (multiplayer, a real backend, persisted history at scale) — at which point today's assumptions (single in-memory WorldState, localStorage persistence) would need revisiting regardless of anything in this review.

---

## 8. Maintainability Assessment

**High, on balance.** A new contributor reading `README.md`, `RELEASE_v0.1.md`, and `RELEASE_v0.2.md` alongside the actual directory structure would understand the system quickly — the documented conventions (no comments beyond one-line "why," CSS custom properties as the single theme source, colocated tests, presentational-vs-orchestrator split, locked-by-default unlocks) are followed consistently, not aspirationally.

The test suite is the biggest maintainability asset: every ripple effect in this project's history — percentage text, mission counts, stale narration claims — was caught immediately by the existing suite, not discovered after the fact by a user or in a later step.

Two real watch-items, both already covered above:
- **No git** is the single biggest maintainability risk independent of code quality (§3.1).
- **`App.tsx`'s growth** is readable today but scales with system count, not content count — worth a deliberate checkpoint if it roughly doubles again from here.

One additional observation: an `oxlint` script exists in `package.json`, but with no CI (a consequence of no git/no pipeline), nothing currently enforces that it's run. Not a problem today, given the discipline shown throughout this project's history, but it's a process gap rather than a tooling one.

---

## 9. Recommended Priorities for v0.3 (Highest Value First)

1. **Initialize git and tag this point as a real baseline.** Given §3.1 and §8, this is now the single highest-leverage, lowest-effort action available — every subsequent step benefits from real history, diffs, and a rollback path that doesn't depend on conversation memory.
2. **The mission unlock data refactor (the deferred Step 5).** Closes the concrete Admin/Unlock Engine asymmetry documented in §3.2–3.3 and is the most substantial remaining architectural gap.
3. **A subquery or `HAVING` mission.** Continues the proven, low-risk content-scaling playbook from §6 and closes the next real curriculum gap.
4. **Consolidate the CRUD quadruplication (§3.6, §5)** into one small generic helper — most naturally timed for whenever a third content type needs CRUD, so the generic shape is designed against two real use cases rather than guessed at in the abstract.
5. **First-run onboarding, and the stale Admin "Player State" copy fix.** Both previously identified, both still valid, both lower architectural priority than the above.

---

## 10. Final Architecture Score: 8.5 / 10

**Justification:** The design is unusually disciplined for a project at this stage — pure-function-first layering, a decoupling mechanism (the Event Bus) proven under real repeated extension rather than just designed for it, and a test culture that has caught every regression this project has produced before it shipped. Content-as-data has been validated concretely and repeatedly, not just claimed. These are the qualities that matter most for a project expected to keep growing incrementally.

Points are held back from a 9–10 by risks that are real today, not hypothetical: the complete absence of version control (§3.1) is an operational risk independent of code quality; a small but genuine cluster of duplicated CRUD logic (§3.6) and a few "fragile by convention" coupling points (§3.4, §3.5) rely on future contributors remembering tribal knowledge rather than the type system or a structural guard preventing regression. None of these are urgent or demo-blocking — they are exactly the kind of findings a pre-v0.3 baseline review should surface, and none require immediate action per this review's scope.
