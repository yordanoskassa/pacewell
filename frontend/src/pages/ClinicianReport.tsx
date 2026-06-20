import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Loader2, Calendar } from "lucide-react";
import Logo from "../components/Logo";
import { getUserId, generateReport, listReports, getReport } from "../api/client";
import type { ClinicianReport as ReportType } from "../types";

export default function ClinicianReport() {
  const userId = getUserId();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<ReportType | null>(null);
  const [reports, setReports] = useState<
    { id: string; date_range_start: string; date_range_end: string; generated_at: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) navigate("/");
    else loadReportList();
  }, [userId, navigate]);

  const loadReportList = async () => {
    try {
      const list = await listReports(userId);
      setReports(list);
    } catch { /* ignore */ }
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const result = await generateReport(userId, startDate, endDate);
      setReport(result);
      loadReportList();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const loadReport = async (id: string) => {
    try {
      const r = await getReport(userId, id);
      setReport(r);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-inter dark-ui">
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <Logo className="w-6 h-6 text-white" />
          <span className="font-askan text-lg tracking-wide">PaceWell</span>
          <span className="text-white/30 text-sm ml-4 hidden sm:inline">Clinician Report</span>
        </div>
      </nav>

      <div className="px-4 sm:px-8 py-6 max-w-[1000px] mx-auto">
        {/* Generate Form */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-blue-400" />
            <h2 className="text-sm font-medium text-white/80">Generate Report</h2>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">End</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            </label>
            <button
              onClick={handleGenerate}
              disabled={loading || !startDate || !endDate}
              className="bg-white text-gray-900 text-sm font-medium px-6 py-2 rounded-full hover:bg-white/90 transition-colors disabled:opacity-30 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Generate
            </button>
          </div>
        </div>

        {/* Past Reports */}
        {reports.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-violet-400" />
              <h2 className="text-sm font-medium text-white/80">Past Reports</h2>
            </div>
            <div className="space-y-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => loadReport(r.id)}
                  className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-sm flex items-center justify-between"
                >
                  <span>
                    {r.date_range_start} to {r.date_range_end}
                  </span>
                  <span className="text-white/30 text-xs">
                    {new Date(r.generated_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Report Display */}
        {report && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-askan text-xl text-white mb-1">
                Report: {report.date_range_start} — {report.date_range_end}
              </h3>
              <p className="text-white/30 text-xs">
                Generated {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>

            {report.hr_summary && Object.keys(report.hr_summary).length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h4 className="text-sm font-medium text-white/80 mb-3">Heart Rate Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    ["Readings", report.hr_summary.total_readings],
                    ["Days", report.hr_summary.days_with_data],
                    ["Baseline", `${report.hr_summary.baseline_bpm} bpm`],
                    ["Min", `${report.hr_summary.overall_min} bpm`],
                    ["Max", `${report.hr_summary.overall_max} bpm`],
                    ["Avg", `${report.hr_summary.overall_avg} bpm`],
                  ].map(([label, val]) => (
                    <div key={String(label)}>
                      <div className="text-lg font-light text-white">{String(val)}</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider">
                        {String(label)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.events_summary.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h4 className="text-sm font-medium text-white/80 mb-3">
                  HR Events ({report.events_summary.length})
                </h4>
                <div className="space-y-2">
                  {report.events_summary.map((e, i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/60"
                    >
                      <span className="text-white/30">{e.date}</span> — {e.event_type} · peak{" "}
                      <span className="text-white">{e.peak_bpm}</span> bpm
                      {e.matched_activity && (
                        <span className="text-emerald-400/70"> · {e.matched_activity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.activities.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h4 className="text-sm font-medium text-white/80 mb-3">
                  Activities ({report.activities.length})
                </h4>
                <div className="space-y-1.5">
                  {report.activities.map((a, i) => (
                    <div key={i} className="text-xs text-white/50">
                      {a.activity_type}
                      {a.intensity && ` (${a.intensity})`} ·{" "}
                      {new Date(a.started_at).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.symptoms.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h4 className="text-sm font-medium text-white/80 mb-3">
                  Symptoms ({report.symptoms.length})
                </h4>
                <div className="space-y-1.5">
                  {report.symptoms.map((s, i) => (
                    <div key={i} className="text-xs text-white/50">
                      {s.symptom_type} · severity{" "}
                      <span className="text-amber-400/70">{s.severity}/10</span> ·{" "}
                      {new Date(s.occurred_at).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.ai_insights.length > 0 && (
              <div className="glass-card rounded-2xl p-6 border-violet-500/20">
                <h4 className="text-sm font-medium text-violet-400/80 mb-3">AI Insights</h4>
                <div className="space-y-3">
                  {report.ai_insights.map((ins, i) => (
                    <div key={i} className="text-xs text-white/60">
                      <span className="text-white/30">{ins.date}:</span> {ins.summary}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
