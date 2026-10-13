import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, isLoggedIn, clearToken } from "../lib/api";

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    api.listWorkflows().then(setWorkflows).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createWorkflow() {
    setCreating(true);
    try {
      const workflow = await api.createWorkflow({
        name: "New workflow",
        definition: {
          nodes: [{ id: "trigger-1", type: "manualTrigger", params: {}, position: { x: 100, y: 150 } }],
          connections: [],
        },
      });
      navigate(`/workflow/${workflow.id}`);
    } finally {
      setCreating(false);
    }
  }

  function logout() {
    clearToken();
    navigate("/login");
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 24 }}>Workflows</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/credentials" className="btn">Credentials</Link>
          <button className="btn btn-primary" onClick={createWorkflow} disabled={creating}>
            {creating ? "Creating…" : "+ New workflow"}
          </button>
          <button className="btn" onClick={logout}>Log out</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-dim)" }}>Loading…</p>
      ) : workflows.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--text-dim)" }}>
          No workflows yet. Create your first one to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {workflows.map((w) => (
            <Link
              key={w.id}
              to={`/workflow/${w.id}`}
              className="card"
              style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  Updated {new Date(w.updatedAt).toLocaleString()}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: w.active ? "rgba(79,138,104,0.15)" : "rgba(154,160,172,0.1)",
                  color: w.active ? "var(--trigger)" : "var(--text-dim)",
                }}
              >
                {w.active ? "Active" : "Inactive"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
