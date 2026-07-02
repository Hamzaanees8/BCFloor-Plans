import React, { useMemo } from 'react';
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

export function SortableItem({ id, item, disabled, renderItem }: { id: string; item: FileItem; disabled: boolean; renderItem: (item: FileItem, isDragging?: boolean) => React.ReactNode; }) {
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
        cursor: disabled ? 'default' : (isDragging ? 'grabbing' : 'grab'),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative rounded-md transition-shadow ${isDragging ? 'opacity-50 scale-105 shadow-xl' : disabled ? '' : 'hover:shadow-md'}`}
        >
            {renderItem(item, isDragging)}
        </div>
    );
}

export function SortableGrid({ items, onOrderChange, mode, renderItem, columns }: SortableGridProps) {
    const { imagesPerRow: contextImagesPerRow } = useFileManagerContext();

    const imagesPerRow = columns ?? contextImagesPerRow;
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // 250ms press before drag starts, allows normal scrolling
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.clientId === active.id);
            const newIndex = items.findIndex((item) => item.clientId === over.id);

            const reorderedItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
                ...item,
                order: index, // Update order securely
            }));

            onOrderChange(reorderedItems);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const activeItem = useMemo(
        () => (activeId ? items.find((item) => item.clientId === activeId) : null),
        [activeId, items]
    );

    const isReorderMode = mode === 'reorder';

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext
                items={items.map((i) => i.clientId)}
                strategy={rectSortingStrategy}
            >
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${imagesPerRow}, minmax(0, 1fr))` }}
                >
                    {items.map((item) => (
                        <SortableItem
                            key={item.clientId}
                            id={item.clientId}
                            item={item}
                            disabled={!isReorderMode}
                            renderItem={renderItem}
                        />
                    ))}
                </div>
            </SortableContext>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.4',
                        },
                    },
                }),
            }}>
                {activeItem ? (
                    <div className="scale-105 opacity-90 shadow-2xl cursor-grabbing rounded-md overflow-hidden ring-2 ring-primary">
                        {renderItem(activeItem, true)}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
