'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

export interface MapAddressData {
  address_line_1: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
  full_address: string;
  lat: number;
  lng: number;
}

interface Props {
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  interactive?: boolean;
  onLocationSelect?: (addressData: MapAddressData) => void;
  resetKey?: number;
  className?: string;
}

const defaultCoords = {
  lat: 49.2784262, // 4445 Parker Street
  lng: -123.0155276,
};

export default function DynamicMap({
  address,
  city,
  province,
  country,
  interactive = false,
  onLocationSelect,
  resetKey,
  className,
}: Props) {
  const { isLoaded } = useLoadScript({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_PLACES_API_KEY!,
    version: '3.64',
  });

  const [center, setCenter] = useState<google.maps.LatLngLiteral>(defaultCoords);
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral>(defaultCoords);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const isInternalPinShift = useRef(false);

  // Forward geocode when address props change externally or on resetKey change
  const forwardGeocode = useCallback(() => {
    const fullAddress = [address, city, province, country].filter(Boolean).join(', ');
    const isAnyAddressFieldProvided = address || city || province || country;

    if (!isAnyAddressFieldProvided) {
      setCenter(defaultCoords);
      setMarkerPosition(defaultCoords);
      return;
    }

    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullAddress
      )}&key=${process.env.NEXT_PUBLIC_PLACES_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK' && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          setCenter(location);
          setMarkerPosition(location);
        } else {
          setCenter(defaultCoords);
          setMarkerPosition(defaultCoords);
        }
      })
      .catch(() => {
        setCenter(defaultCoords);
        setMarkerPosition(defaultCoords);
      });
  }, [address, city, province, country]);

  useEffect(() => {
    if (isInternalPinShift.current) {
      isInternalPinShift.current = false;
      return;
    }
    const timeout = setTimeout(forwardGeocode, 500);
    return () => clearTimeout(timeout);
  }, [address, city, province, country, forwardGeocode]);

  // If resetKey changes (e.g. user cancelled confirmation), revert pin to current saved address
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      forwardGeocode();
    }
  }, [resetKey, forwardGeocode]);

  // Reverse geocode handler for interactive double-clicks and pin dragging
  const handleCoordsChange = useCallback(
    (lat: number, lng: number) => {
      if (!interactive || !onLocationSelect || !isLoaded || !window.google?.maps?.Geocoder) {
        return;
      }

      // Immediately move pin & center to clicked/dragged position
      setMarkerPosition({ lat, lng });
      setCenter({ lat, lng });
      setIsGeocoding(true);

      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        setIsGeocoding(false);

        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const result =
            results.find(
              (r) =>
                r.types.includes('street_address') ||
                r.types.includes('premise') ||
                r.types.includes('subpremise')
            ) || results[0];

          let streetNumber = '';
          let route = '';
          let locality = '';
          let sublocality = '';
          let provinceVal = '';
          let countryVal = '';
          let postalCodeVal = '';

          result.address_components.forEach((component) => {
            const types = component.types;
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              route = component.long_name;
            } else if (types.includes('locality')) {
              locality = component.long_name;
            } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
              sublocality = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              provinceVal = component.short_name || component.long_name;
            } else if (types.includes('country')) {
              countryVal = component.short_name || component.long_name;
            } else if (types.includes('postal_code')) {
              postalCodeVal = component.long_name;
            }
          });

          const addressLine1 =
            streetNumber && route
              ? `${streetNumber} ${route}`
              : route || (result.formatted_address ? result.formatted_address.split(',')[0] : '');

          const cityVal = locality || sublocality || '';

          const resolvedAddress: MapAddressData = {
            address_line_1: addressLine1.trim(),
            city: cityVal.trim(),
            province: provinceVal.trim(),
            country: countryVal.trim(),
            postal_code: postalCodeVal.trim(),
            full_address: result.formatted_address || '',
            lat,
            lng,
          };

          isInternalPinShift.current = true;
          onLocationSelect(resolvedAddress);
        } else {
          console.warn('Geocode was not successful:', status);
        }
      });
    },
    [interactive, onLocationSelect, isLoaded]
  );

  // Trigger location update on double click (so single-click pan / grab is unaffected)
  const onMapDblClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!interactive || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      handleCoordsChange(lat, lng);
    },
    [interactive, handleCoordsChange]
  );

  // Trigger location update when user drags and releases the pin marker
  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!interactive || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      handleCoordsChange(lat, lng);
    },
    [interactive, handleCoordsChange]
  );

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 rounded-[6px]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading map...</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-[6px] ${className || ''}`}>
      {interactive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-[6px] shadow-md border border-gray-200 text-xs font-medium text-gray-700 flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
          {isGeocoding ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Fetching address for pin...</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Double-click map or drag pin to update address</span>
            </>
          )}
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onDblClick={onMapDblClick}
        options={{
          disableDoubleClickZoom: interactive,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        <Marker
          position={markerPosition}
          draggable={interactive}
          onDragEnd={onMarkerDragEnd}
        />
      </GoogleMap>
    </div>
  );
}
