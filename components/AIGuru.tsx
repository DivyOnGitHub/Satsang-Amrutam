
import React from 'react';
import { geminiService, FilePart } from '../services/geminiService';
import { ChatMessage, UserRole, Language } from '../types';
import { translations } from '../utils/translations';

interface AIGuruProps {
  role: UserRole;
  language: Language;
}

const AIGuru: React.FC<AIGuruProps> = ({ role, language }) => {
  const t = translations[language];
  const [messages, setMessages] = React.useState<ChatMessage[]>([
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

  React.useEffect(scrollToBottom, [messages]);

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
      ? `[New Source: ${attachedFile.name}] ${input}` 
      : input;

    const userMsg: ChatMessage = { role: 'user', text: userMsgText };
    setMessages(prev => [...prev, userMsg]);
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

    const response = await geminiService.getSpiritualGuidance(input || "Summarize the Vachanãmrut essence.", language, history, filePart);
    setMessages(prev => [...prev, { role: 'model', text: response || '' }]);
    setIsTyping(false);
  };

  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Logic to highlight citations like [Gadhadã I-1.4] or [ગઢડા ૧-૧.૪]
      const parts = line.split(/(\[[^\]]+\])/g);
      return (
        <p key={i} className={i > 0 ? 'mt-3' : ''}>
          {parts.map((part, j) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              return (
                <span key={j} className="inline-block bg-orange-200 text-orange-900 text-[10px] font-black px-2 py-0.5 rounded border border-orange-300 mx-1 italic shadow-sm uppercase tracking-tight">
                  <svg className="w-2.5 h-2.5 inline mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21l-8.228-3.352a.5.5 0 01-.272-.447V5.51a.5.5 0 01.728-.447L12 8.352l7.772-3.289a.5.5 0 01.728.447v11.691a.5.5 0 01-.272.447L12 21z" />
                  </svg>
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
    <div className="flex flex-col h-[75vh] max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-orange-100">
      <div className="bg-gradient-to-r from-orange-900 via-orange-800 to-orange-700 p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/20 relative">
             🕉️
             <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-orange-900"></div>
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">{t.aiGuruTitle}</h2>
            {role === UserRole.ADMIN && (
              <p className="text-orange-100 text-[10px] uppercase tracking-widest font-bold">{t.aiGuruSubtitle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.947 11.947 0 012.183 5c-1.008 0-1.818.81-1.818 1.818 0 5.082 2.041 9.671 5.317 13.113a.5.5 0 00.728 0 11.945 11.945 0 005.317-13.113c0-1.008-.81-1.818-1.818-1.818A11.947 11.947 0 0110 1.944zm0 2.056a10.95 10.95 0 00-7 2.68c-.1.1-.1.2-.1.3 0 4.26 1.71 8.12 4.46 11.02a.5.5 0 00.72 0c2.75-2.9 4.46-6.76 4.46-11.02 0-.1 0-.2-.1-.3a10.95 10.95 0 00-7-2.68z" />
            </svg>
            <span className="text-[10px] text-white font-bold uppercase tracking-tighter">
              {t.lockedContext}
            </span>
          </div>
          {role === UserRole.ADMIN && (
            <span className="text-[9px] text-orange-200 font-bold uppercase tracking-widest">{t.adminAccessEnabled}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fffdfa] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-5 rounded-3xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-orange-700 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-orange-100/50 shadow-md ring-1 ring-orange-50'
            }`}>
              {renderMessageText(msg.text)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/80 p-4 rounded-2xl text-orange-800 flex gap-2 items-center border border-orange-100 shadow-sm animate-pulse">
              <span className="text-xs italic font-bold tracking-tight">{t.scanning}</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-orange-600 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-orange-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 bg-orange-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-orange-100">
        {attachedFile && (
          <div className="mb-3 flex items-center justify-between bg-orange-50 border border-orange-200 p-2.5 rounded-xl text-xs text-orange-900 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-bold truncate">{attachedFile.name}</span>
            </div>
            <button onClick={() => setAttachedFile(null)} className="text-orange-500 hover:text-orange-700 font-black p-1">&times;</button>
          </div>
        )}

        <div className="flex gap-3 items-center bg-orange-50/40 p-2.5 rounded-2xl border border-orange-200 shadow-inner">
          {role === UserRole.ADMIN && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.txt"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white border-2 border-orange-200 text-orange-700 rounded-xl hover:bg-orange-100 transition-all shadow-sm active:scale-90"
                title={t.indexBook}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </>
          )}
          
          <textarea 
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={role === UserRole.ADMIN ? t.adminAskPrompt : t.askPrompt}
            className="flex-1 px-4 py-2 text-sm bg-transparent border-none focus:outline-none focus:ring-0 resize-none font-medium placeholder-orange-300"
          />
          
          <button 
            onClick={handleSend}
            disabled={isTyping || (!input.trim() && !attachedFile)}
            className="p-3 bg-orange-800 text-white rounded-xl hover:bg-orange-900 transition-all shadow-md disabled:bg-gray-300 disabled:shadow-none active:scale-95 group"
          >
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGuru;