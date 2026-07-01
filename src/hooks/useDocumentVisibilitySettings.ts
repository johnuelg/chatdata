import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FolderDomainVisibilityRow {
  id: string;
  folder_id: string;
  domain_id: string;
  is_visible: boolean;
}

export interface DocumentDomainVisibilityRow {
  id: string;
  document_id: string;
  domain_id: string;
  is_visible: boolean;
}

export function useFolderDomainVisibility() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["document-folder-domain-visibility", user?.id],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_folder_domain_visibility" as any)
        .select("id, folder_id, domain_id, is_visible");

      if (error) throw error;
      return (data ?? []) as unknown as FolderDomainVisibilityRow[];
    },
    refetchOnMount: "always",
  });
}

export function useDocumentDomainVisibility() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["document-domain-visibility", user?.id],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_domain_visibility" as any)
        .select("id, document_id, domain_id, is_visible");

      if (error) throw error;
      return (data ?? []) as unknown as DocumentDomainVisibilityRow[];
    },
    refetchOnMount: "always",
  });
}

export function useSetFolderDomainVisibility() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ folderId, domainId, state }: { folderId: string; domainId: string; state: "inherit" | "visible" | "hidden" }) => {
      if (state === "inherit") {
        const { error } = await supabase
          .from("document_folder_domain_visibility" as any)
          .delete()
          .eq("folder_id", folderId)
          .eq("domain_id", domainId);

        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("document_folder_domain_visibility" as any)
        .upsert(
          {
            folder_id: folderId,
            domain_id: domainId,
            is_visible: state === "visible",
            created_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "folder_id,domain_id" },
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folder-domain-visibility"] });
      queryClient.invalidateQueries({ queryKey: ["document_folders"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useSetDocumentDomainVisibility() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ documentId, domainId, state }: { documentId: string; domainId: string; state: "inherit" | "visible" | "hidden" }) => {
      if (state === "inherit") {
        const { error } = await supabase
          .from("document_domain_visibility" as any)
          .delete()
          .eq("document_id", documentId)
          .eq("domain_id", domainId);

        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("document_domain_visibility" as any)
        .upsert(
          {
            document_id: documentId,
            domain_id: domainId,
            is_visible: state === "visible",
            created_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "document_id,domain_id" },
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-domain-visibility"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
