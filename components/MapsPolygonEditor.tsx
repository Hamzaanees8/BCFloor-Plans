"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";

interface LatLng {
  lat: number;
  lng: number;
}

const containerStyle = { width: "100%", height: "500px" };
const defaultCenter = { lat: 55.6844, lng: -73.0479 };

export default function MapsPolygonEditor() {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // ✅ useRef instead of state for polygon
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_PLACES_API_KEY || "",
    libraries: ["drawing"],
  });

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

    dm.setMap(map);

    const listener = window.google.maps.event.addListener(
      dm,
      "overlaycomplete",
      (event: google.maps.drawing.OverlayCompleteEvent) => {
        console.log("overlaycomplete event:", event);

        // ✅ Always clear old polygon before setting new one
        if (polygonRef.current) {
          polygonRef.current.setMap(null);
          console.log("Old polygon removed");
        }

        if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
          polygonRef.current = event.overlay as google.maps.Polygon;
          dm.setDrawingMode(null);
          console.log("New polygon set on map");
        }
      }
    );

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
      dm.setMap(null);
    };
  }, [isLoaded, map]);

  // Save polygon
  const savePolygon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!polygonRef.current) {
      alert("Draw a polygon first.");
      return;
    }

    const coords: LatLng[] = polygonRef.current
      .getPath()
      .getArray()
      .map((p) => ({ lat: p.lat(), lng: p.lng() }));

    console.log("Polygon coords ready to send:", coords);
    alert("Area Saved Successfully.");
    // TODO: Send coords to API
    //  try {
    //    // ✅ POST polygon to API
    //    const res = await fetch("/api/polygons", {
    //      method: "POST",
    //      headers: { "Content-Type": "application/json" },
    //      body: JSON.stringify({ coordinates: coords }),
    //    });

    //    if (!res.ok) throw new Error("Failed to save polygon");
    //    const data = await res.json();
    //    console.log("✅ Polygon saved successfully:", data);
    //    alert("Polygon saved!");
    //  } catch (err) {
    //    console.error("❌ Error saving polygon:", err);
    //    alert("Error saving polygon");
    //  }
  };

  // Load polygon
  const loadPolygon = async () => {
    if (!map) return;
    console.log(polygonRef.current);
    // try {
    //   const res = await fetch("/api/polygons");
    //   if (!res.ok) throw new Error("Failed to load polygon");
    //   const data = await res.json();

    //   if (polygonRef.current) polygonRef.current.setMap(null);

    //   const newPoly = new window.google.maps.Polygon({
    //     paths: data.coordinates,
    //     map,
    //     editable: true,
    //     draggable: true,
    //   });

    //   polygonRef.current = newPoly;
    // } catch (err) {
    //   console.error("Error loading polygon:", err);
    // }
  };

  if (loadError) return <div>Map failed to load</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="w-[90%] mx-auto mb-4">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
      />
      <br />
      <button
        onClick={(e)=>savePolygon(e)}
        className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
      >
        Save Work Area
      </button>
      <button
        onClick={loadPolygon}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Load Work Area
      </button>
    </div>
  );
}
