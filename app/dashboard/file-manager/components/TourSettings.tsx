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

interface TourSettingProps {
    orderData: Order | null
}

const TourSettings = ({ orderData }: TourSettingProps) => {
    const { userType } = useAppContext()
    const [price, setprice] = useState<number>();
    const [bedrooms, setBedrooms] = useState<number>();
    const [bathrooms, setBathrooms] = useState<number>();
    const [propertySize, setPropertySize] = useState<number>();
    const [lotSize, setLotSize] = useState<number>();
    const [year_constructed, setYear_constructed] = useState<number>();
    const [type, setType] = useState<string>();
    const [description, setDescription] = useState<string>();
    const [address, setAddress] = useState("");
    const [tourActivated, setTourActivated] = useState<boolean>(false);
    const [Activated, setActivated] = useState<boolean>(false);
    const [propertyWebsite, setPropertyWebsite] = useState("");
    const [mlsProperty, setMlsProperty] = useState("");
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

    console.log('orderData', orderData);

    useEffect(() => {
        if (orderData) {
            setAddress(orderData?.property_address)
            setPropertyWebsite(orderData?.property?.property_website ?? '')
            setMlsProperty(orderData?.property?.mls_property ?? '')
            setprice(Number(orderData?.property?.listing_price))
            setPropertySize(Number(orderData?.property?.square_footage))
            setBedrooms(Number(orderData?.property?.bedrooms))
            setBathrooms(Number(orderData?.property?.bathrooms))
            setLotSize(Number(orderData?.property?.lot_size))
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

    // const router = useRouter();
    // const params = useParams();
    // const listingId = params?.id as string;
    // useEffect(() => {
    //     const token = localStorage.getItem("token");

    //     if (!token) {
    //         console.log('Token not found.')
    //         return;
    //     }

    //     if (token) {
    //         Get(token)
    //             .then(data => setAgent(data.data))
    //             .catch(err => console.log(err.message));
    //     } else {
    //         console.log('User ID is undefined.');
    //     }
    // }, []);
    // useEffect(() => {
    //     const token = localStorage.getItem("token");

    //     if (!token) {
    //         console.log("Token not found.");
    //         return;
    //     }

    //     if (listingId) {
    //         GetOneListing(token, listingId)
    //             .then((res) => {
    //                 const data = res.data;
    //                 console.log("data.province", data.province);

    //                 if (data) {
    //                     setCurrentListing(data);
    //                     setConnectedAgent(data.agent.uuid);
    //                     setListingPrice(data.listing_price?.toString() || "");
    //                     setMls(data.mls_number || "");
    //                     setBedrooms(data.bedrooms ?? "");
    //                     setBathrooms(data.bathrooms ?? "");
    //                     setSquareFootage(data.square_footage?.toString() || "");
    //                     setLotSize(data.lot_size?.toString() || "");
    //                     setYearConstructed(data.year_constructed?.toString() || "");
    //                     setParkingSpots(data.parking_spots?.toString() || "");
    //                     setPropertyType(data.property_type || "");
    //                     setPropertyStatus(data.property_status || "");
    //                     setHeading(data.heading || "");
    //                     setDescription(data.description || "");
    //                     setSuite(data.suite || "");
    //                     setAddress(data.address || "");
    //                     setCity(data.city || "");
    //                     // setProvince(data.province);
    //                     setPostalCode(data.postal_code || "");
    //                     setCountry(data.country || "CA");
    //                     setTourActivated(!!data.tour_activated);
    //                     setPublishDate(
    //                         typeof data.publish_date === "string"
    //                             ? data.publish_date.split(" ")[0]
    //                             : ""
    //                     );
    //                     setPropertyWebsite(data.property_website || "");
    //                     setMlsProperty(data.mls_property || "");
    //                     setOccupancy(data.occupancy || "");
    //                     setMediaCreatorAccess(data.media_creator_access || "");
    //                     setInstructions(data.instructions || "");
    //                     setAnimalsOnProperty(!!data.animals_on_property);
    //                     setCoAgents(data.co_agents || []);
    //                     setIsStaticmail(!!data.send_statistics_email);
    //                     setEmailFrequency(data.statistics_email_frequency || "");
    //                     setstaticEmail(data.statistics_email_recipients || []);
    //                 }
    //             })
    //             .catch((err) => console.log(err.message));
    //     } else {
    //         console.log("Listing ID is undefined.");
    //     }
    // }, [listingId]);

    // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0]
    //     if (file) {
    //         setAvatarFile(file);
    //         setAvatarFileName(file.name)
    //         setAvatarUrl(URL.createObjectURL(file))
    //     }
    // }

    const triggerFileInput = () => {
        if (AvatarfileInputRef.current) {
            (AvatarfileInputRef.current as HTMLInputElement).click()
        }
    }

    // const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0]
    //     if (file) {
    //         setCompanyLogoFile(file)
    //         setCompanyLogoFileName(file.name)
    //         setCompanyLogoUrl(URL.createObjectURL(file))
    //     }
    // }

    const triggerFileInput1 = () => {
        if (CompanyLogofileInputRef.current) {
            (CompanyLogofileInputRef.current as HTMLInputElement).click()
        }
    }


    return (
        <div className="font-alexandria">
            <div>
                <form
                >
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
                                                    // onChange={(e) => setAddress(e.target.value)}
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
                                                        // onChange={(e) => setPropertyWebsite(e.target.value)}
                                                        type="text"
                                                        placeholder="company.bcfp.com/vendor/id=88392"
                                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    />

                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <Label>MLS Property</Label>
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
                                                    // onChange={(e) => setParkingSpots(e.target.value)}
                                                    placeholder="Enter Price"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Beds</label>
                                                <Input
                                                    value={bedrooms}
                                                    // onChange={(e) => setParkingSpots(e.target.value)}
                                                    placeholder="Enter Beds"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Baths</label>
                                                <Input
                                                    value={bathrooms}
                                                    // onChange={(e) => setParkingSpots(e.target.value)}
                                                    placeholder="Enter Baths"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Property Size</label>
                                                <Input
                                                    value={propertySize}
                                                    // onChange={(e) => setParkingSpots(e.target.value)}
                                                    placeholder="Enter Property Size"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="">Lot Size</label>
                                                <Input
                                                    value={lotSize}
                                                    // onChange={(e) => setParkingSpots(e.target.value)}
                                                    placeholder="Enter Lot Size"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="">Year Built</label>
                                                <Input
                                                    value={year_constructed}
                                                    // onChange={(e) => setCity(e.target.value)}
                                                    placeholder="Enter Year Built"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />

                                            </div>

                                            <div>
                                                <label htmlFor="">Type</label>
                                                <Input
                                                    value={type}
                                                    // onChange={(e) => setPostalCode(e.target.value)}
                                                    placeholder="Enter Type"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="">Lot Size</label>
                                                <Input
                                                    value={lotSize}
                                                    // onChange={(e) => setPostalCode(e.target.value)}
                                                    placeholder="Enter Lot Size"
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    type="text"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label htmlFor="">Description</label>
                                                <Textarea
                                                    value={description}
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
