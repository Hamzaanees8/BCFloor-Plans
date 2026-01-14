"use client";
import Header from '@/components/Header'
import { Button } from '@/components/ui/button';
import React, { useState } from 'react'
import Property from './components/property';
import Services from '@/app/dashboard/orders/components/Services';
import Schedule from '@/app/dashboard/orders/components/Schedule';
import Contact from '@/app/dashboard/orders/components/Contact';
import Confirmation from '@/app/dashboard/orders/components/Confirmation';

function Page() {
    const tabs = ["services", "property", "schedule", "contact", "order"];
    const [active, setActive] = useState("services");
    const agentSession = localStorage.getItem('agentSession')
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
        if (active === 'services') {
            return true
        } else if (active === 'property') {
            return true
        } else if (active === 'schedule') {
            return true;
        } else if (active === 'contact') {
            return true;
        } else if (active === 'order') {
            return true;
        }
        return false;
    };
    return (
        <div>
            <div>
                <Header />
            </div>
            <div className='font-alexandria mt-[100px]'>

                <div className='flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600]' >
                    <div className="flex gap-2">
                        <button
                            //onClick={() => setActive("services")}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                                     ${active === "services" ? `bg-[#4290E9] text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                        >
                            SERVICES
                        </button>
                        <button
                            //onClick={() => setActive("property")}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                             ${active === "property" ? `bg-[#4290E9] text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                        >
                            PROPERTY
                        </button>
                        <button
                            //onClick={() => setActive("schedule")}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                             ${active === "schedule" ? `bg-[#4290E9] text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                        >
                            SCHEDULE
                        </button>
                        <button
                            //onClick={() => setActive("contact")}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                             ${active === "contact" ? `bg-[#4290E9] text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                        >
                            CONTACT
                        </button>
                        <button
                            //onClick={() => setActive("order")}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[230px] h-[35px]
                             ${active === "order" ? `bg-[#4290E9] text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                        >
                            ORDER CONFIRMATION
                        </button>
                    </div>

                </div>
                {active === 'property' &&
                    <div className='flex justify-center mt-[40px]'>
                        <div className="flex items-start justify-between w-[60%]">
                            {/* <button className="bg-[#4290E9] hover:bg-[#4290E9] text-white font-medium px-4 py-2 rounded-md">
                                Realtor Sign In
                            </button> */}

                            <div className="text-sm text-[#666666] leading-tight">
                                <p className="font-[700] text-[12px]">MEMBER SIGN IN</p>
                                <p className="text-[#666666]">
                                    Sign in now to manage your orders, marketing materials, property listings and other content.
                                </p>
                            </div>
                        </div>

                    </div>
                }
                <div className='flex justify-center'>
                    <div className='flex justify-end gap-2 py-[40px] w-[60%]'>
                        {active !== "services" && (
                            <Button
                                onClick={handleBack}
                                className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-white  text-[#4290E9] hover:bg-[#4290E9] hover:text-white text-[14px] md:text-[16px] font-[400] flex gap-[5px] items-center`}
                            >
                                Back
                            </Button>
                        )}

                        {active !== "order" && (
                            <Button
                                onClick={handleNext}
                                className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] ${agentSession ? 'bg-[#4290E9]' : 'bg-[#8E8E8E]'} bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-white hover:bg-[#4290E9]`}
                            >
                                Next
                            </Button>
                        )
                        }
                    </div>
                </div>

                <div className='px-10'>
                    {active === "services" && (
                        <div>
                            <Services showAll={true} />
                        </div>
                    )}
                    {active === "property" && (
                        <div>
                            <Property />
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
                            <Confirmation />
                        </div>
                    )}
                </div>
            </div >
        </div>
    )
}

export default Page