import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";

interface ImageEditorProps {
  src: string;
  scale: number;
  position: { x: number; y: number };
  rotation?: number;
  className?: string;
}

const ImageEditor = ({
  src,
  scale,
  position,
  rotation = 0,
  className = ""
}: ImageEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const calculateBaseScale = (natW: number, natH: number) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    
    if (natW === 0 || natH === 0 || clientWidth === 0 || clientHeight === 0) return;
    
    // Determine effective dimensions based on rotation
    const isRotated90 = rotation % 180 !== 0;
    const effNaturalWidth = isRotated90 ? natH : natW;
    const effNaturalHeight = isRotated90 ? natW : natH;
    
    const containerAR = clientWidth / clientHeight;
    const imageAR = effNaturalWidth / effNaturalHeight;
    
    let drawnWidth, drawnHeight;
    if (imageAR > containerAR) {
      drawnWidth = clientWidth;
      drawnHeight = clientWidth / imageAR;
    } else {
      drawnHeight = clientHeight;
      drawnWidth = clientHeight * imageAR;
    }
    
    const requiredScale = Math.max(clientWidth / drawnWidth, clientHeight / drawnHeight);
    setBaseScale(requiredScale);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ w: naturalWidth, h: naturalHeight });
    calculateBaseScale(naturalWidth, naturalHeight);
  };

  useEffect(() => {
    if (naturalSize.w > 0 && naturalSize.h > 0) {
      calculateBaseScale(naturalSize.w, naturalSize.h);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, naturalSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (naturalSize.w > 0 && naturalSize.h > 0) {
        calculateBaseScale(naturalSize.w, naturalSize.h);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, naturalSize]);

  return (
    <div ref={containerRef} className={`w-full h-full relative flex items-center justify-center overflow-hidden ${className}`}>
      <Image
        src={src}
        onLoad={handleLoad}
        alt="uploaded"
        fill
        unoptimized
        className="object-contain pointer-events-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale * baseScale}) rotate(${rotation}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      />
    </div>
  );
};

export default ImageEditor;
