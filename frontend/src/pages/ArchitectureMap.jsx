import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { DOMAIN_LIST, domainOf } from "@/lib/domains";
import { Map } from "lucide-react";

export default function ArchitectureMap() {
  const [objs, setObjs] = useState([]);
  const nav = useNavigate();
  useEffect(() => { api.get("/objects").then((r) => setObjs(r.data)); }, []);
  const grouped = useMemo(() => {
    const g = {};
    for (const d of DOMAIN_LIST) g[d.key] = objs.filter((o) => o.domain === d.key);
    return g;
  }, [objs]);

  return (
    <div className="space-y-5" data-testid="architecture-map">
      <div className="eams-card p-6 relative overflow-hidden eams-grid">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg,#f59e0b,#3b82f6,#10b981,#ef4444,#8b5cf6,#64748b)" }} />
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-md grid place-items-center bg-slate-800 border border-slate-700">
            <Map className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-eyebrow">Enterprise Architecture Map</div>
            <h1 className="text-3xl heading font-bold text-white">Six-Domain Landscape</h1>
            <p className="text-sm text-slate-400 mt-1">Traverse from Business at the top → down to Technology.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {DOMAIN_LIST.map((d) => {
          const items = grouped[d.key] || [];
          const Icon = d.icon;
          return (
            <div key={d.key} className="eams-card p-4 relative overflow-hidden" style={{ borderColor: `${d.color}33` }} data-testid={`map-domain-${d.key}`}>
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: d.color }} />
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded grid place-items-center" style={{ background: d.color_soft, border: `1px solid ${d.color}55` }}>
                  <Icon className="h-5 w-5" style={{ color: d.color }} />
                </div>
                <div>
                  <div className="text-eyebrow" style={{ color: d.color }}>{d.name} Domain</div>
                  <div className="text-lg heading font-semibold text-white">{items.length} objects</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {items.slice(0, 24).map((o) => {
                  const t = d.types.find((tt) => tt.key === o.type);
                  const TIcon = t?.icon || Icon;
                  return (
                    <button
                      key={o.id}
                      onClick={() => nav(`/object/${o.id}`)}
                      data-testid={`map-obj-${o.id}`}
                      className="text-left p-2 rounded border transition hover:scale-[1.02]"
                      style={{ background: `${d.color}0d`, borderColor: `${d.color}33` }}
                    >
                      <div className="flex items-center gap-1.5">
                        <TIcon className="h-3.5 w-3.5" style={{ color: d.color }} />
                        <span className="mono text-[10px] uppercase tracking-widest" style={{ color: d.color }}>{o.code || o.type}</span>
                      </div>
                      <div className="text-xs text-white mt-1 line-clamp-2">{o.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
