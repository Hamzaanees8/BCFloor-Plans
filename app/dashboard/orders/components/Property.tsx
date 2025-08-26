import { Get } from '@/app/dashboard/agents/agents';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Agent } from '../../../../components/AgentTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ArrowDown, ArrowUp, DropDownArrow, EditIcon3 } from '../../../../components/Icons';
import { Check, Plus } from 'lucide-react';
import AddAgentDialog from './AddAgentDialog';
import { Listings } from '@/app/dashboard/listings/page';
import { GetListing } from '@/app/dashboard/listings/listing';
import { Country, State } from "country-state-city";
import { GetOneListing } from "../../listings/listing"
//import AddListingDialog from './AddListingDialog';
import { useOrderContext } from '../context/OrderContext';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CreateListings, EditListings } from '../orders';
import { useAppContext } from '@/app/context/AppContext';
interface Order {
    id: number;
    uuid: string;
    amount: string;
    distance: string;
    km_price: string;
    est_time: string;
    order_status: 'Processing' | 'In Progress' | 'Pending' | 'Completed' | 'Cancelled' | 'On Hold';
    payment_status: 'PAID' | 'UNPAID';
    property_address: string;
    property_location: string;
    vendor_address: string;
    vendor_location: string;
    created_at: string;
    updated_at: string;
    services?: {
        amount: string;
        service: {
            name: string;
        };
    }[];
}
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
    orders?: Order[];
};
const Property = () => {
    const {
        selectedAgentId,
        setSelectedAgentId,
        selectedListingId,
        setSelectedListingId,
    } = useOrderContext();
    const { userType } = useAppContext()
    const [agentData, setAgentData] = useState<Agent[]>([]);
    const [listingData, setListingData] = useState<Listings[]>([]);
    const [isEditingAgent, setIsEditingAgent] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [listingSearchValue, setListingSearchValue] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    //const [isEditingListing, setIsEditingListing] = useState(false);
    const selectedAgent = useMemo(() => {
        return agentData.find((agent) => agent.uuid === selectedAgentId) || null;
    }, [agentData, selectedAgentId]);
    const selectedListing = useMemo(() => {
        return listingData.find((listing) => listing.uuid === selectedListingId) || null;
    }, [listingData, selectedListingId]);
    const [openAddAgentDialog, setOpenAddAgentDialog] = useState(false);
    const [openAddListingDialog, setOpenAddListingDialog] = useState(false);
    const [openListing, setOpenListing] = useState(false);
    const [openAgent, setOpenAgent] = useState(false);
    const fetchAgents = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        Get(token)
            .then((data) => {
                const allAgents = Array.isArray(data.data) ? data.data : [];

                // ✅ Only include agents where status is true
                const filteredAgents = allAgents.filter((agent: Agent) => agent.status === true);

                setAgentData(filteredAgents);
            })
            .catch((err) => console.log("Error fetching data:", err.message));
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const fetchListings = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.');
            return;
        }

        GetListing(token)
            .then(data => {
                const allListings = Array.isArray(data.data) ? data.data : [];

                // ✅ Only keep listings with status !== false (i.e., true or undefined)
                const filteredListings = allListings.filter((listing: Listings) => listing.status !== false);

                setListingData(filteredListings);
            })
            .catch(err => console.log(err.message));
    }, []);
    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

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
    const [googleSuggestions, setGoogleSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [agent, setAgent] = useState<{ uuid: string; first_name: string; last_name: string; email: string; created_at: string }[]>([]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '');

    useEffect(() => {
        if (userType === 'agent') {
            setSelectedAgentId(userInfo.uuid)
        }
    }, [userInfo, setSelectedAgentId, userType])

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
        if (openListing) { setOpenAddListingDialog(false) }
    }, [openListing])
    useEffect(() => {
        if (country) {
            setStates(State.getStatesOfCountry(country));
            setProvince("");
        }
    }, [country]);
    useEffect(() => {
        if (openAddListingDialog && !currentListing?.uuid) {
            resetForm();
            setCurrentListing(null);
        }
    }, [openAddListingDialog, currentListing?.uuid]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (openAddListingDialog && selectedListingId) {
            GetOneListing(token, selectedListingId)
                .then(data => setCurrentListing(data.data))
                .catch(err => console.log(err.message));
        } else {
            console.log('Agent ID is undefined.');
        }
    }, [selectedListingId, openAddListingDialog]);
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
                year_constructed: Number(yearConstructed || 1801),
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
            // const cleanedPayload = {
            //     ...payload,
            //     ...(payload.year_constructed === 0 && { year_constructed: undefined }),
            // };
            if (currentListing?.uuid) {
                // Add _method: 'PUT' to payload for method override
                const updatedPayload = { ...payload, _method: 'PUT' };
                await EditListings(currentListing.uuid, updatedPayload, token);
                toast.success('Listing updated successfully');
                resetForm();
                // setIsLoading(true)
                // setOpenSaveDialog(true)
                // setIsLoading(false)
                setOpenAddListingDialog(false);
                //setOpenSaveDialog(false)
                fetchListings();
            } else {
                await CreateListings(payload, token);
                toast.success('Listing created successfully');
                resetForm();
                // setIsLoading(true)
                // setOpenSaveDialog(true)
                // setIsLoading(false)
                setOpenAddListingDialog(false);
                //setOpenSaveDialog(false)
                fetchListings();
            }

        } catch (error) {
            console.log('Raw error:', error);
            // setIsLoading(false)
            // setOpenSaveDialog(false)
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
                toast.error('Failed to submit listing data');
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
    const filteredAgents = useMemo(() => {
        const keyword = searchValue.trim().toLowerCase();

        if (keyword === "") return agentData;

        return agentData.filter((agent) => {
            const fullName = `${agent.first_name} ${agent.last_name} – ${agent.company_name}`.toLowerCase();
            return fullName.includes(keyword);
        });
    }, [searchValue, agentData]);
    const filteredListings = useMemo(() => {
        const keyword = listingSearchValue.trim().toLowerCase();

        if (keyword === "") return listingData;

        return listingData.filter((listing) => {
            const label = `${listing.address}, ${listing.city}`.toLowerCase();
            return label.includes(keyword);
        });
    }, [listingSearchValue, listingData]);
    const fetchGoogleSuggestions = (input: string) => {
        if (!input) return setGoogleSuggestions([]);

        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions({ input }, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                setGoogleSuggestions(predictions || []);
            } else {
                setGoogleSuggestions([]);
            }
        });
    };

    const handleGooglePlaceSelect = (placeId: string) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ placeId }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
                const place = results[0];
                const components = place.address_components;
                console.log('components', components)
                const getLong = (types: string[]) =>
                    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name || '';
                const postalCode = components.find((c) =>
                    c.types.includes('postal_code')
                )?.long_name || '';
                const getShort = (types: string[]) =>
                    components.find((c) => types.some((t) => c.types.includes(t)))?.short_name || '';
                const provinceComponent = components.find(c => c.types.includes('administrative_area_level_1'));
                const provinceIsoCode = provinceComponent?.short_name || '';

                console.log('Province ISO code:', provinceIsoCode);
                setProvince(provinceIsoCode)
                setAddress(place.formatted_address);
                setPostalCode(postalCode);
                setCity(getLong(['locality']) || getLong(['sublocality']));
                //setProvince(getShort(['administrative_area_level_1'])); // ✅ ISO CODE HERE
                setCountry(getShort(['country']) || 'CA');

                setOpenListing(false);
                setListingSearchValue("");
            } else {
                console.error('Geocoder failed:', status);
            }
        });
    };
    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    console.log('selectedAgentId', selectedAgentId);

    return (
        <div className='pt-7 pl-[257px] pr-[211px] pb-[80px] font-alexandria'>
            <div className='py-[10px] pl-[10px] flex flex-col gap-[30px]'>
                <div className='flex flex-col gap-[14px]'>
                    <p className='text-[14px] font-[400] text-[#424242]'>Agent <span className="text-red-500">*</span></p>
                    <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-4'>
                            <Popover open={openAgent} onOpenChange={setOpenAgent}>
                                <PopoverTrigger asChild>
                                    <button
                                        className={cn(
                                            "w-[432px] h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] px-3 flex items-center justify-between rounded-md",
                                            !selectedAgent && "text-muted-foreground"
                                        )}
                                    >
                                        {userType === 'agent' && userInfo ? (
                                            <span className='font-normal text-base text-[#666666]'>
                                                {userInfo.first_name} {userInfo.last_name} – {userInfo.company_name}
                                            </span>
                                        ) : selectedAgent ? (
                                            <span className='font-normal text-base text-[#666666]'>
                                                {selectedAgent.first_name} {selectedAgent.last_name} – {selectedAgent.company_name}
                                            </span>
                                        ) : (
                                            "Select Agent"
                                        )}
                                        {userType === 'admin' && <DropDownArrow />}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[432px] p-0">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search agent..."
                                            value={searchValue}
                                            onValueChange={(value) => {
                                                setSearchValue(value);
                                            }}
                                            className="h-9 font-normal text-base text-[#666666]"
                                        />

                                        <CommandList>
                                            <CommandGroup>
                                                {(userType === 'admin' ? filteredAgents : [userInfo].filter(Boolean)).length > 0 ? (
                                                    (userType === 'admin' ? filteredAgents : [userInfo]).map((agent) => (
                                                        <CommandItem
                                                            key={agent.uuid}
                                                            onSelect={() => {
                                                                setSelectedAgentId(agent.uuid || "");
                                                                setOpenAgent(false);
                                                                setSearchValue("");
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "h-4 w-4 mr-2",
                                                                    selectedAgentId === agent.uuid ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {agent.first_name} {agent.last_name} – {agent.company_name}
                                                        </CommandItem>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-muted-foreground">
                                                        {userType === 'admin' ? 'No agents found.' : 'No agent information available.'}
                                                    </div>
                                                )}
                                            </CommandGroup>
                                        </CommandList>

                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <div
                                className={`cursor-pointer ${!selectedAgentId ? 'pointer-events-none opacity-50' : ''}`}
                                onClick={() => {
                                    if (!selectedAgentId) return;
                                    setIsEditingAgent(true);
                                    setOpenAddAgentDialog(true);
                                }}
                            >
                                <EditIcon3 />
                            </div>
                        </div>
                        <div className={`${userType == 'admin' ? 'flex' : 'hidden'}  items-center gap-x-[3px] cursor-pointer`} onClick={() => {
                            setIsEditingAgent(false);
                            setOpenAddAgentDialog(true);
                            setSelectedAgentId(null);
                        }}>
                            <Plus className='w-[12px] h-[12px] bg-[#1E6FCC] text-white' />
                            <p className='text-[10px] font-semibold font-raleway text-[#1E6FCC]'>Create New Agent</p>
                        </div>
                        <AddAgentDialog
                            open={openAddAgentDialog}
                            setOpen={setOpenAddAgentDialog}
                            uuid={isEditingAgent ? selectedAgent?.uuid : null}
                            onSuccess={() => {
                                fetchAgents();
                            }}
                        />
                    </div>
                    {userType === 'agent' && userInfo ? (
                        <div className='flex flex-col'>
                            <p className={`${userType}-text font-[400] text-[20px]`}>
                                {userInfo.first_name} {userInfo.last_name}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {userInfo.company_name}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {userInfo.email}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {userInfo.primary_phone}
                            </p>
                        </div>
                    ) : selectedAgent && (
                        <div className='flex flex-col'>
                            <p className={`${userType}-text font-[400] text-[20px]`}>
                                {selectedAgent.first_name} {selectedAgent.last_name}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {selectedAgent.company_name}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {selectedAgent.email}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {selectedAgent.primary_phone}
                            </p>
                        </div>
                    )}
                </div>
                <div className='flex flex-col gap-[14px]'>
                    <p className='text-[14px] font-[400] text-[#424242]'>Listing <span className="text-red-500">*</span></p>
                    <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-4'>
                            <Popover open={openListing} onOpenChange={setOpenListing}>
                                <PopoverTrigger asChild>
                                    <button
                                        className={cn(
                                            "w-[432px] h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] px-3 flex items-center justify-between rounded-md",
                                            !selectedListing && "text-muted-foreground"
                                        )}
                                    >
                                        {selectedListing ? (
                                            <span className='font-normal text-base text-[#666666]'>
                                                {selectedListing.address}, {selectedListing.city}
                                            </span>
                                        ) : (
                                            "Select Listing"
                                        )}
                                        <DropDownArrow />
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent className="w-[432px] p-0">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search listing..."
                                            value={listingSearchValue}
                                            onValueChange={(val) => {
                                                setListingSearchValue(val);
                                                fetchGoogleSuggestions(val); // Custom function
                                            }}
                                            className="h-9"
                                        />

                                        <CommandList>
                                            <CommandGroup>
                                                {filteredListings.length > 0 ? (
                                                    filteredListings.map((listing) => (
                                                        <CommandItem
                                                            key={listing.uuid}
                                                            onSelect={() => {
                                                                setSelectedListingId(listing.uuid);
                                                                setOpenListing(false);
                                                                setListingSearchValue("");
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedListingId === listing.uuid ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {listing.address}, {listing.city}
                                                        </CommandItem>
                                                    ))
                                                ) : (
                                                    googleSuggestions.map((suggestion) => (
                                                        <CommandItem
                                                            key={suggestion.place_id}
                                                            onSelect={() => {
                                                                setSelectedListingId(null)
                                                                handleGooglePlaceSelect(suggestion.place_id);
                                                                setOpenAddListingDialog(true);
                                                                setCurrentListing(null)
                                                            }}

                                                            className="cursor-pointer"
                                                        >
                                                            {/* Spacer where the checkmark would go, to align with internal listings */}
                                                            <span className="mr-2 h-4 w-4 inline-block" />

                                                            <span className="text-black font-normal text-sm">
                                                                {suggestion.description}
                                                            </span>
                                                        </CommandItem>
                                                    ))

                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>


                            <div
                                className={`cursor-pointer ${!selectedListingId ? 'pointer-events-none opacity-50' : ''}`}
                                onClick={() => {
                                    if (!selectedListingId) return;
                                    //setIsEditingListing(true);
                                    setOpenAddListingDialog(true);
                                }}
                            >
                                <EditIcon3 />
                            </div>

                        </div>
                        <div className={`${userType == 'admin' ? 'flex' : 'hidden'} items-center gap-x-[3px] cursor-pointer`} onClick={() => {
                            //setIsEditingListing(false);
                            setOpenAddListingDialog(true);
                            setSelectedListingId(null);
                            setCurrentListing(null);
                        }}>
                            <Plus className='w-[12px] h-[12px] bg-[#1E6FCC] text-white' />
                            <p className='text-[10px] font-semibold font-raleway text-[#1E6FCC]'>Create New Listing</p>
                        </div>
                        {/* <AddListingDialog
                            open={openAddListingDialog}
                            setOpen={setOpenAddListingDialog}
                            uuid={isEditingListing ? selectedListing?.uuid : null}
                            onSuccess={() => {
                                fetchListings();
                            }}
                        /> */}
                    </div>
                    {selectedListing && !openAddListingDialog && (
                        <div className='flex flex-col'>
                            <p className={`${userType}-text font-[400] text-[20px]`}>
                                {selectedListing.address}, {selectedListing.city}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {selectedListing.agent.first_name} {selectedListing.agent.last_name}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {selectedListing.agent.email}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                {selectedListing.agent.primary_phone}
                            </p>
                            <p className='text-[#666666] font-[400] text-[16px]'>
                                Est. {selectedListing.square_footage}ft<sup>2</sup>
                            </p>
                        </div>
                    )}
                    {openAddListingDialog && (
                        <div className='w-full flex flex-col items-center'>
                            <h1 className='text-[#4290E9] font-[500] text-[25px] py-4'>{currentListing?.uuid ? "Edit Listing" : "Create New Listing"}</h1>
                            <div className='w-full  py-[16px] px-0 md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                <div className='grid grid-cols-4 gap-[16px]'>
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
                                        <div className="col-span-4 relative" ref={wrapperRef}>
                                            <label htmlFor="">
                                                Address <span className="text-red-500">*</span>
                                            </label>

                                            {/* Address input */}
                                            <input
                                                type="text"
                                                value={address}
                                                onChange={(e) => {
                                                    setAddress(e.target.value);
                                                    fetchGoogleSuggestions(e.target.value);
                                                    setIsDropdownOpen(true);
                                                }}
                                                placeholder="e.g 4445 Parker St"
                                                className="h-[42px] w-full bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] px-3 rounded"
                                                autoComplete="off"
                                            />

                                            {/* Dropdown suggestions */}
                                            {isDropdownOpen && googleSuggestions.length > 0 && (
                                                <div className="absolute z-50 bg-white border border-gray-300 mt-1 w-full max-h-60 overflow-auto">
                                                    {googleSuggestions.map((suggestion) => (
                                                        <div
                                                            key={suggestion.place_id}
                                                            onClick={() => {
                                                                handleGooglePlaceSelect(suggestion.place_id);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer !text-black !font-normal !text-sm"
                                                        >
                                                            {suggestion.description}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Error message */}
                                            {fieldErrors.address && (
                                                <p className="text-red-500 text-[10px]">{fieldErrors.address[0]}</p>
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
                                    <div className='col-span-2'>
                                        <label htmlFor="">Connected Agents</label>
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
                                        <label htmlFor="">MLS#</label>
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
                                        <label htmlFor="">Lot Size (Acres)</label>
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
                                        <label htmlFor="">Year Contstructed</label>
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
                                        <label htmlFor="">Property Type</label>
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
                                        <label htmlFor="">Property Status</label>
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
                                    <div className="col-span-4">
                                        <label htmlFor="">Heading</label>
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
                                    <div className="col-span-4">
                                        <label htmlFor="">Description</label>
                                        {/* <Input placeholder='Single Family Detached Starter Home' className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" /> */}
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="write some description of your listing"
                                            className="w-full resize-none h-[100px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                        />
                                        {fieldErrors.description && (
                                            <p className="text-red-500 text-[10px]">
                                                {fieldErrors.description[0]}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-4 border-b border-[#BBBBBB]">
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                                    <button onClick={() => { setOpenAddListingDialog(false) }}
                                        className="bg-white w-full md:w-[176px] h-[40px] text-[20px] rounded-sm font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={(e) => { handleSubmit(e) }}
                                        className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full rounded-sm md:w-[176px] h-[40px] font-[400] text-[20px]"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {(selectedListing?.orders?.length ?? 0) > 0 && (
                    <>
                        <p className="text-[14px] font-[400] text-[#424242]">Listing Order History</p>
                        <div className="flex flex-col bg-[#EEEEEE] rounded-[6px] gap-y-1.5 border border-[#BBBBBB]">

                            {selectedListing?.orders?.map((order, idx) => {
                                let statusColor = "";
                                switch (order.order_status) {
                                    case "Cancelled":
                                        statusColor = "bg-[#E06D5E]";
                                        break;
                                    case "Processing":
                                        statusColor = "bg-[#DC9600]";
                                        break;
                                    case "Completed":
                                        statusColor = "bg-[#6BAE41]";
                                        break;
                                    default:
                                        statusColor = "bg-[#BBBBBB]";
                                }
                                return (
                                    <div
                                        key={order.id ?? idx}
                                        className="px-4 py-3 grid grid-cols-5 text-[#666666] gap-[30px]"
                                    >
                                        <div className="flex flex-col ">
                                            <p className="text-[#4290E9] text-sm font-medium">
                                                Order #{order.id} -
                                            </p>
                                            <p className="text-[#A8A8A8] text-[10px] font-normal">
                                                {new Date(order.created_at).toLocaleDateString("en-US", {
                                                    year: "2-digit",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-[2px] text-[14px] font-normal col-span-2">
                                            {order.services?.map((s, i) => (
                                                <p key={i}>
                                                    {s.service?.name}
                                                    {s.option?.quantity ? ` (${s.option.quantity})` : ""}
                                                </p>
                                            ))}
                                        </div>
                                        <div className="text-[16px] font-medium">
                                            <p>Total:</p>
                                            <p>${parseFloat(order.amount).toFixed(2)}</p>
                                        </div>
                                        <div
                                            className={`text-white place-self-center inline-flex items-center justify-center text-[10px] font-normal px-2.5 py-[2px] h-[18px] max-w-[120px] rounded-[12px] uppercase ${statusColor}`}
                                        >
                                            {order.order_status}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Property