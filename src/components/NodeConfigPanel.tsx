import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface FieldSchema {
  type: string;
  label: string;
  required?: boolean;
  default?: any;
  // "select" fields: either a flat list, or a dropdown whose options depend
  // on another field's current value (e.g. GitHub's "operation" list changes
  // based on which "resource" is selected) - this is what makes dropdowns
  // like GitHub/AI Agent configurable from the generic schema alone, with no
  // per-node-type UI code needed here.
  options?: string[];
  dependsOn?: string;
  optionsMap?: Record<string, string[]>;
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
    const next: Record<string, any> = { ...params, [field]: value };
    // If a field just changed and some OTHER field's dropdown options depend
    // on it (e.g. changing GitHub's "resource" from issue -> file), and that
    // dependent field's current value isn't valid for the new parent value
    // anymore, snap it to the first valid option instead of leaving a stale/
    // invalid selection sitting there silently.
    for (const [depField, depDef] of Object.entries(schema)) {
      if (depDef.dependsOn === field && depDef.optionsMap) {
        const allowed = depDef.optionsMap[value] || [];
        if (!allowed.includes(next[depField])) {
          next[depField] = allowed[0] ?? "";
        }
      }
    }
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
          ) : def.type === "select" ? (
            <select value={params[field] ?? def.default ?? ""} onChange={(e) => update(field, e.target.value)}>
              {(def.dependsOn && def.optionsMap
                ? def.optionsMap[params[def.dependsOn] ?? def.default ?? ""] || []
                : def.options || []
              ).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
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
