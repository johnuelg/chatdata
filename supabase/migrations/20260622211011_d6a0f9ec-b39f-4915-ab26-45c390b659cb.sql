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
      OR NOT EXISTS (
        SELECT 1
        FROM public.user_domains ud_all
        WHERE ud_all.user_id = auth.uid()
      )
    )
  )
);