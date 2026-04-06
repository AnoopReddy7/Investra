
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { chatWithFinancialAssistant } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIAssistant = () => {
  const initialGreeting: Message = { 
    role: 'model', 
    text: "Hello! I'm **INVESTRA Assist**. I can help you with:\n\n* **Personal Planning**: \"Can I afford a car in 3 years?\"\n* **General Knowledge**: \"What is an ETF?\"\n* **Market Insights**: \"How is the Nifty 50 performing?\"" 
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText) return;

    // 1. Update UI with user message
    const userMsg: Message = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      /**
       * 2. Prepare history for API
       * Gemini requires history to:
       * - Start with a 'user' message
       * - Alternate between 'user' and 'model'
       * Since our FIRST message is a 'model' greeting, we skip it for the API history.
       */
      const historyForApi = messages
        .filter((m, index) => index > 0) // Skip the hardcoded initial greeting
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      // 3. Call Service
      const responseText = await chatWithFinancialAssistant(messageText, historyForApi);

      // 4. Update UI with AI response
      const botMsg: Message = { role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat UI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error processing your request." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-surface border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
         <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
               <Bot size={24} />
            </div>
            <div>
               <h2 className="font-bold text-white text-lg flex items-center">
                 INVESTRA Assist <Sparkles size={14} className="text-yellow-400 ml-2" />
               </h2>
               <p className="text-xs text-slate-400">Powered by Gemini AI</p>
            </div>
         </div>
         <button 
           onClick={() => setMessages([initialGreeting])} 
           className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
           title="Reset Chat"
         >
           <RefreshCw size={18} />
         </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-900/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
               <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                 msg.role === 'user' ? 'bg-indigo-600' : 'bg-primary'
               }`}>
                 {msg.role === 'user' ? <UserIcon size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
               </div>
               <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                 msg.role === 'user' 
                   ? 'bg-indigo-600 text-white rounded-tr-none' 
                   : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
               }`}>
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
               </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                   <Bot size={16} className="text-white" />
                </div>
                <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700">
                   <Loader2 size={20} className="animate-spin text-primary" />
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t border-slate-700">
         <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your financial goals..."
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-4 pr-12 py-4 text-white placeholder-slate-500 focus:border-primary outline-none transition-all disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 p-2 bg-primary hover:bg-violet-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={20} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default AIAssistant;
