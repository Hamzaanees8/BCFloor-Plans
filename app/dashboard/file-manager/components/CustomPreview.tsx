'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, PauseCircle, Play, Volume2, VolumeX } from 'lucide-react'; // Lucide icons
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
}

const transitionClasses = [
  'kenburns',
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
];

const CustomSlideshow: React.FC<CustomSlideshowProps> = ({
  images,
  delay = 3000,
  audioUrl,
  transition,
  api_images,
  watermarkUrl,
  onSlideChange,
  currentIndex: propCurrentIndex,
  externalAudioControl,
  propIsPlaying,
  propIsMuted,
  propSetIsPlaying,
  propSetIsMuted,
  className = "h-[100vh]"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const [transitionIndex, setTransitionIndex] = useState(0);
  const [internalIsPlaying, setInternalIsPlaying] = useState(true);
  const [internalIsMuted, setInternalIsMuted] = useState(false);

  const isPlaying = propIsPlaying !== undefined ? propIsPlaying : internalIsPlaying;
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

    const remoteImages = (api_images || []).map((img, idx) => ({
      src: img.url || img.variant_urls?.popup || img.variant_urls?.slider || `${API_URL}/${img.file_path}`,
      isLocal: false,
      id: `remote-${img.uuid || img.file_path}-${idx}`
    }));

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

  const getTransitionClass = () =>
    transition ? transition : transitionClasses[transitionIndex];

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

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
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
              audioEl.play().catch(() => { });
              window.removeEventListener('click', unlock);
              window.removeEventListener('touchstart', unlock);
              window.removeEventListener('keydown', unlock);
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
  }, [audioUrl, isPlaying]);




  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full overflow-hidden bg-black group isolate ${className}`}
    >
      {/* Audio - only if not externally controlled */}
      {audioUrl && !externalAudioControl && (
        <audio ref={audioRef} key={audioUrl} loop muted={isMuted}>
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {/* eslint-disable @next/next/no-img-element */}
      {allImages.map((item, idx) => (
        <img
          key={item.id}
          src={item.src}
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-[2500ms] ${idx === currentIndex
            ? `opacity-100 z-20 animate-${getTransitionClass()}`
            : idx === lastIndex
              ? `opacity-100 z-10 animate-${getTransitionClass()}`
              : 'opacity-0 z-0'
            }`}
          alt={`Slide ${idx}`}
        />
      ))}
      {watermarkUrl && (
        <img
          src={watermarkUrl}
          alt="Watermark"
          className="absolute bottom-10 right-36 w-24 h-auto opacity-60 pointer-events-none select-none z-[999]"
        />
      )}

      {/* Play/Pause Button */}
      <div
        onClick={togglePlayback}
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50 transition-opacity duration-500 bg-black/20 hover:bg-black/40 rounded-full p-4 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        {isPlaying ? (
          <PauseCircle size={64} color="#ffffff" />
        ) : (
          <Play size={64} color="#ffffff" />
        )}
      </div>

      {/* Bottom Controls Group */}
      <div className={`absolute bottom-10 right-10 flex items-center gap-4 z-[1000] transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
