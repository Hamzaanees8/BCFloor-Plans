// components/ConfirmationDialog.tsx
"use client"
import React, { useState } from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { X } from "lucide-react"
import { Input } from "./ui/input"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { DropDownArrow } from "./Icons"
import { useAppContext } from "@/app/context/AppContext"

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess: (agent: { name: string; email: string; primary_phone: string; split: string }) => void;
    uuid?: string;
}

const AddCoAgentDialog: React.FC<Props> = ({
    open,
    setOpen,
    onSuccess,
    uuid,
}) => {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [invoice, setInvoice] = useState('');
    const invoiceOptions = [
        'Even Split for all parties',
        'Different Split for all parties',
        'Custom Split'
    ];

    const handleAddAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        // ... (existing commented out code)
    }
    const { userType } = useAppContext();
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[417px] h-[550px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                <div onClick={(e) => e.stopPropagation()}
                    onChange={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={`flex items-center uppercase justify-between ${userType}-text text-[18px] font-[600]`}>
                            {uuid ? (
                                <span>View Co-Agent</span>
                            ) : (
                                <span>Add/Invite Co-Agent</span>
                            )}
                            <AlertDialogCancel className="border-none !shadow-none">
                                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                            </AlertDialogCancel>
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-y-4 " >
                        <hr className="w-full h-[1px] text-[#BBBBBB]" />
                        <div>
                            <form >
                                <div className='grid grid-cols-2 gap-[16px]' >
                                    <div className="col-span-2">
                                        <label htmlFor="" className='text-[16px] font-normal text-[#424242]'>Name <span className="text-red-500">*</span></label>
                                        <Input value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                if (fieldErrors.name) {
                                                    const newErrors = { ...fieldErrors };
                                                    delete newErrors.name;
                                                    setFieldErrors(newErrors);
                                                }
                                            }}
                                            className={`h-[42px] text-[#666666] border-[1px] mt-[12px] ${fieldErrors.name ? 'border-red-500' : 'border-[#BBBBBB]'}`}
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                            type="text" />
                                        {fieldErrors.name && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.name[0]}</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="" className='text-[16px] font-normal text-[#424242]'>Email <span className="text-red-500">*</span></label>
                                        <Input value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (fieldErrors.email) {
                                                    const newErrors = { ...fieldErrors };
                                                    delete newErrors.email;
                                                    setFieldErrors(newErrors);
                                                }
                                            }}
                                            className={`h-[42px] text-[#666666] border-[1px] mt-[12px] ${fieldErrors.email ? 'border-red-500' : 'border-[#BBBBBB]'}`}
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                            type="email" />
                                        {fieldErrors.email && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.email[0]}</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="" className='text-[16px] font-normal text-[#424242]'>Phone Number <span className="text-red-500">*</span></label>
                                        <Input value={phoneNumber}
                                            onChange={(e) => {
                                                setPhoneNumber(e.target.value);
                                                if (fieldErrors.phoneNumber) {
                                                    const newErrors = { ...fieldErrors };
                                                    delete newErrors.phoneNumber;
                                                    setFieldErrors(newErrors);
                                                }
                                            }}
                                            className={`h-[42px] text-[#666666] border-[1px] mt-[12px] ${fieldErrors.phoneNumber ? 'border-red-500' : 'border-[#BBBBBB]'}`}
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                            type="text" />
                                        {fieldErrors.phoneNumber && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.phoneNumber[0]}</p>}
                                    </div>
                                    {uuid && (
                                        <div className='col-span-2'>
                                            <label htmlFor="">Repeat</label>
                                            <Select value={invoice} onValueChange={(value) => setInvoice(value)}>
                                                <SelectTrigger
                                                    className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block"
                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                >
                                                    <SelectValue placeholder="Select Repeat Options Here" />
                                                    <span className="custom-arrow">
                                                        <DropDownArrow />
                                                    </span>
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {invoiceOptions.map((option, index) => (
                                                        <SelectItem key={index} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {/* {fieldErrors.repeat_weekly && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.repeat_weekly[0]}</p>} */}
                                        </div>
                                    )}
                                </div>
                                <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                                <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                                    <AlertDialogCancel onClick={(e) => {
                                        e.stopPropagation();
                                        setFieldErrors({});
                                    }} className={`bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] outline-none ${userType}-border ${userType}-text hover-${userType}-bg ${userType}-button`}>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            if (!uuid) {
                                                // Validate required fields
                                                const errors: Record<string, string[]> = {};
                                                if (!name.trim()) errors.name = ["Name is required"];
                                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                if (!email.trim()) {
                                                    errors.email = ["Email is required"];
                                                } else if (!emailRegex.test(email)) {
                                                    errors.email = ["Invalid email address"];
                                                }
                                                if (!phoneNumber.trim()) errors.phoneNumber = ["Phone Number is required"];

                                                if (Object.keys(errors).length > 0) {
                                                    setFieldErrors(errors);
                                                    // const firstError = Object.values(errors).flat()[0];
                                                    // toast.error(firstError);
                                                    toast.error('Please fill in all required fields');
                                                    return;
                                                }

                                                const newAgent = {
                                                    name,
                                                    email,
                                                    primary_phone: phoneNumber,
                                                    split: invoice || "",
                                                };

                                                onSuccess(newAgent);

                                                // Clear the fields and errors
                                                setName('');
                                                setEmail('');
                                                setPhoneNumber('');
                                                setInvoice('');
                                                setFieldErrors({});

                                                // Close the modal
                                                setOpen(false);
                                            } else {
                                                handleAddAgent(e); // for edit/view
                                            }
                                        }}
                                        className={`${userType}-bg text-white hover-${userType}-bg hover:opacity-85 w-full md:w-[176px] h-[44px] font-[400] text-[20px]`}
                                    >
                                        {uuid ? 'Done' : 'Add'}
                                    </AlertDialogAction>

                                </AlertDialogFooter>
                            </form>
                        </div>

                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default AddCoAgentDialog
