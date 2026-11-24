import type { FirstClassLocale } from './entities';

export interface AgentToolCallRecord {
  tool: string;
  input: string;
  summary: string;
  ok: boolean;
}

export interface AgentMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls: AgentToolCallRecord[];
  citations: string[];
  actionLink?: {
    kind: 'manual' | 'document' | 'meeting';
    id: string;
    label: string;
  } | null;
  createdAt: string;
}

export interface AgentThread {
  id: string;
  title: string;
  locale: FirstClassLocale;
  updatedAt: string;
  messages: AgentMessage[];
}

export interface AgentChatResponse {
  threadId: string;
  message: AgentMessage;
  engineUsed: string;
}

export type MeetingAudioSource = 'system_and_mic' | 'mic_only' | 'system_only';

export interface MeetingTranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  speaker: string;
  originalText: string;
  translatedText: string;
}

export interface MeetingActionItem {
  owner: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MeetingNoteRecord {
  id: string;
  title: string;
  audioSource: MeetingAudioSource;
  sourceLocale: FirstClassLocale;
  targetLocale: FirstClassLocale;
  audioPath: string | null;
  durationSec: number;
  status: 'recording' | 'compiling' | 'completed';
  engineUsed: string;
  segments: MeetingTranscriptSegment[];
  executiveSummary: string;
  translatedSummary: string;
  decisions: string[];
  actionItems: MeetingActionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AudioCaptureCapabilities {
  platform: string;
  systemAudioSupported: boolean;
  micSupported: boolean;
  nativeTapReady: boolean;
  sttEngine: string;
  guidance: string;
}
