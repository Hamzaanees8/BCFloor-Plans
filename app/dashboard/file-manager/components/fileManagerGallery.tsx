"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Upload, Image as ImageIcon } from "lucide-react";
import { useFileManagerContext } from '../FileManagerContext';
import { PdfPlaceholder } from './OptimizedPreview';
import { PanoramaBadge } from './PanoramaBadge';
import { isPanoramaFile } from '../utils/panoramaUtils';

interface FileManagerGalleryProps {
  onImageSelect: (imageUrl: string) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function FileManagerGallery({
  onImageSelect,
  trigger,
  isOpen: externalIsOpen,
  onClose: externalOnClose
}: FileManagerGalleryProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { filesData } = useFileManagerContext();

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose ? (open: boolean) => { if (!open) externalOnClose(); } : setInternalIsOpen;

  const handleImageSelect = (idx: number) => {
    setSelected(idx);
  };

  const handleConfirmSelection = () => {
    if (selected !== null && files?.[selected]) {
      const selectedFile = files[selected];
      const imageUrl = selectedFile.variant_urls?.landing || selectedFile.thumbnail_url || `${API_URL}/${selectedFile.file_path}`;
      onImageSelect(imageUrl);
      setIsOpen(false);
      setSelected(null);
    }
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg|bmp|heic|heif|avif)$/i.test(file.name);
      if (!isImage) {
        toast.error("Only image files are allowed. PDF, video, and other files cannot be added to feature sheets.");
        e.target.value = "";
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      onImageSelect(imageUrl);
      setIsOpen(false);
      setSelected(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelected(null);
    }
  };

  const isPDF = (file: any): boolean => {
    if (!file) return false;
    const path = (file.file_path || file.name || "").toLowerCase();
    const type = (file.type || "").toLowerCase();
    return path.endsWith('.pdf') || type === 'pdf' || type === 'application/pdf';
  };

  const isVideo = (file: any): boolean => {
    if (!file) return false;
    const path = (file.file_path || file.name || "").toLowerCase();
    const type = (file.type || "").toLowerCase();
    return type === 'video' || type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v|wmv|flv)$/i.test(path);
  };

  const files = (filesData?.files || []).filter(file => {
    // Date check
    const createdDate = new Date(file.created_at);
    const cutoffDate = new Date('2026-02-11');
    if (createdDate < cutoffDate) return false;

    // Feature sheets gallery only allows images (not PDF, video or other non-image files)
    if (isPDF(file) || isVideo(file)) return false;

    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {externalIsOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || <Button variant="default">Select Photo</Button>}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-[75vw] w-[75vw] h-[80vh] rounded-2xl p-0 overflow-hidden bg-slate-50 font-alexandria border border-gray-200 shadow-2xl flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 bg-white border-b border-gray-200 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#4290E9] flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-gray-900 font-bold text-lg tracking-tight">
                Photo Gallery
              </DialogTitle>
              <p className="text-xs text-gray-500 font-normal">Select a photo or upload a new file from your device</p>
            </div>
          </div>
          {files.length > 0 && (
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 mr-8">
              {files.length} {files.length === 1 ? 'Photo' : 'Photos'} Available
            </span>
          )}
        </DialogHeader>

        {/* Action Bar */}
        <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-xs">
          <span className="text-xs text-gray-500 font-medium">
            {selected !== null ? '1 photo selected' : 'Click any photo to select'}
          </span>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                className="text-[#4290E9] border-[#4290E9] h-[38px] px-4 hover:bg-[#4290E9] hover:text-white flex items-center gap-2 text-sm font-medium transition-all shadow-xs rounded-lg"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4" />
                  Upload Image
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLocalFileUpload}
              />
            </label>
            <Button
              className="bg-[#4290E9] h-[38px] px-5 hover:bg-[#4290E9]/90 text-white flex items-center gap-2 text-sm font-medium shadow-xs rounded-lg disabled:opacity-40"
              onClick={handleConfirmSelection}
              disabled={selected === null}
            >
              <Check className="w-4 h-4" />
              Add Photo
            </Button>
          </div>
        </div>

        {/* Gallery Content Area */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
          {files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file, idx) => {
                const displayName = file.group || file.name || file.file_path?.split('/').pop() || 'Untitled Image';
                const isSelected = selected === idx;
                
                return (
                  <div
                    key={file.id}
                    className={`group relative cursor-pointer flex flex-col bg-white rounded-xl overflow-hidden border transition-all duration-200 ${
                      isSelected
                        ? 'border-[#4290E9] ring-2 ring-[#4290E9] shadow-md'
                        : 'border-gray-200 hover:border-[#4290E9]/60 hover:shadow-md'
                    }`}
                    onClick={() => handleImageSelect(idx)}
                  >
                    <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                      {isPanoramaFile(file) && <PanoramaBadge />}
                      {isPDF(file) ? (
                        (!file.variant_urls || (Array.isArray(file.variant_urls) && file.variant_urls.length === 0) || Object.keys(file.variant_urls).length === 0) ? (
                          <PdfPlaceholder
                            className="w-full h-full object-contain"
                            message="service is not paid yet"
                          />
                        ) : (
                          <div className="relative w-full h-full overflow-hidden">
                            <iframe
                              src={`${file.variant_urls?.popup || file.url || `${API_URL}/${file.file_path}`}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                              className="w-full h-full pointer-events-none border-none"
                              tabIndex={-1}
                              scrolling="no"
                            />
                            <div className="absolute inset-0 bg-transparent" />
                          </div>
                        )
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={file.variant_urls?.thumb || file.thumbnail_url || file.url || `${API_URL}/${file.file_path}`}
                          alt={displayName}
                          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300 ease-out"
                        />
                      )}

                      {/* Selected Overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#4290E9]/15 transition-all" />
                      )}

                      {/* Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#4290E9] text-white rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150">
                          <Check size={16} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>

                    {/* Image Group/Name Footer */}
                    <div className="px-3.5 py-2.5 bg-white border-t border-gray-100 flex items-center justify-between">
                      <p
                        className="text-xs font-medium text-gray-700 truncate w-full"
                        title={displayName}
                      >
                        {displayName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500 font-alexandria">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#4290E9] flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-lg font-bold text-gray-800 mb-1">No media in your gallery</p>
              <p className="text-sm text-gray-500 mb-5 text-center max-w-sm">Upload a photo directly from your computer to use it in your feature sheet.</p>
              <label className="cursor-pointer">
                <Button
                  type="button"
                  className="bg-[#4290E9] hover:bg-[#4290E9]/90 text-white px-6 h-[40px] flex items-center gap-2 font-medium shadow-sm rounded-lg"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLocalFileUpload}
                />
              </label>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}