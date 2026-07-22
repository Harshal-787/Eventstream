import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import { Sparkles, X, Send, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your EventStream AI assistant. How can I help you manage your smart buildings today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // In a more complex setup, we'd pass the full chat history. For now, we pass the latest prompt.
      // We could format the history as a single prompt string if the backend doesn't support array inputs yet.
      let promptContext = "Chat History:\n";
      messages.forEach(m => {
        promptContext += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}\n`;
      });
      promptContext += `User: ${userMessage}\nAssistant:`;

      const response = await aiService.chat(promptContext);
      setMessages(prev => [...prev, { role: 'assistant', text: response.response }]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error occurred.';
      setMessages(prev => [...prev, { role: 'assistant', text: `**Error:** ${errorMessage}\n\nPlease ensure your AI Settings are configured with a valid API key and model.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/30 transition-transform hover:scale-110 z-50 flex items-center justify-center group"
          title="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-teal-600 text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-semibold">
              <MessageSquare className="w-5 h-5" />
              EventStream AI
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-teal-100 hover:text-white rounded-full p-1 hover:bg-teal-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-teal-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    {msg.role === 'user' ? msg.text : <ReactMarkdown>{msg.text}</ReactMarkdown>}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 text-gray-500 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 shadow-sm items-center">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 bg-gray-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 rounded-full px-4 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-teal-500 transition-all dark:text-white"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-full bg-teal-600 text-white disabled:bg-gray-300 dark:disabled:bg-slate-700 transition-colors"
              >
                <Send className="w-4 h-4 -translate-y-[1px] translate-x-[1px]" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
