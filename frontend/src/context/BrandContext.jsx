import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const BrandCtx = createContext(null);
export const useBrand = () => useContext(BrandCtx);

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState({ name: "Colecle", subtitle: "System EAMS", logo_url: null, accent: "#f59e0b" });
  const refresh = useCallback(async () => {
    try {
      const r = await api.get("/brand");
      setBrand(r.data);
    } catch (_) {}
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const save = async (next) => {
    const r = await api.put("/brand", next);
    setBrand(r.data);
    return r.data;
  };
  return <BrandCtx.Provider value={{ brand, refresh, save }}>{children}</BrandCtx.Provider>;
}
