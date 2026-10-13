import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import GenericNode from "../components/nodes/GenericNode";
import NodeConfigPanel from "../components/NodeConfigPanel";
import { api, isLoggedIn } from "../lib/api";

const nodeTypes = { generic: GenericNode };

interface NodeTypeDef {
  type: string;
  label: string;
  category: string;
  outputs: string[];
  paramsSchema: Record<string, any>;
}

export default function WorkflowEditorPage() {
  const params = useParams();
  const navigate = useNavigate();
  const workflowId = params.id as string;

  const [name, setName] = useState("");
  const [active, setActive] = useState(false);
  const [nodeTypesList, setNodeTypesList] = useState<NodeTypeDef[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastExecution, setLastExecution] = useState<any>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    Promise.all([api.getWorkflow(workflowId), api.getNodeTypes()]).then(([workflow, types]) => {
      setName(workflow.name);
      setActive(workflow.active);
      setNodeTypesList(types);

      const def = workflow.definition || { nodes: [], connections: [] };
      const typeMap = new Map(types.map((t: NodeTypeDef) => [t.type, t]));

      setNodes(
        def.nodes.map((n: any) => {
          const typeDef = typeMap.get(n.type) as NodeTypeDef | undefined;
          return {
            id: n.id,
            type: "generic",
            position: n.position || { x: 100, y: 100 },
            data: {
              type: n.type,
              label: typeDef?.label || n.type,
              category: typeDef?.category || "action",
              outputs: typeDef?.outputs || ["main"],
              params: n.params || {},
            },
          };
        })
      );
      setEdges(
        def.connections.map((c: any, i: number) => ({
          id: `e${i}`,
          source: c.from,
          sourceHandle: c.fromOutput,
          target: c.to,
        }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection }, eds)),
    [setEdges]
  );

  function addNode(typeDef: NodeTypeDef) {
    const id = `node-${Date.now()}-${nextId.current++}`;
    const newNode: Node = {
      id,
      type: "generic",
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 300 },
      data: {
        type: typeDef.type,
        label: typeDef.label,
        category: typeDef.category,
        outputs: typeDef.outputs,
        params: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function updateNodeParams(nodeId: string, newParams: Record<string, any>) {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, params: newParams } } : n))
    );
  }

  function deleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }

  function toDefinition() {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.type,
        params: n.data.params,
        position: n.position,
      })),
      connections: edges.map((e: Edge) => ({
        from: e.source,
        fromOutput: e.sourceHandle || "main",
        to: e.target,
      })),
    };
  }

  async function handleSave(nextActive = active) {
    setSaving(true);
    try {
      await api.updateWorkflow(workflowId, { name, definition: toDefinition(), active: nextActive });
      setActive(nextActive);
    } finally {
      setSaving(false);
    }
  }

  async function handleRun() {
    setRunning(true);
    setLastExecution(null);
    try {
      await handleSave(); // ensure latest graph is saved before running
      const { executionId } = await api.runWorkflow(workflowId, {});
      // Poll for completion
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const exec = await api.getExecution(executionId);
        if (exec.status !== "running") {
          setLastExecution(exec);
          break;
        }
      }
    } finally {
      setRunning(false);
    }
  }

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const selectedTypeDef = useMemo(
    () => nodeTypesList.find((t) => t.type === selectedNode?.data.type),
    [nodeTypesList, selectedNode]
  );

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left palette */}
      <div style={{ width: 220, borderRight: "1px solid var(--border)", background: "var(--surface)", padding: 16, overflowY: "auto" }}>
        <Link to="/dashboard" style={{ fontSize: 13, color: "var(--text-dim)", textDecoration: "none" }}>← Dashboard</Link>
        <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "var(--text-dim)", marginTop: 20 }}>Add node</h3>
        {["trigger", "action", "logic", "ai"].map((category) => (
          <div key={category} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, textTransform: "capitalize" }}>{category}</div>
            {nodeTypesList.filter((t) => t.category === category).map((t) => (
              <button
                key={t.type}
                onClick={() => addNode(t)}
                className="btn"
                style={{ width: "100%", textAlign: "left", marginBottom: 6, fontSize: 13 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 240, fontWeight: 600 }}
          />
          <div style={{ flex: 1 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, margin: 0 }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={active}
              onChange={(e) => handleSave(e.target.checked)}
            />
            Active
          </label>
          <button className="btn" onClick={() => handleSave()} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          <button className="btn btn-primary" onClick={handleRun} disabled={running}>{running ? "Running…" : "▶ Test run"}</button>
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_e, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#2a2f3a" gap={20} />
            <Controls />
          </ReactFlow>
        </div>

        {lastExecution && (
          <div style={{ borderTop: "1px solid var(--border)", padding: 16, maxHeight: 220, overflowY: "auto", background: "var(--surface)" }}>
            <strong style={{ color: lastExecution.status === "success" ? "var(--trigger)" : "var(--danger)" }}>
              {lastExecution.status === "success" ? "✓ Success" : "✗ Error"}
            </strong>
            {lastExecution.error && <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 4 }}>{lastExecution.error}</div>}
            <pre style={{ fontSize: 12, marginTop: 8, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(lastExecution.nodeLogs, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Right config panel */}
      {selectedNode && selectedTypeDef && (
        <NodeConfigPanel
          node={selectedNode as any}
          schema={selectedTypeDef.paramsSchema}
          onChange={updateNodeParams}
          onClose={() => setSelectedNodeId(null)}
          onDelete={deleteNode}
        />
      )}
    </div>
  );
}
