"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import OrderForm from '@/app/dashboard/orders/create/page';
import { useOrderContext } from '@/app/dashboard/orders/context/OrderContext';
import { UnsavedProvider } from '@/app/context/UnsavedContext';
import { WhiteLabelProvider } from '@/app/context/Whitelabel';
import { BookNowOrgProvider } from '../context/BookNowOrgContext';

function BookNowContent() {
    const { setIsBookNowMode } = useOrderContext();

    useEffect(() => {
        setIsBookNowMode(true);
        return () => {
            setIsBookNowMode(false);
        };
    }, [setIsBookNowMode]);

    return (
        <div className="flex-1 w-full bg-white shadow-sm overflow-hidden">
            <OrderForm />
        </div>
    );
}

export default function BookNowOrgPage() {
    const params = useParams();
    const orgSlug = (params?.org_slug as string) || null;

    return (
        <BookNowOrgProvider orgSlug={orgSlug}>
            <WhiteLabelProvider>
                <UnsavedProvider>
                    <div className="min-h-screen bg-gray-50 flex flex-col">
                        <Header />
                        <BookNowContent />
                    </div>
                </UnsavedProvider>
            </WhiteLabelProvider>
        </BookNowOrgProvider>
    );
}
