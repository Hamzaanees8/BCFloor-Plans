"use client";
import React, { useState, useMemo, useCallback } from "react";
import { Plus, X, Clock, RotateCcw, AlertCircle, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { TimingInterval } from "@/lib/email-templates";

interface IntervalSelectorProps {
    intervals: TimingInterval[];
    supportedUnits?: string[];
    defaultIntervals?: TimingInterval[];
    eventType?: string;
    onChange: (intervals: TimingInterval[]) => void;
    disabled?: boolean;
}

// Convert interval to total minutes for consistent sorting
export function intervalToMinutes(interval: TimingInterval): number {
    const val = Number(interval.value) || 0;
    const unit = (interval.unit || "").toLowerCase();
    switch (unit) {
        case "weeks":
            return val * 7 * 24 * 60;
        case "days":
            return val * 24 * 60;
        case "hours":
            return val * 60;
        case "minutes":
            return val;
        default:
            return val;
    }
}

// Format human friendly chip label: e.g. "24 Hours", "1 Hour", "1 Week"
export function formatIntervalLabel(interval: TimingInterval): string {
    const val = Number(interval.value);
    const unit = (interval.unit || "").toLowerCase();
    const singularUnit = unit.endsWith("s") ? unit.slice(0, -1) : unit;
    const formattedUnit = val === 1 ? singularUnit : `${singularUnit}s`;
    const capitalized = formattedUnit.charAt(0).toUpperCase() + formattedUnit.slice(1);
    return `${val} ${capitalized}`;
}

// Generate live preview sentence
export function generatePreviewSentence(intervals: TimingInterval[], eventType?: string): string {
    if (!intervals || intervals.length === 0) {
        return "No reminder intervals configured. Notifications will not be sent automatically.";
    }

    // Sort descending (e.g. 30 days -> 14 days -> 7 days -> 1 day)
    const sorted = [...intervals].sort((a, b) => intervalToMinutes(b) - intervalToMinutes(a));

    const formattedList = sorted.map((item) => {
        const val = Number(item.value);
        const unit = (item.unit || "").toLowerCase();
        const singularUnit = unit.endsWith("s") ? unit.slice(0, -1) : unit;
        return `${val} ${val === 1 ? singularUnit : `${singularUnit}s`}`;
    });

    let timingPhrase = "";
    if (formattedList.length === 1) {
        timingPhrase = formattedList[0];
    } else if (formattedList.length === 2) {
        timingPhrase = `${formattedList[0]} and ${formattedList[1]}`;
    } else {
        const allButLast = formattedList.slice(0, -1).join(", ");
        const last = formattedList[formattedList.length - 1];
        timingPhrase = `${allButLast}, and ${last}`;
    }

    const isMatterport = eventType?.includes("matterport") || eventType?.includes("expir");
    const context = isMatterport
        ? "before 3D Tour hosting expires"
        : "before scheduled appointment";

    return `Emails will be sent ${timingPhrase} ${context}.`;
}

const DEFAULT_PRESETS_BY_UNIT: Record<string, TimingInterval[]> = {
    hours_days: [
        { value: 48, unit: "hours" },
        { value: 24, unit: "hours" },
        { value: 8, unit: "hours" },
        { value: 2, unit: "hours" },
        { value: 1, unit: "hours" },
    ],
    days_weeks: [
        { value: 4, unit: "weeks" },
        { value: 2, unit: "weeks" },
        { value: 1, unit: "weeks" },
        { value: 3, unit: "days" },
        { value: 1, unit: "days" },
    ],
};

const IntervalSelector: React.FC<IntervalSelectorProps> = ({
    intervals = [],
    supportedUnits = ["hours", "days"],
    defaultIntervals = [],
    eventType = "",
    onChange,
    disabled = false,
}) => {
    const units = useMemo(() => {
        return supportedUnits.length > 0 ? supportedUnits : ["hours", "days"];
    }, [supportedUnits]);

    const [inputValue, setInputValue] = useState<string>("24");
    const [inputUnit, setInputUnit] = useState<string>(units[0] || "hours");

    // Sort active intervals descending by time duration
    const sortedIntervals = useMemo(() => {
        return [...intervals].sort((a, b) => intervalToMinutes(b) - intervalToMinutes(a));
    }, [intervals]);

    // Check if an interval already exists
    const hasInterval = useCallback((val: number, unit: string) => {
        const normalizedUnit = unit.toLowerCase();
        return intervals.some(
            (item) => Number(item.value) === val && item.unit.toLowerCase() === normalizedUnit
        );
    }, [intervals]);

    // Add a new interval
    const handleAdd = (valToAdd?: number, unitToAdd?: string) => {
        if (disabled) return;

        const val = valToAdd !== undefined ? valToAdd : parseInt(inputValue, 10);
        const unit = unitToAdd || inputUnit;

        if (isNaN(val) || val <= 0) {
            toast.error("Please enter a valid positive number");
            return;
        }

        if (hasInterval(val, unit)) {
            toast.warning(`${formatIntervalLabel({ value: val, unit })} is already added.`);
            return;
        }

        const updated = [...intervals, { value: val, unit }];
        // Sort descending before saving
        updated.sort((a, b) => intervalToMinutes(b) - intervalToMinutes(a));
        onChange(updated);
    };

    // Remove an interval
    const handleRemove = (indexToRemove: number) => {
        if (disabled) return;
        const target = sortedIntervals[indexToRemove];
        const updated = intervals.filter(
            (item) => !(Number(item.value) === Number(target.value) && item.unit.toLowerCase() === target.unit.toLowerCase())
        );
        onChange(updated);
    };

    // Reset to defaults
    const handleResetDefaults = () => {
        if (disabled || defaultIntervals.length === 0) return;
        onChange([...defaultIntervals]);
        toast.info("Restored default timing intervals");
    };

    // Presets selection
    const presets = useMemo(() => {
        if (units.includes("weeks") || (units.includes("days") && !units.includes("hours"))) {
            return DEFAULT_PRESETS_BY_UNIT.days_weeks;
        }
        return DEFAULT_PRESETS_BY_UNIT.hours_days;
    }, [units]);

    const isDifferentFromDefault = useMemo(() => {
        if (!defaultIntervals || defaultIntervals.length === 0) return false;
        if (intervals.length !== defaultIntervals.length) return true;
        return defaultIntervals.some((d) => !hasInterval(Number(d.value), d.unit));
    }, [intervals, defaultIntervals, hasInterval]);

    return (
        <div className="mt-3 p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            {/* Header / Description */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#334155]">
                    <Clock className="w-3.5 h-3.5 text-[#4290E9]" />
                    <span>Notification Timing Schedule</span>
                </div>

                {defaultIntervals.length > 0 && isDifferentFromDefault && !disabled && (
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#2563EB] transition-colors"
                        title="Restore initial default intervals"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Defaults</span>
                    </button>
                )}
            </div>

            {/* Chips / Pills List */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                {sortedIntervals.length > 0 ? (
                    sortedIntervals.map((interval, idx) => (
                        <span
                            key={`${interval.value}_${interval.unit}_${idx}`}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] shadow-sm animate-in fade-in duration-200"
                        >
                            <span>{formatIntervalLabel(interval)}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    className="p-0.5 rounded-full hover:bg-[#DBEAFE] text-[#3B82F6] hover:text-[#1E40AF] transition-colors focus:outline-none"
                                    aria-label={`Remove ${formatIntervalLabel(interval)}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </span>
                    ))
                ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[#DC2626]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>No timing milestones active. Reminders will not be sent automatically.</span>
                    </div>
                )}
            </div>


            {/* Quick Presets & Add Controls */}
            {!disabled && (
                <div className="pt-2 border-t border-[#E2E8F0]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    {/* Presets Shortcuts */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                            Presets:
                        </span>
                        {presets.map((preset) => {
                            const active = hasInterval(Number(preset.value), preset.unit);
                            return (
                                <button
                                    key={`preset_${preset.value}_${preset.unit}`}
                                    type="button"
                                    disabled={active}
                                    onClick={() => handleAdd(Number(preset.value), preset.unit)}
                                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                        active
                                            ? "bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed"
                                            : "bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC] hover:border-[#4290E9] hover:text-[#1D4ED8]"
                                    }`}
                                >
                                    {active ? <Check className="w-2.5 h-2.5 text-[#10B981]" /> : <Plus className="w-2.5 h-2.5" />}
                                    <span>{formatIntervalLabel(preset)}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Add Form */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <input
                            type="number"
                            min="1"
                            max="999"
                            step="1"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAdd();
                                }
                            }}
                            className="w-16 h-7 px-2 text-xs text-center border border-[#CBD5E1] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#4290E9] focus:border-[#4290E9]"
                            placeholder="Val"
                        />
                        <select
                            value={inputUnit}
                            onChange={(e) => setInputUnit(e.target.value)}
                            className="h-7 px-2 text-xs border border-[#CBD5E1] rounded bg-white text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4290E9] focus:border-[#4290E9] capitalize"
                        >
                            {units.map((unit) => (
                                <option key={unit} value={unit} className="capitalize">
                                    {unit}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => handleAdd()}
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-semibold text-white bg-[#4290E9] hover:bg-[#357ac8] active:bg-[#2c67aa] rounded transition-colors shadow-sm"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Live Preview Sentence */}
            <div className="flex items-start gap-1.5 text-[11px] text-[#475569] bg-white/75 p-2 rounded border border-[#E2E8F0]">
                <Info className="w-3.5 h-3.5 text-[#4290E9] mt-0.5 shrink-0" />
                <span className="leading-snug">{generatePreviewSentence(intervals, eventType)}</span>
            </div>
        </div>
    );
};

export default IntervalSelector;
