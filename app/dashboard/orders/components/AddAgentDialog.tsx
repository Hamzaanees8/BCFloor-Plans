// components/ConfirmationDialog.tsx
"use client"
import React, { useEffect, useState } from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Plus, X } from "lucide-react"
import { Input } from "../../../../components/ui/input"
import DynamicMap from "../../../../components/DYnamicMap"
import AddCoAgentDialog from "../../../../components/AddCoAgentDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { AgentPayload, CreateAgent, EditAgent, GetOne } from "@/app/dashboard/agents/agents"
import { GetRole } from "@/app/dashboard/orders/orders"
import { toast } from "sonner"
import { SaveModal } from "../../../../components/SaveModal"

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
    type
}) => {
    console.log('id', uuid);
    console.log('type', type)
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
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [certifications, setCertifications] = useState<string[]>([]);
    const [agentNotes, setAgentNotes] = useState("");
    const [agentLicense, setAgentLicense] = useState("");
    const [emailCC, setEmailCC] = useState("");
    type Role = { id: string; name: string };
    const [roles, setRoles] = useState<Role[]>([])
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        GetRole(token)
            .then(data => {
                if (Array.isArray(data.data)) {
                    const filtered = data.data.filter((role: { name: string }) =>
                        role.name === 'Agents'
                    );
                    setRoles(filtered);
                } else {
                    setRoles([]);
                }
            })
            .catch(err => console.log(err.message));
    }, []);
    console.log('roles', roles)
    // console.log("DEBUG effect deps:", uuid, open);
    useEffect(() => {
        if (open && !uuid) {
            resetForm();
            setCurrentUser(null);
        }
    }, [open, uuid]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (open && uuid) {
            GetOne(token, uuid)
                .then(data => setCurrentUser(data.data))
                .catch(err => console.log(err.message));
        } else {
            console.log('Agent ID is undefined.');
        }
    }, [uuid, open]);
    console.log('current user', currentUser)
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
            const token = localStorage.getItem('token') || '';
            console.log(token)
            let formattedWebsite = companyWebsite?.trim();
            if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
                formattedWebsite = 'https://' + formattedWebsite;
            }
            console.log("co-agent payload", coAgents)

            const sanitizedCoAgents = coAgents.map(({ name, email, primary_phone, split }) => {
                const agent: { name: string; email: string; primary_phone: string; split?: string } = { name, email, primary_phone };
                if (split?.trim()) {
                    agent.split = split;
                }
                return agent;
            });
            console.log("sanitizedCoAgents", sanitizedCoAgents);

            const payload: AgentPayload = {
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
                co_agents: sanitizedCoAgents,
            };

            if (uuid) {
                // Add _method: 'PUT' to payload for method override
                const updatedPayload = { ...payload, _method: 'PUT' };
                await EditAgent(uuid, updatedPayload, token);
                toast.success('Agent updated successfully');
                resetForm();
                setIsLoading(true)
                setOpenSaveDialog(true)
                setIsLoading(false)
                setOpen(false);
                setOpenSaveDialog(false)
                if (onSuccess) onSuccess();
            } else {
                await CreateAgent(payload, token);
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
            console.log('Raw error:', error);
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
    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setEmailCC('');
        setPrimaryPhone('');
        setSecondaryPhone('');
        setCompanyName('');
        setCompanyWebsite('');
        setPassword('');
        setRole('');
        setAgentNotes('');
        setHeadQuarterAddress('');
        setCertifications([]);
        setAgentLicense('');
        setCoAgents([]);
        setFieldErrors({});
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
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[685px] max-w-none bg-[#E4E4E4] h-[650px] rounded-[8px] sidebar-scroll p-4 md:px-6 md:py-4 gap-[10px] font-alexandria overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center  border-b border-[#BBBBBB] uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
                        {uuid ? "Edit Agent" : "New Agent"}
                        <AlertDialogCancel className="border-none !shadow-none bg-[#E4E4E4]">
                            <X className="!w-[20px] !h-[20px] cursor-pointer  text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className='w-full flex flex-col items-center'>
                    <div className='w-full md:w-[620px] py-[16px] px-0 md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                        <div className='grid grid-cols-2 gap-[16px]'>
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
                            <div className='col-span-2'>
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
                            <div className='col-span-2'>
                                <label htmlFor="">Email CC</label>
                                <Input value={emailCC}
                                    onChange={(e) => setEmailCC(e.target.value)}
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="email" />

                                {fieldErrors.email_cc && <p className='text-red-500 text-[10px]'>{fieldErrors.email_cc[0]}</p>}
                            </div>
                            {!uuid && (
                                <div className='col-span-2'>
                                    <label htmlFor="">Password <span className="text-red-500">*</span></label>
                                    <Input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                        type="password"
                                    />
                                    {fieldErrors.password && <p className='text-red-500 text-[10px]'>{fieldErrors.password[0]}</p>}
                                </div>
                            )}
                            <div>
                                <label htmlFor="">Primary Phone <span className="text-red-500">*</span></label>
                                <Input value={primaryPhone}
                                    onChange={(e) => setPrimaryPhone(e.target.value)}
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                {fieldErrors.primary_phone && <p className='text-red-500 text-[10px]'>{fieldErrors.primary_phone[0]}</p>}
                            </div>
                            <div>
                                <label htmlFor="">Secondary Phone</label>
                                <Input value={secondaryPhone}
                                    onChange={(e) => setSecondaryPhone(e.target.value)}
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                            </div>
                            <div className="col-span-2 border-b border-[#BBBBBB]">
                            </div>
                            <div className='col-span-2'>
                                <label htmlFor="">Company Name <span className="text-red-500">*</span></label>
                                <Input value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                {fieldErrors.company_name && <p className='text-red-500 text-[10px]'>{fieldErrors.company_name[0]}</p>}
                            </div>
                            <div className='col-span-2'>
                                <label htmlFor="">Website</label>
                                <Input value={companyWebsite}
                                    onChange={(e) => setCompanyWebsite(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />

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
                                <Input value={headquarterAddress}
                                    onChange={(e) => setHeadQuarterAddress(e.target.value)}
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
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
                                    <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => setOpenAddCoAgentDialog(true)}>
                                        <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                        <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm ' />
                                    </div>
                                    <AddCoAgentDialog
                                        open={openAddCoAgentDialog}
                                        setOpen={setOpenAddCoAgentDialog}
                                        onSuccess={(agent) => {
                                            setCoAgents((prev) => [...prev, agent]);
                                            console.log('Agent added:', agent);
                                        }}
                                    />
                                </div>
                                <div className="border border-[#BBBBBB] mt-[12px] px-[6px] py-[8px] rounded-[6px] bg-[#EEEEEE] flex flex-wrap gap-[6px] min-h-[67px]">
                                    {coAgents.map((coagent, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center bg-[#E4E4E4] px-[6px] h-[24px] py-1.5 rounded-[10px] shadow-sm max-w-full break-words cursor-pointer overflow-hidden"
                                            style={{ maxWidth: '100%' }}
                                        >
                                            <span className="text-sm font-normal text-[#7D7D7D] break-words whitespace-pre-wrap overflow-hidden text-ellipsis" onClick={() => setOpenAddCoAgentDialog(true)}>
                                                {coagent.name} &lt;{coagent.email}&gt;
                                            </span>
                                            <button
                                                onClick={() => removeAgent(index)}
                                                className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>


                            </div>
                            <div className="col-span-2">
                                <label htmlFor="">
                                    Agent Notes (Not visible to Agent)
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
                        </div>
                        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                            <AlertDialogCancel className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => { handleSubmit(e) }}
                                className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[176px] h-[44px] font-[400] text-[20px]"
                            >
                                Save
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </div>
                <SaveModal
                    isOpen={openSaveDialog}
                    onClose={() => setOpenSaveDialog(false)}
                    isLoading={isLoading}
                    isSuccess={true}
                />
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default AddAgentDialog
