'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { useAppContext } from '@/app/context/AppContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addVendorBreak, updateVendorBreak } from '../calendar';
import { toast } from 'sonner';
import { CurrentUser } from '@/components/WorkHours';
import GooglePlacesAutocomplete, { AddressComponents } from './AutoCompleteInput';
import dayjs from 'dayjs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Break {
    id?: number;
    uuid?: string;
    vendor_id?: number;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    address?: string;
    start_date?: string;
    end_date?: string;

}

type CalendarEvent = {
    uuid?: string
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    vendor_id?: string
    color_id?: number
    service_id?: number;
    order_id?: string | number
    address?: string
};

interface AddBreakPopupHideProps {
    popupType: 'hide';
    onAddBreak: (newBreak: Break) => void;
    setOpen: (value: boolean) => void;
    open: boolean;
    vendorData: CurrentUser[];
    currentBreak?: Break | null;
    setVendorData?: (vendors: Vendor[] | ((prev: Vendor[]) => Vendor[])) => void;
}

interface AddBreakPopupEventProps {
    popupType: 'time_off' | 'break' | 'other';
    onAddBreak: (event: CalendarEvent) => void;
    setOpen: (value: boolean) => void;
    open: boolean;
    vendorData: Vendor[];
    currentBreak?: Break | null;
    setVendorData?: (vendors: Vendor[] | ((prev: Vendor[]) => Vendor[])) => void;
}


type AddBreakPopupProps = AddBreakPopupHideProps | AddBreakPopupEventProps

type Vendor = {
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
    company?: {
        name: string;
        website: string;
        vendor_id?: number;
    };
    vendor_services?: {
        id: number;
        uuid: string;
        vendor_id: number;
        service_id: number;
        hourly_rate: string;
        time_needed: number;
        status: boolean;
        created_at: string;
        updated_at: string;
    }[];
    addresses?: {
        type: "company" | "billing" | string;
        address_line_1: string;
        address_line_2?: string | null;
        city: string;
        province: string;
        country: string;
    }[];
    work_hours?: {
        id: number;
        uuid: string;
        vendor_id: number;
        start_time: string;
        end_time: string;
        work_days: string;
        repeat_weekly: string;
        break_start: string | null;
        break_end: string | null;
        commute_minutes: number;
        timezone: string;
        created_at: string;
        updated_at: string;
    };
    coordinates?: string[]
    additional_breaks: {
        id?: number;
        uuid?: string;
        vendor_id?: number;
        title: string;
        date: string;
        start_time: string;
        end_time: string;
        address?: string;

    }[]
    order_slots?: {
        id: number;
        uuid: string;
        order_id: number;
        service_id: number;
        vendor_id: number;
        show_all_vendors: boolean;
        schedule_override: boolean;
        recommend_time: boolean;
        travel: null | unknown;
        created_at: string;
        updated_at: string;
        start_time: string;
        end_time: string;
        est_time: string;
        distance: string;
        km_price: null | number | string;
        address: string;
        location: string;
        date: string;
        google_event_id: null | string;
    }[];
};


export default function AddBreakPopup({
    onAddBreak,
    setOpen,
    open,
    vendorData,
    popupType,
    currentBreak,
    setVendorData
}: AddBreakPopupProps) {
    const [title, setTitle] = useState('');
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [fromTime, setFromTime] = useState('09:00');
    const [toTime, setToTime] = useState('10:00');
    const [selectedVendor, setSelectedVendor] = useState<Vendor | CurrentUser | null>(null);
    const [selectedValue, setSelectedValue] = useState<string>('Paid_time_off');
    const [address, setAddress] = useState('');
    const { userType } = useAppContext();
    const options = [
        { value: 'Paid_time_off', title: 'Paid Time Off' },
        { value: 'unpaid_time_off', title: 'Unpaid Time Off' },
    ];
    const [customStyles] = useState({
        input: '',
        suggestions: ' border-gray-400'
    });
    const [openCombobox, setOpenCombobox] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    type ValidationErrors = {
        title?: boolean;
        vendor?: boolean;
        fromDate?: boolean;
        fromTime?: boolean;
        toDate?: boolean;
        toTime?: boolean;
        address?: boolean;
    };
    const [errors, setErrors] = useState<ValidationErrors>({});

    const handleAddressChange = (value: string) => {
        setAddress(value);
    };

    const handleStartDateChange = (date: Date | undefined) => {
        if (!date) return;
        setFromDate(date);

        // Adjust end date based on the new start date, keeping the same time difference or resetting to 1 hour
        // User request: "automatically adjust end date and time to one hour after that"
        // Combining new date with current fromTime
        const [hours, minutes] = fromTime.split(':').map(Number);
        const startDateTime = dayjs(date).hour(hours).minute(minutes);
        const endDateTime = startDateTime.add(1, 'hour');

        setToDate(endDateTime.toDate());
        setToTime(endDateTime.format('HH:mm'));
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setFromTime(newTime);

        if (newTime) {
            const [hours, minutes] = newTime.split(':').map(Number);
            const startDateTime = dayjs(fromDate).hour(hours).minute(minutes);

            // Default to 1 hour later
            let endDateTime = startDateTime.add(1, 'hour');

            // If toTime is already set, we need to validate it against the new start time
            if (toTime) {
                const [toH, toM] = toTime.split(':').map(Number);
                const currentEndDateTime = dayjs(toDate).hour(toH).minute(toM);

                // If current end time is valid (>= start + 15m), keep relative duration or check collision?
                // User said: "do not allow end time to be selectable before start time + 15 mins"
                // Usually implies we should push the end time if it becomes invalid.

                if (currentEndDateTime.diff(startDateTime, 'minute') < 15) {
                    // If invalid, push to start + 1 hour (default behavior) or start + 15m?
                    // Let's stick to the requested "automatically adjust... to one hour" behavior for start time changes.
                    endDateTime = startDateTime.add(1, 'hour');
                } else {
                    // If valid, should we keep the current end time? 
                    // The previous request said "automatically adjust... to one hour after". 
                    // So we probably SHOULD overwrite it to 1 hour later whenever start changes.
                    // Doing so ensures validity and follows the "one hour break" convenience.
                    endDateTime = startDateTime.add(1, 'hour');
                }
            }

            setToDate(endDateTime.toDate());
            setToTime(endDateTime.format('HH:mm'));
        }
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndTime = e.target.value;

        if (newEndTime) {
            const [endH, endM] = newEndTime.split(':').map(Number);
            const [startH, startM] = fromTime.split(':').map(Number);

            const startDateTime = dayjs(fromDate).hour(startH).minute(startM);
            const newEndDateTime = dayjs(toDate).hour(endH).minute(endM);

            const diffInMinutes = newEndDateTime.diff(startDateTime, 'minute');

            if (diffInMinutes < 15) {
                toast.error("End time must be at least 15 minutes after start time.");
                // Reset to minimum valid time (Start + 15 mins)
                const minEndDateTime = startDateTime.add(15, 'minute');
                setToTime(minEndDateTime.format('HH:mm'));
                // We don't update toDate here because input type='time' only affects time, date stays.
                // But wait, if crossing midnight? Input type='time' is just time. 
                // Assuming same day for time inputs usually.
            } else {
                setToTime(newEndTime);
            }
        }
    };

    const handleEndDateChange = (date: Date | undefined) => {
        if (!date) return;

        // If start date is set, ensure end date is not before start date
        if (dayjs(date).isBefore(dayjs(fromDate), 'day')) {
            toast.error("End date cannot be before start date.");
            // Reset to fromDate or keep previous? 
            // Let's reset to fromDate to be safe
            setToDate(fromDate);
        } else {
            setToDate(date);
        }
    };


    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (userType === 'vendor') {
            const vendor = vendorData.find(vendor => vendor.uuid === userInfo.uuid) || null;
            setSelectedVendor(vendor);
        } else if (popupType === 'hide' && vendorData.length > 0) {
            setSelectedVendor(vendorData[0]);
        } else if (currentBreak?.uuid && vendorData) {
            const BreakVendor = vendorData.find((vendor) => {
                return vendor.uuid === String(currentBreak.vendor_id)
            })
            setSelectedVendor(BreakVendor ?? null)

        }
    }, [userType, vendorData, popupType, currentBreak?.uuid, currentBreak?.vendor_id]);
 
    useEffect(() => {
        if (!currentBreak) {
            if (selectedVendor) {
                const addrObj = selectedVendor.addresses?.find((a: any) => a.type === 'start_location') || selectedVendor.addresses?.[0];
                if (addrObj) {
                    const addr = `${addrObj.address_line_1 || ''}, ${addrObj.city || ''}, ${addrObj.province || ''}, ${addrObj.country || ''}`.trim();
                    setAddress(
                        addr === ', , ,' ? '' : addr.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                    );
                } else {
                    setAddress('');
                }
            } else {
                setAddress('');
            }
        }
    }, [selectedVendor, currentBreak]);

    useEffect(() => {
        if (currentBreak) {
            setTitle(currentBreak.title);

            const isBreakType = 'start_time' in currentBreak;

            if (isBreakType) {
                if (currentBreak.start_date) setFromDate(new Date(currentBreak.start_date));
                if (currentBreak.end_date) setToDate(new Date(currentBreak.end_date));
                setFromTime(currentBreak.start_time || '09:00');
                setToTime(currentBreak.end_time || '10:00');
            } else {
                const breakAsEvent = currentBreak as CalendarEvent;
                setFromDate(new Date(breakAsEvent.start));
                setToDate(new Date(breakAsEvent.end));
                setFromTime(format(new Date(breakAsEvent.start), 'HH:mm'));
                setToTime(format(new Date(breakAsEvent.end), 'HH:mm'));
            }

            setAddress(currentBreak.address || '');
        } else {
            setTitle('');
            setFromDate(new Date());
            setToDate(new Date());
            setFromTime('09:00');
            setToTime('10:00');

            if (userType === 'vendor' || (popupType === 'hide' && vendorData.length > 0)) {
                let vendor = null;
                if (userType === 'vendor') {
                    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                    vendor = vendorData.find(v => v.uuid === userInfo.uuid) || null;
                } else {
                    vendor = vendorData[0];
                }

                setSelectedVendor(vendor);
                const addrObj = vendor?.addresses?.find((a: any) => a.type === 'start_location') || vendor?.addresses?.[0];
                if (addrObj) {
                    const addr = `${addrObj.address_line_1 || ''}, ${addrObj.city || ''}, ${addrObj.province || ''}, ${addrObj.country || ''}`.trim();
                    setAddress(
                        addr === ', , ,' ? '' : addr.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                    );
                } else {
                    setAddress('');
                }
            } else {
                setAddress('');
                setSelectedVendor(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentBreak]);

    const durationText = React.useMemo(() => {
        const [fromH, fromM] = fromTime.split(':').map(Number);
        const [toH, toM] = toTime.split(':').map(Number);

        const start = dayjs(fromDate).hour(fromH).minute(fromM);
        const end = dayjs(toDate).hour(toH).minute(toM);

        const diffInMinutes = end.diff(start, 'minute');
        const hours = Math.floor(diffInMinutes / 60);
        const minutes = diffInMinutes % 60;

        if (diffInMinutes <= 0) return '';

        let text = '';
        if (hours > 0) text += `${hours} hr${hours > 1 ? 's' : ''} `;
        if (minutes > 0) text += `${minutes} min${minutes > 1 ? 's' : ''}`;

        return text.trim();
    }, [fromDate, toDate, fromTime, toTime]);

    const updateVendorBreakInUI = (updatedBreak: Break) => {

        if (!setVendorData || !updatedBreak?.uuid) return;

        // Find the vendor by vendor_id from the break
        const currentBreakVendor = vendorData.find((vendor) => {
            return vendor.company?.vendor_id === updatedBreak.vendor_id ||
                vendor.uuid === updatedBreak.vendor_id?.toString() ||
                vendor.company?.vendor_id === updatedBreak.vendor_id?.toString();
        });

        if (!currentBreakVendor) return;


        const updatedVendor = {
            ...currentBreakVendor,
            additional_breaks: (() => {
                const currentBreaks = currentBreakVendor?.additional_breaks || [];
                const existingBreakIndex = currentBreaks.findIndex(brk => brk.uuid === updatedBreak.uuid);

                if (existingBreakIndex !== -1) {
                    return currentBreaks.map(brk => brk.uuid === updatedBreak.uuid ? updatedBreak : brk);
                } else {
                    return [...currentBreaks, updatedBreak];
                }
            })()
        };
        setVendorData((prev) =>
            prev.map(vendor =>
                vendor.uuid === updatedVendor.uuid ? updatedVendor as Vendor : vendor
            )
        );


    };


    const addBreak = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Token not found');
            return;
        }

        const newErrors: ValidationErrors = {};
        if (!title.trim()) newErrors.title = true;
        if (!selectedVendor) newErrors.vendor = true;
        if (!fromDate) newErrors.fromDate = true;
        if (!fromTime) newErrors.fromTime = true;
        if (!toDate) newErrors.toDate = true;
        if (!toTime) newErrors.toTime = true;
        if (!address.trim()) newErrors.address = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fill in all required fields');
            return;
        }


        // Overlap Validation
        if (selectedVendor && (selectedVendor as Vendor).order_slots) {
            const vendorOrderSlots = (selectedVendor as Vendor).order_slots || [];

            // Convert break start/end to comparable timestamps
            const breakStartStr = `${format(fromDate, 'yyyy-MM-dd')}T${fromTime}`;
            const breakEndStr = `${format(toDate, 'yyyy-MM-dd')}T${toTime}`;
            const breakStartTime = new Date(breakStartStr).getTime();
            const breakEndTime = new Date(breakEndStr).getTime();

            // Check for overlaps
            const hasOverlap = vendorOrderSlots.some(slot => {
                const slotStartStr = `${slot.date}T${slot.start_time}`;
                const slotEndStr = `${slot.date}T${slot.end_time}`;
                const slotStartTime = new Date(slotStartStr).getTime();
                const slotEndTime = new Date(slotEndStr).getTime();

                // Check if ranges overlap
                // (StartA < EndB) && (EndA > StartB)
                return (breakStartTime < slotEndTime) && (breakEndTime > slotStartTime);
            });

            if (hasOverlap) {
                toast.error(
                    `This time off overlaps with an existing schedule. Please select a different time.`
                );

                return;
            }
        }

        try {
            setIsLoading(true);
            if (!selectedVendor?.company?.vendor_id) {
                toast.error('Vendor ID is required');
                return;
            }

            const payload = {
                vendor_id: Number(selectedVendor!.company!.vendor_id),
                title,
                date: format(fromDate, 'yyyy-MM-dd'),
                start_date: format(fromDate, 'yyyy-MM-dd'),
                end_date: format(toDate, 'yyyy-MM-dd'),
                start_time: fromTime,
                end_time: toTime,
                address,
            };

            let response;
            if (currentBreak?.uuid) {
                response = await updateVendorBreak(currentBreak.uuid || '', payload, token);
                updateVendorBreakInUI({
                    ...response.data
                });
            } else {
                response = await addVendorBreak(payload, token);
                updateVendorBreakInUI({
                    ...response.data
                });
            }

            onAddBreak(response.data);


            toast.success(currentBreak ? 'Break updated successfully' : 'Break added successfully');
        } catch (error) {
            console.error(error);
            toast.error(currentBreak ? 'Failed to update break' : 'Failed to add break');
        } finally {
            setIsLoading(false);
            setOpen(false);
            setSelectedVendor(null);
            setTitle('');
            setFromDate(new Date());
            setToDate(new Date());
            setFromTime('09:00');
            setToTime('10:00');
            setAddress('');
            setSelectedValue('Paid_time_off');
            setErrors({});
        }
    };

    const handleVendorSelect = (vendorUuid: string) => {
        const vendor = vendorData.find(vendor => vendor.uuid === vendorUuid) || null;
        setSelectedVendor(vendor);
        const addrObj = vendor?.addresses?.find((a: any) => a.type === 'start_location') || vendor?.addresses?.[0];
        if (addrObj) {
            const address = `${addrObj.address_line_1 || ''}, ${addrObj.city || ''}, ${addrObj.province || ''}, ${addrObj.country || ''}`.trim();
            setAddress(address === ', , ,' ? '' : address.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ','));
        } else {
            setAddress('');
        }
        if (errors.vendor) setErrors(prev => ({ ...prev, vendor: false }));
        if (errors.address) setErrors(prev => ({ ...prev, address: false }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="w-[370px] md:w-[650px] max-w-none !rounded-none font-alexandria"
                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
            >
                <DialogHeader>
                    <DialogTitle className={`${userType}-text font-[600] text-[18px]`}>
                        {currentBreak?.uuid ? 'EDIT' : 'ADD'} TIME OFF
                    </DialogTitle>
                </DialogHeader>
                <hr className="bg-[#BBBBBB]" />

                <div className="flex flex-col space-y-[16px] text-[14px] font-[400] text-[#424242]">
                    {userType === 'vendor' && popupType === 'time_off' && (
                        <div>
                            <RadioGroup
                                value={selectedValue}
                                onValueChange={(val) => setSelectedValue(val)}
                                className="w-full flex gap-3"
                            >
                                {options.map((option, idx) => (
                                    <div key={idx} className="w-full flex items-center justify-start gap-5 p-2 rounded">
                                        <RadioGroupItem
                                            value={option.value}
                                            id={`option-${idx}`}
                                            className="w-[18px] h-[18px] border border-gray-400 rounded-[3px] relative appearance-none data-[state=checked]:before:bg-[#DC9600]"
                                        />
                                        <label htmlFor={`option-${idx}`}>{option.title}</label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}

                    <div className="space-y-[10px]">
                        <Label className={errors.title ? "text-red-500" : ""}>Title <span className="text-red-500">*</span></Label>
                        <Input
                            className={`bg-white h-[42px] border-[#BBBBBB] ${errors.title ? "border-red-500" : ""}`}
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (errors.title) setErrors(prev => ({ ...prev, title: false }));
                            }}
                            placeholder="Enter Break Title"
                        />
                    </div>

                    {popupType !== 'hide' && userType !== 'vendor' && (
                        <div className="space-y-[10px] w-full">
                            <Label className={errors.vendor ? "text-red-500" : ""}>Vendor <span className="text-red-500">*</span></Label>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className={`w-full justify-between h-[42px] bg-white border-[#BBBBBB] font-normal ${errors.vendor ? "border-red-500 text-red-500" : ""}`}
                                    >
                                        {selectedVendor?.uuid
                                            ? `${(selectedVendor as Vendor).first_name} ${(selectedVendor as Vendor).last_name}`
                                            : "Select a vendor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search vendor..." />
                                        <CommandList>
                                            <CommandEmpty>No vendor found.</CommandEmpty>
                                            <CommandGroup>
                                                {vendorData.map((vendor) => (
                                                    <CommandItem
                                                        key={vendor.uuid}
                                                        value={`${vendor.first_name} ${vendor.last_name}`}
                                                        onSelect={() => {
                                                            handleVendorSelect(vendor.uuid);
                                                            setOpenCombobox(false);
                                                            if (errors.vendor) setErrors(prev => ({ ...prev, vendor: false }));
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedVendor?.uuid === vendor.uuid ? "opacity-100" : "opacity-0"
                                                             )}
                                                        />
                                                        {vendor.first_name} {vendor.last_name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {/* ✅ From Date/Time */}
                    <div className="grid grid-cols-4 space-x-2">
                        <div className="col-span-2">
                            <Label className={errors.fromDate ? "text-red-500" : ""}>From Date <span className="text-red-500">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full h-[42px] border-[#BBBBBB] justify-start text-left font-normal ${errors.fromDate ? "border-red-500 text-red-500" : ""}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(fromDate, 'PPP')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <DatePicker
                                        mode="single"
                                        selected={fromDate}
                                        onSelect={(date) => {
                                            handleStartDateChange(date);
                                            if (errors.fromDate) setErrors(prev => ({ ...prev, fromDate: false }));
                                        }}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="col-span-2">
                            <Label className={errors.fromTime ? "text-red-500" : ""}>From Time <span className="text-red-500">*</span></Label>
                            <Input
                                className={`bg-white h-[42px] border-[#BBBBBB] cursor-pointer ${errors.fromTime ? "border-red-500" : ""}`}
                                type="time"
                                value={fromTime}
                                onChange={(e) => {
                                    handleStartTimeChange(e);
                                    if (errors.fromTime) setErrors(prev => ({ ...prev, fromTime: false }));
                                }}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()}
                            />
                        </div>
                    </div>

                    {durationText && (
                        <div className="flex justify-center items-center py-2 text-[#4290E9] font-medium text-sm">
                            Duration: {durationText}
                        </div>
                    )}

                    {/* ✅ To Date/Time */}
                    <div className="grid grid-cols-4 space-x-2">
                        <div className="col-span-2">
                            <Label className={errors.toDate ? "text-red-500" : ""}>To Date <span className="text-red-500">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full h-[42px] border-[#BBBBBB] justify-start text-left font-normal ${errors.toDate ? "border-red-500 text-red-500" : ""}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(toDate, 'PPP')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <DatePicker
                                        mode="single"
                                        selected={toDate}
                                        onSelect={(date) => {
                                            handleEndDateChange(date);
                                            if (errors.toDate) setErrors(prev => ({ ...prev, toDate: false }));
                                        }}
                                        disabled={(date) => date < new Date(new Date(fromDate).setHours(0, 0, 0, 0))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="col-span-2">
                            <Label className={errors.toTime ? "text-red-500" : ""}>To Time <span className="text-red-500">*</span></Label>
                            <Input
                                className={`bg-white h-[42px] border-[#BBBBBB] cursor-pointer ${errors.toTime ? "border-red-500" : ""}`}
                                type="time"
                                value={toTime}
                                onChange={(e) => {
                                    handleEndTimeChange(e);
                                    if (errors.toTime) setErrors(prev => ({ ...prev, toTime: false }));
                                }}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()}
                            />
                        </div>
                    </div>

                    <Label className={errors.address ? "text-red-500" : ""}>Address <span className="text-red-500">*</span></Label>
                    <GooglePlacesAutocomplete
                        placeholder="Type address here..."
                        value={address}
                        onChange={(value) => {
                            handleAddressChange(value);
                            if (errors.address) setErrors(prev => ({ ...prev, address: false }));
                        }}
                        onAddressComponents={(components: AddressComponents) => {
                            setAddress(components.full_address);
                            if (errors.address) setErrors(prev => ({ ...prev, address: false }));
                        }}
                        className="w-full"
                        inputClassName={`${customStyles.input} ${errors.address ? "!border-red-500" : ""}`}
                        suggestionsContainerClassName={customStyles.suggestions}
                    />
                </div>

                <DialogFooter className="mt-4 font-alexandria">
                    <Button
                        className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] border ${userType}-border ${userType}-text ${userType}-button hover-${userType}-bg`}
                        variant="outline"
                        onClick={() => {
                            setOpen(false);
                            setSelectedVendor(null);
                            setTitle('');
                            setFromDate(new Date());
                            setToDate(new Date());
                            setFromTime('09:00');
                            setToTime('10:00');
                            setAddress('');
                            setSelectedValue('Paid_time_off');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isLoading}
                        className={`${userType}-bg text-white hover-${userType}-bg w-full md:w-[170px] h-[44px] font-[400] text-[20px]`}
                        onClick={addBreak}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}