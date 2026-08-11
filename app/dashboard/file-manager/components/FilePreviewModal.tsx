"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  X,
  Check,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Video,
  File as FileIcon,
  GripVertical,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { SelectedFiles, useFileManagerContext } from "../FileManagerContext";
import { OptimizedImagePreview } from "./OptimizedPreview";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { naturalSortFiles } from "../utils/naturalSort";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ------------------------------------------------------------------ */
/* CONSTANTS & TYPES */
/* ------------------------------------------------------------------ */

const mediaOptions = [
  "Attic",
  "Bathroom 1",
  "Bathroom 2",
  "Bathroom 3",
  "Bathroom 4",
  "Master Bedroom",
  "Master Bedroom Bathroom",
  "Bedroom 1",
  "Bedroom 2",
  "Bedroom 3",
  "Bedroom 4",
  "Basement",
  "Foyer",
  "Garage",
  "Kitchen",
  "Laundry Room",
  "Living Room",
  "Office",
  "Shed",
];

const floorPlans = [
  "Dimensions PDF",
  "Branded Floor Plan",
  "UnBranded Floor Plan",
  "Branded Image",
  "Unbranded Image",
  "Additional Files",
];

export interface PreviewItem {
  id: string;
  file: File;
  mediaType: string;
  thumbnailFile?: File;
  isComplimentary: boolean;
  isSelected: boolean;
}

/* ------------------------------------------------------------------ */
/* FILE ROW COMPONENT */
/* ------------------------------------------------------------------ */

interface FileRowProps {
  item: PreviewItem;
  idx: number;
  onMediaTypeChange: (idx: number, value: string) => void;
  onRemove: (idx: number) => void;
  onToggleSelect: (idx: number) => void;
  type: string;
  openDropdown: number | null;
  setOpenDropdown: (idx: number | null) => void;
  allSuggestions: string[];
  totalFiles: number;
  userType: string;
  onToggleComplimentary: (idx: number) => void;
  onCopyFromAbove: (idx: number) => void;
  onTabNext: (idx: number, value: string) => void;
  onThumbnailChange: (idx: number, file: File | undefined) => void;
}

const SortableFileRow = React.memo((props: FileRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.7 : 1,
  };

  const {
    item,
    idx,
    onMediaTypeChange,
    onRemove,
    onToggleSelect,
    type,
    openDropdown,
    setOpenDropdown,
    allSuggestions,
    totalFiles,
    onToggleComplimentary,
    onCopyFromAbove,
    onTabNext,
    onThumbnailChange,
  } = props;

  const [isCopied, setIsCopied] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = allSuggestions.filter(
    (s) =>
      !item.mediaType || s.toLowerCase().includes(item.mediaType.toLowerCase()),
  );

  const handleCopy = () => {
    onCopyFromAbove(idx);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isLast = idx === totalFiles - 1;
  const file = item.file;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col pb-6 ${isLast ? "" : "border-b border-[#E4E4E4]"} ${
        isDragging
          ? "bg-blue-50/50 rounded-lg shadow-md border border-blue-200 p-2"
          : ""
      }`}
    >
      <div className="flex flex-col md:flex-row gap-4 md:gap-[10px] md:pr-[10px]">
        {/* DRAG HANDLE & POSITION NUMBER */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors touch-none"
            title="Drag to reorder"
            aria-label="Drag to reorder"
          >
            <GripVertical size={20} />
          </button>

          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 border border-gray-300 text-gray-700 font-semibold text-xs shrink-0">
            {idx + 1}
          </div>
        </div>

        {/* THUMBNAIL */}
        <div className="w-full md:w-auto">
          <div
            className="w-full md:w-[200px] aspect-video bg-black rounded-[6px] overflow-hidden relative"
            style={{ aspectRatio: "16/9" }}
          >
            <OptimizedImagePreview
              file={file}
              className="w-full h-full object-contain"
            />

            <span
              className="flex items-center justify-center w-[28px] h-[28px] bg-white/90 hover:bg-white rounded-full absolute top-2 left-2 z-10 cursor-pointer shadow-md transition-all"
              onClick={() => onRemove(idx)}
              title="Remove file"
            >
              <X color={"#E06D5E"} size={20} strokeWidth={2.5} />
            </span>

            <div className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded z-10 flex items-center justify-center pointer-events-none">
              {file.type.startsWith("image/") ? (
                <ImageIcon size={16} className="text-white" />
              ) : file.type.startsWith("video/") ? (
                <Video size={16} className="text-white" />
              ) : file.type === "application/pdf" ? (
                <FileText size={16} className="text-white" />
              ) : (
                <FileIcon size={16} className="text-white" />
              )}
            </div>

            {type === "floor_plans" && (
              <Input
                className="absolute bottom-2 right-12 w-[14px] h-[14px] cursor-pointer z-10"
                type="checkbox"
                checked={item.isSelected}
                onChange={() => onToggleSelect(idx)}
              />
            )}
          </div>

          {file.type.startsWith("video/") && (
            <div className="mt-2 w-full md:w-[200px] flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {item.thumbnailFile ? "Change Thumbnail" : "Add Thumbnail"}
              </Button>
              {item.thumbnailFile && (
                <div className="flex flex-col gap-1">
                  <Label className="text-[12px] text-[#7d7d7d] font-semibold">
                    Thumbnail
                  </Label>
                  <div
                    className="w-full md:w-[200px] aspect-video bg-black rounded-[6px] overflow-hidden relative border border-dashed border-[#7d7d7d]"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <OptimizedImagePreview
                      file={item.thumbnailFile}
                      className="w-full h-full object-contain"
                    />
                    <span
                      className="flex items-center justify-center w-[20px] h-[20px] bg-white/90 hover:bg-white rounded-full absolute top-1.5 right-1.5 z-10 cursor-pointer shadow-md transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onThumbnailChange(idx, undefined);
                      }}
                    >
                      <X color={"#E06D5E"} size={12} strokeWidth={2.5} />
                    </span>
                  </div>
                  <p
                    className="text-[10px] text-gray-500 mt-0.5 truncate"
                    title={item.thumbnailFile.name}
                  >
                    {item.thumbnailFile.name}
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={thumbnailInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onThumbnailChange(idx, e.target.files[0]);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* INPUTS & DETAILS */}
        <div className="w-full flex flex-col gap-[10px]">
          <div className="flex justify-between items-center">
            <Label className="text-[#7d7d7d] text-[14px]">
              {type === "floor_plans" ? "Floor Plan Type" : "Media Name"}
            </Label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => onToggleComplimentary(idx)}
                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${item.isComplimentary ? "text-[#6BAE41]" : "text-gray-400 hover:text-[#6BAE41]"}`}
                title="Mark as Complimentary"
              >
                <div
                  className={`border-2 rounded flex items-center justify-center ${item.isComplimentary ? "bg-[#6BAE41] border-[#6BAE41]" : "border-gray-400"}`}
                  style={{ width: "18px", height: "18px" }}
                >
                  {item.isComplimentary && <Check color="white" size={14} />}
                </div>
                <span className="font-medium text-[14px] whitespace-nowrap">
                  Complimentary
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Input
              id={`media-input-${idx}`}
              value={item.mediaType}
              onChange={(e) => {
                onMediaTypeChange(idx, e.target.value);
                setOpenDropdown(idx);
                setFocusedOptionIndex(-1);
              }}
              onFocus={() => {
                setOpenDropdown(idx);
                setFocusedOptionIndex(-1);
              }}
              onKeyDown={(e) => {
                if (openDropdown === idx) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocusedOptionIndex((prev) =>
                      prev < filteredSuggestions.length - 1 ? prev + 1 : prev,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocusedOptionIndex((prev) => (prev > 0 ? prev - 1 : 0));
                  } else if (e.key === "Enter" && focusedOptionIndex >= 0) {
                    e.preventDefault();
                    onMediaTypeChange(
                      idx,
                      filteredSuggestions[focusedOptionIndex],
                    );
                    setOpenDropdown(null);
                  }
                }
                if (e.key === "Tab") {
                  e.preventDefault();
                  onTabNext(idx, item.mediaType);
                  setTimeout(() => {
                    document.getElementById(`media-input-${idx + 1}`)?.focus();
                  }, 0);
                }
              }}
              placeholder={
                type === "floor_plans"
                  ? "Select type or enter custom type"
                  : "Select name or enter custom name"
              }
              className="w-full h-[42px] border text-[#696868] border-[#7d7d7d] pr-10"
            />
            {idx > 0 && (
              <div className="absolute right-3 top-[21px] -translate-y-1/2 group">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleCopy();
                  }}
                  type="button"
                  className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded"
                  aria-label="Copy from above"
                >
                  {isCopied ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <ArrowUp size={18} />
                  )}
                </button>
                <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                  {isCopied ? "Copied from above!" : "Copy from above"}
                </span>
              </div>
            )}

            {openDropdown === idx && (
              <div className="absolute z-[100] w-full mt-1 bg-white border border-[#7d7d7d] rounded-md shadow-lg max-h-[200px] overflow-y-auto custom-scroll">
                {filteredSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className={`px-4 py-2 cursor-pointer text-[#696868] text-[14px] ${focusedOptionIndex === i ? "bg-gray-100" : "hover:bg-gray-100"}`}
                    onClick={() => {
                      onMediaTypeChange(idx, suggestion);
                      setOpenDropdown(null);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-start text-[13px] text-[#7d7d7d]">
            <div className="flex-1 pr-3">
              <p className="line-clamp-2 break-all">{file.name}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span>
                ({idx + 1} of {totalFiles})
              </span>
              <p
                onClick={() => onRemove(idx)}
                className="text-[#E06D5E] cursor-pointer inline-block"
              >
                Delete
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SortableFileRow.displayName = "SortableFileRow";

/* ------------------------------------------------------------------ */
/* MAIN MODAL */
/* ------------------------------------------------------------------ */

interface Props {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  setSelectedFiles: React.Dispatch<React.SetStateAction<SelectedFiles[]>>;
  files: File[];
  type: string;
  serviceUuid: string;
  reviewFilesEnabled?: boolean;
  onSave?: () => void;
}

export default function FilePreviewModal({
  open,
  onOpenChange,
  files,
  setSelectedFiles,
  type,
  serviceUuid,
  reviewFilesEnabled,
  onSave,
}: Props) {
  const [localItems, setLocalItems] = useState<PreviewItem[]>([]);
  const [groupLabel, setGroupLabel] = useState("");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showAgain, setShowAgain] = useState(true);
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  const onSaveRef = React.useRef(onSave);
  React.useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const { userType } = useAppContext();
  const { filesData } = useFileManagerContext();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const saved = localStorage.getItem(
      "confirmation_dialog_file_upload_cancel_show_again",
    );
    if (saved !== null) {
      setShowAgain(JSON.parse(saved));
    }
  }, []);

  const handleToggleShowAgain = () => {
    setShowAgain((prev) => !prev);
  };

  const existingGroups = Array.from(
    new Set(
      filesData?.files
        ?.map((f) => f.group)
        .filter((g): g is string => Boolean(g)) || [],
    ),
  );

  const baseSuggestions = type === "floor_plans" ? floorPlans : mediaOptions;
  const allSuggestions = Array.from(
    new Set([...baseSuggestions, ...existingGroups]),
  );

  // Initialize and naturally sort incoming files when modal opens / files change
  useEffect(() => {
    if (open) {
      const sorted = naturalSortFiles(files);
      const items: PreviewItem[] = sorted.map((file, idx) => ({
        id: `file-${file.name}-${file.size}-${file.lastModified}-${idx}-${Date.now()}`,
        file,
        mediaType: "",
        thumbnailFile: undefined,
        isComplimentary: false,
        isSelected: false,
      }));
      setLocalItems(items);
      setGroupLabel("");
      setOpenDropdown(null);
    }
  }, [files, open]);

  // Requirement 6: Additional uploads handling — sort newly selected batch naturally before appending
  const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFilesBatch = Array.from(e.target.files);
      const sortedBatch = naturalSortFiles(newFilesBatch);
      const newItems: PreviewItem[] = sortedBatch.map((file, idx) => ({
        id: `file-${file.name}-${file.size}-${file.lastModified}-${idx}-${Date.now()}`,
        file,
        mediaType: "",
        thumbnailFile: undefined,
        isComplimentary: false,
        isSelected: false,
      }));
      setLocalItems((prev) => [...prev, ...newItems]);
      e.target.value = "";
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeFile = useCallback((index: number) => {
    setLocalItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMediaTypeChange = useCallback((index: number, value: string) => {
    setLocalItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, mediaType: value } : item,
      ),
    );
  }, []);

  const handleToggleSelect = useCallback((index: number) => {
    setLocalItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isSelected: !item.isSelected } : item,
      ),
    );
  }, []);

  const handleToggleComplimentary = useCallback((index: number) => {
    setLocalItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, isComplimentary: !item.isComplimentary }
          : item,
      ),
    );
  }, []);

  const handleThumbnailChange = useCallback(
    (index: number, thumbnailFile: File | undefined) => {
      setLocalItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, thumbnailFile } : item,
        ),
      );
    },
    [],
  );

  const handleCopyFromAbove = useCallback((index: number) => {
    if (index > 0) {
      setLocalItems((prev) => {
        const valueAbove = prev[index - 1]?.mediaType;
        if (valueAbove) {
          return prev.map((item, i) =>
            i === index ? { ...item, mediaType: valueAbove } : item,
          );
        }
        return prev;
      });
    }
  }, []);

  const handleTabNext = useCallback(
    (index: number, value: string) => {
      if (index + 1 < localItems.length) {
        setLocalItems((prev) =>
          prev.map((item, i) =>
            i === index + 1 ? { ...item, mediaType: value } : item,
          ),
        );
      }
    },
    [localItems.length],
  );

  const selectedCount = localItems.filter((item) => item.isSelected).length;

  const handleAdd = useCallback(() => {
    const existingServiceFilesCount =
      filesData?.files?.filter((f) => f.service?.uuid === serviceUuid).length ||
      0;

    setSelectedFiles((prev) => {
      const unuploadedServiceFilesCount = prev.filter(
        (f) => f.service_id === serviceUuid,
      ).length;
      const totalExistingForService =
        existingServiceFilesCount + unuploadedServiceFilesCount;

      const filesToAdd = localItems.map((item, index) => ({
        file: item.file,
        type: item.mediaType || "",
        group: item.isSelected ? groupLabel : "",
        upload: true,
        service_id: serviceUuid,
        is_admin_approved: userType === "admin" ? true : !reviewFilesEnabled,
        // Floor plans and videos are automatically approved by the agent — no manual approval needed.
        // Photos (HDRStill / HDR_photos) require the agent to explicitly approve them.
        is_agent_approved:
          type === "floor_plans" || type === "video" ? true : false,
        is_show: true,
        sort_order: totalExistingForService + index + 1,
        is_complimentary: item.isComplimentary,
        thumbnailFile: item.thumbnailFile,
      }));

      return [...prev, ...filesToAdd];
    });

    onOpenChange(false);
    setTimeout(() => {
      if (onSaveRef.current) onSaveRef.current();
    }, 200);
  }, [
    type,
    localItems,
    groupLabel,
    serviceUuid,
    reviewFilesEnabled,
    setSelectedFiles,
    onOpenChange,
    filesData,
    userType,
  ]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      if (localItems.length > 0 && showAgain) {
        setConfirmOpen(true);
      } else {
        onOpenChange(false);
      }
    } else {
      onOpenChange(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="w-[95vw] md:w-[700px] max-w-none h-[90vh] md:h-[95vh] flex flex-col font-alexandria gap-0 p-4 md:p-6"
          onPointerDownOutside={(e) => {
            if (localItems.length > 0) {
              e.preventDefault();
              if (showAgain) {
                setConfirmOpen(true);
              } else {
                onOpenChange(false);
              }
            }
          }}
          onEscapeKeyDown={(e) => {
            if (localItems.length > 0) {
              e.preventDefault();
              if (showAgain) {
                setConfirmOpen(true);
              } else {
                onOpenChange(false);
              }
            }
          }}
        >
          <DialogHeader className="border-b pb-4 border-[#7d7d7d] flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className={`text-[18px] ${userType}-text font-[600]`}>
              FILE UPLOAD
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={() => addFilesInputRef.current?.click()}
              >
                <Plus size={14} /> Add More Files
              </Button>
              <input
                type="file"
                multiple
                ref={addFilesInputRef}
                className="hidden"
                onChange={handleAddMoreFiles}
              />
            </div>
          </DialogHeader>

          {selectedCount >= 2 && (
            <div className="mb-4 mt-4 flex-shrink-0">
              <Label className="text-[#7d7d7d] text-[14px] mb-[10px] block">
                Group Label
              </Label>
              <Input
                value={groupLabel}
                onChange={(e) => setGroupLabel(e.target.value)}
                placeholder="Name"
                className="w-full h-[42px] border text-[#696868] border-[#7d7d7d]"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0 custom-scroll pr-[10px]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {localItems.map((item, idx) => (
                  <SortableFileRow
                    key={item.id}
                    item={item}
                    idx={idx}
                    onMediaTypeChange={handleMediaTypeChange}
                    onRemove={removeFile}
                    onToggleSelect={handleToggleSelect}
                    type={type}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    allSuggestions={allSuggestions}
                    totalFiles={localItems.length}
                    userType={userType}
                    onToggleComplimentary={handleToggleComplimentary}
                    onCopyFromAbove={handleCopyFromAbove}
                    onTabNext={handleTabNext}
                    onThumbnailChange={handleThumbnailChange}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#7d7d7d] flex-shrink-0 mt-2">
            <Button
              className={`w-full ${userType}-text ${userType}-border h-[44px]`}
              variant="outline"
              onClick={() => {
                if (localItems.length > 0 && showAgain) {
                  setConfirmOpen(true);
                } else {
                  onOpenChange(false);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              className={`w-full ${userType}-bg text-white h-[44px]`}
              onClick={handleAdd}
              disabled={localItems.length === 0}
            >
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        onConfirm={() => {
          onOpenChange(false);
        }}
        showAgain={showAgain}
        toggleShowAgain={handleToggleShowAgain}
        dialogType="file_upload_cancel"
        title="CANCEL UPLOAD"
        description="Are you sure you want to cancel? Your file selection will be lost."
      />
    </>
  );
}
