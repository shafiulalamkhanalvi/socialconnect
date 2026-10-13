const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken(): string | null {
  return localStorage.getItem("flowai_token");
}

export function setToken(token: string) {
  localStorage.setItem("flowai_token", token);
}

export function clearToken() {
  localStorage.removeItem("flowai_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (data: { email: string; password: string; name?: string; organizationName: string }) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  listWorkflows: () => request("/api/workflows"),
  getWorkflow: (id: string) => request(`/api/workflows/${id}`),
  createWorkflow: (data: { name: string; definition: any }) =>
    request("/api/workflows", { method: "POST", body: JSON.stringify(data) }),
  updateWorkflow: (id: string, data: any) =>
    request(`/api/workflows/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWorkflow: (id: string) => request(`/api/workflows/${id}`, { method: "DELETE" }),
  runWorkflow: (id: string, input: any = {}) =>
    request(`/api/workflows/${id}/run`, { method: "POST", body: JSON.stringify({ input }) }),
  getNodeTypes: () => request("/api/workflows/node-types"),

  listExecutions: (workflowId?: string) =>
    request(`/api/executions${workflowId ? `?workflowId=${workflowId}` : ""}`),
  getExecution: (id: string) => request(`/api/executions/${id}`),

  listCredentials: () => request("/api/credentials"),
  createCredential: (data: { name: string; type: string; data: Record<string, any> }) =>
    request("/api/credentials", { method: "POST", body: JSON.stringify(data) }),
  deleteCredential: (id: string) => request(`/api/credentials/${id}`, { method: "DELETE" }),
};
