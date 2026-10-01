
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
grant select, insert, delete on public.lesson_progress to authenticated;
grant all on public.lesson_progress to service_role;
alter table public.lesson_progress enable row level security;
create policy "Own progress read" on public.lesson_progress for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "Own progress add" on public.lesson_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "Own progress remove" on public.lesson_progress for delete to authenticated using (auth.uid() = user_id);
