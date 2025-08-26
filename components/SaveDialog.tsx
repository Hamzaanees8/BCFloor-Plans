// components/ConfirmationDialog.tsx
"use client"

import React from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { CircleCheckBig, X } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
}

const SaveDialog: React.FC<Props> = ({
    open,
    setOpen,
}) => {
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[416px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center justify-between text-[#4290E9] text-[18px] font-[600]">
                        SAVING .....
                        <AlertDialogCancel className="border-none !shadow-none">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="flex flex-col gap-y-4">
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-fit">
                            <CircleCheckBig className="w-[72px] h-[72px] text-[#6BAE41]" />
                        </div>
                        <AlertDialogDescription className="text-[14px] font-[400] text-[#666666]">
                            Successfully Saved!
                        </AlertDialogDescription>
                    </div>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                    <Link href={"/dashboard/admin"}>
                        <Button className="w-full bg-[#4290E9] font-raleway font-semibold text-[20px] text-center hover:bg-[#4290E1]">
                            Go to Admin Page
                        </Button>
                    </Link>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default SaveDialog
