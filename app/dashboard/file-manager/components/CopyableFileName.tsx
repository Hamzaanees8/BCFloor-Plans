'use client';
import React, { useState, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableFileNameProps {
    name: string;
    className?: string;
}

const CopyableFileName: React.FC<CopyableFileNameProps> = ({ name, className = '' }) => {
    const [copied, setCopied] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!name) return;

        navigator.clipboard.writeText(name).then(() => {
            setCopied(true);
            setShowTooltip(true);

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setCopied(false);
                setShowTooltip(false);
            }, 2000);
        });
    };

    return (
        <span
            className={`relative inline-flex items-center gap-[3px] cursor-pointer group/copy ${className}`}
            onMouseEnter={() => !copied && setShowTooltip(true)}
            onMouseLeave={() => !copied && setShowTooltip(false)}
            onClick={handleCopy}
        >
            {/* Tooltip */}
            {showTooltip && (
                <span
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded px-2 py-0.5 text-[9px] font-semibold shadow pointer-events-none z-[50] flex items-center gap-1
                        ${copied ? 'bg-[#6BAE41] text-white' : 'bg-gray-700 text-white'}`}
                >
                    {copied ? (
                        <>
                            <Check size={9} strokeWidth={3} />
                            Copied to clipboard
                        </>
                    ) : (
                        'Click to copy to clipboard'
                    )}
                </span>
            )}

            {/* Name text */}
            <span className="truncate">{name}</span>

            {/* Copy icon */}
            {copied ? (
                <Check size={10} strokeWidth={3} className="shrink-0 text-[#6BAE41]" />
            ) : (
                <Copy size={10} className="shrink-0 text-[#8E8E8E] group-hover/copy:text-[#555]" />
            )}
        </span>
    );
};

export default CopyableFileName;
