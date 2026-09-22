import { McpServer, McpTool } from './types';

/**
 * MCP (Model Context Protocol) Client Engine for ZYXARO AI
 * Connects to MCP servers via JSON-RPC / SSE endpoints, discovers tools, and executes commands.
 */

export async function testAndFetchMcpTools(url: string): Promise<{ tools: McpTool[]; serverName?: string }> {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl) {
    throw new Error('MCP Server URL cannot be empty');
  }

  // Attempt JSON-RPC tool discovery via HTTP POST or GET fallback
  try {
    const response = await fetch(`${cleanUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'MCP JSON-RPC returned an error');
    }

    const toolsRaw = data.result?.tools || data.tools || [];
    const tools: McpTool[] = toolsRaw.map((t: any) => ({
      name: t.name || 'unnamed_tool',
      description: t.description || 'No description provided',
      inputSchema: t.inputSchema || t.parameters || { type: 'object', properties: {} },
    }));

    return {
      tools,
      serverName: data.result?.serverInfo?.name || cleanUrl,
    };
  } catch (err: any) {
    // If POST fails, try fallback GET /tools endpoint
    try {
      const getRes = await fetch(`${cleanUrl}/tools`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        const toolsRaw = getData.tools || getData.result?.tools || [];
        const tools: McpTool[] = toolsRaw.map((t: any) => ({
          name: t.name || 'unnamed_tool',
          description: t.description || '',
          inputSchema: t.inputSchema || { type: 'object' },
        }));
        return { tools, serverName: cleanUrl };
      }
    } catch {
      // Ignore fallback error and throw original error
    }

    throw new Error(err.message || 'Failed to connect to MCP server endpoint');
  }
}

export async function executeMcpTool(
  serverUrl: string,
  toolName: string,
  args: Record<string, any> = {}
): Promise<string> {
  const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
  
  const response = await fetch(`${cleanUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP Tool execution failed with status HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const result = data.result;
  if (!result) {
    return 'Tool executed successfully (No output returned).';
  }

  if (Array.isArray(result.content)) {
    return result.content
      .map((item: any) => {
        if (item.type === 'text') return item.text;
        if (item.type === 'resource') return JSON.stringify(item.resource, null, 2);
        return JSON.stringify(item);
      })
      .join('\n\n');
  }

  if (typeof result === 'string') return result;
  return JSON.stringify(result, null, 2);
}

export function formatMcpToolsForSystemPrompt(servers: McpServer[]): string {
  const activeServers = servers.filter(s => s.enabled && s.status === 'connected');
  if (activeServers.length === 0) return '';

  let prompt = `\n\n--- CONNECTED MCP SERVERS & TOOLS ---\n`;
  prompt += `You have access to external Model Context Protocol (MCP) server tools:\n\n`;

  for (const s of activeServers) {
    prompt += `Server [${s.name}] (${s.url}):\n`;
    for (const t of s.tools) {
      prompt += ` - Tool: \`${t.name}\`: ${t.description || 'No description'}\n`;
      if (t.inputSchema?.properties) {
        prompt += `   Params: ${JSON.stringify(t.inputSchema.properties)}\n`;
      }
    }
    prompt += `\n`;
  }

  prompt += `To invoke an MCP tool in your response, formatting instructions:\n`;
  prompt += `Use standard MCP format or call it directly in code.\n`;
  return prompt;
}
