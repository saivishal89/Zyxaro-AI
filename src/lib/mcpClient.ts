// Invisible Automatic Web Fetcher Client Engine for ZYXARO AI
// Automatically extracts URLs, fetches clean content, and feeds LLM prompt

export interface FetchUrlResult {
  success: boolean;
  url: string;
  domain?: string;
  title?: string;
  content?: string;
  length?: number;
  error?: string;
}

// Regular expression to extract URLs from user prompts
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<"']+)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches));
}

// Automatic URL Fetcher calling /api/fetch-url backend route with fallback
export async function fetchUrlContent(targetUrl: string): Promise<FetchUrlResult> {
  try {
    const response = await fetch('/api/fetch-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (e) {
    console.warn('/api/fetch-url endpoint unavailable, attempting fallback fetch...', e);
  }

  // Client Fallback via AllOrigins CORS proxy
  try {
    let domain = 'website';
    try { domain = new URL(targetUrl).hostname.replace(/^www\./, ''); } catch {}

    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      const html = proxyData.contents || '';
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Web Document';
      const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .substring(0, 10000);
      return { success: true, url: targetUrl, domain, title, content: text, length: text.length };
    }
  } catch (err) {}

  return {
    success: false,
    url: targetUrl,
    error: 'Failed to fetch webpage content',
  };
}
