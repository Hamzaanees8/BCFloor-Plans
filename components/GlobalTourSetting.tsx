// components/GlobalTourSetting.tsx
import React, { useState, useEffect } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion";
import { Plus } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import TourSettingTable from "./TourSettingTable";
import AddAreaPopup, { AreaData } from "./AddAreaPopup";
import { Input } from "./ui/input";
import { CreateMediaSettings, SaveTourSettings, UpdateTourSetting, DeleteTourSetting, GetMediaSettings, GetTourSettings } from "@/app/dashboard/global-settings/global-settings";
import { toast } from "sonner";

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
    const [areas, setAreas] = useState<AreaData[]>([]);
    const [popupOpen, setPopupOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<null | AreaData>(null);
    const [videoSizes, setVideoSizes] = useState<VideoSizesType>({
        original: { width: 0, height: 0 },
        small: { width: 0, height: 0 },
        large: { width: 0, height: 0 },
        mls: { width: 0, height: 0 }
    });
    const [photoSizes, setPhotoSizes] = useState<PhotoSizesType>({
        original: { width: 0, height: 0 },
        small: { width: 0, height: 0 },
        large: { width: 0, height: 0 },
        mls: { width: 0, height: 0 }
    });

    const [loading, setLoading] = useState(true);

    const fetchAreas = async () => {

        setLoading(true);
        try {
            const tourData = await GetTourSettings();
            if (tourData && tourData.data && tourData.data.tour_settings) {
                const mappedAreas = tourData.data.tour_settings.map((item: AreaData, index: number) => ({
                    ...item,
                    uuid: item.uuid || `temp-${index}-${Date.now()}`
                }));
                setAreas(mappedAreas);
            }


        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };
    const fetchMediaSettings = async () => {
        try {
            const mediaData = await GetMediaSettings();

            if (mediaData && mediaData.value) {
                const mediaSettings = mediaData.value
                if (mediaSettings.photos) setPhotoSizes(mediaSettings.photos);
                if (mediaSettings.videos) setVideoSizes(mediaSettings.videos);
            }

        } catch (error) {
            console.error('Failed to fetch media settings:', error);
        }
    };

    useEffect(() => {
        fetchAreas();
        fetchMediaSettings();
    }, []);

    const handleAddArea = async (newArea: Omit<AreaData, 'id' | 'uuid'>) => {
        try {
            // API expects an array for creation or we can adjust if needed, 
            // but usually creation might be bulk. Based on user request "send only one object in array for add".
            // The previous global-settings.ts SaveTourSettings takes TourSettingPayload[] which is correct for add.
            // We'll send just the new one.
            const payload = {
                ...newArea,
                status: true // Default status if not provided, or take from newArea
            };

            await SaveTourSettings([payload]);
            await fetchAreas();
            toast.success('Area added successfully');
        } catch (error) {
            console.error('Failed to add area:', error);
            toast.error('Failed to add area. Please try again.');
        }
    };

    const handleEditArea = async (updatedArea: AreaData) => {
        if (!updatedArea.uuid) {
            toast.error('Cannot update area without ID');
            return;
        }

        try {
            await UpdateTourSetting(updatedArea);
            await fetchAreas();
            toast.success('Area updated successfully');
        } catch (error) {
            console.error('Failed to update area:', error);
            toast.error('Failed to update area. Please try again.');
        }
    };

    const handleDeleteArea = async (uuid: string) => {
        try {
            await DeleteTourSetting(uuid);
            // Optimistic update or fetch
            const updatedAreas = areas.filter(area => area.uuid !== uuid);
            setAreas(updatedAreas);
            toast.success('Area deleted successfully');
        } catch (error) {
            console.error('Failed to delete area:', error);
            toast.error('Failed to delete area. Please try again.');
            // Re-fetch to sync state if failed or to be sure
            fetchAreas();
        }
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

    const handleEditClick = (area: AreaData) => {
        setEditingArea(area);
        setPopupOpen(true);
    };

    const handleAddClick = () => {
        setEditingArea(null);
        setPopupOpen(true);
    };

    const handlePopupClose = () => {
        setPopupOpen(false);
        setEditingArea(null);
    };

    const handleSaveMediaSettings = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            toast.error('Please login to save settings');
            return;
        }

        try {
            await CreateMediaSettings({
                photos: photoSizes,
                videos: videoSizes
            });

            toast.success('Media settings saved successfully');
        } catch (error) {
            console.error('Failed to save media settings:', error);
            toast.error('Failed to save media settings. Please try again.');
        }
    };

    const handleStatusChange = async (area: AreaData, status: boolean) => {
        if (!area.uuid) return;

        try {
            const updatedArea = { ...area, status };
            await UpdateTourSetting(updatedArea);

            // Optimistic update
            const updatedAreas = areas.map(a =>
                a.uuid === area.uuid ? updatedArea : a
            );
            setAreas(updatedAreas);
            toast.success('Status updated successfully');
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status. Please try again.');
            fetchAreas();
        }
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
                                    onClick={handleAddClick}
                                >
                                    <p className="text-base font-semibold font-raleway">Add</p>
                                    <Plus
                                        className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`}
                                    />
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="w-full pb-0">
                            <TourSettingTable
                                data={areas}
                                onEdit={handleEditClick}
                                onDelete={(area) => area.uuid && handleDeleteArea(area.uuid)}
                                onStatusChange={handleStatusChange}
                                loading={loading}
                            />
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

                        {/* Save Button */}
                        <div className="w-full flex justify-end mt-6 mb-4 px-4">
                            <button
                                type="button"
                                onClick={handleSaveMediaSettings}
                                className={`w-[200px] h-[44px] ${userType}-bg text-white rounded-[6px] font-[600] text-[16px] hover:opacity-90 transition-opacity`}
                            >
                                Save Changes
                            </button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <AddAreaPopup
                open={popupOpen}
                setOpen={handlePopupClose}
                onAdd={handleAddArea}
                onEdit={handleEditArea}
                editingArea={editingArea}
            />
        </div>
    );
}