'use client';

import React, { useMemo } from 'react';
import { CalendarProps, DateLocalizer, Navigate } from 'react-big-calendar';
import TimeGrid from 'react-big-calendar/lib/TimeGrid';
import { CustomDateHeader } from './BigCalendar';
import * as dates from 'date-arithmetic';

interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    vendor_id?: string;
    color_id?: number;
    service_id?: number;
}

interface ThreeDayViewProps extends CalendarProps<CalendarEvent> {
    selectedservice: string[];
    selectedVendors: string[];
    customEvents?: CalendarEvent[];
    events?: CalendarEvent[];
}

export function ThreeDayView(props: ThreeDayViewProps) {
    const {
        date,
        localizer,
        max,
        min,
        scrollToTime,
        events = [],
        ...rest
    } = props;

   const range = useMemo(() => {
    if (!date) return [];

    const start = new Date(date);
    const end = dates.add(start, 2, 'day');
    const days: Date[] = [];

    let current = new Date(start); // ensure independent date object
    while (localizer.lte(current, end, 'day')) {
        days.push(new Date(current)); // 🔁 always push a new copy
        current = dates.add(current, 1, 'day');
    }

    return days;
}, [date, localizer]);


    return (
        // @ts-expect-error error
        <TimeGrid
            {...rest}
            eventOffset={15}
            range={range}
            localizer={localizer}
            events={events}
            max={max}
            min={min}
            scrollToTime={scrollToTime}
            getNow={() => new Date()}
            components={{
                ...props.components,
                header: CustomDateHeader,
            }}
        />

    );
}

ThreeDayView.range = (date: Date, { localizer }: { localizer: DateLocalizer }) => {
    const start = new Date(date);
    const end = dates.add(start, 2, 'day');
    const range: Date[] = [];

    let current = new Date(start);
    while (localizer.lte(current, end, 'day')) {
        range.push(new Date(current)); // 🔁 always push a new copy
        current = localizer.add(current, 1, 'day');
    }

    return range;
};


ThreeDayView.navigate = (date: Date, action: string, { localizer }: { localizer: DateLocalizer }) => {
    switch (action) {
        case Navigate.PREVIOUS:
            return localizer.add(date, -3, 'day');
        case Navigate.NEXT:
            return localizer.add(date, 3, 'day');
        default:
            return date;
    }
};

ThreeDayView.title = (date: Date, { localizer }: { localizer: DateLocalizer }) => {
    const start = date;
    const end = dates.add(start, 2, 'day');
    return `${localizer.format(start, 'MMM dd')} – ${localizer.format(end, 'MMM dd')}`;
};
