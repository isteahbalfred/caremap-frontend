import { useState, useEffect, useRef, Fragment } from "react";
import { Link } from "react-router-dom";
import { chatService } from "../services/chatService";
import { ASK_ASSISTANT_EVENT, AskAssistantDetail } from "../utils/events";

interface ChatMsg { role: 'user' | 'bot'; text: string; }

// -- Icônes -----------------------------------------------------
function BotIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="8" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="3.5" r="1.3" fill="currentColor" />
      <circle cx="9" cy="13" r="1.4" fill="currentColor" />
      <circle cx="15" cy="13" r="1.4" fill="currentColor" />
      <path d="M9.5 16.5c.8.6 1.7.9 2.5.9s1.7-.3 2.5-.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 12.5H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 12.5h2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SendIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

// -- Formatage des messages du bot --------------------------------
// Convertit un texte type markdown léger (**gras**, listes "1. 2. 3.")
// en JSX lisible, sans dépendance externe.
function renderBotText(raw: string) {
  // Sépare le texte en "items" de liste numérotée si le pattern est détecté
  // (ex: "1. Fais ceci 2. Fais cela 3. ...") même quand tout est sur une seule ligne.
  const normalized = raw
    // Ajoute un retour à la ligne avant chaque numéro de liste "N." suivi d'un espace + majuscule/gras
    .replace(/\s(?=\d+\.\s?\*\*)/g, '\n')
    .replace(/\s(?=\d+\.\s(?=[A-ZÀ-Ý]))/g, '\n');

  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  const renderInline = (text: string, key: number) => {
    // Découpe sur **gras** et sur les liens markdown [texte](/url)
    const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
    return (
      <Fragment key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className="font-semibold text-gray-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch) {
            const [, label, url] = linkMatch;
            const isInternal = url.startsWith('/');
            const linkClasses = "font-medium text-primary-600 underline decoration-primary-300 hover:text-primary-700";
            return isInternal ? (
              <Link key={i} to={url} className={linkClasses}>{label}</Link>
            ) : (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={linkClasses}>{label}</a>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </Fragment>
    );
  };

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const listMatch = line.match(/^(\d+)\.\s*(.*)$/);
        if (listMatch) {
          const [, num, content] = listMatch;
          return (
            <div key={idx} className="flex gap-2">
              <span className="font-semibold text-primary-600 shrink-0">{num}.</span>
              <span>{renderInline(content, idx)}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInline(line, idx)}</p>;
      })}
    </div>
  );
}

// -- Chatbot ------------------------------------------------------
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'bot', text: 'Bonjour ! Je suis l\'assistant CareMap. Comment puis-je vous aider ?' }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // send() accepte un texte optionnel afin de pouvoir être déclenché depuis
  // l'extérieur (ex: bouton "Demander à l'assistant" sur une fiche médicament)
  // sans dépendre du timing de mise à jour de l'état `input`.
  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await chatService.send(text);
      const reply = res.data?.data?.reply || 'Désolé, je n\'ai pas pu répondre.';
      setMsgs(m => [...m, { role: 'bot', text: reply }]);
    } catch {
      setMsgs(m => [...m, { role: 'bot', text: 'Erreur de connexion. Réessayez.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Permet à n'importe quelle page (ex: fiche médicament, fiche clinique) de
  // demander au chatbot une info précise sans passer par la saisie manuelle.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AskAssistantDetail>).detail;
      if (!detail?.text) return;
      setOpen(true);
      send(detail.text);
    };
    window.addEventListener(ASK_ASSISTANT_EVENT, handler);
    return () => window.removeEventListener(ASK_ASSISTANT_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        title="Assistant CareMap"
      >
        {open ? <CloseIcon className="w-6 h-6" /> : <BotIcon className="w-7 h-7" />}
      </button>

      {/* Fenêtre chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '420px' }}>
          {/* Header */}
          <div className="bg-primary-600 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Assistant CareMap</p>
              <p className="text-primary-200 text-xs">Toujours disponible</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}>
                  {m.role === 'bot' ? renderBotText(m.text) : m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              placeholder="Posez votre question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}