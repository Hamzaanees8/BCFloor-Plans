"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import WarningIcon from "@/components/Icons"
import { useWhiteLabel } from "@/app/context/Whitelabel"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    onConfirm: () => Promise<void> | void
}

const ResetConfirmationDialog: React.FC<Props> = ({
    open,
    setOpen,
    onConfirm,
}) => {
    const { currentSettings, activeTab } = useWhiteLabel();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await onConfirm();
            setOpen(false);
        } catch (error) {
            console.error("Error resetting settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[320px] md:w-[593px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria [&>button]:hidden">
                <DialogHeader className="mb-2">
                    <DialogTitle className="flex items-center justify-between text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2 uppercase" style={{ color: currentSettings.pageTabColor }}>
                        CONFIRMATION
                        <Button variant="ghost" className="border-none !shadow-none p-0 h-fit bg-transparent hover:bg-transparent" onClick={() => setOpen(false)}>
                            <X className="w-[20px] h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-start gap-4 py-2">
                    <div className="w-fit shrink-0">
                        <WarningIcon width={48} />
                    </div>
                    <DialogDescription className="text-[14px] md:text-[16px] font-[400] text-[#666666] leading-relaxed">
                        Are you sure you want to reset all <span className="capitalize">{activeTab}</span> white label settings to their default values? This action cannot be undone and you will have to re-enter the information.
                    </DialogDescription>
                </div>

                <div className="mt-4 border-b-[1px] border-[#E4E4E4] w-full" />

                <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[10px] mt-4 font-alexandria">
                    <Button
                        onClick={() => setOpen(false)}
                        className="bg-white w-full md:w-[170px] h-[44px] text-[18px] md:text-[20px] font-[400] border hover:bg-gray-50 flex items-center justify-center transition-all shadow-none outline-none"
                        style={{
                            color: currentSettings.pageTabColor,
                            borderColor: currentSettings.pageTabColor
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isLoading}
                        className="text-white w-full md:w-[170px] h-[44px] font-[400] text-[18px] md:text-[20px] hover:opacity-90 transition-all border-none flex items-center justify-center shadow-none outline-none"
                        style={{ backgroundColor: currentSettings.pageTabColor }}
                        onClick={handleConfirm}
                    >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "OK"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ResetConfirmationDialog
