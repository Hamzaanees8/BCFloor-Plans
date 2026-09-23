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

  // Trigger location update on double click
  const onMapDblClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!interactive || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      emitMapSettings({ lat, lng });
    },
    [interactive, emitMapSettings]
  );

  // Trigger location update when user drags and releases the pin marker
  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!interactive || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      emitMapSettings({ lat, lng });
    },
    [interactive, emitMapSettings]
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
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-[6px] shadow-md border border-gray-200 text-xs font-medium text-gray-700 flex items-center gap-1.5 pointer-events-auto">
            {isGeocoding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Geocoding address...</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Drag pin, pan, zoom, or toggle satellite to customize tour view</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
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
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={currentZoom}
        mapTypeId={currentMapType}
        onLoad={(map) => {
          mapRef.current = map;
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
