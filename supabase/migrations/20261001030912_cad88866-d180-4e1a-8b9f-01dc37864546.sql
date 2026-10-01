
drop policy "Public read published items" on public.items;
create policy "Anon read published items" on public.items for select to anon using (published);
create policy "Users read published items" on public.items for select to authenticated using (published or public.has_role(auth.uid(),'admin'));

drop policy "Public read published stories" on public.success_stories;
create policy "Anon read published stories" on public.success_stories for select to anon using (published);
create policy "Users read published stories" on public.success_stories for select to authenticated using (published or public.has_role(auth.uid(),'admin'));

drop policy "Public read active outlets" on public.outlets;
create policy "Anon read active outlets" on public.outlets for select to anon using (active);
create policy "Users read outlets" on public.outlets for select to authenticated using (active or public.has_role(auth.uid(),'admin'));

drop policy "Public read outlet items" on public.outlet_items;
create policy "Anon read outlet items" on public.outlet_items for select to anon using (active);
create policy "Users read outlet items" on public.outlet_items for select to authenticated using (active or public.has_role(auth.uid(),'admin'));
