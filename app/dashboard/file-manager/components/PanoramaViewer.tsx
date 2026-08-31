'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { Files, SelectedFiles } from '../FileManagerContext';
import ThreeSixtyViewer from './ThreeSixtyViewer';

interface PanoramaViewerProps {
  files: (Files | SelectedFiles)[];
  initialIndex: number;
  onClose: () => void;
}

export function PanoramaViewer({ files, initialIndex, onClose }: PanoramaViewerProps) {
  if (typeof document === 'undefined' || !files || files.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black">
      <ThreeSixtyViewer
        files={files as any}
        initialIndex={initialIndex}
        isEmbedded={false}
        onClose={onClose}
      />
    </div>,
    document.body
  );
}

export default PanoramaViewer;
