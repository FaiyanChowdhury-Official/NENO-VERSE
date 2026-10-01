-- Restrict public settings to non-sensitive storefront/contact configuration.
DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;
CREATE POLICY "Public read safe settings"
ON public.site_settings FOR SELECT TO anon
USING (key IN ('general', 'storefront'));
CREATE POLICY "Signed in read checkout settings"
ON public.site_settings FOR SELECT TO authenticated
USING (key IN ('general', 'storefront', 'payment'));

-- Only expose curriculum belonging to a currently published catalog item.
DROP POLICY IF EXISTS "Public read lessons" ON public.lessons;
CREATE POLICY "Public read published lessons"
ON public.lessons FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.items
  WHERE items.id = lessons.item_id AND items.published = true
));

-- Customers may only acknowledge their own notifications, not rewrite system content.
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

-- Preserve financial records: archive instead of hard-delete.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE POLICY "Finance staff update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_staff_area(auth.uid(), 'finance'))
WITH CHECK (public.has_staff_area(auth.uid(), 'finance'));

-- Progress requires an active approved entitlement for the lesson's item.
DROP POLICY IF EXISTS "Own progress add" ON public.lesson_progress;
CREATE POLICY "Own entitled progress add"
ON public.lesson_progress FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.lessons l
    JOIN public.items i ON i.id = l.item_id
    JOIN public.orders o
      ON o.user_id = auth.uid()
      AND o.item_type = i.kind
      AND o.item_slug = i.slug
      AND o.status = 'approved'
      AND o.deleted_at IS NULL
    WHERE l.id = lesson_progress.lesson_id
      AND (i.access_days IS NULL OR coalesce(o.approved_at, o.created_at) + make_interval(days => i.access_days) > now())
  )
);

-- Content staff may edit catalog copy, but only finance-authorized staff may change prices.
CREATE OR REPLACE FUNCTION public.protect_item_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_staff_area(auth.uid(), 'finance') THEN
    IF TG_OP = 'INSERT' AND (NEW.price <> 0 OR NEW.original_price IS NOT NULL) THEN
      RAISE EXCEPTION 'Finance permission required to set pricing';
    ELSIF TG_OP = 'UPDATE' AND (NEW.price IS DISTINCT FROM OLD.price OR NEW.original_price IS DISTINCT FROM OLD.original_price) THEN
      RAISE EXCEPTION 'Finance permission required to change pricing';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_item_pricing() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_item_pricing_trigger ON public.items;
CREATE TRIGGER protect_item_pricing_trigger
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.protect_item_pricing();

CREATE OR REPLACE FUNCTION public.protect_outlet_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_staff_area(auth.uid(), 'finance') THEN
    IF TG_OP = 'INSERT' OR NEW.price IS DISTINCT FROM OLD.price THEN
      RAISE EXCEPTION 'Finance permission required to change outlet pricing';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_outlet_pricing() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_outlet_pricing_trigger ON public.outlet_items;
CREATE TRIGGER protect_outlet_pricing_trigger
BEFORE INSERT OR UPDATE ON public.outlet_items
FOR EACH ROW EXECUTE FUNCTION public.protect_outlet_pricing();

-- DB-level profile input bounds.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) BETWEEN 1 AND 100) NOT VALID,
  ADD CONSTRAINT profiles_phone_length CHECK (char_length(phone) <= 20) NOT VALID;

-- Keep service-role role changes from producing misleading anonymous audit entries;
-- privileged server actions write an explicit actor entry instead.
CREATE OR REPLACE FUNCTION public.on_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs(actor_id, action, target, metadata)
    VALUES (auth.uid(), 'role_' || lower(TG_OP), coalesce(NEW.user_id, OLD.user_id)::text,
      jsonb_build_object('role', coalesce(NEW.role, OLD.role)));
  END IF;
  RETURN coalesce(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.on_role_change() FROM PUBLIC, anon, authenticated;