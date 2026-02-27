import React from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { DualMode, FileItem } from './types';
import { UploadDropzone } from './UploadDropzone';
import { SortableGrid } from './SortableGrid';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus } from 'lucide-react';

interface DualModeFileManagerProps {
    mode: DualMode;
    items: FileItem[];
    onItemsChange: (items: FileItem[]) => void;
    onDropFiles: (files: File[]) => void;
    onClickUpload?: () => void;
    renderItem: (item: FileItem, isDragging?: boolean) => React.ReactNode;
    disabled?: boolean;
}

export function DualModeFileManager({
    mode,
    items,
    onItemsChange,
    onDropFiles,
    onClickUpload,
    renderItem,
    disabled
}: DualModeFileManagerProps) {
    const { userType } = useAppContext();
    const savedItems = items.filter(item => item.status === 'uploaded').sort((a, b) => a.order - b.order);
    const unsavedItems = items.filter(item => item.status === 'local').sort((a, b) => a.order - b.order);

    const handleSavedOrderChange = (newSaved: FileItem[]) => {
        onItemsChange([...unsavedItems, ...newSaved]);
    };

    const handleUnsavedOrderChange = (newUnsaved: FileItem[]) => {
        onItemsChange([...newUnsaved, ...savedItems]);
    };

    return (
        <UploadDropzone
            mode={mode}
            onDropFiles={onDropFiles}
            disabled={disabled}
        >
            <div className="flex flex-col gap-4 w-full">
                <Accordion type="multiple" defaultValue={["unsaved", "saved"]} className="w-full space-y-4">
                    {unsavedItems.length > 0 && (
                        <AccordionItem value="unsaved" className="overflow-hidden shadow-sm">
                            <AccordionTrigger
                                className={`px-[24px] py-[19px] h-[60px] ${userType}-text text-[18px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                            >
                                Unsaved Files ({unsavedItems.length})
                            </AccordionTrigger>
                            <AccordionContent className="p-0 border-t border-[#BBBBBB]">
                                <div className={`p-4 min-h-[200px] transition-all duration-300 ${mode === 'upload' ? 'bg-[#F9F9F9] border-2 border-dashed border-[#BBBBBB] m-4 rounded-xl' : 'bg-transparent border-2 border-transparent m-4'}`}>
                                    <SortableGrid
                                        items={unsavedItems}
                                        onOrderChange={handleUnsavedOrderChange}
                                        mode={mode}
                                        renderItem={renderItem}
                                    />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    <AccordionItem value="saved" className="overflow-hidden shadow-sm">
                        <AccordionTrigger
                            className={`px-[24px] py-[19px] h-[60px] ${userType}-text text-[18px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                            style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                        >
                            Saved Files ({savedItems.length})
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border-t border-[#BBBBBB]">
                            {savedItems.length === 0 ? (
                                <div className="flex items-center justify-center p-8 text-gray-500">
                                    No saved files
                                </div>
                            ) : (
                                <SortableGrid
                                    items={savedItems}
                                    onOrderChange={handleSavedOrderChange}
                                    mode={mode}
                                    renderItem={renderItem}
                                />
                            )}

                            {onClickUpload && mode === 'upload' && !disabled && (
                                <div className="w-full flex justify-center mt-6 mb-4">
                                    <div
                                        onClick={onClickUpload}
                                        className="w-[370px] h-[220px] border-2 border-dashed rounded-[6px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border-[#8E8E8E] bg-[#EEEEEE] hover:bg-gray-100"
                                    >
                                        <div className="text-4xl border-2 flex justify-center items-center w-[72px] h-[72px] rounded-[6px] transition-colors border-[#8E8E8E]">
                                            <Plus color="#8E8E8E" size={42} strokeWidth={1} />
                                        </div>
                                        <p className="mt-2 text-[#8E8E8E]">
                                            Drag & Drop Files
                                        </p>
                                        <p className="text-[#8E8E8E] text-sm">
                                            RAW, JPG, PNG, PDF
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Max 100MB per file
                                        </p>
                                    </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </UploadDropzone>
    );
}
