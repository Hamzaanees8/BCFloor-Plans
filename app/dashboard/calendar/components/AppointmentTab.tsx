import DynamicMap from '@/components/DYnamicMap';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import dayjs from 'dayjs';

import React, { useEffect, useState } from 'react'
import { Order } from '../../orders/page';
import AddNotesDialog from './AddNotesDialog';
import Link from 'next/link';
import { useAppContext } from '@/app/context/AppContext';
interface Notes {
    name: string;
    note: string;
    date: string
    internal?: string
}
interface CoAgent {
    name: string;
    email?: string
}
interface AppointmentTab {
    currentOrder?: Order;
    serviceId: number;
    disabled?: boolean;
}
function AppointmentTab({ currentOrder, serviceId, disabled }: AppointmentTab) {
    const { userType } = useAppContext();
    const [agent, setAgent] = useState("");
    const [company, setCompany] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [coAgent, setCoAgent] = useState<CoAgent[]>([]);
    // const [coAgentEmail, setCoAgentEmail] = useState("");
    // const [agentNotes, setAgentNotes] = useState("");
    const [vendor, setVendor] = useState("");
    const [services, setServices] = useState("");
    const [serviceOption, setServiceOption] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [listing, setListing] = useState("");
    const [squareFootage, setSquareFootage] = useState("");
    const [notes, setNotes] = useState<Notes[]>([]);
    const [openAddNotesDialog, setOpenAddNotesDialog] = useState(false);
    console.log('coAgent', coAgent);

    useEffect(() => {

        setAgent(currentOrder?.agent?.first_name
            ? `${currentOrder.agent.first_name} ${currentOrder.agent.last_name}`
            : ''
        );
        setCompany(currentOrder?.agent?.company_name ?? '')
        setContactNumber(currentOrder?.agent.primary_phone ?? '')
        setContactEmail(currentOrder?.agent?.email ?? '')
        setContactNumber(currentOrder?.agent?.primary_phone ?? '')
        const currentVendor = currentOrder?.slots.find((slots) => {
            return slots.service_id == serviceId
        })
        const currentServiceSlots = currentOrder?.slots.filter((slots) => {
            return slots.service_id == serviceId
        })
        if (currentServiceSlots && currentServiceSlots.length > 0) {
            const formattedDate = dayjs(currentServiceSlots[0].date).format('dddd, MMMM D');
            const sortedSlots = [...currentServiceSlots].sort((a, b) =>
                a.start_time.localeCompare(b.start_time)
            );

            const startTime = dayjs(`${currentServiceSlots[0].date}T${sortedSlots[0].start_time}`).format('h:mm A');
            const endTime = dayjs(`${currentServiceSlots[0].date}T${sortedSlots[sortedSlots.length - 1].end_time}`).format('h:mm A');
            const timeRange = `${startTime} - ${endTime}`;

            setTime(timeRange)
            setDate(formattedDate)
        }
        const currentService = currentOrder?.services.find((service) => {
            return service.service.id == serviceId
        })

        setServices(currentService?.service?.name ?? '')
        setVendor(currentVendor?.vendor?.first_name ?
            `${currentVendor?.vendor?.first_name} ${currentVendor?.vendor?.last_name}`
            : ''
        )
        setServiceOption(currentService?.option?.title ?? '')
        setListing(currentOrder?.property ? `${currentOrder?.property.address}, ${currentOrder?.property.city}, ${currentOrder?.property.province}` : '')
        setSquareFootage(String(currentOrder?.property?.square_footage))
        if (Array.isArray(currentOrder?.notes)) {
            setNotes(currentOrder.notes as unknown as Notes[]);
        } else if (typeof currentOrder?.notes === 'string') {
            try {
                setNotes(JSON.parse(currentOrder.notes) as Notes[]);
            } catch (e) {
                console.error("Failed to parse notes:", e);
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
                // setFirstCoAgentName(parsed[0]?.name ?? "");
            } else {
                setCoAgent([]);
                // setFirstCoAgentName("");
            }
        } catch (error) {
            console.error("Invalid co_agents:", error);
            setCoAgent([]);
            // setFirstCoAgentName("");
        }


    }, [currentOrder, serviceId])
    return (
        <div className={`w-full grid grid-cols-2 gap-4 ${disabled ? 'pointer-events-none opacity-70 cursor-not-allowed select-none' : ''}`}>
            <div className="col-span-1 font-alexandria">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Agent</Label>
                <Input
                    readOnly
                    value={agent}

                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Company</Label>
                <Input
                    readOnly
                    value={company}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Contact Number</Label>
                <Input
                    readOnly
                    value={contactNumber}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Contact Email</Label>
                <Input
                    readOnly
                    value={contactEmail}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            {/* <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Co-Agent</Label>
                <Input
                    readOnly
                    value={firstCoAgentName}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Contact Number</Label>
                <Input
                    readOnly
                    // value={address}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Co Agent Email</Label>
                <Input
                    readOnly
                    // value={address}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div> */}
            {coAgent.length > 0 ? (
                <div className="col-span-2 border border-[#BBBBBB] mt-[12px] bg-white overflow-hidden w-full rounded-[10px]">
                    <div className="grid grid-cols-5 gap-2 px-2 py-3 text-sm text-[#666666] font-semibold items-center border-b border-[#BBBBBB]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                        <div className="col-span-2">NAME</div>
                        <div className="col-span-3">EMAIL</div>
                    </div>
                    {Array.isArray(coAgent) && coAgent.map((agent, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2 px-2 py-3 border-b border-[#BBBBBB] items-center hover:bg-[#F9F9F9]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                            <div className="col-span-2 text-[#666666] text-xs break-words truncate" title={agent.name}>{agent.name}</div>
                            <div className="col-span-3 text-[#666666] text-xs truncate" title={agent.email}>{agent.email}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="col-span-2 flex justify-center items-center h-20 text-[#666666] text-xs border border-[#BBBBBB] mt-[12px] rounded-[10px]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                    No co-agents added.
                </div>
            )}
            {userType !== 'agent' && (
                <div className="col-span-2">
                    <Label className="text-[14px] text-[#424242] " htmlFor="">Agent Notes (Not Viewable by Agent)</Label>
                    <Textarea
                        // value={address}
                        className=" border-[1px] border-[#BBBBBB] mt-[10px] resize-none h-[100px] "
                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}

                    />

                </div>
            )}
            <div className="col-span-2">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Vendor</Label>
                <Input
                    readOnly
                    value={vendor}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Services</Label>
                <Input
                    readOnly
                    value={services}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Service Option</Label>
                <Input
                    readOnly
                    value={serviceOption}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>

            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Date</Label>
                <Input
                    readOnly
                    value={date}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Time</Label>
                <Input
                    readOnly
                    value={time}
                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Listing</Label>
                <Input
                    readOnly
                    value={listing}
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
            <div className="w-full h-[300px] col-span-2">
                <DynamicMap
                    address={currentOrder?.property.address}
                    city={currentOrder?.property.city}
                    province={currentOrder?.property.province}
                    country={currentOrder?.property.country ? currentOrder?.property.country : ""}
                />
            </div>
            <div className="col-span-2">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Notes</Label>
                {notes?.filter(note => userType !== 'agent' || note.internal !== 'true').map((note, index) => (
                    <div
                        key={index}
                        className="w-full p-3 rounded-[6px] border border-[#BBBBBB] relative whitespace-pre-wrap break-words mt-[15px]"
                        style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
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
                ))}

                <div className="flex justify-end mt-[10px]">
                    {/* <Button
                        onClick={() => { setOpenAddNotesDialog(true) }}
                        className={`${userType}-bg ${userType}-border text-[14px] flex justify-center items-center text-[#fff]  w-[110px] h-[37px] hover:text-white hover-${userType}-bg hover:opacity-95`}
                    >Add Note</Button> */}
                </div>
                <AddNotesDialog
                    isInternal={false}
                    open={openAddNotesDialog}
                    setOpen={setOpenAddNotesDialog}
                    notes={notes}
                    setNotes={setNotes}
                />

                <div
                    className='mt-[40px]'>
                    <Link
                        href={`/dashboard/file-manager/${currentOrder?.uuid}?listingId=${currentOrder?.property?.uuid}`}
                        className="bg-[#4290E9] rounded-[6px] border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff] w-[110px] h-[37px] hover:text-white hover:bg-[#4e9af1]"
                    >Media</Link>

                </div>
            </div>
        </div>
    )
}

export default AppointmentTab