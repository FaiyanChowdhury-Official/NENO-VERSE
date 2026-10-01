create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  item_type public.item_type not null,
  item_slug text not null,
  reviewer_name text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_slug)
);
grant select on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Public read approved reviews" on public.reviews for select to anon, authenticated using (status = 'approved');
create policy "Own reviews read" on public.reviews for select to authenticated using (auth.uid() = user_id);
create policy "Admins manage reviews" on public.reviews for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger reviews_touch before update on public.reviews for each row execute function public.touch_updated_at();

create table public.success_stories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  story text not null,
  image_url text not null default '',
  rating integer not null default 5 check (rating between 1 and 5),
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.success_stories to anon, authenticated;
grant insert, update, delete on public.success_stories to authenticated;
grant all on public.success_stories to service_role;
alter table public.success_stories enable row level security;
create policy "Public read published stories" on public.success_stories for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "Admins manage stories" on public.success_stories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger stories_touch before update on public.success_stories for each row execute function public.touch_updated_at();

insert into public.success_stories (name, role, story, rating, sort_order) values
('রাকিব আহমেদ', 'ফ্রিল্যান্সার, চট্টগ্রাম', 'ফ্রিল্যান্সিং মাস্টারি কোর্স করার দুই মাসের মধ্যে প্রথম ক্লায়েন্ট পেয়েছি। বাংলায় এত গোছানো কোর্স আগে পাইনি।', 5, 0),
('সুমাইয়া ইসলাম', 'উদ্যোক্তা, ঢাকা', 'বিজনেস টেমপ্লেট প্যাক দিয়ে আমার ইনভয়েস আর রিপোর্টের কাজ অর্ধেক সময়ে হয়ে যায়।', 5, 1),
('মেহেদী হাসান', 'গ্রাফিক ডিজাইনার, সিলেট', 'ডিজাইন কিটের টেমপ্লেটগুলো ক্লায়েন্টদের খুব পছন্দ হয়েছে। দামের তুলনায় অনেক বেশি পেয়েছি।', 4, 2);