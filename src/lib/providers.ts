import { ProviderConfig } from './types';
import { sanitizeModelOutput } from './ragEngine';

export const PROVIDERS: ProviderConfig[] = [
  { id: 'zaraki', name: 'ZARAKI AI', display: '⚡ ZARAKI AI (Built-in Gateway)', endpoint: '/api/v1/chat', defaultModel: 'auto' },
  { id: 'omniroute', name: 'OMNIROUTE', display: '🚀 OMNIROUTE (Free Gateway)', endpoint: '/api/ai/chat', defaultModel: 'auto' },
  { id: 'simulation', name: 'SIMULATION', display: 'Built-in', endpoint: '', defaultModel: '' },
  { id: 'featherless', name: 'FEATHERLESS', display: '⚡ FEATHERLESS', endpoint: 'https://api.featherless.ai/v1/chat/completions', defaultModel: 'Qwen/Qwen2.5-72B-Instruct' },
  { id: 'openai', name: 'OPENAI', display: 'OPENAI', endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o' },
  { id: 'anthropic', name: 'ANTHROPIC', display: 'ANTHROPIC', endpoint: 'https://api.anthropic.com/v1/messages', defaultModel: 'claude-sonnet-4-20250514' },
  { id: 'deepseek', name: 'DEEPSEEK', display: 'DEEPSEEK', endpoint: 'https://api.deepseek.com/chat/completions', defaultModel: 'deepseek-chat' },
  { id: 'groq', name: 'GROQ', display: 'GROQ', endpoint: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'mistral', name: 'MISTRAL', display: 'MISTRAL', endpoint: 'https://api.mistral.ai/v1/chat/completions', defaultModel: 'mistral-large-latest' },
  { id: 'openrouter', name: 'OPENROUTER', display: 'OPENROUTER', endpoint: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: 'google/gemini-2.5-flash' },
  { id: 'gemini', name: 'GEMINI', display: 'GEMINI', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', defaultModel: 'gemini-2.5-flash' },
  { id: 'cohere', name: 'COHERE', display: 'COHERE', endpoint: 'https://api.cohere.ai/compatibility/v1/chat/completions', defaultModel: 'command-r-plus' },
  { id: 'together', name: 'TOGETHER AI', display: 'TOGETHER AI', endpoint: 'https://api.together.xyz/v1/chat/completions', defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
  { id: 'perplexity', name: 'PERPLEXITY', display: 'PERPLEXITY', endpoint: 'https://api.perplexity.ai/chat/completions', defaultModel: 'sonar' },
  { id: 'xai', name: 'XAI / GROK', display: 'XAI / GROK', endpoint: 'https://api.x.ai/v1/chat/completions', defaultModel: 'grok-3' },
  { id: 'custom', name: 'CUSTOM URL', display: 'CUSTOM URL', endpoint: '', defaultModel: '' },
];

export const SYSTEM_PROMPT = `You are ZYXARO AI, an elite deep-reasoning research assistant built for students and researchers. You produce CORRECT, VERIFIED, and ACCURATE responses. You NEVER hallucinate, fabricate code, or return unverified information.

CRITICAL ACCURACY RULES (NEVER VIOLATE):
1. CORRECTNESS FIRST:
   - Before writing ANY code, verify the logic is mathematically/algorithmically sound.
   - NEVER generate code that looks plausible but is actually wrong. If unsure, state your uncertainty.
   - For math/science: Use correct formulas, units, and derivations. Double-check every equation.
   - For code: Ensure the code actually runs correctly. Test edge cases mentally before outputting.
   - If a user's code has bugs, identify and explain every bug clearly before providing the fix.
2. STEP-BY-STEP DEEP REASONING:
   - Break down complex topics into first principles.
   - Analyze mechanics, trade-offs, underlying logic, edge cases, and practical applications.
   - For DSA/System Design/Science: Provide structured walkthroughs with execution steps and complexity analysis.
3. HONESTY OVER CONFIDENCE:
   - If you don't know something or aren't certain, say so explicitly. Never bluff.
   - Distinguish between facts, educated guesses, and opinions.
4. OUTPUT STRUCTURE:
   - Use clear ## section headers (NO === or --- underlines).
   - Use **bold** for key concepts.
   - Provide complete, runnable, TESTED code examples with explanatory comments.
   - When fixing user code, show a diff or clearly mark what changed and WHY.`;

export function detectTopic(content: string): string {
  const text = content.toLowerCase();
  
  if (/(physics|chemistry|biology|quantum|dna|space|galaxy|atom)/.test(text)) return 'SCIENCE';
  if (/(ai|ml|software|code|programming|computer|cyber|algorithm|dsa|tree|graph)/.test(text)) return 'TECH';
  if (/(history|ancient|war|empire|century|revolution|dynasty)/.test(text)) return 'HISTORY';
  if (/(finance|stock|market|crypto|bitcoin|investment|trading)/.test(text)) return 'FINANCE';
  if (/(health|medical|medicine|disease|brain|treatment|therapy)/.test(text)) return 'HEALTH';
  if (/(data|scraping|web|proxy|crawl|extract|database)/.test(text)) return 'DATA';
  
  return 'RESEARCH';
}

/**
 * Generate simulated deep reasoning response when live API key is pending
 */
function generateSimulatedReasoning(userPrompt: string): string {
  const cleanPrompt = sanitizeModelOutput(userPrompt).substring(0, 100);
  const isDsa = /(dsa|algorithm|data structure|tree|graph|sorting|workflow)/i.test(cleanPrompt);

  if (isDsa) {
    return `## 🧠 Deep Reasoning & Algorithmic Analysis

### 1. Problem Deconstruction
Analyzing: "${cleanPrompt}"

When approaching Data Structures & Algorithms (DSA) workflows, we break down problem solving into 5 foundational phases:

1. **Problem Comprehension & Constraint Analysis**: Identifying input bounds ($N \\le 10^5$), space limits, and edge cases (empty input, duplicate keys).
2. **Data Structure Selection**: Choosing optimal memory layouts:
   - **Arrays/Vectors**: $O(1)$ random access, $O(N)$ insertion.
   - **Hash Maps**: $O(1)$ expected lookup/insertion.
   - **Trees/Heaps**: $O(\\log N)$ hierarchical order & priority operations.
   - **Graphs**: $O(V + E)$ topological traversal & shortest path algorithms.
3. **Algorithm Design & Strategy**: Evaluating Greedy, Dynamic Programming, Two-Pointers, Divide & Conquer, or Sliding Window.
4. **Complexity Verification**:
   - Time Complexity: Target $O(N \\log N)$ or $O(N)$ for large inputs.
   - Auxiliary Space Complexity: Optimizing $O(N)$ down to $O(1)$ when in-place transformation is viable.
5. **Implementation & Edge-Case Testing**.

---

## ⚡ Recommended Action
To run this query through live **DeepSeek-R1 / GPT-4o / Claude 3.5**, open **⚙ Config** in the header and add your API key!`;
  }

  return `## 🧠 Deep Reasoning & Logical Analysis

### 1. First-Principles Deconstruction
Analyzing query: "${cleanPrompt}"

- **Core Objective**: Identify underlying constraints, mechanics, and optimal strategies.
- **Analytical Trade-offs**: Evaluating performance, complexity, and maintainability.
- **Synthesis**: Structuring a comprehensive solution backed by logical proof and step-by-step breakdown.

---

## ⚡ Live Model Connection
To run live multi-step deep reasoning models (DeepSeek-R1, Gemini 2.0 Flash, GPT-4o), click **⚙ Config** to add an API key!`;
}

/**
 * Strip reasoning/thinking tags from model output (DeepSeek-R1, etc.)
 * These models wrap internal chain-of-thought in <think>...</think> tags
 * which should not be shown to the user.
 */
function stripReasoningTags(text: string): string {
  // Remove <think>...</think> blocks (can be multi-line)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove any stray unclosed <think> tags (partial streaming)
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');
  // Clean up leading whitespace/newlines left behind
  return cleaned.replace(/^\s*\n+/, '').trim();
}

export async function callProvider(
  providerId: string, 
  messages: any[], 
  config: { 
    apiKey: string; 
    customEndpoint?: string; 
    customModel?: string;
    ragContext?: string;
    mcpPrompt?: string;
    citations?: string[];
  }
): Promise<{content: string; citations?: string[]; error?: string}> {
  const provider = PROVIDERS.find(p => p.id === providerId);
  if (!provider) return { content: '', error: 'Unknown provider' };

  // Construct internal grounding system prompt
  let effectiveSystemPrompt = SYSTEM_PROMPT;
  if (config.ragContext) {
    effectiveSystemPrompt = `${effectiveSystemPrompt}\n\n${config.ragContext}`;
  }
  if (config.mcpPrompt) {
    effectiveSystemPrompt = `${effectiveSystemPrompt}\n\n${config.mcpPrompt}`;
  }

  // Filter out any prior system messages so system grounding is unified and clean
  const cleanUserMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  const lastUserMsg = [...cleanUserMessages].reverse().find(m => m.role === 'user')?.content || '';

  if (providerId === 'simulation') {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ 
          content: sanitizeModelOutput(generateSimulatedReasoning(lastUserMsg)),
          citations: config.citations || []
        });
      }, 1200);
    });
  }

  // Zaraki AI Gateway — uses backend proxy
  // When a Zaraki API key (zk_live_* / zk_test_*) is configured, route through
  // the authenticated /api/v1/chat endpoint. Otherwise fall back to the free
  // unauthenticated /api/ai/chat endpoint for backward compatibility.
  if (providerId === 'zaraki' || providerId === 'omniroute') {
    let zarakiKey = (config.apiKey || '').trim();
    if (!zarakiKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('zrk_k_zaraki') || localStorage.getItem('zyx_k_zaraki') || '';
        zarakiKey = (stored.startsWith('"') ? JSON.parse(stored) : stored).trim();
      } catch {
        // ignore JSON parse error
      }
    }
    const hasZarakiKey = /^zk_(live|test)_/i.test(zarakiKey);

    try {
      let resp: Response;

      if (hasZarakiKey) {
        // ── Authenticated Zaraki API Key flow (/api/v1/chat) ──
        resp = await fetch('/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${zarakiKey.trim()}`
          },
          body: JSON.stringify({
            model: config.customModel || 'zaraki-auto',
            messages: [
              { role: 'system', content: effectiveSystemPrompt },
              ...cleanUserMessages
            ],
            temperature: 0.3,
            max_tokens: 4096
          })
        });

        if (!resp.ok) {
          if (resp.status === 401) return { content: '', error: '❌ Invalid Zaraki API key. Open ⚙ Config and check your zk_live_* key, or generate a new one in Developer API Keys.' };
          if (resp.status === 403) return { content: '', error: '🔒 Your Zaraki API key lacks the required "chat" scope or has been deactivated. Regenerate a key in Developer API Keys.' };
          if (resp.status === 429) return { content: '', error: '⏳ Rate limit or monthly quota exceeded for your Zaraki API key. Wait or upgrade your quota.' };
          const errBody = await resp.text().catch(() => '');
          return { content: '', error: `Zaraki Gateway error HTTP ${resp.status}: ${errBody.substring(0, 200)}` };
        }

        const data = await resp.json();
        if (data.error) {
          return { content: '', error: `Zaraki Gateway: ${data.error.message || data.error}` };
        }

        // Authenticated endpoint returns OpenAI-compatible format
        const rawContent = data.choices?.[0]?.message?.content || data.response || data.answer || '';
        const cleanContent = sanitizeModelOutput(stripReasoningTags(rawContent));

        return {
          content: cleanContent,
          citations: config.citations || []
        };
      } else {
        // ── Free unauthenticated fallback (/api/ai/chat) ──
        resp = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: lastUserMsg,
            messages: [
              { role: 'system', content: effectiveSystemPrompt },
              ...cleanUserMessages
            ],
            model: config.customModel || 'auto',
            citations: config.citations || []
          })
        });

        if (!resp.ok) {
          return { content: '', error: `Zaraki Gateway error HTTP ${resp.status}. Ensure backend is online.` };
        }

        const data = await resp.json();
        if (data.error) {
          return { content: '', error: `Zaraki Gateway: ${data.error}` };
        }

        const rawAnswer = data.response || data.answer || data.text || '';
        const cleanAnswer = sanitizeModelOutput(stripReasoningTags(rawAnswer));
        const finalCitations = data.citations || config.citations || [];

        return {
          content: cleanAnswer,
          citations: finalCitations
        };
      }
    } catch (err: any) {
      return {
        content: '',
        error: '⚠️ Cannot connect to Zaraki Backend API Gateway. Please verify the server is running.'
      };
    }
  }

  const endpoint = providerId === 'custom' ? config.customEndpoint : provider.endpoint;
  const model = providerId === 'custom' ? config.customModel : provider.defaultModel;

  if (!endpoint) return { content: '', error: 'Endpoint missing' };

  // 60-second timeout to prevent infinite hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    let response;
    
    if (providerId === 'anthropic') {
      response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerously-allow-browser': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          system: effectiveSystemPrompt,
          messages: cleanUserMessages.map(m => ({ role: m.role, content: m.content })),
          max_tokens: 4096
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) return { content: '', error: `❌ Invalid API key for ${provider.name}. Check your key in ⚙ Config.` };
        if (response.status === 403) return { content: '', error: `🔒 Access denied for ${provider.name}. Your API key may not have permission for model "${model}".` };
        if (response.status === 404) return { content: '', error: `⚠️ Model "${model}" not found on ${provider.name}. The model may have been deprecated or the ID is incorrect.` };
        if (response.status === 429) return { content: '', error: `⏳ Rate limit reached for ${provider.name}. Wait a moment and retry.` };
        const errBody = await response.text().catch(() => '');
        return { content: '', error: `Error ${response.status} from ${provider.name}: ${errBody.substring(0, 200)}` };
      }
      
      const data = await response.json();
      const rawText = data.content?.[0]?.text || '';
      return { 
        content: sanitizeModelOutput(stripReasoningTags(rawText)),
        citations: config.citations || []
      };
    } else {
      // Standard OpenAI format
      response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: effectiveSystemPrompt },
            ...cleanUserMessages.map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: 0.3,
          max_tokens: 4096,
          stream: false
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) return { content: '', error: `❌ Invalid API key for ${provider.name}. Check your key in ⚙ Config.` };
        if (response.status === 403) return { content: '', error: `🔒 Access denied for ${provider.name}. Your API key may not have permission for model "${model}".` };
        if (response.status === 404) return { content: '', error: `⚠️ Model "${model}" not found on ${provider.name}. The model may have been deprecated or the ID is incorrect.` };
        if (response.status === 429) return { content: '', error: `⏳ Rate limit reached for ${provider.name}. Wait a moment and retry.` };
        const errBody = await response.text().catch(() => '');
        return { content: '', error: `Error ${response.status} from ${provider.name}: ${errBody.substring(0, 200)}` };
      }
      
      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '';
      return { 
        content: sanitizeModelOutput(stripReasoningTags(rawContent)),
        citations: config.citations || []
      };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { content: '', error: `Request timed out for ${provider.name}. Try a faster model.` };
    }
    return { content: '', error: `Connection error for ${provider.name}` };
  } finally {
    clearTimeout(timeoutId);
  }
}

