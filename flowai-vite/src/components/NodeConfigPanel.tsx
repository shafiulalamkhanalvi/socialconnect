import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface FieldSchema {
  type: string;
  label: string;
  required?: boolean;
  default?: any;
}

export default function NodeConfigPanel({
  node,
  schema,
  onChange,
  onClose,
  onDelete,
}: {
  node: { id: string; data: { label: string; type: string; params: Record<string, any> } };
  schema: Record<string, FieldSchema>;
  onChange: (nodeId: string, params: Record<string, any>) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}) {
  const [params, setParams] = useState<Record<string, any>>(node.data.params || {});
  const [credentials, setCredentials] = useState<any[]>([]);

  useEffect(() => setParams(node.data.params || {}), [node.id]);
  useEffect(() => { api.listCredentials().then(setCredentials); }, []);

  function update(field: string, value: any) {
    const next = { ...params, [field]: value };
    setParams(next);
    onChange(node.id, next);
  }

  return (
    <div
      style={{
        width: 340,
        borderLeft: "1px solid var(--border)",
        background: "var(--surface)",
        padding: 20,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{node.data.label}</h3>
        <button className="btn" onClick={onClose} style={{ padding: "4px 10px" }}>✕</button>
      </div>

      {Object.keys(schema).length === 0 && (
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>This node has no configurable parameters.</p>
      )}

      {Object.entries(schema).map(([field, def]) => (
        <div key={field} style={{ marginBottom: 14 }}>
          <label>
            {def.label} {def.required && <span style={{ color: "var(--danger)" }}>*</span>}
          </label>
          {def.type === "text" ? (
            <textarea
              rows={4}
              value={params[field] ?? def.default ?? ""}
              onChange={(e) => update(field, e.target.value)}
            />
          ) : def.type === "json" ? (
            <textarea
              rows={4}
              value={typeof params[field] === "string" ? params[field] : JSON.stringify(params[field] ?? def.default ?? {}, null, 2)}
              onChange={(e) => {
                try {
                  update(field, JSON.parse(e.target.value));
                } catch {
                  update(field, e.target.value); // allow typing invalid JSON transiently
                }
              }}
            />
          ) : def.type === "credential" ? (
            <select value={params[field] ?? ""} onChange={(e) => update(field, e.target.value)}>
              <option value="">Select a credential…</option>
              {credentials.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          ) : def.type === "boolean" ? (
            <select value={String(params[field] ?? def.default ?? false)} onChange={(e) => update(field, e.target.value === "true")}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          ) : (
            <input
              value={params[field] ?? def.default ?? ""}
              onChange={(e) => update(field, e.target.value)}
            />
          )}
        </div>
      ))}

      <button className="btn btn-danger" onClick={() => onDelete(node.id)} style={{ marginTop: 12, width: "100%" }}>
        Delete node
      </button>
    </div>
  );
}
