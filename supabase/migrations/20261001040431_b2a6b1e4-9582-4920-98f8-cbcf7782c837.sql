create or replace function public.has_staff_area(_user_id uuid, _area text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and (
    role = 'admin'
    or (_area = 'content' and role = 'content_manager')
    or (_area = 'finance' and role = 'finance_manager')
    or (_area = 'support' and role = 'support_manager')))
$$;
revoke execute on function public.has_staff_area(uuid, text) from public, anon;
grant execute on function public.has_staff_area(uuid, text) to authenticated;

-- Content managers
create policy "Content staff manage categories" on public.categories for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff manage items" on public.items for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff manage links" on public.item_links for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff manage lessons" on public.lessons for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff manage videos" on public.lesson_videos for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff manage reviews" on public.reviews for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff manage stories" on public.success_stories for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff manage outlets" on public.outlets for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff manage outlet items" on public.outlet_items for all to authenticated using (public.has_staff_area(auth.uid(),'content')) with check (public.has_staff_area(auth.uid(),'content'));
create policy "Content staff course videos" on storage.objects for all to authenticated using (bucket_id in ('course-videos','thumbnails','product-files') and public.has_staff_area(auth.uid(),'content')) with check (bucket_id in ('course-videos','thumbnails','product-files') and public.has_staff_area(auth.uid(),'content'));

-- Finance managers
create policy "Finance staff read orders" on public.orders for select to authenticated using (public.has_staff_area(auth.uid(),'finance'));
create policy "Finance staff read payment proofs" on storage.objects for select to authenticated using (bucket_id = 'payment-proofs' and public.has_staff_area(auth.uid(),'finance'));

-- Support managers
create policy "Support staff read contacts" on public.contact_messages for select to authenticated using (public.has_staff_area(auth.uid(),'support'));
create policy "Support staff update contacts" on public.contact_messages for update to authenticated using (public.has_staff_area(auth.uid(),'support'));
create policy "Support staff read tickets" on public.support_tickets for select to authenticated using (public.has_staff_area(auth.uid(),'support'));
create policy "Support staff update tickets" on public.support_tickets for update to authenticated using (public.has_staff_area(auth.uid(),'support')) with check (public.has_staff_area(auth.uid(),'support'));
create policy "Support staff read ticket messages" on public.ticket_messages for select to authenticated using (public.has_staff_area(auth.uid(),'support'));
create policy "Support staff reply tickets" on public.ticket_messages for insert to authenticated with check (author_id = auth.uid() and is_staff and public.has_staff_area(auth.uid(),'support'));