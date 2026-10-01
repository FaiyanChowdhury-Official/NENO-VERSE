
alter table public.orders add column delivery_status text not null default 'waiting' check (delivery_status in ('waiting','processing','delivered','failed'));
alter table public.orders add column delivery_note text not null default '';
alter table public.orders add column delivered_at timestamptz;
alter table public.orders add column outlet_slug text not null default '';

create table public.outlets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  description text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.outlets to anon, authenticated;
grant insert, update, delete on public.outlets to authenticated;
grant all on public.outlets to service_role;
alter table public.outlets enable row level security;
create policy "Public read active outlets" on public.outlets for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "Admins manage outlets" on public.outlets for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger outlets_touch before update on public.outlets for each row execute function public.touch_updated_at();

create table public.outlet_items (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  price integer not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, item_id)
);
grant select on public.outlet_items to anon, authenticated;
grant insert, update, delete on public.outlet_items to authenticated;
grant all on public.outlet_items to service_role;
alter table public.outlet_items enable row level security;
create policy "Public read outlet items" on public.outlet_items for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "Admins manage outlet items" on public.outlet_items for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger outlet_items_touch before update on public.outlet_items for each row execute function public.touch_updated_at();

insert into public.outlets (slug, name, description, sort_order) values
('website','ওয়েবসাইট','সরাসরি ওয়েবসাইট থেকে বিক্রি',0),
('facebook','Facebook পেজ','Facebook পেজ ও গ্রুপ থেকে আসা গ্রাহক',1),
('whatsapp','WhatsApp','WhatsApp থেকে আসা গ্রাহক',2);

create or replace function public.on_order_delivery() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.delivery_status is distinct from old.delivery_status then
    if new.delivery_status = 'delivered' then
      insert into notifications(user_id, kind, title, body, link) values (new.user_id, 'delivered', 'ডেলিভারি সম্পন্ন হয়েছে', new.item_name || ' — ' || coalesce(nullif(new.delivery_note,''), 'এখন ব্যবহার করতে পারবেন'), '/dashboard');
    elsif new.delivery_status = 'processing' then
      insert into notifications(user_id, kind, title, body, link) values (new.user_id, 'processing', 'অ্যাক্টিভেশন চলছে', new.item_name, '/dashboard');
    end if;
  end if;
  return new;
end $$;
create trigger orders_delivery_notify after update on public.orders for each row execute function public.on_order_delivery();
revoke execute on function public.on_order_delivery() from public, anon, authenticated;
