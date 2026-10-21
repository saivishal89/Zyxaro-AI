import { useState, useEffect } from 'react';
import { useZyxaro } from '@/lib/context';
import { 
  Key, X, Plus, Copy, Check, Shield, AlertTriangle, RefreshCw, 
  Trash2, Terminal, ExternalLink, Zap, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface ApiKeyItem {
  id: string;
  key_id: string;
  name: string;
  prefix: string;
  last4: string;
  environment: 'live' | 'test';
  scopes: string[];
  is_active: boolean;
  rate_limit_rpm: number;
  monthly_quota: number;
  request_count: number;
  created_at: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
}

export function ApiKeyModal() {
  const { isApiKeyModalOpen, setIsApiKeyModalOpen } = useZyxaro();
  const { toast } = useToast();

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create Form State
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [scopes, setScopes] = useState<string[]>(['chat', 'research']);
  const [rateLimit, setRateLimit] = useState(60);
  const [quota, setQuota] = useState(10000);
  const [creatingLoading, setCreatingLoading] = useState(false);

  // Newly Created Key (Shown Only Once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Load keys on open
  useEffect(() => {
    if (isApiKeyModalOpen) {
      fetchKeys();
    } else {
      setIsCreating(false);
      setNewlyCreatedKey(null);
    }
  }, [isApiKeyModalOpen]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/keys`);
      if (resp.ok) {
        const data = await resp.json();
        setKeys(data);
      } else {
        toast({
          title: 'Error loading keys',
          description: 'Unable to reach the Zaraki API Gateway service.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Backend offline',
        description: 'Unable to connect to the Zaraki API Gateway.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreatingLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          environment,
          scopes,
          rate_limit_rpm: rateLimit,
          monthly_quota: quota,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setNewlyCreatedKey(data.key);
        setIsCreating(false);
        setName('');
        fetchKeys();
        toast({
          title: 'API Key Created',
          description: 'Save your secret now. It will never be displayed again.',
        });
      } else {
        const err = await resp.json();
        toast({
          title: 'Creation Failed',
          description: err?.detail?.error?.message || 'Failed to generate API key.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleRevoke = async (id: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke the key "${keyName}"? Applications using it will immediately be rejected.`)) {
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/keys/${id}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        toast({
          title: 'Key Revoked',
          description: `Key "${keyName}" has been deactivated.`,
        });
        fetchKeys();
      }
    } catch {
      toast({
        title: 'Revocation Failed',
        description: 'Could not contact the Zaraki Backend.',
        variant: 'destructive',
      });
    }
  };

  const handleRotate = async (id: string, keyName: string) => {
    if (!confirm(`Rotate key "${keyName}"? The old secret will be revoked immediately, and a new one will be generated.`)) {
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/keys/${id}/rotate`, {
        method: 'POST',
      });
      if (resp.ok) {
        const data = await resp.json();
        setNewlyCreatedKey(data.key);
        fetchKeys();
        toast({
          title: 'Key Rotated Successfully',
          description: 'Copy your replacement secret now.',
        });
      }
    } catch {
      toast({
        title: 'Rotation Failed',
        description: 'Could not contact the Zaraki Backend.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
    toast({
      title: 'Copied to clipboard',
      description: 'API key ready to paste into your app.',
    });
  };

  const toggleScope = (scope: string) => {
    setScopes(prev => 
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  if (!isApiKeyModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#03081A] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070F2B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-100 tracking-wider">
                  ZARAKI DEVELOPER API KEYS
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  AI Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Issue and manage secure keys (<span className="font-mono text-blue-300">zk_live_...</span> / <span className="font-mono text-amber-300">zk_test_...</span>) for your applications.
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsApiKeyModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Secret Reveal Banner (Shown Only Once) */}
        {newlyCreatedKey && (
          <div className="bg-gradient-to-r from-amber-500/15 to-blue-500/15 border-b border-amber-500/30 p-4 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-amber-300">API Key Created Successfully</h4>
                  <span className="text-[11px] font-medium text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Shown Only Once
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Please copy your secret key right now. For security, Zaraki hashes secrets using salted PBKDF2 and <strong>will never show it to you again</strong>.
                </p>
                <div className="mt-2 flex items-center gap-2 bg-black/60 border border-amber-500/40 rounded-xl p-2 font-mono text-xs text-white">
                  <span className="flex-1 truncate select-all">{newlyCreatedKey}</span>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-sans transition-all active:scale-95"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setNewlyCreatedKey(null)}
                className="text-slate-400 hover:text-white p-1"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Keys ({keys.length})
              </span>
              <button 
                onClick={fetchKeys}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 border border-blue-400/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create API Key</span>
              </button>
            )}
          </div>

          {/* Create Key Wizard */}
          {isCreating && (
            <form onSubmit={handleCreate} className="bg-white/[0.03] border border-blue-500/30 rounded-xl p-5 space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  Create New API Key
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Research App, Production Server"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Environment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEnvironment('live')}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        environment === 'live'
                          ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                          : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      🚀 Live (<span className="font-mono">zk_live_</span>)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvironment('test')}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        environment === 'test'
                          ? 'bg-amber-500/30 border-amber-500 text-amber-200'
                          : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      🧪 Test (<span className="font-mono">zk_test_</span>)
                    </button>
                  </div>
                </div>
              </div>

              {/* Scopes */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Authorized Scopes
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'chat', label: 'chat (AI Completions)', desc: 'Access /api/v1/chat' },
                    { id: 'research', label: 'research (Multi-Model)', desc: 'Parallel research tools' },
                    { id: 'documents', label: 'documents (RAG/Files)', desc: 'Knowledge embeddings' },
                  ].map(sc => (
                    <button
                      type="button"
                      key={sc.id}
                      onClick={() => toggleScope(sc.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        scopes.includes(sc.id)
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${scopes.includes(sc.id) ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span>{sc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Rate Limit (Requests/Min)
                  </label>
                  <select
                    value={rateLimit}
                    onChange={e => setRateLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={30}>30 req / min (Sandbox)</option>
                    <option value={60}>60 req / min (Standard)</option>
                    <option value={120}>120 req / min (High throughput)</option>
                    <option value={300}>300 req / min (Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Monthly Quota
                  </label>
                  <select
                    value={quota}
                    onChange={e => setQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1000}>1,000 requests/mo</option>
                    <option value={10000}>10,000 requests/mo</option>
                    <option value={50000}>50,000 requests/mo</option>
                    <option value={200000}>200,000 requests/mo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLoading}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  {creatingLoading ? 'Generating...' : 'Create Key'}
                </button>
              </div>
            </form>
          )}

          {/* Keys Table */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-mono">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Prefix / ID</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {loading ? 'Loading API keys...' : 'No API keys created yet. Click "Create API Key" above to generate one.'}
                    </td>
                  </tr>
                ) : (
                  keys.map(k => (
                    <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{k.name}</div>
                        <div className="text-[10px] text-slate-500 flex gap-1 mt-0.5">
                          {k.scopes.map(s => (
                            <span key={s} className="bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        <span className="text-blue-400">{k.prefix}</span>
                        <span className="text-slate-500">_...{k.last4}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          k.environment === 'live' 
                            ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300' 
                            : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                        }`}>
                          {k.environment}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {k.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Revoked
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <div>{k.request_count.toLocaleString()} / {k.monthly_quota.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">{k.rate_limit_rpm} rpm</div>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {formatDistanceToNow(new Date(k.created_at), { addSuffix: true })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {k.is_active ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleRotate(k.id, k.name)}
                              className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-blue-300 transition-colors"
                              title="Rotate Key (Revoke old & issue new secret)"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRevoke(k.id, k.name)}
                              className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Deactivated</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Integration Guide */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Terminal className="w-4 h-4 text-blue-400" />
              Quick Integration: Call Zaraki AI Gateway
            </div>
            <p className="text-[11px] text-slate-400">
              Authenticate via standard HTTP header <code className="text-blue-300">Authorization: Bearer zk_live_...</code> or <code className="text-blue-300">X-Zaraki-Key: zk_live_...</code>
            </p>
            <pre className="p-3 bg-black/60 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto border border-white/5">
{`curl -X POST http://localhost:3001/api/v1/chat \\
  -H "Authorization: Bearer zk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "zaraki-auto",
    "messages": [
      {"role": "user", "content": "Explain quantum computing simply"}
    ]
  }'`}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
}
