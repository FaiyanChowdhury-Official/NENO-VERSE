create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 6 and 20),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'new',
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "Anyone can submit contact" on public.contact_messages for insert to anon, authenticated with check (status = 'new');
create policy "Admins read contacts" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update contacts" on public.contact_messages for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete contacts" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(), 'admin'));