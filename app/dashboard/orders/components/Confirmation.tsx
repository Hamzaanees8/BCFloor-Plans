'use client'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useOrderContext } from '../context/OrderContext';
import ConfirmationCard from './ConfirmationCard';
import { Slot } from '../context/OrderContext';
import { SelectedService } from './Services';

import { Input } from '@/components/ui/input';
import { Plus, Loader2, File } from 'lucide-react';
import { GetDiscount } from '../../global-settings/global-settings';
import { toast } from 'sonner';
import { Create, Edit, GetOneOrder, GetVendors, OrderPayload, CreateListings } from '../orders';
import { useParams, useRouter, useSearchParams } from 'next/navigation';


import { VendorData } from '../[id]/page';
import { Order, OrderService } from '../page';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAppContext } from '@/app/context/AppContext';
export type Discount = {
    id: number;
    uuid: string;
    type: 'code' | 'quantity';
    name: string | null;
    code_key: string | null;
    description: string | null;
    percentage: string;
    quantity: number | null;
    status: boolean;
    expiry_date: string | null;
    created_at: string;
    updated_at: string;
    services: {
        id: number;
        uuid: string;
        name?: string;
    }[];
};
export type OrderConfirmationHandle = {
    handleSubmitOrder: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
};
const Confirmation = forwardRef<OrderConfirmationHandle>((props, ref) => {
    const {
        isSplitInvoice,
        selectedAgentId,
        selectedListingId,
        agentNotes,
        coAgents,
        selectedServices,
        discountCode,
        setDiscountCode,
        appliedCodeDiscount,
        setAppliedCodeDiscount,
        appliedQuantityDiscounts,
        setAppliedQuantityDiscounts,
        total,
        setTotal,
        selectedSlots,
        isSubmitted,
        setIsSubmitted,
        isLoading,
        setIsLoading,
        activePackage,
        tempPropertyData,
        setTempPropertyData,
        servicesData: services,
        listingsData
    } = useOrderContext();
    const { userType } = useAppContext()
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleDone = () => {
        const from = searchParams.get('from');
        if (from === 'calendar') {
            router.push('/dashboard/calendar');
        } else {
            router.push('/dashboard/orders');
        }
    };

    const [discounts, setDiscounts] = React.useState<Discount[]>([]);
    const [vendorsData, setVendorsData] = React.useState<VendorData[]>([]);
    const [createdOrderUuid, setCreatedOrderUuid] = useState<string>("");
    const [orderData, setOrderData] = React.useState<Order | null>(null);
    const params = useParams();
    const userId = params?.id as string;

    const currentListing = listingsData.find(l => l.uuid === selectedListingId);
    const sqFootage = Number(currentListing?.square_footage || tempPropertyData?.square_footage || 0);

    const getOriginalPrice = React.useCallback((sel: SelectedService) => {
        let originalPrice = Number(sel.price) || 0;

        if (sel.payment_status?.toUpperCase() !== 'PAID' && !sel.custom) {
            const fullService = services.find(s => s.uuid === sel.uuid);
            const catalogOption = fullService?.product_options?.find(o => o.uuid === sel.option_id || o.title === sel.optionName);

            if (catalogOption) {
                if (catalogOption.sq_ft_rate && parseFloat(catalogOption.sq_ft_rate) > 0 && sqFootage > 0) {
                    const calculated = parseFloat(catalogOption.sq_ft_rate) * sqFootage;
                    originalPrice = catalogOption.min_price
                        ? Math.max(calculated, catalogOption.min_price)
                        : calculated;
                } else if (Number(catalogOption.amount) > 0) {
                    originalPrice = Number(catalogOption.amount);
                }
            }
        }
        return originalPrice;
    }, [services, sqFootage]);

    // Helper function to calculate discounted price for a service
    const calculateDiscountedPrice = React.useCallback((sel: SelectedService) => {
        const originalPrice = getOriginalPrice(sel);
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

        return finalPrice;
    }, [getOriginalPrice, appliedCodeDiscount, appliedQuantityDiscounts]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetOneOrder(token, createdOrderUuid)
            .then((data) => {
                setOrderData(data.data);
            })
            .catch((err) => console.log(err.message));
    }, [createdOrderUuid]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetVendors(token)
            .then((data) => {
                setVendorsData(data.data);
            })
            .catch((err) => console.log(err.message));
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetDiscount()
            .then((data) => setDiscounts(Array.isArray(data.data) ? data.data : []))
            .catch((err) => console.log(err.message));
    }, []);

    useEffect(() => {
        const validQuantityDiscounts = discounts.filter((discount) => {
            if (discount.type !== "quantity" || !discount.services) return false;

            // ✅ check status
            if (!discount.status) return false;

            // ✅ check expiry date
            const now = new Date();
            const expiry = discount.expiry_date ? new Date(discount.expiry_date) : null;
            if (expiry && expiry.getTime() < now.getTime()) return false;

            // Count total quantity of eligible services (including matching PAID services)
            const eligibleCount = selectedServices
                .filter(sel => discount.services?.some(dService => dService.uuid === sel.uuid))
                .reduce((sum, sel) => sum + (Number(sel.quantity) || 1), 0);

            const requiredQty = Number(discount.quantity) || 0;
            return eligibleCount >= requiredQty;
        });

        setAppliedQuantityDiscounts(validQuantityDiscounts);
    }, [selectedServices, discounts, setAppliedQuantityDiscounts]);

    useEffect(() => {
        if (!selectedServices?.length || !services?.length) return;

        let newTotal = 0;

        selectedServices.forEach(sel => {
            newTotal += calculateDiscountedPrice(sel);
        });

        if (activePackage && (activePackage.discount || 0) > 0) {
            const rawShopTotal = selectedServices.reduce((sum, s) => {
                return sum + getOriginalPrice(s);
            }, 0);
            const pkgDiscount = (rawShopTotal * (activePackage.discount || 0)) / 100;
            // Ensure we don't go below zero?
            newTotal = Math.max(0, newTotal - pkgDiscount);
        }

        setTotal(newTotal);
    }, [selectedServices, services, appliedCodeDiscount, appliedQuantityDiscounts, setTotal, activePackage, listingsData, selectedListingId, tempPropertyData, getOriginalPrice, calculateDiscountedPrice]);

    const handleApplyDiscount = () => {
        const matched = discounts.find(
            (d) => d.type === "code" && d.code_key?.toLowerCase() === discountCode.toLowerCase()
        );

        if (!matched) {
            toast.error("Invalid discount code");
            return;
        }
        // Check if selectedServices contains at least one of the services eligible for this discount
        const validForService = selectedServices.some(sel =>
            matched.services?.some(dService => dService.uuid === sel.uuid)
        );

        if (!validForService) {
            toast.error("This discount is not valid for selected services.");
            return;
        }

        setAppliedCodeDiscount(matched);
        toast.success("Discount Applied Successfully");
    };

    const buildDiscountPayload = () => {
        const discountPayload: {
            discount_id: string;
            type: 'code' | 'quantity' | 'manual' | 'package';
            value: number;
            service_id?: string;
        }[] = [];

        selectedServices.forEach(sel => {
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
                const originalPrice = getOriginalPrice(sel);
                const discountAmount = (originalPrice * discountPercent) / 100;

                discountPayload.push({
                    discount_id: bestDiscount.uuid,
                    type: bestDiscount.type,
                    value: Number(discountAmount.toFixed(2)),
                    service_id: sel.uuid,
                });
            }
        });

        return discountPayload;
    };


    const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);

        try {
            const discounts = buildDiscountPayload();
            const token = localStorage.getItem('token') || '';

            let propertyId = selectedListingId;

            if (!propertyId && tempPropertyData) {
                const listingResponse = await CreateListings(tempPropertyData, token);
                if (listingResponse?.data?.uuid) {
                    propertyId = listingResponse.data.uuid;
                    // We can clear tempPropertyData after order is fully submitted if we want, 
                    // but doing it here ensures we don't try to create it again if order fails and they retry.
                } else {
                    toast.error("Failed to create property");
                    throw new Error("Failed to create property");
                }
            }

            const payload: OrderPayload = {
                agent_id: selectedAgentId ?? '',
                property_id: propertyId ?? '',
                amount: total,
                order_status: "Processing",
                payment_status: "UNPAID",
                split_invoice: isSplitInvoice ? 1 : 0,
                co_agents: coAgents,
                notes: agentNotes.map(note => ({
                    ...note,
                    date: new Date(note.date).toISOString().split("T")[0],
                })),
                services: selectedServices
                    .map(service => {
                        const isPaid = service.payment_status?.toUpperCase() === 'PAID';
                        const originalPrice = getOriginalPrice(service);

                        if (isPaid) {
                            return {
                                ...(service.service_uuid && { uuid: service.service_uuid }),
                                service_id: service.uuid as string,
                                option_id: service.option_id ?? undefined,
                                amount: Number(originalPrice.toFixed(2)),
                                custom: service.custom ?? undefined
                            };
                        }

                        return {
                            ...(service.service_uuid && { uuid: service.service_uuid }), // Include uuid for existing services
                            service_id: service.uuid as string,
                            option_id: service.option_id ?? undefined,
                            amount: Number(originalPrice.toFixed(2)),
                            custom: service.custom ?? undefined
                        };
                    }),
                discounts,
                slots: (() => {
                    // Group slots by service_id, vendor_id, and date
                    const groupedSlots: Record<string, Slot[]> = {};

                    selectedSlots.forEach((slot: Slot) => {
                        const key = `${slot.service_id}_${slot.vendor_id}_${slot.date}`;
                        if (!groupedSlots[key]) {
                            groupedSlots[key] = [];
                        }
                        groupedSlots[key].push(slot);
                    });

                    // Merge consecutive slots for each group
                    const mergedSlots: Array<{
                        uuid?: string;
                        service_id: string;
                        vendor_id: string;
                        show_all_vendors: number;
                        schedule_override: number;
                        recommend_time: number;
                        travel?: string;
                        start_time: string;
                        end_time: string;
                        est_time: number | null;
                        distance: number | null;
                        km_price: number | null;
                        date: string;
                    }> = [];

                    Object.values(groupedSlots).forEach((slots) => {
                        // Sort slots by start time
                        const sortedSlots = slots.sort((a, b) => a.start_time.localeCompare(b.start_time));

                        // Verify they are contiguous (sanity check)
                        let isContiguous = true;
                        for (let i = 0; i < sortedSlots.length - 1; i++) {
                            if (sortedSlots[i].end_time !== sortedSlots[i + 1].start_time) {
                                isContiguous = false;
                                console.warn('Non-contiguous slots detected for service:', sortedSlots[i].service_id);
                                break;
                            }
                        }

                        if (!isContiguous) {
                            // If not contiguous, send slots individually (fallback)
                            sortedSlots.forEach(slot => {
                                mergedSlots.push({
                                    ...(slot.uuid && { uuid: slot.uuid }),
                                    service_id: slot.service_id,
                                    vendor_id: slot.vendor_id,
                                    show_all_vendors: slot.show_all_vendors ? 1 : 0,
                                    schedule_override: slot.schedule_override ? 1 : 0,
                                    recommend_time: slot.recommend_time ? 1 : 0,
                                    travel: slot.travel ?? undefined,
                                    start_time: slot.start_time,
                                    end_time: slot.end_time,
                                    est_time: slot.est_time ?? null,
                                    distance: slot.distance ?? null,
                                    km_price: slot.km_price ?? null,
                                    date: slot.date
                                });
                            });
                        } else {
                            // Merge into a single slot
                            const firstSlot = sortedSlots[0];
                            const lastSlot = sortedSlots[sortedSlots.length - 1];

                            mergedSlots.push({
                                ...(firstSlot.uuid && { uuid: firstSlot.uuid }),
                                service_id: firstSlot.service_id,
                                vendor_id: firstSlot.vendor_id,
                                show_all_vendors: firstSlot.show_all_vendors ? 1 : 0,
                                schedule_override: firstSlot.schedule_override ? 1 : 0,
                                recommend_time: firstSlot.recommend_time ? 1 : 0,
                                travel: firstSlot.travel ?? undefined,
                                start_time: firstSlot.start_time,
                                end_time: lastSlot.end_time,
                                est_time: firstSlot.est_time ?? null,
                                distance: firstSlot.distance ?? null,
                                km_price: firstSlot.km_price ?? null,
                                date: firstSlot.date
                            });
                        }
                    });

                    return mergedSlots;
                })()
            };

            let response;

            if (userId) {
                const updatedPayload = { ...payload, _method: 'PUT' };
                response = await Edit(userId, updatedPayload, token);
            } else {
                response = await Create(payload, token);
            }

            if (!response?.success) throw new Error("Order failed");

            setCreatedOrderUuid(response.data.uuid);
            setIsSubmitted(true);
            setTempPropertyData(null);
        } catch (err) {
            console.error("Failed to submit order", err);
            setIsSubmitted(false);
        } finally {
            setIsLoading(false); // ✅ ALWAYS LAST
        }
    };

    const totalServiceAmount = orderData?.services
        ?.reduce((sum: number, s: OrderService) => {
            return sum + parseFloat(s.amount || "0");
        }, 0) ?? 0;

    const uniqueVendorsMap = new Map();

    if (Array.isArray(orderData?.slots)) {
        orderData?.slots.forEach((slot) => {
            const vendor = slot?.vendor;
            if (vendor && !uniqueVendorsMap.has(vendor.uuid)) {
                uniqueVendorsMap.set(vendor.uuid, vendor);
            }
        });
    }

    const uniqueVendors = Array.from(uniqueVendorsMap.values());
    useImperativeHandle(ref, () => ({
        handleSubmitOrder,
    }));
    return (
        <div className="w-full space-y-4">
            <div className="grid gap-4">
                <div className='w-full flex flex-col items-center'>
                    <div className='w-full md:w-[370px] pt-[60px] pb-[100px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                        {(isSubmitted && createdOrderUuid && !isLoading) ? (
                            <div className="w-full md:w-[450px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[48px] text-[#424242] text-[14px] font-[400]">
                                <div className='flex flex-col gap-[10px]'>
                                    <div className='flex justify-between gap-[12px]'>
                                        <div className='flex gap-[12px] items-center'>
                                            <File className='text-[#4290E9] h-[24px]w-[30px]  md:h-[36px] md:w-[40px]' />
                                            <p className='text-[#4290E9] text-[24px] md:text-[36px] font-[400]'>Order {orderData?.id}</p>
                                        </div>
                                        <div className='items-center gap-[12px] hidden'>
                                            <Switch className=' data-[state=checked]:bg-[#6BAE41] ' />
                                            <p className='text-[#666666] text-[16px]'>Open</p>
                                        </div>
                                    </div>
                                    <p className='text-[#666666] text-[16px] font-[400]'>This is only a quote. Invoiced amount will likely change based on actual measured area.</p>
                                </div>
                                <div className='text-[#666666] flex gap-x-[20px]'>
                                    <div className='flex flex-col gap-y-[20px] w-1/2 text-wrap'>
                                        <p>{uniqueVendors?.length > 1 ? "Vendors" : "Vendor"}</p>
                                        {uniqueVendors?.map((vendor) => (
                                            <div key={vendor.uuid} >
                                                <p>{vendor.first_name} {vendor.last_name}</p>
                                                <p>{vendor.company?.company_name ?? "N/A"}</p>
                                                <p>{vendor.email}</p>
                                            </div>
                                        ))}
                                    </div>


                                    <div className='w-1/2 text-wrap'>
                                        <p className='mb-[20px]'>Customer</p>
                                        <p>Realtor</p>
                                        <p>{orderData?.agent?.first_name} {orderData?.agent?.last_name}</p>
                                        <p>{orderData?.agent?.company_name}</p>
                                        <p>{orderData?.agent?.email}</p>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-[18px] text-[#666666] text-[16px]'>
                                    <p className='text-[20px] text-[#666666] font-[700]'>Order Details</p>

                                    {/* Package amount - this should show the sum of all services */}
                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>Package</span>
                                        <span className='col-span-1'>
                                            ${totalServiceAmount.toFixed(2)}
                                        </span>
                                    </p>

                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>Items</span>
                                        <span className='col-span-1'>{orderData?.services?.length}</span>
                                    </p>

                                    <div className="grid gap-[15px]">
                                        {orderData?.services?.map((service) => {
                                            const isPaid = service.payment_status?.toUpperCase() === 'PAID';
                                            return (
                                                <p key={service.id} className="grid grid-cols-4 gap-[15px] items-center">
                                                    <span className="col-span-3 flex items-center gap-2">
                                                        {service.service?.name ?? ""}
                                                        {isPaid && (
                                                            <span className="text-[10px] bg-[#6BAE41] text-white px-1.5 py-0.5 rounded font-semibold uppercase">
                                                                Paid
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="col-span-1">${parseFloat(service.amount).toFixed(2)}</span>
                                                </p>
                                            );
                                        })}
                                    </div>

                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>GST/HST</span>
                                        <span className='col-span-1'>$0.00</span>
                                    </p>

                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>PST/RST/QST</span>
                                        <span className='col-span-1'>$0.00</span>
                                    </p>

                                    {(() => {
                                        // Calculate subtotal from services
                                        const subtotal = orderData?.services?.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0) || 0;

                                        // Calculate total discount from orderData.totals array
                                        const totalDiscount = orderData?.totals?.reduce((total, item) => {
                                            if (item.amount && parseFloat(item.amount) < 0) {
                                                return total + Math.abs(parseFloat(item.amount));
                                            }
                                            return total;
                                        }, 0) || 0;

                                        // Calculate discount percentage
                                        const discountPercent = subtotal > 0 ? ((totalDiscount / subtotal) * 100).toFixed(2) : "0.00";

                                        // Grand total is the final amount from the order
                                        const grandTotal = parseFloat(orderData?.amount || "0");

                                        // Get paid amount from order data
                                        const paidAmount = parseFloat(orderData?.paid_amount || "0") || 0;

                                        // Calculate balance due
                                        const balanceDue = grandTotal - paidAmount;

                                        return (
                                            <>
                                                {/* Subtotal */}
                                                <p className='grid grid-cols-4 gap-[15px]'>
                                                    <span className='col-span-3'>Subtotal</span>
                                                    <span className='col-span-1'>${subtotal.toFixed(2)}</span>
                                                </p>

                                                {/* Discount */}
                                                {totalDiscount > 0 && (
                                                    <p className='grid grid-cols-4 gap-[15px]'>
                                                        <span className='col-span-3'>Discount</span>
                                                        <span className='col-span-1'>
                                                            -${totalDiscount.toFixed(2)} ({discountPercent}%)
                                                        </span>
                                                    </p>
                                                )}

                                                {/* Grand Total */}
                                                <p className='grid grid-cols-4 gap-[15px]'>
                                                    <span className='col-span-3'>Grand Total</span>
                                                    <span className='col-span-1'>${grandTotal.toFixed(2)}</span>
                                                </p>

                                                {/* Show paid amount if any payment has been made */}
                                                {paidAmount > 0 && (
                                                    <p className='grid grid-cols-4 gap-[15px] text-[#6BAE41]'>
                                                        <span className='col-span-3'>Paid</span>
                                                        <span className='col-span-1'>-${paidAmount.toFixed(2)}</span>
                                                    </p>
                                                )}

                                                {/* Show balance due */}
                                                <p className='grid grid-cols-4 gap-[15px] text-[20px] md:text-[24px] font-[500] border-t pt-2'>
                                                    <span className='col-span-3'>
                                                        {paidAmount > 0 ? "Balance Due" : "Amount Due"}
                                                    </span>
                                                    <span className='col-span-1'>${Math.max(0, balanceDue).toFixed(2)}</span>
                                                </p>
                                            </>
                                        );
                                    })()}

                                    <Button
                                        onClick={handleDone}
                                        className="col-span-2 w-full rounded-[3px] md:w-full h-[32px] md:h-[32px] bg-[#4290E9] text-[14px] md:text-[14px] font-[600] text-white flex gap-[5px] justify-center items-center hover:bg-[#005fb8] font-raleway"
                                    >
                                        Done
                                    </Button>
                                </div>
                                <div>
                                    <p className='text-[12px]'>Lorem ipsum dolor sit amet. Et minus internos rem culpa ratione quo harum obcaecati ut minima quia.
                                        Eos aliquid inventore et dicta sint quo autem ipsam ea officiis iste et quia temporibus eum ratione sunt
                                        non dolorum cumque. Aut quas optio cum dolorem voluptatibus ut quae culpa aut repellat quod qui suscipit
                                        consequuntur. Qui explicabo distinctio est eveniet dolorem sed voluptatem perspiciatis eum Quis dolorum
                                        et voluptatem corporis cum minima ipsa.</p>
                                </div>
                            </div>
                        ) : (
                            <div className='grid grid-cols-2 gap-[22px]'>

                                <div className='col-span-2'>
                                    {selectedServices.map((sel) => {
                                        const fullService = services.find(s => s.uuid === sel.uuid);
                                        if (!fullService) return null;

                                        // Get all slots for this service
                                        const serviceSlots = selectedSlots.filter(slot => slot.service_id === sel.uuid);

                                        // Group slots by vendor_id
                                        const groupedByVendor: Record<string, typeof serviceSlots> = {};
                                        serviceSlots.forEach(slot => {
                                            if (!groupedByVendor[slot.vendor_id]) {
                                                groupedByVendor[slot.vendor_id] = [];
                                            }
                                            groupedByVendor[slot.vendor_id].push(slot);
                                        });

                                        // Build slotInfo array
                                        const slotInfo = Object.entries(groupedByVendor).map(([vendorId, vendorSlots]) => {
                                            const vendor = vendorsData.find(v => v.uuid === vendorId);
                                            const vendorName = vendor ? `${vendor.first_name ?? ''} ${vendor.last_name ?? ''}`.trim() : 'Unknown Vendor';

                                            // Further group by date
                                            const slotsByDate: Record<string, typeof vendorSlots> = {};
                                            vendorSlots.forEach(slot => {
                                                if (!slotsByDate[slot.date]) {
                                                    slotsByDate[slot.date] = [];
                                                }
                                                slotsByDate[slot.date].push(slot);
                                            });

                                            const timeRanges: string[] = [];

                                            Object.entries(slotsByDate).forEach(([dateStr, slots]) => {
                                                // Sort by start_time
                                                slots.sort((a, b) => a.start_time.localeCompare(b.start_time));

                                                // Merge contiguous slots
                                                const mergedRanges: { start: string; end: string }[] = [];
                                                if (slots.length > 0) {
                                                    let currentRange = { start: slots[0].start_time, end: slots[0].end_time };

                                                    for (let i = 1; i < slots.length; i++) {
                                                        const slot = slots[i];
                                                        if (slot.start_time === currentRange.end) {
                                                            // Extend current range
                                                            currentRange.end = slot.end_time;
                                                        } else {
                                                            // Push current range and start new one
                                                            mergedRanges.push(currentRange);
                                                            currentRange = { start: slot.start_time, end: slot.end_time };
                                                        }
                                                    }
                                                    mergedRanges.push(currentRange);
                                                }

                                                // Format ranges
                                                // Use dateStr + "T00:00:00" to avoid UTC timezone issues if dateStr is YYYY-MM-DD
                                                const formattedDate = dateStr
                                                    ? new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
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
                                                mergedRanges.forEach(range => {
                                                    const startTime = range.start ? formatTime(range.start) : "";
                                                    const endTime = range.end ? formatTime(range.end) : "";
                                                    timeRanges.push(`${formattedDate} | ${startTime} - ${endTime}`);
                                                });
                                            });

                                            return {
                                                vendorName,
                                                timeRanges,
                                            };
                                        });

                                        return (
                                            <ConfirmationCard
                                                key={fullService.uuid}
                                                service={fullService}
                                                title={fullService.name ?? ""}
                                                selectedService={sel}
                                                slotInfo={slotInfo}
                                            />
                                        );
                                    })}


                                </div>
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
                                        <Plus className={`w-[24px] h-[24px] ${userType}-bg text-white rounded-sm `} />
                                    </div>
                                </div>
                                {selectedServices.map((sel) => {
                                    const fullService = services.find(s => s.uuid === sel.uuid);
                                    if (!fullService) return null;

                                    const originalPrice = getOriginalPrice(sel);

                                    const codeDiscount = appliedCodeDiscount?.services?.some(d => d.uuid === sel.uuid)
                                        ? appliedCodeDiscount
                                        : null;

                                    const quantityDiscounts = appliedQuantityDiscounts.filter(d =>
                                        d.services?.some(s => s.uuid === sel.uuid)
                                    );

                                    const allDiscounts: Discount[] = [];
                                    if (codeDiscount) allDiscounts.push(codeDiscount);
                                    allDiscounts.push(...quantityDiscounts);

                                    // ✅ skip rendering if no discounts for this service
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

                                <div className='col-span-2'>
                                    <div className='flex flex-col gap-2'>
                                        {activePackage && (activePackage.discount || 0) > 0 && (
                                            <div className='flex items-center justify-between'>
                                                <p className='font-normal text-[14px] text-green-600'>
                                                    Package: {activePackage.name} ({activePackage.discount}%)
                                                </p>
                                                <p className='font-normal text-[14px] text-green-600'>
                                                    - ${(
                                                        (selectedServices.reduce((sum, s) => {
                                                            if (s.payment_status?.toUpperCase() === 'PAID') return sum;
                                                            return sum + getOriginalPrice(s);
                                                        }, 0) * (activePackage.discount || 0)) / 100
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        {(() => {
                                            // Calculate original total for all services
                                            const totalOriginalPrice = selectedServices.reduce((sum, sel) => {
                                                return sum + getOriginalPrice(sel);
                                            }, 0);

                                            // Calculate total discount for ALL services (both paid and unpaid)
                                            const totalDiscountValue = selectedServices.reduce((sum, sel) => {
                                                const originalPrice = getOriginalPrice(sel);
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

                                                if (bestDiscount) {
                                                    const discountPercent = parseFloat(bestDiscount.percentage ?? "0");
                                                    return sum + (originalPrice * discountPercent / 100);
                                                }
                                                return sum;
                                            }, 0);

                                            // Calculate package discount for ALL services
                                            let packageDiscount = 0;
                                            if (activePackage && (activePackage.discount || 0) > 0) {
                                                const rawShopTotal = selectedServices.reduce((sum, s) => {
                                                    return sum + getOriginalPrice(s);
                                                }, 0);
                                                packageDiscount = (rawShopTotal * (activePackage.discount || 0)) / 100;
                                            }

                                            // Grand Total = Original total - All discounts
                                            const grandTotal = totalOriginalPrice - (totalDiscountValue + packageDiscount);

                                            // Calculate paid amount (use discounted price for paid services if applicable)
                                            const paidAmount = selectedServices.reduce((acc, curr) => {
                                                if (curr.payment_status?.toUpperCase() === 'PAID') {
                                                    const originalPrice = getOriginalPrice(curr);

                                                    // Calculate discount for this specific paid service
                                                    const codeDiscount = appliedCodeDiscount?.services?.some(d => d.uuid === curr.uuid)
                                                        ? appliedCodeDiscount
                                                        : null;
                                                    const quantityDiscounts = appliedQuantityDiscounts.filter(d =>
                                                        d.services?.some(s => s.uuid === curr.uuid)
                                                    );
                                                    const allDiscounts: Discount[] = [];
                                                    if (codeDiscount) allDiscounts.push(codeDiscount);
                                                    allDiscounts.push(...quantityDiscounts);
                                                    const bestDiscount = allDiscounts.reduce((best, currDiscount) => {
                                                        const currPercent = parseFloat(currDiscount.percentage ?? "0");
                                                        const bestPercent = best ? parseFloat(best.percentage ?? "0") : 0;
                                                        return currPercent > bestPercent ? currDiscount : best;
                                                    }, null as Discount | null);

                                                    let discountAmount = 0;
                                                    if (bestDiscount) {
                                                        const discountPercent = parseFloat(bestDiscount.percentage ?? "0");
                                                        discountAmount = originalPrice * discountPercent / 100;
                                                    }

                                                    // Add package discount proportionally
                                                    if (activePackage && packageDiscount > 0) {
                                                        const serviceRatio = originalPrice / totalOriginalPrice;
                                                        discountAmount += (packageDiscount * serviceRatio);
                                                    }

                                                    return acc + (originalPrice - discountAmount);
                                                }
                                                return acc;
                                            }, 0);

                                            // Amount Due = Grand Total - Paid Amount
                                            const amountDue = grandTotal - paidAmount;

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
                                                            ${Math.max(0, amountDue).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                {!userType &&
                                    <div className='col-span-2'>
                                        <button
                                            disabled={isLoading}
                                            type="button"
                                            onClick={handleSubmitOrder}
                                            className={`bg-[#4290E9] font-raleway text-white rounded-[3px] hover:bg-[#4290E9] w-full h-[30px] font-[600] text-[14px] flex items-center justify-center gap-2`}
                                        >
                                            {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : "Submit Order"}
                                        </button>
                                    </div>
                                }
                                <div className='col-span-2'>
                                    <button
                                        disabled={isLoading}
                                        type="button"
                                        onClick={handleSubmitOrder}
                                        className={`${userType}-bg font-raleway text-white rounded-[3px] hover-${userType}-bg w-full h-[30px] font-[600] text-[14px] flex items-center justify-center gap-2`}
                                    >
                                        {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : "Submit Order"}
                                    </button>
                                </div>

                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
});
Confirmation.displayName = "Confirmation";
export default Confirmation