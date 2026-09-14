import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { domainOf, DOMAIN_LIST } from "@/lib/domains";
import { Breadcrumb } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { GitBranch, ArrowLeftRight, ArrowRight, ArrowLeft } from "lucide-react";

// Custom layered SVG graph
function computeLayout(nodes, edges, rootId, direction) {
  // BFS levels from root along chosen direction
  const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const adj = { forward: {}, reverse: {} };
  for (const n of nodes) { adj.forward[n.id] = []; adj.reverse[n.id] = []; }
  for (const e of edges) {
    if (adj.forward[e.source_id]) adj.forward[e.source_id].push(e.target_id);
    if (adj.reverse[e.target_id]) adj.reverse[e.target_id].push(e.source_id);
  }
  const level = { [rootId]: 0 };
  const visited = new Set([rootId]);
  const queue = [rootId];
  while (queue.length) {
    const cur = queue.shift();
    const dirs = direction === "both" ? ["forward", "reverse"] : [direction];
    for (const dir of dirs) {
      for (const nb of adj[dir][cur] || []) {
        if (!visited.has(nb)) {
          visited.add(nb);
          const delta = dir === "forward" ? 1 : -1;
          level[nb] = (level[cur] || 0) + delta;
          queue.push(nb);
        }
      }
    }
  }
  const byLevel = {};
  for (const [id, l] of Object.entries(level)) {
    (byLevel[l] = byLevel[l] || []).push(id);
  }
  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
  const colW = 240; const rowH = 90;
  const positions = {};
  levels.forEach((lv, i) => {
    const col = byLevel[lv];
    col.forEach((id, j) => { positions[id] = { x: 40 + i * colW, y: 40 + j * rowH }; });
  });
  const width = 40 + levels.length * colW + 200;
  const height = 60 + Math.max(...Object.values(byLevel).map((c) => c.length)) * rowH;
  return { positions, width, height };
}

export default function Traceability() {
  const { id } = useParams();
  const nav = useNavigate();
  const [direction, setDirection] = useState("both");
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/traceability/${id}?direction=${direction}&depth=5`).then((r) => setData(r.data));
  }, [id, direction]);

  const layout = useMemo(() => {
    if (!data) return null;
    return computeLayout(data.nodes, data.edges, id, direction);
  }, [data, id, direction]);

  if (!data || !layout) return <div className="text-slate-400">Building trace…</div>;
  const { positions, width, height } = layout;
  const rootD = domainOf(data.root.domain);

  return (
    <div className="space-y-5" data-testid="traceability-page">
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: data.root.name, to: `/object/${id}` }, { label: "Traceability" }]} />

      <div className="eams-card p-5 flex items-center gap-4" style={{ borderColor: `${rootD.color}33` }}>
        <div className="h-12 w-12 rounded-md grid place-items-center" style={{ background: rootD.color_soft, border: `1px solid ${rootD.color}55` }}>
          <GitBranch className="h-5 w-5" style={{ color: rootD.color }} />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow" style={{ color: rootD.color }}>End-to-End Traceability</div>
          <h1 className="text-2xl heading font-bold text-white">{data.root.name}</h1>
          <p className="text-sm text-slate-400">{data.nodes.length} nodes · {data.edges.length} edges</p>
        </div>
        <div className="flex items-center gap-1 border border-slate-800 rounded-md p-0.5">
          {[
            { k: "reverse", label: "Reverse", Icon: ArrowLeft },
            { k: "both", label: "Both", Icon: ArrowLeftRight },
            { k: "forward", label: "Forward", Icon: ArrowRight },
          ].map((o) => (
            <button
              key={o.k} onClick={() => setDirection(o.k)}
              data-testid={`dir-${o.k}`}
              className={`px-3 py-1.5 rounded text-xs mono uppercase tracking-widest flex items-center gap-1 ${direction === o.k ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <o.Icon className="h-3.5 w-3.5" /> {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="eams-card p-3 overflow-auto">
        <svg width={Math.max(width, 800)} height={Math.max(height, 400)} data-testid="trace-svg">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
          </defs>
          {data.edges.map((e) => {
            const a = positions[e.source_id]; const b = positions[e.target_id];
            if (!a || !b) return null;
            const mx = (a.x + 180 + b.x) / 2;
            const isCritical = e.criticality === "Mission-Critical";
            return (
              <g key={e.id}>
                <path
                  d={`M ${a.x + 180} ${a.y + 25} C ${mx} ${a.y + 25}, ${mx} ${b.y + 25}, ${b.x} ${b.y + 25}`}
                  fill="none" stroke={isCritical ? "#ef4444" : "#334155"} strokeWidth={isCritical ? 2 : 1.2}
                  markerEnd="url(#arrow)"
                  opacity="0.85"
                />
              </g>
            );
          })}
          {data.nodes.map((n) => {
            const p = positions[n.id];
            if (!p) return null;
            const d = domainOf(n.domain);
            const isRoot = n.id === id;
            return (
              <g key={n.id} transform={`translate(${p.x}, ${p.y})`} style={{ cursor: "pointer" }} onClick={() => nav(`/object/${n.id}`)}>
                <rect width="180" height="50" rx="8"
                  fill={d.color_soft} stroke={d.color} strokeWidth={isRoot ? 2 : 1} />
                {isRoot && <rect width="180" height="50" rx="8" fill="none" stroke={d.color} strokeOpacity="0.35" strokeWidth="6" />}
                <rect width="4" height="50" fill={d.color} rx="2" />
                <text x="14" y="20" fontSize="11" fill="#94a3b8" style={{ fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {d.name}
                </text>
                <text x="14" y="38" fontSize="13" fill="#f1f5f9" fontWeight="600" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {n.name.length > 22 ? n.name.slice(0, 22) + "…" : n.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="eams-panel p-4">
        <div className="text-eyebrow mb-2">Legend</div>
        <div className="flex flex-wrap gap-2">
          {DOMAIN_LIST.map((d) => (
            <span key={d.key} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs" style={{ background: d.color_soft, borderColor: `${d.color}55`, color: d.color }}>
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs border-red-500/50 text-red-400">
            <span className="h-1 w-6 rounded" style={{ background: "#ef4444" }} /> Mission-Critical edge
          </span>
        </div>
      </div>
    </div>
  );
}
