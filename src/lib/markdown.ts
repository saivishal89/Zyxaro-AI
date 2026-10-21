// Enhanced markdown parser with code block copy/preview support

let codeBlockCounter = 0;

export function parseMarkdown(text: string): string {
  if (!text) return '';
  
  // Reset counter for each parse
  codeBlockCounter = 0;
  
  let html = text;

  // Escape HTML tags to prevent XSS (basic)
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Remove Setext-style heading underlines BEFORE code block processing
  // Pattern: line of text followed by === or --- on the next line
  html = html.replace(/^(.+)\n={3,}\s*$/gm, '## $1');
  html = html.replace(/^(.+)\n-{3,}\s*$/gm, '### $1');

  // Remove standalone horizontal rules (---, ***, ___) that aren't headings
  html = html.replace(/^[-=]{3,}\s*$/gm, '');
  html = html.replace(/^\*{3,}\s*$/gm, '');
  html = html.replace(/^_{3,}\s*$/gm, '');

  // Code blocks: ```language\ncode\n``` — with copy & run header
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gi, (_match, lang: string, code: string) => {
    const blockId = `code-block-${codeBlockCounter++}`;
    const language = lang || 'code';
    
    // Store the raw code as a data attribute (decode HTML entities back for the attribute)
    const rawCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').trimEnd();
    const encodedCode = btoa(unescape(encodeURIComponent(rawCode)));
    
    return `<div class="code-block-wrapper" id="${blockId}" data-code="${encodedCode}" data-lang="${language}">
      <div class="code-block-header">
        <span class="code-block-lang">${language}</span>
        <div class="code-block-actions">
          <button class="code-preview-btn" data-code-id="${blockId}" title="Run & Preview">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Run</span>
          </button>
          <button class="code-copy-btn" data-code-id="${blockId}" title="Copy code">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copy</span>
          </button>
        </div>
      </div>
      <pre><code>${code.trimEnd()}</code></pre>
    </div>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers: ### Header
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Numbered lists: 1. item
  html = html.replace(/^\d+\.\s+(.*?)$/gm, '<li class="numbered">$1</li>');

  // Lists: - item
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items in <ul>
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Paragraphs: (double line breaks)
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<') && !trimmed.startsWith('<strong>') && !trimmed.startsWith('<em>')) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).filter(Boolean).join('');

  return html;
}

// Helper to decode stored code from a code block element
export function getCodeFromBlock(blockId: string): string | null {
  const block = document.getElementById(blockId);
  if (!block) return null;
  const encoded = block.getAttribute('data-code');
  if (!encoded) return null;
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return null;
  }
}

// Helper to get language from a code block element
export function getLangFromBlock(blockId: string): string | null {
  const block = document.getElementById(blockId);
  if (!block) return null;
  return block.getAttribute('data-lang');
}
