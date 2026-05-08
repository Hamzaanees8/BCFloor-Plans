import React, { useRef, useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  connectGoogleCalendar,
  //   connectStripe,
} from "@/app/dashboard/vendors/vendors";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useAppContext } from "@/app/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DropDownArrow, DownloadIcon } from "./Icons";
import { ChevronDownIcon, Plus, X, Eye, EyeOff } from "lucide-react";
import ServiceItem from "./ServiceItem";
import AddBreakPopup from "@/app/dashboard/calendar/components/AddBreakPopup";
import { Pagination } from "./TablePagination";
import { LatLng } from "./WorkAreaMap";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import DropdownActions from "./DropdownActions";
import { DeleteVendorBreak } from "@/app/dashboard/vendors/vendors";
import { toast } from "sonner";
import { VendorPortfolioImage } from "@/app/dashboard/vendors/create/page";
import ImageSourceModal from "@/app/dashboard/file-manager/components/ImageSourceModal";
import VendorWorkGallery, { VendorsTourMedia } from "./vendorWorkGallery";
import { friendlyTimeZoneNames } from "@/components/GlobalSettings";
import { DateTime } from "luxon";

export interface DaySchedule {
  day: string;
  start_time: string;
  end_time: string;
  is_off: boolean;
  is_twilight: boolean;
}

export interface Services {
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

export interface Break {
  id?: number;
  uuid?: string;
  vendor_id?: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  address?: string;
  start_date?: string;
  end_date?: string;
}

export type CurrentUser = {
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
  stripe_account_id?: string;
  google_access_token?: string;
  google_refresh_token?: string;

  company?: {
    name: string;
    website: string;
    vendor_id?: number;
  };
  vendor_services?: {
    id: number;
    uuid: string;
    vendor_id: number;
    service_id: number;
    hourly_rate: string;
    time_needed: number;
    status: boolean;
    created_at: string;
    updated_at: string;
    service: {
      id: number;
      uuid: string;
      name: string;
      category_id: number;
      thumbnail: string;
      description: string;
      created_at: string;
      updated_at: string;
      status: boolean;
      background_color: string;
      border_color: string;
      quickbooks_item_id: string | null;
      quickbooks_synced_at: string | null;
      thumbnail_url: string;
    };
    options?: {
      uuid: string;
      vendor_service_id: number;
      option_id: number;
      vendor_price: string;
      vendor_adjustment_time: string | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      adjustment_time?: string;
      product_option: {
        id: number;
        uuid: string;
        service_id: number;
        title: string;
        amount: string;
        cost: number | null;
        adjustment_time: string | null;
        created_at: string;
        updated_at: string;
        status: boolean;
      } | null;
    }[];
  }[];
  addresses?: {
    type: "company" | "billing" | string;
    address_line_1: string;
    address_line_2?: string | null;
    city: string;
    province: string;
    country: string;
  }[];
  work_hours?: {
    id: number;
    uuid: string;
    vendor_id: number;
    start_time: string;
    end_time: string;
    work_days: string;
    repeat_weekly: string;
    break_start: string | null;
    break_end: string | null;
    commute_minutes: number;
    timezone: string;
    created_at: string;
    updated_at: string;
    next_booking_slot_only?: boolean | number | string;
  };
  coordinates?: string[];
  additional_breaks: {
    id?: number;
    uuid?: string;
    vendor_id?: number;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    address?: string;
    start_date: string;
    end_date: string;
  }[];
  order_slots?: OrderSlot[];
  organization_id?: number | string;
};

export interface OrderSlot {
  id: number;
  uuid: string;
  order_id: number;
  service_id: number;
  vendor_id: number;
  show_all_vendors: boolean;
  schedule_override: boolean;
  recommend_time: boolean;
  travel: null | unknown;
  created_at: string;
  updated_at: string;
  start_time: string;
  end_time: string;
  est_time: string;
  distance: string;
  km_price: null | number | string;
  address: string;
  location: string;
  date: string;
  google_event_id: null | string;
}

interface WorkDetailProps {
  currentUser: CurrentUser | null;
  servicesData: Services[];
  paymentPerKm: number | string;
  setPaymentPerKm: React.Dispatch<React.SetStateAction<number | string>>;
  fieldErrors: Record<string, string[]>;
  enableServiceArea: boolean;
  setEnableServiceArea: React.Dispatch<React.SetStateAction<boolean>>;
  forceServiceArea: boolean;
  setForceServiceArea: React.Dispatch<React.SetStateAction<boolean>>;
  providerId?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  coords: LatLng[];

  setmap_coordinates: React.Dispatch<React.SetStateAction<LatLng[]>>;
  workHours: WorkHoursData;
  setWorkHours: React.Dispatch<React.SetStateAction<WorkHoursData>>;
  selectedServices: SelectedService[];
  setSelectedServices: React.Dispatch<React.SetStateAction<SelectedService[]>>;
  vendorServices: SelectedService[];
  setVendorServices: React.Dispatch<React.SetStateAction<SelectedService[]>>;
  syncEmailType: string;
  setSyncEmailType: React.Dispatch<React.SetStateAction<string>>;
  portfolioImages?: File[];
  setPortfolioImages?: React.Dispatch<React.SetStateAction<File[]>>;
  portfolioImagesUrls?: VendorPortfolioImage[];
  vendorTourMedia?: VendorsTourMedia[];
  galleryImages?: string[];
  setGalleryImages?: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface WorkHoursData {
  work_days: DaySchedule[];
  break_start: string;
  break_end: string;
  timezone: string;
  commuteTime: number;
  repeat: boolean;
  googleSync: boolean;
  googleSyncEnabled: boolean;
  emailType: string;
  next_booking_slot_only?: boolean;
}

export interface SelectedService {
  uuid?: string;
  service_id: string;
  vendor_service_id?: string;
  options: {
    uuid?: string;
    option_uuid: string;
    vendor_price: number;
    adjustment_time: string;
  }[];
  service?: Services;
}

interface DisplayImage {
  id: string;
  url: string;
  type: "existing" | "new" | "gallery";
  api: boolean;
  is_processing?: boolean;
}

interface TimeZoneOption {
  label: string;
  value: string;
}

const timeNeededOptions = [
  { value: 0, label: "no adjustment" },
  { value: 5, label: "5 Minutes less" },
  { value: 10, label: "10 Minutes less" },
  { value: 15, label: "15 Minutes less" },
  { value: 30, label: "30 Minutes less" },
  { value: 45, label: "45 Minutes less" },
];

const daysOfWeek = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const VendorWorkHours = ({
  currentUser,
  servicesData,
  workHours,
  setWorkHours,
  selectedServices,
  setSelectedServices,
  //   setSyncEmailType,
  //   syncEmailType,
  vendorServices,
  setVendorServices,
  portfolioImages = [],
  setPortfolioImages,
  portfolioImagesUrls = [],
  vendorTourMedia = [],
  galleryImages: propGalleryImages,
  setGalleryImages: propSetGalleryImages,
  fieldErrors,
}: WorkDetailProps) => {
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [showTimeFields, setShowTimeFields] = useState(false);
  const [isBreakPopupOpen, setIsBreakPopupOpen] = useState(false);
  const [breaks, setBreaks] = useState<Break[]>(
    currentUser?.additional_breaks || []
  );
  const [selectedBreak, setSelectedBreak] = useState<Break | undefined>(
    undefined
  );
  const [showAllTimeOffs, setShowAllTimeOffs] = useState(false);
  const [paginatedBreaks, setPaginatedBreaks] = useState<Break[]>([]);
  const { userType } = useAppContext();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const [tempOptionPrices, setTempOptionPrices] = useState<{
    [key: string]: number;
  }>({});
  const [tempOptionTimes, setTempOptionTimes] = useState<{
    [key: string]: string;
  }>({});
  const [timeZoneOptions, setTimeZoneOptions] = useState<TimeZoneOption[]>([]);
  //   const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  useEffect(() => {
    const zones = Intl.supportedValuesOf("timeZone");

    const options = zones.map((zone) => {
      const offsetInMinutes = DateTime.now().setZone(zone).offset;
      const offsetHours = Math.floor(Math.abs(offsetInMinutes) / 60);
      const offsetMinutes = Math.abs(offsetInMinutes) % 60;
      const sign = offsetInMinutes >= 0 ? "+" : "-";
      const gmtOffset = `(GMT${sign}${offsetHours
        .toString()
        .padStart(2, "0")}:${offsetMinutes.toString().padStart(2, "0")})`;

      const friendlyName =
        friendlyTimeZoneNames[zone] ||
        zone.replace(/_/g, " ").split("/").slice(1).join(" - ");

      return {
        label: `${gmtOffset} ${friendlyName}`,
        value: zone,
        offset: offsetInMinutes,
      };
    });

    // Sort by offset
    options.sort((a, b) => a.offset - b.offset);

    setTimeZoneOptions(options.map(({ label, value }) => ({ label, value })));
  }, []);

  // Initialize paginatedBreaks on mount and when breaks/showAllTimeOffs change
  useEffect(() => {
    const filteredBreaks = (
      showAllTimeOffs
        ? breaks
        : breaks.filter((brk) => {
          const endDate = new Date(`${brk.date}T${brk.end_time}`);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return endDate >= today;
        })
    ).sort((a, b) => {
      // Sort by date descending (latest first)
      const dateA = new Date(`${a.date}T${a.end_time}`);
      const dateB = new Date(`${b.date}T${b.end_time}`);
      return dateB.getTime() - dateA.getTime();
    });

    // Set initial page data (first 10 items or all if less than 10)
    const itemsPerPage = 10;
    setPaginatedBreaks(filteredBreaks.slice(0, itemsPerPage));
  }, [breaks, showAllTimeOffs]);

  const handleDayToggle = (dayKey: string) => {
    setWorkHours((prev) => ({
      ...prev,
      work_days: prev.work_days.map((day) =>
        day.day === dayKey ? { ...day, is_off: !day.is_off } : day
      ),
    }));
  };

  const handleTimeChange = (
    dayKey: string,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setWorkHours((prev) => ({
      ...prev,
      work_days: prev.work_days.map((day) =>
        day.day === dayKey ? { ...day, [field]: value } : day
      ),
    }));
  };

  const handleTwilightToggle = (dayKey: string) => {
    setWorkHours((prev) => ({
      ...prev,
      work_days: prev.work_days.map((day) =>
        day.day === dayKey ? { ...day, is_twilight: !day.is_twilight } : day
      ),
    }));
  };

  const handleChange = (
    field: keyof WorkHoursData,
    value: string | boolean | number
  ) => {
    setWorkHours((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  //   const handleConnectStripe = async (
  //     e: React.MouseEvent<HTMLButtonElement>
  //   ) => {
  //     e.preventDefault();
  //     setIsStripeLoading(true);
  //     try {
  //       const token = localStorage.getItem("token") || "";

  //       if (!token) {
  //         toast.error("Please login first");
  //         return;
  //       }

  //       let vendorIdToUse: string = "";

  //       if (userType === "admin") {
  //         vendorIdToUse = currentUser?.uuid || "";
  //         if (!vendorIdToUse) {
  //           toast.error("No vendor selected");
  //           return;
  //         }
  //       } else if (userType === "vendor") {
  //         const userInfo = localStorage.getItem("userInfo");
  //         if (userInfo) {
  //           try {
  //             const parsedInfo = JSON.parse(userInfo);
  //             vendorIdToUse = parsedInfo.uuid;
  //           } catch (err) {
  //             console.error("Failed to parse userInfo:", err);
  //           }
  //         }
  //       }

  //       if (!vendorIdToUse) {
  //         toast.error("Unable to determine vendor ID");
  //         return;
  //       }

  //         const result = await connectStripe(vendorIdToUse);

  //       if (result.success) {
  //         toast.success("Redirecting to Stripe...");

  //         if (result.url) {
  //           window.location.href = result.url;
  //         }
  //       } else {
  //         toast.error(result.error || "Failed to connect Stripe");
  //       }
  //     } catch (error) {
  //       console.error("Stripe connection error:", error);
  //       toast.error("Failed to connect Stripe");
  //     } finally {
  //       setIsStripeLoading(false);
  //     }
  //   };
  const handleConnectCalendar = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setIsCalendarLoading(true);
    const data = await connectGoogleCalendar();

    if (data.success) {
      toast.success("Redirecting to Google Calendar...");
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } else {
      toast.error(data.error || "Failed to connect Google Calendar");
    }
    setIsCalendarLoading(false);
  };

  const handleAddService = (id?: string) => {
    const sId = id || serviceId;
    if (!sId) return;

    const selectedService = servicesData.find((s) => s.uuid === sId);
    if (!selectedService) return;

    const alreadyExists = selectedServices.some((s) => s.service_id === sId);
    if (alreadyExists) return;

    // Create options array in the new format
    const options =
      selectedService.product_options?.map((option) => ({
        option_uuid: option.uuid,
        vendor_price: option.cost || Number(option.amount) || 0,
        adjustment_time: "no adjustment",
      })) || [];

    const newService: SelectedService = {
      service_id: sId,
      options,
    };

    setSelectedServices((prev) => [newService, ...prev]);
    setServiceId("");
    setShowTimeFields(false);
    setIsAddingService(false);
    setTempOptionPrices({});
    setTempOptionTimes({});
  };

  const handleServiceChange = (
    index: number,
    optionUuid: string,
    field: "vendor_price" | "adjustment_time",
    value: number | string
  ) => {
    setSelectedServices((prev) => {
      const updatedServices = [...prev];
      const service = updatedServices[index];

      if (!service) return prev;

      service.options = service.options.map((opt) =>
        opt.option_uuid === optionUuid ? { ...opt, [field]: value } : opt
      );

      return updatedServices;
    });
  };

  const handleVendorServiceChange = (
    index: number,
    optionUuid: string,
    field: "vendor_price" | "adjustment_time",
    value: number | string
  ) => {
    setVendorServices((prev) => {
      const updatedServices = [...prev];
      const service = updatedServices[index];

      if (!service) return prev;

      service.options = service.options.map((opt) =>
        opt.option_uuid === optionUuid ? { ...opt, [field]: value } : opt
      );

      return updatedServices;
    });
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVendorService = (index: number) => {
    setVendorServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBreak = (newBreakData: Break) => {
    const newBreak: Break = {
      id: newBreakData.id,
      uuid: newBreakData.uuid,
      vendor_id: newBreakData.vendor_id,
      title: newBreakData.title,
      date: newBreakData.date,
      start_time: newBreakData.start_time,
      end_time: newBreakData.end_time,
      address: newBreakData.address || "",
      start_date: newBreakData.start_date,
      end_date: newBreakData.end_date,
    };

    if (selectedBreak) {
      setBreaks((prev) =>
        prev.map((b) => (b.id === newBreak.id ? newBreak : b))
      );
    } else {
      setBreaks((prev) => [...prev, newBreak]);
    }

    setIsBreakPopupOpen(false);
    setSelectedBreak(undefined);
  };

  async function handleDelete(breakUuid: string) {
    try {
      await DeleteVendorBreak(breakUuid ?? "");
      setBreaks((prev) => prev.filter((event) => event.uuid !== breakUuid));
      toast.success("Break deleted successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete break");
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  const [galleryImages, setGalleryImages] = useState<string[]>(
    propGalleryImages || []
  );
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const handleUploadClick = () => {
    setShowImageSourceModal(true);
  };

  const handleImageSourceSelect = (source: "local" | "gallery") => {
    setShowImageSourceModal(false);

    if (source === "local") {
      fileInputRef.current?.click();
    } else {
      setShowGallery(true);
    }
  };

  const handleLocalFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const updatedFiles = [...portfolioImages, ...newFiles];

    setFiles(updatedFiles);

    if (setPortfolioImages) {
      setPortfolioImages(updatedFiles);
    }
  };

  const handleSaveFromGallery = (urls: string[]) => {
    setGalleryImages((prev) => [...prev, ...urls]);
    if (propSetGalleryImages) {
      propSetGalleryImages((prev) => [...prev, ...urls]);
    }
    setShowGallery(false);
  };

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOverWindow = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropWindow = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragging(false);
      dragCounter.current = 0;

      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      if (droppedFiles.length > 0) {
        handleLocalFiles(e.dataTransfer?.files || null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [portfolioImages, setPortfolioImages]
  );

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOverWindow);
    window.addEventListener("drop", handleDropWindow);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOverWindow);
      window.removeEventListener("drop", handleDropWindow);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOverWindow, handleDropWindow]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLocalFiles(e.dataTransfer.files);
      if (e.dataTransfer.clearData) {
        e.dataTransfer.clearData();
      }
    }
  };

  const allImagesForDisplay: DisplayImage[] = [
    ...portfolioImagesUrls.map((img) => ({
      id: `existing-${img.uuid}`,
      url: img.variant_urls?.thumb || img.image_url,
      type: "existing" as const,
      api: true,
      is_processing: img.is_processing,
    })),
    ...portfolioImages.map((file, index) => ({
      id: `new-${index}-${file.name}`,
      url: URL.createObjectURL(file),
      type: "new" as const,
      api: false,
      is_processing: false,
    })),
    ...galleryImages.map((path, index) => ({
      id: `gallery-${index}`,
      url: `${API_URL}/${path}`,
      type: "gallery" as const,
      api: true,
      is_processing: false,
    })),
  ];

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (setPortfolioImages) {
      setPortfolioImages(newFiles);
    }
    // if (fileType === 'local') {
    // } else {
    //     const newGalleryImages = [...galleryImages];
    //     newGalleryImages.splice(index, 1);
    //     setGalleryImages(newGalleryImages);
    //     if (propSetGalleryImages) {
    //         propSetGalleryImages(newGalleryImages);
    //     }
    // }
  };

  return (
    <div className="w-full flex justify-center font-alexandria">
      <Accordion
        type="multiple"
        defaultValue={[
          "hours",
          "service",
          "timeOff",
          "vendor",
          "service-area",
          "media",
        ]}
        className="w-full space-y-4"
      >
        <AccordionItem value="hours">
          <AccordionTrigger
            className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
          >
            WORK HOURS
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex justify-center">
              <div className="w-[450px] p-6  rounded-lg text-[14px] text-[#666666]">
                <p className="text-[#666666] text-[14px] mb-6">
                  Scheduling settings have impact on ordering from all customers
                  - addresses, last job location, working hours, duration of
                  service, travel time, all contribute to your availability.
                  <br />
                  Set your working hours that clients can book your services.
                </p>

                <div className="mb-6">
                  <h3 className="text-[#666666] text-[14px] mb-4">Work Week</h3>

                  {workHours.work_days.map((schedule) => {
                    const dayConfig = daysOfWeek.find(
                      (d) => d.key === schedule.day
                    );
                    const dayName = dayConfig?.label || schedule.day;

                    return (
                      <div key={schedule.day} className="py-4 rounded-md">
                        <div className="flex items-center mb-4 text-[16px]">
                          <Checkbox
                            id={`${schedule.day}-enabled`}
                            checked={!schedule.is_off}
                            onCheckedChange={() =>
                              handleDayToggle(schedule.day)
                            }
                            className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                          />
                          <Label htmlFor={`${schedule.day}-enabled`}>
                            {dayName}
                          </Label>
                        </div>

                        {!schedule.is_off && (
                          <>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label
                                  htmlFor={`${schedule.day}-start`}
                                  className="text-sm font-[400] mb-[10px]"
                                >
                                  Start
                                </Label>
                                <Input
                                  id={`${schedule.day}-start`}
                                  type="time"
                                  value={schedule.start_time}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      schedule.day,
                                      "start_time",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full h-[42px] data-[placeholder]:text-[#9ca3af] border-[1px] ${fieldErrors[
                                    `work_days[${schedule.day}].start_time`
                                  ]
                                    ? "border-red-500"
                                    : "border-[#BBBBBB]"
                                    } mt-[10px] flex items-center justify-between px-3`}
                                  style={{
                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                  }}
                                />
                                {fieldErrors[
                                  `work_days[${schedule.day}].start_time`
                                ] && (
                                    <p className="text-red-500 text-xs mt-1">
                                      {
                                        fieldErrors[
                                        `work_days[${schedule.day}].start_time`
                                        ][0]
                                      }
                                    </p>
                                  )}
                              </div>
                              <div>
                                <Label
                                  htmlFor={`${schedule.day}-end`}
                                  className="text-sm font-[400] mb-[5px]"
                                >
                                  End
                                </Label>
                                <Input
                                  id={`${schedule.day}-end`}
                                  type="time"
                                  value={schedule.end_time}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      schedule.day,
                                      "end_time",
                                      e.target.value
                                    )
                                  }
                                  className={`w-full h-[42px] data-[placeholder]:text-[#9ca3af] border-[1px] ${fieldErrors[
                                    `work_days[${schedule.day}].end_time`
                                  ]
                                    ? "border-red-500"
                                    : "border-[#BBBBBB]"
                                    } mt-[10px] flex items-center justify-between px-3`}
                                  style={{
                                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                  }}
                                />
                                {fieldErrors[
                                  `work_days[${schedule.day}].end_time`
                                ] && (
                                    <p className="text-red-500 text-xs mt-1">
                                      {
                                        fieldErrors[
                                        `work_days[${schedule.day}].end_time`
                                        ][0]
                                      }
                                    </p>
                                  )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end">
                              <Checkbox
                                id={`${schedule.day}-twilight`}
                                checked={schedule.is_twilight}
                                onCheckedChange={() =>
                                  handleTwilightToggle(schedule.day)
                                }
                                className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                              />
                              <Label
                                htmlFor={`${schedule.day}-twilight`}
                                className="text-sm"
                              >
                                Twilight Photos
                              </Label>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mb-6">
                  <Label htmlFor="repeat" className="block mb-2 font-medium">
                    Repeat
                  </Label>
                  <div className="flex items-center">
                    <Checkbox
                      id="repeat"
                      checked={workHours.repeat}
                      onCheckedChange={(checked) =>
                        handleChange("repeat", checked)
                      }
                      className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                    />
                    <Label htmlFor="repeat" className="">
                      Repeat every week
                    </Label>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="next-booking-slot" className="font-medium text-[14px]">
                        Only Allow Next Booking Slot
                      </Label>
                    </div>
                    <Switch
                      id="next-booking-slot"
                      checked={workHours.next_booking_slot_only ?? false}
                      onCheckedChange={(checked) => handleChange("next_booking_slot_only", checked)}
                      className="data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-red-500"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="mb-6">
                    <Label htmlFor="timezone" className="block mb-2">
                      Time Zone <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={workHours.timezone}
                      onValueChange={(value) => handleChange("timezone", value)}
                    >
                      <SelectTrigger
                        id="timezone"
                        className={`w-full h-[42px] data-[placeholder]:text-[#9ca3af] border-[1px] ${fieldErrors.timezone
                          ? "border-red-500"
                          : "border-[#BBBBBB]"
                          } mt-[10px] flex items-center justify-between px-3`}
                        style={{
                          backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                        }}
                      >
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeZoneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.timezone && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.timezone[0]}
                      </p>
                    )}
                  </div>

                  <div className="w-full mb-6">
                    <Label htmlFor="commute" className="block mb-2">
                      Commute Time Baseline (Minutes)
                    </Label>
                    <Input
                      id="commute"
                      type="number"
                      value={workHours.commuteTime}
                      onChange={(e) =>
                        handleChange("commuteTime", parseInt(e.target.value))
                      }
                      className="w-full h-[42px] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 "
                      style={{
                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                      }}
                    />
                  </div>

                  <div className="mb-6 w-full">
                    <h3 className="mb-2">Lunch Break</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <Label
                          htmlFor="break-start"
                          className="text-sm font-[400]"
                        >
                          Start
                        </Label>
                        <Input
                          id="break-start"
                          type="time"
                          value={workHours.break_start}
                          onChange={(e) =>
                            handleChange("break_start", e.target.value)
                          }
                          className="w-full h-[42px] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3"
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                          }}
                        />
                      </div>
                      <div className="col-span-1">
                        <Label
                          htmlFor="break-end"
                          className="text-sm font-[400]"
                        >
                          End
                        </Label>
                        <Input
                          id="break-end"
                          type="time"
                          value={workHours.break_end}
                          onChange={(e) =>
                            handleChange("break_end", e.target.value)
                          }
                          className="w-full h-[42px] data-[placeholder]:text-[#9ca3af] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3"
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      {/* <Checkbox
                        id="google-sync"
                        checked={workHours.googleSync}
                        onCheckedChange={(checked) =>
                          handleChange("googleSync", checked)
                        }
                        className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                      />
                      <Label htmlFor="google-sync" className="">
                        Enable Google Calendar Sync
                      </Label> */}
                      {/* Stripe Button */}
                      {/* <button
                        onClick={(e) => {
                          handleConnectStripe(e);
                        }}
                        disabled={
                          isStripeLoading || !!currentUser?.stripe_account_id
                        }
                        className={`px-6 py-3 w-auto ${
                          currentUser?.stripe_account_id
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
                      </button> */}

                      {/* Calendar Button */}

                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="w-[40%] flex items-center mb-4">
                        <Checkbox
                          id="google-sync-enabled"
                          checked={workHours.googleSyncEnabled}
                          onCheckedChange={(checked) =>
                            handleChange("googleSyncEnabled", checked)
                          }
                          className="mr-2 h-[16px] w-[16px] data-[state=checked]:bg-[#4290E9] data-[state=checked]:border-[#4290E9]"
                        />
                        <Label htmlFor="google-sync-enabled">
                          Sync to Google
                        </Label>
                      </div>
                      <button
                        onClick={(e) => {
                          handleConnectCalendar(e);
                        }}
                        disabled={
                          isCalendarLoading ||
                          !!currentUser?.google_access_token ||
                          !!currentUser?.google_refresh_token
                        }
                        className={`px-6 py-3 w-auto ${currentUser?.google_access_token ||
                          currentUser?.google_refresh_token
                          ? "bg-[#6BAE41] hover:bg-[#6BAE41]/80"
                          : "bg-[#4290E9] hover:bg-[#4290E9]/80"
                          } text-white font-medium rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
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
                        ) : currentUser?.google_access_token ||
                          currentUser?.google_refresh_token ? (
                          "Calendar Connected"
                        ) : (
                          "Connect with Calendar"
                        )}
                      </button>
                      {/* <div className="w-1/2">
                        <Select
                          value={syncEmailType}
                          onValueChange={(value) => setSyncEmailType(value)}
                        >
                          <SelectTrigger
                            className={`w-full ${
                              fieldErrors.sync_email ? "border-red-500" : ""
                            }`}
                          >
                            <SelectValue placeholder="Select Email Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary </SelectItem>
                            <SelectItem value="secondary">
                              Secondary{" "}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldErrors.sync_email && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.sync_email[0]}
                          </p>
                        )}
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="service" className="border-none">
          <AccordionTrigger
            className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
          >
            SERVICES
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex flex-col items-center">
              <div className="w-[450px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                <div className="grid grid-cols-1 gap-[16px]">
                  <div className="col-span-1">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-normal text-base text-[#666666]">
                        Services{" "}
                        {fieldErrors.services && (
                          <span className="text-red-500 text-xs ml-2">
                            ({fieldErrors.services[0]})
                          </span>
                        )}
                      </p>
                      <div
                        className="flex items-center gap-x-[10px] cursor-pointer"
                        onClick={() => setIsAddingService(true)}
                      >
                        <p className="text-base font-semibold font-raleway text-[#6BAE41]">
                          Add
                        </p>
                        <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Add Service Form */}
                  {isAddingService && (
                    <div className="col-span-1 mb-0">
                      <div className="mb-4 p-4">
                        <label
                          htmlFor="serviceName"
                          className="block text-sm font-normal mb-2"
                        >
                          Service Name <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-x-[20px]">
                          <Select
                            value={serviceId}
                            onValueChange={(value) => {
                              setServiceId(value);
                              setTimeout(() => handleAddService(value), 0);
                            }}
                          >
                            <SelectTrigger
                              className="w-full h-[42px] border-[1px] data-[placeholder]:text-[#9ca3af] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block"
                              style={{
                                backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                              }}
                            >
                              <SelectValue placeholder="Select Service Option Here" />
                            </SelectTrigger>
                            <SelectContent>
                              {servicesData
                                .filter(
                                  (service) =>
                                    !selectedServices.some(
                                      (s) => s.service_id === service.uuid
                                    ) &&
                                    !vendorServices.some(
                                      (s) => s.service_id === service.uuid
                                    )
                                )
                                .map((option) => (
                                  <SelectItem
                                    key={option.uuid}
                                    value={option.uuid}
                                  >
                                    {option.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>

                          <button
                            type="button"
                            onClick={() => setShowTimeFields(!showTimeFields)}
                            className=" rounded"
                          >
                            {showTimeFields ? (
                              <ChevronDownIcon />
                            ) : (
                              <DropDownArrow />
                            )}
                          </button>
                        </div>
                      </div>

                      {showTimeFields && serviceId && (
                        <div className="mt-1 px-3">
                          <Accordion type="single" collapsible>
                            {servicesData
                              .find((s) => s.uuid === serviceId)
                              ?.product_options?.map((option) => (
                                <AccordionItem
                                  key={option.uuid}
                                  value={option.uuid}
                                >
                                  <AccordionTrigger>
                                    {option.title}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded">
                                      <div>
                                        <Label
                                          htmlFor={`preview-price-${option.uuid}`}
                                          className="block text-xs font-normal mb-1"
                                        >
                                          Package Price{" "}
                                          <span className="text-red-500">
                                            *
                                          </span>
                                        </Label>
                                        <Input
                                          id={`preview-price-${option.uuid}`}
                                          type="number"
                                          inputMode="decimal"
                                          placeholder="Enter price"
                                          value={
                                            tempOptionPrices[option.uuid] !==
                                              undefined
                                              ? tempOptionPrices[option.uuid]
                                              : option.cost || Number(option.amount) || 0
                                          }
                                          onChange={(e) => {
                                            const price =
                                              e.target.value === ""
                                                ? 0
                                                : Number(e.target.value);
                                            setTempOptionPrices((prev) => ({
                                              ...prev,
                                              [option.uuid]: price,
                                            }));
                                          }}
                                          className="w-full h-[38px] bg-white border-[1px] border-[#BBBBBB] text-sm"
                                        />
                                      </div>

                                      <div>
                                        <Label
                                          htmlFor={`preview-time-${option.uuid}`}
                                          className="block text-xs font-normal mb-1"
                                        >
                                          Time Adjustment
                                        </Label>
                                        <Select
                                          value={
                                            tempOptionTimes[option.uuid] || "0"
                                          }
                                          onValueChange={(value) => {
                                            setTempOptionTimes((prev) => ({
                                              ...prev,
                                              [option.uuid]: value,
                                            }));
                                          }}
                                        >
                                          <SelectTrigger className="w-full h-[38px] bg-white border-[1px] border-[#BBBBBB] text-sm">
                                            <SelectValue placeholder="Select Time" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {timeNeededOptions.map(
                                              (opt, idx) => (
                                                <SelectItem
                                                  key={idx}
                                                  value={String(opt.value)}
                                                >
                                                  {opt.label}
                                                </SelectItem>
                                              )
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                          </Accordion>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="col-span-1">
                    <div className="col-span-1">
                      <div className="col-span-1">
                        {selectedServices.length > 0 ? (
                          <div className="space-y-2 flex flex-col items-center">
                            {selectedServices.map((selectedService, index) => (
                              <ServiceItem
                                key={index}
                                index={index}
                                selectedService={selectedService}
                                servicesData={servicesData}
                                onChange={handleServiceChange}
                                onRemove={handleRemoveService}
                                currentUser={currentUser}
                                fieldErrors={fieldErrors}
                              />
                            ))}
                          </div>
                        ) : (
                          !isAddingService && (vendorServices?.length || 0) === 0 && (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                              No services added yet. Click Add to get started.
                            </div>
                          )
                        )}
                        {vendorServices?.length > 0 && (
                          <div className="space-y-2 flex flex-col items-center">
                            {vendorServices.map((selectedService, index) => (
                              <ServiceItem
                                key={index}
                                index={index}
                                selectedService={selectedService}
                                servicesData={servicesData}
                                onChange={handleVendorServiceChange}
                                onRemove={handleRemoveVendorService}
                                currentUser={currentUser}
                                fieldErrors={fieldErrors}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="timeOff" className="border-none">
          <AccordionTrigger
            className={`group px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
          >
            TIME OFF
            {/* Add button and Show All button inside the trigger */}
            <div className="hidden capitalize group-data-[state=open]:flex  absolute right-[60px] items-center gap-x-[20px] cursor-pointer">
              <div
                className="flex items-center gap-x-[8px] cursor-pointer hover:underline hover:decoration-[#4290E9]"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllTimeOffs(!showAllTimeOffs);
                }}
              >
                <p className="text-base font-semibold font-raleway text-[#4290E9]">
                  {showAllTimeOffs ? "Hide Past" : "Show Past"}
                </p>
                {showAllTimeOffs ? (
                  <EyeOff className="w-[18px] h-[18px] text-[#4290E9]" />
                ) : (
                  <Eye className="w-[18px] h-[18px] text-[#4290E9]" />
                )}
              </div>
              <div
                className="flex items-center gap-x-[10px] cursor-pointer hover:underline hover:decoration-[#6BAE41]"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBreakPopupOpen(true);
                }}
              >
                <p className="text-base font-semibold font-raleway text-[#6BAE41]">
                  Add
                </p>
                <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm" />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="gap-4 flex flex-col items-center">
            <div className="space-y-6 w-full text-[#666666]">
              <div className="">
                {(() => {
                  const filteredBreaks = (
                    showAllTimeOffs
                      ? breaks
                      : breaks.filter((brk) => {
                        const endDate = new Date(
                          `${brk.date}T${brk.end_time}`
                        );
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return endDate >= today;
                      })
                  ).sort((a, b) => {
                    // Sort by date descending (latest first)
                    const dateA = new Date(`${a.date}T${a.end_time}`);
                    const dateB = new Date(`${b.date}T${b.end_time}`);
                    return dateB.getTime() - dateA.getTime();
                  });

                  return filteredBreaks?.length === 0 ? (
                    <p className="text-sm text-[#666666] text-center py-8">
                      {showAllTimeOffs
                        ? "No breaks scheduled"
                        : "No upcoming breaks"}
                    </p>
                  ) : (
                    <Table className="font-alexandria !overflow-x-auto whitespace-nowrap min-w-[800px]">
                      <TableHeader>
                        <TableRow
                          className="font-alexandria h-[54px] hover:bg-transparent"
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                          }}
                        >
                          <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                            Time Off
                          </TableHead>
                          <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                            From
                          </TableHead>
                          <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                            To
                          </TableHead>
                          <TableHead className="text-[14px] font-[700] text[#7D7D7D]">
                            Address
                          </TableHead>
                          <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedBreaks?.map((brk) => {
                          const options = [
                            {
                              label: "Edit",
                              onClick: () => {
                                setSelectedBreak(brk);
                                setIsBreakPopupOpen(true);
                              },
                            },
                            {
                              label: "Delete",
                              onClick: () => handleDelete(brk.uuid || ""),
                              confirm1: true,
                            },
                          ];
                          return (
                            <TableRow key={brk.id} className="py-4">
                              <TableCell className="text-[15px] font-[400]  pl-[20px] text-[#666666]">
                                {brk.title}
                              </TableCell>
                              <TableCell className="text-[15px] font-[400] text-[#666666]">
                                <div className="flex gap-2">
                                  <span>{brk.start_date}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {brk.start_time.slice(0, 5)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[15px] font-[400]  text-[#666666]">
                                <div className="flex gap-2">
                                  <span>{brk.end_date}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {brk.end_time.slice(0, 5)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[15px] font-[400] text-[#666666]">
                                {brk.address || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownActions options={options} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  );
                })()}
              </div>
              {/* Pagination Component */}
              {(() => {
                const filteredBreaks = (
                  showAllTimeOffs
                    ? breaks
                    : breaks.filter((brk) => {
                      const endDate = new Date(`${brk.date}T${brk.end_time}`);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return endDate >= today;
                    })
                ).sort((a, b) => {
                  // Sort by date descending (latest first)
                  const dateA = new Date(`${a.date}T${a.end_time}`);
                  const dateB = new Date(`${b.date}T${b.end_time}`);
                  return dateB.getTime() - dateA.getTime();
                });

                return (
                  <Pagination<Break>
                    data={filteredBreaks}
                    dataName="Time Off"
                    userType={userType}
                    onPageChange={(page, paginatedData) =>
                      setPaginatedBreaks(paginatedData)
                    }
                  />
                );
              })()}

              <AddBreakPopup
                open={isBreakPopupOpen}
                setOpen={(open) => {
                  if (!open) setSelectedBreak(undefined);
                  setIsBreakPopupOpen(open);
                }}
                onAddBreak={handleAddBreak}
                vendorData={currentUser ? [currentUser as CurrentUser] : []}
                popupType="hide"
                currentBreak={selectedBreak}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="media" className="border-none">
          <AccordionTrigger
            className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
          >
            Vendor Work
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex flex-col items-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleLocalFiles(e.target.files)}
              />

              {/* Image Source Modal */}
              {showImageSourceModal && (
                <ImageSourceModal
                  onClose={() => setShowImageSourceModal(false)}
                  onSelectSource={handleImageSourceSelect}
                />
              )}

              {/* Gallery Popup */}
              {showGallery && (
                <VendorWorkGallery
                  files={vendorTourMedia}
                  selectedImages={galleryImages}
                  onSave={handleSaveFromGallery}
                  onClose={() => setShowGallery(false)}
                  isOpen={showGallery}
                />
              )}

              <div className="w-full py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                <p className="font-alexandria text-[#666666] px-[10px]">
                  Add photos to gallery
                </p>
                <div className="flex flex-col items-center">
                  {dragging && (
                    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-white/20 border-2 border-dashed border-white rounded-3xl p-20 flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                        <div className="bg-[#4290E9] p-6 rounded-full shadow-2xl">
                          <DownloadIcon
                            width="48px"
                            height="48px"
                            fill="#fff"
                          />
                        </div>
                        <p className="text-3xl font-bold text-white tracking-wide">
                          Drop files here to upload
                        </p>
                        <p className="text-white/80 text-lg">
                          Support for images and high-quality photos
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Modified FileUploader to trigger source selection modal */}
                  <div
                    className="w-full max-w-[450px] h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#4290E9] transition-colors"
                    onClick={handleUploadClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Plus className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Click to upload images</p>
                    <p className="text-gray-400 text-sm mt-2">
                      or drag and drop
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                {allImagesForDisplay.length > 0 && (
                  <div className="w-full mt-8 flex justify-center">
                    <Carousel className="relative w-full max-w-[1100px]">
                      <CarouselContent>
                        {allImagesForDisplay.map((file, index) => {
                          // const fileType = file.type === 'new' ? 'local' :
                          //     file.type === 'gallery' ? 'gallery' :
                          //         'existing';

                          return (
                            <CarouselItem
                              key={file.id}
                              className="basis-1/6 flex justify-center items-center relative group"
                            >
                              <div className="relative w-[160px] h-[160px] rounded-lg overflow-hidden border border-gray-300">
                                {file.is_processing ? (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <p className="text-gray-500 font-medium text-[10px]">Processing...</p>
                                  </div>
                                ) : (
                                  <Image
                                    unoptimized
                                    src={file.url}
                                    alt={`preview-${index}`}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                                {/* Only show remove button for local and gallery images */}
                                {(file.type === "new" ||
                                  file.type === "gallery") && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFile(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                              </div>
                            </CarouselItem>
                          );
                        })}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-[-40px] top-1/2 -translate-y-1/2 z-10" />
                      <CarouselNext className="absolute right-[-40px] top-1/2 -translate-y-1/2 z-10" />
                    </Carousel>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default VendorWorkHours;
