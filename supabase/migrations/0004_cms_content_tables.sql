-- Admin CMS pass — the new database-backed content model. Additive only:
-- nothing here touches the existing hardcoded SQL campaign
-- (src/missions/src/campaign/src/learning) or any existing save. This is
-- intentionally the smallest schema that can represent one editable course
-- of lessons and missions, per the "keep the schema as small as possible /
-- no big-bang migration" brief — it exists alongside the old system, not in
-- place of it.
--
-- Every table follows the same RLS shape: two permissive SELECT policies
-- (players see only status='active' rows; admins see everything, draft
-- included, via is_admin() from 0002_admin_role_security.sql) and
-- INSERT/UPDATE/DELETE restricted to admins only. A normal authenticated
-- user's direct REST call to mutate content is rejected by Postgres itself,
-- not merely hidden by the UI.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text not null,
  status text not null default 'draft' check (status in ('draft', 'active')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content text,
  display_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'active')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  objective text not null,
  instructions text,
  task text,
  -- Flexible, data-only validation config — History answers aren't a live
  -- query like the current SQL campaign's referenceSql, so "correct answer"
  -- has to be a small typed payload instead of code. Never executed as SQL
  -- or any other code; the admin UI is the only writer and reader of its
  -- shape.
  answer_config jsonb,
  hint text,
  -- Difficulty-specific guidance for levels 1/2/3 — the current hardcoded
  -- missions have no per-level content field at all (difficulty there only
  -- toggles which single authored hint/example is shown); this is a genuine
  -- new capability for CMS-authored content, not a port of existing data.
  guidance_level_1 text,
  guidance_level_2 text,
  guidance_level_3 text,
  display_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'active')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_display_order_idx on public.courses (display_order);
create index lessons_course_id_idx on public.lessons (course_id);
create index lessons_display_order_idx on public.lessons (course_id, display_order);
create index missions_lesson_id_idx on public.missions (lesson_id);
create index missions_display_order_idx on public.missions (lesson_id, display_order);

grant select on public.courses, public.lessons, public.missions to anon, authenticated;
grant insert, update, delete on public.courses, public.lessons, public.missions to authenticated;
grant all on public.courses, public.lessons, public.missions to service_role;

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.missions enable row level security;

create policy "Anyone can read active courses" on public.courses
  for select to anon, authenticated using (status = 'active');
create policy "Admins can read all courses" on public.courses
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "Admins can insert courses" on public.courses
  for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "Admins can update courses" on public.courses
  for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "Admins can delete courses" on public.courses
  for delete to authenticated using (public.is_admin(auth.uid()));

create policy "Anyone can read active lessons" on public.lessons
  for select to anon, authenticated using (status = 'active');
create policy "Admins can read all lessons" on public.lessons
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "Admins can insert lessons" on public.lessons
  for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "Admins can update lessons" on public.lessons
  for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "Admins can delete lessons" on public.lessons
  for delete to authenticated using (public.is_admin(auth.uid()));

create policy "Anyone can read active missions" on public.missions
  for select to anon, authenticated using (status = 'active');
create policy "Admins can read all missions" on public.missions
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "Admins can insert missions" on public.missions
  for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "Admins can update missions" on public.missions
  for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "Admins can delete missions" on public.missions
  for delete to authenticated using (public.is_admin(auth.uid()));
