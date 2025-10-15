'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Country, State } from 'country-state-city';
import { DateTime } from 'luxon';
//import ToggleButtons from '@/components/ui/toogle'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { useParams, useRouter } from 'next/navigation'
//import CloseDialog from '@/components/CloseDialog'
import ChangePasswordDialog from '@/components/ChangePasswordDialog'
import { connectStripe, Create, Edit, GetOne, GetServices, VendorAddress, VendorPayload, VendorService, VendorSettings, WorkHours } from '../vendors'
import { SaveModal } from '@/components/SaveModal'
import { Plus, X } from 'lucide-react'
import { friendlyTimeZoneNames, PaymentCard } from '@/components/GlobalSettings'
import TravelTable from '@/components/TravelTable'
import { useAppContext } from '@/app/context/AppContext'
import PaymentDialog from '@/components/PaymentDialog'
import { DeleteCard, GetPaymentMethod } from '../../global-settings/global-settings'
import { LatLng } from '@/components/WorkAreaMap'
import useUnsavedChangesWarning from '@/app/hooks/useUnsavedChangesWarning'
import { useUnsaved } from '@/app/context/UnsavedContext'
import VendorWorkHours from '@/components/WorkHours'
interface VendorCompany {
    company_name: string;
    company_website: string;
    company_logo: string;
    company_logo_url: string;
    company_banner: string;
    company_banner_url: string;
}
const VendorForm = () => {
    interface Services {
        uuid: string;
        name?: string;
        category?: { name: string };
        background_color?: string;
        bcolor?: string;
        thumbnail?: string
        thumbnail_url?: string
        status?: boolean;
    }
    type CurrentUser = {
        uuid: string;
        first_name: string;
        last_name: string;
        email: string;
        secondary_email?: string;
        primary_phone?: string;
        secondary_phone?: string;
        notification_email?: boolean;
        email_type?: string;
        name_on_booking: boolean;
        repeat_weekly: string;
        review_files: boolean;
        sync_google_calendar: boolean;
        sync_google: boolean;
        sync_email: string;
        password?: string;
        avatar?: string;
        avatar_url?: string;
        company?: VendorCompany;
        settings?: VendorSettings;
        vendor_services?: VendorService[];
        addresses?: VendorAddress[];
        work_hours?: WorkHours;
        coordinates?: string[]
        // add other fields as needed
    };
    type TimeZoneOption = {
        label: string;
        value: string;
    };

    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    //const [openCloseDialog, setOpenCloseDialog] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [secondaryEmail, setSecondaryEmail] = useState("");
    const [notificationEmail, setNotificationEmail] = useState(false);
    const [enableServiceArea, setEnableServiceArea] = useState(false);
    const [forceServiceArea, setForceServiceArea] = useState(false);
    const [adminReviewRequired, setAdminReviewRequired] = useState(false);
    const [showVendorName, setShowVendorName] = useState(false);
    const [paymentPerKm, setPaymentPerKm] = useState<string | number>('');
    const [billingAddress1, setBillingAddress1] = useState('');
    const [billingAddress2, setBillingAddress2] = useState('');
    const [startLocation, setStartLocation] = useState('');
    const [emailType, setEmailType] = useState("");
    const [primaryPhone, setPrimaryPhone] = useState("");
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [active, setActive] = useState("details");
    const [countries, setCountries] = useState<{ name: string, isoCode: string }[]>([]);
    const [states, setStates] = useState<{ name: string, isoCode: string }[]>([]);
    const [companyAddress, setCompanyAddress] = useState("");
    const [companyCity, setCompanyCity] = useState("");
    const [companyProvince, setCompanyProvince] = useState("");
    const [companyCountry, setCompanyCountry] = useState("CA");
    const [billingAddress, setBillingAddress] = useState("");
    const [billingCity, setBillingCity] = useState("");
    const [billingProvince, setBillingProvince] = useState("");
    const [billingCountry, setBillingCountry] = useState("CA");
    // const [vendorServicesId, setVendorServicesId] = useState("");
    const [password, setPassword] = useState("");
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
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
    const [companyBannerFile, setCompanyBannerFile] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [startTime, setStartTime] = useState("8:00 AM");
    const [endTime, setEndTime] = useState("8:00 AM");
    const [breakStartTime, setBreakStartTime] = useState("8:00 AM");
    const [breakEndTime, setBreakEndTime] = useState("8:00 AM");
    const [workWeek, setWorkWeek] = useState<string[]>([]);
    const [repeat, setRepeat] = useState('Repeat every week');
    const [timeZone, setTimeZone] = useState('America/Edmonton');
    const [commuteTime, setCommuteTime] = useState("");
    const [isEnableGoogle, setIsEnableGoogle] = useState(false);
    const [isSyncToGoogle, setIsSyncToGoogle] = useState(false);
    const [syncEmailType, setSyncEmailType] = useState('');
    const [timeZoneOptions, setTimeZoneOptions] = useState<TimeZoneOption[]>([]);
    // const [serviceId, setServiceId] = useState("");
    // const [hourlyRate, setHourlyRate] = useState<number | ''>('');
    // const [timeNeeded, setTimeNeeded] = useState("");
    // const [services, setServices] = useState<{ serviceId: string; hourlyRate: number; timeNeeded: string; }[]>([]);
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [cards, setCards] = useState<PaymentCard[]>([]);
    const [map_coordinates, setmap_coordinates] = useState<LatLng[]>([]);
    const [isStripeLoading, setIsStripeLoading] = useState(false);
    console.log(timeZoneOptions);

    const { userType } = useAppContext()
    const { isDirty, setIsDirty } = useUnsaved();
    useUnsavedChangesWarning(isDirty)
    const isPopulatingData = useRef(false);


    const handleReset = () => {
        setPassword("");
    };
    const router = useRouter();
    console.log('current user', currentUser);
    const params = useParams();
    const userId = params?.id as string;
    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);
    useEffect(() => {
        const companyAddressObj = currentUser?.addresses?.find(addr => addr.type === "company");
        if (states.length && companyAddressObj?.province) {
            const match = states.find((s) => s.isoCode === companyAddressObj.province);
            if (match) {
                setCompanyProvince(match.isoCode);
            }
        }
    }, [states, currentUser]);
    useEffect(() => {
        if (companyCountry) {
            setStates(State.getStatesOfCountry(companyCountry));
            setCompanyProvince('');
        }
    }, [companyCountry]);
    const capitalizeFirst = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    // useEffect(() => {
    //     setCountries(Country.getAllCountries());
    // }, []);
    useEffect(() => {
        const billingAddressObj = currentUser?.addresses?.find(addr => addr.type === "billing");
        if (states.length && billingAddressObj?.province) {
            const match = states.find((s) => s.isoCode === billingAddressObj.province);
            if (match) {
                setBillingProvince(match.isoCode);
            }
        }
    }, [states, currentUser]);
    useEffect(() => {
        if (billingCountry) {
            setStates(State.getStatesOfCountry(billingCountry));
            setBillingProvince('');
        }
    }, [billingCountry]);
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

    // useEffect(() => {
    //     if (!serviceId || !hourlyRate || !timeNeeded) return;

    //     const alreadyExists = services.some(
    //         s =>
    //             s.serviceId === serviceId &&
    //             s.hourlyRate === hourlyRate &&
    //             s.timeNeeded === timeNeeded
    //     );

    //     if (!alreadyExists) {
    //         const newService = {
    //             serviceId,
    //             hourlyRate,
    //             timeNeeded,
    //         };

    //         setServices(prev => [...prev, newService]);

    //         // Clear inputs after adding
    //         setServiceId("");
    //         setHourlyRate(0);
    //         setTimeNeeded("");
    //     }
    // }, [serviceId, hourlyRate, timeNeeded, services]);

    useEffect(() => {
        const token = localStorage.getItem("token")

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetServices(token)
            .then((data) => {
                setServicesData(Array.isArray(data.data) ? data.data : []);
            })
            .catch((err) => console.log(err.message));
    }, []);

    let idToUse: string = '';

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (userType === "vendor") {
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
            console.log('Token not found.')
            return;
        }

        if (idToUse) {
            GetOne(token, idToUse)
                .then(data => { setCurrentUser(data.data) })
                .catch(err => console.log(err.message));
        } else {
            console.log('User ID is undefined.');
        }
    }, [userId, userType]);

    useEffect(() => {
        if (currentUser) {
            isPopulatingData.current = true;
            setFirstName(currentUser.first_name || "");
            setLastName(currentUser.last_name || "");
            setEmail(currentUser.email || "");
            setSecondaryEmail(currentUser.secondary_email || "");
            setNotificationEmail(currentUser.notification_email ?? false);
            const type = currentUser.email_type?.toLowerCase();
            setEmailType(type || "");
            setPrimaryPhone(currentUser.primary_phone || "");
            setSecondaryPhone(currentUser.secondary_phone || "");
            setAvatarFileName(currentUser.avatar || "");
            setmap_coordinates(
                typeof currentUser?.coordinates === "string"
                    ? JSON.parse(currentUser.coordinates)
                    : Array.isArray(currentUser?.coordinates)
                        ? currentUser.coordinates
                        : []
            )

            if (currentUser.avatar_url) setAvatarUrl(currentUser.avatar_url);

            // Addresses
            const companyAddress = currentUser.addresses?.find(addr => addr.type === "company");
            const startLocationAddress = currentUser.addresses?.find(addr => addr.type === "start_location");
            const billingAddress = currentUser.addresses?.find(addr => addr.type === "billing");
            if (companyAddress) {
                setCompanyAddress(companyAddress.address_line_1 || "");
                setCompanyCity(companyAddress.city || "");
                setCompanyProvince(companyAddress.province || "");
                setCompanyCountry(companyAddress.country || "CA");
            }

            if (startLocationAddress) {
                setStartLocation(startLocationAddress.address_line_1 || "");
                setBillingAddress(startLocationAddress.address_line_2 || "");
                setBillingCity(startLocationAddress.city || "");
                setBillingProvince(startLocationAddress.province || "");
                setBillingCountry(startLocationAddress.country || "CA");
            }
            if (billingAddress) {
                setBillingAddress1(billingAddress.address_line_1 || "");
                setBillingAddress2(billingAddress.address_line_2 || "");
            }

            // Settings
            if (currentUser.settings) {
                setPaymentPerKm(currentUser.settings.payment_per_km || 0);
                setEnableServiceArea(!!currentUser.settings.enable_service_area);
                setForceServiceArea(!!currentUser.settings.force_service_area);
            }
            if (currentUser.company) {
                setCompanyLogoUrl(currentUser.company.company_logo_url);
                setCompanyBannerUrl(currentUser.company.company_banner_url);
                setCompanyBannerFileName(currentUser.company.company_banner || "");
                setCompanyLogoFileName(currentUser.company.company_logo || "");
                setCompanyName(currentUser.company.company_name || "");
                setCompanyWebsite(currentUser.company.company_website || "");
            }

            // Work hours
            if (currentUser.work_hours) {
                setStartTime(formatTime(currentUser.work_hours.start_time || ""));
                setEndTime(formatTime(currentUser.work_hours.end_time || ""));
                console.log("workweekkkk", currentUser.work_hours.work_days);
                //setWorkWeek(currentUser.work_hours.work_days);
                setRepeat(typeof currentUser.work_hours.repeat_weekly === 'string' ? currentUser.work_hours.repeat_weekly : '');
                setCommuteTime(`${currentUser.work_hours.commute_minutes} Minutes`);
                setTimeZone(currentUser.work_hours.timezone || "");
                setBreakStartTime(formatTime(currentUser.work_hours.break_start || ""));
                setBreakEndTime(formatTime(currentUser.work_hours.break_end || ""));
            }
            if (currentUser?.work_hours?.work_days) {
                let parsed: string[] = [];

                if (typeof currentUser.work_hours.work_days === 'string') {
                    parsed = JSON.parse(currentUser.work_hours.work_days);
                } else if (Array.isArray(currentUser.work_hours.work_days)) {
                    parsed = currentUser.work_hours.work_days;
                }

                // Capitalize the first letter of each day to match your UI
                const capitalized = parsed.map(day => day.charAt(0).toUpperCase() + day.slice(1));
                setWorkWeek(capitalized);
            }
            if (currentUser.vendor_services) {
                const firstService = currentUser.vendor_services[0];
                if (firstService?.uuid) {
                    // setVendorServicesId(firstService.uuid);
                }
            }
            // Services
            if (currentUser.vendor_services) {
                // const formattedServices = currentUser.vendor_services
                //     .filter(s => s.service?.uuid) // only include entries with service.uuid
                //     .map(s => ({
                //         serviceId: s.service!.uuid, // non-null because we filtered above
                //         hourlyRate: Number(s.hourly_rate),
                //         timeNeeded: `${s.time_needed} Minutes`,
                //     }));

                // setServices(formattedServices);
            }
            setShowVendorName(currentUser.name_on_booking);
            setAdminReviewRequired(currentUser.review_files);
            setIsEnableGoogle(currentUser.sync_google_calendar);
            setIsSyncToGoogle(currentUser.sync_google);
            setSyncEmailType(currentUser.sync_email || "");
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
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || '';

            let formattedWebsite = companyWebsite?.trim();
            if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
                formattedWebsite = 'https://' + formattedWebsite;
            }
            const payload: VendorPayload = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                secondary_email: secondaryEmail || undefined,
                primary_phone: primaryPhone || undefined,
                notification_email: notificationEmail ? 1 : 0,
                email_type: emailType || undefined,
                name_on_booking: showVendorName ? 1 : 0,
                review_files: adminReviewRequired ? 1 : 0,
                sync_google_calendar: isEnableGoogle ? 1 : 0,
                sync_google: isSyncToGoogle ? 1 : 0,
                sync_email: syncEmailType,
                secondary_phone: secondaryPhone || undefined,
                password: password || undefined,
                avatar: avatarFile || undefined,
                company_logo: companyLogoFile,
                company_banner: companyBannerFile,
                coordinates: JSON.stringify(map_coordinates),
                addresses: [
                    {
                        type: "company",
                        address_line_1: companyAddress,
                        address_line_2: null,
                        city: companyCity,
                        province: companyProvince,
                        country: companyCountry
                    },
                    {
                        type: "start_location",
                        address_line_1: startLocation,
                        address_line_2: billingAddress,
                        city: billingCity,
                        province: billingProvince,
                        country: billingCountry
                    },
                    {
                        type: "billing",
                        address_line_1: billingAddress1,
                        address_line_2: billingAddress2,
                        city: billingCity,
                        province: billingProvince,
                        country: billingCountry
                    }
                ],
                work_hours: {
                    start_time: convertTo24HourFormat(startTime),
                    end_time: convertTo24HourFormat(endTime),
                    work_days: workWeek.map(day => day.toLowerCase()),
                    repeat_weekly: repeat,
                    commute_minutes: parseInt(commuteTime) || 0,
                    timezone: timeZone,
                    break_start: convertTo24HourFormat(breakStartTime),
                    break_end: convertTo24HourFormat(breakEndTime),
                },
                company: {
                    name: companyName,
                    website: formattedWebsite,
                    // company_logo: companyLogoFile,
                    // company_banner: companyBannerFile
                },

                // services: services.map(s => ({
                //     uuid: vendorServicesId,
                //     service_id: s.serviceId,
                //     hourly_rate: s.hourlyRate,
                //     time_needed: parseInt(s.timeNeeded)
                // })),
                settings: {
                    payment_per_km: Number(paymentPerKm),
                    enable_service_area: enableServiceArea ? 1 : 0,
                    force_service_area: forceServiceArea ? 1 : 0
                }
            };
            let idToUse: string = '';

            if (userType === "vendor") {
                const userInfo = localStorage.getItem("userInfo");
                if (userInfo) {
                    try {
                        const parsedInfo = JSON.parse(userInfo);
                        idToUse = parsedInfo.uuid;
                    } catch (err) {
                        console.error("Failed to parse userInfo:", err);
                    }
                }
            } else {
                idToUse = userId;
            }
            if (!token) {
                console.log('Token not found.')
                return;
            }
            if (idToUse) {
                // Add _method: 'PUT' to payload for method override
                const updatedPayload = { ...payload, _method: 'PUT' };
                await Edit(idToUse, updatedPayload, token);
                setIsLoading(true)
                setIsDirty(false)
                if (userType !== 'vendor') {

                    setOpenSaveDialog(true)
                    router.push('/dashboard/vendors');
                    toast.success('Vendors updated successfully');
                } else {

                    toast.success('Settings updated successfully');
                }
                setIsLoading(false)
            } else {
                await Create(payload, token);
                toast.success('Vendors created successfully');
                setIsLoading(true)
                setOpenSaveDialog(true)
                router.push('/dashboard/vendors');
                setIsLoading(false)
                setIsDirty(false)
            }

        } catch (error) {
            setIsLoading(false);
            setOpenSaveDialog(false);
            console.log('Raw error:', error);
            setFieldErrors({});

            const apiError = error as { message?: string; errors?: Record<string, string[]> };

            if (apiError.errors && typeof apiError.errors === 'object') {
                const normalizedErrors: Record<string, string[]> = {};

                Object.entries(apiError.errors).forEach(([key, messages]) => {
                    // Keep the full key, including dot-notation (e.g., product_options.0.title)
                    if (!normalizedErrors[key]) {
                        normalizedErrors[key] = [];
                    }
                    normalizedErrors[key].push(...messages);
                });

                setFieldErrors(normalizedErrors);

                //const firstError = Object.values(normalizedErrors).flat()[0];
                // toast.error(firstError || 'Validation error');
                toast.error('Validation error kindly re-check your form');
            } else if (error instanceof Error) {
                toast.error(error.message);
                console.error(error.message);
            } else {
                toast.error('Failed to submit user data');
            }
        }
    };

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
    console.log("fieldErrors", fieldErrors);
    const handleConnectStripe = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setIsStripeLoading(true);
        try {
            const token = localStorage.getItem("token") || "";

            if (!token) {
                toast.error("Please login first");
                return;
            }

            const result = await connectStripe(token);

            if (result.success) {
                toast.success("Redirecting to Stripe...");

                if (result.url) {
                    window.location.href = result.url;
                }
            } else {
                toast.error(result.error || "Failed to connect Stripe");
            }

        } catch (error) {
            console.error("Stripe connection error:", error);
            toast.error("Failed to connect Stripe");
        } finally {
            setIsStripeLoading(false);
        }
    };


    return (
        <div className='font-alexandria'>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                {userType === "vendor" &&
                    <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}> Settings</p>}
                {userType !== "vendor" &&
                    <p className='text-[16px] md:text-[24px] font-[400]  text-[#4290E9]'> Vendor
                        {currentUser ? ` › ${currentUser.first_name} ${currentUser.last_name}` : ' › Create'}</p>}
                <div className='flex gap-[10px] items-center'>
                    {(active === "travel") && (
                        <Button
                            className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-white text-[#4290E9] hover:bg-[#f0f0f0] text-[14px] md:text-[16px] font-[400] flex gap-[5px] items-center'
                        >
                            Payout Period
                        </Button>
                    )}
                    {/* {(active === "travel") && (
                        <Button
                            className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'
                        >
                            Payments
                        </Button>
                    )} */}
                    {(active === "details" || active === "work hours") && (
                        <Button onClick={(e) => { handleSubmit(e) }} className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}>Save Changes</Button>
                    )}
                </div>
            </div>
            <SaveModal
                isOpen={openSaveDialog}
                onClose={() => setOpenSaveDialog(false)}
                isLoading={isLoading}
                isSuccess={true}
                backLink="/dashboard/vendors"
                title={'Vendors'}
            />
            {
                <div className='flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600]' >
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActive("details")}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                            ${active === "details" ? "bg-[#4290E9] text-white" : "bg-[#F2F2F2] text-[#666666]"}`}
                        >
                            DETAILS
                        </button>
                        <button
                            onClick={() => setActive("work hours")}
                            className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                            ${active === "work hours" ? "bg-[#4290E9] text-white" : "bg-[#F2F2F2] text-[#666666]"}`}
                        >
                            WORK HOURS
                        </button>
                        {/* <button
                        onClick={() => setActive("history")}
                        className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                ${active === "history" ? "bg-[#4290E9] text-white" : "bg-[#E4E4E4] text-[#666666]"}`}
                    >
                        HISTORY
                    </button> */}
                        {userType !== 'vendor' &&
                            (currentUser?.uuid && (
                                <button
                                    onClick={() => setActive("travel")}
                                    className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                                ${active === "travel" ? "bg-[#4290E9] text-white" : "bg-[#F2F2F2] text-[#666666]"}`}
                                >
                                    TRAVEL
                                </button>
                            ))
                        }
                    </div>
                </div>}
            <div>
                {(active === "details") && (
                    <form
                        onChange={() => {
                            if (!isPopulatingData.current && userId) {
                                setIsDirty(true);
                            } else if (!userId) {
                                setIsDirty(true)
                            }
                        }}
                    >
                        <Accordion type="multiple" defaultValue={["profile", "branding", "vendor", "service-area", "account", "hours", "location", "service", 'payment']} className="w-full space-y-4">
                            <AccordionItem value="profile">
                                <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>PROFILE</AccordionTrigger>
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
                                                            setFirstName(e.target.value)
                                                            setIsDirty(true);
                                                        }}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                    {fieldErrors.first_name && <p className='text-red-500 text-[10px]'>{fieldErrors.first_name[0]}</p>}
                                                </div>
                                                <div>
                                                    <label htmlFor="">Last Name <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={lastName}
                                                        onChange={(e) => {
                                                            setLastName(e.target.value)
                                                            setIsDirty(true);
                                                        }}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                    {fieldErrors.last_name && <p className='text-red-500 text-[10px]'>{fieldErrors.last_name[0]}</p>}
                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Email <span className="text-red-500">*</span></label>
                                                    <Input value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="email" />

                                                    {fieldErrors.email && <p className='text-red-500 text-[10px]'>{fieldErrors.email[0]}</p>}
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
                                                    <label htmlFor="">Address <span className="text-red-500">*</span></label>
                                                    <Input value={companyAddress}
                                                        onChange={(e) => setCompanyAddress(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />

                                                    {fieldErrors[`addresses.${1}.address_line_1`] && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {fieldErrors[`addresses.${1}.address_line_1`][0]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label htmlFor="">City <span className="text-red-500">*</span></label>
                                                    <Input value={companyCity}
                                                        onChange={(e) => setCompanyCity(e.target.value)}
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                    {fieldErrors[`addresses.${1}.city`] && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {fieldErrors[`addresses.${1}.city`][0]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label htmlFor="">Province <span className="text-red-500">*</span></label>
                                                    <Select
                                                        value={companyProvince}
                                                        onValueChange={(val) => setCompanyProvince(val)}
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
                                                    {fieldErrors[`addresses.${1}.province`] && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {fieldErrors[`addresses.${1}.province`][0]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Country</label>
                                                    <Select value={companyCountry} onValueChange={(val) => setCompanyCountry(val)}>
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
                                                {currentUser && (<p className='text-[16px] font-normal text-[#666666]'>Reset Password</p>)}
                                                <div className='col-span-2'>
                                                    <div className='flex items-center justify-between'>
                                                        <p >Show Vendor Name When Booking</p>
                                                        <Switch checked={showVendorName}
                                                            onCheckedChange={setShowVendorName} className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41] float-end" />
                                                        {fieldErrors.review_files && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.review_files[0]}</p>}
                                                    </div>
                                                </div>
                                                <div className='col-span-2'>
                                                    <div className='flex items-center justify-between'>
                                                        <p >Review Files before Submitting to Clients</p>
                                                        <Switch checked={adminReviewRequired}
                                                            onCheckedChange={setAdminReviewRequired} className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41] float-end" />
                                                        {fieldErrors.review_files && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.review_files[0]}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="location" className='border-none'>
                                <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>LOCATION</AccordionTrigger>
                                <AccordionContent className="grid gap-4">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            <div className='grid grid-cols-2 gap-[16px] text-sm font-normal text-[#424242]'>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Start Location <span className="text-red-500">*</span></label>
                                                    <Input value={startLocation}
                                                        onChange={(e) => setStartLocation(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]' type="text" placeholder='7458 Burrard Street' />
                                                    {fieldErrors[`addresses.${1}.address_line_1`] && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {fieldErrors[`addresses.${1}.address_line_1`][0]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Address <span className="text-red-500">*</span></label>
                                                    <Input value={billingAddress}
                                                        onChange={(e) => setBillingAddress(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]' type="text" placeholder='7458 Burrard Street' />
                                                    {fieldErrors[`addresses.${2}.address_line_1`] && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {fieldErrors[`addresses.${2}.address_line_1`][0]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label htmlFor="">City <span className="text-red-500">*</span></label>
                                                    <Input value={billingCity}
                                                        onChange={(e) => setBillingCity(e.target.value)} className='h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] mt-[12px]' type="text" placeholder='Burnaby' />
                                                    {fieldErrors[`addresses.${2}.city`] && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {fieldErrors[`addresses.${2}.city`][0]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label htmlFor="">Province <span className="text-red-500">*</span></label>
                                                    <Select
                                                        value={billingProvince}
                                                        onValueChange={(val) => setBillingProvince(val)}
                                                        disabled={!states.length}
                                                    >
                                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB] data-[placeholder]:text-[#9ca3af]">
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
                                                    {fieldErrors[`addresses.${2}.province`] && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {fieldErrors[`addresses.${2}.province`][0]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Country</label>
                                                    <Select value={billingCountry} onValueChange={(val) => setBillingCountry(val)}>
                                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB] data-[placeholder]:text-[#9ca3af]">
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
                                                    {fieldErrors[`addresses.${1}.address_line_1`] && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {fieldErrors[`addresses.${1}.address_line_1`][0]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className='col-span-2'>
                                                    <label htmlFor="">Billing Address Line 2</label>
                                                    <Input value={billingAddress2}
                                                        onChange={(e) => setBillingAddress2(e.target.value)} className='h-[42px] bg-[#EEEEEE] placeholder:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
                                                    {fieldErrors.billing_street_2 && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.billing_street_2[0]}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="branding">
                                <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>Branding Assets</AccordionTrigger>
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
                                                <p className={`text-[10px] ${userType}-text`}>
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
                                                <p className={`text-[10px] ${userType}-text`}>
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
                                                <p className={`text-[10px] ${userType}-text`}>
                                                    Company banner 1600 x 720, PNG or JPG
                                                </p>
                                            </div>
                                            <p className='text-[#666666] text-sm font-normal pt-4'>Explanation of where these assets are used and leveraged, recommended/specify dimensions, color variations, etc.</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {
                                userType === 'vendor' &&
                                <AccordionItem value="payment" className='border-none'>
                                    <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === 'vendor' ? '[&>svg]:text-[#6BAE41]' : '[&>svg]:text-[#6BAE41]'}  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>PAYMENT</AccordionTrigger>
                                    <AccordionContent className="grid gap-4">
                                        <div className='w-full flex flex-col items-center'>
                                            <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                                <div className='grid grid-cols-2 gap-[32px]'>

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
                                                    {userType === 'vendor' && (
                                                        <div className="col-span-2">
                                                            <button
                                                                onClick={(e) => handleConnectStripe(e)}
                                                                disabled={isStripeLoading}
                                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                            >
                                                                {isStripeLoading ? (
                                                                    <>
                                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Connecting...
                                                                    </>
                                                                ) : (
                                                                    'Connect Stripe'
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            }
                            {currentUser && (
                                <AccordionItem value="account" className='border-none'>
                                    <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>ACCOUNT MANAGEMENT</AccordionTrigger>
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
                                                                type="vendor"
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
                            )}
                        </Accordion>
                    </form>
                )
                }
                {(active === "travel") && (
                    <TravelTable userId={currentUser?.uuid} />
                )
                }
                {(active === "work hours") && (
                    <VendorWorkHours
                        currentUser={Array.isArray(currentUser) ? currentUser[0] : currentUser}
                        servicesData={servicesData}
                        // services={services}
                        // setServices={setServices}
                        setPaymentPerKm={setPaymentPerKm}
                        paymentPerKm={paymentPerKm}
                        fieldErrors={fieldErrors}
                        enableServiceArea={enableServiceArea}
                        setEnableServiceArea={setEnableServiceArea}
                        forceServiceArea={forceServiceArea}
                        setForceServiceArea={setForceServiceArea}
                        providerId={idToUse}
                        address={companyAddress}
                        city={companyCity}
                        province={companyProvince}
                        country={companyCountry}
                        coords={map_coordinates}
                        setmap_coordinates={setmap_coordinates}

                    />)
                }

            </div>
        </div >
    )
}

export default VendorForm