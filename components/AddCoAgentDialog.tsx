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
//import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { DropDownArrow } from "./Icons"

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
        // if (isView) {
        //     try {
        //         const token = localStorage.getItem('token');
        //         if (!token) {
        //             toast.error('Authentication token not found.');
        //             return;
        //         }
        //         if (!uuid) {
        //             toast.error('Code ID (uuid) is missing.');
        //             return;
        //         }
        //         const payload = {
        //             type: "code",
        //             code_key: codeKey,
        //             description: codeDescription,
        //             percentage: codePercentage,
        //             services: selectedServicesCode,
        //         };
        //         if (payload) {
        //             const result = await EditCode(payload, token, uuid);
        //             toast.success('Code Edited successfully');
        //             console.log('Code Edited successfully:', result);
        //             setOpen(false);

        //         }
        //         if (onSuccess) onSuccess();
        //         setCodeKey("");
        //         setCodeDescription("");
        //         setCodePercentage(0);
        //         setSelectedServicesCode([]);
        //     } catch (error) {
        //         console.log('Raw error:', error);

        //         setFieldErrors({});
        //         const apiError = error as { message?: string; errors?: Record<string, string[]> };

        //         if (apiError.errors && typeof apiError.errors === 'object') {
        //             const normalizedErrors: Record<string, string[]> = {};

        //             Object.entries(apiError.errors).forEach(([key, messages]) => {
        //                 const normalizedKey = key.split('.')[0];
        //                 if (!normalizedErrors[normalizedKey]) {
        //                     normalizedErrors[normalizedKey] = [];
        //                 }
        //                 normalizedErrors[normalizedKey].push(...messages);
        //             });

        //             setFieldErrors(normalizedErrors);

        //             const firstError = Object.values(normalizedErrors).flat()[0];
        //             toast.error(firstError || 'Validation error');
        //         }
        //         else if (error instanceof Error) {
        //             toast.error(error.message);
        //         } else {
        //             toast.error('Failed to submit user data');
        //         }
        //     }
        // } else {
        //     try {
        //         const token = localStorage.getItem('token');
        //         if (!token) {
        //             toast.error('Authentication token not found.');
        //             return;
        //         }
        //         const payload = {
        //             type: "code",
        //             code_key: codeKey,
        //             description: codeDescription,
        //             percentage: codePercentage,
        //             services: selectedServicesCode,
        //         };
        //         if (payload) {
        //             const result = await CreateCode(payload, token);
        //             toast.success('Code created successfully');
        //             console.log('Code created successfully:', result);
        //             setOpen(false);
        //         }
        //         if (onSuccess) onSuccess();
        //         setCodeKey("");
        //         setCodeDescription("");
        //         setCodePercentage(0);
        //         setSelectedServicesCode([]);
        //     } catch (error) {
        //         console.log('Raw error:', error);

        //         setFieldErrors({});
        //         const apiError = error as { message?: string; errors?: Record<string, string[]> };

        //         if (apiError.errors && typeof apiError.errors === 'object') {
        //             const normalizedErrors: Record<string, string[]> = {};

        //             Object.entries(apiError.errors).forEach(([key, messages]) => {
        //                 const normalizedKey = key.split('.')[0];
        //                 if (!normalizedErrors[normalizedKey]) {
        //                     normalizedErrors[normalizedKey] = [];
        //                 }
        //                 normalizedErrors[normalizedKey].push(...messages);
        //             });

        //             setFieldErrors(normalizedErrors);

        //             const firstError = Object.values(normalizedErrors).flat()[0];
        //             toast.error(firstError || 'Validation error');
        //         }
        //         else if (error instanceof Error) {
        //             toast.error(error.message);
        //         } else {
        //             toast.error('Failed to submit user data');
        //         }
        //     }
        // }

    }
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[417px] h-[550px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                <div onClick={(e) => e.stopPropagation()}
                    onChange={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
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
                                        <label htmlFor="" className='text-[16px] font-normal text-[#424242]'>Name</label>
                                        <Input value={name}
                                            onChange={(e) => setName(e.target.value)} className='h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                        {/* {fieldErrors.name && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.name[0]}</p>} */}
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="" className='text-[16px] font-normal text-[#424242]'>Email</label>
                                        <Input value={email}
                                            onChange={(e) => setEmail(e.target.value)} className='h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]' type="email" />
                                        {/* {fieldErrors.name && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.name[0]}</p>} */}
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="" className='text-[16px] font-normal text-[#424242]'>Phone Number</label>
                                        <Input value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)} className='h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                        {/* {fieldErrors.name && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.name[0]}</p>} */}
                                    </div>
                                    {uuid && (
                                        <div className='col-span-2'>
                                            <label htmlFor="">Repeat</label>
                                            <Select value={invoice} onValueChange={(value) => setInvoice(value)}>
                                                <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
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
                                    <AlertDialogCancel onClick={(e) => { e.stopPropagation() }} className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            if (!uuid) {
                                                // Validate required fields (optional)
                                                if (!name || !email || !phoneNumber) {
                                                    alert("Please fill in all required fields");
                                                    return;
                                                }

                                                const newAgent = {
                                                    name,
                                                    email,
                                                    primary_phone: phoneNumber,
                                                    split: invoice || "",
                                                };

                                                onSuccess(newAgent);

                                                // Clear the fields
                                                setName('');
                                                setEmail('');
                                                setPhoneNumber('');
                                                setInvoice('');

                                                // Close the modal
                                                setOpen(false);
                                            } else {
                                                handleAddAgent(e); // for edit/view
                                            }
                                        }}
                                        className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full md:w-[176px] h-[44px] font-[400] text-[20px]"
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
