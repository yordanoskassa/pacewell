import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { HRPoint } from "../types";

interface HRTimelineProps {
  points: HRPoint[];
  baseline: number | null;
}

export default function HRTimeline({ points, baseline }: HRTimelineProps) {
  if (!points.length) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
        No heart rate data. Click "Sync Today" to fetch data from Fitbit.
      </div>
    );
  }

  const chartData = points.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    bpm: p.bpm,
  }));

  // Show at most ~100 ticks on x-axis
  const interval = Math.max(1, Math.floor(chartData.length / 60));

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="time"
            interval={interval}
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            domain={["dataMin - 10", "dataMax + 10"]}
            tick={{ fontSize: 12 }}
            label={{ value: "BPM", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="bpm"
            stroke="#e53935"
            strokeWidth={1.5}
            dot={false}
          />
          {baseline && (
            <ReferenceLine
              y={baseline}
              stroke="#1a73e8"
              strokeDasharray="5 5"
              label={{ value: `Baseline: ${baseline}`, position: "right", fontSize: 11 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
