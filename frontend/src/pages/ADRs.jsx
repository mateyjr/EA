import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DOMAIN_LIST } from "@/lib/domains";
import DomainBadge, { StatusChip } from "@/components/DomainBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, BookMarked, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["Proposed", "Accepted", "Superseded", "Rejected", "Deprecated"];

export default function ADRs() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", domain: "application", context: "", problem: "", options: "", decision: "", rationale: "", consequences: "", status: "Proposed", owner: "" });
  const load = async () => setList((await api.get("/adrs")).data);
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    try { await api.post("/adrs", f); toast.success("ADR created"); setOpen(false); load(); }
    catch { toast.error("Failed"); }
  };
  const del = async (id) => { if (!window.confirm("Delete ADR?")) return; await api.delete(`/adrs/${id}`); load(); };

  return (
    <div className="space-y-5" data-testid="adrs-page">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-emerald-500/15 border border-emerald-500/40">
          <BookMarked className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow">Governance</div>
          <h1 className="text-3xl heading font-bold text-white">Architecture Decision Records</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-adr-btn" className="bg-emerald-500 text-black hover:bg-emerald-400"><Plus className="h-4 w-4 mr-1" /> New ADR</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>New ADR</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title *</Label><Input required data-testid="adr-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
                <div>
                  <Label>Domain</Label>
                  <Select value={f.domain} onValueChange={(v) => setF({ ...f, domain: v })}>
                    <SelectTrigger data-testid="adr-domain"><SelectValue /></SelectTrigger>
                    <SelectContent>{DOMAIN_LIST.map((d) => <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Context</Label><Textarea data-testid="adr-context" rows={2} value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })} /></div>
              <div><Label>Problem</Label><Textarea data-testid="adr-problem" rows={2} value={f.problem} onChange={(e) => setF({ ...f, problem: e.target.value })} /></div>
              <div><Label>Decision</Label><Textarea data-testid="adr-decision" rows={2} value={f.decision} onChange={(e) => setF({ ...f, decision: e.target.value })} /></div>
              <div><Label>Rationale</Label><Textarea data-testid="adr-rationale" rows={2} value={f.rationale} onChange={(e) => setF({ ...f, rationale: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                    <SelectTrigger data-testid="adr-status"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Owner</Label><Input data-testid="adr-owner" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="adr-save" className="bg-emerald-500 text-black hover:bg-emerald-400">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {list.map((a) => (
          <div key={a.id} className="eams-card p-4" data-testid={`adr-${a.id}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="mono text-xs text-emerald-400">ADR-{String(a.number).padStart(3, "0")}</span>
                  <DomainBadge domain={a.domain} />
                  <StatusChip status={a.status} />
                </div>
                <h3 className="text-lg heading font-semibold text-white">{a.title}</h3>
                {a.decision && <p className="text-sm text-slate-300 mt-1"><span className="text-slate-500 mono text-xs">DECISION · </span>{a.decision}</p>}
                {a.rationale && <p className="text-sm text-slate-400 mt-1"><span className="text-slate-500 mono text-xs">RATIONALE · </span>{a.rationale}</p>}
                {a.owner && <div className="text-xs text-slate-500 mt-2">Owner: {a.owner}</div>}
              </div>
              <button onClick={() => del(a.id)} data-testid={`del-adr-${a.id}`} className="p-2 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-slate-500 italic text-center py-12">No ADRs yet.</div>}
      </div>
    </div>
  );
}
