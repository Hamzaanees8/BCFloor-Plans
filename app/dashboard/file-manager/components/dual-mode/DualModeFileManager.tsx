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
    unselectedAction?: React.ReactNode;
    unselectedSubHeader?: React.ReactNode;
    selectedAction?: React.ReactNode;
    selectedSubHeader?: React.ReactNode;
    savedFilesAction?: React.ReactNode;
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
    modeToggleButton,
    unselectedAction,
    unselectedSubHeader,
    selectedAction,
    selectedSubHeader,
    savedFilesAction
}: DualModeFileManagerProps) {
    const { userType } = useAppContext();
    const { selectionChangedUuids, isSaving, imagesPerRow: contextImagesPerRow } = useFileManagerContext();
    const imagesPerRow = contextImagesPerRow;
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const savedItems = items.filter(item => item.status === 'uploaded').sort((a, b) => {
        if (userType === 'agent') {
            const aSelected = !!(a.originalData?.is_agent_approved || a.originalData?.is_complimentary);
            const bSelected = !!(b.originalData?.is_agent_approved || b.originalData?.is_complimentary);
            if (aSelected !== bSelected) {
                return aSelected ? -1 : 1;
            }
        }
        return a.order - b.order;
    });

    const selectedItems = savedItems.filter(item => item.originalData?.is_agent_approved || item.originalData?.is_complimentary).sort((a, b) => a.order - b.order);
    const agentUnselectedItems = savedItems.filter(item => !(item.originalData?.is_agent_approved || item.originalData?.is_complimentary)).sort((a, b) => a.order - b.order);
    const unsavedItems = items.filter(item => item.status === 'local').sort((a, b) => a.order - b.order);

    const handleSavedOrderChange = (newSaved: FileItem[]) => {
        onItemsChange([...unsavedItems, ...newSaved]);
    };

    const handleSelectedOrderChange = (newSelected: FileItem[]) => {
        // We want to maintain the relative positions if possible, or just append/prepend
        // For simplified logic, let's just combine them based on status then selection
        onItemsChange([...unsavedItems, ...newSelected, ...savedItems.filter(item => !(item.originalData?.is_agent_approved || item.originalData?.is_complimentary))]);
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
                                className={`px-[12px] md:px-[16px] py-[8px] md:py-[10px] h-[40px] md:h-[50px] ${userType}-text text-[12px] md:text-[15px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                            >
                                <div className="flex items-center flex-1 justify-between pr-4">
                                    <div className="flex items-center gap-2">
                                        <span>{singleAccordionTitle} ({items.length})</span>
                                        {saveButton}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {savedFilesAction && <div className="hidden md:block" onClick={e => e.stopPropagation()}>{savedFilesAction}</div>}
                                        {modeToggleButton && <div className="hidden md:block" onClick={e => e.stopPropagation()}>{modeToggleButton}</div>}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0 border-t border-[#BBBBBB]">
                                <div className="flex md:hidden items-center justify-end gap-2 p-4 pb-0 w-full">
                                    {modeToggleButton && <div>{modeToggleButton}</div>}
                                    {savedFilesAction && <div>{savedFilesAction}</div>}
                                </div>
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
                    <div className="flex flex-col md:flex-row gap-5 w-full">
                        {/* Left Column - Unselected */}
                        <div className="flex-1 flex flex-col gap-4 w-full">
                            <Accordion type="multiple" defaultValue={["unsaved", "saved"]} className="w-full">
                                {unsavedItems.length > 0 && (
                                    <AccordionItem value="unsaved" className="overflow-hidden shadow-sm">
                                        <AccordionTrigger
                                            className={`px-[12px] md:px-[16px] py-[8px] md:py-[10px] h-[40px] md:h-[50px] ${userType}-text text-[12px] md:text-[15px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
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
                                                    columns={(isMobile ? imagesPerRow : Math.max(1, Math.floor(imagesPerRow / 2)))}
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )}

                                <AccordionItem value="saved" className="overflow-hidden shadow-sm">
                                    <AccordionTrigger
                                        className={`px-[12px] md:px-[16px] py-[8px] md:py-[10px] h-[40px] md:h-[50px] ${userType}-text text-[12px] md:text-[15px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                                    >
                                        <div className="flex items-center flex-1 justify-between pr-4">
                                            <span>Unselected Files ({agentUnselectedItems.length})</span>
                                            <div className="hidden md:block" onClick={e => e.stopPropagation()}>{unselectedAction}</div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t border-[#BBBBBB]">
                                        {unselectedSubHeader}
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
                                                columns={(isMobile ? imagesPerRow : Math.max(1, Math.floor(imagesPerRow / 2)))}
                                            />
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/* Divider with Arrows */}
                        <div className="flex md:hidden flex-col items-center justify-center relative min-w-full py-4">
                            <div className="absolute inset-x-0 h-0 border-b-2 border-dashed border-gray-300" />
                            <div className="relative z-10 flex items-center justify-center py-2 px-2" style={{ backgroundColor: `var(--${userType}-page-bg, #ffffff)` }}>
                                <ArrowLeftRight className={`${userType}-text rotate-90`} size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-center justify-center relative min-w-[40px]">
                            <div className="absolute inset-y-0 w-0 border-r-2 border-dashed border-gray-300" />
                            <div className="relative z-10 flex items-center justify-center px-2 py-2" style={{ backgroundColor: `var(--${userType}-page-bg, #ffffff)` }}>
                                <ArrowLeftRight className={`${userType}-text`} size={24} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Right Column - Selected */}
                        <div className="flex-1 flex flex-col gap-4 w-full">
                            <Accordion type="multiple" defaultValue={["selected"]} className="w-full">
                                <AccordionItem value="selected" className="overflow-hidden shadow-sm">
                                    <AccordionTrigger
                                        className={`px-[12px] md:px-[16px] py-[8px] md:py-[10px] h-[40px] md:h-[50px] ${userType}-text text-[12px] md:text-[15px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                                    >
                                        <div className="flex items-center flex-1 justify-between pr-4">
                                            <div className="flex items-center gap-2">
                                                <span>Selected files ({selectedItems.length})</span>
                                                {saveButton}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedAction && <div className="hidden md:block" onClick={e => e.stopPropagation()}>{selectedAction}</div>}
                                                {modeToggleButton && <div className="hidden md:block" onClick={e => e.stopPropagation()}>{modeToggleButton}</div>}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t border-[#BBBBBB]">
                                        <div className="flex md:hidden items-center justify-end gap-2 mb-4 w-full">
                                            {modeToggleButton && <div>{modeToggleButton}</div>}
                                            {selectedAction && <div>{selectedAction}</div>}
                                        </div>
                                        {selectedSubHeader}
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
                                                columns={(isMobile ? imagesPerRow : Math.max(1, Math.floor(imagesPerRow / 2)))}
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
                                        className={`px-[12px] md:px-[16px] py-[8px] md:py-[10px] h-[40px] md:h-[50px] ${userType}-text text-[12px] md:text-[15px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
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
                                    className={`px-[12px] md:px-[16px] py-[8px] md:py-[10px] h-[40px] md:h-[50px] ${userType}-text text-[12px] md:text-[15px] font-[600] uppercase hover:no-underline [&>svg]:${userType}-text [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                                >
                                    <div className="flex items-center flex-1 justify-between pr-4">
                                        <span>Saved Files ({savedItems.length})</span>
                                        <div className="flex items-center gap-2">
                                            {savedFilesAction && <div className="hidden md:block" onClick={e => e.stopPropagation()}>{savedFilesAction}</div>}
                                            {modeToggleButton && <div className="hidden md:block" onClick={e => e.stopPropagation()}>{modeToggleButton}</div>}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border-t border-[#BBBBBB]">
                                    <div className="flex md:hidden items-center justify-end gap-2 mb-4 w-full">
                                        {modeToggleButton && <div>{modeToggleButton}</div>}
                                        {savedFilesAction && <div>{savedFilesAction}</div>}
                                    </div>
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
