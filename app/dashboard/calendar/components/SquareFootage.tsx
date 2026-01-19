import React, { useEffect, useState } from 'react'
import { Order } from '../../orders/page'
import { useAppContext } from '@/app/context/AppContext';
import { Area } from './OrderDetailView';
import { GetSquareFootageTitles, SquareFootageTitles, defaultTitles } from './SquareFootageSettings';

interface SquareFootageProps {
    currentOrder: Order | undefined
}

function SquareFootage({ currentOrder }: SquareFootageProps) {
    const { userType } = useAppContext();
    const [titles, setTitles] = useState<SquareFootageTitles>(defaultTitles);
    const areas = currentOrder?.areas || []

    useEffect(() => {
        GetSquareFootageTitles().then(setTitles);
    }, []);

    const getCategory = (area: Area): "Finished" | "Subtotal" | "Other" => {
        return area.type as "Finished" | "Subtotal" | "Other";
    };

    const finishedAreas = areas.filter(a => getCategory(a) === "Finished");
    const subtotalAreas = areas.filter(a => getCategory(a) === "Subtotal");
    const otherAreas = areas.filter(a => getCategory(a) === "Other");

    const calculateTotal = (items: typeof areas) =>
        items.reduce((sum, area) => sum + (area.footage || 0), 0)

    const finishedTotal = calculateTotal(finishedAreas);
    const subtotalTotal = calculateTotal(subtotalAreas);
    const otherTotal = calculateTotal(otherAreas);
    const grandTotal = finishedTotal + subtotalTotal + otherTotal;

    const renderSection = (title: string, items: Area[], totalSqft: number) => (
        <div className="space-y-1">
            <div className="font-semibold text-[#424242]">{title}</div>
            {items.map((area, idx) => (
                <div key={area.uuid || idx} className="flex justify-between">
                    <span>{area.custom_title || area.type}:</span>
                    <span>{area.footage} sqft</span>
                </div>
            ))}
            <div className="border-t border-dashed border-gray-400 !mt-2 !mb-2"></div>
            <div className="flex justify-between">
                <strong>Total:</strong>
                <span>{totalSqft} sqft</span>
            </div>
        </div>
    );

    return (
        <div
            className="p-4 rounded border border-gray-300 text-[14px] text-[#666666] font-alexandria"
            style={{ backgroundColor: `var(--${userType}-page-bg, #F5F5F5)` }}
        >
            <div className="text-[16px] font-medium mb-4">{currentOrder?.property_address}, {currentOrder?.property_location}</div>

            {/* Grid Layout: Left column (Finished + Subtotal + Grand Total) | Right column (Other Areas) */}
            <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-4">
                    {renderSection(titles.finished, finishedAreas, finishedTotal)}
                    {renderSection(titles.subtotal, subtotalAreas, subtotalTotal)}

                    <div className="border-t border-gray-300 !mt-6 !mb-4"></div>
                    <div className="flex justify-between text-[16px]">
                        <strong>Grand Total:</strong>
                        <strong>{grandTotal} sqft</strong>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {renderSection(titles.other, otherAreas, otherTotal)}
                </div>
            </div>

        </div>
    )
}

export default SquareFootage