"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, MapPin, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOrderContext } from "../context/OrderContext";
import { GetTourSettings } from "../../global-settings/global-settings";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";

interface FloorplanAreasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Pure other areas default list (strictly no living levels or finished spaces)
const DEFAULT_OTHER_AREAS = [
  "Deck",
  "Garage",
  "Patio",
  "Driveway",
  "Storage Area",
  "Detached Garage",
  "Attached Garage",
  "Covered Patio",
  "Porch",
  "Balcony",
  "Laneway House",
  "Secondary Suite",
  "Attic",
  "Workshop",
  "Storage Room",
  "Solarium",
  "Unfinished Basement"
];

// Helper to filter out finished spaces and living levels
const isExcludedLevel = (areaName: string, typeName?: string): boolean => {
  const a = String(areaName || "").toLowerCase().trim();
  const t = String(typeName || "").toLowerCase().trim();
  if (t.includes("finished") || t.includes("sub") || t.includes("subtotal")) return true;
  if (
    a.includes("main") ||
    a.includes("upper") ||
    a.includes("lower") ||
    a.includes("finished basement") ||
    a.includes("living")
  ) {
    return true;
  }
  if (a === "level" || a.endsWith(" level")) return true;
  return false;
};

// Module-level cache so we never re-flash living levels when reopening the modal
let cachedFilteredOtherAreas: string[] | null = null;

export default function FloorplanAreasModal({
  open,
  onOpenChange,
}: FloorplanAreasModalProps) {
  const { floorplanAreas, setFloorplanAreas, floorplanNotes, setFloorplanNotes } = useOrderContext();
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string)?.toLowerCase() || "admin";
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings["admin"];
  const brandColor = roleSettings?.pageTabColor || "#2563EB";

  // Initialize strictly with cached or default other areas
  const [availableAreas, setAvailableAreas] = useState<string[]>(
    cachedFilteredOtherAreas || DEFAULT_OTHER_AREAS
  );
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [customAreaInput, setCustomAreaInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedAreas([...floorplanAreas]);
      setNotes(floorplanNotes || "");
      setCustomAreaInput("");

      // If we don't have cached areas yet, fetch and filter strictly for Other areas
      if (!cachedFilteredOtherAreas) {
        setIsLoading(true);
        GetTourSettings()
          .then((res: any) => {
            const tourSettings = res?.data?.tour_settings || res?.tour_settings || [];

            const filtered = tourSettings
              .filter((s: any) => {
                if (!s.status || !s.area || String(s.area).trim().length === 0) return false;
                return !isExcludedLevel(s.area, s.type);
              })
              .map((s: any) => String(s.area).trim());

            if (filtered.length > 0) {
              cachedFilteredOtherAreas = filtered;
              setAvailableAreas(filtered);
            } else {
              cachedFilteredOtherAreas = DEFAULT_OTHER_AREAS;
              setAvailableAreas(DEFAULT_OTHER_AREAS);
            }
          })
          .catch((err) => {
            console.error("Failed to load tour settings for other areas:", err);
            cachedFilteredOtherAreas = DEFAULT_OTHER_AREAS;
            setAvailableAreas(DEFAULT_OTHER_AREAS);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setAvailableAreas(cachedFilteredOtherAreas);
      }
    }
  }, [open, floorplanAreas, floorplanNotes]);

  const toggleArea = (areaName: string) => {
    setSelectedAreas((prev) => {
      if (prev.includes(areaName)) {
        return prev.filter((a) => a !== areaName);
      } else {
        return [...prev, areaName];
      }
    });
  };

  const handleAddCustomArea = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customAreaInput.trim();
    if (!trimmed) return;

    if (!availableAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setAvailableAreas((prev) => [...prev, trimmed]);
      if (cachedFilteredOtherAreas) {
        cachedFilteredOtherAreas = [...cachedFilteredOtherAreas, trimmed];
      }
    }
    if (!selectedAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedAreas((prev) => [...prev, trimmed]);
    }
    setCustomAreaInput("");
  };

  const handleSave = () => {
    setFloorplanAreas(selectedAreas);
    setFloorplanNotes(notes.trim());
    toast.success(
      selectedAreas.length > 0
        ? `Added ${selectedAreas.length} other area(s) to measure`
        : "Other areas to measure updated"
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl font-alexandria">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: brandColor }}
            >
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle
                className="text-lg font-bold uppercase tracking-wide"
                style={{ color: brandColor }}
              >
                Other Areas to Measure
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Select the other areas the floor plan technician should measure on-site.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Areas Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Default Other Areas {isLoading && <Loader2 className="w-3 h-3 inline animate-spin ml-1 text-gray-400" />}
              </span>
              {selectedAreas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedAreas([])}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium"
                >
                  Clear Selection ({selectedAreas.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto p-1 thin-scroll border border-gray-100 rounded-md bg-gray-50/60 p-2.5">
              {availableAreas.map((area) => {
                const isSelected = selectedAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "text-white shadow-xs"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-100/70"
                    }`}
                    style={isSelected ? { backgroundColor: brandColor } : {}}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom area field */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1.5">
              Custom Other Areas
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customAreaInput}
                onChange={(e) => setCustomAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomArea();
                  }
                }}
                placeholder="Add custom other area (e.g. Garden Shed, Wine Cellar)..."
                className="flex-1 h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomArea}
                disabled={!customAreaInput.trim()}
                className="h-9 px-3 text-xs font-medium gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </div>

          {/* Notes / Special Instructions */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1.5">
              Measurement Notes & Instructions (Optional)
            </label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please measure the detached garage first; ceiling height in the living room is 14ft..."
              className="w-full text-xs p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none"
            />
          </div>

          {/* Selection Summary Pill */}
          {selectedAreas.length > 0 && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-md p-2.5 text-xs text-blue-900">
              <span className="font-semibold">Selected to Measure:</span>{" "}
              {selectedAreas.join(", ")}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="text-xs font-semibold text-white px-5"
            style={{ backgroundColor: brandColor }}
          >
            Save Areas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
