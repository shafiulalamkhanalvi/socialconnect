import { Handle, Position } from "reactflow";

const CATEGORY_COLOR: Record<string, string> = {
  trigger: "var(--trigger)",
  action: "var(--action)",
  logic: "var(--logic)",
  ai: "var(--ai)",
};

export default function GenericNode({ data, selected }: any) {
  const color = CATEGORY_COLOR[data.category] || "var(--text-dim)";
  const outputs: string[] = data.outputs || ["main"];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1.5px solid ${selected ? color : "var(--border)"}`,
        borderRadius: 10,
        minWidth: 180,
        boxShadow: selected ? `0 0 0 3px ${color}22` : "none",
      }}
    >
      {data.category !== "trigger" && <Handle type="target" position={Position.Left} style={{ background: color }} />}
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color }}>{data.category}</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{data.label}</div>
        {data.subtitle && (
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{data.subtitle}</div>
        )}
      </div>
      {outputs.map((output, i) => (
        <Handle
          key={output}
          type="source"
          position={Position.Right}
          id={output}
          style={{
            background: color,
            top: outputs.length > 1 ? `${30 + (i * 40)}%` : "50%",
          }}
        />
      ))}
      {outputs.length > 1 &&
        outputs.map((output, i) => (
          <div
            key={output}
            style={{
              position: "absolute",
              right: -36,
              top: `${30 + (i * 40)}%`,
              transform: "translateY(-50%)",
              fontSize: 10,
              color: "var(--text-dim)",
            }}
          >
            {output}
          </div>
        ))}
    </div>
  );
}
