import React, { useState } from 'react';
import { ICONS, COLORS } from '../constants';
import { Visit, ItineraryItem, ChecklistItem } from '../types';
import { parseSmartItinerary, groupItineraryByDate } from '../utils/itineraryUtils';

interface AddVisitModalProps {
  onClose: () => void;
  onSave: (visit: Visit) => void;
}

const AddVisitModal: React.FC<AddVisitModalProps> = ({ onClose, onSave }) => {
  // Basic Info State
  const [visitorName, setVisitorName] = useState('');
  const [visitorTitle, setVisitorTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [liaison, setLiaison] = useState('');

  // Initial Checklist Details (Text Inputs)
  const [accommodation, setAccommodation] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState(''); 
  const [giftDetails, setGiftDetails] = useState('');

  // Itinerary State
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [rawItineraryText, setRawItineraryText] = useState('');
  const [isParsingMode, setIsParsingMode] = useState(true); // Default to text mode

  const handleSmartParse = () => {
    const contextDate = startDate || new Date().toISOString().split('T')[0];
    const parsedItems = parseSmartItinerary(rawItineraryText, contextDate);
    setItinerary(parsedItems);
    setIsParsingMode(false);
  };

  const handleDeleteItem = (id: string) => {
    setItinerary(itinerary.filter(i => i.id !== id));
  };

  const handleSubmit = () => {
    if (!visitorName || !startDate || !endDate) {
      alert("请填写完整的访客基本信息");
      return;
    }

    // Auto-parse itinerary logic:
    // If the user is currently in parsing mode (editing text) OR if the itinerary is empty but there is text,
    // we should prioritize the text and parse it now.
    let finalItinerary = itinerary;
    if ((isParsingMode || itinerary.length === 0) && rawItineraryText.trim()) {
        const contextDate = startDate || new Date().toISOString().split('T')[0];
        finalItinerary = parseSmartItinerary(rawItineraryText, contextDate);
    }

    const initialChecklist: ChecklistItem[] = [
      { id: `c-init-1`, title: '住宿安排', isCompleted: false, details: accommodation, category: 'hotel' },
      { id: `c-init-2`, title: '车辆接送', isCompleted: false, details: vehicleDetails, category: 'vehicle' },
      { id: `c-init-3`, title: '礼物准备', isCompleted: false, details: giftDetails, category: 'gifts' },
      { id: `c-init-4`, title: '其他事项', isCompleted: false, details: '', category: 'other' },
    ];

    const newVisit: Visit = {
      id: `v-manual-${Date.now()}`,
      visitorName,
      visitorTitle,
      startDate,
      endDate,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      liaison: liaison || '待定',
      accommodation: accommodation || '未安排',
      checklist: initialChecklist,
      itinerary: finalItinerary
    };

    onSave(newVisit);
    onClose();
  };

  const renderTags = (people: string[]) => {
    if (!people || people.length === 0) return null;
    return (
        <div className="inline-flex flex-wrap gap-1 ml-2 align-middle">
            {people.map((p, idx) => (
                 <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded font-serif ${p === 'Teacher' ? 'bg-wood-600 text-stone-50 border border-wood-600' : 'bg-zen-600 text-stone-50 border border-zen-600'}`}>
                    {p === 'Teacher' ? '老师' : p}
                </span>
            ))}
        </div>
    );
  };

  const renderItineraryPreview = () => {
    const grouped = groupItineraryByDate(itinerary);
    const dates = Object.keys(grouped).sort();

    if (dates.length === 0) return (
      <div className="text-center py-8 text-stone-400 text-sm">暂无解析出的行程</div>
    );

    return (
      <div className="space-y-4">
        {dates.map(date => (
          <div key={date} className="border border-stone-200 rounded-lg overflow-hidden bg-white/50">
            <div className="bg-stone-50/50 px-4 py-2 border-b border-stone-100 flex items-center justify-between">
              <div className="font-bold text-zen-800 flex items-center gap-2 font-serif">
                <ICONS.Calendar size={14} className="text-zen-400"/>
                {date}
              </div>
            </div>
            <div className="divide-y divide-stone-50">
              {grouped[date].map(item => (
                <div key={item.id} className="p-3 flex gap-3 hover:bg-white transition group">
                   <div className="w-16 shrink-0 text-sm font-medium text-stone-500 pt-0.5 font-serif">{item.time}</div>
                   <div className="flex-1">
                      <div className="text-stone-800 text-sm font-medium flex flex-wrap items-center gap-1 font-serif">
                        {item.activity}
                        {renderTags(item.involvedPeople)}
                      </div>
                      <div className="text-xs text-stone-400 mt-1">{item.location}</div>
                   </div>
                   <button onClick={() => handleDeleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition px-2">
                     <ICONS.Trash2 size={14} />
                   </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-200/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-50 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans border border-white">
        {/* Header */}
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif font-bold text-zen-900">新增来访接待</h2>
            <span className="text-xs text-stone-400 border border-stone-200 px-2 py-0.5 rounded-full">New Visit</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition">
            <ICONS.X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-stone-50 rice-paper-texture">
          {/* Section 1: Basic Info */}
          <section className="bg-white/60 p-6 rounded-xl shadow-sm border border-stone-100">
            <h3 className="text-lg font-bold text-zen-800 mb-6 flex items-center gap-2 font-serif">
              <span className="w-1 h-4 bg-zen-400 rounded-full"></span>
              基本信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">访客姓名</label>
                <input 
                  type="text" 
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none transition font-serif"
                  placeholder="如：张教授"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">头衔/职务</label>
                <input 
                  type="text" 
                  value={visitorTitle}
                  onChange={e => setVisitorTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none transition font-serif"
                  placeholder="如：某高校院长"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">开始日期</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none transition text-stone-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">结束日期</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none transition text-stone-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">接待负责人 (小天使)</label>
                <input 
                  type="text" 
                  value={liaison}
                  onChange={e => setLiaison(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none transition font-serif"
                  placeholder="负责对接的工作人员姓名"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Logistics */}
          <section className="bg-white/60 p-6 rounded-xl shadow-sm border border-stone-100">
             <h3 className="text-lg font-bold text-zen-800 mb-6 flex items-center gap-2 font-serif">
              <span className="w-1 h-4 bg-wood-400 rounded-full"></span>
              接待筹备 (初始)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">住宿安排</label>
                <input 
                  type="text" 
                  value={accommodation}
                  onChange={e => setAccommodation(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">礼物准备</label>
                <input 
                  type="text" 
                  value={giftDetails}
                  onChange={e => setGiftDetails(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">车辆/航班</label>
                <input 
                  type="text" 
                  value={vehicleDetails}
                  onChange={e => setVehicleDetails(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none transition"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Itinerary */}
          <section className="bg-white/60 p-6 rounded-xl shadow-sm border border-stone-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zen-800 flex items-center gap-2 font-serif">
                <span className="w-1 h-4 bg-stone-400 rounded-full"></span>
                行程安排
              </h3>
              <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button 
                  onClick={() => setIsParsingMode(true)}
                  className={`px-3 py-1 text-xs rounded-md transition ${isParsingMode ? 'bg-white shadow-sm text-zen-800 font-medium' : 'text-stone-400'}`}
                >
                  输入
                </button>
                <button 
                  onClick={() => {
                     if(isParsingMode && rawItineraryText) handleSmartParse();
                     setIsParsingMode(false);
                  }}
                  className={`px-3 py-1 text-xs rounded-md transition ${!isParsingMode ? 'bg-white shadow-sm text-zen-800 font-medium' : 'text-stone-400'}`}
                >
                  预览
                </button>
              </div>
            </div>

            {isParsingMode ? (
              <div className="animate-in fade-in">
                 <div className="mb-2 text-xs text-stone-400 flex items-center gap-1">
                    <ICONS.Sparkles size={12}/> 智能提示：输入如 "14:00 参观实验室 (李院长)"，将自动提取人名并生成标签。
                 </div>
                 <textarea
                   value={rawItineraryText}
                   onChange={e => setRawItineraryText(e.target.value)}
                   className="w-full h-40 p-3 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-zen-400 outline-none font-mono text-sm leading-relaxed text-stone-600 shadow-inner"
                   placeholder={`3月20日 
14:00 接机 (张总)
16:00 酒店入住 (后勤王部长)`}
                 />
                 <div className="mt-3 flex justify-end">
                   <button 
                     onClick={handleSmartParse}
                     className="bg-zen-600 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-zen-700 transition flex items-center gap-1 shadow-sm"
                   >
                     <ICONS.Sparkles size={12} /> 解析
                   </button>
                 </div>
              </div>
            ) : (
              <div className="animate-in fade-in">
                {itinerary.length === 0 ? (
                  <div className="text-center py-6 text-stone-300 text-sm border border-dashed border-stone-200 rounded-lg">
                    暂无预览
                  </div>
                ) : (
                  renderItineraryPreview()
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-stone-100 bg-white/80 backdrop-blur-sm flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-stone-500 hover:bg-stone-50 rounded-lg font-medium transition text-sm"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2 bg-zen-700 text-white rounded-lg font-medium hover:bg-zen-800 transition shadow-lg shadow-zen-200 text-sm flex items-center gap-2"
          >
            <ICONS.Check size={16} />
            完成创建
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVisitModal;