
alter table public.orders add column customer_note text not null default '';
alter table public.items add column requires_customer_info boolean not null default false;
alter table public.items add column customer_info_label text not null default '';

insert into public.categories (kind, slug, name, sort_order) values ('product', 'pro-subscriptions', 'প্রো সাবস্ক্রিপশন', 0)
on conflict do nothing;

insert into public.items (kind, slug, name, category_slug, short_description, description, highlights, price, published, access_type, access_note, access_days, requires_customer_info, customer_info_label, sort_order)
values
('product','capcut-pro-1-month','CapCut Pro — ১ মাস','pro-subscriptions','প্রিমিয়াম টেমপ্লেট, ইফেক্ট ও ওয়াটারমার্ক-মুক্ত এক্সপোর্টসহ CapCut Pro।',
 array['পেমেন্ট যাচাইয়ের পর আপনার দেওয়া ইমেইলে/অ্যাকাউন্টে CapCut Pro চালু করে দেওয়া হবে।'], array['ওয়াটারমার্ক-মুক্ত এক্সপোর্ট','প্রিমিয়াম ইফেক্ট ও টেমপ্লেট','ক্লাউড স্টোরেজ'],
 0, false, 'link', 'অ্যাক্টিভেশনের বিস্তারিত এখানে দেখবেন।', 30, true, 'যে ইমেইলে CapCut Pro চালু করতে চান', 1),
('product','claude-pro-1-month','Claude AI Pro — ১ মাস','pro-subscriptions','লেখা, কোডিং ও গবেষণার জন্য Claude Pro।',
 array['পেমেন্ট যাচাইয়ের পর আপনার দেওয়া ইমেইলে Claude Pro চালু করে দেওয়া হবে।'], array['বেশি ব্যবহারের সীমা','সর্বশেষ মডেল','প্রজেক্ট ফিচার'],
 0, false, 'link', 'অ্যাক্টিভেশনের বিস্তারিত এখানে দেখবেন।', 30, true, 'যে ইমেইলে Claude Pro চালু করতে চান', 2),
('product','canva-pro-1-month','Canva Pro — ১ মাস','pro-subscriptions','প্রিমিয়াম টেমপ্লেট, ব্যাকগ্রাউন্ড রিমুভার ও ব্র্যান্ড কিটসহ Canva Pro।',
 array['পেমেন্ট যাচাইয়ের পর আপনার Canva ইমেইলে Pro টিমের ইনভাইট পাঠানো হবে।'], array['প্রিমিয়াম টেমপ্লেট ও এলিমেন্ট','ব্যাকগ্রাউন্ড রিমুভার','ব্র্যান্ড কিট'],
 0, false, 'link', 'অ্যাক্টিভেশনের বিস্তারিত এখানে দেখবেন।', 30, true, 'আপনার Canva অ্যাকাউন্টের ইমেইল', 3)
on conflict do nothing;
