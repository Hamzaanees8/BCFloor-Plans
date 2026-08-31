"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SaveModal } from "@/components/SaveModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CategoryDialog from "@/components/CategoryDialog";
import {
  CleanedProductOption,
  CreatePackage,
  CreateService,
  GetCategories,
  GetOneService,
  GetServices,
  UpdateService,
  UpdatePackage,
  GetOnePackage,
  PackagePayload,
  BulkUpdateProductOptionSort,
} from "../services";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Services } from "../page";
import DropdownActions from "@/components/DropdownActions";
import { HexColorPicker } from "react-colorful";
import { useUnsaved } from "@/app/context/UnsavedContext";
import useUnsavedChangesWarning from "@/app/hooks/useUnsavedChangesWarning";
import ServicesSelector from "@/components/ServicesSelector";
import { useAppContext } from "@/app/context/AppContext";

interface ProductOption {
  uuid?: string;
  title: string;
  quantity: number;
  sq_ft_range?: string;
  sq_ft_rate?: string;
  isSqFtRange: boolean;
  isSqFtRate: boolean;
  service_duration: number;
  amount: number;
  min_price: number;
  sort_order?: number;
  vendor_pay_type?: string;
  vendor_price?: number | string;
  vendor_sq_ft_rate?: number | string;
  vendor_min_price?: number | string;
  vendor_unit_rate?: number | string;
  vendor_hourly_rate?: number | string;
}
interface AddOns {
  uuid?: string;
  title: string;
  amount: number | string;
}
export interface CategoriesData {
  name: string;
  id: number;
  type: string;
  uuid: string;
  duration: boolean;
  add_ons: boolean;
  description?: string;
}

const ServicesFrom = () => {
  const [background, setBackground] = useState("ffffff");
  const [currentService, setCurrentService] = useState<Services | null>(null);
  const [services, setServices] = useState<Services[] | null>(null);
  const [categoriesData, setCategoriesData] = useState<CategoriesData[] | null>(
    null,
  );
  const [openCaegoryDialog, setOpenCaegoryDialog] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [categoryObject, setCategoryObject] = useState<CategoriesData | null>(
    null,
  );
  const [border, setBorder] = useState("000000");
  const [serviceName, setServiceName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailName, setThumbnailName] = useState<string>("");
  const [ServiceDescription, setServiceDescription] = useState("");
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [openColorPicker1, setOpenColorPicker1] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [isTravelRequired, setIsTravelRequired] = useState<boolean>(true);
  const [gstEnabled, setGstEnabled] = useState<boolean>(true);
  const [pstEnabled, setPstEnabled] = useState<boolean>(false);
  const [vendorPayType, setVendorPayType] = useState<string>("flat");
  const [vendorPrice, setVendorPrice] = useState<number | string>("");
  const [vendorSqFtRate, setVendorSqFtRate] = useState<number | string>("");
  const [vendorMinPrice, setVendorMinPrice] = useState<number | string>("");
  const [vendorUnitRate, setVendorUnitRate] = useState<number | string>("");
  const [vendorHourlyRate, setVendorHourlyRate] = useState<number | string>("");
  const [baseDurationMins, setBaseDurationMins] = useState<number | string>(60);
  const [baseSqFt, setBaseSqFt] = useState<number | string>(2000);
  const [incrementDurationMins, setIncrementDurationMins] = useState<number | string>(30);
  const [incrementSqFt, setIncrementSqFt] = useState<number | string>(1000);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef1 = useRef<HTMLDivElement | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([
    {
      title: "",
      quantity: 0,
      sq_ft_range: "",
      sq_ft_rate: "",
      service_duration: 0,
      amount: 0,
      isSqFtRange: true,
      isSqFtRate: false,
      min_price: 0,
      vendor_pay_type: "",
      vendor_price: "",
      vendor_sq_ft_rate: "",
      vendor_min_price: "",
      vendor_unit_rate: "",
      vendor_hourly_rate: "",
    },
  ]);
  const [optionSortDirection, setOptionSortDirection] = useState<
    "asc" | "desc"
  >("asc");

  // Helper to extract numerical starting square footage from sq_ft_range, sq_ft_rate, or title
  const getMinSqFtValue = (opt: any) => {
    // Determine if option is truly a Sq. Ft. Rate option (has sq_ft_rate and NO sq_ft_range)
    const hasRange = !!(
      (opt.sq_ft_range && String(opt.sq_ft_range).trim() !== "") ||
      opt.isSqFtRange
    );
    const isRate =
      !hasRange &&
      !!(
        opt.isSqFtRate ||
        (opt.sq_ft_rate !== undefined &&
          opt.sq_ft_rate !== null &&
          String(opt.sq_ft_rate).trim() !== "" &&
          String(opt.sq_ft_rate).trim() !== "0")
      );

    if (isRate) {
      const val = parseFloat(String(opt.sq_ft_rate));
      return isNaN(val) ? 0 : val;
    }

    // 1. Try sq_ft_range property if available (e.g., "0-1000", "1001-2000", "2001-3000")
    if (opt.sq_ft_range && String(opt.sq_ft_range).trim() !== "") {
      const cleanRange = String(opt.sq_ft_range).replace(/,/g, "").trim();
      const match = cleanRange.match(/\d+/g);
      if (match && match.length > 0) {
        return parseInt(match[0], 10);
      }
    }

    // 2. Fallback to extracting starting range from title (e.g. "2,001 Sq. Ft.- 3,000 Sq. Ft.", "0 - 1,000 Sq. Ft.")
    if (opt.title) {
      const cleanTitle = String(opt.title).replace(/,/g, "").trim();
      const match = cleanTitle.match(/\d+/g);
      if (match && match.length > 0) {
        return parseInt(match[0], 10);
      }
    }

    return 0;
  };

  const getSortedProductOptions = <T,>(opts: T[], dir?: "asc" | "desc"): T[] => {
    if (!opts || opts.length === 0) return opts;
    const direction = dir || optionSortDirection;

    return [...opts].sort((a: any, b: any) => {
      const aHasRange = !!(
        (a.sq_ft_range && String(a.sq_ft_range).trim() !== "") ||
        a.isSqFtRange
      );
      const aIsRate =
        !aHasRange &&
        !!(
          a.isSqFtRate ||
          (a.sq_ft_rate !== undefined &&
            a.sq_ft_rate !== null &&
            String(a.sq_ft_rate).trim() !== "" &&
            String(a.sq_ft_rate).trim() !== "0")
        );

      const bHasRange = !!(
        (b.sq_ft_range && String(b.sq_ft_range).trim() !== "") ||
        b.isSqFtRange
      );
      const bIsRate =
        !bHasRange &&
        !!(
          b.isSqFtRate ||
          (b.sq_ft_rate !== undefined &&
            b.sq_ft_rate !== null &&
            String(b.sq_ft_rate).trim() !== "" &&
            String(b.sq_ft_rate).trim() !== "0")
        );

      let cmp = 0;
      if (aIsRate && !bIsRate) {
        cmp = -1; // rate comes before range
      } else if (!aIsRate && bIsRate) {
        cmp = 1; // range comes after rate
      } else {
        const valA = getMinSqFtValue(a);
        const valB = getMinSqFtValue(b);
        cmp = valA - valB;
      }

      return direction === "asc" ? cmp : -cmp;
    });
  };
  const [addOns, setAddOns] = useState<AddOns[]>([
    {
      title: "",
      amount: 0,
    },
  ]);
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { isDirty, setIsDirty } = useUnsaved();
  useUnsavedChangesWarning(isDirty);
  const isPopulatingData = useRef(false);
  const hasInitiallyRendered = useRef(false);
  const isPackageCategory = categoryObject?.name.toLowerCase() === "package";
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (
        style.overflowX === "hidden" ||
        ancestor.classList.contains("overflow-x-hidden")
      ) {
        ancestor.style.setProperty("overflow-x", "visible", "important");
        ancestor.style.setProperty("overflow-y", "visible", "important");

        const target = ancestor;
        return () => {
          target.style.removeProperty("overflow-x");
          target.style.removeProperty("overflow-y");
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);

  const addOption = () => {
    setOptions([
      ...options,
      {
        title: "",
        quantity: 0,
        isSqFtRange: true,
        isSqFtRate: false,
        service_duration: 0,
        amount: 0,
        min_price: 0,
        vendor_pay_type: "",
        vendor_price: "",
        vendor_sq_ft_rate: "",
        vendor_min_price: "",
        vendor_unit_rate: "",
        vendor_hourly_rate: "",
      },
    ]);
  };
  const handleAddRow = () => {
    setAddOns([...addOns, { title: "", amount: 0 }]);
  };
  function updateOption(index: number, newData: ProductOption) {
    const newOptions = [...options];
    newOptions[index] = newData;
    setOptions(newOptions);
  }

  const handleMoveExistingOption = async (index: number, direction: "up" | "down") => {
    if (!currentService?.product_options) return;
    const currentList = [...currentService.product_options];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    const reordered = currentList.map((opt, i) => ({
      ...opt,
      sort_order: i + 1,
    }));

    setCurrentService((prev) => (prev ? { ...prev, product_options: reordered } : prev));
    setIsDirty(true);

    const token = localStorage.getItem("token");
    if (token && ServiceId) {
      try {
        const payload = {
          options: reordered
            .filter((o) => !!o.uuid)
            .map((o, i) => ({
              uuid: o.uuid!,
              sort_order: i + 1,
            })),
        };
        if (payload.options.length > 0) {
          await BulkUpdateProductOptionSort(payload, token);
          toast.success("Option sort order updated");
        }
      } catch (err: any) {
        console.error("Failed to update option sort order:", err);
      }
    }
  };

  const handleMoveNewOption = (index: number, direction: "up" | "down") => {
    const currentList = [...options];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    setOptions(currentList);
    setIsDirty(true);
  };

  const handleAutoSortOptions = async (direction: "asc" | "desc") => {
    setOptionSortDirection(direction);
    if (currentService?.product_options && currentService.product_options.length > 0) {
      const sortedExisting = getSortedProductOptions(currentService.product_options, direction).map((opt, i) => ({
        ...opt,
        sort_order: i + 1,
      }));
      setCurrentService((prev) => (prev ? { ...prev, product_options: sortedExisting } : prev));
      setIsDirty(true);

      const token = localStorage.getItem("token");
      if (token && ServiceId) {
        try {
          const payload = {
            options: sortedExisting
              .filter((o) => !!o.uuid)
              .map((o, i) => ({
                uuid: o.uuid!,
                sort_order: i + 1,
              })),
          };
          if (payload.options.length > 0) {
            await BulkUpdateProductOptionSort(payload, token);
            toast.success("Options auto-sorted and updated");
          }
        } catch (err: any) {
          console.error("Failed to update auto-sort order:", err);
        }
      }
    }

    if (options && options.length > 0) {
      const sortedNew = getSortedProductOptions(options, direction);
      setOptions(sortedNew);
      setIsDirty(true);
    }
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPackageParam = searchParams.get("isPackage") === "true" || searchParams.get("category")?.toLowerCase() === "package";
  const isPackage = isPackageParam;
  const params = useParams();
  const ServiceId = params?.id as string;

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    GetCategories(token)
      .then((res) => {
        const data = res.data;
        setCategoriesData(data);

        if (!ServiceId && isPackageParam) {
          const packageCat = data?.find(
            (c: CategoriesData) => c.name.toLowerCase() === "package"
          );
          if (packageCat) {
            setCategory(packageCat.id.toString());
            setCategoryObject(packageCat);
          }
        }
      })
      .catch((err) => console.log(err.message));
  }, [ServiceId, isPackageParam]);

  // Keep categoryObject in sync with category selection and categoriesData
  useEffect(() => {
    if (category && categoriesData && categoriesData.length > 0) {
      const found = categoriesData.find(
        (c: CategoriesData) => c.id.toString() === category.toString()
      );
      if (found) {
        setCategoryObject(found);
      }
    }
  }, [category, categoriesData]);

  // For create mode, mark as initially rendered after a short delay
  // This prevents browser autofill from triggering dirty state
  useEffect(() => {
    if (!ServiceId) {
      setTimeout(() => {
        hasInitiallyRendered.current = true;
      }, 500); // Longer delay to account for browser autofill
    }
  }, [ServiceId]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    GetServices(token)
      .then((res) => {
        isPopulatingData.current = true;
        const data = res.data;
        setServices(data);

        // Use setTimeout to ensure all state updates and DOM updates complete
        setTimeout(() => {
          isPopulatingData.current = false;
          hasInitiallyRendered.current = true;
        }, 100);

        setIsDirty(false);
      })
      .catch((err) => console.log(err.message));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ServiceId]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !ServiceId) {
      return;
    }

    if (isPackage) {
      GetOnePackage(token, ServiceId)
        .then((res) => {
          isPopulatingData.current = true;
          const data = res.data;

          setServiceName(data.name);
          setDiscount(data.discount);
          setIsTravelRequired(
            data.is_travel_required === true || data.is_travel_required === 1,
          );

          if (data.services && Array.isArray(data.services)) {
            setSelectedServices(
              data.services.map((s: { uuid: string }) => s.uuid),
            );
          }

          if (categoriesData) {
            const packageCat = categoriesData.find(
              (c) => c.name.toLowerCase() === "package",
            );
            if (packageCat) {
              setCategory(packageCat.id.toString());
              setCategoryObject(packageCat);
            }
          }

          // Use setTimeout to ensure all state updates and DOM updates complete
          setTimeout(() => {
            isPopulatingData.current = false;
            hasInitiallyRendered.current = true;
          }, 100);

          setIsDirty(false);
        })
        .catch((err) => console.log(err.message));
    } else {
      GetOneService(token, ServiceId)
        .then((res) => {
          isPopulatingData.current = true;
          const data = res.data;
          setCurrentService(data);
          setCategory(data.category_id);
          setServiceName(data.name);
          setBackground(data.background_color.replace(/^#/, ""));
          setBorder(data.border_color.replace(/^#/, ""));
          // setOptions(data.product_options)
          setThumbnailName(data.thumbnail);
          setServiceDescription(data.description);
          setIsTravelRequired(
            data.is_travel_required === true || data.is_travel_required === 1,
          );
          setGstEnabled(
            data.gst_enabled !== undefined ? (data.gst_enabled === true || data.gst_enabled === 1) : true
          );
          setPstEnabled(
            data.pst_enabled !== undefined ? (data.pst_enabled === true || data.pst_enabled === 1) : false
          );
          setVendorPayType(data.vendor_pay_type || "flat");
          setVendorPrice(data.vendor_price ?? "");
          setVendorSqFtRate(data.vendor_sq_ft_rate ?? "");
          setVendorMinPrice(data.vendor_min_price ?? "");
          setVendorUnitRate(data.vendor_unit_rate ?? "");
          setVendorHourlyRate(data.vendor_hourly_rate ?? "");
          setBaseDurationMins(data.base_duration_mins !== undefined && data.base_duration_mins !== null ? data.base_duration_mins : 60);
          setBaseSqFt(data.base_sq_ft !== undefined && data.base_sq_ft !== null ? data.base_sq_ft : 2000);
          setIncrementDurationMins(data.increment_duration_mins !== undefined && data.increment_duration_mins !== null ? data.increment_duration_mins : 30);
          setIncrementSqFt(data.increment_sq_ft !== undefined && data.increment_sq_ft !== null ? data.increment_sq_ft : 1000);
          if (data.product_options && data.product_options.length > 0) {
            setOptions([]);
          }
          // Use setTimeout to ensure all state updates and DOM updates complete
          setTimeout(() => {
            isPopulatingData.current = false;
            hasInitiallyRendered.current = true;
          }, 100);

          setIsDirty(false);
        })
        .catch((err) => console.log(err.message));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ServiceId, isPackage, categoriesData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        event.target instanceof Node &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpenColorPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside1(event: MouseEvent) {
      if (
        wrapperRef1.current &&
        event.target instanceof Node &&
        !wrapperRef1.current.contains(event.target)
      ) {
        setOpenColorPicker1(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside1);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside1);
    };
  }, []);

  const handleDeleteOption = (uuid?: string) => {
    if (!currentService) return;

    const updatedOptions = (currentService.product_options || []).filter(
      (option) => {
        return !(uuid && option.uuid === uuid);
      },
    );

    setCurrentService((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        product_options: updatedOptions,
      };
    });
  };
  const handleDeleteAddOn = (uuid?: string) => {
    if (!currentService) return;

    const updatedOptions = (currentService.service_add_ons || []).filter(
      (option) => {
        return !(uuid && option.uuid === uuid);
      },
    );

    setCurrentService((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        service_add_ons: updatedOptions,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token") || "";

      // For Package Category
      if (isPackageCategory) {
        const packagePayload: PackagePayload = {
          name: serviceName,
          discount: Number(discount),
          service_ids: selectedServices,
        };

        if (ServiceId) {
          await UpdatePackage(packagePayload, token, ServiceId);
          toast.success("Package updated successfully");
        } else {
          // Create package
          const createPayload = { ...packagePayload, status: 1 };
          await CreatePackage(createPayload, token);
          toast.success("Package created successfully");
        }
      }
      // For Regular Service Category
      else {
        const isOptionEmpty = (opt: any) => {
          const hasTitle = !!opt.title?.trim();
          const hasAmount =
            opt.amount !== undefined &&
            opt.amount !== null &&
            opt.amount !== "" &&
            Number(opt.amount) > 0;
          const hasMinPrice =
            opt.min_price !== undefined &&
            opt.min_price !== null &&
            opt.min_price !== "" &&
            Number(opt.min_price) > 0;
          const hasQuantity =
            opt.quantity !== undefined &&
            opt.quantity !== null &&
            opt.quantity !== "" &&
            Number(opt.quantity) > 0;
          const hasDuration =
            opt.service_duration !== undefined &&
            opt.service_duration !== null &&
            opt.service_duration !== "" &&
            Number(opt.service_duration) > 0;
          const hasSqFtRange = !!(
            opt.sq_ft_range && String(opt.sq_ft_range).trim() !== ""
          );
          const hasSqFtRate =
            opt.sq_ft_rate !== undefined &&
            opt.sq_ft_rate !== null &&
            String(opt.sq_ft_rate).trim() !== "" &&
            Number(opt.sq_ft_rate) > 0;
          const hasVendorPrice =
            opt.vendor_price !== undefined &&
            opt.vendor_price !== null &&
            opt.vendor_price !== "" &&
            Number(opt.vendor_price) > 0;
          const hasVendorPayType =
            opt.vendor_pay_type !== undefined &&
            opt.vendor_pay_type !== null &&
            opt.vendor_pay_type !== "" &&
            opt.vendor_pay_type !== "inherit";

          return (
            !hasTitle &&
            !hasAmount &&
            !hasMinPrice &&
            !hasQuantity &&
            !hasDuration &&
            !hasSqFtRange &&
            !hasSqFtRate &&
            !hasVendorPrice &&
            !hasVendorPayType
          );
        };

        const isOptionValid = (opt: any) => !isOptionEmpty(opt);

        const combinedOptions = [
          ...(currentService?.product_options || []),
          ...options,
        ];

        const cleanedProductOptions: CleanedProductOption[] = combinedOptions
          .filter(isOptionValid)
          .map((option, index) => {
            const baseOption: CleanedProductOption = {
              title: option.title,
              amount: option.amount,
              min_price: option.min_price,
              uuid: option.uuid,
              sort_order: index + 1,
              vendor_pay_type: option.vendor_pay_type && option.vendor_pay_type !== 'inherit' ? option.vendor_pay_type : undefined,
              vendor_price: option.vendor_price !== undefined && option.vendor_price !== "" ? Number(option.vendor_price) : undefined,
              vendor_sq_ft_rate: option.vendor_sq_ft_rate !== undefined && option.vendor_sq_ft_rate !== "" ? Number(option.vendor_sq_ft_rate) : undefined,
              vendor_min_price: option.vendor_min_price !== undefined && option.vendor_min_price !== "" ? Number(option.vendor_min_price) : undefined,
              vendor_unit_rate: option.vendor_unit_rate !== undefined && option.vendor_unit_rate !== "" ? Number(option.vendor_unit_rate) : undefined,
              vendor_hourly_rate: option.vendor_hourly_rate !== undefined && option.vendor_hourly_rate !== "" ? Number(option.vendor_hourly_rate) : undefined,
            };

            if (
              option.min_price !== undefined &&
              option.min_price !== null &&
              Number(option.min_price) !== 0
            ) {
              baseOption.min_price = option.min_price;
            }
            if (categoryObject?.type.includes("area")) {
              baseOption.sq_ft_rate = option.sq_ft_rate?.toString();
              baseOption.sq_ft_range = option.sq_ft_range?.toString();
            }

            if (categoryObject?.type.includes("quantity")) {
              baseOption.quantity = option.quantity;
            }

            if (Number(categoryObject?.duration) == 1) {
              baseOption.service_duration = option.service_duration;
            }

            return baseOption;
          });

        const combinedAddOns = [
          ...(currentService?.service_add_ons || []),
          ...addOns,
        ];

        const cleanedAddOns = combinedAddOns
          .filter((addon) => addon.title?.trim() !== "")
          .map((addon) => ({
            ...addon,
            amount: parseFloat(String(addon.amount ?? 0)) || 0,
          }));

        const safeBg = (background || "ffffff").replace(/^#/, "");
        const safeBorder = (border || "000000").replace(/^#/, "");
        const formattedBg = `#${safeBg.length === 6 ? safeBg : safeBg.padEnd(6, "0").slice(0, 6)}`;
        const formattedBorder = `#${safeBorder.length === 6 ? safeBorder : safeBorder.padEnd(6, "0").slice(0, 6)}`;

        const payload = {
          name: serviceName,
          category_id: category,
          description: ServiceDescription,
          background_color: formattedBg,
          border_color: formattedBorder,
          thumbnail: thumbnailFile,
          product_options: cleanedProductOptions,
          add_ons: cleanedAddOns,
          is_travel_required: isTravelRequired ? 1 : 0,
          gst_enabled: gstEnabled ? 1 : 0,
          pst_enabled: pstEnabled ? 1 : 0,
          vendor_pay_type: vendorPayType,
          vendor_price: vendorPrice !== "" ? Number(vendorPrice) : 0,
          vendor_sq_ft_rate: vendorSqFtRate !== "" ? Number(vendorSqFtRate) : undefined,
          vendor_min_price: vendorMinPrice !== "" ? Number(vendorMinPrice) : undefined,
          vendor_unit_rate: vendorUnitRate !== "" ? Number(vendorUnitRate) : undefined,
          vendor_hourly_rate: vendorHourlyRate !== "" ? Number(vendorHourlyRate) : undefined,
          base_duration_mins: baseDurationMins !== "" ? Number(baseDurationMins) : undefined,
          base_sq_ft: baseSqFt !== "" ? Number(baseSqFt) : undefined,
          increment_duration_mins: incrementDurationMins !== "" ? Number(incrementDurationMins) : undefined,
          increment_sq_ft: incrementSqFt !== "" ? Number(incrementSqFt) : undefined,
        };

        if (ServiceId) {
          await UpdateService(payload, token, ServiceId);
          toast.success("Service updated successfully");
        } else {
          await CreateService(payload, token);
          toast.success("Service created successfully");
        }
      }

      setIsDirty(false);
      router.push("/dashboard/services");
    } catch (error) {
      setIsLoading(false);
      setOpen(false);
      setFieldErrors({});

      const errObj = error as any;
      const apiErrors = errObj.response?.data?.errors || errObj.errors;

      if (apiErrors && typeof apiErrors === "object") {
        const normalizedErrors: Record<string, string[]> = {};

        Object.entries(apiErrors).forEach(([key, messages]) => {
          const normalizedKey = key.split(".")[0];
          if (!normalizedErrors[normalizedKey]) {
            normalizedErrors[normalizedKey] = [];
          }
          const msgs = Array.isArray(messages) ? messages : [messages];
          normalizedErrors[normalizedKey].push(...(msgs as string[]));
        });

        setFieldErrors(normalizedErrors);
        toast.error("Validation error kindly re-check your form");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit data");
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: roleSettings.pageBg,
        minHeight: "100vh",
        color: roleSettings.pageText,
      }}
    >
      <div className="font-alexandria pb-[80px]">
        <div
          ref={headerRef}
          className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
          style={{
            backgroundColor: headerBg,
            boxShadow: "0px 4px 4px #0000001F",
          }}
        >
          <p
            className={`text-[16px] md:text-[24px] font-[400]`}
            style={{ color: roleSettings.pageTabColor }}
          >
            {isPackage ? "Package" : "Services"} ›{" "}
            {ServiceId
              ? isPackage
                ? `Edit › ${serviceName}`
                : `Edit ${serviceName}`
              : `Create`}
          </p>
          <div className="flex gap-[18px] f">
            <Button
              disabled={isLoading}
              onClick={(e) => {
                handleSubmit(e);
              }}
              className="w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110 cursor-pointer"
              style={{
                backgroundColor: roleSettings.pageTabColor,
                borderColor: roleSettings.pageTabColor,
              }}
            >
              {isLoading ? (
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="w-[28px] h-[28px] text-gray-600 animate-spin fill-[#fff]"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
            {/* <ConfirmationDialog
                        open={confirmOpen1}
                        setOpen={setConfirmOpen1}
                        onConfirm={confirmAndExecute1}
                        showAgain={showAgain1}
                        toggleShowAgain={() => setShowAgain1(!showAgain1)}
                    /> */}
          </div>
        </div>

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
            onSubmit={(e) => {
              handleSubmit(e);
            }}
          >
            <div className="w-full flex pt-[80px] flex-col items-center">
              <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2 grid grid-cols-5 gap-2 items-start">
                    <div className="col-span-3 flex flex-col">
                      <label
                        className="col-span-1 text-sm mt-[18px]"
                        style={{ color: roleSettings.pageText }}
                      >
                        Category <span className="text-red-500">*</span>
                      </label>
                      <div className="">
                        <Select
                          value={category}
                          disabled={isPackageParam || (isPackageCategory && !ServiceId)}
                          onValueChange={(value) => {
                            setCategory(value);
                            const selected = categoriesData?.find(
                              (cat) => cat.id.toString() === value,
                            );
                            if (selected) setCategoryObject(selected);
                          }}
                        >
                          <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[12px] disabled:opacity-75 disabled:cursor-not-allowed">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoriesData?.map((category) => {
                              return (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {fieldErrors.category_id && (
                          <p className="text-red-500 text-[10px] mt-1">
                            {fieldErrors.category_id[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 h-[50%] grid-rows-2 grid-cols-2 self-end justify-self-end flex items-center">
                      {/* <p onClick={() => setOpenCaegoryDialog(true)} className='text-[#4290E9] text-[10px] font-semibold flex gap-[10px] cursor-pointer place-items-end pb-[10px]'><span className='flex bg-[#4290E9] w-[15px] h-[15px] rounded-[3px] justify-center items-center'><Plus className='text-[#F2F2F2] w-[12px]' /></span>Create New Category </p> */}
                    </div>
                  </div>
                  <div ref={wrapperRef} className="relative w-full max-w-xs">
                    <label
                      htmlFor="bgcolor"
                      className="block text-sm font-medium"
                      style={{ color: roleSettings.pageText }}
                    >
                      Color: Background <span className="text-red-500">*</span>
                    </label>

                    <div className="relative w-full mt-2">
                      {/* Left-side # symbol */}
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                        #
                      </span>

                      <Input
                        id="bgcolor"
                        value={background}
                        onFocus={() => setOpenColorPicker(true)}
                        onClick={() => setOpenColorPicker(true)}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^0-9a-fA-F]/g, "")
                            .slice(0, 6);
                          setBackground(value);
                        }}
                        className="pl-6 pr-10 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB]"
                        maxLength={6}
                      />

                      {/* Right-side color circle */}
                      <div
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-400"
                        style={{
                          backgroundColor: `#${background || "ffffff"}`,
                        }}
                      />
                    </div>

                    {openColorPicker && (
                      <div className="absolute z-10 mt-2 rounded shadow-md border border-gray-300 bg-white p-3">
                        <HexColorPicker
                          className="!w-[175px]"
                          color={`#${background || "ffffff"}`}
                          onChange={(newColor) =>
                            setBackground(newColor.replace(/^#/, ""))
                          }
                        />
                      </div>
                    )}
                    {fieldErrors.background_color && (
                      <p className="text-red-500 text-[10px] mt-1">
                        {fieldErrors.background_color[0]}
                      </p>
                    )}
                  </div>

                  <div ref={wrapperRef1} className="relative w-full max-w-xs">
                    <label
                      htmlFor="brcolor"
                      className="block text-sm font-medium"
                      style={{ color: roleSettings.pageText }}
                    >
                      Color: Border <span className="text-red-500">*</span>
                    </label>
                    <div className="relative w-full mt-2">
                      {/* Left-side # symbol */}
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                        #
                      </span>

                      {/* Input field */}
                      <Input
                        id="brcolor"
                        value={border}
                        onFocus={() => setOpenColorPicker1(true)}
                        onClick={() => setOpenColorPicker1(true)}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^0-9a-fA-F]/g, "")
                            .slice(0, 6);
                          setBorder(value);
                        }}
                        className="pl-6 pr-10 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB]"
                        maxLength={6}
                      />

                      {/* Right-side color preview circle */}
                      <div
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-400"
                        style={{ backgroundColor: `#${border || "000000"}` }}
                      />
                    </div>

                    {openColorPicker1 && (
                      <div className="absolute z-10 mt-2 rounded shadow-md border border-gray-300 bg-white p-3">
                        <HexColorPicker
                          className="!w-[175px]"
                          color={`#${border || "000000"}`}
                          onChange={(newColor) =>
                            setBorder(newColor.replace(/^#/, ""))
                          }
                        />
                      </div>
                    )}
                    {fieldErrors.border_color && (
                      <p className="text-red-500 text-[10px] mt-1">
                        {fieldErrors.border_color[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <CategoryDialog
                open={openCaegoryDialog}
                setOpen={setOpenCaegoryDialog}
                setCategoriesData={setCategoriesData}
              />
            </div>
            <Accordion
              type="multiple"
              defaultValue={["property", "statistics", "options"]}
              className="w-full space-y-4"
            >
              <AccordionItem value="property">
                <AccordionTrigger
                  className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[18px] font-[600] uppercase [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:text-current animate-none`}
                  style={{
                    backgroundColor: headerBg,
                    color: roleSettings.pageTabColor,
                  }}
                >
                  Service Detail
                </AccordionTrigger>
                <AccordionContent className="grid gap-4">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                      <div className="grid grid-cols-2 gap-[16px]">
                        <div className="col-span-2">
                          <label
                            htmlFor=""
                            style={{ color: roleSettings.pageText }}
                          >
                            Service Name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={serviceName}
                            onChange={(e) => {
                              setServiceName(e.target.value);
                            }}
                            placeholder="Enter service name here"
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                            type="text"
                          />
                          {fieldErrors.name && (
                            <p className="text-red-500 text-[10px]">
                              {fieldErrors.name[0]}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label
                            htmlFor="thumbnail"
                            className="block text-sm font-medium"
                            style={{ color: roleSettings.pageText }}
                          >
                            Thumbnail (Accepts JPG, PNG, SVG, WebP, GIF up to 20MB — Any aspect ratio)
                          </label>
                          {(thumbnailFile || currentService?.thumbnail_url) && (
                            <div className="mt-2 mb-3 flex items-center gap-3">
                              <div className="relative w-full h-[140px] rounded-md overflow-hidden border border-gray-300 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] flex items-center justify-center p-2 shadow-inner">
                                {thumbnailFile ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={URL.createObjectURL(thumbnailFile)}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-contain"
                                  />
                                ) : currentService?.thumbnail_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={currentService.thumbnail_url}
                                    alt="Saved thumbnail"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      // Hide the image on error
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : null}
                              </div>
                            </div>
                          )}

                          <div className="flex mt-[12px] rounded-[6px] ">
                            {/* File info display area */}
                            <div className="flex-grow rounded-tl-[6px] rounded-bl-[6px] bg-[#EEEEEE] border border-r-0 border-[#BBBBBB] p-2 h-[42px] flex items-center text-gray-500 text-sm truncate">
                              {thumbnailName
                                ? thumbnailName
                                : "Select a thumbnail image"}
                            </div>

                            {/* Custom styled button */}
                            <label
                              htmlFor="thumbnail"
                              className="bg-[#DDDDDD] border rounded-tr-[6px] rounded-br-[6px] border-[#666666] px-4 py-2 text-[16] font-[400] text-gray-700 hover:bg-[#CCCCCC] cursor-pointer flex items-center"
                            >
                              Browse
                            </label>

                            {/* Hidden actual file input */}
                            <input
                              id="thumbnail"
                              name="thumbnail"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setThumbnailFile(file);
                                  setThumbnailName(file.name);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label
                            htmlFor=""
                            style={{ color: roleSettings.pageText }}
                          >
                            Description
                          </label>
                          <Textarea
                            value={ServiceDescription}
                            onChange={(e) =>
                              setServiceDescription(e.target.value)
                            }
                            // placeholder={`This service covers:\n\n- Item\n- Item\n- Item\n- Item\n- Item`}
                            placeholder="Enter service description here"
                            className="w-full resize-none h-[200px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          />
                          {fieldErrors.description && (
                            <p className="text-red-500 text-[10px]">
                              {fieldErrors.description[0]}
                            </p>
                          )}
                        </div>
                        {categoryObject?.name.toLowerCase() !== "package" && (
                          <>
                            <div className="col-span-2 flex items-center justify-between">
                              <label
                                htmlFor="is_travel_required"
                                className="text-sm font-medium"
                                style={{ color: roleSettings.pageText }}
                              >
                                Requires travel scheduling
                              </label>
                              <Switch
                                id="is_travel_required"
                                checked={isTravelRequired}
                                onCheckedChange={setIsTravelRequired}
                                className="bg-gray-300 data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-red-500"
                              />
                            </div>

                            <div className="col-span-2 pt-4 border-t border-[#BBBBBB] flex flex-col gap-3">
                              <label
                                className="text-sm font-semibold"
                                style={{ color: roleSettings.pageText }}
                              >
                                Sales Tax Settings
                              </label>
                              <p className="text-[12px] text-[#666666]">
                                Select which sales taxes apply to this service (e.g., in British Columbia, some services are GST only while others are GST + PST).
                              </p>
                              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-1">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    id="gst_enabled"
                                    checked={gstEnabled}
                                    onCheckedChange={setGstEnabled}
                                    className="bg-gray-300 data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-gray-400"
                                  />
                                  <label
                                    htmlFor="gst_enabled"
                                    className="text-sm font-medium cursor-pointer"
                                    style={{ color: roleSettings.pageText }}
                                  >
                                    Apply GST (5%)
                                  </label>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Switch
                                    id="pst_enabled"
                                    checked={pstEnabled}
                                    onCheckedChange={setPstEnabled}
                                    className="bg-gray-300 data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-gray-400"
                                  />
                                  <label
                                    htmlFor="pst_enabled"
                                    className="text-sm font-medium cursor-pointer"
                                    style={{ color: roleSettings.pageText }}
                                  >
                                    Apply PST (7%)
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="col-span-2 pt-4 border-t border-[#BBBBBB] flex flex-col gap-3">
                              <label
                                className="text-sm font-semibold"
                                style={{ color: roleSettings.pageText }}
                              >
                                Vendor Pay Defaults
                              </label>
                              <p className="text-[12px] text-[#666666]">
                                Configure the master default reimbursement rate for this service (e.g. flat pay, per sq. ft. rate with a minimum, or hourly rate).
                              </p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                                <div>
                                  <label className="text-xs font-medium text-gray-700">Pay Model</label>
                                  <Select
                                    value={vendorPayType}
                                    onValueChange={(val) => setVendorPayType(val)}
                                  >
                                    <SelectTrigger className="w-full h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] mt-1">
                                      <SelectValue placeholder="Select Pay Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="flat">Flat Rate ($)</SelectItem>
                                      <SelectItem value="per_sq_ft">Per Sq. Ft. ($/sq.ft)</SelectItem>
                                      <SelectItem value="per_unit">Per Unit ($/unit)</SelectItem>
                                      <SelectItem value="hourly">Hourly Rate ($/hr)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {vendorPayType === "flat" && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Default Payout ($)</label>
                                    <div className="relative mt-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="e.g. 75.00"
                                        value={vendorPrice}
                                        onChange={(e) => setVendorPrice(e.target.value)}
                                        className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] pr-7"
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                    </div>
                                  </div>
                                )}

                                {vendorPayType === "per_sq_ft" && (
                                  <>
                                    <div>
                                      <label className="text-xs font-medium text-gray-700">Rate per Sq. Ft. ($)</label>
                                      <div className="relative mt-1">
                                        <Input
                                          type="number"
                                          step="0.0001"
                                          min="0"
                                          placeholder="e.g. 0.05"
                                          value={vendorSqFtRate}
                                          onChange={(e) => setVendorSqFtRate(e.target.value)}
                                          className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] pr-7"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-700">Minimum Pay Guarantee ($)</label>
                                      <div className="relative mt-1">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="e.g. 60.00"
                                          value={vendorMinPrice}
                                          onChange={(e) => setVendorMinPrice(e.target.value)}
                                          className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] pr-7"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {vendorPayType === "per_unit" && (
                                  <>
                                    <div>
                                      <label className="text-xs font-medium text-gray-700">Rate per Unit ($)</label>
                                      <div className="relative mt-1">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="e.g. 25.00"
                                          value={vendorUnitRate}
                                          onChange={(e) => setVendorUnitRate(e.target.value)}
                                          className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] pr-7"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-700">Minimum Pay Guarantee ($)</label>
                                      <div className="relative mt-1">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="e.g. 50.00"
                                          value={vendorMinPrice}
                                          onChange={(e) => setVendorMinPrice(e.target.value)}
                                          className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] pr-7"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {vendorPayType === "hourly" && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Hourly Rate ($/hr)</label>
                                    <div className="relative mt-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="e.g. 45.00"
                                        value={vendorHourlyRate}
                                        onChange={(e) => setVendorHourlyRate(e.target.value)}
                                        className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] pr-7"
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="col-span-2 pt-4 border-t border-[#BBBBBB] flex flex-col gap-3">
                              <label
                                className="text-sm font-semibold"
                                style={{ color: roleSettings.pageText }}
                              >
                                Service Duration & Time Increment Rules
                              </label>
                              <p className="text-[12px] text-[#666666]">
                                Configure base service duration and incremental time required for extra square footage (e.g. +30 mins for every 1,000 sq. ft. above 2,000 sq. ft.).
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                                <div>
                                  <label className="text-xs font-medium text-gray-700">Base Duration (Mins)</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 60"
                                    value={baseDurationMins}
                                    onChange={(e) => setBaseDurationMins(e.target.value)}
                                    className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] mt-1"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-gray-700">Base Sq. Ft.</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 2000"
                                    value={baseSqFt}
                                    onChange={(e) => setBaseSqFt(e.target.value)}
                                    className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] mt-1"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-gray-700">Time Increment (Mins)</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 30"
                                    value={incrementDurationMins}
                                    onChange={(e) => setIncrementDurationMins(e.target.value)}
                                    className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] mt-1"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-gray-700">Sq. Ft. Increment Step</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 1000"
                                    value={incrementSqFt}
                                    onChange={(e) => setIncrementSqFt(e.target.value)}
                                    className="h-[40px] bg-[#EEEEEE] border border-[#BBBBBB] mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        {categoryObject?.name.toLocaleLowerCase() ===
                          "package" && (
                          <div className="w-full col-span-2">
                            <div className="w-full">
                              <label htmlFor="">
                                Discount <span className="text-red-500">*</span>
                              </label>
                              <Input
                                type="number"
                                min={-1} // allows clearing the input without defaulting to 0
                                placeholder="Discount (Percentage)"
                                className="px-3  w-full h-[42px] bg-[#eee] border border-[#BBBBBB] mt-[10px]"
                                value={discount <= 0 ? "" : discount} // use your discount state here
                                onChange={(e) => {
                                  const val = e.target.value;

                                  if (val === "") {
                                    setDiscount(0); // or null depending on your logic
                                    return;
                                  }

                                  const parsed = parseInt(val, 10);
                                  if (!isNaN(parsed) && parsed > 0) {
                                    setDiscount(parsed);
                                  }
                                }}
                              />
                            </div>
                            <div className="w-full mt-[16px] ">
                              <label htmlFor="">
                                Add Services{" "}
                                <span className="text-red-500">*</span>
                              </label>

                              <div className="w-full">
                                <ServicesSelector
                                  servicesData={services}
                                  services={selectedServices}
                                  setServices={setSelectedServices}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {categoryObject?.name.toLocaleLowerCase() !== "package" && (
                <AccordionItem value="options" className="relative group !mt-0">
                  <div className="absolute right-[75px] top-[14px] group-data-[state=closed]:hidden flex items-center gap-[12px]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAutoSortOptions(
                          optionSortDirection === "asc" ? "desc" : "asc",
                        )
                      }
                      className="flex items-center gap-1.5 text-xs font-semibold h-[32px] px-3 bg-white border border-[#BBBBBB] hover:bg-gray-100 shadow-sm"
                      title="Auto-sort by Sq. Ft. (Rate first, then Range)"
                    >
                      {optionSortDirection === "asc" ? (
                        <>
                          <ArrowUp className="w-3.5 h-3.5 text-[#4290E9]" />
                          <span>Auto-sort (Low to High)</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="w-3.5 h-3.5 text-[#4290E9]" />
                          <span>Auto-sort (High to Low)</span>
                        </>
                      )}
                    </Button>
                    <p
                      onClick={addOption}
                      className="flex gap-[10px] cursor-pointer items-center font-semibold"
                      style={{ color: roleSettings.pageTabColor }}
                    >
                      Add
                      <span
                        className="flex w-[18px] h-[18px] rounded-[3px] justify-center items-center"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                      >
                        <Plus className="text-[#F2F2F2] w-[12px]" />
                      </span>{" "}
                    </p>
                  </div>
                  <AccordionTrigger
                    className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[18px] font-[600] uppercase [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:text-current animate-none`}
                    style={{
                      backgroundColor: headerBg,
                      color: roleSettings.pageTabColor,
                    }}
                  >
Product Options{" "}
                  </AccordionTrigger>
                  <AccordionContent className="grid gap-4 !pb-0 overflow-x-auto">
                    <div className="w-full flex flex-col items-center mb-[40px]">
                      <Table className='font-alexandria !overflow-x-auto whitespace-nowrap min-w-[800px]"'>
                        <TableHeader style={{ backgroundColor: headerBg }}>
                          <TableRow className="border-b-[1px] border-[#BBBBBB]">
                            <TableHead className="text-[14px] font-bold w-[75px]">
                              ORDER
                            </TableHead>
                            <TableHead className="text-[14px] font-bold">
                              TITLE <span className="text-red-500">*</span>
                            </TableHead>
                            {categoryObject?.type.includes("quantity") && (
                              <TableHead className="text-[14px] font-bold">
                                QUANTITY
                              </TableHead>
                            )}
                            {categoryObject?.type.includes("area") && (
                              <TableHead className="text-[14px] font-bold">
                                SQ. FT.
                              </TableHead>
                            )}
                            {Number(categoryObject?.duration) == 1 && (
                              <TableHead className="text-[14px] font-bold">
                                SERVICE DURATION (Mins)
                              </TableHead>
                            )}
                            {/* <TableHead className="text-[14px] font-bold">MIN PRICE</TableHead> */}
                            <TableHead className="text-[14px] font-bold">
                              MIN PRICE ($ CAD)
                            </TableHead>
                            <TableHead className="text-[14px] font-bold">
                              AMOUNT ($ CAD)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(currentService?.product_options || []).map((opt, idx) => (
                            <TableRow className="py-4" key={opt.uuid || idx}>
                              <TableCell className="w-[75px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-gray-500 w-[18px]">
                                    #{idx + 1}
                                  </span>
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveExistingOption(idx, "up")}
                                      className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed text-gray-700"
                                      title="Move Option Up"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === (currentService?.product_options?.length ?? 1) - 1}
                                      onClick={() => handleMoveExistingOption(idx, "down")}
                                      className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed text-gray-700"
                                      title="Move Option Down"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Label className=" text-[15px] font-[400] text-[#666666] pl-[7px]">
                                  {opt?.title}
                                </Label>
                              </TableCell>
                              {categoryObject?.type.includes("quantity") && (
                                <TableCell>
                                  <Label className=" text-[15px] font-[400] text-[#666666]">
                                    {opt?.quantity == 0 ? "-" : opt?.quantity}
                                  </Label>
                                </TableCell>
                              )}
                              {categoryObject?.type.includes("area") && (
                                <TableCell className="">
                                  <div className="flex justify-start items-center">
                                    <Label className=" flex text-[15px] font-[400] text-[#666666] w-1/2">
                                      {opt.sq_ft_range &&
                                      String(opt.sq_ft_range).trim() !== ""
                                        ? opt.sq_ft_range
                                        : opt.sq_ft_rate !== undefined &&
                                            opt.sq_ft_rate !== null
                                          ? opt.sq_ft_rate
                                          : ""}
                                    </Label>
                                    <Label className=" flex text-[15px] font-[400] text-[#666666]">
                                      {opt.sq_ft_range &&
                                      String(opt.sq_ft_range).trim() !== ""
                                        ? "Sq. ft. Range"
                                        : "Sq. ft. Rate"}
                                    </Label>
                                  </div>
                                </TableCell>
                              )}

                              {Number(categoryObject?.duration) == 1 && (
                                <TableCell>
                                  <Label className=" text-[15px] font-[400] text-[#666666]">
                                    {opt.service_duration &&
                                    opt.service_duration != 0
                                      ? opt.service_duration + " Mins"
                                      : "-"}
                                  </Label>
                                </TableCell>
                              )}

                              <TableCell>
                                <Label className=" text-[15px] font-[400] text-[#666666]">
                                  {opt.min_price && opt.min_price
                                    ? "$" + opt.min_price
                                    : "-"}
                                </Label>
                              </TableCell>
                              <TableCell className="">
                                <div className="flex justify-between items-center">
                                  <div className="flex flex-col gap-0.5">
                                    <Label className="text-[15px] font-[400] text-[#666666] flex items-center">
                                      ${opt.amount}
                                    </Label>
                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      <span className="font-medium text-gray-500">Payout:</span>
                                      {opt.vendor_price !== undefined && opt.vendor_price !== null && Number(opt.vendor_price) > 0 ? (
                                        <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                          ${Number(opt.vendor_price).toFixed(2)} ({opt.vendor_pay_type || 'flat'})
                                        </span>
                                      ) : opt.vendor_sq_ft_rate !== undefined && opt.vendor_sq_ft_rate !== null && Number(opt.vendor_sq_ft_rate) > 0 ? (
                                        <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                          ${opt.vendor_sq_ft_rate}/sq.ft
                                        </span>
                                      ) : vendorPrice && Number(vendorPrice) > 0 ? (
                                        <span className="text-gray-400 italic">
                                          Default (${Number(vendorPrice).toFixed(2)})
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">Default</span>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownActions
                                    options={[
                                      {
                                        label: "Edit",
                                        onClick: () => {
                                          const { ...rest } = opt;
                                          setOptions((prev) => {
                                            const emptyIndex = prev.findIndex(
                                              (row) =>
                                                !row.title &&
                                                (!row.quantity ||
                                                  row.quantity === 0) &&
                                                (!row.amount ||
                                                  row.amount === 0) &&
                                                (!row.service_duration ||
                                                  row.service_duration === 0) &&
                                                (!row.min_price ||
                                                  row.min_price === 0) &&
                                                (!row.sq_ft_rate ||
                                                  row.sq_ft_rate === "") &&
                                                (!row.sq_ft_range ||
                                                  row.sq_ft_range === "") &&
                                                (!row.vendor_price ||
                                                  row.vendor_price === "") &&
                                                (!row.vendor_pay_type ||
                                                  row.vendor_pay_type === ""),
                                            );

                                            const newOption = {
                                              ...rest,
                                              title: opt.title ?? "",
                                              quantity: opt.quantity ?? 0,
                                              amount: opt.amount ?? 0,
                                              min_price: opt.min_price ?? 0,
                                              service_duration:
                                                opt.service_duration ?? 0,
                                              sq_ft_rate:
                                                opt.sq_ft_rate?.toString() ??
                                                "",
                                              sq_ft_range:
                                                opt.sq_ft_range?.toString() ??
                                                "",
                                              isSqFtRate: !!opt.sq_ft_rate,
                                              isSqFtRange: !!opt.sq_ft_range,
                                              vendor_pay_type: opt.vendor_pay_type ?? "",
                                              vendor_price: opt.vendor_price ?? "",
                                              vendor_sq_ft_rate: opt.vendor_sq_ft_rate ?? "",
                                              vendor_min_price: opt.vendor_min_price ?? "",
                                              vendor_unit_rate: opt.vendor_unit_rate ?? "",
                                              vendor_hourly_rate: opt.vendor_hourly_rate ?? "",
                                            };

                                            // If an empty row is found, replace it
                                            if (emptyIndex !== -1) {
                                              const updated = [...prev];
                                              updated[emptyIndex] = newOption;
                                              return updated;
                                            }

                                            // Else, add new row
                                            return [...prev, newOption];
                                          });

                                          const updatedOptions = (
                                            currentService?.product_options || []
                                          ).filter((option) => {
                                            return !(
                                              opt.uuid &&
                                              option.uuid === opt.uuid
                                            );
                                          });

                                          setCurrentService((prev) => {
                                            if (!prev) return prev;
                                            return {
                                              ...prev,
                                              product_options: updatedOptions,
                                            };
                                          });
                                        },
                                      },
                                      {
                                        label: "Delete",
                                        onClick: () =>
                                          handleDeleteOption(opt.uuid),
                                      },
                                    ]}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}

                          {options.map((opt, idx) => (
                            <React.Fragment key={idx}>
                            <TableRow
                              className="text-[#666666] text-[14px] !border-b-0 "
                            >
                              <TableCell className="w-[75px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-gray-500 w-[18px]">
                                    #{(currentService?.product_options?.length ?? 0) + idx + 1}
                                  </span>
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveNewOption(idx, "up")}
                                      className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed text-gray-700"
                                      title="Move Option Up"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === options.length - 1}
                                      onClick={() => handleMoveNewOption(idx, "down")}
                                      className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed text-gray-700"
                                      title="Move Option Down"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="pl-[15px]">
                                {/* <Label className='font-bold'>TITLE</Label> */}
                                <Input
                                  className="w-[192px] h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[10px]"
                                  value={opt.title}
                                  onChange={(e) =>
                                    updateOption(idx, {
                                      ...opt,
                                      title: e.target.value,
                                    })
                                  }
                                />
                                {fieldErrors[
                                  `product_options.${
                                    (currentService?.product_options?.length ??
                                      0) + idx
                                  }.title`
                                ] && (
                                  <p className="text-red-500 text-[10px] mt-1">
                                    {
                                      fieldErrors[
                                        `product_options.${
                                          (currentService?.product_options
                                            ?.length ?? 0) + idx
                                        }.title`
                                      ][0]
                                    }
                                  </p>
                                )}
                              </TableCell>
                              {categoryObject?.type.includes("quantity") && (
                                <TableCell>
                                  {/* <Label className='font-bold'>QUANTITY</Label> */}
                                  <Input
                                    type="number"
                                    min="0"
                                    className="w-[192px] h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[10px]"
                                    value={
                                      opt.quantity === 0 ? "" : opt.quantity
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;

                                      if (val === "") {
                                        updateOption(idx, {
                                          ...opt,
                                          quantity: 0, // temporary placeholder — or consider using `null`
                                        });
                                        return;
                                      }

                                      const parsed = parseInt(val, 10);

                                      if (!isNaN(parsed) && parsed > 0) {
                                        updateOption(idx, {
                                          ...opt,
                                          quantity: parsed,
                                        });
                                      }
                                    }}
                                  />
                                  {fieldErrors[
                                    `product_options.${
                                      (currentService?.product_options
                                        ?.length ?? 0) + idx
                                    }.quantity`
                                  ] && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                      {
                                        fieldErrors[
                                          `product_options.${
                                            (currentService?.product_options
                                              ?.length ?? 0) + idx
                                          }.quantity`
                                        ][0]
                                      }
                                    </p>
                                  )}
                                </TableCell>
                              )}
                              {categoryObject?.type.includes("area") && (
                                <TableCell className="">
                                  {/* Input section: col 1, spans both rows */}
                                  {/* <Label className="font-bold col-start-1">SQ. FT.</Label> */}
                                  <div className=" flex flex-row justify-start gap-[10px] h-[42px] mt-[10px]">
                                    {opt.isSqFtRange && (
                                      <Input
                                        type="text"
                                        placeholder="Sq. Ft. Range"
                                        value={opt.sq_ft_range || ""}
                                        className="w-[192px] h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] col-start-2"
                                        onChange={(e) =>
                                          updateOption(idx, {
                                            ...opt,
                                            sq_ft_range: e.target.value,
                                          })
                                        }
                                      />
                                    )}
                                    {fieldErrors[
                                      `product_options.${
                                        (currentService?.product_options
                                          ?.length ?? 0) + idx
                                      }.sq_ft_range`
                                    ] && (
                                      <p className="text-red-500 text-[10px] mt-1">
                                        {
                                          fieldErrors[
                                            `product_options.${
                                              (currentService?.product_options
                                                ?.length ?? 0) + idx
                                            }.sq_ft_range`
                                          ][0]
                                        }
                                      </p>
                                    )}
                                    {opt.isSqFtRate && (
                                      <Input
                                        type="text"
                                        placeholder="Sq. Ft. Rate"
                                        value={opt.sq_ft_rate || ""}
                                        className="w-[192px] h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] col-start-2"
                                        onChange={(e) =>
                                          updateOption(idx, {
                                            ...opt,
                                            sq_ft_rate: e.target.value,
                                          })
                                        }
                                      />
                                    )}
                                    {fieldErrors[
                                      `product_options.${
                                        (currentService?.product_options
                                          ?.length ?? 0) + idx
                                      }.sq_ft_rate`
                                    ] && (
                                      <p className="text-red-500 text-[10px] mt-1">
                                        {
                                          fieldErrors[
                                            `product_options.${
                                              (currentService?.product_options
                                                ?.length ?? 0) + idx
                                            }.sq_ft_rate`
                                          ][0]
                                        }
                                      </p>
                                    )}
                                    <div className=" flex flex-col gap-0">
                                      <label className="flex items-center gap-1 text-[14px] font-[700]">
                                        <Input
                                          type="radio"
                                          name={`sq_ft_type_${idx}`}
                                          checked={opt.isSqFtRange}
                                          className="w-[16px] h-[16px]"
                                          onChange={() =>
                                            updateOption(idx, {
                                              ...opt,
                                              isSqFtRange: true,
                                              isSqFtRate: false,
                                            })
                                          }
                                        />
                                        SQ. FT. RANGE
                                      </label>
                                      <label className="flex items-center gap-1 text-[14px] font-[700]">
                                        <Input
                                          type="radio"
                                          name={`sq_ft_type_${idx}`}
                                          checked={opt.isSqFtRate}
                                          className="w-[16px] h-[16px]"
                                          onChange={() =>
                                            updateOption(idx, {
                                              ...opt,
                                              isSqFtRange: false,
                                              isSqFtRate: true,
                                            })
                                          }
                                        />
                                        SQ. FT. RATE
                                      </label>
                                    </div>
                                  </div>

                                  {/* Radio buttons section: col 2, row 2 only */}
                                </TableCell>
                              )}

                              {Number(categoryObject?.duration) == 1 && (
                                <TableCell>
                                  {/* <Label className='font-bold'>SERVICE DURATION</Label> */}
                                  <Input
                                    type="number"
                                    min={-1} // allows clearing the input without defaulting to 0
                                    placeholder="Duration (Mins)"
                                    className="w-[192px] h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[10px]"
                                    value={
                                      opt.service_duration <= 0
                                        ? ""
                                        : opt.service_duration
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;

                                      if (val === "") {
                                        updateOption(idx, {
                                          ...opt,
                                          service_duration: 0, // or null, depending on your app logic
                                        });
                                        return;
                                      }

                                      const parsed = parseInt(val, 10);
                                      if (!isNaN(parsed) && parsed > 0) {
                                        updateOption(idx, {
                                          ...opt,
                                          service_duration: parsed,
                                        });
                                      }
                                    }}
                                  />

                                  {fieldErrors[
                                    `product_options.${
                                      (currentService?.product_options
                                        ?.length ?? 0) + idx
                                    }.service_duration`
                                  ] && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                      {
                                        fieldErrors[
                                          `product_options.${
                                            (currentService?.product_options
                                              ?.length ?? 0) + idx
                                          }.service_duration`
                                        ][0]
                                      }
                                    </p>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0} // optional, change if negative allowed
                                  step="0.001" // allows decimal input
                                  className="w-[100px] h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[10px]"
                                  value={
                                    opt.min_price <= 0 ? "" : opt.min_price
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;

                                    if (val === "") {
                                      updateOption(idx, {
                                        ...opt,
                                        min_price: 0,
                                      });
                                      return;
                                    }

                                    const parsed = parseFloat(val); // <-- use parseFloat instead of parseInt
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      updateOption(idx, {
                                        ...opt,
                                        min_price: parsed,
                                      });
                                    }
                                  }}
                                  placeholder="Min Price"
                                />
                              </TableCell>

                              <TableCell className="flex justify-between items-center">
                                {/* <Label className='font-bold'>AMOUNT</Label> */}
                                <Input
                                  type="number"
                                  min={0} // allows 0 and up
                                  step="0.01" // allows decimals like 0.03
                                  className="w-[80px] h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[10px]"
                                  value={opt.amount === undefined || opt.amount === null ? "" : opt.amount}
                                  onChange={(e) => {
                                    const val = e.target.value;

                                    if (val === "") {
                                      updateOption(idx, {
                                        ...opt,
                                        amount: 0, // or null if you want to treat empty as no value
                                      });
                                      return;
                                    }

                                    const parsed = parseFloat(val);

                                    // Accept only positive values including 0
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      updateOption(idx, {
                                        ...opt,
                                          amount: parsed,
                                      });
                                    }
                                  }}
                                />
                                {!opt.uuid && (
                                  <DropdownActions
                                    options={[
                                      {
                                        label: "Delete",
                                        onClick: () => {
                                          const updatedOptions = options.filter(
                                            (_, i) => i !== idx,
                                          );
                                          setOptions(updatedOptions);
                                        },
                                      },
                                    ]}
                                  />
                                )}

                                {fieldErrors[
                                  `product_options.${
                                    (currentService?.product_options?.length ??
                                      0) + idx
                                  }.amount`
                                ] && (
                                  <p className="text-red-500 text-[10px]">
                                    {
                                      fieldErrors[
                                        `product_options.${
                                          (currentService?.product_options
                                            ?.length ?? 0) + idx
                                        }.amount`
                                      ][0]
                                    }
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>

                            {/* Sub-Row 2: Dedicated Vendor Payout Configuration */}
                            <TableRow key={`payout-${idx}`} className="bg-blue-50/40 hover:bg-blue-50/60 border-b border-[#BBBBBB]">
                              <TableCell colSpan={4 + (categoryObject?.type.includes("quantity") ? 1 : 0) + (categoryObject?.type.includes("area") ? 1 : 0) + (Number(categoryObject?.duration) == 1 ? 1 : 0)} className="py-2.5 px-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 font-bold text-[#4290E9] bg-white border border-blue-200 px-2.5 py-1 rounded shadow-sm">
                                      <span>👤 Option Vendor Payout:</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <label className="font-semibold text-gray-700">Model:</label>
                                      <Select
                                        value={opt.vendor_pay_type || "inherit"}
                                        onValueChange={(val) =>
                                          updateOption(idx, {
                                            ...opt,
                                            vendor_pay_type: val === "inherit" ? "" : val,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="w-[155px] h-[36px] bg-white border border-[#BBBBBB] text-xs">
                                          <SelectValue placeholder="Inherit Default" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="inherit">Inherit Default ({vendorPayType === 'flat' ? 'Flat' : vendorPayType === 'per_sq_ft' ? 'Per Sq.Ft.' : vendorPayType === 'per_unit' ? 'Per Unit' : 'Hourly'})</SelectItem>
                                          <SelectItem value="flat">Flat Rate ($)</SelectItem>
                                          <SelectItem value="per_sq_ft">Per Sq. Ft.</SelectItem>
                                          <SelectItem value="per_unit">Per Unit</SelectItem>
                                          <SelectItem value="hourly">Hourly</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {(opt.vendor_pay_type === 'flat' || opt.vendor_pay_type === 'per_unit' || opt.vendor_pay_type === 'hourly' || !opt.vendor_pay_type || opt.vendor_pay_type === 'inherit') && (
                                      <div className="flex items-center gap-1.5">
                                        <label className="font-semibold text-gray-700">
                                          {opt.vendor_pay_type === 'hourly' ? 'Rate ($/hr):' : opt.vendor_pay_type === 'per_unit' ? 'Rate ($/unit):' : 'Payout ($):'}
                                        </label>
                                        <div className="relative">
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={vendorPrice ? `${vendorPrice} (Default)` : "0.00"}
                                            value={opt.vendor_price ?? ""}
                                            onChange={(e) =>
                                              updateOption(idx, {
                                                ...opt,
                                                vendor_price: e.target.value,
                                              })
                                            }
                                            className="w-[125px] h-[36px] bg-white border border-[#BBBBBB] text-xs pr-6"
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        </div>
                                      </div>
                                    )}

                                    {opt.vendor_pay_type === 'per_sq_ft' && (
                                      <>
                                        <div className="flex items-center gap-1.5">
                                          <label className="font-semibold text-gray-700">Rate ($/sq.ft):</label>
                                          <Input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            placeholder={vendorSqFtRate ? `${vendorSqFtRate} (Default)` : "0.05"}
                                            value={opt.vendor_sq_ft_rate ?? ""}
                                            onChange={(e) =>
                                              updateOption(idx, {
                                                ...opt,
                                                vendor_sq_ft_rate: e.target.value,
                                              })
                                            }
                                            className="w-[120px] h-[36px] bg-white border border-[#BBBBBB] text-xs"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <label className="font-semibold text-gray-700">Min Guarantee ($):</label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={vendorMinPrice ? `${vendorMinPrice} (Default)` : "60.00"}
                                            value={opt.vendor_min_price ?? ""}
                                            onChange={(e) =>
                                              updateOption(idx, {
                                                ...opt,
                                                vendor_min_price: e.target.value,
                                              })
                                            }
                                            className="w-[120px] h-[36px] bg-white border border-[#BBBBBB] text-xs"
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-gray-500 italic">
                                    {!opt.vendor_price && !opt.vendor_sq_ft_rate && (
                                      <span>Inherits service default ({vendorPayType === 'flat' ? `Flat $${Number(vendorPrice || 0).toFixed(2)}` : vendorPayType})</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                            </React.Fragment>
                          ))}

                          {fieldErrors.product_options && (
                            <p className="text-red-500 text-[10px] mt-1 ml-[20px]">
                              {fieldErrors.product_options[0]}
                            </p>
                          )}
                        </TableBody>
                      </Table>
                      {(!isPackage && categoryObject?.name?.toLowerCase() !== "package") && (
                        <div className="w-full">
                          <hr />
                          <div className="flex justify-between items-center px-[20px]">
                            <h1
                              className="flex text-center text-[18px] my-[20px] font-semibold"
                              style={{ color: roleSettings.pageTabColor }}
                            >
                              ADD ONS
                            </h1>
                            <p
                              onClick={handleAddRow}
                              className="flex gap-[10px] cursor-pointer items-center  group-data-[state=closed]:hidden font-semibold"
                              style={{ color: roleSettings.pageTabColor }}
                            >
                              Add
                              <span
                                className="flex w-[18px] h-[18px] rounded-[3px] justify-center items-center"
                                style={{
                                  backgroundColor: roleSettings.pageTabColor,
                                }}
                              >
                                <Plus className="text-[#F2F2F2] w-[12px]" />
                              </span>{" "}
                            </p>
                          </div>
                          <Table>
                            <TableHeader
                              className="text-[#666666]"
                              style={{ backgroundColor: headerBg }}
                            >
                              <TableRow>
                                <TableCell className="text-[14px] font-bold pl-[15px]">
                                  TITLE
                                </TableCell>
                                <TableCell className="text-[14px] font-bold pl-[15px]">
                                  AMOUNT ($ CAD)
                                </TableCell>
                              </TableRow>
                            </TableHeader>
                            {currentService?.service_add_ons.map((opt, idx) => (
                              <TableRow className="py-4" key={idx}>
                                <TableCell>
                                  <Label className=" text-[15px] font-[400] text-[#666666] pl-[7px]">
                                    {opt?.title}
                                  </Label>
                                </TableCell>

                                <TableCell className="flex justify-between items-center px-[20px]">
                                  <Label className=" text-[15px] font-[400] text-[#666666]">
                                    ${Number(opt?.amount || 0).toFixed(2)} CAD
                                  </Label>
                                  <DropdownActions
                                    options={[
                                      {
                                        label: "Edit",
                                        onClick: () => {
                                          const { ...rest } = opt;
                                          setAddOns((prev) => {
                                            const emptyIndex = prev.findIndex(
                                              (row) =>
                                                !row.title &&
                                                (!row.amount ||
                                                  row.amount === 0),
                                            );

                                            const newOption = {
                                              ...rest,
                                              title: opt.title ?? "",
                                              amount: opt.amount ?? 0,
                                            };

                                            // If an empty row is found, replace it
                                            if (emptyIndex !== -1) {
                                              const updated = [...prev];
                                              updated[emptyIndex] = newOption;
                                              return updated;
                                            }

                                            // Else, add new row
                                            return [...prev, newOption];
                                          });

                                          const updatedOptions = (
                                            currentService.service_add_ons || []
                                          ).filter((option) => {
                                            return !(
                                              opt.uuid &&
                                              option.uuid === opt.uuid
                                            );
                                          });

                                          setCurrentService((prev) => {
                                            if (!prev) return prev;
                                            return {
                                              ...prev,
                                              service_add_ons: updatedOptions,
                                            };
                                          });
                                        },
                                      },
                                      {
                                        label: "Delete",
                                        onClick: () =>
                                          handleDeleteAddOn(opt.uuid),
                                      },
                                    ]}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                            {addOns.map((addOn, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Input
                                    className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB]"
                                    placeholder="Enter Add On title"
                                    value={addOn.title}
                                    onChange={(e) => {
                                      const newAddOns = [...addOns];
                                      newAddOns[index].title = e.target.value;
                                      setAddOns(newAddOns);
                                    }}
                                  />
                                  {fieldErrors[
                                    `add_ons.${
                                      (currentService?.service_add_ons?.length ?? 0) + index
                                    }.title`
                                  ] && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                      {
                                        fieldErrors[
                                          `add_ons.${
                                            (currentService?.service_add_ons?.length ?? 0) + index
                                          }.title`
                                        ][0]
                                      }
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell className="">
                                  <div className="w-full flex justify-between items-center">
                                    <Input
                                      className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB]"
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      value={
                                        addOn.amount === undefined || addOn.amount === null ? "" : addOn.amount
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const newAddOns = [...addOns];
                                        newAddOns[index].amount = val;
                                        setAddOns(newAddOns);
                                      }}
                                    />
                                    {addOns.length > 1 && !addOn.uuid && (
                                      <DropdownActions
                                        options={[
                                          {
                                            label: "Delete",
                                            onClick: () => {
                                              const updatedAddons =
                                                addOns?.filter(
                                                  (_, i) => i !== index,
                                                );
                                              setAddOns(updatedAddons);
                                            },
                                          },
                                        ]}
                                      />
                                    )}
                                  </div>
                                  {fieldErrors[
                                    `add_ons.${
                                      (currentService?.service_add_ons?.length ?? 0) + index
                                    }.amount`
                                  ] && (
                                    <p className="text-red-500 text-[10px] mt-1">
                                      {
                                        fieldErrors[
                                          `add_ons.${
                                            (currentService?.service_add_ons?.length ?? 0) + index
                                          }.amount`
                                        ][0]
                                      }
                                    </p>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </Table>
                        </div>
                      )}
                    </div>
                    {/* </div>
                                </div> */}
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* 
                        {currentService && currentService?.vendor_services && currentService?.vendor_services.length > 0 && (
                            <AccordionItem value="statistics" className='!mt-0'>
                                <AccordionTrigger className='px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current'>Vendors</AccordionTrigger>
                                <AccordionContent className="grid gap-4 overflow-x-auto">
                                    <div className='w-full flex flex-col items-center mb-[40px]'>
                                        <Table className="font-alexandria !overflow-x-auto whitespace-nowrap min-w-[800px]">
                                            <TableHeader>
                                                <TableRow className="bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]">
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">NAME</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">EMAIL</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">PHONE</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">RATE</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">DURATION (Mins)</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">HOMEBASE ADDRESS</TableHead>
                                                    <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">STATUS</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!currentService?.vendor_services ? (
                                                    <TableRow className="flex justify-center w-full">
                                                        <TableCell className="flex justify-center" colSpan={5}>
                                                            No Vendor available.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    currentService?.vendor_services.map((vendor, i) => {
                                                        const options = [
                                                            // {
                                                            //     label: "Edit",
                                                            //     onClick: () => {
                                                            //         if (vendor.uuid) {
                                                            //             // router.push(`/dashboard/services/create/${vendor.uuid}`);
                                                            //         }
                                                            //     },
                                                            // },
                                                            {
                                                                label: "Delete",
                                                                onClick: () => handleDelete(vendor.uuid),
                                                            },
                                                        ];

                                                        return (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-[15px] font-[400] text-[#666666] pl-[20px]">
                                                                    {vendor?.vendor?.first_name} {vendor?.vendor?.last_name}
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#666666]">
                                                                    {vendor?.vendor?.email}
                                                                </TableCell>

                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                                                    {vendor?.vendor?.primary_phone}
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                                                    $ {vendor?.hourly_rate} / hr
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                                                    {vendor?.time_needed} Min
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                                                    {vendor?.vendor?.homebase_address ? vendor?.vendor?.homebase_address.address_line_1 : ''}, {vendor?.vendor?.homebase_address ? vendor?.vendor?.homebase_address.city : ''}, {vendor?.vendor?.homebase_address ? vendor?.vendor?.homebase_address.country : ''}
                                                                </TableCell>
                                                                <TableCell className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2 pr-[20px]">
                                                                    <Switch
                                                                        checked={!!vendor.status}
                                                                        onCheckedChange={async (checked) => {
                                                                            await handleUpdateVendorStatus(vendor.uuid || '', checked, currentService.uuid);
                                                                        }}
                                                                        className={`${vendor.status ? "!bg-[#6BAE41]" : "!bg-[#E06D5E]"} data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
                                                                    />
                                                                    <DropdownActions options={options} />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )} */}
            </Accordion>
          </form>
        </div>
        <SaveModal
          isOpen={open}
          onClose={() => setOpen(false)}
          isLoading={isLoading}
          isSuccess={true}
          backLink="/dashboard/services"
          title="Services"
        />
      </div>
    </div>
  );
};

export default ServicesFrom;
