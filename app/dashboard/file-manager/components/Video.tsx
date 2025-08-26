'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import FilePreviewModal from './FilePreviewModal';
import { Check, X } from 'lucide-react';
import { DownloadIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import FileUploader from './FileUploader';
import { Services } from '../../services/page';
import { useFileManagerContext } from '../FileManagerContext ';
import { toast } from 'sonner';

export interface SelectedFiles {
    file: File;
    type: string;
    group?: string;
    upload?: boolean;
    service_id?: string

}

function Video({ currentService }: { currentService?: Services }) {
    const [files, setFiles] = useState<File[]>([]);
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const { selectedVideoFiles, setSelectedVideoFiles } = useFileManagerContext();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const dragCounter = useRef(0);

    const handleFileInputClick = () => {
        setFiles([])
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        const videoFiles = selected.filter(file => file.type.startsWith('video/'));
        setFiles(videoFiles);
    };

    const handleFilesChange = (selectedVideoFiles: File[]) => {
        setFiles(selectedVideoFiles);
    };
    console.log('Selected Files:', selectedVideoFiles);

    useEffect(() => {
        if (files.length > 0) {
            setOpen(true);
        }

    }, [files])
    const filesForService = selectedVideoFiles.filter(f => f.service_id === currentService?.uuid);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragging(false);
        dragCounter.current = 0;

        const droppedFiles = Array.from(e.dataTransfer?.files || []);
        const videoFiles = droppedFiles.filter(file => file.type.startsWith('video/'));
        const invalidFiles = droppedFiles.filter(file => !file.type.startsWith('video/'));

        if (invalidFiles.length > 0) {
            toast.error("Only video files are allowed.")
        }

        if (videoFiles.length > 0) {
            handleFilesChange(videoFiles);
        }
    }, []);


    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        dragCounter.current += 1;
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
    }, []);


    useEffect(() => {
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);


    return (
        <div>
            {dragging && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center pointer-events-none">
                </div>
            )}
            <div className='h-[66px] w-full bg-[#E4E4E4] flex justify-between items-center px-4 font-alexandria'>
                <div>
                    <Button

                        onClick={handleFileInputClick}
                        className='bg-[#4290E9] h-[32px] w-[150px] flex justify-center items-center hover:bg-[#4999f5]'>Add File</Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        accept="video/*"
                        onChange={handleFileSelect}
                    />
                </div>
                <div>
                    <p className='flex flex-col'><span className='text-[#4290E9] font-bold'>{currentService ? currentService.name : ''}</span>
                        {/* <span className='text-[12px] text-[#7D7D7D]'>20 Photos</span> */}
                    </p>
                </div>
                <div>
                    <Button
                        onClick={() => {
                            setMediaUploaded(true);
                            // setSelectedVideoFiles(prev =>
                            //     prev.map(file => ({ ...file, upload: true }))
                            // );
                        }}
                        className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : 'bg-[#4290E9] hover:bg-[#4999f5]'}  h-[32px] w-[150px] flex justify-center items-center `}>{mediaUploaded ? <Check color="#fff" size={14} /> : 'Submit to Client'} </Button>
                </div>
            </div>
            <div className="p-4">
                {filesForService.length === 0 && (
                    <div className='w-full flex justify-center items-center mt-20'>
                        <FileUploader onFilesChange={handleFilesChange} type="video" />
                    </div>)}
                <FilePreviewModal type='HDR_photos' open={open} onOpenChange={() => { setOpen(false) }} files={files} setSelectedFiles={setSelectedVideoFiles} serviceUuid={currentService?.uuid ?? ''} />
                {filesForService.length > 0 && (
                    <div className="mt-4 w-full grid grid-cols-4 gap-2 bg-[#BBBBBB] p-3">
                        {filesForService.map((file, idx) => (
                            <div key={idx} className="bg-[#BBBBBB] h-auto relative">
                                <div className="relative w-full h-[240px]">
                                    <video
                                        src={URL.createObjectURL(file.file)}
                                        className="w-full h-full object-cover"
                                        controls
                                    />
                                    <span
                                        className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                                        style={{
                                            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                            backgroundColor: `${file.upload ? "#6BAE41" : "#E06D5E"}`,
                                        }}
                                        onClick={() => {
                                            setSelectedVideoFiles(prev =>
                                                prev.flatMap(f => {
                                                    if (f.file === file.file && f.service_id === file.service_id) {
                                                        return f.upload ? [{ ...f, upload: false }] : [];
                                                    }
                                                    return [f];
                                                })
                                            );
                                        }}


                                    >
                                        {file.upload ? <Check color="#fff" size={14} /> : <X color="#fff" size={14} />}
                                    </span>
                                </div>
                                <div className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#BBBBBB] text-[9px]'>
                                    <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">{file.file.name}</p>
                                    <div className='col-span-2 flex items-center justify-between'>
                                        <p className='text-[#8E8E8E] mt-1'>Exterior ({idx + 1} of {filesForService.length})</p>
                                        <span className='flex w-[24px] h-[24px] cursor-pointer'>
                                            <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                )}
            </div>
        </div>
    );
}

export default Video;
