CREATE OR REPLACE FUNCTION public.can_user_access_document(_user_id uuid, _document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    LEFT JOIN public.document_folders df ON df.id = d.folder_id
    WHERE d.id = _document_id
      AND (
        public.has_role(_user_id, 'admin'::public.app_role)
        OR (
          EXISTS (
            SELECT 1
            FROM public.document_user_access dua
            WHERE dua.document_id = d.id
              AND dua.user_id = _user_id
          )
          AND (
            d.domain_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.user_domains ud
              WHERE ud.user_id = _user_id
                AND ud.domain_id = d.domain_id
            )
          )
          AND (
            df.id IS NULL
            OR df.domain_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.user_domains udf
              WHERE udf.user_id = _user_id
                AND udf.domain_id = df.domain_id
            )
          )
        )
      )
  );
$$;

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
        OR (
          f.domain_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.user_domains ud
            WHERE ud.user_id = _user_id
              AND ud.domain_id = f.domain_id
          )
        )
        OR EXISTS (
          SELECT 1
          FROM public.documents d
          WHERE d.folder_id = f.id
            AND public.can_user_access_document(_user_id, d.id)
        )
      )
  );
$$;

DROP POLICY IF EXISTS "Scoped users can view documents" ON public.documents;
CREATE POLICY "Scoped users can view documents"
ON public.documents
FOR SELECT
TO authenticated
USING (public.can_user_access_document(auth.uid(), id));

DROP POLICY IF EXISTS "Scoped users can view folders" ON public.document_folders;
CREATE POLICY "Scoped users can view folders"
ON public.document_folders
FOR SELECT
TO authenticated
USING (public.can_user_access_folder(auth.uid(), id));