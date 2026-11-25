import React from 'react';

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index).replace(/\*\*/g, ''));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`b-${key++}`} style={{ fontWeight: 700 }}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`c-${key++}`}
          className="mono"
          style={{
            fontSize: '12px',
            padding: '1px 5px',
            borderRadius: '5px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
          }}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`i-${key++}`}>{token.slice(1, -1)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex).replace(/\*\*/g, ''));
  }
  return nodes;
}

interface AgentMessageContentProps {
  content: string;
}

export const AgentMessageContent: React.FC<AgentMessageContentProps> = ({ content }) => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[i] ?? '');
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre
          key={`pre-${blocks.length}`}
          className="mono"
          style={{
            margin: '4px 0',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            fontSize: '12px',
            overflowX: 'auto',
          }}
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Headings (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1]!.length;
      blocks.push(
        <div
          key={`h-${blocks.length}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: level === 1 ? '16px' : level === 2 ? '14.5px' : '13.5px',
            marginTop: blocks.length > 0 ? '6px' : 0,
            color: 'var(--ink)',
          }}
        >
          {renderInline(headingMatch[2]!)}
        </div>,
      );
      i += 1;
      continue;
    }

    // Markdown table
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && (lines[i + 1] ?? '').includes('---')) {
      const parseRow = (r: string) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const headers = parseRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        rows.push(parseRow(lines[i]!));
        i += 1;
      }
      blocks.push(
        <div key={`tbl-${blocks.length}`} style={{ overflowX: 'auto', margin: '4px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} style={{ textAlign: 'start', padding: '6px 8px', borderBottom: '1.5px solid var(--border-strong)', fontWeight: 700 }}>
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, rIdx) => (
                <tr key={rIdx}>
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Bullet list
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^[-*•]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${blocks.length}`} style={{ margin: '2px 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}
        </ul>,
      );
      continue;
    }

    // Numbered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^\d+[.)]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${blocks.length}`} style={{ margin: '2px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}
        </ol>,
      );
      continue;
    }

    // Standard paragraph
    blocks.push(
      <p key={`p-${blocks.length}`} style={{ margin: 0 }}>
        {renderInline(trimmed)}
      </p>,
    );
    i += 1;
  }

  return (
    <div data-testid="agent-reply-body" style={{ fontSize: '13.5px', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {blocks}
    </div>
  );
};
