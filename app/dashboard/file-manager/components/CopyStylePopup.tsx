"use client";

import React, { useEffect, useState } from "react";
import { Loader2, X, Search, Copy } from "lucide-react";
import { featureSheetService } from "../file-manager";
import { FeatureSheetResponse } from "../types/featureSheetTypes";
import { useAppContext } from "@/app/context/AppContext";

interface CopyStylePopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user selects a sheet to copy style from */
  onApply: (sheet: FeatureSheetResponse) => void;
  /** UUID of the sheet currently being edited — shown differently in the list */
  currentSheetUuid?: string | null;
  /** The template key of the current open sheet to filter for compatibility */
  currentTemplateKey?: string | null;
}

const templateImageMap: Record<string, string> = {
  BCFPStandard: "BcfpStandard",
  BCFPStandard2: "BcfpStandard2",
  BCFPStandard3: "BcfpStandard3",
  BCFPStandard4: "BcfpStandard4",
  BCFPStandard6: "BcfpStandard6",
  BCFPStandard7: "BcfpStandard7",
  BCFPStandard8: "BcfpStandard8",
  BCFPStandard9: "BcfpStandard9",
  BCFPStandard10: "BcfpStandard10",
  BCFPStandard11: "BcfpStandard11",
  BCFPStandard12: "BcfpStandard12",
  BCFPStandard13: "BcfpStandard13",
  BCFPStandard14: "BcfpStandard14",
  BCFPStandard15: "BcfpStandard15",
  BCFPStandard16: "BcfpStandard16",
  BCFPStandard17: "BcfpStandard17",
  BCFPStandard18: "BcfpStandard18",
  BCFPStandard19: "BcfpStandard19",
  BCFPStandard20: "BcfpStandard20",
  BCFPStandard21: "BcfpStandard21",
  BCFPStandard22: "BcfpStandard22",
  BCFPStandard23: "BcfpStandard23",
  BCFPStandard24: "BcfpStandard24",
};

export default function CopyStylePopup({
  isOpen,
  onClose,
  onApply,
  currentSheetUuid,
  currentTemplateKey,
}: CopyStylePopupProps) {
  const { userType } = useAppContext();
  const [sheets, setSheets] = useState<FeatureSheetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingUuid, setApplyingUuid] = useState<string | null>(null);

  // Fetch all feature sheets when popup opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setSearchQuery("");

    featureSheetService
      .getFeatureSheetsByAgent()
      .then((data) => {
        // Only show template sheets (not raw PDF uploads)
        const templateSheets = data.filter((s) => s.type === "template");
        setSheets(templateSheets);
      })
      .catch((err) => {
        console.error("[CopyStylePopup] Failed to fetch sheets:", err);
        setError("Failed to load feature sheets. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = sheets.filter((s) => {
    // 1. Filter by current template key for compatibility (if provided)
    const matchesTemplate = currentTemplateKey
      ? s.template_key === currentTemplateKey
      : true;

    // 2. Filter by search query
    const matchesSearch = s.template_key
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesTemplate && matchesSearch;
  });

  const handleApply = async (sheet: FeatureSheetResponse) => {
    setApplyingUuid(sheet.uuid);
    onApply(sheet);
    // Give the parent a moment to apply before closing
    setTimeout(() => {
      setApplyingUuid(null);
      onClose();
    }, 300);
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden mx-4">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-[#BBBBBB] bg-[#E4E4E4]`}
        >
          <div className="flex items-center gap-3">
            <Copy className={`w-5 h-5 ${userType}-text`} />
            <div>
              <h2 className={`text-[18px] font-semibold ${userType}-text`}>
                Copy Style From Another Sheet
              </h2>
              <p className="text-xs text-[#7D7D7D] mt-0.5">
                Select a previously saved feature sheet to copy its styling
                (fonts, sizes, colors). Your content will not be changed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-[#d0d0d0] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[#BBBBBB]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D7D7D]" />
            <input
              type="text"
              placeholder="Search by template name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-[38px] bg-[#F5F5F5] border border-[#BBBBBB] rounded-md text-sm text-black placeholder:text-[#7D7D7D] focus:outline-none focus:ring-2 focus:ring-opacity-50"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className={`w-8 h-8 animate-spin ${userType}-text`} />
              <p className="text-sm text-[#7D7D7D]">
                Loading all feature sheets...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  featureSheetService
                    .getFeatureSheetsByAgent()
                    .then((d) =>
                      setSheets(d.filter((s) => s.type === "template")),
                    )
                    .catch(() => setError("Failed to load. Please try again."))
                    .finally(() => setLoading(false));
                }}
                className={`px-4 py-2 ${userType}-bg text-white text-sm rounded-md`}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-sm text-[#7D7D7D]">
                {searchQuery
                  ? "No sheets match your search."
                  : "No saved feature sheets found."}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((sheet) => {
                const isCurrentSheet = sheet.uuid === currentSheetUuid;
                const imgSrc = templateImageMap[sheet.template_key]
                  ? `/${templateImageMap[sheet.template_key]}.png`
                  : null;

                return (
                  <div
                    key={sheet.uuid}
                    className={`flex flex-col gap-2 group ${
                      isCurrentSheet ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => !isCurrentSheet && handleApply(sheet)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        isCurrentSheet
                          ? "border-gray-300"
                          : `border-gray-200 hover:${userType}-border hover:shadow-lg cursor-pointer hover:scale-[1.02]`
                      }`}
                    >
                      {imgSrc ? (
                        <div
                          className="w-full h-[160px] bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url(${imgSrc})`,
                            backgroundSize: "contain",
                          }}
                        />
                      ) : (
                        <div className="w-full h-[160px] bg-[#E4E4E4] flex items-center justify-center">
                          <span className="text-xs text-[#7D7D7D]">
                            {sheet.template_key}
                          </span>
                        </div>
                      )}

                      {/* Current badge */}
                      {isCurrentSheet && (
                        <div className="absolute top-2 right-2 bg-gray-400 text-white text-[10px] px-2 py-0.5 rounded">
                          Current
                        </div>
                      )}

                      {/* Apply overlay */}
                      {!isCurrentSheet && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                          {applyingUuid === sheet.uuid ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <span className="text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              Apply Style
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-0.5">
                      <p className="text-[13px] font-medium text-[#444444] truncate">
                        {sheet.template_key}
                      </p>
                      <p className="text-[11px] text-[#888888]">
                        {new Date(sheet.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                      {!isCurrentSheet && (
                        <button
                          onClick={() => handleApply(sheet)}
                          className={`mt-1.5 text-[12px] ${userType}-text hover:underline font-medium`}
                        >
                          Apply Style →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#BBBBBB] bg-[#F9F9F9] flex items-center justify-between">
          <p className="text-xs text-[#7D7D7D]">
            {!loading && !error && (
              <>
                {filtered.length} sheet{filtered.length !== 1 ? "s" : ""}{" "}
                available
                {searchQuery && ` for "${searchQuery}"`}
              </>
            )}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#E4E4E4] text-[#444444] text-sm rounded-md hover:bg-[#d5d5d5] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
