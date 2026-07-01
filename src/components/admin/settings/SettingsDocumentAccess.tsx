import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDomains } from "@/hooks/useDomains";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentFolders } from "@/hooks/useDocumentFolders";
import {
  useDocumentDomainVisibility,
  useFolderDomainVisibility,
  useSetDocumentDomainVisibility,
  useSetFolderDomainVisibility,
} from "@/hooks/useDocumentVisibilitySettings";
import { useIsAdmin } from "@/hooks/useSiteSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type VisibilityState = "inherit" | "visible" | "hidden";

const stateFromBool = (value: boolean): VisibilityState => (value ? "visible" : "hidden");

const SettingsDocumentAccess = () => {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: domains = [], isLoading: domainsLoading } = useDomains();
  const { data: folders = [], isLoading: foldersLoading } = useDocumentFolders();
  const { data: documents = [], isLoading: documentsLoading } = useDocuments();
  const { data: folderRules = [], isLoading: folderRulesLoading } = useFolderDomainVisibility();
  const { data: documentRules = [], isLoading: documentRulesLoading } = useDocumentDomainVisibility();

  const setFolderVisibility = useSetFolderDomainVisibility();
  const setDocumentVisibility = useSetDocumentDomainVisibility();

  const [selectedDomainId, setSelectedDomainId] = useState<string>("none");

  useEffect(() => {
    if (selectedDomainId === "none" && domains.length > 0) {
      setSelectedDomainId(domains[0].id);
    }
  }, [domains, selectedDomainId]);

  const folderRulesMap = useMemo(() => {
    const map = new Map<string, VisibilityState>();
    folderRules.forEach((row) => {
      map.set(`${row.folder_id}:${row.domain_id}`, stateFromBool(row.is_visible));
    });
    return map;
  }, [folderRules]);

  const documentRulesMap = useMemo(() => {
    const map = new Map<string, VisibilityState>();
    documentRules.forEach((row) => {
      map.set(`${row.document_id}:${row.domain_id}`, stateFromBool(row.is_visible));
    });
    return map;
  }, [documentRules]);

  const foldersByParent = useMemo(() => {
    const map = new Map<string, typeof folders>();

    folders
      .filter((folder) => folder.domain_id === selectedDomainId)
      .forEach((folder) => {
        const parentKey = folder.parent_folder_id ?? "root";
        const list = map.get(parentKey) ?? [];
        map.set(parentKey, [...list, folder]);
      });

    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    return map;
  }, [folders, selectedDomainId]);

  const documentsByFolder = useMemo(() => {
    const map = new Map<string, typeof documents>();

    documents.forEach((document) => {
      const folder = folders.find((f) => f.id === document.folder_id);
      const effectiveDomainId = document.domain_id ?? folder?.domain_id ?? null;
      if (effectiveDomainId !== selectedDomainId) return;

      const key = document.folder_id ?? "unfiled";
      const list = map.get(key) ?? [];
      map.set(key, [...list, document]);
    });

    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort((a, b) => a.title.localeCompare(b.title)),
      );
    }

    return map;
  }, [documents, folders, selectedDomainId]);

  const loading =
    adminLoading ||
    domainsLoading ||
    foldersLoading ||
    documentsLoading ||
    folderRulesLoading ||
    documentRulesLoading;

  const handleFolderStateChange = async (folderId: string, state: VisibilityState) => {
    if (selectedDomainId === "none") return;

    try {
      await setFolderVisibility.mutateAsync({
        folderId,
        domainId: selectedDomainId,
        state,
      });
      toast({ title: "Folder visibility updated" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDocumentStateChange = async (documentId: string, state: VisibilityState) => {
    if (selectedDomainId === "none") return;

    try {
      await setDocumentVisibility.mutateAsync({
        documentId,
        domainId: selectedDomainId,
        state,
      });
      toast({ title: "File visibility updated" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const renderVisibilitySelect = (
    current: VisibilityState,
    onChange: (next: VisibilityState) => void,
    disabled = false,
  ) => (
    <Select value={current} onValueChange={(value) => onChange(value as VisibilityState)} disabled={disabled}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="inherit">Inherit</SelectItem>
        <SelectItem value="visible">Visible</SelectItem>
        <SelectItem value="hidden">Hidden</SelectItem>
      </SelectContent>
    </Select>
  );

  const renderFolderBranch = (parentId: string | null, depth = 0): React.ReactNode => {
    const branch = foldersByParent.get(parentId ?? "root") ?? [];
    if (branch.length === 0) return null;

    return branch.map((folder) => {
      const folderState =
        folderRulesMap.get(`${folder.id}:${selectedDomainId}`) ?? "inherit";

      const files = documentsByFolder.get(folder.id) ?? [];

      return (
        <div key={folder.id} className="space-y-2">
          <div className="grid grid-cols-[1fr,160px] items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2">
            <div className="min-w-0" style={{ paddingLeft: `${depth * 20}px` }}>
              <p className="truncate text-sm font-medium text-foreground">📁 {folder.name}</p>
            </div>
            {renderVisibilitySelect(folderState, (next) => handleFolderStateChange(folder.id, next), setFolderVisibility.isPending)}
          </div>

          {files.map((file) => {
            const fileState =
              documentRulesMap.get(`${file.id}:${selectedDomainId}`) ?? "inherit";

            return (
              <div
                key={file.id}
                className="grid grid-cols-[1fr,160px] items-center gap-3 rounded-lg border border-border/40 bg-background px-3 py-2"
              >
                <div className="min-w-0" style={{ paddingLeft: `${(depth + 1) * 20}px` }}>
                  <p className="truncate text-xs text-foreground">📄 {file.title}</p>
                </div>
                {renderVisibilitySelect(fileState, (next) => handleDocumentStateChange(file.id, next), setDocumentVisibility.isPending)}
              </div>
            );
          })}

          {renderFolderBranch(folder.id, depth + 1)}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        This section is available to admins only.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">Document Access Control</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure domain-based visibility for folders, sub-folders, and files. "Inherit" follows parent folder rules unless explicitly overridden.
        </p>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Domain-scoped visibility
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Enforced by database rules
          </Badge>
        </div>

        <div className="max-w-sm">
          <label className="mb-1 block text-xs text-muted-foreground">Target domain</label>
          <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a domain" />
            </SelectTrigger>
            <SelectContent>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {selectedDomainId !== "none" ? (
        <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          {(documentsByFolder.get("unfiled") ?? []).map((file) => {
            const fileState =
              documentRulesMap.get(`${file.id}:${selectedDomainId}`) ?? "inherit";

            return (
              <div
                key={file.id}
                className="grid grid-cols-[1fr,160px] items-center gap-3 rounded-lg border border-border/40 bg-background px-3 py-2"
              >
                <p className="truncate text-xs text-foreground">📄 {file.title}</p>
                {renderVisibilitySelect(fileState, (next) => handleDocumentStateChange(file.id, next), setDocumentVisibility.isPending)}
              </div>
            );
          })}

          {renderFolderBranch(null, 0)}
        </section>
      ) : null}
    </div>
  );
};

export default SettingsDocumentAccess;
