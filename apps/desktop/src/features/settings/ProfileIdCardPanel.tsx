import React, { useMemo, useState } from 'react';
import { getUiDictionary, PERSONALITY_OPTIONS } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { OPERO_CURATED_OUTFITS, PeroStateMascot, type OperoAppState } from '@opero/mascot';
import type { OperoPersonality } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';

const BIO_STORAGE_KEY = 'opero_profile_bio_v1';

const PREVIEW_STATES: { id: OperoAppState; label: string }[] = [
  { id: 'ready', label: 'Ready' },
  { id: 'recording', label: 'Live' },
  { id: 'processing', label: 'Thinking' },
  { id: 'exported', label: 'Celebrate' },
];

function loadSavedBio(): string {
  try {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(BIO_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveBio(bio: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BIO_STORAGE_KEY, bio);
  } catch {
    // Ignore storage quota errors
  }
}

function formatOperatorId(name: string): string {
  const seed = (name.trim() || 'MMI Operator').toUpperCase();
  let hash = 10421;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 90000;
  }
  return `OPERO-${String(hash + 10000).slice(0, 5)}`;
}

export const ProfileIdCardPanel: React.FC = () => {
  const {
    uiLocale,
    userProfile,
    soundEnabled,
    peroCapColor,
    peroJacketColor,
    setPeroOutfit,
    saveOnboardingProfile,
    showToast,
  } = useOperoStore();

  const dict = getUiDictionary(uiLocale);
  const [name, setName] = useState<string>(userProfile.name);
  const [occupation, setOccupation] = useState<string>(userProfile.occupation);
  const [bio, setBio] = useState<string>(() => loadSavedBio());
  const [personality, setPersonality] = useState<OperoPersonality>(userProfile.personality);
  const [previewState, setPreviewState] = useState<OperoAppState>('ready');

  const operatorId = useMemo(() => formatOperatorId(name), [name]);
  const toneLabel = useMemo(() => {
    const opt = PERSONALITY_OPTIONS.find((item) => item.id === personality);
    return opt ? opt.label[uiLocale] : personality;
  }, [personality, uiLocale]);

  const localeLabel =
    uiLocale === 'ja-JP' ? '日本語 (ja-JP)' : uiLocale === 'fil-PH' ? 'Filipino (fil-PH)' : 'English (en-US)';

  const defaultBio =
    uiLocale === 'ja-JP'
      ? 'OPEROで日々の業務手順や会議記録をシンプルに整理しています。'
      : 'Documenting workflows, meetings, and everyday operations with OPERO.';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveBio(bio.trim());
    await saveOnboardingProfile({
      name: name.trim() || 'MMI Operator',
      occupation: occupation.trim() || 'Operations',
      personality,
      defaultLocale: uiLocale,
      soundEnabled,
      onboardingCompleted: true,
    });
    playJiggSfx('success', soundEnabled);
    showToast(uiLocale === 'ja-JP' ? 'プロフィールと衣装を保存しました' : 'Profile & Pero outfit saved');
  };

  const applyOutfit = (cap: string, jacket: string, label?: string) => {
    playJiggSfx('click', soundEnabled);
    setPeroOutfit(cap, jacket);
    if (label) {
      showToast(`Pero outfit updated: ${label}`);
    }
  };

  return (
    <section
      aria-label="Operator ID Card and Pero Outfit Studio"
      style={{
        width: '100%',
        maxWidth: '820px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}
    >
      {/* Classic Minimal Horizontal ID Card */}
      <article
        aria-label="Minimal Operator ID Card"
        style={{
          background: '#FFFFFF',
          border: '2px solid #0F172A',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* Minimal Top Header Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '11px 22px',
            borderBottom: '1.5px solid #0F172A',
            background: '#FFFFFF',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '13.5px', fontWeight: 800, letterSpacing: '0.06em', color: '#0F172A' }}>
            OPERO
          </span>
          <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 500 }}>
            Man Machine Interface
          </span>
        </div>

        {/* Horizontal 2-Column Body: Big Mascot Portrait Left, Clean Details + ID Right */}
        <div className="minimal-id-card-body">
          {/* Left Portrait + Signature Name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div className="pero-float">
              <PeroStateMascot
                state={previewState}
                size={204}
                capColor={peroCapColor}
                jacketColor={peroJacketColor}
              />
            </div>

            <div
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '21px',
                color: '#0F172A',
                letterSpacing: '0.01em',
                lineHeight: 1.15,
              }}
            >
              {name.trim() || 'MMI Operator'}
            </div>

            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {PREVIEW_STATES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    playJiggSfx('click', soundEnabled);
                    setPreviewState(st.id);
                  }}
                  style={{
                    border: previewState === st.id ? '1px solid #0F172A' : '1px solid #E2EAF2',
                    background: previewState === st.id ? '#0F172A' : '#FFFFFF',
                    color: previewState === st.id ? '#FFFFFF' : 'var(--ink-muted)',
                    borderRadius: '999px',
                    padding: '3px 9px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Minimal Details Lines + Bottom ID Number */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px', minHeight: '220px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <div style={{ borderBottom: '1px solid #E2EAF2', paddingBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '2px' }}>
                  {uiLocale === 'ja-JP' ? '氏名' : 'Name'}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  {name.trim() || 'MMI Operator'}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #E2EAF2', paddingBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '2px' }}>
                  {uiLocale === 'ja-JP' ? '役割・職種' : 'Role'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>
                  {occupation.trim() || 'Operations'}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #E2EAF2', paddingBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '2px' }}>
                  {uiLocale === 'ja-JP' ? '自己紹介' : 'About'}
                </div>
                <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: '#334155' }}>
                  {bio.trim() || defaultBio}
                </div>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)' }}>
                {toneLabel} · {localeLabel}
              </div>
            </div>

            <div
              className="mono"
              style={{
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: '#0F172A',
                paddingTop: '4px',
              }}
            >
              ID: {operatorId}
            </div>
          </div>
        </div>
      </article>

      {/* Clean Profile Editor & Pero Outfit Studio */}
      <form
        onSubmit={(e) => void handleSave(e)}
        style={{
          padding: '22px 24px',
          borderRadius: '18px',
          border: '1px solid var(--border)',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12.5px', fontWeight: 600 }}>
            <span>{uiLocale === 'ja-JP' ? '氏名' : 'Name'}</span>
            <input
              type="text"
              aria-label="Operator Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: '9px 11px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF', fontSize: '13px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12.5px', fontWeight: 600 }}>
            <span>{uiLocale === 'ja-JP' ? '職種・役割' : 'Occupation'}</span>
            <input
              type="text"
              aria-label="Operator Occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              style={{ padding: '9px 11px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF', fontSize: '13px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12.5px', fontWeight: 600 }}>
            <span>{uiLocale === 'ja-JP' ? 'Operoのスタイル' : 'Opero Tone'}</span>
            <select
              aria-label="Opero Tone"
              value={personality}
              onChange={(e) => setPersonality(e.target.value as OperoPersonality)}
              style={{ padding: '9px 11px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: '#FFFFFF', fontSize: '13px' }}
            >
              {PERSONALITY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label[uiLocale]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12.5px', fontWeight: 600 }}>
          <span>{uiLocale === 'ja-JP' ? '自己紹介・メモ' : 'Short Description'}</span>
          <textarea
            aria-label="User Description"
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={defaultBio}
            style={{
              padding: '9px 11px',
              borderRadius: '10px',
              border: '1px solid var(--border-strong)',
              background: '#FFFFFF',
              fontSize: '13px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </label>

        {/* Pero Outfit Studio (Synced Across Entire App) */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700 }}>
                {uiLocale === 'ja-JP' ? 'Pero 衣装カスタマイズ' : 'Pero Outfit Studio'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                {uiLocale === 'ja-JP' ? 'アプリ全体のPeroマスコットに即時反映されます' : 'Changes reflect live on every Pero mascot across OPERO'}
              </div>
            </div>
            <button
              type="button"
              className="opero-btn"
              onClick={() => applyOutfit('#69BCFC', '#69BCFC', 'OPERO Sky')}
              style={{ minHeight: '28px', padding: '2px 10px', fontSize: '11.5px' }}
            >
              Reset
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {OPERO_CURATED_OUTFITS.map((preset) => {
              const active =
                peroCapColor.toLowerCase() === preset.capColor.toLowerCase() &&
                peroJacketColor.toLowerCase() === preset.jacketColor.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={`Outfit preset ${preset.name}`}
                  onClick={() => applyOutfit(preset.capColor, preset.jacketColor, preset.name)}
                  className="opero-btn"
                  style={{
                    minHeight: '32px',
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    borderColor: active ? 'var(--brand-sky)' : 'var(--border)',
                    background: active ? 'var(--brand-sky-soft)' : '#FFFFFF',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '999px', background: preset.capColor, border: '1px solid rgba(15,23,42,0.18)' }} />
                    <span style={{ width: '11px', height: '11px', borderRadius: '999px', background: preset.jacketColor, border: '1px solid rgba(15,23,42,0.18)' }} />
                  </span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span>Cap Color</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{peroCapColor}</span>
                <input
                  type="color"
                  aria-label="Pero Cap Color"
                  value={peroCapColor}
                  onChange={(e) => applyOutfit(e.target.value, peroJacketColor)}
                  style={{ width: '26px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                />
              </span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span>Jacket Color</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{peroJacketColor}</span>
                <input
                  type="color"
                  aria-label="Pero Jacket Color"
                  value={peroJacketColor}
                  onChange={(e) => applyOutfit(peroCapColor, e.target.value)}
                  style={{ width: '26px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                />
              </span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button type="submit" className="opero-btn primary">
            <JiggIcon name="verified" size={14} variant="duotone" />
            <span>{dict.settingsSaveProfile}</span>
          </button>
        </div>
      </form>
    </section>
  );
};
