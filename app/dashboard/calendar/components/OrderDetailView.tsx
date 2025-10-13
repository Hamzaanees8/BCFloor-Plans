'use client'
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "../../orders/page";
import AppointmentTab from "./AppointmentTab";
import SquareFootage from "./SquareFootage";
import HistoryTab from "./HistoryTab";
import EditAppointmentTab from "./EditAppointmentTab";
import EditSquareFootage from "./EditSquareFootage";
import { Agent } from "@/components/AgentTable";
import { useOrderContext } from "../../orders/context/OrderContext";
import { toast } from "sonner";
import { EditOrder } from "../calendar";
import { Services } from "../../services/page";
import { GetServices } from "../../orders/orders";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import WarningIcon from "@/components/Icons";
import NotificationModal from "./NotificationModal";
import { useAppContext } from "@/app/context/AppContext";

interface OrderDetailViewProps {
    open: boolean;
    onClose: () => void;
    orderId: string
    orderData: Order[]
    serviceId: number;
    agentData: Agent[]
}
type AgentNote = {
    note: string;
    name: string;
    date: string;
};
export interface OrderPayload {
    agent_id: string;
    property_id: string;
    amount: number;
    order_status: "Processing" | "Completed" | "Cancelled" | string;
    payment_status: "UNPAID" | "PAID" | string;
    split_invoice: number;
    co_agents?: CoAgent[];
    notes: AgentNote[];
    services: {
        service_id: string;
        option_id?: string;
        amount: number;
        custom?: string;
    }[];
    discounts?: {
        discount_id: string;
        type: "code" | "quantity" | "manual" | string;
        value: number;
        service_id?: string;
    }[];
    slots: {
        service_id: string;
        vendor_id: string;
        show_all_vendors?: number;
        schedule_override?: number;
        recommend_time?: number;
        travel?: string;
        start_time: string;
        end_time: string;
        est_time: number | null;
        distance?: number | null;
        km_price?: number | null;
        date: string;
    }[];
    areas: Area[];
}
interface Notes {
    name: string;
    note: string;
    date: string
}
export interface CoAgent {
    name: string;
    email?: string
    contact?: string;
    percentage?: number;
}
export interface Area {
    type: string;
    footage: number;
    custom_title?: string;
    uuid?: string;
}
export default function OrderDetailView({ open, onClose, orderId, serviceId, orderData, agentData }: OrderDetailViewProps) {
    const { userType } = useAppContext();
    const [activeTab, setActiveTab] = useState<'appointment' | 'square_footage' | 'history'>('appointment');
    const [isEdit, setIsEdit] = useState(false);
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [notes, setNotes] = useState<Notes[]>([]);
    const [coAgent, setCoAgent] = useState<CoAgent[]>([]);
    const [area, setArea] = useState<Area[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [agentChecked, setAgentChecked] = useState(false);
    const [vendorChecked, setVendorChecked] = useState(false);
    const [vendorSelected, setVendorSelected] = useState(false);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const bothSelected = agentChecked && vendorChecked;
    const currentOrder = orderData.find((order) => {
        return order.uuid == orderId
    })
    const handleClose = () => {
        setAgentChecked(false);
        setVendorChecked(false);
    };
    const handleOkClick = () => {
        const both = agentChecked && vendorChecked;
        setVendorSelected(vendorChecked);

        if (both || agentChecked) {
            setShowAgentModal(true);
            setShowVendorModal(false);
            setShowNotification(true);
        } else if (vendorChecked) {
            setShowAgentModal(false);
            setShowVendorModal(true);
            setShowNotification(true);
        }
    };


    console.log('area', area);
    console.log('currentOrder', currentOrder);

    const { calendarServices, selectedSlots, OrderServices, setOrderServices, setSelectedSlots, setCalendarServices } = useOrderContext();
    console.log('calendarServices', calendarServices);
    console.log('OrderServices', OrderServices);

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
    const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        const calendarServicesPayload = calendarServices
            .map(service => {
                const matchedService = servicesData.find(s =>
                    s.id === service.serviceId
                );

                if (!matchedService) return null;

                return {
                    service_id: matchedService.uuid,
                    option_id: service.optionId,
                    amount: Number(service.price),
                };
            })
            .filter((s): s is { service_id: string; option_id: string; amount: number } => !!s); // filter nulls


        const orderServicesPayload = [...(OrderServices || [])]
            .map(service => ({
                service_id: service.service?.uuid as string,
                option_id: service?.option?.uuid ?? undefined,
                amount: Number(service?.amount) as number,
            }));

        const servicesPayload = [...orderServicesPayload, ...calendarServicesPayload]

        const calendarServiceIds = calendarServices.map(s => s.serviceId?.toString());
        const orderServiceIds = OrderServices.map(s =>
            (s.service_id ?? s.service?.id)?.toString()
        );

        const validServiceIds = [...calendarServiceIds, ...orderServiceIds];

        const validSlots = selectedSlots?.filter(slot =>
            validServiceIds.includes(String(slot.service_id))
        );


        const slotsPayload = validSlots.map((slot) => {

            const matchedService = servicesData?.find((service) => {

                return service.id == Number(slot.service_id)
            });

            return {
                service_id: matchedService?.uuid ?? '',
                vendor_id: slot.vendor && slot.vendor.uuid
                    ? slot.vendor.uuid
                    : slot.vendor_id || "",
                show_all_vendors: slot.show_all_vendors ? 1 : 0,
                schedule_override: slot.schedule_override ? 1 : 0,
                recommend_time: slot.recommend_time ? 1 : 0,
                travel: slot.travel ?? undefined,
                start_time: slot.start_time,
                end_time: slot.end_time,
                est_time: slot.est_time ?? null,
                distance: slot.distance ?? null,
                km_price: slot.km_price ?? null,
                date: slot.date,
            };
        });

        try {
            const token = localStorage.getItem('token') || '';

            const payload: OrderPayload = {
                agent_id: String(currentOrder?.agent.uuid) || "",
                property_id: currentOrder?.property.uuid || "",
                amount: Number(currentOrder?.amount) || 0,
                order_status: "Processing",
                payment_status: "UNPAID",
                split_invoice: currentOrder?.split_invoice ? 1 : 0,
                co_agents: coAgent || [],
                notes: notes || [],
                services: servicesPayload,
                slots: slotsPayload,
                areas: area
            };

            const updatedPayload = { ...payload, _method: 'PUT' };
            const response = await EditOrder(currentOrder?.uuid ?? "", updatedPayload, token);


            if (response?.success) {
                toast.success('Order updated successfully');
                onClose()
                setOrderServices([])
                setSelectedSlots([])
                setCalendarServices([])
                setIsEdit(false);
            } else {
                toast.error("Something went wrong");
            }
        } catch (error) {
            // setIsLoading(false);
            // setIsSubmitted(false);
            // console.log('Raw error:', error);

            // setFieldErrors({});
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

                // setFieldErrors(normalizedErrors);

                // const firstError = Object.values(normalizedErrors).flat()[0];
                // toast.error(firstError || 'Validation error');
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit order data');
            }
        }
    };

    useEffect(() => {
        if (userType == 'vendor' && isEdit) {
            setActiveTab('square_footage')
        }
    }, [isEdit, userType])
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl px-[10px] h-[90vh] [&>button]:hidden font-alexandria font-[400] overflow-x-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className={`${userType}-text text-[24px] font-alexandria font-[400]`}>{currentOrder?.property_address}, {currentOrder?.property_location}&nbsp;&nbsp;&nbsp;›&nbsp;&nbsp;&nbsp;Order #{currentOrder?.id}</DialogTitle>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                onClose()
                                setIsEdit(false)
                                setOrderServices([])
                                setSelectedSlots([])
                                setCalendarServices([])
                            }}
                            className="hover:bg-transparent text-gray-500 hover:text-black"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div>
                        <div className="flex gap-4 pb-[20px] border-b-[1px] border-b-[#BBBBBB] mt-4 text-[#666666]">
                            <Button
                                variant={activeTab === 'appointment' ? 'default' : 'outline'}
                                onClick={() => setActiveTab('appointment')}
                                className={`${activeTab === 'appointment' ? `${userType}-bg text-white` : 'bg-[#E4E4E4]'} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px]`}
                            >
                                Appointment
                            </Button>
                            <Button
                                variant={activeTab === 'square_footage' ? 'default' : 'outline'}
                                onClick={() => setActiveTab('square_footage')}
                                className={`${activeTab === 'square_footage' ? `${userType}-bg text-white` : 'bg-[#E4E4E4]'} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px]`}
                            >
                                Square Footage
                            </Button>
                            <Button
                                variant={activeTab === 'history' ? 'default' : 'outline'}
                                onClick={() => setActiveTab('history')}
                                className={`${activeTab === 'history' ? `${userType}-bg text-white` : 'bg-[#E4E4E4]'} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px]`}

                            >
                                History
                            </Button>
                        </div>

                    </div>
                </DialogHeader>
                <div className="p-4 overflow-y-auto max-h-[80vh] px-2">

                    {activeTab === 'appointment' && !isEdit && (
                        <AppointmentTab currentOrder={currentOrder} serviceId={serviceId} />
                    )}
                    {activeTab === 'appointment' && isEdit && userType !== 'vendor' && (
                        <EditAppointmentTab
                            currentOrder={currentOrder} serviceId={serviceId} agentData={agentData} notes={notes} setNotes={setNotes} coAgent={coAgent} setCoAgent={setCoAgent}
                        />
                    )}

                    {activeTab === 'square_footage' && !isEdit && (
                        <SquareFootage currentOrder={currentOrder} />

                    )}
                    {activeTab === 'square_footage' && isEdit && (
                        <EditSquareFootage currentOrder={currentOrder} area={area} setArea={setArea} />

                    )}

                    {activeTab === 'history' && (
                        <HistoryTab currentOrder={currentOrder} servicesData={servicesData} />
                    )}
                    {isEdit &&
                        <div className="w-full flex justify-end gap-[10px] mt-[40px]">
                            <Button
                                onClick={() => {
                                    onClose()
                                    setIsEdit(false)
                                }}
                                className={`bg-transparent border-[1px] text-[14px] flex justify-center items-center ${userType}-border ${userType}-text  w-[132px] h-[42px] ${userType}-button hover-${userType}-bg`}

                            >

                                Close
                            </Button>
                            <Button
                                onClick={(e) => {
                                    handleSubmitOrder(e)
                                    setShowConfirmation(true)
                                }}
                                className={`${userType}-bg ${userType}-border text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff]  w-[132px] h-[42px] hover:text-white hover-${userType}-bg hover:opacity-95`}

                            >
                                Save Changes
                            </Button>
                        </div>
                    }
                    {!isEdit &&
                        <div className="w-full flex justify-end gap-[10px] mt-[40px]">
                            {/* <Button
                                className="bg-transparent border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#4290E9]  w-[132px] h-[42px] hover:text-white hover:bg-[#4290E9]"
                            >
                                View Order
                            </Button> */}
                            <Button
                                onClick={() => { setIsEdit(true) }}
                                className={`${userType}-bg ${userType}-border border-[1px] text-[14px] flex justify-center items-center hover-${userType}-bg hover:opacity-95 text-[#fff]  w-[132px] h-[42px] hover:text-white`}
                            >
                                Edit
                            </Button>
                        </div>}
                </div>
            </DialogContent>
            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent className="w-[320px] md:w-[565px] max-w-[565px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
                    <AlertDialogHeader className="mb-2">
                        <AlertDialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}>
                            SAVE AND EXIT
                            <AlertDialogCancel onClick={handleClose} className="border-none !shadow-none">
                                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                            </AlertDialogCancel>
                        </AlertDialogTitle>
                    </AlertDialogHeader>

                    <div className="flex items-start gap-3">
                        <div className="w-fit">
                            <WarningIcon width={48} fill="#DC9600" />
                        </div>
                        <AlertDialogDescription className="text-[16px] font-[400] text-[#666666]">
                            Are you sure you want to save and exit? This cannot be undone.
                        </AlertDialogDescription>
                    </div>

                    <div className="mt-4 flex justify-between items-center gap-2 border-b-[1px] border-[#E4E4E4] pb-2">
                        <div className="flex items-start gap-x-2.5">
                            <div className="">
                                <input
                                    type="checkbox"
                                    checked={agentChecked}
                                    onChange={() => setAgentChecked(!agentChecked)}
                                    className={`w-5 h-5 ${userType}-accent mt-1 cursor-pointer`}
                                />
                            </div>

                            <div className="flex flex-col gap-y-2">
                                <p className="text-[16px] font-[400] text-[#666666]">Notify Agent of Changes</p>
                                <p className={`text-[16px] font-[400] ${userType}-text`}>Edit Notification</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-x-2.5">
                            <div className="">
                                <input
                                    type="checkbox"
                                    checked={vendorChecked}
                                    onChange={() => setVendorChecked(!vendorChecked)}
                                    className={`w-5 h-5 ${userType}-accent mt-1 cursor-pointer`}
                                />
                            </div>
                            <div className="flex flex-col gap-y-2">
                                <p className="text-[16px] font-[400] text-[#666666]">Notify Vendor of Changes</p>
                                <p className={`text-[16px] font-[400] ${userType}-text`}>Edit Notification</p>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria">
                        <AlertDialogCancel onClick={() => {
                            handleClose()
                            setOrderServices([])
                            setSelectedSlots([])
                            setCalendarServices([])
                        }}
                            className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] ${userType}-text ${userType}-border text-[#0078D4] hover-${userType}-bg hover:opacity-95 ${userType}-button`}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={`${userType}-border hover:opacity-95 text-white ${userType}-bg hover-${userType}-bg w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
                            onClick={handleOkClick}
                        >
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                <NotificationModal
                    open={showNotification}
                    setOpen={setShowNotification}
                    showAgentModal={showAgentModal}
                    setShowAgentModal={setShowAgentModal}
                    showVendorModal={showVendorModal}
                    setShowVendorModal={setShowVendorModal}
                    setAgentChecked={setAgentChecked}
                    setVendorChecked={setVendorChecked}
                    vendorSelected={vendorSelected}
                    bothSelected={bothSelected}
                />

            </AlertDialog>
        </Dialog>
    );
}
