"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PayPeriodPreset {
  id: string;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
}

export const formatDateYMD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getPayPeriodPresets = (): PayPeriodPreset[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();

  // Helper for last day of a given month
  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 1. Current 15-day Pay Period
  let currentPeriodStart: string;
  let currentPeriodEnd: string;
  let currentPeriodLabel: string;

  if (currentDay <= 15) {
    currentPeriodStart = formatDateYMD(new Date(currentYear, currentMonth, 1));
    currentPeriodEnd = formatDateYMD(new Date(currentYear, currentMonth, 15));
    currentPeriodLabel = "Current Period (1st – 15th)";
  } else {
    const lastDay = getLastDayOfMonth(currentYear, currentMonth);
    currentPeriodStart = formatDateYMD(new Date(currentYear, currentMonth, 16));
    currentPeriodEnd = formatDateYMD(new Date(currentYear, currentMonth, lastDay));
    currentPeriodLabel = `Current Period (16th – ${lastDay}th)`;
  }

  // 2. Previous 15-day Pay Period
  let prevPeriodStart: string;
  let prevPeriodEnd: string;
  let prevPeriodLabel: string;

  if (currentDay <= 15) {
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const pYear = prevMonthDate.getFullYear();
    const pMonth = prevMonthDate.getMonth();
    const pLastDay = getLastDayOfMonth(pYear, pMonth);
    prevPeriodStart = formatDateYMD(new Date(pYear, pMonth, 16));
    prevPeriodEnd = formatDateYMD(new Date(pYear, pMonth, pLastDay));
    prevPeriodLabel = `Previous Period (16th – ${pLastDay}th)`;
  } else {
    prevPeriodStart = formatDateYMD(new Date(currentYear, currentMonth, 1));
    prevPeriodEnd = formatDateYMD(new Date(currentYear, currentMonth, 15));
    prevPeriodLabel = "Previous Period (1st – 15th)";
  }

  // 3. Last 15 Days (Rolling)
  const rolling15Start = new Date(now);
  rolling15Start.setDate(rolling15Start.getDate() - 15);

  // 4. This Month
  const thisMonthStart = formatDateYMD(new Date(currentYear, currentMonth, 1));
  const thisMonthEnd = formatDateYMD(
    new Date(currentYear, currentMonth, getLastDayOfMonth(currentYear, currentMonth))
  );

  // 5. Last Month
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lmYear = lastMonthDate.getFullYear();
  const lmMonth = lastMonthDate.getMonth();
  const lastMonthStart = formatDateYMD(new Date(lmYear, lmMonth, 1));
  const lastMonthEnd = formatDateYMD(
    new Date(lmYear, lmMonth, getLastDayOfMonth(lmYear, lmMonth))
  );

  return [
    {
      id: "current_period",
      label: currentPeriodLabel,
      shortLabel: "Current Period",
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
    },
    {
      id: "prev_period",
      label: prevPeriodLabel,
      shortLabel: "Prev Period",
      startDate: prevPeriodStart,
      endDate: prevPeriodEnd,
    },
    {
      id: "last_15_days",
      label: "Last 15 Days (Rolling)",
      shortLabel: "Last 15 Days",
      startDate: formatDateYMD(rolling15Start),
      endDate: formatDateYMD(now),
    },
    {
      id: "this_month",
      label: "This Month",
      shortLabel: "This Month",
      startDate: thisMonthStart,
      endDate: thisMonthEnd,
    },
    {
      id: "last_month",
      label: "Last Month",
      shortLabel: "Last Month",
      startDate: lastMonthStart,
      endDate: lastMonthEnd,
    },
    {
      id: "all_time",
      label: "All Time (No filter)",
      shortLabel: "All Time",
      startDate: "",
      endDate: "",
    },
  ];
};

interface PayPeriodFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string, presetId?: string) => void;
  roleSettings?: {
    pageTabColor?: string;
    pageBg?: string;
    pageText?: string;
  };
  className?: string;
  compact?: boolean;
}

export default function PayPeriodFilter({
  startDate,
  endDate,
  onChange,
  roleSettings,
  className,
  compact = false,
}: PayPeriodFilterProps) {
  const presets = useMemo(() => getPayPeriodPresets(), []);

  // Determine which preset matches current start/end dates
  const activePresetId = useMemo(() => {
    if (!startDate && !endDate) return "all_time";
    const matched = presets.find(
      (p) => p.startDate === startDate && p.endDate === endDate
    );
    return matched ? matched.id : "custom";
  }, [startDate, endDate, presets]);

  const activeThemeColor = roleSettings?.pageTabColor || "#000000";

  const handleSelectPreset = (preset: PayPeriodPreset) => {
    onChange(preset.startDate, preset.endDate, preset.id);
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Preset Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {presets.slice(0, 4).map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full font-medium transition cursor-pointer border shrink-0",
                  isActive
                    ? "text-white shadow-xs"
                    : "bg-white text-gray-700 hover:bg-gray-100 border-gray-200"
                )}
                style={
                  isActive
                    ? { backgroundColor: activeThemeColor, borderColor: activeThemeColor }
                    : undefined
                }
              >
                {preset.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1">
          <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate, "custom")}
            className="text-xs text-gray-700 bg-transparent focus:outline-none w-[110px]"
            title="Start Date"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange(startDate, e.target.value, "custom")}
            className="text-xs text-gray-700 bg-transparent focus:outline-none w-[110px]"
            title="End Date"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => onChange("", "", "all_time")}
              className="text-gray-400 hover:text-gray-700 p-0.5"
              title="Clear date filter"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 bg-white border border-gray-200 rounded-xl shadow-xs space-y-3", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: activeThemeColor }}
          >
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              Pay Period & Billing Cycle
            </h3>
            <p className="text-xs text-gray-500">
              Select standard 15-day pay cycle presets or choose a custom date range.
            </p>
          </div>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <span className="text-gray-500 font-semibold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onChange(e.target.value, endDate, "custom")}
              className="text-xs text-gray-800 bg-transparent focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <span className="text-gray-500 font-semibold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onChange(startDate, e.target.value, "custom")}
              className="text-xs text-gray-800 bg-transparent focus:outline-none"
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange("", "", "all_time")}
              className="h-8 px-2 text-xs text-gray-500 hover:text-gray-800"
              title="Clear date filter"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Preset Buttons Bar */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-500 mr-1">Quick Presets:</span>
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={cn(
                "px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer border",
                isActive
                  ? "text-white shadow-xs font-semibold"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
              )}
              style={
                isActive
                  ? { backgroundColor: activeThemeColor, borderColor: activeThemeColor }
                  : undefined
              }
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
