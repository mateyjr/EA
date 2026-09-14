import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DOMAIN_LIST } from "@/lib/domains";
import DomainBadge, { StatusChip, CriticalityChip } from "@/components/DomainBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

const LEVELS = ["Low", "Medium", "High"];

export default function Risks() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ code: "", title: "", domain: "application", description: "", likelihood: "Medium", impact: "Medium", severity: "Medium", score: 6, mitigation: "", owner: "", status: "Open" });
  const load = async () => setList((await api.get("/risks")).data);
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    try { await api.post("/risks", f); toast.success("Risk created"); setOpen(false); load(); }
    catch { toast.error("Failed"); }
  };
  const del = async (id) => { if (!window.confirm("Delete?")) return; await api.delete(`/risks/${id}`); load(); };

  return (
    <div className="space-y-5" data-testid="risks-page">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-red-500/15 border border-red-500/40">
          <ShieldAlert className="h-6 w-6 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow">Governance</div>
          <h1 className="text-3xl heading font-bold text-white">Architecture Risks & Technical Debt</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-risk-btn" className="bg-red-500 hover:bg-red-400 text-white"><Plus className="h-4 w-4 mr-1" /> New Risk</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Risk</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code *</Label><Input required data-testid="risk-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="RISK-005" /></div>
                <div>
                  <Label>Domain</Label>
                  <Select value={f.domain} onValueChange={(v) => setF({ ...f, domain: v })}>
                    <SelectTrigger data-testid="risk-domain"><SelectValue /></SelectTrigger>
                    <SelectContent>{DOMAIN_LIST.map((d) => <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Title *</Label><Input required data-testid="risk-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea data-testid="risk-desc" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                {[["likelihood", "Likelihood"], ["impact", "Impact"], ["severity", "Severity"]].map(([k, label]) => (
                  <div key={k}>
                    <Label>{label}</Label>
                    <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
                      <SelectTrigger data-testid={`risk-${k}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div><Label>Mitigation</Label><Textarea data-testid="risk-mitigation" rows={2} value={f.mitigation} onChange={(e) => setF({ ...f, mitigation: e.target.value })} /></div>
              <div><Label>Owner</Label><Input data-testid="risk-owner" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="risk-save" className="bg-red-500 hover:bg-red-400 text-white">Save</Button>
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
              <th className="p-3">Title</th>
              <th className="p-3 w-40">Domain</th>
              <th className="p-3 w-32">Severity</th>
              <th className="p-3 w-32">Owner</th>
              <th className="p-3 w-28">Status</th>
              <th className="p-3 w-16 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b border-slate-800/50" data-testid={`risk-row-${r.id}`}>
                <td className="p-3 mono text-xs text-slate-400">{r.code}</td>
                <td className="p-3 text-white">{r.title}<div className="text-xs text-slate-500 line-clamp-1">{r.description}</div></td>
                <td className="p-3"><DomainBadge domain={r.domain} /></td>
                <td className="p-3"><CriticalityChip level={r.severity} /></td>
                <td className="p-3 text-slate-300">{r.owner || "—"}</td>
                <td className="p-3"><StatusChip status={r.status} /></td>
                <td className="p-3 text-right"><button onClick={() => del(r.id)} data-testid={`del-risk-${r.id}`} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No risks logged.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
