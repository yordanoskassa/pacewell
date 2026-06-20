import { useState, useEffect, useCallback } from "react";
import ConnectFitbit from "../components/ConnectFitbit";
import SyncButton from "../components/SyncButton";
import HRTimeline from "../components/HRTimeline";
import SpikeCards from "../components/SpikeCards";
import ActivityLogger from "../components/ActivityLogger";
import SymptomLogger from "../components/SymptomLogger";
import AIInsightPanel from "../components/AIInsightPanel";
import {
  getUserId,
  getFitbitAuthUrl,
  getHRToday,
  getHREventsToday,
  getActivities,
  getSymptoms,
} from "../api/client";
import type { HRPoint, HREvent, ActivityLog, SymptomLog, SyncResult } from "../types";

export default function Dashboard() {
  const userId = getUserId();
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const [hrPoints, setHrPoints] = useState<HRPoint[]>([]);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [events, setEvents] = useState<HREvent[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  // Check if fitbit is connected from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fitbit") === "connected") {
      setFitbitConnected(true);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
      if (hrData.points?.length) {
        setFitbitConnected(true);
      }
    } catch {
      // Data may not exist yet
    }
  }, [userId, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSynced = (result: SyncResult) => {
    setBaseline(result.baseline_bpm);
    setFitbitConnected(true);
    loadData();
  };

  if (!userId) {
    return null; // BlockedState handles this in App.tsx
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e" }}>PaceWell</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ConnectFitbit
            connected={fitbitConnected}
            authUrl={getFitbitAuthUrl(userId)}
            lastSync={null}
          />
          {fitbitConnected && (
            <SyncButton userId={userId} onSynced={handleSynced} />
          )}
        </div>
      </div>

      {/* Heart Rate Timeline */}
      <Section title="Heart Rate Timeline">
        <HRTimeline points={hrPoints} baseline={baseline} />
      </Section>

      {/* HR Events */}
      <Section title="Heart Rate Events">
        <SpikeCards events={events} />
      </Section>

      {/* Activity Logger */}
      <Section title="Activity Log">
        <ActivityLogger userId={userId} activities={activities} onChanged={loadData} />
      </Section>

      {/* Symptom Logger */}
      <Section title="Symptom Log">
        <SymptomLogger userId={userId} symptoms={symptoms} onChanged={loadData} />
      </Section>

      {/* AI Insight */}
      <Section title="AI Health Insight">
        <AIInsightPanel userId={userId} date={today} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: "1.5rem",
      padding: "1rem 1.25rem",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#333", marginBottom: "0.75rem" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
