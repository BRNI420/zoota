import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, MessageCircle, Trash2, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const QUICK_QUESTIONS = [
  'מה כדאי לאכול לפני האימון?',
  'איך אני מבצע סקוואט נכון?',
  'כמה חלבון אני צריך ביום?',
  'יש לי כאב בברך, מה לעשות?',
  'מה ההבדל בין פחמימות פשוטות למורכבות?',
  'כמה זמן אחרי אימון כדאי לאכול?',
];

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
        <Zap className="w-4 h-4 text-white" />
      </div>
      <div className="chat-bubble-ai px-4 py-3 max-w-[200px]">
        <div className="flex gap-1 items-center h-5">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    axios.get('/api/chat/history')
      .then(res => setMessages(res.data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { message: text.trim() });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.message,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'מצטער, אירעה שגיאה. נסה שוב בעוד כמה שניות.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('האם למחוק את כל היסטוריית השיחה?')) return;
    try {
      await axios.delete('/api/chat/history');
      setMessages([]);
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="card mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">מאמן ZOOTA AI</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow" />
              <p className="text-xs text-gray-400">מחובר ומוכן לעזור</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm"
          >
            <Trash2 className="w-4 h-4" />
            נקה
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide">
        {historyLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">שאל את מאמן ה-AI שלך</h3>
            <p className="text-gray-400 text-sm max-w-xs mb-8">
              אני כאן לעזור לך עם שאלות על תזונה, אימונים, טכניקות ומוטיבציה
            </p>

            {/* Quick questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-right p-3 bg-card border border-border rounded-xl text-sm text-gray-300 hover:text-white hover:border-primary/50 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Welcome message */}
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="chat-bubble-ai px-4 py-3 max-w-[80%]">
                <p className="text-sm text-gray-200">שלום! אני מאמן ה-AI של ZOOTA. אשמח לעזור לך עם שאלות על אימונים, תזונה, ועוד. שאל אותי כל דבר! 💪</p>
              </div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-1 text-sm font-bold text-gray-400">
                    א
                  </div>
                )}
              </div>
            ))}

            {loading && <TypingIndicator />}

            {/* Quick question chips (shown after conversation starts) */}
            {!loading && messages.length > 0 && messages.length < 6 && (
              <div className="flex flex-wrap gap-2 px-2">
                {QUICK_QUESTIONS.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 bg-surface border border-border rounded-full text-gray-400 hover:text-white hover:border-primary/50 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="card mt-2">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שאל שאלה... (Enter לשליחה, Shift+Enter לשורה חדשה)"
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary resize-none transition-all"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            onInput={(e) => {
              const ta = e.target as HTMLTextAreaElement;
              ta.style.height = 'auto';
              ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
            }}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl gradient-bg text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex-shrink-0 shadow-lg shadow-primary/30"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-5 h-5" style={{ transform: 'scaleX(-1)' }} />
            }
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">ZOOTA AI · מבוסס על Claude · מתשובות AI יש ליטול בחשבון</p>
      </div>
    </div>
  );
}
