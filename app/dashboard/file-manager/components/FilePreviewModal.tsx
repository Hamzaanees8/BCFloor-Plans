'use client';
import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@radix-ui/react-dropdown-menu";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { SelectedFiles, useFileManagerContext } from "../FileManagerContext";
import { OptimizedImagePreview } from "./OptimizedPreview";

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
}: FileRowProps) => {
  return (
    <div className="flex gap-[10px] pr-[10px]">
      <div className="w-auto">
        <div className="w-[200px] h-[130px] bg-gray-300 rounded-[6px] overflow-hidden relative">
          <OptimizedImagePreview file={file} className="w-full h-full object-cover" />

          <span
            className="flex w-[14px] h-[14px] absolute top-2 right-2 z-10 cursor-pointer"
            onClick={() => onRemove(idx)}
          >
            <X color={'#E06D5E'} size={14} />
          </span>

          {type === 'floor_plan' && (
            <Input
              className="absolute bottom-2 right-2 w-[14px] h-[14px] cursor-pointer"
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(idx)}
            />
          )}
        </div>
      </div>

      <div className="w-full flex flex-col gap-[10px]">
        <Label className="text-[#7d7d7d] text-[14px]">Media Name</Label>

        {type !== 'floor_plans' ? (
          <div className="relative">
            <Input
              value={mediaType}
              onChange={(e) => {
                onMediaTypeChange(idx, e.target.value);
                setOpenDropdown(idx);
              }}
              onFocus={() => setOpenDropdown(idx)}
              placeholder="Select or Type Media Name"
              className="w-full h-[42px] border text-[#696868] border-[#7d7d7d]"
            />

            {openDropdown === idx && (
              <div className="absolute z-[100] w-full mt-1 bg-white border border-[#7d7d7d] rounded-md shadow-lg max-h-[200px] overflow-y-auto custom-scroll">
                {allSuggestions
                  .filter(item =>
                    !mediaType ||
                    item.toLowerCase().includes(mediaType.toLowerCase())
                  )
                  .map((item, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-[#696868] text-[14px]"
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
        ) : (
          <Select onValueChange={(val) => onMediaTypeChange(idx, val)}>
            <SelectTrigger className="w-full h-[42px] border text-[#696868] border-[#7d7d7d]">
              <SelectValue placeholder="Select Media Name" />
            </SelectTrigger>
            <SelectContent>
              {floorPlans.map((item, i) => (
                <SelectItem key={i} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="text-[13px] text-[#7d7d7d] grid grid-cols-3">
          <p className="truncate">{file.name}</p>
          <p className="text-center">(1 of {totalFiles})</p>
          <p
            onClick={() => onRemove(idx)}
            className="text-[#E06D5E] cursor-pointer text-right"
          >
            Delete
          </p>
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
}

export default function FilePreviewModal({
  open,
  onOpenChange,
  files,
  setSelectedFiles,
  type,
  serviceUuid,
  reviewFilesEnabled,
}: Props) {
  const [localFiles, setLocalFiles] = useState<File[]>(files);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [mediaTypes, setMediaTypes] = useState<{ [key: number]: string }>({});
  const [groupLabel, setGroupLabel] = useState("");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const { userType } = useAppContext();
  const { filesData } = useFileManagerContext();

  const existingGroups = Array.from(
    new Set(filesData?.files?.map(f => f.group).filter((g): g is string => Boolean(g)) || [])
  );

  const allSuggestions = Array.from(
    new Set([...mediaOptions, ...existingGroups])
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
    setGroupLabel("");
  }, [files, type]);

  const removeFile = useCallback((index: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedIndexes(prev => prev.filter(i => i !== index));
  }, []);

  const handleAdd = useCallback(() => {
    const filesToAdd = localFiles.map((file, index) => ({
      file,
      type: mediaTypes[index] || "",
      group: selectedIndexes.includes(index) ? groupLabel : "",
      upload: true,
      service_id: serviceUuid,
      is_admin_approved:
        userType === 'admin' ? true : !reviewFilesEnabled,
      is_show: true,
    }));

    setSelectedFiles(prev => [...prev, ...filesToAdd]);
    onOpenChange(false);
  }, [
    localFiles,
    mediaTypes,
    selectedIndexes,
    groupLabel,
    serviceUuid,
    userType,
    reviewFilesEnabled,
    setSelectedFiles,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[320px] md:w-[700px] max-w-none font-alexandria">
        <DialogHeader className="border-b pb-4 border-[#7d7d7d]">
          <DialogTitle className={`text-[18px] ${userType}-text font-[600]`}>
            FILE UPLOAD
          </DialogTitle>
        </DialogHeader>

        {selectedIndexes.length >= 2 && (
          <div className="mb-4">
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

        <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
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
            />
          ))}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              className={`w-full ${userType}-text ${userType}-border h-[44px]`}
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className={`w-full ${userType}-bg text-white h-[44px]`}
              onClick={handleAdd}
              disabled={localFiles.length === 0}
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
