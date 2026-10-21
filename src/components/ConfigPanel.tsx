import { useState, useEffect } from 'react';
import { useZyxaro } from '@/lib/context';
import { PROVIDERS } from '@/lib/providers';
import { X, Eye, EyeOff, Save, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Stepper, Step } from './Stepper';

export function ConfigPanel() {
  const { 
    isConfigOpen, setConfigOpen,
    activeProviders, setActiveProviders,
    apiKeys, setApiKey,
    customEndpoint, setCustomEndpoint,
    customModel, setCustomModel,
    setIsApiKeyModalOpen
  } = useZyxaro();
  
  const { toast } = useToast();

  const [localActive, setLocalActive] = useState<string[]>([]);
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [localEp, setLocalEp] = useState('');
  const [localMod, setLocalMod] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Sync state when opened
  useEffect(() => {
    if (isConfigOpen) {
      setLocalActive([...activeProviders]);
      setLocalKeys({ ...apiKeys });
      setLocalEp(customEndpoint);
      setLocalMod(customModel);
    }
  }, [isConfigOpen, activeProviders, apiKeys, customEndpoint, customModel]);

  const toggleProvider = (id: string) => {
    setLocalActive(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    // Only keep providers that are simulation, omniroute, or have a key, or custom has an endpoint
    const validProviders = localActive.filter(id => {
      if (id === 'simulation' || id === 'omniroute' || id === 'zaraki') return true;
      if (id === 'custom') return localEp.trim() !== '';
      return (localKeys[id] && localKeys[id].trim() !== '');
    });

    setActiveProviders(validProviders);
    
    // Save keys
    Object.entries(localKeys).forEach(([id, key]) => {
      setApiKey(id, key);
    });
    
    setCustomEndpoint(localEp);
    setCustomModel(localMod);
    setConfigOpen(false);

    toast({
      title: "Configuration Saved",
      description: `Active providers: ${validProviders.map(p => PROVIDERS.find(x => x.id === p)?.name || p).join(', ') || 'None'}`,
      duration: 3000,
    });
  };

  if (!isConfigOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => setConfigOpen(false)}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-[#03081A] border-l border-primary/20 shadow-[0_0_50px_rgba(96,165,250,0.1)] flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">API Configuration</h2>
            <p className="text-xs text-muted-foreground mt-1">Keys are stored locally in your browser.</p>
          </div>
          <button 
            onClick={() => setConfigOpen(false)}
            className="p-2 text-muted-foreground hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Stepper — setup guide */}
          <Stepper
            initialStep={0}
            accentColor="#3B82F6"
            backButtonText="← Back"
            nextButtonText="Next →"
            completeButtonText="✓ Done"
          >
            <Step>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Step 1 — Choose Providers</p>
              <p className="text-sm text-slate-300 leading-relaxed">Toggle the AI providers you want to use. You can activate multiple for side-by-side comparison.</p>
            </Step>
            <Step>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Step 2 — Add API Keys</p>
              <p className="text-sm text-slate-300 leading-relaxed">Paste your API keys below. Keys are stored only in your browser — never sent to any server.</p>
            </Step>
            <Step>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-1">Step 3 — You're Ready</p>
              <p className="text-sm text-slate-300 leading-relaxed">Hit Save to activate your config. Return here any time to swap providers or update keys.</p>
            </Step>
          </Stepper>

          <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-primary text-xl">💡</span>
              <p className="text-sm text-primary-foreground/90 leading-relaxed text-blue-100">
                Turn on multiple providers to compare responses side-by-side. You only need a key for the ones you enable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PROVIDERS.map(p => {
              const isActive = localActive.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProvider(p.id)}
                  className={`p-3 text-sm font-medium rounded-lg border text-left transition-all ${
                    isActive 
                      ? 'bg-primary/20 border-primary text-white shadow-[0_0_10px_rgba(96,165,250,0.2)]' 
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{p.display}</span>
                    {isActive && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>

          {localActive.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-foreground">Configure Active Providers</h3>
              
              {localActive.map(id => {
                const provider = PROVIDERS.find(p => p.id === id);
                if (!provider || id === 'simulation') return null;

                if (id === 'zaraki') {
                  return (
                    <div key={id} className="space-y-3 p-4 bg-blue-950/30 border border-primary/30 rounded-lg animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          ⚡ {provider.name} <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-1.5 py-0.5 rounded">AI GATEWAY</span>
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Zaraki's own AI Gateway. Paste a <code className="text-blue-300 text-[11px]">zk_live_*</code> key to use the <strong>authenticated</strong> endpoint with rate limiting &amp; usage tracking. Leave empty to use the <strong>free</strong> OmniRoute fallback.
                      </p>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Zaraki API Key (Optional)</label>
                        <div className="relative">
                          <input 
                            type={showKeys[id] ? "text" : "password"}
                            value={localKeys[id] || ''}
                            onChange={(e) => setLocalKeys(prev => ({...prev, [id]: e.target.value}))}
                            placeholder="zk_live_xxxxxxxx_..."
                            className="w-full bg-black/50 border border-white/20 rounded px-3 py-1.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono pr-10"
                          />
                          <button 
                            onClick={() => setShowKeys(prev => ({...prev, [id]: !prev[id]}))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                          >
                            {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setConfigOpen(false);
                          setTimeout(() => setIsApiKeyModalOpen(true), 200);
                        }}
                        className="flex items-center gap-1.5 text-[11px] text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        <span>🔑</span> Generate a new Zaraki API Key →
                      </button>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Model Override (Optional)</label>
                        <input 
                          type="text"
                          value={localMod || ''}
                          onChange={(e) => setLocalMod(e.target.value)}
                          placeholder="zaraki-auto (default)"
                          className="w-full bg-black/50 border border-white/20 rounded px-3 py-1.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                  );
                }

                if (id === 'omniroute') {
                  return (
                    <div key={id} className="space-y-2 p-4 bg-blue-950/30 border border-primary/30 rounded-lg animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          🚀 {provider.name} <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded">FREE GATEWAY</span>
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Connected to OmniRoute (<code className="text-primary text-[11px]">localhost:20128</code>) via Zaraki backend. Auto-routes through 352+ free AI models — <strong>no API keys required</strong>.
                      </p>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Model Override (Optional)</label>
                        <input 
                          type="text"
                          value={localMod || ''}
                          onChange={(e) => setLocalMod(e.target.value)}
                          placeholder="auto (or auto/coding, auto/fast)"
                          className="w-full bg-black/50 border border-white/20 rounded px-3 py-1.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                  );
                }

                if (id === 'custom') {
                  return (
                    <div key={id} className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-lg animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                        <h4 className="text-sm font-medium">{provider.name}</h4>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Endpoint URL</label>
                        <input 
                          type="text"
                          value={localEp}
                          onChange={(e) => setLocalEp(e.target.value)}
                          placeholder="http://localhost:11434/v1/chat/completions"
                          className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Model Name</label>
                        <input 
                          type="text"
                          value={localMod}
                          onChange={(e) => setLocalMod(e.target.value)}
                          placeholder="llama3"
                          className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">API Key (Bearer Token)</label>
                        <div className="relative">
                          <input 
                            type={showKeys[id] ? "text" : "password"}
                            value={localKeys[id] || ''}
                            onChange={(e) => setLocalKeys(prev => ({...prev, [id]: e.target.value}))}
                            placeholder="Optional for local models"
                            className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-10"
                          />
                          <button 
                            onClick={() => setShowKeys(prev => ({...prev, [id]: !prev[id]}))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                          >
                            {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={id} className="space-y-2 p-4 bg-white/5 border border-white/10 rounded-lg animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <h4 className="text-sm font-medium">{provider.name}</h4>
                    </div>
                    <div className="relative">
                      <input 
                        type={showKeys[id] ? "text" : "password"}
                        value={localKeys[id] || ''}
                        onChange={(e) => setLocalKeys(prev => ({...prev, [id]: e.target.value}))}
                        placeholder={`Enter ${provider.name} API Key`}
                        className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-10"
                      />
                      <button 
                        onClick={() => setShowKeys(prev => ({...prev, [id]: !prev[id]}))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(96,165,250,0.4)]"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
