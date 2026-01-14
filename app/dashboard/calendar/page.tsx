'use client'
import React, { useEffect, useState } from 'react'
import BigCalendar from './components/BigCalendar'
import { MultiSelectDropdown } from './components/MultiSelectDropdown';
import { Get, GetServices, GetVendors } from '../orders/orders';
import { Order } from '../orders/page';
import { Services } from '../services/page';
import dayjs from 'dayjs';
import { Agent } from '@/components/AgentTable';
import { GetAgents } from './calendar';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';

type Vendor = {
    uuid?: string;
    id?: number;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    status?: boolean;
    company?: { uuid: string, company_name: string, vendor_id: string }
    address?: string
    primary_phone?: string;
    secondary_phone?: string;
    company_name: string;
    avatar_url?: string;
    addresses: {
        address_line_1: string;
        country: string;
        city: string;
    }[]
    work_hours: {
        start_time: string;
        end_time: string;
        break_start: string;
        break_end: string;
    }
};

const Page = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [selectedservice, setSelectedservice] = useState<string[]>([]);
    const [selectedDay, setSelectedDay] = useState<string[]>(['7']);
    const [orderData, setOrderData] = useState<Order[]>([]);
    const [vendorData, setVendorData] = useState<Vendor[]>([]);
    const [serviceData, setServiceData] = useState<Services[]>([]);
    const [agentData, setAgentData] = useState<Agent[]>([]);
    const [currentMonthYear, setCurrentMonthYear] = useState({
        month: dayjs().format('MMMM'),
        year: dayjs().format('YYYY'),
    });


    const Days = [
        { label: "7 Days", value: "7" },
        { label: "5 Days", value: "5" },
        { label: "3 Days", value: "3" },
        { label: "1 Days", value: "1" },
        { label: "Monthly", value: "30" },
    ];

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        Get(token)
            .then(data => {
                setOrderData(Array.isArray(data.data) ? data.data : [])

            })
            .catch(err => {
                console.log(err.message)

            })
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        GetVendors(token)
            .then(data => {
                setVendorData(Array.isArray(data.data) ? data.data : [])

            })
            .catch(err => {
                console.log(err.message)

            })
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token")

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetServices(token)
            .then((data) => {
                setServiceData(Array.isArray(data.data) ? data.data : []);
            })
            .catch(err => {
                console.log(err.message);
            })

    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token")

        if (!token) {
            //("Token not found.");
            return;
        }

        GetAgents()
            .then((data) => {
                const allAgents = Array.isArray(data.data) ? data.data : [];
                const filteredAgents = allAgents.filter((agent: Agent) => agent.status === true);
                setAgentData(filteredAgents);
            })
            .catch((err) => console.log("Error fetching data:", err.message));

    }, []);


    return (
        <div>
            <div className='w-full h-[80px] font-alexandria z-10 relative grid grid-cols-4 gap-[10px] grid-rows-1 justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[22px] font-[400] capitalize' style={{ color: roleSettings.pageTabColor }}>Calendar › {currentMonthYear.month} {currentMonthYear.year}</p>
                <MultiSelectDropdown
                    options={serviceData}
                    selected={selectedservice}
                    setSelected={setSelectedservice}
                    title='Select Services'
                    singleSelect={false}
                    type='service'
                />
                <MultiSelectDropdown
                    options={vendorData}
                    selected={selectedVendors}
                    setSelected={setSelectedVendors}
                    title='Select Vendors'
                    singleSelect={false}
                    type='vendor'
                />
                <MultiSelectDropdown
                    options={Days}
                    selected={selectedDay}
                    setSelected={setSelectedDay}
                    title='Select Days'
                    singleSelect={true}
                    type='day'
                />
                <div className='flex gap-[18px]'>
                </div>
            </div>
            <div className='py-[40px]'>
                <BigCalendar orderData={orderData} agentData={agentData} serviceData={serviceData} setCurrentMonthYear={setCurrentMonthYear} vendorData={vendorData} setVendorData={setVendorData} selectedVendors={selectedVendors} selectedservice={selectedservice}
                    setVisibleDays={setSelectedDay}
                    visibleDays={selectedDay}
                />
            </div>
        </div>
    )
}

export default Page