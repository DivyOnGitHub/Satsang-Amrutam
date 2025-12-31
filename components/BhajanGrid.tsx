
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
  
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.artist && item.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder={t.searchPlaceholder} 
          className="w-full px-8 py-5 bg-white border border-orange-100 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-orange-50 transition-all font-bold text-orange-950 placeholder-orange-200" 
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-orange-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2.5} /></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredItems.map(item => (
          <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all border border-orange-50 cursor-pointer group flex items-start gap-6 relative overflow-hidden">
            <div className="bg-orange-50 w-20 h-20 rounded-3xl flex items-center justify-center text-4xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner shrink-0">📜</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-2xl text-orange-900 leading-tight truncate">{item.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.fromCloud && <span className="text-[8px] font-black bg-green-50 text-green-600 px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-100">Live From Sangha</span>}
                    {item.isGlobal && <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100">Global Librarian</span>}
                  </div>
                </div>
                <div className="flex gap-1 z-10 shrink-0">
                  {role === UserRole.ADMIN && !item.isGlobal && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); if(onEdit) onEdit(item); }} className="p-2.5 text-orange-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg></button>
                      <button onClick={(e) => { e.stopPropagation(); if(onDelete) onDelete(item.id); }} className="p-2.5 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg></button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400 italic mt-3 font-medium truncate">{item.artist || 'Traditional'}</p>
              <div className="mt-8 flex items-center justify-between text-[10px] font-black text-gray-300">
                <span className="uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-100"></div>
                  By {item.uploader}
                </span>
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fcf8f0] w-full max-w-3xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-scaleIn border border-orange-200">
            <div className="p-10 border-b border-orange-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
               <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-orange-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl shadow-lg">📜</div>
                 <div>
                    <h2 className="text-3xl font-serif font-bold text-orange-950 leading-tight">{selectedItem.title}</h2>
                    <p className="text-sm font-bold text-orange-500 uppercase tracking-widest">{selectedItem.artist || 'Sacred Traditional'}</p>
                 </div>
               </div>
              <button onClick={() => setSelectedItem(null)} className="w-14 h-14 flex items-center justify-center rounded-full bg-orange-50 hover:bg-orange-100 text-orange-900 text-3xl transition-all">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 md:p-20 text-center bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
              <div className="whitespace-pre-wrap font-serif text-3xl md:text-4xl leading-relaxed text-gray-800 drop-shadow-sm">
                {selectedItem.lyrics}
              </div>
              <div className="mt-20 opacity-20 text-6xl">🕯️</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BhajanGrid;
