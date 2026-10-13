import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, setToken } from "../lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ organizationName: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.register(form);
      setToken(res.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 380, margin: "60px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Create your workspace</h1>
      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label>Organization name</label>
          <input required value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} placeholder="Acme Inc" />
        </div>
        <div>
          <label>Your name</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div>
          <label>Password (min 8 characters)</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, color: "var(--text-dim)" }}>
        Already have an account? <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
      </p>
    </main>
  );
}
