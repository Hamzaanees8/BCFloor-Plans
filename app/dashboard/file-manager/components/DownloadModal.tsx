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
import React, { useMemo, useState } from 'react';
import { DownloadFile } from '../file-manager';

type LocalFile = {
  file: File;
  type?: string;
  upload?: boolean;
};

type ApiFile = {
  id: number;
  uuid: string;
  name: string; // Changed from file_name to name
  file_path: string;
  url?: string;
  type: string;
  group: string | null;
};
type CombinedFile = {
  id: string;
  name: string;
  url: string;
  isLocal: boolean;
  type: string;
  uuid: string;
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
      name: f.name,
      url: f.url || '', // API files use DownloadFile function, but we might need url for preview
      isLocal: false,
      type: f.type,
      uuid: f.uuid,
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

  const handledownloadFile = async (fileUuid: string, fileName: string, size?: 'small' | 'large' | 'mls' | 'original') => {
    try {
      const token = localStorage.getItem('token') ?? "";

      const response = await DownloadFile(token, fileUuid, size);

      if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

      // Convert the response directly to blob
      const blob = await response.blob();

      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    }
  };

  const handleDownloadSelected = async () => {
    const selected = files.filter((f) => selectedFiles.includes(f.id));

    for (const file of selected) {
      if (file.isLocal) {
        // Download local files
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Download API files
        const size = selectedSizes[file.id] || 'original';
        await handledownloadFile(file.uuid, file.name, size);
      }
    }

    onClose();
    setSelectedFiles([]);
    setSelectedSizes({});
  };

  const sizeButtonClasses = (fileId: string, size: string) => {
    const isSelected = selectedSizes[fileId] === size;
    return `h-[32px] justify-center rounded-[6px] font-raleway border-[1px] text-[14px] font-[600] transition-colors ${isSelected
      ? `${userType}-bg ${userType}-border text-white`
      : `bg-transparent border-[#BBBBBB] text-[#666666] hover:border-${userType}-border hover:bg-[#4290e9] hover:text-white`
      }`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#E4E4E4] rounded-xl shadow-lg border p-6 w-full max-w-[700px] font-Alexandria [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className={`uppercase ${userType}-text text-[18px] font-[600]`}>
              Download Files
            </DialogTitle>
            <Button
              variant="ghost"
              onClick={() => {
                onClose();
                setSelectedFiles([]);
                setSelectedSizes({});
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors h-auto"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#7D7D7D]" />
            </Button>
          </div>
        </DialogHeader>

        <hr className="w-full h-[1px] bg-[#BBBBBB]" />
        <div className="flex items-center gap-x-2.5 mb-3">
          <div
            onClick={() => handleSelectAll(!(selectedFiles.length === files.length && files.length > 0))}
            className="w-4 h-4 flex items-center justify-center rounded-[2px] cursor-pointer bg-white border border-[#666666]"
          >
            {selectedFiles.length === files.length && files.length > 0 && (
              <div className="w-2.5 h-2.5 bg-[#4290E9] rounded-[2px]" />
            )}
          </div>
          <label htmlFor="selectAll" className="text-[#666666] cursor-pointer">
            Select All
          </label>
        </div>

        <div className="flex flex-col gap-y-3 max-h-[400px] overflow-y-auto pr-2 sidebar-scroll">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-x-4 p-2 bg-white rounded-lg shadow-sm">
              <div
                onClick={() => handleToggleFile(file.id)}
                className="w-4 h-4 flex items-center justify-center rounded-[2px] cursor-pointer bg-white border border-[#666666]"
              >
                {selectedFiles.includes(file.id) && (
                  <div className="w-2.5 h-2.5 bg-[#4290E9] rounded-[2px]" />
                )}
              </div>


              {file.type === 'photo' ? (
                <div className="relative w-[180px] h-[110px] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.isLocal ? file.url : (file.url || `${process.env.NEXT_PUBLIC_FILES_API_URL}/${apiFiles.find(af => af.uuid === file.uuid)?.file_path}`)}
                    alt={file.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ) : file.type === 'video' ? (
                <div className="relative w-[180px] h-[110px] shrink-0">
                  <video
                    src={file.isLocal ? file.url : (file.url || `${process.env.NEXT_PUBLIC_FILES_API_URL}/${apiFiles.find(af => af.uuid === file.uuid)?.file_path}`)}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ) : (
                <div className="w-[180px] h-[110px] shrink-0 flex items-center justify-center bg-gray-200 text-gray-600 rounded-md">
                  {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                </div>
              )}

              <div className="flex flex-col gap-y-2 flex-grow min-w-0">
                <p className="text-[#666666] text-[15px] font-medium truncate">{file.name}</p>

                {!file.isLocal && (
                  <>
                    <div className="flex items-center gap-x-2">
                      <Button
                        onClick={() => handleSizeSelect(file.id, 'original')}
                        className={`w-[160px] ${sizeButtonClasses(file.id, 'original')}`}
                      >
                        Original Quality
                      </Button>
                      <Button
                        onClick={() => handleSizeSelect(file.id, 'small')}
                        className={`w-[80px] ${sizeButtonClasses(file.id, 'small')}`}
                      >
                        Small
                      </Button>
                    </div>

                    <div className="flex items-center gap-x-2">
                      <Button
                        onClick={() => handleSizeSelect(file.id, 'large')}
                        className={`w-[80px] ${sizeButtonClasses(file.id, 'large')}`}
                      >
                        Large
                      </Button>
                      <Button
                        onClick={() => handleSizeSelect(file.id, 'mls')}
                        className={`w-[80px] ${sizeButtonClasses(file.id, 'mls')}`}
                      >
                        MLS
                      </Button>
                    </div>
                  </>
                )}
                {file.isLocal && (
                  <p className="text-[#999999] text-[13px]">Ready to download (Local)</p>
                )}
              </div>
            </div>
          ))}

        </div>
        <hr className="w-full h-[1px] bg-[#BBBBBB] my-2" />
        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-3 font-raleway">
          <button
            onClick={() => {
              onClose();
              setSelectedFiles([]);
              setSelectedSizes({});
            }}
            className={`bg-white rounded-[6px] w-full md:w-[176px] h-[44px] text-[16px] font-[600] border ${userType}-border ${userType}-text hover:bg-[#f1f8ff]`}
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadSelected}
            disabled={selectedFiles.length === 0}
            className={`${userType}-bg rounded-[6px] text-white hover:opacity-90 w-full md:w-[176px] h-[44px] font-[600] text-[16px] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Download Selected
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadModal;
