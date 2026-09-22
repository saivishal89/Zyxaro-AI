import { Message } from './types';

/**
 * Clean & enhance raw image prompts into professional ultra-detailed prompts
 */
export function sanitizeAndEnhanceImagePrompt(rawPrompt: string): string {
  let cleaned = rawPrompt
    .replace(/^(generate|create|draw|make|show|picture of|photo of|image of|a photo of|a picture of|generate the|the)\s+/i, '')
    .replace(/\s+(photo|image|picture|wallpaper)$/i, '')
    .trim();

  // Special handling for Zaraki / Anime references
  if (/\bzaraki\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/\bzaraki\b/gi, 'Zaraki Kenpachi anime warrior captain with spiked hair and eyepatch');
  }

  const isTechnicalDiagram = /(workflow|diagram|chart|dsa|algorithm|architecture|system|flow|tree|graph|structure|network|database|process|infographic)/i.test(cleaned);

  if (isTechnicalDiagram) {
    return `${cleaned}, professional technical infographic flowchart diagram, 3D isometric vector illustration, clean labeled nodes with directional arrows, modern dark UI aesthetic, high resolution 8k render, hyper-detailed, octane render, vibrant cyan and indigo accents, crisp typography`;
  }

  return `${cleaned}, ultra detailed 8k resolution masterpiece, cinematic lighting, photorealistic 3d render, rich color palette, professional digital artwork`;
}

/**
 * Generate fast high-quality image using Pollinations FLUX model
 */
export function generateLcmImageUrl(prompt: string, modelType: 'flux' | 'turbo' | 'anime' = 'flux'): string {
  const enhancedPrompt = sanitizeAndEnhanceImagePrompt(prompt);
  const cleanPrompt = encodeURIComponent(enhancedPrompt);
  const seed = Math.floor(Math.random() * 9999999);
  
  // Use flux model for state-of-the-art image quality
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&model=${modelType}&nologo=true&enhance=true&seed=${seed}`;
}

/**
 * Estimate token count roughly (1 token ~ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil((text || '').length / 4);
}

/**
 * LCM (Lossless Context Memory) Compressor
 * Intelligently compresses old history into summary blocks when tokens exceed threshold
 */
export function compressContextWithLcm(messages: Message[], tokenLimit: number = 2500): Message[] {
  let totalEstTokens = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);

  if (totalEstTokens <= tokenLimit || messages.length <= 4) {
    return messages;
  }

  const recentCount = 4;
  const oldMessages = messages.slice(0, messages.length - recentCount);
  const recentMessages = messages.slice(messages.length - recentCount);

  const summaryLines = oldMessages.map(m => {
    const roleTag = m.role === 'user' ? 'User' : (m.provider ? `AI (${m.provider})` : 'AI');
    const snippet = m.content.substring(0, 150).replace(/\n/g, ' ');
    return `- ${roleTag}: "${snippet}..."`;
  });

  const compressedSummaryMsg: Message = {
    id: `lcm_mem_${Date.now()}`,
    role: 'system',
    content: `[LCM COMPRESSED MEMORY CONTEXT]\nPrior conversation summarized to conserve token budget:\n${summaryLines.join('\n')}`,
    timestamp: Date.now()
  };

  return [compressedSummaryMsg, ...recentMessages];
}
