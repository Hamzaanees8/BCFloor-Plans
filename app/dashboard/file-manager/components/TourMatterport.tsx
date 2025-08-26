import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react';
import React from 'react'
import { useFileManagerContext } from '../FileManagerContext ';
const TourMatterport = () => {
    const { unbrandedLink, setUnbrandedLink, brandedLink, setBrandedLink, brandedSelected, setBrandedSelected, unBrandedSelected, setUnBrandedSelected } = useFileManagerContext();
    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <div className='font-alexandria w-full'>
            <div className='flex flex-col items-center justify-center gap-y-[38px] my-[42px]'>
                {/* Branded */}
                <div className='flex items-end gap-x-5 w-[474px]'>
                    <div className='w-full'>
                        <Label className='text-[14px] text-[#424242]'>3D Tour Link - Branded</Label>
                        <Input
                            className='w-full h-[42px] text-[#666666] border border-[#8E8E8E] mt-2.5'
                            value={brandedLink}
                            onChange={(e) => setBrandedLink(e.target.value)}
                        />
                    </div>
                    {brandedSelected ? (
                        <div
                            className='w-[34px] h-[30px] bg-[#6BAE41] rounded-[6px] flex items-center justify-center mb-2 cursor-pointer'
                            onClick={() => setBrandedSelected(false)}
                        >
                            <Check className='w-4 h-4 text-white' />
                        </div>
                    ) : (
                        <div
                            className='w-[34px] mb-2 h-[30px] rounded-[6px] border-[2px] border-[#7D7D7D] cursor-pointer'
                            onClick={() => setBrandedSelected(true)}
                        />
                    )}
                </div>

                {/* Unbranded */}
                <div className='flex items-end gap-x-5 w-[474px]'>
                    <div className='w-full'>
                        <Label className='text-[14px] text-[#424242]'>3D Tour Link - Unbranded</Label>
                        <Input
                            className='w-full h-[42px] text-[#666] border border-[#8E8E8E] mt-2.5'
                            value={unbrandedLink}
                            onChange={(e) => setUnbrandedLink(e.target.value)}
                        />
                    </div>
                    {unBrandedSelected ? (
                        <div
                            className='w-[34px] h-[30px] bg-[#6BAE41] rounded-[6px] flex items-center justify-center mb-2 cursor-pointer'
                            onClick={() => setUnBrandedSelected(false)}
                        >
                            <Check className='w-4 h-4 text-white' />
                        </div>
                    ) : (
                        <div
                            className='w-[34px] mb-2 h-[30px] rounded-[6px] border-[2px] border-[#7D7D7D] cursor-pointer'
                            onClick={() => setUnBrandedSelected(true)}
                        />
                    )}
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
                            </div>

                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </div>
        </div>
    )
}

export default TourMatterport