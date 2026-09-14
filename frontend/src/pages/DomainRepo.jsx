import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { domainOf, CRITICALITIES, STATUSES, LIFECYCLES } from "@/lib/domains";
import { Breadcrumb } from "@/components/AppShell";
import DomainBadge, { CriticalityChip, StatusChip } from "@/components/DomainBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

function ObjectForm({ domain, initial, onSave, onCancel }) {
  const d = domainOf(domain);
  const [f, setF] = useState({
    domain, type: initial?.type || d.types[0].key,
    code: initial?.code || "", name: initial?.name || "",
    description: initial?.description || "", owner: initial?.owner || "",
    status: initial?.status || "Active", lifecycle: initial?.lifecycle || "Production",
    criticality: initial?.criticality || "Medium",
    tags: (initial?.tags || []).join(", "),
    attributes: initial?.attributes || {},
  });
  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...f, tags: f.tags ? f.tags.split(",").map((x) => x.trim()).filter(Boolean) : [] };
    await onSave(payload);
  };
  return (
    <form onSubmit={submit} className="space-y-4" data-testid="object-form">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
            <SelectTrigger data-testid="form-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {d.types.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Code</Label>
          <Input data-testid="form-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="e.g. CAP-01" />
        </div>
      </div>
      <div>
        <Label>Name *</Label>
        <Input required data-testid="form-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea data-testid="form-description" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Owner</Label>
          <Input data-testid="form-owner" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} />
        </div>
        <div>
          <Label>Criticality</Label>
          <Select value={f.criticality} onValueChange={(v) => setF({ ...f, criticality: v })}>
            <SelectTrigger data-testid="form-criticality"><SelectValue /></SelectTrigger>
            <SelectContent>{CRITICALITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
            <SelectTrigger data-testid="form-status"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Lifecycle</Label>
          <Select value={f.lifecycle} onValueChange={(v) => setF({ ...f, lifecycle: v })}>
            <SelectTrigger data-testid="form-lifecycle"><SelectValue /></SelectTrigger>
            <SelectContent>{LIFECYCLES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Tags (comma-separated)</Label>
        <Input data-testid="form-tags" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" data-testid="form-save" style={{ background: d.color, color: "#000" }}>Save</Button>
      </DialogFooter>
    </form>
  );
}

export default function DomainRepo() {
  const { key } = useParams();
  const d = domainOf(key);
  const Icon = d.icon;
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState(null);
  const nav = useNavigate();

  const load = async () => {
    const r = await api.get(`/objects?domain=${d.key}`);
    setItems(r.data);
  };
  useEffect(() => { load(); }, [d.key]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (typeFilter !== "all" && it.type !== typeFilter) return false;
      if (q && !`${it.name} ${it.code} ${it.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [items, q, typeFilter]);

  const create = async (payload) => {
    try { await api.post("/objects", payload); toast.success("Object created"); setOpenNew(false); load(); }
    catch (e) { toast.error("Failed to create"); }
  };
  const update = async (payload) => {
    try { await api.put(`/objects/${editing.id}`, payload); toast.success("Object updated"); setEditing(null); load(); }
    catch (e) { toast.error("Failed to update"); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this object and its relationships?")) return;
    await api.delete(`/objects/${id}`); toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-5" data-testid={`domain-repo-${d.key}`}>
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: `${d.name} Domain` }]} />
      <div className="eams-card p-6 relative overflow-hidden" style={{ borderColor: `${d.color}33` }}>
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: d.color }} />
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-md grid place-items-center" style={{ background: d.color_soft, border: `1px solid ${d.color}55` }}>
            <Icon className="h-6 w-6" style={{ color: d.color }} />
          </div>
          <div className="flex-1">
            <div className="text-eyebrow" style={{ color: d.color }}>{d.name} Domain Repository</div>
            <h1 className="text-3xl heading font-bold text-white">{d.name} Objects</h1>
            <p className="text-sm text-slate-400 mt-1">{items.length} objects across {d.types.length} type{d.types.length !== 1 ? "s" : ""}.</p>
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button data-testid={`new-${d.key}-btn`} className="text-black" style={{ background: d.color }}>
                <Plus className="h-4 w-4 mr-1" /> New {d.name} Object
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New {d.name} Object</DialogTitle></DialogHeader>
              <ObjectForm domain={d.key} onSave={create} onCancel={() => setOpenNew(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input data-testid="repo-search" placeholder={`Search ${d.name} objects…`} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-slate-900/60 border-slate-700" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-56" data-testid="repo-type-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {d.types.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="eams-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-800 text-slate-400">
              <th className="p-3 font-medium w-28">Code</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium w-40">Type</th>
              <th className="p-3 font-medium w-40">Owner</th>
              <th className="p-3 font-medium w-36">Criticality</th>
              <th className="p-3 font-medium w-32">Status</th>
              <th className="p-3 font-medium w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No objects yet. Click "New" above to add one.</td></tr>
            )}
            {filtered.map((it) => {
              const type = d.types.find((t) => t.key === it.type);
              const TIcon = type?.icon || Icon;
              return (
                <tr key={it.id} className="border-b border-slate-800/50 hover:bg-slate-900/40" data-testid={`repo-row-${it.id}`}>
                  <td className="p-3 mono text-xs text-slate-400">{it.code || "—"}</td>
                  <td className="p-3">
                    <button onClick={() => nav(`/object/${it.id}`)} className="text-white hover:underline text-left" data-testid={`open-object-${it.id}`}>
                      <div className="flex items-center gap-2">
                        <TIcon className="h-4 w-4" style={{ color: d.color }} />
                        <span>{it.name}</span>
                      </div>
                      {it.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{it.description}</div>}
                    </button>
                  </td>
                  <td className="p-3"><span className="text-xs mono uppercase tracking-widest" style={{ color: d.color }}>{type?.label || it.type}</span></td>
                  <td className="p-3 text-slate-300">{it.owner || "—"}</td>
                  <td className="p-3"><CriticalityChip level={it.criticality} /></td>
                  <td className="p-3"><StatusChip status={it.status} /></td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(it)} data-testid={`edit-${it.id}`} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(it.id)} data-testid={`delete-${it.id}`} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 ml-1"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit {editing?.name}</DialogTitle></DialogHeader>
          {editing && <ObjectForm domain={d.key} initial={editing} onSave={update} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
