import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Mail, Plus, Trash2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [reports, setReports] = useState([]);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState([]);

  const load = async () => {
    const [s, r] = await Promise.all([api.get("/subscriptions"), api.get("/reports")]);
    setSubs(s.data); setReports(r.data);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!selected.length) { toast.error("Select at least one report"); return; }
    try { await api.post("/subscriptions", { email, report_keys: selected }); toast.success("Subscription saved"); setOpen(false); setEmail(""); setSelected([]); load(); }
    catch { toast.error("Failed"); }
  };
  const del = async (id) => { if (!window.confirm("Unsubscribe?")) return; await api.delete(`/subscriptions/${id}`); load(); };
  const sendNow = async (id) => {
    try { const r = await api.post(`/subscriptions/${id}/send-now`); toast.success(r.data.dry_run ? "Sent (dry-run — email key not configured)" : "Email dispatched"); load(); }
    catch { toast.error("Send failed"); }
  };

  return (
    <div className="eams-card p-5" data-testid="subscriptions-panel">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-md grid place-items-center bg-amber-500/15 border border-amber-500/40">
          <Mail className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow">Weekly Digest</div>
          <h3 className="text-lg heading font-semibold text-white">Scheduled Report Emails</h3>
          <p className="text-xs text-slate-400">Delivered every Monday at 08:00 UTC.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-sub-btn" className="bg-amber-500 text-black hover:bg-amber-400"><Plus className="h-4 w-4 mr-1" /> Subscribe</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Subscription</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Recipient email *</Label><Input required type="email" data-testid="sub-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="architect@company.com" /></div>
              <div>
                <Label>Reports to include</Label>
                <div className="grid grid-cols-2 gap-2 mt-1 max-h-56 overflow-auto">
                  {reports.map((r) => (
                    <button
                      key={r.key} type="button"
                      onClick={() => setSelected((s) => s.includes(r.key) ? s.filter((k) => k !== r.key) : [...s, r.key])}
                      data-testid={`sub-report-${r.key}`}
                      className={`text-left px-2 py-1.5 rounded border text-xs ${selected.includes(r.key) ? "border-amber-400 bg-amber-500/15 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}
                    >
                      {selected.includes(r.key) && <CheckCircle2 className="h-3 w-3 inline mr-1 text-amber-400" />}
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="sub-save" className="bg-amber-500 text-black hover:bg-amber-400">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {subs.map((s) => (
          <div key={s.id} className="eams-panel p-3 flex items-center gap-3" data-testid={`sub-${s.id}`}>
            <div className="h-9 w-9 rounded grid place-items-center bg-amber-500/10 border border-amber-500/30">
              <Mail className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white">{s.email}</div>
              <div className="text-xs text-slate-400">
                {s.report_keys.length} report{s.report_keys.length !== 1 ? "s" : ""} · last sent: {s.last_sent_at ? new Date(s.last_sent_at).toLocaleString() : "never"}
              </div>
            </div>
            <button onClick={() => sendNow(s.id)} data-testid={`send-now-${s.id}`} className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1"><Send className="h-3.5 w-3.5" /> Send now</button>
            <button onClick={() => del(s.id)} data-testid={`del-sub-${s.id}`} className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {subs.length === 0 && <div className="text-sm text-slate-500 italic text-center py-4">No subscriptions yet. Add one above.</div>}
      </div>
    </div>
  );
}
