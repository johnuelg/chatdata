CREATE OR REPLACE FUNCTION public.user_has_domain_visibility(_user_id uuid, _domain_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _domain_id IS NULL
    OR public.has_role(_user_id, 'admin'::public.app_role)
    OR (
      NOT EXISTS (
        SELECT 1
        FROM public.user_domains ud_any
        WHERE ud_any.user_id = _user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.user_domains ud
        WHERE ud.user_id = _user_id
          AND ud.domain_id = _domain_id
      )
    );
$$;

REVOKE ALL ON FUNCTION public.user_has_domain_visibility(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_domain_visibility(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_user_access_document(_user_id uuid, _document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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
          AND public.user_has_domain_visibility(_user_id, d.domain_id)
          AND public.user_has_domain_visibility(_user_id, df.domain_id)
        )
      )
  );
$$;