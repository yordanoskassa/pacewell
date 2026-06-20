import type { HREvent } from "../types";

interface SpikeCardsProps {
  events: HREvent[];
}

export default function SpikeCards({ events }: SpikeCardsProps) {
  if (!events.length) {
    return (
      <p style={{ color: "#888", fontSize: "0.9rem" }}>
        No heart rate events detected.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {events.map((e) => (
        <div
          key={e.id}
          style={{
            padding: "0.8rem 1rem",
            background: e.event_type === "sustained_spike" ? "#fff3e0" : "#fce4ec",
            borderLeft: `4px solid ${e.event_type === "sustained_spike" ? "#ef6c00" : "#e53935"}`,
            borderRadius: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.9rem" }}>
              {e.event_type === "sustained_spike" ? "Sustained Elevation" : "HR Spike"}
            </strong>
            <span style={{ fontSize: "0.8rem", color: "#666" }}>
              {new Date(e.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {e.end_time && (
                <> &ndash; {new Date(e.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
              )}
            </span>
          </div>
          <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "#333" }}>
            Peak: <strong>{e.peak_bpm} bpm</strong> (baseline: {e.baseline_bpm} bpm)
            {e.duration_minutes && <> &middot; {e.duration_minutes} min</>}
          </div>
          {(e.matched_activity || e.matched_symptom) && (
            <div style={{ marginTop: "0.3rem", fontSize: "0.8rem", color: "#555" }}>
              {e.matched_activity && <span>Activity: {e.matched_activity}</span>}
              {e.matched_activity && e.matched_symptom && <> &middot; </>}
              {e.matched_symptom && <span>Symptom: {e.matched_symptom}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
