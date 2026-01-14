'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/app/context/AppContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addVendorBreak, updateVendorBreak } from '../calendar';
import { toast } from 'sonner';
import { CurrentUser } from '@/components/WorkHours';
import GooglePlacesAutocomplete from './AutoCompleteInput';

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

    const GOOGLE_API_KEY = 'AIzaSyAhveaQIMPOQqMhtLb05Gy9axsvm0a5t5Y';

    const handleAddressChange = (value: string) => {
        setAddress(value);
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
        if (currentBreak) {
            setTitle(currentBreak.title);

            // Check if it's a Break type by looking for start_time/end_time properties
            const isBreakType = 'start_time' in currentBreak;

            if (isBreakType) {
                // This is a Break type with start_date/end_date and start_time/end_time
                if (currentBreak.start_date) setFromDate(new Date(currentBreak.start_date));
                if (currentBreak.end_date) setToDate(new Date(currentBreak.end_date));
                setFromTime(currentBreak.start_time || '09:00');
                setToTime(currentBreak.end_time || '10:00');
            } else {
                // This is a CalendarEvent type with start/end dates
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
            setAddress('');
            setSelectedVendor(null);
        }
    }, [currentBreak]);
    const updateVendorBreakInUI = (updatedBreak: Break) => {

        if (!setVendorData || !updatedBreak?.uuid) return;

        // Find the vendor by vendor_id from the break
        const currentBreakVendor = vendorData.find((vendor) => {
            return vendor.company?.vendor_id === updatedBreak.vendor_id ||
                vendor.uuid === updatedBreak.vendor_id?.toString() ||
                vendor.company?.vendor_id === updatedBreak.vendor_id?.toString();
        });


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
        if (address.trim() === '') {
            toast.error('Address is required');
            return;
        }
        if (title.trim() === '') {
            toast.error('Title is required');
            return;
        }
        if (!selectedVendor) {
            toast.error('Please select a vendor');
            return;
        }

        try {
            if (!selectedVendor.company?.vendor_id) {
                toast.error('Vendor ID is required');
                return;
            }

            const payload = {
                vendor_id: Number(selectedVendor.company.vendor_id),
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
                console.log('response', response);
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
            setOpen(false);
            setSelectedVendor(null);
            setTitle('');
            setFromDate(new Date());
            setToDate(new Date());
            setFromTime('09:00');
            setToTime('10:00');
            setAddress('');
            setSelectedValue('Paid_time_off');
        }
    };

    const handleVendorSelect = (vendorUuid: string) => {
        const vendor = vendorData.find(vendor => vendor.uuid === vendorUuid) || null;
        setSelectedVendor(vendor);
        const address = `${vendor?.addresses?.[0]?.address_line_1 || ''}, ${vendor?.addresses?.[0]?.city || ''}, ${vendor?.addresses?.[0]?.province || ''}, ${vendor?.addresses?.[0]?.country || ''}`.trim();
        setAddress(address)
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
                        <Label>Title</Label>
                        <Input
                            className="bg-white h-[42px] border-[#BBBBBB]"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter Break Title"
                        />
                    </div>

                    {popupType !== 'hide' && (
                        <div className="space-y-[10px] w-full">
                            <Label>Vendor</Label>
                            <Select
                                value={selectedVendor?.uuid || ''}
                                onValueChange={handleVendorSelect}
                            >
                                <SelectTrigger className="w-full h-[42px] bg-white border-[#BBBBBB]">
                                    <SelectValue placeholder="Select a vendor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendorData.map((vendor) => (
                                        <SelectItem key={vendor.uuid} value={vendor.uuid || ''}>
                                            {vendor.first_name} {vendor.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* ✅ From Date/Time */}
                    <div className="grid grid-cols-4 space-x-2">
                        <div className="col-span-2">
                            <Label>From Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-[42px] border-[#BBBBBB] justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(fromDate, 'PPP')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <DatePicker mode="single" selected={fromDate} onSelect={(val) => val && setFromDate(val)} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="col-span-2">
                            <Label>From Time</Label>
                            <Input
                                className="bg-white h-[42px] border-[#BBBBBB]"
                                type="time"
                                value={fromTime}
                                onChange={(e) => setFromTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ✅ To Date/Time */}
                    <div className="grid grid-cols-4 space-x-2 mt-2">
                        <div className="col-span-2">
                            <Label>To Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-[42px] border-[#BBBBBB] justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(toDate, 'PPP')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <DatePicker mode="single" selected={toDate} onSelect={(val) => val && setToDate(val)} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="col-span-2">
                            <Label>To Time</Label>
                            <Input
                                className="bg-white h-[42px] border-[#BBBBBB]"
                                type="time"
                                value={toTime}
                                onChange={(e) => setToTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ✅ Address */}
                    <Label>Address</Label>
                    {/* <Input
                        className="bg-white h-[42px] border-[#BBBBBB]"
                        placeholder="Enter Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    /> */}

                    <GooglePlacesAutocomplete
                        apiKey={GOOGLE_API_KEY}
                        placeholder="Type address here..."
                        value={address}
                        onChange={handleAddressChange}
                        className="w-full"
                        inputClassName={customStyles.input}
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
                        className={`${userType}-bg text-white hover-${userType}-bg w-full md:w-[170px] h-[44px] font-[400] text-[20px]`}
                        onClick={addBreak}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}