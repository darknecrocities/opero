import React, { useEffect, useState } from 'react';
import { playJiggSfx } from '@opero/jiggicons';
import type { AgentCapabilitiesSettings } from '@opero/shared-types';
import { operoClient } from '../../services/operoClient';
import { useOperoStore } from '../../store/useOperoStore';

const DEFAULT_AGENT_SETTINGS: AgentCapabilitiesSettings = {
  enabled: true,
  requireConfirmation: true,
  showChainOfThought: true,
  calendarEnabled: true,
  remindersEnabled: true,
  emailDraftEnabled: true,
  notesEnabled: true,
  notificationsEnabled: true,
  clipboardOpenEnabled: true,
};

interface CapabilityRow {
  key: keyof AgentCapabilitiesSettings;
  title: string;
  desc: string;
  lockedOn?: boolean;
}

const ROWS: CapabilityRow[] = [
  {
    key: 'enabled',
    title: 'Enable Pero Agent Actions',
    desc: 'Allow Pero to propose local OS and productivity actions directly from chat.',
  },
  {
    key: 'requireConfirmation',
    title: 'Always Ask Confirmation in Chat',
    desc: 'Mandatory safety gate — Pero always waits for your Approve & Run click before running any action.',
    lockedOn: true,
  },
  {
    key: 'showChainOfThought',
    title: 'Show Chain of Thought Reasoning',
    desc: 'Display a collapsible Thought Process accordion inside Pero replies.',
  },
  {
    key: 'calendarEnabled',
    title: 'Google Calendar & Computer Calendar',
    desc: 'Zero-API-key one-click scheduling via Google Calendar URL or local .ics / Apple Calendar.',
  },
  {
    key: 'remindersEnabled',
    title: 'OS Reminders & Local Tasks',
    desc: 'Create native Reminders.app entries and save a local OPERO checklist copy.',
  },
  {
    key: 'emailDraftEnabled',
    title: 'Pre-Filled Email Drafts',
    desc: 'Open your default Mail app with a ready-to-review subject and body (no API key).',
  },
  {
    key: 'notesEnabled',
    title: 'Document & File Generation (PDF, Word, Excel, Notes)',
    desc: 'Generate offline PDF, Word (.docx), Excel (.xlsx/.csv), HTML, and Markdown files locally.',
  },
  {
    key: 'notificationsEnabled',
    title: 'Desktop Notifications',
    desc: 'Trigger native OS notification alerts for reminders and focus checks.',
  },
  {
    key: 'clipboardOpenEnabled',
    title: 'Clipboard Copy & Open Links',
    desc: 'Copy prepared summaries to clipboard or open verified HTTPS links.',
  },
];

export const AgentCapabilitiesPanel: React.FC = () => {
  const { soundEnabled, showToast } = useOperoStore();
  const [settings, setSettings] = useState<AgentCapabilitiesSettings>(DEFAULT_AGENT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void operoClient
      .getAgentSettings()
      .then((res) => setSettings(res.settings))
      .catch(() => {});
  }, []);

  const handleToggle = async (key: keyof AgentCapabilitiesSettings, lockedOn?: boolean) => {
    if (lockedOn || saving) return;
    playJiggSfx('click', soundEnabled);
    const next: AgentCapabilitiesSettings = {
      ...settings,
      [key]: !settings[key],
      requireConfirmation: true,
    };
    setSettings(next);
    setSaving(true);
    try {
      const saved = await operoClient.saveAgentSettings(next);
      setSettings(saved.settings);
      showToast('Pero Agent settings saved');
    } catch {
      showToast('Could not save settings (daemon offline)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="glass-regular"
      style={{
        borderRadius: '20px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '720px',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700 }}>
          Pero Agent Capabilities &amp; Approval Controls
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-muted)' }}>
          All actions run locally with zero API keys and always require your explicit confirmation in chat before executing.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ROWS.map((row) => {
          const active = Boolean(settings[row.key]);
          const disabledByMaster = !settings.enabled && row.key !== 'enabled' && !row.lockedOn && row.key !== 'showChainOfThought';
          return (
            <div
              key={row.key}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                opacity: disabledByMaster ? 0.55 : 1,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>{row.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '2px' }}>{row.desc}</div>
              </div>
              <button
                type="button"
                className={`opero-btn ${active ? 'primary' : ''}`}
                disabled={row.lockedOn || saving || disabledByMaster}
                aria-pressed={active}
                onClick={() => void handleToggle(row.key, row.lockedOn)}
                style={{ minWidth: '88px', minHeight: '32px', fontSize: '12px', flexShrink: 0 }}
              >
                {row.lockedOn ? 'Always ON' : active ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
