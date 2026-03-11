import { useAppContext } from '@/app/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import { useGlobalDownload } from '@/context/GlobalDownloadContext';

type LocalFile = {
  file: File;
  type?: string;
  upload?: boolean;
};

export type ApiFile = {
  id: number;
  uuid: string;
  name: string; // Changed from file_name to name
  file_path: string;
  url?: string;
  type: string;
  group: string | null;
  is_processing?: boolean;
  thumbnail_url?: string;
  variant_urls?: {
    thumb?: string;
    popup?: string;
  };
};
type CombinedFile = {
  id: string;
  name: string;
  url: string;
  isLocal: boolean;
  type: string;
  uuid: string;
  is_processing?: boolean;
  thumbnail_url?: string;
  variant_urls?: {
    thumb?: string;
    popup?: string;
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  localFiles?: LocalFile[];
  apiFiles: ApiFile[];
};

const DownloadModal: React.FC<Props> = ({ open, onClose, localFiles, apiFiles }) => {
  const { userType } = useAppContext();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'small' | 'large' | 'mls' | 'original'>>({});
  const { startDownload } = useGlobalDownload();

  const files: CombinedFile[] = useMemo(() => {
    const local = localFiles?.map((f, idx) => ({
      id: `local-${idx}`,
      name: f.file.name,
      url: URL.createObjectURL(f.file),
      isLocal: true,
      type: f.file.type,
      uuid: '', // Local files don't have UUIDs
    }));

    const api = apiFiles.map((f) => ({
      id: `api-${f.uuid}`, // Use UUID for API files
      name: f.group || f.name,
      url: f.url || '', // API files use DownloadFile function, but we might need url for preview
      isLocal: false,
      type: f.type,
      uuid: f.uuid,
      is_processing: f.is_processing,
      thumbnail_url: f.thumbnail_url,
      variant_urls: f.variant_urls,
    }));

    return [...local ?? [], ...api] as CombinedFile[];
  }, [localFiles, apiFiles]);

  // ✅ Select / Deselect all files
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(files.map((f) => f.id));
      // Default to original size for all if not set
      const initialSizes: Record<string, 'small' | 'large' | 'mls' | 'original'> = {};
      files.forEach(f => {
        if (!selectedSizes[f.id]) {
          initialSizes[f.id] = 'original';
        }
      });
      setSelectedSizes(prev => ({ ...prev, ...initialSizes }));
    } else {
      setSelectedFiles([]);
    }
  };

  // ✅ Pre-select all files when modal opens
  useEffect(() => {
    if (open && files.length > 0) {
      handleSelectAll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, files]);

  const handleGlobalSizeSelect = (size: 'small' | 'large' | 'mls' | 'original') => {
    const newSizes: Record<string, 'small' | 'large' | 'mls' | 'original'> = {};
    files.forEach(f => {
      newSizes[f.id] = size;
    });
    setSelectedSizes(newSizes);
  };

  // ✅ Toggle a single file
  const handleToggleFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.includes(fileId);
      if (!isSelected && !selectedSizes[fileId]) {
        setSelectedSizes(s => ({ ...s, [fileId]: 'original' }));
      }
      return isSelected ? prev.filter((id) => id !== fileId) : [...prev, fileId];
    });
  };

  const handleSizeSelect = (fileId: string, size: 'small' | 'large' | 'mls' | 'original') => {
    setSelectedSizes(prev => ({ ...prev, [fileId]: size }));
    if (!selectedFiles.includes(fileId)) {
      setSelectedFiles(prev => [...prev, fileId]);
    }
  };



  const handleDownloadSelected = async () => {
    const selected = files.filter((f) => selectedFiles.includes(f.id));

    const localSelected = selected.filter((f) => f.isLocal);
    const apiSelected = selected.filter((f) => !f.isLocal);

    // Download local files sequentially with a delay to prevent browser blocking
    for (const file of localSelected) {
      console.log(`Downloading: ${file.name}`);
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Wait 1.5 seconds between downloads
      await new Promise(res => setTimeout(res, 1500));
    }

    if (apiSelected.length > 0) {
      const payload: { uuid: string; size?: 'small' | 'large' | 'mls' | 'original' }[] = apiSelected.map(f => ({
        uuid: f.uuid,
        size: selectedSizes[f.id] || 'original'
      }));

      // Start the download via the global context, but don't wait for completion here
      startDownload(payload, 'Selected Files');

      onClose();
      setSelectedFiles([]);
      setSelectedSizes({});
    } else {
      // Only local files were selected, so we can just close
      onClose();
      setSelectedFiles([]);
      setSelectedSizes({});
    }
  };

  const sizeButtonClasses = (fileId: string, size: string) => {
    const isSelected = selectedSizes[fileId] === size;
    return `h-[32px] justify-center rounded-[6px] font-raleway border-[1px] text-[14px] font-[600] transition-colors ${isSelected
      ? `${userType}-bg ${userType}-border text-white hover:${userType}-bg hover:opacity-80`
      : `bg-transparent border-[#BBBBBB] text-[#666666] hover:border-${userType}-border hover-${userType}-bg hover:text-white`
      }`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#FAFAFA] rounded-[8px] shadow-lg border p-6 w-full max-w-[750px] max-h-[calc(100vh-40px)] flex flex-col font-alexandria [&>button]:hidden overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between border-b border-[#E4E4E4] pb-2">
            <DialogTitle className={`uppercase ${userType}-text text-[18px] font-semibold`}>
              Download Files
            </DialogTitle>
            <Button
              variant="ghost"
              onClick={() => {
                onClose();
                setSelectedFiles([]);
                setSelectedSizes({});
              }}
              className="p-0 hover:bg-transparent shadow-none h-auto transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#7D7D7D]" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 sidebar-scroll mt-4">
          {/* Global Size Selector */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E4E4E4] mb-4">
            <p className={`text-[14px] font-semibold ${userType}-text mb-3 uppercase tracking-wider`}>Select size for all</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleGlobalSizeSelect('original')}
                className={`flex-1 min-w-[140px] h-[38px] items-center justify-center rounded-[6px] font-alexandria border-[1px] text-[13px] font-semibold transition-all
                  ${Object.values(selectedSizes).every(s => s === 'original') && Object.keys(selectedSizes).length === files.length
                    ? `${userType}-bg ${userType}-border text-white hover:${userType}-bg hover:opacity-80`
                    : `bg-[#F8F8F8] border-[#BBBBBB] text-[#666666] hover:border-${userType}-border hover-${userType}-bg hover:text-white`}`}
              >
                Original Quality
              </Button>
              <Button
                onClick={() => handleGlobalSizeSelect('small')}
                className={`flex-1 min-w-[80px] h-[38px] items-center justify-center rounded-[6px] font-alexandria border-[1px] text-[13px] font-semibold transition-all
                  ${Object.values(selectedSizes).every(s => s === 'small') && Object.keys(selectedSizes).length === files.length
                    ? `${userType}-bg ${userType}-border text-white hover:${userType}-bg hover:opacity-80`
                    : `bg-[#F8F8F8] border-[#BBBBBB] text-[#666666] hover:border-${userType}-border hover-${userType}-bg hover:text-white`}`}
              >
                Small
              </Button>
              <Button
                onClick={() => handleGlobalSizeSelect('large')}
                className={`flex-1 min-w-[80px] h-[38px] items-center justify-center rounded-[6px] font-alexandria border-[1px] text-[13px] font-semibold transition-all
                  ${Object.values(selectedSizes).every(s => s === 'large') && Object.keys(selectedSizes).length === files.length
                    ? `${userType}-bg ${userType}-border text-white hover:${userType}-bg hover:opacity-80`
                    : `bg-[#F8F8F8] border-[#BBBBBB] text-[#666666] hover:border-${userType}-border hover-${userType}-bg hover:text-white`}`}
              >
                Large
              </Button>
              <Button
                onClick={() => handleGlobalSizeSelect('mls')}
                className={`flex-1 min-w-[80px] h-[38px] items-center justify-center rounded-[6px] font-alexandria border-[1px] text-[13px] font-semibold transition-all
                  ${Object.values(selectedSizes).every(s => s === 'mls') && Object.keys(selectedSizes).length === files.length
                    ? `${userType}-bg ${userType}-border text-white hover:${userType}-bg hover:opacity-80`
                    : `bg-[#F8F8F8] border-[#BBBBBB] text-[#666666] hover:border-${userType}-border hover-${userType}-bg hover:text-white`}`}
              >
                MLS
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-x-2.5 mb-4 px-2">
            <div
              onClick={() => handleSelectAll(!(selectedFiles.length === files.length && files.length > 0))}
              className={`w-4 h-4 flex items-center justify-center rounded-[2px] cursor-pointer bg-white border border-[#666666] transition-all`}
            >
              {selectedFiles.length === files.length && files.length > 0 && (
                <div className={`${userType}-bg w-2.5 h-2.5 rounded-[1px]`} />
              )}
            </div>
            <label htmlFor="selectAll" className="text-[#666666] text-sm font-medium cursor-pointer uppercase tracking-tight">
              Select All ({selectedFiles.length}/{files.length})
            </label>
          </div>

          <div className="flex flex-col gap-y-3 pr-1">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-x-4 p-3 bg-white rounded-lg shadow-sm border border-[#E4E4E4] hover:border-[#BBBBBB] transition-colors">
                <div
                  onClick={() => handleToggleFile(file.id)}
                  className="w-5 h-5 flex items-center justify-center rounded-[4px] cursor-pointer bg-white border border-[#BBBBBB] shrink-0"
                >
                  {selectedFiles.includes(file.id) && (
                    <div className={`${userType}-bg w-3 h-3 rounded-[2px]`} />
                  )}
                </div>

                <div className="relative w-[140px] h-[85px] shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  {file.is_processing ? (
                      <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                          <p className="text-gray-500 font-medium text-xs">Processing...</p>
                      </div>
                  ) : file.type === 'photo' ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={file.isLocal ? file.url : (file.thumbnail_url || file.variant_urls?.thumb || file.url || `${process.env.NEXT_PUBLIC_FILES_API_URL}/${apiFiles.find(af => af.uuid === file.uuid)?.file_path}`)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type === 'video' ? (
                    <video
                      src={file.isLocal ? file.url : (file.url || `${process.env.NEXT_PUBLIC_FILES_API_URL}/${apiFiles.find(af => af.uuid === file.uuid)?.file_path}`)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-xs">
                      {file.name.split('.').pop() || 'FILE'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-y-2 flex-grow min-w-0">
                  <p className="text-[#424242] text-[15px] font-semibold truncate leading-tight">{file.name}</p>

                  {!file.isLocal ? (
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        onClick={() => handleSizeSelect(file.id, 'original')}
                        className={`px-3 ${sizeButtonClasses(file.id, 'original')}`}
                      >
                        Original Quality
                      </Button>
                      <Button
                        onClick={() => handleSizeSelect(file.id, 'small')}
                        className={`px-3 ${sizeButtonClasses(file.id, 'small')}`}
                      >
                        Small
                      </Button>
                      <Button
                        onClick={() => handleSizeSelect(file.id, 'large')}
                        className={`px-3 ${sizeButtonClasses(file.id, 'large')}`}
                      >
                        Large
                      </Button>
                      <Button
                        onClick={() => handleSizeSelect(file.id, 'mls')}
                        className={`px-3 ${sizeButtonClasses(file.id, 'mls')}`}
                      >
                        MLS
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[#999999] text-[13px] font-medium italic">Ready to download (Local)</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-3 font-alexandria border-t border-[#E4E4E4] pt-4 mt-2">
          <>
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                setSelectedFiles([]);
                setSelectedSizes({});
              }}
              className={`bg-white rounded-[6px] w-full md:w-[170px] h-[44px] text-[16px] font-semibold border ${userType}-border ${userType}-text hover:!text-white hover-${userType}-bg transition-colors`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownloadSelected}
              disabled={selectedFiles.length === 0}
              className={`${userType}-bg rounded-[6px] text-white hover:opacity-80 hover:${userType}-bg w-full md:w-[200px] h-[44px] font-semibold text-[16px] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md`}
            >
              Download {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} Selected
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadModal;
