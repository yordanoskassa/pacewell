import { useState } from "react";
import { getAIInsight } from "../api/client";
import type { AIInsight } from "../types";

interface AIInsightPanelProps {
  userId: string;
  date?: string;
}

export default function AIInsightPanel({ userId, date }: AIInsightPanelProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAIInsight(userId, date);
      setInsight(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          padding: "0.6rem 1.4rem",
          background: loading ? "#aaa" : "#7c4dff",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: "0.9rem",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Analyzing..." : "Get AI Insight"}
      </button>

      {error && <p style={{ color: "#d32f2f", fontSize: "0.85rem", marginTop: 8 }}>{error}</p>}

      {insight && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ padding: "1rem", background: "#f3e5f5", borderRadius: 8 }}>
            <h4 style={{ margin: "0 0 0.4rem", fontSize: "0.9rem" }}>Summary</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>{insight.summary}</p>
          </div>

          {insight.patterns.length > 0 && (
            <div style={{ padding: "0.8rem 1rem", background: "#e8eaf6", borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 0.4rem", fontSize: "0.9rem" }}>Patterns</h4>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem" }}>
                {insight.patterns.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {insight.recommendations.length > 0 && (
            <div style={{ padding: "0.8rem 1rem", background: "#e0f2f1", borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 0.4rem", fontSize: "0.9rem" }}>Recommendations</h4>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem" }}>
                {insight.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {insight.risk_flags.length > 0 && (
            <div style={{ padding: "0.8rem 1rem", background: "#fce4ec", borderRadius: 8, borderLeft: "4px solid #e53935" }}>
              <h4 style={{ margin: "0 0 0.4rem", fontSize: "0.9rem", color: "#c62828" }}>Risk Flags</h4>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem" }}>
                {insight.risk_flags.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
