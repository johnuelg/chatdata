ALTER TABLE public.document_folders
ADD COLUMN IF NOT EXISTS parent_folder_id uuid NULL REFERENCES public.document_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_document_folders_parent_folder_id
  ON public.document_folders(parent_folder_id);

CREATE TABLE IF NOT EXISTS public.document_folder_domain_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES public.document_folders(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  is_visible boolean NOT NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(folder_id, domain_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_folder_domain_visibility TO authenticated;
GRANT ALL ON public.document_folder_domain_visibility TO service_role;

ALTER TABLE public.document_folder_domain_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage folder domain visibility" ON public.document_folder_domain_visibility;
CREATE POLICY "Admins can manage folder domain visibility"
ON public.document_folder_domain_visibility
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.document_domain_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  is_visible boolean NOT NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, domain_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_domain_visibility TO authenticated;
GRANT ALL ON public.document_domain_visibility TO service_role;

ALTER TABLE public.document_domain_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage document domain visibility" ON public.document_domain_visibility;
CREATE POLICY "Admins can manage document domain visibility"
ON public.document_domain_visibility
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.is_folder_visible_for_domain(_folder_id uuid, _domain_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE folder_chain AS (
    SELECT f.id, f.parent_folder_id, 0 AS depth
    FROM public.document_folders f
    WHERE f.id = _folder_id

    UNION ALL

    SELECT p.id, p.parent_folder_id, fc.depth + 1
    FROM public.document_folders p
    JOIN folder_chain fc ON fc.parent_folder_id = p.id
    WHERE fc.depth < 25
  ),
  closest_override AS (
    SELECT fdv.is_visible
    FROM folder_chain fc
    JOIN public.document_folder_domain_visibility fdv
      ON fdv.folder_id = fc.id
     AND fdv.domain_id = _domain_id
    ORDER BY fc.depth ASC
    LIMIT 1
  )
  SELECT COALESCE((SELECT is_visible FROM closest_override), true);
$$;

CREATE OR REPLACE FUNCTION public.is_document_visible_for_domain(_document_id uuid, _domain_id uuid, _folder_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ddv.is_visible
      FROM public.document_domain_visibility ddv
      WHERE ddv.document_id = _document_id
        AND ddv.domain_id = _domain_id
      LIMIT 1
    ),
    CASE
      WHEN _folder_id IS NULL OR _domain_id IS NULL THEN true
      ELSE public.is_folder_visible_for_domain(_folder_id, _domain_id)
    END
  );
$$;

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
          public.user_has_domain_visibility(_user_id, COALESCE(d.domain_id, df.domain_id))
          AND (
            d.domain_id IS NULL
            OR df.domain_id IS NULL
            OR d.domain_id = df.domain_id
            OR public.user_has_domain_visibility(_user_id, d.domain_id)
            OR public.user_has_domain_visibility(_user_id, df.domain_id)
          )
          AND public.is_document_visible_for_domain(
            d.id,
            COALESCE(d.domain_id, df.domain_id),
            d.folder_id
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
        OR (
          NOT EXISTS (
            SELECT 1
            FROM public.documents d_empty
            WHERE d_empty.folder_id = f.id
          )
          AND public.user_has_domain_visibility(_user_id, f.domain_id)
          AND (
            f.domain_id IS NULL
            OR public.is_folder_visible_for_domain(f.id, f.domain_id)
          )
        )
      )
  );
$$;