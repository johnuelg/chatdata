import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Upload, Plus, X, FolderPlus, CheckCircle2, AlertCircle, FileSearch, MinusCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useDocumentFolders, useAddDocumentFolder } from "@/hooks/useDocumentFolders";
import { useDomains } from "@/hooks/useDomains";
import { useAddDocument } from "@/hooks/useDocuments";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { extractTextFromFile } from "@/lib/extractText";

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UploadDocumentDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { data: domains = [] } = useDomains();
  const { data: folders = [] } = useDocumentFolders();
  const addDocument = useAddDocument();
  const addFolder = useAddDocumentFolder();

  const { data: isAdminUser = false } = useQuery({
    queryKey: ["is-admin-for-document-upload", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin");
      if (error) return false;
      return (data ?? []).length > 0;
    },
  });

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ["document-access-users"],
    enabled: isAdminUser,
    queryFn: async () => {
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      const adminUserIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

      return (profiles ?? [])
        .filter((profile) => !adminUserIds.has(profile.id))
        .map((profile) => ({
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
        }));
    },
  });

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDomain, setUploadDomain] = useState<string>("none");
  const [uploadFolder, setUploadFolder] = useState<string>("none");
  const [uploading, setUploading] = useState(false);
  const [allUsersAllowed, setAllUsersAllowed] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type FileStatus =
    | { stage: "pending" }
    | { stage: "uploading" }
    | { stage: "extracting"; progress?: number }
    | { stage: "saving" }
    | { stage: "done"; chars: number; extracted: boolean }
    | { stage: "skipped"; reason: string }
    | { stage: "failed"; error: string };
  const [statuses, setStatuses] = useState<FileStatus[]>([]);

  const updateStatus = (i: number, s: FileStatus) =>
    setStatuses(prev => {
      const next = [...prev];
      next[i] = s;
      return next;
    });

  const acceptedExtensions = /\.(pdf|csv|xlsx|xls|doc|docx|png|jpg|jpeg)$/i;

  const isDomainSelected = uploadDomain && uploadDomain !== "none";
  const filteredFolders = isDomainSelected
    ? folders.filter(f => f.domain_id === uploadDomain)
    : [];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const result = await addFolder.mutateAsync({
        name: newFolderName.trim(),
        domain_id: uploadDomain !== "none" ? uploadDomain : null,
        created_by: user?.id || null,
      });
      setUploadFolder(result.id);
      setNewFolderName("");
      setShowNewFolder(false);
      toast({ title: "Folder created" });
    } catch (err: any) {
      toast({ title: "Failed to create folder", description: err.message, variant: "destructive" });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFiles.length) return;
    if (!allUsersAllowed && selectedUserIds.size === 0) {
      toast({
        title: "Select at least one user",
        description: "Choose one or more users, or enable All users before uploading.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    setStatuses(uploadFiles.map(() => ({ stage: "pending" as const })));
    let uploaded = 0;
    let versioned = 0;
    let failed = 0;
    try {
      const targetFolderId = uploadFolder !== "none" ? uploadFolder : null;
      const targetDomainId = uploadDomain !== "none" ? uploadDomain : null;

      const pathParts: string[] = [];
      if (targetDomainId) pathParts.push(targetDomainId);
      if (targetFolderId) pathParts.push(targetFolderId);
      const prefix = pathParts.length > 0 ? pathParts.join("/") + "/" : "";

      for (let idx = 0; idx < uploadFiles.length; idx++) {
        const file = uploadFiles[idx];
        try {
          let versionQuery = supabase
            .from("documents")
            .select("version")
            .eq("file_name", file.name);

          if (targetFolderId) versionQuery = versionQuery.eq("folder_id", targetFolderId);
          else versionQuery = versionQuery.is("folder_id", null);
          if (targetDomainId) versionQuery = versionQuery.eq("domain_id", targetDomainId);
          else versionQuery = versionQuery.is("domain_id", null);

          const { data: existingVersions } = await versionQuery.order("version", { ascending: false }).limit(1);
          const nextVersion = existingVersions && existingVersions.length > 0
            ? existingVersions[0].version + 1
            : 1;
          if (nextVersion > 1) versioned++;

          updateStatus(idx, { stage: "uploading" });
          const ext = file.name.split(".").pop();
          const filePath = `${prefix}${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
          if (uploadError) throw uploadError;

          updateStatus(idx, { stage: "extracting", progress: 0 });
          const extraction = await extractTextFromFile(file, {
            onProgress: (cur, total) => {
              const pct = total > 0 ? Math.round((cur / total) * 100) : 0;
              updateStatus(idx, { stage: "extracting", progress: pct });
            },
          });

          updateStatus(idx, { stage: "saving" });
          const createdDocument = await addDocument.mutateAsync({
            title: file.name.replace(/\.[^/.]+$/, ""),
            description: "",
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type || ext || "",
            domain_id: targetDomainId,
            uploaded_by: user?.id || null,
            ai_ready: extraction.text.length > 0,
            folder_id: targetFolderId,
            version: nextVersion,
            content_text: extraction.text,
          } as any);

          const allowedUserIds = allUsersAllowed
            ? assignableUsers.map((u) => u.id)
            : Array.from(selectedUserIds);

          if (allowedUserIds.length > 0) {
            const accessRows = allowedUserIds.map((targetUserId) => ({
              document_id: createdDocument.id,
              user_id: targetUserId,
              granted_by: user?.id ?? null,
            }));

            const { error: accessError } = await supabase
              .from("document_user_access" as any)
              .insert(accessRows as any);

            if (accessError) throw accessError;
          }

          if (extraction.error) {
            updateStatus(idx, { stage: "failed", error: `Saved, but extraction failed: ${extraction.error}` });
          } else if (extraction.kind === "unsupported") {
            updateStatus(idx, { stage: "skipped", reason: "No text extraction for this file type" });
          } else {
            updateStatus(idx, { stage: "done", chars: extraction.text.length, extracted: extraction.text.length > 0 });
          }
          uploaded++;
        } catch (err: any) {
          failed++;
          updateStatus(idx, { stage: "failed", error: err?.message || "Upload failed" });
        }
      }

      const versionNote = versioned > 0 ? ` (${versioned} as new versions)` : "";
      if (failed === 0) {
        toast({ title: "Documents uploaded", description: `${uploaded} file(s) uploaded successfully${versionNote}.` });
        onOpenChange(false);
        resetForm();
      } else {
        toast({
          title: "Upload finished with errors",
          description: `${uploaded} succeeded, ${failed} failed. See list for details.`,
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setUploadFiles([]);
    setUploadDomain("none");
    setUploadFolder("none");
    setAllUsersAllowed(true);
    setSelectedUserIds(new Set());
    setNewFolderName("");
    setShowNewFolder(false);
    setStatuses([]);
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setStatuses(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSelectedUser = (userId: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedUserIds(next);
    if (next.size > 0) setAllUsersAllowed(false);
  };

  const handleFiles = (files: File[]) => {
    const valid = files.filter(f => acceptedExtensions.test(f.name));
    if (valid.length) {
      setUploadFiles(prev => [...prev, ...valid]);
      setStatuses(prev => [...prev, ...valid.map(() => ({ stage: "pending" as const }))]);
    }
  };

  const renderStatus = (s: FileStatus | undefined) => {
    if (!s || s.stage === "pending") {
      return <span className="text-xs text-muted-foreground">Ready</span>;
    }
    if (s.stage === "uploading") {
      return (
        <span className="flex items-center gap-1 text-xs text-primary">
          <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
        </span>
      );
    }
    if (s.stage === "extracting") {
      return (
        <span className="flex items-center gap-1.5 text-xs text-primary min-w-[110px]">
          <FileSearch className="h-3 w-3 animate-pulse" />
          <span className="shrink-0">Extracting</span>
          {typeof s.progress === "number" && (
            <Progress value={s.progress} className="h-1 w-12" />
          )}
        </span>
      );
    }
    if (s.stage === "saving") {
      return (
        <span className="flex items-center gap-1 text-xs text-primary">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </span>
      );
    }
    if (s.stage === "done") {
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {s.extracted ? `${s.chars.toLocaleString()} chars` : "Uploaded"}
        </span>
      );
    }
    if (s.stage === "skipped") {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground" title={s.reason}>
          <MinusCircle className="h-3.5 w-3.5" /> No text
        </span>
      );
    }
    if (s.stage === "failed") {
      return (
        <span className="flex items-center gap-1 text-xs text-destructive" title={s.error}>
          <AlertCircle className="h-3.5 w-3.5" /> Failed
        </span>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Upload Documents</DialogTitle>
          <p className="text-sm text-muted-foreground">Select multiple files to upload at once</p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Domain & Folder row */}
          <div className={`grid gap-3 ${isDomainSelected ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="text-sm font-medium text-primary">
                Domain <span className="text-destructive">*</span>
              </label>
              <Select value={uploadDomain} onValueChange={(val) => { setUploadDomain(val); setUploadFolder("none"); setShowNewFolder(false); }}>
                <SelectTrigger className="mt-1 rounded-xl border-primary/40 focus:ring-primary">
                  <SelectValue placeholder="No domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No domain</SelectItem>
                  {domains.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isDomainSelected && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Folder</label>
              <div className="flex gap-1 mt-1">
                <Select value={uploadFolder} onValueChange={setUploadFolder}>
                  <SelectTrigger className="rounded-xl flex-1">
                    <SelectValue placeholder="No folder (unfiled)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder (unfiled)</SelectItem>
                    {filteredFolders.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="shrink-0 rounded-xl"
                  onClick={() => setShowNewFolder(!showNewFolder)}
                  title="Create new folder"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Document Visibility</label>
            <div className="rounded-xl border border-border p-3 space-y-2 max-h-44 overflow-y-auto">
              <label className="flex items-center gap-3 py-1 cursor-pointer">
                <Checkbox
                  checked={allUsersAllowed}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setAllUsersAllowed(isChecked);
                    if (isChecked) setSelectedUserIds(new Set());
                  }}
                />
                <span className="text-sm font-medium">All users</span>
              </label>

              {assignableUsers.map((targetUser) => (
                <label key={targetUser.id} className="flex items-center gap-3 py-1 cursor-pointer">
                  <Checkbox
                    checked={allUsersAllowed || selectedUserIds.has(targetUser.id)}
                    disabled={allUsersAllowed}
                    onCheckedChange={() => toggleSelectedUser(targetUser.id)}
                  />
                  <span className="text-sm truncate">
                    {targetUser.full_name || targetUser.email || "Unnamed user"}
                  </span>
                </label>
              ))}

              {isAdminUser && assignableUsers.length === 0 && (
                <p className="text-xs text-muted-foreground">No non-admin users found.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              A user must be selected here and also have access to the document's domain.
            </p>
          </div>

          {/* New folder inline */}
          {showNewFolder && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
              <Input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="flex-1 rounded-lg"
                onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
              />
              <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim() || creatingFolder}>
                {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/60"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragEnter={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(Array.from(e.dataTransfer.files));
            }}
          >
            <Upload className={`h-10 w-10 mx-auto mb-3 ${dragOver ? "text-primary" : "text-muted-foreground/40"}`} />
            <p className="text-sm text-muted-foreground font-medium">
              {dragOver ? "Drop files here" : "Drag & drop files or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, Excel, CSV, Word, Images (max 10MB each)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={e => {
                handleFiles(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
          </div>

          {/* File list */}
          {uploadFiles.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {uploadFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{f.name}</div>
                    <div className="text-[10px] text-muted-foreground">{formatFileSize(f.size)}</div>
                  </div>
                  <div className="shrink-0">{renderStatus(statuses[i])}</div>
                  <button
                    onClick={() => removeFile(i)}
                    disabled={uploading}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            disabled={!uploadFiles.length || uploading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 gap-2"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDocumentDialog;
