import React from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { DualMode, FileItem } from './types';
import { UploadDropzone } from './UploadDropzone';
import { SortableGrid } from './SortableGrid';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Loader2, ArrowLeftRight } from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerContext';
import { Button } from '@/components/ui/button';

interface DualModeFileManagerProps {
    mode: DualMode;
    items: FileItem[];
    onItemsChange: (items: FileItem[]) => void;
    onDropFiles: (files: File[]) => void;
    onClickUpload?: () => void;
    renderItem: (item: FileItem, isDragging?: boolean) => React.ReactNode;
    disabled?: boolean;
    onSave?: () => void;
    singleAccordionTitle?: string;
    hideDashedBorder?: boolean;
    modeToggleButton?: React.ReactNode;
}

export function DualModeFileManager({
    mode,
    items,
    onItemsChange,
    onDropFiles,
    onClickUpload,
    renderItem,
    disabled,
    onSave,
    singleAccordionTitle,
    hideDashedBorder,
    modeToggleButton
}: DualModeFileManagerProps) {
    const { userType } = useAppContext();
    const { selectionChangedUuids, isSaving, imagesPerRow } = useFileManagerContext();
    const savedItems = items.filter(item => item.status === 'uploaded').sort((a, b) => {
        if (userType === 'agent') {
            const aSelected = !!a.originalData?.is_agent_approved;
            const bSelected = !!b.originalData?.is_agent_approved;
            if (aSelected !== bSelected) {
                return aSelected ? -1 : 1;
            }
        }
        return a.order - b.order;
    });

    const selectedItems = savedItems.filter(item => item.originalData?.is_agent_approved).sort((a, b) => a.order - b.order);
    const agentUnselectedItems = savedItems.filter(item => !item.originalData?.is_agent_approved).sort((a, b) => a.order - b.order);
    const unsavedItems = items.filter(item => item.status === 'local').sort((a, b) => a.order - b.order);

    const handleSavedOrderChange = (newSaved: FileItem[]) => {
        onItemsChange([...unsavedItems, ...newSaved]);
    };

    const handleSelectedOrderChange = (newSelected: FileItem[]) => {
        // We want to maintain the relative positions if possible, or just append/prepend
        // For simplified logic, let's just combine them based on status then selection
        onItemsChange([...unsavedItems, ...newSelected, ...savedItems.filter(item => !item.originalData?.is_agent_approved)]);
    };

    const handleUnsavedOrderChange = (newUnsaved: FileItem[]) => {
        onItemsChange([...newUnsaved, ...savedItems]);
    };

    const handleAllOrderChange = (newItems: FileItem[]) => {
        onItemsChange(newItems);
    };

    const saveButton = selectionChangedUuids.size > 0 && userType === 'agent' && (
        <Button
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onSave) onSave();
            }}
            disabled={isSaving}
            className="bg-[#DC9600] hover:bg-[#b07800] text-white h-8 px-4 text-sm normal-case font-medium rounded transition-colors ml-4 z-10 min-w-[120px]"
        >
            {isSaving ? (
                <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                </div>
            ) : (
                "Save Selection"
            )}
        </Button>
    );

    return (
        <UploadDropzone
            mode={mode}
            onDropFiles={onDropFiles}
            disabled={disabled}
        >
            <div className="flex flex-col gap-4 w-full">
                {singleAccordionTitle ? (
                    <Accordion type="multiple" defaultValue={["all"]} className="w-full">
                        <AccordionItem value="all" className="overflow-hidden shadow-sm">
                            <AccordionTrigger
                                className={`px-[24px] py-[19px] h-[60px] ${userType}-text text-[18px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                            >
                                <div className="flex items-center flex-1 justify-between pr-4">
                                    <div className="flex items-center gap-4">
                                        <span>{singleAccordionTitle} ({items.length})</span>
                                        {saveButton}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {modeToggleButton && <div onClick={e => e.stopPropagation()}>{modeToggleButton}</div>}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0 border-t border-[#BBBBBB]">
                                <div className={`p-4 min-h-[200px] transition-all duration-300 ${mode === 'upload' && !hideDashedBorder ? 'bg-[#F9F9F9] border-2 border-dashed border-[#BBBBBB] m-4 rounded-xl' : 'bg-transparent border-2 border-transparent m-4'}`}>
                                    {items.length === 0 ? (
                                        <div className="flex items-center justify-center p-8 text-gray-500">
                                            No files available
                                        </div>
                                    ) : (
                                        <SortableGrid
                                            items={items}
                                            onOrderChange={handleAllOrderChange}
                                            mode={mode}
                                            renderItem={renderItem}
                                            columns={imagesPerRow}
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
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                ) : userType === 'agent' ? (
                    // Agent: Left-right (selected | unselected) side-by-side layout
                    <div className="flex flex-row gap-5 w-full">
                        {/* Left Column - Unselected */}
                        <div className="flex-1 flex flex-col gap-4">
                            <Accordion type="multiple" defaultValue={["unsaved", "saved"]} className="w-full">
                                {unsavedItems.length > 0 && (
                                    <AccordionItem value="unsaved" className="overflow-hidden shadow-sm">
                                        <AccordionTrigger
                                            className={`px-[24px] py-[19px] h-[60px] ${userType}-text text-[18px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                            style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                                        >
                                            Unsaved Files ({unsavedItems.length})
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0 border-t border-[#BBBBBB]">
                                            <div className={`p-4 min-h-[200px] transition-all duration-300 ${mode === 'upload' && !hideDashedBorder ? 'bg-[#F9F9F9] border-2 border-dashed border-[#BBBBBB] m-4 rounded-xl' : 'bg-transparent border-2 border-transparent m-4'}`}>
                                                <SortableGrid
                                                    items={unsavedItems}
                                                    onOrderChange={handleUnsavedOrderChange}
                                                    mode={mode}
                                                    renderItem={renderItem}
                                                    columns={Math.floor(imagesPerRow / 2)}
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
                                        Unselected Files ({agentUnselectedItems.length})
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t border-[#BBBBBB]">
                                        {agentUnselectedItems.length === 0 ? (
                                            <div className="flex items-center justify-center p-8 text-gray-500">
                                                No files available
                                            </div>
                                        ) : (
                                            <SortableGrid
                                                items={agentUnselectedItems}
                                                onOrderChange={() => { }}
                                                mode={mode}
                                                renderItem={renderItem}
                                                columns={Math.floor(imagesPerRow / 2)}
                                            />
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/* Divider with Arrows */}
                        <div className="flex flex-col items-center justify-center relative min-w-[40px]">
                            <div className="absolute inset-y-0 w-0 border-r-2 border-dashed border-gray-300" />
                            <div className="relative z-10 flex items-center justify-center px-2">
                                <ArrowLeftRight className={`${userType}-text`} size={24} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Right Column - Selected */}
                        <div className="flex-1 flex flex-col gap-4">
                            <Accordion type="multiple" defaultValue={["selected"]} className="w-full">
                                <AccordionItem value="selected" className="overflow-hidden shadow-sm">
                                    <AccordionTrigger
                                        className={`px-[24px] py-[19px] h-[60px] ${userType}-text text-[18px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                                    >
                                        <div className="flex items-center flex-1 justify-between pr-4">
                                            <div className="flex items-center gap-4">
                                                <span>Selected files ({selectedItems.length})</span>
                                                {saveButton}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {modeToggleButton && <div onClick={e => e.stopPropagation()}>{modeToggleButton}</div>}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t border-[#BBBBBB]">
                                        {selectedItems.length === 0 ? (
                                            <div className="flex items-center justify-center p-8 text-gray-500">
                                                No selected files
                                            </div>
                                        ) : (
                                            <SortableGrid
                                                items={selectedItems}
                                                onOrderChange={handleSelectedOrderChange}
                                                mode={mode}
                                                renderItem={renderItem}
                                                columns={Math.floor(imagesPerRow / 2)}
                                            />
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                ) : (
                    // Admin/Vendor: Top-bottom (unsaved on top, saved below) stacked layout
                    <div className="flex flex-col gap-4 w-full">
                        <Accordion type="multiple" defaultValue={["unsaved", "saved"]} className="w-full">
                            {unsavedItems.length > 0 && (
                                <AccordionItem value="unsaved" className="overflow-hidden shadow-sm">
                                    <AccordionTrigger
                                        className={`px-[24px] py-[19px] h-[60px] ${userType}-text text-[18px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                                    >
                                        Unsaved Files ({unsavedItems.length})
                                    </AccordionTrigger>
                                    <AccordionContent className="p-0 border-t border-[#BBBBBB]">
                                        <div className={`p-4 min-h-[200px] transition-all duration-300 ${mode === 'upload' && !hideDashedBorder ? 'bg-[#F9F9F9] border-2 border-dashed border-[#BBBBBB] m-4 rounded-xl' : 'bg-transparent border-2 border-transparent m-4'}`}>
                                            <SortableGrid
                                                items={unsavedItems}
                                                onOrderChange={handleUnsavedOrderChange}
                                                mode={mode}
                                                renderItem={renderItem}
                                                columns={imagesPerRow}
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
                                    <div className="flex items-center flex-1 justify-between pr-4">
                                        <span>Saved Files ({savedItems.length})</span>
                                        <div className="flex items-center gap-4">
                                            {modeToggleButton && <div onClick={e => e.stopPropagation()}>{modeToggleButton}</div>}
                                        </div>
                                    </div>
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
                                            columns={imagesPerRow}
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
                )}
            </div>
        </UploadDropzone>
    );
}
