import { useState } from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor } from '@codesandbox/sandpack-react';
import { Play, Code2, Monitor, Smartphone, Check, Copy } from 'lucide-react';

interface CodePreviewPanelProps {
  code: string;
  language: string;
}

export function CodePreviewPanel({ code, language }: CodePreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isReact = language === 'jsx' || language === 'tsx' || language === 'react' || code.includes('import React') || code.includes('export default');

  const getSandpackFiles = (): Record<string, string> => {
    if (isReact) {
      let formatted = code;
      if (!formatted.includes('export default')) {
        formatted += '\n\nexport default App;';
      }
      return {
        '/App.js': formatted,
      };
    }

    return {
      '/index.html': code.includes('<html') ? code : `<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { background: #030712; color: #f3f4f6; padding: 1rem; font-family: system-ui; }</style>
  </head>
  <body>${code}</body>
</html>`
    };
  };

  return (
    <div className="w-full my-3 rounded-xl border border-blue-500/30 bg-[#030712] overflow-hidden shadow-2xl animate-fade-in">
      {/* Header Bar */}
      <div className="px-4 py-2 bg-[#090D1F] border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3 h-3 text-amber-300" />
              <span>Live Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'code' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Source Code</span>
            </button>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {language}
          </span>
        </div>

        {/* Device View & Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'preview' && (
            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1 rounded transition-colors ${device === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1 rounded transition-colors ${device === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Mobile View (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-all border border-white/10"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Sandpack Provider Layout */}
      <div className={`w-full flex justify-center bg-[#050B1E] ${device === 'mobile' && activeTab === 'preview' ? 'p-4' : ''}`}>
        <div className={`transition-all ${device === 'mobile' && activeTab === 'preview' ? 'w-[375px] border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl' : 'w-full'}`}>
          <SandpackProvider
            template={isReact ? 'react' : 'static'}
            theme="dark"
            files={getSandpackFiles()}
            options={{
              externalResources: ['https://cdn.tailwindcss.com']
            }}
          >
            <SandpackLayout>
              {activeTab === 'preview' ? (
                <SandpackPreview style={{ height: 400 }} showOpenInCodeSandbox={false} />
              ) : (
                <SandpackCodeEditor style={{ height: 400 }} showLineNumbers showInlineErrors />
              )}
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </div>
    </div>
  );
}
