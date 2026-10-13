import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, isLoggedIn } from "../lib/api";

const CREDENTIAL_TYPES: Record<string, { label: string; fields: string[] }> = {
  anthropic: { label: "Anthropic (AI Agent node)", fields: ["apiKey"] },
  slack: { label: "Slack", fields: ["botToken"] },
  smtp: { label: "SMTP (Email node)", fields: ["host", "port", "secure", "user", "pass", "from"] },
  httpHeaderAuth: { label: "Generic HTTP header auth", fields: ["headerName", "headerValue"] },
};

export default function CredentialsPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [type, setType] = useState("anthropic");
  const [name, setName] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    api.listCredentials().then(setCredentials);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCredential({ name, type, data: fields });
      setName("");
      setFields({});
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.deleteCredential(id);
    refresh();
  }

  const schema = CREDENTIAL_TYPES[type];

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24 }}>Credentials</h1>
        <Link to="/dashboard" className="btn">Back to workflows</Link>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        {credentials.length === 0 ? (
          <p style={{ color: "var(--text-dim)", margin: 0 }}>No credentials saved yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {credentials.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{c.name}</strong>{" "}
                  <span style={{ color: "var(--text-dim)", fontSize: 13 }}>({c.type})</span>
                </div>
                <button className="btn btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h3 style={{ margin: 0 }}>Add credential</h3>
        <div>
          <label>Type</label>
          <select value={type} onChange={(e) => { setType(e.target.value); setFields({}); }}>
            {Object.entries(CREDENTIAL_TYPES).map(([key, def]) => (
              <option key={key} value={key}>{def.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="My Anthropic key" />
        </div>
        {schema.fields.map((field) => (
          <div key={field}>
            <label>{field}</label>
            <input
              value={fields[field] || ""}
              onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
            />
          </div>
        ))}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save credential"}
        </button>
        <p style={{ fontSize: 12, color: "var(--text-dim)", margin: 0 }}>
          Stored encrypted (AES-256-GCM) on the backend. Never displayed again after saving.
        </p>
      </form>
    </main>
  );
}
