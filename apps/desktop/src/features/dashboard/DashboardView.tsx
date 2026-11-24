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
    {
      mode: 'capture',
      icon: 'capture',
      title: dict.navLiveCapture,
      subtitle: uiLocale === 'ja-JP' ? '画面操作を記録' : 'Record workflow steps',
      shortcut: '⌥Space',
    },
    {
      mode: 'meetings',
      icon: 'voice',
      title: feat.navMeetings,
      subtitle: uiLocale === 'ja-JP' ? '会議音声・翻訳・議事録' : 'OS audio & bilingual notes',
      shortcut: '⌘4',
    },
    {
      mode: 'agent',
      icon: 'router',
      title: feat.navAgent,
      subtitle: uiLocale === 'ja-JP' ? 'ローカルAIと対話' : 'Chat with local AI & RAG',
      shortcut: '⌘5',
    },
    {
      mode: 'analyzer',
      icon: 'docs',
      title: dict.navAnalyzer,
      subtitle: uiLocale === 'ja-JP' ? 'PDF・Word注釈解析' : 'Annotate PDF & Word',
      shortcut: '⌘3',
    },
    {
      mode: 'templates',
      icon: 'outputs',
      title: dict.navTemplates,
      subtitle: uiLocale === 'ja-JP' ? 'MMI標準テンプレート7種' : '7 MMI SOP templates',
      shortcut: '⌘2',
    },
    {
      mode: 'studio',
      icon: 'studio',
      title: dict.navStudio,
      subtitle: uiLocale === 'ja-JP' ? '手順書編集・出力' : 'Edit & export manuals',
      shortcut: '⌘1',
    },
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
        padding: '22px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F9FF 100%)',
      }}
    >
      <section
        className="glass-regular"
        style={{
          borderRadius: '20px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '520px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
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
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--ink-muted)' }}>
            {userProfile.occupation ? `${userProfile.occupation} · ` : ''}
            {dict.dashboardSubtitle}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="opero-btn primary"
              onClick={() => void startRecordingFlow(`Workflow Session ${analytics.totalSessions + 1}`)}
            >
              <JiggIcon name="capture" size={15} variant="duotone" />
              <span>{dict.startCapture}</span>
            </button>
            <button type="button" className="opero-btn" onClick={() => setNavMode('meetings')}>
              <JiggIcon name="voice" size={15} variant="duotone" />
              <span>{feat.meetingsRecordBtn}</span>
            </button>
            <button type="button" className="opero-btn" onClick={() => setNavMode('agent')}>
              <JiggIcon name="router" size={15} variant="duotone" />
              <span>{feat.navAgent}</span>
            </button>
          </div>
        </div>

        <div className="pero-float" style={{ flexShrink: 0 }}>
          <PeroStateMascot
            state={peroState}
            size={168}
            capColor={peroCapColor}
            jacketColor={peroJacketColor}
          />
        </div>
      </section>

      <section
        aria-label="Quick Launch Shortcuts"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
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
              animationDelay: `${idx * 45}ms`,
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'start',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: '#F2F8FF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <JiggIcon name={tile.icon} size={18} variant="duotone" />
              </span>
              <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                {tile.shortcut}
              </span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>
                {tile.title}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                {tile.subtitle}
              </div>
            </div>
          </button>
        ))}
      </section>

      <section
        aria-label="Activity Analytics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
        }}
      >
        <article className="analytics-card-black opero-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700 }}>
                {dict.analyticsBlackTitle}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                {dict.analyticsBlackSub}
              </div>
            </div>
            <span style={{ color: '#69BCFC' }}>
              <JiggIcon name="capture" size={18} variant="duotone" />
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginTop: '14px', alignItems: 'baseline' }}>
            <div>
              <div className="mono" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>
                {analytics.totalSessions + recentMeetings.length}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>{dict.analyticsSessionsLabel}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: '#69BCFC', letterSpacing: '-0.03em' }}>
                {analytics.completedSessions + recentMeetings.length}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>{dict.analyticsCompletedLabel}</div>
            </div>
          </div>

          <div
            aria-label="7-day session activity"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              alignItems: 'end',
              height: '46px',
              marginTop: '14px',
            }}
          >
            {analytics.dailyActivity.slice(0, 7).map((val, idx) => (
              <div key={DAY_LABELS[idx]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(6, Math.round((val / maxBar) * 30))}px`,
                    borderRadius: '5px',
                    background: idx === 6 ? '#69BCFC' : 'rgba(105, 188, 252, 0.35)',
                    transition: 'height 260ms ease',
                  }}
                />
                <span className="mono" style={{ fontSize: '10px', color: '#94A3B8' }}>
                  {DAY_LABELS[idx]}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-card-white opero-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700 }}>
                {dict.analyticsWhiteTitle}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                {dict.analyticsWhiteSub}
              </div>
            </div>
            <JiggIcon name="voice" size={18} variant="duotone" />
          </div>

          <div style={{ display: 'flex', gap: '24px', marginTop: '14px', alignItems: 'baseline' }}>
            <div>
              <div className="mono" style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em' }}>
                {analytics.talkingMinutes.toFixed(1)}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>{dict.analyticsTalkingLabel}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>
                {analytics.totalCapturedEvents}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>{dict.analyticsStepsLabel}</div>
            </div>
          </div>

          <div
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--ink-muted)',
            }}
          >
            <span>Manuals: <strong className="mono" style={{ color: 'var(--ink)' }}>{analytics.totalManuals}</strong></span>
            <span>Verified steps: <strong className="mono" style={{ color: 'var(--ink)' }}>{analytics.verifiedSteps}</strong></span>
          </div>
        </article>
      </section>

      <section
        aria-label="Quick Ask Pero and Recent Activity"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          className="opero-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PeroAvatar size={34} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700 }}>
                {uiLocale === 'ja-JP' ? 'Peroにすぐ質問' : 'Quick Ask Pero'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                {uiLocale === 'ja-JP' ? 'ローカルAI・MMI知識・議事録検索' : 'Local AI chat, MMI knowledge & meeting search'}
              </div>
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
              placeholder={uiLocale === 'ja-JP' ? 'メッセージを入力...' : 'Ask Pero anything...'}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '13px',
                background: '#FFFFFF',
                color: 'var(--ink)',
              }}
            />
            <button type="submit" className="opero-btn primary" disabled={!askInput.trim()} style={{ minHeight: '34px', padding: '4px 12px' }}>
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
                style={{ minHeight: '28px', padding: '3px 10px', fontSize: '11.5px' }}
              >
                <span>{chip}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className="opero-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700 }}>
            {uiLocale === 'ja-JP' ? '最近のワークスペース' : 'Recent Workspace Activity'}
          </div>

          {recentMeetings.length === 0 && recentDocs.length === 0 && sessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--ink-muted)' }}>
              <div>
                {uiLocale === 'ja-JP'
                  ? 'まだ記録がありません。会議録音やドキュメント解析を始めてみましょう。'
                  : 'No recent items yet. Start a meeting recording or analyze a document.'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="opero-btn" onClick={() => setNavMode('analyzer')} style={{ minHeight: '30px', fontSize: '12px' }}>
                  <span>{feat.analyzerUploadBtn}</span>
                </button>
                <button type="button" className="opero-btn" onClick={() => setNavMode('meetings')} style={{ minHeight: '30px', fontSize: '12px' }}>
                  <span>{feat.meetingsRecordBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentMeetings.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="nav-item"
                  onClick={() => setNavMode('meetings')}
                  style={{ padding: '7px 10px', border: '1px solid var(--border)' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                    <JiggIcon name="voice" size={14} variant="duotone" />
                    <span>{m.title}</span>
                  </span>
                  <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    {m.targetLocale}
                  </span>
                </button>
              ))}
              {recentDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="nav-item"
                  onClick={() => setNavMode('analyzer')}
                  style={{ padding: '7px 10px', border: '1px solid var(--border)' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                    <JiggIcon name="docs" size={14} variant="duotone" />
                    <span>{d.filename}</span>
                  </span>
                  <span className="mono" style={{ fontSize: '10.5px', color: 'var(--ink-muted)' }}>
                    {d.completenessScore}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
