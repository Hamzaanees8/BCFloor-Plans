'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react'; // Lucide icons
import './SlideshowAnimations.css';
import { Files, SelectedFiles } from '../FileManagerContext';

interface CustomSlideshowProps {
  images?: SelectedFiles[];
  delay?: number;
  audioUrl?: string;
  transition?: string;
  api_images?: Files[]
  watermarkUrl?: string;
  onSlideChange?: (index: number) => void;
  currentIndex?: number;
  externalAudioControl?: boolean;
  propIsPlaying?: boolean;
  propIsMuted?: boolean;
  propSetIsPlaying?: (playing: boolean) => void;
  propSetIsMuted?: (muted: boolean) => void;
  className?: string;
  bgClass?: string;
  objectFit?: "cover" | "contain";
}

const transitionClasses = [
  'fade-in',
  'slide-right-left',
  'slide-left-right',
  'slide-top-bottom',
  'slide-bottom-top',
  'reveal-left-right',
  'rotate-bottom-left',
  'rotate-bottom-right',
  'rotate-left-bottom',
  'rotate-left-top',
  'fade-move-left',
  'fade-move-right',
  'fade-across-right',
  'fade-across-left',
  'zoom-fast',
  'zoom-slow',
  'kenburns',
];

const CustomSlideshow: React.FC<CustomSlideshowProps> = ({
  images,
  delay = 3000,
  audioUrl,
  transition,
  api_images,
  onSlideChange,
  currentIndex: propCurrentIndex,
  externalAudioControl,
  propIsPlaying,
  propIsMuted,
  propSetIsPlaying,
  propSetIsMuted,
  className = "h-[100vh]",
  bgClass = "bg-black",
  objectFit = "cover",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const [transitionIndex, setTransitionIndex] = useState(0);
  const [slideCycle, setSlideCycle] = useState(0);
  const [imageRatios, setImageRatios] = useState<{ [key: number]: number }>({});
  const [internalIsPlaying, setInternalIsPlaying] = useState(true);
  const [internalIsMuted, setInternalIsMuted] = useState(false);
  const [manualTransition, setManualTransition] = useState<string | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);

  const isPlaying = (propIsPlaying !== undefined ? propIsPlaying : internalIsPlaying) && isIntersecting;
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  const isMuted = propIsMuted !== undefined ? propIsMuted : internalIsMuted;
  const setIsPlaying = propSetIsPlaying || setInternalIsPlaying;
  const setIsMuted = propSetIsMuted || setInternalIsMuted;

  const [showControls, setShowControls] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  const allImages = React.useMemo(() => {
    const localImages = (images || []).map((img, idx) => ({
      src: URL.createObjectURL(img.file),
      isLocal: true,
      id: `local-${img.file.name}-${img.file.size}-${idx}`
    }));

    const remoteImages = (api_images || []).map((img, idx) => {
      return {
        src: img.url || img.variant_urls?.popup || img.variant_urls?.slider || `${API_URL}/${img.file_path}`,
        isLocal: false,
        id: `remote-${img.uuid || img.file_path}-${idx}`
      };
    });

    return [...localImages, ...remoteImages];
  }, [images, api_images, API_URL]);

  useEffect(() => {
    return () => {
      allImages.forEach(img => {
        if (img.isLocal) {
          URL.revokeObjectURL(img.src);
        }
      });
    };
  }, [allImages]);

  const handleImageLoad = (idx: number, width: number, height: number) => {
    if (width > 0 && height > 0) {
      setImageRatios((prev) => ({
        ...prev,
        [idx]: width / height,
      }));
    }
  };

  const getPanAnimation = (idx: number) => {
    if (objectFit === "contain") return "";

    const imgRatio = imageRatios[idx];
    const containerRatio =
      typeof window !== "undefined"
        ? window.innerWidth / Math.max(window.innerHeight, 1)
        : 16 / 9;

    let possiblePans: string[];

    if (imgRatio) {
      if (imgRatio < containerRatio - 0.08) {
        // Image is taller than container -> vertical cut-off (top/bottom)
        possiblePans = ['pan-cover-top', 'pan-cover-bottom'];
      } else if (imgRatio > containerRatio + 0.08) {
        // Image is wider than container -> horizontal cut-off (left/right)
        possiblePans = ['pan-cover-left', 'pan-cover-right'];
      } else {
        // Close fit or diagonal overflow
        possiblePans = [
          'pan-cover-top',
          'pan-cover-bottom',
          'pan-cover-left',
          'pan-cover-right',
          'pan-cover-top-left',
          'pan-cover-top-right',
          'pan-cover-bottom-left',
          'pan-cover-bottom-right',
        ];
      }
    } else {
      possiblePans = [
        'pan-cover-top',
        'pan-cover-bottom',
        'pan-cover-left',
        'pan-cover-right',
        'pan-cover-top-left',
        'pan-cover-bottom-right',
      ];
    }

    // Pick a random direction from center for this slide visit
    const seed =
      (slideCycle * 17 + idx * 31 + Math.abs(Math.floor(Math.sin(slideCycle + idx * 7) * 10000))) >>>
      0;
    return possiblePans[seed % possiblePans.length];
  };

  const getTransitionClass = () => {
    if (manualTransition) return manualTransition;
    if (transition) return transition;
    return transitionClasses[transitionIndex % transitionClasses.length];
  };

  useEffect(() => {
    if (propCurrentIndex !== undefined) {
      setCurrentIndex((prev) => {
        if (prev !== propCurrentIndex) {
          setLastIndex(prev);
          return propCurrentIndex;
        }
        return prev;
      });
    }
  }, [propCurrentIndex]);

  useEffect(() => {
    if (isPlaying && allImages.length > 0) {
      intervalRef.current = setInterval(() => {
        setManualTransition(null);
        setSlideCycle((prev) => prev + 1);
        const nextIndex = (currentIndex + 1) % allImages.length;
        setLastIndex(currentIndex);
        setCurrentIndex(nextIndex);
        
        if (onSlideChange) {
          onSlideChange(nextIndex);
        }
        
        if (!transition) {
          setTransitionIndex((prev) => (prev + 1) % transitionClasses.length);
        }
      }, delay);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, allImages.length, delay, transition, onSlideChange, currentIndex]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  }

  const isHoveringControlsRef = useRef(false);

  const startControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isHoveringControlsRef.current) {
        setShowControls(false);
      }
    }, 2000);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    startControlsTimeout();
  };

  const handleContainerMouseLeave = () => {
    if (!isHoveringControlsRef.current) {
      setShowControls(false);
    }
  };

  const handleControlMouseEnter = () => {
    isHoveringControlsRef.current = true;
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleControlMouseLeave = () => {
    isHoveringControlsRef.current = false;
    startControlsTimeout();
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allImages.length === 0) return;
    setManualTransition('slide-right-left-fast');
    setSlideCycle((prev) => prev + 1);
    const nextIndex = (currentIndex + 1) % allImages.length;
    setLastIndex(currentIndex);
    setCurrentIndex(nextIndex);
    if (onSlideChange) {
      onSlideChange(nextIndex);
    }
    if (!transition) {
      setTransitionIndex((prev) => (prev + 1) % transitionClasses.length);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allImages.length === 0) return;
    setManualTransition('slide-left-right-fast');
    setSlideCycle((prev) => prev + 1);
    const prevIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
    setLastIndex(currentIndex);
    setCurrentIndex(prevIndex);
    if (onSlideChange) {
      onSlideChange(prevIndex);
    }
    if (!transition) {
      setTransitionIndex((prev) => (prev + 1) % transitionClasses.length);
    }
  };

  useEffect(() => {
    // Initial timeout to hide controls if the user doesn't move the mouse
    startControlsTimeout();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle autoplay and interaction-based play
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !audioUrl) return;

    if (isPlaying) {
      const attemptPlay = () => {
        audioEl.play().catch((error) => {
          if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
            // Autoplay blocked - wait for user interaction
            const unlock = () => {
              window.removeEventListener('click', unlock);
              window.removeEventListener('touchstart', unlock);
              window.removeEventListener('keydown', unlock);
              if (isPlayingRef.current) {
                audioEl.play().catch(() => { });
              }
            };
            window.addEventListener('click', unlock, { once: true });
            window.addEventListener('touchstart', unlock, { once: true });
            window.addEventListener('keydown', unlock, { once: true });
          }
        });
      };
      attemptPlay();
    } else {
      audioEl.pause();
    }

    return () => {
      audioEl.pause();
    };
  }, [audioUrl, isPlaying]);




  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleContainerMouseLeave}
      className={`relative w-full overflow-hidden ${bgClass} group isolate ${className}`}
    >
      {/* Audio - only if not externally controlled */}
      {audioUrl && !externalAudioControl && (
        <audio ref={audioRef} key={audioUrl} loop muted={isMuted}>
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {/* eslint-disable @next/next/no-img-element */}
      {allImages.map((item, idx) => {
        const isActive = idx === currentIndex;
        const isPrev = idx === lastIndex;
        if (!isActive && !isPrev) {
          return null;
        }

        const transitionClass = getTransitionClass();
        const panClass = getPanAnimation(idx);
        const panDuration = Math.max(delay || 4000, 3000);

        return (
          <div
            key={`${item.id}-${isActive ? `active-${currentIndex}-${slideCycle}` : `prev-${lastIndex}`}`}
            className={`absolute inset-0 w-full h-full overflow-hidden ${
              isActive
                ? `opacity-100 z-20 animate-${transitionClass}`
                : "opacity-100 z-10 pointer-events-none"
            }`}
          >
            <img
              src={item.src}
              onLoad={(e) => {
                handleImageLoad(
                  idx,
                  e.currentTarget.naturalWidth,
                  e.currentTarget.naturalHeight,
                );
              }}
              className={`w-full h-full ${
                objectFit === "contain" ? "object-contain" : "object-cover"
              } ${bgClass} ${isActive && panClass ? `animate-${panClass}` : ""}`}
              style={{
                ["--pan-duration" as any]: `${panDuration}ms`,
                animationDuration: `${panDuration}ms`,
                animationTimingFunction: "ease-in-out",
                animationFillMode: "forwards",
              }}
              alt={`Slide ${idx}`}
            />
          </div>
        );
      })}
      {/* Client requested to remove bottom-right branding watermark; commented out in case they want it back later
      {_watermarkUrl && (
        <img
          src={_watermarkUrl}
          alt="Watermark"
          className="absolute bottom-10 right-36 w-24 h-auto opacity-60 pointer-events-none select-none z-[999]"
        />
      )}
      */}

      {/* Play/Pause Button */}
      <div
        onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
        onMouseEnter={handleControlMouseEnter}
        onMouseLeave={handleControlMouseLeave}
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50 transition-opacity duration-500 bg-black/20 hover:bg-black/40 rounded-full p-3 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        {isPlaying ? (
          <Pause size={48} color="#d1d5db" strokeWidth={1.5} />
        ) : (
          <Play size={48} color="#d1d5db" strokeWidth={1.5} />
        )}
      </div>

      {/* Prev/Next Buttons */}
      <div
        onClick={handlePrev}
        onMouseEnter={handleControlMouseEnter}
        onMouseLeave={handleControlMouseLeave}
        className={`absolute top-1/2 left-6 transform -translate-y-1/2 cursor-pointer z-[100] transition-opacity duration-500 bg-black/40 hover:bg-black/60 p-3 rounded-full border border-white/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <ChevronLeft size={40} color="#ffffff" />
      </div>

      <div
        onClick={handleNext}
        onMouseEnter={handleControlMouseEnter}
        onMouseLeave={handleControlMouseLeave}
        className={`absolute top-1/2 right-6 transform -translate-y-1/2 cursor-pointer z-[100] transition-opacity duration-500 bg-black/40 hover:bg-black/60 p-3 rounded-full border border-white/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <ChevronRight size={40} color="#ffffff" />
      </div>

      {/* Bottom Controls Group */}
      <div 
        className={`absolute bottom-10 right-10 flex items-center gap-4 z-[1000] transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onMouseEnter={handleControlMouseEnter}
        onMouseLeave={handleControlMouseLeave}
      >
        {/* Mute/Unmute Button */}
        <div
          onClick={toggleMute}
          className="cursor-pointer bg-black/40 hover:bg-black/60 p-4 rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          {isMuted ? (
            <VolumeX size={24} color="#ffffff" />
          ) : (
            <Volume2 size={24} color="#ffffff" />
          )}
        </div>

        {/* Fullscreen Toggle */}
        <div
          onClick={toggleFullscreen}
          className="cursor-pointer bg-black/40 hover:bg-black/60 p-4 rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize size={24} color="#ffffff" />
          ) : (
            <Maximize size={24} color="#ffffff" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomSlideshow;
