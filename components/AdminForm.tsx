import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import ToggleButtons from './ui/toogle'
import { Label } from './ui/label'
import { Create, GetPermissions, GetRole } from '@/app/dashboard/admin/admin'
import { toast } from 'sonner'

const AdminForm = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [secondaryEmail, setSecondaryEmail] = useState("");
    const [notificationEmailChecked, setNotificationEmailChecked] = useState(false);
    const [emailType, setEmailType] = useState("both");
    const [primaryPhone, setPrimaryPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [country, setCountry] = useState("");
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('file', file);
            setAvatarFile(file);
            setAvatarFileName(file.name);
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log('file', file);
        if (file) {
            setCompanyLogoFile(file);
            setCompanyLogoFileName(file.name);
            setCompanyLogoUrl(URL.createObjectURL(file));
        }
    };

    const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('file', file);
            setCompanyBannerFile(file);
            setCompanyBannerFileName(file.name);
            setCompanyBannerUrl(URL.createObjectURL(file));
        }
    };


    // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0]
    //     if (file) {
    //         setAvatarFileName(file.name)
    //         setAvatarUrl(URL.createObjectURL(file))
    //     }
    // }




    const triggerFileInput = () => {
        if (AvatarfileInputRef.current) {
            (AvatarfileInputRef.current as HTMLInputElement).click()
        }
    }
    // const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0]
    //     if (file) {
    //         console.log('file', file);

    //         setCompanyLogoFileName(file.name)
    //         setCompanyLogoUrl(URL.createObjectURL(file))
    //     }
    // }

    const triggerFileInput1 = () => {
        if (CompanyLogofileInputRef.current) {
            (CompanyLogofileInputRef.current as HTMLInputElement).click()
        }
    }
    // const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0]
    //     if (file) {
    //         setCompanyBannerFileName(file.name)
    //         setCompanyBannerUrl(URL.createObjectURL(file))
    //     }
    // }

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


    // useEffect(() => {
    //     const token = localStorage.getItem("token");

    //     if (!token) {
    //         console.log('Token not found.')
    //         return;
    //     }

    //     GetRole(token)
    //         .then(data => {
    //             console.log('data');
    //             setRoles(data.data)
    //         })
    //         .catch(err => console.log(err.message));
    // }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem("token");
        if (!token) {
            console.log('Token not found.');
            return;
        }

        GetRole(token)
            .then(data => {
                console.log('Fetched roles:', data);
                setRoles(data.data); // verify shape of data
            })
            .catch(err => console.log('GetRole error:', err));
    }, []);


    useEffect(() => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem("token");
        if (!token) {
            console.log('Token not found.')
            return;
        }

        GetPermissions(token)
            .then(data => setPermissions(Array.isArray(data.data) ? data.data : []))
            .catch(err => console.log(err.message));
    }, []);

    console.log('roles', roles);
    console.log('permissions', permissions);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token') || '';

            const payload = {
                first_name: firstName,
                last_name: lastName,
                email,
                secondary_email: secondaryEmail,
                primary_phone: primaryPhone,
                secondary_phone: secondaryPhone,
                company_name: companyName,
                website: companyWebsite,
                address,
                city,
                province,
                country,
                // roles: [Number(role)], // ensure this is a number
                // permissions: selectedPermissions, // ensure this is number[]
                roles: Array.isArray(role) ? role.map(Number) : [Number(role)].filter(n => !isNaN(n)),
                permissions: Array.isArray(selectedPermissions) 
                    ? selectedPermissions.map(Number).filter(n => !isNaN(n)) 
                    : [],
                ...(password ? {
                    password,
                    password_confirmation: password,
                }
                : {}),
            };

            const result = await Create(payload, token);

            console.log('User created successfully:', result);
            toast.success('User created successfully')
        } catch (error) {
            if (error instanceof Error) {
                console.error('User creation failed:', error.message);
            } else {
                console.error('User creation failed:', error);
            }
        }
    };


    console.log('selected role', role);
    console.log('selected permissions', selectedPermissions);
    console.log('companyBannerFile', companyBannerFile);
    console.log('avatarFile', avatarFile);
    console.log('companyLogoFile', companyLogoFile);
    console.log(emailType);


    return (
        <div className='font-alexandria'>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]  text-[#4290E9]'>Admin Edit › Phillip Phillipson (BC Floor Plans)</p>
                <Button onClick={(e) => { handleSubmit(e) }} className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'>Save Changes</Button>
            </div>
            <div className='flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600]' >
                <ToggleButtons />
            </div>
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
                                                <label htmlFor="">First Name</label>
                                                <Input
                                                    required
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div>
                                                <label htmlFor="">Last Name</label>
                                                <Input
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
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
                                            </div>
                                            <div className='col-span-2'>
                                                <label htmlFor="">Email</label>
                                                <Input value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div className='col-span-2'>
                                                <label htmlFor="">Email Secondary</label>
                                                <Input value={secondaryEmail}
                                                    onChange={(e) => setSecondaryEmail(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div className='flex items-center gap-[10px]'>
                                                <Input
                                                    checked={notificationEmailChecked}
                                                    onChange={(e) => setNotificationEmailChecked(e.target.checked)}
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
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div>
                                                <label htmlFor="">Province</label>
                                                <Input value={province}
                                                    onChange={(e) => setProvince(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div className='col-span-2'>
                                                <label htmlFor="">Country</label>
                                                <Input value={country}
                                                    onChange={(e) => setCountry(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                            </div>
                                            <div className='col-span-2 h-[200px]'>
                                                <iframe
                                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2357.039223216655!2d-1.7544379236894128!3d53.788789441527214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487be1362e87f88b%3A0x55da5536b65b1607!2sNelson%20St%2C%20Bradford%2C%20UK!5e0!3m2!1sen!2s!4v1748978374452!5m2!1sen!2s"
                                                    width="100%"
                                                    height="100%"
                                                    allowFullScreen
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    className="border-0"
                                                    title="Google Map - Burnaby, BC"
                                                ></iframe>
                                            </div>
                                            <div className='col-span-2'>
                                                <label htmlFor="">Password</label>
                                                <Input value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="password" />
                                            </div>
                                            <p className='text-[16px] font-normal text-[#666666]'>Reset Password</p>
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
                                                {/* Avatar */}
                                                <Image
                                                    src={avatarUrl || "/default-avatar.png"}
                                                    alt="Avatar"
                                                    width={64}
                                                    height={64}
                                                    className="h-16 w-16 object-cover border"
                                                />
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
                                                {/* Company Logo */}
                                                <Image
                                                    src={CompanyLogoUrl || "/default-logo.png"}
                                                    alt="Company Logo"
                                                    width={64}
                                                    height={64}
                                                    className="h-16 w-16 object-cover border"
                                                />
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
                                                {/* Company Banner */}
                                                <Image
                                                    src={CompanyBannerUrl || "/default-banner.png"}
                                                    alt="Company Banner"
                                                    width={64}
                                                    height={64}
                                                    className="h-16 w-16 object-cover border"
                                                />
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
        </div >
    )
}

export default AdminForm