import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PILLAR_COLORS } from '@/lib/data';
import { Send, Bot, User, Loader2, X, MessageSquare, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  pillar: 'home' | 'money' | 'resolve' | 'community';
  context?: string;
  placeholder?: string;
}

const AIChatComponent: React.FC<AIChatProps> = ({ pillar, context, placeholder }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const colors = PILLAR_COLORS[pillar];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { prompt: userMessage, pillar, context }
      });

      if (error) throw error;
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error('ai-assistant request failed:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  const pillarLabels = {
    home: 'Home Maintenance Advisor',
    money: 'Financial Recovery Expert',
    resolve: 'Legal Empowerment Guide',
    community: 'Community Building Advisor'
  };

  const suggestedQuestions: Record<string, string[]> = {
    home: ['How do I fix a leaky faucet?', 'What maintenance should I do each season?', 'How can I reduce my energy bills?'],
    money: ['Help me write a dispute letter for a medical bill', 'How do I check my credit report for errors?', 'What are my rights under the FDCPA?'],
    resolve: ['How do I sue someone for a small amount of money without a lawyer?', 'What should I look for in an attorney?', 'How do I get my own records from a government agency?'],
    community: ['How do I start a neighborhood watch?', 'What\'s the best way to set up shared security cameras?', 'How can I organize a community meeting?']
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-gradient-to-r ${colors.gradient}`}
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">Ask AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '560px' }}>
      {/* Header */}
      <div className={`px-5 py-4 bg-gradient-to-r ${colors.gradient} text-white flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{pillarLabels[pillar]}</h3>
            <p className="text-xs opacity-80">AI-powered guidance</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl ${colors.light} flex items-center justify-center`}>
              <MessageSquare className={`w-7 h-7 ${colors.text}`} />
            </div>
            <p className="text-gray-600 text-sm mb-4">Ask me anything about {pillar === 'home' ? 'home maintenance' : pillar === 'money' ? 'financial recovery' : pillar === 'resolve' ? 'your legal rights' : 'community building'}.</p>
            <div className="space-y-2">
              {suggestedQuestions[pillar].map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  className={`block w-full text-left text-xs px-3 py-2.5 rounded-xl border ${colors.border} border-opacity-30 hover:${colors.light} transition-colors ${colors.text}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className={`w-7 h-7 rounded-full ${colors.light} flex-shrink-0 flex items-center justify-center`}>
                <Bot className={`w-4 h-4 ${colors.text}`} />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? `bg-gradient-to-r ${colors.gradient} text-white rounded-br-md`
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className={`w-7 h-7 rounded-full ${colors.light} flex-shrink-0 flex items-center justify-center`}>
              <Bot className={`w-4 h-4 ${colors.text}`} />
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder || 'Type your question...'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`px-4 py-2.5 rounded-xl text-white transition-all disabled:opacity-40 bg-gradient-to-r ${colors.gradient} hover:opacity-90`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatComponent;
