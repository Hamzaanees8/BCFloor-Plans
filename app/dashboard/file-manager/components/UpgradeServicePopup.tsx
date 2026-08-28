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
import { UpdateOrderService } from "../../orders/orders"
import { Order, OrderService } from "../../orders/page"

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
    orderData?: Order | null
    currentBookedService?: OrderService
    onSuccess?: () => void
}

export default function UpgradeServicePopup({
    open,
    setOpen,
    currentService,
    currentOption = null,
    orderData,
    currentBookedService,
    onSuccess,
}: PricingPopupProps) {
    const [selected, setSelected] = React.useState<string | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
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

    const handleUpgrade = async () => {
        if (!selected || !orderData || !currentBookedService || !currentService) {
            toast.error('Missing required data')
            return
        }

        // Find the selected option details
        const selectedOption = currentService?.product_options?.find(opt => opt.uuid === selected)
        if (!selectedOption) {
            toast.error('Selected option not found')
            return
        }

        setIsLoading(true)
        try {
            const token = localStorage.getItem('token') ?? ''

            // Map all services from the order, updating the current one
            const allServices = (orderData.services || []).map(orderService => {
                const fsUuid = (orderService as any).feature_sheet_uuid || (orderService as any).feature_sheet?.uuid;
                const fsId = (orderService as any).feature_sheet_id || (orderService as any).feature_sheet?.id;
                let customName = (orderService as any).custom;

                if (orderService.uuid === currentBookedService.uuid) {
                    if (customName && selectedOption?.title) {
                        if (customName.includes(" - ")) {
                            const baseName = customName.split(" - ")[0];
                            const optionTitle = selectedOption.title.toLowerCase().includes("copies")
                                ? selectedOption.title
                                : `${selectedOption.title} Copies`;
                            customName = `${baseName} - ${optionTitle}`;
                        }
                    }
                    return {
                        service_id: currentService.uuid,
                        option_id: selected,
                        amount: Number(selectedOption.amount ?? 0),
                        uuid: orderService.uuid,
                        custom: customName,
                        feature_sheet_uuid: fsUuid,
                        feature_sheet_id: fsId,
                    }
                }
                return {
                    service_id: orderService.service.uuid,
                    option_id: orderService.option.uuid,
                    amount: Number(orderService.amount),
                    uuid: orderService.uuid,
                    custom: customName,
                    feature_sheet_uuid: fsUuid,
                    feature_sheet_id: fsId,
                }
            })

            await UpdateOrderService(
                orderData.uuid,
                allServices,
                token
            )

            toast.success('Plan upgraded successfully')
            setOpen(false)

            // Call success callback to refresh data
            if (onSuccess) {
                onSuccess()
            }
        } catch (error) {
            console.error('Failed to upgrade service:', error)
            if (error instanceof Error) {
                toast.error(error.message || 'Failed to upgrade service')
            } else {
                toast.error('Failed to upgrade service')
            }
        } finally {
            setIsLoading(false)
        }
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
                                        disabled={isLoading}
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
                    className={`w-full mt-4 ${userType}-bg hover-${userType}-bg text-white hover:brightness-90 hover:!text-white border-none`}
                    onClick={handleUpgrade}
                    disabled={!selected || isLoading}
                >
                    {isLoading ? 'Upgrading...' : 'Upgrade'}
                </Button>
            </DialogContent>
        </Dialog>
    )
}
