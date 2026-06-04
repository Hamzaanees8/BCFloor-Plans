// app/orders/create/context/OrderContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SelectedService } from '../components/Services';
import { Dispatch, SetStateAction } from 'react';
import { Discount } from '../components/Confirmation';
import { Order, OrderService } from '../page';
import { Listings } from '@/lib/types';
import { Agent } from '@/lib/types';
import { Services, Packages } from '../../services/page';
import { VendorData } from '../[id]/page';
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
    internal?: string// ← using JavaScript Date object
};
type CalendarServices = {
    serviceId: number;
    optionId: string | null;
    price: string;
    uuid?: string;
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
    address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
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

    internal: boolean;
    setInternal: (value: boolean) => void;

    agentNotes: AgentNote[];
    setAgentNotes: Dispatch<SetStateAction<AgentNote[]>>;

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

    selectedCurrentListing: Listings | null
    setSelectedCurrentListing: Dispatch<SetStateAction<Listings | null>>;

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

    agentsData: Agent[];
    setAgentsData: Dispatch<SetStateAction<Agent[]>>;

    listingsData: Listings[];
    setListingsData: Dispatch<SetStateAction<Listings[]>>;

    servicesData: Services[];
    setServicesData: Dispatch<SetStateAction<Services[]>>;

    vendorsData: VendorData[];
    setVendorsData: Dispatch<SetStateAction<VendorData[]>>;

    ordersData: Order[];
    setOrdersData: Dispatch<SetStateAction<Order[]>>;

    packagesData: Packages[];
    setPackagesData: Dispatch<SetStateAction<Packages[]>>;

    activePackage: Packages | null;
    setActivePackage: Dispatch<SetStateAction<Packages | null>>;
    tempPropertyData: TempPropertyData | null;
    setTempPropertyData: Dispatch<SetStateAction<TempPropertyData | null>>;
    isPropertyValid: boolean;
    setIsPropertyValid: Dispatch<SetStateAction<boolean>>;
    lastPopulatedAgentId: string | null;
    setLastPopulatedAgentId: (id: string | null) => void;

    // Schedule toggle maps — persisted here so they survive tab navigation
    scheduleOverrideMap: Record<string, 0 | 1>;
    setScheduleOverrideMap: Dispatch<SetStateAction<Record<string, 0 | 1>>>;
    showAllVendorsMap: Record<string, 0 | 1>;
    setShowAllVendorsMap: Dispatch<SetStateAction<Record<string, 0 | 1>>>;
    recommendTimeMap: Record<string, 0 | 1>;
    setRecommendTimeMap: Dispatch<SetStateAction<Record<string, 0 | 1>>>;

    resetOrderData: () => void;
    clearSelections: () => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
    const [initComplete, setInitComplete] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [tempPropertyData, setTempPropertyData] = useState<TempPropertyData | null>(null);
    const [isPropertyValid, setIsPropertyValid] = useState(false);
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
    const [selectedCurrentListing, setSelectedCurrentListing] = useState<Listings | null>(null);
    const [total, setTotal] = useState(0);
    const [isSplitInvoice, setIsSplitInvoice] = useState(false);
    const [internal, setInternal] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastPopulatedAgentId, setLastPopulatedAgentId] = useState<string | null>(null);

    // Schedule toggle maps persisted in context so tab navigation doesn't reset them
    const [scheduleOverrideMap, setScheduleOverrideMap] = useState<Record<string, 0 | 1>>({});
    const [showAllVendorsMap, setShowAllVendorsMap] = useState<Record<string, 0 | 1>>({});
    const [recommendTimeMap, setRecommendTimeMap] = useState<Record<string, 0 | 1>>({});

    const [agentsData, setAgentsData] = useState<Agent[]>([]);
    const [listingsData, setListingsData] = useState<Listings[]>([]);
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [vendorsData, setVendorsData] = useState<VendorData[]>([]);
    const [ordersData, setOrdersData] = useState<Order[]>([]);
    const [packagesData, setPackagesData] = useState<Packages[]>([]);
    const [activePackage, setActivePackage] = useState<Packages | null>(null);

    const resetOrderData = useCallback(() => {
        setInitComplete(false);
        setSelectedAgentId(null);
        setSelectedListingId(null);
        setSelectedServices([]);
        setCalendarServices([]);
        setAgentNotes([]);
        setCoAgents([]);
        setSelectedOptions({});
        setCustomPrices({});
        setCustomServiceNames({});
        setDiscountCode('');
        setAppliedCodeDiscount(null);
        setAppliedQuantityDiscounts([]);
        setOrderServices([]);
        setSelectedCurrentListing(null);
        setTotal(0);
        setIsSplitInvoice(false);
        setInternal(false);
        setSelectedSlots([]);
        setIsSubmitted(false);
        setActivePackage(null);
        setTempPropertyData(null);
        setIsPropertyValid(false);
        setLastPopulatedAgentId(null);
        setScheduleOverrideMap({});
        setShowAllVendorsMap({});
        setRecommendTimeMap({});
    }, []);

    const clearSelections = useCallback(() => {
        setInitComplete(false);
        setSelectedServices([]);
        setCalendarServices([]);
        setAgentNotes([]);
        setCoAgents([]);
        setSelectedOptions({});
        setCustomPrices({});
        setCustomServiceNames({});
        setDiscountCode('');
        setAppliedCodeDiscount(null);
        setAppliedQuantityDiscounts([]);
        setOrderServices([]);
        setTotal(0);
        setIsSplitInvoice(false);
        setInternal(false);
        setSelectedSlots([]);
        setIsSubmitted(false);
        setActivePackage(null);
        setTempPropertyData(null);
        setIsPropertyValid(false);
        setLastPopulatedAgentId(null);
        setScheduleOverrideMap({});
        setShowAllVendorsMap({});
        setRecommendTimeMap({});
    }, []);

    return (
        <OrderContext.Provider
            value={{
                selectedAgentId,
                setSelectedAgentId,
                selectedListingId,
                setSelectedListingId,
                selectedCurrentListing,
                setSelectedCurrentListing,
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
                internal,
                setInternal,
                agentsData,
                setAgentsData,
                listingsData,
                setListingsData,
                servicesData,
                setServicesData,
                vendorsData,
                setVendorsData,
                ordersData,
                setOrdersData,
                packagesData,
                setPackagesData,
                activePackage,
                setActivePackage,
                tempPropertyData,
                setTempPropertyData,
                isPropertyValid,
                setIsPropertyValid,
                lastPopulatedAgentId,
                setLastPopulatedAgentId,
                scheduleOverrideMap,
                setScheduleOverrideMap,
                showAllVendorsMap,
                setShowAllVendorsMap,
                recommendTimeMap,
                setRecommendTimeMap,
                resetOrderData,
                clearSelections
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
