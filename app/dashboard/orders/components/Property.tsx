import { Get } from '@/app/dashboard/agents/agents';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Agent } from '@/lib/types';

import { ArrowDown, ArrowUp, DropDownArrow, EditIcon3 } from '../../../../components/Icons';
import { Check, Plus, Loader2 } from 'lucide-react';
import AddAgentDialog from './AddAgentDialog';
import { Listings } from '@/lib/types';
import { GetListing } from '@/app/dashboard/listings/listing';
import { Country, State } from "country-state-city";
import { GetOneListing, fetchMlsData } from "../../listings/listing"
//import AddListingDialog from './AddListingDialog';
import { useOrderContext } from '../context/OrderContext';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { EditListings, GetServices, GetVendors, Get as GetOrders } from '../orders';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GooglePlacesAutocomplete from '../../calendar/components/AutoCompleteInput';
import { SearchableSelect } from './SearchableSelect';
import ConfirmationDialog from '@/components/ConfirmationDialog';

declare global {
    interface Window {
        google: typeof google;
    }
}
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
const Property = ({ onSetActiveTab }: { onSetActiveTab?: (tab: string) => void }) => {
    const {
        selectedAgentId,
        setSelectedAgentId,
        selectedListingId,
        setSelectedListingId,
        setSelectedCurrentListing,
        setAgentsData,
        setListingsData,
        setServicesData,
        setVendorsData,
        setOrdersData,
        tempPropertyData,
        setTempPropertyData,
        setIsPropertyValid,
        clearSelections,
        selectedServices,
        selectedSlots,
        agentNotes,
        coAgents,
    } = useOrderContext();
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string)?.toLowerCase() || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    // const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;
    const fieldBg = `color-mix(in srgb, ${roleSettings.pageBg} 95%, black)`;
    // Using context data directly where possible, but keeping local state for immediate UI responsiveness if needed 
    // or just synchronizing them. For now, let's keep local states and sync them to context.
    const [agentData, setAgentData] = useState<Agent[]>([]);
    const [agent, setAgent] = useState<{ uuid: string; first_name: string; last_name: string; email: string; created_at: string }[]>([]);
    const [listingData, setListingData] = useState<Listings[]>([]);
    const [searchValue, setSearchValue] = useState("");
    const [listingSearchValue, setListingSearchValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    //const [isEditingListing, setIsEditingListing] = useState(false);
    const selectedAgent = useMemo(() => {
        return agentData.find((agent) => agent.uuid === selectedAgentId) || null;
    }, [agentData, selectedAgentId]);
    const selectedListing = useMemo(() => {
        return listingData.find((listing) => listing.uuid === selectedListingId) || null;
    }, [listingData, selectedListingId]);
    const [openAddAgentDialog, setOpenAddAgentDialog] = useState(false);
    const [isEditingAgent, setIsEditingAgent] = useState(false);
    const [openAddListingDialog, setOpenAddListingDialog] = useState(!selectedListingId);
    const [openListing, setOpenListing] = useState(false);
    const [openAgent, setOpenAgent] = useState(false);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingListingId, setPendingListingId] = useState<string | null | 'NEW'>(null);
    const [showAgain, setShowAgain] = useState(true);

    const [isAgentConfirmOpen, setIsAgentConfirmOpen] = useState(false);
    const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);
    const [agentShowAgain, setAgentShowAgain] = useState(true);

    const hasSelections = useCallback(() => {
        return (selectedServices?.length ?? 0) > 0 ||
            (selectedSlots?.length ?? 0) > 0 ||
            (agentNotes?.length ?? 0) > 0 ||
            (coAgents?.length ?? 0) > 0;
    }, [selectedServices, selectedSlots, agentNotes, coAgents]);

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

    const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);
    const [squareFootage, setSquareFootage] = useState("");
    const [lotSize, setLotSize] = useState<string | "">("");
    const [yearConstructed, setYearConstructed] = useState("");
    const [parkingSpots, setParkingSpots] = useState("");
    const [propertyType, setPropertyType] = useState("");
    const [propertyStatus, setPropertyStatus] = useState("");
    const [heading, setHeading] = useState("");
    const [description, setDescription] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [duplicateListing, setDuplicateListing] = useState<Listings | null>(null);

    const resetForm = useCallback(() => {
        setConnectedAgent(selectedAgentId || '');
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
    }, [selectedAgentId]);

    const proceedWithListingChange = useCallback((id: string | null | 'NEW') => {
        clearSelections();
        if (id === 'NEW') {
            setConnectedAgent(selectedAgentId || '');
            resetForm();
            setSelectedListingId(null);
            setCurrentListing(null);
            setTempPropertyData(null); // Explicitly clear temp data in this tick
            setOpenAddListingDialog(true);
            setOpenListing(false);
            setListingSearchValue("");
        } else {
            setSelectedListingId(id);
            setOpenListing(false);
            setOpenAddListingDialog(false);
            setListingSearchValue("");
        }
    }, [clearSelections, setSelectedListingId, resetForm, selectedAgentId, setTempPropertyData]);

    const proceedWithAgentChange = useCallback((id: string | null) => {
        clearSelections();
        setSelectedListingId(null);
        setCurrentListing(null);
        resetForm();
        setSelectedAgentId(id || "");
        setOpenAgent(false);
        setSearchValue("");
        if (!id) {
            setOpenAddAgentDialog(true);
        }
    }, [clearSelections, setSelectedListingId, resetForm, setSelectedAgentId]);

    const handleAgentSelect = useCallback((id: string | null) => {
        if (id === selectedAgentId) {
            setOpenAgent(false);
            return;
        }

        if (selectedListingId || hasSelections()) {
            setPendingAgentId(id);
            setIsAgentConfirmOpen(true);
        } else {
            proceedWithAgentChange(id);
        }
    }, [hasSelections, proceedWithAgentChange, selectedAgentId, selectedListingId]);

    const handleListingSelect = useCallback((id: string | null | 'NEW') => {
        if (id !== 'NEW' && id === selectedListingId) {
            setOpenListing(false);
            return;
        }

        if (hasSelections()) {
            setPendingListingId(id);
            setIsConfirmOpen(true);
        } else {
            proceedWithListingChange(id);
        }
    }, [hasSelections, proceedWithListingChange, selectedListingId]);


    const fetchAgents = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        Get()
            .then((data) => {
                const allAgents = Array.isArray(data.data) ? data.data : [];
                setAgent(allAgents);

                // ✅ Only include agents where status is true
                const filteredAgents = allAgents.filter((agent: Agent) => agent.status === true);

                setAgentData(filteredAgents);
                setAgentsData(filteredAgents);
            })
            .catch((err) => console.log("Error fetching data:", err.message));
    }, [setAgentsData, setAgent]);

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
                setListingsData(filteredListings);
            })
            .catch(err => console.log(err.message));
    }, [setListingsData]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    const fetchServices = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        GetServices(token)
            .then((data) => {
                const fetched = Array.isArray(data.data) ? data.data : [];
                setServicesData(fetched);
            })
            .catch((err) => console.log(err.message));
    }, [setServicesData]);

    const fetchVendors = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        GetVendors(token)
            .then((data) => {
                const fetched = Array.isArray(data.data) ? data.data : [];
                setVendorsData(fetched);
            })
            .catch((err) => console.log(err.message));
    }, [setVendorsData]);

    const fetchOrdersData = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        GetOrders(token)
            .then((data) => {
                const fetched = Array.isArray(data.data) ? data.data : [];
                setOrdersData(fetched);
            })
            .catch((err) => console.log(err.message));
    }, [setOrdersData]);

    useEffect(() => {
        fetchServices();
        fetchVendors();
        fetchOrdersData();
    }, [fetchServices, fetchVendors, fetchOrdersData]);

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '');

    const sortedCountries = useMemo(() => {
        const allCountries = Country.getAllCountries().map(c => ({
            label: c.name,
            value: c.isoCode
        }));

        const priorityCodes = ['CA', 'US'];
        const priorityCountries = allCountries.filter(c => priorityCodes.includes(c.value));
        const otherCountries = allCountries.filter(c => !priorityCodes.includes(c.value));

        // Sort priority countries to ensure CA comes first if needed, or maintain order
        priorityCountries.sort((a, b) => priorityCodes.indexOf(a.value) - priorityCodes.indexOf(b.value));

        return [...priorityCountries, ...otherCountries];
    }, []);

    const provinceOptions = useMemo(() => {
        return states.map(s => ({
            label: s.name,
            value: s.isoCode
        }));
    }, [states]);

    const agentOptions = useMemo(() => {
        return agent?.map(ag => ({
            label: `${ag.first_name} ${ag.last_name}`,
            value: ag.uuid
        })) || [];
    }, [agent]);

    const propertyTypeOptions = [
        { label: "Detached Home", value: "Detached Home" },
        { label: "Semi-Detached", value: "Semi-Detached" },
        { label: "Townhouse", value: "Townhouse" },
        { label: "Condo", value: "Condo" },
        { label: "Apartment", value: "Apartment" },
    ];

    const propertyStatusOptions = [
        { label: "Just listed", value: "Just listed" },
        { label: "Under contract", value: "Under contract" },
        { label: "Sold", value: "Sold" },
        { label: "Pending", value: "Pending" },
        { label: "Withdrawn", value: "Withdrawn" },
        { label: "Expired", value: "Expired" },
    ];

    useEffect(() => {
        const currentListing = listingData.find((list) => list.uuid === selectedListingId)
        setSelectedCurrentListing(currentListing ?? null)
        if (currentListing?.agent?.uuid) {
            setSelectedAgentId(currentListing.agent.uuid);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedListingId, listingData])

    useEffect(() => {
        if (userType === 'agent') {
            setSelectedAgentId(userInfo.uuid)
        }
    }, [userInfo, setSelectedAgentId, userType])

    useEffect(() => {
        if (selectedAgentId) {
            setConnectedAgent(selectedAgentId);
        }
    }, [selectedAgentId]);


    useEffect(() => {
        if (states.length && currentListing && currentListing?.province) {
            const match = states.find((s) => s.isoCode === currentListing.province);
            if (match) {
                setProvince(match.isoCode);
            }
        }
    }, [states, currentListing]);

    useEffect(() => {
        const isValid = !!(
            address?.trim() &&
            selectedAgentId &&
            (selectedListingId || Number(squareFootage) > 0) &&
            city?.trim() &&
            country &&
            postalCode?.trim()
        );
        setIsPropertyValid(isValid);
    }, [address, squareFootage, selectedAgentId, city, country, postalCode, setIsPropertyValid, selectedListingId]);


    //     useEffect(() => {
    //         setCountries(Country.getAllCountries());
    //     }, []);

    useEffect(() => {
        if (country) {
            setStates(State.getStatesOfCountry(country));
        }
    }, [country]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (selectedListingId) {
            GetOneListing(selectedListingId)
                .then(data => setCurrentListing(data.data))
                .catch(err => console.log(err.message));
        }

    }, [selectedListingId, openAddListingDialog]);

    useEffect(() => {
        if (openAddListingDialog && !currentListing?.uuid && address?.trim() && listingData.length > 0) {
            const match = listingData.find(l =>
                l.address?.toLowerCase().trim() === address.toLowerCase().trim() &&
                l.city?.toLowerCase().trim() === city.toLowerCase().trim() &&
                (l.suite?.toString().toLowerCase().trim() || "") === (suite?.toString().toLowerCase().trim() || "")
            );

            if (match && match.uuid !== duplicateListing?.uuid) {
                setDuplicateListing(match);
                toast.warning("The address you entered already exists.");
            } else if (!match) {
                setDuplicateListing(null);
            }
        } else {
            setDuplicateListing(null);
        }
    }, [address, city, listingData, openAddListingDialog, currentListing?.uuid, suite, duplicateListing?.uuid]);
    useEffect(() => {
        if (currentListing) {
            if (currentListing.agent?.uuid) {
                setConnectedAgent(currentListing.agent.uuid);
            }
            setListingPrice(currentListing.listing_price?.toString() || "");
            setMls(currentListing.mls_number || "");
            setBedrooms(currentListing.bedrooms ?? "");
            setBathrooms(currentListing.bathrooms ?? "");
            setSquareFootage(currentListing.square_footage ? currentListing.square_footage.toString() : "");
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
        } else if (tempPropertyData && !selectedListingId) {
            // Restore from tempPropertyData if no listing is selected
            setConnectedAgent(tempPropertyData.agent_id || "");
            setListingPrice(tempPropertyData.listing_price?.toString() || "");
            setMls(tempPropertyData.mls_number || "");
            setBedrooms(tempPropertyData.bedrooms ?? "");
            setBathrooms(tempPropertyData.bathrooms ?? "");
            setSquareFootage(tempPropertyData.square_footage !== undefined && tempPropertyData.square_footage !== null ? tempPropertyData.square_footage.toString() : "");
            setLotSize(tempPropertyData.lot_size?.toString() || "");
            setYearConstructed(tempPropertyData.year_constructed?.toString() || "");
            setParkingSpots(tempPropertyData.parking_spots?.toString() || "");
            setPropertyType(tempPropertyData.property_type || "");
            setPropertyStatus(tempPropertyData.property_status || "");
            setHeading(tempPropertyData.heading || "");
            setDescription(tempPropertyData.description || "");
            setSuite(tempPropertyData.suite || "");
            setAddress(tempPropertyData.address || "");
            setCity(tempPropertyData.city || "");
            setProvince(tempPropertyData.province || "");
            setPostalCode(tempPropertyData.postal_code || "");
            setCountry(tempPropertyData.country || "CA");
        }
    }, [currentListing, tempPropertyData, selectedListingId]);
    useEffect(() => {
        if (!selectedListingId && (address || squareFootage) && !isLoading && !currentListing) {
            const payload = {
                listing_price: Number(listingPrice),
                mls_number: mls,
                bedrooms: Number(bedrooms),
                bathrooms: Number(bathrooms),
                agent_id: connectedAgent,
                square_footage: squareFootage === "" ? undefined : Number(squareFootage),
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
            setTempPropertyData(payload);
        }
    }, [
        selectedListingId, listingPrice, mls, bedrooms, bathrooms, connectedAgent,
        squareFootage, lotSize, yearConstructed, parkingSpots, propertyType,
        propertyStatus, heading, description, suite, address, city, province,
        postalCode, country, setTempPropertyData, isLoading, currentListing
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!connectedAgent) {
            toast.error('Agent field is required. Please select an agent.');
            return;
        }
        if (!address?.trim()) {
            toast.error('Address is required.');
            return;
        }
        if (!currentListing?.uuid && (!squareFootage || Number(squareFootage) <= 0)) {
            toast.error('Square Footage is required and must be greater than 0.');
            return;
        }
        if (!city?.trim()) {
            toast.error('City is required.');
            return;
        }
        if (!country) {
            toast.error('Country is required.');
            return;
        }
        if (!postalCode?.trim()) {
            toast.error('Postal Code is required.');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token') || '';
            const payload = {
                listing_price: Number(listingPrice),
                mls_number: mls,
                bedrooms: Number(bedrooms),
                bathrooms: Number(bathrooms),
                agent_id: connectedAgent,
                square_footage: squareFootage === "" ? undefined : Number(squareFootage),
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

            if (currentListing?.uuid) {
                const updatedPayload = { ...payload, _method: 'PUT' };
                await EditListings(currentListing.uuid, updatedPayload, token);
                if (selectedListingId === currentListing.uuid) {
                    setTempPropertyData(payload);
                }
                resetForm();
                setOpenAddListingDialog(false);
                fetchListings();
            } else {
                setTempPropertyData(payload);
                setSelectedListingId(null);
                if (onSetActiveTab) onSetActiveTab("services");
                setOpenAddListingDialog(false);
            }

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

            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit listing data');
            }
        } finally {
            setIsLoading(false);
        }
    };
    const handleMlsFetch = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!mls) {
            toast.error("Please enter an MLS number first");
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetchMlsData(mls);

            const mls_data = response.mls || response;

            if (mls_data && !mls_data.error) {
                // Populate fields
                setListingPrice(mls_data.listPrice?.toString() || "");
                setBedrooms(mls_data.details?.numBedrooms?.toString() || "");
                setBathrooms(mls_data.details?.numBathrooms?.toString() || "");

                const style = mls_data.details?.style || "";
                if (style.includes("Single Family Residence")) {
                    setPropertyType("Detached Home");
                } else if (style.includes("Townhouse") || style.includes("Townhome")) {
                    setPropertyType("Townhouse");
                } else if (style.includes("Condo") || style.includes("Condominium")) {
                    setPropertyType("Condo");
                } else if (style.includes("Apartment")) {
                    setPropertyType("Apartment");
                } else if (style.includes("Commercial")) {
                    setPropertyType("Commercial");
                }

                setSquareFootage(mls_data.details?.sqft?.toString() || "");
                setYearConstructed(mls_data.details?.yearBuilt?.toString() || "");

                const parkingSpaces = mls_data.details?.numParkingSpaces || mls_data.details?.numDrivewaySpaces;
                setParkingSpots(parkingSpaces?.toString() || "");

                const standardStatus = mls_data.standardStatus || "";
                if (standardStatus.includes("Active Under Contract")) {
                    setPropertyStatus("Under contract");
                } else if (mls_data.status === "A") {
                    setPropertyStatus("Just listed");
                } else if (mls_data.status === "S" || mls_data.status === "Sld") {
                    setPropertyStatus("Sold");
                } else if (mls_data.status === "P") {
                    setPropertyStatus("Pending");
                }

                const addressParts = [];
                if (mls_data.address?.streetNumber) addressParts.push(mls_data.address.streetNumber);
                if (mls_data.address?.streetName) addressParts.push(mls_data.address.streetName);
                if (mls_data.address?.streetSuffix) addressParts.push(mls_data.address.streetSuffix);

                const fullAddress = addressParts.join(" ");
                setAddress(fullAddress.trim());

                setCity(mls_data.address?.city || "");
                setPostalCode(mls_data.address?.zip || "");

                if (mls_data.address?.state === "NC") {
                    setCountry("US");
                    setProvince("NC");
                } else if (mls_data.address?.country === "US" || mls_data.address?.state) {
                    setCountry("US");
                    if (mls_data.address?.state) {
                        setProvince(mls_data.address.state);
                    }
                }

                if (mls_data.lot?.size) {
                    setLotSize(mls_data.lot.size.toString());
                } else if (mls_data.lot?.squareFeet) {
                    const acres = mls_data.lot.squareFeet / 43560;
                    setLotSize(acres.toFixed(2));
                } else if (mls_data.lot?.acres) {
                    setLotSize(mls_data.lot.acres.toString());
                }

                setDescription(mls_data.details?.description || "");

                if (!heading || heading.trim() === "") {
                    const generatedHeading = `${mls_data.address?.streetNumber || ""} ${mls_data.address?.streetName || ""} ${mls_data.details?.style || "Property"}`;
                    setHeading(generatedHeading.trim());
                }

                if (mls_data.address?.unitNumber) {
                    setSuite(mls_data.address.unitNumber);
                }

                toast.success("MLS data fetched and populated successfully!");
            } else {
                toast.error("Failed to fetch MLS data or no data returned");
            }
        } catch (error) {
            console.error("Error fetching MLS data:", error);
            toast.error("Error fetching MLS data.");
        } finally {
            setIsLoading(false);
        }
    };
    const filteredAgents = useMemo(() => {
        const keyword = searchValue.trim().toLowerCase();

        if (keyword === "") return agentData;

        return agentData.filter((agent) => {
            const fullName = `${agent?.first_name} ${agent?.last_name} – ${agent?.company_name}`.toLowerCase();
            return fullName.includes(keyword);
        });
    }, [searchValue, agentData]);
    const filteredListings = useMemo(() => {
        const keyword = listingSearchValue.trim().toLowerCase();
        let data = listingData;

        if (selectedAgentId) {
            data = data.filter((listing) => listing.agent?.uuid === selectedAgentId);
        }

        if (keyword === "") return data;

        return data.filter((listing) => {
            const label = `${listing.address}, ${listing.city}`.toLowerCase();
            return label.includes(keyword);
        });
    }, [listingSearchValue, listingData, selectedAgentId]);

    return (
        <div className='pt-7 px-[200px] pb-[80px] font-alexandria'>
            <div className='py-[10px] pl-[10px] flex flex-col gap-[30px]'>
                <div className='flex flex-col gap-[14px]'>
                    <p className='text-[14px] font-[400]' style={{ color: roleSettings.pageText }}>Agent <span className="text-red-500">*</span></p>
                    <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-4'>
                            <Popover open={openAgent} onOpenChange={setOpenAgent}>
                                <PopoverTrigger asChild>
                                    <button
                                        className={cn(
                                            "w-[432px] h-[42px] border-[1px] border-[#BBBBBB] px-3 flex items-center justify-between rounded-md",
                                            !selectedAgent && "text-muted-foreground"
                                        )}
                                        style={{ backgroundColor: fieldBg }}
                                    >
                                        {userType === 'agent' && userInfo ? (
                                            <span className='font-normal text-base' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                                {userInfo.first_name} {userInfo.last_name} – {userInfo.company_name}
                                            </span>
                                        ) : selectedAgent ? (
                                            <span className='font-normal text-base' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                                {selectedAgent.first_name} {selectedAgent.last_name} – {selectedAgent.company_name}
                                            </span>
                                        ) : (
                                            "Select Agent"
                                        )}
                                        {userType === 'admin' && <DropDownArrow stroke={roleSettings.pageText} />}
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
                                                                handleAgentSelect(agent.uuid || "");
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
                        <button
                            className={`${userType == 'admin' ? 'flex' : 'hidden'} items-center gap-2 px-3 py-2 rounded-md border transition-colors`}
                            style={{ borderColor: roleSettings.pageTabColor, color: roleSettings.pageTabColor }}
                            onClick={() => {
                                setIsEditingAgent(false);
                                handleAgentSelect(null);
                            }}
                        >
                            <Plus className='w-4 h-4' />
                            <span className='text-sm font-medium'>Create New Agent</span>
                        </button>
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
                            <p className={`font-[400] text-[20px]`} style={{ color: roleSettings.pageTabColor }}>
                                {userInfo.first_name} {userInfo.last_name}
                            </p>
                            <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                {userInfo.company_name}
                            </p>
                            <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                {userInfo.email}
                            </p>
                            <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                {userInfo.primary_phone}
                            </p>
                        </div>
                    ) : selectedAgent && (
                        <div className='flex flex-col'>
                            <p className={`font-[400] text-[20px]`} style={{ color: roleSettings.pageTabColor }}>
                                {selectedAgent.first_name} {selectedAgent.last_name}
                            </p>
                            <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                {selectedAgent.company_name}
                            </p>
                            <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                {selectedAgent.email}
                            </p>
                            <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                {selectedAgent.primary_phone}
                            </p>
                            {selectedAgent.notes && (
                                <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                    <span className='font-[600]'>Notes: </span> {selectedAgent.notes}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className='w-full h-[1px] bg-[#EEEEEE]' />
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <div className="relative w-full">
                                <div className={cn("w-full transition-opacity duration-200", !selectedAgentId && "opacity-50 pointer-events-none")}>
                                    {duplicateListing && (
                                        <div className='w-full p-4 mb-4 rounded-lg bg-red-50 border border-red-200 flex flex-col gap-3'>
                                            <p className='text-red-600 text-[14px] font-[500]'>
                                                This listing already exists. Do you want to continue with that listing?
                                            </p>
                                            <div className='flex items-center gap-3'>
                                                <button
                                                    onClick={() => {
                                                        handleListingSelect(duplicateListing.uuid);
                                                        setDuplicateListing(null); // Clear duplicate after selection
                                                    }}
                                                    className='px-4 py-1.5 bg-red-600 text-white rounded-md text-[13px] font-[500] hover:bg-red-700 transition-colors'
                                                >
                                                    Continue with Existing Listing
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <Accordion
                                        type="single"
                                        collapsible
                                        value={openAddListingDialog ? "create-new-booking" : ""}
                                        onValueChange={(val) => {
                                            if (val === "create-new-booking") {
                                                if (selectedListingId !== null) {
                                                    handleListingSelect('NEW');
                                                } else {
                                                    setOpenAddListingDialog(true);
                                                }
                                            } else {
                                                setOpenAddListingDialog(false);
                                            }
                                        }}
                                        className='w-full'
                                    >
                                        <AccordionItem
                                            value="create-new-booking"
                                            className='border-[1px] rounded-[8px] mb-4 overflow-hidden'
                                            style={{
                                                borderColor: `color-mix(in srgb, ${roleSettings.pageBg} 88%, black)`
                                            }}
                                        >
                                            <AccordionTrigger
                                                className='hover:no-underline py-3 px-4 rounded-t-[8px]'
                                                style={{
                                                    backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg} 94%, black)`,
                                                }}
                                            >
                                                <p className='text-[18px] font-[600]' style={{ color: roleSettings.pageTabColor }}>Create New Booking</p>
                                            </AccordionTrigger>
                                            <AccordionContent className='px-4 pb-4'>
                                                <div className='w-full flex flex-col items-center'>
                                                    <div className='w-full pt-4 flex justify-center flex-col gap-[16px] text-[14px] font-[400]' style={{ color: roleSettings.pageText }}>

                                                        <div className='grid grid-cols-4 gap-[16px] mt-[20px]'>
                                                            <div className="col-span-1">
                                                                <label htmlFor="">Square Footage <span className="text-red-500">*</span></label>
                                                                <Input
                                                                    value={squareFootage}
                                                                    onChange={(e) => setSquareFootage(e.target.value)}
                                                                    placeholder="e.g 2230 sq. ft."
                                                                    className={`h-[42px] border-[1px] ${squareFootage === "0" ? "border-red-500" : "border-[#BBBBBB]"} mt-[12px]`}
                                                                    style={{ backgroundColor: fieldBg }}
                                                                    type="text"
                                                                />
                                                                {fieldErrors.square_footage && (
                                                                    <p className="text-red-500 text-[10px]">
                                                                        {fieldErrors.square_footage[0]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="col-span-3">
                                                                <label htmlFor="">Address <span className="text-red-500">*</span></label>
                                                                <GooglePlacesAutocomplete
                                                                    mode="single"
                                                                    addressComponents={{
                                                                        address_line_1: address,
                                                                        city: city,
                                                                        province: province,
                                                                        country: country,
                                                                        postal_code: postalCode,
                                                                        full_address: address
                                                                    }}
                                                                    onAddressComponentsChange={(comp) => {
                                                                        setAddress(comp.address_line_1);
                                                                        setCity(comp.city);
                                                                        setProvince(comp.province);
                                                                        setCountry(comp.country);
                                                                        setPostalCode(comp.postal_code);

                                                                        if (fieldErrors.address) {
                                                                            const newErrors = { ...fieldErrors };
                                                                            delete newErrors.address;
                                                                            setFieldErrors(newErrors);
                                                                        }
                                                                    }}
                                                                    fieldErrors={fieldErrors}
                                                                    className="mt-[12px]"
                                                                    inputClassName="h-[42px] border-[1px] border-[#BBBBBB]"
                                                                    inputStyle={{ backgroundColor: fieldBg }}
                                                                    autoFocus={true}
                                                                />
                                                            </div>
                                                            <div className="col-span-1">
                                                                <label htmlFor="">Suite</label>
                                                                <Input
                                                                    value={suite}
                                                                    onChange={(e) => setSuite(e.target.value)}
                                                                    placeholder=""
                                                                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px] text-center px-1"
                                                                    style={{ backgroundColor: fieldBg }}
                                                                    type="text"
                                                                />
                                                            </div>

                                                            <div className="col-span-1">
                                                                <label htmlFor="">City <span className="text-red-500">*</span></label>
                                                                <Input
                                                                    value={city}
                                                                    onChange={(e) => setCity(e.target.value)}
                                                                    placeholder=""
                                                                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                    style={{ backgroundColor: fieldBg }}
                                                                    type="text"
                                                                />
                                                                {fieldErrors.city && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.city[0]}</p>}
                                                            </div>

                                                            <div className="col-span-1">
                                                                <label htmlFor="">{country === 'US' ? 'State' : 'Province'}</label>
                                                                <div className="mt-[12px]">
                                                                    <SearchableSelect
                                                                        options={provinceOptions}
                                                                        value={province}
                                                                        onChange={(val) => setProvince(val)}
                                                                        placeholder="Select Province"
                                                                        searchPlaceholder="Search province..."
                                                                        className="h-[42px]"
                                                                    />
                                                                </div>
                                                                {fieldErrors.province && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.province[0]}</p>}
                                                            </div>

                                                            <div className="col-span-1">
                                                                <label htmlFor="">Postal Code <span className="text-red-500">*</span></label>
                                                                <Input
                                                                    value={postalCode}
                                                                    onChange={(e) => setPostalCode(e.target.value)}
                                                                    placeholder=""
                                                                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                    style={{ backgroundColor: fieldBg }}
                                                                    type="text"
                                                                />
                                                                {fieldErrors.postal_code && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.postal_code[0]}</p>}
                                                            </div>

                                                            <div className="col-span-1">
                                                                <label htmlFor="">Country <span className="text-red-500">*</span></label>
                                                                <div className="mt-[12px]">
                                                                    <SearchableSelect
                                                                        options={sortedCountries}
                                                                        value={country}
                                                                        onChange={(val) => {
                                                                            setCountry(val);
                                                                            setProvince("");
                                                                        }}
                                                                        placeholder="Select Country"
                                                                        searchPlaceholder="Search country..."
                                                                        className="h-[42px]"
                                                                    />
                                                                </div>
                                                            </div>



                                                            <div className='col-span-1'>
                                                                <label htmlFor="">Connected Agents</label>
                                                                <div className="mt-[12px]">
                                                                    <SearchableSelect
                                                                        options={agentOptions}
                                                                        value={connectedAgent}
                                                                        onChange={(val) => {
                                                                            setConnectedAgent(val);
                                                                            setSelectedAgentId(val);
                                                                        }}
                                                                        placeholder="Select Agent"
                                                                        searchPlaceholder="Search agent..."
                                                                        className="h-[42px]"
                                                                        disabled={userType !== 'admin'}
                                                                    />
                                                                </div>
                                                                {fieldErrors.agent_id && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.agent_id[0]}</p>}
                                                            </div>

                                                            <div className="col-span-1">
                                                                <label htmlFor="">MLS#</label>
                                                                <Input
                                                                    value={mls}
                                                                    onChange={(e) => setMls(e.target.value)}
                                                                    placeholder="e.g A2206608"
                                                                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                    style={{ backgroundColor: fieldBg }}
                                                                    type="text"
                                                                />
                                                                {fieldErrors.mls_number && (
                                                                    <p className="text-red-500 text-[10px]">
                                                                        {fieldErrors.mls_number[0]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="col-span-1 flex items-end h-full">
                                                                <button
                                                                    onClick={handleMlsFetch}
                                                                    className="w-full h-[42px] text-white rounded-[4px] transition-colors disabled:opacity-50"
                                                                    style={{ backgroundColor: roleSettings.pageTabColor }}
                                                                >
                                                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sync with MLS"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <Accordion type="single" collapsible className="w-full">
                                                            <AccordionItem value="extra-details" className='border-0'>
                                                                <AccordionTrigger className='font-[500] text-[16px] hover:no-underline' style={{ color: roleSettings.pageTabColor }}>Extra Details</AccordionTrigger>
                                                                <AccordionContent>
                                                                    <div className='grid grid-cols-4 gap-[16px]'>
                                                                        <div>
                                                                            <label htmlFor="">Listing Price (CAD)</label>
                                                                            <Input
                                                                                value={listingPrice}
                                                                                onChange={(e) => setListingPrice(e.target.value)}
                                                                                placeholder="e.g 844,500"
                                                                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                                style={{ backgroundColor: fieldBg }}
                                                                                type="text"
                                                                            />
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
                                                                                className="h-[42px] w-full border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                                style={{ backgroundColor: fieldBg }}
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
                                                                                className="h-[42px] w-full border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                                style={{ backgroundColor: fieldBg }}
                                                                            />

                                                                            <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                                                                                <button type="button" onClick={() => setBathrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) + 1))}><ArrowUp /></button>
                                                                                <button type="button" onClick={() => setBathrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) - 1))}><ArrowDown /></button>
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <label htmlFor="">Lot Size (Acres)</label>
                                                                            <Input
                                                                                value={lotSize}
                                                                                onChange={(e) => setLotSize(e.target.value)}
                                                                                placeholder="e.g 0-4,050 sq. ft."
                                                                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                                style={{ backgroundColor: fieldBg }}
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
                                                                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                                style={{ backgroundColor: fieldBg }}
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
                                                                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                                style={{ backgroundColor: fieldBg }}
                                                                                type="text"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <label htmlFor="">Property Type</label>
                                                                            <div className="mt-[12px]">
                                                                                <SearchableSelect
                                                                                    options={propertyTypeOptions}
                                                                                    value={propertyType}
                                                                                    onChange={(value) => setPropertyType(value)}
                                                                                    placeholder="Select Property Type"
                                                                                    searchPlaceholder="Search property type..."
                                                                                    className="h-[42px]"
                                                                                />
                                                                            </div>
                                                                            {fieldErrors.property_type && (
                                                                                <p className="text-red-500 text-[10px]">
                                                                                    {fieldErrors.property_type[0]}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <label htmlFor="">Property Status</label>
                                                                            <div className="mt-[12px]">
                                                                                <SearchableSelect
                                                                                    options={propertyStatusOptions}
                                                                                    value={propertyStatus}
                                                                                    onChange={(value) => setPropertyStatus(value)}
                                                                                    placeholder="Select Property Status"
                                                                                    searchPlaceholder="Search property status..."
                                                                                    className="h-[42px]"
                                                                                />
                                                                            </div>
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
                                                                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                                style={{ backgroundColor: fieldBg }}
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
                                                                            <Textarea
                                                                                value={description}
                                                                                onChange={(e) => setDescription(e.target.value)}
                                                                                placeholder="write some description of your listing"
                                                                                className="w-full resize-none h-[100px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                                style={{ backgroundColor: fieldBg }}
                                                                            />
                                                                            {fieldErrors.description && (
                                                                                <p className="text-red-500 text-[10px]">
                                                                                    {fieldErrors.description[0]}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        </Accordion >

                                                        <div className="col-span-4 border-b border-[#BBBBBB]">
                                                        </div>
                                                        <div className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                                                            <button onClick={() => { setOpenAddListingDialog(false) }}
                                                                className="bg-white w-full md:w-[176px] h-[40px] text-[20px] rounded-sm font-[400] border transition-all"
                                                                style={{ borderColor: roleSettings.pageTabColor, color: roleSettings.pageTabColor }}>
                                                                Cancel
                                                            </button>
                                                            <button
                                                                disabled={isLoading || !address?.trim() || !selectedAgentId || (!selectedListingId && (!squareFootage || Number(squareFootage) <= 0)) || !city?.trim() || !country || !postalCode?.trim()}
                                                                onClick={(e) => { handleSubmit(e) }}
                                                                className={`w-full rounded-sm md:w-[176px] h-[40px] font-[400] text-[20px] flex items-center justify-center gap-2 text-white transition-all
                                                ${(isLoading || !address?.trim() || !selectedAgentId || (!selectedListingId && (!squareFootage || Number(squareFootage) <= 0)) || !city?.trim() || !country || !postalCode?.trim())
                                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                                        : ''}`}
                                                                style={{ backgroundColor: (isLoading || !address?.trim() || !selectedAgentId || (!selectedListingId && (!squareFootage || Number(squareFootage) <= 0)) || !city?.trim() || !country || !postalCode?.trim()) ? undefined : roleSettings.pageTabColor }}
                                                            >
                                                                {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : "Next"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>

                                    <div className='flex flex-col gap-[14px]'>
                                        <p className='text-[14px] font-[400]' style={{ color: roleSettings.pageText }}>Listing <span className="text-red-500">*</span></p>
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
                                                                <span className='font-normal text-base' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                                                                    {selectedListing.address}, {selectedListing.city}
                                                                </span>
                                                            ) : (
                                                                "Search and Select previous listings"
                                                            )}
                                                            <DropDownArrow stroke={roleSettings.pageText} />
                                                        </button>
                                                    </PopoverTrigger>

                                                    <PopoverContent className="w-[432px] p-0">
                                                        <Command shouldFilter={false}>
                                                            <CommandInput
                                                                placeholder="Search and Select previous listings..."
                                                                value={listingSearchValue}
                                                                onValueChange={(val) => {
                                                                    setListingSearchValue(val);
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
                                                                                    handleListingSelect(listing.uuid);
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
                                                                        <div className="px-4 py-2 text-sm text-muted-foreground text-center italic">
                                                                            No listings found.
                                                                        </div>
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
                                                        setOpenAddListingDialog(true);
                                                    }}
                                                >
                                                    <EditIcon3 />
                                                </div>

                                            </div>
                                            {!openAddListingDialog && (
                                                <>
                                                    <div className="flex items-center gap-2 self-center">
                                                        <div className="w-[30px] h-[1px] bg-[#BBBBBB]"></div>
                                                        <span className="text-[#BBBBBB] text-sm">or</span>
                                                        <div className="w-[30px] h-[1px] bg-[#BBBBBB]"></div>
                                                    </div>
                                                    <button
                                                        className='flex items-center gap-2 px-3 py-2 rounded-md border transition-colors'
                                                        style={{ borderColor: roleSettings.pageTabColor, color: roleSettings.pageTabColor }}
                                                        onClick={() => handleListingSelect('NEW')}
                                                    >
                                                        <Plus className='w-4 h-4' />
                                                        <span className='text-sm font-medium'>Create New Listing</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!selectedAgentId && (
                                    <div className="absolute inset-0 z-10" />
                                )}
                            </div>
                        </TooltipTrigger>
                        {!selectedAgentId && (
                            <TooltipContent>
                                <p>Please select an agent to search for a property.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
                {selectedListing && !openAddListingDialog && (
                    <div className='flex flex-col'>
                        <p className={`font-[400] text-[20px]`} style={{ color: roleSettings.pageTabColor }}>
                            {selectedListing.address}, {selectedListing.city}
                        </p>
                        <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                            {selectedListing?.agent?.first_name} {selectedListing?.agent?.last_name}
                        </p>
                        <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                            {selectedListing?.agent?.email}
                        </p>
                        <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                            {selectedListing?.agent?.primary_phone}
                        </p>
                        <p className='font-[400] text-[16px]' style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}>
                            Est. {selectedListing.square_footage}ft<sup>2</sup>
                        </p>
                    </div>
                )}

                {
                    (selectedListing?.orders?.length ?? 0) > 0 && (
                        <>
                            <p className="text-[14px] font-[400]" style={{ color: roleSettings.pageText }}>Listing Order History</p>
                            <div className="flex flex-col rounded-[6px] gap-y-1.5 border border-[#BBBBBB]" style={{ backgroundColor: fieldBg }}>

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
                                            className="px-4 py-3 grid grid-cols-5 gap-[30px]"
                                            style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)` }}
                                        >
                                            <div className="flex flex-col ">
                                                <p className="text-sm font-medium" style={{ color: roleSettings.pageTabColor }}>
                                                    Order #{order.id} -
                                                </p>
                                                <p className="text-[10px] font-normal" style={{ color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 40%)` }}>
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
                    )
                }
            </div >
            <ConfirmationDialog
                open={isConfirmOpen}
                setOpen={setIsConfirmOpen}
                title="Are you sure you want to change the listing?"
                description="If you change the listing, all your selections (slots, services, notes, etc.) will be undone or removed."
                onConfirm={() => {
                    if (pendingListingId) {
                        proceedWithListingChange(pendingListingId);
                        setPendingListingId(null);
                    }
                }}
                showAgain={showAgain}
                toggleShowAgain={() => setShowAgain(!showAgain)}
            />
            <ConfirmationDialog
                open={isAgentConfirmOpen}
                setOpen={setIsAgentConfirmOpen}
                title="Are you sure you want to change the agent?"
                description="If you change the agent, all your selections (property, slots, services, notes, etc.) will be undone or removed."
                onConfirm={() => {
                    proceedWithAgentChange(pendingAgentId);
                    setPendingAgentId(null);
                    if (!pendingAgentId) {
                        setOpenAddAgentDialog(true);
                    }
                }}
                showAgain={agentShowAgain}
                toggleShowAgain={() => setAgentShowAgain(!agentShowAgain)}
            />
        </div >
    )
}

export default Property