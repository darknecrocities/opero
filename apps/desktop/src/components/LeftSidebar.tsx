import React from 'react';
import { getFeatureStrings, getUiDictionary } from '@opero/i18n';
import { JiggIcon } from '@opero/jiggicons';
import { OperoLogo } from '@opero/mascot';
import type { OperatorRole } from '@opero/shared-types';
import { useOperoStore, type WorkspaceNavMode } from '../store/useOperoStore';

export const LeftSidebar: React.FC = () => {
  const {
    navMode,
    uiLocale,
    userProfile,
    sessions,
    activeSessionId,
    role,
    setNavMode,
    setActiveSessionId,
    setRole,
    startRecordingFlow,
  } = useOperoStore();
  const dict = getUiDictionary(uiLocale);
  const feat = getFeatureStrings(uiLocale);

  const navItems: { mode: WorkspaceNavMode; icon: string; shortcut: string; label: string }[] = [
    { mode: 'dashboard', icon: 'home', shortcut: '⌘0', label: dict.navDashboard },
    { mode: 'capture', icon: 'capture', shortcut: '⌥Space', label: dict.navLiveCapture },
    { mode: 'studio', icon: 'studio', shortcut: '⌘1', label: dict.navStudio },
    { mode: 'templates', icon: 'outputs', shortcut: '⌘2', label: dict.navTemplates },
    { mode: 'analyzer', icon: 'docs', shortcut: '⌘3', label: dict.navAnalyzer },
    { mode: 'meetings', icon: 'voice', shortcut: '⌘4', label: feat.navMeetings },
    { mode: 'agent', icon: 'router', shortcut: '⌘5', label: feat.navAgent },
    { mode: 'settings', icon: 'settings', shortcut: '⌘,', label: dict.navSettings },
  ];

  return (
    <aside className="opero-left-rail" aria-label="Primary Workspace Navigation">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 4px 10px' }}>
        <OperoLogo variant="squircle" size={34} title="OPERO App Icon" />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.03em' }}>
          OPERO
        </div>
      </div>

      <nav aria-label="Workspace Views" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {navItems.map((item) => (
          <button
            key={item.mode}
            type="button"
            className={`nav-item ${navMode === item.mode ? 'active' : ''}`}
            onClick={() => setNavMode(item.mode)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
              <JiggIcon name={item.icon} size={16} variant={navMode === item.mode ? 'duotone' : 'outline'} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </span>
            <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)', flexShrink: 0 }}>
              {item.shortcut}
            </span>
          </button>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <span className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
            {dict.sessionsHeader}
          </span>
          <button
            type="button"
            className="opero-btn"
            onClick={() => void startRecordingFlow(`Workflow Session ${sessions.length + 1}`)}
            style={{ minHeight: '26px', padding: '2px 8px', fontSize: '12px' }}
          >
            <JiggIcon name="add" size={13} variant="duotone" />
            <span>{dict.newSession}</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '10px 8px', fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              {uiLocale === 'ja-JP' ? 'セッションはまだありません。' : 'No sessions yet.'}
            </div>
          ) : (
            sessions.slice(0, 10).map((sess) => {
              const isSel = sess.id === activeSessionId;
              const isLive = sess.status === 'recording';
              return (
                <button
                  key={sess.id}
                  type="button"
                  className={`nav-item ${isSel ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    setNavMode('capture');
                  }}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '3px', padding: '7px 9px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '100%' }}>
                    <JiggIcon name={isLive ? 'capture' : 'docs'} size={14} variant="duotone" />
                    <span style={{ fontSize: '12.5px', fontWeight: isSel ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sess.title}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '10.5px', color: isLive ? 'var(--danger)' : 'var(--ink-muted)', paddingLeft: '21px' }}>
                    {isLive ? dict.statusRecording : `${sess.status} · ${sess.eventCount}`}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setNavMode('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'start',
            minWidth: 0,
          }}
        >
          <JiggIcon name="user" size={18} variant="duotone" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile.name || 'MMI Operator'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile.occupation || 'Operations'}
            </div>
          </div>
        </button>
        <select
          aria-label="Operator Role"
          value={role}
          onChange={(e) => setRole(e.target.value as OperatorRole)}
          style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '4px 6px',
            fontSize: '11px',
            background: 'var(--bg)',
            color: 'var(--ink)',
          }}
        >
          <option value="recorder">Recorder</option>
          <option value="author">Author</option>
          <option value="reviewer">Reviewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </aside>
  );
};
