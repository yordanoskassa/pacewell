import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Activity,
  Zap,
  Brain,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";
import Logo from "../components/Logo";
import {
  getUserId,
  getFitbitAuthUrl,
  getHRToday,
  getHREventsToday,
  getActivities,
  getSymptoms,
  seedDemoData,
  createActivity,
  deleteActivity,
  createSymptom,
  deleteSymptom,
  getAIInsight,
  syncToday,
} from "../api/client";
import type { HRPoint, HREvent, ActivityLog, SymptomLog, AIInsight } from "../types";

export default function Dashboard() {
  const userId = getUserId();
  const navigate = useNavigate();
  const [hrPoints, setHrPoints] = useState<HRPoint[]>([]);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [events, setEvents] = useState<HREvent[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!userId) navigate("/");
  }, [userId, navigate]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [hrData, hrEvents, acts, syms] = await Promise.all([
        getHRToday(userId),
        getHREventsToday(userId),
        getActivities(userId, today),
        getSymptoms(userId, today),
      ]);
      setHrPoints(hrData.points || []);
      setEvents(hrEvents || []);
      setActivities(acts || []);
      setSymptoms(syms || []);
    } catch {
      /* data may not exist yet */
    }
  }, [userId, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      const result = await seedDemoData(userId, today);
      setBaseline(result.baseline_bpm);
      await loadData();
    } catch { /* ignore */ }
    finally { setDemoLoading(false); }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const result = await syncToday(userId);
      setBaseline(result.baseline_bpm);
      await loadData();
    } catch { /* ignore */ }
    finally { setSyncLoading(false); }
  };

  const handleInsight = async () => {
    setInsightLoading(true);
    try {
      const result = await getAIInsight(userId, today);
      setInsight(result);
    } catch { /* ignore */ }
    finally { setInsightLoading(false); }
  };

  // Compute stats
  const bpms = hrPoints.map((p) => p.bpm);
  const avgBpm = bpms.length ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length) : 0;
  const maxBpm = bpms.length ? Math.max(...bpms) : 0;
  const minBpm = bpms.length ? Math.min(...bpms) : 0;
  const spikeCount = events.filter((e) => e.event_type === "spike").length;
  const sustainedCount = events.filter((e) => e.event_type === "sustained_spike").length;

  // Chart data - sample every 5 points for performance
  const chartData = hrPoints
    .filter((_, i) => i % 5 === 0)
    .map((p) => ({
      time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      bpm: p.bpm,
    }));

  // Hourly distribution for bar chart
  const hourlyData: { hour: string; avg: number; max: number }[] = [];
  if (hrPoints.length) {
    const byHour: Record<number, number[]> = {};
    hrPoints.forEach((p) => {
      const h = new Date(p.timestamp).getHours();
      if (!byHour[h]) byHour[h] = [];
      byHour[h].push(p.bpm);
    });
    for (let h = 0; h < 24; h++) {
      const vals = byHour[h] || [];
      hourlyData.push({
        hour: `${h.toString().padStart(2, "0")}:00`,
        avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
        max: vals.length ? Math.max(...vals) : 0,
      });
    }
  }

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-inter">
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Logo className="w-6 h-6 text-white" />
          <span className="font-askan text-lg tracking-wide">PaceWell</span>
          <span className="text-white/30 text-sm ml-4 hidden sm:inline">Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadDemo}
            disabled={demoLoading}
            className="glass text-white text-xs px-4 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            {demoLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Demo Data
          </button>
          <button
            onClick={handleSync}
            disabled={syncLoading}
            className="glass text-white text-xs px-4 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            {syncLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Sync Fitbit
          </button>
          <a
            href={getFitbitAuthUrl(userId)}
            className="bg-white text-gray-900 text-xs font-medium px-4 py-2 rounded-full hover:bg-white/90 transition-colors hidden sm:block"
          >
            Connect Fitbit
          </a>
          <span className="text-white/30 text-xs">{userId}</span>
        </div>
      </nav>

      <div className="px-4 sm:px-8 py-6 max-w-[1400px] mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            icon={<Heart size={18} />}
            label="Avg Heart Rate"
            value={avgBpm ? `${avgBpm}` : "—"}
            unit="bpm"
            color="text-rose-400"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Peak"
            value={maxBpm ? `${maxBpm}` : "—"}
            unit="bpm"
            color="text-orange-400"
          />
          <StatCard
            icon={<Zap size={18} />}
            label="Spike Events"
            value={`${spikeCount + sustainedCount}`}
            unit={sustainedCount ? `${sustainedCount} sustained` : "today"}
            color="text-amber-400"
          />
          <StatCard
            icon={<Activity size={18} />}
            label="Activities"
            value={`${activities.length}`}
            unit={`${symptoms.length} symptoms`}
            color="text-emerald-400"
          />
        </div>

        {/* Main Chart */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-live" />
              <h2 className="text-sm font-medium text-white/80">Heart Rate Timeline</h2>
              <span className="text-white/30 text-xs">{today}</span>
            </div>
            {baseline && (
              <span className="text-xs text-blue-400/80">
                Baseline: {baseline} bpm
              </span>
            )}
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="time"
                  interval={Math.max(1, Math.floor(chartData.length / 12))}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 10", "dataMax + 10"]}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bpm"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  fill="url(#hrGradient)"
                  dot={false}
                />
                {baseline && (
                  <ReferenceLine
                    y={baseline}
                    stroke="rgba(96,165,250,0.5)"
                    strokeDasharray="5 5"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-white/20 text-sm">
              No heart rate data yet. Click "Demo Data" or "Sync Fitbit" to get started.
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Hourly Distribution */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-violet-400" />
              <h2 className="text-sm font-medium text-white/80">Hourly Distribution</h2>
            </div>
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="hour"
                    interval={3}
                    tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="avg" fill="rgba(139,92,246,0.6)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="max" fill="rgba(244,63,94,0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">
                No data
              </div>
            )}
          </div>

          {/* HR Events / Spikes */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-400" />
              <h2 className="text-sm font-medium text-white/80">
                Heart Rate Events ({events.length})
              </h2>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-white/20 text-sm text-center py-8">
                  No events detected
                </div>
              ) : (
                events.map((e) => (
                  <div
                    key={e.id}
                    className={`rounded-xl p-3 border ${
                      e.event_type === "sustained_spike"
                        ? "bg-orange-500/10 border-orange-500/20"
                        : "bg-rose-500/10 border-rose-500/20"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">
                        {e.event_type === "sustained_spike" ? "Sustained Elevation" : "Spike"}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {new Date(e.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      Peak <strong className="text-white">{e.peak_bpm}</strong> bpm
                      {e.duration_minutes && <> · {e.duration_minutes} min</>}
                      {e.matched_activity && (
                        <span className="text-emerald-400/80"> · {e.matched_activity}</span>
                      )}
                      {e.matched_symptom && (
                        <span className="text-amber-400/80"> · {e.matched_symptom}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Activity & Symptom Loggers + AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Activity Logger */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-emerald-400" />
              <h2 className="text-sm font-medium text-white/80">Activities</h2>
            </div>
            <ActivityForm userId={userId} onCreated={loadData} />
            <div className="mt-3 space-y-2 max-h-[180px] overflow-y-auto">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                >
                  <div className="text-xs">
                    <span className="text-white font-medium">{a.activity_type}</span>
                    {a.intensity && (
                      <span className="text-white/40 ml-1">({a.intensity})</span>
                    )}
                    <span className="text-white/30 ml-2">
                      {new Date(a.started_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteActivity(userId, a.id).then(loadData)}
                    className="text-white/20 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Symptom Logger */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-orange-400" />
              <h2 className="text-sm font-medium text-white/80">Symptoms</h2>
            </div>
            <SymptomForm userId={userId} onCreated={loadData} />
            <div className="mt-3 space-y-2 max-h-[180px] overflow-y-auto">
              {symptoms.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                >
                  <div className="text-xs">
                    <span className="text-white font-medium">{s.symptom_type}</span>
                    <span className="text-amber-400/60 ml-1">{s.severity}/10</span>
                    <span className="text-white/30 ml-2">
                      {new Date(s.occurred_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSymptom(userId, s.id).then(loadData)}
                    className="text-white/20 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-violet-400" />
                <h2 className="text-sm font-medium text-white/80">AI Insight</h2>
              </div>
              <button
                onClick={handleInsight}
                disabled={insightLoading || !hrPoints.length}
                className="glass text-xs text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1 disabled:opacity-30"
              >
                {insightLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Zap size={12} />
                )}
                Analyze
              </button>
            </div>
            {insight ? (
              <div className="space-y-3 text-xs">
                <p className="text-white/70 leading-relaxed">{insight.summary}</p>
                {insight.patterns.length > 0 && (
                  <div>
                    <span className="text-violet-400/80 font-medium text-[10px] uppercase tracking-wider">
                      Patterns
                    </span>
                    <ul className="mt-1 space-y-1">
                      {insight.patterns.map((p, i) => (
                        <li key={i} className="text-white/50 flex items-start gap-1.5">
                          <ChevronRight size={10} className="mt-0.5 text-violet-400/50 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {insight.recommendations.length > 0 && (
                  <div>
                    <span className="text-emerald-400/80 font-medium text-[10px] uppercase tracking-wider">
                      Recommendations
                    </span>
                    <ul className="mt-1 space-y-1">
                      {insight.recommendations.map((r, i) => (
                        <li key={i} className="text-white/50 flex items-start gap-1.5">
                          <ChevronRight size={10} className="mt-0.5 text-emerald-400/50 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {insight.risk_flags.length > 0 && (
                  <div className="bg-rose-500/10 rounded-lg p-2 border border-rose-500/20">
                    <span className="text-rose-400 font-medium text-[10px] uppercase tracking-wider">
                      Risk Flags
                    </span>
                    <ul className="mt-1 space-y-1">
                      {insight.risk_flags.map((r, i) => (
                        <li key={i} className="text-white/60">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-white/20 text-xs text-center py-8">
                {hrPoints.length
                  ? 'Click "Analyze" to generate AI insights'
                  : "Load data first"}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/report")}
            className="glass text-white text-xs px-4 py-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <BarChart3 size={14} />
            Clinician Report
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl sm:text-3xl font-light text-white">{value}</div>
      <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{label}</div>
      <div className="text-xs text-white/20 mt-0.5">{unit}</div>
    </div>
  );
}

function ActivityForm({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [type, setType] = useState("walking");
  const [intensity, setIntensity] = useState("moderate");
  const [time, setTime] = useState("");

  const handleSubmit = async () => {
    if (!time) return;
    await createActivity(userId, {
      activity_type: type,
      started_at: new Date(time).toISOString(),
      intensity,
    });
    setTime("");
    onCreated();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none flex-1 min-w-[80px]"
      >
        {["walking", "running", "climbing stairs", "cycling", "stretching", "other"].map((t) => (
          <option key={t} value={t} className="bg-gray-900">{t}</option>
        ))}
      </select>
      <select
        value={intensity}
        onChange={(e) => setIntensity(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
      >
        {["light", "moderate", "vigorous"].map((i) => (
          <option key={i} value={i} className="bg-gray-900">{i}</option>
        ))}
      </select>
      <input
        type="datetime-local"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none flex-1 min-w-[140px]"
      />
      <button
        onClick={handleSubmit}
        className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg px-3 py-1.5 text-xs hover:bg-emerald-500/30 transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function SymptomForm({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [type, setType] = useState("dizziness");
  const [severity, setSeverity] = useState(5);
  const [time, setTime] = useState("");

  const handleSubmit = async () => {
    if (!time) return;
    await createSymptom(userId, {
      symptom_type: type,
      severity,
      occurred_at: new Date(time).toISOString(),
    });
    setTime("");
    onCreated();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none flex-1 min-w-[80px]"
      >
        {["dizziness", "chest pain", "shortness of breath", "palpitations", "fatigue", "nausea", "headache"].map((t) => (
          <option key={t} value={t} className="bg-gray-900">{t}</option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        max={10}
        value={severity}
        onChange={(e) => setSeverity(Number(e.target.value))}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-[50px]"
      />
      <input
        type="datetime-local"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none flex-1 min-w-[140px]"
      />
      <button
        onClick={handleSubmit}
        className="bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg px-3 py-1.5 text-xs hover:bg-orange-500/30 transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
