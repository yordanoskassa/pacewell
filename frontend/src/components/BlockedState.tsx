interface BlockedStateProps {
  onSetUserId: (id: string) => void;
  authUrl: string | null;
}

export default function BlockedState({ onSetUserId, authUrl }: BlockedStateProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "1.5rem",
    }}>
      <h2 style={{ color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 600 }}>
        Welcome to PaceWell
      </h2>
      <p style={{ color: "#555", maxWidth: 420, textAlign: "center" }}>
        Connect your Fitbit to start monitoring your heart rate, logging activities and symptoms, and getting AI-powered health insights.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Enter a user ID (e.g. your name)"
          style={{
            padding: "0.6rem 1rem",
            border: "1px solid #ddd",
            borderRadius: 8,
            fontSize: "0.95rem",
            width: 260,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) onSetUserId(val);
            }
          }}
        />
        <p style={{ color: "#888", fontSize: "0.8rem" }}>Press Enter to set your user ID, then connect Fitbit below.</p>
      </div>

      {authUrl && (
        <a
          href={authUrl}
          style={{
            padding: "0.8rem 2rem",
            background: "#00B0B9",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Connect Fitbit
        </a>
      )}
    </div>
  );
}
