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
import WarningIcon from "@/components/Icons"
import { useWhiteLabel } from "@/app/context/Whitelabel"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    onConfirm: () => void
}

const ResetConfirmationDialog: React.FC<Props> = ({
    open,
    setOpen,
    onConfirm,
}) => {
    const { currentSettings, activeTab } = useWhiteLabel();

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[593px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
                <AlertDialogHeader className="mb-2">
                    <AlertDialogTitle className="flex items-center justify-between text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2 uppercase" style={{ color: currentSettings.pageTabColor }}>
                        CONFIRMATION
                        <AlertDialogCancel className="border-none !shadow-none p-0 h-fit bg-transparent hover:bg-transparent shadow-none">
                            <X className="w-[20px] h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>

                <div className="flex items-start gap-4 py-2">
                    <div className="w-fit shrink-0">
                        <WarningIcon width={48} />
                    </div>
                    <AlertDialogDescription className="text-[14px] md:text-[16px] font-[400] text-[#666666] leading-relaxed">
                        Are you sure you want to reset all <span className="capitalize">{activeTab}</span> white label settings to their default values? This action cannot be undone and you will have to re-enter the information.
                    </AlertDialogDescription>
                </div>

                <div className="mt-4 border-b-[1px] border-[#E4E4E4] w-full" />

                <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[10px] mt-4 font-alexandria">
                    <AlertDialogCancel
                        className="bg-white w-full md:w-[170px] h-[44px] text-[18px] md:text-[20px] font-[400] border hover:bg-gray-50 flex items-center justify-center transition-all shadow-none outline-none"
                        style={{
                            color: currentSettings.pageTabColor,
                            borderColor: currentSettings.pageTabColor
                        }}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="text-white w-full md:w-[170px] h-[44px] font-[400] text-[18px] md:text-[20px] hover:opacity-90 transition-all border-none flex items-center justify-center shadow-none outline-none"
                        style={{ backgroundColor: currentSettings.pageTabColor }}
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

export default ResetConfirmationDialog
