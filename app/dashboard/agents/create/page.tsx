'use client'
import React, { useEffect, useState, useRef } from 'react';
import GooglePlacesAutocomplete from "../../calendar/components/AutoCompleteInput";
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
//import ToggleButtons from '@/components/ui/toogle'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { AgentPayload, CreateAgent, EditAgent, GetOne, GetRole } from '../agents'
import { useParams, useRouter } from 'next/navigation'
import { Pencil, Plus, X } from 'lucide-react'
//import PaymentDialog from '@/components/PaymentDialog'
//import CloseDialog from '@/components/CloseDialog'
//import SaveDialog from '@/components/SaveDialog'
import ChangePasswordDialog from '@/components/ChangePasswordDialog'
import { Switch } from '@/components/ui/switch'
import AddCoAgentDialog from '@/components/AddCoAgentDialog'
import { SaveModal } from '@/components/SaveModal'
import DynamicMap from '@/components/DYnamicMap'
import { useAppContext } from '@/app/context/AppContext'
import { useUnsaved } from '@/app/context/UnsavedContext'
import useUnsavedChangesWarning from '@/app/hooks/useUnsavedChangesWarning'
import AgentDiscount from '@/components/AgentDiscount'
import SubAccountsTable from '../components/SubAccountsTable'
import { Listings } from '../../listings/page'
import Link from 'next/link'
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
    properties: Listings[];
    agent_discount: {
        uuid?: string;
        name: string;
        expiry_date: string | null;
        amount: number | string;
        is_percentage: 1 | 0 | string;
        minimum_orders?: number | string;
        minimum_spend?: number | string;
        is_active?: 1 | 0 | string;
    } | null;
};

const AgentForm = () => {
    const { userType } = useAppContext();
    const [currentUser, setCurrentUser] = useState<CurrentAgent | null>(null);

    const [coAgents, setCoAgents] = useState<{ name: string; email: string; primary_phone: string; split: string }[]>([]);
    const [emailCC, setEmailCC] = useState("");
    const [certificationText, setCertificationText] = useState<string>("");
    //const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [selectedCoAgent, setSelectedCoAgent] = useState<CoAgent | null>(null);
    const [selectedCoAgentIndex, setSelectedCoAgentIndex] = useState<number | null>(null);
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
    const [isTourMediaEnabled, setIsTourMediaEnabled] = useState<boolean>(true);
    const [mp3File, setMp3File] = useState<File | null>(null);
    const [selectedMp3, setSelectedMp3] = useState<string>("");
    const mp3FileInputRef = useRef<HTMLInputElement>(null);

    const [availableMp3s, setAvailableMp3s] = useState<{ id: string; name: string; url: string }[]>([
        { id: 'tell-me-what', name: 'Tell-me-what', url: '/audio/tell-me-what.mp3' },
        { id: 'embrace', name: 'Embrace', url: '/audio/embrace.mp3' },
        { id: 'sandbreaker', name: 'Sandbreaker', url: '/audio/sandbreaker.mp3' },
        { id: 'showreel', name: 'Showreel', url: '/audio/showreel.mp3' },
    ]);

    // Effect to fetch audios if an API capability exists in the future
    useEffect(() => {
        // Placeholder for API call
        // const fetchAudios = async () => {
        //     try {
        //         const response = await fetch('/api/audios');
        //         const data = await response.json();
        //         if (data && data.length > 0) setAvailableMp3s(data);
        //     } catch (e) {
        //         console.log("Using local audio files");
        //     }
        // };
        // fetchAudios();
    }, []);

    const handleMp3Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error("File size exceeds 10MB limit");
                return;
            }
            if (!file.type.startsWith('audio/')) {
                toast.error("Please upload a valid audio file");
                return;
            }
            setMp3File(file);

            // Create a new option for the uploaded file
            const newId = `custom-${Date.now()}`;
            const newOption = {
                id: newId,
                name: file.name,
                url: URL.createObjectURL(file) // Create temporary URL
            };

            setAvailableMp3s(prev => [...prev, newOption]);

            // Use setTimeout to ensure the new option is rendered before selecting it
            setTimeout(() => {
                setSelectedMp3(newId);
            }, 0);

            // Reset input value to allow selecting the same file again if needed
            if (mp3FileInputRef.current) {
                mp3FileInputRef.current.value = '';
            }
        }
    };
    //const [cards, setCards] = useState<PaymentCard[]>([]);
    const { isDirty, setIsDirty } = useUnsaved();
    const [activeTab, setActiveTab] = useState('details');

    useUnsavedChangesWarning(isDirty)
    const isPopulatingData = useRef(false);

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

        if (userType !== 'agent') {
            GetRole()
                .then(data => {
                    const allRoles = Array.isArray(data.data) ? data.data : [];
                    const filteredRoles = allRoles.filter((role: Role) => role.name.toLowerCase() === 'agents');
                    if (filteredRoles.length > 0) {
                        setRole(String(filteredRoles[0].id));
                    }
                    setRoles(filteredRoles);
                })
                .catch(err => console.log(err.message));

        }
    }, [userType]);

    useEffect(() => {
        if (currentUser) {

            isPopulatingData.current = true;

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
            if (currentUser.agent_discount) {
                setAgentDiscount({
                    ...currentUser.agent_discount,
                    amount: Number(currentUser.agent_discount.amount),
                    is_percentage: Number(currentUser.agent_discount.is_percentage) as 1 | 0,
                    minimum_orders: currentUser.agent_discount.minimum_orders ? Number(currentUser.agent_discount.minimum_orders) : undefined,
                    minimum_spend: currentUser.agent_discount.minimum_spend ? Number(currentUser.agent_discount.minimum_spend) : undefined,
                    is_active: currentUser.agent_discount.is_active ? Number(currentUser.agent_discount.is_active) as 1 | 0 : 0
                });
            }
            setAgentNotes(currentUser.notes || "")

            requestAnimationFrame(() => {
                isPopulatingData.current = false;
            });

            setIsDirty(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);
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
    let idToUse: string = "";

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }
        if (userType === "agent" && !userId) {
            const userInfo = localStorage.getItem("userInfo");
            if (userInfo) {
                try {
                    const parsedInfo = JSON.parse(userInfo);
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                    idToUse = parsedInfo.uuid;
                } catch (err) {
                    console.error("Failed to parse userInfo:", err);
                }
            }
        } else {
            idToUse = userId;
        }
        if (!token) {
            console.log("Token not found.");
            return;
        }

        if (idToUse) {
            GetOne(idToUse)
                .then(data => setCurrentUser(data.data))
                .catch(err => console.log(err.message));
        } else {
            console.log('Agent ID is undefined.');
        }
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation for required fields
        const validationErrors: Record<string, string[]> = {};

        if (!firstName.trim()) {
            validationErrors.first_name = ['First name is required'];
        }
        if (!lastName.trim()) {
            validationErrors.last_name = ['Last name is required'];
        }
        if (userType !== 'agent' && !role) {
            validationErrors.role_id = ['Role is required'];
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            validationErrors.email = ['Email is required'];
        } else if (!emailRegex.test(email)) {
            validationErrors.email = ['Invalid email address'];
        }
        if (emailCC && !emailRegex.test(emailCC)) {
            validationErrors.email_cc = ['Invalid email address'];
        }
        if (!userId && !password.trim()) {
            validationErrors.password = ['Password is required'];
        } else if ((!userId && password.length < 8) || (userId && password && password.length < 8)) {
            validationErrors.password = ['Password must be at least 8 characters'];
        }
        if (!primaryPhone.trim()) {
            validationErrors.primary_phone = ['Primary phone is required'];
        }


        // Validate co-agents if present
        coAgents.forEach((coAgent, index) => {
            if (!coAgent.name.trim()) {
                validationErrors[`co_agents`] = validationErrors[`co_agents`] || [];
                validationErrors[`co_agents`].push(`Co-agent ${index + 1}: Name is required`);
            }
            if (!coAgent.email.trim()) {
                validationErrors[`co_agents`] = validationErrors[`co_agents`] || [];
                validationErrors[`co_agents`].push(`Co-agent ${index + 1}: Email is required`);
            } else if (!emailRegex.test(coAgent.email)) {
                validationErrors[`co_agents`] = validationErrors[`co_agents`] || [];
                validationErrors[`co_agents`].push(`Co-agent ${index + 1}: Invalid email address`);
            }
            if (!coAgent.primary_phone.trim()) {
                validationErrors[`co_agents`] = validationErrors[`co_agents`] || [];
                validationErrors[`co_agents`].push(`Co-agent ${index + 1}: Primary phone is required`);
            }
        });

        // If there are validation errors, show them and don't submit
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            const firstError = Object.values(validationErrors).flat()[0];
            toast.error(firstError || 'Please fill all required fields');
            return;
        }

        try {
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
                first_name: firstName,
                last_name: lastName,
                email: email,
                email_cc: emailCC || undefined,
                primary_phone: primaryPhone || undefined,
                secondary_phone: secondaryPhone || undefined,
                company_name: companyName || undefined,
                website: formattedWebsite || undefined,
                password: userId ? undefined : (password || undefined),
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
                default_music: selectedMp3.startsWith('custom-') && mp3File ? mp3File.name : selectedMp3 || undefined,
                agent_discount: agentDiscount || null,
            };

            if (userId) {
                // Add _method: 'PUT' to payload for method override
                const updatedPayload = { ...payload, _method: 'PUT' };
                await EditAgent(userId, updatedPayload);
                toast.success('Agent updated successfully');
                setIsLoading(true)
                setOpen(true)
                router.push('/dashboard/agents')
                setIsLoading(false)
                setIsDirty(false)
            } else {
                await CreateAgent(payload);
                toast.success('Agent created successfully');
                setIsLoading(true)
                setOpen(true)
                router.push('/dashboard/agents')
                setIsLoading(false)
                setIsDirty(false)
            }

        } catch (error) {
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

                // Show the server error message if available, otherwise show first field error
                const errorMessage = apiError.message || Object.values(normalizedErrors).flat()[0] || 'Validation error';
                toast.error(errorMessage);
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit agent data');
            }
        }
    };

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

    interface AgentDiscountData {
        uuid?: string;
        name?: string;
        expiry_date: string | null;
        amount?: number;
        is_percentage?: 1 | 0;
        minimum_orders?: number;
        minimum_spend?: number;
        is_active?: 1 | 0;
        discount_code?: string;
        description?: string;
    }

    const [agentDiscount, setAgentDiscount] = useState<AgentDiscountData | null>(null);
    const [openDiscount, setOpenDiscount] = useState(false);
    const addDiscount = (discount: AgentDiscountData) => {
        setAgentDiscount(discount);
    };

    const removeDiscount = () => {
        setAgentDiscount(null);
    };
    console.log("currentUser", currentUser)
    return (
        <div className='font-alexandria'>
            <div className='w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center' style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}>
                    Agents
                    {currentUser ? ` › ${currentUser.first_name} ${currentUser.last_name}` : ' › Create'}
                </p>
                <Button onClick={(e) => { handleSubmit(e) }} className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg hover:opacity-95`}>Save Changes</Button>
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
            {
                <div className="flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[#4290E9] text-[18px] font-[600]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab("details")}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                            ${activeTab === "details"
                                    ? `${userType}-bg text-white`
                                    : "bg-[#F2F2F2] text-[#666666]"
                                }`}
                        >
                            DETAILS
                        </button>
                        {userId && (
                            <button
                                onClick={() => setActiveTab("sub_accounts")}
                                className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                            ${activeTab === "sub_accounts"
                                        ? `${userType}-bg text-white`
                                        : "bg-[#F2F2F2] text-[#666666]"
                                    }`}
                            >
                                SUB ACCOUNTS
                            </button>
                        )}

                    </div>
                </div>
            }
            {activeTab === 'details' && (
                <div>
                    <form
                        onChange={() => {
                            if (!isPopulatingData.current && userId) {
                                setIsDirty(true);
                            } else if (!userId) {
                                setIsDirty(true)
                            }
                        }}
                    >
                        <Accordion type="multiple" defaultValue={["profile", "branding", "payment", "account", 'tours']} className="w-full space-y-4">
                            <AccordionItem value="profile">
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                                >PROFILE</AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            <div className='grid grid-cols-2 gap-[16px]'>
                                                <div>
                                                    <label htmlFor="">First Name <span className="text-red-500">*</span></label>
                                                    <Input
                                                        required
                                                        value={firstName}
                                                        onChange={(e) => {
                                                            setFirstName(e.target.value);
                                                            if (fieldErrors.first_name) {
                                                                const newErrors = { ...fieldErrors };
                                                                delete newErrors.first_name;
                                                                setFieldErrors(newErrors);
                                                            }
                                                        }}
                                                        className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.first_name ? 'border-red-500' : 'border-[#BBBBBB]'}`} type="text" />
                                                    {fieldErrors.first_name && <p className='text-red-500 text-[10px]'>{fieldErrors.first_name[0]}</p>}
                                                </div>
                                                <div>
                                                    <label htmlFor="">Last Name <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={lastName}
                                                        onChange={(e) => {
                                                            setLastName(e.target.value);
                                                            if (fieldErrors.last_name) {
                                                                const newErrors = { ...fieldErrors };
                                                                delete newErrors.last_name;
                                                                setFieldErrors(newErrors);
                                                            }
                                                        }}
                                                        className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.last_name ? 'border-red-500' : 'border-[#BBBBBB]'}`} type="text" />
                                                    {fieldErrors.last_name && <p className='text-red-500 text-[10px]'>{fieldErrors.last_name[0]}</p>}
                                                </div>
                                                {userType !== 'agent' && (
                                                    <div className='col-span-2 hidden'>
                                                        <label htmlFor="">Role <span className="text-red-500">*</span></label>
                                                        <Select
                                                            value={String(role)}
                                                            onValueChange={(val) => {
                                                                setRole(val);
                                                                if (fieldErrors.role_id) {
                                                                    const newErrors = { ...fieldErrors };
                                                                    delete newErrors.role_id;
                                                                    setFieldErrors(newErrors);
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.role_id ? 'border-red-500' : 'border-[#BBBBBB]'}`}>
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
                                                )}
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Email <span className="text-red-500">*</span></label>
                                                    <Input value={email}
                                                        onChange={(e) => {
                                                            setEmail(e.target.value);
                                                            if (fieldErrors.email) {
                                                                const newErrors = { ...fieldErrors };
                                                                delete newErrors.email;
                                                                setFieldErrors(newErrors);
                                                            }
                                                        }}
                                                        autoComplete="email"
                                                        className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.email ? 'border-red-500' : 'border-[#BBBBBB]'}`} type="email" />

                                                    {fieldErrors.email && <p className='text-red-500 text-[10px]'>{fieldErrors.email[0]}</p>}
                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Email CC</label>
                                                    <Input value={emailCC}
                                                        onChange={(e) => setEmailCC(e.target.value)}
                                                        autoComplete="email"
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="email" />

                                                    {fieldErrors.email_cc && <p className='text-red-500 text-[10px]'>{fieldErrors.email_cc[0]}</p>}
                                                </div>
                                                {!currentUser && (
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Password <span className="text-red-500">*</span></label>
                                                        <Input
                                                            value={password}
                                                            onChange={(e) => {
                                                                setPassword(e.target.value);
                                                                if (fieldErrors.password) {
                                                                    const newErrors = { ...fieldErrors };
                                                                    delete newErrors.password;
                                                                    setFieldErrors(newErrors);
                                                                }
                                                            }}
                                                            className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.password ? 'border-red-500' : 'border-[#BBBBBB]'}`}
                                                            type="password"
                                                            autoComplete="new-password"
                                                        />
                                                        {fieldErrors.password && <p className='text-red-500 text-[10px]'>{fieldErrors.password[0]}</p>}
                                                    </div>
                                                )}
                                                <div>
                                                    <label htmlFor="">Primary Phone <span className="text-red-500">*</span></label>
                                                    <Input value={primaryPhone}
                                                        onChange={(e) => {
                                                            setPrimaryPhone(e.target.value);
                                                            if (fieldErrors.primary_phone) {
                                                                const newErrors = { ...fieldErrors };
                                                                delete newErrors.primary_phone;
                                                                setFieldErrors(newErrors);
                                                            }
                                                        }}
                                                        className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.primary_phone ? 'border-red-500' : 'border-[#BBBBBB]'}`} type="text" />
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
                                                    <label htmlFor="">Company Name</label>
                                                    <Input value={companyName}
                                                        onChange={(e) => setCompanyName(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
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
                                                    {/* <Input value={headquarterAddress}
                                                        onChange={(e) => setHeadQuarterAddress(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" /> */}
                                                    <GooglePlacesAutocomplete
                                                        value={headquarterAddress}
                                                        onChange={setHeadQuarterAddress}
                                                        placeholder="Enter Headquarter Address"
                                                        inputClassName="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                    />
                                                </div>
                                                <div className='col-span-2 h-[200px]'>
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
                                                        <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => {
                                                            setSelectedCoAgent(null);
                                                            setSelectedCoAgentIndex(null);
                                                            setOpenAddAgentDialog(true);
                                                        }}>
                                                            <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                            <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm ' />
                                                        </div>
                                                        <AddCoAgentDialog
                                                            open={openAddAgentDialog}
                                                            setOpen={setOpenAddAgentDialog}
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
                                                                                setOpenAddAgentDialog(true);
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
                            <AccordionItem value="tours">
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                                >
                                    TOURS
                                </AccordionTrigger>
                                <AccordionContent className="p-0">
                                    <div className="w-full flex flex-col items-center">
                                        {/* Main Table Header */}
                                        <div className='w-[440px] mt-10 mb-5 px-4'>
                                            <Label className='text-[#666666]'>Music on tour</Label>
                                            <Switch checked={isTourMediaEnabled}
                                                onCheckedChange={setIsTourMediaEnabled} className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41] float-end" />
                                        </div>
                                        {isTourMediaEnabled && (
                                            <div className="md:w-[410px] pb-[32px] px-[10px] items-center md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                                <Label className="text-[#666666] self-start block">Default Music</Label>
                                                <div className="flex flex-col gap-4 items-center w-full max-w-[450px]">
                                                    <div className="w-full">
                                                        <Select
                                                            value={selectedMp3}
                                                            onValueChange={(value) => {
                                                                if (value === 'upload_new') {
                                                                    mp3FileInputRef.current?.click();
                                                                    return;
                                                                }
                                                                setSelectedMp3(value);
                                                                // Check if the selected value corresponds to a newly uploaded file (starts with 'custom-')
                                                                // If it's a pre-defined one, clear the file object. 
                                                                if (!value.startsWith('custom-')) {
                                                                    setMp3File(null);
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                                                <SelectValue placeholder="Select music" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableMp3s.map((mp3) => (
                                                                    <SelectItem key={mp3.id} value={mp3.id}>
                                                                        {mp3.name}
                                                                    </SelectItem>
                                                                ))}
                                                                <SelectItem value="upload_new" className="font-semibold text-[#6BAE41] cursor-pointer">
                                                                    + Upload New Audio
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <input
                                                        type="file"
                                                        ref={mp3FileInputRef}
                                                        className="hidden"
                                                        accept="audio/*"
                                                        onChange={handleMp3Upload}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="rounded-none border border-[#BBBBBB] w-full">
                                            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm text-[#666666] font-bold h-[54px] items-center" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                                <div className="col-span-3">PROPERTY / TOUR</div>
                                                <div className="col-span-2 text-nowrap">TOUR STATUS</div>
                                                <div className="col-span-1">ORDERS</div>
                                                <div className="col-span-2">PAYMENT STATUS</div>
                                                <div className="col-span-2">ADDED</div>
                                                <div className="col-span-1">ACTIONS</div>
                                            </div>

                                            {/* Properties List */}
                                            <Accordion type="multiple" className="w-full">
                                                {currentUser?.properties?.map((property) => {
                                                    const hasOrders = property.orders && property.orders.length > 0;

                                                    return (
                                                        <AccordionItem
                                                            key={property.id}
                                                            value={`property-${property.id}`}
                                                            className="border-b border-[#BBBBBB]"
                                                        >
                                                            {/* Property Row - Accordion Trigger */}
                                                            <div className="px-6 py-4 hover:bg-[#F9F9F9]">
                                                                <AccordionTrigger className="p-0 hover:no-underline">
                                                                    <div className="grid grid-cols-12 gap-4 items-center w-full">

                                                                        <div className="col-span-3">
                                                                            <div className="text-xs text-[#666666]">
                                                                                {property.address || "No address"}, {property.city || ""}, {property.province || ""}
                                                                            </div>

                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <div
                                                                                className={`text-white px-3 py-1 rounded-full text-[10px] font-medium w-fit ${property.tour_activated
                                                                                    ? "bg-[#6BAE41]"
                                                                                    : "bg-[#E06D5E]"
                                                                                    }`}
                                                                            >
                                                                                {property.tour_activated ? "ACTIVE" : "INACTIVE"}
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-span-1">
                                                                            <div className="text-[#666666]">
                                                                                {property.orders?.length || 0} order{property.orders?.length !== 1 ? "s" : ""}
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <div className="flex flex-col gap-1">
                                                                                {(() => {
                                                                                    if (!property.orders || property.orders.length === 0) {
                                                                                        return (
                                                                                            <div className="text-[#999999] text-xs">No orders</div>
                                                                                        );
                                                                                    }

                                                                                    const paidOrders = property.orders.filter(order => order.payment_status === "PAID").length;
                                                                                    const unpaidOrders = property.orders.filter(order => order.payment_status === "UNPAID").length;
                                                                                    const partialOrders = property.orders.filter(order => order.payment_status === "PARTIALLY_PAID").length;

                                                                                    return (
                                                                                        <div className="flex flex-col gap-1">
                                                                                            {paidOrders > 0 && (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <div className="w-2 h-2 rounded-full bg-[#6BAE41]"></div>
                                                                                                    <span className="text-xs text-[#666666]">
                                                                                                        Paid: <span className="font-semibold">{paidOrders}</span>
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                            {unpaidOrders > 0 && (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <div className="w-2 h-2 rounded-full bg-[#E06D5E]"></div>
                                                                                                    <span className="text-xs text-[#666666]">
                                                                                                        Unpaid: <span className="font-semibold">{unpaidOrders}</span>
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                            {partialOrders > 0 && (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <div className="w-2 h-2 rounded-full bg-[#4290E9]"></div>
                                                                                                    <span className="text-xs text-[#666666]">
                                                                                                        Partial: <span className="font-semibold">{partialOrders}</span>
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <div className="text-[#666666]">
                                                                                {property.created_at
                                                                                    ? new Date(property.created_at).toLocaleDateString("en-US", {
                                                                                        year: "numeric",
                                                                                        month: "short",
                                                                                        day: "2-digit",
                                                                                    })
                                                                                    : "N/A"}
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <div className="flex gap-2">
                                                                                <Link
                                                                                    href={`/dashboard/listings/create/${property.uuid}`}
                                                                                    className={`w-[90px] h-[30px] justify-center rounded-[6px] border-[1px] ${userType}-border ${userType}-bg text-[12px] font-[400] text-white flex gap-[5px] items-center hover:opacity-95`}

                                                                                >
                                                                                    <span>View Tour</span>
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                                    </svg>
                                                                                </Link>

                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </AccordionTrigger>
                                                            </div>

                                                            {/* Orders Content - Accordion Content */}
                                                            <AccordionContent className="p-0">
                                                                {hasOrders ? (
                                                                    <div className="bg-gray-50 border-t border-gray-200">
                                                                        {/* Order Table Header */}
                                                                        <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
                                                                            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-[#666666]">
                                                                                <div className="col-span-3">ORDER DETAILS</div>
                                                                                <div className="col-span-2 ">ORDER STATUS</div>
                                                                                <div className="col-span-2">PAYMENT STATUS</div>
                                                                                <div className="col-span-1">LOCKED</div>
                                                                                <div className="col-span-2">DATE</div>
                                                                                <div className="col-span-2">ACTIONS</div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Individual Orders */}
                                                                        <div className="divide-y divide-gray-200">
                                                                            {property?.orders?.map((order) => (
                                                                                <div key={order.id} className="px-6 py-4 hover:bg-gray-100">
                                                                                    <div className="grid grid-cols-12 gap-4 items-center">
                                                                                        <div className="col-span-3">
                                                                                            <div className="text-sm text-[#424242] font-medium">
                                                                                                Order #{order.id}
                                                                                            </div>
                                                                                            <div className="text-xs text-[#666666] mt-1">
                                                                                                Amount: ${order.amount}
                                                                                                {order.paid_amount && order.paid_amount !== "0.00" && (
                                                                                                    <span className="ml-2 text-[#6BAE41]">
                                                                                                        (Paid: ${order.paid_amount})
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="col-span-2">
                                                                                            <div
                                                                                                className={`text-white px-3 py-1 rounded-full text-[10px] font-medium w-fit ${order.order_status === "Processing"
                                                                                                    ? "bg-[#4290E9]"
                                                                                                    : order.order_status === "Completed"
                                                                                                        ? "bg-[#6BAE41]"
                                                                                                        : "bg-[#E06D5E]"
                                                                                                    }`}
                                                                                            >
                                                                                                {order.order_status || "N/A"}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="col-span-2">
                                                                                            <div
                                                                                                className={`text-white px-3 py-1 rounded-full text-[10px] font-medium w-fit ${order.payment_status === "PAID"
                                                                                                    ? "bg-[#6BAE41]"
                                                                                                    : order.payment_status === "PARTIALLY_PAID"
                                                                                                        ? "bg-[#4290E9]"
                                                                                                        : "bg-[#E06D5E]"
                                                                                                    }`}
                                                                                            >
                                                                                                {order.payment_status === "PAID"
                                                                                                    ? "PAID"
                                                                                                    : order.payment_status === "PARTIALLY_PAID"
                                                                                                        ? "PARTIAL"
                                                                                                        : "UNPAID"}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="col-span-1">
                                                                                            {order?.lock_materials ? (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <div className="w-2 h-2 rounded-full bg-[#E06D5E]"></div>
                                                                                                    <span className="text-xs text-[#E06D5E] font-medium">Yes</span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <div className="w-2 h-2 rounded-full bg-[#6BAE41]"></div>
                                                                                                    <span className="text-xs text-[#6BAE41] font-medium">No</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="col-span-2">
                                                                                            <div className="text-sm text-[#666666]">
                                                                                                {new Date(order.created_at).toLocaleDateString("en-US", {
                                                                                                    month: "short",
                                                                                                    day: "numeric",
                                                                                                    year: "numeric",
                                                                                                })}
                                                                                            </div>
                                                                                            <div className="text-xs text-[#999999]">
                                                                                                {new Date(order.created_at).toLocaleTimeString([], {
                                                                                                    hour: '2-digit',
                                                                                                    minute: '2-digit'
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="col-span-2">
                                                                                            <div className="flex gap-3">
                                                                                                <Link
                                                                                                    href={`/dashboard/orders/${order.uuid}`}
                                                                                                    className={`text-xs ${userType}-text hover:${userType}-text font-medium`}
                                                                                                >
                                                                                                    View
                                                                                                </Link>
                                                                                                <Link
                                                                                                    href={`/dashboard/file-manager/${order.uuid}`}
                                                                                                    className="text-xs text-[#666666] hover:text-[#424242] font-medium"
                                                                                                >
                                                                                                    Media
                                                                                                </Link>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {/* Order Summary */}
                                                                        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
                                                                            <div className="text-xs text-[#666666]">
                                                                                Showing {property?.orders?.length} order{property?.orders?.length !== 1 ? "s" : ""} for this property
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // Show message when there are no orders
                                                                    <div className="bg-gray-50 border-t border-gray-200 p-6">
                                                                        <div className="text-center">
                                                                            <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                                                                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                            </div>
                                                                            <h3 className="text-sm font-medium text-gray-900">No Orders</h3>
                                                                            <p className="mt-1 text-sm text-gray-500">
                                                                                There are no orders for this listing yet.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    );
                                                })}
                                            </Accordion>

                                            {/* Empty State - No properties at all */}
                                            {(!currentUser?.properties || currentUser.properties.length === 0) && (
                                                <div className="text-center py-12 bg-white">
                                                    <div className="mx-auto h-12 w-12 text-gray-400">
                                                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        This agent has no properties yet.
                                                    </p>
                                                </div>
                                            )}


                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="branding">
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                                >Branding Assets</AccordionTrigger>
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

                            {userType === 'admin' && <AccordionItem value="payment" className='border-none'>
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                                >PAYMENT</AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            <div className='flex items-center justify-between'>
                                                <p className='font-bold text-sm text-[#666666]'>Discounts</p>
                                                {!agentDiscount && (
                                                    <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => setOpenDiscount(true)}>
                                                        <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                        <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm' />
                                                    </div>
                                                )}
                                                <AgentDiscount
                                                    open={openDiscount}
                                                    setOpen={setOpenDiscount}
                                                    addDiscount={addDiscount}
                                                    isDetailed={true}
                                                    initialData={agentDiscount}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                {agentDiscount && (
                                                    <div className='flex flex-col gap-y-3 mt-2'>
                                                        <div className="flex justify-between items-center w-full text-[16px] font-normal text-[#666666] cursor-pointer">
                                                            <div onClick={() => setOpenDiscount(true)} className='basis-[80%] flex items-center justify-between w-full gap-x-2.5'>
                                                                <div className="flex flex-col">
                                                                    <p className="text-[#4290E9]">{agentDiscount.name || agentDiscount.discount_code}</p>
                                                                </div>

                                                                {agentDiscount.expiry_date && <p className="text-[12px] font-[300] text-[#666666]">Expires {agentDiscount.expiry_date}</p>}
                                                            </div>

                                                            <div className="basis-[20%] w-full flex gap-x-4 items-center justify-end">
                                                                <X
                                                                    onClick={() => removeDiscount()}
                                                                    className="text-[#E06D5E] w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
                                                                />
                                                            </div>
                                                        </div>

                                                        <hr />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>}
                            {currentUser && (
                                <AccordionItem value="account" className='border-none'>
                                    <AccordionTrigger
                                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                                    >ACCOUNT MANAGEMENT</AccordionTrigger>
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
                </div >
            )
            }
            {
                activeTab === 'sub_accounts' && (
                    <SubAccountsTable agentId={userId ?? idToUse} />
                )
            }
        </div >
    )
}

export default AgentForm