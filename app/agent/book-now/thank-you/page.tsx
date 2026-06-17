'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { DownloadCloud, CheckCircle } from 'lucide-react';

interface Service {
    id?: number;
    uuid: string;
    name?: string;
    amount?: number;
}

interface Slot {
    id?: number;
    uuid?: string;
    vendor_id?: string;
    service_id: string;
    start_time: string;
    end_time: string;
}

interface OrderData {
    uuid?: string;
    order_number?: string;
    agent_id?: string;
    property_id?: string;
    amount?: number;
    order_status?: string;
    payment_status?: string;
    services?: Service[];
    slots?: Slot[];
    vendor?: {
        uuid?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        company?: {
            company_name?: string;
        };
    };
    property?: {
        address?: string;
        city?: string;
        province?: string;
        postal_code?: string;
    };
}

interface StoredService {
    title?: string;
    optionName?: string;
    price?: number | string;
    uuid?: string;
}

interface StoredProperty {
    address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
}

export default function ThankYouPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [selectedServices, setSelectedServices] = useState<StoredService[]>([]);
    const [tempPropertyData, setTempPropertyData] = useState<StoredProperty | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Get stored data from localStorage
        const storedServices = localStorage.getItem('bookNowServices');
        const storedProperty = localStorage.getItem('bookNowProperty');

        if (storedServices) {
            try {
                setSelectedServices(JSON.parse(storedServices));
            } catch (e) {
                console.error('Failed to parse services:', e);
            }
        }

        if (storedProperty) {
            try {
                setTempPropertyData(JSON.parse(storedProperty));
            } catch (e) {
                console.error('Failed to parse property:', e);
            }
        }

        // Check login state
        setIsLoggedIn(!!localStorage.getItem('agentToken'));
    }, []);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('agentToken');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setOrderData(data.data || data);
                }
            } catch (error) {
                console.error('Failed to fetch order details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    const handleSave = () => {
        // Generate PDF or download functionality
        window.print();
    };

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    const totalAmount = (() => {
        let amount = 0;
        
        // Try to get from selectedServices first
        if (selectedServices && selectedServices.length > 0) {
            amount = selectedServices.reduce((sum, service) => {
                const price = typeof service.price === 'string' ? parseFloat(service.price) : service.price || 0;
                return sum + (isNaN(price) ? 0 : price);
            }, 0);
        }
        
        // If no amount from services, try orderData
        if (amount === 0 && orderData?.amount) {
            const orderAmount = typeof orderData.amount === 'string' ? parseFloat(orderData.amount) : orderData.amount;
            amount = isNaN(orderAmount) ? 0 : orderAmount;
        }
        
        return amount;
    })();

    return (
        <div>
            <Header />
            <div className='font-alexandria mt-[100px]'>
                <div className='flex justify-center'>
                    <div className='w-[90%] lg:w-[80%] py-[40px]'>
                        {/* Thank You Section */}
                        <div className='flex flex-col items-center justify-center gap-6 mb-8'>
                            <div className='flex items-center justify-center w-[80px] h-[80px] rounded-full bg-[#E8F5E9]'>
                                <CheckCircle className='w-[48px] h-[48px] text-[#4CAF50]' />
                            </div>
                            <h1 className='text-[42px] font-[700] text-[#333333] text-center'>Thank You!</h1>
                            <p className='text-[20px] font-[400] text-[#4CAF50]'>Success</p>
                            <p className='text-[16px] font-[400] text-[#666666] text-center max-w-[600px]'>
                                Order has been submitted and saved to your account.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className='flex flex-col md:flex-row gap-4 justify-center mb-12'>
                            <Button
                                onClick={handleSave}
                                variant="outline"
                                className='md:w-[150px] h-[44px] border-[1px] border-[#4290E9] text-[#4290E9] hover:bg-[#4290E9] hover:text-white font-[600] flex items-center gap-2'
                            >
                                <DownloadCloud className='w-[18px] h-[18px]' />
                                Download
                            </Button>
                            {isLoggedIn ? (
                                <Button
                                    onClick={() => handleNavigate('/dashboard')}
                                    className='md:w-[200px] h-[44px] bg-[#4290E9] text-white hover:bg-[#3077C0] font-[600]'
                                >
                                    Go to Dashboard
                                </Button>
                            ) : (
                                <p className='text-[14px] text-[#666666] self-center text-center'>
                                    Log in to access your order from the dashboard.
                                </p>
                            )}
                        </div>

                        {/* Order Details Card */}
                        {!loading && (orderId || orderData) && (
                            <div className='border-[1px] border-[#BBBBBB] rounded-[8px] p-6 md:p-8'>
                                {/* Order Header */}
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-6 border-b border-[#BBBBBB]'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-[40px] h-[40px] rounded-full bg-[#E3F2FD] flex items-center justify-center'>
                                            <span className='text-[#4290E9] text-[20px] font-[700]'>✓</span>
                                        </div>
                                        <div>
                                            <p className='text-[14px] font-[400] text-[#999999]'>Order ID</p>
                                            <p className='text-[18px] font-[600] text-[#333333]'>
                                                {orderId || orderData?.uuid || 'Order #'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className='mt-4 md:mt-0'>
                                        <span className='inline-block px-4 py-2 rounded-full bg-[#E8F5E9] text-[#4CAF50] text-[13px] font-[600]'>
                                            {orderData?.order_status || 'Processing'}
                                        </span>
                                    </div>
                                </div>

                                {/* Vendor and Property Info */}
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
                                    {/* Vendor Information */}
                                    <div>
                                        <p className='text-[14px] font-[600] text-[#333333] mb-3 uppercase tracking-wide'>Vendor</p>
                                        <div className='space-y-2'>
                                            <p className='text-[14px] font-[600] text-[#666666]'>
                                                {orderData?.vendor ? `${orderData.vendor.first_name || ''} ${orderData.vendor.last_name || ''}` : 'Vendor Information'}
                                            </p>
                                            {orderData?.vendor?.company?.company_name && (
                                                <p className='text-[13px] text-[#888888]'>{orderData.vendor.company.company_name}</p>
                                            )}
                                            {orderData?.vendor?.email && (
                                                <p className='text-[13px] text-[#888888]'>{orderData.vendor.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Property Information */}
                                    <div>
                                        <p className='text-[14px] font-[600] text-[#333333] mb-3 uppercase tracking-wide'>Property</p>
                                        <div className='space-y-2'>
                                            <p className='text-[14px] font-[600] text-[#666666]'>
                                                {tempPropertyData?.address || orderData?.property?.address || 'Property Address'}
                                            </p>
                                            {(tempPropertyData?.city || orderData?.property?.city) && (
                                                <p className='text-[13px] text-[#888888]'>
                                                    {tempPropertyData?.city || orderData?.property?.city}
                                                    {(tempPropertyData?.province || orderData?.property?.province) && `, ${tempPropertyData?.province || orderData?.property?.province}`}
                                                </p>
                                            )}
                                            {(tempPropertyData?.postal_code || orderData?.property?.postal_code) && (
                                                <p className='text-[13px] text-[#888888]'>
                                                    {tempPropertyData?.postal_code || orderData?.property?.postal_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div>
                                    <p className='text-[14px] font-[600] text-[#333333] mb-4 uppercase tracking-wide'>Order Details</p>
                                    <div className='space-y-3'>
                                        {/* Services */}
                                        {selectedServices && selectedServices.length > 0 && (
                                            <>
                                                <div className='flex justify-between items-center'>
                                                    <span className='text-[14px] text-[#666666]'>Services</span>
                                                    <span className='text-[14px] font-[600] text-[#333333]'>{selectedServices.length} item{selectedServices.length !== 1 ? 's' : ''}</span>
                                                </div>
                                                {selectedServices.map((service, index) => (
                                                    <div key={index} className='ml-4 flex justify-between items-center py-2 border-t border-[#E4E4E4]'>
                                                        <span className='text-[13px] text-[#888888]'>{service.title || service.optionName}</span>
                                                        <span className='text-[13px] font-[500] text-[#333333]'>
                                                            ${Number(service.price || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Subtotal */}
                                        <div className='flex justify-between items-center py-3 border-t border-[#BBBBBB]'>
                                            <span className='text-[14px] text-[#666666]'>Subtotal</span>
                                            <span className='text-[14px] font-[600] text-[#333333]'>
                                                ${totalAmount.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Total */}
                                        <div className='flex justify-between items-center py-3 border-t border-[#BBBBBB] bg-[#F5F5F5] px-3 rounded-[6px]'>
                                            <span className='text-[16px] font-[600] text-[#333333]'>Total</span>
                                            <span className='text-[18px] font-[700] text-[#4290E9]'>
                                                ${totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Status */}
                                <div className='mt-8 pt-6 border-t border-[#BBBBBB]'>
                                    <div className='flex justify-between items-center'>
                                        <span className='text-[14px] font-[600] text-[#666666]'>Payment Status</span>
                                        <span className='inline-block px-3 py-1 rounded-full bg-[#FFF3CD] text-[#FF9800] text-[12px] font-[600]'>
                                            {orderData?.payment_status || 'UNPAID'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !orderId && !orderData && (
                            <div className='text-center py-12'>
                                <p className='text-[16px] text-[#666666] mb-4'>Order details not available</p>
                                <Button
                                    onClick={() => handleNavigate('/book-now')}
                                    className='bg-[#4290E9] text-white hover:bg-[#3077C0] font-[600] h-[44px]'
                                >
                                    Back to Book Now
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
