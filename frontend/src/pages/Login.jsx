import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const { brand } = useBrand();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await login(email, password);
    setBusy(false);
    if (r.ok) { toast.success("Welcome back"); nav("/"); }
    else toast.error(r.error || "Login failed");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg)]">
      <div className="hidden lg:flex flex-col justify-between p-12 eams-grid relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md grid place-items-center font-bold text-black" style={{ background: brand.accent }}>
            {(brand.name?.[0] || "C").toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold heading">{brand.name}</div>
            <div className="text-xs mono uppercase tracking-widest text-slate-400">{brand.subtitle}</div>
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-eyebrow mb-3">Enterprise Architecture Management</div>
          <h1 className="text-5xl font-bold heading text-white leading-tight">
            Trace the enterprise, <span style={{ color: brand.accent }}>edge to edge.</span>
          </h1>
          <p className="mt-5 text-slate-400 max-w-md">
            One relationship-driven source of truth across Business, Application, Data, Security, Integration, and Technology.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { c: "#f59e0b", l: "Business" }, { c: "#3b82f6", l: "Application" }, { c: "#10b981", l: "Data" },
              { c: "#ef4444", l: "Security" }, { c: "#8b5cf6", l: "Integration" }, { c: "#64748b", l: "Technology" },
            ].map((d) => (
              <div key={d.l} className="rounded-md border border-slate-800 p-3 bg-slate-900/40">
                <div className="h-2 w-8 rounded" style={{ background: d.c }} />
                <div className="text-xs mono uppercase tracking-widest text-slate-400 mt-2">{d.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500 mono">v1.0 · MVP</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-md eams-card p-8 space-y-5" data-testid="login-form">
          <div>
            <div className="text-eyebrow">Sign in</div>
            <h2 className="text-3xl heading font-bold text-white mt-1">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1">Access the {brand.name} EAMS console.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input id="email" type="email" required data-testid="login-email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 bg-slate-900/60 border-slate-700 text-white" placeholder="you@company.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw" className="text-slate-300">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input id="pw" type="password" required data-testid="login-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 bg-slate-900/60 border-slate-700 text-white" placeholder="••••••••" />
            </div>
          </div>
          <Button type="submit" disabled={busy} data-testid="login-submit" className="w-full h-11 text-black font-semibold" style={{ background: brand.accent }}>
            {busy ? "Signing in…" : (<span className="inline-flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>)}
          </Button>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
            Default admin was seeded on first boot. Ask your architect for credentials.
          </div>
        </form>
      </div>
    </div>
  );
}
