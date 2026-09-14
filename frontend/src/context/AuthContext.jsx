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
      const detail = e?.response?.data?.detail;
      const err = detail != null
        ? formatError(detail)
        : (e?.message === "Network Error"
            ? "Cannot reach the API. Verify the backend is running and REACT_APP_BACKEND_URL is empty (same-origin) or matches this page's origin."
            : (e?.message || "Something went wrong."));
      return { ok: false, error: err };
    }
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    localStorage.removeItem("eams_token");
    setUser(false);
  };
  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}
