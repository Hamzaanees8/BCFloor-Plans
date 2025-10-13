"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Services } from "../../services/page"
import { useAppContext } from "@/app/context/AppContext"
import { toast } from "sonner"

type OptionShape = {
    uuid: string
    title: string
    amount: string
}

interface PricingPopupProps {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    currentService?: Services
    currentOption?: OptionShape | null
    onConfirm?: (selectedUuid: string | null) => void
}

export default function UpgradeServicePopup({
    open,
    setOpen,
    currentService,
    currentOption = null,
    onConfirm,
}: PricingPopupProps) {
    const [selected, setSelected] = React.useState<string | null>(null)
    const { userType } = useAppContext()

    React.useEffect(() => {
        if (open) {
            setSelected(currentOption?.uuid ?? null)
        }
    }, [open, currentOption?.uuid])

    const handleCheckedChange = (optUuid: string) => (checked: boolean | "indeterminate") => {
        if (checked === true) {
            setSelected(optUuid)
        } else {
            setSelected(null)
        }
    }
    console.log('currentOption', currentOption);

    const handleUpgrade = () => {
        onConfirm?.(selected ?? null)
        toast.success('Plan upgraded successfully')
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[320px] p-4 rounded-none text-[#666]">
                <DialogHeader className="mt-2">
                    {/* <DialogTitle className="text-lg font-semibold">Upgrade Service</DialogTitle> */}
                </DialogHeader>

                <Select value={currentService?.uuid}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={currentService?.name} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={currentService?.uuid ?? ''}>{currentService?.name}</SelectItem>
                    </SelectContent>
                </Select>

                <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-600">Pricing Options</p>
                    <div className="space-y-2">
                        {currentService?.product_options?.map((opt) => (
                            <label
                                key={opt.uuid}
                                className="flex items-center justify-between rounded-md  py-1 hover:bg-gray-100 cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selected === opt.uuid}
                                        onCheckedChange={handleCheckedChange(opt.uuid ?? '')}
                                        className={`${userType === "admin"
                                            ? "data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                                            : userType === "agent"
                                                ? "data-[state=checked]:bg-[#6BAE41] data-[state=checked]:border-[#6BAE41]"
                                                : "data-[state=checked]:bg-[#d88a00] data-[state=checked]:border-[#d88a00]"
                                            } data-[state=checked]:text-white`}
                                    />
                                    <span>{opt.title}</span>
                                </div>
                                <span className="font-medium">${opt.amount}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Upgrade Button */}
                <Button
                    className={`w-full mt-4 ${userType}-bg hover-${userType}-bgtext-white`}
                    onClick={handleUpgrade}
                    disabled={!selected} // optional: disable if nothing selected
                >
                    Upgrade
                </Button>
            </DialogContent>
        </Dialog>
    )
}
