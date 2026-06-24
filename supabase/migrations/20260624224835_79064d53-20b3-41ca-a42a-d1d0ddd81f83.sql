CREATE OR REPLACE FUNCTION public.can_user_access_folder(_user_id uuid, _folder_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.document_folders f
    WHERE f.id = _folder_id
      AND (
        public.has_role(_user_id, 'admin'::public.app_role)
        OR EXISTS (
          SELECT 1
          FROM public.documents d
          WHERE d.folder_id = f.id
            AND public.can_user_access_document(_user_id, d.id)
        )
      )
  );
$$;