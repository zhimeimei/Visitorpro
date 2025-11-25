
import React, { useState, useRef } from 'react';
import { Visit, ChecklistItem } from '../types';
import { ICONS } from '../constants';
import { dataService } from '../services/dataService';
import { parseSmartItinerary, groupItineraryByDate } from '../utils/itineraryUtils';
import ImagePreviewModal from './ImagePreviewModal';

interface VisitDetailModalProps {
  visit: Visit;
  onClose: () => void;
  onUpdate: (updatedVisit: Visit) => void;
  onDelete: () => void;
}

declare const html2canvas: any;

const VisitDetailModal: React.FC<VisitDetailModalProps> = ({ visit, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'itinerary'>('checklist');
  const [localVisit, setLocalVisit] = useState<Visit>(visit);
  
  // Itinerary Editing State
  const [isEditingItinerary, setIsEditingItinerary] = useState(false);
  const [rawItineraryText, setRawItineraryText] = useState('');
  
  // View Preferences - default to true
  const [showInvolvedPeople, setShowInvolvedPeople] = useState(true);

  // Image Generation State
  const teacherScheduleRef = useRef<HTMLDivElement>(null);
  const fullItineraryRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Checklist State
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState('');

  // --- Checklist Logic ---
  
  const toggleChecklistItem = (id: string) => {
    const newChecklist = localVisit.checklist.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    updateVisitChecklist(newChecklist);
  };

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: string) => {
    const newChecklist = localVisit.checklist.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    updateVisitChecklist(newChecklist);
  };

  const deleteChecklistItem = (id: string) => {
    if(window.confirm('确定删除此筹备项吗？')) {
        const newChecklist = localVisit.checklist.filter(item => item.id !== id);
        updateVisitChecklist(newChecklist);
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItemTitle.trim()) return;
    const newItem: ChecklistItem = {
      id: `c-${Date.now()}`,
      title: newChecklistItemTitle,
      isCompleted: false,
      details: '',
      category: 'custom'
    };
    updateVisitChecklist([...localVisit.checklist, newItem]);
    setNewChecklistItemTitle('');
  };

  const updateVisitChecklist = (newChecklist: ChecklistItem[]) => {
    const updated = { ...localVisit, checklist: newChecklist };
    setLocalVisit(updated);
    dataService.saveVisit(updated);
    onUpdate(updated);
  };

  // --- Itinerary Logic ---

  const handleSmartParse = () => {
    if (!rawItineraryText.trim()) return;
    const newItems = parseSmartItinerary(rawItineraryText, localVisit.startDate);
    const updated = { ...localVisit, itinerary: newItems };
    setLocalVisit(updated);
    setIsEditingItinerary(false);
    dataService.saveVisit(updated);
    onUpdate(updated);
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除 ${localVisit.visitorName} 的来访记录吗？此操作无法撤销。`)) {
      onDelete();
    }
  };

  const startEditing = () => {
    if (localVisit.itinerary.length > 0) {
        const grouped = groupItineraryByDate(localVisit.itinerary);
        const dates = Object.keys(grouped).sort();
        let text = "";
        dates.forEach(date => {
            text += `${date}\n`;
            grouped[date].forEach(item => {
                // Reconstruct text for editing: Time Activity (Person1) (Teacher)
                // Note: The internal 'activity' already has brackets removed, so we re-append tags for editing clarity
                let line = `${item.time} ${item.activity}`;
                item.involvedPeople.forEach(p => {
                    line += p === 'Teacher' ? ' (老师)' : ` (${p})`;
                });
                text += `${line}\n`;
            });
            text += '\n';
        });
        setRawItineraryText(text.trim());
    } else {
        setRawItineraryText('');
    }
    setIsEditingItinerary(true);
  };

  // --- Image Generators ---

  const generateImage = async (ref: React.RefObject<HTMLDivElement>, title: string) => {
    if (!ref.current) return;
    try {
      // Wait for font loading/layout
      await document.fonts.ready;
      
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: '#fdfcfb', // Match rice paper
        useCORS: true
      });
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewImage(dataUrl);
    } catch (err) {
      console.error("Image generation failed", err);
      alert("生成图片失败，请稍后重试");
    }
  };

  const deleteItineraryItem = (id: string) => {
    const newItinerary = localVisit.itinerary.filter(i => i.id !== id);
    const updated = { ...localVisit, itinerary: newItinerary };
    setLocalVisit(updated);
    dataService.saveVisit(updated);
    onUpdate(updated);
  };

  // --- Render Helpers ---

  // Contexts: 
  // 'web': UI display
  // 'phone_export': The full image export
  // 'teacher_export': The teacher-only image export
  const renderTags = (people: string[], context: 'web' | 'phone_export' | 'teacher_export' = 'web') => {
    // 1. Teacher Export Mode: Strict filtering
    if (context === 'teacher_export') {
        const hasTeacher = people.includes('Teacher');
        if (!hasTeacher) return null;
        
        return (
             <span className="bg-wood-600 text-stone-50 border border-wood-600 text-[0.65em] px-1.5 py-0.5 rounded font-serif whitespace-nowrap align-middle ml-2">
                老师
            </span>
        );
    }

    // 2. Global Visibility Toggle (Applies to Web and Phone Export)
    // If user toggles off, we show nothing (Activity text is already clean)
    if (!showInvolvedPeople) return null;

    if (!people || people.length === 0) return null;

    const isPhone = context === 'phone_export';
    // Optimized for Phone Export Alignment
    // Use inline-flex to center text in background
    // leading-none to remove extra height from text node
    // h-[3.5rem] to match relative visual weight of 3.4rem text
    // items-center justify-center for perfect centering
    // translate-y-[10%] moves the tag down by 10% of its height
    const baseClasses = isPhone 
        ? "inline-flex items-center justify-center text-[2.1rem] h-[3.5rem] px-5 rounded-xl border ml-4 align-middle leading-none transform translate-y-[10%]" 
        : "text-[0.65em] px-1.5 py-0.5 rounded border ml-2 align-middle";

    return (
        <span className={`inline-flex flex-wrap align-middle ${isPhone ? 'gap-2' : 'gap-1'}`}>
            {people.map((p, idx) => (
                <span 
                    key={idx} 
                    className={`${baseClasses} font-serif whitespace-nowrap
                        ${p === 'Teacher' 
                            ? 'bg-wood-600 text-stone-50 border-wood-600' 
                            : 'bg-zen-600 text-stone-50 border-zen-600'
                        }`}
                >
                    {p === 'Teacher' ? '老师' : p}
                </span>
            ))}
        </span>
    );
  };

  // --- Renderers ---

  const renderChecklist = () => (
    <div className="space-y-6">
      <div className="bg-white/50 p-4 rounded-xl border border-stone-200/60 flex gap-2 items-center shadow-sm">
        <input 
          type="text" 
          value={newChecklistItemTitle}
          onChange={(e) => setNewChecklistItemTitle(e.target.value)}
          placeholder="添加新的筹备事项..."
          className="flex-1 bg-transparent border-none focus:ring-0 outline-none placeholder-stone-400 text-stone-700 font-serif"
          onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
        />
        <button 
          onClick={addChecklistItem}
          disabled={!newChecklistItemTitle.trim()}
          className="bg-zen-600 text-white p-2 rounded-lg hover:bg-zen-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ICONS.Plus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {localVisit.checklist.length === 0 && (
          <div className="text-center text-stone-400 py-12 font-serif opacity-60">暂无筹备事项</div>
        )}
        {localVisit.checklist.map((item) => (
          <div key={item.id} className={`p-4 rounded-xl border transition-all duration-300 group ${item.isCompleted ? 'bg-stone-50 border-stone-200 opacity-70' : 'bg-white border-stone-200 shadow-sm hover:border-zen-300'}`}>
            <div className="flex items-start gap-4">
               <button 
                 onClick={() => toggleChecklistItem(item.id)}
                 className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.isCompleted ? 'bg-zen-500 border-zen-500 text-white' : 'border-stone-300 hover:border-zen-400 text-transparent'}`}
               >
                 <ICONS.Check size={12} />
               </button>

               <div className="flex-1 space-y-1">
                 <input 
                   className={`w-full bg-transparent font-medium text-lg outline-none border-b border-transparent focus:border-wood-300 transition font-serif ${item.isCompleted ? 'text-stone-400 line-through decoration-stone-300' : 'text-stone-800'}`}
                   value={item.title}
                   onChange={(e) => updateChecklistItem(item.id, 'title', e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                 />
                 <input 
                   className="w-full bg-transparent text-xs text-stone-500 outline-none border-b border-transparent focus:border-wood-300 placeholder-stone-300 transition"
                   value={item.details}
                   onChange={(e) => updateChecklistItem(item.id, 'details', e.target.value)}
                   placeholder="备注详情..."
                 />
               </div>

               <button 
                 onClick={() => deleteChecklistItem(item.id)}
                 className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2"
               >
                 <ICONS.Trash2 size={16} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderItinerary = () => {
    const teacherEvents = localVisit.itinerary.filter(i => i.involvedPeople.includes('Teacher'));
    const groupedItinerary = groupItineraryByDate(localVisit.itinerary);
    const sortedDates = Object.keys(groupedItinerary).sort();

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/50 p-4 rounded-xl border border-stone-200/60 gap-4">
          <div className="flex items-center gap-4">
             <h3 className="font-serif font-bold text-stone-700">行程总览</h3>
             {!isEditingItinerary && (
                 <button 
                    onClick={() => setShowInvolvedPeople(!showInvolvedPeople)}
                    className={`text-xs px-2 py-1.5 rounded border transition flex items-center gap-2 font-medium ${showInvolvedPeople ? 'bg-zen-50 text-zen-700 border-zen-200 shadow-sm' : 'bg-white text-stone-400 border-stone-200'}`}
                 >
                    {showInvolvedPeople ? <ICONS.Users size={14} className="text-zen-600"/> : <ICONS.Users size={14} />}
                    {showInvolvedPeople ? '显示参与人' : '隐藏参与人'}
                 </button>
             )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            {!isEditingItinerary ? (
              <>
                <button 
                  onClick={startEditing}
                  className="flex items-center gap-2 bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg text-xs hover:bg-stone-50 transition whitespace-nowrap"
                >
                  <ICONS.Edit3 size={14} />
                  编辑
                </button>
                <button 
                  onClick={() => generateImage(fullItineraryRef, '完整行程单')}
                  className="flex items-center gap-2 bg-wood-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-wood-600 transition shadow-sm whitespace-nowrap"
                >
                  <ICONS.Share2 size={14} />
                  分享行程
                </button>
                {teacherEvents.length > 0 && (
                  <button 
                    onClick={() => generateImage(teacherScheduleRef, '老师行程表')}
                    className="flex items-center gap-2 bg-zen-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-zen-700 transition shadow-sm whitespace-nowrap"
                  >
                    <ICONS.Download size={14} />
                    老师行程
                  </button>
                )}
              </>
            ) : (
              <button 
                onClick={() => setIsEditingItinerary(false)}
                className="flex items-center gap-2 text-stone-500 px-3 py-2 rounded-lg text-sm hover:bg-stone-100 transition"
              >
                取消
              </button>
            )}
          </div>
        </div>

        {isEditingItinerary ? (
          <div className="animate-in fade-in duration-300">
             <div className="mb-2 text-stone-500 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                <ICONS.Sparkles size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold">智能解析提示：</p>
                    <p>在括号内输入人名，如 (张总) 或 (老师)，保存后括号将自动隐藏，并显示为彩色标签。</p>
                </div>
             </div>
             <textarea
               value={rawItineraryText}
               onChange={(e) => setRawItineraryText(e.target.value)}
               className="w-full h-96 p-4 border border-stone-200 rounded-xl focus:ring-1 focus:ring-zen-400 outline-none font-mono text-sm leading-relaxed bg-white shadow-inner text-stone-700"
               placeholder="在此处粘贴或输入行程..."
             />
             <div className="mt-4 flex justify-end">
               <button 
                 onClick={handleSmartParse}
                 className="flex items-center gap-2 bg-zen-600 text-white px-6 py-2 rounded-lg hover:bg-zen-700 transition shadow-lg shadow-zen-200"
               >
                 <ICONS.Sparkles size={16} />
                 保存
               </button>
             </div>
          </div>
        ) : (
          <div className="space-y-8 pb-12">
            {localVisit.itinerary.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-100 rounded-xl">
                 <p className="font-serif">暂无行程安排</p>
                 <button onClick={startEditing} className="mt-2 text-zen-500 hover:underline text-sm">点击编辑</button>
              </div>
            ) : (
              sortedDates.map((date, idx) => (
                <div key={idx} className="relative pl-6 border-l border-wood-200">
                    <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-wood-400 ring-4 ring-stone-50"></div>
                    <div className="mb-4 pt-1">
                        <span className="text-lg font-serif font-bold text-zen-800">{date}</span>
                    </div>
                    
                    <div className="space-y-3">
                        {groupedItinerary[date].map((item) => (
                            <div key={item.id} className="flex gap-4 items-stretch group bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-zen-200 transition-all">
                                <div className="w-16 pt-1 text-right shrink-0">
                                    <span className="font-serif font-bold text-zen-600 text-lg">{item.time.split('-')[0]}</span>
                                </div>
                                <div className="w-px bg-stone-100 mx-1"></div>
                                <div className="flex-1 relative">
                                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                                        <h4 className="font-medium text-stone-800 font-serif text-lg leading-tight">
                                            {item.activity}
                                        </h4>
                                        {renderTags(item.involvedPeople, 'web')}
                                    </div>
                                    <div className="flex gap-4 text-xs text-stone-500 mt-1">
                                        <span className="flex items-center gap-1"><ICONS.MapPin size={12} /> {item.location}</span>
                                    </div>
                                    <button 
                                        onClick={() => deleteItineraryItem(item.id)}
                                        className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500 transition"
                                    >
                                        <ICONS.Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- Hidden Container: Teacher Schedule (Only shows Teacher tags) --- */}
        <div className="absolute -left-[9999px] top-0">
          <div ref={teacherScheduleRef} className="w-[800px] bg-stone-50 p-10 rice-paper-texture">
            <div className="text-center pb-6 mb-6 border-b border-stone-200">
               <div className="inline-block w-14 h-14 border-2 border-zen-700 rounded-full flex items-center justify-center mb-4">
                   <span className="font-serif font-bold text-3xl text-zen-700">师</span>
               </div>
              <h1 className="text-4xl font-serif font-bold text-zen-900 mb-2">老师行程安排</h1>
              <p className="text-wood-600 text-xl font-serif">{localVisit.visitorName} {localVisit.visitorTitle}</p>
            </div>
            <div className="space-y-6">
              {teacherEvents.map((item, i) => (
                <div key={i} className="flex pl-4 items-start">
                   <div className="w-40 shrink-0 text-right pr-6 pt-1 border-r border-wood-300">
                     <div className="text-2xl font-serif font-bold text-stone-800">{item.date.split('-').slice(1).join('.')}</div>
                     <div className="text-xl text-wood-600 font-medium mt-1">{item.time}</div>
                   </div>
                   <div className="pl-6 flex-1">
                     <div className="text-3xl font-serif font-bold text-zen-900 mb-2 flex flex-wrap items-center gap-2">
                        {item.activity}
                        {renderTags(item.involvedPeople, 'teacher_export')}
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- Hidden Container: Full Itinerary (Phone Optimized) --- */}
          <div ref={fullItineraryRef} className="w-[1242px] bg-stone-50 rice-paper-texture flex flex-col px-24 py-32 font-serif">
            
            {/* Header Section */}
            <div className="text-center pb-24 border-b-[4px] border-wood-200/50">
              <h1 className="text-[7rem] font-bold text-zen-900 mb-12 tracking-wide">行程安排</h1>
              
              <div className="flex justify-center items-center gap-8 text-wood-800 text-5xl mb-16">
                 <span className="bg-white/60 px-10 py-4 rounded-2xl border border-wood-100 shadow-sm">{localVisit.startDate}</span>
                 <span className="text-wood-400">至</span>
                 <span className="bg-white/60 px-10 py-4 rounded-2xl border border-wood-100 shadow-sm">{localVisit.endDate}</span>
              </div>
              
              <div className="inline-block bg-zen-50 px-16 py-6 rounded-full border border-zen-100">
                  <span className="text-stone-500 text-4xl mr-6">访客</span>
                  <span className="text-stone-800 text-5xl font-bold">{localVisit.visitorName}</span>
                  {localVisit.visitorTitle && <span className="text-stone-600 text-4xl ml-4">({localVisit.visitorTitle})</span>}
              </div>
            </div>

            {/* Body Section */}
            <div className="pt-24 space-y-28">
               {sortedDates.map((date, idx) => (
                  <div key={idx} className="relative">
                     {/* Date Header */}
                     <div className="flex items-end gap-8 mb-16 border-l-8 border-zen-600 pl-8">
                        {/* Reduced font size from 6rem to 5.1rem (~15%) */}
                        <h2 className="text-[5.1rem] font-bold text-zen-800 leading-none">{date}</h2>
                     </div>
                     
                     {/* Events Grid - Strict Alignment Mode */}
                     {/* Using items-start to ensure they hang from the top. 
                         Changed pt-8 to pt-5 to shift time UP slightly relative to text (5% adjustment).
                         Reduced font size to 3.4rem (approx 8% smaller than 3.7rem). 
                     */}
                     <div className="space-y-20 pl-4">
                        {groupedItinerary[date].map((item, i) => (
                           <div key={i} className="flex items-start group">
                              {/* Time Column - Reduced top padding to pt-5 to shift up */}
                              <div className="w-[280px] shrink-0 text-right pt-5">
                                  <div className="text-[3.4rem] font-bold text-wood-700 font-serif tracking-tight leading-none">
                                      {item.time.split(/[-:]/)[0]}:{item.time.split(/[-:]/)[1]}
                                  </div>
                                  {item.time.includes('-') && (
                                     <div className="text-[2.1rem] text-stone-400 mt-2 font-medium leading-none">
                                        - {item.time.split('-')[1]}
                                     </div>
                                  )}
                              </div>

                              {/* Divider */}
                              <div className="w-1 bg-stone-200 self-stretch rounded-full mx-12"></div>
                              
                              {/* Content Column */}
                              {/* Activity Text has pt-0. Time has pt-5. */}
                              <div className="flex-1">
                                  <div className="text-[3.4rem] text-stone-800 font-bold leading-tight mb-4 pt-0">
                                      <span className="align-middle">{item.activity}</span>
                                      {renderTags(item.involvedPeople, 'phone_export')}
                                  </div>
                                  
                                  {item.location && item.location !== '现场' && (
                                      <div className="flex items-center gap-4 text-[2.4rem] text-stone-500 mt-4 leading-none">
                                          <span className="opacity-50">📍</span>
                                          {item.location}
                                      </div>
                                  )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
            
            {/* Footer Section */}
            <div className="mt-40 pt-20 border-t-2 border-stone-200 text-center">
               <div className="flex items-center justify-center gap-4 text-stone-400 text-5xl font-calligraphy opacity-70">
                  <span className="tracking-[0.2em]">春风常在</span>
                  <span>·</span>
                  <span className="font-serif">VisitorPro</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-200/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
        <div className="bg-stone-50 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans border border-white">
          
          {/* Light Airy Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-zen-50 to-stone-50 p-8 border-b border-white">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs tracking-wider uppercase bg-zen-100 text-zen-700 px-2 py-0.5 rounded border border-zen-200">
                    接待: {localVisit.liaison}
                  </span>
                  <span className="text-xs tracking-wider uppercase text-stone-400 font-mono">
                    {localVisit.startDate} - {localVisit.endDate}
                  </span>
                </div>
                <h2 className="text-3xl font-serif font-bold mb-1 text-zen-900 tracking-wide">{localVisit.visitorName}</h2>
                <p className="text-lg text-wood-500 font-serif italic">{localVisit.visitorTitle || '贵宾'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-50 text-stone-300 hover:text-red-500 rounded-full transition"
                  title="删除"
                >
                  <ICONS.Trash2 size={18} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-stone-200 text-stone-400 rounded-full transition">
                  <ICONS.X size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs - Integrated */}
          <div className="flex bg-stone-50 border-b border-stone-200">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex-1 py-4 text-center text-sm font-medium transition-all relative ${activeTab === 'checklist' ? 'text-zen-700 bg-white/50' : 'text-stone-400 hover:text-stone-600'}`}
            >
              筹备清单
              {activeTab === 'checklist' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zen-500"></span>}
            </button>
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`flex-1 py-4 text-center text-sm font-medium transition-all relative ${activeTab === 'itinerary' ? 'text-zen-700 bg-white/50' : 'text-stone-400 hover:text-stone-600'}`}
            >
              行程安排
              {activeTab === 'itinerary' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zen-500"></span>}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-stone-50 rice-paper-texture">
            {activeTab === 'checklist' ? renderChecklist() : renderItinerary()}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal 
          imageData={previewImage} 
          title={`图片预览-${localVisit.visitorName}`}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
};

export default VisitDetailModal;
