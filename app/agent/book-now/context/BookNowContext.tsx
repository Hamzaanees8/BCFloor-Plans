'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Services } from '@/app/dashboard/services/page';

export interface SelectedService {
    title?: string;
    id?: string;
    uuid?: string;
    service_uuid?: string;
    price?: number;
    custom?: string;
    quantity?: number;
    option_id?: string;
    optionName: string;
    payment_status?: string;
}

export type Discount = {
    id?: number;
    uuid: string;
    type: 'code' | 'quantity';
    name?: string | null;
    code_key?: string | null;
    description?: string | null;
    percentage: string;
    quantity?: number | null;
    status: boolean;
    expiry_date?: string | null;
    created_at?: string;
    updated_at?: string;
    services?: Array<{
        id?: number;
        uuid: string;
        name?: string;
    }>;
};

type CoAgent = {
    name: string;
    email: string;
    primary_phone?: string;
    split?: string;
    percentage?: number;
};

export type AgentNote = {
    note: string;
    name: string;
    date: Date;
    internal?: string;
};

export type Slot = {
    id?: number;
    uuid?: string;
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

export type TempPropertyData = {
    listing_price?: number;
    mls_number?: string;
    bedrooms?: number;
    bathrooms?: number;
    agent_id?: string;
    square_footage?: number;
    lot_size?: string;
    year_constructed?: number;
    parking_spots?: number;
    property_type?: string;
    property_status?: string;
    heading?: string;
    description?: string;
    suite?: string;
    address: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
    unit_number?: string;
    notes?: string;
};

type SelectedOptionsMap = Record<string, string>;

type BookNowContextType = {
    selectedServices: SelectedService[];
    setSelectedServices: Dispatch<SetStateAction<SelectedService[]>>;

    isSubmitted: boolean;
    setIsSubmitted: (value: boolean) => void;

    isSplitInvoice: boolean;
    setIsSplitInvoice: (value: boolean) => void;

    internal: boolean;
    setInternal: (value: boolean) => void;

    agentNotes: AgentNote[];
    setAgentNotes: React.Dispatch<React.SetStateAction<AgentNote[]>>;

    selectedSlots: Slot[];
    setSelectedSlots: Dispatch<SetStateAction<Slot[]>>;

    coAgents: CoAgent[];
    setCoAgents: Dispatch<SetStateAction<CoAgent[]>>;

    selectedOptions: Record<string, string>;
    setSelectedOptions: Dispatch<SetStateAction<Record<string, string>>>;

    customPrices: Record<string, string>;
    setCustomPrices: Dispatch<SetStateAction<Record<string, string>>>;

    customServiceNames: Record<string, string>;
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

    servicesData: Services[];
    setServicesData: Dispatch<SetStateAction<Services[]>>;

    tempPropertyData: TempPropertyData | null;
    setTempPropertyData: Dispatch<SetStateAction<TempPropertyData | null>>;

    isPropertyValid: boolean;
    setIsPropertyValid: Dispatch<SetStateAction<boolean>>;

    resetBookNowData: () => void;
};

const BookNowContext = createContext<BookNowContextType | undefined>(undefined);

export const BookNowProvider = ({ children }: { children: ReactNode }) => {
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
    const [agentNotes, setAgentNotes] = useState<AgentNote[]>([]);
    const [coAgents, setCoAgents] = useState<CoAgent[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>({});
    const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
    const [customServiceNames, setCustomServiceNames] = useState<Record<string, string>>({});
    const [discountCode, setDiscountCode] = useState('');
    const [appliedCodeDiscount, setAppliedCodeDiscount] = useState<Discount | null>(null);
    const [appliedQuantityDiscounts, setAppliedQuantityDiscounts] = useState<Discount[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSplitInvoice, setIsSplitInvoice] = useState(false);
    const [internal, setInternal] = useState(false);
    const [total, setTotal] = useState(0);
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [tempPropertyData, setTempPropertyData] = useState<TempPropertyData | null>(null);
    const [isPropertyValid, setIsPropertyValid] = useState(false);

    const resetBookNowData = () => {
        setSelectedServices([]);
        setAgentNotes([]);
        setCoAgents([]);
        setSelectedOptions({});
        setCustomPrices({});
        setCustomServiceNames({});
        setDiscountCode('');
        setAppliedCodeDiscount(null);
        setAppliedQuantityDiscounts([]);
        setSelectedSlots([]);
        setIsSubmitted(false);
        setTotal(0);
        setIsSplitInvoice(false);
        setInternal(false);
        setTempPropertyData(null);
        setIsPropertyValid(false);
    };

    return (
        <BookNowContext.Provider
            value={{
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
                internal,
                setInternal,
                servicesData,
                setServicesData,
                tempPropertyData,
                setTempPropertyData,
                isPropertyValid,
                setIsPropertyValid,
                resetBookNowData
            }}
        >
            {children}
        </BookNowContext.Provider>
    );
};

export const useBookNowContext = () => {
    const context = useContext(BookNowContext);
    if (!context) throw new Error('useBookNowContext must be used within BookNowProvider');
    return context;
};
