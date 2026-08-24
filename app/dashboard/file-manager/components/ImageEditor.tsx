import React from "react";
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
  objectFit = "contain",
}: ImageEditorProps) => {
  return (
    <div
      className={`w-full h-full relative flex items-center justify-center overflow-hidden ${className}`}
    >
      <Image
        src={src}
        alt="uploaded"
        fill
        unoptimized
        className={`${
          objectFit === "contain" ? "object-contain" : "object-cover"
        } pointer-events-none`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
          transition: "transform 0.1s ease-out",
        }}
      />
    </div>
  );
};

export default ImageEditor;
