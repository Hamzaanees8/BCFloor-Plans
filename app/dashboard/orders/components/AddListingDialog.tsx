// components/ConfirmationDialog.tsx
"use client"
import React, { useEffect, useState } from "react"
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
import { Input } from "../../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { toast } from "sonner"
import { SaveModal } from "../../../../components/SaveModal"
import { Country, State } from "country-state-city";
import { Textarea } from "@/components/ui/textarea"
import { CreateListings, EditListings, GetOneListing } from "../../listings/listing"
import { Get } from "../../agents/agents"
import { ArrowDown, ArrowUp } from "@/components/Icons"
type Listing = {
    uuid: string;
    mls_number: string;
    agent: { uuid: string, first_name: string, last_name: string, email: string, created_at: string, company_name: string, payment_status: string, notes: string, status?: boolean, permissions?: { id: number, name: string }[], roles?: { id: number, name: string }[], headquarter_address?: string, primary_phone?: string, secondary_phone?: string, avatar_url?: string, activity?: string },
    listing_price: number;
    bedrooms: number;
    bathrooms: number;
    square_footage?: number;
    lot_size?: number;
    year_constructed?: number;
    parking_spots?: number;
    property_type?: string;
    property_status?: string;
    heading?: string;
    description?: string;
    suite?: string | null;
    address?: string;
    city?: string;
    province: string;
    postal_code?: string;
    country?: string;
};

type Props = {
    type?: string;
    uuid?: string | null;
    open: boolean
    setOpen: (value: boolean) => void
    onSuccess: () => void;
}

const AddListingDialog: React.FC<Props> = ({
    open,
    setOpen,
    uuid,
    onSuccess,
    type
}) => {
    console.log('id', uuid);
    console.log('type', type)
    const [currentListing, setCurrentListing] = useState<Listing | null>(null);
    const [connectedAgent, setConnectedAgent] = useState("");
    const [listingPrice, setListingPrice] = useState("");
    const [mls, setMls] = useState("");
    const [bedrooms, setBedrooms] = useState<number | "">("");
    const [bathrooms, setBathrooms] = useState<number | "">("");
    const [suite, setSuite] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("CA");
    const [countries, setCountries] = useState<
        { name: string; isoCode: string }[]
    >([]);
    const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);
    const [squareFootage, setSquareFootage] = useState("");
    const [lotSize, setLotSize] = useState<string | "">("");
    const [yearConstructed, setYearConstructed] = useState("");
    const [parkingSpots, setParkingSpots] = useState("");
    const [propertyType, setPropertyType] = useState("");
    const [propertyStatus, setPropertyStatus] = useState("");
    const [heading, setHeading] = useState("");
    const [description, setDescription] = useState("");
    type Agent = { uuid: string; first_name: string; last_name: string; email: string; created_at: string };
    const [agent, setAgent] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    useEffect(() => {
        if (states.length && currentListing && currentListing?.province) {
            const match = states.find((s) => s.isoCode === currentListing.province);
            if (match) {
                setProvince(match.isoCode);
            }
        }
    }, [states, currentListing]);

    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    useEffect(() => {
        if (country) {
            setStates(State.getStatesOfCountry(country));
            setProvince("");
        }
    }, [country]);
    // console.log("DEBUG effect deps:", uuid, open);
    useEffect(() => {
        if (open && !uuid) {
            resetForm();
            setCurrentListing(null);
        }
    }, [open, uuid]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (open && uuid) {
            GetOneListing(token, uuid)
                .then(data => setCurrentListing(data.data))
                .catch(err => console.log(err.message));
        } else {
            console.log('Agent ID is undefined.');
        }
    }, [uuid, open]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (token) {
            Get(token)
                .then(data => setAgent(data.data))
                .catch(err => console.log(err.message));
        } else {
            console.log('User ID is undefined.');
        }
    }, []);
    console.log('current user', currentListing)
    useEffect(() => {
        if (currentListing) {
            setConnectedAgent(currentListing.agent.uuid);
            setListingPrice(currentListing.listing_price?.toString() || "");
            setMls(currentListing.mls_number || "");
            setBedrooms(currentListing.bedrooms ?? "");
            setBathrooms(currentListing.bathrooms ?? "");
            setSquareFootage(currentListing.square_footage?.toString() || "");
            setLotSize(currentListing.lot_size?.toString() || "");
            setYearConstructed(currentListing.year_constructed?.toString() || "");
            setParkingSpots(currentListing.parking_spots?.toString() || "");
            setPropertyType(currentListing.property_type || "");
            setPropertyStatus(currentListing.property_status || "");
            setHeading(currentListing.heading || "");
            setDescription(currentListing.description || "");
            setSuite(currentListing.suite || "");
            setAddress(currentListing.address || "");
            setCity(currentListing.city || "");
            setProvince(currentListing.province);
            setPostalCode(currentListing.postal_code || "");
            setCountry(currentListing.country || "CA");
        }
    }, [currentListing]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token') || '';
            const payload = {
                listing_price: Number(listingPrice),
                mls_number: mls,
                bedrooms: Number(bedrooms),
                bathrooms: Number(bathrooms),
                agent_id: connectedAgent,
                square_footage: Number(squareFootage),
                lot_size: lotSize,
                year_constructed: Number(yearConstructed),
                parking_spots: Number(parkingSpots),
                property_type: propertyType,
                property_status: propertyStatus,
                heading: heading,
                description: description,
                suite: suite,
                address: address,
                city: city,
                province: province,
                postal_code: postalCode,
                country: country,
            };

            if (uuid) {
                // Add _method: 'PUT' to payload for method override
                const updatedPayload = { ...payload, _method: 'PUT' };
                await EditListings(uuid, updatedPayload, token);
                toast.success('Listing updated successfully');
                resetForm();
                setIsLoading(true)
                setOpenSaveDialog(true)
                setIsLoading(false)
                setOpen(false);
                setOpenSaveDialog(false)
                if (onSuccess) onSuccess();
            } else {
                await CreateListings(payload, token);
                toast.success('Listing created successfully');
                resetForm();
                setIsLoading(true)
                setOpenSaveDialog(true)
                setIsLoading(false)
                setOpen(false);
                setOpenSaveDialog(false)
                if (onSuccess) onSuccess();
            }

        } catch (error) {
            console.log('Raw error:', error);
            setIsLoading(false)
            setOpenSaveDialog(false)
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

                // const firstError = Object.values(normalizedErrors).flat()[0];
                // toast.error(firstError || 'Validation error');
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit agent data');
            }
        }
    };
    const resetForm = () => {
        setConnectedAgent('');
        setListingPrice('');
        setMls('');
        setBedrooms('');
        setBathrooms('');
        setSquareFootage('');
        setLotSize('');
        setYearConstructed('');
        setParkingSpots('');
        setPropertyType('');
        setPropertyStatus('');
        setHeading('');
        setDescription('');
        setSuite('');
        setAddress('');
        setFieldErrors({});
        setCity('');
        setProvince('');
        setPostalCode('');
        setCountry('CA');
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[685px] max-w-none bg-[#E4E4E4] h-[650px] rounded-[8px] p-4 md:px-6 md:py-4 gap-[10px] font-alexandria overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center  border-b border-[#BBBBBB] uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
                        {uuid ? "Edit Agent" : "New Agent"}
                        <AlertDialogCancel className="border-none !shadow-none bg-[#E4E4E4]">
                            <X className="!w-[20px] !h-[20px] cursor-pointer  text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className='w-full flex flex-col items-center'>
                    <div className='w-full md:w-[620px] py-[16px] px-0 md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                        <div className='grid grid-cols-2 gap-[16px]'>
                            <div className='col-span-2'>
                                <label htmlFor="">Connected Agents <span className="text-red-500">*</span></label>
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
                            </div>
                            <div>
                                <label htmlFor="">Listing Price (CAD)</label>
                                <Input
                                    value={listingPrice}
                                    onChange={(e) => setListingPrice(e.target.value)}
                                    placeholder="e.g 844,500"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label htmlFor="">MLS# <span className="text-red-500">*</span></label>
                                <Input
                                    value={mls}
                                    onChange={(e) => setMls(e.target.value)}
                                    placeholder="e.g A2206608"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />

                                {fieldErrors.mls_number && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.mls_number[0]}
                                    </p>
                                )}
                            </div>
                            <div className="relative w-full">
                                <label htmlFor="bedroom" className="block text-sm font-normal">
                                    Bedrooms
                                </label>
                                <Input
                                    id="bedroom"
                                    type="number"
                                    placeholder="e.g 3"
                                    min={0}
                                    value={bedrooms === '' ? '' : bedrooms}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        if (value === '') {
                                            setBedrooms(''); // Allow clearing the input
                                            return;
                                        }

                                        const numeric = Number(value);
                                        if (!isNaN(numeric) && numeric >= 0) {
                                            setBedrooms(numeric); // Only valid numbers >= 0
                                        }
                                    }}
                                    className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />

                                <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                                    <button type="button" onClick={() => setBedrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) + 1))}><ArrowUp /></button>
                                    <button type="button" onClick={() => setBedrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) - 1))}><ArrowDown /></button>
                                </div>
                            </div>
                            <div className="relative w-full">
                                <label htmlFor="bathroom" className="block text-sm font-normal">
                                    Bathrooms
                                </label>
                                <Input
                                    id="bathroom"
                                    type="number"
                                    placeholder="e.g 2"
                                    min={0}
                                    value={bathrooms === '' ? '' : bathrooms}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        if (value === '') {
                                            setBathrooms(''); // Allow clearing the input
                                            return;
                                        }

                                        const numeric = Number(value);
                                        if (!isNaN(numeric) && numeric >= 0) {
                                            setBathrooms(numeric); // Only valid numbers >= 0
                                        }
                                    }}
                                    className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />

                                <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                                    <button type="button" onClick={() => setBathrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) + 1))}><ArrowUp /></button>
                                    <button type="button" onClick={() => setBathrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) - 1))}><ArrowDown /></button>
                                </div>
                            </div>
                            <div className="col-span-2 grid grid-cols-5 gap-x-[16px]">
                                <div>
                                    <label htmlFor="">Suite</label>
                                    <Input
                                        value={suite}
                                        onChange={(e) => setSuite(e.target.value)}
                                        placeholder=""
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                        type="text"
                                    />
                                </div>
                                <div className="col-span-4">
                                    <label htmlFor="">Address <span className="text-red-500">*</span></label>
                                    <Input
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="e.g 4445 Parker St"
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                        type="text"
                                    />
                                    {fieldErrors.address && (
                                        <p className="text-red-500 text-[10px]">
                                            {fieldErrors.address[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="">City <span className="text-red-500">*</span></label>
                                <Input
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="e.g Burnaby"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />
                                {fieldErrors.city && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.city[0]}
                                    </p>
                                )}
                            </div>
                            <div className="">
                                <label htmlFor="">Province <span className="text-red-500">*</span></label>
                                <Select
                                    value={province}
                                    onValueChange={(val) => setProvince(val)}
                                    disabled={!states.length}
                                >
                                    <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                                        <SelectValue placeholder="Select Province" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {states.map((s, i) => (
                                            <SelectItem key={i} value={s.isoCode}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldErrors.province && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.province[0]}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="">Postal Code <span className="text-red-500">*</span></label>
                                <Input
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    placeholder="e.g V5H 0H4"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />

                                {fieldErrors.postal_code && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.postal_code[0]}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="" className="whitespace-nowrap">
                                    Country (default Canada)
                                </label>
                                <Select
                                    value={country}
                                    onValueChange={(val) => setCountry(val)}
                                >
                                    <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((c, i) => (
                                            <SelectItem key={i} value={c.isoCode}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>{" "}
                            </div>
                            <div>
                                <label htmlFor="">Square Footage</label>
                                <Input
                                    value={squareFootage}
                                    onChange={(e) => setSquareFootage(e.target.value)}
                                    placeholder="e.g 2230 sq. ft."
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label htmlFor="">Lot Size (Acres) <span className="text-red-500">*</span></label>
                                <Input
                                    value={lotSize}
                                    onChange={(e) => setLotSize(e.target.value)}
                                    placeholder="e.g 0-4,050 sq. ft."
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />
                                {fieldErrors.lot_size && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.lot_size[0]}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="">Year Contstructed <span className="text-red-500">*</span></label>
                                <Input
                                    value={yearConstructed}
                                    onChange={(e) => setYearConstructed(e.target.value)}
                                    placeholder="e.g 2020"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />
                                {fieldErrors.year_constructed && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.year_constructed[0]}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="">Parking Spots</label>
                                <Input
                                    value={parkingSpots}
                                    onChange={(e) => setParkingSpots(e.target.value)}
                                    placeholder="e.g 3"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />
                            </div>
                            <div className="col-span-2">
                                <label htmlFor="">Property Type <span className="text-red-500">*</span></label>
                                <Select
                                    value={propertyType}
                                    onValueChange={(value) => setPropertyType(value)}
                                >
                                    <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
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
                                {fieldErrors.property_type && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.property_type[0]}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label htmlFor="">Property Status <span className="text-red-500">*</span></label>
                                <Select
                                    value={propertyStatus}
                                    onValueChange={(value) => setPropertyStatus(value)}
                                >
                                    <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                                        <SelectValue placeholder="Select Property Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Just listed">
                                            Just listed
                                        </SelectItem>
                                        <SelectItem value="Under contract">
                                            Under contract
                                        </SelectItem>
                                        <SelectItem value="Sold">Sold</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                                        <SelectItem value="Expired">
                                            ConExpireddo
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {fieldErrors.property_status && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.property_status[0]}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label htmlFor="">Heading <span className="text-red-500">*</span></label>
                                <Input
                                    value={heading}
                                    onChange={(e) => setHeading(e.target.value)}
                                    placeholder="e.g Single Family Detached Starter Home"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                    type="text"
                                />
                                {fieldErrors.heading && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.heading[0]}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label htmlFor="">Description <span className="text-red-500">*</span></label>
                                {/* <Input placeholder='Single Family Detached Starter Home' className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" /> */}
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="write some description of your listing"
                                    className="w-full resize-none h-[200px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                />
                                {fieldErrors.description && (
                                    <p className="text-red-500 text-[10px]">
                                        {fieldErrors.description[0]}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-2 border-b border-[#BBBBBB]">
                            </div>
                        </div>
                        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                            <AlertDialogCancel className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => { handleSubmit(e) }}
                                className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[176px] h-[44px] font-[400] text-[20px]"
                            >
                                Save
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </div>
                <SaveModal
                    isOpen={openSaveDialog}
                    onClose={() => setOpenSaveDialog(false)}
                    isLoading={isLoading}
                    isSuccess={true}
                />
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default AddListingDialog
