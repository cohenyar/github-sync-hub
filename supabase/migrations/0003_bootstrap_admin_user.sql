-- Admin CMS pass — assigns the intended administrator account the admin
-- role via the backend role system, never a frontend/React email check.
--
-- Deliberately a ONE-TIME statement, not a permanent rule: handle_new_user()
-- (defined in 20260805092142_...sql) is intentionally left untouched, so
-- every new sign-in — including this same email address signing in again
-- after an account/profile reset — always provisions as an ordinary
-- 'student' via the table's own default. Admin is granted here, once,
-- deliberately, by a human running this migration; it is never
-- auto-escalated by email anywhere in the trigger path. If this account is
-- ever deleted and recreated, re-run a statement like the one below (or a
-- new migration) to re-promote it — on purpose, each time — rather than
-- baking a standing email→admin rule into the signup path.
--
-- CORRECTED after a live run against the real database failed with:
--   ERROR: P0001: Only admins can change profile roles
--   CONTEXT: PL/pgSQL function prevent_role_self_escalation() line 4 at RAISE
--
-- Root cause: 0002's trigger checks `not public.is_admin(auth.uid())`.
-- auth.uid() reads PostgREST's per-request JWT-claim GUC
-- (request.jwt.claims), which is only ever populated on a real API request.
-- A direct SQL session — the Supabase SQL Editor, or any other direct-to-
-- Postgres runner, exactly how this migration is meant to be run — has no
-- JWT claims at all, so auth.uid() is NULL, is_admin(NULL) is false (no row
-- has p.id = NULL), and the trigger's condition is true for ANY direct-SQL
-- role change. The trigger was working exactly as designed — it has no
-- notion of "this is a trusted migration, not an attacker" — so this
-- migration now tells it that, for one statement, one transaction, then
-- immediately un-tells it.
--
-- Fix shape: disable ONLY this one named trigger, ONLY for the duration of
-- this single transaction, run the one-time UPDATE, then re-enable it
-- before commit. Why this stays safe:
--   * Transactional & fail-safe: ALTER TABLE ... {DIS,EN}ABLE TRIGGER is
--     ordinary transactional DDL in Postgres. If anything in this
--     transaction errors before COMMIT, the whole transaction rolls back —
--     including the DISABLE — so 0002's protection can never be left off by
--     a partial failure. It's restored either by the explicit ENABLE line
--     (success path) or by rollback (failure path).
--   * No exploitable window: ALTER TABLE ... DISABLE/ENABLE TRIGGER each
--     take a SHARE ROW EXCLUSIVE lock on public.profiles, held until COMMIT.
--     That conflicts with the ROW EXCLUSIVE lock any concurrent
--     INSERT/UPDATE/DELETE needs, so no other session — another user's own
--     profile edit, a concurrent admin action, anything — can write to this
--     table while the trigger is disabled; they simply wait, and by the
--     time they proceed the trigger is already enabled again. Independently
--     of all this, 0002 already revoked UPDATE on `role` from
--     `authenticated` entirely (column-level grant), so no ordinary
--     API/anon-key session could reach this column at all regardless of
--     trigger state.
--   * Nothing permanent added: no new function, grant, policy, or trigger
--     definition is created. This migration only ever toggles a boolean
--     flag on one already-existing trigger, then updates one row. After
--     COMMIT, the live system's protection surface is identical to before
--     this ran, except for the target row's `role` value.
--   * Not reachable from the frontend: this is a one-shot SQL script run by
--     a human with direct database access — the same access level that
--     already applied 0002's CREATE TRIGGER/GRANT/REVOKE/CREATE POLICY
--     statements successfully, so no new privilege is required here.
--
-- Idempotent and safe to run more than once: disabling an already-disabled
-- trigger, enabling an already-enabled one, and re-running the guarded
-- UPDATE (`where role <> 'admin'`) are all no-ops on a second pass.
--
-- Do NOT re-run 0002 alongside this. It already succeeded (its trigger is
-- exactly what produced the error above), and its trailing bare
-- `create policy "Admins can read all profiles" ...` has no
-- IF NOT EXISTS/OR REPLACE form in Postgres — replaying it would throw
-- "policy ... already exists" for no benefit.

begin;

alter table public.profiles disable trigger prevent_role_self_escalation;

do $$
declare
  affected integer;
begin
  update public.profiles
  set role = 'admin'
  where email = 'cohenyar21@gmail.com'
    and role <> 'admin';

  get diagnostics affected = row_count;

  if affected = 0 then
    raise notice 'No profile row updated for cohenyar21@gmail.com — either it is already admin, or that account has not signed in yet (no profiles row exists). If no row exists yet, re-run this migration once the account has signed in at least once.';
  else
    raise notice 'Promoted % profile row(s) for cohenyar21@gmail.com to admin.', affected;
  end if;
end $$;

alter table public.profiles enable trigger prevent_role_self_escalation;

commit;

-- Run after commit (or as the tail of this same script) for a visible,
-- row-level confirmation regardless of whether the SQL Editor surfaces
-- RAISE NOTICE output in its results pane.
select id, email, role from public.profiles where email = 'cohenyar21@gmail.com';
