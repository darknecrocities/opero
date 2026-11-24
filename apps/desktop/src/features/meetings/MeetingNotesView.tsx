import React, { useEffect, useState } from 'react';
import { getFeatureStrings } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { PeroAmbientPresence } from '@opero/mascot';
import type {
  AudioCaptureCapabilities,
  ExportFormat,
  FirstClassLocale,
  MeetingAudioSource,
  MeetingNoteRecord,
} from '@opero/shared-types';
import { ResizeHandle } from '../../components/ResizeHandle';
import { operoClient } from '../../services/operoClient';
import { DEFAULT_MODELS, useOperoStore } from '../../store/useOperoStore';

type NotesTab = 'summary' | 'actions' | 'export';

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const MeetingNotesView: React.FC = () => {
  const {
    uiLocale,
    targetLocale,
    activeModelId,
    projects,
    soundEnabled,
    peroCapColor,
    peroJacketColor,
    setCompilingOverlay,
    openManualInStudio,
  } = useOperoStore();
  const feat = getFeatureStrings(uiLocale);
  const selectedOllamaTag = DEFAULT_MODELS.find((m) => m.id === activeModelId)?.ollamaTag;

  const [caps, setCaps] = useState<AudioCaptureCapabilities | null>(null);
  const [meetings, setMeetings] = useState<MeetingNoteRecord[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<MeetingNoteRecord | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [titleInput, setTitleInput] = useState('');
  const [audioSource, setAudioSource] = useState<MeetingAudioSource>('system_and_mic');
  const [sourceLocale, setSourceLocale] = useState<FirstClassLocale>(uiLocale);
  const [translateTo, setTranslateTo] = useState<FirstClassLocale>(
    uiLocale === 'ja-JP' ? 'en-US' : targetLocale === uiLocale ? 'ja-JP' : targetLocale,
  );
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [showDraftBox, setShowDraftBox] = useState(false);
  const [tab, setTab] = useState<NotesTab>('summary');
  const [splitPct, setSplitPct] = useState(54);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [busyExport, setBusyExport] = useState(false);

  useEffect(() => {
    void operoClient.getAudioCapabilities().then((r) => setCaps(r.capabilities)).catch(() => {});
    void operoClient
      .listMeetings()
      .then((r) => {
        setMeetings(r.meetings);
        if (r.meetings[0]) setActiveMeeting(r.meetings[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!recordingId) return;
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recordingId]);

  const handleStartRecording = async () => {
    setExportNotice(null);
    const title = titleInput.trim() || `${feat.meetingsTitle} ${meetings.length + 1}`;
    const { meeting } = await operoClient.startMeeting({
      title,
      audioSource,
      sourceLocale,
      targetLocale: translateTo,
    });
    setRecordingId(meeting.id);
    setElapsedSec(0);
    setActiveMeeting(meeting);
    setMeetings((prev) => [meeting, ...prev]);
    playJiggSfx('step', soundEnabled);
  };

  const handleStopAndCompile = async (overrideText?: string) => {
    let targetId = recordingId;
    if (!targetId) {
      const title = titleInput.trim() || `${feat.meetingsTitle} ${meetings.length + 1}`;
      const { meeting } = await operoClient.startMeeting({
        title,
        audioSource,
        sourceLocale,
        targetLocale: translateTo,
      });
      targetId = meeting.id;
    }

    const steps = [feat.meetingsCompilingStep1, feat.meetingsCompilingStep2, feat.meetingsCompilingStep3];
    setCompilingOverlay({ visible: true, title: feat.meetingsCompilingTitle, stepIndex: 0, steps });

    const timer1 = setTimeout(() => {
      setCompilingOverlay({ visible: true, title: feat.meetingsCompilingTitle, stepIndex: 1, steps });
    }, 350);
    const timer2 = setTimeout(() => {
      setCompilingOverlay({ visible: true, title: feat.meetingsCompilingTitle, stepIndex: 2, steps });
    }, 700);

    try {
      const { meeting } = await operoClient.stopAndCompileMeeting(targetId, {
        transcriptOverride: overrideText?.trim() || undefined,
        preferredModel: selectedOllamaTag,
      });
      await new Promise((r) => setTimeout(r, 450));
      setRecordingId(null);
      setActiveMeeting(meeting);
      setMeetings((prev) => [meeting, ...prev.filter((m) => m.id !== meeting.id)]);
      setShowDraftBox(false);
      playJiggSfx('success', soundEnabled);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setCompilingOverlay(null);
    }
  };

  const handleExport = async (format?: ExportFormat) => {
    if (!activeMeeting) return;
    setBusyExport(true);
    try {
      const { manual, artifact } = await operoClient.exportMeeting(activeMeeting.id, {
        projectId: projects[0]?.id,
        exportFormat: format,
      });
      if (artifact) {
        setExportNotice(`Exported ${artifact.format.toUpperCase()} (${artifact.byteSize} B)`);
        playJiggSfx('success', soundEnabled);
      } else {
        openManualInStudio(manual);
        playJiggSfx('nav', soundEnabled);
      }
    } finally {
      setBusyExport(false);
    }
  };

  return (
    <div
      className="opero-view-enter"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: '#FFFFFF',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.025em' }}>
            {feat.meetingsTitle}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-muted)' }}>
            {feat.meetingsSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {recordingId ? (
            <>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>
                REC {formatClock(elapsedSec)}
              </span>
              <button
                type="button"
                className="opero-btn danger"
                onClick={() => void handleStopAndCompile(transcriptDraft)}
              >
                <JiggIcon name="stop" size={14} variant="duotone" />
                <span>{feat.meetingsStopCompileBtn}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="opero-btn"
                onClick={() => setShowDraftBox((v) => !v)}
              >
                <JiggIcon name="docs" size={14} variant="outline" />
                <span>{feat.meetingsImportSampleBtn}</span>
              </button>
              <button
                type="button"
                className="opero-btn primary"
                onClick={() => void handleStartRecording()}
              >
                <JiggIcon name="voice" size={15} variant="duotone" />
                <span>{feat.meetingsRecordBtn}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '10px 14px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}
      >
        <input
          type="text"
          aria-label="Meeting title"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder={uiLocale === 'ja-JP' ? '会議タイトル（任意）' : 'Meeting title (optional)'}
          style={{
            flex: '1 1 180px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '12.5px',
            background: '#FFFFFF',
            color: 'var(--ink)',
          }}
        />
        <select
          aria-label={feat.meetingsSourceLabel}
          value={audioSource}
          onChange={(e) => setAudioSource(e.target.value as MeetingAudioSource)}
          style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 8px', fontSize: '12px', background: '#FFFFFF' }}
        >
          <option value="system_and_mic">{feat.meetingsSourceBoth}</option>
          <option value="mic_only">{feat.meetingsSourceMic}</option>
          <option value="system_only">{feat.meetingsSourceSystem}</option>
        </select>
        <select
          aria-label={feat.meetingsSpokenLabel}
          value={sourceLocale}
          onChange={(e) => setSourceLocale(e.target.value as FirstClassLocale)}
          style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 8px', fontSize: '12px', background: '#FFFFFF' }}
        >
          <option value="en-US">{feat.meetingsSpokenLabel}: English</option>
          <option value="ja-JP">{feat.meetingsSpokenLabel}: 日本語</option>
          <option value="fil-PH">{feat.meetingsSpokenLabel}: Filipino</option>
        </select>
        <select
          aria-label={feat.meetingsTranslateToLabel}
          value={translateTo}
          onChange={(e) => setTranslateTo(e.target.value as FirstClassLocale)}
          style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 8px', fontSize: '12px', background: '#FFFFFF' }}
        >
          <option value="ja-JP">{feat.meetingsTranslateToLabel}: 日本語</option>
          <option value="en-US">{feat.meetingsTranslateToLabel}: English</option>
          <option value="fil-PH">{feat.meetingsTranslateToLabel}: Filipino</option>
        </select>
      </div>

      {caps && (
        <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
          {caps.sttEngine} · {caps.guidance}
        </div>
      )}

      {showDraftBox && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: '#FFFFFF' }}>
          <textarea
            aria-label="Meeting transcript input"
            rows={4}
            value={transcriptDraft}
            onChange={(e) => setTranscriptDraft(e.target.value)}
            placeholder="Host: Let us finalize the Q4 release checklist.&#10;Engineer: Decision: complete QA by Friday and share the Japanese summary."
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12.5px', fontFamily: 'var(--font-sans)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="opero-btn primary"
              onClick={() => void handleStopAndCompile(transcriptDraft)}
            >
              <span>{feat.meetingsStopCompileBtn}</span>
            </button>
          </div>
        </div>
      )}

      {!activeMeeting || activeMeeting.status === 'recording' ? (
        <div style={{ padding: '44px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <PeroAmbientPresence
            state={recordingId ? 'recording' : 'ready'}
            placement="stage"
            size={156}
            capColor={peroCapColor}
            jacketColor={peroJacketColor}
          />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700 }}>
            {recordingId ? `Recording OS audio (${formatClock(elapsedSec)})...` : feat.meetingsEmptyTitle}
          </div>
          <p style={{ margin: 0, maxWidth: '460px', fontSize: '13px', color: 'var(--ink-muted)' }}>
            {feat.meetingsEmptyBody}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap', minWidth: 0 }}>
          <section
            aria-label={feat.meetingsTabScript}
            style={{
              flex: `1 1 ${splitPct}%`,
              minWidth: '290px',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '16px',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '62vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>{activeMeeting.title}</strong>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                {activeMeeting.sourceLocale} → {activeMeeting.targetLocale}
              </span>
            </div>
            {activeMeeting.segments.map((seg) => (
              <div key={seg.id} style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--ink-muted)', marginBottom: '4px' }}>
                  <strong style={{ color: 'var(--ink)' }}>{seg.speaker}</strong>
                  <span className="mono">{formatClock(seg.startSec)} – {formatClock(seg.endSec)}</span>
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--ink)' }}>{seg.originalText}</div>
                <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--ink-muted)', marginTop: '4px', paddingLeft: '10px', borderLeft: '2px solid var(--brand-sky)' }}>
                  {seg.translatedText}
                </div>
              </div>
            ))}
          </section>

          <ResizeHandle
            ariaLabel="Resize meeting transcript and summary panel"
            onResizeDelta={(dx) => setSplitPct((p) => Math.max(36, Math.min(68, p + dx * 0.12)))}
            onReset={() => setSplitPct(54)}
          />

          <section
            aria-label="Meeting Summary and Actions"
            style={{
              flex: `1 1 ${98 - splitPct}%`,
              minWidth: '270px',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '16px',
              background: 'var(--bg-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div role="tablist" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'summary', label: feat.meetingsTabSummary },
                  { id: 'actions', label: feat.meetingsTabActions },
                  { id: 'export', label: feat.meetingsTabExport },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`opero-btn ${tab === t.id ? 'primary' : ''}`}
                  onClick={() => setTab(t.id)}
                  style={{ minHeight: '30px', padding: '3px 10px', fontSize: '12px' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'summary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: 1.6 }}>
                <div style={{ padding: '12px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid var(--border)' }}>
                  {activeMeeting.executiveSummary}
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid var(--border)', borderLeft: '3px solid var(--brand-sky)' }}>
                  {activeMeeting.translatedSummary}
                </div>
              </div>
            )}

            {tab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeMeeting.decisions.map((d, i) => (
                  <div key={`dec-${i}`} style={{ padding: '10px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid var(--border)', fontSize: '12.5px' }}>
                    <strong>Decision:</strong> {d}
                  </div>
                ))}
                {activeMeeting.actionItems.map((a, i) => (
                  <div key={`act-${i}`} style={{ padding: '10px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid var(--border)', fontSize: '12.5px' }}>
                    <strong>{a.owner}</strong> — {a.task}
                  </div>
                ))}
              </div>
            )}

            {tab === 'export' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" className="opero-btn primary" disabled={busyExport} onClick={() => void handleExport(undefined)}>
                  <span>{feat.analyzerOpenStudio}</span>
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {(['pdf', 'docx', 'html', 'markdown'] as ExportFormat[]).map((fmt) => (
                    <button key={fmt} type="button" className="opero-btn" disabled={busyExport} onClick={() => void handleExport(fmt)}>
                      <span>Export {fmt === 'markdown' ? 'MD' : fmt.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                {exportNotice && (
                  <div role="status" className="mono" style={{ fontSize: '12px', color: 'var(--ink)' }}>
                    {exportNotice}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
