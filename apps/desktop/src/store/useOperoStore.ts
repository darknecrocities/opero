import { create } from 'zustand';
import type { RecordingSession, UserProfile } from '@opero/shared-types';
import { playJiggSfx } from '@opero/jiggicons';
import { operoClient } from '../services/operoClient';
import {
  DEFAULT_ANALYTICS,
  DEFAULT_MEMORY_STATS,
  DEFAULT_MODELS,
  DEFAULT_PROFILE,
  loadCachedProfile,
  saveCachedProfile,
} from './defaults';
import type { ExportHistoryItem, ImpulseSample, OperoStoreState, WorkspaceNavMode } from './types';

export { DEFAULT_MODELS };
export type { ExportHistoryItem, ImpulseSample, OperoStoreState, WorkspaceNavMode };

const cachedInitial = loadCachedProfile();

export const useOperoStore = create<OperoStoreState>((set, get) => ({
  navMode: 'dashboard',
  leftOpen: true,
  rightOpen: true,
  solidFallback: false,
  uiLocale: cachedInitial?.defaultLocale ?? 'en-US',
  targetLocale: cachedInitial?.defaultLocale ?? 'en-US',
  role: 'author',
  speechEnabled: false,
  soundEnabled: cachedInitial?.soundEnabled ?? true,
  activeModelId: 'ollama-qwen3-1.7b',
  hardwareProfile: null,
  peroState: 'ready',
  peroCapColor: cachedInitial?.peroCapColor ?? '#69BCFC',
  peroJacketColor: cachedInitial?.peroJacketColor ?? '#69BCFC',
  daemonOnline: false,
  userProfile: cachedInitial ?? DEFAULT_PROFILE,
  showOnboarding: !(cachedInitial?.onboardingCompleted ?? false),
  analytics: DEFAULT_ANALYTICS,
  projects: [],
  sessions: [],
  activeSessionId: null,
  activeManual: null,
  impulses: [],
  elapsedMs: 0,
  permissions: null,
  memoryStats: DEFAULT_MEMORY_STATS,
  memoryHits: [],
  exportHistory: [],
  quickPromptReply: null,
  lastExportNotice: null,
  statusMessage: null,
  compilingOverlay: null,
  pendingAgentPrompt: null,

  setNavMode: (navMode) => {
    playJiggSfx('nav', get().soundEnabled);
    set({ navMode });
  },
  setCompilingOverlay: (compilingOverlay) => set({ compilingOverlay }),
  openAgentWithPrompt: (prompt) => {
    playJiggSfx('nav', get().soundEnabled);
    set({ navMode: 'agent', pendingAgentPrompt: prompt });
  },
  clearPendingAgentPrompt: () => set({ pendingAgentPrompt: null }),
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  toggleSolidFallback: () => set((s) => ({ solidFallback: !s.solidFallback })),
  toggleSound: () => {
    const next = !get().soundEnabled;
    const p = { ...get().userProfile, soundEnabled: next };
    saveCachedProfile(p);
    set({ soundEnabled: next, userProfile: p });
    if (next) playJiggSfx('click', true);
    if (get().daemonOnline) {
      void operoClient.saveProfile({
        name: p.name,
        occupation: p.occupation,
        personality: p.personality,
        defaultLocale: p.defaultLocale,
        soundEnabled: next,
        onboardingCompleted: p.onboardingCompleted,
        peroCapColor: p.peroCapColor,
        peroJacketColor: p.peroJacketColor,
      });
    }
  },
  setUiLocale: (uiLocale) => {
    const p = { ...get().userProfile, defaultLocale: uiLocale };
    saveCachedProfile(p);
    set({ uiLocale, targetLocale: uiLocale, userProfile: p });
  },
  setTargetLocale: (targetLocale) => set({ targetLocale }),
  setRole: (role) => set({ role }),
  setSpeechEnabled: (speechEnabled) => set({ speechEnabled }),
  setActiveModelId: (activeModelId) => set({ activeModelId }),
  setHardwareProfile: (hardwareProfile) => set({ hardwareProfile }),
  setPeroOutfit: (peroCapColor, peroJacketColor) => set({ peroCapColor, peroJacketColor }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  openManualInStudio: (activeManual) => set({ activeManual, navMode: 'studio', peroState: 'verified-draft' }),
  tickTimer: (deltaMs) => set((s) => ({ elapsedMs: s.elapsedMs + deltaMs })),

  bootstrap: async () => {
    try {
      const [h, pRes, sRes, mRes, profRes, anRes, hwRes] = await Promise.all([
        operoClient.health(),
        operoClient.listProjects(),
        operoClient.listSessions(),
        operoClient.searchMemory('Save Inventory', 'en-US', 5),
        operoClient.getProfile(),
        operoClient.getAnalytics(),
        operoClient.getHardwareProfile().catch(() => ({ hardware: null })),
      ]);
      let projects = pRes.projects;
      if (projects.length === 0) {
        const created = await operoClient.createProject({
          title: 'OPERO Workspace',
          owner: profRes.profile.name || 'MMI Operator',
          department: 'Operations',
          defaultLocale: profRes.profile.defaultLocale,
        });
        projects = [created.project];
      }
      saveCachedProfile(profRes.profile);
      set({
        daemonOnline: true,
        permissions: h.permissions,
        memoryStats: h.memory,
        memoryHits: mRes.hits,
        userProfile: profRes.profile,
        showOnboarding: !profRes.profile.onboardingCompleted,
        uiLocale: profRes.profile.defaultLocale,
        targetLocale: profRes.profile.defaultLocale,
        soundEnabled: profRes.profile.soundEnabled,
        peroCapColor: profRes.profile.peroCapColor,
        peroJacketColor: profRes.profile.peroJacketColor,
        analytics: anRes.analytics,
        hardwareProfile: hwRes.hardware,
        projects,
        sessions: sRes.sessions,
        activeSessionId: sRes.sessions[0]?.id ?? null,
      });
    } catch {
      set({ daemonOnline: false });
    }
  },

  refreshAnalytics: async () => {
    if (!get().daemonOnline) return;
    try {
      const { analytics } = await operoClient.getAnalytics();
      set({ analytics });
    } catch {
      // Non-fatal
    }
  },

  saveOnboardingProfile: async (input) => {
    const state = get();
    const soundEnabled = input.soundEnabled ?? state.soundEnabled;
    const onboardingCompleted = input.onboardingCompleted ?? true;
    const nextLocal: UserProfile = {
      ...state.userProfile,
      name: input.name.trim(),
      occupation: input.occupation.trim(),
      personality: input.personality,
      defaultLocale: input.defaultLocale,
      soundEnabled,
      onboardingCompleted,
      updatedAt: new Date().toISOString(),
    };
    if (state.daemonOnline) {
      const { profile } = await operoClient.saveProfile({
        name: nextLocal.name,
        occupation: nextLocal.occupation,
        personality: nextLocal.personality,
        defaultLocale: nextLocal.defaultLocale,
        soundEnabled: nextLocal.soundEnabled,
        onboardingCompleted: nextLocal.onboardingCompleted,
        peroCapColor: state.peroCapColor,
        peroJacketColor: state.peroJacketColor,
      });
      saveCachedProfile(profile);
      set({
        userProfile: profile,
        uiLocale: profile.defaultLocale,
        targetLocale: profile.defaultLocale,
        soundEnabled: profile.soundEnabled,
        showOnboarding: !profile.onboardingCompleted,
        navMode: 'dashboard',
        peroState: 'ready',
      });
    } else {
      saveCachedProfile(nextLocal);
      set({
        userProfile: nextLocal,
        uiLocale: nextLocal.defaultLocale,
        targetLocale: nextLocal.defaultLocale,
        soundEnabled: nextLocal.soundEnabled,
        showOnboarding: !nextLocal.onboardingCompleted,
        navMode: 'dashboard',
      });
    }
    playJiggSfx('success', soundEnabled);
  },

  replayOnboarding: () => {
    playJiggSfx('nav', get().soundEnabled);
    set({ showOnboarding: true });
  },

  createManualFromTemplate: async (templateId, title) => {
    const state = get();
    const projectId = state.projects[0]?.id;
    if (state.daemonOnline) {
      const { manual } = await operoClient.createManualFromTemplate({
        projectId,
        templateId,
        title,
        sourceLocale: state.targetLocale,
      });
      set({ activeManual: manual, navMode: 'studio', peroState: 'verified-draft' });
      void get().refreshAnalytics();
      playJiggSfx('success', state.soundEnabled);
      return manual;
    }
    return null;
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
        navMode: 'capture',
        peroState: 'recording',
        elapsedMs: 0,
        impulses: [],
      }));
      void get().refreshAnalytics();
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
        navMode: 'capture',
        peroState: 'recording',
        elapsedMs: 0,
        impulses: [],
      }));
    }
    playJiggSfx('step', state.soundEnabled);
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
    playJiggSfx('click', state.soundEnabled);
  },

  snapWorkflowAction: async (label, windowTitle = 'MMI Inventory Portal') => {
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
    void get().refreshAnalytics();
    playJiggSfx('step', state.soundEnabled);
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
        void get().refreshAnalytics();
        playJiggSfx('success', state.soundEnabled);
        return;
      }
    }
    set((s) => ({
      peroState: 'ready',
      sessions: s.sessions.map((item) => (item.id === active.id ? { ...item, status: 'completed' } : item)),
    }));
    void get().refreshAnalytics();
  },

  verifyStep: (stepId) =>
    set((s) => {
      if (!s.activeManual) return s;
      const steps = s.activeManual.steps.map((st) =>
        st.id === stepId ? { ...st, reviewStatus: 'verified' as const } : st,
      );
      return {
        activeManual: { ...s.activeManual, steps },
        peroState: steps.every((st) => st.reviewStatus === 'verified') ? 'verified-draft' : s.peroState,
      };
    }),

  updateStepText: (stepId, locale, title, body) =>
    set((s) => {
      if (!s.activeManual) return s;
      const steps = s.activeManual.steps.map((st) => {
        if (st.id !== stepId) return st;
        const existing = st.variants[locale];
        return { ...st, variants: { ...st.variants, [locale]: { ...existing, title, body } } };
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
        ? `Grounded on ${hits.length} memory chunk(s): ${hits.map((h) => h.chunk.title).join(' · ')}`
        : 'Indexed query context locally.';
      set({ memoryHits: hits, memoryStats: stats, quickPromptReply: summary, peroState: 'ready' });
    } else {
      set({ quickPromptReply: `Offline prompt ready for "${prompt}".`, peroState: 'ready' });
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
    set({ statusMessage: `Opened OS Privacy Settings (${openedUri})` });
  },

  runExport: async (format, manualOverride) => {
    const state = get();
    const target = manualOverride ?? state.activeManual;
    if (!target) {
      set({ lastExportNotice: 'Select or create a manual before exporting.' });
      return;
    }
    if (state.daemonOnline) {
      const { artifact } = await operoClient.exportManual(target, format, state.targetLocale);
      const entry: ExportHistoryItem = {
        id: `exp_${Date.now()}`,
        format,
        locale: state.targetLocale,
        title: target.title,
        byteSize: artifact.byteSize,
        sha256: artifact.sha256,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        peroState: 'exported',
        exportHistory: [entry, ...s.exportHistory].slice(0, 20),
        lastExportNotice: `Exported ${artifact.format.toUpperCase()} (${artifact.byteSize} B)`,
      }));
      playJiggSfx('success', state.soundEnabled);
    }
  },
}));
