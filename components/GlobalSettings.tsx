"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Check, Plus, X } from 'lucide-react'
import DiscountTable, { Discount } from './DiscountTable'
import { toast } from "sonner";
import Link from 'next/link'
import { ArrowDown, ArrowUp, DropDownArrow } from './Icons'
//import CloseDialog from './CloseDialog'
import PaymentDialog from './PaymentDialog'
import AddDiscountDialog from './AddDiscountDialog'
import { CreateCompany, DeleteCard, GetCompany, GetDiscount, GetPaymentMethod, UpdateCompany } from '@/app/dashboard/global-settings/global-settings'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
//import SaveDialog from './SaveDialog'
import { DateTime } from 'luxon';
import { Country, State } from 'country-state-city';
import { SaveModal } from './SaveModal'
import DynamicMap from './DYnamicMap'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/app/context/AppContext'
import { EditAgent, GetOne } from '@/app/dashboard/agents/agents'
import ChangePasswordDialog from './ChangePasswordDialog'
import AddCoAgentDialog from './AddCoAgentDialog'
import { useUnsaved } from '@/app/context/UnsavedContext'
import useUnsavedChangesWarning from '@/app/hooks/useUnsavedChangesWarning'
import GlobalTourSetting from './GlobalTourSetting'
import AgentDiscount from './AgentDiscount'

interface CompanyData {
    id: number;
    uuid: string;
    name: string;
    website: string;
    email: string;
    primary_phone: string;
    secondary_phone: string | null;
    street: string;
    city: string;
    province: string;
    country: string;
    billing_street_1: string;
    billing_street_2: string | null;
    review_files: boolean;
    logo_path: string | null;
    banner_path: string | null;
    start_time: string;
    end_time: string;
    work_days: string[];
    repeat_weekly: string;
    timezone: string;
    commute_minutes: number;
    enable_breaks: boolean;
    sync_google: boolean;
    sync_email: string;
    payment_per_km: string;
    order_form_url: string | null;
    iframe_code: string | null;

}
type TimeZoneOption = {
    label: string;
    value: string;
};
export interface PaymentCard {
    uuid: string;
    type: 'visa' | 'mastercard' | 'amex';
    last_four: string;
    cardholder_name: string;
    is_primary?: boolean;
    expiry_date: string;
}
interface Agent {
    name: string;
    email: string;
    primary_phone: string;
    split: string;
}
export const friendlyTimeZoneNames: Record<string, string> = {
    // North America
    'America/New_York': 'Eastern Time - New York',
    'America/Toronto': 'Eastern Time - Toronto',
    'America/Detroit': 'Eastern Time - Detroit',
    'America/Indiana/Indianapolis': 'Eastern Time - Indianapolis',
    'America/Chicago': 'Central Time - Chicago',
    'America/Winnipeg': 'Central Time - Winnipeg',
    'America/Regina': 'Central Standard Time - Regina',
    'America/Denver': 'Mountain Time - Denver',
    'America/Edmonton': 'Mountain Time - Edmonton',
    'America/Phoenix': 'Mountain Standard Time - Phoenix',
    'America/Los_Angeles': 'Pacific Time - Los Angeles',
    'America/Vancouver': 'Pacific Time - Vancouver',
    'America/Anchorage': 'Alaska Time - Anchorage',
    'America/Juneau': 'Alaska Time - Juneau',
    'Pacific/Honolulu': 'Hawaii-Aleutian Time - Honolulu',
    'America/Caracas': 'Venezuelan Standard Time - Caracas',
    'America/Mexico_City': 'Central Time - Mexico City',
    'America/Guatemala': 'Central Time - Guatemala City',
    'America/Panama': 'Eastern Standard Time - Panama City',

    // South America
    'America/Sao_Paulo': 'Brasilia Time - São Paulo',
    'America/Argentina/Buenos_Aires': 'Argentina Time - Buenos Aires',
    'America/Bogota': 'Colombia Time - Bogotá',
    'America/Lima': 'Peru Time - Lima',
    'America/Montevideo': 'Uruguay Standard Time - Montevideo',

    // Europe
    'Europe/London': 'Greenwich Mean Time - London',
    'Europe/Dublin': 'Greenwich Mean Time - Dublin',
    'Europe/Paris': 'Central European Time - Paris',
    'Europe/Berlin': 'Central European Time - Berlin',
    'Europe/Madrid': 'Central European Time - Madrid',
    'Europe/Rome': 'Central European Time - Rome',
    'Europe/Amsterdam': 'Central European Time - Amsterdam',
    'Europe/Brussels': 'Central European Time - Brussels',
    'Europe/Vienna': 'Central European Time - Vienna',
    'Europe/Zurich': 'Central European Time - Zurich',
    'Europe/Moscow': 'Moscow Time - Moscow',
    'Europe/Istanbul': 'Turkey Time - Istanbul',
    'Europe/Kiev': 'Eastern European Time - Kyiv',
    'Europe/Helsinki': 'Eastern European Time - Helsinki',
    'Europe/Athens': 'Eastern European Time - Athens',
    'Europe/Oslo': 'Central European Time - Oslo',
    'Europe/Stockholm': 'Central European Time - Stockholm',
    'Europe/Belgrade': 'Central European Time - Belgrade',
    'Europe/Sarajevo': 'Central European Time - Sarajevo',

    // Asia
    'Asia/Kolkata': 'India Standard Time - Kolkata',
    'Asia/Calcutta': 'India Standard Time - Calcutta',
    'Asia/Shanghai': 'China Standard Time - Shanghai',
    'Asia/Tokyo': 'Japan Standard Time - Tokyo',
    'Asia/Seoul': 'Korea Standard Time - Seoul',
    'Asia/Singapore': 'Singapore Time - Singapore',
    'Asia/Dubai': 'Gulf Standard Time - Dubai',
    'Asia/Jerusalem': 'Israel Standard Time - Jerusalem',
    'Asia/Bangkok': 'Indochina Time - Bangkok',
    'Asia/Srednekolymsk': 'Magadan Time - Srednekolymsk',
    'Asia/Karachi': 'Pakistan Standard Time - Karachi',
    'Asia/Yekaterinburg': 'Yekaterinburg Time - Yekaterinburg',
    'Asia/Krasnoyarsk': 'Krasnoyarsk Time - Krasnoyarsk',
    'Asia/Novosibirsk': 'Novosibirsk Time - Novosibirsk',
    'Asia/Irkutsk': 'Irkutsk Time - Irkutsk',
    'Asia/Yakutsk': 'Yakutsk Time - Yakutsk',
    'Asia/Vladivostok': 'Vladivostok Time - Vladivostok',
    'Asia/Magadan': 'Magadan Time - Magadan',
    'Asia/Kamchatka': 'Kamchatka Time - Kamchatka',
    'Asia/Ulaanbaatar': 'Ulaanbaatar Time - Ulaanbaatar',
    'Asia/Hong_Kong': 'Hong Kong Time - Hong Kong',
    'Asia/Manila': 'Philippine Time - Manila',

    // Oceania
    'Australia/Sydney': 'Australian Eastern Time - Sydney',
    'Australia/Melbourne': 'Australian Eastern Time - Melbourne',
    'Australia/Brisbane': 'Australian Eastern Time - Brisbane',
    'Australia/Adelaide': 'Australian Central Time - Adelaide',
    'Australia/Perth': 'Australian Western Time - Perth',
    'Pacific/Auckland': 'New Zealand Time - Auckland',
    'Pacific/Fiji': 'Fiji Time - Suva',
    'Pacific/Guam': 'Chamorro Standard Time - Guam',
    'Pacific/Majuro': 'Marshall Islands Time - Majuro',
    'Pacific/Noumea': 'New Caledonia Time - Nouméa',

    // Africa
    'Africa/Johannesburg': 'South Africa Standard Time - Johannesburg',
    'Africa/Cairo': 'Eastern European Time - Cairo',
    'Africa/Lagos': 'West Africa Time - Lagos',
    'Africa/Algiers': 'Central European Time - Algiers',
    'Africa/Nairobi': 'East Africa Time - Nairobi',
    'Africa/Khartoum': 'Central Africa Time - Khartoum',
    'Africa/Dakar': 'Greenwich Mean Time - Dakar',
    'Africa/Casablanca': 'Western European Time - Casablanca',

    // Atlantic
    'Atlantic/Azores': 'Azores Time - Azores',
    'Atlantic/Bermuda': 'Atlantic Standard Time - Bermuda',
    'Atlantic/Reykjavik': 'Greenwich Mean Time - Reykjavik',

    // Others
    'Pacific/Apia': 'Apia Time - Apia',
    'Pacific/Chatham': 'Chatham Standard Time - Chatham Islands',
    'Pacific/Easter': 'Easter Island Standard Time - Easter Island',
    'Pacific/Galapagos': 'Galapagos Time - Galápagos',
    'Pacific/Tongatapu': 'Tonga Time - Tongatapu',
};


const GlobalSettings = () => {
    const [companyData, setCompanyData] = useState<CompanyData | null>(null);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [email, setEmail] = useState('');
    const [primaryPhone, setPrimaryPhone] = useState('');
    const [secondaryPhone, setSecondaryPhone] = useState('');
    const [headquarterAddress, setHeadquarterAddress] = useState('');
    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [country, setCountry] = useState('CA');
    const [billingAddress1, setBillingAddress1] = useState('');
    const [billingAddress2, setBillingAddress2] = useState('');
    const [adminReviewRequired, setAdminReviewRequired] = useState(false);
    const [paymentPerKm, setPaymentPerKm] = useState('');
    const [password, setPassword] = useState("");
    const [orderLink, setOrderLink] = useState("");
    const [iframeCode, setIframeCode] = useState(``);
    const CompanyLogofileInputRef = useRef(null);
    const [CompanyLogofileName, setCompanyLogoFileName] = useState('')
    const [CompanyLogoUrl, setCompanyLogoUrl] = useState('')
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
    const CompanyBannerfileInputRef = useRef(null)
    const [CompanyBannerfileName, setCompanyBannerFileName] = useState('')
    const [CompanyBannerUrl, setCompanyBannerUrl] = useState('')
    const [companyBannerFile, setCompanyBannerFile] = useState<File | null>(null);
    const planName = "Team Media Creator Portal";
    const billingCycle = "Monthly";
    const seats = 5;
    const joinDate = "Mar 03, 2021";
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [startTime, setStartTime] = useState("8:00 AM");
    const [endTime, setEndTime] = useState("8:00 AM");
    const [workWeek, setWorkWeek] = useState<string[]>([]);
    const [repeat, setRepeat] = useState('');
    const [timeZone, setTimeZone] = useState('America/Edmonton');
    const [commuteTime, setCommuteTime] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [discounts, setDiscounts] = React.useState<Discount[]>([]);
    const [isReoccuringBreak, setIsReoccuringBreak] = useState(false);
    const [isSyncToGoogle, setIsSyncToGoogle] = useState(false);
    const [syncEmailType, setSyncEmailType] = useState('');
    //const [openCloseDialog, setOpenCloseDialog] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [openAddDiscountDialog, setOpenAddDiscountDialog] = useState(false);
    //const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
    const [cards, setCards] = useState<PaymentCard[]>([]);
    const [timeZoneOptions, setTimeZoneOptions] = useState<TimeZoneOption[]>([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [license, setLicense] = useState("");
    const [certifications, setCertifications] = useState<string[]>([]);
    const [subAccounts, setSubAccounts] = useState<string[]>([]);
    // const [newSubAccount, setNewSubAccount] = useState("");
    const [website, setWebsite] = useState("");
    const AvatarfileInputRef = useRef(null)
    const [AvatarfileName, setAvatarFileName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);
    const [openAddAgentDialog, setOpenAddAgentDialog] = useState(false);
    const [coAgents, setCoAgents] = useState<{ name: string; email: string; primary_phone: string; split: string }[]>([]);
    const [agentdiscounts, setAgentDiscounts] = useState<{ id: number; discount_code: string; expiry_date: string; description: string }[]
    >([]);

    const [openDiscount, setOpenDiscount] = useState(false);



    const { isDirty, setIsDirty } = useUnsaved();
    useUnsavedChangesWarning(isDirty)
    const isPopulatingData = useRef(false);
    console.log('subAccounts', subAccounts);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const repeatOptions = [
        'Repeat every week',
        'Repeat every month',
        'Repeat every year'
    ];
    const [countries, setCountries] = useState<{ name: string, isoCode: string }[]>([]);
    const [states, setStates] = useState<{ name: string, isoCode: string }[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const { userType } = useAppContext()
    const router = useRouter()
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '');

    const commuteTimeOptions = [
        '5 Minutes',
        '10 Minutes',
        '15 Minutes',
        '30 Minutes',
        '45 Minutes',
    ];

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.log("Token not found.");
            setLoading(false);
            setError(true);
            return;
        }
        setLoading(true);
        setError(false);
        if (userType === 'admin') {
            GetCompany(token)
                .then((res) => {
                    console.log("Company Data:", res);
                    const data = res.data;

                    isPopulatingData.current = true;

                    setCompanyData(data);
                    setCompanyName(data.name);
                    setCompanyWebsite(data.website);
                    setEmail(data.email);
                    setPrimaryPhone(data.primary_phone);
                    setSecondaryPhone(data.secondary_phone || '');
                    setHeadquarterAddress(data.street);
                    setCity(data.city);
                    //setProvince(data.province);
                    setCountry(data.country);
                    setBillingAddress1(data.billing_street_1);
                    setBillingAddress2(data.billing_street_2 || '');
                    setAdminReviewRequired(data.review_files);
                    setPaymentPerKm(data.payment_per_km);
                    setOrderLink(data.order_form_url || '');
                    setIframeCode(data.iframe_code || '');
                    setWorkWeek(data.work_days);
                    setRepeat(data.repeat_weekly);
                    setCommuteTime(`${data.commute_minutes} Minutes`);
                    setIsReoccuringBreak(data.enable_breaks);
                    setIsSyncToGoogle(data.sync_google);
                    setSyncEmailType(data.sync_email);
                    setStartTime(formatTime(data.start_time));
                    setTimeZone(data.timezone)
                    setEndTime(formatTime(data.end_time));
                    if (data.logo_url) setCompanyLogoUrl(data.logo_url);
                    if (data.banner_url) setCompanyBannerUrl(data.banner_url);
                    if (data.logo_path) setCompanyLogoFileName(data.logo_path);
                    if (data.banner_path) setCompanyBannerFileName(data.banner_path);
                })
                .catch(err => {
                    console.log(err.message);
                    setError(true);
                })
                .finally(() => {
                    setLoading(false);
                    requestAnimationFrame(() => {
                        isPopulatingData.current = false;
                    });

                    setIsDirty(false);
                });
        } else if (userType === 'agent') {
            GetOne(token, userInfo.uuid)
                .then((res) => {
                    console.log("Agent Data:", res);
                    const data = res.data;

                    isPopulatingData.current = true;

                    setFirstName(data.first_name || '');
                    setLastName(data.last_name || '');
                    setEmail(data.email || '');
                    setPrimaryPhone(data.primary_phone || '');
                    setSecondaryPhone(data.secondary_phone || '');
                    setCompanyName(data.company_name || '');
                    setWebsite(data.website || '');
                    setLicense(data.license_number || '');
                    setCertifications(data.certifications || '');
                    setHeadquarterAddress(data.headquarter_address || '');
                    setCity(data.city || '');
                    setProvince(data.province || '');
                    setCountry(data.country || '');
                    setSubAccounts(data.co_agents || []);

                    if (data.company_logo_url) setCompanyLogoUrl(data.company_logo_url);
                    if (data.company_banner_url) setCompanyBannerUrl(data.company_banner_url);
                    if (data.company_logo) setCompanyLogoFileName(data.company_logo);
                    if (data.company_banner) setCompanyBannerFileName(data.company_banner);
                    if (data.avatar_url) setAvatarUrl(data.avatar_url);
                    if (data.avatar) setAvatarFileName(data.avatar);
                    if (data.co_agents && Array.isArray(data.co_agents)) {
                        const formattedAgents = data.co_agents.map((agent: Agent) => ({
                            name: agent.name,
                            email: agent.email,
                            primary_phone: agent.primary_phone,
                            split: agent.split,
                        }));
                        setCoAgents(formattedAgents);
                    }
                })
                .catch(err => {
                    console.log(err.message);
                    setError(true);
                })
                .finally(() => {
                    setLoading(false);
                    requestAnimationFrame(() => {
                        isPopulatingData.current = false;
                    });

                    setIsDirty(false);
                });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    useEffect(() => {
        if (states.length && companyData?.province) {
            const match = states.find((s) => s.isoCode === companyData.province);
            if (match) {
                setProvince(match.isoCode);
            }
        }
    }, [states, companyData]);
    useEffect(() => {
        if (country) {
            setStates(State.getStatesOfCountry(country));
            setProvince('');
        }
    }, [country]);
    const removeCard = (uuid: string) => {
        setCards((prev) => prev.filter((card) => card.uuid !== uuid));
    };
    const handleDelete = async (uuid: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await DeleteCard(uuid, token);
            removeCard(uuid);
            toast.success("Card removed Successfully");
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error("Failed to delete card:", err.message);
            } else {
                console.error("Failed to delete card:", err);
            }
        }
    };
    const fetchPaymentMethods = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetPaymentMethod(token)
            .then((res) => setCards(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.log("Error fetching data:", err.message));
    }, []);

    useEffect(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);
    // const confirmAndExecute = () => {
    //     pendingAction?.()
    //     setPendingAction(null)
    // }
    const capitalizeFirst = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const fetchDiscounts = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetDiscount(token)
            .then((data) => setDiscounts(Array.isArray(data.data) ? data.data : []))
            .catch((err) => console.log(err.message));
    }, []);

    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        console.log('start time before request', startTime)
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;
        const payload = {
            name: companyName,
            website: companyWebsite,
            email: email,
            primary_phone: primaryPhone,
            secondary_phone: secondaryPhone || null,
            street: headquarterAddress,
            city: city,
            province: province,
            country: country,
            billing_street_1: billingAddress1,
            billing_street_2: billingAddress2 || null,
            review_files: adminReviewRequired ? 1 : 0,
            logo_path: companyLogoFile ?? undefined,
            banner_path: companyBannerFile ?? undefined,
            start_time: convertTo24HourFormat(startTime),
            end_time: convertTo24HourFormat(endTime),
            work_days: workWeek,
            repeat_weekly: repeat,
            timezone: timeZone,
            commute_minutes: parseInt(commuteTime),
            enable_breaks: isReoccuringBreak ? 1 : 0,
            sync_google: isSyncToGoogle ? 1 : 0,
            sync_email: syncEmailType,
            payment_per_km: paymentPerKm,
            order_form_url: orderLink || null,
            iframe_code: iframeCode || null,

        };
        console.log("uuid", companyData?.uuid)
        console.log('payload from global settings', payload)
        try {
            if (userType === 'admin') {
                if (companyData) {
                    console.log("check")
                    const updatedPayload = { ...payload, _method: 'PUT' };
                    await UpdateCompany(updatedPayload, token, companyData.uuid);
                    setIsLoading(true)
                    setOpenSaveDialog(true)
                    router.push('/dashboard/global-settings')
                    setIsLoading(false)
                    setIsDirty(false)
                } else {
                    console.log("check checj")
                    await CreateCompany(payload, token);
                    setIsLoading(true)
                    setOpenSaveDialog(true)
                    router.push('/dashboard/global-settings')
                    setIsLoading(false)
                    setIsDirty(false)
                }
            } else if (userType === 'agent') {
                const payload = {
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    primary_phone: primaryPhone,
                    secondary_phone: secondaryPhone || undefined,
                    company_name: companyName,
                    website: website,
                    license_number: license,
                    certifications: certifications,
                    headquarter_address: headquarterAddress,
                    co_agents: coAgents,
                    avatar: avatarFile || undefined,
                    company_banner: companyBannerFile || undefined,
                    company_logo: companyLogoFile || undefined,
                    _method: 'PUT'
                };

                try {
                    await EditAgent(userInfo.uuid, payload, token);
                    setIsLoading(true);
                    setOpenSaveDialog(true);
                    toast.success('settings updated successfully')
                    setIsLoading(false);
                    setIsDirty(false)
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

                        // const firstError = Object.values(normalizedErrors).flat()[0];
                        // toast.error(firstError || 'Validation error');
                        toast.error('Validation error kindly re-check your form');
                    }
                    else if (error instanceof Error) {
                        toast.error(error.message);
                    } else {
                        toast.error('Failed to submit user data');
                    }
                }
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

                // const firstError = Object.values(normalizedErrors).flat()[0];
                // toast.error(firstError || 'Validation error');
                toast.error('Validation error kindly re-check your form');
            }
            else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit user data');
            }
        }
    };
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

    const triggerFileInput1 = () => {
        if (CompanyLogofileInputRef.current) {
            (CompanyLogofileInputRef.current as HTMLInputElement).click()
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
    // const handleCopy = () => {
    //     navigator.clipboard.writeText(orderLink);
    //     toast.success("Order Link copied!")
    // };
    // const handleCopy2 = () => {
    //     navigator.clipboard.writeText(iframeCode);
    //     toast.success("iFrame code copied!")
    // };
    const handleReset = () => {
        setPassword("");
    };
    const timeToMinutes = (t: string) => {
        const [timePart, period] = t.split(" ");
        const test = timePart.split(":").map(Number);
        let hour = test[0];
        const minuteValue = test[1];
        const minute = minuteValue; // Use const for minute
        if (period === "PM" && hour < 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        return hour * 60 + minute;
    };
    const [open, setOpen] = useState(false);

    const toggleDay = (day: string) => {
        setWorkWeek(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };
    const minutesToTime = (mins: number) => {
        mins = (mins + 1440) % 1440;
        let hour = Math.floor(mins / 60);
        const minute = mins % 60; // <-- changed let to const
        const period = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        if (hour === 0) hour = 12;
        return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
    };

    const handleIncrement = () => {
        const newMinutes = timeToMinutes(startTime) + 1;
        setStartTime(minutesToTime(newMinutes));
    };

    const handleDecrement = () => {
        const newMinutes = timeToMinutes(startTime) - 1;
        setStartTime(minutesToTime(newMinutes));
    };
    const handleIncrement1 = () => {
        const newMinutes = timeToMinutes(endTime) + 1;
        setEndTime(minutesToTime(newMinutes));
    };

    const handleDecrement1 = () => {
        const newMinutes = timeToMinutes(endTime) - 1;
        setEndTime(minutesToTime(newMinutes));
    };
    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
    };
    const convertTo24HourFormat = (time12h: string): string => {
        const [time, modifier] = time12h.trim().split(' '); // e.g. "2:09", "PM"
        const [rawHours, rawMinutes] = time.split(':');

        let hours = parseInt(rawHours, 10);
        const minutes = parseInt(rawMinutes, 10);

        if (modifier === 'PM' && hours < 12) {
            hours += 12;
        }
        if (modifier === 'AM' && hours === 12) {
            hours = 0;
        }

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };
    useEffect(() => {
        // Get all time zones from Intl API
        const zones = Intl.supportedValuesOf('timeZone');

        const options = zones.map((zone) => {
            // Get offset in minutes at current time for this zone
            const offsetInMinutes = DateTime.now().setZone(zone).offset;
            // Convert to (GMT±HH:mm)
            const offsetHours = Math.floor(Math.abs(offsetInMinutes) / 60);
            const offsetMinutes = Math.abs(offsetInMinutes) % 60;
            const sign = offsetInMinutes >= 0 ? '+' : '-';
            const gmtOffset = `(GMT${sign}${offsetHours
                .toString()
                .padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')})`;

            // Get friendly name or fallback to city part
            const friendlyName =
                friendlyTimeZoneNames[zone] ||
                zone
                    .replace(/_/g, ' ')
                    .split('/')
                    .slice(1)
                    .join(' - ');// e.g., America/Argentina/Buenos_Aires → Argentina - Buenos Aires

            return {
                label: `${gmtOffset} ${friendlyName}`,
                value: zone,
            };
        });

        setTimeZoneOptions(options);
    }, []);

    const removeAgent = (index: number) => {
        const updatedAgents = coAgents.filter((_, i) => i !== index);
        setCoAgents(updatedAgents);
    };

    const tabs =
        userType === 'admin'
            ? ['Profile Settings', 'Discounts', 'Tour Settings']
            : [];
    const [activeTab, setActiveTab] = useState('Profile Settings');

    const addDiscount = (discount: {
        discount_code: string;
        expiry_date: string;
        description: string;
    }) => {
        const nextId = discounts.length > 0 ? discounts[discounts.length - 1].id + 1 : 1;

        setAgentDiscounts([
            ...agentdiscounts,
            {
                id: nextId,
                ...discount,
            },
        ]);
    };

    const removeDiscount = (id: number) => {
        setAgentDiscounts(agentdiscounts.filter((d) => d.id !== id));
    };

    return (
        <div className='font-alexandria'>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}>Global Settings</p>
                <Button onClick={(e) => { handleSubmit(e) }} className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg `}>Save Changes</Button>
            </div>
            <SaveModal
                isOpen={openSaveDialog}
                onClose={() => setOpenSaveDialog(false)}
                isLoading={isLoading}
                isSuccess={true}
                backLink="/dashboard/admin"
                title={'Admin'}
            />
            {/* <SaveDialog
                open={openSaveDialog}
                setOpen={setOpenSaveDialog}
            /> */}
            {userType === 'admin' &&
                <div className='flex justify-center h-[60px] items-center bg-[#E4E4E4]'>
                    <div className=" w-fit flex border-gray-300 gap-[10px]">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-center px-4 py-2 text-[13px] w-[180px] h-[32px] transition-colors ${activeTab === tab
                                    ? `${userType}-bg text-white  rounded-[6px]  font-[500] `
                                    : 'text-[#666666] hover:text-[#666666] font-[700] '
                                    }`}
                            >
                                {tab.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>}
            <form>
                <Accordion type="multiple" defaultValue={['payment', "discounts", 'tour', "profile", "branding", "hours", "vendor", "service", "order", "payment", "account"]} className="w-full space-y-4 ">
                    {activeTab === 'Discounts' &&
                        (userType === 'admin' &&
                            <AccordionItem value="discounts" className='border-none'>
                                <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                                    <div className='flex items-center justify-between w-full' onClick={(e) => e.stopPropagation()}>
                                        <p>DISCOUNTS</p>
                                        <div onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenAddDiscountDialog(true);
                                        }} className='flex items-center gap-x-[10px] pr-[24px]'>
                                            <p className='text-base font-semibold font-raleway'>Add</p>
                                            <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`} />
                                        </div>
                                        <AddDiscountDialog
                                            open={openAddDiscountDialog}
                                            setOpen={setOpenAddDiscountDialog}
                                            onSuccess={() => {
                                                fetchDiscounts();
                                            }}
                                        />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="w-full pb-0">
                                    <DiscountTable discounts={discounts}
                                        fetchDiscounts={fetchDiscounts}
                                        setDiscounts={setDiscounts}
                                        loading={loading}
                                        error={error}
                                    />
                                </AccordionContent>
                            </AccordionItem>)
                    }

                    {activeTab === 'Profile Settings' &&
                        <form
                            onChange={() => {
                                if (!isPopulatingData.current) {
                                    setIsDirty(true);
                                }
                            }}
                        >
                            {userType === 'admin' &&
                                <AccordionItem value="profile" className='border-none'>
                                    <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'} [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>COMPANY PROFILE</AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className='w-full flex flex-col items-center'>
                                            <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                                <div className='grid grid-cols-2 gap-[16px] text-sm font-normal '>
                                                    <div className='col-span-2'>
                                                        <p>Explanation of where these assets are used and leveraged, recommended/specify dimensions, color variations, etc.</p>
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Company Name <span className="text-red-500">*</span></label>
                                                        <Input value={companyName}
                                                            onChange={(e) => setCompanyName(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]' type="text" placeholder='BC Floor Plans Media Co' />
                                                        {fieldErrors.name && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.name[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Company Website <span className="text-red-500">*</span></label>
                                                        <Input value={companyWebsite}
                                                            onChange={(e) => setCompanyWebsite(e.target.value)} className='h-[42px] bg-[#EEEEEE] placeholder:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" placeholder='www.bcfloorplans.com' />
                                                        {fieldErrors.website && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.website[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Email <span className="text-red-500">*</span></label>
                                                        <Input value={email}
                                                            onChange={(e) => setEmail(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]' type="text" placeholder='info@bcfloorplans.com' />
                                                        {fieldErrors.email && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.email[0]}</p>}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="">Primary Phone <span className="text-red-500">*</span></label>
                                                        <Input value={primaryPhone}
                                                            onChange={(e) => setPrimaryPhone(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]' type="text" placeholder='604-666-8787' />
                                                        {fieldErrors.primary_phone && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.primary_phone[0]}</p>}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="">Secondary Phone</label>
                                                        <Input value={secondaryPhone}
                                                            onChange={(e) => setSecondaryPhone(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                        {fieldErrors.secondary_phone && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.secondary_phone[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Headquarter Address <span className="text-red-500">*</span></label>
                                                        <Input value={headquarterAddress}
                                                            onChange={(e) => setHeadquarterAddress(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" placeholder='7458 Burrard Street' />
                                                        {fieldErrors.street && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.street[0]}</p>}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="">City <span className="text-red-500">*</span></label>
                                                        <Input value={city}
                                                            onChange={(e) => setCity(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]' type="text" placeholder='Burnaby' />
                                                        {fieldErrors.city && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.city[0]}</p>}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="">Province <span className="text-red-500">*</span></label>
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
                                                        {fieldErrors.province && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.province[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Country <span className="text-red-500">*</span></label>
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
                                                        {fieldErrors.country && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.country[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Billing Address Line 1 <span className="text-red-500">*</span></label>
                                                        <Input value={billingAddress1}
                                                            onChange={(e) => setBillingAddress1(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]' type="text" placeholder='7458 Burrard Street' />
                                                        {fieldErrors.billing_street_1 && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.billing_street_1[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Billing Address Line 2</label>
                                                        <Input value={billingAddress2}
                                                            onChange={(e) => setBillingAddress2(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                        {fieldErrors.billing_street_2 && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.billing_street_2[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <div className='flex items-center justify-between'>
                                                            <p >Vendor files must be reviewed by admin before sending to client</p>
                                                            <Switch checked={adminReviewRequired}
                                                                onCheckedChange={setAdminReviewRequired} className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41] float-end" />
                                                            {fieldErrors.review_files && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.review_files[0]}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>}


                            {userType === 'agent' &&
                                <AccordionItem value="profile" className='border-none'>
                                    <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'agent' ? '[&>svg]:text-[#6BAE41]' : '[&>svg]:text-[#4290E9]'} [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>ACCOUNT PROFILE</AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className='w-full flex flex-col items-center'>
                                            <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                                <div className='grid grid-cols-2 gap-[16px] text-sm font-normal'>
                                                    <div>
                                                        <label>First Name</label>
                                                        <Input
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='First Name'
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Last Name</label>
                                                        <Input
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='Last Name'
                                                        />
                                                    </div>

                                                    <div className='col-span-2'>
                                                        <label>Email</label>
                                                        <Input
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='name@email.com'
                                                        />
                                                    </div>

                                                    <div>
                                                        <label>Primary Phone</label>
                                                        <Input
                                                            value={primaryPhone}
                                                            onChange={(e) => setPrimaryPhone(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='(604) 451-5584'
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Secondary Phone</label>
                                                        <Input
                                                            value={secondaryPhone}
                                                            onChange={(e) => setSecondaryPhone(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='Optional'
                                                        />
                                                    </div>

                                                    <div className='col-span-2'>
                                                        <label>Company Name</label>
                                                        <Input
                                                            value={companyName}
                                                            onChange={(e) => setCompanyName(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='Company Name'
                                                        />
                                                    </div>

                                                    <div className='col-span-2'>
                                                        <label>Website</label>
                                                        <Input
                                                            value={website}
                                                            onChange={(e) => setWebsite(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='www.company.com'
                                                        />
                                                    </div>

                                                    <div>
                                                        <label>Agent License #</label>
                                                        <Input
                                                            value={license}
                                                            onChange={(e) => setLicense(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='12-778455'
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Certifications</label>
                                                        <Input
                                                            value={certifications}
                                                            onChange={(e) => {
                                                                const inputValue = e.target.value;
                                                                const certsArray = inputValue.split(',')
                                                                    .map(cert => cert.trim())
                                                                    .filter(cert => cert !== '');
                                                                setCertifications(certsArray);
                                                            }}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='CIPS, ABR, CRS, CCIM (comma separated)'
                                                        />

                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label>Headquarter Address</label>
                                                        <Input
                                                            value={headquarterAddress}
                                                            onChange={(e) => setHeadquarterAddress(e.target.value)}
                                                            className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]'
                                                            type="text"
                                                            placeholder='686 Nelson Street'
                                                        />
                                                        <div className='w-full h-[200px] mt-4 bg-gray-200 flex items-center justify-center'>
                                                            <DynamicMap
                                                                address={headquarterAddress}
                                                                city={city}
                                                                province={province}
                                                                country={country}
                                                            />
                                                        </div>
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
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>}

                            <AccordionItem value="branding" className='border-none'>
                                <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>BRANDING ASSETS</AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            <p className='text-[#666666] text-sm font-normal'>These branding images appear throughout your site, invoices, and marketing materials. Ensure you follow the recommendations to present the highest quality.</p>

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
                                                                Browse
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
                                                {fieldErrors.logo_path && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.logo_path[0]}</p>}
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
                                                    <div className="flex-1 h-full">
                                                        <Label className="text-sm font-normal">Company Banner</Label>
                                                        <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                            <span className="bg-[#EEEEEE] max-w-[246px] text-[16px] font-normal py-2 px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden flex-1">
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
                                                {fieldErrors.banner_path && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.banner_path[0]}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {userType === 'admin' &&
                                <AccordionItem value="hours" className='border-none'>
                                    <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>WORK HOURS</AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className='w-full flex flex-col items-center'>
                                            <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                                <div className='grid grid-cols-2 gap-[16px]'>
                                                    <div className='col-span-2'>
                                                        <p>Scheduling settings have impact on ordering from all customers - addresses, last job location, working hours, duration of services, travel time, all contribute to your availability.</p>
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <p>Set your working hours that clients can book your services.</p>
                                                    </div>
                                                    <div className="relative">
                                                        <label htmlFor="time" className="block text-sm font-normal">
                                                            Start Time <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            id="starttime"
                                                            type="text"
                                                            value={startTime}
                                                            onChange={(e) => setStartTime(e.target.value)}
                                                            className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px]"
                                                        />
                                                        {fieldErrors.start_time && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.start_time[0]}</p>}
                                                        <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                                                            <button type="button" onClick={handleIncrement}>
                                                                <ArrowUp />
                                                            </button>
                                                            <button type="button" onClick={handleDecrement}>
                                                                <ArrowDown />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <label htmlFor="time" className="block text-sm font-normal">
                                                            End Time <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            id="endtime"
                                                            type="text"
                                                            value={endTime}
                                                            onChange={(e) => setEndTime(e.target.value)}
                                                            className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px]"
                                                        />
                                                        {fieldErrors.end_time && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.end_time[0]}</p>}
                                                        <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                                                            <button type="button" onClick={handleIncrement1}>
                                                                <ArrowUp />
                                                            </button>
                                                            <button type="button" onClick={handleDecrement1}>
                                                                <ArrowDown />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label >Work Week <span className="text-red-500">*</span></label>
                                                        <Popover open={open} onOpenChange={setOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full h-[42px] bg-[#EEEEEE] border-[1px] hover:bg-[#EEEEEE]  border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 text-[#424242]"
                                                                >
                                                                    {workWeek.length > 0 ? workWeek.join(', ') : "Select Work Week"}
                                                                    <span className="custom-arrow">
                                                                        <DropDownArrow />
                                                                    </span>
                                                                </Button>
                                                            </PopoverTrigger>

                                                            <PopoverContent
                                                                className="w-[410px] p-2 border border-[#BBBBBB] bg-white"
                                                                align="start"
                                                            >
                                                                <div className="grid gap-2">
                                                                    {daysOfWeek.map((day) => {
                                                                        const checked = workWeek.includes(day);
                                                                        return (
                                                                            <button
                                                                                key={day}
                                                                                onClick={() => toggleDay(day)}
                                                                                className="flex items-center gap-2 cursor-pointer text-[#666666] text-sm"
                                                                            >
                                                                                <span
                                                                                    className={`h-4 w-4 flex items-center justify-center border rounded-sm border-[#BBBBBB] ${checked ? "bg-[#4290E9]" : "bg-white"
                                                                                        }`}
                                                                                >
                                                                                    {checked && <Check size={12} color="white" />}
                                                                                </span>
                                                                                {day}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                        {fieldErrors.work_days && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.work_days[0]}</p>}
                                                    </div>

                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Repeat</label>
                                                        <Select value={repeat} onValueChange={(value) => setRepeat(value)}>
                                                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                                                                <SelectValue placeholder="Select Repeat Options Here" />
                                                                <span className="custom-arrow">
                                                                    <DropDownArrow />
                                                                </span>
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {repeatOptions.map((option, index) => (
                                                                    <SelectItem key={index} value={option}>
                                                                        {option}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {fieldErrors.repeat_weekly && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.repeat_weekly[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="timezone">Time Zone <span className="text-red-500">*</span></label>
                                                        <Select value={timeZone} onValueChange={(value) => setTimeZone(value)}>
                                                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                                                                <SelectValue placeholder="Select Time Zone Here" />
                                                                <span className="custom-arrow">
                                                                    <DropDownArrow />
                                                                </span>
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {timeZoneOptions.map((option, index) => (
                                                                    <SelectItem key={index} value={option.value}>
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>

                                                            {fieldErrors?.timezone && (
                                                                <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.timezone[0]}</p>
                                                            )}
                                                        </Select>
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Commute Time Baseline</label>
                                                        <Select
                                                            value={commuteTime}
                                                            onValueChange={(value) => setCommuteTime(value)}
                                                        >
                                                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                                                                <SelectValue placeholder="Select Time Baseline" />
                                                                <span className="custom-arrow">
                                                                    <DropDownArrow />
                                                                </span>
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {commuteTimeOptions.map((option, index) => (
                                                                    <SelectItem key={index} value={option}>
                                                                        {option}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {fieldErrors.commute_minutes && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.commute_minutes[0]}</p>}
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="">Reoccuring break</label>
                                                        <div className='flex items-center gap-[10px]'>
                                                            <Input checked={isReoccuringBreak}
                                                                onChange={(e) => setIsReoccuringBreak(e.target.checked)} type='checkbox' className='h-[20px] w-[20px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' />
                                                            <p className='text-[16px] font-normal text-[#666666] mt-[12px]'>Enable Google Calendar Sync</p>
                                                        </div>
                                                        {fieldErrors.enable_breaks && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.enable_breaks[0]}</p>}
                                                    </div>
                                                    <div className='flex items-center gap-[10px]'>
                                                        <Input checked={isSyncToGoogle}
                                                            onChange={(e) => setIsSyncToGoogle(e.target.checked)} type='checkbox' className='h-[20px] w-[20px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' />
                                                        <p className='text-[16px] font-normal text-[#666666] mt-[12px]'>Sync to Google</p>
                                                        {fieldErrors.sync_google && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.sync_google[0]}</p>}
                                                    </div>
                                                    <div className=''>
                                                        <Select onValueChange={(value) => setSyncEmailType(value)} value={syncEmailType} >
                                                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[3px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                                                                <SelectValue placeholder="Select Email" />
                                                                <span className="custom-arrow">
                                                                    <DropDownArrow />
                                                                </span>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="primary">Primary Email</SelectItem>
                                                                <SelectItem value="secondary">Secondary Email</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        {fieldErrors.sync_email && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.sync_email[0]}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            }

                            {userType === 'admin' &&
                                <AccordionItem value="vendor" className='border-none'>
                                    <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>VENDOR RATE SETTINGS</AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className='w-full flex flex-col items-center'>
                                            <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                                <div className='grid grid-cols-2 gap-[16px] py-[32px]'>
                                                    <div className='col-span-2'>
                                                        <p className='text-sm font-normal text-[#666666]'>Set rate for all vendors commute reimbursement value.</p>
                                                    </div>
                                                    <div className='col-span-2'>
                                                        <div>
                                                            <Label htmlFor="">Payment per kilometer</Label>
                                                            <Input value={paymentPerKm}
                                                                onChange={(e) => setPaymentPerKm(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                            {fieldErrors.payment_per_km && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.payment_per_km[0]}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            }

                            {userType === 'admin' &&
                                <AccordionItem value="service" className='border-none'>
                                    <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>SERVICE AREA</AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className='w-full flex flex-col items-center'>
                                            <div className='w-full flex justify-center flex-col'>
                                                <div className='w-full h-[200px] md:h-[560px]'>
                                                    {/* <iframe
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d83357.52320128103!2d-123.04024198044628!3d49.23995664757976!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x548677a8219c8373%3A0xdd0a72738752b169!2sBurnaby%2C%20BC%2C%20Canada!5e0!3m2!1sen!2s!4v1748548645299!5m2!1sen!2s"
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
                                                        city={city}
                                                        province={province}
                                                        country={country}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            }

                            {userType === 'admin' &&
                                <AccordionItem value="order" className='border-none'>
                                    <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>ORDER FORM</AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className='w-full flex flex-col items-center'>
                                            <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                                <div className='grid grid-cols-2 gap-[32px]'>
                                                    <div className='col-span-2'>
                                                        <label htmlFor="" className='text-[16px] font-normal text-[#666666]'>Full Page Order Form</label>
                                                        <div className="relative mt-[12px]">
                                                            <Input
                                                                id="order-link"
                                                                type="text"
                                                                className="h-[42px] placeholder:text-[#9ca3af] w-full bg-[#EEEEEE] border border-[#BBBBBB] px-4 pr-10 text-sm"
                                                                value={orderLink}
                                                                onChange={(e) => setOrderLink(e.target.value)}
                                                                placeholder="bcfloorplans.tojuco.com/v/id#22718"
                                                            />
                                                            {/* 
                                                <button
                                                    type="button"
                                                    onClick={handleCopy}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                >
                                                    <Copy className="text-[#4290E9] w-5 h-5" />
                                                </button> */}
                                                        </div>
                                                        <p className='text-xs font-normal text-[#666666] mt-[6px]'>Copy and paste the URL to a link or button on your business website to integrate BCFP services to your page.</p>
                                                        {fieldErrors.order_form_url && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.order_form_url[0]}</p>}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <div className="flex items-center justify-between">
                                                            <label htmlFor="" className="text-[16px] font-normal text-[#666666]">
                                                                iFrame Code Order Form
                                                            </label>
                                                            {/* <p
                                                    onClick={handleCopy2}
                                                    className="text-[#6BAE41] font-semibold text-base font-raleway cursor-pointer"
                                                >
                                                    Copy
                                                </p> */}
                                                        </div>

                                                        <textarea
                                                            className="h-[200px] w-full p-3 rounded-[6px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                            value={iframeCode}
                                                            onChange={(e) => setIframeCode(e.target.value)}
                                                            placeholder='<iframe src="gre_iframe.html" style="height:auto;width:auto;" title="BC Floor Plans"></iframe>'
                                                        />
                                                        {fieldErrors.iframe_code && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.iframe_code[0]}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            }

                            <AccordionItem value="payment" className='border-none'>
                                <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>PAYMENT</AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            <div className='grid grid-cols-2 gap-[32px]'>
                                                {userType === 'admin' &&
                                                    <div className="col-span-2">
                                                        <div className="flex flex-col gap-y-[16px] text-sm font-normal text-[#7D7D7D]">

                                                            <div>
                                                                <p className="font-bold">
                                                                    {planName} <span className="font-normal">({billingCycle})</span>
                                                                </p>
                                                                <p>{seats} Seats</p>
                                                                <p>Joined: {joinDate}</p>
                                                            </div>

                                                            <div className="flex items-center gap-x-1">
                                                                <p>Add additional</p>
                                                                <Link href="" className="text-[#4290E9] font-bold underline">
                                                                    SEATS
                                                                </Link>
                                                            </div>

                                                        </div>
                                                    </div>
                                                }

                                                <div className="col-span-2">
                                                    <div className='flex items-center justify-between'>
                                                        <p className='font-bold text-sm text-[#666666]'>Cards</p>
                                                        <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => setOpenPaymentDialog(true)}>
                                                            <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                            <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm' />
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

                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            <div className='flex items-center justify-between'>
                                                <p className='font-bold text-sm text-[#666666]'>Discounts</p>
                                                <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => setOpenDiscount(true)}>
                                                    <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add</p>
                                                    <Plus className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm' />
                                                </div>
                                                <AgentDiscount
                                                    open={openDiscount}
                                                    setOpen={setOpenDiscount}
                                                    addDiscount={addDiscount}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                {agentdiscounts.map((discount) => (
                                                    <div key={discount.id} className='flex flex-col gap-y-3 mt-2'>
                                                        <div className="flex justify-between items-center w-full text-[16px] font-normal text-[#666666]">
                                                            <div className='basis-[80%] flex items-center justify-between w-full gap-x-2.5'>
                                                                <p className="text-[#4290E9]">{capitalizeFirst(discount.discount_code)}</p>

                                                                <p className="text-[12px] font-[300] text-[#666666]">Expires {discount.expiry_date}</p>
                                                            </div>

                                                            <div className="basis-[20%] w-full flex gap-x-4 items-center justify-end">
                                                                <X
                                                                    onClick={() => removeDiscount(discount.id)}
                                                                    className="text-[#E06D5E] w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
                                                                />
                                                            </div>
                                                        </div>

                                                        <hr />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="account" className='border-none'>
                                <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'admin' ? '[&>svg]:text-[#4290E9]' : '[&>svg]:text-[#6BAE41]'} [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>ACCOUNT MANAGEMENT</AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
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
                                                        userId={userInfo?.uuid}
                                                        open={openChangePasswordDialog}
                                                        setOpen={setOpenChangePasswordDialog}
                                                        type="agents"
                                                    />
                                                </div>
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

                        </form>
                    }

                    {activeTab === 'Tour Settings' && userType === 'admin' &&
                        <GlobalTourSetting />
                    }
                </Accordion>
            </form>
        </div >
    )
}

export default GlobalSettings