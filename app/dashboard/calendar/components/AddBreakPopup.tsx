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


interface Break {
    id?: number;
    uuid?: string;
    vendor_id?: number;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    address?: string;
}

type CalendarEvent = {
    title: string;
    start: Date;
    end: Date;
    vendor_id: string; // string here
    color_id: number;
};


interface AddBreakPopupHideProps {
    popupType: "hide";
    onAddBreak: (newBreak: Break) => void;
    setOpen: (value: boolean) => void;
    open: boolean;
    vendorData: CurrentUser[];
    currentBreak?: Break | undefined
}

interface AddBreakPopupEventProps {
    popupType: "time_off" | "break" | "other";
    onAddBreak: (event: CalendarEvent) => void;
    setOpen: (value: boolean) => void;
    open: boolean;
    vendorData: Vendor[];
    currentBreak?: Break | undefined
}

type AddBreakPopupProps = AddBreakPopupHideProps | AddBreakPopupEventProps;


type Vendor = {
    uuid?: string;
    id?: number;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    status?: boolean;
    company?: { uuid: string, company_name: string, vendor_id: string }
    address?: string
    primary_phone?: string;
    secondary_phone?: string;
    company_name: string;
    avatar_url?: string;
    work_hours: {
        start_time: string;
        end_time: string;
        break_start: string;
        break_end: string;
    }
};

export default function AddBreakPopup({ onAddBreak, setOpen, open, vendorData, popupType, currentBreak }: AddBreakPopupProps) {
    const [title, setTitle] = useState('Break');
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [selectedVendor, setSelectedVendor] = useState('');
    const [selectedValue, setSelectedValue] = useState<string>("Paid_time_off");
    const [address, setAddress] = useState('');
    const { userType } = useAppContext()

    const options = [
        { value: "Paid_time_off", title: "Paid Time Off" },
        { value: "unpaid_time_off", title: "Unpaid Time Off" },
    ];

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        if (userType == 'vendor') {
            setSelectedVendor(userInfo.uuid)
        }
        if (popupType == 'hide') {
            setSelectedVendor(vendorData[0].uuid ?? '')
        }
    }, [userType, vendorData, popupType])

    useEffect(() => {
        if (currentBreak) {
            setTitle(currentBreak.title);
            setDate(new Date(currentBreak.date));
            setStartTime(currentBreak.start_time.slice(0, 5));
            setEndTime(currentBreak.end_time.slice(0, 5));
            setAddress(currentBreak.address || '');
        } else {
            setTitle('Break');
            setDate(new Date());
            setStartTime('09:00');
            setEndTime('10:00');
            setAddress('');
        }
    }, [currentBreak]);


    // const addBreak = () => {
    //     const [startHour, startMinute] = startTime.split(':');
    //     const [endHour, endMinute] = endTime.split(':');

    //     const start = new Date(date);
    //     start.setHours(parseInt(startHour), parseInt(startMinute));

    //     const end = new Date(date);
    //     end.setHours(parseInt(endHour), parseInt(endMinute));

    //     const newEvent = {
    //         title,
    //         start,
    //         end,
    //         vendor_id: selectedVendor
    //     };

    //     onAddBreak?.(newEvent);
    //     setOpen(false);
    //     setSelectedVendor('');
    //     setTitle('Break')
    //     setStartTime('09:00')
    //     setEndTime('10:00')
    // };

    const addBreak = async () => {
        const token = localStorage.getItem("token");

        if (address.trim().length === 0) {
            toast.error('Address field is required');
            return;
        }

        if (!token) {
            toast.error('Token not found');
            return;
        }

        try {
            const [startHour, startMinute] = startTime.split(':');
            const [endHour, endMinute] = endTime.split(':');

            const start = new Date(date);
            start.setHours(parseInt(startHour), parseInt(startMinute));

            const end = new Date(date);
            end.setHours(parseInt(endHour), parseInt(endMinute));

            const currentvendor = vendorData.find((vendor) => vendor.uuid === selectedVendor);
            if (!currentvendor?.company?.vendor_id) {
                toast.error('Vendor ID is required');
                return;
            }

            const payload = {
                vendor_id: Number(currentvendor.company.vendor_id),
                title,
                date: format(date, 'yyyy-MM-dd'),
                start_time: startTime,
                end_time: endTime,
                address,
                type: selectedValue,
            };

            let response;

            if (currentBreak?.id) {
                response = await updateVendorBreak(currentBreak.uuid || '', payload, token);
            } else {
                response = await addVendorBreak(payload, token);
            }

            if (popupType !== 'hide') {
                onAddBreak?.({
                    color_id: Number(currentvendor.company.vendor_id),
                    vendor_id: currentvendor.uuid || '',
                    title: `${currentvendor.first_name} ${currentvendor.last_name}-Break`,
                    start,
                    end,
                });
            }

            if (popupType === 'hide') {
                onAddBreak(response.data);
            }

            setOpen(false);
            setTitle('Break');
            setStartTime('09:00');
            setEndTime('10:00');
            setAddress('');

            toast.success(currentBreak ? 'Break updated successfully' : 'Break added successfully');
        } catch (error) {
            console.error(error);
            toast.error(currentBreak ? 'Failed to update break' : 'Failed to add break');
        }
    };


    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='bg-[#E4E4E4] w-[370px] md:w-[650px] max-w-none !rounded-none font-alexandria'>
                    <DialogHeader>
                        <DialogTitle className={`${userType}-text font-[600] text-[18px]`}>{currentBreak?.uuid ? "EDIT" : "ADD"} TIME OFF</DialogTitle>
                    </DialogHeader>
                    <hr className='bg-[#BBBBBB]' />
                    <div className="flex flex-col space-y-[16px] text-[14px] font-[400] text-[#424242]">
                        {userType === 'vendor' && popupType === 'time_off' &&
                            <div>
                                <RadioGroup
                                    value={selectedValue}
                                    onValueChange={(val) => setSelectedValue(val)}
                                    className="w-full flex  gap-3"
                                >
                                    {options.map((option, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-full flex items-center justify-start gap-5 p-2 rounded`}
                                        >
                                            <RadioGroupItem
                                                value={option.value}
                                                id={`option-${idx}`}
                                                className={`w-[18px] h-[18px] border border-gray-400 rounded-[3px] relative appearance-none
                                                                after:hidden
                                                                data-[state=checked]:bg-transparent
                                                                data-[state=checked]:before:content-['']
                                                                data-[state=checked]:before:absolute
                                                                data-[state=checked]:before:inset-0
                                                                data-[state=checked]:before:m-auto
                                                                data-[state=checked]:before:w-[14px]
                                                                data-[state=checked]:before:h-[14px]
                                                              data-[state=checked]:before:bg-[#DC9600]
                                                                data-[state=checked]:before:rounded-[2px]`}
                                            />
                                            <label htmlFor={`option-${idx}`}>{option.title}</label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>}

                        <div className='space-y-[10px]'>
                            <Label className=''>Title</Label>
                            <Input
                                className='bg-white h-[42px] border-[#BBBBBB]'
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder='Enter Title' />
                        </div>
                        {popupType !== 'hide' &&
                            <div className='space-y-[10px] w-full'>
                                <Label className=''>Vendor</Label>
                                <Select value={selectedVendor} onValueChange={(value) => { setSelectedVendor(value) }}>
                                    <SelectTrigger className="w-full  h-[42px] bg-white border-[#BBBBBB]">
                                        <SelectValue placeholder="Select a vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendorData.map((vendor) => (
                                            <SelectItem key={vendor.uuid} value={vendor.uuid ?? ''}>
                                                {vendor.first_name} {vendor.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>}

                        <div className="grid grid-cols-4 space-x-2">
                            <div className='col-span-2'>
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full h-[42px] border-[#BBBBBB] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(date, 'PPP')}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <DatePicker mode="single" selected={date} onSelect={(val) => val && setDate(val)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="col-span-2 ">
                                <Label>Time</Label>
                                <div className='flex justify-between gap-[10px]'>
                                    <Input className='bg-white h-[42px] border-[#BBBBBB]' type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                    <Input className='bg-white h-[42px] border-[#BBBBBB]' type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <Label>Address</Label>
                        <Input
                            className='bg-white h-[42px] border-[#BBBBBB]'
                            placeholder='Enter Address'
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />

                    </div>

                    <DialogFooter className="mt-4 font-alexandria">
                        <Button className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] border ${userType}-border ${userType}-text hover-${userType}-bg hover:text-[#fff]`} variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button className={`${userType}-bg text-white hove-${userType}-bg w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
                            onClick={addBreak}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    );
}
