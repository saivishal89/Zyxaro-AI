import { useState, useRef, useEffect, useCallback } from "react";
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

// ─── Types ───────────────────────────────────────────────────────────────────
type Provider = {
  id: string;
  name: string;
  badge: string;
  color: string;
  glow: string;
  active: boolean;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  ts: string;
};

type Topic = "TECH" | "SCIENCE" | "HISTORY" | "FINANCE" | "HEALTH" | "DATA" | "RESEARCH";

// ─── Seed data ────────────────────────────────────────────────────────────────
const PROVIDERS: Provider[] = [
  { id: "groq",    name: "GROQ",      badge: "⚡",  color: "#60A5FA", glow: "rgba(96,165,250,0.18)", active: true  },
  { id: "gpt4o",   name: "GPT-4o",    badge: "◈",   color: "#34D399", glow: "rgba(52,211,153,0.18)", active: true  },
  { id: "claude",  name: "CLAUDE",    badge: "◆",   color: "#F59E0B", glow: "rgba(245,158,11,0.18)", active: true  },
  { id: "gemini",  name: "GEMINI",    badge: "✦",   color: "#A78BFA", glow: "rgba(167,139,250,0.18)", active: false },
  { id: "deepseek",name: "DEEPSEEK",  badge: "▸",   color: "#F472B6", glow: "rgba(244,114,182,0.18)", active: false },
];

const SEED_MESSAGES: Record<string, Message[]> = {
  groq: [
    { role: "user",      content: "Explain quantum entanglement simply", ts: "14:32" },
    { role: "assistant", content: "**TL;DR:** Two particles share a quantum state — measuring one instantly tells you the other's state, regardless of distance.\n\n- **Superposition** — before measurement, each particle exists in multiple states simultaneously\n- **Entanglement** — the two particles' states are correlated at the quantum level\n- **Measurement collapse** — observing one particle instantly defines both\n- **No FTL communication** — you can't use this to send information faster than light\n- **Used in** quantum cryptography and quantum computing", ts: "14:32" },
  ],
  gpt4o: [
    { role: "user",      content: "Explain quantum entanglement simply", ts: "14:32" },
    { role: "assistant", content: "**TL;DR:** Entangled particles behave as a single system — their properties are perfectly correlated no matter how far apart they are.\n\n- Born from the same quantum event, two particles share a **joint wave function**\n- The correlation isn't classical — it violates Bell's inequalities (proven experimentally)\n- **EPR Paradox** — Einstein called it \"spooky action at a distance\"\n- Applications: **quantum key distribution**, superdense coding, teleportation of quantum states\n- Distance has been demonstrated across **1,200 km** via satellite (Micius, 2017)", ts: "14:32" },
  ],
  claude: [
    { role: "user",      content: "Explain quantum entanglement simply", ts: "14:32" },
    { role: "assistant", content: "**TL;DR:** Entanglement links two particles so their fates are intertwined — what happens to one instantly reflects in the other.\n\n- Think of it like a **cosmic coin flip**: two entangled coins always land opposite sides when flipped, even across galaxies\n- The correlation is **non-local** — it defies classical probability\n- **Wave function collapse** happens simultaneously for both particles upon measurement\n- Schrödinger's cat illustrates the superposition principle underlying it\n- Key distinction: **entanglement ≠ communication** — the outcomes are random, just correlated", ts: "14:32" },
  ],
};

// ─── Stars background ─────────────────────────────────────────────────────────
function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random(), y: Math.random(),
      s: Math.random() * 1.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.3,
    }));

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        const alpha = 0.3 + 0.5 * Math.sin(t * star.speed * 0.001 + star.phase);
        ctx.beginPath();
        ctx.arc(star.x * canvas.width, star.y * canvas.height, star.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ─── Markdown renderer (minimal) ─────────────────────────────────────────────
function MD({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code style='background:rgba(96,165,250,0.12);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.85em'>$1</code>")
    .split("\n").map(line => {
      if (line.startsWith("- ")) return `<li style='margin:3px 0;padding-left:4px'>${line.slice(2)}</li>`;
      return `<p style='margin:4px 0'>${line}</p>`;
    }).join("");
  return <div dangerouslySetInnerHTML={{ __html: html }} style={{ lineHeight: 1.6, fontSize: "0.82rem" }} />;
}

// ─── Provider panel ───────────────────────────────────────────────────────────
function ProviderPanel({ provider, messages, isThinking }: {
  provider: Provider;
  messages: Message[];
  isThinking: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isThinking]);

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "rgba(3,8,26,0.75)",
      border: `1px solid ${provider.color}33`,
      borderRadius: 12,
      overflow: "hidden",
      backdropFilter: "blur(12px)",
      boxShadow: `0 0 24px ${provider.glow}, inset 0 1px 0 ${provider.color}22`,
      position: "relative",
    }}>
      {/* Panel header */}
      <div style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${provider.color}22`,
        background: `linear-gradient(135deg, ${provider.glow}, transparent)`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "1rem", filter: `drop-shadow(0 0 6px ${provider.color})` }}>{provider.badge}</span>
        <span style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "0.72rem",
          fontWeight: 700,
          color: provider.color,
          letterSpacing: "0.12em",
          textShadow: `0 0 8px ${provider.color}88`,
        }}>{provider.name}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: provider.color, boxShadow: `0 0 6px ${provider.color}` }} />
          <span style={{ fontSize: "0.65rem", color: "#64748B", fontFamily: "monospace" }}>LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
                <div style={{
                  background: `${provider.color}18`,
                  border: `1px solid ${provider.color}33`,
                  borderRadius: "8px 8px 2px 8px",
                  padding: "6px 10px",
                  maxWidth: "80%",
                  fontSize: "0.8rem",
                  color: "#CBD5E1",
                  lineHeight: 1.5,
                }}>{msg.content}</div>
              </div>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px 8px 8px 8px",
                padding: "8px 10px",
                color: "#CBD5E1",
              }}>
                <MD text={msg.content} />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: `${provider.color}0A`,
            border: `1px solid ${provider.color}22`,
            borderRadius: "2px 8px 8px 8px",
          }}>
            <OrbitLoader color={provider.color} />
            <span style={{ fontSize: "0.75rem", color: provider.color, fontFamily: "monospace", opacity: 0.7 }}>thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Orbit loader ─────────────────────────────────────────────────────────────
function OrbitLoader({ color }: { color: string }) {
  return (
    <div style={{ position: "relative", width: 20, height: 20 }}>
      <style>{`
        @keyframes orbit { from { transform: rotate(0deg) translateX(7px) rotate(0deg); } to { transform: rotate(360deg) translateX(7px) rotate(-360deg); } }
        @keyframes orbit2 { from { transform: rotate(120deg) translateX(5px) rotate(-120deg); } to { transform: rotate(480deg) translateX(5px) rotate(-480deg); } }
      `}</style>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, boxShadow: `0 0 4px ${color}` }} />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 3, height: 3, borderRadius: "50%", background: color, animation: "orbit 1s linear infinite", opacity: 0.8 }} />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 2, height: 2, borderRadius: "50%", background: color, animation: "orbit2 1.4s linear infinite", opacity: 0.5 }} />
      </div>
    </div>
  );
}

// ─── Topic badge ──────────────────────────────────────────────────────────────
function detectTopic(text: string): Topic {
  const t = text.toLowerCase();
  if (/physics|chemistry|biology|quantum|dna|space|galaxy/.test(t)) return "SCIENCE";
  if (/ai|ml|software|code|programming|computer|cyber/.test(t)) return "TECH";
  if (/history|ancient|war|empire|century|revolution/.test(t)) return "HISTORY";
  if (/finance|stock|market|crypto|bitcoin/.test(t)) return "FINANCE";
  if (/health|medical|medicine|disease|brain/.test(t)) return "HEALTH";
  if (/data|scraping|web|proxy|crawl|extract/.test(t)) return "DATA";
  return "RESEARCH";
}

const TOPIC_COLORS: Record<Topic, string> = {
  SCIENCE: "#60A5FA", TECH: "#34D399", HISTORY: "#F59E0B",
  FINANCE: "#A78BFA", HEALTH: "#F472B6", DATA: "#38BDF8", RESEARCH: "#94A3B8",
};

// ─── Main app ─────────────────────────────────────────────────────────────────
export function CockpitView() {
  const [providers, setProviders] = useState(PROVIDERS);
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState<Record<string, boolean>>({});
  const [topic, setTopic] = useState<Topic | null>("SCIENCE");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeProviders = providers.filter(p => p.active);

  const MOCK_RESPONSES: Record<string, string> = {
    groq: "**TL;DR:** Great question. Here's a concise breakdown.\n\n- **Point one** — the key insight is that systems tend toward equilibrium\n- **Point two** — non-linear dynamics produce unexpected emergent behavior\n- **Point three** — measurement invariably affects the system being measured\n- **Point four** — context determines which variables are primary\n- The short answer: it depends on your reference frame",
    gpt4o: "**TL;DR:** This is a multi-layered problem with both theoretical and practical dimensions.\n\n- The **classical view** treats this as a linear causation problem\n- Modern research suggests **bidirectional influence** is more accurate\n- Key variables: `time`, `scale`, `observer frame`, `energy state`\n- Empirically validated through multiple independent replications\n- Practical implication: **design for the edge case**, not the average",
    claude: "**TL;DR:** Let me give you both the intuitive and technical angles.\n\n- **Intuitively** — think of it like a lens that simultaneously magnifies and distorts\n- **Technically** — the Heisenberg principle sets a fundamental limit on simultaneous precision\n- Three schools of thought: Copenhagen, Many-Worlds, and Pilot Wave\n- Most working physicists use Copenhagen pragmatically without fully committing\n- The deeper question is whether the map or the territory is fundamental",
    gemini: "**TL;DR:** Here's a structured breakdown from first principles.\n\n- Start with the **axioms**: what are we assuming before we begin?\n- Layer in **constraints**: what physical laws apply here?\n- Identify **degrees of freedom**: what can actually vary?\n- Apply **boundary conditions**: what are the limits of the system?\n- The answer emerges from the interaction of all four",
    deepseek: "**TL;DR:** Efficient answer incoming.\n\n- Core mechanism: **feedback loops** amplify initial conditions\n- Scale matters: micro-level randomness vs macro-level determinism\n- `O(n²)` complexity in most naive implementations — watch for this\n- Practical rule: **optimize for the common case**, handle the rest gracefully\n- Further reading: Wolfram's *A New Kind of Science* covers this extensively",
  };

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const detected = detectTopic(text);
    setTopic(detected);
    setInput("");

    const newThinking: Record<string, boolean> = {};
    activeProviders.forEach(p => { newThinking[p.id] = true; });
    setThinking(newThinking);

    setMessages(prev => {
      const next = { ...prev };
      activeProviders.forEach(p => {
        next[p.id] = [...(prev[p.id] || []), { role: "user", content: text, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
      });
      return next;
    });

    activeProviders.forEach(p => {
      const delay = 800 + Math.random() * 1200;
      setTimeout(() => {
        setThinking(prev => ({ ...prev, [p.id]: false }));
        setMessages(prev => ({
          ...prev,
          [p.id]: [...(prev[p.id] || []), {
            role: "assistant",
            content: MOCK_RESPONSES[p.id] || MOCK_RESPONSES.groq,
            ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }],
        }));
      }, delay);
    });
  }, [input, activeProviders]);

  const toggleProvider = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#03081A",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Exo 2', sans-serif",
      color: "#E2E8F0",
      overflow: "hidden",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(96,165,250,0.3); border-radius: 2px; }
        @keyframes pulse-ring { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:.8; transform:scale(1.04); } }
        @keyframes slide-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .provider-panel { animation: slide-in 0.3s ease; }
      `}</style>

      <StarCanvas />

      {/* ── Header ── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        height: 52,
        borderBottom: "1px solid rgba(96,165,250,0.12)",
        background: "rgba(3,8,26,0.9)",
        backdropFilter: "blur(16px)",
        flexShrink: 0,
        gap: 12,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
          <span style={{ fontSize: "1.1rem", filter: "drop-shadow(0 0 6px #60A5FA)" }}>⚡</span>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 900,
            fontSize: "0.95rem",
            letterSpacing: "0.15em",
            background: "linear-gradient(90deg, #60A5FA, #93C5FD)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>ZARAKI</span>
        </div>

        {/* Provider toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => toggleProvider(p.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 20,
                border: `1px solid ${p.active ? p.color + "66" : "rgba(255,255,255,0.1)"}`,
                background: p.active ? `${p.color}14` : "transparent",
                color: p.active ? p.color : "#475569",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              <span style={{ fontSize: "0.8rem" }}>{p.badge}</span>
              {p.name}
              {p.active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: p.color, boxShadow: `0 0 4px ${p.color}`, animation: "pulse-ring 2s ease-in-out infinite" }} />}
            </button>
          ))}

          <div style={{ marginLeft: 8, height: 18, width: 1, background: "rgba(255,255,255,0.1)" }} />

          {/* Topic badge */}
          {topic && (
            <div style={{
              padding: "2px 8px",
              borderRadius: 4,
              border: `1px solid ${TOPIC_COLORS[topic]}44`,
              background: `${TOPIC_COLORS[topic]}12`,
              color: TOPIC_COLORS[topic],
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              fontFamily: "'Orbitron', sans-serif",
            }}>{topic}</div>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {["⤴ Export", "⚙ Config", "🔥 Burn All"].map(label => (
            <button key={label} style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#94A3B8",
              fontSize: "0.7rem",
              cursor: "pointer",
              fontFamily: "'Exo 2', sans-serif",
              transition: "all 0.15s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Provider panels ── */}
      <div style={{
        flex: 1,
        display: "flex",
        gap: 10,
        padding: "10px 14px 0",
        overflow: "hidden",
        position: "relative",
        zIndex: 5,
        minHeight: 0,
      }}>
        {activeProviders.length === 0 ? (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "#475569",
          }}>
            <span style={{ fontSize: "2rem", opacity: 0.4 }}>⚡</span>
            <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "0.8rem", letterSpacing: "0.12em" }}>
              ACTIVATE A PROVIDER ABOVE TO BEGIN
            </p>
          </div>
        ) : (
          activeProviders.map(p => (
            <div key={p.id} className="provider-panel" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              <ProviderPanel
                provider={p}
                messages={messages[p.id] || []}
                isThinking={!!thinking[p.id]}
              />
            </div>
          ))
        )}
      </div>

      {/* ── Input bar ── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        padding: "10px 14px 12px",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(96,165,250,0.2)",
          borderRadius: 12,
          padding: "8px 12px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 20px rgba(96,165,250,0.06), 0 -1px 0 rgba(96,165,250,0.1)",
        }}>
          {/* Active provider indicators */}
          <div style={{ display: "flex", gap: 4, paddingBottom: 2, flexShrink: 0 }}>
            {activeProviders.map(p => (
              <div key={p.id} style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: p.color,
                boxShadow: `0 0 5px ${p.color}`,
                animation: "pulse-ring 2s ease-in-out infinite",
              }} />
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask all ${activeProviders.length} provider${activeProviders.length !== 1 ? "s" : ""} simultaneously... (Enter to send)`}
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#E2E8F0",
              fontSize: "0.85rem",
              fontFamily: "'Exo 2', sans-serif",
              resize: "none",
              lineHeight: 1.5,
              minHeight: 24,
              maxHeight: 100,
              overflow: "hidden",
            }}
          />

          {/* Mic */}
          <button style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#64748B",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.85rem", flexShrink: 0,
          }}>🎤</button>

          {/* Send */}
          <button
            onClick={send}
            disabled={!input.trim()}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "none",
              background: input.trim()
                ? "linear-gradient(135deg, #2563EB, #3B82F6)"
                : "rgba(255,255,255,0.06)",
              color: input.trim() ? "#fff" : "#475569",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: input.trim() ? "pointer" : "default",
              fontFamily: "'Exo 2', sans-serif",
              letterSpacing: "0.04em",
              flexShrink: 0,
              transition: "all 0.2s",
              boxShadow: input.trim() ? "0 0 12px rgba(59,130,246,0.4)" : "none",
            }}
          >SEND ▶</button>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.62rem", color: "#1E3A5F", marginTop: 4, letterSpacing: "0.06em" }}>
          ZARAKI COCKPIT · {activeProviders.length} PROVIDER{activeProviders.length !== 1 ? "S" : ""} ACTIVE · NO DATA LEAVES YOUR DEVICE
        </p>
      </div>
    </div>
  );
}
