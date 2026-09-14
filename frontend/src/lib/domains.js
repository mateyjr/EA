import {
  Briefcase, AppWindow, Database, Shield, Network, Server,
  Workflow, ListTree, Building2, Boxes, FileText, GaugeCircle,
  KeyRound, Lock, HardDrive, Cable, Cpu, LayoutGrid
} from "lucide-react";

export const DOMAINS = {
  business: {
    key: "business",
    name: "Business",
    color: "#f59e0b",
    color_soft: "rgba(245,158,11,0.12)",
    ring: "ring-amber-500/40",
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    icon: Briefcase,
    types: [
      { key: "unit", label: "Business Unit", icon: Building2 },
      { key: "capability", label: "Business Capability", icon: LayoutGrid },
      { key: "process", label: "Business Process", icon: Workflow },
      { key: "process_step", label: "Process Step", icon: ListTree },
    ],
  },
  application: {
    key: "application",
    name: "Application",
    color: "#3b82f6",
    color_soft: "rgba(59,130,246,0.12)",
    ring: "ring-blue-500/40",
    text: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
    icon: AppWindow,
    types: [
      { key: "application", label: "Application", icon: AppWindow },
    ],
  },
  data: {
    key: "data",
    name: "Data",
    color: "#10b981",
    color_soft: "rgba(16,185,129,0.12)",
    ring: "ring-emerald-500/40",
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: Database,
    types: [
      { key: "data_entity", label: "Data Entity", icon: Boxes },
      { key: "data_store", label: "Data Store", icon: HardDrive },
    ],
  },
  security: {
    key: "security",
    name: "Security",
    color: "#ef4444",
    color_soft: "rgba(239,68,68,0.12)",
    ring: "ring-red-500/40",
    text: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-500",
    icon: Shield,
    types: [
      { key: "control", label: "Security Control", icon: Lock },
      { key: "policy", label: "Security Policy", icon: KeyRound },
    ],
  },
  integration: {
    key: "integration",
    name: "Integration",
    color: "#8b5cf6",
    color_soft: "rgba(139,92,246,0.12)",
    ring: "ring-violet-500/40",
    text: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    dot: "bg-violet-500",
    icon: Network,
    types: [
      { key: "integration", label: "Integration / API", icon: Cable },
    ],
  },
  technology: {
    key: "technology",
    name: "Technology",
    color: "#64748b",
    color_soft: "rgba(100,116,139,0.15)",
    ring: "ring-slate-400/40",
    text: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/40",
    dot: "bg-slate-400",
    icon: Server,
    types: [
      { key: "technology", label: "Technology", icon: Cpu },
      { key: "infrastructure", label: "Infrastructure", icon: Server },
    ],
  },
};

export const DOMAIN_LIST = Object.values(DOMAINS);

export function domainOf(key) {
  return DOMAINS[key] || DOMAINS.business;
}

export const CRITICALITIES = ["Low", "Medium", "High", "Mission-Critical"];
export const STATUSES = ["Draft", "Active", "Deprecated", "Retired"];
export const LIFECYCLES = ["Planned", "Development", "Production", "Maintain", "Modernize", "Replace", "Retire", "Retired"];
