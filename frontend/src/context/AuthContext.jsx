import React, { createContext, useContext, useEffect, useState } from "react";
import { api, formatError } from "@/lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=logged out, object=user
  useEffect(() => {
    const token = localStorage.getItem("eams_token");
    if (!token) { setUser(false); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => { localStorage.removeItem("eams_token"); setUser(false); });
  }, []);
  const login = async (email, password) => {
    try {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("eams_token", r.data.token);
      setUser(r.data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatError(e.response?.data?.detail) || e.message };
    }
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    localStorage.removeItem("eams_token");
    setUser(false);
  };
  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}
