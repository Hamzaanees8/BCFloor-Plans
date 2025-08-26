'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Create, Edit, GetOne, GetPermissions, GetRole, ResetPassword, UserPayload } from '../admin'
import { useParams, useRouter } from 'next/navigation'
import { Country, State } from 'country-state-city';
import { SaveModal } from '@/components/SaveModal'
import DynamicMap from '@/components/DYnamicMap'
const AdminForm = () => {
    type CurrentUser = {
        first_name?: string;
        last_name?: string;
        roles?: [{ id: number }];
        email?: string;
        secondary_email?: string;
        notification_email?: string;
        email_type?: string;
        primary_phone?: string;
        secondary_phone?: string;
        company_name?: string;
        website?: string;
        address?: string;
        city?: string;
        province?: string;
        country?: string;
        permissions?: { id: number | string }[];
        avatar_url?: string;
        company_logo_url?: string;
        company_banner_url?: string;
    };
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [secondaryEmail, setSecondaryEmail] = useState("");
    const [notificationEmail, setNotificationEmail] = useState('');
    const [emailType, setEmailType] = useState("both");
    const [primaryPhone, setPrimaryPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [country, setCountry] = useState("CA");
    const [password, setPassword] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

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
    type Permission = { id: string; name: string };
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
    const [companyBannerFile, setCompanyBannerFile] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [countries, setCountries] = useState<{ name: string, isoCode: string }[]>([]);
    const [states, setStates] = useState<{ name: string, isoCode: string }[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();
    console.log('emailType', emailType);
    console.log('countries', countries);
    console.log('province', province);

    const params = useParams();
    const userId = params?.id as string;

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
        setCountries(Country.getAllCountries());
    }, []);

    useEffect(() => {
        if (country) {
            setStates(State.getStatesOfCountry(country));
            setProvince('');
        }
    }, [country]);

    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.first_name || "");
            setLastName(currentUser.last_name || "");
            setRole(currentUser.roles && currentUser.roles.length > 0 ? String(currentUser.roles[0].id) : "");
            setEmail(currentUser.email || "");
            setSecondaryEmail(currentUser.secondary_email || "");
            setNotificationEmail(currentUser.notification_email || "");
            setEmailType(currentUser.email_type || "both");
            setPrimaryPhone(currentUser.primary_phone || "");
            setSecondaryPhone(currentUser.secondary_phone || "");
            setCompanyName(currentUser.company_name || "");
            setCompanyWebsite(currentUser.website || "");
            setAddress(currentUser.address || "");
            setCity(currentUser.city || "");
            setProvince(currentUser.province || "");
            setCountry(currentUser.country || "");
            setSelectedPermissions(currentUser.permissions?.map((p) => Number(p.id)) || []);

            if (currentUser.avatar_url) setAvatarUrl(currentUser.avatar_url);
            if (currentUser.company_logo_url) setCompanyLogoUrl(currentUser.company_logo_url);
            if (currentUser.company_banner_url) setCompanyBannerUrl(currentUser.company_banner_url);
        }
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

        if (userId) {
            GetOne(token, userId)
                .then(data => setCurrentUser(data.data))
                .catch(err => console.log(err.message));
        } else {
            console.log('User ID is undefined.');
        }
    }, [userId]);



    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        GetPermissions(token)
            .then(data => setPermissions(Array.isArray(data.data) ? data.data : []))
            .catch(err => console.log(err.message));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token') || '';
            let formattedWebsite = companyWebsite?.trim();
            if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
                formattedWebsite = 'https://' + formattedWebsite;
            }

            const payload: UserPayload = {
                first_name: firstName,
                last_name: lastName,
                email,
                secondary_email: secondaryEmail || undefined,
                primary_phone: primaryPhone || undefined,
                secondary_phone: secondaryPhone || undefined,
                company_name: companyName || undefined,
                website: formattedWebsite || undefined,
                address: address || undefined,
                city: city || undefined,
                province: province || undefined,
                country: country || undefined,
                password: password || undefined,
                password_confirmation: password || undefined,
                avatar: avatarFile || undefined,
                company_logo: companyLogoFile || undefined,
                company_banner: companyBannerFile || undefined,
                roles: role ? [Number(role)] : undefined,
                permissions: selectedPermissions || [],
            };

            if (userId) {
                const updatedPayload = { ...payload, _method: 'PUT' };
                await Edit(userId, updatedPayload, token);
                toast.success('User updated successfully');
                setIsLoading(true)
                setOpen(true)
                router.push('/dashboard/admin');
                setIsLoading(false)
            } else {
                await Create(payload, token);
                toast.success('User created successfully');
                setIsLoading(true)
                setOpen(true)
                router.push('/dashboard/admin');
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
                toast.error('Failed to submit user data');
            }
        }
    };


    const handlePasswordReset = async (userId: string) => {
        try {
            const token = localStorage.getItem('token') || '';

            const payload = {
                new_password: password,
                password_confirmation: password,
                _method: "PUT"
            }
            console.log('payload', payload);

            await ResetPassword(payload, userId, token);
            toast.success('Reset email Send successfully');
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to send email');
            } else {
                console.error('sending failed:', error);
                toast.error('Failed to send email');
            }
        }
    };
    return (
        <div className='font-alexandria'>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                {userId ? (
                    <p className='text-[16px] md:text-[24px] font-[400] text-[#4290E9]'>
                        Admin Edit › {currentUser?.first_name} {currentUser?.last_name}
                    </p>
                ) : (
                    <p className='text-[16px] md:text-[24px] font-[400] text-[#4290E9]'>
                        Admin Create
                    </p>
                )}
                <Button onClick={(e) => { handleSubmit(e) }} className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'>Save Changes</Button>
            </div>
            {/* <div className='flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600]' >
                <ToggleButtons />
            </div> */}
            <div>
                <form >
                    <Accordion type="multiple" defaultValue={["profile", "permissions", "branding"]} className="w-full space-y-4">
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
                                                <label htmlFor="">Last Name</label>
                                                <Input
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
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

                                                {fieldErrors.roles && <p className='text-red-500 text-[10px]'>{fieldErrors.roles[0]}</p>}
                                            </div>
                                            <div className='col-span-2'>
                                                <label htmlFor="">Email <span className="text-red-500">*</span></label>
                                                <Input value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />

                                                {fieldErrors.email && <p className='text-red-500 text-[10px]'>{fieldErrors.email[0]}</p>}
                                            </div>
                                            <div className='col-span-2'>
                                                <label htmlFor="">Email Secondary</label>
                                                <Input value={secondaryEmail}
                                                    onChange={(e) => setSecondaryEmail(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div className='flex items-center gap-[10px]'>
                                                <Input value={notificationEmail}
                                                    onChange={(e) => setNotificationEmail(e.target.value)}
                                                    type='checkbox' className='h-[20px] w-[20px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' />
                                                <p className='text-[16px] font-normal text-[#666666] mt-[12px]'>Notification Email</p>
                                            </div>
                                            <div className=''>
                                                <Select onValueChange={setEmailType} >
                                                    <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                                                        <SelectValue placeholder="Both" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="primary">Primary Email</SelectItem>
                                                        <SelectItem value="secondary">Secondary Email</SelectItem>
                                                        <SelectItem value="both">Both</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label htmlFor="">Primary Phone</label>
                                                <Input value={primaryPhone}
                                                    onChange={(e) => setPrimaryPhone(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
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
                                                <Input value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div>
                                                <label htmlFor="">City</label>

                                                <Input value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    placeholder='Burnaby'
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div>
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
                                            <div className='col-span-2'>
                                                <label htmlFor="">Country</label>
                                                <Select value={country} onValueChange={(val) => setCountry(val)}>
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
                                                    address={address}
                                                    city={city}
                                                    province={province}
                                                    country={country}
                                                />
                                            </div>
                                            <div className='col-span-2'>
                                                <label htmlFor="">Password <span className="text-red-500">*</span></label>
                                                <Input value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="password" />

                                                {fieldErrors.password && <p className='text-red-500 text-[10px]'>{fieldErrors.password[0]}</p>}
                                            </div>
                                            <p onClick={() => handlePasswordReset(userId)} className={`${userId ? 'flex' : 'hidden'} text-[16px] cursor-pointer hover:text-[#505050] font-normal text-[#666666]`}>Reset Password</p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="permissions">
                            <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>PERMISSION ACCESS</AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className='w-full flex flex-col items-center'>
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

                        <AccordionItem value="branding">
                            <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>Branding Assets</AccordionTrigger>
                            <AccordionContent className="grid gap-4">
                                <div className='w-full flex flex-col items-center'>
                                    <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                        <div className='flex flex-col gap-y-[6px]'>
                                            <div className='flex items-end gap-x-[6px]'>
                                                {avatarUrl ?
                                                    <Image
                                                        src={avatarUrl}
                                                        alt="Avatar"
                                                        width={64}
                                                        height={64}
                                                        unoptimized
                                                        className="h-16 w-16 object-cover border"
                                                    />
                                                    : <div className='w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]'></div>
                                                }
                                                <div className="flex-1">
                                                    <Label className="text-sm  text-gray-600">Avatar</Label>
                                                    <div className="flex w-[340px] items-center mt-1 border rounded-md overflow-hidden">
                                                        <span
                                                            title={AvatarfileName}
                                                            className="flex-1 px-3 py-2 text-sm text-[#7D7D7D] truncate whitespace-nowrap overflow-hidden"
                                                        >
                                                            {AvatarfileName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileInput}
                                                            className="bg-[#A8A8A8] px-4 py-2 text-base font-medium text-[#666666] hover:bg-gray-300 whitespace-nowrap"
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

                                                {CompanyLogoUrl
                                                    ? <Image
                                                        src={CompanyLogoUrl}
                                                        alt="Company Logo"
                                                        width={64}
                                                        height={64}
                                                        unoptimized
                                                        className="h-16 w-16 object-cover border"
                                                    />

                                                    : <div className='w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]'></div>}
                                                <div className="flex-1">
                                                    <Label className="text-sm  text-gray-600">Company Logo</Label>
                                                    <div className="flex  w-[340px] items-center mt-1 border rounded-md overflow-hidden">
                                                        <span className="flex-1 px-3 py-2 text-sm text-[#7D7D7D] truncate">
                                                            {CompanyLogofileName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileInput1}
                                                            className="bg-[#A8A8A8] px-4 py-2 text-base font-medium text-[#666666] hover:bg-gray-300"
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
                                            <div className='flex items-end gap-x-[6px]'>
                                                {CompanyBannerUrl
                                                    ? <Image
                                                        unoptimized
                                                        src={CompanyBannerUrl}
                                                        alt="Company Banner"
                                                        width={64}
                                                        height={64}
                                                        className="h-16 w-16 object-cover border"
                                                    />
                                                    : <div className='w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]'></div>}
                                                <div className="flex-1">
                                                    <Label className="text-sm  text-gray-600">Company Banner</Label>
                                                    <div className="flex  w-[340px] items-center mt-1 border rounded-md overflow-hidden">
                                                        <span className="flex-1 px-3 py-2 text-sm text-[#7D7D7D] truncate">
                                                            {CompanyBannerfileName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={triggerFileInput2}
                                                            className="bg-[#A8A8A8] px-4 py-2 text-base font-medium text-[#666666] hover:bg-gray-300"
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
                    </Accordion>
                </form>
            </div>
            <SaveModal
                isOpen={open}
                onClose={() => setOpen(false)}
                isLoading={isLoading}
                isSuccess={true}
                backLink="/dashboard/admin"
                title={'Admin'}
            />
        </div >
    )
}

export default AdminForm