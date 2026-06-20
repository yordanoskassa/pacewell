import { useState } from "react";
import { createSymptom, deleteSymptom } from "../api/client";
import type { SymptomLog } from "../types";

interface SymptomLoggerProps {
  userId: string;
  symptoms: SymptomLog[];
  onChanged: () => void;
}

const SYMPTOM_TYPES = [
  "Dizziness",
  "Chest Pain",
  "Shortness of Breath",
  "Palpitations",
  "Fatigue",
  "Nausea",
  "Headache",
  "Other",
];

export default function SymptomLogger({ userId, symptoms, onChanged }: SymptomLoggerProps) {
  const [type, setType] = useState(SYMPTOM_TYPES[0]);
  const [severity, setSeverity] = useState(5);
  const [occurredAt, setOccurredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occurredAt) return;

    setLoading(true);
    setError("");
    try {
      await createSymptom(userId, {
        symptom_type: type.toLowerCase(),
        severity,
        occurred_at: new Date(occurredAt).toISOString(),
        notes: notes || undefined,
      });
      setOccurredAt("");
      setNotes("");
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to log symptom");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSymptom(userId, id);
      onChanged();
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          Symptom
          <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
            {SYMPTOM_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          Severity (1-10)
          <input
            type="number"
            min={1}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            style={{ ...inputStyle, width: 60 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          When
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
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

      {symptoms.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {symptoms.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", background: "#fff3e0", borderRadius: 6, fontSize: "0.85rem" }}>
              <span>
                <strong>{s.symptom_type}</strong> (severity: {s.severity}/10)
                {" at "}
                {new Date(s.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {s.notes && <> &mdash; {s.notes}</>}
              </span>
              <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", color: "#d32f2f", cursor: "pointer", fontSize: "0.8rem" }}>
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
  background: "#ef6c00",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 600,
  fontSize: "0.85rem",
  cursor: "pointer",
};
