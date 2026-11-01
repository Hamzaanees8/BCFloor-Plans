import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface ImageEditorProps {
  src: string;
  scale: number;
  position: { x: number; y: number };
  rotation?: number;
  className?: string;
  objectFit?: "cover" | "contain";
  isProcessing?: boolean;
}

const ImageEditor = ({
  src,
  scale,
  position,
  rotation = 0,
  className = "",
  objectFit = "cover",
  isProcessing = false,
}: ImageEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);

  const isPlaceholderOnly =
    src.startsWith("data:image/svg+xml") && src.includes("Processing...");

  const calculateBaseScale = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      if (!containerRef.current || objectFit === "contain") {
        setBaseScale(1);
        return;
      }
      const { clientWidth, clientHeight } = containerRef.current;
      if (!naturalWidth || !naturalHeight || !clientWidth || !clientHeight)
        return;
      const containerAR = clientWidth / clientHeight;
      const imageAR = naturalWidth / naturalHeight;
      let drawnWidth, drawnHeight;
      if (imageAR > containerAR) {
        drawnWidth = clientWidth;
        drawnHeight = clientWidth / imageAR;
      } else {
        drawnHeight = clientHeight;
        drawnWidth = clientHeight * imageAR;
      }
      setBaseScale(
        Math.max(clientWidth / drawnWidth, clientHeight / drawnHeight)
      );
    },
    [objectFit]
  );

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    calculateBaseScale(naturalWidth, naturalHeight);
  };

  useEffect(() => {
    if (objectFit === "contain") {
      setBaseScale(1);
      return;
    }
    if (!src || isPlaceholderOnly) return;
    const img = new window.Image();
    img.src = src;
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      calculateBaseScale(img.naturalWidth, img.naturalHeight);
    }
  }, [src, objectFit, isPlaceholderOnly, calculateBaseScale]);

  if (isPlaceholderOnly) {
    return (
      <div
        data-html2canvas-ignore="true"
        className={`w-full h-full relative flex flex-col items-center justify-center bg-gray-100 p-2 text-center select-none ${className}`}
      >
        <Loader2 className="w-5 h-5 text-gray-500 animate-spin mb-1" />
        <span className="text-[11px] font-semibold text-gray-600 tracking-wide uppercase">
          Processing...
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing ${className}`}
    >
      <Image
        src={src}
        onLoad={handleLoad}
        alt="uploaded"
        fill
        unoptimized
        className="object-contain pointer-events-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${
            scale * (objectFit === "contain" ? 1 : baseScale)
          })`,
          transition: "transform 0.1s ease-out",
        }}
      />

      {isProcessing && (
        <div
          data-html2canvas-ignore="true"
          className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[10.5px] font-medium shadow-md pointer-events-none select-none"
        >
          <Loader2 className="w-3 h-3 text-cyan-300 animate-spin shrink-0" />
          <span>Optimizing print media...</span>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;
