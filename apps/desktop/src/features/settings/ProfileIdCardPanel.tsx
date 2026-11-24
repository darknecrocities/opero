import React, { useState } from 'react';
import { getUiDictionary, PERSONALITY_OPTIONS } from '@opero/i18n';
import { JiggIcon, playJiggSfx } from '@opero/jiggicons';
import { OPERO_CURATED_OUTFITS, PeroStateMascot, type OperoAppState } from '@opero/mascot';
import type { OperoPersonality } from '@opero/shared-types';
import { useOperoStore } from '../../store/useOperoStore';

const PREVIEW_STATES: { id: OperoAppState; label: string }[] = [
  { id: 'ready', label: 'Ready' },
  { id: 'recording', label: 'Live' },
  { id: 'processing', label: 'Thinking' },
  { id: 'exported', label: 'Celebrate' },
];

export const ProfileIdCardPanel: React.FC = () => {
  const {
    uiLocale,
    userProfile,
    role,
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
  const [personality, setPersonality] = useState<OperoPersonality>(userProfile.personality);
  const [previewState, setPreviewState] = useState<OperoAppState>('ready');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      className="glass-regular opero-card"
      style={{
        borderRadius: '22px',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '980px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
      }}
    >
      {/* Left Horizontal ID Card Face */}
      <div
        style={{
          background: 'linear-gradient(155deg, #0F172A 0%, #16243D 65%, #1E3252 100%)',
          color: '#FFFFFF',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '18px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div>
            <div className="mono" style={{ fontSize: '10.5px', letterSpacing: '0.12em', color: '#69BCFC', fontWeight: 700 }}>
              OPERO · MMI OPERATOR ID
            </div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
              Man Machine Interface, Inc.
            </div>
          </div>
          <span
            className="mono"
            style={{
              fontSize: '10.5px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(105, 188, 252, 0.35)',
              color: '#E0F2FE',
            }}
          >
            {role.toUpperCase()} · {uiLocale}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
          <div className="pero-float">
            <PeroStateMascot
              state={previewState}
              size={168}
              capColor={peroCapColor}
              jacketColor={peroJacketColor}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {PREVIEW_STATES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  playJiggSfx('click', soundEnabled);
                  setPreviewState(st.id);
                }}
                style={{
                  border: previewState === st.id ? '1px solid #69BCFC' : '1px solid rgba(255,255,255,0.16)',
                  background: previewState === st.id ? 'rgba(105, 188, 252, 0.22)' : 'rgba(255,255,255,0.06)',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {name || 'MMI Operator'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#CBD5E1', marginTop: '2px' }}>
              {occupation || 'Operations'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              title={`Cap ${peroCapColor}`}
              style={{ width: '16px', height: '16px', borderRadius: '999px', background: peroCapColor, border: '1.5px solid #FFFFFF' }}
            />
            <span
              title={`Jacket ${peroJacketColor}`}
              style={{ width: '16px', height: '16px', borderRadius: '999px', background: peroJacketColor, border: '1.5px solid #FFFFFF' }}
            />
          </div>
        </div>
      </div>

      {/* Right Editable Operator Details & Pero Outfit Customizer */}
      <form
        onSubmit={(e) => void handleSave(e)}
        style={{
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
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
        </div>

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

        {/* Pero Outfit Customizer (Synced Across Entire App) */}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
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
