import { useState } from "react";
import { getUserId, generateReport, listReports, getReport } from "../api/client";
import type { ClinicianReport as ReportType } from "../types";

export default function ClinicianReport() {
  const userId = getUserId();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<ReportType | null>(null);
  const [reports, setReports] = useState<{ id: string; date_range_start: string; date_range_end: string; generated_at: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!startDate || !endDate || !userId) return;
    setLoading(true);
    setError("");
    try {
      const result = await generateReport(userId, startDate, endDate);
      setReport(result);
      loadReportList();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const loadReportList = async () => {
    if (!userId) return;
    try {
      const list = await listReports(userId);
      setReports(list);
    } catch {
      /* ignore */
    }
  };

  const loadReport = async (id: string) => {
    if (!userId) return;
    try {
      const r = await getReport(userId, id);
      setReport(r);
    } catch {
      /* ignore */
    }
  };

  useState(() => {
    loadReportList();
  });

  if (!userId) {
    return <p style={{ padding: "2rem", textAlign: "center" }}>Set a user ID first.</p>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e", marginBottom: "1.5rem" }}>
        Clinician Report
      </h1>

      {/* Generate Form */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          Start Date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", color: "#555" }}>
          End Date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </label>
        <button onClick={handleGenerate} disabled={loading} style={btnStyle}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>
      {error && <p style={{ color: "#d32f2f", fontSize: "0.85rem" }}>{error}</p>}

      {/* Past Reports */}
      {reports.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Past Reports</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => loadReport(r.id)}
                style={{
                  textAlign: "left",
                  padding: "0.5rem 0.75rem",
                  background: "#f5f5f5",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {r.date_range_start} to {r.date_range_end} &mdash; {new Date(r.generated_at).toLocaleDateString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Display */}
      {report && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "#e3f2fd", borderRadius: 8 }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
              Report: {report.date_range_start} to {report.date_range_end}
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#555" }}>
              Generated: {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>

          {/* HR Summary */}
          {report.hr_summary && Object.keys(report.hr_summary).length > 0 && (
            <div style={{ padding: "1rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>Heart Rate Summary</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", fontSize: "0.85rem" }}>
                <div>Readings: <strong>{report.hr_summary.total_readings}</strong></div>
                <div>Days: <strong>{report.hr_summary.days_with_data}</strong></div>
                <div>Baseline: <strong>{report.hr_summary.baseline_bpm} bpm</strong></div>
                <div>Min: <strong>{report.hr_summary.overall_min} bpm</strong></div>
                <div>Max: <strong>{report.hr_summary.overall_max} bpm</strong></div>
                <div>Avg: <strong>{report.hr_summary.overall_avg} bpm</strong></div>
              </div>
            </div>
          )}

          {/* Events */}
          {report.events_summary.length > 0 && (
            <div style={{ padding: "1rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>HR Events ({report.events_summary.length})</h4>
              {report.events_summary.map((e, i) => (
                <div key={i} style={{ fontSize: "0.85rem", padding: "0.3rem 0", borderBottom: "1px solid #f0f0f0" }}>
                  {e.date}: {e.event_type} &mdash; peak {e.peak_bpm} bpm
                  {e.matched_activity && <> (during {e.matched_activity})</>}
                </div>
              ))}
            </div>
          )}

          {/* Activities */}
          {report.activities.length > 0 && (
            <div style={{ padding: "1rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>Activities ({report.activities.length})</h4>
              {report.activities.map((a, i) => (
                <div key={i} style={{ fontSize: "0.85rem", padding: "0.3rem 0" }}>
                  {a.activity_type} {a.intensity && `(${a.intensity})`} at {new Date(a.started_at).toLocaleString()}
                </div>
              ))}
            </div>
          )}

          {/* Symptoms */}
          {report.symptoms.length > 0 && (
            <div style={{ padding: "1rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>Symptoms ({report.symptoms.length})</h4>
              {report.symptoms.map((s, i) => (
                <div key={i} style={{ fontSize: "0.85rem", padding: "0.3rem 0" }}>
                  {s.symptom_type} (severity: {s.severity}/10) at {new Date(s.occurred_at).toLocaleString()}
                </div>
              ))}
            </div>
          )}

          {/* AI Insights */}
          {report.ai_insights.length > 0 && (
            <div style={{ padding: "1rem", background: "#f3e5f5", borderRadius: 8 }}>
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>AI Insights</h4>
              {report.ai_insights.map((ins, i) => (
                <div key={i} style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
                  <strong>{ins.date}:</strong> {ins.summary}
                </div>
              ))}
            </div>
          )}
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

const btnStyle: React.CSSProperties = {
  padding: "0.6rem 1.4rem",
  background: "#1a73e8",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
};
