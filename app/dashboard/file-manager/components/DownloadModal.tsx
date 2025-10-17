import { useAppContext } from '@/app/context/AppContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

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
  type: string;
  group: string | null;
};
type CombinedFile = {
  id: string;
  name: string;
  url: string;
  isLocal: boolean;
  type: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  localFiles: LocalFile[];
  apiFiles: ApiFile[];
};

const DownloadModal: React.FC<Props> = ({ open, onClose, localFiles, apiFiles }) => {
  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;
  const { userType } = useAppContext();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false)
  const files: CombinedFile[] = useMemo(() => {
    const local = localFiles.map((f, idx) => ({
      id: `local-${idx}`,
      name: f.file.name,
      url: URL.createObjectURL(f.file),
      isLocal: true,
      type: f.file.type, // 👈 File API gives us mime type (e.g. image/png, video/mp4)
    }));

    const api = apiFiles.map((f, idx) => ({
      id: `api-${idx}`,
      name: f.name,
      url: `${API_URL}/${f.file_path}`,
      isLocal: false,
      type: f.type,
    }));

    return [...local, ...api];
  }, [localFiles, apiFiles, API_URL]);
  // ✅ Select / Deselect all files
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(files.map((f) => f.id));
    } else {
      setSelectedFiles([]);
    }
  };

  // ✅ Toggle a single file
  const handleToggleFile = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  // const handleDownload = () => {
  //   const selected = files.filter((f) => selectedFiles.includes(f.id));
  //   selected.forEach((file) => {
  //     const link = document.createElement('a');
  //     link.href = file.urls.original; // or whichever size you want
  //     link.download = file.name;
  //     link.click();
  //   });
  //   onClose();
  // };
  console.log("files", files)
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#E4E4E4] rounded-xl shadow-lg border p-6 w-full max-w-[700px] font-Alexandria">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <AlertDialogTitle className={`uppercase ${userType}-text text-[18px] font-[600]`}>
              Download Files
            </AlertDialogTitle>
            <button
              onClick={() => {
                onClose();
                setSelectedFiles([]);
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#7D7D7D]" />
            </button>
          </div>
        </AlertDialogHeader>

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

        <div className="flex flex-col gap-y-3 max-h-[300px] overflow-y-auto pr-2 sidebar-scroll">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-x-4">
              <div
                onClick={() => handleToggleFile(file.id)}
                className="w-4 h-4 flex items-center justify-center rounded-[2px] cursor-pointer bg-white border border-[#666666]"
              >
                {selectedFiles.includes(file.id) && (
                  <div className="w-2.5 h-2.5 bg-[#4290E9] rounded-[2px]" />
                )}
              </div>


              {file.type === 'photo' ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-[210px] h-[125px] object-cover rounded-md"
                  />
                </>
              ) : file.type === 'video' ? (
                <video
                  src={file.url}
                  className="w-[210px] h-[125px] object-cover rounded-md"
                  controls
                />
              ) : (
                <div className="w-[210px] h-[125px] flex items-center justify-center bg-gray-200 text-gray-600 rounded-md">
                  {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                </div>
              )}

              <div className="flex flex-col gap-y-2 w-[385px]">
                <p className="text-[#666666] text-[16px] font-normal max-w-[250px] truncate">{file.name}</p>

                <div className="flex items-center gap-x-[10px]">
                  <Button
                    className={`w-[200px] h-[32px] justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[600] text-[#EEEEEE] hover:text-[#fff] hover-${userType}-bg`}
                  >
                    Original/Print Quality
                  </Button>
                  <Button
                    className={`w-[100px] h-[32px] justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[600] text-[#EEEEEE] hover:text-[#fff] hover-${userType}-bg`}
                  >
                    Small
                  </Button>
                </div>

                <div className="flex items-center gap-x-[10px]">
                  <Button
                    className={`w-[100px] h-[32px] justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[600] text-[#EEEEEE] hover:text-[#fff] hover-${userType}-bg`}
                  >
                    Large
                  </Button>
                  <Button
                    className={`w-[100px] h-[32px] justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[600] text-[#EEEEEE] hover:text-[#fff] hover-${userType}-bg`}
                  >
                    MLS
                  </Button>
                </div>
              </div>
            </div>
          ))}

        </div>
        <hr className="w-full h-[1px] bg-[#BBBBBB]" />
        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-3 font-raleway">
          <button
            onClick={() => {
              onClose();
              setSelectedFiles([]);
            }}
            className={`bg-white rounded-[6px] w-full md:w-[176px] h-[44px] text-[16px] font-[600] border ${userType}-border ${userType}-text hover:bg-[#f1f8ff]`}
          >
            Cancel
          </button>
          <button
            onClick={() => setOpenModal(true)}
            disabled={selectedFiles.length === 0}
            className={`${userType}-bg rounded-[6px] text-white hover-${userType}-bg w-full md:w-[176px] h-[44px] font-[600] text-[16px] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Download Selected
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
      {openModal && (
        <AlertDialog open={openModal} onOpenChange={setOpenModal}>
          <AlertDialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-lg border p-6 w-full max-w-[500px] font-Alexandria">
            <AlertDialogHeader>
              <div className="flex items-center justify-between">
                <AlertDialogTitle className={`uppercase ${userType}-text text-[18px] font-[600]`}>
                  Download Size
                </AlertDialogTitle>
                <button
                  onClick={() => {
                    setOpenModal(false)
                    setSelectedFiles([]);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-[#7D7D7D]" />
                </button>
              </div>
            </AlertDialogHeader>
            <hr className="w-full h-[1px] bg-[#BBBBBB]" />
            <div className="flex flex-col items-center justify-center gap-y-2 my-4">
              <Button
                className={`w-[100px] h-[32px] justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[600] text-[#EEEEEE] hover:text-[#fff] hover-${userType}-bg`}
              >
                Small
              </Button>
              <Button
                className={`w-[100px] h-[32px] justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[600] text-[#EEEEEE] hover:text-[#fff] hover-${userType}-bg`}
              >
                Large
              </Button>
              <Button
                className={`w-[100px] h-[32px] justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[600] text-[#EEEEEE] hover:text-[#fff] hover-${userType}-bg`}
              >
                MLS
              </Button>
              <Button
                className={`w-[200px] h-[32px] justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[600] text-[#EEEEEE] hover:text-[#fff] hover-${userType}-bg`}
              >
                Original/Print Quality
              </Button>
            </div>
            <hr className="w-full h-[1px] bg-[#BBBBBB]" />
            <AlertDialogFooter className="flex justify-end gap-3 font-raleway">
              <button
                onClick={() => {
                  setOpenModal(false);
                  setSelectedFiles([]);
                  onClose();
                }}
                className={`bg-white rounded-[6px] w-full md:w-[176px] h-[44px] text-[16px] font-[600] border ${userType}-border ${userType}-text hover:bg-[#f1f8ff]`}
              >
                Download
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AlertDialog>
  );
};

export default DownloadModal;
