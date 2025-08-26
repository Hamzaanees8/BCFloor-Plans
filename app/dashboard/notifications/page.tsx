"use client";
import React from 'react'
import QuickViewCard from '@/components/QuickViewCard';
import NotificationTable from '@/components/NotificationTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const notifications = [
    {
        createdby: "Kira Kiravarga",
        Subject: "Standard Photos (20)",
        Address: "1212 Hotel Avenue, New Westminister, BC",
        added: "Mar 14, 2025 05:29 AM",
    },
    {
        createdby: "Aidan Golding",
        Subject: "Standard Photos (30)",
        Address: "1212 Hotel Avenue, New Westminister, BC",
        added: "Mar 14, 2025 05:29 AM",
    },
    {
        createdby: "Al Sorensen",
        Subject: "Standard Photos (20)",
        Address: "1212 Hotel Avenue, New Westminister, BC",
        added: "Mar 14, 2025 05:29 AM",
    },
    {
        createdby: "Janet Janetson",
        Subject: "3D Floor Plans",
        Address: "1212 Hotel Avenue, New Westminister, BC",
        added: "Mar 14, 2025 05:29 AM",
    },
    {
        createdby: "Grayden Grayson",
        Subject: "Commute Payout",
        Address: "1212 Hotel Avenue, New Westminister, BC",
        added: "Mar 14, 2025 05:29 AM",
    },
    {
        createdby: "Test Agent",
        Subject: "Standard Photos (30)",
        Address: "1212 Hotel Avenue, New Westminister, BC",
        added: "Mar 14, 2025 05:29 AM",
    },
    {
        createdby: "Kira Kiravarga",
        Subject: "Standard Photos (30)",
        Address: "1212 Hotel Avenue, New Westminister, BC",
        added: "Mar 14, 2025 05:29 AM",
    },
]


const Page = () => {
    const [showCard, setShowCard] = React.useState(false);
    const [type, setType] = React.useState('');
    // const [showForm, setShowForm] = useState(false)


    console.log('type', type);

    return (
        <div>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]  text-[#4290E9]'>Notifications</p>
                <Select onValueChange={(value) => console.log(value)} >
                    <SelectTrigger className="w-[283px]  h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] [&>svg]:text-[#4290E9] [&>svg]:opacity-100">
                        <SelectValue placeholder="Show All" />
                    </SelectTrigger>
                    <SelectContent className='bg-[#EEEEEE] rounded-none w-full py-[12px] text-[#666666]'>
                        <SelectItem value="allinvoices" className='p-0 px-[16px] mb-[9px]  hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer'>Show All</SelectItem>
                        <SelectItem value="Unpaid" className='p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer'>Unpaid</SelectItem>
                        <SelectItem value="townhouse" className='p-0 px-[16px]  hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer'>Draft</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {
                    <>
                        <div className="w-full">
                            <NotificationTable
                                data={notifications}
                                onQuickView={(selectedType) => {
                                    setShowCard(true);
                                    setType(selectedType);
                                }}
                            />
                            {showCard && (
                                <QuickViewCard
                                    type="notification"
                                    data={{
                                        name: "Kira Kiravarga",
                                        O_id: "#3332",
                                        address: "1254 Burrard Street",
                                        email: "philipp.p@bcfp.com",
                                        mobile: "604-778-1247",
                                        office: "n/a",
                                        P_vendor: "Taylor Tayburn",
                                        P_appointment_date: "05/20/2025",
                                        P_appointment_time: "10:30 AM - 11:30 AM",
                                        P_price: "$165.00",
                                        H_vendor: "Mike M.",
                                        H_appointment_date: "05/20/2025",
                                        H_appointment_time: "10:30 AM - 11:30 AM",
                                        H_price: "$165.00",
                                        total:"$315.00"
                                    }}
                                    onClose={() => setShowCard(false)}
                                />
                            )}


                        </div></>
            }
        </div >
    )
}

export default Page