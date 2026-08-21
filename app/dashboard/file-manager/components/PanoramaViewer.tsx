'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Files, SelectedFiles } from '../FileManagerContext';

interface PanoramaViewerProps {
  files: (Files | SelectedFiles)[];
  initialIndex: number;
  onClose: () => void;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function getImageUrl(file: Files | SelectedFiles | undefined | null, apiUrl: string | undefined): string {
  if (!file || typeof file !== 'object') return '';
  if ('file' in file && file.file instanceof File) {
    return URL.createObjectURL(file.file);
  }
  const f = file as Files;
  return f.variant_urls?.landing || f.variant_urls?.popup || f.url || (f.file_path && apiUrl ? `${apiUrl}/${f.file_path}` : '');
}

// ─── Wide Panorama Scroll Viewer ───────────────────────────────────────────────
// For images with AR 1.8–3.5 (NOT near 2:1 or high-res 360)
// The image fills the viewport height. User drags/scrolls left-right to pan.

function PanoramaViewerContent({ files, currentIndex, setCurrentIndex, onClose, imageUrl }: {
  files: (Files | SelectedFiles)[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  onClose: () => void;
  imageUrl: string;
  apiUrl: string | undefined;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [zoomInput, setZoomInput] = useState('100');

  // Sync zoom input
  useEffect(() => { setZoomInput(Math.round(scale * 100).toString()); }, [scale]);

  // Reset on image change
  useEffect(() => {
    setImgLoaded(false);
    setScale(1);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : files.length - 1);
      if (e.key === 'ArrowRight') setCurrentIndex(currentIndex < files.length - 1 ? currentIndex + 1 : 0);
      if (e.key === 'ArrowUp') { e.preventDefault(); setScale(s => Math.min(s + 0.1, 10)); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setScale(s => Math.max(s - 0.1, 1)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, files.length, onClose, setCurrentIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({
      x: containerRef.current?.scrollLeft ?? 0,
      y: containerRef.current?.scrollTop ?? 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    containerRef.current.scrollLeft = scrollStart.x + (dragStart.x - e.clientX);
    containerRef.current.scrollTop = scrollStart.y + (dragStart.y - e.clientY);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setScrollStart({
      x: containerRef.current?.scrollLeft ?? 0,
      y: containerRef.current?.scrollTop ?? 0
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    containerRef.current.scrollLeft = scrollStart.x + (dragStart.x - e.touches[0].clientX);
    containerRef.current.scrollTop = scrollStart.y + (dragStart.y - e.touches[0].clientY);
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (containerRef.current) {
      if (containerRef.current.scrollHeight <= containerRef.current.clientHeight) {
        containerRef.current.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
  };

  const zoomIn = () => setScale(s => Math.min(s * 1.25, 10));
  const zoomOut = () => setScale(s => Math.max(s / 1.25, 1));
  const resetZoom = () => {
    setScale(1);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    }
  };

  const applyZoomInput = () => {
    const val = parseInt(zoomInput, 10);
    if (!isNaN(val)) setScale(Math.max(1, Math.min(val / 100, 10)));
    else setZoomInput(Math.round(scale * 100).toString());
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col font-alexandria select-none">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/90 to-transparent z-50 flex items-center justify-between px-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-3 py-1 rounded-full shadow-md font-bold">
            ⬡ Panorama
          </div>
          <span className="text-white/70 text-sm">{currentIndex + 1} / {files.length}</span>
          <span className="text-white/40 text-xs hidden sm:inline">Drag or scroll to pan</span>
        </div>
        <button onClick={onClose} className="pointer-events-auto text-white hover:text-white/60 p-2 rounded-full hover:bg-white/10 transition-colors">
          <X size={22} />
        </button>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 overflow-auto flex"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Actual image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Wide Panorama"
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          className="m-auto block flex-shrink-0"
          style={{
            width: `${scale * 100}%`,
            minWidth: `${scale * 100}%`,
            height: 'auto',
            maxWidth: 'none',
            pointerEvents: 'none',
            imageRendering: scale > 1.5 ? 'pixelated' : 'auto',
            transition: 'width 0.2s ease, min-width 0.2s ease',
          }}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Scroll progress bar */}
      <div className="absolute bottom-20 left-8 right-8 h-0.5 bg-white/10 rounded-full pointer-events-none">
        <div className="h-full bg-white/40 rounded-full" style={{ width: `${imgLoaded ? 30 : 0}%` }} />
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/60 px-5 py-2.5 rounded-full backdrop-blur-sm">
        <button onClick={zoomOut} className="text-white hover:text-white/60 p-1.5 rounded-full hover:bg-white/20 transition-colors" title="Zoom Out"><ZoomOut size={18} /></button>
        <div className="flex items-center">
          <input
            type="text"
            value={zoomInput}
            onChange={e => setZoomInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={applyZoomInput}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); e.stopPropagation(); }}
            className="text-white text-sm font-mono w-10 text-right bg-transparent border-b border-white/20 focus:border-white focus:outline-none transition-colors"
          />
          <span className="text-white/70 text-sm font-mono ml-0.5">%</span>
        </div>
        <button onClick={zoomIn} className="text-white hover:text-white/60 p-1.5 rounded-full hover:bg-white/20 transition-colors" title="Zoom In"><ZoomIn size={18} /></button>
        <div className="w-px h-4 bg-white/20" />
        <button onClick={resetZoom} className="text-white hover:text-white/60 p-1.5 rounded-full hover:bg-white/20 transition-colors" title="Reset"><RotateCcw size={16} /></button>
      </div>

      {/* Prev / Next */}
      {files.length > 1 && (
        <>
          <button onClick={() => setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : files.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white p-3 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm transition-colors"><ChevronLeft size={28} /></button>
          <button onClick={() => setCurrentIndex(currentIndex < files.length - 1 ? currentIndex + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white p-3 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm transition-colors"><ChevronRight size={28} /></button>
        </>
      )}
    </div>
  );
}

import ThreeSixtyViewer from './ThreeSixtyViewer';

export function PanoramaViewer({ files, initialIndex, onClose }: PanoramaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewerMode, setViewerMode] = useState<'360' | 'flat'>('360');
  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  const currentFile = (files && files.length > 0) ? (files[currentIndex] || files[0]) : undefined;

  // Memoize URL to avoid creating new blob URLs on every render
  const imageUrl = useMemo(() => getImageUrl(currentFile, API_URL), [currentFile, API_URL]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  if (typeof document === 'undefined' || !files || files.length === 0) return null;

  if (viewerMode === '360') {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black">
        <ThreeSixtyViewer
          files={files as any}
          initialIndex={currentIndex}
          isEmbedded={false}
          onClose={onClose}
          onToggleFlatView={() => setViewerMode('flat')}
        />
      </div>,
      document.body
    );
  }

  const sharedProps = {
    files,
    currentIndex,
    setCurrentIndex,
    onClose,
    imageUrl,
    apiUrl: API_URL,
  };

  return createPortal(
    <div className="relative">
      <PanoramaViewerContent {...sharedProps} />
      {/* Toggle to 360 Sphere mode */}
      <button
        onClick={() => setViewerMode('360')}
        className="absolute top-4 right-14 z-[10000] px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white text-xs font-alexandria font-medium backdrop-blur-md border border-white/10 transition flex items-center gap-1.5"
        title="Switch to 360° Sphere View"
      >
        <span>360° Sphere</span>
      </button>
    </div>,
    document.body
  );
}
