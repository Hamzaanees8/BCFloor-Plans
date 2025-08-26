import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useOrderContext } from '../context/OrderContext';
import ConfirmationCard from './ConfirmationCard';
import { Services } from '../../services/page';
import { GetServices } from '../../services/services';
import { Input } from '@/components/ui/input';
import { Plus, TriangleAlert } from 'lucide-react';
import { GetDiscount } from '../../global-settings/global-settings';
import { toast } from 'sonner';
import { Create, Edit, GetOneOrder, GetVendors, OrderPayload } from '../orders';
import { useParams } from 'next/navigation';
import { VendorData } from '../[id]/page';
import { Order } from '../page';
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
    percentage: string; // assuming it's a string like "40.00"
    quantity: number | null;
    status: boolean;
    expiry_date: string | null; // ISO string
    created_at: string;
    updated_at: string;
    services: {
        id: number;
        uuid: string;
        name?: string;
        // Add more fields if needed from service
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
        setIsLoading
    } = useOrderContext();
    const { userType } = useAppContext()
    const [services, setServices] = useState<Services[]>([]);
    const [discounts, setDiscounts] = React.useState<Discount[]>([]);
    const [vendorsData, setVendorsData] = React.useState<VendorData[]>([]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [createdOrderUuid, setCreatedOrderUuid] = useState<string>("");
    const [orderData, setOrderData] = React.useState<Order | null>(null);
    const [amount, setAmount] = React.useState('');
    const params = useParams();
    const userId = params?.id as string;
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetServices(token)
            .then((data) => {
                setServices(Array.isArray(data.data) ? data.data : []);
            })
            .catch(err => {
                console.log(err.message);
            });
    }, []);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetOneOrder(token, createdOrderUuid)
            .then((data) => {
                setOrderData(data.data);
                setAmount(data.data.amount);
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

        GetDiscount(token)
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

            return discount.services.some((dService) => {
                const selectedService = selectedServices.find((sel) => sel.uuid === dService.uuid);
                if (!selectedService) return false;

                const requiredQty = parseInt((discount.quantity ?? 0).toString());
                const selectedQty = parseInt(String(selectedService.quantity ?? "0"));
                return selectedQty >= requiredQty;
            });
        });

        setAppliedQuantityDiscounts(validQuantityDiscounts);
    }, [selectedServices, discounts, setAppliedQuantityDiscounts]);
    useEffect(() => {
        if (!selectedServices?.length || !services?.length) return;

        let newTotal = 0;

        selectedServices.forEach(sel => {
            const fullService = services.find(s => s.uuid === sel.uuid);
            if (!fullService) return;

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
    }, [selectedServices, services, appliedCodeDiscount, appliedQuantityDiscounts, setTotal]);
    const handleApplyDiscount = () => {
        const matched = discounts.find(
            (d) => d.type === "code" && d.code_key?.toLowerCase() === discountCode.toLowerCase()
        );

        if (!matched) {
            toast.error("Invalid discount code");
            return;
        }
        // if (appliedCodeDiscount?.uuid === matched?.uuid) {
        //     toast.error("This discount is already applied.");
        //     return;
        // }
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
            type: 'code' | 'quantity' | 'manual';
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

        return discountPayload;
    };

    const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const discounts = buildDiscountPayload();
        const servicesPayload = selectedServices
            .map(service => ({
                service_id: service.uuid as string,
                option_id: service.option_id ?? undefined,
                amount: service.price as number,
                custom: service.custom ?? undefined
            }));
        const slotsPayload = selectedSlots.map((slot) => ({
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
        }));
        console.log('slots payload', slotsPayload)
        console.log('discount', discounts)
        console.log('payload services', servicesPayload)
        try {
            const token = localStorage.getItem('token') || '';

            const payload: OrderPayload = {
                agent_id: selectedAgentId || "",
                property_id: selectedListingId || "",
                amount: total,
                order_status: "Processing",
                payment_status: "UNPAID",
                split_invoice: isSplitInvoice ? 1 : 0,
                co_agents: coAgents,
                notes: agentNotes.map((note) => ({
                    ...note,
                    date: new Date(note.date).toISOString().split("T")[0],
                })),
                services: servicesPayload,
                discounts: discounts,
                slots: slotsPayload
            };

            let response;

            if (userId) {
                const updatedPayload = { ...payload, _method: 'PUT' };
                response = await Edit(userId, updatedPayload, token);
            } else {
                response = await Create(payload, token);
            }

            // ✅ Check success flag before proceeding
            if (response?.success) {
                toast.success(userId ? 'Order updated successfully' : 'Order created successfully');
                setIsLoading(true);
                const uuid = response?.data?.uuid;
                if (uuid) {
                    setCreatedOrderUuid(uuid);
                    setIsSubmitted(true);
                }
            } else {
                setIsLoading(false);
                setIsSubmitted(false);
                toast.error("Something went wrong");
            }
        } catch (error) {
            setIsLoading(false);
            setIsSubmitted(false);
            console.log('Raw error:', error);

            setFieldErrors({});
            const apiError = error as { message?: string; errors?: Record<string, string[]> };

            if (apiError.errors && typeof apiError.errors === 'object') {
                const normalizedErrors: Record<string, string[]> = {};

                Object.entries(apiError.errors).forEach(([key, messages]) => {
                    const normalizedKey = key.split('.')[0];
                    if (!normalizedErrors[normalizedKey]) {
                        normalizedErrors[normalizedKey] = [];
                    }
                    normalizedErrors[normalizedKey].push(...messages);
                });

                setFieldErrors(normalizedErrors);

                // const firstError = Object.values(normalizedErrors).flat()[0];
                // toast.error(firstError || 'Validation error');
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit order data');
            }
        }
    };
    const totalServiceAmount = orderData?.services?.reduce((sum, s) => {
        return sum + parseFloat(s.amount || "0");
    }, 0) ?? 0;

    const totalDiscountValue = orderData?.totals?.reduce((sum, d) => {
        return sum + parseFloat(d.discount_value || "0");
    }, 0) ?? 0;

    const discountPercent = totalServiceAmount > 0
        ? ((totalDiscountValue / totalServiceAmount) * 100).toFixed(2)
        : "0.00";

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
    console.log('field Errors', fieldErrors)
    console.log('orderdata', orderData)
    console.log('agentnotes', agentNotes)
    return (
        <div className="w-full space-y-4">
            <div className="grid gap-4">
                <div className='w-full flex flex-col items-center'>
                    <div className='w-full md:w-[370px] pt-[60px] pb-[100px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                        {(isSubmitted && createdOrderUuid) ? (
                            <div className="w-full md:w-[450px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[48px] text-[#424242] text-[14px] font-[400]">
                                <div className='flex justify-between gap-[12px]'>
                                    <div className='flex gap-[12px] items-center'>
                                        <TriangleAlert className='text-[#4290E9] h-[24px]w-[30px]  md:h-[36px] md:w-[40px]' />
                                        <p className='text-[#4290E9] text-[24px] md:text-[36px] font-[400]'>{orderData?.id}</p>
                                    </div>
                                    <div className='flex items-center gap-[12px]'>
                                        <Switch className=' data-[state=checked]:bg-[#6BAE41] ' />
                                        <p className='text-[#666666] text-[16px]'>Open</p>
                                    </div>
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
                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>Package</span>
                                        <span className='col-span-1'>
                                            ${orderData?.services?.reduce((total, service) => total + parseFloat(service.amount), 0).toFixed(2)}
                                        </span>
                                    </p>

                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>Items</span>
                                        <span className='col-span-1'>{orderData?.services?.length}</span>
                                    </p>
                                    <div className="grid gap-[15px]">
                                        {orderData?.services?.map((service) => (
                                            <p key={service.id} className="grid grid-cols-4 gap-[15px]">
                                                <span className="col-span-3">{service.service?.name ?? ""}</span>
                                                <span className="col-span-1">${parseFloat(service.amount).toFixed(2)}</span>
                                            </p>
                                        ))}
                                    </div>
                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>Discount</span>
                                        <span className='col-span-1'>
                                            -${totalDiscountValue.toFixed(2)} ({discountPercent}%)
                                        </span>
                                    </p>
                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>GST/HST</span>
                                        <span className='col-span-1'>$0.00</span>
                                    </p>
                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>PST/RST/QST</span>
                                        <span className='col-span-1'>$0.00</span>
                                    </p>
                                    <p className='grid grid-cols-4 gap-[15px]'>
                                        <span className='col-span-3'>Subtotal</span>
                                        <span className='col-span-1'>${amount}</span>
                                    </p>
                                    <p className='grid grid-cols-4 gap-[15px] text-[20px] md:text-[24px] font-[500]'>
                                        <span className='col-span-3'>Grand Total</span>
                                        <span className='col-span-1'>${amount}</span>
                                    </p>
                                    <Button
                                        className="col-span-2 w-full rounded-[3px] md:w-full h-[32px] md:h-[32px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[14px] font-[600] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9] font-raleway"
                                    >
                                        Awaiting Payment  ${amount}
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
                                                slotInfo={slotInfo} // 👈 passed here
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
                                    </div>
                                    <div className='w-[32px] h-[32px] flex items-center justify-center mt-[30px] cursor-pointer' onClick={() => { handleApplyDiscount(); setDiscountCode(""); }}>
                                        <Plus className={`w-[24px] h-[24px] ${userType}-bg text-white rounded-sm `} />
                                    </div>
                                </div>
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
                                    <div className='flex items-center justify-between px-2'>
                                        <p className='font-normal text-[20px] text-[#424242]'>Total</p>
                                        <p className='font-normal text-[20px] text-[#424242]'>
                                            ${total.toFixed(2)}
                                        </p>

                                    </div>
                                </div>
                                <div className='col-span-2'>
                                    <button
                                        disabled={isLoading}
                                        type="button"
                                        onClick={handleSubmitOrder}
                                        className={`${userType}-bg font-raleway text-white rounded-[3px] hover-${userType}-bg w-full h-[30px] font-[600] text-[14px]`}
                                    >
                                        Submit Order
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