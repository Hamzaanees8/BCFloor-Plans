"use client";
import React, { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BillingDialog from '@/components/BillingDialog';
import { useAppContext } from '@/app/context/AppContext';


const billings = [
    {
        id: "0001",
        createdby: "Kira Kiravarga",
        ServicesOrdered: "Standard Photos (20)",
        ServiceTime: "Mar 23  9:00 AM - 10:00 AM",
        total: "$1119.00",
        status: "UNPAID",
        added: "Mar 14, 2025",
    },
    {
        id: "0010",
        createdby: "Aidan Golding",
        ServicesOrdered: "Standard Photos (30)",
        ServiceTime: "Mar 23  9:00 AM - 10:00 AM",
        total: "$50.00",
        status: "UNPAID",
        added: "Mar 14, 2025",
    },
    {
        id: "0015",
        createdby: "Al Sorensen",
        ServicesOrdered: "Standard Photos (20)",
        ServiceTime: "Mar 23  9:00 AM - 10:00 AM",
        total: "$300.00",
        status: "Arrears",
        added: "Mar 14, 2025",
    },
    {
        id: "0022",
        createdby: "Janet Janetson",
        ServicesOrdered: "3D Floor Plans",
        ServiceTime: "Mar 23  9:00 AM - 10:00 AM",
        total: "$780.00",
        status: "PAID",
        added: "Mar 14, 2025",
    },
    {
        id: "0122",
        createdby: "Grayden Grayson",
        ServicesOrdered: "Commute Payout",
        ServiceTime: "Mar 23  9:00 AM - 10:00 AM",
        total: "$5000.00",
        status: "PAID",
        added: "Mar 14, 2025",
    },
    {
        id: "0125",
        createdby: "Test Agent",
        ServicesOrdered: "Standard Photos (30)",
        ServiceTime: "Mar 23  9:00 AM - 10:00 AM",
        total: "$230.00",
        status: "UNPAID",
        added: "Mar 14, 2025",
    },
    {
        id: "0001",
        createdby: "Kira Kiravarga",
        ServicesOrdered: "Standard Photos (30)",
        ServiceTime: "Mar 23  9:00 AM - 10:00 AM",
        total: "$780.00",
        status: "PAID",
        added: "Mar 14, 2025",
    },
]


const Page = () => {
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
    const [showAgain, setShowAgain] = useState(true)
    const { userType } = useAppContext()

    const confirmAndExecute = () => {
        pendingAction?.()
        setPendingAction(null)
    }


    // const handleQuickView = () => {
    //     setShowCard(true);
    // };
    // const options = [
    //     { label: "Edit", onClick: () => console.log("Edit clicked") },
    //     {
    //         label: "Quick View", onClick: () => {
    //             handleQuickView()
    //             setType("listing")
    //         }
    //     },
    //     {
    //         label: "Delete",
    //         onClick: () => console.log("Deleted!"),
    //         confirm: true,
    //     },
    // ];

    return (
        <div>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }}
            >
                <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}>Billing (5)</p>
                <Select onValueChange={(value) => console.log(value)} >
                    <SelectTrigger className={`w-[174px]  h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : userType === 'agent' ? '[&>svg]:text-[#6BAE41]' : '[&>svg]:text-[#4290E9]'}  [&>svg]:opacity-100`}>
                        <SelectValue placeholder="All Invoices" />
                    </SelectTrigger>
                    <SelectContent className='bg-[#EEEEEE] rounded-none w-full py-[12px] text-[#666666]'>
                        <SelectItem value="allinvoices" className='p-0 px-[16px] mb-[9px]  hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer'>All Invoices</SelectItem>
                        <SelectItem value="Unpaid" className='p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer'>Unpaid</SelectItem>
                        <SelectItem value="townhouse" className='p-0 px-[16px]  hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer'>Draft</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full relative">
                <Table className='font-alexandria px-0 overflow-x-auto whitespace-nowrap'>
                    <TableHeader >
                        <TableRow className='bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]'>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">#</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Created By</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Services Ordered</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Service Time</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Total</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">Status</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Added</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {billings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5}>No billings available.</TableCell>
                            </TableRow>
                        ) : (
                            billings.map((billing, i) => (
                                <TableRow key={i} onClick={() => { setConfirmOpen(true) }}>
                                    <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">{billing.id}</TableCell>
                                    <TableCell className={`text-[15px] py-[19px] font-[400] ${userType}-text`}>{billing.createdby}</TableCell>
                                    <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D] ">{billing.ServicesOrdered}</TableCell>
                                    <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">{billing.ServiceTime}</TableCell>
                                    <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">{billing.total}</TableCell>
                                    <TableCell className="text-[10px] py-[19px] px-[20px] text-center font-[400] text-[#7D7D7D] ">
                                        <label
                                            className={`px-[7px] py-[1.5px] text-white rounded-[10px] leading-[100%] ${billing.status === "PAID" ? "!bg-[#6BAE41]" : billing.status === "UNPAID" ? "!bg-[#DC9600]" : billing.status === "Arrears" ? "!bg-[#E06D5E]" : ""}`}>
                                            {billing.status}
                                        </label>
                                    </TableCell>
                                    <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">{billing.added}</TableCell>
                                </TableRow>
                            ))
                        )}

                    </TableBody>
                </Table>

            </div>
            <BillingDialog
                open={confirmOpen}
                setOpen={setConfirmOpen}
                onConfirm={confirmAndExecute}
                showAgain={showAgain}
                toggleShowAgain={() => setShowAgain(!showAgain)}
            />
        </div >
    )
}

export default Page