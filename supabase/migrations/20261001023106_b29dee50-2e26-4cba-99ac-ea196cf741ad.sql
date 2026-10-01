alter type public.payment_method add value if not exists 'manual';
alter table public.orders add column if not exists approved_at timestamptz;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  kind public.item_type not null,
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Public read categories" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.items (
  id uuid primary key default gen_random_uuid(),
  kind public.item_type not null,
  slug text not null,
  name text not null,
  category_slug text not null default '',
  short_description text not null default '',
  description text[] not null default '{}',
  highlights text[] not null default '{}',
  file_info text not null default '',
  level text not null default 'beginner',
  instructor text not null default '',
  duration text not null default '',
  lesson_count integer not null default 0,
  price integer not null default 0 check (price >= 0),
  original_price integer check (original_price is null or original_price >= 0),
  image_url text not null default '',
  popular boolean not null default false,
  is_new boolean not null default false,
  published boolean not null default true,
  access_type text not null default 'link' check (access_type in ('lessons','link','both')),
  access_note text not null default '',
  access_days integer check (access_days is null or access_days > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);
grant select on public.items to anon, authenticated;
grant insert, update, delete on public.items to authenticated;
grant all on public.items to service_role;
alter table public.items enable row level security;
create policy "Public read published items" on public.items for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "Admins manage items" on public.items for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.item_links (
  item_id uuid primary key references public.items(id) on delete cascade,
  url text not null default '',
  label text not null default '',
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.item_links to authenticated;
grant all on public.item_links to service_role;
alter table public.item_links enable row level security;
create policy "Admins manage links" on public.item_links for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  module_title text not null default '',
  title text not null,
  duration text not null default '',
  is_free boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_item_idx on public.lessons(item_id, sort_order);
grant select on public.lessons to anon, authenticated;
grant insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "Public read lessons" on public.lessons for select to anon, authenticated using (true);
create policy "Admins manage lessons" on public.lessons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.lesson_videos (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  video_url text not null default '',
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.lesson_videos to authenticated;
grant all on public.lesson_videos to service_role;
alter table public.lesson_videos enable row level security;
create policy "Admins manage videos" on public.lesson_videos for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create trigger categories_touch before update on public.categories for each row execute function public.touch_updated_at();
create trigger items_touch before update on public.items for each row execute function public.touch_updated_at();
create trigger lessons_touch before update on public.lessons for each row execute function public.touch_updated_at();

insert into public.categories (kind,slug,name,sort_order) values
('product','templates','টেমপ্লেট',0),('product','ebook','ই-বুক',1),('product','design','ডিজাইন অ্যাসেট',2),('product','business','বিজনেস টুল',3),
('course','freelancing','ফ্রিল্যান্সিং',0),('course','design','ডিজাইন',1),('course','marketing','মার্কেটিং',2),('course','development','ডেভেলপমেন্ট',3);

insert into public.items (kind,slug,name,category_slug,short_description,description,highlights,file_info,price,original_price,image_url,popular,is_new,access_type,sort_order) values
('product','business-template-pack','বিজনেস টেমপ্লেট প্যাক','templates','ইনভয়েস, প্রস্তাবনা ও রিপোর্টের ৫০+ রেডি টেমপ্লেট।',array['ছোট ব্যবসা ও ফ্রিল্যান্সারদের জন্য তৈরি সম্পূর্ণ টেমপ্লেট প্যাক। ইনভয়েস, কোটেশন, প্রজেক্ট প্রস্তাবনা ও মাসিক রিপোর্ট—সবকিছু এক জায়গায়।','প্রতিটি ফাইল সম্পূর্ণ এডিটযোগ্য, বাংলা ও ইংরেজি দুই ভাষাতেই ব্যবহার করা যায়।']::text[],array['৫০+ এডিটযোগ্য টেমপ্লেট','বাংলা ও ইংরেজি সংস্করণ','লাইফটাইম আপডেট','ব্যবহারের গাইডলাইন']::text[],'PDF, DOCX, XLSX — প্রায় ১২০ MB',1500,2500,'/catalog/cover-business.jpg',true,false,'link',0),
('product','freelancing-guide-ebook','ফ্রিল্যান্সিং শুরুর গাইড (ই-বুক)','ebook','শূন্য থেকে প্রথম ক্লায়েন্ট পর্যন্ত ধাপে ধাপে বাংলা গাইড।',array['মার্কেটপ্লেস প্রোফাইল তৈরি, সার্ভিস নির্বাচন, প্রাইসিং ও ক্লায়েন্ট কমিউনিকেশন—সবকিছু বাস্তব উদাহরণসহ ব্যাখ্যা করা হয়েছে।','বাংলাদেশি ফ্রিল্যান্সারদের জন্য পেমেন্ট ও ব্যাংকিং অংশ আলাদাভাবে যুক্ত আছে।']::text[],array['১৮০ পৃষ্ঠার ই-বুক','চেকলিস্ট ও ওয়ার্কশিট','প্রস্তাবনার নমুনা']::text[],'PDF — প্রায় ২৫ MB',490,890,'/catalog/cover-templates.jpg',true,false,'link',1),
('product','social-media-design-kit','সোশ্যাল মিডিয়া ডিজাইন কিট','design','ফেসবুক ও ইনস্টাগ্রামের জন্য ২০০+ পোস্ট ডিজাইন।',array['ব্যবসার দৈনন্দিন কনটেন্টের জন্য তৈরি আধুনিক ডিজাইন কিট। রং, ফন্ট ও লেআউট সহজেই বদলানো যায়।','বাংলা টাইপোগ্রাফি মাথায় রেখে প্রতিটি লেআউট তৈরি করা হয়েছে।']::text[],array['২০০+ পোস্ট টেমপ্লেট','স্টোরি ও কভার ডিজাইন','বাংলা ফন্ট গাইড']::text[],'Figma, PSD — প্রায় ৩৫০ MB',1200,null,'/catalog/cover-design.jpg',false,true,'link',2),
('product','accounting-sheet-pro','হিসাব শিট প্রো','business','ছোট ব্যবসার আয়-ব্যয় ও মুনাফার অটোমেটেড শিট।',array['প্রতিদিনের বিক্রি, খরচ ও বকেয়া হিসাব রাখার সহজ শিট। সব হিসাব স্বয়ংক্রিয়ভাবে যোগ হয়ে মাসিক রিপোর্ট তৈরি করে।']::text[],array['অটোমেটেড ড্যাশবোর্ড','মাসিক ও বার্ষিক রিপোর্ট','ভিডিও সেটআপ গাইড']::text[],'XLSX, Google Sheets — প্রায় ১৫ MB',850,1200,'/catalog/cover-business.jpg',false,true,'link',3),
('product','cv-portfolio-pack','সিভি ও পোর্টফোলিও প্যাক','templates','চাকরি ও ক্লায়েন্টের জন্য পেশাদার সিভি টেমপ্লেট।',array['৩০টি আধুনিক সিভি ও পোর্টফোলিও লেআউট, সঙ্গে কভার লেটারের নমুনা।']::text[],array['৩০টি সিভি ডিজাইন','কভার লেটার নমুনা','পোর্টফোলিও লেআউট']::text[],'DOCX, PDF — প্রায় ৬০ MB',390,690,'/catalog/cover-templates.jpg',false,false,'link',4),
('product','brand-identity-kit','ব্র্যান্ড আইডেন্টিটি কিট','design','লোগো, রং ও টাইপোগ্রাফির সম্পূর্ণ ব্র্যান্ড গাইড।',array['নতুন ব্যবসার ব্র্যান্ড দাঁড় করানোর জন্য প্রয়োজনীয় সব উপাদান এক প্যাকেজে।']::text[],array['লোগো টেমপ্লেট','ব্র্যান্ড গাইডলাইন','সোশ্যাল কিট']::text[],'AI, SVG, PDF — প্রায় ২০০ MB',1900,2900,'/catalog/cover-design.jpg',true,false,'link',5);

insert into public.items (kind,slug,name,category_slug,short_description,description,highlights,level,instructor,duration,lesson_count,price,original_price,image_url,popular,is_new,access_type,sort_order) values
('course','freelancing-mastery','ফ্রিল্যান্সিং মাস্টারি','freelancing','মার্কেটপ্লেসে প্রোফাইল থেকে প্রথম আয় পর্যন্ত পূর্ণাঙ্গ কোর্স।',array['একদম শুরু থেকে ফ্রিল্যান্সিং শেখার কোর্স। সার্ভিস নির্বাচন, প্রোফাইল অপটিমাইজেশন, প্রপোজাল লেখা ও ক্লায়েন্ট ধরে রাখার কৌশল বাস্তব উদাহরণসহ শেখানো হয়েছে।','প্রতিটি ক্লাস বাংলায়, ছোট ছোট ভিডিওতে ভাগ করা।']::text[],array['নিজের সার্ভিস ও প্রাইসিং ঠিক করতে পারবেন','পেশাদার প্রোফাইল ও পোর্টফোলিও তৈরি করতে পারবেন','কার্যকর প্রপোজাল লিখতে পারবেন','নিরাপদে পেমেন্ট গ্রহণ করতে পারবেন']::text[],'beginner','তানভীর হাসান','৮ ঘণ্টা ৩০ মিনিট',42,2500,4000,'/catalog/cover-course.jpg',true,false,'lessons',0),
('course','graphic-design-complete','গ্রাফিক ডিজাইন সম্পূর্ণ কোর্স','design','ডিজাইন থিওরি থেকে ক্লায়েন্ট প্রজেক্ট পর্যন্ত হাতে-কলমে শিক্ষা।',array['রং, টাইপোগ্রাফি ও লেআউটের মূলনীতি শিখে বাস্তব প্রজেক্টে প্রয়োগ করার কোর্স।']::text[],array['ব্র্যান্ড ডিজাইন করতে পারবেন','সোশ্যাল মিডিয়া কনটেন্ট তৈরি করতে পারবেন','ক্লায়েন্ট ফাইল গুছিয়ে দিতে পারবেন']::text[],'intermediate','নুসরাত জাহান','১২ ঘণ্টা',56,3200,4500,'/catalog/cover-design.jpg',true,false,'lessons',1),
('course','digital-marketing-bangla','ডিজিটাল মার্কেটিং (বাংলা)','marketing','ফেসবুক ও গুগল অ্যাডে কার্যকর ক্যাম্পেইন চালানো শিখুন।',array['বাংলাদেশি ব্যবসার বাস্তব উদাহরণ দিয়ে ক্যাম্পেইন পরিকল্পনা, বাজেট ও রিপোর্টিং শেখানো হয়েছে।']::text[],array['ফেসবুক অ্যাড ক্যাম্পেইন চালাতে পারবেন','বাজেট ও রেজাল্ট হিসাব করতে পারবেন','কনটেন্ট পরিকল্পনা করতে পারবেন']::text[],'beginner','সাকিব রহমান','৭ ঘণ্টা ১৫ মিনিট',38,2200,null,'/catalog/cover-business.jpg',false,true,'lessons',2),
('course','web-development-basics','ওয়েব ডেভেলপমেন্ট বেসিকস','development','HTML, CSS ও JavaScript দিয়ে প্রথম ওয়েবসাইট তৈরি করুন।',array['কোডিংয়ে সম্পূর্ণ নতুনদের জন্য ধাপে ধাপে বাংলা কোর্স, প্রতিটি অধ্যায়ে প্র্যাকটিস প্রজেক্ট।']::text[],array['রেসপনসিভ ওয়েবপেজ তৈরি করতে পারবেন','জাভাস্ক্রিপ্টের মূল ধারণা বুঝবেন','প্রজেক্ট অনলাইনে প্রকাশ করতে পারবেন']::text[],'beginner','ইমরান কবির','১৪ ঘণ্টা',64,2900,3900,'/catalog/cover-course.jpg',false,false,'lessons',3);

insert into public.lessons (item_id,module_title,title,duration,is_free,sort_order) select i.id,v.* from public.items i, (values ('শুরুর কথা','ফ্রিল্যান্সিং আসলে কী','০৮:১২',true,0),('শুরুর কথা','সঠিক স্কিল নির্বাচন','১২:০৪',false,1),('শুরুর কথা','সময় ব্যবস্থাপনা','০৯:৪০',false,2),('প্রোফাইল ও পোর্টফোলিও','প্রোফাইল অপটিমাইজেশন','১৪:২২',false,3),('প্রোফাইল ও পোর্টফোলিও','পোর্টফোলিও সাজানো','১৬:১০',false,4),('ক্লায়েন্ট ও পেমেন্ট','প্রপোজাল লেখার কৌশল','১৮:৩৫',false,5),('ক্লায়েন্ট ও পেমেন্ট','বাংলাদেশে পেমেন্ট গ্রহণ','১১:৫০',false,6)) as v(m,t,d,f,s) where i.kind='course' and i.slug='freelancing-mastery';
insert into public.lessons (item_id,module_title,title,duration,is_free,sort_order) select i.id,v.* from public.items i, (values ('ডিজাইনের ভিত্তি','রঙের ব্যবহার','১০:১৫',true,0),('ডিজাইনের ভিত্তি','টাইপোগ্রাফি','১৩:৩০',false,1),('প্রজেক্ট','লোগো ডিজাইন প্রজেক্ট','২২:০৫',false,2),('প্রজেক্ট','ব্র্যান্ড গাইড তৈরি','১৯:৪৫',false,3)) as v(m,t,d,f,s) where i.kind='course' and i.slug='graphic-design-complete';
insert into public.lessons (item_id,module_title,title,duration,is_free,sort_order) select i.id,v.* from public.items i, (values ('মার্কেটিং বেসিক','টার্গেট অডিয়েন্স','০৯:২০',true,0),('মার্কেটিং বেসিক','কনটেন্ট পরিকল্পনা','১২:৪০',false,1),('পেইড অ্যাড','ফেসবুক অ্যাড সেটআপ','২১:১০',false,2),('পেইড অ্যাড','রিপোর্ট বিশ্লেষণ','১৪:০০',false,3)) as v(m,t,d,f,s) where i.kind='course' and i.slug='digital-marketing-bangla';
insert into public.lessons (item_id,module_title,title,duration,is_free,sort_order) select i.id,v.* from public.items i, (values ('HTML ও CSS','প্রথম ওয়েবপেজ','১১:০৫',true,0),('HTML ও CSS','লেআউট ও রেসপনসিভ ডিজাইন','২৩:৪০',false,1),('JavaScript','ভ্যারিয়েবল ও ফাংশন','১৭:৩০',false,2),('JavaScript','ছোট প্রজেক্ট','২৫:১৫',false,3)) as v(m,t,d,f,s) where i.kind='course' and i.slug='web-development-basics';