import React from 'react';
import { getTimeOfDayGreeting, getUiDictionary } from '@opero/i18n';
import { JiggIcon } from '@opero/jiggicons';
import { PeroStateMascot } from '@opero/mascot';
import { useOperoStore } from '../../store/useOperoStore';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DashboardView: React.FC = () => {
  const {
    uiLocale,
    userProfile,
    analytics,
    peroState,
    peroCapColor,
    peroJacketColor,
    startRecordingFlow,
    setNavMode,
  } = useOperoStore();

  const dict = getUiDictionary(uiLocale);
  const greeting = getTimeOfDayGreeting(uiLocale, userProfile.name || 'Operator');
  const maxBar = Math.max(1, ...analytics.dailyActivity);

  return (
    <div
      className="opero-view-enter"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F9FF 100%)',
      }}
    >
      <section
        className="glass-regular"
        style={{
          borderRadius: '24px',
          padding: '26px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '520px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
            }}
          >
            {greeting.primary}
          </h1>
          {uiLocale !== 'ja-JP' && (
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-muted)' }}>
              {greeting.secondaryJa}
            </div>
          )}
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--ink-muted)' }}>
            {userProfile.occupation ? `${userProfile.occupation} · ` : ''}
            {dict.dashboardSubtitle}
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="opero-btn primary"
              onClick={() => void startRecordingFlow(`Workflow Session ${analytics.totalSessions + 1}`)}
            >
              <JiggIcon name="capture" size={16} variant="duotone" />
              <span>{dict.startCapture}</span>
            </button>
            <button type="button" className="opero-btn" onClick={() => setNavMode('templates')}>
              <JiggIcon name="outputs" size={16} variant="duotone" />
              <span>{dict.navTemplates}</span>
            </button>
            <button type="button" className="opero-btn" onClick={() => setNavMode('studio')}>
              <JiggIcon name="studio" size={16} variant="duotone" />
              <span>{dict.navStudio}</span>
            </button>
          </div>
        </div>

        <div className="pero-float" style={{ flexShrink: 0 }}>
          <PeroStateMascot
            state={peroState}
            size={210}
            capColor={peroCapColor}
            jacketColor={peroJacketColor}
          />
        </div>
      </section>

      <section
        aria-label="Activity Analytics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '18px',
        }}
      >
        <article className="analytics-card-black opero-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>
                {dict.analyticsBlackTitle}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                {dict.analyticsBlackSub}
              </div>
            </div>
            <span style={{ color: '#69BCFC' }}>
              <JiggIcon name="capture" size={20} variant="duotone" />
            </span>
          </div>

          <div style={{ display: 'flex', gap: '28px', marginTop: '20px', alignItems: 'baseline' }}>
            <div>
              <div className="mono" style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.03em' }}>
                {analytics.totalSessions}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>{dict.analyticsSessionsLabel}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: '34px', fontWeight: 700, color: '#69BCFC', letterSpacing: '-0.03em' }}>
                {analytics.completedSessions}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>{dict.analyticsCompletedLabel}</div>
            </div>
          </div>

          <div
            aria-label="7-day session activity"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              alignItems: 'end',
              height: '58px',
              marginTop: '18px',
            }}
          >
            {analytics.dailyActivity.slice(0, 7).map((val, idx) => (
              <div key={DAY_LABELS[idx]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(8, Math.round((val / maxBar) * 38))}px`,
                    borderRadius: '6px',
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

        <article className="analytics-card-white opero-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700 }}>
                {dict.analyticsWhiteTitle}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '2px' }}>
                {dict.analyticsWhiteSub}
              </div>
            </div>
            <JiggIcon name="voice" size={20} variant="duotone" />
          </div>

          <div style={{ display: 'flex', gap: '28px', marginTop: '20px', alignItems: 'baseline' }}>
            <div>
              <div className="mono" style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.03em' }}>
                {analytics.talkingMinutes.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{dict.analyticsTalkingLabel}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: '34px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>
                {analytics.totalCapturedEvents}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{dict.analyticsStepsLabel}</div>
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '14px',
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
    </div>
  );
};
