import React, { useEffect } from "react";
import AppRouter from "./components/AppRouter";
import PortalSplashGate from "./components/PortalSplashGate";
import Dashboard from "./pages/dashboard";
import AdminActivities from "./pages/AdminActivities";
import AdminHub from "./pages/AdminHub";
import GridEdit from "./pages/GridEdit";
import { getPortalTitle } from "./utils/portalBranding";
import { Routes, Route } from "react-router-dom";

function App() {
  useEffect(() => {
    document.title = getPortalTitle();
  }, []);

  return (
    <PortalSplashGate>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminHub />} />
        <Route path="/admin/activities" element={<AdminActivities />} />
        <Route path="/admin/grid-edit" element={<GridEdit />} />
        {/* Main app routes */}
        <Route path="*" element={<AppRouter />} />
      </Routes>
    </PortalSplashGate>
  );
}

export default App;