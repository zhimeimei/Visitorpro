
import React from 'react';
import { ICONS } from '../constants';

interface ImagePreviewModalProps {
  imageData: string;
  title: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageData, title, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
            <ICONS.X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex items-center justify-center">
          <img src={imageData} alt="Preview" className="max-w-full h-auto shadow-lg rounded-lg" />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <p className="text-center text-sm text-gray-500 mb-3">
            <ICONS.Share2 size={16} className="inline mr-1" />
            长按图片可保存到相册或转发给微信好友
          </p>
          <a 
            href={imageData} 
            download={`${title}-${new Date().toLocaleDateString()}.png`}
            className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-medium transition"
          >
            保存图片
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
