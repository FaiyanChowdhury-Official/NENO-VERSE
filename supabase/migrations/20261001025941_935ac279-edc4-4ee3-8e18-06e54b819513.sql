
create policy "Admins manage product files" on storage.objects for all to authenticated
  using (bucket_id = 'product-files' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'product-files' and public.has_role(auth.uid(),'admin'));

create table public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  device_id text not null,
  user_agent text not null default '',
  ip text not null default '',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique (user_id, device_id)
);
grant select, delete on public.user_devices to authenticated;
grant all on public.user_devices to service_role;
alter table public.user_devices enable row level security;
create policy "Own devices read" on public.user_devices for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "Admins remove devices" on public.user_devices for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  item_slug text not null,
  item_kind text not null,
  action text not null,
  device_id text not null default '',
  ip text not null default '',
  user_agent text not null default '',
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);
create index access_logs_created_idx on public.access_logs(created_at desc);
create index access_logs_user_idx on public.access_logs(user_id, created_at desc);
grant select on public.access_logs to authenticated;
grant all on public.access_logs to service_role;
alter table public.access_logs enable row level security;
create policy "Admins read access logs" on public.access_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));
