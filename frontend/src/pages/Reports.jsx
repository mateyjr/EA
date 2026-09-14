import React, { useEffect, useState } from "react";
import { api, API } from "@/lib/api";
import { FileText, Download, FileSpreadsheet, FileType } from "lucide-react";
import { toast } from "sonner";
import Subscriptions from "@/components/Subscriptions";

const ICONS = {
  csv: FileText,
  xlsx: FileSpreadsheet,
  pdf: FileType,
};

const REPORT_META = {
  "application-portfolio": { color: "#3b82f6", desc: "Full application portfolio with owners, criticality, lifecycle." },
  "technology-eol": { color: "#64748b", desc: "Technology lifecycle & EOL exposure." },
  "business-capabilities": { color: "#f59e0b", desc: "Business capabilities, owners and maturity." },
  "integration-catalogue": { color: "#8b5cf6", desc: "Integration/API catalogue by protocol." },
  "data-catalogue": { color: "#10b981", desc: "Data entities & stores with classification." },
  "security-controls": { color: "#ef4444", desc: "Security controls inventory." },
  "risks": { color: "#ef4444", desc: "Architecture risks and technical debt." },
  "adrs": { color: "#10b981", desc: "Architecture Decision Records log." },
  "standards": { color: "#3b82f6", desc: "Architecture Standards register." },
  "all-objects": { color: "#f59e0b", desc: "Every architecture object across all domains." },
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  useEffect(() => { api.get("/reports").then((r) => setReports(r.data)); }, []);

  const download = async (kind, format) => {
    try {
      const token = localStorage.getItem("eams_token");
      const res = await fetch(`${API}/reports/${kind}?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error("Report failed"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${kind.replace(/-/g, "_")}.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (e) { toast.error("Failed to download"); }
  };

  return (
    <div className="space-y-5" data-testid="reports-page">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-amber-500/15 border border-amber-500/40">
          <FileText className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <div className="text-eyebrow">Analytics</div>
          <h1 className="text-3xl heading font-bold text-white">Reports & Exports</h1>
          <p className="text-sm text-slate-400 mt-1">Download portfolio, EOL and DR-coverage reports in CSV, Excel or PDF.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const meta = REPORT_META[r.key] || { color: "#f59e0b", desc: "" };
          return (
            <div key={r.key} className="eams-card p-5 relative overflow-hidden" style={{ borderColor: `${meta.color}33` }} data-testid={`report-card-${r.key}`}>
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: meta.color }} />
              <div className="text-eyebrow" style={{ color: meta.color }}>{r.key}</div>
              <h3 className="text-lg heading font-semibold text-white mt-1">{r.title}</h3>
              <p className="text-sm text-slate-400 mt-1 mb-4">{meta.desc}</p>
              <div className="flex gap-2">
                {["csv", "xlsx", "pdf"].map((fmt) => {
                  const Icon = ICONS[fmt];
                  return (
                    <button
                      key={fmt}
                      onClick={() => download(r.key, fmt)}
                      data-testid={`report-${r.key}-${fmt}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded border transition-colors"
                      style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}0d` }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs mono uppercase tracking-widest">{fmt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Subscriptions />
    </div>
  );
}
