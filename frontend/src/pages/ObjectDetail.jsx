import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { domainOf, DOMAIN_LIST } from "@/lib/domains";
import { Breadcrumb } from "@/components/AppShell";
import DomainBadge, { CriticalityChip, StatusChip } from "@/components/DomainBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Link2, ArrowUpRight, ArrowDownRight, Plus, Trash2, Activity } from "lucide-react";
import { toast } from "sonner";
import DocumentsPanel from "@/components/DocumentsPanel";
import ProcessFlow from "@/components/ProcessFlow";

function RelationCard({ obj, rel, direction, onOpen }) {
  const d = domainOf(obj.domain);
  const Icon = d.icon;
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-colors" data-testid={`rel-${direction}-${obj.id}`}>
      <div className="h-9 w-9 rounded grid place-items-center" style={{ background: d.color_soft, border: `1px solid ${d.color}55` }}>
        <Icon className="h-4 w-4" style={{ color: d.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <button onClick={onOpen} className="text-white text-sm hover:underline text-left truncate block w-full">{obj.name}</button>
        <div className="flex items-center gap-2 mt-1">
          <DomainBadge domain={obj.domain} />
          <span className="text-[10px] mono uppercase tracking-widest text-slate-500">{rel.rel_type}</span>
        </div>
      </div>
      {direction === "downstream" ? <ArrowDownRight className="h-4 w-4 text-slate-500" /> : <ArrowUpRight className="h-4 w-4 text-slate-500" />}
    </div>
  );
}

export default function ObjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [detail, setDetail] = useState(null);
  const [allObjs, setAllObjs] = useState([]);
  const [impact, setImpact] = useState(null);
  const [openNewRel, setOpenNewRel] = useState(false);
  const [newRel, setNewRel] = useState({ target_id: "", rel_type: "supports", criticality: "Medium" });

  const load = async () => {
    const [d, o, imp] = await Promise.all([
      api.get(`/objects/${id}`),
      api.get(`/objects`),
      api.get(`/impact/${id}`),
    ]);
    setDetail(d.data); setAllObjs(o.data); setImpact(imp.data);
  };
  useEffect(() => { load(); }, [id]);

  if (!detail) return <div className="text-slate-400">Loading…</div>;
  const obj = detail.object;
  const d = domainOf(obj.domain);
  const Icon = d.icon;
  const type = d.types.find((t) => t.key === obj.type);

  const addRel = async () => {
    if (!newRel.target_id) return;
    try {
      await api.post("/relationships", { source_id: obj.id, ...newRel });
      toast.success("Relationship added");
      setOpenNewRel(false); setNewRel({ target_id: "", rel_type: "supports", criticality: "Medium" });
      load();
    } catch { toast.error("Failed"); }
  };
  const delRel = async (rid) => {
    if (!window.confirm("Delete this relationship?")) return;
    await api.delete(`/relationships/${rid}`);
    load();
  };

  return (
    <div className="space-y-5" data-testid="object-detail">
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: `${d.name}`, to: `/domain/${d.key}` }, { label: obj.name }]} />

      <div className="eams-card p-6 relative overflow-hidden" style={{ borderColor: `${d.color}44` }}>
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: d.color }} />
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-md grid place-items-center" style={{ background: d.color_soft, border: `1px solid ${d.color}55` }}>
            <Icon className="h-7 w-7" style={{ color: d.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DomainBadge domain={obj.domain} size="lg" />
              <span className="text-xs mono uppercase tracking-widest text-slate-400">{type?.label || obj.type}</span>
              {obj.code && <span className="mono text-xs text-slate-500">· {obj.code}</span>}
            </div>
            <h1 className="text-3xl heading font-bold text-white">{obj.name}</h1>
            {obj.description && <p className="text-slate-400 mt-1 max-w-3xl">{obj.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <CriticalityChip level={obj.criticality} />
              <StatusChip status={obj.status} />
              {obj.lifecycle && <span className="text-xs mono uppercase tracking-widest text-slate-400 px-2 py-0.5 border border-slate-700 rounded">{obj.lifecycle}</span>}
              {obj.owner && <span className="text-xs text-slate-400">Owner: <span className="text-slate-200">{obj.owner}</span></span>}
            </div>
          </div>
          <Button onClick={() => nav(`/traceability/${obj.id}`)} data-testid="view-traceability-btn" className="text-black" style={{ background: d.color }}>
            <GitBranch className="h-4 w-4 mr-1" /> Traceability
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800" data-testid="detail-tabs">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="relations" data-testid="tab-relations">Relationships</TabsTrigger>
          <TabsTrigger value="impact" data-testid="tab-impact">Impact Analysis</TabsTrigger>
          {obj.type === "process" && <TabsTrigger value="flow" data-testid="tab-flow">Process Flow</TabsTrigger>}
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="attributes" data-testid="tab-attributes">Attributes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="eams-panel p-4">
              <div className="text-eyebrow mb-2">Upstream</div>
              <div className="text-2xl heading font-bold text-white">{detail.upstream.length}</div>
              <div className="text-xs text-slate-400">consumers / dependents</div>
            </div>
            <div className="eams-panel p-4">
              <div className="text-eyebrow mb-2">Downstream</div>
              <div className="text-2xl heading font-bold text-white">{detail.downstream.length}</div>
              <div className="text-xs text-slate-400">providers / dependencies</div>
            </div>
            <div className="eams-panel p-4">
              <div className="text-eyebrow mb-2">Blast Radius</div>
              <div className="text-2xl heading font-bold text-white">{impact?.total_affected ?? "—"}</div>
              <div className="text-xs text-slate-400">objects impacted on failure</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relations">
          <div className="flex justify-end mb-3">
            <Dialog open={openNewRel} onOpenChange={setOpenNewRel}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="new-rel-btn" className="text-black" style={{ background: d.color }}><Plus className="h-4 w-4 mr-1" /> Add Relationship</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Relationship</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Target Object</Label>
                    <Select value={newRel.target_id} onValueChange={(v) => setNewRel({ ...newRel, target_id: v })}>
                      <SelectTrigger data-testid="rel-target"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {allObjs.filter((o) => o.id !== obj.id).map((o) => (
                          <SelectItem key={o.id} value={o.id}>[{o.domain}] {o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Relationship Type</Label>
                    <Input data-testid="rel-type" value={newRel.rel_type} onChange={(e) => setNewRel({ ...newRel, rel_type: e.target.value })} placeholder="supports, uses, hosts…" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpenNewRel(false)}>Cancel</Button>
                  <Button data-testid="rel-save" onClick={addRel} className="text-black" style={{ background: d.color }}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-eyebrow mb-2">Upstream ({detail.upstream.length})</div>
              <div className="space-y-2">
                {detail.upstream.map((o) => {
                  const rel = detail.upstream_rels.find((r) => r.source_id === o.id);
                  return (
                    <div key={o.id} className="flex items-center gap-2">
                      <div className="flex-1"><RelationCard obj={o} rel={rel} direction="upstream" onOpen={() => nav(`/object/${o.id}`)} /></div>
                      <button onClick={() => delRel(rel.id)} data-testid={`del-rel-${rel.id}`} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  );
                })}
                {detail.upstream.length === 0 && <div className="text-sm text-slate-500 italic">No upstream links.</div>}
              </div>
            </div>
            <div>
              <div className="text-eyebrow mb-2">Downstream ({detail.downstream.length})</div>
              <div className="space-y-2">
                {detail.downstream.map((o) => {
                  const rel = detail.downstream_rels.find((r) => r.target_id === o.id);
                  return (
                    <div key={o.id} className="flex items-center gap-2">
                      <div className="flex-1"><RelationCard obj={o} rel={rel} direction="downstream" onOpen={() => nav(`/object/${o.id}`)} /></div>
                      <button onClick={() => delRel(rel.id)} data-testid={`del-rel-${rel.id}`} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  );
                })}
                {detail.downstream.length === 0 && <div className="text-sm text-slate-500 italic">No downstream links.</div>}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="impact">
          <div className="eams-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-red-400" />
              <div>
                <div className="text-eyebrow text-red-400">Reverse Impact</div>
                <h3 className="text-xl heading font-semibold text-white">If {obj.name} fails, {impact?.total_affected ?? 0} objects are affected</h3>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DOMAIN_LIST.map((dd) => {
                const list = impact?.affected_by_domain?.[dd.key] || [];
                if (list.length === 0) return null;
                const DIcon = dd.icon;
                return (
                  <div key={dd.key} className="border rounded-md p-3" style={{ borderColor: `${dd.color}44`, background: dd.color_soft }}>
                    <div className="flex items-center gap-2 mb-2">
                      <DIcon className="h-4 w-4" style={{ color: dd.color }} />
                      <div className="text-eyebrow" style={{ color: dd.color }}>{dd.name} · {list.length}</div>
                    </div>
                    <div className="space-y-1">
                      {list.map((o) => (
                        <button key={o.id} onClick={() => nav(`/object/${o.id}`)} className="block w-full text-left text-sm text-white hover:underline truncate">
                          <span className="text-slate-400 mono text-xs mr-1">{o.code}</span>{o.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {impact?.total_affected === 0 && <div className="text-sm text-slate-500 italic col-span-3">No downstream impact detected.</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attributes">
          <div className="eams-panel p-5">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {Object.entries({ ...obj.attributes, tags: obj.tags?.join(", ") || "" }).map(([k, v]) => (
                <div key={k} className="border-b border-slate-800 pb-2">
                  <div className="text-eyebrow">{k.replace(/_/g, " ")}</div>
                  <div className="text-slate-200">{typeof v === "object" ? JSON.stringify(v) : (v || "—")}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {obj.type === "process" && (
          <TabsContent value="flow">
            <ProcessFlow processId={obj.id} />
          </TabsContent>
        )}

        <TabsContent value="documents">
          <DocumentsPanel objectId={obj.id} accent={d.color} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
