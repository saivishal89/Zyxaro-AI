import { useEffect, useRef, useState } from 'react';
import { useZyxaro } from '@/lib/context';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import { ThinkingAnimation } from './ThinkingAnimation';
import { callProvider, detectTopic } from '@/lib/providers';
import { retrieveRagContext, buildRagSystemContext, sanitizeModelOutput } from '@/lib/ragEngine';
import { generateLcmImageUrl, compressContextWithLcm } from '@/lib/lcmEngine';
import { formatMcpToolsForSystemPrompt } from '@/lib/mcpEngine';
import { Message, Session } from '@/lib/types';
import { GlassIcons } from './GlassIcons';
import { FiCpu, FiLayers, FiTerminal, FiBookOpen, FiBarChart2, FiShield } from 'react-icons/fi';
import { extractUrlsFromText, fetchUrlContent } from '@/lib/mcpClient';

function generateSmartTitle(prompt: string): string {
  const clean = prompt.replace(/https?:\/\/[^\s]+/gi, '').replace(/[^\w\s]/gi, '').trim();
  if (!clean) return 'Web Analysis';
  const words = clean.split(/\s+/).slice(0, 4);
  const title = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return title.length > 28 ? title.substring(0, 28) + '...' : title;
}

export function ChatArea() {
  const { 
    sessions, setSessions, 
    activeSessionId, setActiveSessionId,
    activeProviders, apiKeys,
    customEndpoint, customModel,
    setConfigOpen,
    setIsRagOpen,
    ragDocs, isRagEnabled,
    mcpServers
  } = useZyxaro();

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = async (text: string, files: any[]) => {
    if (!text.trim() && files.length === 0) return;

    // 1. Synchronously resolve persistent session ID to prevent duplicate session creation
    let targetSessionId = activeSessionId;
    let initialTitle = activeSession?.title;

    if (!targetSessionId) {
      targetSessionId = `sess_${Date.now()}`;
      initialTitle = generateSmartTitle(text);
      const newSession: Session = {
        id: targetSessionId,
        title: initialTitle,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(targetSessionId);
    } else if (!initialTitle || initialTitle === 'New Chat') {
      initialTitle = generateSmartTitle(text);
    }

    const currentSessionId = targetSessionId;

    // Reliable functional updater for currentSessionId messages
    const updateSessionMessages = (msgs: Message[], titleOverride?: string) => {
      setSessions((prev: Session[]) => {
        const exists = prev.some((s: Session) => s.id === currentSessionId);
        if (!exists) {
          return [{
            id: currentSessionId,
            title: titleOverride || initialTitle || generateSmartTitle(text),
            messages: msgs,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }, ...prev];
        }
        return prev.map((s: Session) => {
          if (s.id === currentSessionId) {
            const finalTitle = s.title === 'New Chat' || !s.title ? (titleOverride || generateSmartTitle(text)) : s.title;
            return {
              ...s,
              title: finalTitle,
              messages: msgs,
              updatedAt: Date.now()
            };
          }
          return s;
        });
      });
    };

    // PRIMARY FIX: Separate userText, ragContext, and ragSources
    let userText = text;
    if (files.length > 0) {
      const fileContext = files.map(f => `[Attached File: ${f.name}]\n${f.content}\n`).join('\n\n');
      userText = `Context files:\n${fileContext}\n\nUser prompt:\n${text}`;
    }

    // Check RAG context retrieval - kept strictly separate from userText
    let ragContext = '';
    let ragSources: string[] = [];
    if (isRagEnabled && ragDocs.length > 0 && !text.startsWith('/')) {
      const matches = retrieveRagContext(text, ragDocs, 4);
      if (matches.length > 0) {
        const ragData = buildRagSystemContext(matches);
        ragContext = ragData.ragContext;
        ragSources = ragData.sources;
      }
    }

    // MCP Server Tools Context for system grounding
    const mcpPrompt = formatMcpToolsForSystemPrompt(mcpServers);

    const topic = detectTopic(text);
    const userMsgId = `msg_${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: userText, // Clean user question ONLY
      topic,
      timestamp: Date.now(),
      ragSources: ragSources.length > 0 ? ragSources : undefined
    };

    const newMessages = [...messages, userMsg];
    updateSessionMessages(newMessages, initialTitle);

    // Fast LCM Image Generation command
    if (text.toLowerCase().startsWith('/lcm ')) {
      const prompt = text.substring(5);
      const url = generateLcmImageUrl(prompt, 'flux');
      setIsGenerating(true);
      setTimeout(() => {
        const lcmMsg: Message = {
          id: `msg_lcm_${Date.now()}`,
          role: 'assistant',
          content: url,
          isImage: true,
          isLcm: true,
          topic: 'LCM_GEN',
          timestamp: Date.now()
        };
        updateSessionMessages([...newMessages, lcmMsg]);
        setIsGenerating(false);
      }, 1200);
      return;
    }

    // Standard Image generation path (/image)
    if (text.toLowerCase().startsWith('/image ')) {
      const prompt = text.substring(7);
      const url = generateLcmImageUrl(prompt, 'flux');
      
      setIsGenerating(true);
      setTimeout(() => {
        const imgMsg: Message = {
          id: `msg_img_${Date.now()}`,
          role: 'assistant',
          content: url,
          isImage: true,
          topic: 'IMAGE',
          timestamp: Date.now()
        };
        updateSessionMessages([...newMessages, imgMsg]);
        setIsGenerating(false);
      }, 1500);
      return;
    }

    // Standard AI path
    if (activeProviders.length === 0) {
      const warnMsg: Message = {
        id: `msg_warn_${Date.now()}`,
        role: 'assistant',
        content: "Error: No AI provider active. Please click ⚙ Config to add one, or enable SIMULATION.",
        timestamp: Date.now()
      };
      updateSessionMessages([...newMessages, warnMsg]);
      return;
    }

    setIsGenerating(true);

    // LCM Context Compression optimization for payload
    const payloadMessages = compressContextWithLcm(newMessages, 8000);

    // Invisible Automatic Web URL Analysis
    const urlsInPrompt = extractUrlsFromText(text);
    if (urlsInPrompt.length > 0) {
      const targetUrl = urlsInPrompt[0];
      setStatusText(`⚡ Fetching & Analyzing ${targetUrl.replace(/^https?:\/\//, '').split('/')[0]}...`);
      try {
        const webResult = await fetchUrlContent(targetUrl);

        if (webResult.success && webResult.content) {
          const webContextPrefix = `[Automatic Web Content Retrieved from ${targetUrl}]\nTitle: ${webResult.title || ''}\n\n${webResult.content}\n[End of Web Content]\n\n`;
          const lastMsg = payloadMessages[payloadMessages.length - 1];
          if (lastMsg && lastMsg.role === 'user') {
            lastMsg.content = `${webContextPrefix}${lastMsg.content}`;
          }
        }
      } catch (err) {
        console.warn('Automatic web fetch skipped:', err);
      } finally {
        setStatusText(null);
      }
    }

    const primaryProvider = activeProviders[0] || 'simulation';
    const key = apiKeys[primaryProvider] || (primaryProvider === 'zaraki' || primaryProvider === 'omniroute' ? apiKeys['zaraki'] || apiKeys['omniroute'] : '') || '';

    setIsGenerating(true);

    try {
      const res = await callProvider(primaryProvider, payloadMessages, {
        apiKey: key,
        customEndpoint,
        customModel,
        ragContext,
        mcpPrompt,
        citations: ragSources
      });

      const cleanAnswer = sanitizeModelOutput(res.content || '');
      const fullOutput = res.error || cleanAnswer || 'No response returned.';
      
      // Create assistant message once response is fetched
      const aiMsgId = `msg_${Date.now()}_${primaryProvider}`;
      const initialAiMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        provider: primaryProvider,
        topic,
        timestamp: Date.now(),
        ragSources: res.citations && res.citations.length > 0 ? res.citations : (ragSources.length > 0 ? ragSources : undefined)
      };

      let currentMessages = [...newMessages, initialAiMsg];
      updateSessionMessages(currentMessages);

      // Fast stream output (100 characters per 10ms)
      const chunkSize = 100;
      let revealedLength = 0;

      const streamTimer = setInterval(() => {
        revealedLength = Math.min(revealedLength + chunkSize, fullOutput.length);
        const partialText = fullOutput.substring(0, revealedLength);

        currentMessages = currentMessages.map(m => 
          m.id === aiMsgId ? { ...m, content: partialText } : m
        );
        updateSessionMessages(currentMessages);

        if (revealedLength >= fullOutput.length) {
          clearInterval(streamTimer);
          setIsGenerating(false);
        }
      }, 10);

    } catch (err) {
      setIsGenerating(false);
    }
  };

  const handleRetry = (msgId: string) => {
    const idx = messages.findIndex(m => m.id === msgId);
    if (idx <= 0) return;
    
    let userMsgIdx = -1;
    for (let i = idx; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsgIdx = i;
        break;
      }
    }
    
    if (userMsgIdx === -1) return;
    
    const userMsg = messages[userMsgIdx];
    const historyToKeep = messages.slice(0, userMsgIdx);
    
    if (activeSessionId) {
      setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, messages: historyToKeep } : s));
    }
    handleSend(userMsg.content, []);
  };

  const handleLike = (id: string, state: boolean) => {
    const updated = messages.map(m => m.id === id ? { ...m, liked: state, disliked: false } : m);
    if (activeSessionId) {
      setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, messages: updated } : s));
    }
  };

  const handleDislike = (id: string, state: boolean) => {
    const updated = messages.map(m => m.id === id ? { ...m, disliked: state, liked: false } : m);
    if (activeSessionId) {
      setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, messages: updated } : s));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
      {/* Scrollable messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/40 flex items-center justify-center mb-4 text-blue-400 shadow-xl">
              <span className="text-2xl">⚡</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4 glow-text tracking-widest">
              ZYXARO
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md text-sm leading-relaxed">
              Student AI Agent with live code sandbox, automatic web scraping, and RAG document intelligence.
            </p>

            {/* GlassIcons — quick-access shortcuts */}
            <div className="mb-8 flex justify-center">
              <GlassIcons items={[
                { icon: <FiCpu />,       color: 'blue',   label: 'Summarize',  onClick: () => handleSend("Summarize the key trends in AI research for 2025.", []) },
                { icon: <FiTerminal />,  color: 'cyan',   label: 'Code',       onClick: () => handleSend("Write a robust React hook for debounced API calls.", []) },
                { icon: <FiBookOpen />,  color: 'green',  label: 'RAG Search', onClick: () => setIsRagOpen(true) },
                { icon: <FiLayers />,    color: 'purple', label: 'PDF Analysis', onClick: () => setIsRagOpen(true) },
                { icon: <FiBarChart2 />, color: 'orange', label: 'Analyse',    onClick: () => handleSend("Analyse microservices vs monolith architecture.", []) },
                { icon: <FiShield />,    color: 'indigo', label: 'Config',     onClick: () => setConfigOpen(true) },
              ]} />
            </div>

          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto">
            {messages.map(msg => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onRetry={() => handleRetry(msg.id)}
                onLike={handleLike}
                onDislike={handleDislike}
              />
            ))}
            
            {statusText && (
              <div className="mb-4 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono animate-pulse w-max mx-auto shadow-md">
                <span>{statusText}</span>
              </div>
            )}

            {isGenerating && (
              <div className="mb-8">
                <ThinkingAnimation />
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-transparent border-t-0">
        <div className="max-w-4xl mx-auto">
          <InputBar onSend={handleSend} isGenerating={isGenerating} />
        </div>
      </div>
    </div>
  );
}
