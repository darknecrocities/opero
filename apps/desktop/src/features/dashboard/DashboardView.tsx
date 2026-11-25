import React, { useEffect, useState } from 'react';
import { getFeatureStrings, getTimeOfDayGreeting, getUiDictionary } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { PeroStateMascot } from '@opero/mascot';
import type { AnalyzedDocument, MeetingNoteRecord } from '@opero/shared-types';
import { PeroAvatar } from '../../components/PeroAvatar';
import { operoClient } from '../../services/operoClient';
import { useOperoStore, type WorkspaceNavMode } from '../../store/useOperoStore';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DashboardView: React.FC = () => {
  const {
    uiLocale,
    userProfile,
    analytics,
    sessions,
    soundEnabled,
    peroState,
    peroCapColor,
    peroJacketColor,
    startRecordingFlow,
    setNavMode,
    openAgentWithPrompt,
  } = useOperoStore();

  const dict = getUiDictionary(uiLocale);
  const feat = getFeatureStrings(uiLocale);
  const greeting = getTimeOfDayGreeting(uiLocale, userProfile.name || 'Operator');
  const maxBar = Math.max(1, ...analytics.dailyActivity);

  const [askInput, setAskInput] = useState('');
  const [recentMeetings, setRecentMeetings] = useState<MeetingNoteRecord[]>([]);
  const [recentDocs, setRecentDocs] = useState<AnalyzedDocument[]>([]);

  useEffect(() => {
    void operoClient.listMeetings().then((r) => setRecentMeetings(r.meetings.slice(0, 3))).catch(() => {});
    void operoClient.listAnalyzedDocs().then((r) => setRecentDocs(r.documents.slice(0, 3))).catch(() => {});
  }, []);

  const quickTiles: {
    mode: WorkspaceNavMode;
    icon: string;
    title: string;
    subtitle: string;
    shortcut: string;
  }[] = [
    { mode: 'capture', icon: 'capture', title: dict.navLiveCapture, subtitle: uiLocale === 'ja-JP' ? '画面操作を記録します' : 'Record workflow steps', shortcut: '⌥Space' },
    { mode: 'meetings', icon: 'voice', title: feat.navMeetings, subtitle: uiLocale === 'ja-JP' ? '会議音声を録音・翻訳します' : 'OS audio & bilingual notes', shortcut: '⌘4' },
    { mode: 'agent', icon: 'router', title: feat.navAgent, subtitle: uiLocale === 'ja-JP' ? 'ローカルAIと対話します' : 'Chat with local AI & RAG', shortcut: '⌘5' },
    { mode: 'analyzer', icon: 'docs', title: dict.navAnalyzer, subtitle: uiLocale === 'ja-JP' ? 'PDF・Wordを解析します' : 'Annotate PDF & Word', shortcut: '⌘3' },
    { mode: 'templates', icon: 'outputs', title: dict.navTemplates, subtitle: uiLocale === 'ja-JP' ? 'MMI標準テンプレート7種です' : '7 MMI SOP templates', shortcut: '⌘2' },
    { mode: 'studio', icon: 'studio', title: dict.navStudio, subtitle: uiLocale === 'ja-JP' ? '手順書を編集・出力します' : 'Edit & export manuals', shortcut: '⌘1' },
  ];

  const handleQuickAsk = (prompt: string) => {
    const clean = prompt.trim();
    if (!clean) return;
    setAskInput('');
    openAgentWithPrompt(clean);
  };

  return (
    <div
      className="opero-view-enter"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '28px 34px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '26px',
        background: 'transparent',
        maxWidth: '1060px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Frameless Editorial Greeting Hero (No outer card box) */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
          paddingBottom: '22px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '540px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--ink)',
            }}
          >
            {greeting.primary}
          </h1>
          {uiLocale !== 'ja-JP' && (
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-muted)' }}>
              {greeting.secondaryJa}
            </div>
          )}
          <p style={{ margin: '2px 0 0', fontSize: '13.5px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
            {userProfile.occupation ? `${userProfile.occupation} · ` : ''}
            {dict.dashboardSubtitle}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="opero-btn primary"
              onClick={() => void startRecordingFlow(`Workflow Session ${analytics.totalSessions + 1}`)}
              style={{ borderRadius: '999px', padding: '7px 16px' }}
            >
              <JiggIcon name="capture" size={15} variant="duotone" />
              <span>{dict.startCapture}</span>
            </button>
            <button
              type="button"
              className="opero-btn"
              onClick={() => setNavMode('meetings')}
              style={{ borderRadius: '999px', padding: '7px 15px' }}
            >
              <JiggIcon name="voice" size={15} variant="duotone" />
              <span>{feat.meetingsRecordBtn}</span>
            </button>
            <button
              type="button"
              className="opero-btn"
              onClick={() => setNavMode('agent')}
              style={{ borderRadius: '999px', padding: '7px 15px' }}
            >
              <JiggIcon name="router" size={15} variant="duotone" />
              <span>{feat.navAgent}</span>
            </button>
          </div>
        </div>

        <div className="pero-float" style={{ flexShrink: 0, paddingRight: '6px' }}>
          <PeroStateMascot
            state={peroState}
            size={152}
            capColor={peroCapColor}
            jacketColor={peroJacketColor}
          />
        </div>
      </section>

      {/* Balanced 3x2 Warm-Surface Quick Launch */}
      <section aria-label="Quick Launch Shortcuts" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Workspace
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '10px',
          }}
        >
          {quickTiles.map((tile, idx) => (
            <button
              key={tile.mode}
              type="button"
              className="opero-quick-tile"
              onClick={() => {
                playJiggSfx('nav', soundEnabled);
                setNavMode(tile.mode);
              }}
              style={{
                animationDelay: `${idx * 40}ms`,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '13px 15px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'start',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'var(--bg-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <JiggIcon name={tile.icon} size={17} variant="duotone" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tile.title}
                  </span>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--ink-muted)', flexShrink: 0 }}>
                    {tile.shortcut}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tile.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Single Cohesive Warm-Paper Activity Ledger (No jarring dark/light split) */}
      <section
        aria-label="Activity Analytics"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '18px 22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>
                {dict.analyticsBlackTitle}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                {dict.analyticsBlackSub}
              </div>
            </div>
            <JiggIcon name="capture" size={16} variant="duotone" />
          </div>

          <div style={{ display: 'flex', gap: '28px', alignItems: 'baseline' }}>
            <div>
              <div className="mono" style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
                {analytics.totalSessions + recentMeetings.length}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>{dict.analyticsSessionsLabel}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                {analytics.completedSessions + recentMeetings.length}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>{dict.analyticsCompletedLabel}</div>
            </div>
          </div>

          <div
            aria-label="7-day session activity"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', alignItems: 'end', height: '40px', marginTop: '4px' }}
          >
            {analytics.dailyActivity.slice(0, 7).map((val, idx) => (
              <div key={DAY_LABELS[idx]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(5, Math.round((val / maxBar) * 24))}px`,
                    borderRadius: '4px',
                    background: idx === 6 ? '#0F172A' : val > 0 ? '#69BCFC' : 'var(--bg-subtle)',
                    transition: 'height 260ms ease',
                  }}
                />
                <span className="mono" style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>{DAY_LABELS[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', borderLeft: '1px solid var(--border)', paddingLeft: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>
                {dict.analyticsWhiteTitle}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                {dict.analyticsWhiteSub}
              </div>
            </div>
            <JiggIcon name="voice" size={16} variant="duotone" />
          </div>

          <div style={{ display: 'flex', gap: '28px', alignItems: 'baseline' }}>
            <div>
              <div className="mono" style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
                {analytics.talkingMinutes.toFixed(1)}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>{dict.analyticsTalkingLabel}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                {analytics.totalCapturedEvents}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>{dict.analyticsStepsLabel}</div>
            </div>
          </div>

          <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-muted)' }}>
            <span>Manuals: <strong className="mono" style={{ color: 'var(--ink)' }}>{analytics.totalManuals}</strong></span>
            <span>Verified steps: <strong className="mono" style={{ color: 'var(--ink)' }}>{analytics.verifiedSteps}</strong></span>
          </div>
        </div>
      </section>

      {/* Frameless Inline Quick Ask Pero + Hairline Recent Activity */}
      <section
        aria-label="Quick Ask Pero and Recent Activity"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '26px',
          paddingTop: '4px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <PeroAvatar size={28} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
              {uiLocale === 'ja-JP' ? 'Peroにすぐ質問' : 'Quick Ask Pero'}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuickAsk(askInput);
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              aria-label="Quick Ask Pero"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              placeholder={uiLocale === 'ja-JP' ? '予定作成やPDF・Excel生成などを入力してください...' : 'Ask Pero to schedule, generate PDF/Excel, or search...'}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: '11px',
                padding: '9px 13px',
                fontSize: '13px',
                background: 'var(--bg-surface)',
                color: 'var(--ink)',
              }}
            />
            <button type="submit" className="opero-btn primary" disabled={!askInput.trim()} style={{ minHeight: '36px', padding: '4px 14px' }}>
              <span>{feat.agentSendBtn}</span>
            </button>
          </form>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[feat.agentStarter1, feat.agentStarter3].map((chip) => (
              <button
                key={chip}
                type="button"
                className="opero-btn"
                onClick={() => handleQuickAsk(chip)}
                style={{ minHeight: '28px', padding: '3px 10px', fontSize: '11.5px', borderRadius: '999px' }}
              >
                <span>{chip}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
            {uiLocale === 'ja-JP' ? '最近のワークスペース' : 'Recent Workspace Activity'}
          </div>

          {recentMeetings.length === 0 && recentDocs.length === 0 && sessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: 'var(--ink-muted)', paddingTop: '2px' }}>
              <div>
                {uiLocale === 'ja-JP'
                  ? 'まだ記録がありません。会議録音やドキュメント解析を始めてみましょう。'
                  : 'No recent items yet. Start a meeting recording or analyze a document.'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="opero-btn" onClick={() => setNavMode('analyzer')} style={{ minHeight: '30px', fontSize: '12px', borderRadius: '999px' }}>
                  <span>{feat.analyzerUploadBtn}</span>
                </button>
                <button type="button" className="opero-btn" onClick={() => setNavMode('meetings')} style={{ minHeight: '30px', fontSize: '12px', borderRadius: '999px' }}>
                  <span>{feat.meetingsRecordBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' }}>
              {recentMeetings.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="nav-item"
                  onClick={() => setNavMode('meetings')}
                  style={{ padding: '9px 6px', borderRadius: 0, borderBottom: '1px solid var(--border)' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                    <JiggIcon name="voice" size={14} variant="duotone" />
                    <span>{m.title}</span>
                  </span>
                  <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>{m.targetLocale}</span>
                </button>
              ))}
              {recentDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="nav-item"
                  onClick={() => setNavMode('analyzer')}
                  style={{ padding: '9px 6px', borderRadius: 0, borderBottom: '1px solid var(--border)' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                    <JiggIcon name="docs" size={14} variant="duotone" />
                    <span>{d.filename}</span>
                  </span>
                  <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>{d.completenessScore}%</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
