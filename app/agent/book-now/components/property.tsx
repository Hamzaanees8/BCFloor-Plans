'use client';

import React, { useEffect, useState } from 'react'
import { Country, State } from "country-state-city";
import GooglePlacesAutocomplete from '@/app/dashboard/calendar/components/AutoCompleteInput'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBookNowContext } from '../context/BookNowContext'
import { fetchMlsData } from "@/app/dashboard/listings/listing";
import { toast } from "sonner";

const Property = () => {
    const { tempPropertyData, setTempPropertyData } = useBookNowContext();

    // Form state
    const [mls, setMls] = useState(tempPropertyData?.mls_number || "");
    const [isLoadingMls, setIsLoadingMls] = useState(false);
    const [address, setAddress] = useState(tempPropertyData?.address || "");
    const [suite, setSuite] = useState(tempPropertyData?.suite || "");
    const [city, setCity] = useState(tempPropertyData?.city || "");
    const [province, setProvince] = useState(tempPropertyData?.province || "");
    const [postalCode, setPostalCode] = useState(tempPropertyData?.postal_code || "");
    const [country, setCountry] = useState(tempPropertyData?.country || "CA");
    const [squareFootage, setSquareFootage] = useState(tempPropertyData?.square_footage?.toString() || "");
    const [notes, setNotes] = useState(tempPropertyData?.notes || "");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);

    const handleMlsSync = async () => {
        if (!mls) {
            toast.error("Please enter an MLS number first");
            return;
        }

        try {
            setIsLoadingMls(true);
            const response = await fetchMlsData(mls);
            const mls_data = response.mls || response;

            if (mls_data && !mls_data.error) {
                setSquareFootage(mls_data.details?.sqft?.toString() || "");
                setCity(mls_data.address?.city || "");
                setPostalCode(mls_data.address?.zip || "");

                // Assemble address from street parts
                const addressParts = [];
                if (mls_data.address?.streetNumber) addressParts.push(mls_data.address.streetNumber);
                if (mls_data.address?.streetName) addressParts.push(mls_data.address.streetName);
                if (mls_data.address?.streetSuffix) addressParts.push(mls_data.address.streetSuffix);
                setAddress(addressParts.join(" ") || "");

                if (mls_data.address?.state) {
                    setProvince(mls_data.address.state);
                }
                if (mls_data.address?.country) {
                    setCountry(mls_data.address.country);
                }

                toast.success("MLS data synced successfully!");
            } else {
                toast.error("Failed to fetch MLS data. Please verify the MLS#.");
            }
        } catch (err) {
            console.error("Error syncing MLS:", err);
            toast.error("Error syncing MLS data.");
        } finally {
            setIsLoadingMls(false);
        }
    };

    // Get sorted countries
    const sortedCountries = React.useMemo(() => {
        const allCountries = Country.getAllCountries().map(c => ({
            label: c.name,
            value: c.isoCode
        }));

        const priorityCodes = ['CA', 'US'];
        const priorityCountries = allCountries.filter(c => priorityCodes.includes(c.value));
        const otherCountries = allCountries.filter(c => !priorityCodes.includes(c.value));

        priorityCountries.sort((a, b) => priorityCodes.indexOf(a.value) - priorityCodes.indexOf(b.value));

        return [...priorityCountries, ...otherCountries];
    }, []);

    const provinceOptions = React.useMemo(() => {
        return states.map(s => ({
            label: s.name,
            value: s.isoCode
        }));
    }, [states]);

    // Update states when country changes
    useEffect(() => {
        if (country) {
            setStates(State.getStatesOfCountry(country));
        }
    }, [country]);

    useEffect(() => {
        const userInfoStr = localStorage.getItem('userInfo');
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

        const newPropertyData = {
            ...tempPropertyData,
            address,
            suite,
            city,
            province,
            postal_code: postalCode,
            country,
            square_footage: squareFootage ? Number(squareFootage) : undefined,
            notes,
            agent_id: userInfo?.uuid || tempPropertyData?.agent_id,
            mls_number: mls
        };
        setTempPropertyData(newPropertyData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, suite, city, province, postalCode, country, squareFootage, notes, mls]);

    const fieldBg = '#EEEEEE';

    return (
        <div className='font-alexandria'>
            <div className='w-full flex flex-col items-center'>
                <h1 className='font-[500] text-[25px] py-4 text-[#4290E9]'>Property Details</h1>
                <div className='w-full py-[16px] px-0 md:px-0 flex justify-center flex-col gap-[16px] text-[14px] font-[400] text-[#7D7D7D] max-w-[1000px]'>

                    {/* MLS# Search / Sync */}
                    <div className='grid grid-cols-4 gap-[16px] items-end'>
                        <div className="col-span-3">
                            <label htmlFor="mls_number" className="font-semibold text-gray-700">MLS# (Sync Optional)</label>
                            <Input
                                id="mls_number"
                                value={mls}
                                onChange={(e) => setMls(e.target.value)}
                                placeholder="Enter MLS Number (e.g. R2846933)"
                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                style={{ backgroundColor: fieldBg }}
                                type="text"
                            />
                        </div>
                        <div className="col-span-1">
                            <button
                                type="button"
                                onClick={handleMlsSync}
                                disabled={isLoadingMls}
                                className="w-full h-[42px] bg-[#4290E9] hover:bg-[#357AD1] disabled:bg-gray-400 text-white rounded-[6px] font-[600] text-[14px] flex justify-center items-center cursor-pointer transition-all duration-200"
                            >
                                {isLoadingMls ? "Syncing..." : "Sync MLS"}
                            </button>
                        </div>
                    </div>

                    {/* Address with Google Places Autocomplete */}
                    <div className='grid grid-cols-4 gap-[16px]'>
                        <div className="col-span-3">
                            <label htmlFor="">Address *</label>
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
                                    setAddress(comp.address_line_1 || '');
                                    setCity(comp.city || '');
                                    setProvince(comp.province || '');
                                    setCountry(comp.country || 'CA');
                                    setPostalCode(comp.postal_code || '');

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
                    </div>

                    {/* City, Province, Postal Code */}
                    <div className='grid grid-cols-3 gap-[16px]'>
                        <div className="col-span-1">
                            <label htmlFor="">City</label>
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
                                <Select value={province} onValueChange={setProvince}>
                                    <SelectTrigger
                                        className="h-[42px] border-[1px] border-[#BBBBBB]"
                                        style={{ backgroundColor: fieldBg }}
                                    >
                                        <SelectValue placeholder="Select Province" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinceOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldErrors.province && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.province[0]}</p>}
                            </div>
                        </div>

                        <div className="col-span-1">
                            <label htmlFor="">Postal Code *</label>
                            <Input
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                placeholder=""
                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                style={{ backgroundColor: fieldBg }}
                                type="text"
                                required
                            />
                            {fieldErrors.postal_code && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.postal_code[0]}</p>}
                        </div>
                    </div>

                    {/* Country */}
                    <div className='grid grid-cols-2 gap-[16px]'>
                        <div className="col-span-1">
                            <label htmlFor="">Country</label>
                            <div className="mt-[12px]">
                                <Select value={country} onValueChange={setCountry}>
                                    <SelectTrigger
                                        className="h-[42px] border-[1px] border-[#BBBBBB]"
                                        style={{ backgroundColor: fieldBg }}
                                    >
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sortedCountries.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldErrors.country && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.country[0]}</p>}
                            </div>
                        </div>

                        {/* Square Footage */}
                        <div className="col-span-1">
                            <label htmlFor="">Square Footage (Optional)</label>
                            <Input
                                value={squareFootage}
                                onChange={(e) => setSquareFootage(e.target.value)}
                                placeholder="0"
                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                style={{ backgroundColor: fieldBg }}
                                type="number"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="">Notes (Optional)</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes about the property..."
                            className="h-[100px] border-[1px] border-[#BBBBBB] mt-[12px] resize-none"
                            style={{ backgroundColor: fieldBg }}
                        />
                    </div>

                    {/* Required Fields Notice */}
                    <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                        <p className='text-[12px] text-blue-700'>
                            <span className='font-[600]'>*Required fields</span> - Address, City, Province/State, Postal Code, and Country are required to proceed to the next step
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Property
