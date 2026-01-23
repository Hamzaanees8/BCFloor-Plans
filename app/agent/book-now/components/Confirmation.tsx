'use client'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useBookNowContext } from '../context/BookNowContext';
import ConfirmationCard from './ConfirmationCard';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { fetchVendorForBookNow, fetchServicesForBookNow, fetchDiscountsForBookNow, submitBookNowOrder, createPropertyForBookNow } from '../book-now';

export type BookNowConfirmationHandle = {
    handleSubmitOrder: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
};

type Discount = {
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
    services?: {
        id?: number;
        uuid: string;
        name?: string;
    }[];
};

type Service = {
    uuid: string;
    name: string;
    product_options?: {
        uuid: string;
        title: string;
        amount: string | number;
    }[];
};

type VendorData = {
    uuid: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    primary_phone?: string;
    company?: {
        company_name?: string;
    };
};

const BookNowConfirmation = forwardRef<BookNowConfirmationHandle>((props, ref) => {
    const {
        selectedServices,
        discountCode,
        setDiscountCode,
        appliedCodeDiscount,
        setAppliedCodeDiscount,
        isLoading,
        setIsLoading,
        tempPropertyData,
        selectedSlots,
    } = useBookNowContext();

    const router = useRouter();
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [vendorsData, setVendorsData] = useState<VendorData[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [total, setTotal] = useState(0);
    const [appliedQuantityDiscounts, setAppliedQuantityDiscounts] = useState<Discount[]>([]);

    // Fetch data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [vendorsList, servicesList, discountList] = await Promise.all([
                    fetchVendorForBookNow(),
                    fetchServicesForBookNow(),
                    fetchDiscountsForBookNow(),
                ]);
                setVendorsData(vendorsList);
                setServices(servicesList);
                setDiscounts(Array.isArray(discountList) ? discountList : []);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    // Validate and apply quantity discounts
    useEffect(() => {
        const validQuantityDiscounts = discounts.filter((discount) => {
            if (discount.type !== "quantity" || !discount.services) return false;
            if (!discount.status) return false;
            const now = new Date();
            const expiry = discount.expiry_date ? new Date(discount.expiry_date) : null;
            if (expiry && expiry.getTime() < now.getTime()) return false;

            const eligibleCount = selectedServices
                .filter(sel => discount.services?.some(dService => dService.uuid === sel.uuid))
                .reduce((sum, sel) => sum + (Number(sel.quantity) || 1), 0);

            const requiredQty = Number(discount.quantity) || 0;
            return eligibleCount >= requiredQty;
        });

        setAppliedQuantityDiscounts(validQuantityDiscounts);
    }, [selectedServices, discounts]);

    // Calculate total with discounts
    useEffect(() => {
        let newTotal = 0;

        selectedServices.forEach(sel => {
            if (sel.payment_status?.toUpperCase() === 'PAID') return;

            const originalPrice = Number(sel.price) || 0;

            const codeDiscount = appliedCodeDiscount?.services?.some(d => d.uuid === sel.uuid)
                ? appliedCodeDiscount
                : null;

            const quantityDiscounts = appliedQuantityDiscounts.filter(d =>
                d.services?.some(s => s.uuid === sel.uuid)
            );

            const allDiscounts: Discount[] = [];
            if (codeDiscount) allDiscounts.push(codeDiscount);
            allDiscounts.push(...quantityDiscounts);

            const bestDiscount = allDiscounts.reduce((best, curr) => {
                const currPercent = parseFloat(curr.percentage ?? "0");
                const bestPercent = best ? parseFloat(best.percentage ?? "0") : 0;
                return currPercent > bestPercent ? curr : best;
            }, null as Discount | null);

            const finalPrice = bestDiscount
                ? originalPrice * ((100 - parseFloat(bestDiscount.percentage ?? "0")) / 100)
                : originalPrice;

            newTotal += finalPrice;
        });

        setTotal(newTotal);
    }, [selectedServices, appliedCodeDiscount, appliedQuantityDiscounts]);

    const handleApplyDiscount = () => {
        const matched = discounts.find(
            (d) => d.type === "code" && d.code_key?.toLowerCase() === discountCode.toLowerCase()
        );

        if (!matched) {
            toast.error("Invalid discount code");
            return;
        }

        const validForService = selectedServices.some(sel =>
            sel.payment_status?.toUpperCase() !== 'PAID' &&
            matched.services?.some(dService => dService.uuid === sel.uuid)
        );

        if (!validForService) {
            toast.error("This discount is not valid for selected services.");
            return;
        }

        setAppliedCodeDiscount(matched);
        toast.success("Discount Applied Successfully");
    };

    const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!tempPropertyData?.address) {
            toast.error("Please complete property details - Address is required");
            return;
        }

        if (!tempPropertyData?.city) {
            toast.error("Please enter city");
            return;
        }

        if (!tempPropertyData?.province) {
            toast.error("Please select province/state");
            return;
        }


        if (!tempPropertyData?.country) {
            toast.error("Please select country");
            return;
        }

        if (!selectedServices || selectedServices.length === 0) {
            toast.error("Please select at least one service");
            return;
        }

        if (selectedSlots.length === 0) {
            toast.error("Please schedule at least one service");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('agentToken');
            if (!token) {
                toast.error("Authentication required. Please login again.");
                setIsLoading(false);
                return;
            }

            // Build order payload similar to order screen
            const discountPayload: {
                discount_id: string;
                type: 'code' | 'quantity' | 'manual' | 'package';
                value: number;
                service_id?: string;
            }[] = [];

            selectedServices.forEach(sel => {
                if (sel.payment_status?.toUpperCase() === 'PAID') return;
                const allApplicableDiscounts: Discount[] = [];

                if (appliedCodeDiscount?.services?.some(d => d.uuid === sel.uuid)) {
                    allApplicableDiscounts.push(appliedCodeDiscount);
                }

                const qtyDiscounts = appliedQuantityDiscounts.filter(discount =>
                    discount.services?.some(s => s.uuid === sel.uuid)
                );

                allApplicableDiscounts.push(...qtyDiscounts);

                const bestDiscount = allApplicableDiscounts.reduce((best, curr) => {
                    const currPercent = parseFloat(curr.percentage ?? '0');
                    const bestPercent = best ? parseFloat(best.percentage ?? '0') : 0;
                    return currPercent > bestPercent ? curr : best;
                }, null as Discount | null);

                if (bestDiscount) {
                    const discountPercent = parseFloat(bestDiscount.percentage ?? '0');
                    const originalPrice = Number(sel.price) || 0;
                    const discountAmount = (originalPrice * discountPercent) / 100;

                    discountPayload.push({
                        discount_id: bestDiscount.uuid,
                        type: bestDiscount.type,
                        value: Number(discountAmount.toFixed(2)),
                        service_id: sel.uuid,
                    });
                }
            });

            // Merge consecutive slots
            const groupedSlots: Record<string, typeof selectedSlots> = {};
            selectedSlots.forEach((slot: unknown) => {
                const slotData = slot as unknown as typeof selectedSlots[0];
                const key = `${slotData.service_id}_${slotData.vendor_id}_${slotData.date}`;
                if (!groupedSlots[key]) {
                    groupedSlots[key] = [];
                }
                groupedSlots[key].push(slotData);
            });

            const mergedSlots: Array<{
                service_id: string;
                vendor_id: string;
                show_all_vendors: number;
                schedule_override: number;
                recommend_time: number;
                start_time: string;
                end_time: string;
                est_time: number | null;
                distance: number | null;
                km_price: number | null;
                date: string;
            }> = [];

            Object.values(groupedSlots).forEach((slots) => {
                const sortedSlots = slots.sort((a, b) => a.start_time.localeCompare(b.start_time));

                let isContiguous = true;
                for (let i = 0; i < sortedSlots.length - 1; i++) {
                    if (sortedSlots[i].end_time !== sortedSlots[i + 1].start_time) {
                        isContiguous = false;
                        break;
                    }
                }

                if (!isContiguous) {
                    sortedSlots.forEach(slot => {
                        mergedSlots.push({
                            service_id: slot.service_id,
                            vendor_id: slot.vendor_id,
                            show_all_vendors: slot.show_all_vendors ? 1 : 0,
                            schedule_override: slot.schedule_override ? 1 : 0,
                            recommend_time: slot.recommend_time ? 1 : 0,
                            start_time: slot.start_time,
                            end_time: slot.end_time,
                            est_time: slot.est_time ?? null,
                            distance: slot.distance ?? null,
                            km_price: slot.km_price ?? null,
                            date: slot.date
                        });
                    });
                } else {
                    const firstSlot = sortedSlots[0];
                    const lastSlot = sortedSlots[sortedSlots.length - 1];

                    mergedSlots.push({
                        service_id: firstSlot.service_id,
                        vendor_id: firstSlot.vendor_id,
                        show_all_vendors: firstSlot.show_all_vendors ? 1 : 0,
                        schedule_override: firstSlot.schedule_override ? 1 : 0,
                        recommend_time: firstSlot.recommend_time ? 1 : 0,
                        start_time: firstSlot.start_time,
                        end_time: lastSlot.end_time,
                        est_time: firstSlot.est_time ?? null,
                        distance: firstSlot.distance ?? null,
                        km_price: firstSlot.km_price ?? null,
                        date: firstSlot.date
                    });
                }
            });

            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

            // Create property first if needed
            let propertyId = '';
            if (tempPropertyData) {
                try {
                    // Use agent_id from tempPropertyData (which we just updated in property.tsx)
                    // or fall back to userInfo if it's missing for some reason
                    const agentId = tempPropertyData.agent_id || userInfo?.uuid || '';

                    const propertyDataWithAgent = {
                        ...tempPropertyData,
                        agent_id: agentId
                    };

                    const propertyResponse = await createPropertyForBookNow(propertyDataWithAgent, token);
                    if (propertyResponse?.data?.uuid) {
                        propertyId = propertyResponse.data.uuid;
                    } else {
                        toast.error("Failed to create property");
                        setIsLoading(false);
                        return;
                    }
                } catch (propertyError) {
                    console.error("Error creating property:", propertyError);
                    toast.error("Failed to create property");
                    setIsLoading(false);
                    return;
                }
            }

            const payload = {
                agent_id: tempPropertyData?.agent_id || userInfo?.uuid || '',
                property_id: propertyId,
                amount: total,
                order_status: "Processing",
                payment_status: "UNPAID",
                split_invoice: 0,
                co_agents: [],
                notes: [],
                services: selectedServices.map(service => ({
                    service_id: service.uuid as string,
                    option_id: service.option_id ?? undefined,
                    amount: Number((Number(service.price) || 0).toFixed(2)),
                    custom: service.custom ?? undefined
                })),
                discounts: discountPayload,
                slots: mergedSlots,
            };

            const response = await submitBookNowOrder(payload, token);

            if (response?.data?.uuid || response?.success) {
                toast.success("Order submitted successfully!");

                // Store data for thank you page
                localStorage.setItem('bookNowServices', JSON.stringify(selectedServices));
                localStorage.setItem('bookNowProperty', JSON.stringify(tempPropertyData));

                const orderId = response?.data?.uuid || response?.uuid || '';
                setTimeout(() => {
                    router.push(`/agent/book-now/thank-you?orderId=${orderId}`);
                }, 1500);
            } else {
                toast.error("Failed to submit order");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to submit order';
            console.error("Error submitting order:", error);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({
        handleSubmitOrder,
    }));

    return (
        <div className="w-full space-y-4">
            <div className="grid gap-4">
                <div className='w-full flex flex-col items-center'>
                    <div className='w-full md:w-[370px] pt-[60px] pb-[100px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                        <div className='grid grid-cols-2 gap-[22px]'>
                            {/* Service Cards */}
                            <div className='col-span-2'>
                                {selectedServices.map((sel) => {
                                    const fullService = services.find(s => s.uuid === sel.uuid);
                                    if (!fullService) return null;

                                    const serviceSlots = selectedSlots.filter(slot => slot.service_id === sel.uuid);
                                    const groupedByVendor: Record<string, typeof serviceSlots> = {};

                                    serviceSlots.forEach(slot => {
                                        if (!groupedByVendor[slot.vendor_id]) {
                                            groupedByVendor[slot.vendor_id] = [];
                                        }
                                        groupedByVendor[slot.vendor_id].push(slot);
                                    });

                                    const slotInfo = Object.entries(groupedByVendor).map(([vendorId, slots]) => {
                                        const vendor = vendorsData.find(v => v.uuid === vendorId);
                                        const vendorName = vendor ? `${vendor.first_name ?? ''} ${vendor.last_name ?? ''}`.trim() : 'Unknown Vendor';

                                        const timeRanges = slots.map(slot => {
                                            const date = slot.date
                                                ? new Date(slot.date).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })
                                                : "";

                                            const formatTime = (time: string) => {
                                                const [h, m] = time.split(":");
                                                const hour = parseInt(h);
                                                const meridian = hour >= 12 ? "PM" : "AM";
                                                const formattedHour = hour % 12 || 12;
                                                return `${formattedHour}:${m} ${meridian}`;
                                            };

                                            const startTime = slot.start_time ? formatTime(slot.start_time) : "";
                                            const endTime = slot.end_time ? formatTime(slot.end_time) : "";

                                            return `${date} | ${startTime} - ${endTime}`;
                                        });

                                        return { vendorName, timeRanges };
                                    });

                                    return (
                                        <ConfirmationCard
                                            key={fullService.uuid}
                                            service={fullService}
                                            title={fullService.name ?? ""}
                                            selectedService={{
                                                uuid: sel.uuid ?? "",
                                                title: sel.title ?? "",
                                                price: Number(sel.price) || 0,
                                                payment_status: sel.payment_status
                                            }}
                                            slotInfo={slotInfo}
                                        />
                                    );
                                })}
                            </div>

                            {/* Discount Code Section */}
                            <div className="col-span-2 grid grid-cols-7 gap-x-[30px]">
                                <div className="col-span-6">
                                    <label htmlFor="" className='font-normal text-sm text-[#666666]'>Discount Code</label>
                                    <Input
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                        className="h-[42px] w-full bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[8px]"
                                        type="text"
                                    />
                                    <p className="text-[10px] text-[#888888] mt-1 italic">
                                        Discount will not be applied to already paid services.
                                    </p>
                                </div>
                                <div className='w-[32px] h-[32px] flex items-center justify-center mt-[30px] cursor-pointer' onClick={() => { handleApplyDiscount(); setDiscountCode(""); }}>
                                    <Plus className={`w-[24px] h-[24px] bg-[#4290E9] text-white rounded-sm `} />
                                </div>
                            </div>

                            {/* Applied Discounts */}
                            {selectedServices.map((sel) => {
                                const fullService = services.find(s => s.uuid === sel.uuid);
                                if (!fullService) return null;

                                const originalPrice = Number(sel.price) || 0;
                                const codeDiscount = appliedCodeDiscount?.services?.some(d => d.uuid === sel.uuid)
                                    ? appliedCodeDiscount
                                    : null;

                                const quantityDiscounts = appliedQuantityDiscounts.filter(d =>
                                    d.services?.some(s => s.uuid === sel.uuid)
                                );

                                const allDiscounts: Discount[] = [];
                                if (codeDiscount) allDiscounts.push(codeDiscount);
                                allDiscounts.push(...quantityDiscounts);

                                if (allDiscounts?.length === 0) return null;

                                return (
                                    <div key={fullService.uuid} className="col-span-2 space-y-5">
                                        {allDiscounts.map((discount, idx) => {
                                            const percent = parseFloat(discount.percentage ?? "0");
                                            const discountedPrice = originalPrice * ((100 - percent) / 100);

                                            return (
                                                <div key={idx} className='flex items-start justify-between gap-x-6'>
                                                    <p className='text-[14px] font-normal text-[#666666] '>
                                                        Code: {discount.name ?? discount.code_key ?? "Unnamed Discount"}
                                                    </p>
                                                    <p className='text-[14px] font-normal text-[#666666] text-center'>
                                                        {discount.description ?? "—"}
                                                    </p>
                                                    <div className='text-right text-[14px] gap-x-1.5 font-normal flex items-start'>
                                                        <p className='line-through text-[#E06D5E]'>${originalPrice.toFixed(2)}</p>
                                                        <p className='text-[#6BAE41]'>${discountedPrice.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}

                            {/* Price Summary */}
                            <div className='col-span-2'>
                                <div className='flex flex-col gap-2'>
                                    {(() => {
                                        const paidAmount = selectedServices.reduce((acc, curr) => {
                                            if (curr.payment_status?.toUpperCase() === 'PAID') {
                                                return acc + (Number(curr.price) || 0);
                                            }
                                            return acc;
                                        }, 0);

                                        const grandTotal = paidAmount + total;

                                        return (
                                            <>
                                                <div className='flex items-center justify-between'>
                                                    <p className='font-normal text-[14px] text-[#424242]'>Grand Total</p>
                                                    <p className='font-normal text-[14px] text-[#424242]'>
                                                        ${grandTotal.toFixed(2)}
                                                    </p>
                                                </div>
                                                {paidAmount > 0 && (
                                                    <div className='flex items-center justify-between text-[#6BAE41]'>
                                                        <p className='font-normal text-[14px]'>Paid</p>
                                                        <p className='font-normal text-[14px]'>
                                                            -${paidAmount.toFixed(2)}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className='flex items-center justify-between mt-2 pt-2 border-t'>
                                                    <p className='font-normal text-[20px] text-[#424242]'>
                                                        {paidAmount > 0 ? "Balance Due" : "Amount Due"}
                                                    </p>
                                                    <p className='font-normal text-[20px] text-[#424242]'>
                                                        ${total.toFixed(2)}
                                                    </p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className='col-span-2'>
                                <button
                                    disabled={isLoading}
                                    type="button"
                                    onClick={handleSubmitOrder}
                                    className={`bg-[#4290E9] font-raleway text-white rounded-[3px] hover:bg-[#005fb8] w-full h-[30px] font-[600] text-[14px] flex items-center justify-center gap-2`}
                                >
                                    {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : "Submit Order"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
});

BookNowConfirmation.displayName = "BookNowConfirmation";
export default BookNowConfirmation

