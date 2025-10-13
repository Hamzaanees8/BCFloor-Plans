import DynamicMap from '@/components/DYnamicMap';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { Order } from '../../orders/page';
import { Agent } from '@/components/AgentTable';
import { Button } from '@/components/ui/button';
import { GetServices } from '../../orders/orders';
import { Services } from '../../services/page';
import { useAppContext } from '@/app/context/AppContext';
import { AddCoAgentDialog } from '../../calendar/components/AddCoAgnets';
import AddNotesDialog from '../../calendar/components/AddNotesDialog';
import { useOrderContext } from '../context/OrderContext';
import Schedule from '../../calendar/components/Schedule';

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
}
function EditAppointmentTab({ currentOrder, agentData, notes, setNotes, coAgent, setCoAgent }: AppointmentTab) {
    const { userType } = useAppContext();
    const [agent, setAgent] = useState(currentOrder?.agent.uuid ?? '');
    const [contactNumber, setContactNumber] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [openAddNotesDialog, setOpenAddNotesDialog] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [listing, setListing] = useState("");
    const [squareFootage, setSquareFootage] = useState("");
    const [servicesData, setServicesData] = useState<Services[]>([]);

    const { setCalendarServices, calendarServices } = useOrderContext();
    console.log('currentOrder', currentOrder);

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
    }, [currentOrder, agentData, currentAgent])
    console.log('notes', notes);
    const tabs =
        userType === 'admin'
            ? ['Notes', 'Internal Notes']
            : [];
    const [activeTab, setActiveTab] = useState('Notes')
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
                                readOnly
                                value={squareFootage}
                                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
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
                                                    {servicesData.map((srv) => (
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
                            {notes?.map((note, index) => (
                                <div
                                    key={index}
                                    className="w-full p-3 rounded-[6px] bg-[#E4E4E4] border border-[#BBBBBB] relative whitespace-pre-wrap break-words mt-[15px]"
                                >

                                    <p className="text-sm text-[#333]">{note.note}</p>

                                    <div className="mt-2 text-right text-[#8E8E8E] text-[13px] font-[400] leading-tight">
                                        <p>{new Date(note.date).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}</p>
                                        <p>{note.name}</p>
                                    </div>
                                </div>
                            ))
                            }
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
                                isInternal={activeTab === 'Internal Notes' ? true : false}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>}
        </Accordion >
    )
}

export default EditAppointmentTab