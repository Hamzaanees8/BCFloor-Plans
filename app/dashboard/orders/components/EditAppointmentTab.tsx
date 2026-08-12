import DynamicMap from '@/components/DYnamicMap';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash, Edit2Icon } from 'lucide-react';
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Order } from '../../orders/page';
import { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { GetServices, GetUser } from '../../orders/orders';
import { Services } from '../../services/page';
import { useAppContext } from '@/app/context/AppContext';
import { AddCoAgentDialog } from '../../calendar/components/AddCoAgnets';
import { useOrderContext } from '../context/OrderContext';
import Schedule from '../../calendar/components/Schedule';
import { Area } from '../../calendar/components/OrderDetailView';

interface AppointmentTab {
    currentOrder?: Order;
    serviceId: number;
    agentData: Agent[]
    notes: Notes[];
    setNotes: React.Dispatch<React.SetStateAction<Notes[]>>
    coAgent: CoAgent[];
    setCoAgent: React.Dispatch<React.SetStateAction<CoAgent[]>>
    updateInvoice?: boolean;
    setUpdateInvoice?: React.Dispatch<React.SetStateAction<boolean>>;
    area: Area[];
}
export interface CoAgent {
    name: string;
    email?: string
    contact?: string;
}
interface Notes {
    name: string;
    note: string;
    date: string;
    internal?: string;
}
function EditAppointmentTab({ currentOrder, agentData, notes, setNotes, coAgent, setCoAgent, updateInvoice, setUpdateInvoice, area }: AppointmentTab) {
    const { userType } = useAppContext();
    const [agent, setAgent] = useState(currentOrder?.agent?.uuid ?? '');
    const [contactNumber, setContactNumber] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [listing, setListing] = useState("");
    const [squareFootage, setSquareFootage] = useState("");
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [userName, setUserName] = useState('');
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [tempNote, setTempNote] = useState('');
    const [editingNote, setEditingNote] = useState<any | null>(null);
    const [editNoteText, setEditNoteText] = useState('');

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetUser(token)
            .then((res) => {
                const firstName = res?.data?.first_name || "";
                const lastName = res?.data?.last_name || "";
                setUserName(`${firstName} ${lastName}`.trim());
            })
            .catch((err) => console.log("Error fetching user info:", err.message));
    }, []);

    const formatTimestamp = (dateVal: any) => {
        if (!dateVal) return "";
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return String(dateVal);
            return d.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return String(dateVal);
        }
    };

    const { setCalendarServices, calendarServices } = useOrderContext();

    useEffect(() => {

        setCalendarServices(calendarServices)
    })
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
        if (Array.isArray(currentOrder?.notes)) {
            setNotes(currentOrder.notes as unknown as Notes[]);
        } else if (typeof currentOrder?.notes === 'string') {
            try {
                setNotes(JSON.parse(currentOrder.notes) as Notes[]);
            } catch {
                console.error("Failed to parse notes.");
                setNotes([]);
            }
        } else {
            setNotes([]);
        }

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
    }, [currentOrder, agentData, currentAgent])

    const handleSquareFootageChange = useCallback((val: string) => {
        setSquareFootage(val);
        const sqFt = parseFloat(val);

        if (!isNaN(sqFt)) {
            setCalendarServices((prev) =>
                prev.map((srv) => {
                    const serviceInfo = servicesData.find(s => s.id === srv.serviceId);
                    if (!serviceInfo) return srv;

                    const nameLower = (serviceInfo.name || "").toLowerCase();
                    // exclude photos, videos generic services just in case, include floor/3d tours
                    const isMedia = nameLower.includes("photo") || nameLower.includes("video") || nameLower.includes("drone") || nameLower.includes("aerial");
                    const isFloorOr3D = (nameLower.includes("floor") || nameLower.includes("3d") || nameLower.includes("matterport") || nameLower.includes("iguide") || nameLower.includes("tour"));
                    const hasSqFtRangeOption = serviceInfo.product_options?.some((opt) => opt.sq_ft_range);

                    if (!isMedia && (isFloorOr3D || hasSqFtRangeOption)) {
                        let updatedOptionId = srv.optionId;
                        let updatedPrice = srv.price;
                        let selectedOption = serviceInfo.product_options?.find((opt) => opt.uuid === updatedOptionId);

                        // Find the option with the matching sq_ft_range if applicable
                        const optionWithRange = serviceInfo.product_options?.find((opt) => {
                            if (opt.sq_ft_range) {
                                const parts = opt.sq_ft_range.split('-');
                                if (parts.length === 2) {
                                    const min = parseInt(parts[0], 10);
                                    if (parts[1] === '+') {
                                        return sqFt >= min;
                                    } else {
                                        const max = parseInt(parts[1], 10);
                                        return sqFt >= min && sqFt <= max;
                                    }
                                }
                            }
                            return false;
                        });

                        if (optionWithRange) {
                            updatedOptionId = optionWithRange.uuid ?? null;
                            selectedOption = optionWithRange;
                        }

                        // Recalculate price if sq_ft_rate exists
                        if (selectedOption) {
                            updatedPrice = selectedOption.amount?.toString() ?? '';
                            if (
                                (!selectedOption.sq_ft_range || String(selectedOption.sq_ft_range).trim() === '') &&
                                selectedOption.sq_ft_rate &&
                                parseFloat(selectedOption.sq_ft_rate) > 0
                            ) {
                                const calculated = parseFloat(selectedOption.sq_ft_rate) * sqFt;
                                updatedPrice = (selectedOption.min_price ? Math.max(calculated, selectedOption.min_price) : calculated).toFixed(2);
                            }
                        }

                        return {
                            ...srv,
                            optionId: updatedOptionId,
                            price: updatedPrice
                        };
                    }

                    return srv;
                })
            );
        }
    }, [servicesData, setCalendarServices, setSquareFootage]);

    useEffect(() => {
        if (area && area.length > 0) {
            const calculatedSqFt = area
                .filter(a => a.category === "Finished" || a.category === "Subtotal" || a.type === "Finished" || a.type === "Subtotal")
                .reduce((sum, a) => sum + (a.footage || 0), 0);

            if (calculatedSqFt > 0) {
                handleSquareFootageChange(String(calculatedSqFt));
            }
        }
    }, [area, handleSquareFootageChange]);

    const tabs =
        userType === 'admin'
            ? ['Notes', 'Internal Notes']
            : [];
    const [activeTab, setActiveTab] = useState('Notes');

    const filteredNotes = useMemo(() => {
        return notes?.filter(note => {
            if (activeTab === 'Notes') {
                return note.internal === 'false' || !note.internal;
            } else {
                return note.internal === 'true';
            }
        });
    }, [notes, activeTab]);

    const handleEditClick = () => {
        setTempNote('');
        setIsEditingNote(true);
    };

    const handleSaveNote = () => {
        setIsEditingNote(false);
        if (tempNote.trim()) {
            setNotes(prev => [
                ...prev,
                {
                    note: tempNote.trim(),
                    name: userName,
                    date: new Date().toISOString().replace('T', ' ').split('.')[0],
                    internal: activeTab === 'Internal Notes' ? 'true' : 'false'
                }
            ]);
            setTempNote('');
        }
    };

    const handleEditNote = (n: any) => {
        setEditingNote(n);
        setEditNoteText(n.note);
    };

    const handleCancelEdit = () => {
        setEditingNote(null);
        setEditNoteText('');
    };

    const handleUpdateNote = (targetNote: any) => {
        if (!editNoteText.trim()) {
            return;
        }
        setNotes(prev =>
            prev.map(note =>
                note === targetNote
                    ? { ...note, note: editNoteText.trim() }
                    : note
            )
        );
        setEditingNote(null);
        setEditNoteText('');
    };
    return (
        <Accordion
            type="multiple"
            defaultValue={["property", "additional", "statistics", 'Notes']}
            className="w-full space-y-4"
        >
            <AccordionItem value="property">
                <AccordionTrigger className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                    Agent Details
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                    <div className="w-full flex flex-col items-center">
                        <div className="w-full md:w-full py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                            <div className="grid grid-cols-5 gap-[16px]">

                                <div className='col-span-2'>
                                    <label htmlFor="">Agent Name</label>
                                    {userType === 'agent' ? (
                                        <div className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] px-3 flex items-center rounded-md cursor-default text-sm font-normal">
                                            {currentAgent?.first_name} {currentAgent?.last_name}
                                        </div>
                                    ) : (
                                        <Select
                                            value={agent || ''}
                                            onValueChange={(value) => setAgent(value)}
                                        >
                                            <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                                                <SelectValue placeholder="Select Agent" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {agentData && agentData.map((agent, idx) =>

                                                    <SelectItem key={idx} value={agent?.uuid || ''}>{agent.first_name} {agent.last_name}</SelectItem>
                                                )}

                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div className='col-span-1'>
                                    <label htmlFor="">Contact Number</label>
                                    <Input
                                        readOnly
                                        value={contactNumber}
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                        type="number"
                                    />
                                </div>

                                <div className='col-span-2'>
                                    <label htmlFor="">Agent Email</label>
                                    <Input
                                        readOnly
                                        value={contactEmail}
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                        type="email"
                                    />
                                </div>
                                {coAgent && coAgent?.map((agent, idx) => {
                                    return <div key={idx} className='col-span-5 grid grid-cols-5 gap-[16px]'>
                                        <div className='col-span-2'>
                                            <label htmlFor="">Co-Agent Name</label>
                                            <Input
                                                readOnly
                                                value={agent.name}
                                                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                type="text"
                                            />

                                        </div>
                                        <div className='col-span-1'>
                                            <label htmlFor="">Contact Number</label>
                                            <Input
                                                readOnly
                                                value={agent.contact ? agent.contact : ''}
                                                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                type="number"
                                            />

                                        </div>
                                        <div className='col-span-2'>
                                            <label htmlFor="">Co-agent Email</label>
                                            <Input
                                                readOnly
                                                value={agent.email}
                                                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                type="email"
                                            />
                                        </div></div>
                                })}

                                <div className='col-span-5 h-[50%] grid-rows-2 grid-cols-2 self-end justify-self-end flex items-center'>
                                    <p
                                        onClick={() => setOpenAddDialog(true)}
                                        className={`${userType}-text text-[10px] font-semibold flex gap-[10px] cursor-pointer place-items-end pb-[10px] items-center`}>
                                        <span className={`flex ${userType}-bg w-[15px] h-[15px] rounded-[3px] justify-center items-center`}><Plus className='text-[#F2F2F2] w-[12px]' /></span>Add Co-Agent
                                    </p>

                                </div>
                                <AddCoAgentDialog
                                    open={openAddDialog}
                                    setOpen={setOpenAddDialog}
                                    setCoAgents={setCoAgent}
                                />

                            </div>
                        </div>
                    </div>

                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="additional">
                <AccordionTrigger className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
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
                                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                type="text"
                            />

                        </div>
                        <div className="col-span-1">
                            <Label className="text-[14px] text-[#424242] " htmlFor="">Square Footage</Label>
                            <Input
                                value={squareFootage}
                                onChange={(e) => handleSquareFootageChange(e.target.value)}
                                readOnly={userType === 'agent'}
                                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                type="number"
                                min="0"
                            />

                        </div>
                        <div className="col-span-3 flex justify-end">
                            <div className="flex items-center space-x-2">
                                <Switch id="update-invoice-appointment" checked={updateInvoice} onCheckedChange={setUpdateInvoice} className="data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-[#E06D5E]" />
                                <Label htmlFor="update-invoice-appointment" className="text-[14px] font-[500] text-[#424242]">Update Invoice</Label>
                            </div>
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
                <AccordionTrigger className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                    Statistics
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                    <div className="w-full flex flex-col items-center mt-[17px]">
                        {currentOrder?.services.map((service, idx) => {
                            return <div key={idx} className='grid grid-cols-4 gap-x-4 mt-[10px]'>
                                <div className='col-span-2'>
                                    <label htmlFor="">Service</label>
                                    <Input
                                        readOnly
                                        value={service.service.name}
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                        type="text"
                                    />

                                </div>
                                <div className="col-span-1">
                                    <Label className="text-[14px] text-[#424242] " htmlFor="">Service Options</Label>
                                    <Input
                                        readOnly
                                        value={service?.option?.title}
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                        type="text"
                                    />

                                </div>
                                <div className="col-span-1 flex justify-between gap-[16px]">
                                    <div>
                                        <Label className="text-[14px] text-[#424242] " htmlFor="">Price</Label>
                                        <Input
                                            readOnly
                                            value={service.amount}
                                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                            type="text"
                                        />

                                    </div>
                                    <div className=''>
                                        <Label className="text-[14px] text-[#424242] " htmlFor="">Delete</Label>
                                        <span className='cursor-pointer flex justify-center items-center h-[42px] w-[50px] rounded-[6px] bg-[#E06D5E] hover:bg-[#f57d6d] mt-[10px]'>
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
                                                <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]">
                                                    <SelectValue placeholder="Select Service" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {servicesData
                                                        .filter((srv) => {
                                                            const nameLower = (srv.name || "").toLowerCase();
                                                            return nameLower !== 'feature sheets';
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
                                                    let newPrice = selectedOption?.amount?.toString() ?? '';

                                                    if (
                                                        (!selectedOption?.sq_ft_range || String(selectedOption.sq_ft_range).trim() === '') &&
                                                        selectedOption?.sq_ft_rate &&
                                                        parseFloat(selectedOption.sq_ft_rate) > 0
                                                    ) {
                                                        const sqFt = parseFloat(squareFootage);
                                                        if (!isNaN(sqFt)) {
                                                            const calculated = parseFloat(selectedOption.sq_ft_rate) * sqFt;
                                                            newPrice = (selectedOption.min_price ? Math.max(calculated, selectedOption.min_price) : calculated).toFixed(2);
                                                        }
                                                    }

                                                    setCalendarServices((prev) =>
                                                        prev.map((srv, i) =>
                                                            i === index ? { ...srv, optionId: val, price: newPrice } : srv
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
                                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                                                />
                                            </div>
                                            <div className='col-span-1 flex justify-between gap-[16px] mt-[28px]'>
                                                <span
                                                    onClick={() =>
                                                        setCalendarServices((prev) => prev.filter((_, i) => i !== index))
                                                    }
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
                        </div>
                    </div>

                </AccordionContent>
            </AccordionItem>
            {userType == 'admin' &&
                <AccordionItem value="Notes">
                    <AccordionTrigger className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                        Additional Notes
                    </AccordionTrigger>
                    <AccordionContent className="grid grid-cols-1 gap-4">
                        <div className="">
                            <div className='flex justify-center h-[60px] items-center bg-[#fff]'>
                                <div className=" w-fit flex border-gray-300 gap-[10px]">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`text-center px-4 py-2 text-[13px] w-[180px] h-[32px] transition-colors ${activeTab === tab
                                                ? `${userType}-bg text-white  rounded-[6px]  font-[500] `
                                                : 'text-[#666666] bg-[#E4E4E4] hover:text-[#666666] rounded-[6px] font-[700] '
                                                }`}
                                        >
                                            {tab.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative mt-[15px]">
                                <div className={`w-full min-h-[150px] max-h-[300px] p-3 rounded-[6px] border border-[#BBBBBB] overflow-y-auto ${isEditingNote ? "bg-white" : "bg-[#E4E4E4]"}`}>
                                    {filteredNotes.length === 0 && !isEditingNote ? (
                                        <p className="text-sm text-gray-500 italic">No notes yet.</p>
                                    ) : (
                                        <>
                                            {filteredNotes.map((n, i) => (
                                                <div key={i} className="mb-3 pb-2 border-b border-[#BBBBBB] last:border-b-0 last:pb-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="font-bold text-xs text-gray-500 select-none">
                                                            {n.name} ({formatTimestamp(n.date)}):
                                                        </div>
                                                        {editingNote !== n && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditNote(n)}
                                                                className="p-1 hover:bg-gray-200 rounded"
                                                                title="Edit Note"
                                                            >
                                                                <Edit2Icon className="w-3.5 h-3.5 text-blue-500" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {editingNote === n ? (
                                                        <div className="flex flex-col gap-2 mt-1">
                                                            <textarea
                                                                className="w-full p-2 border border-[#BBBBBB] rounded bg-white text-sm focus:outline-none"
                                                                value={editNoteText}
                                                                onChange={(e) => setEditNoteText(e.target.value)}
                                                                rows={2}
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    className="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase"
                                                                    onClick={handleCancelEdit}
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="text-xs font-bold uppercase"
                                                                    style={{ color: '#4290E9' }}
                                                                    onClick={() => handleUpdateNote(n)}
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{n.note}</div>
                                                    )}
                                                </div>
                                            ))}
                                            {isEditingNote && (
                                                <div className="mt-2 pt-2 border-t border-dashed border-[#BBBBBB]">
                                                    <div className="font-bold text-xs text-gray-400 mb-1 select-none">
                                                        New Note:
                                                    </div>
                                                    <textarea
                                                        autoFocus
                                                        className="w-full mt-1 p-2 border border-[#BBBBBB] rounded bg-white text-sm focus:outline-none"
                                                        placeholder="Type note here..."
                                                        value={tempNote}
                                                        onChange={(e) => setTempNote(e.target.value)}
                                                        rows={3}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end mt-[10px]">
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (isEditingNote) {
                                            handleSaveNote();
                                        } else {
                                            handleEditClick();
                                        }
                                    }}
                                    className="bg-[#4290E9] border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff]  w-[110px] h-[37px] hover:text-white hover:bg-[#4e9af1]"
                                >
                                    {isEditingNote ? 'SAVE' : 'EDIT'}
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>}
        </Accordion >
    )
}

export default EditAppointmentTab