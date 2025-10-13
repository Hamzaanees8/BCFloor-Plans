import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useAppContext } from "@/app/context/AppContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DropDownArrow } from "./Icons";
import { ChevronDownIcon, Plus } from "lucide-react";
import { VendorAddress, VendorCompany } from "@/app/dashboard/vendors/vendors";
import { VendorService, VendorSettings, WorkHours } from "./VendorTable";
import ServiceItem from "./ServiceItem";
import { Button } from "./ui/button";
import AddBreakPopup from "@/app/dashboard/calendar/components/AddBreakPopup";
import WorkAreaMap, { LatLng } from "./WorkAreaMap";

interface DaySchedule {
    enabled: boolean;
    startTime: string;
    endTime: string;
    twilight: boolean;
}

interface Services {
    uuid: string;
    name?: string;
    category?: { name: string };
    background_color?: string;
    bcolor?: string;
    thumbnail?: string
    thumbnail_url?: string
    status?: boolean;
    product_options?: {
        uuid: string
        id: number
        title: string
        amount: string
        cost?: number
        adjustment_time?: string;

    }[]
}

export interface Break {
    id?: number;
    uuid?: string;
    vendor_id?: number;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    address?: string;

}

export type CurrentUser = {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    secondary_email?: string;
    primary_phone?: string;
    secondary_phone?: string;
    notification_email?: boolean;
    email_type?: string;
    name_on_booking: boolean;
    repeat_weekly: string;
    review_files: boolean;
    sync_google_calendar: boolean;
    sync_google: boolean;
    sync_email: string;
    password?: string;
    avatar?: string;
    avatar_url?: string;
    company?: VendorCompany;
    settings?: VendorSettings;
    vendor_services?: VendorService[];
    addresses?: VendorAddress[];
    work_hours?: WorkHours;
    coordinates?: string[]
    additional_breaks: Break[]
};

interface WorkDetailProps {
    currentUser: CurrentUser | null
    servicesData: Services[]
    paymentPerKm: number | string;
    setPaymentPerKm: React.Dispatch<React.SetStateAction<number | string>>;
    fieldErrors: Record<string, string[]>
    enableServiceArea: boolean
    setEnableServiceArea: React.Dispatch<React.SetStateAction<boolean>>;
    forceServiceArea: boolean
    setForceServiceArea: React.Dispatch<React.SetStateAction<boolean>>;
    providerId?: string;
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    coords: LatLng[];
    setmap_coordinates: React.Dispatch<React.SetStateAction<LatLng[]>>;
}

interface WorkHoursData {
    days: {
        [key: string]: DaySchedule;
    };
    repeat: boolean;
    timeZone: string;
    commuteTime: number;
    breakStart: string;
    breakEnd: string;
    googleSync: boolean;
    googleSyncEnabled: boolean;
    emailType: string;

}
interface ProductOption {
    uuid: string;
    title: string;
    cost?: number;
    adjustment_time?: string;
}

interface Service {
    serviceId: string;
    product_options: ProductOption[];
    optionPrices: { [key: string]: number };
    optionTimes: { [key: string]: string };
}
const timeNeededOptions = [
    'no adjustment',
    '5 Minutes less',
    '10 Minutes less',
    '15 Minutes less',
    '30 Minutes less',
    '45 Minutes less',
];

const VendorWorkHours = ({ currentUser, servicesData, setPaymentPerKm, paymentPerKm,
    fieldErrors, enableServiceArea, setEnableServiceArea, forceServiceArea, setForceServiceArea,
    providerId, address, city, province, country, coords, setmap_coordinates }: WorkDetailProps) => {
    const [isAddingService, setIsAddingService] = useState(false);
    const [serviceId, setServiceId] = useState("");
    const [showTimeFields, setShowTimeFields] = useState(false);
    const [isBreakPopupOpen, setIsBreakPopupOpen] = useState(false);
    const [breaks, setBreaks] = useState<Break[]>(currentUser?.additional_breaks || []);
    const [selectedBreak, setSelectedBreak] = useState<Break | undefined>(undefined);
    const { userType } = useAppContext()
    const [services, setServices] = useState<Service[]>([]);

    const [tempOptionPrices, setTempOptionPrices] = useState<{ [key: string]: number }>({});
    const [tempOptionTimes, setTempOptionTimes] = useState<{ [key: string]: string }>({});
    const [workHours, setWorkHours] = useState<WorkHoursData>({
        days: {
            sunday: { enabled: false, startTime: "8:00 AM", endTime: "5:00 PM", twilight: false },
            monday: { enabled: true, startTime: "8:00 AM", endTime: "5:00 PM", twilight: true },
            tuesday: { enabled: true, startTime: "8:00 AM", endTime: "5:00 PM", twilight: true },
            wednesday: { enabled: true, startTime: "8:00 AM", endTime: "5:00 PM", twilight: true },
            thursday: { enabled: true, startTime: "8:00 AM", endTime: "5:00 PM", twilight: true },
            friday: { enabled: true, startTime: "8:00 AM", endTime: "5:00 PM", twilight: true },
            saturday: { enabled: false, startTime: "8:00 AM", endTime: "5:00 PM", twilight: false },
        },
        repeat: true,
        timeZone: "(GMT-06:00) Mountain Time - Edmonton",
        commuteTime: 30,
        breakStart: "9:00 AM",
        breakEnd: "9:00 AM",
        googleSync: false,
        googleSyncEnabled: false,
        emailType: "",
    });


    console.log('services', services);


    const handleDayToggle = (day: string) => {
        setWorkHours(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [day]: {
                    ...prev.days[day],
                    enabled: !prev.days[day].enabled
                }
            }
        }));
    };

    const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
        setWorkHours(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [day]: {
                    ...prev.days[day],
                    [field]: value
                }
            }
        }));
    };

    const handleTwilightToggle = (day: string) => {
        setWorkHours(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [day]: {
                    ...prev.days[day],
                    twilight: !prev.days[day].twilight
                }
            }
        }));
    };

    const handleChange = (field: keyof WorkHoursData, value: string | boolean | number) => {
        setWorkHours(prev => ({
            ...prev,
            [field]: value
        }));
    };


    const handleAddService = (id?: string) => {
        const sId = id || serviceId;
        if (!sId) return;

        const selectedService = servicesData.find(s => s.uuid === sId);
        if (!selectedService) return;

        const alreadyExists = services.some(s => s.serviceId === sId);
        if (alreadyExists) return;

        const finalOptionPrices: { [key: string]: number } = {};
        const finalOptionTimes: { [key: string]: string } = {};

        selectedService.product_options?.forEach(option => {
            finalOptionPrices[option.uuid] = option.cost || 0;
            finalOptionTimes[option.uuid] = 'no adjustment';
        });

        const newService: Service = {
            serviceId: sId,
            product_options: selectedService.product_options || [],
            optionPrices: finalOptionPrices,
            optionTimes: finalOptionTimes
        };

        setServices(prev => [...prev, newService]);
        setServiceId("");
        setShowTimeFields(false);
        setIsAddingService(false);
        setTempOptionPrices({});
        setTempOptionTimes({});
    };


    const handleServiceChange = (
        index: number,
        field: 'serviceId' | 'optionPrices' | 'optionTimes',
        value: string | { [key: string]: number } | { [key: string]: string }
    ) => {
        const updatedServices = [...services];
        updatedServices[index] = {
            ...updatedServices[index],
            [field]: value,
        };
        setServices(updatedServices);
    };

    const handleRemoveService = (index: number) => {
        setServices(services.filter((_, i) => i !== index));
    };


    const handleAddBreak = (newBreakData: Break) => {
        const newBreak: Break = {
            id: newBreakData.id,
            uuid: newBreakData.uuid,
            vendor_id: newBreakData.vendor_id,
            title: newBreakData.title,
            date: newBreakData.date,
            start_time: newBreakData.start_time,
            end_time: newBreakData.end_time,
            address: newBreakData.address || '',
        };

        if (selectedBreak) {
            setBreaks(prev =>
                prev.map(b => (b.id === newBreak.id ? newBreak : b))
            );
        } else {
            setBreaks(prev => [...prev, newBreak]);
        }

        setIsBreakPopupOpen(false);
        setSelectedBreak(undefined);
    };


    console.log('currentUser', currentUser);

    return (
        <div className="w-full flex justify-center font-alexandria">
            <Accordion type="multiple" defaultValue={["hours", "service", 'timeOff', 'vendor', 'service-area']} className="w-full space-y-4">

                <AccordionItem value="hours">
                    <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>WORK HOURS</AccordionTrigger>
                    <AccordionContent className="grid gap-4">
                        <div className="w-full flex justify-center">
                            <div className="w-[450px] p-6  rounded-lg text-[14px] text-[#666666]">
                                <p className="text-[#666666] text-[14px] mb-6">
                                    Scheduling settings have impact on ordering from all customers - addresses, last job location,
                                    working hours, duration of service, travel time, all contribute to your availability.
                                    <br />
                                    Set your working hours that clients can book your services.
                                </p>

                                <div className="mb-6">
                                    <h3 className="text-[#666666] text-[14px] mb-4">Work Week</h3>

                                    {Object.entries(workHours.days).map(([day, schedule]) => {
                                        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                                        return (
                                            <div key={day} className=" py-4  rounded-md">
                                                <div className="flex items-center mb-4 text-[16px]">
                                                    <Checkbox
                                                        id={`${day}-enabled`}
                                                        checked={schedule.enabled}
                                                        onCheckedChange={() => handleDayToggle(day)}
                                                        className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                                                    />
                                                    <Label htmlFor={`${day}-enabled`} className="">
                                                        {dayName}
                                                    </Label>
                                                </div>

                                                {schedule.enabled && (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <Label htmlFor={`${day}-start`} className="text-sm font-[400] mb-[10px]">Start</Label>
                                                                <Input
                                                                    id={`${day}-start`}
                                                                    value={schedule.startTime}
                                                                    onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                                                                    className="w-full h-[42px] bg-[#EEEEEE] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 "
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`${day}-end`} className="text-sm font-[400] mb-[5px]">End</Label>
                                                                <Input
                                                                    id={`${day}-end`}
                                                                    value={schedule.endTime}
                                                                    onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                                                                    className="w-full h-[42px] bg-[#EEEEEE] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 "

                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-end">
                                                            <Checkbox
                                                                id={`${day}-twilight`}
                                                                checked={schedule.twilight}
                                                                onCheckedChange={() => handleTwilightToggle(day)}
                                                                className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                                                            />
                                                            <Label htmlFor={`${day}-twilight`} className="text-sm">
                                                                Twilight Photos
                                                            </Label>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mb-6">
                                    <Label htmlFor="repeat" className="block mb-2 font-medium">Repeat</Label>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="repeat"
                                            checked={workHours.repeat}
                                            onCheckedChange={(checked) => handleChange('repeat', checked)}
                                            className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                                        />
                                        <Label htmlFor="repeat" className="">
                                            Repeat every week
                                        </Label>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <Label htmlFor="timezone" className="block mb-2 ">Time Zone</Label>
                                    <Input
                                        id="timezone"
                                        value={workHours.timeZone}
                                        onChange={(e) => handleChange('timeZone', e.target.value)}
                                        className="w-full h-[42px] bg-[#EEEEEE] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 "

                                    />
                                </div>

                                <div className="w-full mb-6">
                                    <Label htmlFor="commute" className="block mb-2">Commute Time Baseline</Label>
                                    <Input
                                        id="commute"
                                        type="number"
                                        value={workHours.commuteTime}
                                        onChange={(e) => handleChange('commuteTime', parseInt(e.target.value))}
                                        className="w-full h-[42px] bg-[#EEEEEE] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 "

                                    />
                                </div>

                                <div className="mb-6 w-full">
                                    <h3 className=" mb-2">Relocating Break</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <Label htmlFor="break-start" className="text-sm font-[400]">Start</Label>
                                            <Input
                                                id="break-start"
                                                value={workHours.breakStart}
                                                onChange={(e) => handleChange('breakStart', e.target.value)}
                                                className="w-full h-[42px] bg-[#EEEEEE] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 "

                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Label htmlFor="break-end" className="text-sm font-[400]">End</Label>
                                            <Input
                                                id="break-end"
                                                value={workHours.breakEnd}
                                                onChange={(e) => handleChange('breakEnd', e.target.value)}
                                                className="w-full h-[42px] bg-[#EEEEEE] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 "

                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center mb-4">
                                        <Checkbox
                                            id="google-sync"
                                            checked={workHours.googleSync}
                                            onCheckedChange={(checked) => handleChange('googleSync', checked)}
                                            className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                                        />
                                        <Label htmlFor="google-sync" className="">
                                            Enable Google Calendar Sync
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="w-1/2 flex items-center mb-4">
                                            <Checkbox
                                                id="google-sync-enabled"
                                                checked={workHours.googleSyncEnabled}
                                                onCheckedChange={(checked) => handleChange('googleSyncEnabled', checked)}
                                                className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                                            />
                                            <Label htmlFor="google-sync-enabled">
                                                Sync to Google
                                            </Label>
                                        </div>

                                        <div className="w-1/2">
                                            <Select
                                                value={workHours.emailType}
                                                onValueChange={(value) => handleChange('emailType', value)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Email Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="primaryEmail">Primary Email</SelectItem>
                                                    <SelectItem value="secondaryEmail">Secondary Email</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="service" className='border-none'>
                    <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                        SERVICES
                    </AccordionTrigger>
                    <AccordionContent className="grid gap-4">
                        <div className='w-full flex flex-col items-center'>
                            <div className='w-[450px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                <div className='grid grid-cols-1 gap-[16px]'>
                                    <div className="col-span-1">
                                        <div className='flex items-center justify-between mb-4'>
                                            <p className='font-normal text-base text-[#666666]'>Services</p>
                                            <div
                                                className='flex items-center gap-x-[10px] cursor-pointer'
                                                onClick={() => setIsAddingService(true)}
                                            >
                                                <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm' />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add Service Form */}
                                    {isAddingService && (
                                        <div className="col-span-1 mb-0">
                                            <div className="mb-4 p-4">
                                                <label htmlFor="serviceName" className="block text-sm font-normal mb-2">
                                                    Service Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex items-center gap-x-[20px]">
                                                    <Select
                                                        value={serviceId}
                                                        onValueChange={(value) => {
                                                            setServiceId(value);
                                                            setTimeout(() => handleAddService(value), 0);
                                                        }}
                                                    >

                                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] data-[placeholder]:text-[#9ca3af] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                                                            <SelectValue placeholder="Select Service Option Here" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {servicesData.map((option) => (
                                                                <SelectItem key={option.uuid} value={option.uuid}>
                                                                    {option.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTimeFields(!showTimeFields)}
                                                        className=" rounded"
                                                    >
                                                        {showTimeFields ? <ChevronDownIcon /> : <DropDownArrow />}
                                                    </button>
                                                </div>
                                            </div>

                                            {showTimeFields && serviceId && (
                                                <div className="mt-1 px-3">
                                                    <Accordion type="single" collapsible>
                                                        {servicesData.find(s => s.uuid === serviceId)?.product_options?.map((option) => (
                                                            <AccordionItem key={option.uuid} value={option.uuid}>
                                                                <AccordionTrigger>
                                                                    {option.title}
                                                                </AccordionTrigger>
                                                                <AccordionContent>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded">
                                                                        <div>
                                                                            <Label htmlFor={`preview-price-${option.uuid}`} className="block text-xs font-normal mb-1">
                                                                                Package Price <span className="text-red-500">*</span>
                                                                            </Label>
                                                                            <Input
                                                                                id={`preview-price-${option.uuid}`}
                                                                                type="number"
                                                                                inputMode="decimal"
                                                                                placeholder="Enter price"
                                                                                value={tempOptionPrices[option.uuid] !== undefined ? tempOptionPrices[option.uuid] : (option.cost || 0)}
                                                                                onChange={(e) => {
                                                                                    const price = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                    setTempOptionPrices(prev => ({
                                                                                        ...prev,
                                                                                        [option.uuid]: price
                                                                                    }));
                                                                                }}
                                                                                className="w-full h-[38px] bg-white border-[1px] border-[#BBBBBB] text-sm"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <Label htmlFor={`preview-time-${option.uuid}`} className="block text-xs font-normal mb-1">
                                                                                Time Adjustment
                                                                            </Label>
                                                                            <Select
                                                                                value={tempOptionTimes[option.uuid] || 'no adjustment'}
                                                                                onValueChange={(value) => {
                                                                                    setTempOptionTimes(prev => ({
                                                                                        ...prev,
                                                                                        [option.uuid]: value
                                                                                    }));
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="w-full h-[38px] bg-white border-[1px] border-[#BBBBBB] text-sm">
                                                                                    <SelectValue placeholder="Select Time" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {timeNeededOptions.map((opt, idx) => (
                                                                                        <SelectItem key={idx} value={opt}>
                                                                                            {opt}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        ))}
                                                    </Accordion>
                                                </div>
                                            )}

                                        </div>
                                    )}

                                    <div className='col-span-1'>
                                        {services.length > 0 ? (
                                            <div className="space-y-2 flex flex-col items-center">
                                                {services.map((service, index) => (
                                                    <ServiceItem
                                                        key={index}
                                                        index={index}
                                                        service={service}
                                                        servicesData={servicesData}
                                                        onChange={handleServiceChange}
                                                        onRemove={handleRemoveService}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            !isAddingService && (
                                                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                                    No services added yet. Click Add to get started.
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="timeOff" className="border-none">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    >
                        TIME OFF
                    </AccordionTrigger>
                    <AccordionContent className="gap-4 flex flex-col items-center">
                        <div className="space-y-6 mt-[20px] w-[450px] text-[#666666]">
                            {/* Add button */}
                            <div className="flex items-center justify-end gap-x-[10px] cursor-pointer"
                                onClick={() => setIsBreakPopupOpen(true)}>
                                <p className="text-base font-semibold font-raleway text-[#6BAE41]">Add</p>
                                <Plus
                                    className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm" />
                            </div>

                            <div className="pt-6 space-y-6">
                                {breaks?.length === 0 ? (
                                    <p className="text-sm text-[#666666]"></p>
                                ) : (
                                    breaks?.map((brk) => (
                                        <div
                                            key={brk.id}
                                            className="space-y-6 py-4 text-[#666666] rounded-md"
                                        >
                                            <div>
                                                <Label htmlFor={`break-title-${brk.id}`}>Time Off</Label>
                                                <Input
                                                    id={`break-title-${brk.id}`}
                                                    type="text"
                                                    value={brk.title}
                                                    readOnly
                                                    className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] px-3"
                                                />
                                            </div>

                                            <div className="grid grid-cols-5 gap-x-4 gap-y-6">
                                                <div className="space-y-2 col-span-3">
                                                    <Label>From</Label>
                                                    <Input
                                                        type="text"
                                                        value={brk.date}
                                                        readOnly
                                                        className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] px-3"
                                                    />
                                                </div>

                                                <div className="space-y-2 col-span-2">
                                                    <Label>Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={brk.start_time.slice(0, 5)}
                                                        readOnly
                                                        className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] px-3"
                                                    />
                                                </div>

                                                <div className="space-y-2 col-span-3">
                                                    <Label>To</Label>
                                                    <Input
                                                        type="text"
                                                        value={brk.date} // same date or adjust if you have different end_date
                                                        readOnly
                                                        className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] px-3"
                                                    />
                                                </div>

                                                <div className="space-y-2 col-span-2">
                                                    <Label>Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={brk.end_time.slice(0, 5)}
                                                        readOnly
                                                        className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] px-3"
                                                    />
                                                </div>
                                            </div>

                                            {brk.address && (
                                                <div>
                                                    <Label htmlFor={`break-address-${brk.id}`}>Address</Label>
                                                    <Input
                                                        id={`break-address-${brk.id}`}
                                                        type="text"
                                                        value={brk.address}
                                                        readOnly
                                                        className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] px-3"
                                                    />
                                                </div>
                                            )}

                                            <div className="pt-4 flex justify-end">
                                                <Button
                                                    className="w-[160px] bg-[#4290E9] hover:bg-[#4b97ed]"
                                                    onClick={() => {
                                                        setSelectedBreak(brk);
                                                        setIsBreakPopupOpen(true);
                                                    }}
                                                >
                                                    Edit Time Off
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <AddBreakPopup
                                open={isBreakPopupOpen}
                                setOpen={(open) => {
                                    if (!open) setSelectedBreak(undefined);
                                    setIsBreakPopupOpen(open);
                                }}
                                onAddBreak={handleAddBreak}
                                vendorData={currentUser ? [currentUser as CurrentUser] : []}
                                popupType="hide"
                                currentBreak={selectedBreak}
                            />

                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vendor" className='border-none'>
                    <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>VENDOR RATE SETTINGS</AccordionTrigger>
                    <AccordionContent className="grid gap-4">
                        <div className='w-full flex flex-col items-center'>
                            <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                <div className='grid grid-cols-2 gap-[16px] py-[32px]'>
                                    <div className='col-span-2'>
                                        <p className='text-sm font-normal text-[#666666]'>Set rate for all vendors commute reimbursement value.</p>
                                    </div>
                                    <div className='col-span-2'>
                                        <div>
                                            <Label htmlFor="">Payment per kilometer</Label>
                                            <Input
                                                type="number"
                                                value={paymentPerKm === '' ? '' : paymentPerKm}
                                                min={0}
                                                step="any"
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    // Allow empty string to let user clear the input
                                                    if (value === '') {
                                                        setPaymentPerKm('');
                                                    } else {
                                                        const numeric = Number(value);
                                                        if (!isNaN(numeric) && numeric >= 0) {
                                                            setPaymentPerKm(numeric);
                                                        }
                                                    }
                                                }}
                                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                            />

                                            {fieldErrors.payment_per_km && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.payment_per_km[0]}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="service-area" className='border-none'>
                    <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>SERVICE AREA</AccordionTrigger>
                    <AccordionContent className="grid gap-4">
                        <div className='flex flex-col gap-y-4 py-[16px]'>
                            <div className='pl-[18px] flex items-center gap-[10px]'>
                                <Input
                                    type='checkbox'
                                    checked={enableServiceArea}
                                    onChange={(e) => setEnableServiceArea(e.target.checked)}
                                    className='h-[16px] w-[16px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                />
                                <p className='text-[16px] font-normal text-[#666666] mt-[12px]'>
                                    Enable Service Area
                                </p>
                            </div>
                            <div className='pl-[18px] flex items-center gap-[10px]'>
                                <Input
                                    type='checkbox'
                                    checked={forceServiceArea}
                                    onChange={(e) => setForceServiceArea(e.target.checked)}
                                    className='h-[16px] w-[16px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                />
                                <p className='text-[16px] font-normal text-[#666666] mt-[12px]'>
                                    Force Service Area
                                </p>
                            </div>
                            <WorkAreaMap
                                providerId={providerId}
                                address={address}
                                city={city}
                                province={province}
                                country={country}
                                coords={coords}
                                setmap_coordinates={setmap_coordinates}
                            />
                        </div>

                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div >
    );
};

export default VendorWorkHours;