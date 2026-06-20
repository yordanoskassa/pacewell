interface ConnectFitbitProps {
  connected: boolean;
  authUrl: string;
  lastSync: string | null;
}

export default function ConnectFitbit({ connected, authUrl, lastSync }: ConnectFitbitProps) {
  if (connected) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.6rem 1rem",
        background: "#e8f5e9",
        borderRadius: 8,
        fontSize: "0.9rem",
      }}>
        <span style={{ color: "#2e7d32", fontWeight: 600 }}>Fitbit Connected</span>
        {lastSync && (
          <span style={{ color: "#666", fontSize: "0.8rem" }}>
            Last sync: {new Date(lastSync).toLocaleString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <a
      href={authUrl}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.6rem 1.2rem",
        background: "#00B0B9",
        color: "#fff",
        borderRadius: 8,
        textDecoration: "none",
        fontWeight: 600,
        fontSize: "0.9rem",
      }}
    >
      Connect Fitbit
    </a>
  );
}
