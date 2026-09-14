import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { DOMAIN_LIST, domainOf } from "@/lib/domains";
import DomainBadge from "@/components/DomainBadge";
import { ArrowRight } from "lucide-react";

export default function ProcessFlow({ processId }) {
  const [flow, setFlow] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api.get(`/processes/${processId}/flow`).then((r) => setFlow(r.data)); }, [processId]);
  if (!flow) return <div className="text-sm text-slate-400">Loading process flow…</div>;
  if (!flow.steps?.length) return <div className="text-sm text-slate-500 italic">This process has no linked steps yet. Add `has_step` relationships from Process → Process Steps.</div>;

  return (
    <div className="space-y-4" data-testid="process-flow">
      <div className="text-eyebrow">Business Process Flow · {flow.process.name}</div>

      {/* Horizontal step ribbon */}
      <div className="eams-panel p-3 overflow-x-auto">
        <div className="flex items-stretch gap-2 min-w-max">
          {flow.steps.map((s, i) => (
            <React.Fragment key={s.step.id}>
              <button
                onClick={() => nav(`/object/${s.step.id}`)}
                data-testid={`flow-step-${s.step.id}`}
                className="min-w-[220px] eams-card p-3 text-left border-amber-500/30 hover:scale-[1.02] transition-transform"
                style={{ borderLeft: "3px solid #f59e0b" }}
              >
                <div className="mono text-[10px] uppercase tracking-widest text-amber-400">{s.step.code || `Step ${i + 1}`}</div>
                <div className="text-sm text-white font-semibold heading mt-0.5">{s.step.name}</div>
                {s.step.description && <div className="text-xs text-slate-400 mt-1 line-clamp-2">{s.step.description}</div>}
              </button>
              {i < flow.steps.length - 1 && <ArrowRight className="h-5 w-5 text-slate-600 self-center" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Per-domain layered grid: rows = domains, columns = steps */}
      <div className="eams-card p-3 overflow-x-auto">
        <div className="min-w-max">
          <div className="grid gap-2" style={{ gridTemplateColumns: `180px repeat(${flow.steps.length}, minmax(220px, 1fr))` }}>
            <div />
            {flow.steps.map((s) => (
              <div key={`h-${s.step.id}`} className="text-eyebrow text-center py-2 border-b border-slate-800">
                <span className="text-amber-400">{s.step.code}</span>
              </div>
            ))}
            {DOMAIN_LIST.filter((d) => d.key !== "business").map((d) => {
              const DIcon = d.icon;
              return (
                <React.Fragment key={d.key}>
                  <div className="flex items-center gap-2 py-3 pr-3 border-r border-slate-800">
                    <div className="h-8 w-8 rounded grid place-items-center" style={{ background: d.color_soft, border: `1px solid ${d.color}55` }}>
                      <DIcon className="h-4 w-4" style={{ color: d.color }} />
                    </div>
                    <span className="text-eyebrow" style={{ color: d.color }}>{d.name}</span>
                  </div>
                  {flow.steps.map((s) => {
                    const items = s.touches?.[d.key] || [];
                    return (
                      <div key={`${d.key}-${s.step.id}`} className="py-2 px-1 min-h-[60px] border-b border-slate-800/50">
                        <div className="space-y-1">
                          {items.map((it) => (
                            <button
                              key={it.id}
                              onClick={() => nav(`/object/${it.id}`)}
                              data-testid={`flow-touch-${s.step.id}-${it.id}`}
                              className="w-full text-left px-2 py-1 rounded border text-xs transition-colors hover:scale-[1.01]"
                              style={{ background: d.color_soft, borderColor: `${d.color}55`, color: d.color }}
                            >
                              <div className="mono text-[10px] uppercase tracking-widest opacity-70">{it.code}</div>
                              <div className="text-white font-medium truncate">{it.name}</div>
                            </button>
                          ))}
                          {items.length === 0 && <div className="text-xs text-slate-700 mono px-2 py-1">—</div>}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
