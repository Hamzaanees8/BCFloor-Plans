'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
//import ToggleButtons from '@/components/ui/toogle'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { AgentPayload, CreateAgent, EditAgent, GetOne, GetRole, } from '../agents'
import { useParams, useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
//import PaymentDialog from '@/components/PaymentDialog'
//import CloseDialog from '@/components/CloseDialog'
//import SaveDialog from '@/components/SaveDialog'
import ChangePasswordDialog from '@/components/ChangePasswordDialog'
import { Switch } from '@/components/ui/switch'
import AddCoAgentDialog from '@/components/AddCoAgentDialog'
import { SaveModal } from '@/components/SaveModal'
import DynamicMap from '@/components/DYnamicMap'
// interface PaymentCard {
//     uuid: string;
//     type: 'visa' | 'mastercard' | 'amex';
//     last_four: string;
//     cardholder_name: string;
//     is_primary?: boolean;
//     expiry_date: string;
// }
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
const AgentForm = () => {
    const [currentUser, setCurrentUser] = useState<CurrentAgent | null>(null);

    const [coAgents, setCoAgents] = useState<{ name: string; email: string; primary_phone: string; split: string }[]>([]);
    const [emailCC, setEmailCC] = useState("");
    const [certificationText, setCertificationText] = useState<string>("");
    //const [openSaveDialog, setOpenSaveDialog] = useState(false);
    //const [openCloseDialog, setOpenCloseDialog] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [certifications, setCertifications] = useState<string[]>([]);
    const [agentNotes, setAgentNotes] = useState("");
    const [agentLicense, setAgentLicense] = useState("");
    const [headquarterAddress, setHeadQuarterAddress] = useState('');
    const [primaryPhone, setPrimaryPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    //const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [isPaymentRequired, setIsPaymentRequired] = useState(false);
    const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);
    const [openAddAgentDialog, setOpenAddAgentDialog] = useState(false);
    const CompanyLogofileInputRef = useRef(null)
    const [CompanyLogofileName, setCompanyLogoFileName] = useState('')
    const [CompanyLogoUrl, setCompanyLogoUrl] = useState('')
    const AvatarfileInputRef = useRef(null)
    const [AvatarfileName, setAvatarFileName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const CompanyBannerfileInputRef = useRef(null)
    const [CompanyBannerfileName, setCompanyBannerFileName] = useState('')
    const [CompanyBannerUrl, setCompanyBannerUrl] = useState('')
    type Role = { id: string; name: string };
    const [roles, setRoles] = useState<Role[]>([])
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
    const [companyBannerFile, setCompanyBannerFile] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    //const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
    //const [cards, setCards] = useState<PaymentCard[]>([]);
    const handleReset = () => {
        setPassword("");
    };

    const params = useParams();
    const userId = params?.id as string;
    const router = useRouter()
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        GetRole(token)
            .then(data => setRoles(Array.isArray(data.data) ? data.data : []))
            .catch(err => console.log(err.message));
    }, []);
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
            setIsPaymentRequired(currentUser.requires_payment)
            setAvatarFileName(currentUser.avatar || "")
            setCompanyBannerFileName(currentUser.company_banner || "")
            setCompanyLogoFileName(currentUser.company_logo || "")
            if (currentUser.avatar_url) setAvatarUrl(currentUser.avatar_url);
            if (currentUser.company_logo_url) setCompanyLogoUrl(currentUser.company_logo_url);
            if (currentUser.company_banner_url) setCompanyBannerUrl(currentUser.company_banner_url);
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
    console.log("co-agent", coAgents)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAvatarFile(file);
            setAvatarFileName(file.name)
            setAvatarUrl(URL.createObjectURL(file))
        }
    }

    const triggerFileInput = () => {
        if (AvatarfileInputRef.current) {
            (AvatarfileInputRef.current as HTMLInputElement).click()
        }
    }
    const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCompanyLogoFile(file)
            setCompanyLogoFileName(file.name)
            setCompanyLogoUrl(URL.createObjectURL(file))
        }
    }

    const triggerFileInput1 = () => {
        if (CompanyLogofileInputRef.current) {
            (CompanyLogofileInputRef.current as HTMLInputElement).click()
        }
    }
    const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCompanyBannerFile(file)
            setCompanyBannerFileName(file.name)
            setCompanyBannerUrl(URL.createObjectURL(file))
        }
    }

    const triggerFileInput2 = () => {
        if (CompanyBannerfileInputRef.current) {
            (CompanyBannerfileInputRef.current as HTMLInputElement).click()
        }
    }

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (userId) {
            GetOne(token, userId)
                .then(data => setCurrentUser(data.data))
                .catch(err => console.log(err.message));
        } else {
            console.log('Agent ID is undefined.');
        }
    }, [userId]);
    console.log('current user', currentUser)

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
                email_cc: emailCC || undefined,
                primary_phone: primaryPhone || undefined,
                secondary_phone: secondaryPhone || undefined,
                company_name: companyName || undefined,
                website: formattedWebsite || undefined,
                password: password || undefined,
                avatar: avatarFile || undefined,
                company_logo: companyLogoFile || undefined,
                company_banner: companyBannerFile || undefined,
                role_id: role ? Number(role) : undefined,
                notes: agentNotes,
                headquarter_address: headquarterAddress,
                certifications: certifications,
                license_number: agentLicense,
                co_agents: sanitizedCoAgents,
                requires_payment: isPaymentRequired ? 1 : 0,
            };

            if (userId) {
                // Add _method: 'PUT' to payload for method override
                const updatedPayload = { ...payload, _method: 'PUT' };
                await EditAgent(userId, updatedPayload, token);
                toast.success('Agent updated successfully');
                setIsLoading(true)
                setOpen(true)
                router.push('/dashboard/agents')
                setIsLoading(false)
            } else {
                await CreateAgent(payload, token);
                toast.success('Agent created successfully');
                setIsLoading(true)
                setOpen(true)
                router.push('/dashboard/agents')
                setIsLoading(false)
            }

        } catch (error) {
            console.log('Raw error:', error);
            setIsLoading(false)
            setOpen(false)
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

                // const firstError = Object.values(normalizedErrors).flat()[0];
                // toast.error(firstError || 'Validation error');
                toast.error('Validation error kindly re-check your form');
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit agent data');
            }
        }
    };
    // const capitalizeFirst = (str: string) =>
    //     str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    // const removeCard = (uuid: string) => {
    //     setCards((prev) => prev.filter((card) => card.uuid !== uuid));
    // };
    // const confirmAndExecute = () => {
    //     pendingAction?.()
    //     setPendingAction(null)
    // }
    // const handleDelete = async (uuid: string) => {
    //     const token = localStorage.getItem("token");
    //     if (!token) return;

    //     try {
    //         await DeleteCard(uuid, token);
    //         removeCard(uuid);
    //         toast.success("Card removed Successfully");
    //     } catch (err: unknown) {
    //         if (err instanceof Error) {
    //             console.error("Failed to delete card:", err.message);
    //         } else {
    //             console.error("Failed to delete card:", err);
    //         }
    //     }
    // };
    useEffect(() => {
        const certs = currentUser?.certifications || [];
        setCertifications(certs);
        setCertificationText(certs.join(", "));
    }, [currentUser]);

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
    // const fetchPaymentMethods = useCallback(() => {
    //     const token = localStorage.getItem("token");

    //     if (!token) {
    //         console.log("Token not found.");
    //         return;
    //     }

    //     GetPaymentMethod(token)
    //         .then((res) => setCards(Array.isArray(res.data) ? res.data : []))
    //         .catch((err) => console.log("Error fetching data:", err.message));
    // }, []);

    // useEffect(() => {
    //     fetchPaymentMethods();
    // }, [fetchPaymentMethods]);
    const removeAgent = (index: number) => {
        const updatedAgents = coAgents.filter((_, i) => i !== index);
        setCoAgents(updatedAgents);
    };
    console.log("errors", fieldErrors)
    return (
        <div className='font-alexandria'>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400] text-[#4290E9]'>
                    Agents
                    {currentUser ? ` › ${currentUser.first_name} ${currentUser.last_name}` : ' › Create'}
                </p>
                <Button onClick={(e) => { handleSubmit(e) }} className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'>Save Changes</Button>
            </div>
            <SaveModal
                isOpen={open}
                onClose={() => setOpen(false)}
                isLoading={isLoading}
                isSuccess={true}
                backLink="/dashboard/agents"
                title={'Agents'}
            />
            {/* <SaveDialog
                open={openSaveDialog}
                setOpen={setOpenSaveDialog}
            /> */}
            {/* <div className='flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600]' >
                <ToggleButtons />
            </div> */}
            <div>
                <form >
                    <Accordion type="multiple" defaultValue={["profile", "branding", "payment", "account"]} className="w-full space-y-4">
                        <AccordionItem value="profile">
                            <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>PROFILE</AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className='w-full flex flex-col items-center'>
                                    <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
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
                                                <label htmlFor="">Role <span className="text-red-500">*</span></label>
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

                                                {fieldErrors.role_id && <p className='text-red-500 text-[10px]'>{fieldErrors.role_id[0]}</p>}
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
                                            {!currentUser && (
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
                                            <div className="col-span-2">
                                                <hr className='text-[#BBBBBB]' />
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
                                                {/* <iframe
                                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2357.039223216655!2d-1.7544379236894128!3d53.788789441527214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487be1362e87f88b%3A0x55da5536b65b1607!2sNelson%20St%2C%20Bradford%2C%20UK!5e0!3m2!1sen!2s!4v1748978374452!5m2!1sen!2s"
                                                    width="100%"
                                                    height="100%"
                                                    allowFullScreen
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    className="border-0"
                                                    title="Google Map - Burnaby, BC"
                                                ></iframe> */}
                                                <DynamicMap
                                                    address={headquarterAddress}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <hr className='text-[#BBBBBB]' />
                                            </div>
                                            <div className="col-span-2">
                                                <div className='flex items-center justify-between'>
                                                    <p >Assistants/Co Agents</p>
                                                    <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => setOpenAddAgentDialog(true)}>
                                                        <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                        <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm ' />
                                                    </div>
                                                    <AddCoAgentDialog
                                                        open={openAddAgentDialog}
                                                        setOpen={setOpenAddAgentDialog}
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
                                                            <span className="text-sm font-normal text-[#7D7D7D] break-words whitespace-pre-wrap overflow-hidden text-ellipsis" onClick={() => setOpenAddAgentDialog(true)}>
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
                                            <div className='col-span-2'>
                                                <div className='flex items-center justify-between'>
                                                    <p >Require payment before releasing materials</p>
                                                    <Switch checked={isPaymentRequired}
                                                        onCheckedChange={setIsPaymentRequired} className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41] float-end" />
                                                    {fieldErrors.review_files && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.review_files[0]}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="branding">
                            <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>Branding Assets</AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className='w-full flex flex-col items-center'>
                                    <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                        <div className='flex flex-col gap-y-[6px]'>
                                            <div className='flex items-end gap-x-[6px]'>
                                                {avatarUrl ?
                                                    <Image
                                                        unoptimized
                                                        src={avatarUrl}
                                                        alt="Avatar"
                                                        width={64}
                                                        height={64}
                                                        className="h-16 w-16 object-cover border"
                                                    />
                                                    : <div className='w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]'></div>
                                                }
                                                <div className="flex-1">
                                                    <Label className="text-sm  text-gray-600">Avatar</Label>
                                                    <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                        <span className="bg-[#EEEEEE] max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden">{AvatarfileName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileInput}
                                                            className="px-4 bg-[#E4E4E4] text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                        >
                                                            Replace
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/png, image/jpeg"
                                                        ref={AvatarfileInputRef}
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[#6BAE41] ">
                                                Company logo 512 x 512, PNG or JPG
                                            </p>

                                        </div>
                                        <div className='flex flex-col gap-y-[6px]'>
                                            <div className='flex items-end gap-x-[6px]'>
                                                {CompanyLogoUrl ?
                                                    <Image
                                                        unoptimized
                                                        src={CompanyLogoUrl}
                                                        alt="Avatar"
                                                        width={64}
                                                        height={64}
                                                        className="h-16 w-16 object-cover border"
                                                    />
                                                    : <div className='w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]'></div>
                                                }
                                                <div className="flex-1">
                                                    <Label className="text-sm  text-gray-600">Company Logo</Label>
                                                    <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                        <span className="bg-[#EEEEEE] max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden">{CompanyLogofileName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileInput1}
                                                            className="px-4 bg-[#E4E4E4] text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                        >
                                                            Replace
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/png, image/jpeg"
                                                        ref={CompanyLogofileInputRef}
                                                        onChange={handleFileChange1}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[#6BAE41] ">
                                                Company logo 512 x 512, PNG or JPG
                                            </p>

                                        </div>
                                        <div className='flex flex-col gap-y-[6px]'>
                                            <div className='flex items-end gap-x-[6px] flex-1'>
                                                {CompanyBannerUrl ?
                                                    <Image
                                                        unoptimized
                                                        src={CompanyBannerUrl}
                                                        alt="Avatar"
                                                        width={64}
                                                        height={64}
                                                        className="h-16 w-16 object-cover border"
                                                    />
                                                    : <div className='w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]'></div>
                                                }
                                                <div className="flex-1">
                                                    <Label className="text-sm font-normal">Company Banner</Label>
                                                    <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                        <span className="bg-[#EEEEEE] max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden">
                                                            {CompanyBannerfileName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileInput2}
                                                            className="px-4 bg-[#E4E4E4] text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                        >
                                                            Browse
                                                        </button>
                                                    </div>


                                                    <input
                                                        type="file"
                                                        accept="image/png, image/jpeg"
                                                        ref={CompanyBannerfileInputRef}
                                                        onChange={handleFileChange2}
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[#4290E9] ">
                                                Company banner 1600 x 720, PNG or JPG
                                            </p>
                                        </div>
                                        <p className='text-[#666666] text-sm font-normal pt-4'>Explanation of where these assets are used and leveraged, recommended/specify dimensions, color variations, etc.</p>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* <AccordionItem value="payment" className='border-none'>
                            <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>PAYMENT</AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className='w-full flex flex-col items-center'>
                                    <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                        <div className='grid grid-cols-2 gap-[32px]'>
                                            <div className="col-span-2">
                                                <div className='flex items-center justify-between'>
                                                    <p className='font-bold text-sm text-[#666666]'>Cards</p>
                                                    <div className='flex items-center gap-x-[10px]'>
                                                        <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                        <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm cursor-pointer' onClick={() => setOpenPaymentDialog(true)} />
                                                    </div>
                                                    <PaymentDialog
                                                        open={openPaymentDialog}
                                                        setOpen={setOpenPaymentDialog}
                                                        onSuccess={() => {
                                                            fetchPaymentMethods();
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                {cards.map((card) => (
                                                    <div key={card.uuid} className='flex flex-col gap-y-3 mt-2'>
                                                        <div
                                                            className="flex justify-between items-center w-full text-[16px] font-normal text-[#666666]"
                                                        >
                                                            <div className='basis-[60%] flex items-center justify-between w-full gap-x-2.5'>
                                                                <p className="text-[#4290E9]">{capitalizeFirst(card.type)}</p>
                                                                <p>{card.last_four.slice(0, 4)} **** **** ****</p>
                                                            </div>
                                                            <div className="basis-[40%] w-full flex gap-x-4 items-center justify-end">
                                                                {card.is_primary && (
                                                                    <span className="text-sm font-normal text-[#666666]">Primary</span>
                                                                )}
                                                                <X onClick={() => handleDelete(card.uuid)}
                                                                    className="text-[#E06D5E] w-6 h-6 cursor-pointer hover:scale-110 transition-transform" />
                                                            </div>
                                                        </div>
                                                        <hr />
                                                    </div>
                                                ))}

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem> */}
                        {currentUser && (
                            <AccordionItem value="account" className='border-none'>
                                <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>ACCOUNT MANAGEMENT</AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            <div className='grid grid-cols-2 gap-[16px]'>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Password Change</label>
                                                    <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden mt-[12px]">
                                                        <input
                                                            type="password"
                                                            id="password"
                                                            value={password}
                                                            disabled
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            className="bg-[#EEEEEE] text-[16px] font-medium w-full h-full px-4 focus:outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleReset();
                                                                setOpenChangePasswordDialog(true);
                                                            }}
                                                            className="px-4 bg-[#E4E4E4] text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                        >
                                                            Reset
                                                        </button>
                                                        <ChangePasswordDialog
                                                            userId={currentUser.uuid}
                                                            open={openChangePasswordDialog}
                                                            setOpen={setOpenChangePasswordDialog}
                                                            type="agents"
                                                        />
                                                    </div>
                                                </div>
                                                <hr className='bg-[#666666] col-span-2' />
                                            </div>
                                            {/* <div className='flex items-center justify-center'>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenCloseDialog(true)}
                                                    className="px-4 font-raleway py-2 bg-white text-sm font-semibold h-full w-[130px] text-[#E06D5E] border border-[#E06D5E]"
                                                >
                                                    Close Account
                                                </button>
                                                <CloseDialog
                                                    open={openCloseDialog}
                                                    setOpen={setOpenCloseDialog}
                                                    onConfirm={confirmAndExecute}
                                                />
                                            </div> */}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                        }
                    </Accordion>
                </form>
            </div>
        </div >
    )
}

export default AgentForm