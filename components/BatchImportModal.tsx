
import React, { useState, useRef } from 'react';
import { ICONS, COLORS } from '../constants';
import { Visit, ItineraryItem, ChecklistItem } from '../types';
import { dataService } from '../services/dataService';

interface BatchImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({ onClose, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Visit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template CSV Content
  const templateContent = `姓名,头衔,开始日期(YYYY-MM-DD),结束日期(YYYY-MM-DD),小天使,住宿信息,车辆详情,礼物详情,行程(格式:日期|时间|活动|地点|参与人;;下一条...)
张教授,院长,2024-03-20,2024-03-22,小王,迎宾楼301,需要GL8接机,准备本地特产,2024-03-20|14:00|参观实验室|A座|Teacher;;2024-03-21|09:00|座谈会|会议室|Director,Teacher`;

  const downloadTemplate = () => {
    const blob = new Blob([`\uFEFF${templateContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '访客导入模板.csv';
    link.click();
  };

  const parseItinerary = (itineraryStr: string): ItineraryItem[] => {
    if (!itineraryStr || itineraryStr.trim() === '') return [];
    const items = itineraryStr.split(';;');
    return items.map((item, index) => {
      const parts = item.split('|');
      if (parts.length < 3) return null;
      return {
        id: `imported-${Date.now()}-${index}`,
        date: parts[0]?.trim() || '',
        time: parts[1]?.trim() || '',
        activity: parts[2]?.trim() || '',
        location: parts[3]?.trim() || '',
        involvedPeople: parts[4] ? parts[4].split(',').map(p => p.trim()) : [],
        isKeyNode: false
      };
    }).filter(Boolean) as ItineraryItem[];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n');
        const parsedVisits: Visit[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;
          const cols = row.split(',');
          if (cols.length < 4) continue;

          // Create Checklist Array
          const initialChecklist: ChecklistItem[] = [
            { id: `c-imp-${i}-1`, title: '住宿安排', isCompleted: !!cols[5]?.trim(), details: cols[5]?.trim() || '', category: 'hotel' },
            { id: `c-imp-${i}-2`, title: '车辆接送', isCompleted: !!cols[6]?.trim(), details: cols[6]?.trim() || '', category: 'vehicle' },
            { id: `c-imp-${i}-3`, title: '礼物准备', isCompleted: !!cols[7]?.trim(), details: cols[7]?.trim() || '', category: 'gifts' },
          ];

          const visit: Visit = {
            id: `v-import-${Date.now()}-${i}`,
            visitorName: cols[0]?.trim() || '未命名',
            visitorTitle: cols[1]?.trim() || '',
            startDate: cols[2]?.trim() || '',
            endDate: cols[3]?.trim() || '',
            color: COLORS[i % COLORS.length],
            liaison: cols[4]?.trim() || '',
            accommodation: cols[5]?.trim() || '',
            checklist: initialChecklist,
            itinerary: parseItinerary(cols.slice(8).join(','))
          };

          parsedVisits.push(visit);
        }

        if (parsedVisits.length === 0) {
          setError('未解析到有效数据，请检查CSV格式。');
        } else {
          setPreviewData(parsedVisits);
        }
      } catch (err) {
        setError('文件解析失败，请确保是标准的CSV格式。');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      dataService.addVisits(previewData);
      setIsProcessing(false);
      onImportSuccess();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] font-sans">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-wood-100 text-wood-700 rounded-lg">
              <ICONS.Upload size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-800 font-serif">批量导入访客</h3>
              <p className="text-sm text-stone-400">支持上传CSV文件批量创建接待任务</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500">
            <ICONS.Plus className="rotate-45" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-stone-50">
          {!file ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl p-10 bg-white hover:bg-wood-50 hover:border-wood-300 transition-colors cursor-pointer group"
                 onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv"
                onChange={handleFileUpload}
              />
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:bg-wood-200 transition">
                <ICONS.FileText size={32} className="text-stone-500 group-hover:text-wood-700" />
              </div>
              <p className="text-lg font-medium text-stone-700 mb-2">点击上传 CSV 文件</p>
              <p className="text-sm text-stone-400 mb-6">支持 .csv 格式 (UTF-8 编码)</p>
              
              <button 
                onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                className="text-wood-600 text-sm hover:underline flex items-center gap-1"
              >
                <ICONS.Download size={14} /> 下载标准模板
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <ICONS.FileText className="text-wood-600" />
                  <span className="font-medium text-stone-700">{file.name}</span>
                </div>
                <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:text-red-700">重新上传</button>
              </div>

              {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-100">
                  <ICONS.AlertCircle size={20} />
                  {error}
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-stone-800 mb-3 font-serif">解析预览 ({previewData.length} 位访客)</h4>
                  <div className="border border-stone-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto bg-white">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-stone-50 text-stone-500 font-medium">
                        <tr>
                          <th className="p-3">姓名</th>
                          <th className="p-3">日期</th>
                          <th className="p-3">小天使</th>
                          <th className="p-3">行程数</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {previewData.map((v, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                            <td className="p-3 font-medium text-stone-900">{v.visitorName} <span className="text-stone-400 font-normal">{v.visitorTitle}</span></td>
                            <td className="p-3 text-stone-600">{v.startDate}</td>
                            <td className="p-3 text-stone-600">{v.liaison || '-'}</td>
                            <td className="p-3">
                                {v.itinerary.length > 0 ? (
                                    <span className="text-zen-600 bg-zen-50 px-2 py-0.5 rounded text-xs">{v.itinerary.length} 项</span>
                                ) : (
                                    <span className="text-stone-400 text-xs">无行程</span>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-100 flex justify-end gap-3 bg-white rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-stone-600 hover:bg-stone-100 rounded-lg font-medium transition"
          >
            取消
          </button>
          <button 
            onClick={handleConfirmImport}
            disabled={!file || !!error || isProcessing || previewData.length === 0}
            className={`px-5 py-2.5 text-white rounded-lg font-medium transition flex items-center gap-2
              ${(!file || !!error || isProcessing || previewData.length === 0) ? 'bg-stone-300 cursor-not-allowed' : 'bg-zen-700 hover:bg-zen-800 shadow-lg shadow-zen-500/30'}
            `}
          >
            {isProcessing ? '导入中...' : '确认导入'}
            {!isProcessing && <ICONS.Check size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchImportModal;