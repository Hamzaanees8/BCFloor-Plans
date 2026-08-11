import React from 'react';
import { Button } from '@/components/ui/button';
import { DualMode } from './types';
import { ArrowLeftRight, Check } from 'lucide-react';

interface ModeToggleProps {
    mode: DualMode;
    onModeChange: (mode: DualMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
    const isUpload = mode === 'upload';

    return (
        <Button
            onClick={(e) => {
                e.stopPropagation();
                onModeChange(isUpload ? 'reorder' : 'upload');
            }}
            className={`transition-all duration-200 h-7 md:h-8 px-2.5 md:px-3.5 text-[11px] md:text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm rounded-[6px] cursor-pointer ${
                isUpload
                    ? 'bg-[#DC9600] hover:bg-[#b07800] text-white border-none'
                    : 'bg-[#6BAE41] hover:bg-[#5fa43a] text-white border-none'
            }`}
        >
            {isUpload ? (
                <>
                    <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                    Sort Images
                </>
            ) : (
                <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Done Sorting
                </>
            )}
        </Button>
    );
}
