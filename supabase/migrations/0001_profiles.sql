-- Meridian Auth Phase 1: profiles table, auto-provisioning trigger, and RLS.
--
-- Role model: exactly two roles, 'student' (default for every new sign-in)
-- and 'admin' (manually promoted — see the promotion command in the setup
-- instructions, never assigned by the frontend).
--
-- Security posture: `authenticated` gets SELECT on its own row only. There
-- is deliberately no INSERT/UPDATE/DELETE grant for `authenticated` at all —
-- rows are created only by the trigger below (SECURITY DEFINER), and role
-- changes only ever happen via the Supabase SQL Editor/Table Editor (a
-- project-owner-only context), never through the app or its anon key. This
-- is what makes "no client-reachable path can ever grant admin" true by
-- construction, not by convention.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- No insert/update/delete policy for `authenticated`. See the setup
-- instructions for the exact one-time admin-promotion command, run from the
-- Supabase dashboard only.
