import React from "react";
import AppRouter from "./components/AppRouter";
import PortalSplashGate from "./components/PortalSplashGate";
import Dashboard from "./pages/dashboard";
import GridEdit from "./pages/GridEdit";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <PortalSplashGate>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/grid-edit" element={<GridEdit />} />
        {/* Main app routes */}
        <Route path="*" element={<AppRouter />} />
      </Routes>
    </PortalSplashGate>
  );
}

export default App;