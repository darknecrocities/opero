export type LegalDocId = 'terms' | 'privacy' | 'security' | 'license' | 'releases';

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  id: LegalDocId;
  tabLabel: string;
  title: string;
  updated: string;
  sections: readonly LegalSection[];
}

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    id: 'terms',
    tabLabel: 'Terms & Conditions',
    title: 'Terms & Conditions',
    updated: 'Effective November 2026',
    sections: [
      {
        heading: '1. Project Scope',
        body: 'OPERO is a local-first desktop workflow documentation application developed by Arron Kian Parejas. Use of the desktop software and showcase website is governed by these terms and the accompanying MIT License.',
      },
      {
        heading: '2. Explicit Capture & Operator Responsibility',
        body: 'OPERO captures desktop workflows only when explicitly initiated by the operator. You are responsible for ensuring you have authorization to document the applications, screens, and procedures recorded on your workstation.',
      },
      {
        heading: '3. Human Review Before Distribution',
        body: 'All AI-assisted step drafts and multilingual variants (English and Japanese in Release 1; Filipino planned for a later release) start as reviewable drafts. Operators must review, redact sensitive fields, and verify every manual before exporting or distributing it.',
      },
      {
        heading: '4. Warranty Disclaimer',
        body: 'OPERO is provided "AS IS", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.',
      },
    ],
  },
  {
    id: 'privacy',
    tabLabel: 'Privacy Policy',
    title: 'Privacy Policy',
    updated: 'Effective November 2026',
    sections: [
      {
        heading: '1. Local-First Data Ownership',
        body: 'OPERO stores recording sessions, screenshots, accessibility metadata, and manuals locally on your Windows PC in SQLite WAL storage. OPERO does not automatically upload your screen captures or documents to external cloud services.',
      },
      {
        heading: '2. No Background Recording or Keystroke Logging',
        body: 'Recording is strictly user-initiated, visibly indicated, and pausable at any time. OPERO does not record raw typed keystrokes or password fields by default, and supports application exclusion lists.',
      },
      {
        heading: '3. Visual Blur vs. Export Redaction',
        body: 'Blur overlays inside OPERO Studio remain reversible during editing so you can adjust bounds. When exporting to PDF or Word (.docx), OPERO applies irreversible pixel redaction to protected regions.',
      },
      {
        heading: '4. Showcase Website',
        body: 'This OPERO showcase website uses generic sample data for demonstration and does not run third-party advertising trackers or sell personal information.',
      },
    ],
  },
  {
    id: 'security',
    tabLabel: 'Local-First & Security',
    title: 'Local-First & Security Architecture',
    updated: 'Release 1 Scope',
    sections: [
      {
        heading: '1. Loopback-Only Local Daemon',
        body: 'The embedded Rust daemon binds exclusively to localhost (127.0.0.1) with strict origin checks and bounded request payloads, ensuring local capture data stays isolated on your workstation.',
      },
      {
        heading: '2. Native Windows OS Permissions',
        body: 'Release 1 uses official Windows capture and accessibility APIs and never bypasses OS security boundaries.',
      },
      {
        heading: '3. Prompt-Injection & Untrusted OCR Defense',
        body: 'Extracted on-screen text, window titles, and file paths are treated strictly as untrusted data so captured screen text cannot override local model instructions.',
      },
    ],
  },
  {
    id: 'license',
    tabLabel: 'MIT License',
    title: 'MIT License & Third-Party Notices',
    updated: 'Copyright © 2026 Arron Kian Parejas',
    sections: [
      {
        heading: 'Copyright',
        body: 'OPERO — Local-First Desktop Workflow Documentation. Copyright (c) 2026 Arron Kian Parejas.',
      },
      {
        heading: 'MIT License Grant',
        body: 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to preserving the copyright and permission notice.',
      },
      {
        heading: 'Third-Party Open-Source Boundaries',
        body: 'OPERO builds upon open technologies including Tauri 2, Rust, React, TypeScript, SQLite, Vite, Tailwind CSS, Framer Motion, Lucide Icons, and optional local runtimes (Ollama, llama.cpp, PaddleOCR).',
      },
    ],
  },
  {
    id: 'releases',
    tabLabel: 'Release 1 Roadmap',
    title: 'OPERO Desktop — Release 1 Scope',
    updated: 'Coming Soon',
    sections: [
      {
        heading: 'Release 1 (Windows — Coming Soon)',
        body: 'Windows 10 / 11 (64-bit) desktop application with explicit capture, local OCR, OPERO Studio with 7 non-destructive annotations, English & Japanese authoring, Windows system tray quick controls, and offline PDF & Word (.docx) export.',
      },
      {
        heading: 'Planned for Later Releases',
        body: 'macOS support, Filipino (fil-PH) language support, and HTML / Markdown export formats are planned for upcoming releases after Windows Release 1.',
      },
    ],
  },
] as const;
