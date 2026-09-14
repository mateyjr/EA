import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BrandProvider } from "@/context/BrandContext";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DomainRepo from "@/pages/DomainRepo";
import ObjectDetail from "@/pages/ObjectDetail";
import Traceability from "@/pages/Traceability";
import ArchitectureMap from "@/pages/ArchitectureMap";
import Reviews from "@/pages/Reviews";
import ADRs from "@/pages/ADRs";
import Standards from "@/pages/Standards";
import Risks from "@/pages/Risks";
import AdminBrand from "@/pages/AdminBrand";

function ProtectedShell({ children }) {
  const { user } = useAuth();
  if (user === null) return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function LoginGate() {
  const { user } = useAuth();
  if (user === null) return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <div className="App">
      <BrandProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" theme="dark" />
            <Routes>
              <Route path="/login" element={<LoginGate />} />
              <Route path="/" element={<ProtectedShell><Dashboard /></ProtectedShell>} />
              <Route path="/map" element={<ProtectedShell><ArchitectureMap /></ProtectedShell>} />
              <Route path="/domain/:key" element={<ProtectedShell><DomainRepo /></ProtectedShell>} />
              <Route path="/object/:id" element={<ProtectedShell><ObjectDetail /></ProtectedShell>} />
              <Route path="/traceability/:id" element={<ProtectedShell><Traceability /></ProtectedShell>} />
              <Route path="/reviews" element={<ProtectedShell><Reviews /></ProtectedShell>} />
              <Route path="/adrs" element={<ProtectedShell><ADRs /></ProtectedShell>} />
              <Route path="/standards" element={<ProtectedShell><Standards /></ProtectedShell>} />
              <Route path="/risks" element={<ProtectedShell><Risks /></ProtectedShell>} />
              <Route path="/admin/brand" element={<ProtectedShell><AdminBrand /></ProtectedShell>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </BrandProvider>
    </div>
  );
}
