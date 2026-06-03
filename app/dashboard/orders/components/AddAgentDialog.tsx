"use client"
import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog"

import { Pencil, Plus, X, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "../../../../components/ui/input"
import { PasswordInput } from "../../../../components/ui/password-input"
import DynamicMap from "../../../../components/DYnamicMap"
import AddCoAgentDialog from "../../../../components/AddCoAgentDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { AgentPayload, CreateAgent, EditAgent, GetOne } from "@/app/dashboard/agents/agents"
import GooglePlacesAutocomplete, { AddressComponents } from "../../calendar/components/AutoCompleteInput"
import { GetRole } from "@/app/dashboard/orders/orders"
import { toast } from "sonner"
import { SaveModal } from "../../../../components/SaveModal"
import { useAppContext } from "@/app/context/AppContext"
import { Button } from "@/components/ui/button"
import { formatPhoneNumber, isValidWebsite, isValidPhoneNumber } from "@/lib/utils"

type CoAgent = {
    email: string;
    name: string;
    primary_phone: string;
    split: string;
};

type Role = {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
};

type CurrentAgent = {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    email_cc: string | null;
    primary_phone: string;
    secondary_phone: string | null;
    company_name: string;
    company_logo_url: string | null;
    company_banner_url: string | null;
    avatar_url: string | null;
    avatar: string | null;
    company_logo: string | null;
    company_banner: string | null;
    website: string | null;
    headquarter_address: string | null;
    license_number: string | null;
    status: boolean;
    payment_status: string;
    requires_payment: boolean;
    role_id: number;
    role: Role;
    co_agents: CoAgent[];
    notes?: string;
    certifications: string[];
    created_at: string;
    updated_at: string;
};
type Props = {
    type?: string;
    uuid?: string | null;
    open: boolean
    setOpen: (value: boolean) => void
    onSuccess: () => void;
}

const AddAgentDialog: React.FC<Props> = ({
    open,
    setOpen,
    uuid,
    onSuccess,
}) => {
    const { userType } = useAppContext();
    const [currentUser, setCurrentUser] = useState<CurrentAgent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [coAgents, setCoAgents] = useState<{ name: string; email: string; primary_phone: string; split: string }[]>([]);
    const [password, setPassword] = useState("");
    const [certificationText, setCertificationText] = useState<string>("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [openAddCoAgentDialog, setOpenAddCoAgentDialog] = useState(false);
    const [headquarterAddress, setHeadQuarterAddress] = useState('');
    const [primaryPhone, setPrimaryPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [selectedCoAgent, setSelectedCoAgent] = useState<CoAgent | null>(null);
    const [selectedCoAgentIndex, setSelectedCoAgentIndex] = useState<number | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [certifications, setCertifications] = useState<string[]>([]);
    const [agentNotes, setAgentNotes] = useState("");
    const [agentLicense, setAgentLicense] = useState("");
    const [emailCC, setEmailCC] = useState("");
    type Role = { id: string; name: string };
    const [roles, setRoles] = useState<Role[]>([])
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
    const resetForm = React.useCallback(() => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setEmailCC('');
        setPrimaryPhone('');
        setSecondaryPhone('');
        setCompanyName('');
        setCompanyWebsite('');
        setPassword('');
        if (roles.length > 0) {
            setRole(String(roles[0].id));
        } else {
            setRole('');
        }
        setAgentNotes('');
        setHeadQuarterAddress('');
        setCertifications([]);
        setAgentLicense('');
        setCoAgents([]);
        setFieldErrors({});
    }, [roles]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        GetRole(token)
            .then(data => {
                if (Array.isArray(data.data)) {
                    const allRoles = Array.isArray(data.data) ? data.data : [];
                    const filteredRoles = allRoles.filter((role: Role) => role.name.toLowerCase() === 'agents');
                    if (filteredRoles.length > 0) {
                        setRole(String(filteredRoles[0].id));
                    }
                    setRoles(filteredRoles);
                } else {
                    setRoles([]);
                }
            })
            .catch(err => console.log(err.message));
    }, []);
    useEffect(() => {
        if (open && !uuid) {
            resetForm();
            setCurrentUser(null);
        }
    }, [open, uuid, resetForm]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (open && uuid) {
            GetOne(uuid)
                .then(data => setCurrentUser(data.data))
                .catch(err => console.log(err.message));
        }
    }, [uuid, open]);
    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.first_name || "");
            setLastName(currentUser.last_name || "");
            setRole(currentUser.role ? String(currentUser.role.id) : "");
            setEmail(currentUser.email || "");
            setEmailCC(currentUser.email_cc || "");
            setPrimaryPhone(currentUser.primary_phone || "");
            setSecondaryPhone(currentUser.secondary_phone || "");
            setCompanyName(currentUser.company_name || "");
            setCompanyWebsite(currentUser.website || "");
            setAgentLicense(currentUser.license_number || "")
            setHeadQuarterAddress(currentUser.headquarter_address || "");
            setCertifications(currentUser.certifications || []);
            if (currentUser.co_agents && Array.isArray(currentUser.co_agents)) {
                const formattedAgents = currentUser.co_agents.map(agent => ({
                    name: agent.name,
                    email: agent.email,
                    primary_phone: agent.primary_phone,
                    split: agent.split,
                }));
                setCoAgents(formattedAgents);
            }
            setAgentNotes(currentUser.notes || "")
        }
    }, [currentUser]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {

            const errors: Record<string, string[]> = {};
            if (!primaryPhone.trim()) {
                errors.primary_phone = ['Primary phone is required'];
            } else if (!isValidPhoneNumber(primaryPhone)) {
                errors.primary_phone = ['Invalid phone number. Example: +1 (204) 345-3456'];
            }
            if (secondaryPhone.trim() && !isValidPhoneNumber(secondaryPhone)) {
                errors.secondary_phone = ['Invalid phone number. Example: +1 (204) 345-3456'];
            }
            if (companyWebsite.trim() && !isValidWebsite(companyWebsite)) {
                errors.website = ['Invalid website URL'];
            }

            // Validate co-agents if present
            coAgents.forEach((coAgent, index) => {
                if (!coAgent.primary_phone.trim()) {
                    errors[`co_agents`] = errors[`co_agents`] || [];
                    errors[`co_agents`].push(`Co-agent ${index + 1}: Primary phone is required`);
                } else if (!isValidPhoneNumber(coAgent.primary_phone)) {
                    errors[`co_agents`] = errors[`co_agents`] || [];
                    errors[`co_agents`].push(`Co-agent ${index + 1}: Invalid phone number. Example: +1 (204) 345-3456`);
                }
            });

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                const firstError = Object.values(errors).flat()[0];
                toast.error(firstError);
                return;
            }

            let formattedWebsite = companyWebsite?.trim();
            if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
                formattedWebsite = 'https://' + formattedWebsite;
            }

            const sanitizedCoAgents = coAgents.map(({ name, email, primary_phone, split }) => {
                const agent: { name: string; email: string; primary_phone: string; split?: string } = { name, email, primary_phone };
                if (split?.trim()) {
                    agent.split = split;
                }
                return agent;
            });

            const payload: AgentPayload = {
                status: 1,
                first_name: firstName,
                last_name: lastName,
                email: email,
                requires_payment: true ? 1 : 0,
                email_cc: emailCC || undefined,
                primary_phone: primaryPhone || undefined,
                secondary_phone: secondaryPhone || undefined,
                company_name: companyName || undefined,
                website: formattedWebsite || undefined,
                password: password || undefined,
                role_id: role ? Number(role) : undefined,
                notes: agentNotes,
                headquarter_address: headquarterAddress,
                certifications: certifications,
                license_number: agentLicense,
                ...(sanitizedCoAgents.length > 0 && { co_agents: sanitizedCoAgents }),
            };

            if (uuid) {
                // Add _method: 'PUT' to payload for method override
                const updatedPayload = { ...payload, _method: 'PUT' };
                await EditAgent(uuid, updatedPayload);
                toast.success('Agent updated successfully');
                resetForm();
                setIsLoading(true)
                setOpenSaveDialog(true)
                setIsLoading(false)
                setOpen(false);
                setOpenSaveDialog(false)
                if (onSuccess) onSuccess();
            } else {
                await CreateAgent(payload);
                toast.success('Agent created successfully');
                resetForm();
                setIsLoading(true)
                setOpenSaveDialog(true)
                setIsLoading(false)
                setOpen(false);
                setOpenSaveDialog(false)
                if (onSuccess) onSuccess();
            }

        } catch (error) {
            setIsLoading(false)
            setOpenSaveDialog(false)
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
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit agent data');
            }
        }
    };


    const handleCertificationTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;

        // Only replace a space **after a word** with a comma
        input = input.replace(/(\w)\s+(?=\w)/g, "$1, ");

        setCertificationText(input);

        const updatedCertifications = input
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c.length > 0);

        setCertifications(updatedCertifications);
    };

    const handleBlur = () => {
        // Cleanup formatting
        setCertificationText(certifications.join(", "));
    };
    const removeAgent = (index: number) => {
        const updatedAgents = coAgents.filter((_, i) => i !== index);
        setCoAgents(updatedAgents);
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[320px] md:w-[685px] max-w-none bg-[#E4E4E4] h-[650px] rounded-[8px] sidebar-scroll p-4 md:px-6 md:py-4 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden custom-scroll">
                <DialogHeader>
                    <DialogTitle className="flex items-center  border-b border-[#BBBBBB] uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
                        {uuid ? "Edit Agent" : "New Agent"}
                        <DialogClose className="border-none !shadow-none bg-[#E4E4E4]">
                            <X className="!w-[20px] !h-[20px] cursor-pointer  text-[#7D7D7D]" />
                        </DialogClose>
                    </DialogTitle>
                </DialogHeader>
                <div className='w-full flex flex-col items-center custom-scroll'>
                    <div className='w-full md:w-[620px] py-[16px] px-0 md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400] custom-scroll'>
                        <div className='grid grid-cols-2 gap-[16px] overflow-y-auto px-1'>
                            <div className="col-span-2">
                                <p className="text-sm font-semibold text-[#4290E9] mb-2">Mandatory Fields</p>
                            </div>
                            <div>
                                <label htmlFor="">First Name <span className="text-red-500">*</span></label>
                                <Input
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                {fieldErrors.first_name && <p className='text-red-500 text-[10px]'>{fieldErrors.first_name[0]}</p>}
                            </div>
                            <div>
                                <label htmlFor="">Last Name <span className="text-red-500">*</span></label>
                                <Input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                {fieldErrors.last_name && <p className='text-red-500 text-[10px]'>{fieldErrors.last_name[0]}</p>}
                            </div>
                            <div className='col-span-2 hidden'>
                                <label htmlFor="">Role</label>
                                <Select
                                    value={String(role)}
                                    onValueChange={(val) => setRole(val)}
                                >
                                    <SelectTrigger className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles?.map((role) => (
                                            <SelectItem key={role.id} value={String(role.id)}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* {fieldErrors.role_id && <p className='text-red-500 text-[10px]'>{fieldErrors.role_id[0]}</p>} */}
                            </div>
                            <div className='col-span-2'>
                                <label htmlFor="">Email <span className="text-red-500">*</span></label>
                                <Input value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="email" />

                                {fieldErrors.email && <p className='text-red-500 text-[10px]'>{fieldErrors.email[0]}</p>}
                            </div>
                            {!uuid && (
                                <div className='col-span-2'>
                                    <label htmlFor="">Password <span className="text-red-500">*</span></label>
                                    <PasswordInput
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                    />
                                    {fieldErrors.password && <p className='text-red-500 text-[10px]'>{fieldErrors.password[0]}</p>}
                                </div>
                            )}
                            <div className='col-span-2'>
                                <label htmlFor="">Primary Phone <span className="text-red-500">*</span></label>
                                <Input value={primaryPhone}
                                    onChange={(e) => {
                                        setPrimaryPhone(formatPhoneNumber(e.target.value));
                                        if (fieldErrors.primary_phone) {
                                            const newErrors = { ...fieldErrors };
                                            delete newErrors.primary_phone;
                                            setFieldErrors(newErrors);
                                        }
                                    }}
                                    className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.primary_phone ? 'border-red-500' : 'border-[#BBBBBB]'}`} type="text" />
                                {fieldErrors.primary_phone && <p className='text-red-500 text-[10px]'>{fieldErrors.primary_phone[0]}</p>}
                            </div>

                            <div className="col-span-2 border-b border-[#BBBBBB] my-2"></div>

                            <div className="col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                                    className="flex items-center justify-between w-full text-left text-[#4290E9] font-medium"
                                >
                                    <span>Additional Information (Optional)</span>
                                    {showAdditionalInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                            </div>

                            {showAdditionalInfo && (
                                <>
                                    <div className='col-span-2'>
                                        <label htmlFor="">Company Name</label>
                                        <Input value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                        {fieldErrors.company_name && <p className='text-red-500 text-[10px]'>{fieldErrors.company_name[0]}</p>}
                                    </div>
                                    <div className='col-span-2'>
                                        <label htmlFor="">Email CC</label>
                                        <Input value={emailCC}
                                            onChange={(e) => setEmailCC(e.target.value)}
                                            className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="email" />

                                        {fieldErrors.email_cc && <p className='text-red-500 text-[10px]'>{fieldErrors.email_cc[0]}</p>}
                                    </div>
                                    <div className='col-span-2'>
                                        <label htmlFor="">Secondary Phone</label>
                                        <Input value={secondaryPhone}
                                            onChange={(e) => {
                                                setSecondaryPhone(formatPhoneNumber(e.target.value));
                                                if (fieldErrors.secondary_phone) {
                                                    const newErrors = { ...fieldErrors };
                                                    delete newErrors.secondary_phone;
                                                    setFieldErrors(newErrors);
                                                }
                                            }}
                                            className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.secondary_phone ? 'border-red-500' : 'border-[#BBBBBB]'}`} type="text" />
                                        {fieldErrors.secondary_phone && <p className='text-red-500 text-[10px]'>{fieldErrors.secondary_phone[0]}</p>}
                                    </div>
                                    <div className='col-span-2'>
                                        <label htmlFor="">Website</label>
                                        <Input value={companyWebsite}
                                            onChange={(e) => {
                                                setCompanyWebsite(e.target.value);
                                                if (fieldErrors.website) {
                                                    const newErrors = { ...fieldErrors };
                                                    delete newErrors.website;
                                                    setFieldErrors(newErrors);
                                                }
                                            }}
                                            className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.website ? 'border-red-500' : 'border-[#BBBBBB]'}`} type="text" />
                                        {fieldErrors.website && <p className='text-red-500 text-[10px]'>{fieldErrors.website[0]}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="">Agent license #</label>
                                        <Input value={agentLicense}
                                            onChange={(e) => setAgentLicense(e.target.value)}
                                            className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                    </div>
                                    <div>
                                        <label htmlFor="certification-input">Certifications</label>
                                        <Input
                                            id="certification-input"
                                            value={certificationText}
                                            onChange={handleCertificationTextChange}
                                            onBlur={handleBlur}
                                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                            type="text"
                                            placeholder="CIP, SIP..."
                                        />
                                    </div>
                                    <div className='col-span-2'>
                                        <label htmlFor="">Headquarter Address</label>
                                        <GooglePlacesAutocomplete
                                            value={headquarterAddress}
                                            onChange={setHeadQuarterAddress}
                                            onAddressComponents={(components: AddressComponents) => {
                                                setHeadQuarterAddress(components.full_address);
                                            }}
                                            placeholder=""
                                            className="mt-[12px]"
                                            inputClassName="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB]"
                                        />
                                    </div>
                                    <div className='col-span-2 h-[200px]'>
                                        <DynamicMap
                                            address={headquarterAddress}
                                        />
                                    </div>
                                    <div className="col-span-2 border-b border-[#BBBBBB]">
                                    </div>
                                    <div className="col-span-2">
                                        <div className='flex items-center justify-between'>
                                            <p >Assistants/Co Agents</p>
                                            <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => {
                                                setSelectedCoAgent(null);
                                                setSelectedCoAgentIndex(null);
                                                setOpenAddCoAgentDialog(true);
                                            }}>
                                                <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm ' />
                                            </div>
                                            <AddCoAgentDialog
                                                open={openAddCoAgentDialog}
                                                setOpen={setOpenAddCoAgentDialog}
                                                onSuccess={(agent) => {
                                                    if (selectedCoAgentIndex !== null) {
                                                        setCoAgents((prev) => {
                                                            const newAgents = [...prev];
                                                            newAgents[selectedCoAgentIndex] = agent;
                                                            return newAgents;
                                                        });
                                                    } else {
                                                        setCoAgents((prev) => [...prev, agent]);
                                                    }
                                                }}
                                                agent={selectedCoAgent}
                                            />
                                        </div>
                                        <div className="border border-[#BBBBBB] mt-[12px] bg-white overflow-hidden w-full rounded-[10px]">
                                            <div className="grid grid-cols-6 gap-2 px-2 py-3 text-sm text-[#666666] font-semibold items-center border-b border-[#BBBBBB]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                                <div className="col-span-2">NAME</div>
                                                <div className="col-span-3">EMAIL</div>
                                                <div className="col-span-1">ACTIONS</div>
                                            </div>

                                            {coAgents.length > 0 ? (
                                                coAgents.map((coagent, index) => (
                                                    <div key={index} className="grid grid-cols-6 gap-2 px-2 py-3 border-b border-[#BBBBBB] items-center hover:bg-[#F9F9F9]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                                        <div className="col-span-2 text-[#666666] text-xs break-words truncate cursor-pointer" title={coagent.name}>{coagent.name}</div>
                                                        <div className="col-span-3 text-[#666666] text-xs truncate cursor-pointer" title={coagent.email}>{coagent.email}</div>
                                                        <div className="col-span-1">
                                                            <div className="flex items-center gap-3 justify-center">
                                                                <span className={`cursor-pointer ${userType}-text`} onClick={() => {
                                                                    setSelectedCoAgent(coagent);
                                                                    setSelectedCoAgentIndex(index);
                                                                    setOpenAddCoAgentDialog(true);
                                                                }}><Pencil className="w-[14px] h-[14px]" /></span>
                                                                <span className="cursor-pointer text-red-500 hover:text-red-700" onClick={() => removeAgent(index)}><X className="w-[16px] h-[16px]" /></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex justify-center items-center h-20 text-[#666666] text-xs" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                                    No co-agents added yet.
                                                </div>
                                            )}
                                        </div>


                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="">
                                            Internal Notes
                                        </label>
                                        <textarea
                                            className="h-[200px] w-full p-3 rounded-[6px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                            value={agentNotes}
                                            onChange={(e) => setAgentNotes(e.target.value)}
                                            placeholder='Write Notes Here...'
                                        />
                                        {fieldErrors.iframe_code && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.iframe_code[0]}</p>}
                                    </div>
                                    <div className="col-span-2 border-b border-[#BBBBBB]">
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                            <DialogClose className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                                Cancel
                            </DialogClose>
                            <Button
                                onClick={(e) => { handleSubmit(e) }}
                                className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[176px] h-[44px] font-[400] text-[20px]"
                            >
                                Save
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
                <SaveModal
                    isOpen={openSaveDialog}
                    onClose={() => setOpenSaveDialog(false)}
                    isLoading={isLoading}
                    isSuccess={true}
                />
            </DialogContent>
        </Dialog>
    )
}

export default AddAgentDialog
