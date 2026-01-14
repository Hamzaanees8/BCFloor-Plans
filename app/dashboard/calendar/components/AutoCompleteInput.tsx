// GooglePlacesAutocomplete.tsx
import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';

// Define the structure for a place prediction
interface PlacePrediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

// Props interface
interface GooglePlacesAutocompleteProps {
    apiKey: string;
    placeholder?: string;
    onPlaceSelect?: (place: google.maps.places.PlaceResult | null) => void;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    inputClassName?: string;
    suggestionsContainerClassName?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
    apiKey,
    placeholder = 'Enter an address',
    onPlaceSelect,
    value = '',
    onChange,
    className = '',
    inputClassName = '',
    suggestionsContainerClassName = ''
}) => {
    // State
    const [inputValue, setInputValue] = useState<string>(value);
    const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);

    // Initialize Google Maps services
    useEffect(() => {
        if (!window.google) {
            // Load Google Maps JavaScript API dynamically
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            script.onload = () => {
                initializeServices();
            };
        } else {
            initializeServices();
        }

        return () => {
            // Cleanup if needed
        };
    }, [apiKey]);

    const initializeServices = () => {
        if (window.google?.maps?.places) {
            autocompleteService.current = new google.maps.places.AutocompleteService();
            placesService.current = new google.maps.places.PlacesService(
                document.createElement('div')
            );
        }
    };

    // Handle input change
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        onChange?.(value);

        if (value.length > 2) {
            fetchSuggestions(value);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Fetch suggestions from Google Places API
    const fetchSuggestions = async (input: string) => {
        if (!autocompleteService.current) return;

        setIsLoading(true);

        const request: google.maps.places.AutocompletionRequest = {
            input: input,
            types: ['address'], // Restrict to addresses
            componentRestrictions: { country: 'ca' }, // Optional: restrict to specific country
        };

        try {
            autocompleteService.current.getPlacePredictions(
                request,
                (predictions, status) => {
                    setIsLoading(false);

                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                        const formattedPredictions: PlacePrediction[] = predictions.map(pred => ({
                            place_id: pred.place_id,
                            description: pred.description,
                            structured_formatting: pred.structured_formatting || {
                                main_text: pred.description,
                                secondary_text: ''
                            }
                        }));

                        setSuggestions(formattedPredictions);
                        setShowSuggestions(true);
                        setSelectedIndex(-1);
                    } else {
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }
                }
            );
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setIsLoading(false);
            setSuggestions([]);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: PlacePrediction) => {
        setInputValue(suggestion.description);
        onChange?.(suggestion.description);
        setShowSuggestions(false);
        setSelectedIndex(-1);

        // Get full place details
        getPlaceDetails(suggestion.place_id);
    };

    // Get full place details
    const getPlaceDetails = (placeId: string) => {
        if (!placesService.current) return;

        const request: google.maps.places.PlaceDetailsRequest = {
            placeId: placeId,
            fields: [
                'address_components',
                'formatted_address',
                'geometry',
                'name',
                'place_id',
                'plus_code',
                'types'
            ]
        };

        placesService.current.getDetails(
            request,
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    onPlaceSelect?.(place);
                } else {
                    onPlaceSelect?.(null);
                }
            }
        );
    };

    // Handle keyboard navigation
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
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update input value when prop changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    return (
        <div className={`relative w-full !h-[40px]  ${className}`} ref={suggestionsRef}>
            <div className="relative">
                {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
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
                    w-full px-4 py-2 text-base
                    border-2 border-gray-300 rounded-lg
                    focus:outline-none focus:border-none focus:none focus:ring-none
                    transition-all duration-200
                    placeholder:text-gray-500
                    placeholder:text-sm
                    ${isLoading ? 'pr-10' : ''}
                    ${inputClassName}
                    `}
                    aria-autocomplete="list"
                    aria-controls="places-suggestions"
                    aria-expanded={showSuggestions}
                    aria-activedescendant={
                        selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
                    }
                />

                {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    id="places-suggestions"
                    className={`
                        absolute top-full left-0 right-0 mt-4
                        bg-white rounded-lg shadow-lg border border-gray-200
                        max-h-40 overflow-y-auto z-50
                        ${suggestionsContainerClassName}
                    `}
                    role="listbox"
                >
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.place_id}
                            id={`suggestion-${index}`}
                            className={`
                                px-4 py-3 cursor-pointer
                                border-b border-gray-100 last:border-b-0
                                transition-colors duration-150
                                hover:bg-gray-50
                                ${index === selectedIndex ? 'bg-blue-50 hover:bg-blue-50' : ''}
                            `}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            role="option"
                            aria-selected={index === selectedIndex}
                        >
                            <div className="text-gray-900">
                                {suggestion.structured_formatting.main_text}  {suggestion.structured_formatting.secondary_text}
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {showSuggestions && suggestions.length === 0 && !isLoading && inputValue.length > 2 && (
                <div className={`
                        absolute top-full left-0 right-0 mt-1
                        bg-white rounded-lg shadow-lg border border-gray-200
                        px-4 py-3 z-50
                        ${suggestionsContainerClassName}
                    `}>
                    <div className="text-gray-500 italic text-center">
                        No addresses found
                    </div>
                </div>
            )}
        </div>
    );
};

export default GooglePlacesAutocomplete;