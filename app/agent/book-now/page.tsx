"use client";

import React, { useEffect } from 'react';
import Header from '@/components/Header';
import OrderForm from '@/app/dashboard/orders/create/page';
import { OrderProvider, useOrderContext } from '@/app/dashboard/orders/context/OrderContext';
import { UnsavedProvider } from '@/app/context/UnsavedContext';
import { WhiteLabelProvider } from '@/app/context/Whitelabel';

function BookNowContent() {
    const { setIsBookNowMode } = useOrderContext();

    useEffect(() => {
        // Enable Book Now mode which adapts the OrderForm for guests/public users
        setIsBookNowMode(true);
        
        return () => {
            // Revert back when leaving the page
            setIsBookNowMode(false);
        };
    }, [setIsBookNowMode]);

    return (
        <div className="flex-1 w-full bg-white shadow-sm overflow-hidden">
            <OrderForm />
        </div>
    );
}

export default function BookNowPage() {
    return (
        <WhiteLabelProvider>
            <UnsavedProvider>
                <OrderProvider>
                    <div className="min-h-screen bg-gray-50 flex flex-col">
                        <Header />
                        <BookNowContent />
                    </div>
                </OrderProvider>
            </UnsavedProvider>
        </WhiteLabelProvider>
    );
}