'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Trash2, Music, Check, UploadCloud, Volume2 } from 'lucide-react';
import { AgentAudio } from '../agent-audio';
import { toast } from 'sonner';

interface AudioLibraryProps {
    audios: AgentAudio[];
    selectedAudioId: string;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onUploadClick: () => void;
    userType?: string;
    maxFiles?: number;
}

const AudioItem = ({
    audio,
    isSelected,
    onSelect,
    onDelete,
}: {
    audio: AgentAudio;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    userType?: string;
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Stop all other playing audios if needed, but for now just this one
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(currentProgress);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <div
            onClick={onSelect}
            className={`relative group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${isSelected
                ? 'border-[#6BAE41] bg-[#6BAE41]/5 shadow-sm'
                : 'border-[#BBBBBB] bg-white hover:border-[#6BAE41]/50 hover:bg-gray-50'
                }`}
        >
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-[#6BAE41] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-[#6BAE41]/20 group-hover:text-[#6BAE41]'
                }`}>
                <Music size={24} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-[#424242] truncate mr-2" title={audio.name}>
                        {audio.name}
                    </h4>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={togglePlay}
                            className={`p-1.5 rounded-full transition-colors ${isSelected ? 'bg-[#6BAE41] text-white hover:bg-[#5a9437]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="relative w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-[#6BAE41] transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {isSelected && (
                <div className="absolute top-2 right-2 bg-[#6BAE41] text-white rounded-full p-0.5 shadow-sm">
                    <Check size={12} strokeWidth={3} />
                </div>
            )}

            <audio
                ref={audioRef}
                src={audio.audio_url || audio.file_url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                className="hidden"
            />
        </div>
    );
};

export function AudioLibrary({
    audios,
    selectedAudioId,
    onSelect,
    onDelete,
    onUploadClick,
    userType = 'agent',
    maxFiles = 5
}: AudioLibraryProps) {
    const isLimitReached = audios.length >= maxFiles;

    return (
        <div className="w-full space-y-6">
            {/* Upload Area */}
            <div
                onClick={() => {
                    if (isLimitReached) {
                        toast.error(`You have reached the upload limit of ${maxFiles} files.`);
                        return;
                    }
                    onUploadClick();
                }}
                className={`group relative w-full h-40 border-2 border-dashed border-[#BBBBBB] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                    isLimitReached 
                        ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' 
                        : 'cursor-pointer hover:border-[#6BAE41] hover:bg-[#6BAE41]/5'
                }`}
            >
                <div className={`w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-colors ${
                    isLimitReached ? '' : 'group-hover:bg-[#6BAE41]/20 group-hover:text-[#6BAE41]'
                }`}>
                    <UploadCloud size={32} />
                </div>
                <div className="text-center">
                    <p className={`font-semibold text-[#424242] ${isLimitReached ? '' : 'group-hover:text-[#6BAE41]'}`}>
                        {isLimitReached ? "Upload limit reached" : "Click to upload audio"}
                    </p>
                    <p className="text-xs text-[#7D7D7D]">
                        Supports MP3, WAV up to 10MB · Max {maxFiles} files
                    </p>
                </div>
            </div>

            {/* Audio Grid */}
            {audios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audios.map((audio) => (
                        <AudioItem
                            key={audio.uuid}
                            audio={audio}
                            isSelected={selectedAudioId === audio.uuid}
                            onSelect={() => onSelect(audio.uuid)}
                            onDelete={() => onDelete(audio.uuid)}
                            userType={userType}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <Volume2 size={48} className="mb-2 opacity-20" />
                    <p className="text-sm">No audio files uploaded yet</p>
                </div>
            )}
        </div>
    );
}
