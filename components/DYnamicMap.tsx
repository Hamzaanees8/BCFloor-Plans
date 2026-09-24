'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from '@react-google-maps/api';
import { Loader2, MapPin, RefreshCw, Crosshair } from 'lucide-react';

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

export interface MapSettings {
  lat: number;
  lng: number;
  zoom: number;
  mapType: string;
  centerLat: number;
  centerLng: number;
}

interface Props {
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  zoom?: number | null;
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain' | string | null;
  centerLat?: number | null;
  centerLng?: number | null;
  interactive?: boolean;
  onMapSettingsChange?: (settings: MapSettings) => void;
  onAddressChange?: (addressData: MapAddressData) => void;
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
  latitude,
  longitude,
  zoom,
  mapTypeId,
  centerLat,
  centerLng,
  interactive = false,
  onMapSettingsChange,
  onAddressChange,
  resetKey,
  className,
}: Props) {
  const { isLoaded } = useLoadScript({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_PLACES_API_KEY!,
    version: '3.64',
  });

  const hasExplicitCoords =
    latitude !== undefined &&
    latitude !== null &&
    !isNaN(Number(latitude)) &&
    longitude !== undefined &&
    longitude !== null &&
    !isNaN(Number(longitude));

  const initialMarkerLat = hasExplicitCoords ? Number(latitude) : defaultCoords.lat;
  const initialMarkerLng = hasExplicitCoords ? Number(longitude) : defaultCoords.lng;
  const initialCenterLat = centerLat !== undefined && centerLat !== null && !isNaN(Number(centerLat))
    ? Number(centerLat)
    : initialMarkerLat;
  const initialCenterLng = centerLng !== undefined && centerLng !== null && !isNaN(Number(centerLng))
    ? Number(centerLng)
    : initialMarkerLng;
  const initialZoom = zoom !== undefined && zoom !== null && !isNaN(Number(zoom)) && Number(zoom) > 0
    ? Number(zoom)
    : 15;
  const initialMapType = mapTypeId || 'roadmap';

  const [center, setCenter] = useState<google.maps.LatLngLiteral>({
    lat: initialCenterLat,
    lng: initialCenterLng,
  });
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral>({
    lat: initialMarkerLat,
    lng: initialMarkerLng,
  });
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
  const [currentMapType, setCurrentMapType] = useState<string>(initialMapType);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const isInternalUpdate = useRef(false);

  // Synchronize when explicit coordinate / settings props change externally
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (hasExplicitCoords) {
      const newMarker = { lat: Number(latitude), lng: Number(longitude) };
      const newCenter = {
        lat: centerLat !== undefined && centerLat !== null && !isNaN(Number(centerLat))
          ? Number(centerLat)
          : Number(latitude),
        lng: centerLng !== undefined && centerLng !== null && !isNaN(Number(centerLng))
          ? Number(centerLng)
          : Number(longitude),
      };
      setMarkerPosition(newMarker);
      setCenter(newCenter);
      if (mapRef.current) {
        mapRef.current.setCenter(newCenter);
      }
    }

    if (zoom !== undefined && zoom !== null && !isNaN(Number(zoom)) && Number(zoom) > 0) {
      setCurrentZoom(Number(zoom));
      if (mapRef.current) {
        mapRef.current.setZoom(Number(zoom));
      }
    }

    if (mapTypeId) {
      setCurrentMapType(mapTypeId);
      if (mapRef.current) {
        mapRef.current.setMapTypeId(mapTypeId);
      }
    }
  }, [latitude, longitude, zoom, mapTypeId, centerLat, centerLng, hasExplicitCoords]);

  // Forward geocode fallback when address props change and no custom coordinates are present
  const forwardGeocode = useCallback(() => {
    const fullAddress = [address, city, province, country].filter(Boolean).join(', ');
    const isAnyAddressFieldProvided = address || city || province || country;

    if (!isAnyAddressFieldProvided) {
      setCenter(defaultCoords);
      setMarkerPosition(defaultCoords);
      return;
    }

    setIsGeocoding(true);
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullAddress
      )}&key=${process.env.NEXT_PUBLIC_PLACES_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        setIsGeocoding(false);
        if (data.status === 'OK' && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          setCenter(location);
          setMarkerPosition(location);
          if (mapRef.current) {
            mapRef.current.setCenter(location);
          }

          if (interactive && onMapSettingsChange) {
            isInternalUpdate.current = true;
            onMapSettingsChange({
              lat: location.lat,
              lng: location.lng,
              zoom: currentZoom,
              mapType: currentMapType,
              centerLat: location.lat,
              centerLng: location.lng,
            });
          }
        } else {
          setCenter(defaultCoords);
          setMarkerPosition(defaultCoords);
        }
      })
      .catch(() => {
        setIsGeocoding(false);
        setCenter(defaultCoords);
        setMarkerPosition(defaultCoords);
      });
  }, [address, city, province, country, interactive, onMapSettingsChange, currentZoom, currentMapType]);

  // When address changes and no explicit coords are set yet, geocode address
  useEffect(() => {
    if (hasExplicitCoords) return;
    const timeout = setTimeout(forwardGeocode, 500);
    return () => clearTimeout(timeout);
  }, [address, city, province, country, hasExplicitCoords, forwardGeocode]);

  // If resetKey changes (e.g. user requested reset), revert pin to geocoded address
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      forwardGeocode();
    }
  }, [resetKey, forwardGeocode]);

  // Notify parent of changes in interactive mode
  const emitMapSettings = useCallback(
    (overrides?: Partial<MapSettings>) => {
      if (!interactive || !onMapSettingsChange) return;

      const currentC = mapRef.current?.getCenter();
      const currentZ = mapRef.current?.getZoom() ?? currentZoom;
      const currentT = mapRef.current?.getMapTypeId() ?? currentMapType;

      const newSettings: MapSettings = {
        lat: overrides?.lat ?? markerPosition.lat,
        lng: overrides?.lng ?? markerPosition.lng,
        zoom: overrides?.zoom ?? currentZ,
        mapType: overrides?.mapType ?? (typeof currentT === 'string' ? currentT : 'roadmap'),
        centerLat: overrides?.centerLat ?? (currentC ? currentC.lat() : center.lat),
        centerLng: overrides?.centerLng ?? (currentC ? currentC.lng() : center.lng),
      };

      isInternalUpdate.current = true;
      onMapSettingsChange(newSettings);
    },
    [interactive, onMapSettingsChange, markerPosition, currentZoom, currentMapType, center]
  );

  // Reverse geocode when pin marker is dropped or double-clicked
  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!interactive || !onAddressChange) return;
      setIsGeocoding(true);

      const doReverseGeocode = (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus | string) => {
        setIsGeocoding(false);
        if (status === 'OK' && results && results.length > 0) {
          let targetResult = results.find(
            (r) =>
              r.types.includes('street_address') &&
              r.address_components.some((c) => c.types.includes('street_number'))
          );

          if (!targetResult) {
            targetResult = results.find(
              (r) =>
                (r.types.includes('premise') || r.types.includes('subpremise')) &&
                r.address_components.some((c) => c.types.includes('street_number'))
            );
          }

          if (!targetResult) {
            targetResult = results.find((r) => r.types.includes('street_address')) || results[0];
          }

          let streetNumber = '';
          let route = '';
          let city = '';
          let province = '';
          let country = '';
          let postalCode = '';

          for (const component of targetResult.address_components) {
            const types = component.types;
            if (types.includes('street_number')) streetNumber = component.long_name;
            if (types.includes('route')) route = component.long_name;
            if (types.includes('locality')) city = component.long_name;
            else if (!city && (types.includes('sublocality_level_1') || types.includes('postal_town'))) city = component.long_name;
            if (types.includes('administrative_area_level_1')) province = component.short_name;
            if (types.includes('country')) country = component.short_name;
            if (types.includes('postal_code')) postalCode = component.long_name;
          }

          // If components are missing, fallback across remaining results
          if (!streetNumber || !city || !province || !postalCode) {
            for (const r of results) {
              for (const c of r.address_components) {
                if (!streetNumber && c.types.includes('street_number')) streetNumber = c.long_name;
                if (!route && c.types.includes('route')) route = c.long_name;
                if (!city && c.types.includes('locality')) city = c.long_name;
                if (!province && c.types.includes('administrative_area_level_1')) province = c.short_name;
                if (!postalCode && c.types.includes('postal_code')) postalCode = c.long_name;
              }
            }
          }

          const addressLine1 = (streetNumber && route)
            ? `${streetNumber} ${route}`
            : (route || targetResult.formatted_address.split(',')[0] || '');

          const addressData: MapAddressData = {
            address_line_1: addressLine1,
            city,
            province,
            country: country || 'CA',
            postal_code: postalCode,
            full_address: targetResult.formatted_address,
            lat,
            lng,
          };

          isInternalUpdate.current = true;
          onAddressChange(addressData);
        }
      };

      if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            doReverseGeocode(results, status);
          } else {
            setIsGeocoding(false);
          }
        });
      } else {
        setIsGeocoding(false);
      }
    },
    [interactive, onAddressChange]
  );

  // Trigger location update on double click
  const onMapDblClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!interactive || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      emitMapSettings({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [interactive, emitMapSettings, reverseGeocode]
  );

  // Trigger location update when user drags and releases the pin marker
  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!interactive || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      emitMapSettings({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [interactive, emitMapSettings, reverseGeocode]
  );

  // Handle map panning
  const onDragEnd = useCallback(() => {
    if (!interactive || !mapRef.current) return;
    const mapCenter = mapRef.current.getCenter();
    if (mapCenter) {
      const cLat = mapCenter.lat();
      const cLng = mapCenter.lng();
      setCenter({ lat: cLat, lng: cLng });
      emitMapSettings({ centerLat: cLat, centerLng: cLng });
    }
  }, [interactive, emitMapSettings]);

  // Handle zoom changes
  const onZoomChanged = useCallback(() => {
    if (!interactive || !mapRef.current) return;
    const newZoom = mapRef.current.getZoom();
    if (newZoom !== undefined && newZoom !== currentZoom) {
      setCurrentZoom(newZoom);
      emitMapSettings({ zoom: newZoom });
    }
  }, [interactive, currentZoom, emitMapSettings]);

  // Handle map type changes (roadmap, satellite, hybrid, terrain)
  const onMapTypeIdChanged = useCallback(() => {
    if (!interactive || !mapRef.current) return;
    const newType = mapRef.current.getMapTypeId();
    if (newType && newType !== currentMapType) {
      const typeStr = typeof newType === 'string' ? newType : 'roadmap';
      setCurrentMapType(typeStr);
      emitMapSettings({ mapType: typeStr });
    }
  }, [interactive, currentMapType, emitMapSettings]);

  const handleCenterOnPin = () => {
    if (mapRef.current) {
      mapRef.current.panTo(markerPosition);
      setCenter(markerPosition);
      emitMapSettings({
        centerLat: markerPosition.lat,
        centerLng: markerPosition.lng,
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[250px] flex items-center justify-center bg-gray-100 text-gray-500 rounded-[6px]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading map...</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-[6px] ${className || ''}`}>
      {interactive && (
        <>
          {/* Top Center Info Badge */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-auto max-w-[calc(100%-200px)] text-center hidden sm:block">
            <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md border border-gray-200/80 text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 whitespace-nowrap">
              {isGeocoding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                  <span>Updating address from pin...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Drag pin to update address, or pan & zoom to customize tour view</span>
                </>
              )}
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 pointer-events-auto">
            <span className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-[6px] shadow-md border border-gray-200 text-xs font-semibold text-gray-700">
              Zoom: {currentZoom}
            </span>
            <button
              type="button"
              onClick={handleCenterOnPin}
              title="Center map on pin"
              className="bg-white/95 hover:bg-white backdrop-blur-sm px-2.5 py-1.5 rounded-[6px] shadow-md border border-gray-200 text-xs font-medium text-gray-700 flex items-center gap-1 transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Center Pin</span>
            </button>
            <button
              type="button"
              onClick={forwardGeocode}
              title="Reset pin and view to address"
              className="bg-white/95 hover:bg-white backdrop-blur-sm px-2.5 py-1.5 rounded-[6px] shadow-md border border-gray-200 text-xs font-medium text-gray-700 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={currentZoom}
        mapTypeId={currentMapType}
        onLoad={(map) => {
          mapRef.current = map;
          if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
            map.setCenter(center);
          }
          if (typeof currentZoom === 'number' && currentZoom > 0) {
            map.setZoom(currentZoom);
          }
          if (currentMapType) {
            map.setMapTypeId(currentMapType);
          }
        }}
        onUnmount={() => {
          mapRef.current = null;
        }}
        onDblClick={onMapDblClick}
        onDragEnd={onDragEnd}
        onZoomChanged={onZoomChanged}
        onMapTypeIdChanged={onMapTypeIdChanged}
        options={{
          disableDoubleClickZoom: interactive,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          gestureHandling: 'greedy',
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
