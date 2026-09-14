import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, TestTube2, Save, Plus, Trash2, CheckCircle2, XCircle, Info } from "lucide-react";
import { toast } from "sonner";

const ROLES = ["viewer", "reviewer", "domain_architect", "lead_architect", "admin"];
const ATTR_PRESETS = ["sAMAccountName", "userPrincipalName", "uid", "cn", "mail"];

export default function LdapAdmin() {
  const [cfg, setCfg] = useState(null);
  const [testUsername, setTestUsername] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    const r = await api.get("/admin/ldap");
    setCfg({ ...r.data, bind_password: "" });
  };
  useEffect(() => { load(); }, []);
  if (!cfg) return <div className="text-slate-400">Loading…</div>;

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const payload = { ...cfg };
      if (!payload.bind_password) delete payload.bind_password;
      const r = await api.put("/admin/ldap", payload);
      setCfg({ ...r.data, bind_password: "" });
      toast.success("LDAP settings saved");
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
    setBusy(false);
  };

  const test = async (fullTest) => {
    setTesting(true); setTestResult(null);
    try {
      const body = { ...cfg };
      if (!body.bind_password) delete body.bind_password;
      if (fullTest) { body.test_username = testUsername; body.test_password = testPassword; }
      const r = await api.post("/admin/ldap/test", body);
      setTestResult(r.data);
    } catch (e) { setTestResult({ ok: false, stage: "network", error: e?.response?.data?.detail || e.message }); }
    setTesting(false);
  };

  const addMapping = () => set("group_role_mappings", [...(cfg.group_role_mappings || []), { group_dn: "", role: "viewer" }]);
  const setMapping = (i, patch) => set("group_role_mappings", cfg.group_role_mappings.map((m, idx) => idx === i ? { ...m, ...patch } : m));
  const delMapping = (i) => set("group_role_mappings", cfg.group_role_mappings.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5" data-testid="ldap-admin-page">
      <div className="eams-card p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-violet-500/15 border border-violet-500/40">
          <Building2 className="h-6 w-6 text-violet-400" />
        </div>
        <div className="flex-1">
          <div className="text-eyebrow">Admin</div>
          <h1 className="text-3xl heading font-bold text-white">Corporate LDAP / Active Directory</h1>
          <p className="text-sm text-slate-400 mt-1">Wire the Colecle EAMS "Corporate LDAP" sign-in tab to your live AD/LDAPS server.</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-slate-300 mono uppercase tracking-widest text-xs">Enabled</Label>
          <Switch checked={cfg.enabled} onCheckedChange={(v) => set("enabled", v)} data-testid="ldap-enabled" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="eams-card p-5 space-y-4">
          <div className="text-eyebrow">Connection</div>
          <div>
            <Label>Server URL *</Label>
            <Input data-testid="ldap-url" value={cfg.server_url} onChange={(e) => set("server_url", e.target.value)} placeholder="ldaps://ad.bot.go.tz:636" />
            <p className="text-xs text-slate-500 mt-1">Use <code className="mono">ldaps://</code> for TLS on 636. Use <code className="mono">ldap://</code> only with StartTLS.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={cfg.start_tls} onCheckedChange={(v) => set("start_tls", v)} data-testid="ldap-starttls" />
              <Label>StartTLS</Label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={cfg.verify_cert} onCheckedChange={(v) => set("verify_cert", v)} data-testid="ldap-verify" />
              <Label>Verify certificate</Label>
            </div>
          </div>
          <div>
            <Label>CA certificate chain (PEM)</Label>
            <Textarea data-testid="ldap-ca" rows={4} value={cfg.ca_cert_pem || ""} onChange={(e) => set("ca_cert_pem", e.target.value)} placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----" className="mono text-xs" />
            <p className="text-xs text-slate-500 mt-1">Leave blank to trust the system CA store.</p>
          </div>
          <div>
            <Label>Connect timeout (seconds)</Label>
            <Input type="number" data-testid="ldap-timeout" value={cfg.connect_timeout} onChange={(e) => set("connect_timeout", parseInt(e.target.value) || 5)} />
          </div>
        </div>

        <div className="eams-card p-5 space-y-4">
          <div className="text-eyebrow">Service account & user search</div>
          <div><Label>Service bind DN</Label><Input data-testid="ldap-bind-dn" value={cfg.bind_dn} onChange={(e) => set("bind_dn", e.target.value)} placeholder="CN=svc-eams,OU=Service Accounts,DC=bot,DC=go,DC=tz" /></div>
          <div>
            <Label>Service bind password {cfg.bind_password_set && <span className="text-emerald-400 text-xs ml-1">(stored)</span>}</Label>
            <Input type="password" data-testid="ldap-bind-pw" value={cfg.bind_password} onChange={(e) => set("bind_password", e.target.value)} placeholder={cfg.bind_password_set ? "Leave blank to keep current" : "•••••••"} />
          </div>
          <div><Label>User search base</Label><Input data-testid="ldap-search-base" value={cfg.user_search_base} onChange={(e) => set("user_search_base", e.target.value)} placeholder="OU=Staff,DC=bot,DC=go,DC=tz" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Login attribute</Label>
              <Select value={cfg.login_attribute} onValueChange={(v) => set("login_attribute", v)}>
                <SelectTrigger data-testid="ldap-login-attr"><SelectValue /></SelectTrigger>
                <SelectContent>{ATTR_PRESETS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Email attribute</Label><Input data-testid="ldap-email-attr" value={cfg.email_attribute} onChange={(e) => set("email_attribute", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name attribute</Label><Input data-testid="ldap-name-attr" value={cfg.name_attribute} onChange={(e) => set("name_attribute", e.target.value)} /></div>
            <div>
              <Label>Default role</Label>
              <Select value={cfg.default_role} onValueChange={(v) => set("default_role", v)}>
                <SelectTrigger data-testid="ldap-default-role"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>User filter template</Label>
            <Input data-testid="ldap-filter" value={cfg.user_filter} onChange={(e) => set("user_filter", e.target.value)} className="mono text-xs" />
            <p className="text-xs text-slate-500 mt-1">Use <code className="mono">{"{attr}"}</code> and <code className="mono">{"{username}"}</code>. AD default handles person+user classes.</p>
          </div>
        </div>
      </div>

      <div className="eams-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-eyebrow">Group → Role mappings</div>
          <Button size="sm" variant="ghost" onClick={addMapping} data-testid="add-mapping"><Plus className="h-4 w-4 mr-1" /> Add mapping</Button>
        </div>
        {(cfg.group_role_mappings || []).length === 0 && <div className="text-sm text-slate-500 italic">No mappings. All authenticated LDAP users will get the default role: <span className="mono uppercase tracking-widest text-amber-400">{cfg.default_role}</span>.</div>}
        {(cfg.group_role_mappings || []).map((m, i) => (
          <div key={i} className="flex items-center gap-2" data-testid={`mapping-${i}`}>
            <Input placeholder="CN=EAMS-Admins,OU=Groups,DC=bot,DC=go,DC=tz" value={m.group_dn} onChange={(e) => setMapping(i, { group_dn: e.target.value })} className="mono text-xs" data-testid={`mapping-dn-${i}`} />
            <Select value={m.role} onValueChange={(v) => setMapping(i, { role: v })}>
              <SelectTrigger className="w-56" data-testid={`mapping-role-${i}`}><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <button onClick={() => delMapping(i)} data-testid={`del-mapping-${i}`} className="p-2 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <p className="text-xs text-slate-500 flex items-center gap-1 pt-2"><Info className="h-3 w-3" /> Highest-priority matched role wins (admin &gt; lead_architect &gt; domain_architect &gt; reviewer &gt; viewer).</p>
      </div>

      <div className="flex gap-3">
        <Button onClick={save} disabled={busy} data-testid="save-ldap" className="bg-violet-500 hover:bg-violet-400 text-white"><Save className="h-4 w-4 mr-1" /> {busy ? "Saving…" : "Save settings"}</Button>
        <Button variant="outline" onClick={() => test(false)} disabled={testing} data-testid="test-svc-bind"><TestTube2 className="h-4 w-4 mr-1" /> Test service bind</Button>
      </div>

      <div className="eams-card p-5 space-y-3">
        <div className="text-eyebrow">Test end-to-end sign-in</div>
        <div className="grid md:grid-cols-3 gap-2">
          <Input placeholder={cfg.login_attribute || "sAMAccountName"} value={testUsername} onChange={(e) => setTestUsername(e.target.value)} data-testid="test-username" />
          <Input type="password" placeholder="corporate password" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} data-testid="test-password" />
          <Button onClick={() => test(true)} disabled={testing || !testUsername} data-testid="run-full-test" className="bg-emerald-500 hover:bg-emerald-400 text-black">{testing ? "Testing…" : "Run full test"}</Button>
        </div>
        {testResult && (
          <div className={`p-3 rounded border ${testResult.ok ? "border-emerald-500/50 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"}`} data-testid="test-result">
            <div className="flex items-center gap-2 mb-1">
              {testResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
              <span className={`text-sm font-semibold ${testResult.ok ? "text-emerald-300" : "text-red-300"}`}>{testResult.ok ? "Success" : "Failed"} · stage: {testResult.stage}</span>
            </div>
            {testResult.error && <div className="text-xs mono text-red-300 whitespace-pre-wrap">{testResult.error}</div>}
            {testResult.resolved_user && (
              <div className="text-xs mono text-emerald-300 space-y-0.5">
                <div>username: {testResult.resolved_user.username}</div>
                <div>name: {testResult.resolved_user.name}</div>
                <div>email: {testResult.resolved_user.email || "—"}</div>
                <div>role: {testResult.resolved_user.role}</div>
                <div>DN: {testResult.resolved_user.user_dn}</div>
                <div>groups matched: {testResult.groups_found}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
