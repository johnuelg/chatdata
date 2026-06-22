CREATE TABLE public.document_user_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_user_access TO authenticated;
GRANT ALL ON public.document_user_access TO service_role;

ALTER TABLE public.document_user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document access"
ON public.document_user_access
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can read own document access"
ON public.document_user_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX document_user_access_user_id_idx
ON public.document_user_access (user_id);

CREATE INDEX document_user_access_document_id_idx
ON public.document_user_access (document_id);

DROP POLICY IF EXISTS "Scoped users can view documents" ON public.documents;

CREATE POLICY "Scoped users can view documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    EXISTS (
      SELECT 1
      FROM public.document_user_access dua
      WHERE dua.document_id = documents.id
        AND dua.user_id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.user_domains ud
        WHERE ud.user_id = auth.uid()
          AND ud.domain_id = documents.domain_id
      )
      OR NOT EXISTS (
        SELECT 1
        FROM public.user_domains ud_all
        WHERE ud_all.user_id = auth.uid()
      )
    )
  )
);

INSERT INTO public.document_user_access (document_id, user_id, granted_by)
SELECT d.id, ud.user_id, d.uploaded_by
FROM public.documents d
JOIN public.user_domains ud
  ON ud.domain_id = d.domain_id
ON CONFLICT (document_id, user_id) DO NOTHING;