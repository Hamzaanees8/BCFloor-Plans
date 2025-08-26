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
import { X } from "lucide-react"
import WarningIcon from "./Icons"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    onConfirm: () => void
}

const CloseDialog: React.FC<Props> = ({
    open,
    setOpen,
    onConfirm,
}) => {
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[563px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
                <AlertDialogHeader className="mb-2">
                    <AlertDialogTitle className="flex items-center justify-between text-[#4290E9] text-[18px] font-[600] border-b-[1px] border-[#E4E4E4]">
                        CONFIRM CLOSING YOUR ACCOUNT
                        <AlertDialogCancel className="border-none !shadow-none">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>

                <div className="flex items-start gap-3">
                    <div className="w-fit">
                        <WarningIcon width={48} />
                    </div>
                    <AlertDialogDescription className="text-[16px] font-[400] text-[#666666]">
                        <div className="flex flex-col gap-y-4">
                            <p className="font-bold">Are you sure you want to take this action?</p>
                            <p>Closing your account, you will lose access to all files, communications, and settings. You can download all files for offline records.</p>
                        </div>
                    </AlertDialogDescription>
                </div>
                <hr className="w-full h-[1px] text-[#BBBBBB] my-4" />
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
                        OK
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default CloseDialog
