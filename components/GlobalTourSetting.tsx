// components/GlobalTourSetting.tsx
import React, { useState, useEffect } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion";

import { useAppContext } from "@/app/context/AppContext";
import { Input } from "./ui/input";
import { CreateMediaSettings, GetMediaSettings, GetTourDefaultSettings, SaveTourDefaultSettings } from "@/app/dashboard/global-settings/global-settings";
import { AgentAudio, GetOrganizationAudios } from "@/app/dashboard/agents/agent-audio";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
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
import { Button } from "./ui/button";

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
    default_audio_uuid?: string;
    transition_effect: string[];
    layout_option: string;
    video_slideshow_enabled: boolean;
    letterbox_correction: boolean;
    aspect_ratio: string;
    autoplay_enabled: boolean;
    allow_print_download: boolean;
    allow_client_upload: boolean;
    require_payment_before_download: boolean;
    enable_matterport_default_expiry?: boolean;
    matterport_default_expiry_days?: number;
    matterport_renewal_plans?: { id: string; months: number; label: string; price: number }[];
    matterport_auto_invoice_enabled?: boolean;
    matterport_auto_invoice_days?: number;
    matterport_reminder_intervals?: number[];
};

const defaultRenewalPlans = [
    { id: "3_months", months: 3, label: "3 Months", price: 35 },
    { id: "6_months", months: 6, label: "6 Months", price: 60 },
    { id: "12_months", months: 12, label: "1 Year (12 Months)", price: 100 },
];

const GlobalTourSetting = React.forwardRef<{ save: () => Promise<void> }, object>((props, ref) => {
    const { userType } = useAppContext();
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
        enable_matterport_default_expiry: true,
        matterport_default_expiry_days: 90,
        matterport_renewal_plans: defaultRenewalPlans,
        matterport_auto_invoice_enabled: true,
        matterport_auto_invoice_days: 14,
        matterport_reminder_intervals: [30, 14, 7, 1],
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



    const fetchMediaSettings = async () => {
        try {
            const mediaData = await GetMediaSettings();

            if (mediaData && mediaData.value) {
                const mediaSettings = mediaData.value;
                if (mediaSettings.photos) setPhotoSizes(mediaSettings.photos);
                if (mediaSettings.videos) setVideoSizes(mediaSettings.videos);
                // Note: tour_defaults might still be in media_settings for legacy reasons, 
                // but we prefer the dedicated GetTourDefaultSettings call below.
            }

            const tourDefaultData = await GetTourDefaultSettings();
            if (tourDefaultData && tourDefaultData.value) {
                setTourDefaults(tourDefaultData.value);
            }

        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const [orgAudios, setOrgAudios] = useState<AgentAudio[]>([]);

    const fetchOrgAudios = async () => {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                const orgUuid = userInfo?.organization?.uuid || userInfo?.data?.organization?.uuid || userInfo?.data?.uuid || userInfo?.organization_uuid;
                if (orgUuid) {
                    const res = await GetOrganizationAudios(orgUuid);
                    if (res && res.data) {
                        setOrgAudios(Array.isArray(res.data) ? res.data : []);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch org audios:', error);
        }
    };

    useEffect(() => {
        fetchMediaSettings();
        fetchOrgAudios();
    }, []);

    React.useImperativeHandle(ref, () => ({
        save: handleSaveMediaSettings,
    }));

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
            // Save photo and video sizes
            await CreateMediaSettings({
                photos: photoSizes,
                videos: videoSizes
            });

            // Save tour defaults separately
            await SaveTourDefaultSettings(tourDefaults);

            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings. Please try again.');
        }
    };




    return (
        <div className="w-full">
            <Accordion
                type="multiple"
                defaultValue={["tour", "defaults", "size"]}
                className="w-full space-y-4 "
            >

                <AccordionItem value="defaults" className="border-none">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    >
                        <div
                            className="flex items-center justify-between w-full"
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
                                    <Label className="text-[#666666] font-semibold">Default Audio</Label>
                                    <Select
                                        value={tourDefaults.default_audio_uuid || tourDefaults.default_song || ""}
                                        onValueChange={(val) => {
                                            const selectedAudio = orgAudios.find(a => a.uuid === val);
                                            setTourDefaults(prev => ({
                                                ...prev,
                                                default_audio_uuid: val,
                                                default_song: selectedAudio ? selectedAudio.name : val
                                            }));
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                            <SelectValue placeholder={orgAudios.length > 0 ? "Select Audio" : "No audio files uploaded"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {orgAudios.length > 0 ? (
                                                orgAudios.map(audio => (
                                                    <SelectItem key={audio.uuid} value={audio.uuid}>{audio.name}</SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>No audio files found</SelectItem>
                                            )}
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

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[#666666] font-semibold">Enable Matterport Default Expiry</Label>
                                        <Switch
                                            checked={!!tourDefaults.enable_matterport_default_expiry}
                                            onCheckedChange={(val) => handleTourDefaultChange('enable_matterport_default_expiry', val)}
                                            className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                        />
                                    </div>
                                    
                                    {tourDefaults.enable_matterport_default_expiry && (
                                        <div className="space-y-4 pt-2 border-t border-gray-200">
                                            <div className="space-y-2">
                                                <Label className="text-[#666666] font-semibold">Initial Free Hosting Period (Days)</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={tourDefaults.matterport_default_expiry_days || 90}
                                                    onChange={(e) => handleTourDefaultChange('matterport_default_expiry_days', parseInt(e.target.value) || 0)}
                                                    className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]"
                                                />
                                            </div>

                                            {/* Renewal Pricing Tiers */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[#666666] font-semibold">Matterport Renewal Plans (Pricing Tiers)</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const current = tourDefaults.matterport_renewal_plans || defaultRenewalPlans;
                                                            const nextId = `custom_${Date.now()}`;
                                                            handleTourDefaultChange('matterport_renewal_plans', [
                                                                ...current,
                                                                { id: nextId, months: 6, label: "6 Months Extension", price: 50 }
                                                            ]);
                                                        }}
                                                        className="text-xs h-7 border-[#4290E9] text-[#4290E9]"
                                                    >
                                                        + Add Renewal Plan
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(tourDefaults.matterport_renewal_plans || defaultRenewalPlans).map((plan, idx) => (
                                                        <div key={plan.id || idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                                                            <Input
                                                                type="text"
                                                                placeholder="Plan Label (e.g. 6 Months)"
                                                                value={plan.label}
                                                                onChange={(e) => {
                                                                    const updated = [...(tourDefaults.matterport_renewal_plans || defaultRenewalPlans)];
                                                                    updated[idx] = { ...updated[idx], label: e.target.value };
                                                                    handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                }}
                                                                className="h-9 text-xs bg-white flex-1"
                                                            />
                                                            <div className="flex items-center gap-1 w-28">
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    placeholder="Months"
                                                                    value={plan.months}
                                                                    onChange={(e) => {
                                                                        const updated = [...(tourDefaults.matterport_renewal_plans || defaultRenewalPlans)];
                                                                        updated[idx] = { ...updated[idx], months: parseInt(e.target.value) || 1 };
                                                                        handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                    }}
                                                                    className="h-9 text-xs bg-white"
                                                                />
                                                                <span className="text-[11px] text-gray-500">mos</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 w-28">
                                                                <span className="text-xs text-gray-500">$</span>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="CAD"
                                                                    value={plan.price}
                                                                    onChange={(e) => {
                                                                        const updated = [...(tourDefaults.matterport_renewal_plans || defaultRenewalPlans)];
                                                                        updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                                                                        handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                    }}
                                                                    className="h-9 text-xs bg-white"
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const updated = (tourDefaults.matterport_renewal_plans || defaultRenewalPlans).filter((_, i) => i !== idx);
                                                                    handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                }}
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                ✕
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Auto-Draft Invoicing */}
                                            <div className="space-y-3 pt-2 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[#666666] font-semibold">Auto-Generate Draft Renewal Invoice</Label>
                                                    <Switch
                                                        checked={tourDefaults.matterport_auto_invoice_enabled ?? true}
                                                        onCheckedChange={(val) => handleTourDefaultChange('matterport_auto_invoice_enabled', val)}
                                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                                    />
                                                </div>
                                                {(tourDefaults.matterport_auto_invoice_enabled ?? true) && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-gray-500">Days Before Expiry to Generate Draft Invoice</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="60"
                                                            value={tourDefaults.matterport_auto_invoice_days || 14}
                                                            onChange={(e) => handleTourDefaultChange('matterport_auto_invoice_days', parseInt(e.target.value) || 14)}
                                                            className="w-full h-[38px] bg-[#EEEEEE] border-[#BBBBBB] text-xs"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

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
        </div>
    );
});
GlobalTourSetting.displayName = "GlobalTourSetting";

export default GlobalTourSetting;