import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Packages } from "../../services/page";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";
import { useOrderContext } from "../context/OrderContext";

interface PackageCardProps {
    pkg: Packages;
    isSelected: boolean;
    onSelect: () => void;
}

export default function PackageCard({ pkg, isSelected, onSelect }: PackageCardProps) {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const { isBookNowMode } = useOrderContext();

    const role = (userType as string)?.toLowerCase() || (isBookNowMode ? 'agent' : 'admin');
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const fieldBg = `color-mix(in srgb, ${roleSettings.pageBg} 95%, black)`;
    const fieldBorder = `color-mix(in srgb, ${roleSettings.pageBg} 80%, black)`;

    const activeColor = roleSettings.pageTabColor || '#4290E9';

    return (
        <div
            className={`relative flex flex-col justify-between h-full p-2.5 rounded-[6px] border transition-all duration-150 ${
                isSelected ? 'shadow-sm' : 'hover:border-gray-400'
            }`}
            style={{
                backgroundColor: fieldBg,
                borderColor: isSelected ? activeColor : fieldBorder,
                boxShadow: isSelected ? `0 0 0 1px ${activeColor}` : undefined,
            }}
        >
            <div className="space-y-1.5 min-w-0">
                {/* Header: Title and Discount */}
                <div className="flex items-center justify-between gap-1">
                    <h3
                        className="font-[600] text-[13px] leading-tight truncate"
                        style={{ color: roleSettings.pageText }}
                        title={pkg.name}
                    >
                        {pkg.name}
                    </h3>
                    {typeof pkg.discount === 'number' && pkg.discount > 0 && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded">
                            {pkg.discount}% OFF
                        </span>
                    )}
                </div>

                {/* Included Services List */}
                <div className="pt-0.5">
                    <span className="text-[9px] font-[600] uppercase tracking-wider text-gray-400 block mb-0.5">
                        Services ({pkg.services?.length || 0})
                    </span>
                    <ul className="space-y-0.5 max-h-[55px] overflow-y-auto pr-0.5">
                        {pkg.services && pkg.services.length > 0 ? (
                            pkg.services.map((service, idx) => (
                                <li
                                    key={service.uuid || service.id || idx}
                                    className="flex items-center gap-1 text-[11px] leading-tight"
                                    style={{ color: roleSettings.pageText }}
                                >
                                    <span
                                        className="w-1 h-1 rounded-full shrink-0"
                                        style={{ backgroundColor: activeColor }}
                                    />
                                    <span className="truncate">{service.name}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-400 italic text-[10px]">No services</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Action Button */}
            <div className="pt-1.5 mt-2 border-t border-gray-200/70">
                <Button
                    type="button"
                    onClick={onSelect}
                    className="w-full h-7 text-[11px] font-[500] rounded-md transition-all shadow-none px-2"
                    style={{
                        backgroundColor: isSelected ? activeColor : 'transparent',
                        color: isSelected ? '#ffffff' : activeColor,
                        border: `1px solid ${activeColor}`
                    }}
                >
                    {isSelected ? (
                        <span className="flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" />
                            Selected
                        </span>
                    ) : (
                        'Select Package'
                    )}
                </Button>
            </div>
        </div>
    );
}
