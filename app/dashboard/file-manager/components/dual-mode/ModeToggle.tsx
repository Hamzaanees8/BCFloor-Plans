import React from 'react';
import { Button } from '@/components/ui/button';
import { DualMode } from './types';
import { ArrowLeftRight, Check, Loader2 } from 'lucide-react';

interface ModeToggleProps {
    mode: DualMode;
    onModeChange: (mode: DualMode) => void;
    isAlwaysSort?: boolean;
    isSaving?: boolean;
}

export function ModeToggle({ mode, onModeChange, isAlwaysSort = false, isSaving = false }: ModeToggleProps) {
    if (isAlwaysSort) {
        return (
            <div className="flex items-center gap-2">
                {isSaving ? (
                    <span className="flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-amber-600 bg-white/90 px-2.5 py-1 rounded-[6px] border border-amber-300 shadow-sm">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving sort…</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-emerald-700 bg-white/90 px-2.5 py-1 rounded-[6px] border border-emerald-300 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        <span>Auto-sort active</span>
                    </span>
                )}
            </div>
        );
    }

    const isUpload = mode === 'upload';

    return (
        <Button
            onClick={(e) => {
                e.stopPropagation();
                onModeChange(isUpload ? 'reorder' : 'upload');
            }}
            disabled={isSaving}
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
