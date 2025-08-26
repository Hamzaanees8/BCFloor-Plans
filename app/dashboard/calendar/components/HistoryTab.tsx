import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import React from 'react'
import { Order } from '../../orders/page'
import { Services } from '../../services/page';
interface HistoryProps {
    currentOrder: Order | undefined
    servicesData: Services[]
}
function HistoryTab({ currentOrder, servicesData }: HistoryProps) {
    console.log(currentOrder, servicesData);

    return (
        <div>
            <h1 className='mb-[10px]'>History</h1>
            <div className='h-[42px] w-full grid grid-cols-4 text-[14px] text-[#424242] border border-[#BBBBBB] rounded-[6px] items-center px-[10px]'>
                <p>Subject</p>
                <p>Created By</p>
                <p>Time</p>
                <p>Date</p>
            </div>

            {/* --- 1. Latest - 4 updated, 3 old --- */}
            <Accordion type="single" collapsible className="w-full border border-[#BBBBBB] rounded-[6px] my-[20px]">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="p-0 px-[10px] hover:no-underline">
                        <div className="h-[42px] w-full grid grid-cols-4 text-[14px] text-[#424242] text-left items-center">
                            <p>Order Updated</p>
                            <p className='pl-[5px]'>Musawar Ahmed</p>
                            <p className='pl-[5px]'>11:10 PM</p>
                            <p className='pl-[10px]'>08/05/25</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        {/* Updated Section */}
                        <div className="px-4 bg-gray-50 text-sm text-gray-700">
                            <h1>Updated</h1>
                            <div className='grid grid-cols-6 my-4 px-4'>
                                <h1 className='col-span-4'>Service</h1>
                                <h1 className='col-span-2'>Option</h1>
                            </div>
                            {[
                                ["2D Floor Plans", "2D Floor Plan 1001 - 1650"],
                                ["HDR Still Photo with Drone", "20 Photos + 8 Drone"],
                                ["HDR Still Photos", "20 Photos"],
                                ["3D Tour", "1 Tour"]
                            ].map(([service, option], i) => (
                                <div key={i} className="mb-3 grid grid-cols-6 gap-x-3 px-4">
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE] rounded-[6px] col-span-4 h-[42px] px-[10px] flex items-center'>{service}</p>
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE] rounded-[6px] col-span-2 h-[42px] px-[10px] flex items-center'>{option}</p>
                                </div>
                            ))}

                            <h1 className='mt-4'>Old Version</h1>
                            <div className='grid grid-cols-6 my-4 px-4'>
                                <h1 className='col-span-4'>Service</h1>
                                <h1 className='col-span-2'>Option</h1>
                            </div>
                            {[
                                ["HDR Still Photo with Drone", "20 Photos + 8 Drone"],
                                ["HDR Still Photos", "20 Photos"],
                                ["3D Tour", "1 Tour"]
                            ].map(([service, option], i) => (
                                <div key={`old1-${i}`} className="mb-3 grid grid-cols-6 gap-x-3 px-4">
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE]  rounded-[6px] col-span-4 h-[42px] px-[10px] flex items-center'>{service}</p>
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE]  rounded-[6px] col-span-2 h-[42px] px-[10px] flex items-center'>{option}</p>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* --- 2. 3 updated, 2 old --- */}
            <Accordion type="single" collapsible className="w-full border border-[#BBBBBB] rounded-[6px] my-[20px]">
                <AccordionItem value="item-2">
                    <AccordionTrigger className="p-0 px-[10px] hover:no-underline">
                        <div className="h-[42px] w-full grid grid-cols-4 text-[14px] text-[#424242] text-left items-center">
                            <p>Order Updated</p>
                            <p className='pl-[5px]'>Musawar Ahmed</p>
                            <p className='pl-[5px]'>08:50 PM</p>
                            <p className='pl-[10px]'>08/05/25</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="px-4 bg-gray-50 text-sm text-gray-700">
                            <h1>Updated</h1>
                            <div className='grid grid-cols-6 my-4 px-4'>
                                <h1 className='col-span-4'>Service</h1>
                                <h1 className='col-span-2'>Option</h1>
                            </div>
                            {[
                                ["2D Floor Plans", "2D Floor Plan 1001 - 1650"],
                                ["HDR Still Photos", "20 Photos"],
                                ["3D Tour", "1 Tour"]
                            ].map(([service, option], i) => (
                                <div key={i} className="mb-3 grid grid-cols-6 gap-x-3 px-4">
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE] rounded-[6px] col-span-4 h-[42px] px-[10px] flex items-center'>{service}</p>
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE] rounded-[6px] col-span-2 h-[42px] px-[10px] flex items-center'>{option}</p>
                                </div>
                            ))}

                            <h1 className='mt-4'>Old Version</h1>
                            <div className='grid grid-cols-6 my-4 px-4'>
                                <h1 className='col-span-4'>Service</h1>
                                <h1 className='col-span-2'>Option</h1>
                            </div>
                            {[
                                ["HDR Still Photos", "20 Photos"],
                                ["3D Tour", "1 Tour"]
                            ].map(([service, option], i) => (
                                <div key={`old2-${i}`} className="mb-3 grid grid-cols-6 gap-x-3 px-4">
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE]  rounded-[6px] col-span-4 h-[42px] px-[10px] flex items-center'>{service}</p>
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE]  rounded-[6px] col-span-2 h-[42px] px-[10px] flex items-center'>{option}</p>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* --- 3. 2 updated, 1 old --- */}
            <Accordion type="single" collapsible className="w-full border border-[#BBBBBB] rounded-[6px] my-[20px]">
                <AccordionItem value="item-3">
                    <AccordionTrigger className="p-0 px-[10px] hover:no-underline">
                        <div className="h-[42px] w-full grid grid-cols-4 text-[14px] text-[#424242] text-left items-center">
                            <p>Order Updated</p>
                            <p className='pl-[5px]'>Musawar Ahmed</p>
                            <p className='pl-[5px]'>06:25 PM</p>
                            <p className='pl-[10px]'>08/05/25</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="px-4 bg-gray-50 text-sm text-gray-700">
                            <h1>Updated</h1>
                            <div className='grid grid-cols-6 my-4 px-4'>
                                <h1 className='col-span-4'>Service</h1>
                                <h1 className='col-span-2'>Option</h1>
                            </div>
                            {[
                                ["HDR Still Photo with Drone", "20 Photos + 8 Drone"],
                                ["HDR Still Photos", "20 Photos"]
                            ].map(([service, option], i) => (
                                <div key={i} className="mb-3 grid grid-cols-6 gap-x-3 px-4">
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE] rounded-[6px] col-span-4 h-[42px] px-[10px] flex items-center'>{service}</p>
                                    <p className='border border-[#BBBBBB] bg-[#EEEEEE] rounded-[6px] col-span-2 h-[42px] px-[10px] flex items-center'>{option}</p>
                                </div>
                            ))}

                            <h1 className='mt-4'>Old Version</h1>
                            <div className='grid grid-cols-6 my-4 px-4'>
                                <h1 className='col-span-4'>Service</h1>
                                <h1 className='col-span-2'>Option</h1>
                            </div>
                            <div className="mb-3 grid grid-cols-6 gap-x-3 px-4">
                                <p className='border border-[#BBBBBB] bg-[#EEEEEE]  rounded-[6px] col-span-4 h-[42px] px-[10px] flex items-center'>HDR Still Photos</p>
                                <p className='border border-[#BBBBBB] bg-[#EEEEEE]  rounded-[6px] col-span-2 h-[42px] px-[10px] flex items-center'>20 Photos</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* --- 4. Oldest - only updated --- */}
            <Accordion type="single" collapsible className="w-full border border-[#BBBBBB] rounded-[6px] my-[20px]">
                <AccordionItem value="item-4">
                    <AccordionTrigger className="p-0 px-[10px] hover:no-underline">
                        <div className="h-[42px] w-full grid grid-cols-4 text-[14px] text-[#424242] text-left items-center">
                            <p>Order Created</p>
                            <p className='pl-[5px]'>Musawar Ahmed</p>
                            <p className='pl-[5px]'>05:10 PM</p>
                            <p className='pl-[10px]'>08/05/25</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>

                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

export default HistoryTab
