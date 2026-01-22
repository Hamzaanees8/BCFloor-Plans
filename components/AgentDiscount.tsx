import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

interface AgentDiscountData {
    uuid?: string;
    discount_code?: string;
    expiry_date: string | null;
    description?: string;
    name?: string;
    amount?: number;
    is_percentage?: 1 | 0;
    minimum_orders?: number;
    minimum_spend?: number;
    is_active?: 1 | 0;
}

interface Props {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    addDiscount: (discount: AgentDiscountData) => void;
    isDetailed?: boolean;
    initialData?: AgentDiscountData | null;
}

const AgentDiscount: React.FC<Props> = ({ open, setOpen, addDiscount, isDetailed = false, initialData = null }) => {
    const [discountCode, setDiscountCode] = useState("");
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
    const [description, setDescription] = useState("");
    const [discountName, setDiscountName] = useState("");
    const [discountType, setDiscountType] = useState("percentage");
    const [discountValue, setDiscountValue] = useState("");
    const [minOrderCount, setMinOrderCount] = useState("");
    const [minAmountSpend, setMinAmountSpend] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [uuid, setUuid] = useState<string | undefined>(undefined);

    const { userType } = useAppContext()

    React.useEffect(() => {
        if (open && initialData) {
            setUuid(initialData.uuid);
            setDiscountCode(initialData.discount_code || "");
            setExpiryDate(initialData.expiry_date ? new Date(initialData.expiry_date) : undefined);
            setDescription(initialData.description || "");
            setDiscountName(initialData.name || "");
            setDiscountType(initialData.is_percentage === 1 ? "percentage" : "amount");
            setDiscountValue(initialData.amount?.toString() || "");
            setMinOrderCount(initialData.minimum_orders?.toString() || "");
            setMinAmountSpend(initialData.minimum_spend?.toString() || "");
            setIsActive(initialData.is_active === 1);
        } else if (open && !initialData) {
            setUuid(undefined);
            setDiscountCode("");
            setExpiryDate(undefined);
            setDescription("");
            setDiscountName("");
            setDiscountType("percentage");
            setDiscountValue("");
            setMinOrderCount("");
            setMinAmountSpend("");
            setIsActive(true);
        }
    }, [open, initialData]);

    const handleAdd = () => {
        if (isDetailed) {
            if (!discountName || !discountValue) {
                toast.error("Discount name and amount are required");
                return;
            }
            addDiscount({
                uuid: uuid,
                name: discountName,
                description: description,
                expiry_date: expiryDate ? format(expiryDate, "yyyy-MM-dd") : null,
                amount: Number(discountValue),
                is_percentage: discountType === "percentage" ? 1 : 0,
                minimum_orders: minOrderCount ? Number(minOrderCount) : undefined,
                minimum_spend: minAmountSpend ? Number(minAmountSpend) : undefined,
                is_active: isActive ? 1 : 0
            });
        } else {
            if (!discountCode) return;
            addDiscount({
                uuid: uuid,
                discount_code: discountCode,
                expiry_date: expiryDate ? format(expiryDate, "yyyy-MM-dd") : null,
                description: description,
            });
        }

        setDiscountCode("");
        setExpiryDate(undefined);
        setDescription("");
        setDiscountName("");
        setDiscountType("percentage");
        setDiscountValue("");
        setMinOrderCount("");
        setMinAmountSpend("");

        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={` ${isDetailed ? "max-w-[600px]" : "max-w-md"} rounded-xl p-6 font-alexandria max-h-[600px] overflow-y-auto [&>button]:hidden`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[600]`}>
                        {isDetailed ? "AGENT DISCOUNT" : "PAYMENT CARD"}
                        <Button onClick={() => setOpen(false)} className="border-none !shadow-none bg-transparent hover:bg-transparent">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>


                {isDetailed && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Discount Name
                        </label>
                        <Input
                            value={discountName}
                            onChange={(e) => setDiscountName(e.target.value)}
                            placeholder="Enter Discount Name"
                            className='h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]'
                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                        />
                    </div>
                )}

                {!isDetailed && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Discount Code
                        </label>
                        <Input
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="Enter Discount Code"
                            className='h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]'
                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                        />
                    </div>
                )}

                {isDetailed && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium text-gray-700">
                                Type
                            </label>
                            <RadioGroup
                                value={discountType}
                                onValueChange={setDiscountType}
                                className="flex gap-4 items-center"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="percentage"
                                        id="percentage"
                                        className={cn(
                                            `border-[1.5px] ${userType}-border ${userType}-text [&_svg]:fill-current`
                                        )}
                                    />
                                    <Label htmlFor="percentage" className="cursor-pointer">Percentage</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="amount"
                                        id="amount"
                                        className={cn(
                                            `border-[1.5px] ${userType}-border ${userType}-text [&_svg]:fill-current`
                                        )}
                                    />
                                    <Label htmlFor="amount" className="cursor-pointer">Amount</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="flex flex-col space-y-2 col-span-1">
                            <Label htmlFor="active-mode" className="text-sm font-medium text-gray-700">Status</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active-mode"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                />
                                <Label htmlFor="active-mode" className="text-sm font-medium text-gray-700">{isActive ? "Active" : "Inactive"}</Label>
                            </div>
                        </div>
                    </div>
                )}
                {isDetailed && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            {discountType === "percentage" ? "Percentage (%)" : "Amount ($)"}
                        </label>
                        <Input
                            type="number"
                            min="0"
                            value={discountValue}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (Number(val) >= 0 || val === "") {
                                    setDiscountValue(val);
                                }
                            }}
                            placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 50"}
                            className='h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]'
                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Expiration Date
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full h-[42px] mt-[10px] justify-start text-left font-normal border-[#BBBBBB]",
                                    !expiryDate && "text-muted-foreground"
                                )}
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={expiryDate}
                                onSelect={setExpiryDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {isDetailed && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">
                                Minimum Order Count
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={minOrderCount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (Number(val) >= 0 || val === "") {
                                        setMinOrderCount(val);
                                    }
                                }}
                                placeholder="1"
                                className='h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]'
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">
                                Minimum Amount Spend
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={minAmountSpend}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (Number(val) >= 0 || val === "") {
                                        setMinAmountSpend(val);
                                    }
                                }}
                                placeholder="100"
                                className='h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]'
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter Description"
                        className="w-full h-16 border rounded-md p-2 text-sm resize-none"
                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    />
                </div>


                <DialogFooter className="flex flex-col md:flex-row md:justify-between gap-[5px]  mt-6 font-alexandria">
                    <Button className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400]  ${userType}-border ${userType}-text ${userType}-button hover-${userType}-bg`}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd}
                        className={`${userType}-bg text-white hover-${userType}-bg w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
                    >
                        {initialData ? "Update" : "Add"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AgentDiscount;
