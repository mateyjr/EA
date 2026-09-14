import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DOMAIN_LIST, domainOf } from "@/lib/domains";
import { useNavigate } from "react-router-dom";
import { useBrand } from "@/context/BrandContext";
import { Activity, AlertTriangle, BookMarked, ClipboardCheck, TrendingUp } from "lucide-react";

function DomainCard({ d, count, onClick }) {
  const Icon = d.icon;
  return (
    <button
      onClick={onClick}
      data-testid={`domain-card-${d.key}`}
      className="text-left eams-card p-5 hover:scale-[1.01] transition-transform relative overflow-hidden group"
      style={{ borderColor: `${d.color}33` }}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: d.color }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-eyebrow" style={{ color: d.color }}>{d.name} Domain</div>
          <div className="mt-2 text-4xl heading font-bold text-white">{count ?? "—"}</div>
          <div className="text-xs text-slate-400 mt-1">objects catalogued</div>
        </div>
        <div className="h-11 w-11 grid place-items-center rounded-md" style={{ background: d.color_soft, border: `1px solid ${d.color}55` }}>
          <Icon className="h-5 w-5" style={{ color: d.color }} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {d.types.slice(0, 3).map((t) => (
          <span key={t.key} className="text-[10px] mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `${d.color}15`, color: d.color }}>{t.label}</span>
        ))}
      </div>
    </button>
  );
}

function KpiTile({ label, value, icon: Icon, color = "#f59e0b", testId }) {
  return (
    <div className="eams-panel p-4" data-testid={testId}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md grid place-items-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div>
          <div className="text-eyebrow">{label}</div>
          <div className="text-2xl heading font-bold text-white leading-tight">{value ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [kpi, setKpi] = useState(null);
  const nav = useNavigate();
  const { brand } = useBrand();
  useEffect(() => { api.get("/kpis").then((r) => setKpi(r.data)); }, []);

  return (
    <div className="space-y-6" data-testid="dashboard">
      <div>
        <div className="text-eyebrow">Enterprise Overview</div>
        <h1 className="text-4xl heading font-bold text-white">Architecture Command Center</h1>
        <p className="text-sm text-slate-400 mt-1">{brand.name} EAMS · six-domain traceability across the enterprise.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOMAIN_LIST.map((d) => (
          <DomainCard key={d.key} d={d} count={kpi?.domain_counts?.[d.key]} onClick={() => nav(`/domain/${d.key}`)} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile label="Mission-Critical Apps" value={kpi?.mission_critical_apps} icon={Activity} color="#3b82f6" testId="kpi-critical-apps" />
        <KpiTile label="Critical Integrations" value={kpi?.critical_integrations} icon={TrendingUp} color="#8b5cf6" testId="kpi-critical-int" />
        <KpiTile label="Open Risks" value={kpi?.open_risks} icon={AlertTriangle} color="#ef4444" testId="kpi-open-risks" />
        <KpiTile label="Pending Reviews" value={kpi?.pending_reviews} icon={ClipboardCheck} color="#f59e0b" testId="kpi-pending-reviews" />
        <KpiTile label="Total ADRs" value={kpi?.total_adrs} icon={BookMarked} color="#10b981" testId="kpi-adrs" />
        <KpiTile label="EOL / Deprecated Tech" value={kpi?.eol_technologies} icon={AlertTriangle} color="#64748b" testId="kpi-eol" />
        <KpiTile label="Data Entities" value={kpi?.total_data_entities} icon={Activity} color="#10b981" testId="kpi-data" />
        <KpiTile label="Security Controls" value={kpi?.total_security_controls} icon={Activity} color="#ef4444" testId="kpi-sec-controls" />
      </div>

      <div className="eams-card p-5">
        <div className="text-eyebrow mb-2">Fundamental Traceability Model</div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {["Business", "Application", "Data", "Integration", "Security", "Technology"].map((n, i) => {
            const d = domainOf(n.toLowerCase());
            const Icon = d.icon;
            return (
              <React.Fragment key={n}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border" style={{ background: d.color_soft, borderColor: `${d.color}55`, color: d.color }}>
                  <Icon className="h-4 w-4" /> {n}
                </span>
                {i < 5 && <span className="text-slate-600">→</span>}
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          WHY (Capabilities) → WHAT (Processes) → HOW (Apps) → INFORMATION (Data) → COMMUNICATION (Integration) → PROTECTION (Security) → PLATFORM (Technology).
        </p>
      </div>
    </div>
  );
}
