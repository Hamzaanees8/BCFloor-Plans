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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { HexColorPicker } from "react-colorful";
import { Order } from "../../orders/page";
import { useFileManagerContext, initialFormData } from "../FileManagerContext";
import BcfpStandard from "./BcfpStandard";

import DownloadPdf from "./DownloadPdf";
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
} from "../types/featureSheetTypes";
import CopyStylePopup from "./CopyStylePopup";

interface FeatureSheetComponentRef {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface TourSettingProps {
  orderData: Order | null;
}

export interface CreateFeatureSheetRef {
  handleSave: () => Promise<void>;
}

const CreateFeatureSheet = forwardRef<CreateFeatureSheetRef, TourSettingProps>(
  function CreateFeatureSheet({ orderData }, ref) {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement | null>(null);
    const [email, setEmail] = useState<string>("");
    const [linkedin, setLinkedin] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const {
      formData,
      setFormData,
      updateFormData,
      featureSheets,
      setFeatureSheets,
    } = useFileManagerContext();
    const { userType } = useAppContext();
    const [openColorPicker, setOpenColorPicker] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef1 = useRef<HTMLDivElement | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [realtorPreview, setRealtorPreview] = useState<string | null>(null);
    const realtorInputRef = useRef<HTMLInputElement | null>(null);
    const [customPdf, setCustomPdf] = useState<{
      name: string;
      url: string;
    } | null>(null);
    const [uploadedPdfs, setUploadedPdfs] = useState<
      { name: string; url: string }[]
    >([]);
    const [activeTab, setActiveTab] = useState<"listing" | "tabloid">("listing");
    const activeStandardRef = useRef<FeatureSheetComponentRef>(null);
    const [selectedSheetUuid, setSelectedSheetUuid] = useState<string | null>(null);
    const [copyStyleOpen, setCopyStyleOpen] = useState(false);

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (withBleed: boolean) => {
      setIsDownloading(true);
      try {
        const propertyAddress = orderData?.property_address || "Property";
        // Remove .pdf extension if it exists (e.g. for custom uploads)
        const sheetName = selectedTemplate.replace(/\.pdf$/i, "");
        const fileName = `${propertyAddress.replace(/[/\\?%*:|"<>]/g, "-")}_${sheetName}.pdf`;

        await DownloadPdf(
          "pdf-section",
          fileName,
          withBleed
        );
      } catch (error) {
        console.error("Download failed:", error);
        toast.error("Failed to generate PDF. Please try again.");
      } finally {
        setIsDownloading(false);
      }
    };

    const templateImages = [
      { id: "BCFPStandard2", type: "tabloid", url: "BcfpStandard2" },
      { id: "BCFPStandard3", type: "tabloid", url: "BcfpStandard3" },
      { id: "BCFPStandard4", type: "tabloid", url: "BcfpStandard4" },
      { id: "BCFPStandard6", type: "tabloid", url: "BcfpStandard6" },
      { id: "BCFPStandard7", type: "tabloid", url: "BcfpStandard7" },
      { id: "BCFPStandard8", type: "tabloid", url: "BcfpStandard8" },
      { id: "BCFPStandard9", type: "tabloid", url: "BcfpStandard9" },
      { id: "BCFPStandard10", type: "tabloid", url: "BcfpStandard10" },
      { id: "BCFPStandard11", type: "tabloid", url: "BcfpStandard11" },
      { id: "BCFPStandard12", type: "tabloid", url: "BcfpStandard12" },
      { id: "BCFPStandard13", type: "tabloid", url: "BcfpStandard13" },
      { id: "BCFPStandard14", type: "tabloid", url: "BcfpStandard14" },
      { id: "BCFPStandard15", type: "listing", url: "BcfpStandard15" },
      { id: "BCFPStandard16", type: "listing", url: "BcfpStandard16" },
      { id: "BCFPStandard17", type: "listing", url: "BcfpStandard17" },
      { id: "BCFPStandard18", type: "listing", url: "BcfpStandard18" },
      { id: "BCFPStandard19", type: "listing", url: "BcfpStandard19" },
      { id: "BCFPStandard20", type: "listing", url: "BcfpStandard20" },
      { id: "BCFPStandard21", type: "listing", url: "BcfpStandard21" },
      { id: "BCFPStandard22", type: "listing", url: "BcfpStandard22" },
      { id: "BCFPStandard23", type: "listing", url: "BcfpStandard23" },
      { id: "BCFPStandard24", type: "listing", url: "BcfpStandard24" },
    ];

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
            result = await featureSheetService.updateFeatureSheet(selectedSheetUuid, payload);
            // Update local state list
            setFeatureSheets(prev => prev.map(s => s.uuid === selectedSheetUuid ? result : s));
          } else {
            result = await featureSheetService.uploadFeatureSheet(payload);
            setSelectedSheetUuid(result.uuid);
            // Add to local state list
            setFeatureSheets(prev => [...prev, result]);
          }

          toast.success("Feature sheet saved successfully!");
        } else {
          toast.error("Save functionality is not available for this template yet.");
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
          const existingField = mergedContent[key];
          if (existingField && typeof existingField === "object" && "value" in existingField) {
            mergedContent[key] = {
              ...(existingField as StyledTextField),
              style: contentStyles[key],
            };
          } else {
            // Field doesn't exist in current sheet yet — add with empty value + source style
            mergedContent[key] = {
              value: "",
              style: contentStyles[key],
            };
          }
        }

        // 4. Build a merged payload to hand to importFromPayload
        const mergedPayload: FeatureSheetResponse = {
          ...sourceSheet,             // carry over metadata shape
          id: 0,                      // placeholder — won't be saved
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
              position: imageStyles[img.slot]?.position ?? img.meta?.position ?? { x: 0, y: 0 },
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
            // Don't auto-select a template - let user choose from the grid
          }
        } catch (error) {
          console.error("Error fetching existing feature sheets:", error);
        }
      };

      fetchFeatureSheets();
    }, [orderData?.uuid, setFeatureSheets]);

    // Load data into formData when selectedTemplate changes
    useEffect(() => {
      if (!selectedTemplate || featureSheets.length === 0) return;

      const sheetData = featureSheets.find(
        (s) => s.template_key === selectedTemplate,
      );
      if (sheetData) {
        console.log("Loading data for template:", selectedTemplate, sheetData);
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
      }
      // We intentionally only run this when selectedTemplate or featureSheets (data source) changes.

      // Including formData components in deps creates a loop.
    }, [selectedTemplate, featureSheets, updateFormData, orderData?.agent.avatar, orderData?.agent.avatar_url]);

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
        const pdfData = { name: file.name, url: newSheet.pdf_url || "" };
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
      const savedSheet = featureSheets.find(s => s.template_key === template);
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

    const templateOptions = [
      "BCFPStandard",
      // "BCFPStandard1",
      "BCFPStandard2",
      "BCFPStandard3",
      "BCFPStandard4",
      "BCFPStandard6",
      "BCFPStandard7",
      "BCFPStandard8",
      "BCFPStandard9",
      "BCFPStandard10",
      "BCFPStandard11",
      "BCFPStandard12",
      "BCFPStandard13",
      "BCFPStandard14",
      "BCFPStandard15",
      "BCFPStandard16",
      "BCFPStandard17",
      "BCFPStandard18",
      "BCFPStandard19",
      "BCFPStandard20",
      "BCFPStandard21",
      "BCFPStandard22",
      "BCFPStandard23",
      "BCFPStandard24",
      ...uploadedPdfs.map((pdf) => pdf.name),
    ];

    return (
      <>
      <div className="w-full h-auto">
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
              <DropdownMenuContent align="start" className="w-[164px]">
                <DropdownMenuItem
                  onClick={() => handleDownload(false)}
                  className="cursor-pointer"
                >
                  Download (No Bleed)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownload(true)}
                  className="cursor-pointer"
                >
                  Download (3mm Bleed)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
          </div>
          <div className="text-center">
            <div
              className={`text-[16px] font-alexandria font-bold ${userType}-text`}
            >
              Feature Sheets
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div
                className={`text-[24px] font-alexandria font-normal leading-[18px] ${userType}-text`}
              >
                $155.00
              </div>
              <div className="text-[12px] font-alexandria font-normal text-[#7D7D7D]">
                25 Printed Copies
              </div>
            </div>
            <button
              className={`text-center px-4 py-2 text-[13px] w-[133px] h-[32px] transition-colors ${userType}-bg text-white  rounded-[6px] font-[500]`}
            >
              Paid
            </button>
          </div>
        </div>

        {!selectedTemplate && (
          <div className="flex flex-col items-center w-full">
            <div className="flex gap-[20px] justify-center items-center bg-[#E4E4E4] w-full h-[60px] border-t-[1px] border-[#BBBBBB]">
              <button
                onClick={() => setActiveTab("listing")}
                className={`flex items-center w-[200px] justify-center font-medium text-sm transition-colors h-[40px] rounded-[6px] ${activeTab === "listing"
                  ? `text-white border-b-2 ${userType}-bg`
                  : "bg-[#EEEEEE] hover:text-gray-700"
                  }`}
              >
                Listing Flyers
              </button>
              <button
                onClick={() => setActiveTab("tabloid")}
                className={`flex items-center w-[200px] justify-center font-medium text-sm transition-colors h-[40px] rounded-[6px] ${activeTab === "tabloid"
                  ? `text-white border-b-2  ${userType}-bg`
                  : "bg-[#EEEEEE] hover:text-gray-700"
                  }`}
              >
                Tabloid Feature Sheet
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

        {!selectedTemplate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-20 mt-8 mb-20 h-auto px-20">
            {/* Saved Feature Sheets Section */}
            {featureSheets.length > 0 && (
              <>
                <div className="col-span-full">
                  <h2 className={`text-[24px] font-semibold ${userType}-text mb-4`}>
                    Saved Feature Sheets
                  </h2>
                </div>
                {featureSheets
                  .filter((sheet) => {
                    const template = templateImages.find(
                      (t) => t.id === sheet.template_key,
                    );
                    return template?.type === activeTab;
                  })
                  .map((sheet) => {
                    const template = templateImages.find(
                      (t) => t.id === sheet.template_key,
                    );
                    return (
                      <div key={sheet.uuid} className="flex flex-col gap-2">
                        <div className="text-start">
                          <p className="text-[24px] text-[#666666]">
                            {sheet.template_key}
                          </p>
                          <p className="text-[12px] text-[#888888]">
                            Last updated:{" "}
                            {new Date(sheet.updated_at).toLocaleDateString()}
                          </p>
                          <p
                            className={`text-[15px] ${userType}-text hover:underline cursor-pointer`}
                            onClick={() => {
                              setSelectedTemplate(sheet.template_key);
                              setSelectedSheetUuid(sheet.uuid);
                            }}
                          >
                            Edit Feature Sheet
                          </p>
                        </div>
                        <div
                          onClick={() => {
                            setSelectedTemplate(sheet.template_key);
                            setSelectedSheetUuid(sheet.uuid);
                          }}
                          className={`cursor-pointer border-2 rounded-lg overflow-hidden hover:scale-[1.03] transition-transform ${selectedTemplate === sheet.template_key && selectedSheetUuid === sheet.uuid ? `${userType}-border shadow-md` : "border-gray-300 shadow-md"} relative`}
                        >
                          <div
                            className="w-full h-[400px] bg-center bg-no-repeat relative"
                            style={{
                              backgroundImage: `url(/${template?.url || sheet.template_key}.png)`,
                              backgroundSize: "contain",
                            }}
                          >
                            <div className={`absolute top-2 right-2 ${userType}-bg text-white text-xs px-2 py-1 rounded`}>
                              Saved
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div className="col-span-full mt-4">
                  <h2 className="text-[24px] font-semibold text-[#666666] mb-4">
                    Create New Feature Sheet
                  </h2>
                </div>
              </>
            )}

            {/* Template Options */}
            {templateImages
              .filter((template) => template.type === activeTab)
              .map((template) => (
                <div key={template.id} className="flex flex-col gap-2">
                  <div className="text-start">
                    <p className="text-[24px] text-[#666666]">{template.id}</p>
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
                    className={`cursor-pointer border-2 rounded-lg overflow-hidden hover:scale-[1.03] transition-transform ${selectedTemplate === template.id && !selectedSheetUuid
                      ? `${userType}-border shadow-md`
                      : "border-gray-300"
                      }`}
                  >
                    <div
                      className="w-full h-[400px] bg-center bg-no-repeat relative"
                      style={{
                        backgroundImage: `url(/${template.url}.png)`,
                        backgroundSize: "contain",
                      }}
                    >
                      <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded opacity-80">
                        New
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
        {selectedTemplate && (
          <form>
            <Accordion
              type="multiple"
              defaultValue={["FeatureSheetSettings", "FeatureSheetPreview"]}
              className="w-full space-y-4"
            >
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
                      <button className="text-center px-4 py-2 text-[13px] w-[133px] h-[32px] transition-colors bg-[#8E8E8E] text-white leading-3 rounded-[6px] font-[500]">
                        Upgrade Plan
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-6 ">
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
                            <div className="flex gap-3">
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
                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                              <SelectValue placeholder="Select Template" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Standard Templates */}
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                                Standard Templates
                              </div>
                              {templateOptions
                                .filter((opt) => opt.startsWith("BCFPStandard"))
                                .map((template) => (
                                  <SelectItem key={template} value={template}>
                                    {template}
                                  </SelectItem>
                                ))}

                              {/* Uploaded PDFs */}
                              {uploadedPdfs.length > 0 && (
                                <>
                                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase mt-2">
                                    Uploaded Sheets
                                  </div>
                                  {uploadedPdfs.map((pdf) => (
                                    <SelectItem key={pdf.name} value={pdf.name}>
                                      {pdf.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="mt-4 w-full">
                          <label className="text-[#666666]">Realtor Image</label>
                          <div className="flex gap-3 mt-2">
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
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="FeatureSheetPreview">
                <AccordionTrigger
                  className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                >
                  <span className="flex items-center gap-2">
                    Feature Sheet Preview
                  </span>
                </AccordionTrigger>
                <AccordionContent className="grid gap-4 !overflow-visible !max-h-full">
                  {customPdf && (
                    <div
                      id="pdf-section"
                      className="w-full bg-white"
                      style={{ height: "400vh" }}
                    >
                      <iframe
                        src={`${customPdf.url}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full border-none"
                        style={{
                          overflow: "hidden",
                          minHeight: "100vh",
                        }}
                        title="Custom Feature Sheet PDF"
                      />
                    </div>
                  )}

                  <div
                    id="pdf-section"
                    style={{ fontFamily: "'Alexandria', sans-serif" }}
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
      />
      </>
    );
  });

const CreateFeatureSheetComponent = CreateFeatureSheet;
CreateFeatureSheetComponent.displayName = "CreateFeatureSheet";
export default CreateFeatureSheetComponent;
