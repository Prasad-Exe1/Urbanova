import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm Urbanova AI — focused on Hyderabad & peri-urban listings. Ask about neighbourhoods (Jubilee, Gachibowli, Miyapur…) or budget bands.",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    const query = input;
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, properties }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { text: data.response, sender: 'ai' }]);
      } else {
        setMessages((prev) => [...prev, { text: `Sorry: ${data.error}`, sender: 'ai' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { text: 'Network error connecting to the AI.', sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1050] flex flex-col items-end gap-md">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-[min(380px,calc(100vw-3rem))] h-[min(520px,70vh)] flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.85)] bg-surface-container-low/80 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between px-lg py-md border-b border-white/10 bg-black/30 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_15px_rgba(242,202,80,0.35)]">
                  <Sparkles size={18} className="text-on-primary" />
                </div>
                <div>
                  <h3 className="m-0 font-headline-md text-[18px] text-on-background">Urbanova AI</h3>
                  <div className="flex items-center gap-xs mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#f2ca50]" />
                    <span className="text-xs text-on-surface-variant">Online</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-on-background flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-lg flex flex-col gap-md">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={`${i}-${msg.sender}`}
                  className={`flex flex-col gap-xs max-w-[88%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant px-0.5">
                    {msg.sender === 'user' ? 'You' : 'Urbanova AI'}
                  </span>
                  <div
                    className={`px-md py-sm rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border ${
                      msg.sender === 'user'
                        ? 'bg-primary text-on-primary border-primary/30 rounded-br-sm shadow-[0_8px_20px_rgba(242,202,80,0.2)]'
                        : 'bg-surface-container-high/80 text-on-background border-white/10 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="self-start flex gap-sm items-center text-on-surface-variant text-sm px-sm">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Thinking…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-md border-t border-white/10 bg-black/40 flex gap-sm items-center shrink-0">
              <div className="flex-1 flex items-center rounded-xl border border-outline-variant bg-surface-container-highest px-sm">
                <input
                  type="text"
                  placeholder="Ask anything…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none py-sm px-sm text-on-background placeholder:text-on-surface-variant outline-none text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  input.trim() && !isLoading
                    ? 'bg-primary text-on-primary shadow-[0_4px_15px_rgba(242,202,80,0.35)]'
                    : 'bg-white/5 text-on-surface-variant cursor-not-allowed'
                }`}
                aria-label="Send"
              >
                <Send size={18} className="translate-x-px -translate-y-px" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors border ${
          isOpen
            ? 'bg-[#1e1e24] border-white/15 text-white'
            : 'bg-primary text-on-primary border-primary/40 shadow-[0_10px_36px_rgba(0,0,0,0.45)]'
        }`}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={28} strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <span className="material-symbols-outlined text-[30px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                chat_bubble
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default AIChat;
