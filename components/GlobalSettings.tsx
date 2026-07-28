"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef, Row } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import DropdownActions from "./DropdownActions";
import { Delete, EditDiscountStatus } from "@/app/dashboard/global-settings/global-settings";
import Link from "next/link";
import { ArrowDown, ArrowUp, DropDownArrow } from "./Icons";
//import CloseDialog from './CloseDialog'
import PaymentDialog from "./PaymentDialog";
import AddDiscountDialog from "./AddDiscountDialog";
import {
    DeleteCard,
    GetDiscount,
    GetPaymentMethod,
    GetQuickBookStatus,
    QuickBookConnection,
    DisconnectQuickBook,
    GetQuickBookSyncQueue,
    RetryQuickBookSync,
} from "@/app/dashboard/global-settings/global-settings";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
//import SaveDialog from './SaveDialog'
import { DateTime } from "luxon";
import { Country, State } from "country-state-city";
// import { SaveModal } from "./SaveModal";
import DynamicMap from "./DYnamicMap";
import { useAppContext } from "@/app/context/AppContext";
import { EditAgent, GetOne as GetOneAgent } from "@/app/dashboard/agents/agents";
import { Edit as EditAdminUser, GetOne as GetOneAdmin } from "@/app/dashboard/admin/admin";
import ChangePasswordDialog from "./ChangePasswordDialog";
import AddCoAgentDialog from "./AddCoAgentDialog";
import { useUnsaved } from "@/app/context/UnsavedContext";
import useUnsavedChangesWarning from "@/app/hooks/useUnsavedChangesWarning";
import GlobalTourSetting from "./GlobalTourSetting";
import AgentDiscount from "./AgentDiscount";
import WhiteLabelSettings from "./WhiteLabelSettings";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import EmailTemplatesSettings from "./EmailTemplatesSettings";
import OrganizationsSettings from "./OrganizationsSettings";
import MediaJobsTable from "./MediaJobsTable";
import EmailLogsSettings from "./EmailLogsSettings";
import PortalSettings from "./PortalSettings";
import { usePermissions } from "@/app/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";


// CompanyData type reserved for future use
// interface CompanyData { ... }
type TimeZoneOption = {
    label: string;
    value: string;
};
export interface PaymentCard {
    uuid: string;
    type: "visa" | "mastercard" | "amex";
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
    "America/New_York": "Eastern Time - New York",
    "America/Toronto": "Eastern Time - Toronto",
    "America/Detroit": "Eastern Time - Detroit",
    "America/Indiana/Indianapolis": "Eastern Time - Indianapolis",
    "America/Chicago": "Central Time - Chicago",
    "America/Winnipeg": "Central Time - Winnipeg",
    "America/Regina": "Central Standard Time - Regina",
    "America/Denver": "Mountain Time - Denver",
    "America/Edmonton": "Mountain Time - Edmonton",
    "America/Phoenix": "Mountain Standard Time - Phoenix",
    "America/Los_Angeles": "Pacific Time - Los Angeles",
    "America/Vancouver": "Pacific Time - Vancouver",
    "America/Anchorage": "Alaska Time - Anchorage",
    "America/Juneau": "Alaska Time - Juneau",
    "Pacific/Honolulu": "Hawaii-Aleutian Time - Honolulu",
    "America/Caracas": "Venezuelan Standard Time - Caracas",
    "America/Mexico_City": "Central Time - Mexico City",
    "America/Guatemala": "Central Time - Guatemala City",
    "America/Panama": "Eastern Standard Time - Panama City",

    // South America
    "America/Sao_Paulo": "Brasilia Time - São Paulo",
    "America/Argentina/Buenos_Aires": "Argentina Time - Buenos Aires",
    "America/Bogota": "Colombia Time - Bogotá",
    "America/Lima": "Peru Time - Lima",
    "America/Montevideo": "Uruguay Standard Time - Montevideo",

    // Europe
    "Europe/London": "Greenwich Mean Time - London",
    "Europe/Dublin": "Greenwich Mean Time - Dublin",
    "Europe/Paris": "Central European Time - Paris",
    "Europe/Berlin": "Central European Time - Berlin",
    "Europe/Madrid": "Central European Time - Madrid",
    "Europe/Rome": "Central European Time - Rome",
    "Europe/Amsterdam": "Central European Time - Amsterdam",
    "Europe/Brussels": "Central European Time - Brussels",
    "Europe/Vienna": "Central European Time - Vienna",
    "Europe/Zurich": "Central European Time - Zurich",
    "Europe/Moscow": "Moscow Time - Moscow",
    "Europe/Istanbul": "Turkey Time - Istanbul",
    "Europe/Kiev": "Eastern European Time - Kyiv",
    "Europe/Helsinki": "Eastern European Time - Helsinki",
    "Europe/Athens": "Eastern European Time - Athens",
    "Europe/Oslo": "Central European Time - Oslo",
    "Europe/Stockholm": "Central European Time - Stockholm",
    "Europe/Belgrade": "Central European Time - Belgrade",
    "Europe/Sarajevo": "Central European Time - Sarajevo",

    // Asia
    "Asia/Kolkata": "India Standard Time - Kolkata",
    "Asia/Calcutta": "India Standard Time - Calcutta",
    "Asia/Shanghai": "China Standard Time - Shanghai",
    "Asia/Tokyo": "Japan Standard Time - Tokyo",
    "Asia/Seoul": "Korea Standard Time - Seoul",
    "Asia/Singapore": "Singapore Time - Singapore",
    "Asia/Dubai": "Gulf Standard Time - Dubai",
    "Asia/Jerusalem": "Israel Standard Time - Jerusalem",
    "Asia/Bangkok": "Indochina Time - Bangkok",
    "Asia/Srednekolymsk": "Magadan Time - Srednekolymsk",
    "Asia/Karachi": "Pakistan Standard Time - Karachi",
    "Asia/Yekaterinburg": "Yekaterinburg Time - Yekaterinburg",
    "Asia/Krasnoyarsk": "Krasnoyarsk Time - Krasnoyarsk",
    "Asia/Novosibirsk": "Novosibirsk Time - Novosibirsk",
    "Asia/Irkutsk": "Irkutsk Time - Irkutsk",
    "Asia/Yakutsk": "Yakutsk Time - Yakutsk",
    "Asia/Vladivostok": "Vladivostok Time - Vladivostok",
    "Asia/Magadan": "Magadan Time - Magadan",
    "Asia/Kamchatka": "Kamchatka Time - Kamchatka",
    "Asia/Ulaanbaatar": "Ulaanbaatar Time - Ulaanbaatar",
    "Asia/Hong_Kong": "Hong Kong Time - Hong Kong",
    "Asia/Manila": "Philippine Time - Manila",

    // Oceania
    "Australia/Sydney": "Australian Eastern Time - Sydney",
    "Australia/Melbourne": "Australian Eastern Time - Melbourne",
    "Australia/Brisbane": "Australian Eastern Time - Brisbane",
    "Australia/Adelaide": "Australian Central Time - Adelaide",
    "Australia/Perth": "Australian Western Time - Perth",
    "Pacific/Auckland": "New Zealand Time - Auckland",
    "Pacific/Fiji": "Fiji Time - Suva",
    "Pacific/Guam": "Chamorro Standard Time - Guam",
    "Pacific/Majuro": "Marshall Islands Time - Majuro",
    "Pacific/Noumea": "New Caledonia Time - Nouméa",

    // Africa
    "Africa/Johannesburg": "South Africa Standard Time - Johannesburg",
    "Africa/Cairo": "Eastern European Time - Cairo",
    "Africa/Lagos": "West Africa Time - Lagos",
    "Africa/Algiers": "Central European Time - Algiers",
    "Africa/Nairobi": "East Africa Time - Nairobi",
    "Africa/Khartoum": "Central Africa Time - Khartoum",
    "Africa/Dakar": "Greenwich Mean Time - Dakar",
    "Africa/Casablanca": "Western European Time - Casablanca",

    // Atlantic
    "Atlantic/Azores": "Azores Time - Azores",
    "Atlantic/Bermuda": "Atlantic Standard Time - Bermuda",
    "Atlantic/Reykjavik": "Greenwich Mean Time - Reykjavik",

    // Others
    "Pacific/Apia": "Apia Time - Apia",
    "Pacific/Chatham": "Chatham Standard Time - Chatham Islands",
    "Pacific/Easter": "Easter Island Standard Time - Easter Island",
    "Pacific/Galapagos": "Galapagos Time - Galápagos",
    "Pacific/Tongatapu": "Tonga Time - Tongatapu",
};

// Types
export type Discount = {
    id: number;
    name: string;
    description: string;
    quantity: number;
    percentage: number;
    status: boolean;
    type: string;
    uuid: string;
    code_key: string;
};

interface SelectedDiscount {
    uuid?: string;
    type?: string;
}

const GlobalSettings = () => {
    // const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState<SelectedDiscount | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [email, setEmail] = useState("");
    const [primaryPhone, setPrimaryPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [headquarterAddress, setHeadquarterAddress] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [country, setCountry] = useState("CA");

    const [paymentPerKm, setPaymentPerKm] = useState("");
    const [password, setPassword] = useState("");
    const [orderLink, setOrderLink] = useState("");
    const [iframeCode, setIframeCode] = useState(``);
    const CompanyLogofileInputRef = useRef(null);
    const [CompanyLogofileName, setCompanyLogoFileName] = useState("");
    const [CompanyLogoUrl, setCompanyLogoUrl] = useState("");
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
    const CompanyBannerfileInputRef = useRef(null);
    const [CompanyBannerfileName, setCompanyBannerFileName] = useState("");
    const [CompanyBannerUrl, setCompanyBannerUrl] = useState("");
    const [companyBannerFile, setCompanyBannerFile] = useState<File | null>(null);
    const planName = "Team Media Creator Portal";
    const billingCycle = "Monthly";
    const seats = 5;
    const joinDate = "Mar 03, 2021";
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [startTime, setStartTime] = useState("8:00 AM");
    const [endTime, setEndTime] = useState("8:00 AM");
    const [workWeek, setWorkWeek] = useState<string[]>([]);
    const [repeat, setRepeat] = useState("");
    const [timeZone, setTimeZone] = useState("America/Edmonton");
    const [commuteTime, setCommuteTime] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [discounts, setDiscounts] = React.useState<Discount[]>([]);
    const [isReoccuringBreak, setIsReoccuringBreak] = useState(false);
    const [isSyncToGoogle, setIsSyncToGoogle] = useState(false);
    const [syncEmailType, setSyncEmailType] = useState("");
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
    // const [newSubAccount, setNewSubAccount] = useState("");
    const [website, setWebsite] = useState("");
    const AvatarfileInputRef = useRef(null);
    const [AvatarfileName, setAvatarFileName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [openChangePasswordDialog, setOpenChangePasswordDialog] =
        useState(false);
    const [openAddAgentDialog, setOpenAddAgentDialog] = useState(false);
    const [coAgents, setCoAgents] = useState<
        { name: string; email: string; primary_phone: string; split: string }[]
    >([]);
    const [agentdiscounts, setAgentDiscounts] = useState<{
        id: number;
        discount_code?: string;
        expiry_date: string | null;
        description?: string;
        name?: string;
        amount?: number;
        is_percentage?: 1 | 0;
        minimum_orders?: number;
        minimum_spend?: number;
    }[]>([])
    const [secondaryEmail, setSecondaryEmail] = useState("");
    const [notificationEmail, setNotificationEmail] = useState("");
    const [quickBookStatus, setQuickBookStatus] = useState(false);
    const [qbQueueInfo, setQbQueueInfo] = useState<{ pending_syncs?: number; synced_count?: number } | null>(null);
    const [isQbSyncing, setIsQbSyncing] = useState(false);
    const [isQbDisconnecting, setIsQbDisconnecting] = useState(false);
    const [adminRoles, setAdminRoles] = useState<number[]>([]);
    const [adminPermissions, setAdminPermissions] = useState<number[]>([]);

    const [openDiscount, setOpenDiscount] = useState(false);

    const { saveSettings } = useWhiteLabel();

    const { hasPermission, isSuperAdmin } = usePermissions();

    const { isDirty, setIsDirty } = useUnsaved();
    useUnsavedChangesWarning(isDirty);
    const isPopulatingData = useRef(false);
    const hasInitiallyRendered = useRef(false);
    const baselineSettingsRef = useRef<any>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const orgSettingsRef = useRef<{ save: () => Promise<void> } | null>(null);
    const portalSettingsRef = useRef<{ save: () => Promise<void> } | null>(null);
    const tourSettingsRef = useRef<{ save: () => Promise<void> } | null>(null);

    // Override overflow-x: hidden on ancestor elements that break sticky positioning
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
    }, []);

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const repeatOptions = [
        "Repeat every week",
        "Repeat every month",
        "Repeat every year",
    ];
    const [countries, setCountries] = useState<
        { name: string; isoCode: string }[]
    >([]);
    const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const { userType } = useAppContext();
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "");

    const commuteTimeOptions = [
        "5 Minutes",
        "10 Minutes",
        "15 Minutes",
        "30 Minutes",
        "45 Minutes",
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
        if (userType === "admin") {
            GetOneAdmin(userInfo.uuid)
                .then((adminRes) => {
                    const adminData = adminRes.data;

                    isPopulatingData.current = true;

                    if (adminData.roles && Array.isArray(adminData.roles)) {
                        setAdminRoles(adminData.roles.map((r: any) => Number(r.id)));
                    }
                    if (adminData.permissions && Array.isArray(adminData.permissions)) {
                        setAdminPermissions(adminData.permissions.map((p: any) => Number(p.id)));
                    }

                    setFirstName(adminData.first_name || "");
                    setLastName(adminData.last_name || "");
                    setEmail(adminData.email || "");
                    setSecondaryEmail(adminData.secondary_email || "");
                    setNotificationEmail(adminData.notification_email || "");
                    setPrimaryPhone(adminData.primary_phone || "");
                    setSecondaryPhone(adminData.secondary_phone || "");
                    setCompanyName(adminData.company_name || "");
                    setCompanyWebsite(adminData.website || "");
                    setHeadquarterAddress(adminData.address || "");
                    setCity(adminData.city || "");
                    setProvince(adminData.province || "");
                    setCountry(adminData.country || "CA");

                    if (adminData.avatar_url) setAvatarUrl(adminData.avatar_url);
                    if (adminData.avatar) setAvatarFileName(adminData.avatar);

                    baselineSettingsRef.current = {
                        firstName: adminData.first_name || "",
                        lastName: adminData.last_name || "",
                        email: adminData.email || "",
                        secondaryEmail: adminData.secondary_email || "",
                        notificationEmail: adminData.notification_email || "",
                        primaryPhone: adminData.primary_phone || "",
                        secondaryPhone: adminData.secondary_phone || "",
                        companyName: adminData.company_name || "",
                        website: adminData.website || "",
                        headquarterAddress: adminData.address || "",
                        city: adminData.city || "",
                        province: adminData.province || "",
                        country: adminData.country || "CA",
                    };
                })
                .catch((err) => {
                    console.log(err.message);
                    setError(true);
                })
                .finally(() => {
                    setLoading(false);
                    setTimeout(() => {
                        isPopulatingData.current = false;
                        hasInitiallyRendered.current = true;
                    }, 100);

                    setIsDirty(false);
                });
        } else if (userType === "agent") {
            GetOneAgent(userInfo.uuid)
                .then((res) => {
                    const data = res.data;

                    isPopulatingData.current = true;

                    setFirstName(data.first_name || "");
                    setLastName(data.last_name || "");
                    setEmail(data.email || "");
                    setPrimaryPhone(data.primary_phone || "");
                    setSecondaryPhone(data.secondary_phone || "");
                    setCompanyName(data.company_name || "");
                    setWebsite(data.website || "");
                    setLicense(data.license_number || "");
                    setCertifications(data.certifications || "");
                    setHeadquarterAddress(data.headquarter_address || "");
                    setCity(data.city || "");
                    setProvince(data.province || "");
                    setCountry(data.country || "");
                    // setSubAccounts(data.co_agents || []);

                    if (data.company_logo_url) setCompanyLogoUrl(data.company_logo_url);
                    if (data.company_banner_url)
                        setCompanyBannerUrl(data.company_banner_url);
                    if (data.company_logo) setCompanyLogoFileName(data.company_logo);
                    if (data.company_banner)
                        setCompanyBannerFileName(data.company_banner);
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

                    baselineSettingsRef.current = {
                        firstName: data.first_name || "",
                        lastName: data.last_name || "",
                        email: data.email || "",
                        secondaryEmail: data.secondary_email || "",
                        notificationEmail: data.notification_email || "",
                        primaryPhone: data.primary_phone || "",
                        secondaryPhone: data.secondary_phone || "",
                        companyName: data.company_name || "",
                        website: data.website || "",
                        headquarterAddress: data.headquarter_address || "",
                        city: data.city || "",
                        province: data.province || "",
                        country: data.country || "",
                        license: data.license_number || "",
                    };
                })
                .catch((err) => {
                    console.log(err.message);
                    setError(true);
                })
                .finally(() => {
                    setLoading(false);
                    // Use setTimeout to ensure all state updates and DOM updates complete
                    setTimeout(() => {
                        isPopulatingData.current = false;
                        hasInitiallyRendered.current = true;
                    }, 100);

                    setIsDirty(false);
                });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // For initial load, mark as initially rendered after a short delay
    // This prevents browser autofill from triggering dirty state
    useEffect(() => {
        setTimeout(() => {
            hasInitiallyRendered.current = true;
        }, 500); // Longer delay to account for browser autofill
    }, []);

    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    useEffect(() => {
        if (country) {
            setStates(State.getStatesOfCountry(country));
            if (!isPopulatingData.current) {
                setProvince("");
            }
        }
    }, [country]);

    useEffect(() => {
        if (!baselineSettingsRef.current || isPopulatingData.current) return;

        const isChanged =
            firstName !== baselineSettingsRef.current.firstName ||
            lastName !== baselineSettingsRef.current.lastName ||
            email !== baselineSettingsRef.current.email ||
            primaryPhone !== baselineSettingsRef.current.primaryPhone ||
            secondaryPhone !== baselineSettingsRef.current.secondaryPhone ||
            companyName !== baselineSettingsRef.current.companyName ||
            (userType === "admin" ? companyWebsite : website) !== baselineSettingsRef.current.website ||
            headquarterAddress !== baselineSettingsRef.current.headquarterAddress ||
            city !== baselineSettingsRef.current.city ||
            province !== baselineSettingsRef.current.province ||
            country !== baselineSettingsRef.current.country ||
            secondaryEmail !== (baselineSettingsRef.current.secondaryEmail || "") ||
            notificationEmail !== (baselineSettingsRef.current.notificationEmail || "") ||
            (userType === "agent" ? license !== (baselineSettingsRef.current.license || "") : false);

        setIsDirty(isChanged);
    }, [
        firstName, lastName, email, primaryPhone, secondaryPhone,
        companyName, companyWebsite, website, headquarterAddress,
        city, province, country, secondaryEmail, notificationEmail, license, userType, setIsDirty
    ]);

    const removeCard = (uuid: string) => {
        setCards((prev) => prev.filter((card) => card.uuid !== uuid));
    };
    const handleDelete = async (uuid: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await DeleteCard(uuid);
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

        GetPaymentMethod()
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

        GetDiscount()
            .then((data) => setDiscounts(Array.isArray(data.data) ? data.data : []))
            .catch((err) => console.log(err.message));
    }, []);

    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;
        // Legacy company payload — kept for reference; user-specific payloads below handle submission.

        try {
            if (userType === "admin") {
                const adminPayload = {
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    secondary_email: secondaryEmail || undefined,
                    notification_email: notificationEmail || undefined,
                    primary_phone: primaryPhone || undefined,
                    secondary_phone: secondaryPhone || undefined,
                    company_name: companyName || undefined,
                    website: companyWebsite || undefined,
                    address: headquarterAddress || undefined,
                    city: city || undefined,
                    province: province || undefined,
                    country: country || undefined,
                    avatar: avatarFile || undefined,
                    roles: adminRoles.length > 0 ? adminRoles : undefined,
                    permissions: adminPermissions.length > 0 ? adminPermissions : undefined,
                    _method: "PUT",
                };

                await EditAdminUser(userInfo.uuid, adminPayload);
                baselineSettingsRef.current = {
                    firstName,
                    lastName,
                    email,
                    secondaryEmail,
                    notificationEmail,
                    primaryPhone,
                    secondaryPhone,
                    companyName,
                    website: companyWebsite,
                    headquarterAddress,
                    city,
                    province,
                    country,
                };
                setIsLoading(true);
                toast.success("Settings updated successfully");
                // router.push("/dashboard/global-settings");
                setIsLoading(false);
                setIsDirty(false);
            } else if (userType === "agent") {
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
                    _method: "PUT",
                };

                try {
                    await EditAgent(userInfo.uuid, payload);
                    baselineSettingsRef.current = {
                        firstName,
                        lastName,
                        email,
                        secondaryEmail,
                        notificationEmail,
                        primaryPhone,
                        secondaryPhone,
                        companyName,
                        website,
                        headquarterAddress,
                        city,
                        province,
                        country,
                        license,
                    };
                    setIsLoading(true);
                    toast.success("settings updated successfully");
                    setIsLoading(false);
                    setIsDirty(false);
                } catch (error) {
                    console.log("Raw error:", error);

                    setFieldErrors({});
                    const apiError = error as {
                        message?: string;
                        errors?: Record<string, string[]>;
                    };

                    if (apiError.errors && typeof apiError.errors === "object") {
                        const normalizedErrors: Record<string, string[]> = {};

                        Object.entries(apiError.errors).forEach(([key, messages]) => {
                            const normalizedKey = key.split(".")[0];
                            if (!normalizedErrors[normalizedKey]) {
                                normalizedErrors[normalizedKey] = [];
                            }
                            normalizedErrors[normalizedKey].push(...messages);
                        });

                        setFieldErrors(normalizedErrors);

                        const firstError = Object.values(normalizedErrors).flat()[0];
                        toast.error(firstError || 'Validation error');
                    } else if (error instanceof Error) {
                        toast.error(error.message);
                    } else {
                        toast.error("Failed to submit user data");
                    }
                }
            }
        } catch (error) {
            console.log("Raw error:", error);

            setFieldErrors({});
            const apiError = error as {
                message?: string;
                errors?: Record<string, string[]>;
            };

            if (apiError.errors && typeof apiError.errors === "object") {
                const normalizedErrors: Record<string, string[]> = {};

                Object.entries(apiError.errors).forEach(([key, messages]) => {
                    const normalizedKey = key.split(".")[0];
                    if (!normalizedErrors[normalizedKey]) {
                        normalizedErrors[normalizedKey] = [];
                    }
                    normalizedErrors[normalizedKey].push(...messages);
                });

                setFieldErrors(normalizedErrors);

                const firstError = Object.values(normalizedErrors).flat()[0];
                toast.error(firstError || 'Validation error');
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to submit user data");
            }
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarFileName(file.name);
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const triggerFileInput = () => {
        if (AvatarfileInputRef.current) {
            (AvatarfileInputRef.current as HTMLInputElement).click();
        }
    };

    const triggerFileInput1 = () => {
        if (CompanyLogofileInputRef.current) {
            (CompanyLogofileInputRef.current as HTMLInputElement).click();
        }
    };
    const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCompanyLogoFile(file);
            setCompanyLogoFileName(file.name);
            setCompanyLogoUrl(URL.createObjectURL(file));
        }
    };
    const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCompanyBannerFile(file);
            setCompanyBannerFileName(file.name);
            setCompanyBannerUrl(URL.createObjectURL(file));
        }
    };
    const triggerFileInput2 = () => {
        if (CompanyBannerfileInputRef.current) {
            (CompanyBannerfileInputRef.current as HTMLInputElement).click();
        }
    };
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
        setWorkWeek((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
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


    useEffect(() => {
        // Get all time zones from Intl API
        const zones = Intl.supportedValuesOf("timeZone");

        const options = zones.map((zone) => {
            // Get offset in minutes at current time for this zone
            const offsetInMinutes = DateTime.now().setZone(zone).offset;
            // Convert to (GMT±HH:mm)
            const offsetHours = Math.floor(Math.abs(offsetInMinutes) / 60);
            const offsetMinutes = Math.abs(offsetInMinutes) % 60;
            const sign = offsetInMinutes >= 0 ? "+" : "-";
            const gmtOffset = `(GMT${sign}${offsetHours
                .toString()
                .padStart(2, "0")}:${offsetMinutes.toString().padStart(2, "0")})`;

            // Get friendly name or fallback to city part
            const friendlyName =
                friendlyTimeZoneNames[zone] ||
                zone.replace(/_/g, " ").split("/").slice(1).join(" - "); // e.g., America/Argentina/Buenos_Aires → Argentina - Buenos Aires

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

    const tabs = useMemo(() => {
        if (userType !== "admin") return [];

        const allTabs = [
            { name: "Profile Settings", permission: null },
            { name: "Discounts", permission: PERMISSIONS.SET_DISCOUNTS },
            { name: "Tour Settings", permission: PERMISSIONS.CREATE_TOUR_SETTINGS },
            { name: "Portal Settings", permission: PERMISSIONS.VIEW_ADMIN },
            { name: "Appearances", permission: PERMISSIONS.VIEW_ADMIN },
            { name: "Templates", permission: PERMISSIONS.VIEW_ADMIN },
            { name: "Organizations", permission: PERMISSIONS.VIEW_ADMIN },
            { name: "Media Processing", permission: PERMISSIONS.VIEW_ADMIN },
            { name: "Email Logs", permission: PERMISSIONS.VIEW_ADMIN }
        ];

        return allTabs
            .filter(tab => !tab.permission || hasPermission(tab.permission))
            .map(tab => tab.name);
    }, [userType, hasPermission]);
    const [activeTab, setActiveTab] = useState("Profile Settings");
    useEffect(() => {
        if (tabs.length > 0 && !tabs.includes(activeTab)) {
            setActiveTab(tabs[0]);
        }
    }, [tabs, activeTab]);


    const addDiscount = (discount: {
        discount_code?: string;
        expiry_date: string | null;
        description?: string;
        name?: string;
        amount?: number;
        is_percentage?: 1 | 0;
        minimum_orders?: number;
        minimum_spend?: number;
    }) => {
        const nextId =
            discounts.length > 0 ? discounts[discounts.length - 1].id + 1 : 1;

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

    useEffect(() => {
        let isMounted = true;

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("qb_success") === "1") {
            toast.success("QuickBooks connected successfully!");
            window.history.replaceState({}, document.title, window.location.pathname);
            setQuickBookStatus(true);
        } else if (urlParams.get("qb_error")) {
            toast.error(`QuickBooks error: ${urlParams.get("qb_error")}`);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const fetchQuickBookStatus = async () => {
            try {
                const response = await GetQuickBookStatus();
                if (isMounted) {
                    setQuickBookStatus(response.connected);
                    if (response.connected) {
                        fetchQbSyncQueue();
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error fetching QuickBook status:", error);
                }
            }
        };

        const fetchQbSyncQueue = async () => {
            try {
                const response = await GetQuickBookSyncQueue();
                if (isMounted && response.success) {
                    setQbQueueInfo(response.data);
                }
            } catch (error) {
                console.error("Error fetching QB sync queue:", error);
            }
        };

        fetchQuickBookStatus();

        return () => {
            isMounted = false;
        };
    }, []);

    async function handleQuickBookStatus() {
        setLoading(true);
        try {
            const redirectUrl = window.location.origin + window.location.pathname;
            const response = await QuickBookConnection(redirectUrl);
            if (response.success && response.auth_url) {
                window.location.href = response.auth_url;
            } else {
                toast.error(response.error || "Failed to get QuickBooks connection URL");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to initiate QuickBooks connection");
        } finally {
            setLoading(false);
        }
    }

    async function handleDisconnectQB() {
        setIsQbDisconnecting(true);
        try {
            await DisconnectQuickBook();
            setQuickBookStatus(false);
            setQbQueueInfo(null);
            toast.success("QuickBooks disconnected successfully");
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to disconnect QuickBooks");
        } finally {
            setIsQbDisconnecting(false);
        }
    }

    async function handleRetryQbSync() {
        setIsQbSyncing(true);
        try {
            const response = await RetryQuickBookSync();
            if (response.success) {
                toast.success(`Sync retry completed: ${response.data?.success || 0} succeeded, ${response.data?.failed || 0} failed.`);
                const queueResp = await GetQuickBookSyncQueue();
                if (queueResp.success) {
                    setQbQueueInfo(queueResp.data);
                }
            } else {
                toast.error(response.error || "Failed to retry QuickBooks sync");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to retry QuickBooks sync");
        } finally {
            setIsQbSyncing(false);
        }
    }

    const handleDeleteDiscount = async (uuid: string) => {
        try {
            await Delete(uuid);
            toast.success('Discount deleted successfully');
            setDiscounts((prev: Discount[]) => prev.filter(discount => discount.uuid !== uuid));
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to delete discount');
            } else {
                console.error('Delete failed:', error);
                toast.error('Failed to delete discount');
            }
        }
    };

    const handleDiscountStatus = async (checked: boolean, uuid: string) => {
        try {
            const payload = {
                status: checked,
            };

            await EditDiscountStatus(payload, uuid);
            toast.success('Discount status updated successfully');
        } catch (error) {
            if (error instanceof Error) {
                console.error('Submission failed:', error.message);
                toast.error(error.message);
            } else {
                console.error('Submission failed:', error);
                toast.error('Failed to submit user data');
            }
        }
    };

    const discountOptions = (row: Discount) => [
        {
            label: "Edit",
            onClick: () => {
                setSelectedDiscount({ uuid: row.uuid, type: row.type });
                setOpenAddDiscountDialog(true);
            },
        },
        {
            label: "Delete",
            onClick: () => { handleDeleteDiscount(row.uuid) },
            confirm1: true,
        },
    ];

    const discountColumns: ColumnDef<Discount>[] = [
        {
            id: "label",
            header: "LABEL",
            cell: ({ row }: { row: Row<Discount> }) => {
                const original = row.original as { name?: string; code_key?: string };
                const name = original.name;
                const code_key = original.code_key;

                const displayValue =
                    name && name.trim() !== "" ? name : code_key || "n/a";

                return <div className="text-[#666666]">{displayValue}</div>;
            },
        },
        {
            accessorKey: "description",
            header: "DESCRIPTION",
            cell: ({ row }: { row: Row<Discount> }) => (
                <div className="text-[#666666]">
                    {row.getValue("description") || row.getValue("description") === 0
                        ? row.getValue("description") as string
                        : "n/a"}
                </div>
            ),
        },
        {
            accessorKey: "quantity",
            header: "MIN QUANTITY",
            cell: ({ row }: { row: Row<Discount> }) => (
                <div className="text-[#666666]">
                    {row.getValue("quantity") || row.getValue("quantity") === 0
                        ? row.getValue("quantity") as string
                        : "n/a"}
                </div>
            ),
        },
        {
            accessorKey: "percentage",
            header: "DISCOUNT",
            cell: ({ row }: { row: Row<Discount> }) => {
                const value = row.getValue("percentage");
                const displayValue =
                    value || value === 0
                        ? `${Number(value)}%`
                        : "n/a";
                return <div className="text-[#666666]">{displayValue}</div>;
            },
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }: { row: Row<Discount> }) => {
                const status = row.getValue("status") as boolean;
                const uuid = row.original.uuid;

                return (
                    <Switch
                        checked={status}
                        onCheckedChange={(checked) => {
                            setDiscounts((prev: Discount[]) =>
                                prev.map((discount) =>
                                    discount.uuid === uuid ? { ...discount, status: checked } : discount
                                )
                            );
                            handleDiscountStatus(checked, uuid);
                        }}
                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                    />
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }: { row: Row<Discount> }) => {
                return (
                    <DropdownActions options={discountOptions(row.original)} />
                );
            },
        },
    ];

    return (
        <div className="font-alexandria w-full max-w-full overflow-x-hidden">
            <div
                ref={headerRef}
                className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
                style={{
                    backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 10%)`,
                    boxShadow: "0px 4px 4px #0000001F",
                }}
            >
                <p
                    className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}
                >
                    Global Settings
                </p>
                {activeTab === "Appearances" ? (
                    <Button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            saveSettings();
                            toast.success("Appearance settings saved successfully");
                        }}
                        className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg `}
                    >
                        Save Settings
                    </Button>
                ) : activeTab === "Organizations" ? (
                    !isSuperAdmin ? (
                        <Button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                orgSettingsRef.current?.save();
                            }}
                            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center justify-center hover:text-[#fff] hover-${userType}-bg `}
                        >
                            Save Changes
                        </Button>
                    ) : null
                ) : activeTab === "Portal Settings" ? (
                    <Button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            portalSettingsRef.current?.save();
                        }}
                        className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center justify-center hover:text-[#fff] hover-${userType}-bg `}
                    >
                        Save Changes
                    </Button>
                ) : activeTab === "Tour Settings" ? (
                    <Button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            tourSettingsRef.current?.save();
                        }}
                        className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center justify-center hover:text-[#fff] hover-${userType}-bg `}
                    >
                        Save Changes
                    </Button>
                ) : activeTab === "Templates" || activeTab === "Email Logs" ? null : (
                    <Button
                        type="button"
                        onClick={(e) => {
                            handleSubmit(e);
                        }}
                        className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg `}
                    >
                        Save Changes
                    </Button>
                )}
            </div>
            {/* Removed SaveModal */}
            {/* <SaveDialog
                open={openSaveDialog}
                setOpen={setOpenSaveDialog}
            /> */}
            {userType === "admin" && (
                <div
                    className="h-[60px] sticky top-[80px] z-[40] border-b-[1px] border-[#BBBBBB] w-full"
                    style={{
                        backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 10%)`,
                    }}
                >
                    <div className="mx-auto max-w-7xl h-full flex items-center justify-center px-4">
                        <div className="w-full overflow-x-auto scrollbar-hide flex items-center py-2 h-full">
                            <div className="flex gap-[6px] min-w-max mx-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab);
                                        }}
                                        className={`text-center px-4 py-2 text-[13px] whitespace-nowrap h-[36px] transition-all duration-200 cursor-pointer ${activeTab === tab
                                            ? `${userType}-bg text-white rounded-[8px] font-[600] shadow-md`
                                            : "text-[#555555] hover:text-black hover:bg-black/5 rounded-[8px] font-[500]"
                                            }`}
                                    >
                                        {tab.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <form onSubmit={(e) => e.preventDefault()}>
                {activeTab === "Templates" && userType === "admin" && (
                    <EmailTemplatesSettings />
                )}
                {activeTab === "Media Processing" && userType === "admin" && (
                    <MediaJobsTable userType={userType} />
                )}
                {activeTab === "Email Logs" && userType === "admin" && (
                    <EmailLogsSettings />
                )}
                {activeTab === "Portal Settings" && userType === "admin" && (
                    <PortalSettings ref={portalSettingsRef} />
                )}

                <Accordion
                    type="multiple"
                    defaultValue={[
                        "payment",
                        "discounts",
                        "tour",
                        "profile",
                        "branding",
                        "hours",
                        "vendor",
                        "service",
                        "order",
                        "payment",
                        "account",
                        "quickbooks",
                    ]}
                    className="w-full space-y-4 "
                >
                    {activeTab === "Discounts" && userType === "admin" && (
                        <AccordionItem value="discounts" className="border-none">
                            <AccordionTrigger
                                className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                                    ? "[&>svg]:text-[#4290E9]"
                                    : "[&>svg]:text-[#6BAE41]"
                                    }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                style={{
                                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                }}
                            >
                                <div
                                    className="flex items-center justify-between w-full"
                                >
                                    <p>DISCOUNTS</p>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDiscount(null);
                                            setOpenAddDiscountDialog(true);
                                        }}
                                        className="flex items-center gap-x-[10px] pr-[24px] cursor-pointer group"
                                    >
                                        <p className="text-base font-semibold font-raleway group-hover:underline transition-all duration-200">Add</p>
                                        <Plus
                                            className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm transition-transform duration-300 group-hover:rotate-90`}
                                        />
                                    </div>
                                    <AddDiscountDialog
                                        open={openAddDiscountDialog}
                                        setOpen={setOpenAddDiscountDialog}
                                        type={selectedDiscount?.type}
                                        uuid={selectedDiscount?.uuid}
                                        onSuccess={() => {
                                            fetchDiscounts();
                                        }}
                                    />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="w-full pb-0">
                                <DataTable
                                    data={discounts || []}
                                    columns={discountColumns}
                                    loading={loading}
                                    error={error}
                                    dataName="Discounts"
                                    userType={userType}
                                />
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {activeTab === "Profile Settings" && (
                        <div>
                            {userType === "admin" && (
                                <AccordionItem value="profile" className="border-none">
                                    <AccordionTrigger
                                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === "admin"
                                            ? "[&>svg]:text-[#4290E9]"
                                            : "[&>svg]:text-[#6BAE41]"
                                            } [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{
                                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                        }}
                                    >
                                        PROFILE
                                    </AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className="w-full flex flex-col items-center">
                                            <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                                <div className="grid grid-cols-2 gap-[16px] text-sm font-normal ">
                                                    <div>
                                                        <label htmlFor="">
                                                            First Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="First Name"
                                                        />
                                                        {fieldErrors.first_name && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.first_name[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="">Last Name</label>
                                                        <Input
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="Last Name"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label htmlFor="">
                                                            Email <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="info@bcfloorplans.com"
                                                        />
                                                        {fieldErrors.email && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.email[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label htmlFor="">Secondary Email</label>
                                                        <Input
                                                            value={secondaryEmail}
                                                            onChange={(e) => setSecondaryEmail(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="secondary@email.com"
                                                        />
                                                        {fieldErrors.secondary_email && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.secondary_email[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label htmlFor="">Notification Email</label>
                                                        <Input
                                                            value={notificationEmail}
                                                            onChange={(e) => setNotificationEmail(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="notifications@email.com"
                                                        />
                                                        {fieldErrors.notification_email && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.notification_email[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label htmlFor="">Password Change</label>
                                                        <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden mt-[12px]">
                                                            <input
                                                                type="password"
                                                                id="password"
                                                                value={password}
                                                                disabled
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                className="text-[16px] font-medium w-full h-full px-4 focus:outline-none"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleReset();
                                                                    setOpenChangePasswordDialog(true);
                                                                }}
                                                                className="px-4 text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                                                }}
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
                                                    <div>
                                                        <label htmlFor="">
                                                            Primary Phone{" "}
                                                            <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            value={primaryPhone}
                                                            onChange={(e) => setPrimaryPhone(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="604-666-8787"
                                                        />
                                                        {fieldErrors.primary_phone && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.primary_phone[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="">Secondary Phone</label>
                                                        <Input
                                                            value={secondaryPhone}
                                                            onChange={(e) =>
                                                                setSecondaryPhone(e.target.value)
                                                            }
                                                            className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                        />
                                                        {fieldErrors.secondary_phone && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.secondary_phone[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 hidden">
                                                        <label htmlFor="">Company Name</label>
                                                        <Input
                                                            value={companyName}
                                                            onChange={(e) => setCompanyName(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="BC Floor Plans Media Co"
                                                        />
                                                        {fieldErrors.company_name && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.company_name[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 hidden">
                                                        <label htmlFor="">Company Website</label>
                                                        <Input
                                                            value={companyWebsite}
                                                            onChange={(e) =>
                                                                setCompanyWebsite(e.target.value)
                                                            }
                                                            className="h-[42px] placeholder:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="www.bcfloorplans.com"
                                                        />
                                                        {fieldErrors.website && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.website[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label htmlFor="">
                                                            Address{" "}
                                                            <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            value={headquarterAddress}
                                                            onChange={(e) =>
                                                                setHeadquarterAddress(e.target.value)
                                                            }
                                                            className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="7458 Burrard Street"
                                                        />
                                                        {fieldErrors.address && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.address[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="">
                                                            City <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            value={city}
                                                            onChange={(e) => setCity(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="Burnaby"
                                                        />
                                                        {fieldErrors.city && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.city[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="">
                                                            Province <span className="text-red-500">*</span>
                                                        </label>
                                                        <Select
                                                            value={province}
                                                            onValueChange={(val) => setProvince(val)}
                                                            disabled={!states.length}
                                                        >
                                                            <SelectTrigger
                                                                className="w-full h-[42px] mt-[12px] border border-[#BBBBBB]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
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
                                                        {fieldErrors.province && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.province[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label htmlFor="">
                                                            Country <span className="text-red-500">*</span>
                                                        </label>
                                                        <Select
                                                            value={country}
                                                            onValueChange={(val) => setCountry(val)}
                                                        >
                                                            <SelectTrigger
                                                                className="w-full h-[42px] mt-[12px] border border-[#BBBBBB]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
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
                                                        {fieldErrors.country && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.country[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>

                                    <AccordionItem value="quickbooks" className="border-none mt-4">
                                        <AccordionTrigger
                                            className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9] [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                            style={{
                                                backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                            }}
                                        >
                                            QUICKBOOKS INTEGRATION
                                        </AccordionTrigger>
                                        <AccordionContent className="grid gap-4">
                                            <div className="w-full flex flex-col items-center">
                                                <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                                    {!quickBookStatus ? (
                                                        <Button
                                                            onClick={handleQuickBookStatus}
                                                            type="button"
                                                            className={`${userType}-bg hover-${userType}-bg`}
                                                        >
                                                            {isLoading ? "Connecting..." : "Connect Quick Book"}
                                                        </Button>
                                                    ) : (
                                                        <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    <span className="font-medium text-gray-900 text-sm">QuickBooks Connected</span>
                                                                </div>
                                                                <Button
                                                                    onClick={handleDisconnectQB}
                                                                    type="button"
                                                                    variant="outline"
                                                                    disabled={isQbDisconnecting}
                                                                    className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                >
                                                                    {isQbDisconnecting ? "Disconnecting..." : "Disconnect"}
                                                                </Button>
                                                            </div>

                                                            {qbQueueInfo && (
                                                                <div className="text-xs text-gray-600 flex flex-col gap-1 border-t pt-3">
                                                                    <div className="flex justify-between">
                                                                        <span>Total Invoices Synced:</span>
                                                                        <span className="font-semibold text-gray-800">{qbQueueInfo.synced_count ?? 0}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span>Pending / Unsynced:</span>
                                                                        <span className="font-semibold text-amber-600">{qbQueueInfo.pending_syncs ?? 0}</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <Button
                                                                onClick={handleRetryQbSync}
                                                                type="button"
                                                                disabled={isQbSyncing}
                                                                variant="outline"
                                                                className="text-xs h-9 mt-1 border-gray-300"
                                                            >
                                                                {isQbSyncing ? "Syncing..." : "Sync Pending Invoices"}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </AccordionItem>
                            )}

                            {userType === "agent" && (
                                <AccordionItem value="profile" className="border-none">
                                    <AccordionTrigger
                                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === "agent"
                                            ? "[&>svg]:text-[#6BAE41]"
                                            : "[&>svg]:text-[#4290E9]"
                                            } [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{
                                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                        }}
                                    >
                                        ACCOUNT PROFILE
                                    </AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className="w-full flex flex-col items-center">
                                            <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                                <div className="grid grid-cols-2 gap-[16px] text-sm font-normal">
                                                    <div>
                                                        <label>First Name</label>
                                                        <Input
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="First Name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Last Name</label>
                                                        <Input
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="Last Name"
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label>Email</label>
                                                        <Input
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="name@email.com"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label htmlFor="">Password Change</label>
                                                        <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden mt-[12px]">
                                                            <input
                                                                type="password"
                                                                id="password"
                                                                value={password}
                                                                disabled
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                className="text-[16px] font-medium w-full h-full px-4 focus:outline-none"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleReset();
                                                                    setOpenChangePasswordDialog(true);
                                                                }}
                                                                className="px-4 text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                                                }}
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

                                                    <div>
                                                        <label>Primary Phone</label>
                                                        <Input
                                                            value={primaryPhone}
                                                            onChange={(e) => setPrimaryPhone(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="(604) 451-5584"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Secondary Phone</label>
                                                        <Input
                                                            value={secondaryPhone}
                                                            onChange={(e) =>
                                                                setSecondaryPhone(e.target.value)
                                                            }
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="Optional"
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label>Company Name</label>
                                                        <Input
                                                            value={companyName}
                                                            onChange={(e) => setCompanyName(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="Company Name"
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label>Website</label>
                                                        <Input
                                                            value={website}
                                                            onChange={(e) => setWebsite(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="www.company.com"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label>Agent License #</label>
                                                        <Input
                                                            value={license}
                                                            onChange={(e) => setLicense(e.target.value)}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="12-778455"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label>Certifications</label>
                                                        <Input
                                                            value={certifications}
                                                            onChange={(e) => {
                                                                const inputValue = e.target.value;
                                                                const certsArray = inputValue
                                                                    .split(",")
                                                                    .map((cert) => cert.trim())
                                                                    .filter((cert) => cert !== "");
                                                                setCertifications(certsArray);
                                                            }}
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="CIPS, ABR, CRS, CCIM (comma separated)"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label>Headquarter Address</label>
                                                        <Input
                                                            value={headquarterAddress}
                                                            onChange={(e) =>
                                                                setHeadquarterAddress(e.target.value)
                                                            }
                                                            className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[8px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            type="text"
                                                            placeholder="686 Nelson Street"
                                                        />
                                                        <div className="w-full h-[200px] mt-4 bg-gray-200 flex items-center justify-center">
                                                            <DynamicMap
                                                                address={headquarterAddress}
                                                                city={city}
                                                                province={province}
                                                                country={country}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <div className="flex items-center justify-between">
                                                            <p>Assistants/Co Agents</p>
                                                            <div
                                                                className="flex items-center gap-x-[10px] cursor-pointer"
                                                                onClick={() => setOpenAddAgentDialog(true)}
                                                            >
                                                                <p className="text-base font-semibold font-raleway text-[#6BAE41]">
                                                                    Add
                                                                </p>
                                                                <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm " />
                                                            </div>
                                                            <AddCoAgentDialog
                                                                open={openAddAgentDialog}
                                                                setOpen={setOpenAddAgentDialog}
                                                                onSuccess={(agent) => {
                                                                    setCoAgents((prev) => [...prev, agent]);
                                                                }}
                                                            />
                                                        </div>
                                                        <div
                                                            className="border border-[#BBBBBB] mt-[12px] px-[6px] py-[8px] rounded-[6px] flex flex-wrap gap-[6px] min-h-[67px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                        >
                                                            {coAgents.map((coagent, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-center bg-[#E4E4E4] px-[6px] h-[24px] py-1.5 rounded-[10px] shadow-sm max-w-full break-words cursor-pointer overflow-hidden"
                                                                    style={{ maxWidth: "100%" }}
                                                                >
                                                                    <span
                                                                        className="text-sm font-normal text-[#7D7D7D] break-words whitespace-pre-wrap overflow-hidden text-ellipsis"
                                                                        onClick={() => setOpenAddAgentDialog(true)}
                                                                    >
                                                                        {coagent.name} &lt;{coagent.email}&gt;
                                                                    </span>
                                                                    <button
                                                                        type="button"
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
                                </AccordionItem>
                            )}

                            <AccordionItem value="branding" className="border-none">
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === "admin"
                                        ? "[&>svg]:text-[#4290E9]"
                                        : "[&>svg]:text-[#6BAE41]"
                                        }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                    }}
                                >
                                    BRANDING ASSETS
                                </AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className="w-full flex flex-col items-center">
                                        <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                            <p className="text-[#666666] text-sm font-normal">
                                                These branding images appear throughout your site,
                                                invoices, and marketing materials. Ensure you follow the
                                                recommendations to present the highest quality.
                                            </p>

                                            <div className="flex flex-col gap-y-[6px]">
                                                <div className="flex items-end gap-x-[6px]">
                                                    {avatarUrl ? (
                                                        <Image
                                                            unoptimized
                                                            src={avatarUrl}
                                                            alt="Avatar"
                                                            width={64}
                                                            height={64}
                                                            className="h-16 w-16 object-cover border"
                                                        />
                                                    ) : (
                                                        <div className="w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]"></div>
                                                    )}
                                                    <div className="flex-1">
                                                        <Label className="text-sm  text-gray-600">
                                                            Avatar
                                                        </Label>
                                                        <div className="flex items-center border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                            <span
                                                                className="max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
                                                                {AvatarfileName}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={triggerFileInput}
                                                                className="px-4 text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                                                }}
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
                                            <div className="flex flex-col gap-y-[6px]">
                                                <div className="flex items-end gap-x-[6px]">
                                                    {CompanyLogoUrl ? (
                                                        <Image
                                                            unoptimized
                                                            src={CompanyLogoUrl}
                                                            alt="Avatar"
                                                            width={64}
                                                            height={64}
                                                            className="h-16 w-16 object-cover border"
                                                        />
                                                    ) : (
                                                        <div className="w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]"></div>
                                                    )}
                                                    <div className="flex-1">
                                                        <Label className="text-sm  text-gray-600">
                                                            Company Logo
                                                        </Label>
                                                        <div className="flex items-center border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                            <span
                                                                className="max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
                                                                {CompanyLogofileName}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={triggerFileInput1}
                                                                className="px-4 text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                                                }}
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
                                                {fieldErrors.logo_path && (
                                                    <p className="text-red-500 text-[10px] mt-1">
                                                        {fieldErrors.logo_path[0]}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-y-[6px]">
                                                <div className="flex items-end gap-x-[6px] flex-1">
                                                    {CompanyBannerUrl ? (
                                                        <Image
                                                            unoptimized
                                                            src={CompanyBannerUrl}
                                                            alt="Avatar"
                                                            width={64}
                                                            height={64}
                                                            className="h-16 w-16 object-cover border"
                                                        />
                                                    ) : (
                                                        <div className="w-[64px] h-[64px] bg-[#E4E4E4] rounded-[6px]"></div>
                                                    )}
                                                    <div className="flex-1 h-full">
                                                        <Label className="text-sm font-normal">
                                                            Company Banner
                                                        </Label>
                                                        <div className="flex items-center border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                                            <span
                                                                className="max-w-[246px] text-[16px] font-normal py-2 px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden flex-1"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
                                                                {CompanyBannerfileName}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={triggerFileInput2}
                                                                className="px-4 text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                                                }}
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
                                                {fieldErrors.banner_path && (
                                                    <p className="text-red-500 text-[10px] mt-1">
                                                        {fieldErrors.banner_path[0]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {userType === "admin" && (
                                <AccordionItem value="hours" className="border-none hidden">
                                    <AccordionTrigger
                                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{
                                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                        }}
                                    >
                                        WORK HOURS
                                    </AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className="w-full flex flex-col items-center">
                                            <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                                <div className="grid grid-cols-2 gap-[16px]">
                                                    <div className="col-span-2">
                                                        <p>
                                                            Scheduling settings have impact on ordering from
                                                            all customers - addresses, last job location,
                                                            working hours, duration of services, travel time,
                                                            all contribute to your availability.
                                                        </p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p>
                                                            Set your working hours that clients can book your
                                                            services.
                                                        </p>
                                                    </div>
                                                    <div className="relative">
                                                        <label
                                                            htmlFor="time"
                                                            className="block text-sm font-normal"
                                                        >
                                                            Start Time <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            id="starttime"
                                                            type="text"
                                                            value={startTime}
                                                            onChange={(e) => setStartTime(e.target.value)}
                                                            className="h-[42px] w-full border text-[16px] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                        />
                                                        {fieldErrors.start_time && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.start_time[0]}
                                                            </p>
                                                        )}
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
                                                        <label
                                                            htmlFor="time"
                                                            className="block text-sm font-normal"
                                                        >
                                                            End Time <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            id="endtime"
                                                            type="text"
                                                            value={endTime}
                                                            onChange={(e) => setEndTime(e.target.value)}
                                                            className="h-[42px] w-full border text-[16px] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                        />
                                                        {fieldErrors.end_time && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.end_time[0]}
                                                            </p>
                                                        )}
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
                                                        <label>
                                                            Work Week <span className="text-red-500">*</span>
                                                        </label>
                                                        <Popover open={open} onOpenChange={setOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full h-[42px] border-[1px] hover:brightness-95 border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 text-[#424242]"
                                                                    style={{
                                                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                    }}
                                                                >
                                                                    {workWeek.length > 0
                                                                        ? workWeek.join(", ")
                                                                        : "Select Work Week"}
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
                                                                                type="button"
                                                                                onClick={() => toggleDay(day)}
                                                                                className="flex items-center gap-2 cursor-pointer text-[#666666] text-sm"
                                                                            >
                                                                                <span
                                                                                    className={`h-4 w-4 flex items-center justify-center border rounded-sm border-[#BBBBBB] ${checked
                                                                                        ? "bg-[#4290E9]"
                                                                                        : "bg-white"
                                                                                        }`}
                                                                                >
                                                                                    {checked && (
                                                                                        <Check size={12} color="white" />
                                                                                    )}
                                                                                </span>
                                                                                {day}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                        {fieldErrors.work_days && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.work_days[0]}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label htmlFor="">Repeat</label>
                                                        <Select
                                                            value={repeat}
                                                            onValueChange={(value) => setRepeat(value)}
                                                        >
                                                            <SelectTrigger
                                                                className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
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
                                                        {fieldErrors.repeat_weekly && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.repeat_weekly[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label htmlFor="timezone">
                                                            Time Zone <span className="text-red-500">*</span>
                                                        </label>
                                                        <Select
                                                            value={timeZone}
                                                            onValueChange={(value) => setTimeZone(value)}
                                                        >
                                                            <SelectTrigger
                                                                className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
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
                                                                <p className="text-red-500 text-[10px] mt-1">
                                                                    {fieldErrors.timezone[0]}
                                                                </p>
                                                            )}
                                                        </Select>
                                                    </div>
                                                    <div className="col-span-2 hidden">
                                                        <label htmlFor="">Commute Time Baseline</label>
                                                        <Select
                                                            value={commuteTime}
                                                            onValueChange={(value) => setCommuteTime(value)}
                                                        >
                                                            <SelectTrigger
                                                                className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
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
                                                        {fieldErrors.commute_minutes && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.commute_minutes[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 hidden">
                                                        <label htmlFor="">Reoccuring break</label>
                                                        <div className="flex items-center gap-[10px]">
                                                            <Input
                                                                checked={isReoccuringBreak}
                                                                onChange={(e) =>
                                                                    setIsReoccuringBreak(e.target.checked)
                                                                }
                                                                type="checkbox"
                                                                className="h-[20px] w-[20px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            />
                                                            <p className="text-[16px] font-normal text-[#666666] mt-[12px]">
                                                                Enable Google Calendar Sync
                                                            </p>
                                                        </div>
                                                        {fieldErrors.enable_breaks && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.enable_breaks[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className=" items-center gap-[10px] hidden">
                                                        <Input
                                                            checked={isSyncToGoogle}
                                                            onChange={(e) =>
                                                                setIsSyncToGoogle(e.target.checked)
                                                            }
                                                            type="checkbox"
                                                            className="h-[20px] w-[20px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                        />
                                                        <p className="text-[16px] font-normal text-[#666666] mt-[12px]">
                                                            Sync to Google
                                                        </p>
                                                        {fieldErrors.sync_google && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.sync_google[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="hidden">
                                                        <Select
                                                            onValueChange={(value) => setSyncEmailType(value)}
                                                            value={syncEmailType}
                                                        >
                                                            <SelectTrigger
                                                                className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[3px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                            >
                                                                <SelectValue placeholder="Select Email" />
                                                                <span className="custom-arrow">
                                                                    <DropDownArrow />
                                                                </span>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="primary">
                                                                    Primary Email
                                                                </SelectItem>
                                                                <SelectItem value="secondary">
                                                                    Secondary Email
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        {fieldErrors.sync_email && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.sync_email[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            {userType === "admin" && (
                                <AccordionItem value="vendor" className="border-none hidden">
                                    <AccordionTrigger
                                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{
                                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                        }}
                                    >
                                        VENDOR RATE SETTINGS
                                    </AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className="w-full flex flex-col items-center">
                                            <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                                <div className="grid grid-cols-2 gap-[16px] py-[32px]">
                                                    <div className="col-span-2">
                                                        <p className="text-sm font-normal text-[#666666]">
                                                            Set rate for all vendors commute reimbursement
                                                            value.
                                                        </p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <div>
                                                            <Label htmlFor="">Payment per kilometer</Label>
                                                            <Input
                                                                value={paymentPerKm}
                                                                onChange={(e) =>
                                                                    setPaymentPerKm(e.target.value)
                                                                }
                                                                className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
                                                                type="text"
                                                            />
                                                            {fieldErrors.payment_per_km && (
                                                                <p className="text-red-500 text-[10px] mt-1">
                                                                    {fieldErrors.payment_per_km[0]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            {userType === "admin" && (
                                <AccordionItem value="service" className="border-none hidden">
                                    <AccordionTrigger
                                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{
                                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                        }}
                                    >
                                        SERVICE AREA
                                    </AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className="w-full flex flex-col items-center">
                                            <div className="w-full flex justify-center flex-col">
                                                <div className="w-full h-[200px] md:h-[560px]">

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
                            )}

                            {userType === "admin" && (
                                <AccordionItem value="order" className="border-none hidden">
                                    <AccordionTrigger
                                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                        style={{
                                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                        }}
                                    >
                                        ORDER FORM
                                    </AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className="w-full flex flex-col items-center">
                                            <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                                <div className="grid grid-cols-2 gap-[32px]">
                                                    <div className="col-span-2">
                                                        <label
                                                            htmlFor=""
                                                            className="text-[16px] font-normal text-[#666666]"
                                                        >
                                                            Full Page Order Form
                                                        </label>
                                                        <div className="relative mt-[12px]">
                                                            <Input
                                                                id="order-link"
                                                                type="text"
                                                                className="h-[42px] placeholder:text-[#9ca3af] w-full border border-[#BBBBBB] px-4 pr-10 text-sm"
                                                                style={{
                                                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                                }}
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
                                                        <p className="text-xs font-normal text-[#666666] mt-[6px]">
                                                            Copy and paste the URL to a link or button on your
                                                            business website to integrate BCFP services to
                                                            your page.
                                                        </p>
                                                        {fieldErrors.order_form_url && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.order_form_url[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <div className="flex items-center justify-between">
                                                            <label
                                                                htmlFor=""
                                                                className="text-[16px] font-normal text-[#666666]"
                                                            >
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
                                                            className="h-[200px] w-full p-3 rounded-[6px] border-[1px] border-[#BBBBBB] mt-[12px]"
                                                            style={{
                                                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                                            }}
                                                            value={iframeCode}
                                                            onChange={(e) => setIframeCode(e.target.value)}
                                                            placeholder='<iframe src="gre_iframe.html" style="height:auto;width:auto;" title="BC Floor Plans"></iframe>'
                                                        />
                                                        {fieldErrors.iframe_code && (
                                                            <p className="text-red-500 text-[10px] mt-1">
                                                                {fieldErrors.iframe_code[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            <AccordionItem value="payment" className="border-none hidden">
                                <AccordionTrigger
                                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType === "admin"
                                        ? "[&>svg]:text-[#4290E9]"
                                        : "[&>svg]:text-[#6BAE41]"
                                        }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                                    }}
                                >
                                    PAYMENT
                                </AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className="w-full flex flex-col items-center">
                                        <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                            <div className="grid grid-cols-2 gap-[32px]">
                                                {userType === "admin" && (
                                                    <div className="col-span-2">
                                                        <div className="flex flex-col gap-y-[16px] text-sm font-normal text-[#7D7D7D]">
                                                            <div>
                                                                <p className="font-bold">
                                                                    {planName}{" "}
                                                                    <span className="font-normal">
                                                                        ({billingCycle})
                                                                    </span>
                                                                </p>
                                                                <p>{seats} Seats</p>
                                                                <p>Joined: {joinDate}</p>
                                                            </div>

                                                            <div className="flex items-center gap-x-1">
                                                                <p>Add additional</p>
                                                                <Link
                                                                    href=""
                                                                    className="text-[#4290E9] font-bold underline"
                                                                >
                                                                    SEATS
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="col-span-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-bold text-sm text-[#666666]">
                                                            Cards
                                                        </p>
                                                        <div
                                                            className="flex items-center gap-x-[10px] cursor-pointer"
                                                            onClick={() => setOpenPaymentDialog(true)}
                                                        >
                                                            <p className="text-base font-semibold font-raleway text-[#6BAE41]">
                                                                Add
                                                            </p>
                                                            <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm" />
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
                                                        <div
                                                            key={card.uuid}
                                                            className="flex flex-col gap-y-3 mt-2"
                                                        >
                                                            <div className="flex justify-between items-center w-full text-[16px] font-normal text-[#666666]">
                                                                <div className="basis-[60%] flex items-center justify-between w-full gap-x-2.5">
                                                                    <p className="text-[#4290E9]">
                                                                        {capitalizeFirst(card.type)}
                                                                    </p>
                                                                    <p>
                                                                        {card.last_four.slice(0, 4)} **** **** ****
                                                                    </p>
                                                                </div>
                                                                <div className="basis-[40%] w-full flex gap-x-4 items-center justify-end">
                                                                    {card.is_primary && (
                                                                        <span className="text-sm font-normal text-[#666666]">
                                                                            Primary
                                                                        </span>
                                                                    )}
                                                                    <X
                                                                        onClick={() => handleDelete(card.uuid)}
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

                                        <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-sm text-[#666666]">
                                                    Discounts
                                                </p>
                                                <div
                                                    className="flex items-center gap-x-[10px] cursor-pointer"
                                                    onClick={() => setOpenDiscount(true)}
                                                >
                                                    <p className="text-base font-semibold font-raleway text-[#6BAE41]">
                                                        Add
                                                    </p>
                                                    <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm" />
                                                </div>
                                                <AgentDiscount
                                                    open={openDiscount}
                                                    setOpen={setOpenDiscount}
                                                    addDiscount={addDiscount}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                {agentdiscounts.map((discount) => (
                                                    <div
                                                        key={discount.id}
                                                        className="flex flex-col gap-y-3 mt-2"
                                                    >
                                                        <div className="flex justify-between items-center w-full text-[16px] font-normal text-[#666666]">
                                                            <div className="basis-[80%] flex items-center justify-between w-full gap-x-2.5">
                                                                <p className="text-[#4290E9]">
                                                                    {capitalizeFirst(discount.discount_code || "")}
                                                                </p>

                                                                {discount.expiry_date && <p className="text-[12px] font-[300] text-[#666666]">
                                                                    Expires {discount.expiry_date}
                                                                </p>}
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
                                        <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                                            {!quickBookStatus ? (
                                                <Button
                                                    onClick={handleQuickBookStatus}
                                                    type="button"
                                                    className={`${userType}-bg hover-${userType}-bg`}
                                                >
                                                    {isLoading ? "Connecting..." : "Connect Quick Book"}
                                                </Button>
                                            ) : (
                                                <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="font-medium text-gray-900 text-sm">QuickBooks Connected</span>
                                                        </div>
                                                        <Button
                                                            onClick={handleDisconnectQB}
                                                            type="button"
                                                            variant="outline"
                                                            disabled={isQbDisconnecting}
                                                            className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            {isQbDisconnecting ? "Disconnecting..." : "Disconnect"}
                                                        </Button>
                                                    </div>

                                                    {qbQueueInfo && (
                                                        <div className="text-xs text-gray-600 flex flex-col gap-1 border-t pt-3">
                                                            <div className="flex justify-between">
                                                                <span>Total Invoices Synced:</span>
                                                                <span className="font-semibold text-gray-800">{qbQueueInfo.synced_count ?? 0}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Pending / Unsynced:</span>
                                                                <span className="font-semibold text-amber-600">{qbQueueInfo.pending_syncs ?? 0}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <Button
                                                        onClick={handleRetryQbSync}
                                                        type="button"
                                                        disabled={isQbSyncing}
                                                        variant="outline"
                                                        className="text-xs h-9 mt-1 border-gray-300"
                                                    >
                                                        {isQbSyncing ? "Syncing..." : "Sync Pending Invoices"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </div>
                    )}

                    {activeTab === "Tour Settings" && userType === "admin" && (
                        <GlobalTourSetting ref={tourSettingsRef} />
                    )}
                    {activeTab === "Appearances" && userType === "admin" && (
                        <WhiteLabelSettings />
                    )}
                    {activeTab === "Organizations" && userType === "admin" && (
                        <OrganizationsSettings ref={orgSettingsRef} />
                    )}
                </Accordion>
            </form>
        </div>
    );
};

export default GlobalSettings;
