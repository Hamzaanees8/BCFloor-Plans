import React from 'react'
import { Order } from '../../orders/page'
interface SquareFootageProps {
    currentOrder: Order | undefined
}
function SquareFootage({ currentOrder }: SquareFootageProps) {
    const areas = currentOrder?.areas || []

    const levelAreas = areas?.filter(area =>
        area.type.toLowerCase().includes('level')
    )
    console.log('levelAreas', levelAreas);

    const otherAreas = areas?.filter(area =>
        !area.type.toLowerCase().includes('level')
    )
    console.log('otherAreas', otherAreas);


    const calculateTotal = (items: typeof areas) =>
        items.reduce((sum, area) => sum + (area.footage || 0), 0)

    return (
        <div className="bg-[#F5F5F5] p-4 rounded border border-gray-300 text-[14px] text-[#666666] font-alexandria space-y-2">
            <div>{currentOrder?.property_address}, {currentOrder?.property_location}</div>
            <div className="space-y-1 !mt-4">
                {levelAreas.map(area => (
                    <div key={area.uuid}>{area?.type}: {area?.footage} sqft</div>
                ))}
                {/* <div>2nd Level</div>
                <div>3rd Level</div> */}
                <div className="border-t border-dashed border-gray-400 !mt-6 !mb-4 w-1/2"></div>
                <div><strong>Total:</strong> {calculateTotal(levelAreas)} sqft</div>
            </div>

            <div className="space-y-1 pt-2 !mt-4">
                {otherAreas.map(area => (
                    <div key={area.uuid}>{area?.type}: {area?.footage} sqft</div>
                ))}
                <div className="border-t border-dashed border-gray-400 !mt-6 !mb-4 w-1/2"></div>
                <div><strong>Total:</strong> {calculateTotal(otherAreas)} sqft</div>
            </div>

        </div>
    )
}

export default SquareFootage