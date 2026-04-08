'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Country, State } from 'country-state-city';
//import ToggleButtons from '@/components/ui/toogle'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
//import { Plus, X } from 'lucide-react'
//import PaymentDialog from '@/components/PaymentDialog'
//import CloseDialog from '@/components/CloseDialog'
import ChangePasswordDialog from '@/components/ChangePasswordDialog'
import { Create, Edit, GetOne, GetPermissions, GetRole, SubAccountPayload } from '../subaccounts'
import { SaveModal } from '@/components/SaveModal'
import { Get } from '../../agents/agents'
import DynamicMap from '@/components/DYnamicMap'
import { useAppContext } from '@/app/context/AppContext'
import { useUnsaved } from '@/app/context/UnsavedContext'
import useUnsavedChangesWarning from '@/app/hooks/useUnsavedChangesWarning'
import GooglePlacesAutocomplete from '../../calendar/components/AutoCompleteInput'
// interface PaymentCard {
//     uuid: string;
//     type: 'visa' | 'mastercard' | 'amex';
//     last_four: string;
//     cardholder_name: string;
//     is_primary?: boolean;
//     expiry_date: string;
// }
const OrdersForm = () => {
    type CurrentUser = {
        uuid: string;
        first_name?: string;
        last_name?: string;
        role_id: number;
        role: Role;
        primary_email?: string;
        secondary_email?: string;
        notification_email: boolean;
        email_type?: string;
        primary_phone?: string;
        secondary_phone?: string;
        agent: { uuid: string, first_name: string, last_name: string, email: string, created_at: string },
        company_name?: string;
        website?: string;
        avatar: string | null;
        company_logo: string | null;
        company_banner: string | null;
        address?: string;
        city?: string;
        province?: string;
        country?: string;
        permissions?: number[];
        avatar_url?: string;
        company_logo_url?: string;
        company_banner_url?: string;
        // add other fields as needed
    };
    type Agent = { uuid: string; first_name: string; last_name: string; email: string; created_at: string };
    const [agent, setAgent] = useState<Agent[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [connectedAgent, setConnectedAgent] = useState("");
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    // const [openCloseDialog, setOpenCloseDialog] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [secondaryEmail, setSecondaryEmail] = useState("");
    const [notificationEmail, setNotificationEmail] = useState(true);
    const [emailType, setEmailType] = useState("");
    const [primaryPhone, setPrimaryPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [countries, setCountries] = useState<{ name: string, isoCode: string }[]>([]);
    const [states, setStates] = useState<{ name: string, isoCode: string }[]>([]);
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [country, setCountry] = useState("CA");
    const [postalCode, setPostalCode] = useState("");
    const [password, setPassword] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    // const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);
    const CompanyLogofileInputRef = useRef(null)
    const [CompanyLogofileName, setCompanyLogoFileName] = useState('')
    const [CompanyLogoUrl, setCompanyLogoUrl] = useState('')
    const AvatarfileInputRef = useRef(null)
    const [AvatarfileName, setAvatarFileName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const CompanyBannerfileInputRef = useRef(null)
    const [CompanyBannerfileName, setCompanyBannerFileName] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [CompanyBannerUrl, setCompanyBannerUrl] = useState('')
    type Role = { id: string; name: string };
    const [roles, setRoles] = useState<Role[]>([])
    type Permission = { id: string; name: string };
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
    const [companyBannerFile, setCompanyBannerFile] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const { userType } = useAppContext()
    const handleReset = () => {
        setPassword("");
    };
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '');
    const router = useRouter();

    const { isDirty, setIsDirty } = useUnsaved();
    useUnsavedChangesWarning(isDirty)
    const isPopulatingData = useRef(false);
    const hasInitiallyRendered = useRef(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState("profile");

    const searchParams = useSearchParams();

    const agentId = searchParams.get('agentId');
    const subAccountId = searchParams.get('subAccountId');
    useEffect(() => {
        if (agentId) {
            setConnectedAgent(agentId)

        } else if (userType && agent.length > 0) {
            setConnectedAgent(userInfo.uuid)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userType, agent])

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.');
            return;
        }

        GetRole(token)
            .then(data => {
                if (Array.isArray(data.data)) {
                    const filtered = data.data.filter((role: { name: string }) =>
                        role.name.toLowerCase() === 'co agent' || role.name.toLowerCase() === 'assistant' || role.name.toLowerCase() === 'admin'
                    );
                    setRoles(filtered);
                } else {
                    setRoles([]);
                }
            })
            .catch(err => console.log(err.message));
    }, []);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (subAccountId) {
            GetOne(token, subAccountId)
                .then(data => {
                    isPopulatingData.current = true;
                    setCurrentUser(data.data);
                })
                .catch(err => console.log(err.message));
        } else {
            // For create mode, mark as initially rendered after a short delay
            // This prevents browser autofill from triggering dirty state
            setTimeout(() => {
                hasInitiallyRendered.current = true;
            }, 500); // Longer delay to account for browser autofill
        }
    }, [subAccountId]);
    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);
    useEffect(() => {
        if (states.length && currentUser?.province) {
            const match = states.find((s) => s.isoCode === currentUser.province);
            if (match) {
                setProvince(match.isoCode);
            }
        }
    }, [states, currentUser]);
    useEffect(() => {
        if (country) {
            setStates(State.getStatesOfCountry(country));
            // Only reset province when the user manually changes country,
            // not when we are populating existing data from the API.
            if (!isPopulatingData.current) {
                setProvince('');
            }
        }
    }, [country]);
    useEffect(() => {
        if (currentUser) {

            isPopulatingData.current = true;
            setFirstName(currentUser.first_name || "");
            setLastName(currentUser.last_name || "");
            setConnectedAgent(currentUser.agent?.uuid);
            setRole(currentUser.role ? String(currentUser.role.id) : "");
            setEmail(currentUser.primary_email || "");
            setSecondaryEmail(currentUser.secondary_email || "");
            setNotificationEmail(currentUser.notification_email);
            const type = currentUser.email_type?.toLowerCase();
            setEmailType(type || "");
            setPrimaryPhone(currentUser.primary_phone || "");
            setSecondaryPhone(currentUser.secondary_phone || "");
            setCompanyName(currentUser.company_name || "");
            setCompanyWebsite(currentUser.website || "");
            setAddress(currentUser.address || "");
            setCity(currentUser.city || "");
            setProvince(currentUser.province || "");
            setCountry(currentUser.country || "");
            setPostalCode("");  // Initialize as empty since backend doesn't store postal_code for sub-accounts
            setAvatarFileName(currentUser.avatar || "")
            setCompanyBannerFileName(currentUser.company_banner || "")
            setCompanyLogoFileName(currentUser.company_logo || "")
            setSelectedPermissions(currentUser.permissions?.map((p) => Number(p)) || []);
            if (currentUser.avatar_url) setAvatarUrl(currentUser.avatar_url);
            if (currentUser.company_logo_url) setCompanyLogoUrl(currentUser.company_logo_url);
            if (currentUser.company_banner_url) setCompanyBannerUrl(currentUser.company_banner_url);
            // Use setTimeout to ensure all state updates + cascading effects (e.g. country→states)
            // complete before dirty tracking is enabled. 300ms covers the async chain.
            setTimeout(() => {
                isPopulatingData.current = false;
                hasInitiallyRendered.current = true;
            }, 300);

            setIsDirty(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, permissions]);

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

    const togglePermission = (id: number, checked: boolean) => {
        setSelectedPermissions((prev) =>
            checked ? [...prev, id] : prev.filter((pid) => pid !== id)
        );
    };



    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        if (token) {
            Get()
                .then(data => setAgent(data.data))
                .catch(err => console.log(err.message));
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        GetPermissions(token)
            .then(data => {
                const allowedPermissions = [
                    "book appointments",
                    "edit appointments",
                    "view all appointments",
                    "view only appointments for co-agent",
                    "receive notifications",
                    "access billing",
                    "create sub-accounts",
                ];
                setPermissions(Array.isArray(data.data) ? data.data.filter((p: { name: string }) => allowedPermissions.includes(p.name.toLowerCase())) : [])
            })
            .catch(err => console.log(err.message));
    }, []);
    useEffect(() => {
        if (!role || !permissions.length) return;

        const selectedRole = roles.find((r) => String(r.id) === role);
        if (!selectedRole) return;

        const roleName = selectedRole.name.toLowerCase();

        let newPermissions: number[] = [];

        if (roleName === 'admin') {
            newPermissions = permissions.map((p) => Number(p.id));
        } else if (roleName === 'co agent') {
            const allowed = ['book appointments', 'edit appointments', 'view only appointments for co-agent'];
            newPermissions = permissions
                .filter((p) => allowed.includes(p.name.toLowerCase()))
                .map((p) => Number(p.id));
        } else if (roleName === 'assistant') {
            const allowed = ['book appointments', 'edit appointments', 'view all appointments'];
            newPermissions = permissions
                .filter((p) => allowed.includes(p.name.toLowerCase()))
                .map((p) => Number(p.id));
        }

        setSelectedPermissions(newPermissions);

    }, [role, permissions, roles]);

    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;

        let ancestor = header.parentElement;
        while (ancestor) {
            const style = window.getComputedStyle(ancestor);
            if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
                ancestor.style.setProperty('overflow-x', 'visible', 'important');
                ancestor.style.setProperty('overflow-y', 'visible', 'important');

                const target = ancestor;
                return () => {
                    target.style.removeProperty('overflow-x');
                    target.style.removeProperty('overflow-y');
                };
            }
            ancestor = ancestor.parentElement;
        }
    }, [headerRef]);

    const validateForm = () => {
        const errors: Record<string, string[]> = {};
        let isValid = true;

        if (!firstName.trim()) {
            errors.first_name = ["First Name is required"];
            isValid = false;
        }

        if (!lastName.trim()) {
            errors.last_name = ["Last Name is required"];
            isValid = false;
        }

        if (!connectedAgent) {
            errors.agent_id = ["Agent is required"];
            isValid = false;
        }

        if (!role) {
            errors.role_id = ["Role is required"];
            isValid = false;
        }

        if (!email.trim()) {
            errors.primary_email = ["Email is required"];
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.primary_email = ["Invalid email format"];
            isValid = false;
        }

        if (secondaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondaryEmail)) {
            errors.secondary_email = ["Invalid email format"];
            isValid = false;
        }

        // Validate password only if creating a new user or if password field is filled
        if (!subAccountId) {
            if (!password) {
                errors.password = ["Password is required"];
                isValid = false;
            } else if (password.length < 8) {
                errors.password = ["Password must be at least 8 characters"];
                isValid = false;
            }
        } else if (password && password.length < 8) {
            errors.password = ["Password must be at least 8 characters"];
            isValid = false;
        }

        if (!primaryPhone.trim()) {
            errors.primary_phone = ["Primary Phone is required"];
            isValid = false;
        } else if (primaryPhone.length > 20) {
            errors.primary_phone = ["Primary Phone must be less than 20 characters"];
            isValid = false;
        }

        if (secondaryPhone && secondaryPhone.length > 20) {
            errors.secondary_phone = ["Secondary Phone must be less than 20 characters"];
            isValid = false;
        }

        if (address && address.length > 100) {
            errors.address = ["Address must be less than 100 characters"];
            isValid = false;
        }
        if (city && city.length > 50) {
            errors.city = ["City must be less than 50 characters"];
            isValid = false;
        }
        if (province && province.length > 50) {
            errors.province = ["Province must be less than 50 characters"];
            isValid = false;
        }
        if (country && country.length > 50) {
            errors.country = ["Country must be less than 50 characters"];
            isValid = false;
        }

        setFieldErrors(errors);

        if (!isValid) {
            const firstError = Object.values(errors).flat()[0];
            toast.error(firstError || 'Please fill all required fields');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const token = localStorage.getItem('token') || '';

            let formattedWebsite = companyWebsite?.trim();
            if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
                formattedWebsite = 'https://' + formattedWebsite;
            }

            const payload: SubAccountPayload = {
                first_name: firstName,
                last_name: lastName,
                primary_email: email,
                agent_id: connectedAgent,
                secondary_email: secondaryEmail || undefined,
                primary_phone: primaryPhone || undefined,
                notification_email: notificationEmail ? 1 : 0 || undefined,
                email_type: emailType || undefined,
                secondary_phone: secondaryPhone || undefined,
                company_name: companyName || undefined,
                website: formattedWebsite || undefined,
                address: address || undefined,
                city: city || undefined,
                province: province || undefined,
                country: country || undefined,
                password: password || undefined,
                avatar: avatarFile || undefined,
                company_logo: companyLogoFile || undefined,
                company_banner: companyBannerFile || undefined,
                role_id: role ? Number(role) : undefined,
                permissions: selectedPermissions || [],
            };

            if (subAccountId) {
                // Add _method: 'PUT' to payload for method override
                const updatedPayload = { ...payload, _method: 'PUT' };
                setIsLoading(true)
                await Edit(subAccountId, updatedPayload, token);
                toast.success('Sub-Account updated successfully');
                setOpenSaveDialog(true)
                if (agentId) {
                    router.push(`/dashboard/agents/create/${agentId}`);
                } else {
                    router.push(`/dashboard/sub-accounts`);
                }
                setIsLoading(false)
                setIsDirty(false)
            } else {
                setIsLoading(true)
                await Create(payload, token);
                toast.success('Sub-Account created successfully');
                setOpenSaveDialog(true)
                if (agentId) {
                    router.push(`/dashboard/agents/create/${agentId}`);
                } else {
                    router.push(`/dashboard/sub-accounts`);
                }
                setIsLoading(false)
                setIsDirty(false)
            }

        } catch (error) {
            setIsLoading(false);
            setOpenSaveDialog(false);

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

                if (normalizedErrors.primary_email && normalizedErrors.primary_email.some(msg => msg.toLowerCase().includes('already been taken'))) {
                    toast.error('Email is already connected as a co-agent. Either deactivate that account or create a new one using a different email address.');
                } else {
                    toast.error('Validation error kindly re-check your form');
                }
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit user data');
            }
        }
    };

    return (
        <div className='font-alexandria'>
            <div ref={headerRef} className='w-full h-[80px] font-alexandria z-50 sticky top-0 flex justify-between px-[20px] items-center' style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}> Sub Account
                    {currentUser ? ` › ${currentUser.first_name} ${currentUser.last_name}` : ' › Create'}</p>
                <Button onClick={(e) => { handleSubmit(e) }} disabled={isLoading} className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}>
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Save Changes"}
                </Button>
            </div>

            <div className="flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[#4290E9] text-[18px] font-[600] sticky top-[80px] z-40" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                        ${activeTab === "profile"
                                ? `${userType}-bg text-white`
                                : "bg-[#F2F2F2] text-[#666666]"
                            }`}
                    >
                        PROFILE
                    </button>
                    <button
                        onClick={() => setActiveTab("permissions")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                        ${activeTab === "permissions"
                                ? `${userType}-bg text-white`
                                : "bg-[#F2F2F2] text-[#666666]"
                            }`}
                    >
                        PERMISSIONS
                    </button>
                    <button
                        onClick={() => setActiveTab("payment")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                        ${activeTab === "payment"
                                ? `${userType}-bg text-white`
                                : "bg-[#F2F2F2] text-[#666666]"
                            }`}
                    >
                        PAYMENT
                    </button>
                </div>
            </div>
            <SaveModal
                isOpen={openSaveDialog}
                onClose={() => setOpenSaveDialog(false)}
                isLoading={isLoading}
                isSuccess={true}
                backLink={`/dashboard/agents/${agentId}`}
                title={'Sub Accounts'}
            />
            <div>
                <form
                    onChange={() => {
                        // Only mark as dirty if:
                        // 1. Not currently populating data from API
                        // 2. Has initially rendered (prevents autofill from triggering)
                        if (!isPopulatingData.current && hasInitiallyRendered.current) {
                            setIsDirty(true);
                        }
                    }}
                >
                    {activeTab === "profile" && (
                        <Accordion type="multiple" defaultValue={["profile", "branding", "account"]} className="w-full space-y-4">
                            <AccordionItem value="profile">
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9] ' : userType === 'agent' ? '[&>svg]:text-[#6BAE41] ' : '[&>svg]:text-[#4290E9] '}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                                > PROFILE</AccordionTrigger>
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
                                                                setFieldErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors.first_name;
                                                                    return newErrors;
                                                                });
                                                            }
                                                        }}
                                                        className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.first_name ? 'border-red-500' : ''}`} type="text" />
                                                    {fieldErrors.first_name && <p className='text-red-500 text-[10px]'>{fieldErrors.first_name[0]}</p>}
                                                </div>
                                                <div>
                                                    <label htmlFor="">Last Name <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={lastName}
                                                        onChange={(e) => {
                                                            setLastName(e.target.value);
                                                            if (fieldErrors.last_name) {
                                                                setFieldErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors.last_name;
                                                                    return newErrors;
                                                                });
                                                            }
                                                        }}
                                                        className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.last_name ? 'border-red-500' : ''}`} type="text" />
                                                    {fieldErrors.last_name && <p className='text-red-500 text-[10px]'>{fieldErrors.last_name[0]}</p>}
                                                </div>
                                                {userType === 'admin' &&
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Connected Agents <span className="text-red-500">*</span></label>
                                                        <Select value={connectedAgent} onValueChange={(val) => {
                                                            setConnectedAgent(val);
                                                            if (fieldErrors.agent_id) {
                                                                setFieldErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors.agent_id;
                                                                    return newErrors;
                                                                });
                                                            }
                                                        }} disabled={!!agentId}>
                                                            <SelectTrigger className={`w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB] ${fieldErrors.agent_id ? 'border-red-500' : ''}`}>
                                                                <SelectValue placeholder="Select Agent" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {agent.map((ag) => (
                                                                    <SelectItem key={ag.uuid} value={ag.uuid}>
                                                                        {ag.first_name} {ag.last_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        {fieldErrors.agent_id && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.agent_id[0]}</p>}
                                                    </div>
                                                }
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Email <span className="text-red-500">*</span></label>
                                                    <Input value={email}
                                                        onChange={(e) => {
                                                            setEmail(e.target.value);
                                                            if (fieldErrors.primary_email) {
                                                                setFieldErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors.primary_email;
                                                                    return newErrors;
                                                                });
                                                            }
                                                        }}
                                                        autoComplete="off"
                                                        className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.primary_email ? 'border-red-500' : ''}`} type="email" />

                                                    {fieldErrors.primary_email && <p className='text-red-500 text-[10px]'>{fieldErrors.primary_email[0]}</p>}
                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Email Secondary</label>
                                                    <Input value={secondaryEmail}
                                                        onChange={(e) => setSecondaryEmail(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="email" />
                                                </div>
                                                <div className='flex items-center gap-[10px]'>
                                                    <div className='flex items-center gap-[10px]'>
                                                        <Input
                                                            type='checkbox'
                                                            checked={notificationEmail}
                                                            onChange={(e) => setNotificationEmail(e.target.checked)}
                                                            className='h-[20px] w-[20px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                        />
                                                        <p className='text-[16px] font-normal text-[#666666] mt-[12px]'>
                                                            Notification Email
                                                        </p>
                                                    </div>

                                                </div>
                                                <div className=''>
                                                    <Select value={emailType} onValueChange={setEmailType}>
                                                        <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                                                            <SelectValue placeholder="Select Email Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="primary">Primary Email</SelectItem>
                                                            <SelectItem value="secondary">Secondary Email</SelectItem>
                                                            <SelectItem value="both">Both</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label htmlFor="">Primary Phone <span className="text-red-500">*</span></label>
                                                    <Input value={primaryPhone}
                                                        onChange={(e) => {
                                                            setPrimaryPhone(e.target.value);
                                                            if (fieldErrors.primary_phone) {
                                                                setFieldErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors.primary_phone;
                                                                    return newErrors;
                                                                });
                                                            }
                                                        }}
                                                        className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.primary_phone ? 'border-red-500' : ''}`} type="text" />
                                                    {fieldErrors.primary_phone && <p className='text-red-500 text-[10px]'>{fieldErrors.primary_phone[0]}</p>}
                                                </div>
                                                <div>
                                                    <label htmlFor="">Secondary Phone</label>
                                                    <Input value={secondaryPhone}
                                                        onChange={(e) => setSecondaryPhone(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                </div>

                                                <div className='col-span-2'>
                                                    <label htmlFor="">Company Name</label>
                                                    <Input value={companyName}
                                                        onChange={(e) => setCompanyName(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Company Website</label>
                                                    <Input value={companyWebsite}
                                                        onChange={(e) => setCompanyWebsite(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />

                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Address</label>
                                                    <GooglePlacesAutocomplete
                                                        value={address}
                                                        onChange={(val) => setAddress(val)}
                                                        onAddressComponents={(components) => {
                                                            setAddress(components.address_line_1);
                                                            setCity(components.city);
                                                            setCountry(components.country);
                                                            setPostalCode(components.postal_code);
                                                            setTimeout(() => {
                                                                setProvince(components.province);
                                                            }, 100);
                                                        }}
                                                        className="h-[42px] mt-[12px]"
                                                        inputClassName="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB]"
                                                        placeholder="Enter address"
                                                        fieldErrors={fieldErrors}
                                                    />
                                                </div>
                                                <div className='hidden'>
                                                    <label htmlFor="">City</label>
                                                    <Input value={city}
                                                        onChange={(e) => setCity(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                </div>
                                                <div className='hidden'>
                                                    <label htmlFor="">Province</label>
                                                    <Select
                                                        value={province}
                                                        onValueChange={(val) => setProvince(val)}
                                                        disabled={!states.length}
                                                    >
                                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                                                            <SelectValue placeholder="Select Province" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {states.map((s, i) => (
                                                                <SelectItem key={i} value={s.isoCode}>
                                                                    {s.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className='col-span-2 hidden'>
                                                    <label htmlFor="">Postal Code</label>
                                                    <Input value={postalCode}
                                                        onChange={(e) => setPostalCode(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                </div>
                                                <div className='col-span-2 hidden'>
                                                    <label htmlFor="">Country</label>
                                                    <Select value={country} onValueChange={(val) => {
                                                        setCountry(val);
                                                        setProvince("");
                                                    }}>
                                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                                                            <SelectValue placeholder="Select Country" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countries.map((c, i) => (
                                                                <SelectItem key={i} value={c.isoCode}>
                                                                    {c.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className='col-span-2 h-[200px]'>
                                                    <DynamicMap
                                                        address={address}
                                                        city={city}
                                                        province={province}
                                                        country={country}
                                                    />
                                                </div>
                                                {!currentUser && (
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Password <span className="text-red-500">*</span></label>
                                                        <Input
                                                            value={password}
                                                            onChange={(e) => {
                                                                setPassword(e.target.value);
                                                                if (fieldErrors.password) {
                                                                    setFieldErrors(prev => {
                                                                        const newErrors = { ...prev };
                                                                        delete newErrors.password;
                                                                        return newErrors;
                                                                    });
                                                                }
                                                            }}
                                                            className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.password ? 'border-red-500' : ''}`}
                                                            autoComplete="new-password"
                                                            type="password"
                                                        />
                                                        {fieldErrors.password && <p className='text-red-500 text-[10px]'>{fieldErrors.password[0]}</p>}
                                                    </div>
                                                )}
                                                {currentUser && (<p className='text-[16px] font-normal text-[#666666]'>Reset Password</p>)}

                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="branding">
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9] ' : userType === 'agent' ? '[&>svg]:text-[#6BAE41] ' : '[&>svg]:text-[#4290E9] '}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
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
                                                    Avatar 96 x 96, PNG or JPG
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
                                    <AccordionTrigger
                                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#4290E9]'} [&>svg]:text-[#6BAE41]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
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
                                                                type="subaccount"
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
                    )}

                    {activeTab === "permissions" && (
                        <Accordion type="multiple" defaultValue={["permissions"]} className="w-full space-y-4">
                            <AccordionItem value="permissions">
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9] ' : userType === 'agent' ? '[&>svg]:text-[#6BAE41] ' : '[&>svg]:text-[#4290E9] '}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                                >PERMISSION ACCESS</AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='flex flex-col w-full md:w-[410px] mt-[20px] px-[10px] md:px-0'>
                                            <label htmlFor="">Role <span className="text-red-500">*</span></label>
                                            <Select
                                                value={String(role)}
                                                onValueChange={(val) => {
                                                    setRole(val);
                                                    if (fieldErrors.role_id) {
                                                        setFieldErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.role_id;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.role_id ? 'border-red-500' : ''}`}>
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
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            {permissions?.map((permission) => (
                                                <div key={permission.id} className="flex items-center justify-between">
                                                    <p>{permission.name}</p>
                                                    <Switch
                                                        checked={selectedPermissions.includes(Number(permission.id))}
                                                        onCheckedChange={(checked) => togglePermission(Number(permission.id), checked)}
                                                        className="bg-gray-300 data-[state=checked]:bg-[#6BAE41]"
                                                    />
                                                </div>
                                            ))}
                                            {fieldErrors.permissions && <p className='text-red-500 text-[10px]'>{fieldErrors.permissions[0]}</p>}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}

                    {activeTab === "payment" && (
                        <div className="w-full flex justify-center py-10">
                            <p className="text-[#666666]">Payment settings are currently unavailable for this sub-account.</p>
                        </div>
                    )}
                </form>
            </div>
        </div >
    )
}

export default OrdersForm