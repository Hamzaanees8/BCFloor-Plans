import React, { useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion";
import { Plus } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import TourSettingTable from "./TourSettingTable";
import AddAreaPopup from "./AddAreaPopup";
import { Input } from "./ui/input";


type SizeType = {
    width: number;
    height: number;
};

type VideoSizesType = {
    original: SizeType;
    small: SizeType;
    large: SizeType;
    mls: SizeType;
};

type PhotoSizesType = {
    original: SizeType;
    small: SizeType;
    large: SizeType;
    mls: SizeType;
};


export default function GlobalTourSetting() {
    const { userType } = useAppContext();

    const [areas, setAreas] = useState([
        {
            id: 1,
            area: "Main Floor",
            type: "Finished Area",
            charges: "$0.5 per sq. ft.",
            discount: "—",
        },
        {
            id: 2,
            area: "Lower Level",
            type: "Finished Area",
            charges: "$0.5 per sq. ft.",
            discount: "—",
        },
    ]);

    const [popupOpen, setPopupOpen] = useState(false);

    const [videoSizes, setVideoSizes] = useState<VideoSizesType>({
        original: { width: 1920, height: 1080 },
        small: { width: 1920, height: 1080 },
        large: { width: 1920, height: 1080 },
        mls: { width: 1920, height: 1080 }
    });

    const [photoSizes, setPhotoSizes] = useState<PhotoSizesType>({
        original: { width: 1920, height: 1080 },
        small: { width: 1920, height: 1080 },
        large: { width: 1920, height: 1080 },
        mls: { width: 1920, height: 1080 }
    });

    const handleAddArea = (newArea: { area: string; type: string; charges: string; discount: string }) => {
        setAreas((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                area: newArea.area,
                type: newArea.type,
                charges: newArea.charges,
                discount: newArea.discount,
            },
        ]);
    };

    const handleVideoSizeChange = (type: keyof VideoSizesType, dimension: keyof SizeType, value: number) => {
        setVideoSizes(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [dimension]: value
            }
        }));
    };

    const handlePhotoSizeChange = (type: keyof PhotoSizesType, dimension: keyof SizeType, value: number) => {
        setPhotoSizes(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [dimension]: value
            }
        }));
    };

    return (
        <div>
            <Accordion
                type="multiple"
                defaultValue={["tour", 'size']}
                className="w-full space-y-4 "
            >
                {userType === "admin" && (
                    <AccordionItem value="tour" className="border-none">
                        <AccordionTrigger
                            className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                                ? "[&>svg]:text-[#4290E9]"
                                : "[&>svg]:text-[#6BAE41]"
                                }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                        >
                            <div
                                className="flex items-center justify-between w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p>TOUR SETTINGS</p>
                                <div
                                    className="flex items-center gap-x-[10px] pr-[24px] cursor-pointer"
                                    onClick={() => setPopupOpen(true)}
                                >
                                    <p className="text-base font-semibold font-raleway">Add</p>
                                    <Plus
                                        className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`}
                                    />
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="w-full pb-0">
                            <TourSettingTable data={areas} />
                        </AccordionContent>
                    </AccordionItem>
                )}

                <AccordionItem value="size" className="border-none">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    >
                        <div
                            className="flex items-center justify-between w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p>FILE SIZE OPTIONS</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="w-full pb-0 font-alexandria">

                        <div className="mb-6">
                            <h3 className="text-[14px] text-[#666666] font-[700] mb-3 px-4 h-[54px] bg-[#E4E4E4] flex items-center">PHOTOS</h3>
                            <div className="w-full flex justify-center ">
                                <div className="w-[500px] grid grid-cols-1 gap-4 px-4">
                                    {Object.entries(photoSizes).map(([key, size]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                            <span className="text-[#666666] min-w-[120px]">
                                                {key === 'mls' ? 'MLS' : key.charAt(0).toUpperCase() + key.slice(1)} Photo Slips:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={size.width}
                                                        onChange={(e) => handlePhotoSizeChange(key as keyof PhotoSizesType, 'width', parseInt(e.target.value) || 0)}
                                                        className='h-[42px] w-[120px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">px</span>
                                                </div>
                                                <span className="text-gray-500">X</span>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={size.height}
                                                        onChange={(e) => handlePhotoSizeChange(key as keyof PhotoSizesType, 'height', parseInt(e.target.value) || 0)}
                                                        className='h-[42px] w-[120px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>


                        <div className="mb-6">
                            <h3 className="text-[14px] text-[#666666] font-[700] mb-3 px-4 h-[54px] bg-[#E4E4E4] flex items-center">VIDEO</h3>
                            <div className="w-full flex justify-center ">
                                <div className="w-[500px] grid grid-cols-1 gap-4 px-4">
                                    {Object.entries(videoSizes).map(([key, size]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                            <span className="capitalize text-[#666666] min-w-[120px]">
                                                {key === 'mls' ? 'MLS' : key.charAt(0).toUpperCase() + key.slice(1)} Video Size:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={size.width}
                                                        onChange={(e) => handleVideoSizeChange(key as keyof VideoSizesType, 'width', parseInt(e.target.value) || 0)}
                                                        className='h-[42px] w-[120px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">px</span>
                                                </div>
                                                <span className="text-gray-500">X</span>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={size.height}
                                                        onChange={(e) => handleVideoSizeChange(key as keyof VideoSizesType, 'height', parseInt(e.target.value) || 0)}
                                                        className='h-[42px] w-[120px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <AddAreaPopup
                open={popupOpen}
                setOpen={setPopupOpen}
                onAdd={handleAddArea}
            />
        </div>
    );
}