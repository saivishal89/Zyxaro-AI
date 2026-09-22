// Dedicated Automatic Web Fetcher Serverless API Function
// Endpoint: /api/fetch-url (Compatible with Vercel & Node HTTP)

function cleanHtmlToMarkdown(html: string): { title: string; text: string } {
  // Extract Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/[\r\n\t]+/g, ' ').trim() : 'Web Document';

  // Remove scripts, styles, noscript, svg, nav, footer, header, iframe
  let clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');

  // Extract main article/body if present
  const mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (mainMatch) {
    clean = mainMatch[1];
  }

  // Convert basic HTML structures to clean Markdown text
  clean = clean
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  // Clean HTML entities and normalize whitespace
  const text = clean
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  // Cap at 12,000 characters for optimal LLM context payload
  const maxLen = 12000;
  const truncatedText = text.length > maxLen ? text.substring(0, maxLen) + '\n\n... [Content Truncated]' : text;

  return { title, text: truncatedText };
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const targetUrl = body?.url || req.query?.url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Extract domain name
    let domain = 'website';
    try {
      domain = new URL(targetUrl).hostname.replace(/^www\./, '');
    } catch {}

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ZarakiBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `HTTP ${response.status}: Unable to fetch webpage` });
    }

    const html = await response.text();
    const { title, text } = cleanHtmlToMarkdown(html);

    return res.status(200).json({
      success: true,
      url: targetUrl,
      domain,
      title,
      content: text,
      length: text.length,
      timestamp: Date.now(),
    });

  } catch (err: any) {
    console.error('Fetch URL API Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch webpage content' });
  }
}
