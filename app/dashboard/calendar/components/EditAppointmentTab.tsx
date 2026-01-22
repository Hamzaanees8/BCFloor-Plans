import DynamicMap from '@/components/DYnamicMap';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Trash, X, Edit2, Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react'
import { Order } from '../../orders/page';
import { Agent } from '@/components/AgentTable';
import Schedule from './Schedule';
import { Button } from '@/components/ui/button';
import AddNotesDialog from './AddNotesDialog';
import AddCoAgentDialog from '@/components/AddCoAgentDialog'
import { useOrderContext } from '../../orders/context/OrderContext';
import { useAppContext } from '@/app/context/AppContext';

import Link from 'next/link';

// interface Notes {
//     name: string;
//     note: string;
//     date: string
// }
// interface CoAgent {
//     name: string;
//     email?: string
// }
interface AppointmentTab {
    currentOrder?: Order;
    serviceId: number;
    agentData: Agent[]
    notes: Notes[];
    setNotes: React.Dispatch<React.SetStateAction<Notes[]>>
    coAgent: CoAgent[];
    setCoAgent: React.Dispatch<React.SetStateAction<CoAgent[]>>

}
export interface CoAgent {
    name: string;
    email?: string
    contact?: string;
}
interface Notes {
    name: string;
    note: string;
    date: string
    internal?: string
}
function EditAppointmentTab({ currentOrder, serviceId, agentData, notes, setNotes, coAgent, setCoAgent }: AppointmentTab) {
    const { userType } = useAppContext();
    const [agent, setAgent] = useState(currentOrder?.agent.uuid ?? '');
    const [contactNumber, setContactNumber] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [openAddNotesDialog, setOpenAddNotesDialog] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [selectedCoAgent, setSelectedCoAgent] = useState<{ name: string; email: string; primary_phone: string; split: string } | null>(null);
    const [selectedCoAgentIndex, setSelectedCoAgentIndex] = useState<number | null>(null);
    // const [coAgentEmail, setCoAgentEmail] = useState("");
    // const [agentNotes, setAgentNotes] = useState("");
    // const [vendor, setVendor] = useState("");
    // const [services, setServices] = useState("");
    // const [serviceOption, setServiceOption] = useState("");
    // const [date, setDate] = useState("");
    // const [time, setTime] = useState("");
    const [listing, setListing] = useState("");
    const [squareFootage, setSquareFootage] = useState("");
    const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
    const [tempNotes, setTempNotes] = useState('');
    // const [isSplit, setIsSplit] = useState(currentOrder?.split_invoice ?? false);
    // const [additionalServices, setAdditionalServices] = useState<
    //     { serviceId: number; optionId: string | null; price: string }[]
    // >([]);

    const { setCalendarServices, calendarServices, servicesData, OrderServices, setOrderServices, setSelectedSlots } = useOrderContext();

    useEffect(() => {
        // This was a problematic useEffect without dependencies
        // setCalendarServices(calendarServices)
    }, [calendarServices, setCalendarServices]);

    // const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const checked = e.target.checked;
    //     setIsSplit(checked);
    // };


    const currentAgent = agentData.find((ag) => ag.uuid === agent)


    useEffect(() => {


        setAgent(currentAgent?.uuid ?? '');
        setContactNumber(currentAgent?.primary_phone ?? '')
        setContactEmail(currentAgent?.email ?? '')
        setListing(currentOrder?.property ? `${currentOrder?.property.address}, ${currentOrder?.property.city}, ${currentOrder?.property.province}` : '')
        setSquareFootage(String(currentOrder?.property?.square_footage))
        // @ts-expect-error  error
        setNotes(currentOrder?.notes ? JSON.parse(currentOrder?.notes) as Notes[] : []);

        try {
            const raw = currentOrder?.co_agents;

            let parsed: CoAgent[] = [];

            if (typeof raw === "string") {
                parsed = JSON.parse(raw);
            } else if (Array.isArray(raw)) {
                parsed = raw;
            }

            if (Array.isArray(parsed)) {
                setCoAgent(parsed);
            } else {
                setCoAgent([]);
            }
        } catch (error) {
            console.error("Invalid co_agents:", error);
            setCoAgent([]);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentOrder, serviceId, agentData, currentAgent])
    const handleDeleteOrderService = (serviceUuid: string | undefined) => {
        if (!serviceUuid) return;
        setOrderServices(prev => prev.filter(s => s.service?.uuid !== serviceUuid));
        setSelectedSlots(prev => prev.filter(slot => slot.service_id !== serviceUuid));
    }

    const handleDeleteCalendarService = (serviceId: number, index: number) => {
        const matchedService = servicesData.find(s => s.id === serviceId);
        const serviceUuid = matchedService?.uuid;

        setCalendarServices(prev => prev.filter((_, i) => i !== index));
        if (serviceUuid) {
            setSelectedSlots(prev => prev.filter(slot => slot.service_id !== serviceUuid));
        }
    }



    const [activeTab, setActiveTab] = useState('Appointment Notes')

    const filteredNotes = useMemo(() => {
        return notes?.filter(note => {
            if (activeTab === 'Appointment Notes') {
                return note.internal === 'false' || !note.internal;
            } else {
                return note.internal === 'true';
            }
        });
    }, [notes, activeTab]);

    const handleDeleteNote = (indexInFiltered: number) => {
        const noteToDelete = filteredNotes[indexInFiltered];
        setNotes(prev => {
            const actualIndex = prev.findIndex(n =>
                n.note === noteToDelete.note &&
                n.date === noteToDelete.date &&
                n.name === noteToDelete.name
            );
            if (actualIndex !== -1) {
                const updated = [...prev];
                updated.splice(actualIndex, 1);
                return updated;
            }
            return prev;
        });
    };

    const handleEditNote = (note: Notes, index: number) => {
        setEditingNoteIndex(index);
        setTempNotes(note.note);
    };

    const handleSaveInlineNote = (indexInFiltered: number) => {
        if (editingNoteIndex === indexInFiltered && tempNotes.trim()) {
            const noteToUpdate = filteredNotes[indexInFiltered];
            setNotes(prev => prev.map(note =>
                (note.note === noteToUpdate.note && note.date === noteToUpdate.date && note.name === noteToUpdate.name)
                    ? { ...note, note: tempNotes.trim() }
                    : note
            ));
        }
        setEditingNoteIndex(null);
        setTempNotes('');
    };
    return (
        <Accordion
            type="multiple"
            defaultValue={["property", "additional", "statistics", 'Notes']}
            className="w-full space-y-4"
        >
            <AccordionItem value="property">
                <AccordionTrigger
                    className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                >
                    Agent Details
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                    <div className="w-full flex flex-col items-center">
                        <div className="w-full md:w-full py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                            <div className="grid grid-cols-5 gap-[16px]">
                                <div className='col-span-2'>
                                    <label htmlFor="">Agent Name</label>
                                    {userType === "admin" ? (
                                        <Select
                                            value={agent || ''}
                                            onValueChange={(value) => setAgent(value)}
                                        >
                                            <SelectTrigger
                                                className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                            >
                                                <SelectValue placeholder="Select Agent" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {agentData && agentData.map((agent, idx) =>

                                                    <SelectItem key={idx} value={agent?.uuid || ''}>{agent.first_name} {agent.last_name}</SelectItem>
                                                )}

                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            readOnly
                                            value={`${currentAgent?.first_name ?? ''} ${currentAgent?.last_name ?? ''}`}
                                            className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                    )}

                                </div>
                                <div className='col-span-1'>
                                    <label htmlFor="">Contact Number</label>
                                    <Input
                                        readOnly
                                        value={contactNumber}
                                        className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        type="number"
                                    />
                                </div>

                                <div className='col-span-2'>
                                    <label htmlFor="">Agent Email</label>
                                    <Input
                                        readOnly
                                        value={contactEmail}
                                        className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        type="email"
                                    />
                                </div>
                                {coAgent.length > 0 ? (
                                    <div className="col-span-5 border border-[#BBBBBB] mt-[12px] bg-white overflow-hidden w-full rounded-[10px]">
                                        <div className="grid grid-cols-6 gap-2 px-2 py-3 text-sm text-[#666666] font-semibold items-center border-b border-[#BBBBBB]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                            <div className="col-span-2">NAME</div>
                                            <div className="col-span-3">EMAIL</div>
                                            <div className="col-span-1 text-center">ACTIONS</div>
                                        </div>
                                        {coAgent.map((agent, index) => (
                                            <div key={index} className="grid grid-cols-6 gap-2 px-2 py-3 border-b border-[#BBBBBB] items-center hover:bg-[#F9F9F9]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                                <div className="col-span-2 text-[#666666] text-xs break-words truncate cursor-pointer" title={agent.name}>{agent.name}</div>
                                                <div className="col-span-3 text-[#666666] text-xs truncate cursor-pointer" title={agent.email}>{agent.email}</div>
                                                <div className="col-span-1">
                                                    <div className="flex items-center gap-3 justify-center">
                                                        <span className={`cursor-pointer ${userType}-text`} onClick={() => {
                                                            setSelectedCoAgent({
                                                                name: agent.name,
                                                                email: agent.email || '',
                                                                primary_phone: agent.contact || '',
                                                                split: ''
                                                            });
                                                            setSelectedCoAgentIndex(index);
                                                            setOpenAddDialog(true);
                                                        }}>
                                                            <Pencil className="w-[14px] h-[14px]" />
                                                        </span>
                                                        <span className="cursor-pointer text-red-500 hover:text-red-700" onClick={() => {
                                                            const updated = coAgent.filter((_, i) => i !== index);
                                                            setCoAgent(updated);
                                                        }}>
                                                            <X className="w-[16px] h-[16px]" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="col-span-5 flex justify-center items-center h-20 text-[#666666] text-xs border border-[#BBBBBB] mt-[12px] rounded-[10px]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                        No co-agents added yet.
                                    </div>
                                )}

                                <div className='col-span-5 flex justify-end items-center mt-2'>
                                    <div
                                        onClick={() => {
                                            setSelectedCoAgent(null);
                                            setSelectedCoAgentIndex(null);
                                            setOpenAddDialog(true);
                                        }}
                                        className={`cursor-pointer flex items-center gap-x-[10px]`}
                                    >
                                        <p className={`text-base font-semibold font-raleway ${userType}-text`}>Add</p>
                                        <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`} />
                                    </div>
                                </div>

                                <AddCoAgentDialog
                                    open={openAddDialog}
                                    setOpen={setOpenAddDialog}
                                    onSuccess={(newAgent) => {
                                        const formattedAgent: CoAgent = {
                                            name: newAgent.name,
                                            email: newAgent.email,
                                            contact: newAgent.primary_phone
                                        };

                                        if (selectedCoAgentIndex !== null) {
                                            setCoAgent((prev) => {
                                                const updated = [...prev];
                                                updated[selectedCoAgentIndex] = formattedAgent;
                                                return updated;
                                            });
                                        } else {
                                            setCoAgent((prev) => [...prev, formattedAgent]);
                                        }
                                        setOpenAddDialog(false);
                                    }}
                                    agent={selectedCoAgent}
                                />

                            </div>
                        </div>
                    </div>

                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="additional">
                <AccordionTrigger
                    className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                >
                    Listing Details
                </AccordionTrigger>
                <AccordionContent className="grid grid-cols-1 gap-4">
                    <div className="w-full grid grid-cols-3 gap-4 items-center mt-4">
                        <div className="col-span-2">
                            <Label className="text-[14px] text-[#424242] " htmlFor="">Listing</Label>
                            <Input
                                readOnly
                                value={listing}
                                // onChange={(e) => setAddress(e.target.value)}
                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                type="text"
                            />

                        </div>
                        <div className="col-span-1">
                            <Label className="text-[14px] text-[#424242] " htmlFor="">Square Footage</Label>
                            <Input
                                readOnly
                                value={squareFootage}
                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                type="text"
                            />

                        </div>
                        {/* <div className='col-span-3 h-[50%] grid-rows-2 grid-cols-2 self-end justify-self-end flex items-center'>
                            <p
                                className='text-[#4290E9] text-[10px] font-semibold flex gap-[10px] cursor-pointer place-items-end pb-[10px]'><span className='flex bg-[#4290E9] w-[15px] h-[15px] rounded-[3px] justify-center items-center'><Plus className='text-[#F2F2F2] w-[12px]' /></span>Create New Listing </p>
                        </div> */}
                        <div className="w-full h-[300px] col-span-3 mt-[20px]">
                            <DynamicMap
                                address={currentOrder?.property.address}
                                city={currentOrder?.property.city}
                                province={currentOrder?.property.province}
                                country={currentOrder?.property.country ? currentOrder?.property.country : ""}
                            />
                        </div>

                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="statistics">
                <AccordionTrigger
                    className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                >
                    Statistics
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                    <div className="w-full flex flex-col items-center mt-[17px]">
                        {OrderServices.map((service, idx) => {
                            return <div key={idx} className='grid grid-cols-4 gap-x-4 mt-[10px]'>
                                <div className='col-span-2'>
                                    <label htmlFor="">Service</label>
                                    <Input
                                        readOnly
                                        value={service.service.name}
                                        className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        type="text"
                                    />

                                </div>
                                <div className="col-span-1">
                                    <Label className="text-[14px] text-[#424242] " htmlFor="">Service Options</Label>
                                    <Input
                                        readOnly
                                        value={service?.option?.title}
                                        className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        type="text"
                                    />

                                </div>
                                <div className="col-span-1 flex justify-between gap-[16px]">
                                    <div>
                                        <Label className="text-[14px] text-[#424242] " htmlFor="">Price</Label>
                                        <Input
                                            readOnly
                                            value={service.amount}
                                            className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                            type="text"
                                        />

                                    </div>
                                    <div className=''>
                                        <Label className="text-[14px] text-[#424242] " htmlFor="">Delete</Label>
                                        <span
                                            onClick={() => handleDeleteOrderService(service.service?.uuid)}
                                            className='cursor-pointer flex justify-center items-center h-[42px] w-[50px] rounded-[6px] bg-[#E06D5E] hover:bg-[#f57d6d] mt-[10px]'>
                                            <Trash stroke="#fff" strokeWidth={1} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        })}
                        <div className='w-full'>
                            {calendarServices?.map((item, index) => {
                                const selectedService = servicesData.find(s => s.id === item.serviceId);
                                return (
                                    <div key={`new-${index}`} className='grid grid-cols-4 gap-x-4 mt-[10px]'>
                                        <div className='col-span-2'>
                                            <label>Service</label>
                                            <Select
                                                value={item.serviceId.toString()}
                                                onValueChange={(val) => {
                                                    const newServiceId = parseInt(val);
                                                    setCalendarServices((prev) =>
                                                        prev.map((srv, i) =>
                                                            i === index ? { serviceId: newServiceId, optionId: null, price: '' } : srv
                                                        )
                                                    );
                                                }}
                                            >
                                                <SelectTrigger
                                                    className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                >
                                                    <SelectValue placeholder="Select Service" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {servicesData
                                                        .filter((srv) => {
                                                            // Filter out services already in OrderServices
                                                            const isInOrderServices = OrderServices.some(os => os.service.id === srv.id);
                                                            if (isInOrderServices) return false;

                                                            // Filter out services selected in other rows of calendarServices
                                                            const isInOtherCalendarRows = calendarServices.some((cs, i) => i !== index && cs.serviceId === srv.id);
                                                            if (isInOtherCalendarRows) return false;

                                                            // Logic to filter based on square footage
                                                            const sqFt = parseInt(squareFootage, 10);
                                                            if (isNaN(sqFt)) return true; // Show all if no sq ft is set

                                                            if (!srv.product_options || srv.product_options.length === 0) return true;

                                                            const hasMatchingOption = srv.product_options.some((option) => {
                                                                if (!option.sq_ft_range || typeof option.sq_ft_range !== "string") return false;

                                                                const [minStr, maxStr] = option.sq_ft_range.split("-").map((s) => s.trim());
                                                                const min = parseInt(minStr, 10);
                                                                const max = parseInt(maxStr, 10);

                                                                if (isNaN(min) || isNaN(max)) return false;

                                                                return sqFt >= min && sqFt <= max;
                                                            });

                                                            return hasMatchingOption;
                                                        })
                                                        .map((srv) => (
                                                            <SelectItem key={srv.id} value={srv.id.toString()}>
                                                                {srv.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className='col-span-1'>
                                            <label>Options</label>
                                            <Select
                                                value={item.optionId ?? ''}
                                                onValueChange={(val) => {
                                                    const selectedOption = selectedService?.product_options?.find(opt => opt.uuid === val);
                                                    const newPrice = selectedOption?.amount?.toString() ?? '';

                                                    setCalendarServices((prev) =>
                                                        prev.map((srv, i) =>
                                                            i === index ? { ...srv, optionId: val, price: newPrice } : srv
                                                        )
                                                    );
                                                }}

                                                disabled={!selectedService}
                                            >
                                                <SelectTrigger
                                                    className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                >
                                                    <SelectValue placeholder="Select Option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedService?.product_options
                                                        ?.filter((opt) => {
                                                            const sqFt = parseInt(squareFootage, 10);
                                                            if (isNaN(sqFt)) return true;

                                                            if (!opt.sq_ft_range || typeof opt.sq_ft_range !== "string") return true;

                                                            const [minStr, maxStr] = opt.sq_ft_range.split("-").map((s) => s.trim());
                                                            const min = parseInt(minStr, 10);
                                                            const max = parseInt(maxStr, 10);

                                                            if (isNaN(min) || isNaN(max)) return true;

                                                            return sqFt >= min && sqFt <= max;
                                                        })
                                                        .map((opt) => (
                                                            <SelectItem key={opt.uuid} value={opt.uuid ?? ''}>
                                                                {opt.title}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="col-span-1 flex justify-between gap-[16px]">
                                            <div>
                                                <Label className="text-[14px] text-[#424242] " htmlFor="">Price</Label>
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
                                                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                />
                                            </div>
                                            <div className='col-span-1 flex justify-between gap-[16px] mt-[28px]'>
                                                <span
                                                    onClick={() => handleDeleteCalendarService(item.serviceId, index)}
                                                    className='cursor-pointer flex justify-center items-center h-[42px] w-[50px] rounded-[6px] bg-[#E06D5E] hover:bg-[#f57d6d]'
                                                >
                                                    <Trash stroke="#fff" strokeWidth={1} />
                                                </span>
                                            </div>
                                        </div>



                                    </div>
                                );
                            })}
                        </div>

                        <div className='col-span-4 h-[50%] grid-rows-2 grid-cols-2 self-start justify-self-end flex items-center mt-[15px]'>
                            <p
                                onClick={() =>
                                    setCalendarServices((prev) => [
                                        ...prev,
                                        { serviceId: 0, optionId: null, price: '' }
                                    ])
                                }
                                className={`${userType}-text text-[10px] font-semibold flex gap-[10px] cursor-pointer place-items-end pb-[10px] items-center`}
                            ><span className={`flex ${userType}-bg w-[15px] h-[15px] rounded-[3px] justify-center items-center`}><Plus className='text-[#F2F2F2] w-[12px]' /></span>Add Service </p>

                        </div>
                        <div>
                            <Schedule currentOrder={currentOrder} />
                            {/* <div className='col-span-5 flex items-center justify-end mt-[10px]'>
                                <label className='flex items-center justify-end gap-x-[10px] cursor-pointer'>
                                    <input
                                        type="checkbox"
                                        // checked={isSplitInvoice}
                                        // onChange={(e) => {
                                        //     setIsSplitInvoice(e.target.checked);
                                        //     setDraftCoAgents([]);
                                        //     setCoAgents([]);
                                        // }}

                                        className="w-[18px] h-[18px] accent-[#4290E9] rounded-sm border border-[#CCCCCC]"
                                    />
                                    <span className='text-base font-semibold font-raleway text-[#666666]'>
                                        Add $25 Change Fee to Agent
                                    </span>
                                </label>
                            </div> */}
                            {/* <div className='flex justify-end mt-[10px]'>
                                <Button
                                    className="bg-[#4290E9] border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff]  w-[250px] h-[37px] hover:text-white hover:bg-[#4e9af1]"
                                >Review and Submit Order</Button>
                            </div> */}
                        </div>
                    </div>

                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="Notes">
                <AccordionTrigger
                    className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                >
                    Additional Notes
                </AccordionTrigger>
                <AccordionContent className="grid grid-cols-1 gap-4">
                    <div className="">
                        <div className="flex flex-col gap-y-3 mt-3">
                            <div className="flex items-center justify-center gap-x-2.5">
                                <button
                                    onClick={() => setActiveTab("Appointment Notes")}
                                    className={`px-5 py-1 text-[13px] rounded-[6px] font-bold rounded-l-md transition-colors duration-200 h-[30px]
                                    ${activeTab === "Appointment Notes" ? `${userType}-bg text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                                >
                                    Appointment Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab("Notes on Agent")}
                                    className={`px-5 py-1 text-[13px] rounded-[6px] font-bold rounded-l-md transition-colors duration-200 h-[30px]
                                    ${activeTab === "Notes on Agent" ? `${userType}-bg text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                                >
                                    Notes on Agent
                                </button>
                            </div>
                            {activeTab === "Appointment Notes" ? (
                                <p className="text-[#E06D5E] text-[13px]">
                                    These notes will be viewable by AGENT.
                                </p>
                            ) : (
                                <p className="text-[#7D7D7D] text-[13px]">
                                    This note is for Internal Use only. Agent will not be able to see or access Note.
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-4 mt-[12px]">
                            {filteredNotes?.map((note, index) => (
                                <div
                                    key={index}
                                    className="w-full p-3 rounded-[6px] bg-[#E4E4E4] border border-[#BBBBBB] relative whitespace-pre-wrap break-words"
                                >
                                    {editingNoteIndex === index ? (
                                        <textarea
                                            autoFocus
                                            className="w-full bg-transparent border-none outline-none resize-none text-sm text-[#333] min-h-[60px]"
                                            value={tempNotes}
                                            onChange={(e) => setTempNotes(e.target.value)}
                                            onBlur={() => handleSaveInlineNote(index)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <p
                                            className="text-sm text-[#333] cursor-pointer"
                                            onClick={() => handleEditNote(note, index)}
                                        >
                                            {note.note}
                                        </p>
                                    )}

                                    <div className="mt-2 text-right text-[#8E8E8E] text-[13px] font-[400] leading-tight">
                                        <p>
                                            {new Date(note.date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                        <p>{note.name}</p>
                                        <div className='flex items-center justify-end gap-x-2'>
                                            {note.internal === "true" ? (
                                                <EyeOff className='w-4 h-4 text-[#7D7D7D]' />
                                            ) : (
                                                <Eye className='w-4 h-4 text-[#7D7D7D]' />
                                            )}
                                            <Edit2 className='w-4 h-4 text-[#7D7D7D] cursor-pointer' onClick={() => handleEditNote(note, index)} />
                                            <Trash onClick={() => handleDeleteNote(index)} className="w-4 h-4 text-[#7D7D7D] cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-[10px]">
                            <Button
                                onClick={() => { setOpenAddNotesDialog(true) }}
                                className="bg-[#4290E9] border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff]  w-[110px] h-[37px] hover:text-white hover:bg-[#4e9af1]"
                            >Add Note</Button>
                        </div>
                        <AddNotesDialog
                            open={openAddNotesDialog}
                            setOpen={setOpenAddNotesDialog}
                            notes={notes}
                            setNotes={setNotes}
                            isInternal={activeTab === 'Notes on Agent'}
                        />
                        <div className='mt-[40px]'>
                            <Link
                                href={`/dashboard/file-manager/${currentOrder?.uuid}`}
                                className="bg-[#4290E9] w-[140px]  rounded-[6px] border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff] h-[37px] hover:text-white hover:bg-[#4e9af1]"
                            >Media</Link>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion >
    )
}

export default EditAppointmentTab