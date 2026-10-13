import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 16 }}>
        Free & open source
      </div>
      <h1 style={{ fontSize: 44, lineHeight: 1.15, margin: "0 0 20px" }}>
        Automation that works for people,<br />not invoices.
      </h1>
      <p style={{ fontSize: 17, color: "var(--text-dim)", margin: "0 0 40px", lineHeight: 1.6 }}>
        Build workflows with triggers, actions, logic, and a real AI agent node.
        Self-host it for free, run it for your team, no per-execution billing.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Link to="/register" className="btn btn-primary" style={{ textDecoration: "none", padding: "10px 24px" }}>
          Create an account
        </Link>
        <Link to="/login" className="btn" style={{ textDecoration: "none", padding: "10px 24px" }}>
          Sign in
        </Link>
      </div>
    </main>
  );
}
