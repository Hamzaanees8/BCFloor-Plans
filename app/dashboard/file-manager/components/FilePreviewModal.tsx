'use client';
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Check, ArrowUp, FileText, Image as ImageIcon, Video, File as FileIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { SelectedFiles, useFileManagerContext } from "../FileManagerContext";
import { OptimizedImagePreview } from "./OptimizedPreview";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { detectIsPanoramaFromFile } from "../utils/panoramaUtils";
import { Switch } from "@/components/ui/switch";

/* ------------------------------------------------------------------ */
/* CONSTANTS */
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

/* ------------------------------------------------------------------ */
/* 🔥 OPTIMIZED PREVIEW — SAME UI, FIXED PERFORMANCE */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* FILE ROW — UNCHANGED UI */
/* ------------------------------------------------------------------ */

interface FileRowProps {
  file: File;
  idx: number;
  mediaType: string;
  onMediaTypeChange: (idx: number, value: string) => void;
  onRemove: (idx: number) => void;
  onToggleSelect: (idx: number) => void;
  isSelected: boolean;
  type: string;
  openDropdown: number | null;
  setOpenDropdown: (idx: number | null) => void;
  allSuggestions: string[];
  totalFiles: number;
  userType: string;
  isComplimentary: boolean;
  onToggleComplimentary: (idx: number) => void;
  onCopyFromAbove: (idx: number) => void;
  onTabNext: (idx: number, value: string) => void;
  thumbnailFile?: File;
  onThumbnailChange?: (idx: number, file: File | undefined) => void;
  isPanorama: boolean;
  onIsPanoramaChange: (idx: number, isPanorama: boolean) => void;
}

const FileRow = React.memo(({
  file,
  idx,
  mediaType,
  onMediaTypeChange,
  onRemove,
  onToggleSelect,
  isSelected,
  type,
  openDropdown,
  setOpenDropdown,
  allSuggestions,
  totalFiles,
  isComplimentary,
  onToggleComplimentary,
  onCopyFromAbove,
  onTabNext,
  thumbnailFile,
  onThumbnailChange,
  isPanorama,
  onIsPanoramaChange,
}: FileRowProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = allSuggestions.filter(item =>
    !mediaType || item.toLowerCase().includes(mediaType.toLowerCase())
  );

  const handleCopy = () => {
    onCopyFromAbove(idx);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex gap-[10px] pr-[10px]">
      <div className="w-auto">
        <div className="w-[200px] h-[130px] bg-black rounded-[6px] overflow-hidden relative">
          <OptimizedImagePreview file={file} className="w-full h-full object-contain" />

          <span
            className="flex items-center justify-center w-[28px] h-[28px] bg-white/90 hover:bg-white rounded-full absolute top-2 left-2 z-10 cursor-pointer shadow-md transition-all"
            onClick={() => onRemove(idx)}
          >
            <X color={'#E06D5E'} size={20} strokeWidth={2.5} />
          </span>

          <div className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded z-10 flex items-center justify-center pointer-events-none">
            {file.type.startsWith('image/') ? <ImageIcon size={16} className="text-white" /> : 
             file.type.startsWith('video/') ? <Video size={16} className="text-white" /> :
             file.type === 'application/pdf' ? <FileText size={16} className="text-white" /> :
             <FileIcon size={16} className="text-white" />}
          </div>

          {type === 'floor_plan' && (
            <Input
              className="absolute bottom-2 right-12 w-[14px] h-[14px] cursor-pointer z-10"
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(idx)}
            />
          )}
        </div>
        
        {file.type.startsWith('video/') && onThumbnailChange && (
          <div className="mt-2 w-[200px]">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={() => thumbnailInputRef.current?.click()}
            >
              {thumbnailFile ? "Change Thumbnail" : "Add Thumbnail"}
            </Button>
            {thumbnailFile && (
               <p className="text-[10px] text-gray-500 mt-1 truncate">{thumbnailFile.name}</p>
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

      <div className="w-full flex flex-col gap-[10px]">
        <div className="flex justify-between items-center">
          <Label className="text-[#7d7d7d] text-[14px]">Media Name</Label>
          <div className="flex items-center gap-4">
            {file.type.startsWith('image/') && (
              <div className="flex items-center gap-2">
                <Label htmlFor={`panorama-toggle-${idx}`} className="text-[13px] text-gray-500 cursor-pointer">
                  Panorama
                </Label>
                <Switch
                  id={`panorama-toggle-${idx}`}
                  checked={isPanorama}
                  onCheckedChange={(checked) => onIsPanoramaChange(idx, checked)}
                  className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-[#4290E9] scale-75"
                />
              </div>
            )}
            <div
              onClick={() => onToggleComplimentary(idx)}
              className={`flex items-center gap-1.5 cursor-pointer transition-colors ${isComplimentary ? 'text-[#6BAE41]' : 'text-gray-400 hover:text-[#6BAE41]'}`}
              title="Mark as Complimentary"
            >
              <div className={`border-2 rounded flex items-center justify-center ${isComplimentary ? 'bg-[#6BAE41] border-[#6BAE41]' : 'border-gray-400'}`} style={{ width: '18px', height: '18px' }}>
                {isComplimentary && <Check color="white" size={14} />}
              </div>
              <span className="font-medium text-[14px] whitespace-nowrap">Complimentary</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <Input
            id={`media-input-${idx}`}
            value={mediaType}
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
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setFocusedOptionIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setFocusedOptionIndex(prev => prev > 0 ? prev - 1 : 0);
                } else if (e.key === 'Enter' && focusedOptionIndex >= 0) {
                  e.preventDefault();
                  onMediaTypeChange(idx, filteredSuggestions[focusedOptionIndex]);
                  setOpenDropdown(null);
                }
              }
              if (e.key === 'Tab') {
                e.preventDefault();
                onTabNext(idx, mediaType);
                setTimeout(() => {
                  document.getElementById(`media-input-${idx + 1}`)?.focus();
                }, 0);
              }
            }}
            placeholder="Select or Type Media Name"
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
                {isCopied ? <Check size={18} className="text-green-500" /> : <ArrowUp size={18} />}
              </button>
              <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                {isCopied ? 'Copied from above!' : 'Copy from above'}
              </span>
            </div>
          )}

          {openDropdown === idx && (
            <div className="absolute z-[100] w-full mt-1 bg-white border border-[#7d7d7d] rounded-md shadow-lg max-h-[200px] overflow-y-auto custom-scroll">
              {filteredSuggestions.map((item, i) => (
                <div
                  key={i}
                  className={`px-4 py-2 cursor-pointer text-[#696868] text-[14px] ${focusedOptionIndex === i ? 'bg-gray-100' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => {
                    onMediaTypeChange(idx, item);
                    setOpenDropdown(null);
                  }}
                >
                  {item}
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
            <span>({idx + 1} of {totalFiles})</span>
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
  );
});

FileRow.displayName = 'FileRow';

/* ------------------------------------------------------------------ */
/* MAIN MODAL — UNCHANGED UI */
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
  const [localFiles, setLocalFiles] = useState<File[]>(files);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [mediaTypes, setMediaTypes] = useState<{ [key: number]: string }>({});
  const [thumbnailFiles, setThumbnailFiles] = useState<{ [key: number]: File }>({});
  const [isPanoramas, setIsPanoramas] = useState<{ [key: number]: boolean }>({});
  const [groupLabel, setGroupLabel] = useState("");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [complimentaryIndexes, setComplimentaryIndexes] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showAgain, setShowAgain] = useState(true);

  const onSaveRef = React.useRef(onSave);
  React.useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // LOAD FROM LOCALSTORAGE ON MOUNT
  useEffect(() => {
    const saved = localStorage.getItem('confirmation_dialog_file_upload_cancel_show_again');
    if (saved !== null) {
      setShowAgain(JSON.parse(saved));
    }
  }, []);

  const handleToggleShowAgain = () => {
    setShowAgain(prev => !prev);
  };

  const { userType } = useAppContext();
  const { filesData } = useFileManagerContext();

  const existingGroups = Array.from(
    new Set(filesData?.files?.map(f => f.group).filter((g): g is string => Boolean(g)) || [])
  );

  const baseSuggestions = type === 'floor_plans' ? floorPlans : mediaOptions;
  const allSuggestions = Array.from(
    new Set([...baseSuggestions, ...existingGroups])
  );

  useEffect(() => {
    setLocalFiles(files);
    if (type === 'floor_plans') {
      const defaults: { [key: number]: string } = {};
      files.forEach((_, idx) => {
        defaults[idx] = "UnBranded Floor Plan";
      });
      setMediaTypes(defaults);
    } else {
      setMediaTypes({});
    }
    setSelectedIndexes([]);
    setComplimentaryIndexes([]);
    setThumbnailFiles({});
    setGroupLabel("");

    // Auto-detect panoramas on upload
    files.forEach((file, idx) => {
      detectIsPanoramaFromFile(file).then(isPanorama => {
        if (isPanorama) {
          setIsPanoramas(prev => ({ ...prev, [idx]: true }));
        }
      });
    });
  }, [files, type]);

  const removeFile = useCallback((index: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedIndexes(prev => prev.filter(i => i !== index));
    setComplimentaryIndexes(prev => prev.filter(i => i !== index));
  }, []);

  const handleCopyFromAbove = useCallback((index: number) => {
    if (index > 0) {
      const valueAbove = mediaTypes[index - 1];
      if (valueAbove) {
        setMediaTypes(prev => ({ ...prev, [index]: valueAbove }));
      }
    }
  }, [mediaTypes]);

  const handleTabNext = useCallback((index: number, value: string) => {
    if (index + 1 < localFiles.length) {
      setMediaTypes(prev => ({ ...prev, [index + 1]: value }));
    }
  }, [localFiles.length]);

  const handleAdd = useCallback(() => {
    const existingServiceFilesCount = filesData?.files?.filter(f => f.service?.uuid === serviceUuid).length || 0;

    setSelectedFiles(prev => {
      const unuploadedServiceFilesCount = prev.filter(f => f.service_id === serviceUuid).length;
      const totalExistingForService = existingServiceFilesCount + unuploadedServiceFilesCount;

      const filesToAdd = localFiles.map((file, index) => ({
        file,
        type: mediaTypes[index] || "",
        group: selectedIndexes.includes(index) ? groupLabel : "",
        upload: true,
        service_id: serviceUuid,
        is_admin_approved: userType === 'admin' ? true : !reviewFilesEnabled,
        is_show: true,
        sort_order: totalExistingForService + index,
        is_complimentary: complimentaryIndexes.includes(index),
        thumbnailFile: thumbnailFiles[index],
        isPanorama: isPanoramas[index] || false,
      }));

      return [...prev, ...filesToAdd];
    });

    // Close the modal and trigger the upload saving function
    onOpenChange(false);
    setTimeout(() => {
      if (onSaveRef.current) onSaveRef.current();
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    localFiles,
    mediaTypes,
    selectedIndexes,
    groupLabel,
    serviceUuid,
    reviewFilesEnabled,
    setSelectedFiles,
    onOpenChange,
    onSave,
    filesData,
    complimentaryIndexes,
  ]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      if (localFiles.length > 0 && showAgain) {
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
          className="w-[320px] md:w-[700px] max-w-none h-[90vh] md:h-[95vh] flex flex-col font-alexandria gap-0 p-4 md:p-6"
          onPointerDownOutside={(e) => {
            if (localFiles.length > 0) {
              e.preventDefault();
              if (showAgain) {
                setConfirmOpen(true);
              } else {
                onOpenChange(false);
              }
            }
          }}
          onEscapeKeyDown={(e) => {
            if (localFiles.length > 0) {
              e.preventDefault();
              if (showAgain) {
                setConfirmOpen(true);
              } else {
                onOpenChange(false);
              }
            }
          }}
        >
          <DialogHeader className="border-b pb-4 border-[#7d7d7d] flex-shrink-0">
            <DialogTitle className={`text-[18px] ${userType}-text font-[600]`}>
              FILE UPLOAD
            </DialogTitle>
          </DialogHeader>

          {selectedIndexes.length >= 2 && (
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
            {localFiles.map((file, idx) => (
              <FileRow
                key={idx}
                file={file}
                idx={idx}
                mediaType={mediaTypes[idx] || ""}
                onMediaTypeChange={(i, v) =>
                  setMediaTypes(p => ({ ...p, [i]: v }))
                }
                onRemove={removeFile}
                onToggleSelect={(i) =>
                  setSelectedIndexes(p =>
                    p.includes(i) ? p.filter(x => x !== i) : [...p, i]
                  )
                }
                isSelected={selectedIndexes.includes(idx)}
                type={type}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                allSuggestions={allSuggestions}
                totalFiles={localFiles.length}
                userType={userType}
                isComplimentary={complimentaryIndexes.includes(idx)}
                onToggleComplimentary={(i) =>
                  setComplimentaryIndexes(p =>
                    p.includes(i) ? p.filter(x => x !== i) : [...p, i]
                  )
                }
                onCopyFromAbove={handleCopyFromAbove}
                onTabNext={handleTabNext}
                thumbnailFile={thumbnailFiles[idx]}
                onThumbnailChange={(i, file) => {
                  if (file) {
                    setThumbnailFiles(p => ({ ...p, [i]: file }));
                  } else {
                    const newFiles = { ...thumbnailFiles };
                    delete newFiles[i];
                    setThumbnailFiles(newFiles);
                  }
                }}
                isPanorama={isPanoramas[idx] || false}
                onIsPanoramaChange={(idx, val) => setIsPanoramas(prev => ({ ...prev, [idx]: val }))}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#7d7d7d] flex-shrink-0 mt-2">
            <Button
              className={`w-full ${userType}-text ${userType}-border h-[44px]`}
              variant="outline"
              onClick={() => {
                if (localFiles.length > 0 && showAgain) {
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
              disabled={localFiles.length === 0}
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
