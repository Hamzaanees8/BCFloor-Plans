import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'
import { useFileManagerContext } from '../FileManagerContext ';
import { CheckIcon } from 'lucide-react';
const TourMatterport = () => {
    const { links, setLinks, } = useFileManagerContext();
    const [isBrandedChecked, setIsBrandedChecked] = useState(false);
    const [isUnbrandedChecked, setIsUnbrandedChecked] = useState(false);
    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };
    const brandedLinks = links.filter(l => l.type === 'branded');
    const unbrandedLinks = links.filter(l => l.type === 'unbranded');

    const handleLinkChange = (index: number, value: string) => {
        setLinks(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], link: value };
            return updated;
        });
    };


    return (
        <div className='font-alexandria w-full'>
            <div className='flex flex-col items-center justify-center gap-y-[38px] my-[42px]'>
                {/* Branded */}
                <div className='flex items-end gap-x-5 w-[474px]'>
                    {brandedLinks.length > 0 && (
                        <div className='flex items-end gap-x-5'>
                            <div className="flex flex-col gap-y-4 w-[474px]">
                                <Label className="text-[16px] text-[#424242]">
                                    3D Tour Link - Branded
                                </Label>
                                {brandedLinks.map((link, idx) => (
                                    <Input
                                        key={`branded-${idx}`}
                                        className="w-full h-[42px] text-[#666666] border border-[#8E8E8E]"
                                        value={link.link}
                                        onChange={e => handleLinkChange(links.indexOf(link), e.target.value)}
                                    />
                                ))}
                            </div>
                            <div
                                onClick={() => setIsBrandedChecked(prev => !prev)}
                                className={`w-8 h-8 border-2 rounded-[6px] mb-1.5 flex items-center justify-center cursor-pointer transition-colors
                ${isBrandedChecked ? 'bg-[#6BAE41] border-[#6BAE41]' : 'bg-white border-[#7D7D7D]'}`}
                            >
                                {isBrandedChecked && <CheckIcon className='text-[#FFFFFF] w-4 h-4' />}
                            </div>
                        </div>
                    )}
                </div>

                {/* Unbranded */}
                <div className='flex items-end gap-x-5 w-[474px]'>
                    {unbrandedLinks.length > 0 && (
                        <div className='flex items-end gap-x-5'>
                            <div className="flex flex-col gap-y-4 w-[474px]">
                                <Label className="text-[16px] text-[#424242]">
                                    3D Tour Link - Unbranded
                                </Label>
                                {unbrandedLinks.map((link, idx) => (
                                    <Input
                                        key={`unbranded-${idx}`}
                                        className="w-full h-[42px] text-[#666666] border border-[#8E8E8E]"
                                        value={link.link}
                                        onChange={e => handleLinkChange(links.indexOf(link), e.target.value)}
                                    />
                                ))}
                            </div>

                            {/* ✅ Unbranded Checkbox */}
                            <div
                                onClick={() => setIsUnbrandedChecked(prev => !prev)}
                                className={`w-8 h-8 border border-[#6BAE41] rounded-[6px] mb-1.5 flex items-center justify-center cursor-pointer transition-colors
                ${isUnbrandedChecked ? 'bg-[#6BAE41] border-[#6BAE41]' : 'bg-white border-[#7D7D7D]'}`}
                            >
                                {isUnbrandedChecked && <CheckIcon className='text-[#FFFFFF] w-4 h-4' />}
                            </div>
                        </div>
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
                                {brandedLinks.map(
                                    (link, idx) =>
                                        isValidUrl(link.link) && (
                                            <iframe
                                                key={`preview-branded-${idx}`}
                                                src={link.link}
                                                className="w-[80%] h-[500px] border"
                                                allowFullScreen
                                            ></iframe>
                                        )
                                )}

                                {unbrandedLinks.map(
                                    (link, idx) =>
                                        isValidUrl(link.link) && (
                                            <iframe
                                                key={`preview-unbranded-${idx}`}
                                                src={link.link}
                                                className="w-[80%] h-[500px] border"
                                                allowFullScreen
                                            ></iframe>
                                        )
                                )}

                                {/* Fallback if no valid URLs */}
                                {brandedLinks.every(l => !isValidUrl(l.link)) &&
                                    unbrandedLinks.every(l => !isValidUrl(l.link)) && (
                                        <p className="text-gray-500">
                                            Enter a valid link to preview the 3D tour
                                        </p>
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