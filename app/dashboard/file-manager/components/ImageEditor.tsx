import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface ImageEditorProps {
  src: string;
  scale: number;
  position: { x: number; y: number };
  rotation?: number;
  className?: string;
  objectFit?: "cover" | "contain";
}

const ImageEditor = ({
  src,
  scale,
  position,
  rotation = 0,
  className = "",
  objectFit = "cover",
}: ImageEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);

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
    if (!src) return;
    const img = new window.Image();
    img.src = src;
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      calculateBaseScale(img.naturalWidth, img.naturalHeight);
    }
  }, [src, objectFit, calculateBaseScale]);

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
    </div>
  );
};

export default ImageEditor;
