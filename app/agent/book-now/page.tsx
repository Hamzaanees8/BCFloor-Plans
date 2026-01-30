"use client";

import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import React, { useRef, useState } from 'react'
import Property from './components/property'
import BookNowServices from './components/Services'
import Schedule from './components/Schedule'
import Contact from './components/Contact'
import Confirmation from './components/Confirmation'
import { BookNowProvider, useBookNowContext } from './context/BookNowContext'
import type { BookNowConfirmationHandle } from './components/Confirmation'
import { getEffectiveServiceDuration } from '@/app/dashboard/orders/utils/serviceTimeUtils'
import { toast } from 'sonner'

function BookNowPageContent() {
    const { tempPropertyData, selectedServices, selectedSlots, servicesData } = useBookNowContext();
    const tabs = ["property", "services", "schedule", "contact", "confirmation"];
    const [active, setActive] = useState("property");
    const [invalidServices, setInvalidServices] = useState<string[]>([]);
    const [hasAgentToken, setHasAgentToken] = useState(false);
    const confirmationRef = useRef<BookNowConfirmationHandle>(null);

    React.useEffect(() => {

        const checkToken = () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('agentToken');
                setHasAgentToken(!!token);
                return token;
            }
            return null;
        };

        const handleStorageChange = () => {
            checkToken();
        };

        const handleLoginEvent = () => {
            checkToken();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('agentLogin', handleLoginEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('agentLogin', handleLoginEvent);
        };
    }, []);


    const handleNext = () => {
        if (!isValid()) return;

        if (active === 'schedule') {
            const newInvalidServices: string[] = [];
            let firstErrorToastShown = false;

            for (const service of selectedServices) {
                const serviceUuid = service.uuid;
                if (!serviceUuid) continue;

                const globalService = servicesData?.find(s => s.uuid === serviceUuid);
                const productOption = globalService?.product_options?.find(opt => opt.uuid === service.option_id);

                const squareFootage = tempPropertyData?.square_footage;
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
                } else if (currentDuration > requiredDuration) {
                    newInvalidServices.push(serviceUuid);
                    if (!firstErrorToastShown) {
                        const extraSlots = Math.ceil((currentDuration - requiredDuration) / 15);
                        toast.error(`Please remove ${extraSlots} slot(s) for "${service.title}". Required: ${requiredDuration} min, Selected: ${currentDuration} min`);
                        firstErrorToastShown = true;
                    }
                }
            }

            setInvalidServices(newInvalidServices);
            if (newInvalidServices.length > 0) return;
        }

        const currentIndex = tabs.indexOf(active);
        const nextIndex = currentIndex + 1;
        if (nextIndex < tabs.length) {
            setActive(tabs[nextIndex]);
            setInvalidServices([]); // Clear errors on success
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
        // Validate based on current tab
        if (active === "property") {
            // Property tab requires address
            return !!(tempPropertyData?.address && tempPropertyData.address.trim() !== "");
        } else if (active === "services") {
            // Services tab requires at least one service selected
            return selectedServices && selectedServices.length > 0;
        } else if (active === "schedule") {
            // Schedule tab requires slots selected
            return selectedSlots && selectedSlots.length > 0;
        } else if (active === "contact") {
            // Contact tab requires user to be logged in
            return hasAgentToken;
        }
        // Confirmation can be empty
        return true;
    };

    const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (confirmationRef.current) {
            await confirmationRef.current.handleSubmitOrder(e);
        }
    };

    return (
        <div className='font-alexandria'>
            {/* Tab Navigation */}
            <div className='flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600]'>
                <div className="flex gap-2 flex-wrap justify-center">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[140px] h-[35px] transition-all ${active === tab
                                ? 'bg-[#4290E9] text-white'
                                : 'bg-[#E4E4E4] text-[#666666]'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className='flex justify-center'>
                <div className='flex justify-between gap-2 py-[40px] w-[90%] lg:w-[80%]'>
                    {active !== "property" && (
                        <Button
                            onClick={handleBack}
                            className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-white text-[#4290E9] hover:bg-[#4290E9] hover:text-white text-[14px] md:text-[16px] font-[400]'
                        >
                            Back
                        </Button>
                    )}

                    <div className='flex-1' />

                    {active !== "confirmation" && (
                        <Button
                            onClick={handleNext}
                            disabled={!isValid()}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] transition-all ${isValid()
                                ? 'border-[#4290E9] bg-[#4290E9] text-white hover:bg-[#3077C0] cursor-pointer'
                                : 'border-[#BBBBBB] bg-[#EEEEEE] text-[#999999] cursor-not-allowed'
                                }`}
                        >
                            Next
                        </Button>
                    )}

                    {active === "confirmation" && (
                        <Button
                            onClick={handleSubmitOrder}
                            className='w-[140px] md:w-[180px] h-[35px] md:h-[44px] bg-[#4290E9] text-white hover:bg-[#3077C0] text-[14px] md:text-[16px] font-[600]'
                        >
                            Submit Order
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className='px-4 md:px-10 py-8'>
                {active === "property" && <Property />}
                {active === "services" && <BookNowServices showAll={true} />}
                {active === "schedule" && <Schedule invalidServices={invalidServices} />}
                {active === "contact" && <Contact />}
                {active === "confirmation" && <Confirmation ref={confirmationRef} />}
            </div>
        </div>
    );
}

function BookNowPage() {
    return (
        <BookNowProvider>
            <div>
                <div>
                    <Header />
                </div>
                <div className='font-alexandria mt-[100px]'>
                    <BookNowPageContent />
                </div>
            </div>
        </BookNowProvider>
    );
}

export default BookNowPage;