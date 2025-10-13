'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { SaveModal } from '@/components/SaveModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import CategoryDialog from '@/components/CategoryDialog'
import { CleanedProductOption, CreateService, GetCategories, GetOneService, GetServices, UpdateService } from '../services'
import { useParams, useRouter } from 'next/navigation'
import { Services } from '../page'
import DropdownActions from '@/components/DropdownActions'
import { HexColorPicker } from "react-colorful";
import { useUnsaved } from '@/app/context/UnsavedContext';
import useUnsavedChangesWarning from '@/app/hooks/useUnsavedChangesWarning';
import ServicesSelector from '@/components/ServicesSelector';

interface ProductOption {
    uuid?: string;
    title: string;
    quantity: number;
    sq_ft_range?: string;
    sq_ft_rate?: string;
    isSqFtRange: boolean;
    isSqFtRate: boolean;
    service_duration: number;
    amount: number;
    min_price: number
}
interface AddOns {
    uuid?: string;
    title: string;
    amount: number;
}
export interface CategoriesData {
    name: string;
    id: number;
    type: string;
    uuid: string;
    duration: boolean;
    add_ons: boolean;

}

const ServicesFrom = () => {
    const [background, setBackground] = useState('');
    const [currentService, setCurrentService] = useState<Services | null>(null);
    const [services, setServices] = useState<Services[] | null>(null);
    const [categoriesData, setCategoriesData] = useState<CategoriesData[] | null>(null);
    const [openCaegoryDialog, setOpenCaegoryDialog] = useState(false);
    const [category, setCategory] = useState<string>('');
    const [categoryObject, setCategoryObject] = useState<CategoriesData | null>(null);
    const [border, setBorder] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailName, setThumbnailName] = useState<string>("");
    const [ServiceDescription, setServiceDescription] = useState('');
    const [openColorPicker, setOpenColorPicker] = useState(false);
    const [openColorPicker1, setOpenColorPicker1] = useState(false);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [discount, setDiscount] = useState<number>(0);

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef1 = useRef<HTMLDivElement | null>(null);
    const [options, setOptions] = useState<ProductOption[]>([
        {
            title: '',
            quantity: 0,
            sq_ft_range: '',
            sq_ft_rate: '',
            service_duration: 0,
            amount: 0,
            isSqFtRange: true,
            isSqFtRate: false,
            min_price: 0
        },
    ]);
    const [addOns, setAddOns] = useState<AddOns[]>([
        {
            title: '',
            amount: 0,
        },
    ]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const { isDirty, setIsDirty } = useUnsaved();
    useUnsavedChangesWarning(isDirty)
    const isPopulatingData = useRef(false);


    console.log('categoryObject', categoryObject);
    console.log('category', category);
    console.log('services', services);
    console.log('selectedServices', selectedServices);


    const addOption = () => {
        setOptions([
            ...options,
            {
                title: '',
                quantity: 0,
                isSqFtRange: true,
                isSqFtRate: false,
                service_duration: 0,
                amount: 0,
                min_price: 0
            },
        ]);
    };
    const handleAddRow = () => {
        setAddOns([...addOns, { title: '', amount: 0 }]);
    };
    function updateOption(index: number, newData: ProductOption) {
        const newOptions = [...options];
        newOptions[index] = newData;
        setOptions(newOptions);
    }
    const router = useRouter();
    const params = useParams();
    const ServiceId = params?.id as string;

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        GetCategories(token)
            .then(res => {
                const data = res.data;
                setCategoriesData(data)
            })
            .catch(err => console.log(err.message));

    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        GetServices(token)
            .then(res => {

                isPopulatingData.current = true;
                const data = res.data;
                setServices(data)
                setIsDirty(false);
            })
            .catch(err => console.log(err.message));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ServiceId]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token || !ServiceId) {
            return;
        }

        GetOneService(token, ServiceId)
            .then(res => {

                isPopulatingData.current = true;
                const data = res.data;
                setCurrentService(data)
                setCategory(data.category_id)
                setServiceName(data.name)
                setBackground(data.background_color.replace(/^#/, ""))
                setBorder(data.border_color.replace(/^#/, ""))
                // setOptions(data.product_options)
                setThumbnailName(data.thumbnail)
                setServiceDescription(data.description)
                requestAnimationFrame(() => {
                    isPopulatingData.current = false;
                });

                setIsDirty(false);
            })
            .catch(err => console.log(err.message));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ServiceId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                wrapperRef.current &&
                event.target instanceof Node &&
                !wrapperRef.current.contains(event.target)
            ) {
                setOpenColorPicker(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        function handleClickOutside1(event: MouseEvent) {
            if (
                wrapperRef1.current &&
                event.target instanceof Node &&
                !wrapperRef1.current.contains(event.target)
            ) {
                setOpenColorPicker1(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside1);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside1);
        };
    }, []);

    // const handleUpdateVendorStatus = async (
    //     vendorServiceUuid: string,
    //     status: boolean,
    //     serviceUuid: string
    // ) => {
    //     try {
    //         const token = localStorage.getItem('token') || '';

    //         const payload = {
    //             status,
    //             _method: 'POST',
    //         };

    //         const response = await UpdateVendorServiceStatus(vendorServiceUuid, payload, token);

    //         toast.success('Vendor service status updated successfully');

    //         setCurrentService((prev) =>
    //             prev && prev.uuid === serviceUuid
    //                 ? {
    //                     ...prev,
    //                     vendor_services: prev.vendor_services.map((vs) =>
    //                         vs.uuid === vendorServiceUuid ? { ...vs, status } : vs
    //                     ),
    //                 }
    //                 : prev
    //         );
    //         return response;
    //     } catch (error: unknown) {
    //         if (error instanceof Error) {
    //             console.error(error.message);
    //             toast.error(error.message || 'Failed to update vendor status');
    //         }
    //     }
    // };

    // const handleDelete = async (vendorServiceUuid: string) => {
    //     try {
    //         const token = localStorage.getItem('token') || '';
    //         await DeleteVendorService(vendorServiceUuid, token);

    //         toast.success('Service deleted successfully');
    //         setCurrentService((prev) =>
    //             prev
    //                 ? {
    //                     ...prev,
    //                     vendor_services: prev.vendor_services.filter(
    //                         (vs) => vs.uuid !== vendorServiceUuid
    //                     ),
    //                 }
    //                 : prev
    //         );
    //     } catch (error) {
    //         if (error instanceof Error) {
    //             console.error('Delete failed:', error.message);
    //             toast.error(error.message || 'Failed to delete user');
    //         } else {
    //             console.error('Delete failed:', error);
    //             toast.error('Failed to delete service');
    //         }
    //     }
    // };

    const handleDeleteOption = (uuid?: string) => {
        if (!currentService) return;

        const updatedOptions = (currentService.product_options || []).filter(option => {
            return !(uuid && option.uuid === uuid);
        });

        setCurrentService(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                product_options: updatedOptions,
            };
        });
    };
    const handleDeleteAddOn = (uuid?: string) => {
        if (!currentService) return;

        const updatedOptions = (currentService.service_add_ons || []).filter(option => {
            return !(uuid && option.uuid === uuid);
        });

        setCurrentService(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                service_add_ons: updatedOptions,
            };
        });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            //setIsLoading(true)
            const token = localStorage.getItem("token") || "";

            const isOptionValid = (opt: ProductOption) => {
                return (
                    opt.title?.trim() !== '' ||
                    !!opt.amount ||
                    !!opt.service_duration ||
                    !!opt.quantity ||
                    !!opt.sq_ft_rate ||
                    (opt.sq_ft_range?.trim() !== '')
                );
            };

            const allOptions = [
                ...(currentService?.product_options || []),
                ...options.filter(isOptionValid)
            ];
            const cleanedProductOptions: CleanedProductOption[] = allOptions.map(option => {
                const baseOption: CleanedProductOption = {
                    title: option.title,
                    amount: option.amount,
                    min_price: option.min_price

                };
                if (option.min_price !== undefined && option.min_price !== null && Number(option.min_price) !== 0) {
                    baseOption.min_price = option.min_price;
                }
                if (categoryObject?.type.includes('area')) {
                    baseOption.sq_ft_rate = option.sq_ft_rate?.toString();
                    baseOption.sq_ft_range = option.sq_ft_range?.toString();
                }

                if (categoryObject?.type.includes('quantity')) {
                    baseOption.quantity = option.quantity;
                }

                if (Number(categoryObject?.duration) == 1) {
                    baseOption.service_duration = option.service_duration;
                }

                return baseOption;
            });

            const combinedAddOns = [
                ...(currentService?.service_add_ons || []),
                ...addOns
            ];

            const cleanedAddOns = combinedAddOns.filter(addon =>
                addon.title?.trim() !== '' || addon.amount?.toString().trim() !== ''
            );



            const payload = {
                name: serviceName,
                category_id: category,
                description: ServiceDescription,
                background_color: `#${background.replace(/^#/, "")}`,
                // background_color: background,
                border_color: `#${border.replace(/^#/, "")}`,
                // border_color: border,
                thumbnail: thumbnailFile,
                product_options: cleanedProductOptions,
                add_ons: cleanedAddOns
            };

            console.log('payload', payload);

            if (ServiceId) {
                await UpdateService(payload, token, ServiceId);
                toast.success("Service updated successfully");
                setIsLoading(true)
                setOpen(true)
                router.push('/dashboard/services');
                setIsLoading(false)
                setIsDirty(false)
            } else {
                await CreateService(payload, token);
                toast.success("Service created successfully");
                setIsLoading(true)
                setOpen(true)
                router.push('/dashboard/services');
                setIsLoading(false)
                setIsDirty(false)
            }
        } catch (error) {
            setIsLoading(false);
            setOpen(false);
            console.log('Raw error:', error);
            setFieldErrors({});

            const apiError = error as { message?: string; errors?: Record<string, string[]> };

            if (apiError.errors && typeof apiError.errors === 'object') {
                const normalizedErrors: Record<string, string[]> = {};

                Object.entries(apiError.errors).forEach(([key, messages]) => {
                    // Keep the full key, including dot-notation (e.g., product_options.0.title)
                    if (!normalizedErrors[key]) {
                        normalizedErrors[key] = [];
                    }
                    normalizedErrors[key].push(...messages);
                });

                setFieldErrors(normalizedErrors);

                // const firstError = Object.values(normalizedErrors).flat()[0];
                // toast.error(firstError || 'Validation error');
                toast.error('Validation error kindly re-check your form');
            } else if (error instanceof Error) {
                toast.error(error.message);
                console.error(error.message);
            } else {
                toast.error('Failed to submit user data');
            }
        }

    };

    return (
        <div className='font-alexandria pb-[80px]'>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]  text-[#4290E9]'>Services › {ServiceId ? `Edit ${currentService?.name}` : `Create`}</p>
                <div className='flex gap-[18px]'>

                    <Button
                        disabled={isLoading}
                        onClick={(e) => {
                            handleSubmit(e)
                        }}
                        className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9] cursor-pointer'>
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
                            "Save Changes"
                        )}
                    </Button>
                    {/* <ConfirmationDialog
                        open={confirmOpen1}
                        setOpen={setConfirmOpen1}
                        onConfirm={confirmAndExecute1}
                        showAgain={showAgain1}
                        toggleShowAgain={() => setShowAgain1(!showAgain1)}
                    /> */}
                </div>
            </div>

            <div>
                <form
                    onChange={() => {
                        if (!isPopulatingData.current && ServiceId) {
                            setIsDirty(true);
                        } else if (!ServiceId) {
                            setIsDirty(true)
                        }
                    }}
                    onSubmit={(e) => { handleSubmit(e) }}>
                    <div className='w-full flex flex-col items-center'>
                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                            <div className='grid grid-cols-2 gap-[16px]'>
                                <div className="col-span-2 grid grid-cols-5 gap-2 items-start">
                                    <div className='col-span-3 flex flex-col'>
                                        <label className="col-span-1 text-sm mt-[18px]">Category <span className="text-red-500">*</span></label>
                                        <div className="">
                                            <Select
                                                value={category}
                                                onValueChange={(value) => {
                                                    setCategory(value);
                                                    const selected = categoriesData?.find(cat => cat.id.toString() === value);
                                                    if (selected) setCategoryObject(selected);
                                                }}
                                            >
                                                <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[12px]">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {
                                                        categoriesData?.map((category) => {
                                                            return <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                                                        })
                                                    }
                                                </SelectContent>
                                            </Select>
                                            {fieldErrors.category_id && (
                                                <p className="text-red-500 text-[10px] mt-1">
                                                    {fieldErrors.category_id[0]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className='col-span-2 h-[50%] grid-rows-2 grid-cols-2 self-end justify-self-end flex items-center'>
                                        {/* <p onClick={() => setOpenCaegoryDialog(true)} className='text-[#4290E9] text-[10px] font-semibold flex gap-[10px] cursor-pointer place-items-end pb-[10px]'><span className='flex bg-[#4290E9] w-[15px] h-[15px] rounded-[3px] justify-center items-center'><Plus className='text-[#F2F2F2] w-[12px]' /></span>Create New Category </p> */}
                                    </div>
                                </div>
                                <div ref={wrapperRef} className="relative w-full max-w-xs">
                                    <label htmlFor="bgcolor" className="block text-sm font-medium text-gray-700">
                                        Color: Background <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative w-full mt-2">
                                        {/* Left-side # symbol */}
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">#</span>

                                        <Input
                                            id="bgcolor"
                                            value={background}
                                            onFocus={() => setOpenColorPicker(true)}
                                            onClick={() => setOpenColorPicker(true)}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                                                setBackground(value);
                                            }}
                                            className="pl-6 pr-10 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB]"
                                            maxLength={6}
                                        />

                                        {/* Right-side color circle */}
                                        <div
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-400"
                                            style={{ backgroundColor: `#${background || "ffffff"}` }}
                                        />
                                    </div>


                                    {openColorPicker && (
                                        <div className="absolute z-10 mt-2 rounded shadow-md border border-gray-300 bg-white p-3">
                                            <HexColorPicker
                                                className='!w-[175px]'
                                                color={`#${background}`}
                                                onChange={(newColor) => setBackground(newColor.replace(/^#/, ""))}
                                            />
                                        </div>
                                    )}
                                    {fieldErrors.background_color && (
                                        <p className="text-red-500 text-[10px] mt-1">
                                            {fieldErrors.background_color[0]}
                                        </p>
                                    )}
                                </div>

                                <div ref={wrapperRef1} className="relative w-full max-w-xs">
                                    <label htmlFor="brcolor" className="block text-sm font-medium text-gray-700">Color: Border <span className="text-red-500">*</span></label>
                                    <div className="relative w-full mt-2">
                                        {/* Left-side # symbol */}
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">#</span>

                                        {/* Input field */}
                                        <Input
                                            id="brcolor"
                                            value={border}
                                            onFocus={() => setOpenColorPicker1(true)}
                                            onClick={() => setOpenColorPicker1(true)}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                                                setBorder(value);
                                            }}
                                            className="pl-6 pr-10 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB]"
                                            maxLength={6}
                                        />

                                        {/* Right-side color preview circle */}
                                        <div
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-400"
                                            style={{ backgroundColor: `#${border || "ffffff"}` }}
                                        />
                                    </div>

                                    {openColorPicker1 && (
                                        <div className="absolute z-10 mt-2 rounded shadow-md border border-gray-300 bg-white p-3">
                                            <HexColorPicker
                                                className='!w-[175px]'
                                                color={`#${border}`}
                                                onChange={(newColor) => setBorder(newColor.replace(/^#/, ""))}
                                            />
                                        </div>
                                    )}
                                    {fieldErrors.border_color && (
                                        <p className="text-red-500 text-[10px] mt-1">
                                            {fieldErrors.border_color[0]}
                                        </p>
                                    )}

                                </div>
                            </div>
                        </div>
                        <CategoryDialog
                            open={openCaegoryDialog}
                            setOpen={setOpenCaegoryDialog}
                            setCategoriesData={setCategoriesData}
                        />
                    </div>
                    <Accordion type="multiple" defaultValue={["property", "statistics", `${ServiceId && 'options'}`]} className="w-full space-y-4">
                        <AccordionItem value="property">
                            <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>Service Detail</AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className='w-full flex flex-col items-center'>
                                    <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                        <div className='grid grid-cols-2 gap-[16px]'>
                                            <div className='col-span-2'>
                                                <label htmlFor="">Service Name <span className="text-red-500">*</span></label>
                                                <Input
                                                    value={serviceName}
                                                    onChange={(e) => { setServiceName(e.target.value) }}
                                                    placeholder='Enter service name here' className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                {fieldErrors.name && <p className='text-red-500 text-[10px]'>{fieldErrors.name[0]}</p>}

                                            </div>
                                            <div className="col-span-2">
                                                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
                                                    Thumbnail (Recommended 1024px x 550px)
                                                </label>

                                                <div className="flex mt-[12px] rounded-[6px] ">
                                                    {/* File info display area */}
                                                    <div className="flex-grow rounded-tl-[6px] rounded-bl-[6px] bg-[#EEEEEE] border border-r-0 border-[#BBBBBB] p-2 h-[42px] flex items-center text-gray-500 text-sm truncate">
                                                        {thumbnailName ? thumbnailName : "Select a thumbnail image"}
                                                    </div>

                                                    {/* Custom styled button */}
                                                    <label
                                                        htmlFor="thumbnail"
                                                        className="bg-[#DDDDDD] border rounded-tr-[6px] rounded-br-[6px] border-[#666666] px-4 py-2 text-[16] font-[400] text-gray-700 hover:bg-[#CCCCCC] cursor-pointer flex items-center"
                                                    >
                                                        Browse
                                                    </label>

                                                    {/* Hidden actual file input */}
                                                    <input
                                                        id="thumbnail"
                                                        name="thumbnail"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setThumbnailFile(file);
                                                                setThumbnailName(file.name);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className='col-span-2'>
                                                <label htmlFor="">Description</label>
                                                <Textarea value={ServiceDescription}
                                                    onChange={(e) => setServiceDescription(e.target.value)}
                                                    // placeholder={`This service covers:\n\n- Item\n- Item\n- Item\n- Item\n- Item`}
                                                    placeholder='Enter service description here'
                                                    className='w-full resize-none h-[200px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' />
                                                {fieldErrors.description && <p className='text-red-500 text-[10px]'>{fieldErrors.description[0]}</p>}
                                            </div>
                                            {categoryObject?.name.toLocaleLowerCase() === 'package' &&
                                                <div className='w-full col-span-2'>
                                                    <div className='w-full'>
                                                        <label htmlFor="">Discount <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="number"
                                                            min={-1} // allows clearing the input without defaulting to 0
                                                            placeholder="Discount (Percentage)"
                                                            className="px-3  w-full h-[42px] bg-[#eee] border border-[#BBBBBB] mt-[10px]"
                                                            value={discount <= 0 ? "" : discount} // use your discount state here
                                                            onChange={(e) => {
                                                                const val = e.target.value;

                                                                if (val === "") {
                                                                    setDiscount(0); // or null depending on your logic
                                                                    return;
                                                                }

                                                                const parsed = parseInt(val, 10);
                                                                if (!isNaN(parsed) && parsed > 0) {
                                                                    setDiscount(parsed);
                                                                }
                                                            }}
                                                        />

                                                    </div>
                                                    <div className='w-full mt-[16px] '>
                                                        <label htmlFor="">Add Services <span className="text-red-500">*</span></label>

                                                        <div className='w-full'>
                                                            <ServicesSelector
                                                                servicesData={services}
                                                                services={selectedServices}
                                                                setServices={setSelectedServices}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                            }
                                        </div>

                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        {categoryObject?.name.toLocaleLowerCase() !== 'package' &&
                            <AccordionItem value="options" className='relative group !mt-0'>
                                <p onClick={addOption} className='text-[#4290E9] flex gap-[10px] cursor-pointer items-center absolute right-[75px] top-[20px] group-data-[state=closed]:hidden'>Add<span className='flex bg-[#4290E9] w-[18px] h-[18px] rounded-[3px] justify-center items-center'><Plus className='text-[#F2F2F2] w-[12px]' /></span> </p>
                                <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>Product Options </AccordionTrigger>
                                <AccordionContent className="grid gap-4 !pb-0 overflow-x-auto">
                                    <div className='w-full flex flex-col items-center mb-[40px]'>
                                        <Table className='font-alexandria !overflow-x-auto whitespace-nowrap min-w-[800px]"'>
                                            <TableHeader className='bg-[#E4E4E4]'>
                                                <TableRow className='text-[14px] !font-[700]'>
                                                    <TableHead className="text-[14px] font-bold pl-[15px]">TITLE <span className="text-red-500">*</span></TableHead>
                                                    {categoryObject?.type.includes('quantity') &&
                                                        <TableHead className="text-[14px] font-bold">QUANTITY</TableHead>}
                                                    {categoryObject?.type.includes('area') &&
                                                        <TableHead className="text-[14px] font-bold">SQ. FT.</TableHead>}
                                                    {(Number(categoryObject?.duration) == 1) &&
                                                        <TableHead className="text-[14px] font-bold">SERVICE DURATION</TableHead>}
                                                    {/* <TableHead className="text-[14px] font-bold">MIN PRICE</TableHead> */}
                                                    <TableHead className="text-[14px] font-bold">MIN PRICE</TableHead>
                                                    <TableHead className="text-[14px] font-bold">AMOUNT</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {currentService?.product_options.map((opt, idx) => (
                                                    <TableRow className='py-4' key={idx}>
                                                        <TableCell>
                                                            <Label className=' text-[15px] font-[400] text-[#666666] pl-[7px]'>{opt?.title}</Label>

                                                        </TableCell>
                                                        {categoryObject?.type.includes('quantity') &&
                                                            <TableCell>
                                                                <Label className=' text-[15px] font-[400] text-[#666666]'>{opt?.quantity == 0 ? '-' : opt?.quantity}</Label>
                                                            </TableCell>}
                                                        {categoryObject?.type.includes('area') &&
                                                            <TableCell className=''>
                                                                <div className='flex justify-start items-center'>
                                                                    <Label className=' flex text-[15px] font-[400] text-[#666666] w-1/2'>{opt.sq_ft_range ? opt.sq_ft_range : (opt.sq_ft_rate !== undefined ? Number(opt.sq_ft_rate).toFixed(0) : '')}</Label>
                                                                    <Label className=' flex text-[15px] font-[400] text-[#666666]'>{opt.sq_ft_range ? 'Sq. ft. Range' : 'Sq. ft. Rate'}</Label>

                                                                </div>
                                                            </TableCell>}

                                                        {Number(categoryObject?.duration) == 1 &&
                                                            <TableCell>
                                                                <Label className=' text-[15px] font-[400] text-[#666666]'>{opt.service_duration && opt.service_duration != 0 ? opt.service_duration + " Min" : '-'}</Label>
                                                            </TableCell>}

                                                        <TableCell>
                                                            <Label className=' text-[15px] font-[400] text-[#666666]'>{opt.min_price && opt.min_price ? "$" + opt.min_price : '-'}</Label>
                                                        </TableCell>
                                                        <TableCell className=''>
                                                            <div className='flex justify-between'>
                                                                <Label className=' text-[15px] font-[400] text-[#666666] flex items-center'>${opt.amount}</Label>
                                                                <DropdownActions options={[
                                                                    {
                                                                        label: "Edit",
                                                                        onClick: () => {
                                                                            const { ...rest } = opt;
                                                                            setOptions((prev) => {
                                                                                const emptyIndex = prev.findIndex(
                                                                                    (row) =>
                                                                                        !row.title &&
                                                                                        (!row.quantity || row.quantity === 0) &&
                                                                                        (!row.amount || row.amount === 0) &&
                                                                                        (!row.service_duration || row.service_duration === 0) &&
                                                                                        (!row.min_price || row.min_price === 0) &&
                                                                                        (!row.sq_ft_rate || row.sq_ft_rate === '') &&
                                                                                        (!row.sq_ft_range || row.sq_ft_range === '')
                                                                                );

                                                                                const newOption = {
                                                                                    ...rest,
                                                                                    title: opt.title ?? "",
                                                                                    quantity: opt.quantity ?? 0,
                                                                                    amount: opt.amount ?? 0,
                                                                                    min_price: opt.min_price ?? 0,
                                                                                    service_duration: opt.service_duration ?? 0,
                                                                                    sq_ft_rate: opt.sq_ft_rate?.toString() ?? "",
                                                                                    sq_ft_range: opt.sq_ft_range?.toString() ?? "",
                                                                                    isSqFtRate: !!opt.sq_ft_rate,
                                                                                    isSqFtRange: !!opt.sq_ft_range,
                                                                                };

                                                                                // If an empty row is found, replace it
                                                                                if (emptyIndex !== -1) {
                                                                                    const updated = [...prev];
                                                                                    updated[emptyIndex] = newOption;
                                                                                    return updated;
                                                                                }

                                                                                // Else, add new row
                                                                                return [...prev, newOption];
                                                                            });


                                                                            const updatedOptions = (currentService.product_options || []).filter(option => {
                                                                                return !(opt.uuid && option.uuid === opt.uuid);
                                                                            });

                                                                            setCurrentService(prev => {
                                                                                if (!prev) return prev;
                                                                                return {
                                                                                    ...prev,
                                                                                    product_options: updatedOptions,
                                                                                };
                                                                            });
                                                                        }

                                                                    },
                                                                    {
                                                                        label: "Delete",
                                                                        onClick: () => handleDeleteOption(opt.uuid),
                                                                    },
                                                                ]
                                                                } />
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                                {options.map((opt, idx) => (
                                                    <TableRow key={idx} className='text-[#666666] text-[14px] !border-b-0 '>
                                                        <TableCell className='pl-[15px]'>
                                                            {/* <Label className='font-bold'>TITLE</Label> */}
                                                            <Input
                                                                className=" w-[192px] h-[42px] mt-[10px]"
                                                                value={opt.title}
                                                                onChange={(e) =>
                                                                    updateOption(idx, { ...opt, title: e.target.value })
                                                                }
                                                            />
                                                            {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.title`] && (
                                                                <p className="text-red-500 text-[10px] mt-1">
                                                                    {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.title`][0]}
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                        {categoryObject?.type.includes('quantity') &&
                                                            <TableCell>
                                                                {/* <Label className='font-bold'>QUANTITY</Label> */}
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    className="w-[192px] h-[42px] mt-[10px]"
                                                                    value={opt.quantity === 0 ? "" : opt.quantity}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;

                                                                        if (val === "") {
                                                                            updateOption(idx, {
                                                                                ...opt,
                                                                                quantity: 0, // temporary placeholder — or consider using `null`
                                                                            });
                                                                            return;
                                                                        }

                                                                        const parsed = parseInt(val, 10);

                                                                        if (!isNaN(parsed) && parsed > 0) {
                                                                            updateOption(idx, {
                                                                                ...opt,
                                                                                quantity: parsed,
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                                {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.quantity`] && (
                                                                    <p className="text-red-500 text-[10px] mt-1">
                                                                        {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.quantity`][0]}
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                        }
                                                        {categoryObject?.type.includes('area') &&
                                                            <TableCell className="">
                                                                {/* Input section: col 1, spans both rows */}
                                                                {/* <Label className="font-bold col-start-1">SQ. FT.</Label> */}
                                                                <div className=" flex flex-row justify-start gap-[10px] h-[42px] mt-[10px]">
                                                                    {opt.isSqFtRange && (
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="Sq. Ft. Range"
                                                                            value={opt.sq_ft_range || ''}
                                                                            className="w-[192px] h-[42px] col-start-2"
                                                                            onChange={(e) =>
                                                                                updateOption(idx, {
                                                                                    ...opt,
                                                                                    sq_ft_range: e.target.value,
                                                                                })
                                                                            }
                                                                        />

                                                                    )}
                                                                    {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.sq_ft_range`] && (
                                                                        <p className="text-red-500 text-[10px] mt-1">
                                                                            {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.sq_ft_range`][0]}
                                                                        </p>
                                                                    )}
                                                                    {opt.isSqFtRate && (
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="Sq. Ft. Rate"
                                                                            value={opt.sq_ft_rate || ''}
                                                                            className="w-[192px] h-[42px] col-start-2"
                                                                            onChange={(e) =>
                                                                                updateOption(idx, {
                                                                                    ...opt,
                                                                                    sq_ft_rate: e.target.value,
                                                                                })
                                                                            }
                                                                        />
                                                                    )}
                                                                    {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.sq_ft_rate`] && (
                                                                        <p className="text-red-500 text-[10px] mt-1">
                                                                            {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.sq_ft_rate`][0]}
                                                                        </p>
                                                                    )}
                                                                    <div className=" flex flex-col gap-0">
                                                                        <label className="flex items-center gap-1 text-[14px] font-[700]">
                                                                            <Input
                                                                                type="radio"
                                                                                name={`sq_ft_type_${idx}`}
                                                                                checked={opt.isSqFtRange}
                                                                                className="w-[16px] h-[16px]"
                                                                                onChange={() =>
                                                                                    updateOption(idx, {
                                                                                        ...opt,
                                                                                        isSqFtRange: true,
                                                                                        isSqFtRate: false,
                                                                                    })
                                                                                }
                                                                            />
                                                                            SQ. FT. RANGE
                                                                        </label>
                                                                        <label className="flex items-center gap-1 text-[14px] font-[700]">
                                                                            <Input
                                                                                type="radio"
                                                                                name={`sq_ft_type_${idx}`}
                                                                                checked={opt.isSqFtRate}
                                                                                className="w-[16px] h-[16px]"
                                                                                onChange={() =>
                                                                                    updateOption(idx, {
                                                                                        ...opt,
                                                                                        isSqFtRange: false,
                                                                                        isSqFtRate: true,
                                                                                    })
                                                                                }
                                                                            />
                                                                            SQ. FT. RATE
                                                                        </label>
                                                                    </div>
                                                                </div>


                                                                {/* Radio buttons section: col 2, row 2 only */}
                                                            </TableCell>
                                                        }

                                                        {Number(categoryObject?.duration) == 1 &&
                                                            <TableCell>

                                                                {/* <Label className='font-bold'>SERVICE DURATION</Label> */}
                                                                <Input
                                                                    type="number"
                                                                    min={-1} // allows clearing the input without defaulting to 0
                                                                    placeholder="Duration"
                                                                    className="mt-[10px]"
                                                                    value={opt.service_duration <= 0 ? "" : opt.service_duration}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;

                                                                        if (val === "") {
                                                                            updateOption(idx, {
                                                                                ...opt,
                                                                                service_duration: 0, // or null, depending on your app logic
                                                                            });
                                                                            return;
                                                                        }

                                                                        const parsed = parseInt(val, 10);
                                                                        if (!isNaN(parsed) && parsed > 0) {
                                                                            updateOption(idx, {
                                                                                ...opt,
                                                                                service_duration: parsed,
                                                                            });
                                                                        }
                                                                    }}
                                                                />

                                                                {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.service_duration`] && (
                                                                    <p className="text-red-500 text-[10px] mt-1">
                                                                        {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.service_duration`][0]}
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                        }
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min={-1}
                                                                value={opt.min_price <= 0 ? "" : opt.min_price}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;

                                                                    if (val === "") {
                                                                        updateOption(idx, {
                                                                            ...opt,
                                                                            min_price: 0,
                                                                        });
                                                                        return;
                                                                    }

                                                                    const parsed = parseInt(val, 10);
                                                                    if (!isNaN(parsed) && parsed > 0) {
                                                                        updateOption(idx, {
                                                                            ...opt,
                                                                            min_price: parsed,
                                                                        });
                                                                    }
                                                                }}
                                                                className='w-[100px] mt-[10px]'
                                                                placeholder='Min Price'
                                                            />
                                                        </TableCell>

                                                        <TableCell className='flex justify-between items-center'>
                                                            {/* <Label className='font-bold'>AMOUNT</Label> */}
                                                            <Input
                                                                type="number"
                                                                min={0} // allows 0 and up
                                                                step="0.01" // allows decimals like 0.03
                                                                className="w-[80px] mt-[10px]"
                                                                value={opt.amount === 0 ? "" : opt.amount}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;

                                                                    if (val === "") {
                                                                        updateOption(idx, {
                                                                            ...opt,
                                                                            amount: 0, // or null if you want to treat empty as no value
                                                                        });
                                                                        return;
                                                                    }

                                                                    const parsed = parseFloat(val);

                                                                    // Accept only positive values including 0
                                                                    if (!isNaN(parsed) && parsed >= 0) {
                                                                        updateOption(idx, {
                                                                            ...opt,
                                                                            amount: parsed,
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                            {options.length > 1 && !opt.uuid && (
                                                                <DropdownActions
                                                                    options={[{
                                                                        label: "Delete",
                                                                        onClick: () => {
                                                                            const updatedOptions = options.filter((_, i) => i !== idx);
                                                                            setOptions(updatedOptions);
                                                                        }
                                                                    }]}
                                                                />
                                                            )}
                                                            {/* {opt.uuid && (
                                                            <Button className='bg-[#4290E9] hover:bg-[#4a96ec]'>Save</Button>
                                                        )} */}




                                                            {fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.amount`] && (
                                                                <p className='text-red-500 text-[10px]'>{fieldErrors[`product_options.${(currentService?.product_options?.length ?? 0) > 0 ? currentService?.product_options?.length ?? 0 : idx}.amount`][0]}</p>
                                                            )}
                                                        </TableCell>

                                                    </TableRow>
                                                ))}

                                                {fieldErrors.product_options && (
                                                    <p className="text-red-500 text-[10px] mt-1 ml-[20px]">
                                                        {fieldErrors.product_options[0]}
                                                    </p>
                                                )}
                                            </TableBody>
                                        </Table>
                                        {categoryObject?.add_ons &&
                                            <div className='w-full'>
                                                <hr />
                                                <div className='flex justify-between items-center px-[20px]'>
                                                    <h1 className='flex text-center text-[#4290E9] text-[18px] my-[20px]'>ADD ONS</h1>
                                                    <p onClick={handleAddRow} className='text-[#4290E9] flex gap-[10px] cursor-pointer items-center  group-data-[state=closed]:hidden'>Add<span className='flex bg-[#4290E9] w-[18px] h-[18px] rounded-[3px] justify-center items-center'><Plus className='text-[#F2F2F2] w-[12px]' /></span> </p>
                                                </div>
                                                <Table>
                                                    <TableHeader className='bg-[#E4E4E4] text-[#666666]'>
                                                        <TableRow>
                                                            <TableCell className='text-[14px] font-bold pl-[15px]'>TITLE</TableCell>
                                                            <TableCell className='text-[14px] font-bold pl-[15px]'>AMOUNT</TableCell>
                                                        </TableRow>
                                                    </TableHeader>
                                                    {currentService?.service_add_ons.map((opt, idx) => (
                                                        <TableRow className='py-4' key={idx}>
                                                            <TableCell>
                                                                <Label className=' text-[15px] font-[400] text-[#666666] pl-[7px]'>{opt?.title}</Label>

                                                            </TableCell>

                                                            <TableCell className='flex justify-between items-center px-[20px]'>
                                                                <Label className=' text-[15px] font-[400] text-[#666666]'>$ {opt?.amount}</Label>
                                                                <DropdownActions options={[
                                                                    {
                                                                        label: "Edit",
                                                                        onClick: () => {
                                                                            const { ...rest } = opt;
                                                                            setAddOns((prev) => {
                                                                                const emptyIndex = prev.findIndex(
                                                                                    (row) =>
                                                                                        !row.title &&
                                                                                        (!row.amount || row.amount === 0)
                                                                                );

                                                                                const newOption = {
                                                                                    ...rest,
                                                                                    title: opt.title ?? "",
                                                                                    amount: opt.amount ?? 0,
                                                                                };

                                                                                // If an empty row is found, replace it
                                                                                if (emptyIndex !== -1) {
                                                                                    const updated = [...prev];
                                                                                    updated[emptyIndex] = newOption;
                                                                                    return updated;
                                                                                }

                                                                                // Else, add new row
                                                                                return [...prev, newOption];
                                                                            });


                                                                            const updatedOptions = (currentService.service_add_ons || []).filter(option => {
                                                                                return !(opt.uuid && option.uuid === opt.uuid);
                                                                            });

                                                                            setCurrentService(prev => {
                                                                                if (!prev) return prev;
                                                                                return {
                                                                                    ...prev,
                                                                                    service_add_ons: updatedOptions,
                                                                                };
                                                                            });
                                                                        }

                                                                    },
                                                                    {
                                                                        label: "Delete",
                                                                        onClick: () => handleDeleteAddOn(opt.uuid),
                                                                    },
                                                                ]
                                                                } />
                                                            </TableCell>


                                                        </TableRow>
                                                    ))}
                                                    {addOns.map((addOn, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                <Input
                                                                    className='h-[42px]'
                                                                    placeholder='Enter Add On title'
                                                                    value={addOn.title}
                                                                    onChange={(e) => {
                                                                        const newAddOns = [...addOns];
                                                                        newAddOns[index].title = e.target.value;
                                                                        setAddOns(newAddOns);
                                                                    }}
                                                                />
                                                                {fieldErrors[`add_ons.${(currentService?.service_add_ons?.length ?? 0) > 0 ? currentService?.service_add_ons?.length ?? 0 : index}.title`] && (
                                                                    <p className="text-red-500 text-[10px] mt-1">
                                                                        {fieldErrors[`add_ons.${(currentService?.service_add_ons?.length ?? 0) > 0 ? currentService?.service_add_ons?.length ?? 0 : index}.title`][0]}
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className=''>
                                                                <div className='w-full flex justify-between items-center'>
                                                                    <Input
                                                                        className='h-[42px]'
                                                                        type='number'
                                                                        placeholder='Enter Amount'
                                                                        value={addOn.amount === 0 ? "" : addOn.amount}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;

                                                                            if (val === "") {
                                                                                const newAddOns = [...addOns];
                                                                                newAddOns[index].amount = 0;
                                                                                setAddOns(newAddOns);
                                                                                return;
                                                                            }

                                                                            const parsed = parseFloat(val);

                                                                            if (!isNaN(parsed) && parsed >= 0) {
                                                                                const newAddOns = [...addOns];
                                                                                newAddOns[index].amount = parsed;
                                                                                setAddOns(newAddOns);
                                                                            }
                                                                        }}

                                                                    />
                                                                    {addOns.length > 1 && !addOn.uuid && (
                                                                        <DropdownActions
                                                                            options={[{
                                                                                label: "Delete",
                                                                                onClick: () => {
                                                                                    const updatedAddons = addOns?.filter((_, i) => i !== index);
                                                                                    setAddOns(updatedAddons);
                                                                                }
                                                                            }]}
                                                                        />
                                                                    )}
                                                                </div>
                                                                {fieldErrors[`add_ons.${(currentService?.service_add_ons?.length ?? 0) > 0 ? currentService?.service_add_ons?.length ?? 0 : index}.amount`] && (
                                                                    <p className="text-red-500 text-[10px] mt-1">
                                                                        {fieldErrors[`add_ons.${(currentService?.service_add_ons?.length ?? 0) > 0 ? currentService?.service_add_ons?.length ?? 0 : index}.amount`][0]}
                                                                    </p>
                                                                )}


                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </Table>
                                            </div>
                                        }
                                    </div>
                                    {/* </div>
                                </div> */}
                                </AccordionContent>
                            </AccordionItem>
                        }
                        {/* 
                        {currentService && currentService?.vendor_services && currentService?.vendor_services.length > 0 && (
                            <AccordionItem value="statistics" className='!mt-0'>
                                <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>Vendors</AccordionTrigger>
                                <AccordionContent className="grid gap-4 overflow-x-auto">
                                    <div className='w-full flex flex-col items-center mb-[40px]'>
                                        <Table className="font-alexandria !overflow-x-auto whitespace-nowrap min-w-[800px]">
                                            <TableHeader>
                                                <TableRow className="bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]">
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">NAME</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">EMAIL</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">PHONE</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">RATE</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">DURATION</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">HOMEBASE ADDRESS</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">STATUS</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!currentService?.vendor_services ? (
                                                    <TableRow className="flex justify-center w-full">
                                                        <TableCell className="flex justify-center" colSpan={5}>
                                                            No Vendor available.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    currentService?.vendor_services.map((vendor, i) => {
                                                        const options = [
                                                            // {
                                                            //     label: "Edit",
                                                            //     onClick: () => {
                                                            //         if (vendor.uuid) {
                                                            //             // router.push(`/dashboard/services/create/${vendor.uuid}`);
                                                            //         }
                                                            //     },
                                                            // },
                                                            {
                                                                label: "Delete",
                                                                onClick: () => handleDelete(vendor.uuid),
                                                            },
                                                        ];

                                                        return (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-[15px] font-[400] text-[#666666] pl-[20px]">
                                                                    {vendor?.vendor?.first_name} {vendor?.vendor?.last_name}
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#666666]">
                                                                    {vendor?.vendor?.email}
                                                                </TableCell>

                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                                                    {vendor?.vendor?.primary_phone}
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                                                    $ {vendor?.hourly_rate} / hr
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                                                    {vendor?.time_needed} Min
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                                                    {vendor?.vendor?.homebase_address ? vendor?.vendor?.homebase_address.address_line_1 : ''}, {vendor?.vendor?.homebase_address ? vendor?.vendor?.homebase_address.city : ''}, {vendor?.vendor?.homebase_address ? vendor?.vendor?.homebase_address.country : ''}
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2 pr-[20px]">
                                                                    <Switch
                                                                        checked={!!vendor.status}
                                                                        onCheckedChange={async (checked) => {
                                                                            await handleUpdateVendorStatus(vendor.uuid || '', checked, currentService.uuid);
                                                                        }}
                                                                        className={`${vendor.status ? "!bg-[#6BAE41]" : "!bg-[#E06D5E]"} data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
                                                                    />
                                                                    <DropdownActions options={options} />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )} */}

                    </Accordion>
                </form>
            </div >
            <SaveModal
                isOpen={open}
                onClose={() => setOpen(false)}
                isLoading={isLoading}
                isSuccess={true}
                backLink="/dashboard/services"
                title='Services'
            />
        </div >
    );
}

export default ServicesFrom