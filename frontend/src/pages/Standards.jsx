import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DOMAIN_LIST } from "@/lib/domains";
import DomainBadge, { StatusChip } from "@/components/DomainBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Standards() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ code: "", name: "", domain: "security", description: "", mandatory: true, version: "1.0", owner: "", status: "Active" });
  const load = async () => setList((await api.get("/standards")).data);
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    try { await api.post("/standards", f); toast.success("Standard created"); setOpen(false); load(); }
    catch { toast.error("Failed"); }
  };
  const del = async (id) => { if (!window.confirm("Delete?")) return; await api.delete(`/standards/${id}`); load(); };

  return (
    <div className="space-y-5" data-testid="standards-page">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-blue-500/15 border border-blue-500/40">
          <ScrollText className="h-6 w-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow">Governance</div>
          <h1 className="text-3xl heading font-bold text-white">Architecture Standards</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-standard-btn" className="bg-blue-500 hover:bg-blue-400 text-white"><Plus className="h-4 w-4 mr-1" /> New Standard</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Standard</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code *</Label><Input required data-testid="std-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="STD-005" /></div>
                <div>
                  <Label>Domain</Label>
                  <Select value={f.domain} onValueChange={(v) => setF({ ...f, domain: v })}>
                    <SelectTrigger data-testid="std-domain"><SelectValue /></SelectTrigger>
                    <SelectContent>{DOMAIN_LIST.map((d) => <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Name *</Label><Input required data-testid="std-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea data-testid="std-desc" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Version</Label><Input data-testid="std-version" value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} /></div>
                <div><Label>Owner</Label><Input data-testid="std-owner" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></div>
                <div className="flex items-center gap-2 pt-6"><Switch checked={f.mandatory} onCheckedChange={(v) => setF({ ...f, mandatory: v })} data-testid="std-mandatory" /><Label>Mandatory</Label></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="std-save" className="bg-blue-500 hover:bg-blue-400 text-white">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="eams-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-800 text-slate-400">
              <th className="p-3 w-28">Code</th>
              <th className="p-3">Standard</th>
              <th className="p-3 w-40">Domain</th>
              <th className="p-3 w-28">Version</th>
              <th className="p-3 w-32">Mandatory</th>
              <th className="p-3 w-28">Status</th>
              <th className="p-3 w-16 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-b border-slate-800/50" data-testid={`std-row-${s.id}`}>
                <td className="p-3 mono text-xs text-slate-400">{s.code}</td>
                <td className="p-3 text-white">{s.name}<div className="text-xs text-slate-500 line-clamp-1">{s.description}</div></td>
                <td className="p-3"><DomainBadge domain={s.domain} /></td>
                <td className="p-3 text-slate-300 mono text-xs">{s.version}</td>
                <td className="p-3">{s.mandatory ? <span className="text-xs mono uppercase tracking-widest text-red-400">Mandatory</span> : <span className="text-xs mono uppercase tracking-widest text-slate-400">Recommended</span>}</td>
                <td className="p-3"><StatusChip status={s.status} /></td>
                <td className="p-3 text-right"><button onClick={() => del(s.id)} data-testid={`del-std-${s.id}`} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No standards yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
