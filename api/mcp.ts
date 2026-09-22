import type { IncomingMessage, ServerResponse } from 'http';

// Helper to strip HTML tags, script/style content, and clean text
function cleanHtmlToMarkdown(html: string): { title: string; text: string } {
  // Extract Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/[\r\n\t]+/g, ' ').trim() : 'Web Document';

  // Remove scripts, styles, noscript, svg, header, footer, nav
  let clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Extract main body if exists
  const mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (mainMatch) {
    clean = mainMatch[1];
  }

  // Convert headings and formatting basics
  clean = clean
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  // Clean whitespace & unescape basic HTML entities
  const text = clean
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  // Cap at 15,000 chars for optimal LLM context size
  const maxLen = 15000;
  const truncatedText = text.length > maxLen ? text.substring(0, maxLen) + '\n\n... [Content Truncated]' : text;

  return { title, text: truncatedText };
}

// Handler function compatible with Vercel Serverless Function & Node HTTP
export default async function handler(req: any, res: any) {
  // Handle CORS
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

    const { action, url, tool, params } = body || req.query || {};

    // 1. Web Fetch Action
    if (action === 'fetch_url' || tool === 'web_fetch') {
      const targetUrl = url || params?.url;
      if (!targetUrl) {
        return res.status(400).json({ error: 'URL is required' });
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ZarakiBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `HTTP ${response.status}: Failed to fetch URL` });
      }

      const html = await response.text();
      const { title, text } = cleanHtmlToMarkdown(html);

      return res.status(200).json({
        success: true,
        url: targetUrl,
        title,
        content: text,
        length: text.length,
        timestamp: Date.now(),
      });
    }

    // 2. GitHub Repo Fetch Action
    if (action === 'fetch_github' || tool === 'github_repo_fetch') {
      const repoUrl = url || params?.url;
      if (!repoUrl) {
        return res.status(400).json({ error: 'GitHub Repo URL is required' });
      }

      // Parse owner and repo from URL: https://github.com/owner/repo
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid GitHub URL format. Use https://github.com/owner/repo' });
      }

      const owner = match[1];
      const repo = match[2].replace(/\.git$/, '');

      // Fetch README directly from raw.githubusercontent.com
      const readmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`)
        .then(r => r.ok ? r.text() : fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`).then(r2 => r2.ok ? r2.text() : 'No README found.'));

      // Fetch Repo Info via GitHub Public API
      const infoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'User-Agent': 'Zaraki-AI-Agent' }
      }).then(r => r.ok ? r.json() : null);

      return res.status(200).json({
        success: true,
        owner,
        repo,
        description: infoRes?.description || 'GitHub Repository',
        stars: infoRes?.stargazers_count || 0,
        forks: infoRes?.forks_count || 0,
        readme: typeof readmeRes === 'string' ? readmeRes.substring(0, 10000) : '',
        timestamp: Date.now(),
      });
    }

    // 3. MCP Tool Manifest (Model Context Protocol tool discovery endpoint)
    if (action === 'list_tools' || req.method === 'GET') {
      return res.status(200).json({
        name: 'zaraki-mcp-web-server',
        version: '1.0.0',
        tools: [
          {
            name: 'web_fetch',
            description: 'Fetches any live website URL and converts the HTML body into clean readable text/markdown for AI prompt grounding.',
            parameters: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'The HTTP/HTTPS website URL to fetch and analyze' }
              },
              required: ['url']
            }
          },
          {
            name: 'github_repo_fetch',
            description: 'Fetches public GitHub repository README, metadata, stars, and structure.',
            parameters: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'GitHub repository URL (https://github.com/owner/repo)' }
              },
              required: ['url']
            }
          }
        ]
      });
    }

    return res.status(400).json({ error: 'Invalid action. Supported actions: fetch_url, fetch_github, list_tools' });

  } catch (err: any) {
    console.error('MCP Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal MCP Server Error' });
  }
}
