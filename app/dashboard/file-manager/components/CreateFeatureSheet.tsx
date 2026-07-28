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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Order } from "../../orders/page";
import FeatureSheetThumbnail from "./FeatureSheetThumbnail";
import { HexColorPicker } from "react-colorful";

import { useFileManagerContext, initialFormData } from "../FileManagerContext";
import BcfpStandard from "./BcfpStandard";
import ConfirmationDialog from "@/components/ConfirmationDialog";

import DownloadPdf from "./DownloadPdf";
import TabloidPdfGenerator from "./TabloidPdfGenerator";
// import BcfpStandard1 from "./BcfpStandard1";
import BcfpStandard2 from "./BcfpStandard2";
import BcfpStandard3 from "./BcfpStandard3";
import BcfpStandard4 from "./BcfpStandard4";
// import BcfpStandard5 from "./BcfpStandard5";
import BcfpStandard6 from "./BcfpStandard6";
import BcfpStandard7 from "./BcfpStandard7";
import BcfpStandard8 from "./BcfpStandard8";
import BcfpStandard9 from "./BcfpStandard9";
import BcfpStandard10 from "./BcfpStandard10";
import BcfpStandard11 from "./BcfpStandard11";
import BcfpStandard12 from "./BcfpStandard12";
import BcfpStandard13 from "./BcfpStandard13";
import BcfpStandard14 from "./BcfpStandard14";
import BcfpStandard15 from "./BcfpStandard15";
import BcfpStandard16 from "./BcfpStandard16";
import BcfpStandard17 from "./BcfpStandard17";
import BcfpStandard18 from "./BcfpStandard18";
import BcfpStandard19 from "./BcfpStandard19";
import BcfpStandard20 from "./BcfpStandard20";
import BcfpStandard21 from "./BcfpStandard21";
import BcfpStandard22 from "./BcfpStandard22";
import BcfpStandard23 from "./BcfpStandard23";
import BcfpStandard24 from "./BcfpStandard24";
import { useAppContext } from "@/app/context/AppContext";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetResponse,
  FeatureSheetPayload,
  StyledTextField,
  getTemplateLabel,
  templateImages,
} from "../types/featureSheetTypes";
import CopyStylePopup from "./CopyStylePopup";
import PrintRequestModal from "./PrintRequestModal";
import { Printer } from "lucide-react";
import InvoicePaymentDialog from "./invoicePaymentDialog";
import { usePortalSettings } from "@/app/hooks/usePortalSettings";

interface FeatureSheetComponentRef {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface CreateFeatureSheetProps {
  orderData: Order | null;
  isReadonly?: boolean;
  previewSheetUuid?: string;
}

export interface CreateFeatureSheetRef {
  handleSave: () => Promise<void>;
}

const CreateFeatureSheet = forwardRef<
  CreateFeatureSheetRef,
  CreateFeatureSheetProps
>(function CreateFeatureSheet(
  { orderData, isReadonly = false, previewSheetUuid },
  ref,
) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState<string>("");
  const [linkedin, setLinkedin] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  // const [previewMode] = useState<"print" | "fit">("print");
  const {
    formData,
    setFormData,
    updateFormData,
    featureSheets,
    setFeatureSheets,
    filesData,
    setFilesData,
  } = useFileManagerContext();
  const { userType } = useAppContext();
  const { allowPrintRequest } = usePortalSettings();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (e) {
        console.error("Failed to parse userInfo from localStorage", e);
      }
    }
  }, []);

  const [openColorPicker, setOpenColorPicker] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef1 = useRef<HTMLDivElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [realtorPreview, setRealtorPreview] = useState<string | null>(null);
  const realtorInputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [customPdf, setCustomPdf] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [uploadedPdfs, setUploadedPdfs] = useState<
    { name: string; url: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<
    "listing" | "tabloid" | "my_sheets"
  >("listing");
  const pdfSectionRef = useRef<HTMLDivElement>(null);

  const [agentSheets, setAgentSheets] = useState<FeatureSheetResponse[]>([]);
  const [loadingAgentSheets, setLoadingAgentSheets] = useState(false);
  const activeStandardRef = useRef<FeatureSheetComponentRef>(null);
  const [selectedSheetUuid, setSelectedSheetUuid] = useState<string | null>(
    null,
  );
  const [copyStyleOpen, setCopyStyleOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showAgain, setShowAgain] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const STORAGE_KEY_DELETE = "confirmation_dialog_delete_show_again";

  useEffect(() => {
    const savedDelete = localStorage.getItem(STORAGE_KEY_DELETE);
    if (savedDelete !== null) {
      setShowAgain(JSON.parse(savedDelete));
    }
  }, []);

  const [numPdfPages, setNumPdfPages] = useState(1);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
  const isScrollingRef = useRef(false);

  const scrollToPage = (pageNumber: number) => {
    const pages = document.querySelectorAll(".pdf-page");
    const targetPage = pages[pageNumber - 1] as HTMLElement;
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPreviewPage(pageNumber);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;

        let mostVisiblePage = -1;
        let maxRatio = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const allPages = Array.from(document.querySelectorAll(".pdf-page"));
            mostVisiblePage = allPages.indexOf(entry.target) + 1;
          }
        });

        if (mostVisiblePage !== -1) {
          setCurrentPreviewPage((prev) =>
            prev !== mostVisiblePage ? mostVisiblePage : prev,
          );
        }
      },
      {
        threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
      },
    );

    const intervalId = setInterval(() => {
      document
        .querySelectorAll(".pdf-page")
        .forEach((p) => observer.observe(p));
    }, 500);

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, []);

  // Snap pdf-section height to multiples of 11in (1056px) for full page rendering
  useEffect(() => {
    const el = pdfSectionRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      // Temporarily clear minHeight to measure true scrollHeight
      el.style.minHeight = "11in";

      // Use setTimeout to allow DOM to recalculate after resetting minHeight
      setTimeout(() => {
        if (!el) return;
        const pages = el.querySelectorAll(".pdf-page");
        const isExplicitPage = pages.length > 0;
        let numPages;

        if (isExplicitPage) {
          numPages = pages.length;
        } else {
          const contentHeight = el.scrollHeight;
          const pHeight = 1056; // 11 inches at 96dpi
          numPages = Math.max(1, Math.ceil(contentHeight / pHeight));
        }

        if (numPages !== numPdfPages) {
          setNumPdfPages(numPages);
        }
      }, 0);
    });

    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  const handleToggleShowAgain = () => {
    const newValue = !showAgain;
    setShowAgain(newValue);
    localStorage.setItem(STORAGE_KEY_DELETE, JSON.stringify(newValue));
  };

  const handleDeleteFeatureSheet = async (uuid: string) => {
    try {
      await featureSheetService.deleteFeatureSheet(uuid);
      setFeatureSheets((prev) => prev.filter((s) => s.uuid !== uuid));
      if (selectedSheetUuid === uuid) {
        setSelectedSheetUuid(null);
        setSelectedTemplate("");
      }
      toast.success("Feature sheet deleted successfully!");
    } catch (error) {
      console.error("Error deleting feature sheet:", error);
      toast.error("Failed to delete feature sheet.");
    } finally {
      setSheetToDelete(null);
      setConfirmOpen(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [safeZone, setSafeZone] = useState<boolean>(false);

  const handleDownload = async (
    withBleed: boolean,
    useSafeZone: boolean = safeZone,
  ) => {
    // Force HMR reload to pull updated DownloadPdf.js logic
    setIsDownloading(true);
    try {
      const propertyAddress = orderData?.property_address || "Property";
      const sheetName = selectedTemplate.replace(/\.pdf$/i, "");
      const fileName = `${propertyAddress.replace(/[/\\?%*:|"<>]/g, "-")}_${sheetName}.pdf`;

      const currentTemplate = templateImages.find(
        (t) => t.id === selectedTemplate,
      );
      const isTabloid = currentTemplate?.type === "tabloid";

      if (isTabloid) {
        await TabloidPdfGenerator(
          "pdf-section",
          fileName,
          withBleed,
          useSafeZone,
        );
      } else {
        const paperSize = { width: 8.5, height: 11 }; // Default Letter
        await DownloadPdf(
          "pdf-section",
          fileName,
          withBleed,
          paperSize,
          useSafeZone,
        );
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper to get thumbnail URLs with fallback
  const getThumbnailUrls = (templateKey: string): string[] => {
    if (!templateKey || typeof templateKey !== "string") {
      return ["/featuresheetimage1.png"];
    }

    // Special case for the base template which doesn't have a BcfpStandard.png
    if (templateKey === "BCFPStandard") {
      return ["/featuresheetimage1.png"];
    }

    const template = templateImages.find((t) => t.id === templateKey) as any;
    if (template?.pages && template.pages.length > 0) {
      return template.pages;
    }

    let fallbackUrl = "";
    if (template?.url) {
      fallbackUrl = `/${template.url}.png`;
    } else {
      // Fallback: convert BCFPStandardX to BcfpStandardX.png
      const normalizedKey = templateKey.replace("BCFP", "Bcfp");
      fallbackUrl = `/${normalizedKey}.png`;
    }

    if (template?.type === "listing" || template?.type === "tabloid") {
      return [fallbackUrl, fallbackUrl];
    }
    return [fallbackUrl];
  };

  const triggerRealtorInput = () => {
    realtorInputRef.current?.click();
  };

  const handleRealtorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRealtorPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveFeatureSheet = async () => {
    try {
      if (activeStandardRef.current) {
        const payload = await activeStandardRef.current.exportToPayload();

        let result: FeatureSheetResponse;
        if (selectedSheetUuid) {
          result = await featureSheetService.updateFeatureSheet(
            selectedSheetUuid,
            payload,
          );
          // Update local state list
          setFeatureSheets((prev) =>
            prev.map((s) => (s.uuid === selectedSheetUuid ? result : s)),
          );
        } else {
          result = await featureSheetService.uploadFeatureSheet(payload);
          setSelectedSheetUuid(result.uuid);
          // Add to local state list
          setFeatureSheets((prev) => [...prev, result]);
        }

        toast.success("Feature sheet saved successfully!");
      } else {
        toast.error(
          "Save functionality is not available for this template yet.",
        );
      }
    } catch (error) {
      console.error("Error saving feature sheet:", error);
      toast.error("Failed to save feature sheet. Please try again.");
    } finally {
    }
  };

  /**
   * Apply style properties from a source sheet to the currently open sheet.
   * Only the `style` object of each StyledTextField is applied.
   * Content `value` fields are left completely untouched.
   */
  const handleApplyStyle = async (sourceSheet: FeatureSheetResponse) => {
    try {
      if (!activeStandardRef.current) {
        toast.error("No template is open to apply style to.");
        return;
      }

      // 1. Extract styles from the chosen source sheet
      const { contentStyles, imageStyles } =
        featureSheetService.extractStylesFromContent(sourceSheet);

      // 2. Get the current sheet's full payload (inc. its own values)
      const currentPayload = await activeStandardRef.current.exportToPayload();

      // 3. Merge: replace only the `style` on each field, keep the `value`
      const mergedContent = { ...(currentPayload.content || {}) };
      for (const key of Object.keys(contentStyles)) {
        // Handle nested styles in otherDetails
        if (key.startsWith("otherDetails.")) {
          const subKey = key.split(".")[1];
          if (!mergedContent.otherDetails)
            (mergedContent as any).otherDetails = {};
          const details = mergedContent.otherDetails as Record<string, any>;
          const existingField = details[subKey];

          if (
            existingField &&
            typeof existingField === "object" &&
            "value" in existingField
          ) {
            details[subKey] = {
              ...(existingField as StyledTextField),
              style: contentStyles[key],
            };
          } else {
            details[subKey] = {
              value: typeof existingField === "string" ? existingField : "",
              style: contentStyles[key],
            };
          }
          continue;
        }

        const existingField = mergedContent[key];
        if (
          existingField &&
          typeof existingField === "object" &&
          "value" in existingField
        ) {
          mergedContent[key] = {
            ...(existingField as StyledTextField),
            style: contentStyles[key],
          } as any;
        } else {
          // Field doesn't exist in current sheet yet — add with its value + source style
          mergedContent[key] = {
            value: typeof existingField === "string" ? existingField : "",
            style: contentStyles[key],
          } as any;
        }
      }

      // 4. Build a merged payload to hand to importFromPayload
      const mergedPayload: FeatureSheetResponse = {
        ...sourceSheet, // carry over metadata shape
        id: 0, // placeholder — won't be saved
        uuid: selectedSheetUuid || "",
        order_id: currentPayload.order_uuid,
        type: currentPayload.type || "template",
        template_key: currentPayload.template_key || selectedTemplate,
        uploaded_by: currentPayload.uploaded_by || "admin",
        content: mergedContent as FeatureSheetResponse["content"],
        // Keep current images but apply source image scales/positions
        images: sourceSheet.images.map((img) => ({
          ...img,
          meta: {
            ...img.meta,
            scale: imageStyles[img.slot]?.scale ?? img.meta?.scale ?? 1,
            position: imageStyles[img.slot]?.position ??
              img.meta?.position ?? { x: 0, y: 0 },
          },
        })),
      };

      console.log("[CopyStyle] merged content:", mergedPayload.content);

      // 5. Push into the active template component
      activeStandardRef.current.importFromPayload(mergedPayload);

      toast.success(`Style copied from ${sourceSheet.template_key}!`);
    } catch (err) {
      console.error("[CopyStyle] Failed to apply style:", err);
      toast.error("Failed to apply style. Please try again.");
    }
  };

  const handleMySheetClick = async (sheet: FeatureSheetResponse) => {
    // 1. If no template is selected, we first need to "open" the template
    // If one IS selected, we just apply the style to it.

    if (!selectedTemplate) {
      // Open the template
      handleTemplateChange(sheet.template_key);
      // Wait for the component to mount and then apply style
      // We use a small delay to ensure the template component ref is ready
      setTimeout(() => {
        handleApplyStyle(sheet);
      }, 300);
    } else {
      // Already have a template open, just apply style
      handleApplyStyle(sheet);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave: handleSaveFeatureSheet,
  }));

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const triggerLogoInput = () => {
    logoInputRef.current?.click();
  };

  useEffect(() => {
    if (orderData) {
      setFormData((prev) => ({
        ...prev,
        avatar_url: orderData.agent.avatar_url,
        AvatarfileName: orderData.agent.avatar,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData]);

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
        // setOpenColorPicker1(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside1);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside1);
    };
  }, []);

  useEffect(() => {
    const fetchFeatureSheets = async () => {
      if (!orderData?.uuid) return;

      try {
        const response = await featureSheetService.getFeatureSheetsByOrder(
          orderData.uuid,
        );
        console.log("getFeatureSheetsByOrder response", response);

        // Since my service returns data directly
        const dataArray = Array.isArray(response)
          ? response
          : (response as unknown as { data: FeatureSheetResponse[] }).data ||
            [];

        if (dataArray.length > 0) {
          setFeatureSheets(dataArray);
          // Populate uploadedPdfs with any pdf sheets
          const pdfSheets = dataArray
            .filter((sheet) => sheet.type === "pdf")
            .map((sheet) => ({
              name: sheet.template_key,
              url: featureSheetService.buildStorageUrl(sheet.pdf_url) || "",
            }));
          setUploadedPdfs(pdfSheets);
          // Don't auto-select a template - let user choose from the grid
        }
      } catch (error) {
        console.error("Error fetching existing feature sheets:", error);
      }
    };

    fetchFeatureSheets();
  }, [orderData?.uuid, setFeatureSheets, setUploadedPdfs]);

  useEffect(() => {
    const fetchAgentSheets = async () => {
      if (activeTab !== "my_sheets") return;
      setLoadingAgentSheets(true);
      try {
        const response = await featureSheetService.getFeatureSheetsByAgent();
        // Filter to only include template sheets (not raw PDF uploads)
        const templateSheets = response.filter((s) => s.type === "template");
        setAgentSheets(templateSheets);
      } catch (error) {
        console.error("Error fetching agent feature sheets:", error);
        toast.error("Failed to load your saved sheets.");
      } finally {
        setLoadingAgentSheets(false);
      }
    };

    fetchAgentSheets();
  }, [activeTab]);

  // Force load the specific sheet if previewSheetUuid is provided or in readonly mode
  useEffect(() => {
    if (featureSheets.length > 0 && !selectedSheetUuid) {
      if (previewSheetUuid) {
        const sheet = featureSheets.find((s) => s.uuid === previewSheetUuid);
        if (sheet) {
          setSelectedTemplate(sheet.template_key);
          setSelectedSheetUuid(sheet.uuid);
          return;
        }
      }
      if (isReadonly && featureSheets.length > 0) {
        setSelectedTemplate(featureSheets[0].template_key);
        setSelectedSheetUuid(featureSheets[0].uuid);
      }
    }
  }, [isReadonly, featureSheets, selectedSheetUuid, previewSheetUuid]);

  // Load data into formData when selectedTemplate changes
  useEffect(() => {
    if (!selectedTemplate || featureSheets.length === 0) return;

    const sheetData = featureSheets.find(
      (s) => s.template_key === selectedTemplate,
    );
    if (sheetData) {
      console.log("Loading data for template:", selectedTemplate, sheetData);
      if (sheetData.type === "pdf") {
        setCustomPdf({
          name: sheetData.template_key,
          url: featureSheetService.buildStorageUrl(sheetData.pdf_url) || "",
        });
      } else {
        setCustomPdf(null);
      }
      const state = featureSheetService.parsePayloadToState(sheetData);

      // We only update if the template data is different from current context to avoid unnecessary loops
      updateFormData({
        ...state,
        // Ensure string fields are strings
        siteInfluences: (state.siteInfluences as string) || "",
        grossTaxes: (state.grossTaxes as string) || "",
        featuresIncluded: (state.featuresIncluded as string) || "",
        // When initial loading a template, we take its data as primary.
        // If we need to preserve current images, we should do it carefully.
        // For now, let's just load the template state.
        images: state.images || {},
        imageScales: state.imageScales || {},
        imagePositions: state.imagePositions || {},
      });

      // Call importFromPayload on the template component to load data into its internal state
      // Use setTimeout to ensure the ref is available after render
      setTimeout(() => {
        if (activeStandardRef.current?.importFromPayload) {
          activeStandardRef.current.importFromPayload(sheetData);
        }
      }, 0);
    } else {
      // If no saved sheet data is found for this template, reset to initialFormData (plus order-specific defaults)
      updateFormData({
        ...initialFormData,
        avatar_url: orderData?.agent.avatar_url || "",
        AvatarfileName: orderData?.agent.avatar || "",
      });
      setSelectedSheetUuid(null);
      setCustomPdf(null);
    }
    // We intentionally only run this when selectedTemplate or featureSheets (data source) changes.

    // Including formData components in deps creates a loop.
  }, [
    selectedTemplate,
    featureSheets,
    updateFormData,
    orderData?.agent.avatar,
    orderData?.agent.avatar_url,
    setCustomPdf,
  ]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!orderData?.uuid) {
      toast.error("No order data available. Cannot upload PDF.");
      return;
    }

    try {
      // Upload to S3 and create feature sheet record via presigned URL workflow
      const newSheet = await featureSheetService.uploadPdfFeatureSheet(
        orderData.uuid,
        file,
        (userType as "admin" | "agent" | "vendor") || "admin",
      );

      // Update the UI with the new sheet
      const pdfData = {
        name: file.name,
        url: featureSheetService.buildStorageUrl(newSheet.pdf_url) || "",
      };
      setCustomPdf(pdfData);
      setSelectedTemplate(file.name);
      setUploadedPdfs((prev) => {
        const exists = prev.find((pdf) => pdf.name === file.name);
        if (!exists) return [...prev, pdfData];
        return prev;
      });
      setFeatureSheets((prev) => [...prev, newSheet]);
      setSelectedSheetUuid(newSheet.uuid);

      toast.success("PDF feature sheet uploaded successfully!");
    } catch (error) {
      console.error("Error uploading PDF feature sheet:", error);
      toast.error("Failed to upload PDF. Please try again.");
    } finally {
    }
  };
  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);

    // If it's one of the saved sheets, find its UUID
    const savedSheet = featureSheets.find((s) => s.template_key === template);
    if (savedSheet) {
      setSelectedSheetUuid(savedSheet.uuid);
      // Data loading is handled by the useEffect[selectedTemplate, featureSheets]
    } else {
      setSelectedSheetUuid(null);
      // Reset form data for new template
      updateFormData({
        ...initialFormData,
        avatar_url: orderData?.agent.avatar_url || "",
        AvatarfileName: orderData?.agent.avatar || "",
      });
    }

    if (template !== "BCFPStandard" && !template.startsWith("BCFPStandard")) {
      const pdf = uploadedPdfs.find((pdf) => pdf.name === template);
      if (pdf) {
        setCustomPdf(pdf);
      }
    } else {
      setCustomPdf(null);
    }
  };



  const pdfSectionStyle: React.CSSProperties = {
    width: "8.5in",
    minHeight: `${numPdfPages * 11}in`,
    position: "relative",
    backgroundColor: "transparent",
    fontFamily: "'Alexandria', sans-serif",
  };

  return (
    <>
      <div className="w-full h-auto">
        {!isReadonly && (
          <div className="flex justify-between h-[60px] items-center bg-[#E4E4E4] px-4">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isDownloading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-[13px] w-[164px] h-[32px] transition-colors ${userType}-bg text-white rounded-[6px] font-[500] disabled:opacity-50`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Download PDF"
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px]">
                  <DropdownMenuItem
                    onClick={() => handleDownload(false, false)}
                    className="cursor-pointer"
                  >
                    Download (No Bleed)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDownload(true, false)}
                    className="cursor-pointer"
                  >
                    Download (With Bleed)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDownload(false, true)}
                    className="cursor-pointer font-medium text-emerald-700"
                  >
                    Download (Safe Zone)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDownload(true, true)}
                    className="cursor-pointer font-medium text-emerald-700"
                  >
                    Download (Bleed + Safe Zone)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Safe Zone Toggle Toolbar Button */}
              <button
                type="button"
                onClick={() => setSafeZone(!safeZone)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] h-[32px] transition-colors border-2 rounded-[6px] font-[500] ${
                  safeZone
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title="Toggle 0.25-inch safe zone for PDF export"
              >
                <Shield className="w-3.5 h-3.5" />
                Safe Zone:{" "}
                <span className="font-bold">{safeZone ? "ON" : "OFF"}</span>
              </button>

              {/* Copy Style button — only visible when a template is open */}
              {selectedTemplate && (
                <button
                  type="button"
                  onClick={() => setCopyStyleOpen(true)}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] h-[32px] transition-colors border-2 ${userType}-border ${userType}-text bg-white rounded-[6px] font-[500] hover:opacity-80`}
                >
                  Copy Style
                </button>
              )}

              {allowPrintRequest &&
                (userType === "agent" || userType === "admin") &&
                selectedTemplate &&
                selectedSheetUuid && (
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] h-[32px] transition-colors border-2 ${userType}-border ${userType}-text bg-white rounded-[6px] font-[500] hover:bg-gray-50`}
                  >
                    <Printer className="w-4 h-4" />
                    Send Print Request
                  </button>
                )}
            </div>
            <div className="text-center">
              <div
                className={`text-[16px] font-alexandria font-bold ${userType}-text`}
              >
                Feature Sheets
              </div>
            </div>
            <div className="flex gap-3 items-center">
              {/* Service integration removed */}
            </div>
          </div>
        )}

        {!selectedTemplate && !isReadonly && (
          <div className="flex flex-col items-center w-full">
            <div className="flex gap-[20px] justify-center items-center bg-[#E4E4E4] w-full h-[60px] border-t-[1px] border-[#BBBBBB]">
              <button
                onClick={() => setActiveTab("listing")}
                className={`flex items-center w-[200px] justify-center font-medium text-sm transition-colors h-[40px] rounded-[6px] ${
                  activeTab === "listing"
                    ? `text-white border-b-2 ${userType}-bg`
                    : "bg-[#EEEEEE] hover:text-gray-700"
                }`}
              >
                Listing Flyers
              </button>
              <button
                onClick={() => setActiveTab("tabloid")}
                className={`flex items-center w-[200px] justify-center font-medium text-sm transition-colors h-[40px] rounded-[6px] ${
                  activeTab === "tabloid"
                    ? `text-white border-b-2  ${userType}-bg`
                    : "bg-[#EEEEEE] hover:text-gray-700"
                }`}
              >
                Tabloid Feature Sheet
              </button>
              <button
                onClick={() => setActiveTab("my_sheets")}
                className={`flex items-center w-[200px] justify-center font-medium text-sm transition-colors h-[40px] rounded-[6px] ${
                  activeTab === "my_sheets"
                    ? `text-white border-b-2  ${userType}-bg`
                    : "bg-[#EEEEEE] hover:text-gray-700"
                }`}
              >
                My Sheets
              </button>
            </div>

            <div className="mt-10">
              <button
                onClick={() =>
                  document.getElementById("custom-pdf-upload")?.click()
                }
                className={`px-6 py-2 ${userType}-bg text-white rounded-md text-sm font-medium hover:opacity-90`}
              >
                + Upload Feature Sheet
              </button>
              <input
                id="custom-pdf-upload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
            </div>
          </div>
        )}

        {!selectedTemplate && !isReadonly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-20 mt-8 mb-20 h-auto px-4 md:px-20">
            {/* Saved Feature Sheets Section */}
            {featureSheets.length > 0 && (
              <>
                <div className="col-span-full">
                  <h2
                    className={`text-[24px] font-semibold ${userType}-text mb-4`}
                  >
                    Saved Feature Sheets
                  </h2>
                </div>
                {featureSheets
                  .filter((sheet) => {
                    if (activeTab === "my_sheets") return true;
                    const template = templateImages.find(
                      (t) => t.id === sheet.template_key,
                    );
                    if (!template) return activeTab === "listing";
                    return template?.type === activeTab;
                  })
                  .map((sheet) => {
                    return (
                      <div key={sheet.uuid} className="flex flex-col gap-2">
                        <div className="text-start">
                          <p className="text-[24px] text-[#666666]">
                            {getTemplateLabel(sheet.template_key)}
                          </p>
                          <p className="text-[12px] text-[#888888]">
                            Last updated:{" "}
                            {new Date(sheet.updated_at).toLocaleDateString()}
                          </p>
                          <div className="flex gap-4">
                            <p
                              className={`text-[15px] ${userType}-text hover:underline cursor-pointer`}
                              onClick={() => {
                                setSelectedTemplate(sheet.template_key);
                                setSelectedSheetUuid(sheet.uuid);
                              }}
                            >
                              Edit Feature Sheet
                            </p>
                            {allowPrintRequest && (
                              <p
                                className={`text-[15px] ${userType}-text hover:underline cursor-pointer`}
                                onClick={() => {
                                  setSelectedSheetUuid(sheet.uuid);
                                  setIsPrintModalOpen(true);
                                }}
                              >
                                Print
                              </p>
                            )}
                            <p
                              className="text-[15px] text-red-500 hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (showAgain) {
                                  setSheetToDelete(sheet.uuid);
                                  setConfirmOpen(true);
                                } else {
                                  handleDeleteFeatureSheet(sheet.uuid);
                                }
                              }}
                            >
                              Delete
                            </p>
                          </div>
                        </div>
                        <div
                          onClick={() => {
                            setSelectedTemplate(sheet.template_key);
                            setSelectedSheetUuid(sheet.uuid);
                          }}
                          className={`cursor-pointer border-2 rounded-lg overflow-hidden hover:scale-[1.03] transition-transform ${selectedTemplate === sheet.template_key && selectedSheetUuid === sheet.uuid ? `${userType}-border shadow-md` : "border-gray-300 shadow-md"} relative`}
                        >
                          <FeatureSheetThumbnail
                            images={getThumbnailUrls(sheet.template_key)}
                            className="w-full h-[400px]"
                          >
                            <div
                              className={`absolute top-2 right-2 ${userType}-bg text-white text-xs px-2 py-1 rounded z-20`}
                            >
                              Saved
                            </div>
                          </FeatureSheetThumbnail>
                        </div>
                      </div>
                    );
                  })}

                {activeTab !== "my_sheets" && (
                  <div className="col-span-full mt-4">
                    <h2 className="text-[24px] font-semibold text-[#666666] mb-4">
                      Create New Feature Sheet
                    </h2>
                  </div>
                )}
              </>
            )}

            {/* My Sheets Tab Content */}
            {activeTab === "my_sheets" && (
              <>
                <div className="col-span-full">
                  <h2
                    className={`text-[24px] font-semibold ${userType}-text mb-4`}
                  >
                    My Saved Sheets (Style Sources)
                  </h2>
                  <p className="text-sm text-[#7D7D7D] mb-6">
                    Click a sheet to apply its styling (fonts, colors, layout)
                    to your current order.
                  </p>
                </div>

                {loadingAgentSheets ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2
                      className={`w-10 h-10 animate-spin ${userType}-text`}
                    />
                    <p className="text-[#7D7D7D]">Loading your sheets...</p>
                  </div>
                ) : agentSheets.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20">
                    <p className="text-[#7D7D7D]">No saved sheets found.</p>
                  </div>
                ) : (
                  agentSheets.map((sheet) => {
                    return (
                      <div key={sheet.uuid} className="flex flex-col gap-2">
                        <div className="text-start">
                          <p className="text-[20px] font-medium text-[#444444] truncate">
                            {getTemplateLabel(sheet.template_key)}
                          </p>
                          <p className="text-[12px] text-[#888888]">
                            Last updated:{" "}
                            {new Date(sheet.updated_at).toLocaleDateString()}
                          </p>
                          <button
                            onClick={() => handleMySheetClick(sheet)}
                            className={`mt-2 text-[14px] ${userType}-text hover:underline font-medium`}
                          >
                            Apply Style →
                          </button>
                        </div>
                        <div
                          onClick={() => handleMySheetClick(sheet)}
                          className={`cursor-pointer border-2 rounded-lg overflow-hidden hover:scale-[1.03] transition-transform border-gray-300 shadow-sm hover:${userType}-border relative group`}
                        >
                          <FeatureSheetThumbnail
                            images={getThumbnailUrls(sheet.template_key)}
                            className="w-full h-[300px]"
                          >
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none z-20">
                              <span className="bg-white/90 text-black px-4 py-2 rounded-full text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                Use This Style
                              </span>
                            </div>
                          </FeatureSheetThumbnail>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* Template Options */}
            {activeTab !== "my_sheets" &&
              templateImages
                .filter((template) => template.type === activeTab)
                .map((template) => (
                  <div key={template.id} className="flex flex-col gap-2">
                    <div className="text-start">
                      <p className="text-[24px] text-[#666666]">
                        {template.label ?? template.id}
                      </p>
                      <p
                        className={`text-[15px] ${userType}-text hover:underline cursor-pointer`}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setSelectedSheetUuid(null);
                        }}
                      >
                        Edit Feature Sheet
                      </p>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setSelectedSheetUuid(null);
                      }}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden hover:scale-[1.03] transition-transform ${
                        selectedTemplate === template.id && !selectedSheetUuid
                          ? `${userType}-border shadow-md`
                          : "border-gray-300"
                      }`}
                    >
                      <FeatureSheetThumbnail
                        images={getThumbnailUrls(template.id)}
                        className="w-full h-[400px]"
                      >
                        <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded opacity-80 pointer-events-none z-20">
                          New
                        </div>
                      </FeatureSheetThumbnail>
                    </div>
                  </div>
                ))}
          </div>
        )}
        {selectedTemplate && (
          <form>
            <Accordion
              type="multiple"
              defaultValue={
                isReadonly
                  ? ["FeatureSheetPreview"]
                  : ["FeatureSheetSettings", "FeatureSheetPreview"]
              }
              className="w-full space-y-4"
            >
              {!isReadonly && (
                <AccordionItem value="FeatureSheetSettings">
                  <AccordionTrigger
                    className={` overflow-visible px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase [&>svg]:currentColor  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                  >
                    General Information
                  </AccordionTrigger>
                  <AccordionContent className="grid gap-4 !overflow-visible">
                    <div className="w-full flex flex-col items-center px-[16px]">
                      <div className="flex w-full gap-3 mt-4 justify-end">
                        <div className="text-center">
                          <div className="text-[24px] font-alexandria font-normal leading-[18px] text-[#7D7D7D]">
                            25 Copies
                          </div>
                          <div className="text-[12px] font-alexandria font-normal text-[#7D7D7D]">
                            Printed
                          </div>
                        </div>
                        <button className="text-center px-4 py-2 text-[13px] w-[133px] h-[32px] transition-colors bg-[#8E8E8E] hover:brightness-90 text-white leading-3 rounded-[6px] font-[500]">
                          Upgrade Plan
                        </button>
                      </div>
                      <div className="grid-cols-1 md:grid-cols-3 gap-6 !hidden">
                        <div className="">
                          <div ref={wrapperRef} className="relative w-full">
                            <label
                              htmlFor="bgcolor"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Primary Color
                            </label>

                            {/* Box + Input side by side */}
                            <div className="flex items-center gap-3 mt-2">
                              {/* Color preview box */}
                              <div
                                className="w-8 h-8 border border-gray-400 rounded"
                                style={{
                                  backgroundColor: `#${formData.background || "ffffff"}`,
                                }}
                              />

                              {/* Input wrapper */}
                              <div className="relative flex-1">
                                <span
                                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700"
                                  style={{
                                    color: `#${formData.background || ""}`,
                                  }}
                                >
                                  #
                                </span>

                                <Input
                                  id="bgcolor"
                                  value={formData.background}
                                  onFocus={() => setOpenColorPicker(true)}
                                  onClick={() => setOpenColorPicker(true)}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      .replace(/[^0-9a-fA-F]/g, "")
                                      .slice(0, 6);
                                    setFormData((prev) => ({
                                      ...prev,
                                      background: value,
                                    }));
                                  }}
                                  className="pl-6 pr-4 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB]"
                                  maxLength={6}
                                  style={{
                                    color: `#${formData.background || ""}`,
                                  }}
                                />
                              </div>
                            </div>

                            {openColorPicker && (
                              <div className="absolute z-10 mt-2 rounded shadow-md border border-gray-300 bg-white p-3">
                                <HexColorPicker
                                  className="!w-[175px]"
                                  color={`#${formData.background}`}
                                  onChange={(newColor) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      background: newColor.replace(/^#/, ""),
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="mt-4 w-full">
                              <label className="text-[#666666]">Logo</label>
                              <div className="flex flex-col sm:flex-row gap-3">
                                {/* Preview */}
                                <div className="flex h-[128px] items-end gap-x-[6px]">
                                  <div className="w-[193px] h-[128px] bg-[#E4E4E4] rounded-[6px] overflow-hidden border">
                                    {logoPreview && (
                                      <Image
                                        unoptimized
                                        src={logoPreview}
                                        alt="Logo Preview"
                                        width={193}
                                        height={128}
                                        className="object-cover w-full h-full"
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Button */}
                                <div className="flex flex-1 w-full">
                                  <div className="flex flex-col gap-3 justify-between w-full self-center">
                                    <div>
                                      <button
                                        type="button"
                                        onClick={triggerLogoInput}
                                        className="px-4 py-2 bg-[#E4E4E4] text-base font-normal w-[156px] h-full rounded-[6px] text-[#666666] border border-[#A8A8A8]"
                                      >
                                        Choose Image
                                      </button>
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/png, image/jpeg"
                                      ref={logoInputRef}
                                      onChange={handleLogoChange}
                                      className="hidden"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="">
                          <div>
                            <label htmlFor="">Template</label>
                            <Select
                              value={selectedTemplate}
                              onValueChange={handleTemplateChange}
                            >
                              <SelectTrigger className="w-full h-[52px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                                <SelectValue placeholder="Select Template" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Listing Flyers */}
                                <div className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 z-10 border-b border-gray-100">
                                  Listing Flyers
                                </div>
                                {templateImages
                                  .filter(
                                    (template) => template.type === "listing",
                                  )
                                  .map((template) => {
                                    const thumb = getThumbnailUrls(
                                      template.id,
                                    )[0];
                                    const label = getTemplateLabel(template.id);
                                    return (
                                      <SelectItem
                                        key={template.id}
                                        value={template.id}
                                        className="cursor-pointer py-1.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          {thumb && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={thumb}
                                              alt={label}
                                              className="w-7 h-9 object-cover rounded border border-gray-200 shrink-0 bg-gray-100 shadow-sm"
                                            />
                                          )}
                                          <span className="font-medium text-sm text-gray-800">
                                            {label}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}

                                {/* Tabloid Sheets */}
                                <div className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 z-10 border-b border-gray-100 mt-2">
                                  Tabloid Sheets
                                </div>
                                {templateImages
                                  .filter(
                                    (template) => template.type === "tabloid",
                                  )
                                  .map((template) => {
                                    const thumb = getThumbnailUrls(
                                      template.id,
                                    )[0];
                                    const label = getTemplateLabel(template.id);
                                    return (
                                      <SelectItem
                                        key={template.id}
                                        value={template.id}
                                        className="cursor-pointer py-1.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          {thumb && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={thumb}
                                              alt={label}
                                              className="w-7 h-9 object-cover rounded border border-gray-200 shrink-0 bg-gray-100 shadow-sm"
                                            />
                                          )}
                                          <span className="font-medium text-sm text-gray-800">
                                            {label}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}

                                {/* Uploaded Sheets */}
                                {uploadedPdfs.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 z-10 border-b border-gray-100 mt-2">
                                      Uploaded Sheets
                                    </div>
                                    {uploadedPdfs.map((pdf) => (
                                      <SelectItem
                                        key={pdf.name}
                                        value={pdf.name}
                                        className="cursor-pointer py-1.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-7 h-9 bg-red-50 border border-red-200 rounded flex items-center justify-center text-[10px] font-bold text-red-600 shrink-0 shadow-sm">
                                            PDF
                                          </div>
                                          <span className="font-medium text-sm text-gray-800 truncate max-w-[200px]">
                                            {pdf.name}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="mt-4 w-full">
                            <label className="text-[#666666]">
                              Realtor Image
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                              {/* Circle Preview */}
                              <div className="flex items-center gap-x-[6px]">
                                <div className="w-[62px] h-[62px] bg-[#E4E4E4] rounded-full overflow-hidden border">
                                  {realtorPreview && (
                                    <Image
                                      unoptimized
                                      src={realtorPreview}
                                      alt="Realtor Preview"
                                      width={62}
                                      height={62}
                                      className="object-cover w-full h-full rounded-full"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Button */}
                              <div className="flex flex-1 w-full">
                                <div className="flex flex-col gap-3 justify-between w-full self-center">
                                  <div>
                                    <button
                                      type="button"
                                      onClick={triggerRealtorInput}
                                      className="px-4 py-2 bg-[#E4E4E4] text-base font-normal w-[156px] h-full rounded-[6px] text-[#666666] border border-[#A8A8A8]"
                                    >
                                      Choose Image
                                    </button>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    ref={realtorInputRef}
                                    onChange={handleRealtorChange}
                                    className="hidden"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="space-y-4 mt-4">
                            {/* Email Link */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Email Link
                              </label>
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@gmail.com"
                                className="pl-2 pr-2 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB] text-black rounded-md placeholder:text-[#7D7D7D]"
                              />
                            </div>

                            {/* LinkedIn Link */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                LinkedIn Link
                              </label>
                              <input
                                type="url"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                placeholder="linkedin.com/in/yourname"
                                className="pl-2 pr-2 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB] text-black rounded-md placeholder:text-[#7D7D7D]"
                              />
                            </div>

                            {/* Phone Number */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="123-123-1234"
                                className="pl-2 pr-2 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB] text-black rounded-md placeholder:text-[#7D7D7D]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full flex-col">
                        <div className="mb-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTemplate("");
                              setSelectedSheetUuid(null);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] h-[32px] w-full sm:w-[20%] transition-colors border-2 ${userType}-border ${userType}-bg text-white rounded-[6px] font-[500] hover:opacity-80`}
                          >
                            ← Back
                          </button>
                        </div>
                        <div className="flex w-full">
                          <div className="w-full sm:w-[20%]">
                            <label htmlFor="">Template</label>
                            <Select
                              value={selectedTemplate}
                              onValueChange={handleTemplateChange}
                            >
                              <SelectTrigger className="w-full h-[52px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                                <SelectValue placeholder="Select Template" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Listing Flyers */}
                                <div className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 z-10 border-b border-gray-100">
                                  Listing Flyers
                                </div>
                                {templateImages
                                  .filter(
                                    (template) => template.type === "listing",
                                  )
                                  .map((template) => {
                                    const thumb = getThumbnailUrls(
                                      template.id,
                                    )[0];
                                    const label = getTemplateLabel(template.id);
                                    return (
                                      <SelectItem
                                        key={template.id}
                                        value={template.id}
                                        className="cursor-pointer py-1.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          {thumb && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={thumb}
                                              alt={label}
                                              className="w-7 h-9 object-cover rounded border border-gray-200 shrink-0 bg-gray-100 shadow-sm"
                                            />
                                          )}
                                          <span className="font-medium text-sm text-gray-800">
                                            {label}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}

                                {/* Tabloid Sheets */}
                                <div className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 z-10 border-b border-gray-100 mt-2">
                                  Tabloid Sheets
                                </div>
                                {templateImages
                                  .filter(
                                    (template) => template.type === "tabloid",
                                  )
                                  .map((template) => {
                                    const thumb = getThumbnailUrls(
                                      template.id,
                                    )[0];
                                    const label = getTemplateLabel(template.id);
                                    return (
                                      <SelectItem
                                        key={template.id}
                                        value={template.id}
                                        className="cursor-pointer py-1.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          {thumb && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={thumb}
                                              alt={label}
                                              className="w-7 h-9 object-cover rounded border border-gray-200 shrink-0 bg-gray-100 shadow-sm"
                                            />
                                          )}
                                          <span className="font-medium text-sm text-gray-800">
                                            {label}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}

                                {/* Uploaded Sheets */}
                                {uploadedPdfs.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0 z-10 border-b border-gray-100 mt-2">
                                      Uploaded Sheets
                                    </div>
                                    {uploadedPdfs.map((pdf) => (
                                      <SelectItem
                                        key={pdf.name}
                                        value={pdf.name}
                                        className="cursor-pointer py-1.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-7 h-9 bg-red-50 border border-red-200 rounded flex items-center justify-center text-[10px] font-bold text-red-600 shrink-0 shadow-sm">
                                            PDF
                                          </div>
                                          <span className="font-medium text-sm text-gray-800 truncate max-w-[200px]">
                                            {pdf.name}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem
                value="FeatureSheetPreview"
                className="feature-sheet-preview-item border-t-[1px] border-[#BBBBBB] relative z-[55]"
              >
                <AccordionTrigger
                  className={`px-[14px] py-[19px] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current hover:no-underline`}
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="flex items-center gap-2">
                      Feature Sheet Preview
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="grid gap-4 !overflow-visible !max-h-full preview-accordion-content">
                  <style>{`
                      .pdf-page {
                        scroll-margin-top: 140px;
                      }
                      /* Make AccordionTrigger Header sticky */
                      .feature-sheet-preview-item > h3 {
                        position: sticky !important;
                        top: 0 !important;
                        z-index: 60 !important;
                        border-top: 1px solid #BBBBBB;
                        border-bottom: 1px solid #BBBBBB;
                      }
                      /* Override Shadcn AccordionContent overflow */
                      .feature-sheet-preview-item > div {
                        overflow: visible !important;
                        clip-path: none !important;
                      }
                    `}</style>
                  <div className="flex flex-col border border-gray-200 rounded-md bg-gray-50 relative">
                    <div className="sticky top-[60px] z-[50] bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                      <div className="text-sm font-semibold text-gray-700">
                        Preview Navigation
                      </div>
                      <div
                        className="items-center gap-4 hidden md:flex"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPreviewPage > 1) {
                              scrollToPage(currentPreviewPage - 1);
                            }
                          }}
                          className={`px-4 py-1.5 bg-gray-100 rounded-md text-sm font-medium transition-colors cursor-pointer text-black ${currentPreviewPage <= 1 ? "opacity-50 pointer-events-none" : "hover:bg-gray-200"}`}
                        >
                          Previous
                        </div>
                        <span className="text-sm font-medium text-black min-w-[100px] text-center">
                          Page {currentPreviewPage} of {numPdfPages}
                        </span>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPreviewPage < numPdfPages) {
                              scrollToPage(currentPreviewPage + 1);
                            }
                          }}
                          className={`px-4 py-1.5 bg-gray-100 rounded-md text-sm font-medium transition-colors cursor-pointer text-black ${currentPreviewPage >= numPdfPages ? "opacity-50 pointer-events-none" : "hover:bg-gray-200"}`}
                        >
                          Next
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center p-8 pt-12">
                      <div className="relative">
                        <div
                          id="pdf-section"
                          ref={pdfSectionRef}
                          style={pdfSectionStyle}
                        >
                          {selectedTemplate === "BCFPStandard" && (
                            <BcfpStandard
                              key={selectedSheetUuid || "new-BCFPStandard"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {/* {selectedTemplate === "BCFPStandard1" && <BcfpStandard1 orderData={orderData || null} />} */}
                          {selectedTemplate === "BCFPStandard2" && (
                            <BcfpStandard2
                              key={selectedSheetUuid || "new-BCFPStandard2"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard3" && (
                            <BcfpStandard3
                              key={selectedSheetUuid || "new-BCFPStandard3"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard4" && (
                            <BcfpStandard4
                              key={selectedSheetUuid || "new-BCFPStandard4"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {/* {selectedTemplate === "BCFP Standard5" && <BcfpStandard5 orderData={orderData || null} />} */}
                          {selectedTemplate === "BCFPStandard6" && (
                            <BcfpStandard6
                              key={selectedSheetUuid || "new-BCFPStandard6"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard7" && (
                            <BcfpStandard7
                              key={selectedSheetUuid || "new-BCFPStandard7"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard8" && (
                            <BcfpStandard8
                              key={selectedSheetUuid || "new-BCFPStandard8"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard9" && (
                            <BcfpStandard9
                              key={selectedSheetUuid || "new-BCFPStandard9"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard10" && (
                            <BcfpStandard10
                              key={selectedSheetUuid || "new-BCFPStandard10"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard11" && (
                            <BcfpStandard11
                              key={selectedSheetUuid || "new-BCFPStandard11"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard12" && (
                            <BcfpStandard12
                              key={selectedSheetUuid || "new-BCFPStandard12"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard13" && (
                            <BcfpStandard13
                              key={selectedSheetUuid || "new-BCFPStandard13"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard14" && (
                            <BcfpStandard14
                              key={selectedSheetUuid || "new-BCFPStandard14"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard15" && (
                            <BcfpStandard15
                              key={selectedSheetUuid || "new-BCFPStandard15"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard16" && (
                            <BcfpStandard16
                              key={selectedSheetUuid || "new-BCFPStandard16"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard17" && (
                            <BcfpStandard17
                              key={selectedSheetUuid || "new-BCFPStandard17"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard18" && (
                            <BcfpStandard18
                              key={selectedSheetUuid || "new-BCFPStandard18"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard19" && (
                            <BcfpStandard19
                              key={selectedSheetUuid || "new-BCFPStandard19"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard20" && (
                            <BcfpStandard20
                              key={selectedSheetUuid || "new-BCFPStandard20"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard21" && (
                            <BcfpStandard21
                              key={selectedSheetUuid || "new-BCFPStandard21"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard22" && (
                            <BcfpStandard22
                              key={selectedSheetUuid || "new-BCFPStandard22"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard23" && (
                            <BcfpStandard23
                              key={selectedSheetUuid || "new-BCFPStandard23"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                          {selectedTemplate === "BCFPStandard24" && (
                            <BcfpStandard24
                              key={selectedSheetUuid || "new-BCFPStandard24"}
                              ref={activeStandardRef}
                              orderData={orderData || null}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    {!isReadonly && (
                      <>
                        {/* Print Request Drawer */}
                        <div className="fixed bottom-0 right-0 p-4 border-l border-t border-gray-200 bg-white rounded-tl-lg shadow-lg z-50 hidden">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-gray-800">
                              Print Request
                            </h3>
                          </div>
                          <PrintRequestModal
                            featureSheetUuid={selectedSheetUuid || ""}
                            orderUuid={orderData?.uuid || ""}
                            open={isPrintModalOpen}
                            onClose={() => setIsPrintModalOpen(false)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </form>
        )}
      </div>

      {/* Copy Style Popup */}
      <CopyStylePopup
        isOpen={copyStyleOpen}
        onClose={() => setCopyStyleOpen(false)}
        onApply={handleApplyStyle}
        currentSheetUuid={selectedSheetUuid}
        currentTemplateKey={selectedTemplate}
      />

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={(open) => {
          setConfirmOpen(open);
          if (!open) setSheetToDelete(null);
        }}
        onConfirm={() => {
          if (sheetToDelete) handleDeleteFeatureSheet(sheetToDelete);
        }}
        showAgain={showAgain}
        toggleShowAgain={handleToggleShowAgain}
        dialogType="delete"
        title="Confirm Deletion"
        description="Are you sure you want to delete this feature sheet? This action cannot be undone."
      />
      <PrintRequestModal
        open={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        featureSheetUuid={selectedSheetUuid}
        agentId={
          orderData?.agent?.uuid ||
          (userType === "agent" ? userInfo?.uuid : undefined)
        }
        propertyId={listingId || orderData?.property?.uuid}
        tourId={filesData?.uuid || orderData?.tours?.[0]?.uuid}
        orderUuid={orderData?.uuid}
        orderData={orderData}
        onTourCreated={setFilesData}
      />

      {isPaymentModalOpen && (
        <InvoicePaymentDialog
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          orderData={orderData}
          currentService={null}
          activeTab="feature_sheets"
          userType={userType}
          url={typeof window !== "undefined" ? window.location.href : ""}
        />
      )}
    </>
  );
});

const CreateFeatureSheetComponent = CreateFeatureSheet;
CreateFeatureSheetComponent.displayName = "CreateFeatureSheet";
export default CreateFeatureSheetComponent;
