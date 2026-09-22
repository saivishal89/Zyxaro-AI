export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  provider?: string;
  topic?: string;
  timestamp: number;
  liked?: boolean;
  disliked?: boolean;
  isImage?: boolean;
  isLcm?: boolean;
  ragSources?: string[];
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt?: number;
  pinned?: boolean;
  category?: 'chat' | 'project' | 'library' | 'images';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  savedAt: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  display: string;
  endpoint: string;
  defaultModel: string;
}

export interface RAGDocument {
  id: string;
  name: string;
  content: string;
  chunks: string[];
  addedAt: number;
  sizeBytes: number;
}

export interface McpToolParameter {
  type: string;
  description?: string;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, McpToolParameter>;
    required?: string[];
  };
}

export interface McpServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  errorMessage?: string;
  lastChecked?: number;
  tools: McpTool[];
}



