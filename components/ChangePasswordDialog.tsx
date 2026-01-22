// components/ConfirmationDialog.tsx
"use client"

import React, { useState } from "react"
import { Loader2, X } from "lucide-react"
import { Input } from "./ui/input"
import { Eye } from "./Icons"
import { toast } from "sonner"
import { ResetPasswordAgent } from "@/app/dashboard/agents/agents"
import { ResetPasswordSubAccount } from "@/app/dashboard/sub-accounts/subaccounts"
import { ResetPasswordVendor } from "@/app/dashboard/vendors/vendors"
import { useAppContext } from "@/app/context/AppContext"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    userId: string
    type: string
}
const ChangePasswordDialog: React.FC<Props> = ({
    open,
    setOpen,
    userId,
    type
}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isShowAgain, setIsShowAgain] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        try {
            e.preventDefault();
            setIsLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Authentication token not found.');
                return;
            }
            const payload = {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            };
            if (type === "agents" && payload) {
                await ResetPasswordAgent(payload, userId);
                toast.success('Password Changed successfully');
                setConfirmPassword("");
                setCurrentPassword("");
                setNewPassword("");
                setIsShowAgain(false);
                setOpen(false);
            }
            if (type === "vendor" && payload) {
                await ResetPasswordVendor(payload, userId);
                toast.success('Password Changed successfully');
                setConfirmPassword("");
                setCurrentPassword("");
                setNewPassword("");
                setIsShowAgain(false);
                setOpen(false);
            }
            if (type === "subaccount" && payload) {
                await ResetPasswordSubAccount(payload, userId, token);
                toast.success('Password Changed successfully');
                setConfirmPassword("");
                setCurrentPassword("");
                setNewPassword("");
                setIsShowAgain(false);
                setOpen(false);
            }
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
        } finally {
            setIsLoading(false);
        }

    }
    const { userType } = useAppContext();
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[320px] md:w-[416px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[600]`}>
                        CHANGE PASSWORD
                        <Button
                            onClick={() => setOpen(false)}
                            className="border-none !shadow-none bg-transparent hover:bg-transparent">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-y-4">
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                    <div className='grid grid-cols-2 gap-[16px] text-sm font-normal text-[#424242]'>
                        <div className='col-span-2'>
                            <label htmlFor="">Current Password</label>
                            <div className="relative w-full">
                                <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                                <span
                                    className="absolute right-3 top-2.5 cursor-pointer"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <Eye />
                                </span>
                            </div>
                            {fieldErrors.confirm_password && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.confirm_password[0]}</p>}
                        </div>
                        <div className='col-span-2'>
                            <label htmlFor="">New Password</label>
                            <div className="relative w-full">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                                <span
                                    className="absolute right-3 top-2.5 cursor-pointer"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Eye />
                                </span>
                            </div>
                            {fieldErrors.password && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.password[0]}</p>}
                        </div>
                        <div className='col-span-2'>
                            <label htmlFor="">Confirm Password</label>
                            <div className="relative w-full">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-[42px] border-[1px] border-[#BBBBBB] mt-[10px]"
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                                <span
                                    className="absolute right-3 top-2.5 cursor-pointer"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Eye />
                                </span>
                            </div>
                            {fieldErrors.password_confirmation && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.password_confirmation[0]}</p>}
                        </div>
                        <div className='flex items-center gap-[10px] col-span-2'>
                            <Input
                                checked={isShowAgain}
                                onChange={(e) => setIsShowAgain(e.target.checked)}
                                type='checkbox'
                                className='h-[20px] w-[20px] border-[1px] border-[#BBBBBB] mt-[12px]'
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                            />
                            <p className='text-[16px] font-normal text-[#666666] mt-[12px]'>Do not show again</p>
                        </div>
                    </div>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                    <DialogFooter className="flex flex-col md:flex-row md:justify-between gap-[5px]  mt-2 font-alexandria">
                        <Button
                            onClick={() => setOpen(false)}
                            className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] border ${userType}-border ${userType}-text hover-${userType}-bg ${userType}-button`}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleReset}
                            disabled={isLoading}
                            className={`${userType}-bg text-white hover-${userType}-bg hover:opacity-90 w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Update"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ChangePasswordDialog
