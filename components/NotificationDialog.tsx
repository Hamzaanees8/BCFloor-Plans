"use client"

import React, { useState } from "react"
import { CheckCircle, Circle, Loader2, Trash, X } from "lucide-react"
import { useAppContext } from "@/app/context/AppContext"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    onConfirm: () => Promise<void> | void
    showAgain: boolean
    toggleShowAgain: () => void
}

const NotificationDialog: React.FC<Props> = ({
    open,
    setOpen,
    onConfirm,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await onConfirm();
            setOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    const { userType } = useAppContext();
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="w-[320px] md:w-[593px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria max-w-[593px] [&>button]:hidden"
                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            >
                <DialogHeader className="mb-2">
                    <DialogTitle className="flex items-center justify-between text-[#4290E9] text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2">
                        NOT CONTACTS?
                        <Button onClick={() => setOpen(false)} className="bg-transparent hover:bg-transparent border-none !shadow-none">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-start">

                    <DialogDescription className="text-[15px] font-[400] text-[#666666] font-alexandria" >
                        This selected users share duplicate data. Chose to combine the selected users or delete Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </DialogDescription>
                </div>
                <div className="flex items-start gap-x-[16px] p-2 w-full border border-[#6BAE41]">
                    <CheckCircle className="w-[32px] h-[32px] text-[#6BAE41]" />
                    <div className="flex flex-col text-[16px] text-[#666666]">
                        <p className="font-normal">Adam Adamson</p>
                        <p className="font-normal">7848 Main Boulevard</p>
                        <p className="font-normal">Feb 22, 2024</p>
                        <p className="font-bold">16 orders</p>
                    </div>
                </div>
                <div className="flex items-start gap-x-[16px] p-2 w-full border border-[#BBBBBB]">
                    <Circle className="w-[32px] h-[32px] text-[#4290E9]" />
                    <div className="flex justify-between w-full">
                        <div className="flex flex-col text-[16px] text-[#666666]">
                            <p className="font-normal">Adam Adamson</p>
                            <p className="font-normal">7848 Main Boulevard</p>
                            <p className="font-normal">Feb 22, 2024</p>
                            <p className="font-bold">2 orders</p>
                        </div>
                        <Trash className="text-[#E06D5E] cursor-pointer" />
                    </div>

                </div>

                <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria">
                    <Button className="bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                        Cancel
                    </Button>
                    <Button
                        disabled={isLoading}
                        className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[170px] h-[44px] font-[400] text-[20px]"
                        onClick={handleConfirm}
                    >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Notification"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default NotificationDialog
