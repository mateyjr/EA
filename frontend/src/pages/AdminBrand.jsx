import React, { useState } from "react";
import { useBrand } from "@/context/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Upload } from "lucide-react";
import { toast } from "sonner";

const PRESETS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#f43f5e", "#0ea5e9", "#22c55e"];

export default function AdminBrand() {
  const { brand, save } = useBrand();
  const [f, setF] = useState({ name: brand.name, subtitle: brand.subtitle, logo_url: brand.logo_url || "", accent: brand.accent || "#f59e0b" });
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    setF({ name: brand.name, subtitle: brand.subtitle, logo_url: brand.logo_url || "", accent: brand.accent || "#f59e0b" });
  }, [brand]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await save({ ...f, logo_url: f.logo_url || null }); toast.success("Brand updated. Reload to see changes app-wide."); }
    catch { toast.error("Failed"); }
    setBusy(false);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setF((cur) => ({ ...cur, logo_url: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5" data-testid="brand-admin-page">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-slate-800 border border-slate-700">
          <Settings2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-eyebrow">Admin</div>
          <h1 className="text-3xl heading font-bold text-white">Brand Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Update the company name, subtitle, logo and accent color across the entire EAMS.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <form onSubmit={submit} className="eams-card p-5 space-y-4">
          <div><Label>Brand name *</Label><Input required data-testid="brand-name-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Subtitle</Label><Input data-testid="brand-subtitle-input" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></div>
          <div>
            <Label>Logo</Label>
            <div className="flex gap-2 mt-1">
              <Input data-testid="brand-logo-url" value={f.logo_url} onChange={(e) => setF({ ...f, logo_url: e.target.value })} placeholder="https://…/logo.png or data URI" />
              <label className="inline-flex items-center gap-2 px-3 rounded border border-slate-700 cursor-pointer hover:bg-slate-800 text-slate-300 text-sm">
                <Upload className="h-4 w-4" /> Upload
                <input type="file" accept="image/*" onChange={onFile} className="hidden" data-testid="brand-logo-file" />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">Uploaded image is embedded as a data URI. For production, host on a CDN.</p>
          </div>
          <div>
            <Label>Accent color</Label>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => setF({ ...f, accent: c })} data-testid={`accent-${c}`} className={`h-8 w-8 rounded-md border-2 ${f.accent === c ? "border-white" : "border-transparent"}`} style={{ background: c }} />
              ))}
              <Input type="text" value={f.accent} onChange={(e) => setF({ ...f, accent: e.target.value })} className="w-32 h-9" data-testid="accent-hex" />
            </div>
          </div>
          <Button type="submit" disabled={busy} data-testid="brand-save-btn" className="text-black" style={{ background: f.accent }}>{busy ? "Saving…" : "Save changes"}</Button>
        </form>

        <div className="eams-card p-5 space-y-4" data-testid="brand-preview">
          <div className="text-eyebrow">Live preview</div>
          <div className="rounded-md border border-slate-800 bg-[#0a0e15] p-4">
            <div className="flex items-center gap-3">
              {f.logo_url ? (
                <img src={f.logo_url} alt="preview" className="h-10 w-10 rounded-md object-cover border border-white/10" />
              ) : (
                <div className="h-10 w-10 rounded-md grid place-items-center font-bold text-black" style={{ background: f.accent }}>{(f.name?.[0] || "C").toUpperCase()}</div>
              )}
              <div>
                <div className="font-bold text-white heading">{f.name || "Brand Name"}</div>
                <div className="text-[11px] text-slate-400 mono uppercase tracking-widest">{f.subtitle || "Subtitle"}</div>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-slate-800 p-4 space-y-3">
            <div className="h-2 rounded" style={{ background: f.accent }} />
            <div className="text-eyebrow" style={{ color: f.accent }}>Accent Example</div>
            <button className="px-3 py-1.5 rounded text-sm text-black font-medium" style={{ background: f.accent }}>Primary Action</button>
          </div>
        </div>
      </div>
    </div>
  );
}
