'use client';

import React, { useEffect, useState } from 'react'
import { Country, State } from "country-state-city";
import GooglePlacesAutocomplete from '@/app/dashboard/calendar/components/AutoCompleteInput'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBookNowContext } from '../context/BookNowContext'

const Property = () => {
    const { tempPropertyData, setTempPropertyData } = useBookNowContext();

    // Form state
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
            agent_id: userInfo?.uuid || tempPropertyData?.agent_id
        };
        setTempPropertyData(newPropertyData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, suite, city, province, postalCode, country, squareFootage, notes]);

    const fieldBg = '#EEEEEE';

    return (
        <div className='font-alexandria'>
            <div className='w-full flex flex-col items-center'>
                <h1 className='font-[500] text-[25px] py-4 text-[#4290E9]'>Property Details</h1>
                <div className='w-full py-[16px] px-0 md:px-0 flex justify-center flex-col gap-[16px] text-[14px] font-[400] text-[#7D7D7D] max-w-[1000px]'>

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
