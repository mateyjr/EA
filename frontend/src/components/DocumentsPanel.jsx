import React, { useEffect, useState, useRef } from "react";
import { api, API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, Paperclip, Download, Trash2, File as FileIcon, FileText, FileImage } from "lucide-react";
import { toast } from "sonner";

function iconFor(ct = "") {
  if (ct.startsWith("image/")) return FileImage;
  if (ct.includes("pdf") || ct.includes("text")) return FileText;
  return FileIcon;
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPanel({ objectId, accent }) {
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef();

  const load = async () => {
    const r = await api.get(`/objects/${objectId}/documents`);
    setDocs(r.data);
  };
  useEffect(() => { load(); }, [objectId]);

  const upload = async (file) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/objects/${objectId}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`${file.name} uploaded`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Upload failed");
    }
    setBusy(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) upload(e.dataTransfer.files[0]);
  };

  const download = async (doc) => {
    const token = localStorage.getItem("eams_token");
    const res = await fetch(`${API}/documents/${doc.id}/download?token=${encodeURIComponent(token)}`);
    if (!res.ok) { toast.error("Download failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = doc.filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    await api.delete(`/documents/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-3" data-testid="documents-panel">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="eams-panel border-dashed p-6 text-center hover:border-slate-600 transition-colors"
        data-testid="drop-zone"
      >
        <Paperclip className="h-6 w-6 mx-auto mb-2 text-slate-500" />
        <div className="text-sm text-slate-400 mb-3">Drag & drop diagrams, PDFs, or specs — or browse to attach.</div>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} data-testid="doc-file-input" />
        <Button disabled={busy} onClick={() => inputRef.current?.click()} className="text-black" style={{ background: accent || "#f59e0b" }} data-testid="doc-upload-btn">
          <Upload className="h-4 w-4 mr-1" /> {busy ? "Uploading…" : "Choose file"}
        </Button>
        <div className="text-xs text-slate-500 mt-2">Max 15MB per file.</div>
      </div>

      <div className="space-y-2">
        {docs.map((d) => {
          const Icon = iconFor(d.content_type);
          return (
            <div key={d.id} className="eams-panel p-3 flex items-center gap-3" data-testid={`doc-${d.id}`}>
              <div className="h-9 w-9 rounded grid place-items-center border border-slate-700 bg-slate-800/50">
                <Icon className="h-4 w-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{d.filename}</div>
                <div className="text-xs text-slate-500 mono">{humanSize(d.size)} · {d.content_type} · uploaded by {d.uploaded_by}</div>
              </div>
              <button onClick={() => download(d)} data-testid={`doc-dl-${d.id}`} className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white"><Download className="h-4 w-4" /></button>
              <button onClick={() => del(d.id)} data-testid={`doc-del-${d.id}`} className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          );
        })}
        {docs.length === 0 && <div className="text-sm text-slate-500 italic text-center py-4">No documents attached yet.</div>}
      </div>
    </div>
  );
}
