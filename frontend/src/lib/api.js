import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({ baseURL: API });

// Attach bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("eams_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export function formatError(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e?.msg ? e.msg : JSON.stringify(e))).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}
