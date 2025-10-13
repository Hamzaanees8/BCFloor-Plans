"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash } from "lucide-react";
import { Order } from "../../orders/page";
import {  GetServices } from "../../orders/orders";
import { Services } from "../../services/page";
import { useOrderContext } from "../../orders/context/OrderContext";
import { useAppContext } from "@/app/context/AppContext";
import Schedule from "../../calendar/components/Schedule";
import { Button } from "@/components/ui/button";

interface AppointmentTab {
    currentOrder?: Order;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
export interface CoAgent {
    name: string;
    email?: string;
    contact?: string;
}

function VendorOrderEdit({
    currentOrder,
    open,
    onOpenChange,
}: AppointmentTab) {
    const { userType } = useAppContext();
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [servicesPayload, setServicesPayload] = useState<
        { service_id: number; option_id: string | null; amount: string | number }[]
    >([]);
    const { setCalendarServices, calendarServices } = useOrderContext();

    console.log('servicesPayload', servicesPayload);

    useEffect(() => {
        setCalendarServices(calendarServices);
    });
    useEffect(() => {
        if (currentOrder?.services?.length) {
            const initialPayload = currentOrder.services.map((service) => ({
                service_id: service.service.id,
                option_id: service.option?.uuid ?? null,
                amount: service.amount,
            }));
            setServicesPayload(initialPayload);
        }
    }, [currentOrder]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }

        GetServices(token)
            .then((data) => {
                setServicesData(data.data);
            })
            .catch((err) => console.log(err.message));
    }, []);

    console.log('servicesData', servicesData);
    const handleSubmitServices = async () => {
        // try {
        //     const token = localStorage.getItem("token") || "";
        //     const payload = {
        //         services: servicesPayload,
        //         _method: 'PUT'
        //     };

        //     const response = await Edit(currentOrder?.uuid ?? "", payload, token);

        //     if (response?.success) {
        //         toast.success("Services updated successfully");
        //     } else {
        //         toast.error("Something went wrong");
        //     }
        // } catch (err) {
        //     toast.error("Failed to submit services data");
        //     console.error(err);
        // }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[730px] max-w-[70%] max-h-[90vh] overflow-y-auto font-alexandria">
                <DialogHeader>
                    <DialogTitle className={`${userType}-text text-xl font-semibold`}>

                    </DialogTitle>
                </DialogHeader>

                <Accordion
                    type="multiple"
                    defaultValue={["property", "additional", "statistics", "Notes"]}
                    className="w-full space-y-4"
                >
                    <AccordionItem value="statistics">
                        <AccordionTrigger
                            className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                        >
                            Order Details
                        </AccordionTrigger>
                        <AccordionContent className="grid gap-4">
                            <div className="w-full flex flex-col items-center mt-[17px]">

                                {currentOrder?.services.map((service, idx) => {
                                    console.log('service', service);

                                    return <div
                                        key={idx}
                                        className="grid grid-cols-4 gap-x-4 mt-[10px] w-full"
                                    >
                                        <div className="col-span-2">
                                            <label htmlFor="">Service</label>
                                            <Input
                                                readOnly
                                                value={service.service.name}
                                                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-[14px] text-[#424242]" htmlFor="serviceOption">
                                                Service Options
                                            </Label>
                                            {(() => {
                                                const foundService = servicesData?.find((s) => s.id === service.service.id);
                                                const options = foundService?.product_options ?? [service?.option ?? []];

                                                return (
                                                    <Select
                                                        value={servicesPayload[idx]?.option_id ?? ''}
                                                        onValueChange={(val) => {
                                                            const foundService = servicesData?.find((s) => s.id === service.service.id);
                                                            const selectedOption = foundService?.product_options?.find(
                                                                (opt) => opt.uuid === val
                                                            );
                                                            const newPrice = selectedOption?.amount ?? '';

                                                            setServicesPayload((prev) =>
                                                                prev.map((srv, i) =>
                                                                    i === idx
                                                                        ? {
                                                                            ...srv,
                                                                            option_id: val,
                                                                            amount: newPrice,
                                                                        }
                                                                        : srv
                                                                )
                                                            );
                                                        }}
                                                    >

                                                        <SelectTrigger
                                                            id="serviceOption"
                                                            className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                                        >
                                                            <SelectValue placeholder="Select Option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {options.map((opt) => (
                                                                <SelectItem key={opt.uuid} value={opt.uuid ?? ''}>
                                                                    {opt.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                );
                                            })()}
                                        </div>

                                        <div className="col-span-1 flex justify-between gap-[16px]">
                                            <div>
                                                <Label
                                                    className="text-[14px] text-[#424242] "
                                                    htmlFor=""
                                                >
                                                    Price
                                                </Label>
                                                <Input
                                                    readOnly
                                                    value={servicesPayload[idx]?.amount ?? ''}
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                                    type="text"
                                                />
                                            </div>

                                        </div>
                                    </div>
                                })}

                                <div className="w-full">
                                    {calendarServices?.map((item, index) => {
                                        const selectedService = servicesData.find(
                                            (s) => s.id === item.serviceId
                                        );
                                        return (
                                            <div
                                                key={`new-${index}`}
                                                className="grid grid-cols-4 gap-x-4 mt-[10px]"
                                            >
                                                <div className="col-span-2">
                                                    <label>Service</label>
                                                    <Select
                                                        value={item.serviceId.toString()}
                                                        onValueChange={(val) => {
                                                            const newServiceId = parseInt(val);
                                                            setCalendarServices((prev) =>
                                                                prev.map((srv, i) =>
                                                                    i === index
                                                                        ? {
                                                                            serviceId: newServiceId,
                                                                            optionId: null,
                                                                            price: "",
                                                                        }
                                                                        : srv
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]">
                                                            <SelectValue placeholder="Select Service" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {servicesData.map((srv) => (
                                                                <SelectItem
                                                                    key={srv.id}
                                                                    value={srv.id.toString()}
                                                                >
                                                                    {srv.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-1">
                                                    <label>Options</label>
                                                    <Select
                                                        value={item.optionId ?? ""}
                                                        onValueChange={(val) => {
                                                            const selectedOption =
                                                                selectedService?.product_options?.find(
                                                                    (opt) => opt.uuid === val
                                                                );
                                                            const newPrice =
                                                                selectedOption?.amount?.toString() ?? "";

                                                            setCalendarServices((prev) =>
                                                                prev.map((srv, i) =>
                                                                    i === index
                                                                        ? {
                                                                            ...srv,
                                                                            optionId: val,
                                                                            price: newPrice,
                                                                        }
                                                                        : srv
                                                                )
                                                            );
                                                        }}
                                                        disabled={!selectedService}
                                                    >
                                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]">
                                                            <SelectValue placeholder="Select Option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {selectedService?.product_options?.map((opt) => (
                                                                <SelectItem key={opt.uuid} value={opt.uuid ?? ""}>
                                                                    {opt.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="col-span-1 flex justify-between gap-[16px]">
                                                    <div>
                                                        <Label
                                                            className="text-[14px] text-[#424242] "
                                                            htmlFor=""
                                                        >
                                                            Price
                                                        </Label>
                                                        <Input
                                                            readOnly
                                                            type="number"
                                                            min={0}
                                                            value={item.price}
                                                            onChange={(e) => {
                                                                const price = e.target.value;
                                                                setCalendarServices((prev) =>
                                                                    prev.map((srv, i) =>
                                                                        i === index ? { ...srv, price } : srv
                                                                    )
                                                                );
                                                            }}
                                                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 flex justify-between gap-[16px] mt-[28px]">
                                                        <span
                                                            onClick={() =>
                                                                setCalendarServices((prev) =>
                                                                    prev.filter((_, i) => i !== index)
                                                                )
                                                            }
                                                            className="cursor-pointer flex justify-center items-center h-[42px] w-[50px] rounded-[6px] bg-[#E06D5E] hover:bg-[#f57d6d]"
                                                        >
                                                            <Trash stroke="#fff" strokeWidth={1} />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* <div className="col-span-4 h-[50%] grid-rows-2 grid-cols-2 self-start justify-self-end flex items-center mt-[15px]">
                                    <p
                                        onClick={() =>
                                        setCalendarServices((prev) => [
                                            ...prev,
                                            { serviceId: 0, optionId: null, price: "" },
                                        ])
                                        }
                                        className={`${userType}-text text-[10px] font-semibold flex gap-[10px] cursor-pointer place-items-end pb-[10px] items-center`}
                                    >
                                        <span
                                        className={`flex ${userType}-bg w-[15px] h-[15px] rounded-[3px] justify-center items-center`}
                                        >
                                        <Plus className="text-[#F2F2F2] w-[12px]" />
                                        </span>
                                        Add Service
                                    </p>
                                    </div> */}
                                <div>
                                    <Schedule currentOrder={currentOrder} />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <DialogFooter>
                    <Button
                        className={`${userType}-text bg-transparent ${userType}-border hover-${userType}-bg ${userType}-button`}>
                        Close
                    </Button>
                    <Button
                        className={`${userType}-bg ${userType}-border hover-${userType}-bg ${userType}-button`}
                        onClick={handleSubmitServices}>
                        Save and Exit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default VendorOrderEdit;
