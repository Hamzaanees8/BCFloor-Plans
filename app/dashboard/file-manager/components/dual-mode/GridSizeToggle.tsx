import React from 'react';
import { Button } from '@/components/ui/button';
import { useFileManagerContext } from '../../FileManagerContext';
import { LayoutGrid } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export function GridSizeToggle() {
    const { imagesPerRow, setImagesPerRow } = useFileManagerContext();
    const { userType } = useAppContext();
    const desktopOptions = [2, 4, 6, 8];
    const mobileOptions = [1, 2, 4];

    const renderButtons = (options: number[], isMobile: boolean) => (
        <div className={`${isMobile ? 'flex md:hidden' : 'hidden md:flex'} rounded-md shadow-sm`} role="group">
            {options.map((option, index) => {
                const isActive = imagesPerRow === option;
                return (
                    <Button
                        key={option}
                        onClick={() => setImagesPerRow(option)}
                        className={`h-[32px] w-[36px] px-0 font-semibold transition-colors duration-200 border-[#BBBBBB]
                            ${index === 0 ? 'rounded-l-md rounded-r-none border-r-0' : ''} 
                            ${index === options.length - 1 ? 'rounded-r-md rounded-l-none border-l-0' : ''} 
                            ${index !== 0 && index !== options.length - 1 ? 'rounded-none border-x-0 border-l-[1px] border-r-[1px]' : ''} 
                            ${isActive
                                ? `bg-[#4290E9] hover:bg-[#4999f5] border-[#4290E9] text-white z-10 ${userType}-bg ${userType}-border`
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }
                        `}
                        variant={isActive ? "default" : "outline"}
                    >
                        {option}
                    </Button>
                );
            })}
        </div>
    );

    return (
        <div className="relative flex items-center gap-2 mr-4 group">
            {/* Tooltip */}
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-[12px] font-medium px-2 py-1 rounded shadow-md z-[60] pointer-events-none transition-opacity duration-200">
                Number of files per row
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-800"></div>
            </div>

            <LayoutGrid className="w-5 h-5 text-gray-500" />
            {renderButtons(desktopOptions, false)}
            {renderButtons(mobileOptions, true)}
        </div>
    );
}
