import React, { useEffect, useState, useMemo } from "react";
import { api, API } from "@/lib/api";
import { DOMAIN_LIST } from "@/lib/domains";
import DomainBadge from "@/components/DomainBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, RefreshCcw, Pencil, Plus, Trash2, Upload } from "lucide-react";

const ACTION_META = {
  create: { color: "#10b981", icon: Plus, label: "Created" },
  update: { color: "#f59e0b", icon: Pencil, label: "Updated" },
  delete: { color: "#ef4444", icon: Trash2, label: "Deleted" },
  upload_document: { color: "#8b5cf6", icon: Upload, label: "Uploaded doc" },
  delete_document: { color: "#ef4444", icon: Trash2, label: "Deleted doc" },
};

function timeAgo(iso) {
  const now = new Date();
  const then = new Date(iso);
  const diff = (now - then) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AuditConsole() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("all");
  const [action, setAction] = useState("all");
  const [userEmail, setUserEmail] = useState("all");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (domain !== "all") params.set("domain", domain);
    if (action !== "all") params.set("action", action);
    if (userEmail !== "all") params.set("user_email", userEmail);
    const [r, u] = await Promise.all([
      api.get(`/audit?${params.toString()}`),
      api.get("/audit/users"),
    ]);
    setItems(r.data); setUsers(u.data);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [domain, action, userEmail]);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const grouped = useMemo(() => {
    const g = {};
    for (const it of items) {
      const day = new Date(it.timestamp).toISOString().slice(0, 10);
      (g[day] = g[day] || []).push(it);
    }
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  return (
    <div className="space-y-5" data-testid="audit-console">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-slate-800 border border-slate-700">
          <ScrollText className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow">Admin</div>
          <h1 className="text-3xl heading font-bold text-white">Audit Trail Console</h1>
          <p className="text-sm text-slate-400 mt-1">Immutable log of every change across the six-domain repository.</p>
        </div>
        <button onClick={load} className="p-2 rounded border border-slate-700 hover:bg-slate-800 text-slate-300" data-testid="audit-refresh"><RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
      </div>

      <div className="eams-panel p-3 grid md:grid-cols-4 gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input data-testid="audit-search" placeholder="Search email, object id, action…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-slate-900/60 border-slate-700" />
        </div>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger data-testid="audit-domain"><SelectValue placeholder="Domain" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            {DOMAIN_LIST.map((d) => <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger data-testid="audit-action"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="create">Created</SelectItem>
            <SelectItem value="update">Updated</SelectItem>
            <SelectItem value="delete">Deleted</SelectItem>
            <SelectItem value="upload_document">Doc uploaded</SelectItem>
            <SelectItem value="delete_document">Doc deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userEmail} onValueChange={setUserEmail}>
          <SelectTrigger data-testid="audit-user"><SelectValue placeholder="User" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {grouped.map(([day, list]) => (
          <div key={day} className="eams-card p-0 overflow-hidden" data-testid={`audit-day-${day}`}>
            <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-3 bg-slate-900/40">
              <span className="text-eyebrow">{day}</span>
              <span className="text-xs text-slate-500">{list.length} event{list.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {list.map((it) => {
                const meta = ACTION_META[it.action] || { color: "#64748b", icon: ScrollText, label: it.action };
                const Icon = meta.icon;
                return (
                  <div key={it.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-900/40" data-testid={`audit-row-${it.id}`}>
                    <div className="h-8 w-8 rounded grid place-items-center shrink-0" style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}55` }}>
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium">{it.user_email || "system"}</span>
                        <span className="text-xs mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: meta.color, background: `${meta.color}15` }}>{meta.label}</span>
                        {it.domain && <DomainBadge domain={it.domain} />}
                        <span className="text-xs text-slate-500 ml-auto mono">{timeAgo(it.timestamp)} · {new Date(it.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 mono truncate">object: {it.object_id}</div>
                      {(it.before || it.after) && (
                        <details className="mt-1">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">Diff</summary>
                          <div className="grid md:grid-cols-2 gap-2 mt-2 text-xs">
                            <pre className="mono bg-red-500/5 border border-red-500/20 p-2 rounded overflow-auto max-h-40 text-red-300">{JSON.stringify(it.before, null, 2)}</pre>
                            <pre className="mono bg-emerald-500/5 border border-emerald-500/20 p-2 rounded overflow-auto max-h-40 text-emerald-300">{JSON.stringify(it.after, null, 2)}</pre>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-slate-500 italic text-center py-12">No audit events match your filters.</div>}
      </div>
    </div>
  );
}
