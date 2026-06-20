import { useState } from "react";
import { createActivity, deleteActivity } from "../api/client";
import type { ActivityLog } from "../types";

interface ActivityLoggerProps {
  userId: string;
  activities: ActivityLog[];
  onChanged: () => void;
}

const ACTIVITY_TYPES = [
  "Walking",
  "Running",
  "Climbing Stairs",
  "Cycling",
  "Stretching",
  "Household Chores",
  "Other",
];

const INTENSITIES = ["light", "moderate", "vigorous"];

export default function ActivityLogger({ userId, activities, onChanged }: ActivityLoggerProps) {
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [intensity, setIntensity] = useState(INTENSITIES[0]);
  const [startedAt, setStartedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startedAt) return;

    setLoading(true);
    setError("");
    try {
      await createActivity(userId, {
        activity_type: type.toLowerCase(),
        started_at: new Date(startedAt).toISOString(),
        intensity,
        notes: notes || undefined,
      });
      setStartedAt("");
      setNotes("");
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to log activity");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity(userId, id);
      onChanged();
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          Activity
          <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
            {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          Intensity
          <select value={intensity} onChange={(e) => setIntensity(e.target.value)} style={selectStyle}>
            {INTENSITIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          When
          <input
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          Notes
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            style={{ ...inputStyle, width: 140 }}
          />
        </label>
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "..." : "Log"}
        </button>
      </form>
      {error && <p style={{ color: "#d32f2f", fontSize: "0.8rem", marginTop: 4 }}>{error}</p>}

      {activities.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {activities.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", background: "#f5f5f5", borderRadius: 6, fontSize: "0.85rem" }}>
              <span>
                <strong>{a.activity_type}</strong>
                {a.intensity && <> ({a.intensity})</>}
                {" at "}
                {new Date(a.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {a.notes && <> &mdash; {a.notes}</>}
              </span>
              <button onClick={() => handleDelete(a.id)} style={{ background: "none", border: "none", color: "#d32f2f", cursor: "pointer", fontSize: "0.8rem" }}>
                remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.4rem 0.5rem",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: "0.85rem",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  minWidth: 100,
};

const btnStyle: React.CSSProperties = {
  padding: "0.45rem 1rem",
  background: "#1a73e8",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 600,
  fontSize: "0.85rem",
  cursor: "pointer",
};
