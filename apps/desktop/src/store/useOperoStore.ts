import { create } from 'zustand';
import type {
  AnnotationOverlay,
  DualCoreMemoryStats,
  ExportFormat,
  FirstClassLocale,
  Manual,
  MemorySearchHit,
  ModelProfile,
  OperatorRole,
  OsPermissionSnapshot,
  PermissionSurface,
  Project,
  RecordingSession,
} from '@opero/shared-types';
import type { OperoAppState } from '@opero/mascot';
import { operoClient } from '../services/operoClient';

export type WorkspaceNavMode = 'capture' | 'studio' | 'router' | 'outputs' | 'library' | 'memory';

export const DEFAULT_MODELS: readonly ModelProfile[] = [
  {
    id: 'ollama-qwen3-4b',
    runtime: 'ollama',
    modelName: 'qwen3:4b-instruct-q4_K_M',
    revision: 'q4_K_M',
    quantization: '4-bit',
    ramTierGb: 16,
    licenseRef: 'Apache-2.0',
    capabilities: ['draft', 'summarize', 'translate'],
    active: true,
  },
  {
    id: 'ollama-gemma3-4b',
    runtime: 'ollama',
    modelName: 'gemma3:4b-it-qat',
    revision: 'qat',
    quantization: '4-bit',
    ramTierGb: 16,
    licenseRef: 'Gemma Terms',
    capabilities: ['draft', 'translate', 'vision'],
    active: false,
  },
  {
    id: 'apple-metal-local',
    runtime: 'apple_metal',
    modelName: 'Apple Silicon On-Device (MLX)',
    revision: 'metal-fp16',
    quantization: '4-bit',
    ramTierGb: 16,
    licenseRef: 'Local Hardware',
    capabilities: ['draft', 'summarize'],
    active: false,
  },
  {
    id: 'offline-deterministic',
    runtime: 'offline_deterministic',
    modelName: 'Offline Evidence + OCR Engine',
    revision: 'v1.0.0',
    quantization: 'Zero-Weight',
    ramTierGb: 8,
    licenseRef: 'MIT',
    capabilities: ['draft', 'summarize', 'translate'],
    active: false,
  },
];

export interface ImpulseSample {
  seq: number;
  label: string;
  eventType: string;
  timestamp: string;
  intensity: number;
}

interface OperoStoreState {
  navMode: WorkspaceNavMode;
  leftOpen: boolean;
  rightOpen: boolean;
  solidFallback: boolean;
  uiLocale: FirstClassLocale;
  targetLocale: FirstClassLocale;
  role: OperatorRole;
  speechEnabled: boolean;
  activeModelId: string;
  peroState: OperoAppState;
  peroCapColor: string;
  peroJacketColor: string;
  daemonOnline: boolean;
  projects: Project[];
  sessions: RecordingSession[];
  activeSessionId: string | null;
  activeManual: Manual | null;
  impulses: ImpulseSample[];
  elapsedMs: number;
  permissions: OsPermissionSnapshot | null;
  memoryStats: DualCoreMemoryStats;
  memoryHits: MemorySearchHit[];
  quickPromptReply: string | null;
  lastExportNotice: string | null;
  statusMessage: string | null;

  setNavMode: (mode: WorkspaceNavMode) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleSolidFallback: () => void;
  setUiLocale: (locale: FirstClassLocale) => void;
  setTargetLocale: (locale: FirstClassLocale) => void;
  setRole: (role: OperatorRole) => void;
  setSpeechEnabled: (enabled: boolean) => void;
  setActiveModelId: (id: string) => void;
  setPeroOutfit: (cap: string, jacket: string) => void;
  setActiveSessionId: (id: string | null) => void;
  tickTimer: (deltaMs: number) => void;

  bootstrap: () => Promise<void>;
  startRecordingFlow: (title: string) => Promise<void>;
  pauseOrResumeFlow: () => Promise<void>;
  stopAndDraftFlow: () => Promise<void>;
  snapWorkflowAction: (label: string, windowTitle?: string) => Promise<void>;
  verifyStep: (stepId: string) => void;
  updateStepText: (stepId: string, locale: FirstClassLocale, title: string, body: string) => void;
  addAnnotation: (stepId: string, overlay: AnnotationOverlay) => void;
  runQuickPrompt: (prompt: string) => Promise<void>;
  requestOsPermission: (surface: PermissionSurface) => Promise<void>;
  openOsSettings: (surface: PermissionSurface) => Promise<void>;
  runExport: (format: ExportFormat) => Promise<void>;
}

export const useOperoStore = create<OperoStoreState>((set, get) => ({
  navMode: 'capture',
  leftOpen: true,
  rightOpen: true,
  solidFallback: false,
  uiLocale: 'en-US',
  targetLocale: 'en-US',
  role: 'author',
  speechEnabled: false,
  activeModelId: 'ollama-qwen3-4b',
  peroState: 'ready',
  peroCapColor: '#69BCFC',
  peroJacketColor: '#69BCFC',
  daemonOnline: false,
  projects: [],
  sessions: [],
  activeSessionId: null,
  activeManual: null,
  impulses: [],
  elapsedMs: 0,
  permissions: null,
  memoryStats: {
    episodicCount: 0,
    semanticCount: 6,
    vectorCount: 6,
    embeddingModel: 'opero-rust-trigram-384-i8',
    embeddingDims: 384,
    estimatedRamBytes: 2688,
    sqliteWalBytes: 49152,
  },
  memoryHits: [],
  quickPromptReply: null,
  lastExportNotice: null,
  statusMessage: null,

  setNavMode: (navMode) => set({ navMode }),
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  toggleSolidFallback: () => set((s) => ({ solidFallback: !s.solidFallback })),
  setUiLocale: (uiLocale) => set({ uiLocale }),
  setTargetLocale: (targetLocale) => set({ targetLocale }),
  setRole: (role) => set({ role }),
  setSpeechEnabled: (speechEnabled) => set({ speechEnabled }),
  setActiveModelId: (activeModelId) => set({ activeModelId }),
  setPeroOutfit: (peroCapColor, peroJacketColor) => set({ peroCapColor, peroJacketColor }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  tickTimer: (deltaMs) => set((s) => ({ elapsedMs: s.elapsedMs + deltaMs })),

  bootstrap: async () => {
    try {
      const [h, pRes, sRes, mRes] = await Promise.all([
        operoClient.health(),
        operoClient.listProjects(),
        operoClient.listSessions(),
        operoClient.searchMemory('Save Inventory', 'en-US', 5),
      ]);
      let projects = pRes.projects;
      if (projects.length === 0) {
        const created = await operoClient.createProject({
          title: 'MMI Inventory Operations',
          owner: 'MMI Operations Author',
          department: 'Operations',
          defaultLocale: 'en-US',
        });
        projects = [created.project];
      }
      set({
        daemonOnline: true,
        permissions: h.permissions,
        memoryStats: h.memory,
        memoryHits: mRes.hits,
        projects,
        sessions: sRes.sessions,
        activeSessionId: sRes.sessions[0]?.id ?? null,
      });
    } catch {
      set({
        daemonOnline: false,
        statusMessage: 'Local Rust daemon (127.0.0.1:4317) standby — start opero-daemon for SQLite persistence.',
      });
    }
  },

  startRecordingFlow: async (title) => {
    const state = get();
    const projectId = state.projects[0]?.id ?? 'proj_local';
    if (state.daemonOnline) {
      const { session } = await operoClient.startSession({
        projectId,
        title,
        profile: 'standard',
        consentAcknowledged: true,
      });
      set((s) => ({
        sessions: [session, ...s.sessions],
        activeSessionId: session.id,
        peroState: 'recording',
        elapsedMs: 0,
        impulses: [],
        statusMessage: `Recording active: ${session.title}`,
      }));
    } else {
      const localSess: RecordingSession = {
        id: `sess_${Date.now()}`,
        projectId,
        title,
        startedAt: new Date().toISOString(),
        endedAt: null,
        activeDurationMs: 0,
        status: 'recording',
        captureProfile: 'standard',
        appVersion: '1.0.0',
        consentAcknowledgedAt: new Date().toISOString(),
        eventCount: 0,
        screenshotCount: 0,
      };
      set((s) => ({
        sessions: [localSess, ...s.sessions],
        activeSessionId: localSess.id,
        peroState: 'recording',
        elapsedMs: 0,
        impulses: [],
      }));
    }
  },

  pauseOrResumeFlow: async () => {
    const state = get();
    const active = state.sessions.find((s) => s.id === state.activeSessionId);
    if (!active) return;
    const nextStatus = active.status === 'recording' ? 'paused' : 'recording';
    if (state.daemonOnline) {
      await operoClient.updateSessionStatus(active.id, nextStatus, state.elapsedMs);
    }
    set((s) => ({
      peroState: nextStatus === 'paused' ? 'paused' : 'recording',
      sessions: s.sessions.map((item) => (item.id === active.id ? { ...item, status: nextStatus } : item)),
    }));
  },

  snapWorkflowAction: async (label, windowTitle = 'MMI Inventory Portal (在庫管理)') => {
    const state = get();
    const active = state.sessions.find((s) => s.id === state.activeSessionId);
    if (!active || active.status !== 'recording') return;
    set({ peroState: 'capturing' });
    if (state.daemonOnline) {
      await operoClient.recordEvent(active.id, {
        eventType: 'click',
        process: 'MMI Portal',
        windowTitle,
        x: 420 + state.impulses.length * 48,
        y: 210 + state.impulses.length * 36,
        displayScale: 2.0,
        targetRole: 'AXButton',
        targetLabel: label,
        allowNativeScreen: false,
      });
    }
    set((s) => {
      const seq = s.impulses.length + 1;
      return {
        impulses: [
          ...s.impulses,
          {
            seq,
            label,
            eventType: 'click',
            timestamp: new Date().toISOString().slice(11, 19),
            intensity: 0.45 + ((seq * 19) % 55) / 100,
          },
        ],
        sessions: s.sessions.map((item) =>
          item.id === active.id
            ? { ...item, eventCount: item.eventCount + 1, screenshotCount: item.screenshotCount + 1 }
            : item,
        ),
        peroState: 'recording',
      };
    });
  },

  stopAndDraftFlow: async () => {
    const state = get();
    const active = state.sessions.find((s) => s.id === state.activeSessionId);
    if (!active) return;
    set({ peroState: 'processing' });
    if (state.daemonOnline) {
      await operoClient.updateSessionStatus(active.id, 'completed', state.elapsedMs);
      if (state.impulses.length > 0) {
        const { manual } = await operoClient.generateManual(active.id, 'sop', state.targetLocale);
        const mem = await operoClient.searchMemory(manual.title, state.targetLocale, 5);
        set((s) => ({
          activeManual: manual,
          memoryHits: mem.hits,
          memoryStats: mem.stats,
          peroState: manual.steps.some((st) => st.reviewStatus === 'needs_review') ? 'needs-review' : 'verified-draft',
          sessions: s.sessions.map((item) => (item.id === active.id ? { ...item, status: 'completed' } : item)),
        }));
        return;
      }
    }
    set((s) => ({
      peroState: 'ready',
      sessions: s.sessions.map((item) => (item.id === active.id ? { ...item, status: 'completed' } : item)),
    }));
  },

  verifyStep: (stepId) =>
    set((s) => {
      if (!s.activeManual) return s;
      const steps = s.activeManual.steps.map((st) =>
        st.id === stepId ? { ...st, reviewStatus: 'verified' as const } : st,
      );
      const allVerified = steps.every((st) => st.reviewStatus === 'verified');
      return {
        activeManual: { ...s.activeManual, steps },
        peroState: allVerified ? 'verified-draft' : s.peroState,
      };
    }),

  updateStepText: (stepId, locale, title, body) =>
    set((s) => {
      if (!s.activeManual) return s;
      const steps = s.activeManual.steps.map((st) => {
        if (st.id !== stepId) return st;
        const existing = st.variants[locale];
        return {
          ...st,
          variants: {
            ...st.variants,
            [locale]: { ...existing, title, body },
          },
        };
      });
      return { activeManual: { ...s.activeManual, steps } };
    }),

  addAnnotation: (stepId, overlay) =>
    set((s) => {
      if (!s.activeManual) return s;
      const steps = s.activeManual.steps.map((st) =>
        st.id === stepId ? { ...st, annotations: [...st.annotations, overlay] } : st,
      );
      return { activeManual: { ...s.activeManual, steps } };
    }),

  runQuickPrompt: async (prompt) => {
    const state = get();
    set({ peroState: 'processing' });
    if (state.daemonOnline) {
      const { hits, stats } = await operoClient.searchMemory(prompt, state.targetLocale, 5);
      const summary = hits.length
        ? `Dual-Core RAG grounded on ${hits.length} local memory chunk(s): ${hits.map((h) => `[${h.chunk.coreType}] ${h.chunk.title}`).join(' · ')}`
        : 'No prior memory chunks matched; indexed query context locally.';
      set({
        memoryHits: hits,
        memoryStats: stats,
        quickPromptReply: summary,
        peroState: 'ready',
      });
    } else {
      set({
        quickPromptReply: `Offline Quick Prompt ready for "${prompt}" (connect local Rust daemon for SQLite RAG).`,
        peroState: 'ready',
      });
    }
  },

  requestOsPermission: async (surface) => {
    if (!get().daemonOnline) return;
    const { permissions } = await operoClient.requestPermission(surface);
    set({ permissions, peroState: 'privacy' });
  },

  openOsSettings: async (surface) => {
    if (!get().daemonOnline) return;
    const { openedUri } = await operoClient.openPermissionSettings(surface);
    set({ statusMessage: `Opened native OS Privacy Settings (${openedUri})` });
  },

  runExport: async (format) => {
    const state = get();
    if (!state.activeManual) {
      set({ lastExportNotice: 'Record or select a manual with at least one step before exporting.' });
      return;
    }
    if (state.daemonOnline) {
      const { artifact } = await operoClient.exportManual(state.activeManual, format, state.targetLocale);
      set({
        peroState: 'exported',
        lastExportNotice: `Exported ${artifact.format.toUpperCase()} (${artifact.byteSize} bytes · SHA-256 ${artifact.sha256.slice(0, 12)})`,
      });
    }
  },
}));
