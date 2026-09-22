import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, Note, RAGDocument, McpServer } from './types';

interface ZyxaroContextType {
  sessions: Session[];
  setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void;
  togglePinSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  activeProviders: string[];
  setActiveProviders: (providers: string[]) => void;
  apiKeys: Record<string, string>;
  setApiKey: (provider: string, key: string) => void;
  customEndpoint: string;
  setCustomEndpoint: (url: string) => void;
  customModel: string;
  setCustomModel: (model: string) => void;
  isConfigOpen: boolean;
  setConfigOpen: (open: boolean) => void;

  // RAG Document Engine
  ragDocs: RAGDocument[];
  addRagDocument: (doc: RAGDocument) => void;
  deleteRagDocument: (id: string) => void;
  isRagEnabled: boolean;
  setIsRagEnabled: (val: boolean) => void;
  isRagOpen: boolean;
  setIsRagOpen: (open: boolean) => void;

  // MCP Server Engine
  mcpServers: McpServer[];
  addMcpServer: (server: McpServer) => void;
  updateMcpServer: (server: McpServer) => void;
  deleteMcpServer: (id: string) => void;
  toggleMcpServer: (id: string) => void;
  isMcpOpen: boolean;
  setIsMcpOpen: (open: boolean) => void;

  // UX & Optimization Modals
  isFaqOpen: boolean;
  setIsFaqOpen: (open: boolean) => void;
  isPrivacyOpen: boolean;
  setIsPrivacyOpen: (open: boolean) => void;
  isLeadershipOpen: boolean;
  setIsLeadershipOpen: (open: boolean) => void;
  isCaseStudiesOpen: boolean;
  setIsCaseStudiesOpen: (open: boolean) => void;

  // Developer API Key Modal
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: (open: boolean) => void;
}

export type ZarakiContextType = ZyxaroContextType;

const ZyxaroContext = createContext<ZyxaroContextType | undefined>(undefined);

export function ZyxaroProvider({ children }: { children: React.ReactNode }) {
  // Helpers for localstorage with fallback to zrk_
  const load = (primaryKey: string, fallbackKey: string, def: any) => {
    try {
      const val = localStorage.getItem(primaryKey) || localStorage.getItem(fallbackKey);
      return val ? JSON.parse(val) : def;
    } catch {
      return def;
    }
  };
  const save = (primaryKey: string, fallbackKey: string, val: any) => {
    const json = JSON.stringify(val);
    localStorage.setItem(primaryKey, json);
    localStorage.setItem(fallbackKey, json);
  };

  const [sessions, setSessionsState] = useState<Session[]>(() => load('zyx_sessions', 'zrk_sessions', []));
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [notes, setNotesState] = useState<Note[]>(() => load('zyx_notes', 'zrk_notes', []));
  const [activeProviders, setActiveProvidersState] = useState<string[]>(() => {
    let loaded = load('zyx_provs', 'zrk_provs', ['zaraki', 'omniroute']);
    if (!Array.isArray(loaded) || loaded.length === 0) {
      loaded = ['zaraki', 'omniroute'];
    }
    // Auto-inject zaraki if user has no working keyless provider
    const keylessProviders = ['zaraki', 'simulation', 'omniroute'];
    const hasKeyless = loaded.some((p: string) => keylessProviders.includes(p));
    if (!hasKeyless) {
      loaded = ['zaraki', ...loaded];
    }
    // Ensure zaraki is present for users upgrading from before API key system existed
    if (!loaded.includes('zaraki')) {
      loaded = ['zaraki', ...loaded];
    }
    return loaded;
  });
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [customEndpoint, setCustomEndpointState] = useState<string>(() => load('zyx_custep', 'zrk_custep', ''));
  const [customModel, setCustomModelState] = useState<string>(() => load('zyx_custmod', 'zrk_custmod', ''));
  const [isConfigOpen, setConfigOpen] = useState(false);

  // RAG Document Engine
  const [ragDocs, setRagDocsState] = useState<RAGDocument[]>(() => load('zyx_rag_docs', 'zrk_rag_docs', []));
  const [isRagEnabled, setIsRagEnabledState] = useState<boolean>(() => load('zyx_rag_enabled', 'zrk_rag_enabled', true));
  const [isRagOpen, setIsRagOpen] = useState(false);

  // MCP Server Engine
  const [mcpServers, setMcpServersState] = useState<McpServer[]>(() => load('zyx_mcp_servers', 'zrk_mcp_servers', []));
  const [isMcpOpen, setIsMcpOpen] = useState(false);

  // UX & Optimization Modals
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isLeadershipOpen, setIsLeadershipOpen] = useState(false);
  const [isCaseStudiesOpen, setIsCaseStudiesOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Load all keys on mount
  useEffect(() => {
    const keys: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('zyx_k_') || key.startsWith('zrk_k_'))) {
        const providerId = key.replace(/^(zyx|zrk)_k_/, '');
        try {
          keys[providerId] = JSON.parse(localStorage.getItem(key) || '""');
        } catch {
          keys[providerId] = localStorage.getItem(key) || '';
        }
      }
    }
    setApiKeys(keys);
  }, []);

  const setSessions = (action: Session[] | ((prev: Session[]) => Session[])) => {
    setSessionsState(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      const limited = next.slice(0, 50);
      save('zyx_sessions', 'zrk_sessions', limited);
      return limited;
    });
  };

  const togglePinSession = (id: string) => {
    setSessionsState(prev => {
      const next = prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s);
      save('zyx_sessions', 'zrk_sessions', next);
      return next;
    });
  };

  const renameSession = (id: string, newTitle: string) => {
    setSessionsState(prev => {
      const next = prev.map(s => s.id === id ? { ...s, title: newTitle } : s);
      save('zyx_sessions', 'zrk_sessions', next);
      return next;
    });
  };

  const setNotes = (newNotes: Note[]) => {
    setNotesState(newNotes);
    save('zyx_notes', 'zrk_notes', newNotes);
  };

  const setActiveProviders = (newProviders: string[]) => {
    setActiveProvidersState(newProviders);
    save('zyx_provs', 'zrk_provs', newProviders);
  };

  const setApiKey = (provider: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
    save(`zyx_k_${provider}`, `zrk_k_${provider}`, key);
  };

  const setCustomEndpoint = (url: string) => {
    setCustomEndpointState(url);
    save('zyx_custep', 'zrk_custep', url);
  };

  const setCustomModel = (model: string) => {
    setCustomModelState(model);
    save('zyx_custmod', 'zrk_custmod', model);
  };

  // RAG helpers
  const addRagDocument = (doc: RAGDocument) => {
    setRagDocsState(prev => {
      const next = [doc, ...prev];
      save('zyx_rag_docs', 'zrk_rag_docs', next);
      return next;
    });
  };

  const deleteRagDocument = (id: string) => {
    setRagDocsState(prev => {
      const next = prev.filter(d => d.id !== id);
      save('zyx_rag_docs', 'zrk_rag_docs', next);
      return next;
    });
  };

  const setIsRagEnabled = (val: boolean) => {
    setIsRagEnabledState(val);
    save('zyx_rag_enabled', 'zrk_rag_enabled', val);
  };

  // MCP Server Helpers
  const addMcpServer = (server: McpServer) => {
    setMcpServersState(prev => {
      const next = [server, ...prev];
      save('zyx_mcp_servers', 'zrk_mcp_servers', next);
      return next;
    });
  };

  const updateMcpServer = (server: McpServer) => {
    setMcpServersState(prev => {
      const next = prev.map(s => s.id === server.id ? server : s);
      save('zyx_mcp_servers', 'zrk_mcp_servers', next);
      return next;
    });
  };

  const deleteMcpServer = (id: string) => {
    setMcpServersState(prev => {
      const next = prev.filter(s => s.id !== id);
      save('zyx_mcp_servers', 'zrk_mcp_servers', next);
      return next;
    });
  };

  const toggleMcpServer = (id: string) => {
    setMcpServersState(prev => {
      const next = prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
      save('zyx_mcp_servers', 'zrk_mcp_servers', next);
      return next;
    });
  };

  return (
    <ZyxaroContext.Provider value={{
      sessions, setSessions,
      togglePinSession, renameSession,
      activeSessionId, setActiveSessionId,
      notes, setNotes,
      activeProviders, setActiveProviders,
      apiKeys, setApiKey,
      customEndpoint, setCustomEndpoint,
      customModel, setCustomModel,
      isConfigOpen, setConfigOpen,

      ragDocs, addRagDocument, deleteRagDocument,
      isRagEnabled, setIsRagEnabled,
      isRagOpen, setIsRagOpen,

      mcpServers, addMcpServer, updateMcpServer, deleteMcpServer, toggleMcpServer,
      isMcpOpen, setIsMcpOpen,

      isFaqOpen, setIsFaqOpen,
      isPrivacyOpen, setIsPrivacyOpen,
      isLeadershipOpen, setIsLeadershipOpen,
      isCaseStudiesOpen, setIsCaseStudiesOpen,
      isApiKeyModalOpen, setIsApiKeyModalOpen,
    }}>
      {children}
    </ZyxaroContext.Provider>
  );
}

export const ZarakiProvider = ZyxaroProvider;

export function useZyxaro() {
  const context = useContext(ZyxaroContext);
  if (context === undefined) {
    throw new Error('useZyxaro must be used within a ZyxaroProvider');
  }
  return context;
}

export const useZaraki = useZyxaro;



