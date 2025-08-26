'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddBreakPopupProps {
    onAddBreak: (event: { title: string; start: Date; end: Date }) => void;
    setOpen: (value: boolean) => void;
    open: boolean;
    vendorData: Vendor[]
}
type Vendor = {
    uuid?: string;
    id?: number;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    status?: boolean;
    company?: { uuid: string, company_name: string }
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

export default function AddBreakPopup({ onAddBreak, setOpen, open, vendorData }: AddBreakPopupProps) {
    const [title, setTitle] = useState('Break');
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [selectedVendor, setSelectedVendor] = useState('');

    const addBreak = () => {
        const [startHour, startMinute] = startTime.split(':');
        const [endHour, endMinute] = endTime.split(':');

        const start = new Date(date);
        start.setHours(parseInt(startHour), parseInt(startMinute));

        const end = new Date(date);
        end.setHours(parseInt(endHour), parseInt(endMinute));

        const newEvent = {
            title,
            start,
            end,
            vendor_id: selectedVendor
        };

        onAddBreak?.(newEvent);
        setOpen(false);
        setSelectedVendor('');
        setTitle('Break')
        setStartTime('09:00')
        setEndTime('10:00')
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='bg-[#E4E4E4] w-[370px] md:w-[650px] max-w-none !rounded-none font-alexandria'>
                    <DialogHeader>
                        <DialogTitle className="text-[#4290E9] font-[600] text-[18px]">ADD BREAK</DialogTitle>
                    </DialogHeader>
                    <hr className='bg-[#BBBBBB]' />
                    <div className="flex flex-col space-y-[16px] text-[14px] font-[400] text-[#424242]">
                        <div className='space-y-[10px]'>
                            <Label className=''>Title</Label>
                            <Input
                                className='bg-white h-[42px] border-[#BBBBBB]'
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder='Enter Title' />
                        </div>
                        <div className='space-y-[10px] w-full'>
                            <Label className=''>Title</Label>
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
                        </div>

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
                        <Input className='bg-white h-[42px] border-[#BBBBBB]' placeholder='Enter Address' />
                    </div>

                    <DialogFooter className="mt-4 font-alexandria">
                        <Button className="bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#0078D4] hover:text-[#fff]" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[170px] h-[44px] font-[400] text-[20px]"
                            onClick={addBreak}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
