INSERT INTO public.document_user_access (document_id, user_id, granted_by)
SELECT d.id, p.id, d.uploaded_by
FROM public.documents d
JOIN public.profiles p ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = p.id
    AND ur.role = 'admin'::public.app_role
)
ON CONFLICT (document_id, user_id) DO NOTHING;