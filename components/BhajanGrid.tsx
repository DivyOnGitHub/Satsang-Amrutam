
import React from 'react';
import { MediaItem, Language, UserRole } from '../types';
import { translations } from '../utils/translations';
import { geminiService } from '../services/geminiService';

interface BhajanGridProps {
  items: MediaItem[];
  language: Language;
  role: UserRole;
  onDelete?: (id: string) => void;
  onEdit?: (item: MediaItem) => void;
}

const BhajanGrid: React.FC<BhajanGridProps> = ({ items, language, role, onDelete, onEdit }) => {
  const t = translations[language];
  const [selectedItem, setSelectedItem] = React.useState<MediaItem | null>(null);
  const [isTransliterating, setIsTransliterating] = React.useState(false);
  const [transliteration, setTransliteration] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [copied, setCopied] = React.useState<string | null>(null);
  
  const handleShare = (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    const data = btoa(JSON.stringify({ title: item.title, artist: item.artist, lyrics: item.lyrics, uploader: item.uploader, type: 'bhajan' }));
    const url = `${window.location.origin}${window.location.pathname}?divine_link=${data}`;
    navigator.clipboard.writeText(url);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.artist && item.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} className="w-full max-w-md px-6 py-4 bg-white border border-orange-100 rounded-3xl shadow-sm focus:ring-4 focus:ring-orange-50 transition-all font-bold" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredItems.map(item => (
          <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all border border-orange-100 cursor-pointer group flex items-start gap-6 relative">
            <div className="bg-orange-50 w-20 h-20 rounded-3xl flex items-center justify-center text-3xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner">📜</div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-orange-900 leading-tight">{item.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.isGlobal && <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100">Global Community</span>}
                    {item.isShared && <span className="text-[8px] font-black bg-green-50 text-green-600 px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-100">Shared with You</span>}
                  </div>
                </div>
                <div className="flex gap-1 z-10">
                  <button onClick={(e) => handleShare(e, item)} className={`p-2 rounded-xl transition-all ${copied === item.id ? 'bg-green-100 text-green-600' : 'text-orange-400 hover:bg-orange-50'}`}>
                    {copied === item.id ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}
                  </button>
                  {role === UserRole.ADMIN && !item.isGlobal && (
                    <button onClick={(e) => { e.stopPropagation(); if(onEdit) onEdit(item); }} className="p-2 text-orange-400 hover:text-orange-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg></button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400 italic mt-2 font-medium">{item.artist || 'Traditional'}</p>
              <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-gray-400">
                <span className="uppercase tracking-widest">By {item.uploader}</span>
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fcf8f0] w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-scaleIn border border-orange-200">
            <div className="p-8 border-b border-orange-100 flex justify-between items-center bg-white/50">
              <h2 className="text-2xl font-serif font-bold text-orange-900">{selectedItem.title}</h2>
              <button onClick={() => setSelectedItem(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-50 text-orange-900 text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 text-center">
              <div className="whitespace-pre-wrap font-serif text-3xl leading-relaxed text-gray-800">
                {selectedItem.lyrics}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BhajanGrid;
