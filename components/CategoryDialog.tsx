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
} from "@/components/ui/alert-dialog"
import { X } from "lucide-react"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { toast } from "sonner"
import { CreateCategory } from "@/app/dashboard/services/services"
import { CategoriesData } from "@/app/dashboard/services/create/page"
import { Button } from "./ui/button"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    onSuccess?: () => void;
    setCategoriesData?: React.Dispatch<React.SetStateAction<CategoriesData[] | null>>;
}
const CategoryDialog: React.FC<Props> = ({
    open,
    setOpen,
    setCategoriesData
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [types, setTypes] = useState<{ [key: string]: boolean }>({
        quantity: false,
        fixed: false,
        area: false,
    });
    function toggleType(type: string) {
        setTypes(prev => ({
            ...prev,
            [type]: !prev[type],
        }));
    }
    const [duration, setDuration] = useState(false);
    const [addOns, setAddOns] = useState(false);
    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token") || "";
            const payload = {
                description,
                name,
                type: Object.keys(types).filter((key) => types[key]),
                duration: duration ? 1 : 0,
                add_ons: addOns ? 1 : 0
            };
            const result = await CreateCategory(payload, token);
            if (result.status) {
                toast.success("Category created successfully");
                console.log("Category created successfully:", result);
                setOpen(false)
                if (setCategoriesData) {
                    setCategoriesData((prev) => [...(prev || []), result.data]);
                }
                setName("");
                setDescription("");
                setTypes({
                    quantity: false,
                    fixed: false,
                    area: false,
                });
                setDuration(false);
                setIsLoading(false)
            }

        } catch (error) {
            setIsLoading(false)
            console.log("Raw error:", error);
            setFieldErrors({});
            const apiError = error as {
                message?: string;
                errors?: Record<string, string[]>;
            };

            if (apiError.errors && typeof apiError.errors === "object") {
                const normalizedErrors: Record<string, string[]> = {};

                Object.entries(apiError.errors).forEach(([key, messages]) => {
                    const normalizedKey = key.split(".")[0];
                    if (!normalizedErrors[normalizedKey]) {
                        normalizedErrors[normalizedKey] = [];
                    }
                    normalizedErrors[normalizedKey].push(...messages);
                });

                setFieldErrors(normalizedErrors);

                const firstError = Object.values(normalizedErrors).flat()[0];
                toast.error(firstError || "Validation error");
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to submit user data");
            }
        }
    };
    console.log('addOns',addOns);
    
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[416px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center justify-between text-[#4290E9] text-[18px] font-[600]">
                        Add New Service Category
                        <AlertDialogCancel className="border-none !shadow-none">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="flex flex-col gap-y-4">
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                    <div className='grid grid-cols-1 gap-[16px] text-sm font-normal text-[#424242]'>
                        <div className=''>
                            <label htmlFor="">Title <span className="text-red-500">*</span></label>
                            <Input
                                value={name}
                                onChange={(e) => { setName(e.target.value) }}
                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]'
                                type="text"
                                placeholder="Enter category title"
                            />
                            {fieldErrors.name && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.name[0]}</p>}
                        </div>
                        <div className=''>
                            <Textarea placeholder="Enter category description" value={description} onChange={(e) => { setDescription(e.target.value) }} className="h-[150px] border-[1px] border-[#BBBBBB] bg-[#EEEEEE] resize-none" />
                            {fieldErrors.description && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.description[0]}</p>}
                        </div>
                        {/* <div className='col-span-3 flex flex-col'> */}
                        <label className="">Type <span className="text-red-500">*</span></label>
                        <div className="">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Switch checked={types.quantity} onCheckedChange={() => toggleType('quantity')} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500" />
                                    <Label>Quantity Base</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={types.fixed} onCheckedChange={() => toggleType('fixed')} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500" />
                                    <Label>Fixed Price</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={types.area} onCheckedChange={() => toggleType('area')} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500" />
                                    <Label>Area Base</Label>
                                </div>
                            </div>

                            {/* <Select
                                value={type}
                                onValueChange={(value) => setType(value)}
                            >
                                <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border border-[#BBBBBB]">
                                    <SelectValue placeholder="Select Category Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={`quantity`}>Quantity Base</SelectItem>
                                    <SelectItem value={`fixed`}>Fixed Price</SelectItem>
                                    <SelectItem value={`area`}>Area Base</SelectItem>
                                </SelectContent>
                            </Select> */}
                            {fieldErrors.category_type && (
                                <p className="text-red-500 text-[10px] mt-1">
                                    {fieldErrors.category_type[0]}
                                </p>
                            )}
                        </div>
                        <hr className="w-full h-[1px] text-[#BBBBBB]" />
                        <div className='flex items-center justify-between'>
                            <p>Duration</p>
                            <Switch
                                checked={duration}
                                onCheckedChange={setDuration}
                                className=' data-[state=checked]:bg-[#6BAE41]' />
                        </div>
                        <div className='flex items-center justify-between'>
                            <p>Add On</p>
                            <Switch
                                checked={addOns}
                                onCheckedChange={setAddOns}
                                className=' data-[state=checked]:bg-[#6BAE41]' />
                        </div>
                        {/* </div> */}
                    </div>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                    <AlertDialogFooter className="flex flex-col md:flex-row md:justify-between gap-[5px]  mt-2 font-alexandria">
                        <AlertDialogCancel className="bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            onClick={handleSubmit}
                            className="bg-[#4290E9] cursor-pointer text-white hover:bg-[#005fb8] w-full md:w-[170px] h-[44px] font-[400] text-[20px] rounded"
                        >
                            {isLoading ? (
                                <div role="status">
                                    <svg
                                        aria-hidden="true"
                                        className="w-[28px] h-[28px] text-gray-600 animate-spin fill-[#fff]"
                                        viewBox="0 0 100 101"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                            fill="currentFill"
                                        />
                                    </svg>
                                    <span className="sr-only">Loading...</span>
                                </div>
                            ) : (
                                "Save"
                            )}
                        </Button>

                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog >
    )
}

export default CategoryDialog
