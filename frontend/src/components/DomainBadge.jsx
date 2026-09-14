import React from "react";
import { domainOf } from "@/lib/domains";

export default function DomainBadge({ domain, size = "sm", withIcon = true }) {
  const d = domainOf(domain);
  const Icon = d.icon;
  const cls = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium mono uppercase tracking-wider ${cls}`}
      style={{ background: d.color_soft, borderColor: `${d.color}55`, color: d.color }}
      data-testid={`domain-badge-${d.key}`}
    >
      {withIcon && <Icon className="h-3.5 w-3.5" />}
      {d.name}
    </span>
  );
}

export function CriticalityChip({ level }) {
  const map = {
    "Mission-Critical": "bg-red-500/15 text-red-400 border-red-500/30",
    "High": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    "Medium": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "Low": "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs mono uppercase tracking-wider ${map[level] || map.Medium}`}>
      {level || "Medium"}
    </span>
  );
}

export function StatusChip({ status }) {
  const map = {
    "Active": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "Draft": "bg-slate-500/15 text-slate-300 border-slate-500/30",
    "Deprecated": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    "Retired": "bg-red-500/15 text-red-400 border-red-500/30",
    "Proposed": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Accepted": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "Rejected": "bg-red-500/15 text-red-400 border-red-500/30",
    "Superseded": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    "Open": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs mono uppercase tracking-wider ${map[status] || map.Draft}`}>
      {status || "Draft"}
    </span>
  );
}
