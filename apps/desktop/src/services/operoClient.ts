import type {
  AgentCapabilitiesSettings,
  AgentChatResponse,
  AgentThread,
  AnalyzedDocument,
  AudioCaptureCapabilities,
  DashboardAnalytics,
  DocumentAnnotation,
  DualCoreMemoryStats,
  ExportFormat,
  FirstClassLocale,
  HardwareProfile,
  Manual,
  MeetingAudioSource,
  MeetingNoteRecord,
  MemoryChunk,
  MemorySearchHit,
  ModelPullJobStatus,
  OllamaRuntimeStatus,
  OperoPersonality,
  OsPermissionSnapshot,
  PendingAgentAction,
  PermissionSurface,
  Project,
  RecordingSession,
  RegionExplanation,
  UpdateCheckResult,
  UpdateInstallResult,
  UserProfile,
} from '@opero/shared-types';

const DAEMON_PORT = (import.meta.env?.VITE_OPERO_DAEMON_PORT as string | undefined) || '4317';
const DAEMON_BASE = `http://127.0.0.1:${DAEMON_PORT}/api/v1`;

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

  deleteProject: (projectId: string) =>
    fetchLocal<{ deleted: boolean }>(`/projects/${projectId}`, { method: 'DELETE' }),

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
    fetchLocal<{ manual: Manual; processingTimeMs?: number }>(`/sessions/${sessionId}/generate`, {
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

  getProfile: () => fetchLocal<{ profile: UserProfile }>('/profile'),

  saveProfile: (payload: {
    name: string;
    occupation: string;
    personality: OperoPersonality;
    defaultLocale: FirstClassLocale;
    soundEnabled: boolean;
    onboardingCompleted: boolean;
    peroCapColor?: string;
    peroJacketColor?: string;
  }) => fetchLocal<{ profile: UserProfile }>('/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  getAnalytics: () => fetchLocal<{ analytics: DashboardAnalytics }>('/analytics'),

  createManualFromTemplate: (payload: {
    projectId?: string;
    templateId: string;
    title?: string;
    sourceLocale: FirstClassLocale;
  }) =>
    fetchLocal<{ manual: Manual }>('/manuals/from-template', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  checkForUpdates: () => fetchLocal<{ update: UpdateCheckResult }>('/updates/check', undefined, 8000),

  installUpdate: (assetDownloadUrl: string, expectedSha256?: string | null) =>
    fetchLocal<{ result: UpdateInstallResult }>(
      '/updates/install',
      { method: 'POST', body: JSON.stringify({ assetDownloadUrl, expectedSha256 }) },
      180000,
    ),

  listAnalyzedDocs: () => fetchLocal<{ documents: AnalyzedDocument[] }>('/analyzer/documents'),

  deleteAnalyzedDoc: (docId: string) =>
    fetchLocal<{ deleted: boolean }>(`/analyzer/documents/${encodeURIComponent(docId)}`, {
      method: 'DELETE',
    }),

  reanalyzeDocument: (docId: string, payload: { locale: FirstClassLocale; preferredModel?: string }) =>
    fetchLocal<{ document: AnalyzedDocument }>(
      `/analyzer/documents/${encodeURIComponent(docId)}/reanalyze`,
      { method: 'POST', body: JSON.stringify(payload) },
      65000,
    ),

  askAboutDocument: (docId: string, payload: { question: string; locale: FirstClassLocale; preferredModel?: string }) =>
    fetchLocal<{ answer: string; engineUsed: string }>(
      `/analyzer/documents/${encodeURIComponent(docId)}/ask`,
      { method: 'POST', body: JSON.stringify(payload) },
      65000,
    ),

  getDocumentFileUrl: (docId: string) => `${DAEMON_BASE}/analyzer/documents/${encodeURIComponent(docId)}/file`,

  ingestDocument: (payload: {
    filename: string;
    contentBase64?: string;
    rawText?: string;
    locale: FirstClassLocale;
    preferredModel?: string;
  }) =>
    fetchLocal<{ document: AnalyzedDocument }>(
      '/analyzer/ingest',
      { method: 'POST', body: JSON.stringify(payload) },
      65000,
    ),

  explainRegion: (payload: {
    excerpt: string;
    contextTitle?: string;
    kind?: string;
    locale: FirstClassLocale;
    preferredModel?: string;
  }) =>
    fetchLocal<{ explanation: RegionExplanation }>(
      '/analyzer/explain-region',
      { method: 'POST', body: JSON.stringify(payload) },
      20000,
    ),

  saveDocumentAnnotations: (docId: string, annotations: DocumentAnnotation[]) =>
    fetchLocal<{ document: AnalyzedDocument }>(`/analyzer/documents/${docId}/annotations`, {
      method: 'PUT',
      body: JSON.stringify({ annotations }),
    }),

  compileDocumentReport: (
    docId: string,
    payload: { projectId?: string; locale: FirstClassLocale; exportFormat?: ExportFormat },
  ) =>
    fetchLocal<{
      manual: Manual;
      artifact: { format: string; locale: string; filePath: string; sha256: string; byteSize: number } | null;
    }>(`/analyzer/documents/${docId}/report`, { method: 'POST', body: JSON.stringify(payload) }, 15000),

  getHardwareProfile: () => fetchLocal<{ hardware: HardwareProfile }>('/system/hardware'),

  pullModel: (modelTag: string) =>
    fetchLocal<{ hardware: HardwareProfile }>(
      '/models/pull',
      { method: 'POST', body: JSON.stringify({ modelTag }) },
      300000,
    ),

  startModelPull: (modelTag: string) =>
    fetchLocal<{ jobId: string; status: ModelPullJobStatus }>(
      '/models/pull-async',
      { method: 'POST', body: JSON.stringify({ modelTag }) },
      15000,
    ),

  getModelPullStatus: (jobId: string) =>
    fetchLocal<{ status: ModelPullJobStatus }>(
      `/models/pull-status/${encodeURIComponent(jobId)}`,
      undefined,
      15000,
    ),

  getActiveModelPull: () =>
    fetchLocal<{ status: ModelPullJobStatus | null }>('/models/pull-active', undefined, 8000),

  deleteModel: (modelTag: string) =>
    fetchLocal<{ hardware: HardwareProfile }>(
      `/models/${encodeURIComponent(modelTag)}`,
      { method: 'DELETE' },
      30000,
    ),

  getModelRuntimeStatus: () =>
    fetchLocal<{ runtime: OllamaRuntimeStatus }>('/models/runtime-status'),

  ensureModelRuntime: (payload: { modelTag?: string; pullIfMissing?: boolean }) =>
    fetchLocal<{ runtime: OllamaRuntimeStatus }>(
      '/models/ensure-runtime',
      { method: 'POST', body: JSON.stringify(payload) },
      180000,
    ),

  listAgentThreads: () => fetchLocal<{ threads: AgentThread[] }>('/agent/threads'),

  sendAgentMessage: (payload: {
    threadId?: string;
    prompt: string;
    locale: FirstClassLocale;
    preferredModel?: string;
  }) =>
    fetchLocal<AgentChatResponse>(
      '/agent/chat',
      { method: 'POST', body: JSON.stringify(payload) },
      80000,
    ),

  deleteAgentThread: (threadId: string) =>
    fetchLocal<{ deleted: boolean }>(`/agent/threads/${threadId}`, { method: 'DELETE' }),

  getAgentSettings: () =>
    fetchLocal<{ settings: AgentCapabilitiesSettings }>('/agent/settings'),

  saveAgentSettings: (settings: AgentCapabilitiesSettings) =>
    fetchLocal<{ settings: AgentCapabilitiesSettings }>('/agent/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  approveAgentAction: (actionId: string) =>
    fetchLocal<{ action: PendingAgentAction }>(`/agent/actions/${actionId}/approve`, {
      method: 'POST',
    }),

  cancelAgentAction: (actionId: string) =>
    fetchLocal<{ action: PendingAgentAction }>(`/agent/actions/${actionId}/cancel`, {
      method: 'POST',
    }),

  getAudioCapabilities: () =>
    fetchLocal<{ capabilities: AudioCaptureCapabilities }>('/meetings/capabilities'),

  listMeetings: () => fetchLocal<{ meetings: MeetingNoteRecord[] }>('/meetings'),

  startMeeting: (payload: {
    title?: string;
    audioSource: MeetingAudioSource;
    sourceLocale: FirstClassLocale;
    targetLocale: FirstClassLocale;
  }) =>
    fetchLocal<{ meeting: MeetingNoteRecord }>('/meetings/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  stopAndCompileMeeting: (
    meetingId: string,
    payload: { transcriptOverride?: string; preferredModel?: string },
  ) =>
    fetchLocal<{ meeting: MeetingNoteRecord }>(
      `/meetings/${meetingId}/stop-compile`,
      { method: 'POST', body: JSON.stringify(payload) },
      30000,
    ),

  exportMeeting: (
    meetingId: string,
    payload: { projectId?: string; exportFormat?: ExportFormat },
  ) =>
    fetchLocal<{
      manual: Manual;
      artifact: { format: string; locale: string; filePath: string; sha256: string; byteSize: number } | null;
    }>(`/meetings/${meetingId}/export`, { method: 'POST', body: JSON.stringify(payload) }, 15000),
};
