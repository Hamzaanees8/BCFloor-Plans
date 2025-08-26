'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Services } from '../../services/page';
import { useFileManagerContext } from '../FileManagerContext ';
// import FileUploader from './FileUploader';

function FileTab2({ currentService }: { currentService?: Services }) {
    const { unbrandedLink, setUnbrandedLink, brandedLink, setBrandedLink,  setPreviewFiles } = useFileManagerContext();
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const dragCounter = useRef(0);

    const handleFileInputClick = () => {
        fileInputRef.current?.click();
    };

     const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []).map((f) => ({
            file: f,
            upload: true,
        }));
        setPreviewFiles((prev) => [...prev, ...newFiles]);
    };

    const handleFilesChange = (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) return;

        const newFiles = selectedFiles.map((f) => ({
            file: f,
            upload: true,
        }));

        setPreviewFiles((prev) => [...prev, ...newFiles]);
    };


    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragging(false);
        dragCounter.current = 0;

        const droppedFiles = Array.from(e.dataTransfer?.files || []);

        handleFilesChange(droppedFiles);
        // eslint-disable-next-line
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
        <div className='font-alexandria w-full'>
            {dragging && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center pointer-events-none">

                </div>
            )}
            <div className='h-[66px] w-full bg-[#E4E4E4] flex justify-between items-center px-4 font-alexandria'>
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
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </div>
                    <div>
                        <p className='flex flex-col'><span className='text-[#4290E9] font-bold'>{currentService ? currentService.name : '3D Tour'} </span>
                            {/* <span className='text-[12px] text-[#7D7D7D]'>20 Photos</span> */}
                        </p>
                    </div>
                    <div>
                        <Button
                            onClick={() => setMediaUploaded(true)}
                            className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : 'bg-[#4290E9] hover:bg-[#4999f5]'}  h-[32px] w-[150px] flex justify-center items-center `}>{mediaUploaded ? <Check color="#fff" size={14} /> : 'Send for Approval'} </Button>
                    </div>
                </div>

            </div>
            <div className='flex flex-col items-center justify-center my-4'>
                <div className='w-[410px]'>
                    <Label className='text-[14px] text-[#424242]'>3D Tour Link - Branded</Label>
                    <Input
                        className='w-full h-[42px] text-[#666666]'
                        value={brandedLink}
                        onChange={(e) => setBrandedLink(e.target.value)}
                    />
                </div>
                <div className='w-[410px] mt-[10px]'>
                    <Label className='text-[14px] text-[#424242]'>3D Tour Link - Unbranded</Label>
                    <Input
                        className='w-full h-[42px] text-[#666]'
                        value={unbrandedLink}
                        onChange={(e) => setUnbrandedLink(e.target.value)}
                    />
                </div>
            </div>

            <div className='w-full'>
                <Accordion type="single" defaultValue="Preview" className="w-full">
                    <AccordionItem value="Preview">
                        <AccordionTrigger className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
                            Matterport Preview
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="w-full flex flex-col items-center gap-[20px] py-[30px] ">
                                {isValidUrl(brandedLink) && (
                                    <iframe
                                        src={brandedLink}
                                        className="w-[80%] h-[500px] border"
                                        allowFullScreen
                                    ></iframe>
                                )}
                                {isValidUrl(unbrandedLink) && (
                                    <iframe
                                        src={unbrandedLink}
                                        className="w-[80%] h-[500px] border"
                                        allowFullScreen
                                    ></iframe>
                                )}

                                {/* Show message if no valid link */}
                                {!isValidUrl(brandedLink) && !isValidUrl(unbrandedLink) && (
                                    <p className="text-gray-500">Enter a valid link to preview the 3D tour</p>
                                )}
                                {/* {previewFiles.length == 0 && <div className='w-full py-[54px] flex justify-center'>

                                    <FileUploader onFilesChange={handleFilesChange} />

                                </div>
                                } */}
                                {/* {previewFiles.map((item, idx) => (
                                    <div key={idx} className="w-[80%] relative">

                                        <img
                                            src={URL.createObjectURL(item.file)}
                                            alt="preview"
                                            className="w-full h-auto object-contain"
                                        />
                                        <span
                                            className="cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]"
                                            style={{
                                                clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                                backgroundColor: item.upload ? "#6BAE41" : "#E06D5E",
                                            }}
                                            onClick={() => {
                                                if (item.upload) {
                                                    const updated = [...previewFiles];
                                                    updated[idx].upload = false;
                                                    setPreviewFiles(updated);
                                                } else {
                                                    setPreviewFiles((prev) => prev.filter((_, i) => i !== idx));
                                                }
                                            }}
                                        >
                                            {item.upload ? <Check color="#fff" size={16} /> : <X color="#fff" size={16} />}
                                        </span>
                                    </div>
                                ))} */}

                            </div>

                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </div>
        </div>
    )
}

export default FileTab2