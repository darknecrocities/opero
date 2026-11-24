import React, { useState } from 'react';
import { getUiDictionary, PERSONALITY_OPTIONS } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { PeroStateMascot } from '@opero/mascot';
import type { FirstClassLocale, OperoPersonality, PermissionSurface } from '@opero/shared-types';
import { operoClient } from '../../services/operoClient';
import { useOperoStore } from '../../store/useOperoStore';

type SettingsTab = 'profile' | 'language' | 'memory' | 'history' | 'privacy' | 'sound';

export const SettingsView: React.FC = () => {
  const {
    uiLocale,
    targetLocale,
    userProfile,
    soundEnabled,
    solidFallback,
    permissions,
    memoryStats,
    memoryHits,
    sessions,
    exportHistory,
    peroCapColor,
    peroJacketColor,
    setUiLocale,
    setTargetLocale,
    toggleSound,
    toggleSolidFallback,
    saveOnboardingProfile,
    replayOnboarding,
    requestOsPermission,
    openOsSettings,
    runQuickPrompt,
  } = useOperoStore();

  const [tab, setTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState<string>(userProfile.name);
  const [occupation, setOccupation] = useState<string>(userProfile.occupation);
  const [personality, setPersonality] = useState<OperoPersonality>(userProfile.personality);
  const [memQuery, setMemQuery] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const dict = getUiDictionary(uiLocale);

  const tabs: { id: SettingsTab; icon: string; label: string }[] = [
    { id: 'profile', icon: 'user', label: dict.settingsTabProfile },
    { id: 'language', icon: 'translate', label: dict.settingsTabLanguage },
    { id: 'memory', icon: 'memory', label: dict.settingsTabMemory },
    { id: 'history', icon: 'docs', label: dict.settingsTabHistory },
    { id: 'privacy', icon: 'permissions', label: dict.settingsTabPrivacy },
    { id: 'sound', icon: 'voice', label: dict.settingsTabSound },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveOnboardingProfile({
      name: name.trim() || 'MMI Operator',
      occupation: occupation.trim() || 'Operations',
      personality,
      defaultLocale: uiLocale,
      soundEnabled,
      onboardingCompleted: true,
    });
    setSavedNotice('Profile saved');
  };

  const handleDeleteMemory = async (id: string) => {
    await operoClient.deleteMemory(id);
    await runQuickPrompt(memQuery || 'Save');
  };

  const permRows: { surface: PermissionSurface; title: string; state: string; detail: string }[] = [
    {
      surface: 'screen_capture',
      title: 'Screen Recording',
      state: permissions?.screenCapture.state ?? 'not_determined',
      detail: permissions?.screenCapture.guidance ?? 'Enable in System Settings.',
    },
    {
      surface: 'accessibility',
      title: 'Accessibility',
      state: permissions?.accessibility.state ?? 'unknown',
      detail: permissions?.accessibility.guidance ?? 'Enable to capture UI labels.',
    },
    {
      surface: 'microphone',
      title: 'Microphone',
      state: permissions?.microphone.state ?? 'disabled_by_policy',
      detail: permissions?.microphone.guidance ?? 'Opt-in speech only.',
    },
  ];

  return (
    <div
      className="opero-view-enter"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F9FF 100%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>
          {dict.settingsHeading}
        </h1>
        <button type="button" className="opero-btn" onClick={replayOnboarding}>
          <JiggIcon name="play" size={14} variant="duotone" />
          <span>{dict.settingsReplayWelcome}</span>
        </button>
      </div>

      <div role="tablist" aria-label="Settings Sections" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`opero-btn ${tab === t.id ? 'primary' : ''}`}
            onClick={() => {
              playJiggSfx('click', soundEnabled);
              setTab(t.id);
            }}
          >
            <JiggIcon name={t.icon} size={15} variant="duotone" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form
          onSubmit={(e) => void handleSaveProfile(e)}
          className="glass-regular"
          style={{ borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <PeroStateMascot state="ready" size={88} capColor={peroCapColor} jacketColor={peroJacketColor} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700 }}>
                {name || 'MMI Operator'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>{occupation || 'Operations'}</div>
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <span>Occupation</span>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <span>Opero Tone</span>
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value as OperoPersonality)}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF' }}
            >
              {PERSONALITY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label[uiLocale]}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" className="opero-btn primary">
              {dict.settingsSaveProfile}
            </button>
            {savedNotice && <span className="status-pill verified">{savedNotice}</span>}
          </div>
        </form>
      )}

      {tab === 'language' && (
        <section className="glass-regular" style={{ borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <span>App Language</span>
            <select
              aria-label="App Language"
              value={uiLocale}
              onChange={(e) => setUiLocale(e.target.value as FirstClassLocale)}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF' }}
            >
              <option value="en-US">English (en-US)</option>
              <option value="ja-JP">日本語 (ja-JP)</option>
              <option value="fil-PH">Filipino (fil-PH)</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <span>Target Manual Language</span>
            <select
              aria-label="Target Manual Language"
              value={targetLocale}
              onChange={(e) => setTargetLocale(e.target.value as FirstClassLocale)}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF' }}
            >
              <option value="en-US">English (en-US)</option>
              <option value="ja-JP">日本語 (ja-JP)</option>
              <option value="fil-PH">Filipino (fil-PH)</option>
            </select>
          </label>
        </section>
      )}

      {tab === 'memory' && (
        <section className="glass-regular" style={{ borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="mono" style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
            Episodic: {memoryStats.episodicCount} · Semantic: {memoryStats.semanticCount} · {(memoryStats.estimatedRamBytes / 1024).toFixed(1)} KB
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runQuickPrompt(memQuery || 'Save');
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              value={memQuery}
              onChange={(e) => setMemQuery(e.target.value)}
              placeholder="Search memory..."
              style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF' }}
            />
            <button type="submit" className="opero-btn primary">Search</button>
          </form>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
            {memoryHits.map((h) => (
              <div key={h.chunk.id} style={{ padding: '12px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <strong style={{ fontSize: '13px' }}>{h.chunk.title}</strong>
                  <button
                    type="button"
                    className="opero-btn"
                    onClick={() => void handleDeleteMemory(h.chunk.id)}
                    style={{ minHeight: '24px', padding: '2px 7px', fontSize: '11px' }}
                  >
                    Delete
                  </button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--ink-muted)' }}>{h.chunk.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section className="glass-regular" style={{ borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>
            Sessions ({sessions.length}) & Exports ({exportHistory.length})
          </strong>
          {sessions.length === 0 && exportHistory.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>No recorded history yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.slice(0, 8).map((s) => (
                <div key={s.id} style={{ padding: '10px 12px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>{s.title}</span>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{s.status} · {s.eventCount}</span>
                </div>
              ))}
              {exportHistory.map((ex) => (
                <div key={ex.id} style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>{ex.title} ({ex.format.toUpperCase()})</span>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{ex.byteSize} B</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'privacy' && (
        <section className="glass-regular" style={{ borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {permRows.map((row) => (
            <div key={row.surface} style={{ padding: '12px 14px', borderRadius: '14px', background: '#FFFFFF', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{row.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{row.detail}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="status-pill">{row.state}</span>
                <button type="button" className="opero-btn primary" onClick={() => void requestOsPermission(row.surface)}>Request</button>
                <button type="button" className="opero-btn" onClick={() => void openOsSettings(row.surface)}>Open Settings</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'sound' && (
        <section className="glass-regular" style={{ borderRadius: '20px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Navigation Sounds</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Jiggicons subtle tactile clicks</div>
            </div>
            <button type="button" className={`opero-btn ${soundEnabled ? 'primary' : ''}`} onClick={toggleSound}>
              {soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Surface Style</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Liquid Glass or Solid White</div>
            </div>
            <button type="button" className="opero-btn" onClick={toggleSolidFallback}>
              {solidFallback ? 'Solid White' : 'Liquid Glass'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
