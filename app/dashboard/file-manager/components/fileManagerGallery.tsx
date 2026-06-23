"use client";

import { useState } from "react";
import CopyableFileName from './CopyableFileName';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { DownloadIcon } from "@/components/Icons";
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

  const handleDownload = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    const downloadUrl = `${API_URL}/${filePath}`;
    console.log("Downloading:", downloadUrl);
    // Implement actual download logic here
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filePath.split('/').pop() || 'download';
    link.click();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelected(null);
    }
  };

  const isPDF = (file: any): boolean => {
    if (!file) return false;
    const path = file.file_path || "";
    const type = file.type || "";
    return path.toLowerCase().endsWith('.pdf') || type === 'pdf' || type === 'application/pdf';
  };

  const files = (filesData?.files || []).filter(file => {
    // Date check
    const createdDate = new Date(file.created_at);
    const cutoffDate = new Date('2026-02-11');
    if (createdDate < cutoffDate) return false;
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {externalIsOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || <Button variant="default">Select Photo</Button>}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-7xl h-[80vh] !rounded-none p-4 overflow-hidden bg-[#E4E4E4] font-alexandria">
        <DialogHeader className="border-b border-gray-400 px-6 py-3">
          <DialogTitle className="text-[#4290E9] font-semibold tracking-wide text-left">
            SELECT PHOTO
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-3 justify-end">
          {/* <Button
            variant="outline"
            className="text-[#4290E9] w-[160px] h-[40px] border-[#4290E9] hover:bg-[#4290E9] hover:text-white"
            disabled={selected === null}
          >
            Edit
          </Button> */}
          <Button
            className="bg-[#4290E9] w-[160px] h-[40px] hover:bg-[#4290E9]/90 text-white"
            onClick={handleConfirmSelection}
            disabled={selected === null}
          >
            Add Photo
          </Button>
        </div>

        <div className="p-6 h-full overflow-y-auto">
          {files.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {files.map((file, idx) => (
                <div
                  key={file.id}
                  className='justify-self-center cursor-pointer'
                  onClick={() => handleImageSelect(idx)}
                >
                  <div className="relative">
                    <div className={`relative w-[280px] h-[175px] border bg-black overflow-hidden transition-all ${selected === idx ? 'border-[#4290E9] border-2' : 'border-[#A8A8A8]'
                      }`}>
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
                          alt={file.name}
                          className="object-contain w-full h-full"
                        />
                      )}
                      {selected === idx && (
                        <span
                          className="cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]"
                          style={{
                            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                            backgroundColor: "#4290E9"
                          }}
                        >
                          <Check color="#fff" size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#ffffff] text-[14px]'>
                    <p className="col-span-2 text-[#8E8E8E] mt-1 !text-[14px]">
                      <CopyableFileName name={file.group || ''} />
                    </p>
                    <div className='col-span-2 flex items-center justify-between'>
                      <p className='text-[#8E8E8E] mt-1'>
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                      <span
                        className='flex w-[24px] h-[24px] cursor-pointer'
                        onClick={(e) => handleDownload(e, file.file_path)}
                      >
                        <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500 font-alexandria">
              <p className="text-xl font-semibold mb-2">No media in your gallery</p>
              {/* <p className="text-sm">Upload photos to see them here.</p> */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}