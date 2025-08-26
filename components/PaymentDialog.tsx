// components/ConfirmationDialog.tsx
"use client"

import React, { useState } from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { X } from "lucide-react"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { DropDownArrow } from "./Icons"
import { toast } from "sonner"
import { AddCard } from "@/app/dashboard/global-settings/global-settings"
import { useAppContext } from "@/app/context/AppContext"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    onSuccess?: () => void;
}
type CardType = "visa" | "mastercard" | "amex";
const PaymentDialog: React.FC<Props> = ({
    open,
    setOpen,
    onSuccess,
}) => {
    const [cardType, setCardType] = useState<CardType | "">("");
    const [cardNumber, setCardNumber] = useState("")
    const [expiryDate, setExpiryDate] = useState("")
    const [cvc, setCvc] = useState("")
    const [nameOnCard, setNameOnCard] = useState("")
    const [isPrimary, setIsPrimary] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const { userType } = useAppContext()
    const handleAddCard = async (e: React.FormEvent) => {
        try {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Authentication token not found.');
                return;
            }
            if (cardType === "") {
                toast.error("Please select a card type");
                return;
            }
            const formattedcardnumber = cardNumber.replace(/-/g, "");
            const [month, year] = expiryDate.split('/');
            const formattedExpiry = `20${year}-${month.padStart(2, '0')}`;
            const payload = {
                type: cardType,
                last_four: formattedcardnumber,
                expiry_date: formattedExpiry,
                cvv: cvc,
                cardholder_name: nameOnCard,
                is_primary: isPrimary,
            };
            console.log("payload for payment", payload)
            if (payload) {
                const result = await AddCard(payload, token);
                toast.success('Card Added successfully');
                console.log('Discount created successfully:', result);
                setCardNumber("")
                setExpiryDate("")
                setCvc("")
                setNameOnCard("")
                setCardType("");
                setIsPrimary(false);
                setOpen(false);
            }
            if (onSuccess) onSuccess();

        } catch (error) {
            console.log('Raw error:', error);

            setFieldErrors({});
            const apiError = error as { message?: string; errors?: Record<string, string[]> };

            if (apiError.errors && typeof apiError.errors === 'object') {
                const normalizedErrors: Record<string, string[]> = {};

                Object.entries(apiError.errors).forEach(([key, messages]) => {
                    const normalizedKey = key.split('.')[0];
                    if (!normalizedErrors[normalizedKey]) {
                        normalizedErrors[normalizedKey] = [];
                    }
                    normalizedErrors[normalizedKey].push(...messages);
                });

                setFieldErrors(normalizedErrors);

                const firstError = Object.values(normalizedErrors).flat()[0];
                toast.error(firstError || 'Validation error');
            }
            else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit user data');
            }
        }

    }
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.replace(/[^0-9]/g, "").slice(0, 16);

        const formatted = input.match(/.{1,4}/g)?.join("-") || input;

        setCardNumber(formatted);
    };
    const cardOptions: CardType[] = ["mastercard", "visa", "amex"];

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[416px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
                <AlertDialogHeader>
                    <AlertDialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[600]`}>
                        PAYMENT CARD
                        <AlertDialogCancel className="border-none !shadow-none">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="flex flex-col gap-y-4">
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                    <div className='grid grid-cols-2 gap-[16px] text-sm font-normal text-[#424242]'>
                        <div className='col-span-2'>
                            <label htmlFor="">Card Number</label>
                            <Input
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]'
                                type="text"
                                inputMode="numeric"
                                placeholder="1234-5678-9012-3456"
                            />
                            {fieldErrors.last_four && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.last_four[0]}</p>}
                        </div>

                        <div>
                            <label htmlFor="">Expiry Date</label>
                            <Input
                                value={expiryDate}
                                onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                                    if (value.length > 2) {
                                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                                    }
                                    setExpiryDate(value.slice(0, 5)); // Limit to 5 characters: MM/YY
                                }}
                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]'
                                type="text"
                                placeholder='11/28'
                            />
                            {fieldErrors.expiry_date && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.expiry_date[0]}</p>}
                        </div>
                        <div>
                            <label htmlFor="">CVC</label>
                            <Input value={cvc}
                                onChange={(e) => setCvc(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]' type="text" />
                            {fieldErrors.cvc && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.cvc[0]}</p>}
                        </div>
                        <div className='col-span-2'>
                            <label htmlFor="">Name On Card</label>
                            <Input value={nameOnCard}
                                onChange={(e) => setNameOnCard(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]' type="text" />
                            {fieldErrors.cardholder_name && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.cardholder_name[0]}</p>}
                        </div>
                        <div className='col-span-2'>
                            <label htmlFor="">Card Type</label>
                            <Select
                                value={cardType}
                                onValueChange={(value) => setCardType(value as CardType)}
                            >
                                <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                                    <SelectValue placeholder="Select Card Type" />
                                    <span className="custom-arrow">
                                        <DropDownArrow />
                                    </span>
                                </SelectTrigger>

                                <SelectContent>
                                    {cardOptions.map((option, index) => (
                                        <SelectItem key={index} value={option}>
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldErrors.type && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.type[0]}</p>}
                        </div>
                        <div className='flex items-center gap-[10px]'>
                            <Input
                                checked={isPrimary}
                                onChange={(e) => setIsPrimary(e.target.checked)} type='checkbox'
                                className={`h-[20px] w-[20px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]  ${userType === 'admin' ? 'bg-[#4290E9]' : userType === 'agent' ? 'bg-[#6BAE41]' : 'bg-[#4290E9]'}`} />
                            <p className='text-[16px] font-normal text-[#666666] mt-[12px]'>Primary Card</p>
                        </div>
                    </div>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                    <AlertDialogFooter className="flex flex-col md:flex-row md:justify-between gap-[5px]  mt-2 font-alexandria">
                        <AlertDialogCancel className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400]  ${userType}-border ${userType}-text ${userType}-button hover-${userType}-bg`}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleAddCard}
                            className={`${userType}-bg text-white hover-${userType}-bg w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
                        >
                            Add
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default PaymentDialog
