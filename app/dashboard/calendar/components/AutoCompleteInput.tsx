import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Country, State } from "country-state-city";

// Define the structure for a place prediction
interface PlacePrediction {
    placeId: string;
    text: {
        text: string;
    };
    structuredFormat: {
        mainText: {
            text: string;
        };
        secondaryText?: {
            text: string;
        };
    };
}

export interface Place {
    id: string;
    formattedAddress: string;
    addressComponents: {
        longText: string;
        shortText: string;
        types: string[];
    }[];
    location: {
        latitude: number;
        longitude: number;
    };
    name: string;
    types: string[];
}

export interface AddressComponents {
    address_line_1: string;
    city: string;
    province: string;
    country: string;
    postal_code: string;
    full_address: string;
}

// Props interface
interface GooglePlacesAutocompleteProps {
    placeholder?: string;
    onPlaceSelect?: (place: Place | null) => void;
    onAddressComponents?: (components: AddressComponents) => void;
    value?: string;
    onChange?: (value: string) => void;
    mode?: 'single' | 'split';
    addressComponents?: AddressComponents;
    onAddressComponentsChange?: (components: AddressComponents) => void;
    className?: string;
    inputClassName?: string;
    suggestionsContainerClassName?: string;

    fieldErrors?: Record<string, string[]>;
    autoFocus?: boolean;
    inputStyle?: React.CSSProperties;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = (props) => {
    const {
        placeholder = 'Enter an address',
        onPlaceSelect,
        onAddressComponents,
        value,
        onChange,
        mode = 'single',
        addressComponents,
        onAddressComponentsChange,
        className = '',
        inputClassName = '',
        suggestionsContainerClassName = '',
        fieldErrors = {},
        autoFocus = false,
        inputStyle = {},
    } = props;

    const apiKey = process.env.NEXT_PUBLIC_PLACES_API_KEY;

    const [inputValue, setInputValue] = useState<string>(value || '');
    const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    const [localComponents, setLocalComponents] = useState<AddressComponents>(addressComponents || {
        address_line_1: '',
        city: '',
        province: 'BC',
        country: 'CA',
        postal_code: '',
        full_address: ''
    });

    const components = addressComponents || localComponents;

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const lastQueryRef = useRef<string>('');
    const isSelectingRef = useRef<boolean>(false);
    const isUserTypingRef = useRef<boolean>(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        isUserTypingRef.current = true;
        const val = e.target.value;
        setInputValue(val);
        onChange?.(val);

        if (mode === 'split') {
            const newComp = { ...components, address_line_1: val };
            setLocalComponents(newComp);
            onAddressComponentsChange?.(newComp);
        }
    };

    const handleFieldChange = (field: keyof AddressComponents, val: string) => {
        const newComp = { ...components, [field]: val };
        setLocalComponents(newComp);
        onAddressComponentsChange?.(newComp);

        if (field === 'address_line_1') {
            setInputValue(val);
            onChange?.(val);
        }
    };

    const fetchSuggestions = useCallback(async (input: string) => {
        if (!apiKey) return;
        lastQueryRef.current = input;
        setIsLoading(true);

        try {
            const response = await fetch(`https://places.googleapis.com/v1/places:autocomplete?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: input,
                    includedRegionCodes: ['CA', 'US'],
                    locationBias: {
                        circle: {
                            center: {
                                latitude: 49.2827,
                                longitude: -123.1207,
                            },
                            radius: 50000.0,
                        },
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Autocomplete API Error:', errorData);
                throw new Error(errorData.message || 'Failed to fetch suggestions');
            }

            const data = await response.json();

            if (lastQueryRef.current !== input || !isUserTypingRef.current) return;

            setIsLoading(false);

            if (data.suggestions && data.suggestions.length > 0) {
                const formattedPredictions = data.suggestions.map((s: { placePrediction: PlacePrediction }) => s.placePrediction);
                
                // Prioritize Canadian / BC suggestions at the top of the autocomplete list
                formattedPredictions.sort((a: PlacePrediction, b: PlacePrediction) => {
                    const textA = (a.text?.text || '').toLowerCase();
                    const textB = (b.text?.text || '').toLowerCase();
                    const isCanadaA = textA.includes(', bc,') || textA.includes(' bc ') || textA.includes(', canada') || textA.includes(', bc, canada');
                    const isCanadaB = textB.includes(', bc,') || textB.includes(' bc ') || textB.includes(', canada') || textB.includes(', bc, canada');
                    if (isCanadaA && !isCanadaB) return -1;
                    if (!isCanadaA && isCanadaB) return 1;
                    return 0;
                });

                setSuggestions(formattedPredictions);
                setShowSuggestions(true);
                setSelectedIndex(-1);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            if (lastQueryRef.current === input) {
                console.error('Error fetching suggestions:', error);
                setIsLoading(false);
                setSuggestions([]);
            }
        }
    }, [apiKey]);

    useEffect(() => {
        if (isSelectingRef.current || !isUserTypingRef.current) {
            isSelectingRef.current = false;
            return;
        }

        if (inputValue.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                fetchSuggestions(inputValue);
            }, 300);

            return () => clearTimeout(delayDebounceFn);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setIsLoading(false);
            lastQueryRef.current = '';
        }
    }, [inputValue, fetchSuggestions]);

    const getPlaceDetails = async (placeId: string) => {
        try {
            const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?key=${apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location,name,types',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Place Details API Error:', errorData);
                throw new Error(errorData.message || 'Failed to fetch place details');
            }

            const place: Place = await response.json();
            onPlaceSelect?.(place);

            if (place.addressComponents) {
                const newComponents: AddressComponents = {
                    address_line_1: '',
                    city: '',
                    province: '',
                    country: '',
                    postal_code: '',
                    full_address: place.formattedAddress || ''
                };

                let streetNumber = '';
                let route = '';

                place.addressComponents.forEach((component) => {
                    const types = component.types;

                    if (types.includes('street_number')) {
                        streetNumber = component.longText;
                    } else if (types.includes('route')) {
                        route = component.longText;
                    } else if (types.includes('locality')) {
                        newComponents.city = component.longText;
                    } else if (types.includes('administrative_area_level_1')) {
                        newComponents.province = component.shortText;
                    } else if (types.includes('country')) {
                        newComponents.country = component.shortText;
                    } else if (types.includes('postal_code')) {
                        newComponents.postal_code = component.longText;
                    }
                });

                newComponents.address_line_1 = `${streetNumber} ${route}`.trim();

                setLocalComponents(newComponents);
                onAddressComponents?.(newComponents);
                onAddressComponentsChange?.(newComponents);

                // Update input value based on mode
                const finalValue = mode === 'split'
                    ? newComponents.address_line_1
                    : (place.formattedAddress || newComponents.full_address);

                if (finalValue) {
                    setInputValue(finalValue);
                    onChange?.(finalValue);
                }
            }
        } catch (error) {
            console.error('Error fetching place details:', error);
            onPlaceSelect?.(null);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: PlacePrediction) => {
        isUserTypingRef.current = false;
        isSelectingRef.current = true;
        setInputValue(suggestion.text.text);
        lastQueryRef.current = `selection-${suggestion.placeId}`;
        onChange?.(suggestion.text.text);
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);

        // Get full place details
        getPlaceDetails(suggestion.placeId);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                }
                break;

            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                isUserTypingRef.current = false; // Reset typing state on escape
                break;
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current !== event.target
            ) {
                setShowSuggestions(false);
                isUserTypingRef.current = false;
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update input value when prop changes
    useEffect(() => {
        // Only update if value is explicitly provided and differs
        if (value !== undefined && value !== inputValue) {
            isUserTypingRef.current = false;
            isSelectingRef.current = true;
            setInputValue(value);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [value, inputValue]);

    // Update local components when prop changes
    useEffect(() => {
        if (addressComponents) {
            setLocalComponents(addressComponents);
            // Sync inputValue if external address_line_1 changed and user is not typing
            if (!isUserTypingRef.current && addressComponents.address_line_1 !== inputValue) {
                setInputValue(addressComponents.address_line_1 || '');
            }
        }
    }, [addressComponents, inputValue]);

    const states = components.country ? State.getStatesOfCountry(components.country) : [];

    const renderSearchInput = () => (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (suggestions.length > 0) {
                        setShowSuggestions(true);
                    }
                }}
                placeholder={placeholder}
                className={`
                w-full px-2 py-2 text-[14px]
                border-[1px] border-gray-300 rounded-md
                focus:outline-none
                transition-all duration-200
                placeholder:text-gray-500
                placeholder:text-[14px]
                bg-transparent
                ${isLoading ? 'pr-10' : ''}
                ${inputClassName}
                `}
                style={inputStyle}
                aria-autocomplete="list"
                aria-controls="places-suggestions"
                autoFocus={autoFocus}
            />

            {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <div
                    id="places-suggestions"
                    className={`
                        absolute top-full left-0 right-0 mt-1
                        bg-white rounded-md shadow-lg border border-gray-200
                        max-h-40 overflow-y-auto z-[100]
                        custom-scroll
                        ${suggestionsContainerClassName}
                    `}
                    role="listbox"
                >
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.placeId}
                            id={`suggestion-${index}`}
                            className={`
                                px-4 py-2 cursor-pointer
                                border-b border-gray-100 last:border-b-0
                                transition-colors duration-150
                                hover:bg-gray-50
                                ${index === selectedIndex ? 'bg-blue-50 hover:bg-blue-50' : ''}
                            `}
                            onClick={() => {
                                handleSuggestionClick(suggestion);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            role="option"
                            aria-selected={index === selectedIndex}
                        >
                            <div className="text-gray-900">
                                {suggestion.structuredFormat.mainText.text}  {suggestion.structuredFormat.secondaryText?.text}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showSuggestions && suggestions.length === 0 && !isLoading && inputValue.length > 2 && (
                <div className={`
                        absolute top-full left-0 right-0 mt-1
                        bg-white rounded-lg shadow-lg border border-gray-200
                        px-4 py-3 z-[100]
                        ${suggestionsContainerClassName}
                    `}>
                    <div className="text-gray-500 italic text-center">
                        No addresses found
                    </div>
                </div>
            )}
        </div>
    );

    if (mode === 'split') {
        return (
            <div className={`w-full flex flex-col gap-[16px] text-[#424242] text-[14px] font-[400] ${className}`} ref={suggestionsRef}>
                <div className="space-y-[10px]">
                    <Label>Address <span className="text-red-500">*</span></Label>
                    {renderSearchInput()}
                    {fieldErrors.address && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.address[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-[16px]">
                    <div className="space-y-[10px]">
                        <Label>City <span className="text-red-500">*</span></Label>
                        <Input
                            value={components.city}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                            placeholder="e.g Burnaby"
                            className={`h-[42px] bg-transparent border-[1px] ${fieldErrors.city ? "border-red-500" : "border-[#BBBBBB]"} focus:outline-none`}
                        />
                        {fieldErrors.city && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.city[0]}</p>}
                    </div>

                    <div className="space-y-[10px]">
                        <Label>{components.country === 'US' ? 'State' : 'Province'} <span className="text-red-500">*</span></Label>
                        <Select
                            value={components.province}
                            onValueChange={(val) => handleFieldChange('province', val)}
                        >
                            <SelectTrigger className={`w-full h-[42px] bg-transparent border ${fieldErrors.province ? "border-red-500" : "border-[#BBBBBB]"} focus:outline-none`}>
                                <SelectValue placeholder="Select Province" />
                            </SelectTrigger>
                            <SelectContent>
                                {states.map((s) => (
                                    <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldErrors.province && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.province[0]}</p>}
                    </div>

                    <div className="space-y-[10px]">
                        <Label>Postal Code <span className="text-red-500">*</span></Label>
                        <Input
                            value={components.postal_code}
                            onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                            placeholder="e.g V5H 0H4"
                            className={`h-[42px] bg-transparent border-[1px] ${fieldErrors.postal_code ? "border-red-500" : "border-[#BBBBBB]"} focus:outline-none`}
                        />
                        {fieldErrors.postal_code && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.postal_code[0]}</p>}
                    </div>

                    <div className="space-y-[10px]">
                        <Label>Country</Label>
                        <Select
                            value={components.country}
                            onValueChange={(val) => handleFieldChange('country', val)}
                        >
                            <SelectTrigger className="w-full h-[42px] bg-transparent border border-[#BBBBBB] focus:outline-none">
                                <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                                {Country.getAllCountries().map((c) => (
                                    <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full ${className}`} ref={suggestionsRef}>
            {renderSearchInput()}
        </div>
    );
};

export default GooglePlacesAutocomplete;
