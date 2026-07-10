import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Upload, ImageIcon, X } from "lucide-react";

interface ImageSourceModalProps {
  onClose: () => void;
  onSelectSource: (source: "local" | "gallery") => void;
}

const ImageSourceModal: React.FC<ImageSourceModalProps> = ({
  onClose,
  onSelectSource,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Select Media
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-500 mb-6 text-sm">Choose where you want to select the image from.</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelectSource("local")}
            className="flex flex-col items-center justify-center gap-3 bg-gray-50 border border-gray-200 text-gray-700 py-6 px-4 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all group"
          >
            <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
               <Upload className="w-6 h-6 text-[#4290E9]" />
            </div>
            <span className="font-medium text-sm text-center">Upload File</span>
          </button>
          
          <button
            onClick={() => onSelectSource("gallery")}
            className="flex flex-col items-center justify-center gap-3 bg-gray-50 border border-gray-200 text-gray-700 py-6 px-4 rounded-xl hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all group"
          >
             <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
               <ImageIcon className="w-6 h-6 text-[#6BAE41]" />
            </div>
            <span className="font-medium text-sm text-center">From Gallery</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
};

export default ImageSourceModal;
