'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SelectedFiles } from './HDRStill';
import { PauseCircle, Play, Volume2, VolumeX } from 'lucide-react'; // Lucide icons
import './SlideshowAnimations.css';
import { Files } from '../FileManagerContext ';

interface CustomSlideshowProps {
  images?: SelectedFiles[];
  delay?: number;
  audioUrl?: string;
  transition?: string;
  api_images?: Files[]
  watermarkUrl?: string;
  onSlideChange?: (index: number) => void;
  currentIndex?: number;
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
  currentIndex: propCurrentIndex
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionIndex, setTransitionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  const allImages = [
    ...(images?.map((img) => ({
      src: URL.createObjectURL(img.file),
      isLocal: true,
    })) || []),
    ...(api_images?.map((img) => ({
      src: `${API_URL}/${img.file_path}`,
      isLocal: false,
    })) || []),
  ];




  const getTransitionClass = () =>
    transition ? transition : transitionClasses[transitionIndex];

  useEffect(() => {
    if (propCurrentIndex !== undefined) {
      setCurrentIndex(propCurrentIndex);
    }
  }, [propCurrentIndex]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % allImages.length;
          if (onSlideChange) onSlideChange(nextIndex);
          return nextIndex;
        });
        if (!transition) {
          setTransitionIndex((prev) => (prev + 1) % transitionClasses.length);
        }
      }, delay);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, allImages.length, delay, transition, onSlideChange]);

  const togglePlayback = () => {
    const audioEl = audioRef.current;
    if (audioUrl && audioEl) {
      if (isPlaying) {
        audioEl.pause();
      } else {
        audioEl.play();
      }
    }
    setIsPlaying((prev) => !prev);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  }




  return (
    <div className="relative w-full h-[100vh] overflow-hidden bg-black group">
      {/* Audio */}
      {audioUrl && (
        <audio ref={audioRef} key={audioUrl} autoPlay loop muted={isMuted}>
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {/* eslint-disable @next/next/no-img-element */}
      {allImages.map((item, idx) => (
        <img
          key={idx}
          src={item.src}
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentIndex
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
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 hover:bg-black/40 rounded-full p-4"
      >
        {isPlaying ? (
          <PauseCircle size={64} color="#ffffff" />
        ) : (
          <Play size={64} color="#ffffff" />
        )}
      </div>

      {/* Mute/Unmute Button */}
      {/* {audioUrl && ( */}
      <div
        onClick={toggleMute}
        className="absolute bottom-10 right-10 cursor-pointer z-[1000] opacity-70 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 hover:bg-black/60 p-4 rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
      >
        {isMuted ? (
          <VolumeX size={24} color="#ffffff" />
        ) : (
          <Volume2 size={24} color="#ffffff" />
        )}
      </div>
      {/* )} */}
    </div>
  );
};

export default CustomSlideshow;
