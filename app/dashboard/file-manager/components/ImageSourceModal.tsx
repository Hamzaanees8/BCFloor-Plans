import React from "react";

interface ImageSourceModalProps {
  onClose: () => void;
  onSelectSource: (source: "local" | "gallery") => void;
}

const ImageSourceModal: React.FC<ImageSourceModalProps> = ({
  onClose,
  onSelectSource,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Select Image Source
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => onSelectSource("local")}
            className="flex-1 bg-[#4290E9] text-white py-2 px-4 rounded hover:bg-[#4290e9ea] transition-colors"
          >
            Upload
          </button>
          <button
            onClick={() => onSelectSource("gallery")}
            className="flex-1 bg-[#6BAE41] text-white py-2 px-4 rounded hover:bg-[#6bae41ea] transition-colors"
          >
            From Gallery
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ImageSourceModal;
