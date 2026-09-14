import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DOMAIN_LIST, domainOf } from "@/lib/domains";
import DomainBadge from "@/components/DomainBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

const STAGES = ["Draft", "Submitted", "Domain Reviews", "EA Review", "Committee", "Approved", "Rejected"];

function StageStepper({ stage }) {
  const idx = STAGES.indexOf(stage);
  return (
    <div className="flex items-center gap-1 mt-2" data-testid="stage-stepper">
      {STAGES.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`px-2 py-0.5 rounded text-[10px] mono uppercase tracking-widest border ${i <= idx ? "text-white border-amber-400 bg-amber-500/15" : "text-slate-500 border-slate-800"}`}>{s}</div>
          {i < STAGES.length - 1 && <div className={`h-px w-4 ${i < idx ? "bg-amber-400" : "bg-slate-700"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", submitter: "", summary: "", domains_impacted: [], stage: "Draft" });

  const load = async () => setList((await api.get("/reviews")).data);
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try { await api.post("/reviews", f); toast.success("Review submitted"); setOpen(false); setF({ title: "", submitter: "", summary: "", domains_impacted: [], stage: "Draft" }); load(); }
    catch { toast.error("Failed"); }
  };
  const advance = async (r) => {
    const idx = STAGES.indexOf(r.stage);
    if (idx >= STAGES.length - 2) return;
    const next = STAGES[idx + 1];
    await api.put(`/reviews/${r.id}/stage?stage=${encodeURIComponent(next)}`);
    load();
  };
  const reject = async (r) => { await api.put(`/reviews/${r.id}/stage?stage=Rejected`); load(); };

  return (
    <div className="space-y-5" data-testid="reviews-page">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-amber-500/15 border border-amber-500/40">
          <ClipboardCheck className="h-6 w-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow">Governance</div>
          <h1 className="text-3xl heading font-bold text-white">Architecture Reviews</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-review-btn" className="bg-amber-500 text-black hover:bg-amber-400"><Plus className="h-4 w-4 mr-1" /> New Review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Architecture Review</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Title *</Label><Input required data-testid="review-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div><Label>Submitter *</Label><Input required data-testid="review-submitter" value={f.submitter} onChange={(e) => setF({ ...f, submitter: e.target.value })} /></div>
              <div><Label>Summary</Label><Textarea data-testid="review-summary" rows={3} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></div>
              <div>
                <Label>Domains impacted</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DOMAIN_LIST.map((d) => (
                    <button
                      key={d.key} type="button"
                      onClick={() => setF({ ...f, domains_impacted: f.domains_impacted.includes(d.key) ? f.domains_impacted.filter((x) => x !== d.key) : [...f.domains_impacted, d.key] })}
                      data-testid={`review-domain-${d.key}`}
                      className={`px-2 py-1 rounded border text-xs mono uppercase tracking-widest ${f.domains_impacted.includes(d.key) ? "text-white" : "text-slate-400"}`}
                      style={{ background: f.domains_impacted.includes(d.key) ? d.color_soft : "transparent", borderColor: `${d.color}55` }}
                    >{d.name}</button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="review-save" className="bg-amber-500 text-black hover:bg-amber-400">Submit</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {list.map((r) => (
          <div key={r.id} className="eams-card p-4" data-testid={`review-${r.id}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="mono text-xs text-amber-400">{r.code}</span>
                  <span className="text-xs text-slate-500">by {r.submitter}</span>
                </div>
                <h3 className="text-lg heading font-semibold text-white">{r.title}</h3>
                {r.summary && <p className="text-sm text-slate-400 mt-1">{r.summary}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.domains_impacted?.map((k) => <DomainBadge key={k} domain={k} />)}
                </div>
                <StageStepper stage={r.stage} />
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => advance(r)} disabled={r.stage === "Approved" || r.stage === "Rejected"} data-testid={`advance-${r.id}`} className="bg-emerald-500 text-black hover:bg-emerald-400">Advance</Button>
                <Button size="sm" variant="destructive" onClick={() => reject(r)} disabled={r.stage === "Rejected" || r.stage === "Approved"} data-testid={`reject-${r.id}`}>Reject</Button>
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-slate-500 italic text-center py-12">No reviews yet.</div>}
      </div>
    </div>
  );
}
