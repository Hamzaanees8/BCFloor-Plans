import DynamicMap from '@/components/DYnamicMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import dayjs from 'dayjs';

import React, { useEffect, useState } from 'react'
import { Order } from '../../orders/page';
import AddNotesDialog from './AddNotesDialog';
import { useAppContext } from '@/app/context/AppContext';
interface Notes {
    name: string;
    note: string;
    date: string
}
interface CoAgent {
    name: string;
    email?: string
}
interface AppointmentTab {
    currentOrder?: Order;
    serviceId: number
}
function AppointmentTab({ currentOrder, serviceId }: AppointmentTab) {
    const { userType } = useAppContext();
    const [agent, setAgent] = useState("");
    const [company, setCompany] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [coAgent, setCoAgent] = useState<CoAgent[]>([]);
    const [firstCoAgentName, setFirstCoAgentName] = useState("");
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
    console.log('notes', notes);
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
                setFirstCoAgentName(parsed[0]?.name ?? "");
            } else {
                setCoAgent([]);
                setFirstCoAgentName("");
            }
        } catch (error) {
            console.error("Invalid co_agents:", error);
            setCoAgent([]);
            setFirstCoAgentName("");
        }


    }, [currentOrder, serviceId])
    return (
        <div className=" w-full grid grid-cols-2 gap-4">
            <div className="col-span-1 font-alexandria">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Agent</Label>
                <Input
                    readOnly
                    value={agent}

                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Company</Label>
                <Input
                    readOnly
                    value={company}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Contact Number</Label>
                <Input
                    readOnly
                    value={contactNumber}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Contact Email</Label>
                <Input
                    readOnly
                    value={contactEmail}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Co-Agent</Label>
                <Input
                    readOnly
                    value={firstCoAgentName}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Contact Number</Label>
                <Input
                    readOnly
                    // value={address}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Co Agent Email</Label>
                <Input
                    readOnly
                    // value={address}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-2">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Agent Notes (Not Viewable by Agent)</Label>
                <Textarea
                    // value={address}
                    className=" bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] resize-none h-[100px] "

                />

            </div>
            <div className="col-span-2">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Vendor</Label>
                <Input
                    readOnly
                    value={vendor}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Services</Label>
                <Input
                    readOnly
                    value={services}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Service Option</Label>
                <Input
                    readOnly
                    value={serviceOption}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>

            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Date</Label>
                <Input
                    readOnly
                    value={date}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Time</Label>
                <Input
                    readOnly
                    value={time}
                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                    type="text"
                />

            </div>
            <div className="col-span-1">
                <Label className="text-[14px] text-[#424242] " htmlFor="">Listing</Label>
                <Input
                    readOnly
                    value={listing}
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
                ))}

                <div className="flex justify-end mt-[10px]">
                    <Button
                        onClick={() => { setOpenAddNotesDialog(true) }}
                        className={`${userType}-bg ${userType}-border text-[14px] flex justify-center items-center text-[#fff]  w-[110px] h-[37px] hover:text-white hover-${userType}-bg hover:opacity-95`}
                    >Add Note</Button>
                </div>
                <AddNotesDialog
                    isInternal={false}
                    open={openAddNotesDialog}
                    setOpen={setOpenAddNotesDialog}
                    notes={notes}
                    setNotes={setNotes}
                />
            </div>
        </div>
    )
}

export default AppointmentTab