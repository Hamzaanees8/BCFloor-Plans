'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SelectedFiles } from './HDRStill';
import { PauseCircle, Play } from 'lucide-react'; // Lucide icons
import './SlideshowAnimations.css';

interface CustomSlideshowProps {
  images: SelectedFiles[];
  delay?: number;
  audioUrl?: string;
  transition?: string;
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
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionIndex, setTransitionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getTransitionClass = () =>
    transition ? transition : transitionClasses[transitionIndex];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        if (!transition) {
          setTransitionIndex((prev) => (prev + 1) % transitionClasses.length);
        }
      }, delay);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, images.length, delay, transition]);

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


  return (
    <div className="relative w-full h-[700px] overflow-hidden bg-black">
      {/* Audio */}
      {audioUrl && (
        <audio ref={audioRef} key={audioUrl} autoPlay loop>
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {/* eslint-disable @next/next/no-img-element */}
      {images.map((item, idx) => (
        <img
          key={idx}
          src={URL.createObjectURL(item.file)}
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentIndex
            ? `opacity-100 z-10 animate-${getTransitionClass()}`
            : 'opacity-0 z-0'
            }`}
          alt={`Slide ${idx}`}
        />
      ))}

      <div
        onClick={togglePlayback}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-50 opacity-10 hover:opacity-50 transition-opacity duration-300"
      >
        {isPlaying ? (
          <PauseCircle size={64} color="#111111" />
        ) : (
          <Play size={64} color="#111111" />
        )}
      </div>
    </div>
  );
};

export default CustomSlideshow;
