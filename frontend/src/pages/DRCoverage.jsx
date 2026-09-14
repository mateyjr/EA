import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { ShieldOff, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { CriticalityChip } from "@/components/DomainBadge";

function CoverageBar({ pct }) {
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-eyebrow">DR Coverage</span>
        <span className="mono text-white">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function AppTile({ app, tone }) {
  const nav = useNavigate();
  const colors = { covered: "#10b981", partial: "#f59e0b", missing: "#ef4444" };
  const c = colors[tone];
  const dr = app._dr || {};
  return (
    <button
      onClick={() => nav(`/object/${app.id}`)}
      data-testid={`dr-${tone}-${app.id}`}
      className="text-left eams-panel p-3 hover:scale-[1.01] transition-transform"
      style={{ borderLeft: `3px solid ${c}` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="mono text-[10px] uppercase tracking-widest" style={{ color: c }}>{app.code}</span>
        <CriticalityChip level={app.criticality} />
      </div>
      <div className="text-sm text-white font-semibold heading">{app.name}</div>
      <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
        <div><div className="text-slate-500 mono text-[10px]">RTO</div><div className="text-slate-200">{dr.rto || "—"}</div></div>
        <div><div className="text-slate-500 mono text-[10px]">RPO</div><div className="text-slate-200">{dr.rpo || "—"}</div></div>
        <div><div className="text-slate-500 mono text-[10px]">DR SITE</div><div className="text-slate-200">{dr.dr_site || "—"}</div></div>
      </div>
    </button>
  );
}

export default function DRCoverage() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/dr/coverage").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="text-slate-400">Loading DR coverage…</div>;

  return (
    <div className="space-y-5" data-testid="dr-coverage-page">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-red-500/15 border border-red-500/40">
          <ShieldAlert className="h-6 w-6 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow">Resilience</div>
          <h1 className="text-3xl heading font-bold text-white">DR Coverage Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">RTO, RPO and DR-site coverage across the application portfolio.</p>
        </div>
        <div className="w-72"><CoverageBar pct={data.coverage_pct} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="eams-card p-5 border-emerald-500/30" data-testid="dr-covered-card">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div className="text-eyebrow text-emerald-400">Covered</div>
          </div>
          <div className="text-3xl heading font-bold text-white">{data.covered.length}</div>
          <div className="text-xs text-slate-500 mt-1">Apps with RTO, RPO & DR site</div>
        </div>
        <div className="eams-card p-5 border-amber-500/30" data-testid="dr-partial-card">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <div className="text-eyebrow text-amber-400">Partial</div>
          </div>
          <div className="text-3xl heading font-bold text-white">{data.partial.length}</div>
          <div className="text-xs text-slate-500 mt-1">Missing one or more DR attributes</div>
        </div>
        <div className="eams-card p-5 border-red-500/30" data-testid="dr-missing-card">
          <div className="flex items-center gap-2 mb-2">
            <ShieldOff className="h-5 w-5 text-red-400" />
            <div className="text-eyebrow text-red-400">Missing</div>
          </div>
          <div className="text-3xl heading font-bold text-white">{data.missing.length}</div>
          <div className="text-xs text-slate-500 mt-1">No DR plan defined</div>
        </div>
      </div>

      {data.critical_missing?.length > 0 && (
        <div className="eams-card p-5 border-red-500/50" data-testid="dr-critical-missing">
          <div className="flex items-center gap-2 mb-3">
            <ShieldOff className="h-5 w-5 text-red-400" />
            <h3 className="text-lg heading font-semibold text-white">Critical apps without DR plan ({data.critical_missing.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.critical_missing.map((a) => <AppTile key={a.id} app={a} tone="missing" />)}
          </div>
        </div>
      )}

      {[
        { key: "missing", title: "Missing DR", tone: "missing", color: "#ef4444" },
        { key: "partial", title: "Partial DR", tone: "partial", color: "#f59e0b" },
        { key: "covered", title: "Fully Covered", tone: "covered", color: "#10b981" },
      ].map((section) => (
        data[section.key]?.length > 0 && (
          <div key={section.key} className="eams-card p-5" style={{ borderColor: `${section.color}33` }}>
            <div className="text-eyebrow mb-3" style={{ color: section.color }}>{section.title} · {data[section.key].length}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {data[section.key].map((a) => <AppTile key={a.id} app={a} tone={section.tone} />)}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
