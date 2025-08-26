'use client';

import React, { useEffect, useState } from 'react';
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

interface Props {
  address?: string;
  city?: string;
  province?: string;
  country?: string;
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
}: Props) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_PLACES_API_KEY!,
  });

  const [center, setCenter] = useState<google.maps.LatLngLiteral>(defaultCoords);

 useEffect(() => {
  const timeout = setTimeout(() => {
    const fullAddress = `${address}, ${city}, ${province}, ${country}`;
    const isAnyAddressFieldProvided = address || city || province || country;

    if (!isAnyAddressFieldProvided) {
      setCenter(defaultCoords);
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
        } else {
          setCenter(defaultCoords);
        }
      })
      .catch(() => setCenter(defaultCoords));
  }, 500);

  return () => clearTimeout(timeout); 
}, [address, city, province, country]);


  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
      <Marker position={center} />
    </GoogleMap>
  );
}
