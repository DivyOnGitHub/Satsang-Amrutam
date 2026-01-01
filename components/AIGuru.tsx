
import React from 'react';
import { geminiService, FilePart } from '../services/geminiService';
import { ChatMessage, UserRole, Language } from '../types';
import { translations } from '../utils/translations';
import Logo from './Logo';

interface AIGuruProps {
  role: UserRole;
  language: Language;
}

const AIGuru: React.FC<AIGuruProps> = ({ role, language }) => {
  const t = translations[language];
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    { role: 'model', text: t.aiInitialMsg }
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [attachedFile, setAttachedFile] = React.useState<{ name: string; data: string; mimeType: string } | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(scrollToBottom, [messages, isTyping]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      alert("Please upload a PDF or Text file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachedFile({
        name: file.name,
        data: base64,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return;

    const currentFile = attachedFile;
    const userMsgText = attachedFile 
      ? `[File: ${attachedFile.name}] ${input}` 
      : input;

    const userMsg: ChatMessage = { role: 'user', text: userMsgText };
    setMessages(prev => [...prev, userMsg]);
    
    const queryInput = input;
    setInput('');
    setAttachedFile(null);
    setIsTyping(true);

    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const filePart: FilePart | undefined = currentFile ? {
      data: currentFile.data,
      mimeType: currentFile.mimeType
    } : undefined;

    try {
      const response = await geminiService.getSpiritualGuidance(queryInput || "Please provide context.", language, history, filePart);
      setMessages(prev => [...prev, { role: 'model', text: response || 'No response received.' }]);
    } catch (err) {
      console.error("Chat interface error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Service temporarily unavailable. Please verify your internet connection and API configuration." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\[[^\]]+\])/g);
      return (
        <p key={i} className={i > 0 ? 'mt-3' : ''}>
          {parts.map((part, j) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              return (
                <span key={j} className="inline-block bg-orange-200 text-orange-900 text-[10px] font-black px-2 py-0.5 rounded border border-orange-300 mx-1 italic shadow-sm uppercase tracking-tight">
                  {part.replace(/[\[\]]/g, '')}
                </span>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[75vh] max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-orange-100 animate-fadeIn">
      <div className="bg-gradient-to-r from-orange-950 via-orange-900 to-orange-800 p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" className="ring-2 ring-white/20" />
          <div>
            <h2 className="text-xl font-serif font-bold">{t.aiGuruTitle}</h2>
            <p className="text-orange-100 text-[10px] uppercase tracking-widest font-bold">{t.aiGuruSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Live Support</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fffdfa]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-3xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-orange-800 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-orange-100 shadow-md'
            }`}>
              {renderMessageText(msg.text)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/80 p-4 rounded-2xl text-orange-900 flex gap-2 items-center border border-orange-100 shadow-sm">
              <span className="text-xs italic font-bold">{t.scanning}</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-orange-100">
        {attachedFile && (
          <div className="mb-3 flex items-center justify-between bg-orange-50 border border-orange-200 p-2.5 rounded-xl text-xs text-orange-900 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="font-bold truncate">{attachedFile.name}</span>
            </div>
            <button onClick={() => setAttachedFile(null)} className="text-orange-500 font-black p-1">&times;</button>
          </div>
        )}

        <div className="flex gap-3 items-center bg-orange-50/40 p-2.5 rounded-2xl border border-orange-200 shadow-inner">
          {role === UserRole.ADMIN && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white border-2 border-orange-200 text-orange-700 rounded-xl hover:bg-orange-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </>
          )}
          
          <textarea 
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={t.askPrompt}
            className="flex-1 px-4 py-2 text-sm bg-transparent border-none focus:outline-none focus:ring-0 resize-none font-medium placeholder-orange-300"
          />
          
          <button 
            onClick={handleSend}
            disabled={isTyping || (!input.trim() && !attachedFile)}
            className="p-3 bg-orange-900 text-white rounded-xl hover:bg-orange-950 transition-all shadow-md disabled:bg-gray-300 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGuru;
