CREATE OR REPLACE FUNCTION public.has_staff_area(_user_id uuid, _area text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.user_roles where user_id = _user_id and (
    role = 'admin'
    or (
      coalesce((select (value->>'enabled')::boolean from public.site_settings where key = 'staff_access'), true)
      and (
        (_area = 'content' and role = 'content_manager')
        or (_area = 'finance' and role = 'finance_manager')
        or (_area = 'support' and role = 'support_manager')))))
$function$;