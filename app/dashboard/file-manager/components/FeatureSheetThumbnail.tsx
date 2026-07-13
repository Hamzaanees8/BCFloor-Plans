import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeatureSheetThumbnailProps {
  images: string[];
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const FeatureSheetThumbnail: React.FC<FeatureSheetThumbnailProps> = ({
  images,
  className = "",
  onClick,
  children,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isMultiPage = images.length > 1;

  useEffect(() => {
    const startSlideshow = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 1500);
    };

    const stopSlideshow = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    if (isHovered && isMultiPage) {
      if (!isAutoPlayPaused) {
        startSlideshow();
      } else {
        stopSlideshow();
      }
    } else {
      stopSlideshow();
      setCurrentIndex(0);
      setIsAutoPlayPaused(false);
    }
    return stopSlideshow;
  }, [isHovered, isMultiPage, images.length, isAutoPlayPaused]);

  const handleManualNav = (e: React.MouseEvent, direction: "prev" | "next") => {
    e.stopPropagation(); // prevent clicking the thumbnail container
    if (direction === "next") {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    
    setIsAutoPlayPaused(true);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="w-full h-full relative">
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="absolute inset-0 bg-center bg-no-repeat transition-opacity duration-500 ease-in-out"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "contain",
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* Manual Navigation Controls */}
      {isMultiPage && isHovered && (
        <>
          <button
            onClick={(e) => handleManualNav(e, "prev")}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1 z-10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => handleManualNav(e, "next")}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1 z-10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {/* Page Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentIndex ? "bg-white" : "bg-white/50"
                } transition-colors`}
              />
            ))}
          </div>
        </>
      )}

      {children}
    </div>
  );
};

export default FeatureSheetThumbnail;
