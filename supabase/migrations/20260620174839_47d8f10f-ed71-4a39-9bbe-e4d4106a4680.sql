CREATE POLICY "Authenticated users can read nav permissions"
ON public.site_settings
FOR SELECT
TO authenticated
USING (key = 'nav_permissions');