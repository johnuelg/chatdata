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
      documents.domain_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.user_domains ud
        WHERE ud.user_id = auth.uid()
          AND ud.domain_id = documents.domain_id
      )
    )
    AND (
      documents.folder_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.document_folders df
        WHERE df.id = documents.folder_id
          AND (
            df.domain_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.user_domains udf
              WHERE udf.user_id = auth.uid()
                AND udf.domain_id = df.domain_id
            )
          )
      )
    )
  )
);

DROP POLICY IF EXISTS "Scoped users can view folders" ON public.document_folders;

CREATE POLICY "Scoped users can view folders"
ON public.document_folders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    (
      document_folders.domain_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.user_domains ud
        WHERE ud.user_id = auth.uid()
          AND ud.domain_id = document_folders.domain_id
      )
    )
    OR (
      document_folders.domain_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.documents d
        JOIN public.document_user_access dua
          ON dua.document_id = d.id
         AND dua.user_id = auth.uid()
        WHERE d.folder_id = document_folders.id
          AND (
            d.domain_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.user_domains ud_doc
              WHERE ud_doc.user_id = auth.uid()
                AND ud_doc.domain_id = d.domain_id
            )
          )
      )
    )
  )
);