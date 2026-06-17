'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react';
import { GetOne } from '../orders';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Property from '@/app/dashboard/orders/components/Property';
import Services from '@/app/dashboard/orders/components/Services';
import Schedule from '@/app/dashboard/orders/components/Schedule';
import Contact from '@/app/dashboard/orders/components/Contact';
import Confirmation, { OrderConfirmationHandle } from '../components/Confirmation';
import { useOrderContext } from '../context/OrderContext';
import { useUnsaved } from '@/app/context/UnsavedContext';
import { Order, OrderService, Slot as OrderSlot } from '../page';
import { Get } from '../../agents/agents';
import { GetServices, GetPackages } from '../../services/services';
import { Services as ServiceType, Packages } from '../../services/page';
import { Agent } from '@/lib/types';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import OrderStepper from '../components/OrderStepper';
import { getEffectiveServiceDuration, splitSlotInto15MinChunks } from '../utils/serviceTimeUtils';
import { toast } from 'sonner';
import { fetchServicesForBookNow } from '@/app/agent/book-now/book-now';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBookNowOrg } from '@/app/agent/book-now/context/BookNowOrgContext';

const OrderForm = () => {
    const confirmationRef = useRef<OrderConfirmationHandle>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEdit = searchParams.get('isEdit') === 'true';
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
    // Read org slug from URL path ([org_slug] segment) OR from ?slug= query param
    const { orgSlug: ctxOrgSlug } = useBookNowOrg();
    const searchParamsSlug = searchParams.get('slug');
    const orgSlug = ctxOrgSlug || searchParamsSlug || null;

    const tabs = ["property", "services", "schedule", "contact", "order"];
    const steps = [
        { id: "property", label: "PROPERTY" },
        { id: "services", label: "SERVICES" },
        { id: "schedule", label: "SCHEDULE" },
        { id: "contact", label: "CONTACT" },
        { id: "order", label: "ORDER CONFIRMATION" },
    ];
    const [active, setActive] = useState("property");
    const [invalidServices, setInvalidServices] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<Order | null>(null);
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string)?.toLowerCase() || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

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
        selectedSlots,
        isSubmitted,
        setIsSubmitted,
        setAppliedCodeDiscount,
        setAppliedQuantityDiscounts,
        setInitComplete,
        isLoading,
        setServicesData,
        setAgentsData,
        setPackagesData,
        isPropertyValid,
        servicesData,
        tempPropertyData,
        selectedCurrentListing,
        setLastPopulatedAgentId,
        resetOrderData,
        isBookNowMode,
    } = useOrderContext();
    const { setIsDirty } = useUnsaved();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check token and listen to login events
    useEffect(() => {
        const checkAuth = () => {
            // Support both agentToken (book-now login) and token (dashboard login)
            const token = localStorage.getItem('agentToken') || localStorage.getItem('token');
            setIsAuthenticated(!!token);
        };
        
        checkAuth();
        window.addEventListener('agentLogin', checkAuth);
        return () => window.removeEventListener('agentLogin', checkAuth);
    }, []);

    // Refetch services when user authenticates in book-now mode
    useEffect(() => {
        if (isBookNowMode && isAuthenticated) {
            const token = localStorage.getItem('agentToken') || localStorage.getItem('token');
            if (token) {
                GetServices(token, orgSlug).then((res: { data: ServiceType[] }) => setServicesData(Array.isArray(res.data) ? res.data : []));
            }
        }
    }, [isAuthenticated, isBookNowMode, setServicesData, orgSlug]);

    useEffect(() => {
        const isTransfer = searchParams.get('transfer') === 'true';
        if (!userId && !isEdit && !isTransfer) {
            resetOrderData();
        }
    }, [userId, isEdit, searchParams, resetOrderData]);

    useEffect(() => {
        const warningTabs = ['schedule', 'contact', 'order'];
        if (warningTabs.includes(active) && !isSubmitted) {
            setIsDirty(true, {
                title: "Are you sure you want to leave?",
                description: "your changes will not be saved"
            });
        } else {
            setIsDirty(false);
        }

        return () => {
            setIsDirty(false);
        };
    }, [active, isSubmitted, setIsDirty]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [active]);

    useEffect(() => {
        const token = localStorage.getItem('agentToken') || localStorage.getItem('token');
        if (token) {
            // Fetch global data
            Promise.all([
                GetServices(token, orgSlug).then((res: { data: ServiceType[] }) => setServicesData(Array.isArray(res.data) ? res.data : [])),
                Get().then((res: { data: Agent[] }) => setAgentsData(Array.isArray(res.data) ? res.data : [])),
                GetPackages(token, orgSlug).then((res: { data: Packages[] }) => setPackagesData(Array.isArray(res.data) ? res.data : []))
            ]).catch(err => console.log("Error fetching global data:", err));
        } else if (isBookNowMode) {
            // Fetch public services for guests
            fetchServicesForBookNow(orgSlug)
                .then((res) => setServicesData(Array.isArray(res) ? res : []))
                .catch(err => console.log("Error fetching public services:", err));
        }
    }, [setServicesData, setAgentsData, setPackagesData, isBookNowMode, orgSlug]);
    const handleDoneClick = () => {
        if (isBookNowMode) {
            router.push('/agent/tours');
        } else {
            router.push('/dashboard/listings');
        }
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
                return (currentUser.services || []).map((s: OrderService) => ({
                    title: s.service.name,
                    uuid: s.service.uuid, // Service template UUID
                    service_uuid: s.uuid, // Order service UUID for updates
                    price: Number(s.amount),
                    quantity: s.option?.quantity ?? 1,
                    option_id: s.option?.uuid,
                    custom: s.custom,
                    optionName: s.option?.title ?? s.custom ?? '',
                    payment_status: s.payment_status,
                    is_completed: s.is_completed,
                }));
            });
            setCustomServiceNames(() => {
                const names: Record<string, string> = {};
                (currentUser.services || []).forEach((s: OrderService) => {
                    if (s.custom) {
                        names[s.service.uuid] = s.custom;
                    }
                });
                return names;
            });

            // Set customPrices
            setCustomPrices(() => {
                const prices: Record<string, string> = {};
                (currentUser.services || []).forEach((s: OrderService) => {
                    if (s.custom) {
                        prices[s.service.uuid] = s.amount;
                    }
                });
                return prices;
            });
            setSelectedOptions(() => {
                const options: Record<string, string> = {};
                currentUser.services.forEach((service: OrderService) => {
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
                (currentUser.slots || []).flatMap((slot: OrderSlot) => {
                    const matchedService = (currentUser.services || []).find(
                        (s: OrderService) => s.service?.id === slot.service_id
                    );

                    const chunks = splitSlotInto15MinChunks(slot.start_time, slot.end_time);

                    return chunks.map(chunk => ({
                        ...slot,
                        start_time: chunk.start_time,
                        end_time: chunk.end_time,
                        vendor_id: slot.vendor?.uuid || slot.vendor_id || "",
                        service_id: matchedService?.service?.uuid || String(slot.service_id),
                        show_all_vendors: Number(slot.show_all_vendors),
                        schedule_override: Number(slot.schedule_override),
                        recommend_time: Number(slot.recommend_time),
                        est_time: slot.est_time ? Number(slot.est_time) : null,
                        distance: slot.distance ? Number(slot.distance) : null,
                        km_price: slot.km_price ? Number(slot.km_price) : null,
                    }));
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
            setLastPopulatedAgentId(currentUser.agent?.uuid || "");
            setTimeout(() => {
                setInitComplete(true);
            }, 50);
        }
    }, [currentUser, setSelectedAgentId, setSelectedListingId, setSelectedServices, setAgentNotes, setCoAgents, setIsSplitInvoice, setSelectedSlots, setSelectedOptions, setInitComplete, setCustomServiceNames, setCustomPrices, setLastPopulatedAgentId]);
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

        if (active === 'schedule') {
            const newInvalidServices: string[] = [];
            let firstErrorToastShown = false;

            const servicesToSchedule = isEdit ? selectedServices : selectedServices.filter(s => !(s as any).service_uuid);

            for (const service of servicesToSchedule) {
                const serviceUuid = typeof service === 'string' ? service : service.uuid;
                if (!serviceUuid) continue;

                const globalService = servicesData?.find(s => s.uuid === serviceUuid);
                const productOption = globalService?.product_options?.find(opt => opt.uuid === service.option_id);

                const squareFootage = tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
                const requiredDuration = getEffectiveServiceDuration(
                    productOption?.service_duration,
                    squareFootage
                );

                const serviceSlots = selectedSlots.filter(s => s.service_id === serviceUuid);
                const currentDuration = serviceSlots.length * 15;

                if (currentDuration < requiredDuration) {
                    newInvalidServices.push(serviceUuid);
                    if (!firstErrorToastShown) {
                        const slotsNeeded = Math.ceil((requiredDuration - currentDuration) / 15);
                        toast.error(`Please add ${slotsNeeded} more slot(s) for "${service.title}". Required: ${requiredDuration} min, Selected: ${currentDuration} min`);
                        firstErrorToastShown = true;
                    }
                }
            }

            setInvalidServices(newInvalidServices);
            if (newInvalidServices.length > 0) return;
        }

        if (isValid() && nextIndex < tabs.length) {
            setActive(tabs[nextIndex]);
            setInvalidServices([]); // Clear errors on successful navigation
        }
    };

    const validateScheduleServices = () => {
        const servicesToSchedule = isEdit ? selectedServices : selectedServices.filter(s => !(s as any).service_uuid);
        const squareFootage = tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
        const invalidServiceIds: string[] = [];

        servicesToSchedule.forEach(service => {
            const serviceId = typeof service === 'string' ? service : service.uuid;
            if (!serviceId) return;

            const globalService = servicesData?.find(s => s.uuid === serviceId);
            const productOption = globalService?.product_options?.find(opt => opt.uuid === (service as any).option_id);
            const requiredDuration = getEffectiveServiceDuration(productOption?.service_duration, squareFootage);
            const serviceSlots = selectedSlots.filter(slot => slot.service_id === serviceId);
            const currentDuration = serviceSlots.length * 15;

            if (currentDuration < requiredDuration) {
                if (!invalidServiceIds.includes(serviceId)) {
                    invalidServiceIds.push(serviceId);
                }
            }
        });

        return invalidServiceIds;
    };

    const handleTabClick = (tabName: string) => {
        const currentIndex = tabs.indexOf(active);
        const targetIndex = tabs.indexOf(tabName);

        // Allow moving backward freely
        if (targetIndex < currentIndex) {
            setActive(tabName);
        }
        // For moving forward, validate current tab
        else if (targetIndex > currentIndex && isValid()) {
            setActive(tabName);
        }
        // If on same tab, allow click
        else if (targetIndex === currentIndex) {
            setActive(tabName);
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
        if (isBookNowMode && !isAuthenticated && active === 'services') {
            return false;
        }

        if (active === 'property' && isPropertyValid) {
            return true
        } else if (active === 'services' && selectedServices.length > 0) {
            if (!isEdit) {
                // Must have at least one new service selected (without service_uuid)
                return selectedServices.some(s => !(s as any).service_uuid);
            }
            return true
        } else if (active === 'schedule') {
            const servicesToSchedule = isEdit ? selectedServices : selectedServices.filter(s => !(s as any).service_uuid);
            if (servicesToSchedule.length === 0) return false;

            const invalidScheduleServices = validateScheduleServices();
            return invalidScheduleServices.length === 0;
        } else if (active === 'contact') {
            return true;
        } else if (active === 'order') {
            return true;
        }
        return false;
    };

    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;

        // Find the closest ancestor with overflow-x-hidden that might be blocking sticky
        // The layout has a div with "flex-1 overflow-x-hidden"
        let ancestor = header.parentElement;
        while (ancestor) {
            const style = window.getComputedStyle(ancestor);
            if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
                ancestor.style.setProperty('overflow-x', 'visible', 'important');
                ancestor.style.setProperty('overflow-y', 'visible', 'important'); // Ensure Y isn't affected negatively if needed, though usually x-hidden causes block
                // Actually, cleaning up 'overflow' shorthand might be safer, but specifically we want to kill the 'hidden' effect

                // We keep a reference to clean up
                const target = ancestor;
                return () => {
                    target.style.removeProperty('overflow-x');
                    target.style.removeProperty('overflow-y');
                };
            }
            ancestor = ancestor.parentElement;
        }
    }, []);

    const canNavigateTo = (tabName: string) => {
        const targetIndex = tabs.indexOf(tabName);
        const currentIndex = tabs.indexOf(active);

        // Can always go backward
        if (targetIndex <= currentIndex) return true;

        // Require authentication only when moving past 'services' (index 1)
        if (isBookNowMode && !isAuthenticated && targetIndex > 1) return false;

        // Check each tab up to the one before target
        for (let i = 0; i < targetIndex; i++) {
            const tabToCheck = tabs[i];

            // Property tab validation
            if (tabToCheck === 'property' && !isPropertyValid) return false;

            // Services tab validation
            if (tabToCheck === 'services' && selectedServices.length === 0) return false;

            // Schedule tab validation
            if (tabToCheck === 'schedule') {
                const invalidScheduleServices = validateScheduleServices();
                if (invalidScheduleServices.length > 0) return false;
            }
        }
        return true;
    };

    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;
    const fieldBg = `color-mix(in srgb, ${roleSettings.pageBg} 95%, black)`;
    const fieldBorder = `color-mix(in srgb, ${roleSettings.pageBg} 80%, black)`;

    return (
        // <OrderProvider>
        <div className='font-alexandria' style={{ backgroundColor: roleSettings.pageBg }}>
            <div ref={headerRef} className={`w-full h-[80px] font-alexandria sticky ${isBookNowMode ? 'top-[104px]' : 'top-0'} z-50 flex justify-between px-[20px] items-center border-b`} style={{ backgroundColor: headerBg, borderColor: fieldBorder, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className={`text-[16px] md:text-[24px] font-[400]`} style={{ color: roleSettings.pageTabColor }}> Orders
                    {currentUser ? ` › ${currentUser.id} ${`(${currentUser?.property?.address})`}` : ' › Add New Order'}</p>
                <div className='flex gap-2'>
                    {active !== "property" && !isSubmitted && (
                        <Button
                            onClick={handleBack}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] bg-white text-[14px] md:text-[16px] font-[400] flex gap-[5px] items-center transition-all`}
                            style={{ borderColor: roleSettings.pageTabColor, color: roleSettings.pageTabColor }}
                        >
                            Back
                        </Button>
                    )}

                    {active !== "order" ? (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex">
                                        <Button
                                            onClick={handleNext}
                                            disabled={!isValid()}
                                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-white flex gap-[5px] items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                            style={{
                                                backgroundColor: isValid() ? roleSettings.pageTabColor : '#BBBBBB',
                                                borderColor: isValid() ? roleSettings.pageTabColor : '#BBBBBB'
                                            }}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {(isBookNowMode && !isAuthenticated && active === 'services') && (
                                    <TooltipContent side="bottom">
                                        <p>Please login or signup first to continue.</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    ) : isSubmitted ? (
                        <Button
                            onClick={handleDoneClick}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-white text-[14px] md:text-[16px] font-[400] flex gap-[5px] items-center transition-all`}
                            style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                        >
                            Done
                        </Button>
                    ) : (
                        <Button
                            disabled={isLoading}
                            onClick={async (e) => {
                                await confirmationRef.current?.handleSubmitOrder(e);
                                setIsSubmitted(true);
                            }}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-white flex gap-[5px] items-center justify-center transition-all`}
                            style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                        >
                            {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : "Submit"}
                        </Button>
                    )}
                </div>


            </div>
            <div className={`sticky ${isBookNowMode ? 'top-[184px]' : 'top-[80px]'} z-40 flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] h-[80px] text-[18px] font-[600] shadow-sm`} style={{ backgroundColor: fieldBg, borderColor: fieldBorder }} >
                <OrderStepper
                    currentTab={active}
                    onTabChange={handleTabClick}
                    steps={steps}
                    canNavigateTo={canNavigateTo}
                    userType={userType}
                />
            </div>

            <div>
                {active === "property" && (
                    <div>
                        <Property onSetActiveTab={setActive} />
                    </div>
                )}
                {active === "services" && (
                    <div>
                        <Services showAll={false} />
                    </div>
                )}
                {active === "schedule" && (
                    <div>
                        <Schedule invalidServices={invalidServices} />
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