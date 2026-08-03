"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Country, State } from "country-state-city";
//import ToggleButtons from '@/components/ui/toogle'
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useParams, useRouter, useSearchParams } from "next/navigation";
//import CloseDialog from '@/components/CloseDialog'
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import {
  // connectGoogleCalendar,
  connectStripe,
  Create,
  Edit,
  GetOne,
  GetServices,
  VendorAddress,
  VendorPayload,
  VendorSettings,
  VendorTourMedia,
  VerifyGoogleCalendar,
  WorkHours,
} from "../vendors";
import { GetOrganizations, Organization } from "../../global-settings/global-settings";

import { Plus, X, Loader2, ArrowLeft } from "lucide-react";
import { PaymentCard } from "@/components/GlobalSettings";
import TravelTable from "@/components/TravelTable";
import VendorEarningsHistory from "@/components/VendorEarningsHistory";
import { useAppContext } from "@/app/context/AppContext";
import PaymentDialog from "@/components/PaymentDialog";
import {
  DeleteCard,
  GetPaymentMethod,
} from "../../global-settings/global-settings";
import WorkAreaMap, { LatLng } from "@/components/WorkAreaMap";
import GooglePlacesAutocomplete from "../../calendar/components/AutoCompleteInput";
import useUnsavedChangesWarning from "@/app/hooks/useUnsavedChangesWarning";
import { usePermissions } from "@/app/hooks/usePermissions";
import { useUnsaved } from "@/app/context/UnsavedContext";
import VendorWorkHours, {
  SelectedService,
  WorkHoursData,
} from "@/components/WorkHours";
import { VendorsTourMedia } from "@/components/vendorWorkGallery";
import { S3UploadService } from "@/lib/upload/s3-service";
import { PresignedUrlRequest, ConfirmUploadRequest } from "@/lib/upload/types";
import { validateForm, ValidationSchema } from "@/lib/validation";
import { isValidWebsite, isValidPhoneNumber, formatPhoneNumber, isValidEmail } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
// import { tree } from "next/dist/build/templates/app-page";
interface VendorCompany {
  company_name: string;
  company_website: string;
  company_logo: string;
  company_logo_url: string;
  company_banner: string;
  company_banner_url: string;
}
interface Services {
  uuid: string;
  name?: string;
  category?: { name: string };
  background_color?: string;
  bcolor?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  status?: boolean;
  product_options?: {
    uuid: string;
    id: number;
    title?: string;
    amount?: string;
    cost?: number;
    adjustment_time?: string;
  }[];
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
  vendor_services?: {
    uuid: string;
    service?: { uuid: string };
    options?: {
      option_id: number;
      vendor_price: string;
      vendor_adjustment_time: string | null;
      product_option?: { uuid: string };
    }[];
  }[];
  addresses?: VendorAddress[];
  work_hours?: WorkHours;
  coordinates?: string[];
  stripe_account_id?: string;
  portfolio_images: VendorPortfolioImage[];
  google_access_token?: string;
  google_refresh_token?: string;
  pay_outside?: boolean;
  stripe_connect?: boolean;
  organization_id?: number | string;
  organization?: Organization;
  // add other fields as needed
};
export interface VendorPortfolioImage {
  id: number;
  uuid: string;
  vendor_id: number;
  image_path: string;
  created_at: string;
  updated_at: string;
  image_url: string;
  full_storage_path: string;
  file_exists: boolean;
  image_type?: string;
  is_processing?: boolean;
  variant_urls?: {
    thumb?: string;
    small?: string;
    large?: string;
    mls?: string;
  };
}

const daysOfWeek = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const VendorForm = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
  // const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [enableServiceArea, setEnableServiceArea] = useState(false);
  const [forceServiceArea, setForceServiceArea] = useState(false);
  const [adminReviewRequired, setAdminReviewRequired] = useState(true);
  const [showVendorName, setShowVendorName] = useState(true);
  const [paymentPerKm, setPaymentPerKm] = useState<string | number>("");
  const [billingAddress1, setBillingAddress1] = useState("");
  const [billingAddress2, setBillingAddress2] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [emailType, setEmailType] = useState("primary");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxCountry, setTaxCountry] = useState("CA");
  const [taxExempt, setTaxExempt] = useState(false);
  const [taxType, setTaxType] = useState("GST_HST");
  const [taxNumberGstHst, setTaxNumberGstHst] = useState("");
  const [taxNumberPst, setTaxNumberPst] = useState("");
  const [taxNumberQst, setTaxNumberQst] = useState("");
  const [taxNumberUs, setTaxNumberUs] = useState("");
  const [taxRateOverride, setTaxRateOverride] = useState("");
  const [active, setActive] = useState("details");
  const [countries, setCountries] = useState<
    { name: string; isoCode: string }[]
  >([]);
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyProvince, setCompanyProvince] = useState("");
  const [companyCountry, setCompanyCountry] = useState("CA");
  const [companyPostalCode, setCompanyPostalCode] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingProvince, setBillingProvince] = useState("");
  const [billingCountry, setBillingCountry] = useState("CA");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [password, setPassword] = useState("");
  const [openChangePasswordDialog, setOpenChangePasswordDialog] =
    useState(false);
  const CompanyLogofileInputRef = useRef(null);
  const [CompanyLogofileName, setCompanyLogoFileName] = useState("");
  const [CompanyLogoUrl, setCompanyLogoUrl] = useState("");
  const AvatarfileInputRef = useRef(null);
  const [AvatarfileName, setAvatarFileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const CompanyBannerfileInputRef = useRef(null);
  const [CompanyBannerfileName, setCompanyBannerFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [CompanyBannerUrl, setCompanyBannerUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyBannerFile, setCompanyBannerFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSyncToGoogle, setIsSyncToGoogle] = useState(false);
  const [syncEmailType, setSyncEmailType] = useState("primary");
  const [workHours, setWorkHours] = useState<WorkHoursData>({
    work_days: daysOfWeek.map((day) => ({
      day: day.key,
      start_time: "08:00",
      end_time: "17:00",
      is_off: day.key === "sun" || day.key === "sat", // weekends off by default
      is_twilight: ["mon", "tue", "wed", "thu", "fri"].includes(day.key),
    })),
    break_start: "13:00",
    break_end: "14:00",
    timezone: "America/Edmonton",
    commuteTime: 30,
    repeat: true,
    googleSync: false,
    googleSyncEnabled: true,
    emailType: "",
    next_booking_slot_only: false,
  });
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );
  const [vendorServices, setVendorServices] = useState<SelectedService[]>([]);
  const [servicesData, setServicesData] = useState<Services[]>([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [map_coordinates, setmap_coordinates] = useState<LatLng[]>([]);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  // const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [portfolioImagesUrls, setPortfolioImagesUrl] = useState<
    VendorPortfolioImage[]
  >([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [vendorTourMedia, setVendorTourMedia] = useState<VendorsTourMedia[]>(
    []
  );
  const [allowConnectStripe, setAllowConnectStripe] = useState<boolean>(true);
  const [payOutsidePlatform, setPayOutsidePlatform] = useState<boolean>(true);
  const [inkilometers, setInKilometers] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState<string>("");
  // const [inmiles, setInMiles] = useState<boolean>(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params?.id as string;
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  const { userType } = useAppContext();
  const { isSuperAdmin } = usePermissions();
  const { isDirty, setIsDirty } = useUnsaved();
  useUnsavedChangesWarning(isDirty);
  const isPopulatingData = useRef(false);
  const hasInitiallyRendered = useRef(false);

  const [useHeadquarterForStart, setUseHeadquarterForStart] = useState<boolean>(!params?.id);
  const [useHeadquarterForBilling, setUseHeadquarterForBilling] = useState<boolean>(!params?.id);

  const handleReset = () => {
    setPassword("");
  };

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);
  useEffect(() => {
    const companyAddressObj = currentUser?.addresses?.find(
      (addr) => addr.type === "company"
    );
    if (states.length && companyAddressObj?.province) {
      const match = states.find(
        (s) => s.isoCode === companyAddressObj.province
      );
      if (match) {
        setCompanyProvince(match.isoCode);
      }
    }
  }, [states, currentUser]);
  useEffect(() => {
    if (companyCountry) {
      setStates(State.getStatesOfCountry(companyCountry));
      // Only clear province when user manually changes the country,
      // not when we are populating data from the API.
      if (!isPopulatingData.current) {
        setCompanyProvince("");
      }
    }
  }, [companyCountry]);
  const capitalizeFirst = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  // useEffect(() => {
  //     setCountries(Country.getAllCountries());
  // }, []);
  useEffect(() => {
    const billingAddressObj = currentUser?.addresses?.find(
      (addr) => addr.type === "billing"
    );
    if (states.length && billingAddressObj?.province) {
      const match = states.find(
        (s) => s.isoCode === billingAddressObj.province
      );
      if (match) {
        setBillingProvince(match.isoCode);
      }
    }
  }, [states, currentUser]);
  useEffect(() => {
    if (billingCountry) {
      setStates(State.getStatesOfCountry(billingCountry));
      // Only clear province when user manually changes the country,
      // not when we are populating data from the API.
      if (!isPopulatingData.current) {
        setBillingProvince("");
      }
    }
  }, [billingCountry]);

  // For create mode, mark as initially rendered after a short delay
  // This prevents browser autofill from triggering dirty state
  useEffect(() => {
    if (!userId) {
      setTimeout(() => {
        hasInitiallyRendered.current = true;
      }, 500); // Longer delay to account for browser autofill
    }
  }, [userId]);

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

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetServices()
      .then((res) => setServicesData(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.log(err.message));

    GetOrganizations()
      .then((res) => setOrganizations(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.log("Failed to fetch organizations", err));

    // For non-super-admins, pre-fill org from their own userInfo on create mode
    if (!isSuperAdmin && !userId) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const parsedInfo = JSON.parse(userInfoStr);
          const orgId = parsedInfo?.organization_id ?? parsedInfo?.data?.organization_id;
          if (orgId) {
            setOrganizationId(String(orgId));
          }
        }
      } catch (e) {
        console.error('Failed to read userInfo for org prefill:', e);
      }
    }
  }, [isSuperAdmin, userId]);

  let idToUse = "";
  if (userType === "vendor") {
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        try {
          const parsedInfo = JSON.parse(userInfo);
          idToUse = parsedInfo.uuid || "";
        } catch (err) {
          console.error("Failed to parse userInfo:", err);
        }
      }
    }
  } else {
    idToUse = userId || "";
  }

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }
    if (idToUse) {
      VendorTourMedia(idToUse)
        .then((data) => {
          setVendorTourMedia(data.data.media);
        })
        .catch((err) => console.log(err.message));
    }
    if (idToUse) {
      GetOne(idToUse)
        .then((data) => {
          setCurrentUser(data.data);
          // Pre-select organization from logged in user if not in edit mode
          if (!userId && data.data?.organization_id) {
            setOrganizationId(String(data.data.organization_id));
          }
        })
        .catch((err) => console.log(err.message));
    } else {
      console.log("User ID is undefined.");
    }
  }, [userId, userType, idToUse]);

  useEffect(() => {
    if (currentUser) {
      isPopulatingData.current = true;
      setFirstName(currentUser.first_name || "");
      setLastName(currentUser.last_name || "");
      setEmail(currentUser.email || "");
      setSecondaryEmail(currentUser.secondary_email || "");
      setNotificationEmail(currentUser.notification_email ?? true);
      const type = currentUser.email_type?.toLowerCase();
      setEmailType(type || "primary");
      setPrimaryPhone(currentUser.primary_phone || "");
      setSecondaryPhone(currentUser.secondary_phone || "");
      setAvatarFileName(currentUser.avatar || "");
      setmap_coordinates(
        typeof currentUser?.coordinates === "string"
          ? JSON.parse(currentUser.coordinates)
          : Array.isArray(currentUser?.coordinates)
            ? currentUser.coordinates
            : []
      );

      if (currentUser.avatar_url) setAvatarUrl(currentUser.avatar_url);

      // Addresses
      const companyAddress = currentUser.addresses?.find(
        (addr) => addr.type === "company"
      );
      const startLocationAddress = currentUser.addresses?.find(
        (addr) => addr.type === "start_location"
      );
      const billingAddress = currentUser.addresses?.find(
        (addr) => addr.type === "billing"
      );
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
        setInKilometers(!!currentUser.settings.is_kilometers);
        
        setTaxEnabled(currentUser.settings.tax_enabled ?? true);
        const savedCountry = currentUser.settings.tax_country || "CA";
        setTaxCountry(savedCountry);
        setTaxExempt(!!currentUser.settings.tax_exempt);
        setTaxType(currentUser.settings.tax_type || "GST_HST");
        
        const rawTaxNumber = currentUser.settings.tax_number || (currentUser as any).tax_number || "";
        const cleanTaxNumber = rawTaxNumber.replace(/^(GST\/HST:\s*|GST:\s*|PST:\s*|QST:\s*|US State Tax ID:\s*)/i, '').split(',')[0].trim();

        setTaxNumberGstHst(currentUser.settings.tax_number_gst_hst || (savedCountry === "CA" ? cleanTaxNumber : ""));
        setTaxNumberPst(currentUser.settings.tax_number_pst || "");
        setTaxNumberQst(currentUser.settings.tax_number_qst || "");
        setTaxNumberUs(currentUser.settings.tax_number_us || (savedCountry === "US" ? cleanTaxNumber : ""));
        setTaxRateOverride(currentUser.settings.tax_rate?.toString() || "");
      }
      if (currentUser.company) {
        setCompanyLogoUrl(currentUser.company.company_logo_url);
        setCompanyBannerUrl(currentUser.company.company_banner_url);
        setCompanyBannerFileName(currentUser.company.company_banner || "");
        setCompanyLogoFileName(currentUser.company.company_logo || "");
        setCompanyName(currentUser.company.company_name || "");
        setCompanyWebsite(currentUser.company.company_website || "");
      }
      const fetchedTaxNumber = currentUser.settings?.tax_number || (currentUser as any).tax_number;
      if (fetchedTaxNumber) {
        setTaxNumber(fetchedTaxNumber);
      }
      if (currentUser.organization_id) {
        setOrganizationId(String(currentUser.organization_id));
      }
      if (currentUser.portfolio_images) {
        setPortfolioImagesUrl(currentUser.portfolio_images);
      }
      if (currentUser.vendor_services && servicesData.length > 0) {
        const transformedServices: SelectedService[] =
          currentUser.vendor_services.map((vs) => {
            const serviceInfo = servicesData.find(
              (s) => s.uuid === vs.service?.uuid
            );

            return {
              service_id: vs.service?.uuid || "",
              vendor_service_id: vs.uuid,
              options:
                vs.options?.map((opt) => {
                  const productOption = serviceInfo?.product_options?.find(
                    (po) => po.id === opt.option_id
                  );

                  return {
                    option_uuid: productOption?.uuid || opt.product_option?.uuid || "",
                    vendor_price: Number(opt.vendor_price) || 0,
                    adjustment_time:
                      opt.vendor_adjustment_time || "no adjustment",
                  };
                }) || [],
            };
          });
        setVendorServices(transformedServices);
      }
      if (currentUser?.work_hours?.work_days) {
        let parsed: any[] = [];

        if (typeof currentUser.work_hours.work_days === "string") {
          parsed = JSON.parse(currentUser.work_hours.work_days);
        } else if (Array.isArray(currentUser.work_hours.work_days)) {
          parsed = currentUser.work_hours.work_days;
        }

        const transformedWorkDays = parsed.map((dayObj) => ({
          day: dayObj.day, // 'mon', 'tue', etc.
          start_time: dayObj.start_time || "08:00",
          end_time: dayObj.end_time || "17:00",
          is_off: dayObj.is_off === "1" || dayObj.is_off === true,
          is_twilight:
            dayObj.is_twilight === "1" || dayObj.is_twilight === true,
        }));

        setWorkHours((prev) => ({
          ...prev,
          work_days: transformedWorkDays,
        }));
      }

      if (currentUser?.work_hours || currentUser?.settings) {
        setWorkHours((prev) => ({
          ...prev,
          timezone: currentUser.work_hours?.timezone || "America/Edmonton",
          break_start: currentUser.work_hours?.break_start || "",
          break_end: currentUser.work_hours?.break_end || "",
          commuteTime: currentUser.work_hours?.commute_minutes || 0,
          repeat:
            currentUser.work_hours?.repeat_weekly === "1" ||
            currentUser.work_hours?.repeat_weekly === "true",
          googleSync: currentUser.sync_google ?? false,
          googleSyncEnabled: currentUser.sync_google_calendar ?? true,
          emailType: currentUser.sync_email || "",
          next_booking_slot_only:
            [1, "1", true, "true"].includes(currentUser.settings?.next_booking_slot_only as any) ||
            [1, "1", true, "true"].includes(currentUser.work_hours?.next_booking_slot_only as any),
        }));
      }
      setPayOutsidePlatform(
        currentUser.pay_outside || !currentUser.stripe_account_id ? true : false
      );
      setAllowConnectStripe(
        currentUser.stripe_connect || currentUser.stripe_account_id
          ? true
          : false
      );
      setShowVendorName(currentUser.name_on_booking);
      setAdminReviewRequired(currentUser.review_files);
      setIsSyncToGoogle(currentUser.sync_google);
      setSyncEmailType(currentUser.sync_email || "");

      // Use setTimeout to ensure all state updates and DOM/async effects (e.g. country→states)
      // fully complete before we allow dirty-state tracking.
      // 300ms is enough to cover the cascading useEffect chain from country changes.
      setTimeout(() => {
        isPopulatingData.current = false;
        hasInitiallyRendered.current = true;
      }, 300);

      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

  const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyLogoFile(file);
      setCompanyLogoFileName(file.name);
      setCompanyLogoUrl(URL.createObjectURL(file));
    }
  };

  const triggerFileInput1 = () => {
    if (CompanyLogofileInputRef.current) {
      (CompanyLogofileInputRef.current as HTMLInputElement).click();
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

  const convertTo24HourFormat = (time12h: string): string => {
    const [time, modifier] = time12h.trim().split(" "); // e.g. "2:09", "PM"
    const [rawHours, rawMinutes] = time.split(":");

    let hours = parseInt(rawHours, 10);
    const minutes = parseInt(rawMinutes, 10);

    if (modifier === "PM" && hours < 12) {
      hours += 12;
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const selectedOrg = organizations.find((org) => String(org.id) === organizationId);
  const displayCompanyName = userType === "vendor"
    ? (currentUser?.organization?.name || selectedOrg?.name || companyName)
    : companyName;

  const displayCompanyWebsite = userType === "vendor"
    ? (currentUser?.organization?.domain || selectedOrg?.domain || companyWebsite)
    : companyWebsite;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const schema: ValidationSchema = {
      first_name: { required: true, message: "First Name is required" },
      last_name: { required: true, message: "Last Name is required" },
      email: { required: true, email: true, message: "Enter correct email" },
      primary_phone: { required: true, message: "Primary Phone is required" },
      company_address: { required: true, message: "Headquarter Address is required" },
      company_city: { required: true, message: "Headquarter City is required" },
      company_province: { required: true, message: "Headquarter Province is required" },
      timezone: { required: true, message: "Timezone is required" },
    };

    const values: Record<string, any> = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      primary_phone: primaryPhone,
      company_address: companyAddress,
      company_city: companyCity,
      company_province: companyProvince,
      timezone: workHours.timezone,
    };

    if (!userId && userType != "vendor") {
      schema.password = {
        required: true,
        minLength: 8,
        message: password ? "Password must be at least 8 characters" : "Password is required"
      };
      values.password = password;
    }

    const validationErrors = validateForm(values, schema);

    // Manual checks for specific complex logic
    if (!startLocation?.trim()) {
      validationErrors[`addresses.1.address_line_1`] = ["Start Location is required"];
    }

    if (!billingAddress1?.trim()) {
      validationErrors[`addresses.2.address_line_1`] = ["Billing Address is required"];
    }

    if (!billingCity?.trim()) {
      validationErrors[`addresses.1.city`] = ["City is required"];
      validationErrors[`addresses.2.city`] = ["City is required"];
    }

    if (!billingProvince?.trim()) {
      validationErrors[`addresses.1.province`] = ["Province is required"];
      validationErrors[`addresses.2.province`] = ["Province is required"];
    }

    if (workHours.googleSyncEnabled && !syncEmailType) {
      validationErrors.sync_email = ["The selected sync email is invalid."];
    }

    const paymentVal = Number(paymentPerKm);
    if (paymentPerKm === "" || isNaN(paymentVal) || paymentVal < 0) {
      validationErrors.payment_per_km = ["Payment per KM must be a positive number"];
    }

    if (enableServiceArea && (!map_coordinates || map_coordinates.length < 3)) {
      validationErrors.map_coordinates = ["Map coordinates are required and must have at least 3 points"];
    }

    if (!userId && userType !== "vendor") {
      if (selectedServices.length === 0) {
        validationErrors.services = ["At least one service must be selected"];
      } else {
        selectedServices.forEach((service, index) => {
          if (!service.service_id) {
            validationErrors[`services[${index}].service_id`] = ["Service ID is required"];
          }
          if (!service.options || service.options.length === 0) {
            validationErrors[`services[${index}].options`] = [`Options are required for selected service`];
          }
        });
      }
    }

    if (primaryPhone.trim() && !isValidPhoneNumber(primaryPhone)) {
      validationErrors.primary_phone = ["Invalid phone number. Example: +1 (204) 345-3456"];
    }

    if (secondaryPhone.trim() && !isValidPhoneNumber(secondaryPhone)) {
      validationErrors.secondary_phone = ["Invalid phone number. Example: +1 (204) 345-3456"];
    }

    if (displayCompanyWebsite?.trim() && !isValidWebsite(displayCompanyWebsite)) {
      validationErrors.company_website = ["Invalid website URL"];
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const firstError = Object.values(validationErrors).flat()[0];
      toast.error(firstError || "Please fill in all required fields correctly.");
      return;
    }

    try {
      const token = localStorage.getItem("token") || "";

      let formattedWebsite = displayCompanyWebsite?.trim();
      if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
        formattedWebsite = "https://" + formattedWebsite;
      }
        const calculatedTaxNumber = (() => {
          if (taxEnabled && !taxExempt) {
            if (taxCountry === "CA") {
              if (taxType === "GST_HST") return `GST/HST: ${taxNumberGstHst}`;
              if (taxType === "GST_PST") return `GST: ${taxNumberGstHst}, PST: ${taxNumberPst}`;
              if (taxType === "GST_QST") return `GST: ${taxNumberGstHst}, QST: ${taxNumberQst}`;
              if (taxType === "GST") return `GST: ${taxNumberGstHst}`;
            } else if (taxCountry === "US") {
              return `US State Tax ID: ${taxNumberUs}`;
            }
          }
          return undefined;
        })() || taxNumber || undefined;

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
        sync_google_calendar: workHours.googleSyncEnabled ? 1 : 0,
        sync_google: isSyncToGoogle ? 1 : 0,
        sync_email: syncEmailType,
        secondary_phone: secondaryPhone || undefined,
        password: userId ? undefined : password || undefined,
        avatar: avatarFile || undefined,
        company_logo: companyLogoFile,
        company_banner: companyBannerFile,
        coordinates: JSON.stringify(map_coordinates),
        company: {
          name: displayCompanyName,
          website: formattedWebsite || "",
        },
        addresses: [
          {
            type: "company",
            address_line_1: companyAddress,
            address_line_2: null,
            city: companyCity,
            province: companyProvince,
            country: companyCountry,
          },
          {
            type: "start_location",
            address_line_1: startLocation,
            address_line_2: billingAddress,
            city: billingCity,
            province: billingProvince,
            country: billingCountry,
          },
          {
            type: "billing",
            address_line_1: billingAddress1,
            address_line_2: billingAddress2,
            city: billingCity,
            province: billingProvince,
            country: billingCountry,
          },
        ],
        work_hours: {
          work_days: workHours.work_days.map((daySchedule) => ({
            day: daySchedule.day,
            start_time: daySchedule.is_off
              ? undefined
              : convertTo24HourFormat(daySchedule.start_time),
            end_time: daySchedule.is_off
              ? undefined
              : convertTo24HourFormat(daySchedule.end_time),
            is_off: daySchedule.is_off,
            is_twilight: daySchedule.is_twilight,
          })),
          break_start: convertTo24HourFormat(workHours.break_start),
          break_end: convertTo24HourFormat(workHours.break_end),
          timezone: workHours.timezone,
          commute_minutes: workHours.commuteTime,
          repeat_weekly: workHours.repeat ? "1" : "0",

        },
        payment_per_km: Number(paymentPerKm),
        is_kilometers: inkilometers ? 1 : 0,
        services: [...vendorServices, ...selectedServices],
        settings: {
          payment_per_km: Number(paymentPerKm),
          enable_service_area: enableServiceArea ? 1 : 0,
          force_service_area: forceServiceArea ? 1 : 0,
          is_kilometers: inkilometers ? 1 : 0,
          next_booking_slot_only: workHours.next_booking_slot_only ? 1 : 0,
          tax_enabled: taxEnabled,
          tax_country: taxCountry,
          tax_exempt: taxExempt,
          tax_type: taxCountry === "CA" ? taxType : null,
          tax_number_gst_hst: taxCountry === "CA" ? taxNumberGstHst : null,
          tax_number_pst: taxCountry === "CA" ? taxNumberPst : null,
          tax_number_qst: taxCountry === "CA" ? taxNumberQst : null,
          tax_number_us: taxCountry === "US" ? taxNumberUs : null,
          tax_rate: taxRateOverride ? Number(taxRateOverride) : (taxCountry === "CA" ? (taxType === "GST_HST" ? 13 : taxType === "GST" ? 5 : taxType === "GST_QST" ? 14.975 : 13) : null),
          tax_number: calculatedTaxNumber,
        },
        portfolio_images:
          [...portfolioImages, ...galleryImages].length > 0
            ? [...portfolioImages, ...galleryImages]
            : undefined,
        pay_outside: payOutsidePlatform ? 1 : 0,
        stripe_connect: allowConnectStripe ? 1 : 0,
        organization_id: organizationId && organizationId !== "none" ? Number(organizationId) : undefined,
      };
      let idToUse: string = "";

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
        console.log("Token not found.");
        return;
      }
      let result;
      let finalVendorUuid = idToUse;
      if (idToUse) {
        const updatedPayload = { ...payload, _method: "PUT" };
        setIsLoading(true);
        result = await Edit(idToUse, updatedPayload);
        setIsDirty(false);
      } else {
        setIsLoading(true);
        result = await Create(payload);
        finalVendorUuid = result?.data?.uuid;
        setIsDirty(false);
      }

      // Handle Portfolio Image Uploads using S3 Presigned URLs
      const newPortfolioFiles = portfolioImages.filter(f => f instanceof File);
      if (newPortfolioFiles.length > 0 && finalVendorUuid) {
        const uploadToastId = toast.loading(`Uploading ${newPortfolioFiles.length} portfolio images...`);
        try {
          const presignedRequest: PresignedUrlRequest = {
            entity_type: "vendor-portfolio" as const,
            entity_id: finalVendorUuid,
            files: newPortfolioFiles.map(f => ({
              filename: f.name,
              content_type: f.type,
              size: f.size
            }))
          };

          const presignedResponse = await S3UploadService.getPresignedUrls(presignedRequest);
          if (presignedResponse && presignedResponse.data?.uploads) {
            const uploads = presignedResponse.data.uploads;

            // Upload to S3 concurrently
            await Promise.all(newPortfolioFiles.map(async (file, index) => {
              const upload = uploads[index];
              if (upload) {
                await S3UploadService.uploadToS3(upload.presigned_url, file, upload.content_type);
              }
            }));

            // Confirm Uploads
            const confirmRequest: ConfirmUploadRequest = {
              entity_type: "vendor-portfolio" as const,
              entity_id: finalVendorUuid,
              uploads: uploads.map(u => ({
                upload_id: u.upload_id,
                s3_key: u.s3_key,
                original_filename: u.original_filename,
                content_type: u.content_type
              }))
            };
            await S3UploadService.confirmUpload(confirmRequest);

            setPortfolioImages([]); // Clear local files after successful upload
            toast.success("Portfolio images uploaded successfully", { id: uploadToastId });
          } else {
            toast.dismiss(uploadToastId);
          }
        } catch (uploadError) {
          console.error("Portfolio upload failed:", uploadError);
          toast.error("Failed to upload some portfolio images, please try again.", { id: uploadToastId });
        }
      }

      if (idToUse) {
        if (userType !== "vendor") {
          router.push("/dashboard/vendors");
          toast.success("Vendors updated successfully");
        } else {
          toast.success("Settings updated successfully");
        }
      } else {
        toast.success("Vendors created successfully");
        router.push("/dashboard/vendors");
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      // setOpenSaveDialog(false);
      setFieldErrors({});

      const apiError = error as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (apiError.errors && typeof apiError.errors === "object") {
        const normalizedErrors: Record<string, string[]> = {};

        Object.entries(apiError.errors).forEach(([key, messages]) => {
          if (!normalizedErrors[key]) {
            normalizedErrors[key] = [];
          }
          normalizedErrors[key].push(...messages);
        });

        setFieldErrors(normalizedErrors);

        const firstError = Object.values(normalizedErrors).flat()[0];
        toast.error(firstError || "Validation error kindly re-check your form");
      } else if (error instanceof Error) {
        toast.error(error.message);
        console.error(error.message);
      } else {
        toast.error("Failed to submit user data");
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

  const handleConnectStripe = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setIsStripeLoading(true);
    try {
      const token = localStorage.getItem("token") || "";

      if (!token) {
        toast.error("Please login first");
        return;
      }

      let vendorIdToUse: string = "";

      if (userType === "admin") {
        vendorIdToUse = currentUser?.uuid || "";
        if (!vendorIdToUse) {
          toast.error("No vendor selected");
          return;
        }
      } else if (userType === "vendor") {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
          try {
            const parsedInfo = JSON.parse(userInfo);
            vendorIdToUse = parsedInfo.uuid;
          } catch (err) {
            console.error("Failed to parse userInfo:", err);
          }
        }
      }

      if (!vendorIdToUse) {
        toast.error("Unable to determine vendor ID");
        return;
      }

      const result = await connectStripe(vendorIdToUse);
      if (result.success && result.url) {
        toast.success("Redirecting to Stripe...");
        window.open(result.url, "_blank");
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
  // const handleConnectCalendar = async (
  //   e: React.MouseEvent<HTMLButtonElement>
  // ) => {
  //   e.preventDefault();
  //   setIsCalendarLoading(true);
  //   const data = await connectGoogleCalendar();

  //   if (data.success) {
  //     toast.success("Redirecting to Google Calendar...");
  //     if (data.auth_url) {
  //       window.location.href = data.auth_url;
  //     }
  //   } else {
  //     toast.error(data.error || "Failed to connect Google Calendar");
  //   }
  //   setIsCalendarLoading(false);
  // };
  useEffect(() => {
    if (state && code) {
      VerifyGoogleCalendar({ state, code });
    }
  }, [state, code]);

  return (
    <div className="font-alexandria pb-16">
      {isMobile ? (
        <div className="sticky top-0 z-40 bg-white shadow-sm">
          {/* Header */}
          <div
            className="flex items-center h-14 px-4 border-b shrink-0"
            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
          >
            <button type="button" onClick={() => router.back()} className={`mr-3 ${userType}-text`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className={`text-[16px] font-semibold truncate flex-1 ${userType}-text`}>
              {userType === "vendor"
                ? "Settings"
                : currentUser
                  ? `Vendor › ${currentUser.first_name} ${currentUser.last_name}`
                  : "Vendor › Create"}
            </h1>
            <div className="flex gap-2 items-center">
              {(active === "details" || active === "work hours") && (
                <Button
                  onClick={(e) => handleSubmit(e)}
                  disabled={isLoading}
                  className={`h-[32px] px-3 border-[1px] ${userType}-border ${userType}-bg text-[12px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}
                >
                  {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Save"}
                </Button>
              )}
            </div>
          </div>
          {/* Scrollable tabs */}
          <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-[#E4E4E4] border-b border-[#BBBBBB] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setActive("details")}
              className={`px-4 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap h-[32px]
                ${active === "details" ? `text-white ${userType}-bg` : "bg-[#F2F2F2] text-[#666666]"}`}
            >
              DETAILS
            </button>
            <button
              onClick={() => setActive("work hours")}
              className={`px-4 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap h-[32px]
                ${active === "work hours" ? `text-white ${userType}-bg` : "bg-[#F2F2F2] text-[#666666]"}`}
            >
              WORK HOURS
            </button>
            {userType !== "vendor" && currentUser?.uuid && (
              <button
                onClick={() => setActive("travel")}
                className={`px-4 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap h-[32px]
                  ${active === "travel" ? `text-white ${userType}-bg` : "bg-[#F2F2F2] text-[#666666]"}`}
              >
                TRAVEL
              </button>
            )}
            {currentUser?.uuid && (
              <button
                onClick={() => setActive("history")}
                className={`px-4 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap h-[32px]
                  ${active === "history" ? `text-white ${userType}-bg` : "bg-[#F2F2F2] text-[#666666]"}`}
              >
                HISTORY
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            className="w-full h-[80px] font-alexandria z-10 flex justify-between px-[20px] items-center sticky top-0"
            style={{
              backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
              boxShadow: "0px 4px 4px #0000001F",
            }}
          >
            {userType === "vendor" && (
              <p
                className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}
              >
                {" "}
                Settings
              </p>
            )}
            {userType !== "vendor" && (
              <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}>
                {" "}
                Vendor
                {currentUser
                  ? ` › ${currentUser.first_name} ${currentUser.last_name}`
                  : " › Create"}
              </p>
            )}
            <div className="flex gap-[10px] items-center">
              {active === "travel" && (
                <Button className="w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-white text-[#4290E9] hover:bg-[#f0f0f0] text-[14px] md:text-[16px] font-[400] flex gap-[5px] items-center">
                  Payout Period
                </Button>
              )}
              {(active === "details" || active === "work hours") && (
                <Button
                  onClick={(e) => {
                    handleSubmit(e);
                  }}
                  disabled={isLoading}
                  className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </div>
          </div>
          <div
            className={`flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] sticky top-[80px] z-10`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
          >
            <div className="flex gap-2">
              <button
                onClick={() => setActive("details")}
                className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                              ${active === "details"
                    ? `text-white ${userType}-bg`
                    : "bg-[#F2F2F2] text-[#666666]"
                  }`}
              >
                DETAILS
              </button>
              <button
                onClick={() => setActive("work hours")}
                className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                              ${active === "work hours"
                    ? `text-white ${userType}-bg`
                    : "bg-[#F2F2F2] text-[#666666]"
                  }`}
              >
                WORK HOURS
              </button>
              {userType !== "vendor" && currentUser?.uuid && (
                <button
                  onClick={() => setActive("travel")}
                  className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                                  ${active === "travel"
                      ? `text-white ${userType}-bg`
                      : "bg-[#F2F2F2] text-[#666666]"
                    }`}
                >
                  TRAVEL
                </button>
              )}
              {currentUser?.uuid && (
                <button
                  onClick={() => setActive("history")}
                  className={`px-4 py-2 rounded-[6px] text-sm font-bold w-[110px] md:w-[180px] h-[35px]
                                      ${active === "history"
                      ? `text-white ${userType}-bg`
                      : "bg-[#F2F2F2] text-[#666666]"
                    }`}
                >
                  HISTORY
                </button>
              )}
            </div>
          </div>
        </>
      )}
      <div className="w-full overflow-x-hidden">
        {active === "details" && (
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
            <div
              style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
              aria-hidden="true"
            >
              <input
                type="text"
                name="fake-username"
                tabIndex={-1}
                autoComplete="off"
              />
              <input
                type="password"
                name="fake-password"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <Accordion
              type="multiple"
              defaultValue={[
                "profile",
                "branding",
                "vendor",
                "service-area",
                "account",
                "hours",
                "location",
                "service",
                "payment",
              ]}
              className="w-full space-y-4"
            >
              <AccordionItem value="profile">
                <AccordionTrigger
                  className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                  }}
                >
                  PROFILE
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                      <div className="grid grid-cols-2 gap-[16px]">
                        <div className="flex-1">
                          <Label>
                            First Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="e.g. John"
                            value={firstName}
                            onChange={(e) => {
                              setFirstName(e.target.value);
                              if (fieldErrors.first_name) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors.first_name;
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={`h-[42px] mt-3 ${fieldErrors.first_name
                              ? "border-red-500"
                              : "bg-[#EEEEEE] border-[#BBBBBB]"
                              }`}
                          />
                          {fieldErrors.first_name && (
                            <p className="text-red-500 text-xs mt-1">
                              {fieldErrors.first_name[0]}
                            </p>
                          )}
                        </div>
                        <div className="flex-1">
                          <Label>
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="e.g. Doe"
                            value={lastName}
                            onChange={(e) => {
                              setLastName(e.target.value);
                              if (fieldErrors.last_name) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors.last_name;
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={`h-[42px] mt-3 ${fieldErrors.last_name
                              ? "border-red-500"
                              : "bg-[#EEEEEE] border-[#BBBBBB]"
                              }`}
                          />
                          {fieldErrors.last_name && (
                            <p className="text-red-500 text-xs mt-1">
                              {fieldErrors.last_name[0]}
                            </p>
                          )}
                        </div>

                        {userType !== "vendor" && (
                          <div className="col-span-2">
                            <label htmlFor="">Organization</label>
                            {isSuperAdmin ? (
                              <Select
                                value={organizationId}
                                onValueChange={(val) => {
                                  setOrganizationId(val);
                                  if (hasInitiallyRendered.current) {
                                    setIsDirty(true);
                                  }
                                }}
                              >
                                <SelectTrigger
                                  className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                                >
                                  <SelectValue placeholder="Select an organization" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None (Global)</SelectItem>
                                  {organizations?.map((org) => (
                                    <SelectItem key={org.id} value={String(org.id)}>
                                      {org.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div
                                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] rounded-md px-3 flex items-center text-[14px] text-[#424242] cursor-not-allowed opacity-70"
                              >
                                {organizations.find(o => String(o.id) === organizationId)?.name || organizationId || 'Your Organization'}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="col-span-2">
                          <div className="flex-1">
                            <Label>
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="e.g. johndoe@gmail.com"
                              autoComplete="off"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors.email;
                                  setFieldErrors(newErrors);
                                }
                              }}
                              className={`h-[42px] mt-3 ${fieldErrors.email
                                ? "border-red-500"
                                : "bg-[#EEEEEE] border-[#BBBBBB]"
                                }`}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val && !isValidEmail(val)) {
                                  setFieldErrors(prev => ({ ...prev, email: ["Enter correct email"] }));
                                }
                              }}
                            />
                            {fieldErrors.email && (
                              <p className="text-red-500 text-xs mt-1">
                                {fieldErrors.email[0]}
                              </p>
                            )}
                          </div>
                        </div>
                        {!currentUser && (
                          <div className="col-span-2">
                            <div className="flex-1">
                              <Label>
                                Password{" "}
                                {!userId && (
                                  <span className="text-red-500">*</span>
                                )}
                              </Label>
                              <div className="relative">
                                <PasswordInput
                                  placeholder="e.g. ************"
                                  value={password}
                                  autoComplete="new-password"
                                  onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) {
                                      const newErrors = { ...fieldErrors };
                                      delete newErrors.password;
                                      setFieldErrors(newErrors);
                                    }
                                  }}
                                  className={`h-[42px] mt-3 ${fieldErrors.password
                                    ? "border-red-500"
                                    : "bg-[#EEEEEE] border-[#BBBBBB]"
                                    }`}
                                />
                                {fieldErrors.password && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {fieldErrors.password[0]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {currentUser && (
                          <div className="col-span-2">
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
                        )}
                        <div className="col-span-2">
                          <label htmlFor="">Email Secondary</label>
                          <Input
                            value={secondaryEmail}
                            autoComplete="off"
                            onChange={(e) => {
                              setSecondaryEmail(e.target.value);
                              if (fieldErrors.secondary_email) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors.secondary_email;
                                setFieldErrors(newErrors);
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value;
                              if (val && !isValidEmail(val)) {
                                setFieldErrors(prev => ({ ...prev, secondary_email: ["Enter correct email"] }));
                              }
                            }}
                            className={`h-[42px] mt-[12px] ${fieldErrors.secondary_email ? "border-red-500" : "bg-[#EEEEEE] border-[#BBBBBB]"}`}
                            type="email"
                          />
                          {fieldErrors.secondary_email && (
                            <p className="text-red-500 text-xs mt-1">
                              {fieldErrors.secondary_email[0]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-[10px]">
                          <div className="flex items-center gap-[10px]">
                            <Checkbox
                              checked={notificationEmail}
                              onCheckedChange={(checked) =>
                                setNotificationEmail(checked === true)
                              }
                              className="h-[20px] w-[20px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                            />
                            <p className="text-[16px] font-normal text-[#666666] mt-[12px]">
                              Notification Email
                            </p>
                          </div>
                        </div>
                        <div className="">
                          <Select
                            value={emailType}
                            onValueChange={setEmailType}
                          >
                            <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                              <SelectValue placeholder="Select Email Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primary">
                                Primary Email
                              </SelectItem>
                              <SelectItem value="secondary">
                                Secondary Email
                              </SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <div className="flex-1">
                            <Label>
                              Primary Phone{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="e.g. +1 (555) 555-5555"
                              value={primaryPhone}
                              onChange={(e) => {
                                setPrimaryPhone(formatPhoneNumber(e.target.value));
                                if (fieldErrors.primary_phone) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors.primary_phone;
                                  setFieldErrors(newErrors);
                                }
                              }}
                              className={`h-[42px] mt-3 ${fieldErrors.primary_phone
                                ? "border-red-500"
                                : "bg-[#EEEEEE] border-[#BBBBBB]"
                                }`}
                            />
                            {fieldErrors.primary_phone && (
                              <p className="text-red-500 text-xs mt-1">
                                {fieldErrors.primary_phone[0]}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="">Secondary Phone</label>
                          <Input
                            value={secondaryPhone}
                            onChange={(e) => {
                              setSecondaryPhone(formatPhoneNumber(e.target.value));
                              if (fieldErrors.secondary_phone) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors.secondary_phone;
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={`h-[42px] mt-[12px] ${fieldErrors.secondary_phone
                              ? "border-red-500"
                              : "bg-[#EEEEEE] border-[#BBBBBB]"
                              }`}
                            type="text"
                          />
                          {fieldErrors.secondary_phone && (
                            <p className="text-red-500 text-xs mt-1">
                              {fieldErrors.secondary_phone[0]}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label htmlFor="">Company Name</label>
                          <Input
                            value={displayCompanyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] disabled:opacity-75 disabled:cursor-not-allowed"
                            type="text"
                            disabled={userType === "vendor"}
                            readOnly={userType === "vendor"}
                          />
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="">Company Website</label>
                          <Input
                            value={displayCompanyWebsite}
                            onChange={(e) => {
                              setCompanyWebsite(e.target.value);
                              if (fieldErrors.company_website) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors.company_website;
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={`h-[42px] mt-[12px] disabled:opacity-75 disabled:cursor-not-allowed ${fieldErrors.company_website
                              ? "border-red-500"
                              : "bg-[#EEEEEE] border-[#BBBBBB]"
                              }`}
                            type="text"
                            disabled={userType === "vendor"}
                            readOnly={userType === "vendor"}
                          />
                          {fieldErrors.company_website && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors.company_website[0]}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="">Tax Registration Number </label>
                          <Input
                            value={taxNumber}
                            onChange={(e) => {
                              setTaxNumber(e.target.value);
                              if (fieldErrors.tax_number) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors.tax_number;
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={`h-[42px] mt-[12px] disabled:opacity-75 disabled:cursor-not-allowed ${fieldErrors.tax_number
                              ? "border-red-500"
                              : "bg-[#EEEEEE] border-[#BBBBBB]"
                              }`}
                            type="text"
                            placeholder="e.g. GST/HST Number"
                            disabled={userType === "vendor"}
                            readOnly={userType === "vendor"}
                          />
                          {fieldErrors.tax_number && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors.tax_number[0]}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="">
                            Address <span className="text-red-500">*</span>
                          </label>
                          <GooglePlacesAutocomplete
                            value={companyAddress}
                            onChange={(val) => setCompanyAddress(val)}
                            onAddressComponents={(components) => {
                              setCompanyAddress(components.address_line_1);
                              setCompanyCity(components.city);
                              setCompanyCountry(components.country);
                              setCompanyPostalCode(components.postal_code);
                              // Set province after a short delay to ensure states are loaded
                              setTimeout(() => {
                                setCompanyProvince(components.province);
                              }, 100);

                              // Auto-copy full address to Billing Address Line 1 if toggle is on
                              if (useHeadquarterForBilling) {
                                setBillingAddress1(components.full_address);
                              }

                              // Auto-fill Location Address fields if toggle is on
                              if (useHeadquarterForStart) {
                                setBillingAddress(components.full_address);
                                setBillingCity(components.city);
                                setBillingCountry(components.country);
                                setBillingPostalCode(components.postal_code);
                                setTimeout(() => {
                                  setBillingProvince(components.province);
                                }, 100);
                              }
                            }}
                            className="h-[42px] mt-[12px]"
                            inputClassName={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] ${fieldErrors[`addresses.${1}.address_line_1`]
                              ? "border-red-500"
                              : ""
                              }`}
                            fieldErrors={fieldErrors}
                          />

                          {fieldErrors[`addresses.${1}.address_line_1`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.${1}.address_line_1`][0]}
                            </p>
                          )}
                        </div>
                        <div className="hidden">
                          <label htmlFor="">
                            City <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={companyCity}
                            onChange={(e) => setCompanyCity(e.target.value)}
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                            type="text"
                          />
                          {fieldErrors[`addresses.${1}.city`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.${1}.city`][0]}
                            </p>
                          )}
                        </div>
                        <div className="hidden">
                          <label htmlFor="">
                            Province <span className="text-red-500">*</span>
                          </label>
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
                        <div className="hidden">
                          <label htmlFor="">Country</label>
                          <Select
                            value={companyCountry}
                            onValueChange={(val) => setCompanyCountry(val)}
                          >
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
                        <div className="hidden">
                          <label htmlFor="">
                            Zip/Postal Code <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={companyPostalCode}
                            onChange={(e) => setCompanyPostalCode(e.target.value)}
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                            type="text"
                            placeholder="V5H 4M1"
                          />
                          {fieldErrors[`addresses.${1}.postal_code`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.${1}.postal_code`][0]}
                            </p>
                          )}
                        </div>

                        {userType !== "vendor" && (
                          <>
                            <div className="col-span-2">
                              <div className="flex items-center justify-between">
                                <p>Show Vendor Name When Booking</p>
                                <Switch
                                  checked={showVendorName}
                                  onCheckedChange={setShowVendorName}
                                  className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41] float-end"
                                />
                                {fieldErrors.review_files && (
                                  <p className="text-red-500 text-[10px] mt-1">
                                    {fieldErrors.review_files[0]}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center justify-between">
                                <p>Review Files before Submitting to Clients</p>
                                <Switch
                                  checked={adminReviewRequired}
                                  onCheckedChange={setAdminReviewRequired}
                                  className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41] float-end"
                                />
                                {fieldErrors.review_files && (
                                  <p className="text-red-500 text-[10px] mt-1">
                                    {fieldErrors.review_files[0]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="location" className="border-none">
                <AccordionTrigger
                  className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                  }}
                >
                  LOCATION
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                      <div className="grid grid-cols-2 gap-[16px] text-sm font-normal text-[#424242]">
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mt-[12px]">
                            <label htmlFor="">
                              Start Location{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="useHeadquarterForStart"
                                checked={useHeadquarterForStart}
                                onChange={(e) => setUseHeadquarterForStart(e.target.checked)}
                                className="h-4 w-4"
                              />
                              <label htmlFor="useHeadquarterForStart" className="text-xs text-[#666666]">Same as Headquarter</label>
                            </div>
                          </div>
                          <Input
                            value={startLocation}
                            onChange={(e) => {
                              setStartLocation(e.target.value);
                              setUseHeadquarterForStart(false);
                              if (fieldErrors[`addresses.1.address_line_1`]) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors[`addresses.1.address_line_1`];
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={`h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] mt-[8px] ${fieldErrors[`addresses.1.address_line_1`]
                              ? "border-red-500"
                              : "border-[#BBBBBB]"
                              }`}
                            placeholder="Start Location Name i.e Main Office"
                            type="text"
                          />
                          {fieldErrors[`addresses.1.address_line_1`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.1.address_line_1`][0]}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="">
                            Address <span className="text-red-500">*</span>
                          </label>
                          <GooglePlacesAutocomplete
                            value={billingAddress}
                            onChange={(val) => {
                              setBillingAddress(val);
                              setUseHeadquarterForStart(false);
                            }}
                            onAddressComponents={(components) => {
                              setBillingAddress(components.address_line_1);
                              setBillingCity(components.city);
                              setBillingCountry(components.country);
                              setBillingPostalCode(components.postal_code);
                              setUseHeadquarterForStart(false);
                              // Set province after a short delay to ensure states are loaded
                              setTimeout(() => {
                                setBillingProvince(components.province);
                              }, 100);
                            }}
                            className="h-[42px] mt-[12px]"
                            inputClassName={`h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB] ${fieldErrors[`addresses.${2}.address_line_1`]
                              ? "border-red-500"
                              : ""
                              }`}
                            placeholder="7458 Burrard Street"
                            fieldErrors={fieldErrors}
                          />
                          {fieldErrors[`addresses.${2}.address_line_1`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.${2}.address_line_1`][0]}
                            </p>
                          )}
                        </div>
                        <div className="hidden">
                          <label htmlFor="">
                            City <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={billingCity}
                            onChange={(e) => {
                              setBillingCity(e.target.value);
                              if (fieldErrors[`addresses.1.city`]) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors[`addresses.1.city`];
                                delete newErrors[`addresses.2.city`];
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={`h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] mt-[12px] ${fieldErrors[`addresses.1.city`] ||
                              fieldErrors[`addresses.2.city`]
                              ? "border-red-500"
                              : "border-[#BBBBBB]"
                              }`}
                            type="text"
                            placeholder="Burnaby"
                          />
                          {fieldErrors[`addresses.2.city`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.2.city`][0]}
                            </p>
                          )}
                        </div>
                        <div className="hidden">
                          <label htmlFor="">
                            Province <span className="text-red-500">*</span>
                          </label>
                          <Select
                            value={billingProvince}
                            onValueChange={(val) => {
                              setBillingProvince(val);
                              if (fieldErrors[`addresses.1.province`]) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors[`addresses.1.province`];
                                delete newErrors[`addresses.2.province`];
                                setFieldErrors(newErrors);
                              }
                            }}
                            disabled={!states.length}
                          >
                            <SelectTrigger
                              className={`w-full h-[42px] bg-[#EEEEEE] mt-[12px] border data-[placeholder]:text-[#9ca3af] ${fieldErrors[`addresses.1.province`] ||
                                fieldErrors[`addresses.2.province`]
                                ? "border-red-500"
                                : "border-[#BBBBBB]"
                                }`}
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
                          {fieldErrors[`addresses.2.province`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.2.province`][0]}
                            </p>
                          )}
                        </div>
                        <div className="hidden">
                          <label htmlFor="">Country</label>
                          <Select
                            value={billingCountry}
                            onValueChange={(val) => setBillingCountry(val)}
                          >
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
                          {fieldErrors.country && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors.country[0]}
                            </p>
                          )}
                        </div>
                        <div className="hidden">
                          <label htmlFor="">
                            Zip/Postal Code <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={billingPostalCode}
                            onChange={(e) => setBillingPostalCode(e.target.value)}
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                            type="text"
                            placeholder="V5H 4M1"
                          />
                          {fieldErrors[`addresses.${2}.postal_code`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.${2}.postal_code`][0]}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mt-[12px]">
                            <label htmlFor="">
                              Billing Address {" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="useHeadquarterForBilling"
                                checked={useHeadquarterForBilling}
                                onChange={(e) => setUseHeadquarterForBilling(e.target.checked)}
                                className="h-4 w-4"
                              />
                              <label htmlFor="useHeadquarterForBilling" className="text-xs text-[#666666]">Same as Headquarter</label>
                            </div>
                          </div>
                          <GooglePlacesAutocomplete
                            value={billingAddress1}
                            onChange={(val) => {
                              setBillingAddress1(val);
                              setUseHeadquarterForBilling(false);
                              if (fieldErrors[`addresses.2.address_line_1`]) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors[`addresses.2.address_line_1`];
                                setFieldErrors(newErrors);
                              }
                            }}
                            onAddressComponents={(components) => {
                              setBillingAddress1(components.full_address);
                              setUseHeadquarterForBilling(false);
                            }}
                            className="h-[42px] mt-[12px]"
                            inputClassName={`h-[42px] bg-[#EEEEEE] border-[1px] placeholder:text-[#9ca3af] ${fieldErrors[`addresses.2.address_line_1`]
                              ? "border-red-500"
                              : "border-[#BBBBBB]"
                              }`}
                            placeholder="7458 Burrard Street"
                            fieldErrors={fieldErrors}
                          />
                          {fieldErrors[`addresses.2.address_line_1`] && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors[`addresses.2.address_line_1`][0]}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 hidden">
                          <label htmlFor="">Billing Address Line 2</label>
                          <Input
                            value={billingAddress2}
                            onChange={(e) => setBillingAddress2(e.target.value)}
                            className="h-[42px] bg-[#EEEEEE] placeholder:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[12px]"
                            type="text"
                          />
                          {fieldErrors.billing_street_2 && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors.billing_street_2[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="branding">
                <AccordionTrigger
                  className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                  }}
                >
                  Branding Assets
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
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
                            <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                              <span className="bg-[#EEEEEE] max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden">
                                {AvatarfileName}
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
                      {userType === "Admin" && (
                        <>
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
                                <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                                  <span className="bg-[#EEEEEE] max-w-[246px] text-[16px] font-normal py-2 w-full h-full px-4 focus:outline-none truncate whitespace-nowrap overflow-hidden">
                                    {CompanyLogofileName}
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
                              <div className="flex-1">
                                <Label className="text-sm font-normal">
                                  Company Banner
                                </Label>
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
                        </>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {(userType === "vendor" || userType === "admin") && (
                <AccordionItem value="payment" className="border-none">
                  <AccordionTrigger
                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType === "vendor"
                      ? "[&>svg]:text-[#6BAE41]"
                      : "[&>svg]:text-[#6BAE41]"
                      }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                  >
                    PAYMENT
                  </AccordionTrigger>
                  <AccordionContent className="grid gap-4">
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                        <div className="grid grid-cols-2 gap-[32px]">
                          {userType !== "vendor" && (
                            <>
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
                                {cards.length > 0 ? (
                                  cards.map((card) => (
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
                                            {card.last_four.slice(0, 4)} **** ****
                                            ****
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
                                  ))
                                ) : (
                                  <p className="text-[#666666] text-sm font-normal text-center py-4">
                                    Click Add+ to add your payment info
                                  </p>
                                )}
                              </div>
                            </>
                          )}

                          <div className="w-full flex flex-col col-span-2 items-start gap-4 mt-5 margin-top-5 border-t pt-5">
                            {userType === "admin" && (
                              <>
                                <div className="w-full">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[#666666]">
                                      Allow Connect Stripe
                                    </p>
                                    <Switch
                                      checked={
                                        allowConnectStripe ? true : false
                                      }
                                      onCheckedChange={setAllowConnectStripe}
                                      className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                  </div>
                                </div>
                                <div className="w-full">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[#666666]">
                                      Pay Outside of Platform
                                    </p>
                                    <Switch
                                      checked={payOutsidePlatform}
                                      onCheckedChange={setPayOutsidePlatform}
                                      className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            {userId && (
                              <button
                                onClick={(e) => {
                                  handleConnectStripe(e);
                                }}
                                disabled={
                                  isStripeLoading ||
                                  !!currentUser?.stripe_account_id
                                }
                                className={`px-6 py-3 w-auto ${currentUser?.stripe_account_id
                                  ? "bg-[#6BAE41] hover:bg-[#6BAE41]/80"
                                  : "bg-[#4290E9] hover:bg-[#4290E9]/80"
                                  } text-white font-medium rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                              >
                                {isStripeLoading ? (
                                  <>
                                    <svg
                                      className="animate-spin h-5 w-5 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Connecting...
                                  </>
                                ) : currentUser?.stripe_account_id ? (
                                  "Stripe Connected"
                                ) : (
                                  "Connect with Stripe"
                                )}
                              </button>
                            )}

                            {/* Calendar Button */}
                            {/* <button

                              onClick={(e) => {
                                handleConnectCalendar(e);
                              }}
                              disabled={
                                isStripeLoading ||
                                !!currentUser?.google_access_token ||
                                !!currentUser?.google_refresh_token
                              }
                              className={`px-6 py-3 w-auto ${(currentUser?.google_access_token || currentUser?.google_refresh_token) ? 'bg-[#6BAE41] hover:bg-[#6BAE41]/80' : 'bg-[#4290E9] hover:bg-[#4290E9]/80'} text-white font-medium rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                            >
                              {isCalendarLoading ? (
                                <>
                                  <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Connecting...
                                </>
                              ) : (currentUser?.google_access_token || currentUser?.google_refresh_token) ? (
                                "Calendar Connected"
                              ) : (
                                "Connect with Calendar"
                              )}
                            </button> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="vendor" className="border-none">
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
                        <div className="w-full">
                          <div className="flex items-center gap-x-4">
                            <p className="text-[#666666]">In Kilometers</p>
                            <Switch
                              checked={inkilometers ? true : false}
                              onCheckedChange={(val) => {
                                setInKilometers(val);
                              }}
                              disabled={userType !== "admin"}
                              className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                            />
                          </div>
                        </div>
                        {/* <div className="w-full">
                          <div className="flex items-center gap-x-4">
                            <p className="text-[#666666]">In Miles</p>
                            <Switch
                              checked={inmiles ? true : false}
                              onCheckedChange={(val) => {
                                setInMiles(val);
                                if (val) {
                                  setInKilometers(false);
                                } else {
                                  setInKilometers(true);
                                }
                              }}
                              disabled={userType !== "admin"}
                              className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                            />
                          </div>
                        </div> */}
                        <div className="col-span-2">
                          <div>
                            <Label htmlFor="">
                              Payment per {inkilometers ? "kilometer" : "mile"}
                            </Label>
                            <Input
                              type="number"
                              value={paymentPerKm === "" ? "" : paymentPerKm}
                              min={0}
                              step="any"
                              onChange={(e) => {
                                const value = e.target.value;

                                // Allow empty string to let user clear the input
                                if (value === "") {
                                  setPaymentPerKm("");
                                } else {
                                  const numeric = Number(value);
                                  if (!isNaN(numeric) && numeric >= 0) {
                                    setPaymentPerKm(numeric);
                                  }
                                }
                              }}
                              disabled={userType !== "admin"}
                              className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
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
              <AccordionItem value="tax-information" className="border-none">
                <AccordionTrigger
                  className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                  }}
                >
                  TAX INFORMATION
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex flex-col gap-[20px] text-[#424242] text-[14px] font-[400]">
                      <div className="w-full flex items-center justify-between">
                        <Label>Enable Tax</Label>
                        <Switch
                          checked={taxEnabled}
                          onCheckedChange={setTaxEnabled}
                          className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                        />
                      </div>

                      {taxEnabled && (
                        <>
                          <div className="w-full flex flex-col gap-2">
                            <Label>Tax Country</Label>
                            <Select value={taxCountry} onValueChange={setTaxCountry}>
                              <SelectTrigger className="w-full bg-[#EEEEEE] border-[#BBBBBB]">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CA">Canada</SelectItem>
                                <SelectItem value="US">USA</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="w-full flex items-center justify-between">
                            <Label>Tax Exempt</Label>
                            <Switch
                              checked={taxExempt}
                              onCheckedChange={setTaxExempt}
                              className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                            />
                          </div>

                          {!taxExempt && taxCountry === "CA" && (
                            <>
                              <div className="w-full flex flex-col gap-2">
                                <Label>Tax Type</Label>
                                <Select value={taxType} onValueChange={setTaxType}>
                                  <SelectTrigger className="w-full bg-[#EEEEEE] border-[#BBBBBB]">
                                    <SelectValue placeholder="Select Tax Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GST_HST">GST/HST only</SelectItem>
                                    <SelectItem value="GST_PST">GST + PST</SelectItem>
                                    <SelectItem value="GST_QST">GST + QST</SelectItem>
                                    <SelectItem value="GST">GST only</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="w-full flex flex-col gap-2">
                                <Label>GST/HST Number</Label>
                                <Input
                                  value={taxNumberGstHst}
                                  onChange={(e) => setTaxNumberGstHst(e.target.value)}
                                  className="bg-[#EEEEEE] border-[#BBBBBB]"
                                />
                              </div>

                              {taxType === "GST_PST" && (
                                <div className="w-full flex flex-col gap-2">
                                  <Label>PST/RST Number</Label>
                                  <Input
                                    value={taxNumberPst}
                                    onChange={(e) => setTaxNumberPst(e.target.value)}
                                    className="bg-[#EEEEEE] border-[#BBBBBB]"
                                  />
                                </div>
                              )}

                              {taxType === "GST_QST" && (
                                <div className="w-full flex flex-col gap-2">
                                  <Label>QST Number</Label>
                                  <Input
                                    value={taxNumberQst}
                                    onChange={(e) => setTaxNumberQst(e.target.value)}
                                    className="bg-[#EEEEEE] border-[#BBBBBB]"
                                  />
                                </div>
                              )}
                            </>
                          )}

                          {!taxExempt && taxCountry === "US" && (
                            <>
                              <div className="w-full flex flex-col gap-2">
                                <Label>US State Tax ID (EIN/SSN)</Label>
                                <Input
                                  value={taxNumberUs}
                                  onChange={(e) => setTaxNumberUs(e.target.value)}
                                  className="bg-[#EEEEEE] border-[#BBBBBB]"
                                />
                              </div>

                              <div className="w-full flex flex-col gap-2">
                                <Label>Manual Tax Rate (%)</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  value={taxRateOverride}
                                  onChange={(e) => setTaxRateOverride(e.target.value)}
                                  placeholder="e.g. 8.25"
                                  className="bg-[#EEEEEE] border-[#BBBBBB]"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="service-area" className="border-none">
                <AccordionTrigger
                  className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                  }}
                >
                  SERVICE AREA
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                  <div className="flex flex-col gap-y-4 py-[16px]">
                    {userType !== "vendor" && (
                      /* Change: Container is now flex-col so children stack vertically */
                      <div className="pl-[18px] flex flex-col items-start">
                        {/* Row 1: Checkbox and Label */}
                        <div className="flex items-center gap-[10px]">
                          <input
                            type="checkbox"
                            checked={enableServiceArea}
                            onChange={(e) =>
                              setEnableServiceArea(e.target.checked)
                            }
                            className="h-[16px] w-[16px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          />
                          <p className="text-[16px] font-normal text-[#666666] mt-[12px]">
                            Enable Service Area
                          </p>
                        </div>
                        <p className="pl-[26px] text-xs text-[#9CA3AF] mt-1 max-w-[500px]">
                          Allows Vendors to define service area on the map within which they
                          provide their services.
                        </p>


                        {/* Row 2: Warning (Only shows if map_coordinates is falsy) */}
                        {!map_coordinates && enableServiceArea && (
                          <div className="flex items-center gap-1.5 mt-2 ml-[26px] text-red-500">
                            <span className="text-[12px] font-medium">
                              You must set your service area.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {(userType === "admin" || userType === "vendor") && (
                      <div className="flex flex-col">
                        <div className="pl-[18px] flex items-center gap-[10px]">
                          <input
                            type="checkbox"
                            checked={forceServiceArea}
                            onChange={(e) =>
                              setForceServiceArea(e.target.checked)
                            }
                            className="h-[16px] w-[16px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          />
                          <p className="text-[16px] font-normal text-[#666666] mt-[12px]">
                            Force Service Area
                          </p>
                        </div>
                        <p className="pl-[26px] text-xs text-[#9CA3AF] mt-1 max-w-[500px]">
                          If Force Service Area is checked admin can not book an appointment
                          against that vendor outside their area.
                        </p>
                      </div>
                    )}
                    {(userType === "admin" ||
                      (userType === "vendor" && enableServiceArea)) && (
                        <WorkAreaMap
                          providerId={idToUse}
                          address={companyAddress}
                          city={companyCity}
                          province={companyProvince}
                          country={companyCountry}
                          coords={map_coordinates}
                          setmap_coordinates={setmap_coordinates}
                        />
                      )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </form>
        )}
        {active === "travel" && <TravelTable userId={currentUser?.uuid} />}
        {active === "history" && <VendorEarningsHistory vendorId={currentUser?.uuid} />}
        {active === "work hours" && (
          <VendorWorkHours
            currentUser={
              Array.isArray(currentUser) ? currentUser[0] : currentUser
            }
            servicesData={servicesData}
            vendorTourMedia={vendorTourMedia}
            setPaymentPerKm={setPaymentPerKm}
            paymentPerKm={paymentPerKm}
            fieldErrors={fieldErrors}
            enableServiceArea={enableServiceArea}
            setEnableServiceArea={setEnableServiceArea}
            forceServiceArea={forceServiceArea}
            setForceServiceArea={setForceServiceArea}
            workHours={workHours}
            setWorkHours={setWorkHours}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            setSyncEmailType={setSyncEmailType}
            syncEmailType={syncEmailType}
            vendorServices={vendorServices}
            setVendorServices={setVendorServices}
            portfolioImages={portfolioImages}
            setPortfolioImages={setPortfolioImages}
            portfolioImagesUrls={portfolioImagesUrls}
            setPortfolioImagesUrls={setPortfolioImagesUrl}
            galleryImages={galleryImages}
            setGalleryImages={setGalleryImages}
            coords={map_coordinates}
            setmap_coordinates={setmap_coordinates}
          />
        )}
      </div>
    </div >
  );
};

export default VendorForm;
