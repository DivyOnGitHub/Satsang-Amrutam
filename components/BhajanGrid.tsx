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
  
  const handleTransliterate = async () => {
    if (!selectedItem || isTransliterating) return;
    if (transliteration) { setTransliteration(null); return; }
    setIsTransliterating(true);
    const targetScript = language === Language.GU ? 'Gujarati' : 'Latin';
    const result = await geminiService.transliterateBhajan(selectedItem.lyrics, targetScript);
    if (result) setTransliteration(result);
    setIsTransliterating(false);
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.artist && item.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-orange-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} className="w-full pl-12 pr-4 py-4 bg-white border border-orange-100 rounded-3xl focus:ring-4 focus:ring-orange-50 shadow-sm font-medium transition-all" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredItems.map(item => (
          <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all border border-orange-100 cursor-pointer group flex items-start gap-6 relative overflow-hidden">
            <div className="bg-orange-50 w-20 h-20 rounded-3xl flex items-center justify-center text-3xl shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner">📜</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-orange-900 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500 italic">{item.artist || 'Traditional'}</p>
                    {item.isShared && (
                      <span className="flex items-center gap-1.5 text-[8px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        Global Community
                      </span>
                    )}
                  </div>
                </div>
                {role === UserRole.ADMIN && !item.isShared && (
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); if(onEdit) onEdit(item); }} className="p-3 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); if(onDelete) onDelete(item.id); }} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-[8px] text-orange-600">👤</div>
                  {t.uploadedBy} {item.uploader}
                </div>
                <span className="text-orange-300 font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fcf8f0] w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-orange-200 animate-scaleIn">
            <div className="p-8 border-b border-orange-100 bg-white/50 backdrop-blur-sm flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">📜</div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-orange-900">{selectedItem.title}</h2>
                  <p className="text-sm text-orange-600 font-bold tracking-wide">{selectedItem.artist || 'Traditional'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleTransliterate} className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${transliteration ? 'bg-orange-900 text-white' : 'bg-white border border-orange-100 text-orange-800'}`}>
                  {isTransliterating ? '...' : (transliteration ? t.originalScript : t.transliterate)}
                </button>
                <button onClick={() => setSelectedItem(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-orange-100 text-gray-500 transition-colors text-2xl">&times;</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 md:p-16 text-center">
              <div className="whitespace-pre-wrap font-serif leading-relaxed text-gray-800 text-2xl md:text-3xl selection:bg-orange-200">
                {transliteration || selectedItem.lyrics}
              </div>
              <div className="mt-16 opacity-30 text-5xl">🕯️</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BhajanGrid;