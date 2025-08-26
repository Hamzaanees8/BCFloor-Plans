// app/orders/create/context/OrderContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { SelectedService } from '../components/Services';
import { Dispatch, SetStateAction } from 'react';
import { Discount } from '../components/Confirmation';
import { OrderService } from '../page';
type CoAgent = {
    name: string;
    email: string;
    primary_phone?: string;
    split?: string;
    percentage?: number;
};
type AgentNote = {
    note: string;
    name: string;
    date: Date; // ← using JavaScript Date object
};
type CalendarServices = {
    serviceId: number;
    optionId: string | null;
    price: string;
    uuid?: string;
};
type Slot = {
    id?: number;
    vendor?: {
        uuid?: string;
    }
    service_id: string;
    vendor_id: string;
    show_all_vendors: number;
    schedule_override: number;
    recommend_time: number;
    travel: null;
    start_time: string;
    end_time: string;
    est_time: number | null;
    distance: number | null;
    km_price: number | null;
    date: string
};

type SelectedOptionsMap = Record<string, string>;
type OrderContextType = {
    selectedAgentId: string | null;
    setSelectedAgentId: (id: string | null) => void;

    selectedListingId: string | null;
    setSelectedListingId: (id: string | null) => void;

    selectedServices: SelectedService[];
    setSelectedServices: Dispatch<SetStateAction<SelectedService[]>>;

    calendarServices: CalendarServices[];
    setCalendarServices: Dispatch<SetStateAction<CalendarServices[]>>;

    OrderServices: OrderService[];
    setOrderServices: Dispatch<SetStateAction<OrderService[]>>;

    isSubmitted: boolean;
    setIsSubmitted: (value: boolean) => void;

    isSplitInvoice: boolean;
    setIsSplitInvoice: (value: boolean) => void;

    agentNotes: AgentNote[];
    setAgentNotes: React.Dispatch<React.SetStateAction<AgentNote[]>>;

    selectedSlots: Slot[];
    setSelectedSlots: Dispatch<SetStateAction<Slot[]>>;

    coAgents: CoAgent[];
    setCoAgents: Dispatch<SetStateAction<CoAgent[]>>;

    selectedOptions: Record<string, string>; // service.uuid -> selected option title
    setSelectedOptions: Dispatch<SetStateAction<Record<string, string>>>;

    customPrices: Record<string, string>; // service.uuid -> price
    setCustomPrices: Dispatch<SetStateAction<Record<string, string>>>;

    customServiceNames: Record<string, string>; // service.uuid -> name
    setCustomServiceNames: Dispatch<SetStateAction<Record<string, string>>>;

    discountCode: string;
    setDiscountCode: (notes: string) => void;

    appliedCodeDiscount: Discount | null;
    setAppliedCodeDiscount: (d: Discount | null) => void;

    appliedQuantityDiscounts: Discount[];
    setAppliedQuantityDiscounts: (d: Discount[]) => void;

    total: number;
    setTotal: (total: number) => void;

    isLoading: boolean;
    setIsLoading: (value: boolean) => void;

    initComplete: boolean;
    setInitComplete: (value: boolean) => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
    const [initComplete, setInitComplete] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
    const [calendarServices, setCalendarServices] = useState<
        { serviceId: number; optionId: string | null; price: string }[]
    >([]);
    const [agentNotes, setAgentNotes] = useState<AgentNote[]>([]);
    const [coAgents, setCoAgents] = useState<CoAgent[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>({});
    const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
    const [customServiceNames, setCustomServiceNames] = useState<Record<string, string>>({});
    const [discountCode, setDiscountCode] = useState('');
    const [appliedCodeDiscount, setAppliedCodeDiscount] = useState<Discount | null>(null);
    const [appliedQuantityDiscounts, setAppliedQuantityDiscounts] = useState<Discount[]>([]);
    const [OrderServices, setOrderServices] = useState<OrderService[]>([]);

    const [total, setTotal] = useState(0);
    const [isSplitInvoice, setIsSplitInvoice] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log('selectedOptions', selectedOptions);
    return (
        <OrderContext.Provider
            value={{
                selectedAgentId,
                setSelectedAgentId,
                selectedListingId,
                setSelectedListingId,
                selectedServices,
                setSelectedServices,
                agentNotes,
                setAgentNotes,
                coAgents,
                setCoAgents,
                selectedOptions,
                setSelectedOptions,
                customPrices,
                setCustomPrices,
                customServiceNames,
                setCustomServiceNames,
                discountCode,
                setDiscountCode,
                appliedCodeDiscount,
                setAppliedCodeDiscount,
                appliedQuantityDiscounts,
                setAppliedQuantityDiscounts,
                total,
                setTotal,
                isSplitInvoice,
                setIsSplitInvoice,
                selectedSlots,
                setSelectedSlots,
                isSubmitted,
                setIsSubmitted,
                isLoading,
                setIsLoading,
                initComplete,
                setInitComplete,
                calendarServices,
                setCalendarServices,
                OrderServices,
                setOrderServices,

            }}
        >
            {children}
        </OrderContext.Provider>
    );
};

export const useOrderContext = () => {
    const context = useContext(OrderContext);
    if (!context) throw new Error('useOrderContext must be used within OrderProvider');
    return context;
};
