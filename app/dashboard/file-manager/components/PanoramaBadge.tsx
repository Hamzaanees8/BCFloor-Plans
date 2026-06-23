import React from 'react';

export function PanoramaBadge() {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded shadow-md font-bold flex items-center gap-1 select-none pointer-events-none">
      <span>⬡ Panorama</span>
    </div>
  );
}
