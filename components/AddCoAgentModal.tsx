"use client";
import React, { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { isValidEmail, isValidPhoneNumber, formatPhoneNumber } from "@/lib/utils";
import { AddCoAgent, CoAgentPayload } from "@/app/dashboard/sub-accounts/subaccounts";

interface AddCoAgentModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess?: (createdData?: any) => void;
    agentUuid?: string;
}

export default function AddCoAgentModal({
    open,
    setOpen,
    onSuccess,
    agentUuid,
}: AddCoAgentModalProps) {
    const { userType } = useAppContext();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const handleReset = () => {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setCompanyName("");
        setPassword("");
        setShowPassword(false);
        setFieldErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const errors: Record<string, string[]> = {};
        if (!email.trim()) {
            errors.email = ["Email is required"];
        } else if (!isValidEmail(email.trim())) {
            errors.email = ["Invalid email address"];
        }

        if (phone.trim() && !isValidPhoneNumber(phone.trim())) {
            errors.phone = ["Invalid phone number format"];
        }

        if (password.trim() && password.trim().length < 6) {
            errors.password = ["Password must be at least 6 characters"];
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            const firstErr = Object.values(errors).flat()[0];
            toast.error(firstErr);
            return;
        }

        const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }

        setSubmitting(true);
        try {
            const payload: CoAgentPayload = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                name: `${firstName.trim()} ${lastName.trim()}`.trim() || undefined,
                email: email.trim().toLowerCase(),
                password: password.trim() || undefined,
                primary_phone: phone.trim() || undefined,
                number: phone.trim() || undefined,
                company_name: companyName.trim() || undefined,
                agent_uuid: agentUuid || undefined,
            };

            const res = await AddCoAgent(payload, token);
            toast.success(res.message || "Co-Agent / Partner added successfully");
            handleReset();
            setOpen(false);
            if (onSuccess) {
                onSuccess(res?.data || res);
            }
        } catch (err: any) {
            console.error("Failed to add co-agent:", err);
            const msg = err?.message || "Failed to add Co-Agent";
            if (err?.errors) {
                setFieldErrors(err.errors);
            }
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => {
                if (!submitting) {
                    setOpen(val);
                    if (!val) handleReset();
                }
            }}
        >
            <DialogContent className="w-[90vw] max-w-[480px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[600]`}>
                        <span>Add Co-Agent / Partner</span>
                        <Button
                            type="button"
                            onClick={() => {
                                handleReset();
                                setOpen(false);
                            }}
                            className="border-none !shadow-none bg-transparent hover:bg-transparent p-0 h-auto"
                        >
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <hr className="w-full h-[1px] text-[#BBBBBB] my-1" />

                <form onSubmit={handleSubmit} className="flex flex-col gap-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-1">
                            <label className="text-[14px] font-normal text-[#424242]">First Name</label>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First Name"
                                className="h-[40px] text-[#666666] border-[1px] mt-[6px] border-[#BBBBBB]"
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[14px] font-normal text-[#424242]">Last Name</label>
                            <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last Name"
                                className="h-[40px] text-[#666666] border-[1px] mt-[6px] border-[#BBBBBB]"
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="text-[14px] font-normal text-[#424242]">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) {
                                    const newErrors = { ...fieldErrors };
                                    delete newErrors.email;
                                    setFieldErrors(newErrors);
                                }
                            }}
                            placeholder="partner@realestate.com"
                            className={`h-[40px] text-[#666666] border-[1px] mt-[6px] ${
                                fieldErrors.email ? "border-red-500" : "border-[#BBBBBB]"
                            }`}
                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                        />
                        {fieldErrors.email && (
                            <p className="text-red-500 text-[11px] mt-1">{fieldErrors.email[0]}</p>
                        )}
                    </div>

                    <div className="col-span-2">
                        <label className="text-[14px] font-normal text-[#424242]">Phone Number</label>
                        <Input
                            type="text"
                            value={phone}
                            onChange={(e) => {
                                setPhone(formatPhoneNumber(e.target.value));
                                if (fieldErrors.phone) {
                                    const newErrors = { ...fieldErrors };
                                    delete newErrors.phone;
                                    setFieldErrors(newErrors);
                                }
                            }}
                            placeholder="+1 (604) 555-0123"
                            className={`h-[40px] text-[#666666] border-[1px] mt-[6px] ${
                                fieldErrors.phone ? "border-red-500" : "border-[#BBBBBB]"
                            }`}
                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                        />
                        {fieldErrors.phone && (
                            <p className="text-red-500 text-[11px] mt-1">{fieldErrors.phone[0]}</p>
                        )}
                    </div>

                                        <div className="col-span-2">
                        <label className="text-[14px] font-normal text-[#424242]">Password (Optional)</label>
                        <div className="relative mt-[6px]">
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) {
                                        const newErrors = { ...fieldErrors };
                                        delete newErrors.password;
                                        setFieldErrors(newErrors);
                                    }
                                }}
                                placeholder="Set password for instant login"
                                className={`h-[40px] text-[#666666] border-[1px] pr-10 ${
                                    fieldErrors.password ? "border-red-500" : "border-[#BBBBBB]"
                                }`}
                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="text-red-500 text-[11px] mt-1">{fieldErrors.password[0]}</p>
                        )}
                        <p className="text-[11px] text-[#777777] mt-1">
                            Set a password for direct login access, or leave blank to send an email invitation setup link.
                        </p>
                    </div>

                    <div className="col-span-2">
                        <label className="text-[14px] font-normal text-[#424242]">Company / Brokerage Name</label>
                        <Input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. RE/MAX, Royal LePage, Sotheby's"
                            className="h-[40px] text-[#666666] border-[1px] mt-[6px] border-[#BBBBBB]"
                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                        />
                    </div>

                    <p className="text-[12px] text-[#777777] mt-1">
                        An invitation will be sent to the partner agent to link their account and set up their access if they do not have one yet.
                    </p>

                    <hr className="w-full h-[1px] text-[#BBBBBB] my-2" />

                    <DialogFooter className="flex justify-end gap-2 font-alexandria">
                        <Button
                            type="button"
                            disabled={submitting}
                            onClick={() => {
                                handleReset();
                                setOpen(false);
                            }}
                            className={`bg-white w-full md:w-[120px] h-[40px] text-[15px] outline-none ${userType}-border ${userType}-text hover-${userType}-bg`}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className={`${userType}-bg text-white hover-${userType}-bg hover:opacity-90 w-full md:w-[150px] h-[40px] text-[15px] font-[500]`}
                        >
                            {submitting ? "Linking..." : "+ Add Co-Agent"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
