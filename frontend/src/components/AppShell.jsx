import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { DOMAIN_LIST } from "@/lib/domains";
import { api } from "@/lib/api";
import {
  LayoutDashboard, GitBranch, ClipboardCheck, ScrollText, ShieldAlert,
  BookMarked, Settings, LogOut, Search, ChevronRight, Sparkles, Map
} from "lucide-react";
import { Input } from "@/components/ui/input";

function BrandMark() {
  const { brand } = useBrand();
  return (
    <div className="flex items-center gap-3" data-testid="brand-mark">
      {brand.logo_url ? (
        <img src={brand.logo_url} alt="logo" className="h-9 w-9 rounded-md object-cover border border-white/10" />
      ) : (
        <div className="h-9 w-9 rounded-md grid place-items-center" style={{ background: brand.accent, boxShadow: `0 0 0 1px ${brand.accent}55` }}>
          <span className="font-bold text-black text-sm">{(brand.name?.[0] || "C").toUpperCase()}</span>
        </div>
      )}
      <div className="leading-tight">
        <div className="font-bold text-white heading text-[15px]" data-testid="brand-name">{brand.name}</div>
        <div className="text-[11px] text-slate-400 mono uppercase tracking-widest" data-testid="brand-subtitle">{brand.subtitle}</div>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, testId, accent }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      data-testid={testId}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border border-transparent ${
          isActive ? "bg-slate-800/60 text-white border-slate-700" : "text-slate-400 hover:text-white hover:bg-slate-800/40"
        }`
      }
    >
      <Icon className="h-4 w-4" style={accent ? { color: accent } : undefined} />
      <span className="flex-1">{label}</span>
    </NavLink>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState(null);
  const nav = useNavigate();
  const ref = useRef();

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.length < 2) { setRes(null); return; }
      try {
        const r = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setRes(r.data);
        setOpen(true);
      } catch (_) {}
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (obj) => {
    setOpen(false); setQ("");
    nav(`/object/${obj.id}`);
  };

  return (
    <div className="relative w-full max-w-xl" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          data-testid="global-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.length > 1 && setOpen(true)}
          placeholder="Search architecture objects, ADRs, standards, risks…"
          className="pl-9 h-10 bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-amber-500"
        />
      </div>
      {open && res && (
        <div className="absolute z-50 mt-2 w-full eams-panel p-2 max-h-[420px] overflow-auto shadow-2xl" data-testid="global-search-results">
          {["objects", "adrs", "standards", "risks"].map((k) => (
            res[k]?.length ? (
              <div key={k} className="mb-2">
                <div className="text-eyebrow px-2 py-1">{k}</div>
                {res[k].map((it) => (
                  <button
                    key={it.id}
                    onClick={() => k === "objects" ? go(it) : nav(`/${k}`)}
                    data-testid={`search-result-${k}-${it.id}`}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800/60 text-sm text-slate-200 flex items-center gap-2"
                  >
                    <span className="text-slate-500 mono text-xs">{it.code || it.number || ""}</span>
                    <span className="truncate">{it.title || it.name}</span>
                  </button>
                ))}
              </div>
            ) : null
          ))}
          {!Object.values(res).some((v) => v?.length) && (
            <div className="p-3 text-sm text-slate-400">No results</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { brand } = useBrand();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#0a0e15] flex flex-col" data-testid="sidebar">
        <div className="p-4 border-b border-slate-800">
          <BrandMark />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" testId="nav-dashboard" />
          <NavItem to="/map" icon={Map} label="Architecture Map" testId="nav-map" />
          <div className="pt-3 pb-1 px-2 text-eyebrow">Domains</div>
          {DOMAIN_LIST.map((d) => (
            <NavItem key={d.key} to={`/domain/${d.key}`} icon={d.icon} label={d.name} testId={`nav-domain-${d.key}`} accent={d.color} />
          ))}
          <div className="pt-3 pb-1 px-2 text-eyebrow">Governance</div>
          <NavItem to="/reviews" icon={ClipboardCheck} label="Reviews" testId="nav-reviews" />
          <NavItem to="/adrs" icon={BookMarked} label="Decisions (ADRs)" testId="nav-adrs" />
          <NavItem to="/standards" icon={ScrollText} label="Standards" testId="nav-standards" />
          <NavItem to="/risks" icon={ShieldAlert} label="Risks & Tech Debt" testId="nav-risks" />
          <div className="pt-3 pb-1 px-2 text-eyebrow">Admin</div>
          <NavItem to="/admin/brand" icon={Settings} label="Brand Settings" testId="nav-brand-settings" />
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 mb-2">Signed in as</div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm text-slate-100 truncate" data-testid="user-name">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate" data-testid="user-email">{user?.email}</div>
            </div>
            <button
              onClick={async () => { await logout(); nav("/login"); }}
              data-testid="logout-btn"
              className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-slate-800 bg-[#0a0e15]/80 backdrop-blur sticky top-0 z-30 flex items-center gap-4 px-6" data-testid="topbar">
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="h-3.5 w-3.5" style={{ color: brand.accent }} />
              <span className="mono uppercase tracking-widest">{brand.name} · EAMS</span>
            </div>
            <div className="h-8 w-8 rounded-full grid place-items-center text-black font-bold" style={{ background: brand.accent }}>
              {(user?.name || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden" data-testid="main-content">{children}</main>
      </div>
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4" data-testid="breadcrumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
          {it.to ? (
            <NavLink to={it.to} className="hover:text-white">{it.label}</NavLink>
          ) : (
            <span className="text-slate-200">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
