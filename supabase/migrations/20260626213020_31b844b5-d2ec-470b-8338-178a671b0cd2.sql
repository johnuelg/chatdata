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
          public.user_has_domain_visibility(_user_id, d.domain_id)
          AND public.user_has_domain_visibility(_user_id, df.domain_id)
          AND (
            EXISTS (
              SELECT 1
              FROM public.document_user_access dua
              WHERE dua.document_id = d.id
                AND dua.user_id = _user_id
            )
            OR NOT EXISTS (
              SELECT 1
              FROM public.document_user_access dua_any
              WHERE dua_any.document_id = d.id
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
        OR EXISTS (
          SELECT 1
          FROM public.documents d
          WHERE d.folder_id = f.id
            AND public.can_user_access_document(_user_id, d.id)
        )
      )
  );
$$;