
import { addMinutes, format, parse, differenceInMinutes } from 'date-fns';

export function calculateServiceDuration(squareFootage: number | undefined): number {
    if (!squareFootage || squareFootage <= 2000) {
        return 60;
    }

    const additionalSqFt = squareFootage - 2000;
    const additionalTime = Math.ceil(additionalSqFt / 1000) * 30;

    return 60 + additionalTime;
}


export function getEffectiveServiceDuration(
    serviceDuration: number | string | undefined,
    squareFootage: number | undefined
): number {
    const duration = typeof serviceDuration === 'string' ? parseInt(serviceDuration, 10) : serviceDuration;

    if (duration && duration > 0) {
        return duration;
    }

    return calculateServiceDuration(squareFootage);
}


export function calculateSlotsDuration(slots: { start_time: string; end_time: string }[]): number {
    return slots.length * 15;
}


export function validateSlotDuration(
    selectedSlots: { start_time: string; end_time: string }[],
    requiredDuration: number
): { isValid: boolean; message: string; slotsNeeded: number } {
    const currentDuration = calculateSlotsDuration(selectedSlots);
    const slotsNeeded = Math.ceil((requiredDuration - currentDuration) / 15);

    if (currentDuration < requiredDuration) {
        return {
            isValid: false,
            message: `Please add ${slotsNeeded} more slot(s). Required: ${requiredDuration} min, Selected: ${currentDuration} min`,
            slotsNeeded
        };
    }

    if (currentDuration === requiredDuration) {
        return {
            isValid: true,
            message: 'All required time slots selected',
            slotsNeeded: 0
        };
    }

    return {
        isValid: false,
        message: `Too many slots selected. Required: ${requiredDuration} min, Selected: ${currentDuration} min`,
        slotsNeeded: 0
    };
}

export function splitSlotInto15MinChunks(
    startTime: string,
    endTime: string
): { start_time: string; end_time: string }[] {
    const chunks: { start_time: string; end_time: string }[] = [];
    const dateRef = '2000-01-01'; // Reference date for parsing time

    try {
        // Handle HH:mm:ss or HH:mm
        const parseTime = (timeStr: string) => {
            if (timeStr.split(':').length === 2) {
                return parse(`${dateRef} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
            }
            return parse(`${dateRef} ${timeStr}`, 'yyyy-MM-dd HH:mm:ss', new Date());
        };

        let currentStart = parseTime(startTime);
        const finalEnd = parseTime(endTime);

        // If endTime is before or equal to startTime, return empty (or original if preferred, but logic says empty)
        if (differenceInMinutes(finalEnd, currentStart) <= 0) {
            return [{ start_time: startTime, end_time: endTime }];
        }

        while (differenceInMinutes(finalEnd, currentStart) >= 15) {
            const currentEnd = addMinutes(currentStart, 15);
            chunks.push({
                start_time: format(currentStart, 'HH:mm:ss'),
                end_time: format(currentEnd, 'HH:mm:ss'),
            });
            currentStart = currentEnd;
        }

        // Handle any remaining time less than 15 mins (though in this system it should always be 15 min multiples)
        if (differenceInMinutes(finalEnd, currentStart) > 0) {
            chunks.push({
                start_time: format(currentStart, 'HH:mm:ss'),
                end_time: format(finalEnd, 'HH:mm:ss'),
            });
        }
    } catch (error) {
        console.error('Error splitting slots:', error);
        return [{ start_time: startTime, end_time: endTime }]; // Fallback
    }

    return chunks;
}
