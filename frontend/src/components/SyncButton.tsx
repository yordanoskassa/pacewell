import { useState } from "react";
import { syncToday } from "../api/client";
import type { SyncResult } from "../types";

interface SyncButtonProps {
  userId: string;
  onSynced: (result: SyncResult) => void;
}

export default function SyncButton({ userId, onSynced }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await syncToday(userId);
      onSynced(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <button
        onClick={handleSync}
        disabled={loading}
        style={{
          padding: "0.6rem 1.4rem",
          background: loading ? "#aaa" : "#1a73e8",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: "0.9rem",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Syncing..." : "Sync Today"}
      </button>
      {error && <span style={{ color: "#d32f2f", fontSize: "0.85rem" }}>{error}</span>}
    </div>
  );
}
