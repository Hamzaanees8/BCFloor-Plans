// components/ConfirmationDialog.tsx
"use client"

import React from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { CheckCircle, Circle, Trash, X } from "lucide-react"
import { Admin } from "./AdminTable"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    onConfirm: () => void
    showAgain: boolean
    toggleShowAgain: () => void
    data: Admin[]
}

const MergeDialog: React.FC<Props> = ({
    open,
    setOpen,
    onConfirm,
    data
}) => {
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[593px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria max-w-[593px]">
                <AlertDialogHeader className="mb-2">
                    <AlertDialogTitle className="flex items-center justify-between text-[#4290E9] text-[18px] font-[600] border-b-[1px] border-[#E4E4E4]">
                        MERGE CONTACTS?
                        <AlertDialogCancel className="border-none !shadow-none">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>

                <div className="flex items-start">

                    <AlertDialogDescription className="text-[15px] font-[400] text-[#666666] font-alexandria" >
                        This selected users share duplicate data. Chose to combine the selected users or delete Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </AlertDialogDescription>
                </div>
                <div className="flex items-start gap-x-[16px] p-2 w-full border border-[#6BAE41]">
                    <CheckCircle className="w-[32px] h-[32px] text-[#6BAE41]" />
                    <div className="flex flex-col text-[16px] text-[#666666]">
                        <p className="font-normal">{data[0]?.full_name}</p>
                        <p className="font-normal">{data[0]?.address || ' '}</p>
                        <p className="font-normal">{data[0]?.created_at}</p>
                        <p className="font-bold">16 orders</p>
                    </div>
                </div>
                <div className="flex items-start gap-x-[16px] p-2 w-full border border-[#BBBBBB]">
                    <Circle className="w-[32px] h-[32px] text-[#4290E9]" />
                    <div className="flex justify-between w-full">
                        <div className="flex flex-col text-[16px] text-[#666666]">
                            <p className="font-normal">{data[1]?.full_name}</p>
                            <p className="font-normal">{data[1]?.address}</p>
                            <p className="font-normal">{data[1]?.created_at}</p>
                            <p className="font-bold">2 orders</p>
                        </div>
                        <Trash className="text-[#E06D5E] cursor-pointer" />
                    </div>

                </div>

                <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria">
                    <AlertDialogCancel className="bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[170px] h-[44px] font-[400] text-[20px]"
                        onClick={() => {
                            onConfirm()
                            setOpen(false)
                        }}
                    >
                        Merge
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default MergeDialog
