---
name: opero-design-system
description: OPERO Visual Design System skill governing the White-Primary + Light Blue Secondary (#69BCFC) + Black Accent (#0F172A) Liquid Glass theme, Google Fonts trilingual typography, Pero 20-motion mascot states, and 7 annotation types.
---

# OPERO Visual Design System & Liquid Glass Craftsmanship (`opero-design-system`)

> **Design Identity**: Minimalistic **White-Primary (`#FFFFFF`)**, **Light Blue Secondary (`#69BCFC` / `#F2F8FF`)**, and **Black Accent (`#0F172A`)** interface inspired by premium Cupertino software. Liquid-glass refraction is reserved strictly for floating capture HUDs, contextual toolbars, menus, and popovers—while the manual editing canvas remains solid `#FFFFFF` for readability.

---

## 1. Official OPERO Primary Theme Tokens

| Token Name | CSS Variable | Value | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Primary White Canvas** | `--bg` | `#FFFFFF` | Main application background & manual editing pages (60%+) |
| **Secondary Light Blue Wash** | `--bg-subtle` | `#F2F8FF` | Secondary panels, sidebars, and table headers |
| **Pero Light Blue** | `--brand-sky` | `#69BCFC` | Secondary brand hue, mascot colorway, subtle glass rims |
| **Soft Sky Selection** | `--brand-sky-soft` | `#EBF6FF` | Selected items, active pills, and soft hover washes |
| **Elevated Liquid Glass** | `--bg-glass` | `rgba(255, 255, 255, 0.74)` | Floating capture controls, HUDs, popovers (`blur(24px) saturate(180%)`) |
| **Black Accent (Primary CTA)** | `--accent` / `--ink` | `#0F172A` | Primary action buttons (`#0F172A` bg + `#FFFFFF` text), headings, playhead, focus rings |
| **Secondary Metadata** | `--ink-muted` | `#526071` | Timestamps, event IDs, captions, and metadata |
| **Structural Hairline** | `--border` / `--border-sky` | `#E2EAF2` / `#B9E0FE` | 1px dividers and light-blue selection borders |
| **Success / Verified** | `--success` | `#16865B` | Completed & human-verified manual steps |
| **Warning / Review** | `--warning` | `#B7791F` | Uncertain steps flagged as `needs_review` |
| **Danger / Recording** | `--danger` | `#C43D4B` | Active recording indicators & destructive actions |

---

## 2. Cupertino Liquid Glass Material Hierarchy

1. **Ultra Thin Glass** (`rgba(255, 255, 255, 0.56)`, `blur(16px)`): Hover pills, canvas zoom overlays.
2. **Thin Glass** (`rgba(255, 255, 255, 0.66)`, `blur(20px)`): Floating annotation tool palettes, quick menus.
3. **Regular Liquid Glass** (`rgba(255, 255, 255, 0.72)`, `blur(24px) saturate(180%)`, `inset 0 1px 0 rgba(255,255,255,0.92)`): Top navigation bar, Floating Capture HUD, modal dialogs.
4. **Solid Document Canvas Fallback** (`#FFFFFF` / `#F7F9FC`): Always used for the center manual canvas and automatically engaged when `prefers-reduced-transparency: reduce` or solid-fallback mode is active.

---

## 3. Google Fonts & Trilingual Typography (`en-US`, `ja-JP`, `fil-PH`)

- **Display & Headings (`--font-display`)**: `'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif` (weights `600–800`, tracking `-0.025em`).
- **UI & Multilingual Body (`--font-sans`)**: `'Inter', 'Noto Sans JP', -apple-system, sans-serif` (weights `400–600`, comfortable `65ch` prose width, full glyph support for Latin, Filipino diacritics, Hiragana, Katakana, and Kanji).
- **Telemetry & Schemas (`--font-mono`)**: `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace` (`font-variant-numeric: tabular-nums` for recording timers, coordinates, and JSON schemas).

---

## 4. Mascot Companion: Pero (ORO Penguin) UX-State Mapping

Use `<PeroMascot />` or `<PeroStateMascot />` in onboarding, empty states, floating capture indicators, model setup, and generation progress—never inside dense editing surfaces:

| App UX State | Mapped Pero Motion (`slug`) | Visual Behavior |
| :--- | :--- | :--- |
| `onboarding` | `02-wave-hello` | Friendly 2-beat wave greeting with star sparkles |
| `ready` | `01-idle-breathe` | Calm breathing loop with double-blink & monocle gleam |
| `recording` | `04-recording-active` | Focused scanning pupils + live REC audio equalizer bars |
| `paused` | `05-capture-paused` | Restful tucked flippers with floating pause badge |
| `capturing` | `06-camera-snap` | Shutter recoil with viewfinder frame & flash burst |
| `ocr` | `07-monocle-inspect` | Monocle rim grip with laser scan & corner target lock |
| `processing` | `08-thinking-processing` | Chin-tap ideation loop with synapse thought dots |
| `drafting` | `09-writing-manual` | Stylus scribble drawing live blue ink strokes |
| `annotating` | `10-annotating-arrows` | Presenter gesture with pulsing arrow callout card |
| `searching` | `11-magnifying-search` | Detective figure-8 sweep with magnifying lens |
| `needs-review` | `12-needs-review-alert` | Inquisitive head snap with pulsing amber review ring |
| `verified-draft` | `13-verified-celebrate` | Two-beat victory hop with emerald check badge |
| `exported` | `14-export-document` | Upward flipper send-off launching exported PDF |
| `model-setup` | `15-model-loading` | Maestro poise with dual counter-rotating neural halos |
| `privacy` | `16-privacy-shield` | Sentry stance holding frosted security shield |
| `standby` | `19-sleep-standby` | Cozy nap cycle with floating `z-z-Z` wave |
| `error` | `20-error-recover` | Startled hop recovering to composed upright stance |

---

## 5. OPERO Studio 3-Pane Layout & 7 Annotation Overlays

- **3-Pane Studio Architecture**:
  1. *Left Navigation*: Manual outline, step list, section hierarchy, recording source link.
  2. *Center Solid Canvas*: Document pages, high-DPI screenshots, step descriptions, live print preview.
  3. *Right Inspector*: Local AI evidence provenance (`event_refs`, `screenshot_refs`), annotation geometry controls, translation variants.
- **7 Non-Destructive Annotation Types**:
  1. `Number marker`: Ordered action badge (`1`, `2`, `3`) anchored to target bounds.
  2. `Arrow`: Directional vector pointer to control or menu item.
  3. `Rectangle`: High-contrast bounding box around target UI control.
  4. `Blur / Redaction`: Visual blur in Studio vs. **irreversible pixel redaction** on exported artifacts.
  5. `Crop`: Non-destructive viewport crop metadata focusing on relevant window region.
  6. `Label`: Callout text pill with anchor line.
  7. `Spotlight`: Dimmed background surround (`rgba(23,35,52,0.55)`) isolating the active region.
