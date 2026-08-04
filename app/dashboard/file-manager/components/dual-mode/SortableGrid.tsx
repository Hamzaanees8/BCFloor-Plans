import React, { useMemo, useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileItem, DualMode } from './types';
import { useFileManagerContext } from '../../FileManagerContext';

interface SortableGridProps {
    items: FileItem[];
    onOrderChange: (items: FileItem[]) => void;
    mode: DualMode;
    renderItem: (item: FileItem, isDragging?: boolean) => React.ReactNode;
    columns?: number;
}

export function SortableItem({
    id,
    item,
    disabled,
    isSelected,
    isReordered,
    isUnchanged,
    isReorderMode,
    onToggleSelect,
    renderItem,
}: {
    id: string;
    item: FileItem;
    disabled: boolean;
    isSelected?: boolean;
    isReordered?: boolean;
    isUnchanged?: boolean;
    isReorderMode?: boolean;
    onToggleSelect?: (id: string) => void;
    renderItem: (item: FileItem, isDragging?: boolean) => React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isReorderMode && (e.ctrlKey || e.metaKey)) {
            // Prevent text selection or browser default gestures on Ctrl-click
            e.stopPropagation();
        }
    };

    const handleClickCapture = (e: React.MouseEvent) => {
        if (isReorderMode) {
            e.preventDefault();
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey) {
                onToggleSelect?.(id);
            }
        }
    };

    let borderStyle = '';
    if (isReorderMode) {
        if (isSelected) {
            borderStyle = 'border-2 border-blue-500 ring-2 ring-blue-400/50 bg-blue-50/20';
        } else if (isReordered) {
            borderStyle = 'border-2 border-[#DC9600] ring-2 ring-[#DC9600]/30 shadow-md';
        } else if (isUnchanged) {
            borderStyle = 'border-2 border-slate-300';
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onPointerDown={handlePointerDown}
            onClickCapture={handleClickCapture}
            className={`relative rounded-md transition-all duration-200 overflow-hidden ${
                isDragging ? 'opacity-50 scale-105 shadow-xl ring-2 ring-blue-500' : disabled ? '' : 'hover:shadow-md'
            } ${borderStyle}`}
        >
            {isReorderMode && (
                <>
                    {isSelected && (
                        <span className="absolute top-1.5 left-1.5 z-20 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none">
                            Selected
                        </span>
                    )}
                    {!isSelected && isReordered && (
                        <span className="absolute top-1.5 left-1.5 z-20 bg-[#DC9600] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none">
                            Reordered
                        </span>
                    )}
                    {!isSelected && !isReordered && isUnchanged && (
                        <span className="absolute top-1.5 left-1.5 z-20 bg-slate-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow pointer-events-none opacity-80">
                            Unchanged
                        </span>
                    )}
                </>
            )}
            {renderItem(item, isDragging)}
        </div>
    );
}

export function SortableGrid({ items, onOrderChange, mode, renderItem, columns }: SortableGridProps) {
    const { imagesPerRow: contextImagesPerRow } = useFileManagerContext();

    const imagesPerRow = columns ?? contextImagesPerRow;
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [initialOrderMap, setInitialOrderMap] = useState<Map<string, number> | null>(null);

    const isReorderMode = mode === 'reorder';

    // Capture initial order map when reorder mode is activated, reset when exited
    useEffect(() => {
        if (isReorderMode) {
            setInitialOrderMap((prev) => {
                if (!prev) {
                    const map = new Map<string, number>();
                    items.forEach((item, index) => {
                        map.set(item.clientId, index);
                    });
                    return map;
                }
                return prev;
            });
        } else {
            setInitialOrderMap(null);
            setSelectedIds(new Set());
        }
    }, [isReorderMode, items]);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        const oldIndex = items.findIndex((item) => item.clientId === activeIdStr);
        const newIndex = items.findIndex((item) => item.clientId === overIdStr);

        if (oldIndex === -1 || newIndex === -1) return;

        let reorderedItems: FileItem[];

        // Check if active item is part of a multi-selection
        if (selectedIds.has(activeIdStr) && selectedIds.size > 1) {
            const movingItems = items.filter((item) => selectedIds.has(item.clientId));
            const remainingItems = items.filter((item) => !selectedIds.has(item.clientId));

            let insertIndex = remainingItems.findIndex((item) => item.clientId === overIdStr);
            if (insertIndex === -1) {
                insertIndex = remainingItems.length;
            } else if (oldIndex < newIndex) {
                insertIndex += 1;
            }

            reorderedItems = [
                ...remainingItems.slice(0, insertIndex),
                ...movingItems,
                ...remainingItems.slice(insertIndex),
            ].map((item, index) => ({
                ...item,
                order: index,
            }));
        } else {
            reorderedItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
                ...item,
                order: index,
            }));
        }

        onOrderChange(reorderedItems);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const activeItem = useMemo(
        () => (activeId ? items.find((item) => item.clientId === activeId) : null),
        [activeId, items]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {isReorderMode && (
                <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 px-3 text-xs text-amber-900 font-medium mb-3 select-none">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span>💡 Hold <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded text-[11px] font-semibold">Ctrl</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded text-[11px] font-semibold">⌘</kbd> + click to multi-select items, then drag to reorder them as a group.</span>
                        {selectedIds.size > 0 && (
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                {selectedIds.size} selected
                            </span>
                        )}
                    </div>
                    {selectedIds.size > 0 && (
                        <button
                            type="button"
                            onClick={() => setSelectedIds(new Set())}
                            className="text-blue-600 hover:text-blue-800 underline text-[11px] font-medium shrink-0 ml-2"
                        >
                            Clear Selection
                        </button>
                    )}
                </div>
            )}

            <SortableContext
                items={items.map((i) => i.clientId)}
                strategy={rectSortingStrategy}
            >
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${imagesPerRow}, minmax(0, 1fr))` }}
                >
                    {items.map((item, index) => {
                        const isSelected = selectedIds.has(item.clientId);
                        const initialIdx = initialOrderMap ? initialOrderMap.get(item.clientId) : undefined;
                        const isReordered = initialIdx !== undefined && initialIdx !== index;
                        const isUnchanged = initialIdx !== undefined && initialIdx === index;

                        return (
                            <SortableItem
                                key={item.clientId}
                                id={item.clientId}
                                item={item}
                                disabled={!isReorderMode}
                                isSelected={isSelected}
                                isReordered={isReordered}
                                isUnchanged={isUnchanged}
                                isReorderMode={isReorderMode}
                                onToggleSelect={handleToggleSelect}
                                renderItem={renderItem}
                            />
                        );
                    })}
                </div>
            </SortableContext>

            <DragOverlay
                dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.4',
                            },
                        },
                    }),
                }}
            >
                {activeItem ? (
                    <div className="scale-105 opacity-90 shadow-2xl cursor-grabbing rounded-md overflow-hidden ring-2 ring-blue-500 relative">
                        {selectedIds.has(activeItem.clientId) && selectedIds.size > 1 && (
                            <div className="absolute top-2 right-2 z-30 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-white">
                                {selectedIds.size} files
                            </div>
                        )}
                        {renderItem(activeItem, true)}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

