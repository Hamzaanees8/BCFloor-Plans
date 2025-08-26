// components/ConfirmationDialog.tsx
"use client"
import { parseDate } from "chrono-node"
import React, { useEffect, useRef, useState } from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { CalendarIcon, Plus, X } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { CreateCode, CreateDiscount, EditCode, EditDiscount, GetOne, GetServices } from "@/app/dashboard/global-settings/global-settings"
import { toast } from "sonner"

type Props = {
    type?: string;
    uuid?: string;
    open: boolean
    setOpen: (value: boolean) => void
    onSuccess?: () => void;
}

const AddDiscountDialog: React.FC<Props> = ({
    open,
    setOpen,
    onSuccess,
    uuid,
    type
}) => {
    console.log('id', uuid);
    console.log('type', type)
    const [activeTab, setActiveTab] = useState('discounts');
    const [codeKey, setCodeKey] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [discountQuantity, setDiscountQuantity] = useState(0);
    const [discountName, setDiscountName] = useState('');
    const [codePercentage, setCodePercentage] = useState(0);
    const [codeDescription, setCodeDescription] = useState("");
    const [discountDescription, setDiscountDescription] = useState('');
    const [openCalendar, setOpenCalendar] = React.useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [dateValue, setDateValue] = React.useState("")
    const [openDrowndown, setOpenDropdown] = useState(false);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [selectedServicesCode, setSelectedServicesCode] = useState<number[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    type ServiceCategory = { name: string; id: number };
    const [serviceCategories, setServiceCategories] = React.useState<ServiceCategory[]>([]);
    const isEdit = Boolean(uuid);
    const [date, setDate] = React.useState<Date | undefined>(
        parseDate(dateValue) || undefined
    )
    const [month, setMonth] = React.useState<Date | undefined>(date)
    // Function to handle tab clicks
    const handleTabClick = (tabName: string) => {
        setActiveTab(tabName);
    };
    useEffect(() => {
        if (!isEdit) return;

        const token = localStorage.getItem("token");
        if (!token) {
            console.log("Token not found.");
            return;
        }

        if (!uuid) {
            console.log("ID is undefined.");
            return;
        }

        if (type === "code") {
            GetOne(token, uuid)
                .then((data) => {
                    const discount = data.data;
                    setCodeKey(discount.code_key || "");
                    setCodeDescription(discount.description || "");
                    setCodePercentage(discount.percentage || 0);
                    if (discount?.services) {
                        const serviceIds = discount.services.map((service: { id: number }) => service.id);
                        setSelectedServicesCode(serviceIds);
                    }
                    setActiveTab("codes");
                })
                .catch((err) => console.log("Error fetching Code:", err.message));

            // Reset quantity-related states
            setDiscountDescription("");
            setDiscountPercentage(0);
            setDiscountName("");
            setDiscountQuantity(0);
            //setSelectedServices([]);
            setDateValue("");
        } else if (type === "quantity") {
            GetOne(token, uuid)
                .then((data) => {
                    const discount = data.data;
                    setDiscountName(discount.name || "");
                    setDiscountDescription(discount.description || "");
                    setDiscountQuantity(discount.quantity || 0);
                    setDiscountPercentage(discount.percentage || 0);
                    const formattedDate = formatDateWithoutTimezoneShift(discount.expiry_date);

                    setDateValue(formattedDate);

                    if (discount?.services) {
                        const serviceIds = discount.services.map((service: { id: number }) => service.id);
                        setSelectedServices(serviceIds);
                    }

                    setActiveTab("discounts");
                })
                .catch((err) => console.log("Error fetching Discount:", err.message));

            // Reset code-related states
            setCodeKey("");
            setCodeDescription("");
            setCodePercentage(0);
        } else {
            console.log("Unknown discount type:", type);
        }
    }, [isEdit, type, uuid, open]);
    function formatDateWithoutTimezoneShift(dateStr: string): string {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Create a Date object at midnight UTC (no timezone offset)
        const dateObj = new Date(Date.UTC(year, month - 1, day));

        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    const handleAddCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Authentication token not found.');
                    return;
                }
                if (!uuid) {
                    toast.error('Code ID (uuid) is missing.');
                    return;
                }
                const payload = {
                    type: "code",
                    code_key: codeKey,
                    description: codeDescription,
                    percentage: codePercentage,
                    services: selectedServicesCode,
                };
                if (payload) {
                    const result = await EditCode(payload, token, uuid);
                    toast.success('Code Edited successfully');
                    console.log('Code Edited successfully:', result);
                    setOpen(false);

                }
                if (onSuccess) onSuccess();
                setCodeKey("");
                setCodeDescription("");
                setCodePercentage(0);
                setSelectedServicesCode([]);
            } catch (error) {
                console.log('Raw error:', error);

                setFieldErrors({});
                const apiError = error as { message?: string; errors?: Record<string, string[]> };

                if (apiError.errors && typeof apiError.errors === 'object') {
                    const normalizedErrors: Record<string, string[]> = {};

                    Object.entries(apiError.errors).forEach(([key, messages]) => {
                        const normalizedKey = key.split('.')[0];
                        if (!normalizedErrors[normalizedKey]) {
                            normalizedErrors[normalizedKey] = [];
                        }
                        normalizedErrors[normalizedKey].push(...messages);
                    });

                    setFieldErrors(normalizedErrors);

                    const firstError = Object.values(normalizedErrors).flat()[0];
                    toast.error(firstError || 'Validation error');
                }
                else if (error instanceof Error) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to submit user data');
                }
            }
        } else {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Authentication token not found.');
                    return;
                }
                const payload = {
                    type: "code",
                    code_key: codeKey,
                    description: codeDescription,
                    percentage: codePercentage,
                    services: selectedServicesCode,
                };
                if (payload) {
                    const result = await CreateCode(payload, token);
                    toast.success('Code created successfully');
                    console.log('Code created successfully:', result);
                    setOpen(false);
                }
                if (onSuccess) onSuccess();
                setCodeKey("");
                setCodeDescription("");
                setCodePercentage(0);
                setSelectedServicesCode([]);
            } catch (error) {
                console.log('Raw error:', error);

                setFieldErrors({});
                const apiError = error as { message?: string; errors?: Record<string, string[]> };

                if (apiError.errors && typeof apiError.errors === 'object') {
                    const normalizedErrors: Record<string, string[]> = {};

                    Object.entries(apiError.errors).forEach(([key, messages]) => {
                        const normalizedKey = key.split('.')[0];
                        if (!normalizedErrors[normalizedKey]) {
                            normalizedErrors[normalizedKey] = [];
                        }
                        normalizedErrors[normalizedKey].push(...messages);
                    });

                    setFieldErrors(normalizedErrors);

                    const firstError = Object.values(normalizedErrors).flat()[0];
                    toast.error(firstError || 'Validation error');
                }
                else if (error instanceof Error) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to submit user data');
                }
            }
        }

    }
    const handleAddDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDate = new Date(dateValue);
        const today = new Date();

        // Reset time to midnight for accurate date-only comparison
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (isNaN(selectedDate.getTime())) {
            toast.error("Please select a valid expiry date.");
            return;
        }

        if (selectedDate < today) {
            toast.error("Please select a valid expiry date.");
            return;
        }
        if (isEdit) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Authentication token not found.');
                    return;
                }
                if (!uuid) {
                    toast.error('Discount ID (uuid) is missing.');
                    return;
                }
                const dateObj = new Date(dateValue);
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const formattedDate = `${yyyy}-${mm}-${dd}`;
                const payload = {
                    type: "quantity",
                    description: discountDescription,
                    percentage: Number(discountPercentage),
                    name: discountName,
                    expiry_date: formattedDate,
                    quantity: Number(discountQuantity),
                    services: selectedServices,
                };
                if (payload) {
                    const result = await EditDiscount(payload, token, uuid);
                    toast.success('Discount Edited successfully');
                    console.log('Discount Edited successfully:', result);
                    setOpen(false);
                }
                if (onSuccess) onSuccess();
                setDiscountDescription("");
                setDiscountPercentage(0);
                setDiscountName("");
                setDiscountQuantity(0);
                setSelectedServices([]);
                setDateValue("");

            } catch (error) {
                console.log('Raw error:', error);

                setFieldErrors({});
                const apiError = error as { message?: string; errors?: Record<string, string[]> };

                if (apiError.errors && typeof apiError.errors === 'object') {
                    const normalizedErrors: Record<string, string[]> = {};

                    Object.entries(apiError.errors).forEach(([key, messages]) => {
                        const normalizedKey = key.split('.')[0];
                        if (!normalizedErrors[normalizedKey]) {
                            normalizedErrors[normalizedKey] = [];
                        }
                        normalizedErrors[normalizedKey].push(...messages);
                    });

                    setFieldErrors(normalizedErrors);

                    const firstError = Object.values(normalizedErrors).flat()[0];
                    toast.error(firstError || 'Validation error');
                }
                else if (error instanceof Error) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to submit user data');
                }
            }
        }
        else {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Authentication token not found.');
                    return;
                }
                const dateObj = new Date(dateValue);
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const formattedDate = `${yyyy}-${mm}-${dd}`;
                const payload = {
                    type: "quantity",
                    description: discountDescription,
                    percentage: Number(discountPercentage),
                    name: discountName,
                    expiry_date: formattedDate,
                    quantity: Number(discountQuantity),
                    services: selectedServices,
                };

                // If editing or if any files exist, use FormData
                if (payload) {
                    const result = await CreateDiscount(payload, token);
                    toast.success('Discount created successfully');
                    console.log('Discount created successfully:', result);
                    setOpen(false);
                }
                if (onSuccess) onSuccess();
                setDiscountDescription("");
                setDiscountPercentage(0);
                setDiscountName("");
                setDiscountQuantity(0);
                setSelectedServices([]);
                setDateValue("");
            } catch (error) {
                console.log('Raw error:', error);

                setFieldErrors({});
                const apiError = error as { message?: string; errors?: Record<string, string[]> };

                if (apiError.errors && typeof apiError.errors === 'object') {
                    const normalizedErrors: Record<string, string[]> = {};

                    Object.entries(apiError.errors).forEach(([key, messages]) => {
                        const normalizedKey = key.split('.')[0];
                        if (!normalizedErrors[normalizedKey]) {
                            normalizedErrors[normalizedKey] = [];
                        }
                        normalizedErrors[normalizedKey].push(...messages);
                    });

                    setFieldErrors(normalizedErrors);

                    const firstError = Object.values(normalizedErrors).flat()[0];
                    toast.error(firstError || 'Validation error');
                }
                else if (error instanceof Error) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to submit user data');
                }
            }
        }

    }


    function formatDate(date: Date | undefined) {
        if (!date) {
            return ""
        }
        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
    }
    React.useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.');
            return;
        }

        GetServices(token)
            .then(data => setServiceCategories(Array.isArray(data.data) ? data.data : []))
            .catch(err => console.log(err.message));
    }, []);
    // const router = useRouter();
    console.log("services", serviceCategories)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If the click is outside the dropdown and the dropdown is open, close it
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(false);
            }
        };

        // Add event listener when the component mounts
        document.addEventListener('mousedown', handleClickOutside);
        // Clean up event listener when the component unmounts
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]); // Re-run effect if dropdownRef changes
    const toggleDropdown = () => {
        setOpenDropdown(!openDrowndown);
    };
    // Function to handle checkbox changes
    const handleCheckboxChange = (categoryId: number) => {
        setSelectedServices((prevSelected) => {
            if (prevSelected.includes(categoryId)) {
                return prevSelected.filter((id) => id !== categoryId);
            } else {
                return [...prevSelected, categoryId];
            }
        });
    };
    const handleCheckboxChange1 = (categoryId: number) => {
        setSelectedServicesCode((prevSelected) => {
            if (prevSelected.includes(categoryId)) {
                return prevSelected.filter((id) => id !== categoryId);
            } else {
                return [...prevSelected, categoryId];
            }
        });
    };

    console.log("selected service", selectedServices);
    console.log("date", dateValue);
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[445px] h-[650px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                <div onClick={(e) => e.stopPropagation()}
                    onChange={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
                            {activeTab === 'discounts' ? (
                                uuid ? <span>Edit Discount</span> : <span>Add Discount</span>
                            ) : (
                                uuid ? <span>Edit Code</span> : <span>Add Code</span>
                            )}
                            <AlertDialogCancel className="border-none !shadow-none">
                                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                            </AlertDialogCancel>
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-y-4 " >
                        <hr className="w-full h-[1px] text-[#BBBBBB]" />
                        <div className="flex items-center justify-between">
                            <button
                                className={`
                                flex-1 px-5 py-3 text-sm rounded-[6px] font-semibold cursor-pointer transition-all duration-300 ease-in-out
                                ${activeTab === 'discounts'
                                        ? 'bg-[#4290E9] text-white'
                                        : 'bg-[#E4E4E4] text-[#666666] hover:bg-gray-200'}
                                ${type === 'code' ? 'opacity-50 cursor-not-allowed' : ''}
                                mr-2.5
                            `}
                                onClick={(e) => {
                                    if (type !== 'code') {
                                        handleTabClick('discounts');
                                    }
                                    e.stopPropagation();
                                }}
                                disabled={type === 'code'}
                            >
                                DISCOUNTS
                            </button>

                            <button
                                className={`
                                    flex-1 px-5 py-3 text-sm rounded-[6px] font-semibold cursor-pointer transition-all duration-300 ease-in-out
                                    ${activeTab === 'codes'
                                        ? 'bg-[#4290E9] text-white'
                                        : 'bg-[#E4E4E4] text-[#666666] hover:bg-gray-200'}
                                    ${type === 'quantity' ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                onClick={(e) => {
                                    if (type !== 'quantity') {
                                        handleTabClick('codes');
                                    }
                                    e.stopPropagation();
                                }}
                                disabled={type === 'quantity'}
                            >
                                CODES
                            </button>
                        </div>

                        <div>
                            {activeTab === 'discounts' && (
                                <form >
                                    <div className='grid grid-cols-2 gap-[16px]' >
                                        <div>
                                            <label className="text-[#424242]" htmlFor="">Percentage</label>
                                            <Input value={discountPercentage} required
                                                min={0}
                                                onChange={(e) => setDiscountPercentage(Math.max(0, Number(e.target.value)))} className='h-[42px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="number" placeholder="20" />
                                            {fieldErrors.percentage && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.percentage[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="text-[#424242]" htmlFor="">Quantity</label>
                                            <Input value={discountQuantity}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setDiscountQuantity(val < 0 ? 0 : val);
                                                }} className='h-[42px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="number" placeholder="6" />
                                            {fieldErrors.quantity && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.quantity[0]}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            <label htmlFor="" className='text-[16px] font-normal text-[#424242]'>Name</label>
                                            <Input value={discountName}
                                                onChange={(e) => setDiscountName(e.target.value)} className='h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            {fieldErrors.name && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.name[0]}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[#424242]" htmlFor="">Expiry Date</label>
                                            <div className="relative flex gap-2 w-full">
                                                <Input
                                                    id="date"
                                                    value={dateValue}
                                                    className="h-[42px] w-full bg-[#EEEEEE] border-[1px] text-[#666666] border-[#BBBBBB] mt-[12px] pr-10"
                                                    onChange={(e) => {
                                                        setDateValue(e.target.value)
                                                        const date = parseDate(e.target.value)
                                                        if (date) {
                                                            setDate(date)
                                                            setMonth(date)
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "ArrowDown") {
                                                            e.preventDefault()
                                                            setOpenCalendar(true)
                                                        }
                                                    }}
                                                />
                                                {fieldErrors.expiry_date && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.expiry_date[0]}</p>}
                                                <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            id="date-picker"
                                                            variant="ghost"
                                                            className="absolute [&_svg]:size-6 top-8 right-2 size-6 -translate-y-1/2"
                                                        >
                                                            <CalendarIcon className="w-6 h-6 text-[#1E6FCC]" />
                                                            <span className="sr-only">Select date</span>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto overflow-hidden p-0" align="end">
                                                        <Calendar
                                                            mode="single"
                                                            selected={date}
                                                            captionLayout="dropdown"
                                                            month={month}
                                                            onMonthChange={setMonth}
                                                            onSelect={(date) => {
                                                                setDate(date)
                                                                setDateValue(formatDate(date))
                                                                setOpenCalendar(false)
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className='flex items-center justify-between' ref={dropdownRef}>
                                                <p className='font-normal text-base text-[#424242]'>Required Services</p>
                                                <div className='flex items-center gap-x-[10px] cursor-pointer relative ' onClick={toggleDropdown}>
                                                    <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                    <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm '
                                                        aria-expanded={openDrowndown}
                                                        aria-haspopup="true" />
                                                </div>
                                                {openDrowndown && (
                                                    <div
                                                        className="absolute shadow-lg border border-[#BBBBBB] z-10 mt-2 w-72 md:w-80 lg:w-[400px] bg-[#EEEEEE] text-[#666666] overflow-hidden"
                                                        role="menu"
                                                        aria-orientation="vertical"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="py-2 max-h-96 overflow-y-auto">
                                                            {serviceCategories?.map((category) => (
                                                                <label
                                                                    key={category.id}
                                                                    className="flex items-center px-4 py-2 hover:bg-gray-300 cursor-pointer text-[16px] font-normal"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-checkbox h-4 w-4 rounded"
                                                                        checked={selectedServices.includes(category.id)}
                                                                        onChange={() => handleCheckboxChange(category.id)}
                                                                        aria-checked={selectedServices.includes(category.id)}
                                                                        role="menuitemcheckbox"
                                                                    />
                                                                    <span className="ml-3 text-[#666666] text-[16px] font-normal">
                                                                        {category.name}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {fieldErrors.services && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.services[0]}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            {selectedServices.map((serviceId, index) => {
                                                const service = serviceCategories.find((cat) => cat.id === serviceId);
                                                return (
                                                    <p
                                                        key={index}
                                                        className="h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px] w-full rounded-[6px] flex items-center px-3"
                                                    >
                                                        {service?.name || `Service ID: ${serviceId}`}
                                                    </p>
                                                );
                                            })}
                                        </div>

                                        <div className="col-span-2">
                                            <label htmlFor="" className='text-[16px] font-normal text-[#666666]'>Description</label>
                                            <textarea
                                                id="discount-description"
                                                value={discountDescription}
                                                onChange={(e) => setDiscountDescription(e.target.value)}
                                                className="h-[200px] w-full p-3 rounded-[6px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]"
                                            />
                                            {fieldErrors.description && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.description[0]}</p>}
                                        </div>
                                    </div>
                                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                                    <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                                        <AlertDialogCancel onClick={(e) => { e.stopPropagation() }} className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => { handleAddDiscount(e); e.stopPropagation(); }}
                                            className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[176px] h-[44px] font-[400] text-[20px]"
                                        >
                                            Save
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </form>
                            )}
                            {activeTab === 'codes' && (
                                <form>
                                    <div className='grid grid-cols-2 gap-[16px]'>
                                        <div>
                                            <label className="text-[#424242]" htmlFor="">CODE Key</label>
                                            <Input value={codeKey}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setCodeKey(e.target.value)} className='h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            {fieldErrors.code_key && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.code_key[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="text-[#424242]" htmlFor="">Percentage</label>
                                            <Input value={codePercentage}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setCodePercentage(Math.max(0, Number(e.target.value)))} className='h-[42px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="number" placeholder="20" />
                                            {fieldErrors.percentage && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.percentage[0]}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            <div className='flex items-center justify-between' ref={dropdownRef}>
                                                <p className='font-normal text-base text-[#424242]'>Required Services</p>
                                                <div className='flex items-center gap-x-[10px] relative cursor-pointer' onClick={toggleDropdown} >
                                                    <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                    <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm '
                                                        aria-expanded={openDrowndown}
                                                        aria-haspopup="true" />
                                                </div>
                                                {openDrowndown && (
                                                    <div
                                                        className="absolute shadow-lg border border-[#BBBBBB] z-10 mt-2 w-72 md:w-80 lg:w-[400px] bg-[#EEEEEE] text-[#666666] overflow-hidden"
                                                        role="menu"
                                                        aria-orientation="vertical"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="py-2 max-h-96 overflow-y-auto">
                                                            {serviceCategories?.map((category) => (
                                                                <label
                                                                    key={category.id}
                                                                    className="flex items-center px-4 py-2 hover:bg-gray-300 cursor-pointer text-[16px] font-normal"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-checkbox h-4 w-4 rounded"
                                                                        checked={selectedServicesCode.includes(category.id)}
                                                                        onChange={() => handleCheckboxChange1(category.id)}
                                                                        aria-checked={selectedServicesCode.includes(category.id)}
                                                                        role="menuitemcheckbox"
                                                                    />
                                                                    <span className="ml-3 text-[#666666] text-[16px] font-normal">
                                                                        {category.name}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {fieldErrors.services && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.services[0]}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            {selectedServicesCode.map((serviceId, index) => {
                                                const service = serviceCategories.find((cat) => cat.id === serviceId);
                                                return (
                                                    <p
                                                        key={index}
                                                        className="h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px] w-full rounded-[6px] flex items-center px-3"
                                                    >
                                                        {service?.name || `Service ID: ${serviceId}`}
                                                    </p>
                                                );
                                            })}
                                        </div>

                                        <div className="col-span-2">
                                            <label htmlFor="" className='text-[16px] font-normal text-[#666666]'>Description</label>
                                            <textarea value={codeDescription}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setCodeDescription(e.target.value)}
                                                className="h-[200px] w-full p-3 rounded-[6px] bg-[#EEEEEE] border-[1px] text-[#666666] border-[#BBBBBB] mt-[12px]"
                                            />
                                            {fieldErrors.description && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.description[0]}</p>}
                                        </div>
                                    </div>
                                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                                    <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                                        <AlertDialogCancel onClick={(e) => { e.stopPropagation() }} className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => { handleAddCode(e); e.stopPropagation(); }}
                                            className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[176px] h-[44px] font-[400] text-[20px]"
                                        >
                                            Save
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </form>
                            )}
                        </div>

                    </div>
                </div>

            </AlertDialogContent>
        </AlertDialog>
    )
}

export default AddDiscountDialog
