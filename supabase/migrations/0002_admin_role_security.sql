-- Admin CMS pass — closes a real privilege-escalation hole and adds the one
-- reusable authorization primitive every admin-managed table's RLS depends
-- on.
--
-- Why this is needed: 0001_profiles.sql's own comment claimed "no
-- client-reachable path can ever grant admin" because `authenticated` had no
-- INSERT/UPDATE/DELETE grant on profiles at all. A later migration
-- (20260805092142_...) granted `authenticated` UPDATE on their own row with
-- no column restriction — its policy only checks `auth.uid() = id`, never
-- which columns changed. As written, any signed-in user could self-promote
-- via `update({ role: 'admin' }).eq('id', myId)`. This migration closes that
-- without touching the legitimate ability that later migration added
-- (updating your own display_name/avatar_url).

-- One shared authorization check, reused by every RLS policy below and by
-- every future admin-managed table's policies. SECURITY DEFINER so it can
-- read profiles regardless of the caller's own row-level access; STABLE
-- since it only reads, never writes, within one statement.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;

-- Column-scoped replacement for the blanket UPDATE grant: authenticated
-- users can still update their own display_name/avatar_url (the legitimate
-- feature the later migration added), but never role, email, id, or the
-- timestamps.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Belt-and-suspenders: even if a future change re-grants full UPDATE on
-- profiles, a non-admin can never change a role value through any path,
-- and even an admin can only do it as themselves (auth.uid() = id is still
-- enforced separately by the existing "Users can update their own profile"
-- policy — this trigger only ever narrows, never widens, what's allowed).
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_self_escalation on public.profiles;
create trigger prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- The read-only admin Users view needs to see every profile, not just the
-- caller's own row. Additive: the existing "Users can read own profile"
-- policy is untouched, and Postgres RLS OR's multiple permissive SELECT
-- policies together, so a non-admin's access is completely unchanged.
create policy "Admins can read all profiles" on public.profiles
  for select to authenticated using (public.is_admin(auth.uid()));
