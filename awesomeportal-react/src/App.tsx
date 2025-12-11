import React from "react";
import AppRouter from "./components/AppRouter";
import Dashboard from "./pages/dashboard";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Main app routes */}
      <Route path="*" element={<AppRouter />} />
    </Routes>
  );
}

export default App;