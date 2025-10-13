"use client";

import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useUnsaved } from "@/app/context/UnsavedContext";

interface Props {
  providerId?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  coords: LatLng[];
  setmap_coordinates: React.Dispatch<React.SetStateAction<LatLng[]>>;
}

export interface LatLng {
  lat: number;
  lng: number;
}

const containerStyle = { width: "100%", height: "500px" };
const defaultCenter = { lat: 49.2784262, lng: -123.0155276 };

export default function WorkAreaMap({
  address,
  city,
  province,
  country,
  coords,
  setmap_coordinates
}: Props) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] =
    useState<google.maps.LatLngLiteral>(defaultCenter);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const { setIsDirty } = useUnsaved();
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);



  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_PLACES_API_KEY || "",
    libraries: ["drawing"],
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fullAddress = `${address}, ${city}, ${province}, ${country}`;
      const isAnyAddressFieldProvided = address || city || province || country;

      if (!isAnyAddressFieldProvided) {
        setCenter(defaultCenter);
        return;
      }

      fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress
        )}&key=${process.env.NEXT_PUBLIC_PLACES_API_KEY}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "OK" && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            setCenter(location);
          } else {
            setCenter(defaultCenter);
          }
        })
        .catch(() => setCenter(defaultCenter));
    }, 500);

    return () => clearTimeout(timeout);
  }, [address, city, province, country]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    if (!window.google?.maps?.drawing) {
      console.error("Drawing library not available.");
      return;
    }

    const dm = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: { editable: true, draggable: true },
    });

    drawingManagerRef.current = dm;
    dm.setMap(map);

    google.maps.event.addListener(dm, "drawingmode_changed", () => {
    });

    google.maps.event.addListener(map, "mousedown", () => {
      const mode = dm.getDrawingMode();
      if (mode === window.google.maps.drawing.OverlayType.POLYGON) {
        setIsDirty(true);
      }
    });

    const listener = window.google.maps.event.addListener(
      dm,
      "overlaycomplete",
      (event: google.maps.drawing.OverlayCompleteEvent) => {
        if (polygonRef.current) {
          polygonRef.current.setMap(null);
        }

        if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
          polygonRef.current = event.overlay as google.maps.Polygon;

          dm.setDrawingMode(null);

          const coords: LatLng[] = polygonRef.current
            .getPath()
            .getArray()
            .map((p) => ({ lat: p.lat(), lng: p.lng() }));

          if (coords.length > 0) {
            coords.push({ ...coords[0] });
          }

          setmap_coordinates(coords);
          setIsDirty(true);
          console.log("Polygon completed. Coordinates saved:", coords);

          google.maps.event.addListener(polygonRef.current.getPath(), "set_at", () => {
            const updated = polygonRef.current!
              .getPath()
              .getArray()
              .map((p) => ({ lat: p.lat(), lng: p.lng() }));
            updated.push({ ...updated[0] });
            setmap_coordinates(updated);
            setIsDirty(true);
          });

          google.maps.event.addListener(polygonRef.current.getPath(), "insert_at", () => {
            const updated = polygonRef.current!
              .getPath()
              .getArray()
              .map((p) => ({ lat: p.lat(), lng: p.lng() }));
            updated.push({ ...updated[0] });
            setmap_coordinates(updated);
            setIsDirty(true);
          });
        }
      }
    );

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
      dm.setMap(null);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map, setmap_coordinates]);


  const savePolygon = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!polygonRef.current) {
      alert("Draw a polygon first.");
      return;
    }

    const coords: LatLng[] = polygonRef.current
      .getPath()
      .getArray()
      .map((p) => ({ lat: p.lat(), lng: p.lng() }));

    if (coords.length > 0) {
      coords.push({ ...coords[0] });
    }
    setmap_coordinates(coords)
    console.log('coords', coords);

  };

  const loadPolygon = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    if (!map) return;

    try {
      const data = {
        coordinates: coords
      };

      if (!data?.coordinates || data.coordinates.length === 0) {
        return;
      }

      if (polygonRef.current) polygonRef.current.setMap(null);

      const newPoly = new window.google.maps.Polygon({
        paths: data.coordinates,
        map,
        editable: true,
        draggable: true,
      });

      polygonRef.current = newPoly;

      const bounds = new window.google.maps.LatLngBounds();
      data.coordinates.forEach((c: LatLng) => bounds.extend(c));
      bounds.extend(center);
      map.fitBounds(bounds);
      google.maps.event.addListenerOnce(map, "idle", () => {
        map.setZoom(13);
      });

      console.log(":white_check_mark: Polygon + pin loaded successfully");
    } catch (err) {
      console.error(":x: Error loading polygon:", err);
      alert("Error loading polygon");
    }
  };

  useEffect(() => {
    if (isLoaded && map) {
      loadPolygon();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, isLoaded, map]);

  const resetFence = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    setmap_coordinates([]);
    setIsDirty(false);
    if (drawingManagerRef.current && map) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current.setMap(map);
    }

    console.log("Fence reset (both in-progress and completed)");
  };



  if (loadError) return <div>Map failed to load</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="w-[100%] mx-auto mb-4">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
      >
        <Marker position={center} />
      </GoogleMap>

      <br />
      <div className="flex gap-[10px] pl-3">
        <button
          onClick={(e) => savePolygon(e)}
          className="bg-blue-600 text-white px-4 py-2 rounded "
        >
          Save Work Area
        </button>
        <button
          onClick={(e) => resetFence(e)}
          className="bg-red-600 text-white px-4 py-2 rounded "
        >
          Reset
        </button>
      </div>

    </div>
  );
}
