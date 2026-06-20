import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ClinicianReport from "./pages/ClinicianReport";
import BlockedState from "./components/BlockedState";
import { getUserId, setUserId, getFitbitAuthUrl } from "./api/client";

export default function App() {
  const [userId, setUserIdState] = useState(getUserId());

  useEffect(() => {
    // Re-check on mount (URL params may have set it)
    const id = getUserId();
    if (id) setUserIdState(id);
  }, []);

  const handleSetUserId = (id: string) => {
    setUserId(id);
    setUserIdState(id);
  };

  if (!userId) {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>
        <BlockedState onSetUserId={handleSetUserId} authUrl={null} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>
        <nav style={{
          display: "flex",
          gap: "1.5rem",
          padding: "0.75rem 1.5rem",
          background: "#fff",
          borderBottom: "1px solid #eee",
          fontSize: "0.9rem",
        }}>
          <Link to="/" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: 600 }}>Dashboard</Link>
          <Link to="/report" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: 600 }}>Clinician Report</Link>
          <span style={{ marginLeft: "auto", color: "#888", fontSize: "0.8rem" }}>
            User: {userId}
          </span>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report" element={<ClinicianReport />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
