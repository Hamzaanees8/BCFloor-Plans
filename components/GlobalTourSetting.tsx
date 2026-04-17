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
import AddAreaPopup, { AreaData } from "./AddAreaPopup";
import { Input } from "./ui/input";
import { CreateMediaSettings, SaveTourSettings, UpdateTourSetting, DeleteTourSetting, GetMediaSettings, GetTourSettings } from "@/app/dashboard/global-settings/global-settings";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Switch } from "./ui/switch";
import DropdownActions from "./DropdownActions";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";


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

type TourDefaultsType = {
    music_enabled: boolean;
    default_song: string;
    transition_effect: string[];
    layout_option: string;
    video_slideshow_enabled: boolean;
    letterbox_correction: boolean;
    aspect_ratio: string;
    autoplay_enabled: boolean;
    allow_print_download: boolean;
    allow_client_upload: boolean;
    require_payment_before_download: boolean;
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

    const [tourDefaults, setTourDefaults] = useState<TourDefaultsType>({
        music_enabled: true,
        default_song: "tell-me-what",
        transition_effect: ["kenburns"],
        layout_option: "standard",
        video_slideshow_enabled: true,
        letterbox_correction: true,
        aspect_ratio: "16:9",
        autoplay_enabled: true,
        allow_print_download: true,
        allow_client_upload: true,
        require_payment_before_download: false,
    });

    const transitionOptions = [
        { label: 'Ken Burns', value: 'kenburns' },
        { label: 'Fade In', value: 'fade-in' },
        { label: 'Slide Right-Left', value: 'slide-right-left' },
        { label: 'Slide Left-Right', value: 'slide-left-right' },
        { label: 'Slide Top-Bottom', value: 'slide-top-bottom' },
        { label: 'Slide Bottom-Top', value: 'slide-bottom-top' },
        { label: 'Reveal Left-Right', value: 'reveal-left-right' },
        { label: 'Rotate Bottom-Left', value: 'rotate-bottom-left' },
        { label: 'Rotate Bottom-Right', value: 'rotate-bottom-right' },
        { label: 'Rotate Left-Bottom', value: 'rotate-left-bottom' },
        { label: 'Rotate Left-Top', value: 'rotate-left-top' },
        { label: 'Fade Move Left', value: 'fade-move-left' },
        { label: 'Fade Move Right', value: 'fade-move-right' },
        { label: 'Fade Across Right', value: 'fade-across-right' },
        { label: 'Fade Across Left', value: 'fade-across-left' },
        { label: 'Zoom Fast', value: 'zoom-fast' },
        { label: 'Zoom Slow', value: 'zoom-slow' },
    ];

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
                if (mediaSettings.tour_defaults) setTourDefaults(mediaSettings.tour_defaults);
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
    const handleTourDefaultChange = (key: keyof TourDefaultsType, value: any) => {
        setTourDefaults(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const toggleTransition = (effect: string) => {
        setTourDefaults(prev => {
            const current = prev.transition_effect || [];
            if (current.includes(effect)) {
                return { ...prev, transition_effect: current.filter(e => e !== effect) };
            } else {
                return { ...prev, transition_effect: [...current, effect] };
            }
        });
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
                videos: videoSizes,
                tour_defaults: tourDefaults
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

    const columns: ColumnDef<AreaData>[] = [
        {
            accessorKey: "area",
            header: "AREAS",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.area}</div>
            ),
        },
        {
            accessorKey: "type",
            header: "TYPE",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.type}</div>
            ),
        },
        {
            accessorKey: "charge",
            header: "CHARGE",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.charge}</div>
            ),
        },
        {
            accessorKey: "discount",
            header: "DISCOUNT",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.discount}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={row.original.status}
                        onCheckedChange={(checked) => handleStatusChange(row.original, checked)}
                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                    />
                    <DropdownActions
                        options={[
                            {
                                label: "Edit",
                                onClick: () => handleEditClick(row.original),
                            },
                            {
                                label: "Delete",
                                onClick: () => row.original.uuid && handleDeleteArea(row.original.uuid),
                                confirm1: true,
                            }
                        ]}
                    />
                </div>
            ),
        },
    ];


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
                            <DataTable
                                data={areas}
                                columns={columns}
                                loading={loading}
                                dataName="Tour Settings"
                                userType={userType || 'admin'}
                                error={false}
                            />
                        </AccordionContent>
                    </AccordionItem>
                )}

                <AccordionItem value="defaults" className="border-none">
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
                            <p>TOUR GLOBAL DEFAULTS</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="w-full pb-0 font-alexandria">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Background Music</Label>
                                    <Switch
                                        checked={tourDefaults.music_enabled}
                                        onCheckedChange={(val) => handleTourDefaultChange('music_enabled', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[#666666] font-semibold">Default Song</Label>
                                    <Select
                                        value={tourDefaults.default_song}
                                        onValueChange={(val) => handleTourDefaultChange('default_song', val)}
                                    >
                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                            <SelectValue placeholder="Select Song" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tell-me-what">Tell-me-what</SelectItem>
                                            <SelectItem value="embrace">Embrace</SelectItem>
                                            <SelectItem value="sandbreaker">Sandbreaker</SelectItem>
                                            <SelectItem value="showreel">Showreel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[#666666] font-semibold">Media Transition Effects</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="w-full min-h-[42px] p-2 bg-[#EEEEEE] border border-[#BBBBBB] rounded-md cursor-pointer flex flex-wrap gap-1 items-center">
                                                {tourDefaults.transition_effect.length > 0 ? (
                                                    tourDefaults.transition_effect.map(effect => (
                                                        <Badge key={effect} variant="secondary" className="bg-white border-[#BBBBBB] text-[#666666] font-normal">
                                                            {transitionOptions.find(opt => opt.value === effect)?.label || effect}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Select Transitions</span>
                                                )}
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0" align="start">
                                            <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
                                                {transitionOptions.map((opt) => (
                                                    <div key={opt.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`transition-${opt.value}`}
                                                            checked={tourDefaults.transition_effect.includes(opt.value)}
                                                            onCheckedChange={() => toggleTransition(opt.value)}
                                                        />
                                                        <label
                                                            htmlFor={`transition-${opt.value}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {opt.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[#666666] font-semibold">Tour Layout Options</Label>
                                    <Select
                                        value={tourDefaults.layout_option}
                                        onValueChange={(val) => handleTourDefaultChange('layout_option', val)}
                                    >
                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                            <SelectValue placeholder="Select Layout" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="modern">Modern</SelectItem>
                                            <SelectItem value="minimalist">Minimalist</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Video Slideshow Mode</Label>
                                    <Switch
                                        checked={tourDefaults.video_slideshow_enabled}
                                        onCheckedChange={(val) => handleTourDefaultChange('video_slideshow_enabled', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Letterbox Correction</Label>
                                    <Switch
                                        checked={tourDefaults.letterbox_correction}
                                        onCheckedChange={(val) => handleTourDefaultChange('letterbox_correction', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[#666666] font-semibold">Image Aspect Ratio</Label>
                                    <Select
                                        value={tourDefaults.aspect_ratio}
                                        onValueChange={(val) => handleTourDefaultChange('aspect_ratio', val)}
                                    >
                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                            <SelectValue placeholder="Select Ratio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="16:9">16:9</SelectItem>
                                            <SelectItem value="4:3">4:3</SelectItem>
                                            <SelectItem value="3:2">3:2</SelectItem>
                                            <SelectItem value="1:1">1:1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Autoplay Tour</Label>
                                    <Switch
                                        checked={tourDefaults.autoplay_enabled}
                                        onCheckedChange={(val) => handleTourDefaultChange('autoplay_enabled', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Allow Print Quality Downloads</Label>
                                    <Switch
                                        checked={tourDefaults.allow_print_download}
                                        onCheckedChange={(val) => handleTourDefaultChange('allow_print_download', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Allow Clients to Upload Media</Label>
                                    <Switch
                                        checked={tourDefaults.allow_client_upload}
                                        onCheckedChange={(val) => handleTourDefaultChange('allow_client_upload', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Require Payment Before Download</Label>
                                    <Switch
                                        checked={tourDefaults.require_payment_before_download}
                                        onCheckedChange={(val) => handleTourDefaultChange('require_payment_before_download', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

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