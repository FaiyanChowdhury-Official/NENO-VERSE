
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins manage settings" on public.site_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger site_settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();
insert into public.site_settings(key, value) values
('payment', '{"bkash":{"enabled":true,"number":"","instructions":"বিকাশ অ্যাপ থেকে \"পেমেন্ট\" অপশনে গিয়ে উপরের নম্বরে মোট টাকা পাঠান, তারপর TrxID লিখুন।"},"rocket":{"enabled":true,"number":"","instructions":"রকেট অ্যাপ বা *322# থেকে উপরের নম্বরে টাকা পাঠান, তারপর ট্রানজেকশন আইডি লিখুন।"},"bank":{"enabled":true,"bank_name":"","account_name":"","account_number":"","branch":"","instructions":"উপরের অ্যাকাউন্টে টাকা ট্রান্সফার করে রেফারেন্স নম্বর লিখুন।"}}'),
('general', '{"site_name":"অক্টোপাস","phone":"","email":"","address":"","facebook":"","youtube":"","instagram":"","whatsapp":""}');

create type public.ticket_status as enum ('open','in_progress','waiting_user','resolved','closed');
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  order_id uuid,
  status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.support_tickets to authenticated;
grant update on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
create policy "Own tickets read" on public.support_tickets for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "Own tickets create" on public.support_tickets for insert to authenticated with check (auth.uid() = user_id and status = 'open');
create policy "Admins update tickets" on public.support_tickets for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger support_tickets_touch before update on public.support_tickets for each row execute function public.touch_updated_at();

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  is_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
grant select, insert on public.ticket_messages to authenticated;
grant all on public.ticket_messages to service_role;
alter table public.ticket_messages enable row level security;
create policy "Read ticket messages" on public.ticket_messages for select to authenticated using (
  public.has_role(auth.uid(),'admin') or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy "Write ticket messages" on public.ticket_messages for insert to authenticated with check (
  author_id = auth.uid() and (
    (is_staff and public.has_role(auth.uid(),'admin')) or
    (not is_staff and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()))));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Own notifications read" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Own notifications mark read" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Admins read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Notifications + audit on order status changes
create or replace function public.on_order_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications(user_id, kind, title, body, link) values (new.user_id, 'payment_submitted', 'পেমেন্ট জমা হয়েছে', new.item_name || ' — যাচাই চলছে', '/dashboard');
  elsif new.status is distinct from old.status then
    if new.status = 'approved' then
      insert into notifications(user_id, kind, title, body, link) values (new.user_id, 'payment_approved', 'পেমেন্ট অনুমোদিত হয়েছে', new.item_name || ' এখন আপনার ড্যাশবোর্ডে', '/dashboard');
    elsif new.status = 'rejected' then
      insert into notifications(user_id, kind, title, body, link) values (new.user_id, 'payment_rejected', 'পেমেন্ট বাতিল হয়েছে', coalesce(new.admin_note, 'বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন'), '/support');
    end if;
    insert into audit_logs(actor_id, action, target, metadata) values (auth.uid(), 'order_' || new.status, new.id::text, jsonb_build_object('item', new.item_slug, 'amount', new.amount, 'from', old.status));
  end if;
  return new;
end $$;
create trigger orders_notify after insert or update on public.orders for each row execute function public.on_order_change();

create or replace function public.on_item_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_logs(actor_id, action, target, metadata) values (auth.uid(), 'item_created', new.slug, jsonb_build_object('price', new.price));
  elsif tg_op = 'DELETE' then
    insert into audit_logs(actor_id, action, target) values (auth.uid(), 'item_deleted', old.slug);
    return old;
  else
    insert into audit_logs(actor_id, action, target, metadata) values (auth.uid(),
      case when new.price is distinct from old.price then 'price_changed' when new.published and not old.published then 'item_published' else 'item_updated' end,
      new.slug, jsonb_build_object('old_price', old.price, 'new_price', new.price));
  end if;
  return new;
end $$;
create trigger items_audit after insert or update or delete on public.items for each row execute function public.on_item_change();

create or replace function public.on_settings_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs(actor_id, action, target) values (auth.uid(), 'settings_changed', new.key);
  return new;
end $$;
create trigger settings_audit after insert or update on public.site_settings for each row execute function public.on_settings_change();

create or replace function public.on_role_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs(actor_id, action, target, metadata) values (auth.uid(), 'role_' || lower(tg_op), coalesce(new.user_id, old.user_id)::text, jsonb_build_object('role', coalesce(new.role, old.role)));
  return coalesce(new, old);
end $$;
create trigger roles_audit after insert or update or delete on public.user_roles for each row execute function public.on_role_change();

create or replace function public.on_ticket_message() returns trigger language plpgsql security definer set search_path = public as $$
declare t record;
begin
  select * into t from support_tickets where id = new.ticket_id;
  if new.is_staff then
    insert into notifications(user_id, kind, title, body, link) values (t.user_id, 'support_reply', 'সাপোর্ট থেকে উত্তর এসেছে', t.subject, '/dashboard/support');
    update support_tickets set status = case when status in ('open','in_progress') then 'waiting_user' else status end, updated_at = now() where id = t.id;
  else
    update support_tickets set status = case when status in ('waiting_user','resolved') then 'open' else status end, updated_at = now() where id = t.id;
  end if;
  return new;
end $$;
create trigger ticket_message_notify after insert on public.ticket_messages for each row execute function public.on_ticket_message();

revoke execute on function public.on_order_change(), public.on_item_change(), public.on_settings_change(), public.on_role_change(), public.on_ticket_message() from public, anon, authenticated;
