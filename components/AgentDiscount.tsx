import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { X } from "lucide-react";

interface Props {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    addDiscount: (discount: {
        discount_code: string;
        expiry_date: string;
        description: string;
    }) => void;
}

const AgentDiscount: React.FC<Props> = ({ open, setOpen, addDiscount }) => {
    const [discountCode, setDiscountCode] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [description, setDescription] = useState("");
    const { userType } = useAppContext()

    const handleAdd = () => {
        if (!discountCode) return;

        addDiscount({
            discount_code: discountCode,
            expiry_date: expiryDate,
            description: description,
        });

        setDiscountCode("");
        setExpiryDate("");
        setDescription("");

        setOpen(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-md rounded-xl p-6 font-alexandria">
                <AlertDialogHeader>
                    <AlertDialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[600]`}>
                        PAYMENT CARD
                        <AlertDialogCancel className="border-none !shadow-none">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Discount Code
                        </label>
                        <Input
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="Enter Discount Code"
                            className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]'
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Expiration Date
                        </label>
                        <Input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]'
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter Description"
                            className="w-full h-16 border rounded-md p-2 text-sm resize-none"
                        />
                    </div>
                </div>

             
                <AlertDialogFooter className="flex flex-col md:flex-row md:justify-between gap-[5px]  mt-2 font-alexandria">
                    <AlertDialogCancel className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400]  ${userType}-border ${userType}-text ${userType}-button hover-${userType}-bg`}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleAdd}
                        className={`${userType}-bg text-white hover-${userType}-bg w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
                    >
                        Add
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default AgentDiscount;
