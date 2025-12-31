
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
  const [fontSize, setFontSize] = React.useState<string>('text-xl md:text-2xl');
  const [isTransliterating, setIsTransliterating] = React.useState(false);
  const [transliteration, setTransliteration] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const verseRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Cleanup effect when closing modal or switching items
  React.useEffect(() => {
    if (!selectedItem) {
      setTransliteration(null);
    }
  }, [selectedItem]);

  const handleTransliterate = async () => {
    if (!selectedItem || isTransliterating) return;
    
    if (transliteration) {
      setTransliteration(null);
      return;
    }
    
    setIsTransliterating(true);
    // Target script depends on app language: 
    // If app is in GU, transliterate to Gujarati script. 
    // If app is in EN, transliterate to Latin (Romanized) script.
    const targetScript = language === Language.GU ? 'Gujarati' : 'Latin';
    const result = await geminiService.transliterateBhajan(selectedItem.lyrics, targetScript);
    if (result) {
      setTransliteration(result);
    }
    setIsTransliterating(false);
  };

  const scrollToVerse = (index: number) => {
    verseRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const el = verseRefs.current[index];
    if (el) {
      el.classList.add('bg-orange-100/50');
      setTimeout(() => el.classList.remove('bg-orange-100/50'), 1500);
    }
  };

  const getVerses = (text: string) => text.split(/\n\n+/).filter(v => v.trim().length > 0);

  const handleDeleteClick = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (role !== UserRole.ADMIN) return;
    const confirmMsg = language === Language.GU ? 'શું તમે આ ભજન કાઢી નાખવા માંગો છો?' : 'Are you sure you want to delete this bhajan?';
    if (window.confirm(confirmMsg)) {
      if (onDelete) onDelete(itemId);
    }
  };

  const handleEditClick = (e: React.MouseEvent, item: MediaItem) => {
    e.preventDefault(); e.stopPropagation();
    if (role === UserRole.ADMIN && onEdit) onEdit(item);
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.artist && item.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayedLyrics = transliteration || selectedItem?.lyrics || '';

  return (
    <div className="space-y-6">
      {/* Search Bar - Visible for filtering */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-12 pr-4 py-3 bg-white border border-orange-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm font-medium text-orange-900 transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-orange-100 cursor-pointer group flex items-start gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <span className="text-8xl select-none">🕉️</span>
            </div>
            <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">📜</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-serif font-bold text-xl text-orange-900 line-clamp-1">{item.title}</h3>
                <div className="flex items-center gap-1">
                  {role === UserRole.ADMIN && onEdit && (
                    <button onClick={(e) => handleEditClick(e, item)} className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all shrink-0 z-10" title="Edit Bhajan">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  )}
                  {role === UserRole.ADMIN && onDelete && (
                    <button onClick={(e) => handleDeleteClick(e, item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all shrink-0 z-10" title="Delete Bhajan">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
              {item.artist && <p className="text-sm text-gray-500 mt-1 italic font-medium">{item.artist}</p>}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t.bhajans}</span>
                <span className="text-[10px] text-gray-400">{t.uploadedBy} {item.uploader}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fcf8f0] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-orange-200">
            <div className="p-6 border-b border-orange-100 bg-white/50 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700">📜</div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-orange-900 leading-tight">{selectedItem.title}</h2>
                    {selectedItem.artist && <p className="text-xs text-orange-600 font-semibold">{selectedItem.artist}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button 
                    onClick={handleTransliterate}
                    disabled={isTransliterating}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${transliteration ? 'bg-orange-800 text-white' : 'bg-white text-orange-800 border border-orange-200 hover:bg-orange-50'}`}
                    title="Change script for recitation"
                  >
                    <svg className={`w-4 h-4 ${isTransliterating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                    {isTransliterating ? t.transliterating : (transliteration ? t.originalScript : t.transliterate)}
                  </button>
                  <button onClick={() => setSelectedItem(null)} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-orange-100 text-orange-400 hover:text-orange-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest">{t.textSize}</span>
                  <div className="flex bg-white/50 p-1 rounded-xl border border-orange-100">
                    <button onClick={() => setFontSize('text-sm')} className={`px-2 py-1 rounded-lg text-xs font-bold ${fontSize === 'text-sm' ? 'bg-orange-600 text-white' : 'text-orange-800 hover:bg-orange-100'}`}>A</button>
                    <button onClick={() => setFontSize('text-xl md:text-2xl')} className={`px-2 py-1 rounded-lg text-base font-bold ${fontSize === 'text-xl md:text-2xl' ? 'bg-orange-600 text-white' : 'text-orange-800 hover:bg-orange-100'}`}>A</button>
                    <button onClick={() => setFontSize('text-2xl md:text-4xl')} className={`px-2 py-1 rounded-lg text-lg font-bold ${fontSize === 'text-2xl md:text-4xl' ? 'bg-orange-600 text-white' : 'text-orange-800 hover:bg-orange-100'}`}>A+</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-hide">
                  {getVerses(displayedLyrics).map((_, idx) => (
                    <button key={idx} onClick={() => scrollToVerse(idx)} className="px-3 py-1.5 bg-white border border-orange-200 text-orange-900 rounded-lg text-[10px] font-bold shadow-sm hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all active:scale-95">{t.paad} {idx + 1}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
              {getVerses(displayedLyrics).map((verse, idx) => (
                <div key={idx} ref={el => { verseRefs.current[idx] = el; }} className="relative p-6 rounded-2xl transition-all duration-500 border border-transparent">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-50 border border-orange-100 rounded-full text-[10px] font-black text-orange-300 uppercase tracking-widest select-none">{t.paad} {idx + 1}</div>
                  <div className={`max-w-lg mx-auto whitespace-pre-wrap font-serif leading-relaxed text-center text-gray-800 tracking-wide ${fontSize}`}>{verse.trim()}</div>
                </div>
              ))}
              <div className="pt-8 opacity-20 pb-4 text-center">
                <svg className="w-12 h-12 mx-auto text-orange-900 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21l-8.228-3.352a.5.5 0 01-.272-.447V5.51a.5.5 0 01.728-.447L12 8.352l7.772-3.289a.5.5 0 01.728.447v11.691a.5.5 0 01-.272.447L12 21z" /></svg>
                {transliteration && <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">AI Transliteration for Recitation</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BhajanGrid;
