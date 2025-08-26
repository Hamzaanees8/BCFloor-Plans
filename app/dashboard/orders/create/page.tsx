'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GetOne } from '../orders';
import { useParams, useRouter } from 'next/navigation';
import Property from '@/app/dashboard/orders/components/Property';
import Services from '@/app/dashboard/orders/components/Services';
import Schedule from '@/app/dashboard/orders/components/Schedule';
import Contact from '@/app/dashboard/orders/components/Contact';
import Confirmation, { OrderConfirmationHandle } from '@/app/dashboard/orders/components/Confirmation';
import { useOrderContext } from '../context/OrderContext';
import { Order } from '../page';
import { useAppContext } from '@/app/context/AppContext';
const OrderForm = () => {
    const confirmationRef = useRef<OrderConfirmationHandle>(null);
    const router = useRouter();
    // type CurrentUser = {
    //     uuid: string;
    //     first_name?: string;
    //     last_name?: string;
    //     role_id: number;
    //     primary_email?: string;
    //     secondary_email?: string;
    //     notification_email: boolean;
    //     email_type?: string;
    //     primary_phone?: string;
    //     secondary_phone?: string;
    //     agent: { uuid: string, first_name: string, last_name: string, email: string, created_at: string },
    //     company_name?: string;
    //     website?: string;
    //     avatar: string | null;
    //     company_logo: string | null;
    //     company_banner: string | null;
    //     address?: string;
    //     city?: string;
    //     province?: string;
    //     country?: string;
    //     permissions?: number[];
    //     avatar_url?: string;
    //     company_logo_url?: string;
    //     company_banner_url?: string;
    //     // add other fields as needed
    // };
    const params = useParams();
    const userId = params?.id as string;

    const tabs = ["property", "services", "schedule", "contact", "order"];
    const [active, setActive] = useState("property");
    const [currentUser, setCurrentUser] = useState<Order | null>(null);
    const { userType } = useAppContext()
    const {
        selectedServices,
        setSelectedAgentId,
        setSelectedListingId,
        setSelectedServices,
        setAgentNotes,
        setCoAgents,
        setIsSplitInvoice,
        setSelectedSlots,
        setSelectedOptions,
        setDiscountCode,
        setCustomPrices,
        setCustomServiceNames,
        selectedAgentId,
        selectedListingId,
        selectedSlots,
        isSubmitted,
        setIsSubmitted,
        setAppliedCodeDiscount,
        setAppliedQuantityDiscounts,
        setInitComplete,
        //isLoading
    } = useOrderContext();
    const handleDoneClick = () => {
        router.push('/dashboard/orders');
        setSelectedAgentId(null);
        setSelectedListingId(null);
        setDiscountCode("");
        setSelectedServices([]);
        setSelectedOptions({});
        setCustomPrices({});
        setCustomServiceNames({});
        setAgentNotes([]);
        setCoAgents([]);
        setAppliedCodeDiscount(null);
        setAppliedQuantityDiscounts([]);
        setIsSplitInvoice(false);
        setSelectedSlots([]);
        setCustomPrices({});
        setCustomServiceNames({});
        setSelectedOptions({});
    };
    useEffect(() => {
        if (currentUser && currentUser.slots && currentUser.slots.length > 0) {
            setSelectedAgentId(currentUser.agent?.uuid || "");
            setSelectedListingId(currentUser.property?.uuid || "");
            setSelectedServices(() => {
                return (currentUser.services || []).map((s) => ({
                    title: s.service.name,
                    uuid: s.service.uuid,
                    price: Number(s.amount),
                    quantity: s.option?.quantity ?? 1,
                    option_id: s.option?.uuid,
                    custom: s.custom,
                    optionName: s.option?.title ?? s.custom ?? '',
                }));
            });
            setCustomServiceNames(() => {
                const names: Record<string, string> = {};
                (currentUser.services || []).forEach(s => {
                    if (s.custom) {
                        names[s.service.uuid] = s.custom;
                    }
                });
                return names;
            });

            // Set customPrices
            setCustomPrices(() => {
                const prices: Record<string, string> = {};
                (currentUser.services || []).forEach(s => {
                    if (s.custom) {
                        prices[s.service.uuid] = s.amount;
                    }
                });
                return prices;
            });
            setSelectedOptions(() => {
                const options: Record<string, string> = {};
                currentUser.services.forEach(service => {
                    if (service.option?.title) {
                        options[service.service.uuid] = service.option.title;
                    } else if (service.custom) {
                        options[service.service.uuid] = "custom";
                    } else {
                        options[service.service.uuid] = "";
                    }
                });
                return options;
            });
            setSelectedSlots(
                (currentUser.slots || []).map((slot) => {
                    const matchedService = (currentUser.services || []).find(
                        (s) => s.service?.id === slot.service_id
                    );

                    return {
                        ...slot,
                        vendor_id: slot.vendor?.uuid || "",
                        service_id: matchedService?.service?.uuid || "", // Get UUID from service object
                        show_all_vendors: Number(slot.show_all_vendors),
                        schedule_override: Number(slot.schedule_override),
                        recommend_time: Number(slot.recommend_time),
                        est_time: slot.est_time ? Number(slot.est_time) : null,
                        distance: slot.distance ? Number(slot.distance) : null,
                        km_price: slot.km_price ? Number(slot.km_price) : null,
                    };
                })
            );

            setAgentNotes(() => {
                if (typeof currentUser.notes === "string") {
                    try {
                        const parsed = JSON.parse(currentUser.notes);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                }
                return Array.isArray(currentUser.notes) ? currentUser.notes : [];
            });
            setCoAgents(() => {
                if (typeof currentUser.co_agents === "string") {
                    try {
                        const parsed = JSON.parse(currentUser.co_agents);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                }
                return Array.isArray(currentUser.co_agents) ? currentUser.co_agents : [];
            });
            setIsSplitInvoice(currentUser.split_invoice || false);
            setTimeout(() => {
                setInitComplete(true);
            }, 50);
        }
    }, [currentUser, setSelectedAgentId, setSelectedListingId, setSelectedServices, setAgentNotes, setCoAgents, setIsSplitInvoice, setSelectedSlots, setSelectedOptions, setInitComplete, setCustomServiceNames, setCustomPrices]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (userId) {
            GetOne(token, userId)
                .then(data => setCurrentUser(data.data))
                .catch(err => console.log(err.message));
        } else {
            console.log('User ID is undefined.');
        }
    }, [userId]);

    const handleNext = () => {
        const currentIndex = tabs.indexOf(active);
        const nextIndex = currentIndex + 1;
        if (isValid() && nextIndex < tabs.length) {
            setActive(tabs[nextIndex]);
        }
    };

    const handleBack = () => {
        const currentIndex = tabs.indexOf(active);
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            setActive(tabs[prevIndex]);
        }
    };
    const isValid = () => {
        if (active === 'property' && selectedAgentId && selectedListingId) {
            return true
        } else if (active === 'services' && selectedServices.length > 0) {
            return true
        } else if (active === 'schedule') {
            const selectedServiceIds = selectedServices
                .map(s => typeof s === 'string' ? s : s.uuid)
                .filter((id): id is string => typeof id === 'string');
            const scheduledServiceIds = selectedSlots.map(slot => slot.service_id);

            const allScheduled = selectedServiceIds.every(serviceId =>
                scheduledServiceIds.includes(serviceId)
            );

            return allScheduled;
        } else if (active === 'contact') {
            return true;
        } else if (active === 'order') {
            return true;
        }
        return false;
    };

    console.log('active', active);
    console.log('currentUser', currentUser);
    console.log('selectedSlots from edit', selectedSlots);
    return (
        // <OrderProvider>
        <div className='font-alexandria'>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}> Orders
                    {currentUser ? ` › ${currentUser.id} ${`(${currentUser?.property?.address})`}` : ' › Add New Order'}</p>
                <div className='flex gap-2'>
                    {active !== "property" && !isSubmitted && (
                        <Button
                            onClick={handleBack}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border bg-white ${userType}-button ${userType}-text hover-${userType}-bg text-[14px] md:text-[16px] font-[400] flex gap-[5px] items-center`}
                        >
                            Back
                        </Button>
                    )}

                    {active !== "order" ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isValid()}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-white hover-${userType}-bg`}
                        >
                            Next
                        </Button>
                    ) : isSubmitted ? (
                        <Button
                            onClick={handleDoneClick}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-white text-[14px] md:text-[16px] font-[400] flex gap-[5px] items-center hover:bg-[#4290E9]`}
                        >
                            Done
                        </Button>
                    ) : (
                        <Button
                            //disabled={isLoading}
                            onClick={async (e) => {
                                await confirmationRef.current?.handleSubmitOrder(e);
                                setIsSubmitted(true);
                            }}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-white flex gap-[5px] items-center hover:bg-[#4290E9]`}
                        >
                            Submit
                        </Button>
                    )}
                </div>


            </div>
            <div className='flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600]' >
                <div className="flex gap-2">
                    <button
                        //onClick={() => setActive("property")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
          ${active === "property" ? `${userType}-bg text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                    >
                        PROPERTY
                    </button>
                    <button
                        //onClick={() => setActive("services")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                ${active === "services" ? `${userType}-bg text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                    >
                        SERVICES
                    </button>
                    <button
                        //onClick={() => setActive("schedule")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
          ${active === "schedule" ? `${userType}-bg text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                    >
                        SCHEDULE
                    </button>
                    <button
                        //onClick={() => setActive("contact")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
          ${active === "contact" ? `${userType}-bg text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                    >
                        CONTACT
                    </button>
                    <button
                        //onClick={() => setActive("order")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[230px] h-[35px]
          ${active === "order" ? `${userType}-bg text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                    >
                        ORDER CONFIRMATION
                    </button>
                </div>

            </div>

            <div>
                {active === "property" && (
                    <div>
                        <Property />
                    </div>
                )}
                {active === "services" && (
                    <div>
                        <Services />
                    </div>
                )}
                {active === "schedule" && (
                    <div>
                        <Schedule />
                    </div>
                )}
                {active === "contact" && (
                    <div>
                        <Contact />
                    </div>
                )}
                {active === "order" && (
                    <div>
                        <Confirmation ref={confirmationRef} />
                    </div>
                )}
            </div>
        </div >
        // </OrderProvider>

    )
}

export default OrderForm