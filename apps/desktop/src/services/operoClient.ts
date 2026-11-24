import type {
  DualCoreMemoryStats,
  ExportFormat,
  FirstClassLocale,
  Manual,
  MemoryChunk,
  MemorySearchHit,
  OsPermissionSnapshot,
  PermissionSurface,
  Project,
  RecordingSession,
} from '@opero/shared-types';

const DAEMON_BASE = 'http://127.0.0.1:4317/api/v1';

async function fetchLocal<T>(path: string, init?: RequestInit, timeoutMs = 4000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${DAEMON_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OPERO daemon ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const operoClient = {
  health: () =>
    fetchLocal<{ status: string; offlineStrict: boolean; memory: DualCoreMemoryStats; permissions: OsPermissionSnapshot }>('/health'),

  listProjects: () => fetchLocal<{ projects: Project[] }>('/projects'),

  createProject: (payload: { title: string; owner: string; department: string; defaultLocale: FirstClassLocale }) =>
    fetchLocal<{ project: Project }>('/projects', { method: 'POST', body: JSON.stringify(payload) }),

  listSessions: () => fetchLocal<{ sessions: RecordingSession[] }>('/sessions'),

  startSession: (payload: { projectId: string; title: string; profile?: string; consentAcknowledged: boolean }) =>
    fetchLocal<{ session: RecordingSession }>('/sessions', { method: 'POST', body: JSON.stringify(payload) }),

  updateSessionStatus: (sessionId: string, status: string, activeDurationMs?: number) =>
    fetchLocal<{ ok: boolean }>(`/sessions/${sessionId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, activeDurationMs }),
    }),

  recordEvent: (
    sessionId: string,
    payload: {
      eventType: string;
      process: string;
      windowTitle: string;
      x: number;
      y: number;
      displayScale?: number;
      targetRole: string;
      targetLabel: string;
      allowNativeScreen?: boolean;
    },
  ) =>
    fetchLocal<{ captured: boolean; result: unknown }>(`/sessions/${sessionId}/events`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateManual: (sessionId: string, templateId: string, sourceLocale: FirstClassLocale) =>
    fetchLocal<{ manual: Manual }>(`/sessions/${sessionId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ templateId, sourceLocale }),
    }),

  getPermissions: () => fetchLocal<{ permissions: OsPermissionSnapshot }>('/permissions/status'),

  requestPermission: (surface: PermissionSurface) =>
    fetchLocal<{ permissions: OsPermissionSnapshot }>('/permissions/request', {
      method: 'POST',
      body: JSON.stringify({ surface }),
    }),

  openPermissionSettings: (surface: PermissionSurface) =>
    fetchLocal<{ openedUri: string }>('/permissions/open-settings', {
      method: 'POST',
      body: JSON.stringify({ surface }),
    }),

  searchMemory: (q: string, locale?: FirstClassLocale, k = 6) =>
    fetchLocal<{ hits: MemorySearchHit[]; stats: DualCoreMemoryStats }>(
      `/memory?q=${encodeURIComponent(q)}&k=${k}${locale ? `&locale=${encodeURIComponent(locale)}` : ''}`,
    ),

  addMemory: (payload: {
    coreType: 'episodic' | 'semantic';
    projectId?: string | null;
    sourceType: string;
    sourceId: string;
    locale: FirstClassLocale;
    title: string;
    content: string;
    pinned?: boolean;
  }) =>
    fetchLocal<{ chunk: MemoryChunk }>('/memory', { method: 'POST', body: JSON.stringify(payload) }),

  deleteMemory: (id: string) => fetchLocal<{ deleted: boolean }>(`/memory/${id}`, { method: 'DELETE' }),

  exportManual: (manual: Manual, format: ExportFormat, locale: FirstClassLocale) =>
    fetchLocal<{ artifact: { format: string; locale: string; filePath: string; sha256: string; byteSize: number; isDraftWatermarked: boolean } }>(
      '/exports',
      { method: 'POST', body: JSON.stringify({ manual, format, locale }) },
      15000,
    ),
};
