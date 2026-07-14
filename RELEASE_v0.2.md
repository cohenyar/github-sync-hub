# Meridian — v0.2 Release Summary

**Status:** v0.2 feature work (Steps 1–4) is complete and accepted. The mission unlock data refactor (originally proposed as Step 5) is deliberately deferred — useful, but internal, and not required for v0.2 to be demo-ready.

---

## 1. Version Summary

v0.2 picked up immediately after the v0.1.1 milestone (JOIN mission, NPC click bios, Odin failure reactions) and focused on player-facing depth rather than architecture: fixing a real UX inconsistency, giving a previously-unused engine capability its first real content, sharpening Odin's failure feedback per mission, and extending the SQL curriculum with a sixth mission. Every step shipped as pure content/data or a narrowly-scoped, additive change — no engine layer (Verifier, Mission Runtime, Unlock Engine, Campaign, Progression, Event Bus, Persistence, Admin) was modified in this version. That discipline was validated repeatedly: each step's regression risk was assessed as low-to-very-low going in, and every step landed with zero unplanned rework.

---

## 2. Features Completed in v0.2

- **Step 1 — Mission revisit status reconciliation.** Revisiting an already-completed mission via Mission Select now shows "Status: Completed" immediately, never a misleading "Status: In Progress." Fixed by seeding Mission Runtime's completion state from real progress, plus a necessary correctness fix to `deriveMissionPhase`'s check order so a revisited mission still waits for its own database before claiming completion.
- **Step 2 — `progressionPercentage` exercised for the first time.** A new NPC, Joran Petrik ("Signal Analyst," North district), unlocks at 40% overall campaign progress — the first real content to use this previously-implemented-but-unused Unlock Engine condition kind. Reused the World Map, NPC bio panel, and `ContentUnlocked`/Odin pipeline entirely as-is.
- **Step 3 — Mission-specific Odin failure reactions.** Four missions (District Ties, South Stability, Full Signal, Linked Records) now get a tailored hint when a query returns the wrong rows, tied to that mission's own SQL concept (e.g., "check both the district and the severity threshold" for a compound `WHERE`). Pure data addition to `defaultOdinReactions.ts` — no matcher or Event Bus changes.
- **Step 4 — Sixth mission: Priority Signal (ORDER BY).** A new mission teaching `ORDER BY`, using the Verifier's `ordered: true` option — fully built and unit-tested since early in the project, but never exercised by real content until now. Campaign completion moved automatically to this new finale with zero Campaign/Progression/Unlock Engine changes, the same proven extension point from v0.1.1. Also caught and fixed a subtler finality claim in Linked Records' Odin lines, which had become stale the moment a mission was added after it.

---

## 3. Current Mission Count and SQL Concepts Covered

**6 missions**, each introducing exactly one new concept on top of the last:

| # | Mission | SQL concept |
|---|---|---|
| 1 | First Contact | `SELECT *` |
| 2 | District Ties | single-column `WHERE` |
| 3 | South Stability | compound `WHERE` (`AND` + numeric comparison) |
| 4 | Full Signal | `GROUP BY` + `COUNT` |
| 5 | Linked Records | `JOIN` |
| 6 | Priority Signal | `ORDER BY` |

Not yet covered: subqueries, `HAVING`, multi-key sorting, aggregates beyond `COUNT` (e.g. `SUM`/`AVG`), `LEFT JOIN`/outer joins.

**7 NPCs** across 4 districts, gated by three distinct unlock mechanisms (mission completion, campaign completion, and now overall progression percentage) — still purely content/data, no dialogue or behavior.

---

## 4. Current Test Status

- **593 Vitest tests** across **103 test files** (~5,238 lines of test code against ~3,434 lines of non-test source — roughly a 1.5:1 ratio, consistent with the project's history).
- **25 Playwright end-to-end tests** across 10 spec files, covering the full six-mission campaign start to finish, save/load persistence, Admin CRUD, NPC unlock gating (including the new percentage-based milestone), and Odin narration (including per-mission failure hints) — all with explicit zero-console-error assertions on critical paths.
- Every step in v0.2 shipped with `npm run test`, `npm run build`, and `npx playwright test` all green before moving to the next step, same discipline as v0.1 and v0.1.1.

---

## 5. Known Limitations

Carried over from v0.1/v0.1.1 and still open:
- **Admin-authored content still can't appear in live gameplay in the same session it's created.** The root cause (mission unlock conditions live in an external map, not on `MissionConfig` itself, unlike NPCs) is unchanged — this is exactly what the deferred Step 5 refactor would fix.
- No mobile-purpose-built layout (existing grid reflows but wasn't redesigned for small screens).
- No first-run onboarding beyond in-panel prose.
- Save/Load doesn't persist which mission is currently loaded in the console (by design — treated as session UI state).
- The Admin "Player State" section's description text is still stale (predates Persistence shipping).

New or newly-relevant in v0.2:
- **`progressionPercentage` thresholds are relative to total campaign size**, not fixed points. As proven by Step 4 (adding a 6th mission silently moved `north-analyst`'s unlock trigger from "after District Ties" to "after South Stability"), any future mission addition needs to re-check existing percentage-gated content, the same way Step 4 had to. This is correct, intended behavior — but it's a real coupling worth remembering, not a bug.
- No mission yet exercises a subquery or `HAVING` — the curriculum's natural next gaps.

Resolved this version (no longer limitations): mission revisit status inconsistency; `progressionPercentage` being unused; Odin having no failure reactions at all; Linked Records' Odin lines falsely implying finality.

---

## 6. Suggested Demo Flow

1. **Open cold.** Show First Contact's `SELECT *` teaching moment and Odin's opening line.
2. **Play District Ties, deliberately fail once** (wrong district value) to show the new mission-specific hint, then pass it — highlights both the SQL feedback loop and Odin's personality.
3. **Jump to South Stability**, pass it, and point out Elin Voss appearing on the map — then immediately point out **Joran Petrik also appearing** (40% milestone), landing two unlocks from one action to show the Unlock Engine's breadth.
4. **Full Signal → Linked Records**, passing both, noting the JOIN result connects citizens to NPCs already seen on the map.
5. **Priority Signal:** run the wrong-order query first (`ASC` instead of `DESC`) to show the Fail state and ORDER BY-specific hint, then correct it — this is the version's newest concept and its dedicated failure feedback in one beat.
6. **Campaign Complete:** show the banner, Kestrel Vane appearing, and Odin's closing line — the payoff of the whole run.
7. **Optional:** open Admin, point out live item counts across all seven sections, and mention (without demoing) that Admin-created missions are real data today but need the Step 5 refactor to be playable same-session — an honest, prepared answer if asked.

---

## 7. Recommended Next Version Candidates

In rough priority order:

1. **Mission unlock data refactor (the deferred Step 5)** — move `unlockConditions` onto `MissionConfig`, mirroring NPCs. Highest-leverage remaining architectural gap; makes Admin CRUD fully functional for missions, not just NPCs.
2. **A subquery or `HAVING` mission** — the next natural SQL curriculum gap, following the same low-risk "one new mission" playbook proven three times now (Full Signal, Linked Records, Priority Signal).
3. **First-run onboarding** — even a single dismissible intro panel would address the most-cited "cold open" rough edge from the earlier UX audit.
4. **Fix the stale Admin "Player State" copy** — trivial, one line, purely overdue.
5. **A purpose-built mobile layout** — larger effort, lower urgency than the above; worth scoping separately once the above are settled.

No implementation has been started on any of these — this document is planning input only, per your request.
