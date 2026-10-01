
create policy "Users upload own payment proofs" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users read own payment proofs" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));

alter table public.orders add column payment_proof text not null default '';

update public.items set image_url = '/catalog/' || slug || '.jpg'
where slug in ('business-template-pack','capcut-pro-1-month','claude-pro-1-month','canva-pro-1-month','freelancing-guide-ebook','social-media-design-kit','accounting-sheet-pro','cv-portfolio-pack','brand-identity-kit','freelancing-mastery','graphic-design-complete','digital-marketing-bangla','web-development-basics');
