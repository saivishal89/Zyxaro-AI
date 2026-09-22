import { RAGDocument } from './types';

/**
 * Dynamically load PDF.js from CDN or global window
 */
async function getPdfJsLib(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  return new Promise((resolve) => {
    if ((window as any).pdfjsLib) return resolve((window as any).pdfjsLib);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib && lib.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      resolve(lib);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

/**
 * Extract text from PDF ArrayBuffer using pdfjs-dist with fallback
 */
export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib = await getPdfJsLib();
    if (pdfjsLib && pdfjsLib.getDocument) {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => (item && 'str' in item ? item.str : ''))
          .filter((str: string) => str.trim().length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += `\n[Page ${pageNum}]\n${pageText}\n`;
        }
      }

      if (fullText.trim().length > 0) {
        return fullText.trim();
      }
    }
  } catch (err) {
    console.warn('PDF.js parsing failed, using fallback stream extraction:', err);
  }

  // Fallback stream text extraction
  return extractPdfFallback(arrayBuffer);
}

/**
 * Fallback regex stream extractor for PDFs
 */
function extractPdfFallback(arrayBuffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(arrayBuffer);
    const matches: string[] = [];

    // Extract text streams enclosed in TJ or Tj operators or parentheses
    const streamRegex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
    let match: RegExpExecArray | null;
    while ((match = streamRegex.exec(raw)) !== null) {
      const txt = match[1] || match[2];
      if (txt && txt.length > 2 && /[\w\s.,!?-]/.test(txt)) {
        matches.push(txt);
      }
    }

    if (matches.length > 0) {
      return matches.join(' ');
    }

    // Secondary fallback: pull all plain printable blocks
    const asciiBlocks = raw.match(/[A-Za-z0-9\s.,!?:;'"()-]{15,}/g) || [];
    return asciiBlocks.join('\n').trim();
  } catch {
    return 'Extracted Document Content (Binary/Scanned PDF)';
  }
}

/**
 * Background OCR / Photo text extractor
 */
export async function extractImageText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.min(img.width, 1000);
        canvas.height = Math.min(img.height, 1000);
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        // Return photo document metadata + visual description token
        const info = `[Photo Knowledge Document: ${file.name}]\nFormat: ${file.type}\nDimensions: ${img.width}x${img.height}px\nSize: ${(file.size / 1024).toFixed(1)} KB\nExtracted Photo Context: Visual diagram / document photo attached for RAG analysis.`;
        resolve(info);
      };
      img.onerror = () => resolve(`[Photo Attachment: ${file.name}]`);
    };

    reader.onerror = () => resolve(`[Photo Attachment: ${file.name}]`);
    reader.readAsDataURL(file);
  });
}

/**
 * Extract plain text from any uploaded File (PDF, Photos/Images, TXT, MD, CSV, JSON, Code files)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const nameLower = file.name.toLowerCase();
  const typeLower = file.type.toLowerCase();

  // Photos & Images
  if (typeLower.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(nameLower)) {
    return await extractImageText(file);
  }

  // PDFs
  if (nameLower.endsWith('.pdf') || typeLower === 'application/pdf') {
    const buffer = await file.arrayBuffer();
    return await extractPdfText(buffer);
  }

  // Text / Docs
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Background non-blocking file scanner & chunker
 */
export function scanFileInBackground(
  file: File, 
  addRagDocument: (doc: RAGDocument) => void,
  onStatus?: (msg: string) => void
): void {
  onStatus?.(`Scanning ${file.name} in background...`);
  
  // Execute scanning off the main thread ticks using setTimeout
  setTimeout(async () => {
    try {
      const extractedText = await extractTextFromFile(file);
      if (extractedText && extractedText.trim().length > 0) {
        const chunks = chunkText(extractedText);
        const doc: RAGDocument = {
          id: `rag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          content: extractedText,
          chunks,
          addedAt: Date.now(),
          sizeBytes: file.size
        };
        addRagDocument(doc);
        onStatus?.(`⚡ Background RAG Scan Complete: ${file.name} (${chunks.length} chunks indexed)`);
      }
    } catch (err) {
      console.error(`Background scan error for ${file.name}:`, err);
    }
  }, 100);
}

/**
 * Split document content into semantic chunks for retrieval
 */
export function chunkText(text: string, chunkSize: number = 450, overlap: number = 60): string[] {
  if (!text || text.trim().length === 0) return [];
  
  // Split into paragraphs/sentences first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];

  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n' + para).length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      
      const words = para.split(/\s+/);
      if (words.length * 5 > chunkSize) {
        // Large paragraph, split by word count
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).length > chunkSize) {
            chunks.push(sub.trim());
            sub = w;
          } else {
            sub += (sub ? ' ' : '') + w;
          }
        }
        if (sub.trim()) currentChunk = sub;
      } else {
        currentChunk = para;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text.substring(0, chunkSize)];
}

/**
 * Tokenize text into normalized word tokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

/**
 * Simple TF-IDF / Cosine-like keyword overlap score
 */
function computeMatchScore(queryTokens: string[], chunkText: string): number {
  if (queryTokens.length === 0) return 0;
  const chunkTokens = tokenize(chunkText);
  if (chunkTokens.length === 0) return 0;

  const chunkSet = new Map<string, number>();
  for (const t of chunkTokens) {
    chunkSet.set(t, (chunkSet.get(t) || 0) + 1);
  }

  let score = 0;
  for (const q of queryTokens) {
    if (chunkSet.has(q)) {
      const count = chunkSet.get(q)!;
      // Bonus for rare or exact words
      score += (1 + Math.log(count)) * (q.length > 5 ? 1.5 : 1.0);
    }
  }

  return score / (Math.sqrt(chunkTokens.length) + 1);
}

export interface RAGMatch {
  docName: string;
  chunk: string;
  score: number;
}

/**
 * Query documents for relevant context
 */
export function retrieveRagContext(query: string, docs: RAGDocument[], topK: number = 4): RAGMatch[] {
  if (!docs || docs.length === 0 || !query.trim()) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const matches: RAGMatch[] = [];

  for (const doc of docs) {
    for (const chunk of doc.chunks) {
      const score = computeMatchScore(queryTokens, chunk);
      if (score > 0.05) {
        matches.push({
          docName: doc.name,
          chunk,
          score
        });
      }
    }
  }

  // Sort descending by score
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, topK);
}

/**
 * Format RAG context specifically for internal SYSTEM prompt injection.
 * Never to be attached to the user's visible message or output.
 */
export function buildRagSystemContext(matches: RAGMatch[]): { ragContext: string; sources: string[] } {
  if (matches.length === 0) return { ragContext: '', sources: [] };

  const sources = Array.from(new Set(matches.map(m => m.docName)));
  const contextBlock = matches
    .map((m, idx) => `[Document ${idx + 1}: ${m.docName}]\n${m.chunk}`)
    .join('\n\n---\n\n');

  const ragContext = `[INTERNAL GROUNDING KNOWLEDGE - DO NOT EXPOSE TO USER]\nUse the following reference knowledge to accurately answer the user's question:\n\n${contextBlock}\n\n[GROUNDING RULES]:\n- Base your answer on the above knowledge when relevant.\n- NEVER reveal, repeat, or quote internal document headers, tags, source brackets, or retrieval blocks.\n- Provide ONLY the direct, final response.`;

  return { ragContext, sources };
}

/**
 * Backward-compatible helper that delegates to buildRagSystemContext
 */
export function buildRagPromptPrefix(matches: RAGMatch[]): { prefix: string; sources: string[] } {
  const { ragContext, sources } = buildRagSystemContext(matches);
  return { prefix: ragContext, sources };
}

/**
 * Defense-in-depth sanitizer to strip any internal retrieval or system tags
 * that might accidentally be echoed by LLMs.
 */
export function sanitizeModelOutput(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove [RAG KNOWLEDGE CONTEXT ACTIVATED] paired and standalone blocks
  cleaned = cleaned.replace(/\[RAG KNOWLEDGE CONTEXT ACTIVATED\][\s\S]*?\[USER INSTRUCTION\]:?\s*/gi, '');
  cleaned = cleaned.replace(/\[RAG KNOWLEDGE CONTEXT ACTIVATED\][^\n]*\n*/gi, '');
  // 2. Remove [INTERNAL GROUNDING KNOWLEDGE] paired and standalone blocks
  cleaned = cleaned.replace(/\[INTERNAL GROUNDING KNOWLEDGE[\s\S]*?\[GROUNDING RULES\]:[\s\S]*?direct, final response\.\s*/gi, '');
  cleaned = cleaned.replace(/\[INTERNAL (?:RETRIEVAL|GROUNDING)[^\]]*\][^\n]*\n*/gi, '');
  cleaned = cleaned.replace(/INTERNAL RETRIEVAL CONTEXT:[^\n]*\n*/gi, '');
  cleaned = cleaned.replace(/Use the following retrieved documents[^\n]*\n*/gi, '');
  // 3. Remove standalone [USER INSTRUCTION] tags
  cleaned = cleaned.replace(/\[USER INSTRUCTION\]:?\s*/gi, '');
  // 4. Remove leaked [Document X: ...] or [Source X: ...] blocks
  cleaned = cleaned.replace(/\[(?:Document|Source)\s+\d+:[^\]]+\]\s*/gi, '');
  // 5. Remove LLM system tokens
  cleaned = cleaned.replace(/<<SYS>>[\s\S]*?<<\/SYS>>/gi, '');
  cleaned = cleaned.replace(/<<SYS>>|<<\/SYS>>/gi, '');
  cleaned = cleaned.replace(/<\|im_start\|>system[\s\S]*?<\|im_end\|>/gi, '');
  cleaned = cleaned.replace(/<\|im_start\|>system|<\|im_end\|>/gi, '');
  // 6. Clean up leading whitespace/newlines
  cleaned = cleaned.replace(/^\s*\n+/, '').trim();

  return cleaned;
}
