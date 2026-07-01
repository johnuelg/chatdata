import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DocumentFolder {
  id: string;
  name: string;
  domain_id: string | null;
  parent_folder_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDocumentFolders() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["document_folders", user?.id],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_folders")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DocumentFolder[];
    },
    refetchOnMount: "always",
  });
}

export function useAddDocumentFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (folder: { name: string; domain_id?: string | null; parent_folder_id?: string | null; created_by?: string | null }) => {
      const { data, error } = await supabase.from("document_folders").insert(folder).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_folders"] }),
  });
}

export function useUpdateDocumentFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, parent_folder_id }: { id: string; name?: string; parent_folder_id?: string | null }) => {
      const payload: { name?: string; parent_folder_id?: string | null } = {};
      if (typeof name === "string") payload.name = name;
      if (parent_folder_id !== undefined) payload.parent_folder_id = parent_folder_id;

      const { error } = await supabase.from("document_folders").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_folders"] }),
  });
}

export function useDeleteDocumentFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Unfile documents in this folder first
      const { error: unfileError } = await supabase
        .from("documents")
        .update({ folder_id: null })
        .eq("folder_id", id);
      if (unfileError) throw unfileError;
      const { error } = await supabase.from("document_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document_folders"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
