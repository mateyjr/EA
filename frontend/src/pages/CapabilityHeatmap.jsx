import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Grid3x3, TrendingUp } from "lucide-react";

const CRIT_COLOR = {
  "Mission-Critical": "#ef4444",
  "High": "#f97316",
  "Medium": "#f59e0b",
  "Low": "#64748b",
};

export default function CapabilityHeatmap() {
  const [data, setData] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api.get("/capabilities/heatmap").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="text-slate-400">Loading heatmap…</div>;

  const { grid, maturity_levels, strategic_levels } = data;

  return (
    <div className="space-y-5" data-testid="capability-heatmap-page">
      <div className="eams-card p-6 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)" }} />
        <div className="h-14 w-14 rounded-md grid place-items-center bg-amber-500/15 border border-amber-500/40">
          <Grid3x3 className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <div className="text-eyebrow">Business Strategy</div>
          <h1 className="text-3xl heading font-bold text-white">Capability Heatmap</h1>
          <p className="text-sm text-slate-400 mt-1">{data.total} capabilities plotted by maturity vs strategic importance. Top-right = keep excellent. Bottom-right = invest now.</p>
        </div>
      </div>

      <div className="eams-card p-4 overflow-x-auto">
        <div className="min-w-max" style={{ display: "grid", gridTemplateColumns: `120px repeat(${strategic_levels.length}, minmax(220px, 1fr))`, gap: "8px" }}>
          {/* Header row */}
          <div />
          {strategic_levels.map((s) => (
            <div key={`h-${s}`} className="text-center text-eyebrow py-2 border-b border-slate-800">
              Strategic · {s}
            </div>
          ))}
          {/* Rows: maturity descending L5 → L1 (top invests-in-excellence, bottom starting) */}
          {[...maturity_levels].reverse().map((m) => (
            <React.Fragment key={m}>
              <div className="flex items-center justify-end pr-3 border-r border-slate-800">
                <div className="text-eyebrow text-amber-400">Maturity · {m}</div>
              </div>
              {strategic_levels.map((s) => {
                const items = grid[m][s] || [];
                const isSweetSpot = m === "L5" && s === "High";
                const isRedFlag = (m === "L1" || m === "L2") && s === "High";
                return (
                  <div
                    key={`${m}-${s}`}
                    data-testid={`heatmap-cell-${m}-${s}`}
                    className="min-h-[110px] rounded-md p-2 border"
                    style={{
                      background: isRedFlag ? "rgba(239,68,68,0.08)" : isSweetSpot ? "rgba(16,185,129,0.08)" : "rgba(30,41,59,0.4)",
                      borderColor: isRedFlag ? "rgba(239,68,68,0.35)" : isSweetSpot ? "rgba(16,185,129,0.35)" : "rgba(51,65,85,0.5)",
                    }}
                  >
                    <div className="space-y-1">
                      {items.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => nav(`/object/${c.id}`)}
                          data-testid={`heatmap-cap-${c.id}`}
                          className="w-full text-left px-2 py-1.5 rounded border transition-colors hover:scale-[1.01]"
                          style={{
                            background: `${CRIT_COLOR[c.criticality] || "#f59e0b"}15`,
                            borderColor: `${CRIT_COLOR[c.criticality] || "#f59e0b"}55`,
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: CRIT_COLOR[c.criticality] || "#f59e0b" }} />
                            <span className="mono text-[10px] uppercase tracking-widest text-slate-400">{c.code}</span>
                          </div>
                          <div className="text-xs text-white truncate mt-0.5">{c.name}</div>
                        </button>
                      ))}
                      {items.length === 0 && <div className="text-xs text-slate-700 mono px-1">—</div>}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="eams-panel p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-emerald-400" /><span className="text-eyebrow text-emerald-400">Sweet Spot · L5 High</span></div>
          <p className="text-xs text-slate-400">Best-in-class capabilities that are also strategic. Maintain excellence and defend market position.</p>
        </div>
        <div className="eams-panel p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-red-400 rotate-180" /><span className="text-eyebrow text-red-400">Invest Now · L1/L2 High</span></div>
          <p className="text-xs text-slate-400">Strategic capabilities operating at low maturity. Prioritise investment, staffing and modernization.</p>
        </div>
      </div>
    </div>
  );
}
