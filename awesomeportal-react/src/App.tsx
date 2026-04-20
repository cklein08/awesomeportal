import React, { useEffect } from "react";
import AppRouter from "./components/AppRouter";
import PortalSplashGate from "./components/PortalSplashGate";
import Dashboard from "./pages/dashboard";
import AdminActivities from "./pages/AdminActivities";
import { getPortalTitle } from "./utils/portalBranding";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  useEffect(() => {
    document.title = getPortalTitle();
  }, []);

  return (
    <PortalSplashGate>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/activities" element={<AdminActivities />} />
        <Route path="/admin" element={<Navigate to="/admin/activities" replace />} />
        <Route path="/admin/grid-edit" element={<Navigate to="/admin/activities" replace />} />
        {/* Main app routes */}
        <Route path="*" element={<AppRouter />} />
      </Routes>
    </PortalSplashGate>
  );
}

export default App;