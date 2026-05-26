"use client";
import React, { useEffect, useRef, useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Order } from "../../orders/page";
import { useAppContext } from "@/app/context/AppContext";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface TourSettingProps {
    orderData: Order | null;
    setOrderData?: React.Dispatch<React.SetStateAction<Order | null>>;
    onRefresh?: () => Promise<void>;
}

const TourSettings = ({ orderData, setOrderData, onRefresh }: TourSettingProps) => {
    const { userType } = useAppContext()
    const [price, setprice] = useState<number>();
    const [bedrooms, setBedrooms] = useState<number>();
    const [bathrooms, setBathrooms] = useState<number>();
    const [propertySize, setPropertySize] = useState<number>();
    const [lotSize, setLotSize] = useState<string>("");
    const [parkingSpots, setParkingSpots] = useState<number>();
    const [year_constructed, setYear_constructed] = useState<number>();
    const [type, setType] = useState<string>();
    const [description, setDescription] = useState<string>();
    const [address, setAddress] = useState("");
    const [tourActivated, setTourActivated] = useState<boolean>(false);
    const [Activated, setActivated] = useState<boolean>(false);
    const [propertyWebsite, setPropertyWebsite] = useState("");
    const [mlsProperty, setMlsProperty] = useState("");
    const [saving, setSaving] = useState(false);
    const CompanyLogofileInputRef = useRef(null)
    const [CompanyLogofileName, setCompanyLogoFileName] = useState('')
    const [AvatarfileName, setAvatarFileName] = useState('')
    const [first_name, setfirst_name] = useState('')
    const [last_name, setlast_name] = useState('')
    const [email, setemail] = useState('')
    const [primary_phone, setprimary_phone] = useState('')
    const [company_name, setcompany_name] = useState('')
    const [avatar_url, setavatar_url] = useState('')
    const [company_logo_url, setcompany_logo_url] = useState('')

    const AvatarfileInputRef = useRef(null)
    // const [avatarFile, setAvatarFile] = useState<File | null>(null);
    // const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);


    useEffect(() => {
        if (orderData) {
            setAddress(orderData?.property_address)
            
            // Generate Tour Link for prefilling property website
            const slugify = (text: string) => {
                return text
                    .toString()
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, '-')     // Replace spaces with -
                    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
                    .replace(/--+/g, '-')      // Replace multiple - with single -
                    .replace(/^-+/, '')        // Trim - from start of text
                    .replace(/-+$/, '');       // Trim - from end of text
            };

            const mainUrl = window.location.origin;
            const tourUrl = `${mainUrl}/tour/${slugify(orderData?.property_address || "")}-${slugify(orderData?.property_location || "")}/${orderData?.uuid}`;

            setPropertyWebsite(orderData?.property?.property_website || tourUrl)
            setMlsProperty(orderData?.property?.mls_property ?? '')
            setprice(Number(orderData?.property?.listing_price))
            setPropertySize(Number(orderData?.property?.square_footage))
            setBedrooms(Number(orderData?.property?.bedrooms))
            setBathrooms(Number(orderData?.property?.bathrooms))
            setLotSize(orderData?.property?.lot_size ?? '')
            setParkingSpots(Number(orderData?.property?.parking_spots))
            setYear_constructed(Number(orderData?.property?.year_constructed))
            setType(orderData?.property?.property_type)
            setDescription(orderData?.property?.description)
            setfirst_name(orderData.agent.first_name)
            setlast_name(orderData.agent.last_name)
            setemail(orderData.agent.email)
            setprimary_phone(orderData.agent.primary_phone)
            setcompany_name(orderData.agent.company_name)
            setavatar_url(orderData.agent.avatar_url)
            setcompany_logo_url(orderData.agent.company_logo_url)
            setCompanyLogoFileName(orderData.agent.company_logo)
            setAvatarFileName(orderData.agent.avatar)
            setTourActivated(orderData.property?.tour_activated)

        }
    }, [orderData])


    const triggerFileInput = () => {
        if (AvatarfileInputRef.current) {
            (AvatarfileInputRef.current as HTMLInputElement).click()
        }
    }

    const triggerFileInput1 = () => {
        if (CompanyLogofileInputRef.current) {
            (CompanyLogofileInputRef.current as HTMLInputElement).click()
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderData?.property?.uuid) {
            toast.error("Property not found");
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            
            const response = await fetch(`${apiUrl}/orders/edit/properties/${orderData.property.uuid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    address,
                    mls_number: mlsProperty,
                    listing_price: price,
                    bedrooms,
                    bathrooms,
                    square_footage: propertySize,
                    lot_size: lotSize,
                    parking_spots: parkingSpots,
                    year_constructed,
                    property_type: type,
                    description,
                    city: orderData?.property?.city || "",
                    province: orderData?.property?.province || "",
                    country: orderData?.property?.country || "Canada",
                    tour_activated: tourActivated,
                })
            });

            const data = await response.json();

            if (response.ok && data.status) {
                toast.success("Property settings saved successfully");
                if (setOrderData && data.data) {
                    setOrderData((prev: any) => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            property_address: data.data.address,
                            property_location: `${data.data.city}, ${data.data.province}`,
                            property: data.data
                        };
                    });
                }
                if (onRefresh) {
                    await onRefresh();
                }
            } else {
                const errorMsg = data.message || "Failed to save property settings";
                toast.error(errorMsg);
            }
        } catch (err: any) {
            console.error("Save error:", err);
            toast.error(err.message || "An unexpected error occurred while saving");
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="font-alexandria">
            <div>
                <form onSubmit={handleSave}>
                    <Accordion
                        type="multiple"
                        defaultValue={["property", "additional", "statistics"]}
                        className="w-full space-y-4"
                    >
                        <AccordionItem value="property">
                            <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                                General Information
                            </AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className="w-full flex flex-col items-center">
                                    <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                        <div className="grid grid-cols-2 gap-[16px]">
                                            {/* <div className='col-span-2'>
                                                <label htmlFor="">Connected Agents </label>
                                                <Select value={connectedAgent} onValueChange={(val) => setConnectedAgent(val)}>
                                                <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                                                    <SelectValue placeholder="Select Agent" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {agent?.map((ag) => (
                                                    <SelectItem key={ag.uuid} value={ag.uuid}>
                                                        {ag.first_name} {ag.last_name}
                                                    </SelectItem>
                                                    ))}
                                                </SelectContent>
                                                </Select>

                                                {fieldErrors.agent_id && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.agent_id[0]}</p>}
                                            </div> */}
                                            <div className="col-span-2 flex items-center gap-[16px]">
                                                <Switch
                                                    checked={tourActivated}
                                                    onCheckedChange={setTourActivated}
                                                    className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#4CAF50] "
                                                />
                                                <Label className="text-[14px] text-[#424242]">
                                                    Activate Tour
                                                </Label>
                                            </div>
                                            <div className="col-span-2">
                                                <label htmlFor="">Address</label>
                                                <Input
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="Enter Address"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label>Property Website</Label>
                                                <div className="relative w-full ">
                                                    <Input
                                                        value={propertyWebsite}
                                                        disabled
                                                        type="text"
                                                        placeholder="company.bcfp.com/vendor/id=88392"
                                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(propertyWebsite);
                                                            toast.success("Link copied to clipboard");
                                                        }}
                                                        className="absolute right-3 top-1/2 translate-y-[20%] text-[#8E8E8E] hover:text-[#424242] transition-colors"
                                                        title="Copy to clipboard"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <Label>MLS Property</Label>
                                                <div className="relative w-full ">
                                                    <Input
                                                        value={mlsProperty}
                                                        onChange={(e) => setMlsProperty(e.target.value)}
                                                        type="text"
                                                        placeholder="company.bcfp.com/mls/id=88392"
                                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <Label>Matterport</Label>
                                                <div className="relative w-full ">
                                                    <Input
                                                        value={mlsProperty}
                                                        // onChange={(e) => setMlsProperty(e.target.value)}
                                                        type="text"
                                                        placeholder="company.bcfp.com/mls/id=88392"
                                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor="">Primary Color</label>
                                                <Input
                                                    // onChange={(e) => setMls(e.target.value)}

                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Secondary Color</label>
                                                <Input
                                                    // onChange={(e) => setMls(e.target.value)}

                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label htmlFor="">Priority Hosted Expiry</label>
                                                <Select >
                                                    <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                                                        <SelectValue placeholder="Select Priority Hosted Expiry" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="60 days" >
                                                            60 days starting on activation date
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2">
                                                <RadioGroup defaultValue="yes" className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="yes" id="yes" />
                                                        <Label htmlFor="yes">Auto-renew if property not sold</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="no" id="no" />
                                                        <Label htmlFor="no">Auto-bill on expiry if property not sold</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="additional">
                            <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                                Property Details
                            </AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className="w-full flex flex-col items-center">
                                    <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                        <div className="grid grid-cols-2 gap-[16px]">
                                            <div className="col-span-2 flex items-center gap-[16px]">
                                                <Switch
                                                    checked={Activated}
                                                    onCheckedChange={setActivated}
                                                    className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#4CAF50] "
                                                />
                                                <Label className="text-[14px] text-[#424242]">
                                                    Active
                                                </Label>
                                            </div>
                                            <div>
                                                <label htmlFor="">Price</label>
                                                <Input
                                                    value={price}
                                                    onChange={(e) => setprice(e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="Enter Price"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Beds</label>
                                                <Input
                                                    value={bedrooms}
                                                    onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="Enter Beds"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Baths</label>
                                                <Input
                                                    value={bathrooms}
                                                    onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="Enter Baths"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Property Size</label>
                                                <Input
                                                    value={propertySize}
                                                    onChange={(e) => setPropertySize(e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="Enter Property Size"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="">Lot Size</label>
                                                <Input
                                                    value={lotSize}
                                                    onChange={(e) => setLotSize(e.target.value)}
                                                    placeholder="Enter Lot Size"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="">Year Built</label>
                                                <Input
                                                    value={year_constructed}
                                                    onChange={(e) => setYear_constructed(e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="Enter Year Built"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />

                                            </div>

                                            <div>
                                                <label htmlFor="">Property Type</label>
                                                <Select
                                                    value={type}
                                                    onValueChange={(value) => setType(value)}
                                                >
                                                    <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                                                        <SelectValue placeholder="Select Property Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Detached Home">
                                                            Detached Home
                                                        </SelectItem>
                                                        <SelectItem value="Semi-Detached">
                                                            Semi-Detached
                                                        </SelectItem>
                                                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                                                        <SelectItem value="Condo">Condo</SelectItem>
                                                        <SelectItem value="Apartment">Apartment</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label htmlFor="">Parking Spots</label>
                                                <Input
                                                    value={parkingSpots}
                                                    onChange={(e) => setParkingSpots(e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="Enter Parking Spots"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label htmlFor="">Description</label>
                                                <Textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Description"
                                                    className="h-[200px] resize-none bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"

                                                />
                                            </div>

                                        </div>
                                    </div>

                                </div>

                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="statistics">
                            <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                                Contact Details
                            </AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className="w-full flex flex-col items-center">
                                    <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                        <div className="grid grid-cols-2 gap-[17px]">

                                            <p className="col-span-2">Agent</p>
                                            <div>
                                                <label htmlFor="">First Name</label>
                                                <Input
                                                    value={first_name}
                                                    placeholder="Enter First Name"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Last Name</label>
                                                <Input
                                                    value={last_name}
                                                    placeholder="Enter Last Name"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label htmlFor="">Company Name</label>
                                                <Input
                                                    placeholder="Enter Company Name"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                    value={company_name}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">License Number</label>
                                                <Input
                                                    placeholder="Enter License Number"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Website</label>
                                                <Input
                                                    placeholder="Enter Website"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div className='col-span-2 flex items-end gap-x-[6px]'>
                                                {avatar_url ?
                                                    <Image
                                                        unoptimized
                                                        src={avatar_url}
                                                        alt="Avatar"
                                                        width={64}
                                                        height={64}
                                                        className="h-16 w-16 object-cover border"
                                                    />
                                                    : <div className='w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]'></div>
                                                }
                                                <div className="flex-1">
                                                    <Label className="text-sm  text-gray-600">Avatar</Label>
                                                    <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                        <span className="bg-[#EEEEEE] max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden">{AvatarfileName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileInput}
                                                            className="px-4 bg-[#E4E4E4] text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                        >
                                                            Replace
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/png, image/jpeg"
                                                        ref={AvatarfileInputRef}
                                                        // onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[#6BAE41] ">
                                                Company logo 512 x 512, PNG or JPG
                                            </p>

                                        </div>
                                        <div className='flex flex-col gap-y-[6px]'>
                                            <div className='flex items-end gap-x-[6px]'>
                                                {company_logo_url ?
                                                    <Image
                                                        unoptimized
                                                        src={company_logo_url}
                                                        alt="Avatar"
                                                        width={64}
                                                        height={64}
                                                        className="h-16 w-16 object-cover border"
                                                    />
                                                    : <div className='w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]'></div>
                                                }
                                                <div className="flex-1">
                                                    <Label className="text-sm  text-gray-600">Company Logo</Label>
                                                    <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                        <span className="bg-[#EEEEEE] max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden">{CompanyLogofileName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileInput1}
                                                            className="px-4 bg-[#E4E4E4] text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                        >
                                                            Replace
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/png, image/jpeg"
                                                        ref={CompanyLogofileInputRef}
                                                        // onChange={handleFileChange1}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[#6BAE41] ">
                                                Company logo 512 x 512, PNG or JPG
                                            </p>

                                        </div>
                                        <div className='col-span-2'>
                                            <label htmlFor="">Email </label>
                                            <Input
                                                value={email}
                                                // onChange={(e) => setEmail(e.target.value)}
                                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="email" />

                                        </div>
                                        <div>
                                            <label htmlFor="">Phone Number </label>
                                            <Input
                                                value={primary_phone}
                                                // onChange={(e) => setPrimaryPhone(e.target.value)}
                                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                        </div>

                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <div className="w-full flex justify-center md:justify-end px-[10px] md:px-0 mt-6 pb-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full md:w-[180px] h-[45px] rounded-[6px] text-white font-medium text-[16px] transition-all hover:brightness-110 shadow disabled:opacity-50 ${
                                userType === 'admin' ? 'bg-[#4290E9]' : 'bg-[#6BAE41]'
                            }`}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div >
            {/* <SaveModal
                isOpen={open}
                onClose={() => setOpen(false)}
                isLoading={isLoading}
                isSuccess={true}
                backLink="/dashboard/listings"
                title="Listing"
            /> */}
        </div >
    );
};

export default TourSettings;
