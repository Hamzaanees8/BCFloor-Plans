import React from 'react';
import { Button } from '@/components/ui/button';
import { DualMode } from './types';
import { ArrowLeftRight, UploadCloud } from 'lucide-react';

interface ModeToggleProps {
    mode: DualMode;
    onModeChange: (mode: DualMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
    const isUpload = mode === 'upload';

    return (
        <Button
            variant={isUpload ? "default" : "secondary"}
            onClick={() => onModeChange(isUpload ? 'reorder' : 'upload')}
            className={`transition-all duration-300 ${isUpload ? 'bg-[#DC9600] hover:bg-[#eda304] text-white' : 'bg-[#6BAE41] hover:bg-[#5fa43a] text-white'}`}
        >
            {isUpload ? (
                <>
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Switch to Reorder
                </>
            ) : (
                <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Done Reordering
                </>
            )}
        </Button>
    );
}
