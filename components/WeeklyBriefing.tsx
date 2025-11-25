
import React, { useRef, useState } from 'react';
import { Visit } from '../types';
import { ICONS } from '../constants';
import ImagePreviewModal from './ImagePreviewModal';

interface WeeklyBriefingProps {
  visits: Visit[];
  onClose: () => void;
}

declare const html2canvas: any;

const WeeklyBriefing: React.FC<WeeklyBriefingProps> = ({ visits, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#f8fafc', // slate-50
      });
      const dataUrl = canvas.toDataURL('image/png');
      setPreviewImage(dataUrl);
    } catch (err) {
      console.error(err);
      alert("生成简报失败");
    }
  };

  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  
  const now = new Date();
  const relevantVisits = visits.filter(v => {
    const start = new Date(v.startDate);
    const end = new Date(v.endDate);
    return (start <= next7Days && end >= now);
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-lg text-gray-800">访客简报预览</h3>
            <div className="flex gap-2">
              <button onClick={handleGenerateImage} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm transition">
                <ICONS.Share2 size={16} /> 生成图片分享
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500">
                <ICONS.Plus className="rotate-45" size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex justify-center">
            {/* Printable Area */}
            <div ref={printRef} className="w-[600px] bg-white shadow-lg min-h-[600px] flex flex-col">
              <div className="bg-slate-800 text-white p-8 text-center pattern-bg">
                <h1 className="text-2xl font-bold mb-2">本周访客接待简报</h1>
                <p className="text-slate-300 text-sm">
                  {new Date().toLocaleDateString()} - {next7Days.toLocaleDateString()}
                </p>
              </div>
              
              <div className="p-8 flex-1">
                {relevantVisits.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">未来7天暂无访客安排</div>
                ) : (
                  <div className="space-y-6">
                    {relevantVisits.map((visit, idx) => (
                      <div key={idx} className="flex bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                        <div className={`w-2 ${visit.color}`}></div>
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-bold text-lg text-gray-900">{visit.visitorName}</span>
                              {visit.visitorTitle && <span className="text-sm text-gray-500 ml-2">{visit.visitorTitle}</span>}
                            </div>
                            <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">
                              {visit.liaison} 接待
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <ICONS.Clock size={14} className="text-brand-500" />
                              <span>{visit.startDate} 至 {visit.endDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <ICONS.Home size={14} className="text-brand-500" />
                              <span>{visit.accommodation || '未安排住宿'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
                内部资料，请勿外传 • VisitorPro
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <ImagePreviewModal 
          imageData={previewImage}
          title="周简报图片"
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
};

export default WeeklyBriefing;
