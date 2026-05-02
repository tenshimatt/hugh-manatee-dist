// Server-side API client for the Automagic Express backend.
// Do NOT import this from client components — uses server-only env vars.

const API_URL = process.env.AUTOMAGIC_API_URL || "http://127.0.0.1:3100";

export type Stats = {
  counts: {
    transcriptions: number;
    issues: number;
    projects: number;
    links: number;
  };
  pipeline: {
    stats: { total: number; success: number; error: number; running: number };
    lastExecution: {
      id: string;
      workflowId: string;
      startedAt: string;
      stoppedAt: string | null;
      finished: number;
      status: string;
    } | null;
    workflows: Array<{
      workflowId: string;
      workflowName: string;
      success: number;
      error: number;
      total: number;
    }>;
  };
  recent: {
    transcriptions: Array<{
      id: number;
      filepath: string;
      title: string;
      date: string;
      time: string;
      project_folder: string | null;
      classification: string | null;
    }>;
    issues: Array<{
      id: string;
      project_id: string;
      name: string;
      state_name: string;
      state_group: string;
      priority: string | null;
      created_at: string;
      project_name: string | null;
      project_identifier: string | null;
    }>;
  };
  distributions: {
    projects: Array<{ project_folder: string; cnt: number }>;
    classifications: Array<{ classification: string; cnt: number }>;
    tags?: Array<{ tag: string; cnt: number }>;
  };
};

export type Transcription = {
  id: number;
  filepath: string;
  title: string;
  date: string;
  time: string;
  duration_mins: number | null;
  tags: string | null;
  project_folder: string | null;
  classification: string | null;
  executive_summary: string | null;
  file_size_bytes: number;
};

export type TranscriptionList = {
  total: number;
  page: number;
  limit: number;
  results: Transcription[];
};

export type PlaneProject = {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  total_issues: number;
  transcription_count: number;
};

export type PlaneIssue = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  state_name: string;
  state_group: string;
  priority: string | null;
  sequence_id: number;
  created_at: string;
  updated_at: string;
};

export type PipelineResponse = {
  executions: Array<{
    id: string;
    workflowId: string;
    workflowName: string;
    startedAt: string;
    stoppedAt: string | null;
    status: string;
    mode: string;
  }>;
  stats: { total: number; success: number; error: number; running: number };
  breakdown: Array<{
    workflowId: string;
    workflowName: string;
    success: number;
    error: number;
    total: number;
  }>;
};

export type Filters = {
  projects: string[];
  tags: string[];
  classifications: string[];
  dateRange: { min_date: string | null; max_date: string | null };
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  stats: (hours = 24) => apiFetch<Stats>(`/api/stats?hours=${hours}`),
  transcriptions: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    return apiFetch<TranscriptionList>(`/api/transcriptions?${qs.toString()}`);
  },
  transcription: (id: string | number) =>
    apiFetch<Transcription & { linked_issues: PlaneIssue[] }>(`/api/transcriptions/${id}`),
  projects: () => apiFetch<PlaneProject[]>(`/api/projects`),
  project: (id: string) =>
    apiFetch<{
      project: PlaneProject;
      issues: PlaneIssue[];
      transcriptions: Transcription[];
      links: Array<{ transcription_id: number; issue_id: string; confidence: number }>;
    }>(`/api/projects/${id}`),
  pipeline: async (limit = 50) => {
    type RawExec = {
      id: number | string;
      workflow_id?: string;
      workflowId?: string;
      workflow_name?: string;
      workflowName?: string;
      started_at?: string;
      startedAt?: string;
      finished_at?: string | null;
      stoppedAt?: string | null;
      status: string;
      mode?: string;
    };
    const raw = await apiFetch<{
      executions: RawExec[];
      stats: PipelineResponse["stats"];
      breakdown: Array<{
        workflow_id?: string;
        workflowId?: string;
        workflow_name?: string;
        workflowName?: string;
        success: number;
        error: number;
        total: number;
      }>;
    }>(`/api/pipeline?limit=${limit}`);
    if (!raw) return null;
    const normalized: PipelineResponse = {
      stats: raw.stats,
      executions: raw.executions.map((e) => ({
        id: String(e.id),
        workflowId: e.workflowId ?? e.workflow_id ?? "",
        workflowName: e.workflowName ?? e.workflow_name ?? "",
        startedAt: e.startedAt ?? e.started_at ?? "",
        stoppedAt: e.stoppedAt ?? e.finished_at ?? null,
        status: e.status,
        mode: e.mode ?? "",
      })),
      breakdown: (raw.breakdown || []).map((b) => ({
        workflowId: b.workflowId ?? b.workflow_id ?? "",
        workflowName: b.workflowName ?? b.workflow_name ?? "",
        success: b.success,
        error: b.error,
        total: b.total,
      })),
    };
    return normalized;
  },
  filters: () => apiFetch<Filters>(`/api/filters`),
  search: (q: string, params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams({ q });
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    return apiFetch<{
      transcriptions: Array<Transcription & { snippet?: string }>;
      issues: Array<PlaneIssue & { snippet?: string; project_name?: string }>;
    }>(`/api/search?${qs.toString()}`);
  },
};

export type LlmConfig = {
  provider: string | null;
  model: string | null;
};

export const admin = {
  llmConfig: () => apiFetch<LlmConfig>('/api/admin/llm-config'),
  excludedProjects: () => apiFetch<string[]>('/api/admin/excluded-projects'),
  addExcluded: (identifier: string) =>
    apiFetch<string[]>('/api/admin/excluded-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    }),
  removeExcluded: (identifier: string) =>
    apiFetch<string[]>(`/api/admin/excluded-projects/${encodeURIComponent(identifier)}`, { method: 'DELETE' }),
};

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
