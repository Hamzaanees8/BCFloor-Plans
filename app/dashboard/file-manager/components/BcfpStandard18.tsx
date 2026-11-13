/* eslint-disable @next/next/no-img-element */
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Pencil,
  Trash,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock,
  Loader2,
  Square,
  Layers,
  Sun,
} from "lucide-react";
import ImageEditor from "./ImageEditor";
import { Order } from "../../orders/page";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetResponse,
  FeatureSheetPayload,
  TextStyle,
} from "../types/featureSheetTypes";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";

export interface BcfpStandard18Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard18Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

interface ImageSettingOptions {
  showBorder?: boolean;
  showShadow?: boolean;
  showWhiteBg?: boolean;
}

// ─── BoxIndicator ─────────────────────────────────────────────────────────────
interface BoxIndicatorProps {
  isVisible: boolean;
}

const BoxIndicator: React.FC<BoxIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      data-html2canvas-ignore="true"
      className="absolute inset-0 border-[3.5px] border-[#8B3DFF] pointer-events-none z-30 transition-all duration-100"
      style={{
        boxShadow:
          "0 0 0 1.5px rgba(255, 255, 255, 0.9), 0 0 8px rgba(139, 61, 255, 0.4)",
      }}
    />
  );
};

const BcfpStandard18 = forwardRef<BcfpStandard18Ref, BcfpStandard18Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── 1. Deletion & Restoration State ──────────────────────────────────────
    const [deletedDetailFields, setDeletedDetailFields] = useState<any[]>(
      formData.deletedDetailFields || [],
    );
    const [deletedStandardFieldIds, setDeletedStandardFieldIds] = useState<
      string[]
    >(formData.deletedStandardFieldIds || []);

    const isFieldDeleted = (id: string) => deletedStandardFieldIds.includes(id);

    const removeStandardField = (
      id: string,
      title: any,
      value: any,
      section: string,
      style?: TextStyle,
    ) => {
      setDeletedStandardFieldIds((prevStandard) => {
        if (prevStandard.includes(id)) return prevStandard;
        const newDeletedStandard = [...prevStandard, id];
        const extractStr = (v: any): string => {
          if (v === null || v === undefined) return "";
          if (typeof v === "string") return v;
          if (typeof v === "object" && "value" in v) return extractStr(v.value);
          if (Array.isArray(v)) return v.map(extractStr).join("\n");
          return String(v);
        };
        const deletedItem: DeletedDetailFieldItem = {
          id,
          title: extractStr(title) || id,
          value: extractStr(value),
          section,
          style,
          deletedAt: Date.now(),
        };
        setDeletedDetailFields((prevDetail) => {
          const newDeletedDetail = [
            ...prevDetail.filter((f) => f.id !== id),
            deletedItem,
          ];
          updateFormData({
            deletedStandardFieldIds: newDeletedStandard,
            deletedDetailFields: newDeletedDetail,
          });
          return newDeletedDetail;
        });
        return newDeletedStandard;
      });
    };

    const restoreDetailField = useCallback(
      (id: string) => {
        setDeletedStandardFieldIds((prevStandard) => {
          const updatedStandard = prevStandard.filter((fId) => fId !== id);
          setDeletedDetailFields((prevDetail) => {
            const updatedDeleted = prevDetail.filter((f) => f.id !== id);
            updateFormData({
              deletedStandardFieldIds: updatedStandard,
              deletedDetailFields: updatedDeleted,
            });
            return updatedDeleted;
          });
          return updatedStandard;
        });
      },
      [updateFormData],
    );

    const restoreAllDetailFields = useCallback(() => {
      setDeletedStandardFieldIds([]);
      setDeletedDetailFields([]);
      updateFormData({ deletedStandardFieldIds: [], deletedDetailFields: [] });
    }, [updateFormData]);

    useEffect(() => {
      if (setRestoreDetailFieldHandler)
        setRestoreDetailFieldHandler(() => restoreDetailField);
      if (setRestoreAllDetailFieldsHandler)
        setRestoreAllDetailFieldsHandler(() => restoreAllDetailFields);
      return () => {
        if (setRestoreDetailFieldHandler) setRestoreDetailFieldHandler(null);
        if (setRestoreAllDetailFieldsHandler)
          setRestoreAllDetailFieldsHandler(null);
      };
    }, [
      restoreDetailField,
      restoreAllDetailFields,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    ]);

    // ── 2. Text Fields & Labels ────────────────────────────────────────────────
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [number, setNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [byLawRestrictions, setByLawRestrictions] = useState("");
    const [maintenanceFees, setMaintenanceFees] = useState("");
    const [maintenanceFeesInclude, setMaintenanceFeesInclude] = useState("");
    const [featuresIncluded, setFeaturesIncluded] = useState("");
    const [siteInfluences, setSiteInfluences] = useState("");
    const [amenities, setAmenities] = useState("");
    const [mlsNumber, setMlsNumber] = useState("");
    const [view, setView] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [patioSqft, setPatioSqft] = useState("");
    const [ceilingHeight, setCeilingHeight] = useState("");

    // Editable Labels
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM");
    const [sqftLabel, setSqftLabel] = useState("SQ FT");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [numberLabel, setNumberLabel] = useState("");
    const [roadLabel, setRoadLabel] = useState("");
    const [byLawLabel, setByLawLabel] = useState("BY-LAW RESTRICTIONS:");
    const [maintFeesLabel, setMaintFeesLabel] = useState("MAINT. FEES:");
    const [maintFeesIncludeLabel, setMaintFeesIncludeLabel] = useState(
      "MAINT. FEES INCLUDE:",
    );
    const [featuresIncludedLabel, setFeaturesIncludedLabel] =
      useState("FEATURES INCLUDED:");
    const [siteInfluencesLabel, setSiteInfluencesLabel] =
      useState("SITE INFLUENCES:");
    const [amenitiesLabel, setAmenitiesLabel] = useState("AMENITIES:");
    const [viewLabel, setViewLabel] = useState("VIEW:");
    const [mlsLabel, setMlsLabel] = useState("MLS* ");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
    );
    const [floorPlanDisclaimerText, setFloorPlanDisclaimerText] = useState(
      "**While all reasonable attempts have been made to ensure accuracy and the square footage and room dimensions are believed to be correct to ANSI Standards, due to the possibility of human error the information cannot be guaranteed. E&O Insured for $1,000,000",
    );
    const [footerCredit, setFooterCredit] = useState(
      "DESIGNED AND PRINTED BY BC FLOOR PLANS",
    );

    // ── 3. Bleed & Guide ─────────────────────────────────────────────────────
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed =
      propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide =
      propShowGuide !== undefined ? propShowGuide : showGuideState;

    // ── 4. Styles, Positions & Locks ──────────────────────────────────────────
    const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>({
      addressCode: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#4A4A4A",
      },
      roadName: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#4A4A4A",
      },
      numberLabel: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#4A4A4A",
      },
      roadLabel: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#4A4A4A",
      },
      cityLine: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#4A4A4A",
      },
      bedroom: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      bedroomLabel: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      bathroom: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      bathroomLabel: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      sqft: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      sqftLabel: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      builtYearLabel: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      builtYear: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      amount: {
        fontSize: "18px",
        fontFamily: "sans-serif",
        fontWeight: "400",
        color: "#444444",
      },
      byLawLabel: {
        fontSize: "14px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      byLawRestrictions: {
        fontSize: "12px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      maintFeesLabel: {
        fontSize: "14px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      maintenanceFees: {
        fontSize: "12px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      maintFeesIncludeLabel: {
        fontSize: "14px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      maintenanceFeesInclude: {
        fontSize: "12px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      featuresIncludedLabel: {
        fontSize: "14px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      featuresIncluded: {
        fontSize: "12px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      siteInfluencesLabel: {
        fontSize: "14px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      siteInfluences: {
        fontSize: "12px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      amenitiesLabel: {
        fontSize: "14px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      amenities: {
        fontSize: "12px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      viewLabel: {
        fontSize: "14px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      view: {
        fontSize: "12px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      mlsLabel: {
        fontSize: "14px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      mlsNumber: {
        fontSize: "12px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "300",
      },
      contactLabel: {
        fontSize: "16px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "400",
        color: "#111827",
      },
      fullName: {
        fontSize: "16px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "400",
        color: "#111827",
      },
      propertyName: {
        fontSize: "13px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "400",
        color: "#111827",
      },
      phoneLabel: {
        fontSize: "13px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "400",
        color: "#111827",
      },
      number: {
        fontSize: "13px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "400",
        color: "#111827",
      },
      emailLabel: {
        fontSize: "13px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "400",
        color: "#111827",
      },
      email: {
        fontSize: "13px",
        fontFamily: "GothicRegular, sans-serif",
        fontWeight: "400",
        color: "#111827",
      },
      description: {
        fontSize: "12px",
        fontWeight: "400",
        fontStyle: "normal",
        color: "#ffffff",
      },
      disclaimerText: {
        fontSize: "7.5px",
        fontWeight: "700",
        color: "#000000",
      },
      footerCredit: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#3E3E3E",
      },
    });
    const updateFieldStyle = (field: string, style: TextStyle) =>
      setFieldStyles((prev) => ({
        ...prev,
        [field]: { ...prev[field], ...style },
      }));

    const [fieldPositions, setFieldPositions] = useState<
      Record<string, { x: number; y: number }>
    >({});
    const updateFieldPosition = (id: string, pos: { x: number; y: number }) => {
      setFieldPositions((prev) => ({ ...prev, [id]: pos }));
    };

    const [lockedSections, setLockedSections] = useState<
      Record<string, boolean>
    >({
      headerBar: false,
      specsBar: false,
      description: false,
      specsCol1: false,
      specsCol2: false,
      contactCard: false,
      page2Header: false,
      page2FloorPlan: false,
      page2Footer: false,
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const [imageSettings, setImageSettings] = useState<
      Record<string, ImageSettingOptions>
    >({
      image7: {
        showBorder: true,
        showShadow: true,
        showWhiteBg: true,
      },
    });

    const toggleImageSetting = (
      key: string,
      setting: keyof ImageSettingOptions,
    ) => {
      setImageSettings((prev) => {
        const current = prev[key] || {
          showBorder: true,
          showShadow: true,
          showWhiteBg: true,
        };
        return {
          ...prev,
          [key]: {
            ...current,
            [setting]: !current[setting],
          },
        };
      });
    };

    // ── 5. Image States ───────────────────────────────────────────────────────
    const [images, setImages] = useState({
      image1: null as string | null,
      image2: null as string | null,
      image3: null as string | null,
      image4: null as string | null,
      image5: null as string | null,
      image6: null as string | null,
      image7: null as string | null,
      image8: null as string | null,
      image9: null as string | null,
      image10: null as string | null,
      image11: null as string | null,
      image12: null as string | null,
      image13: null as string | null,
    });

    const [scale, setScale] = useState({
      image1: 1,
      image2: 1,
      image3: 1,
      image4: 1,
      image5: 1,
      image6: 1,
      image7: 1,
      image8: 1,
      image9: 1,
      image10: 1,
      image11: 1,
      image12: 1,
      image13: 1,
    });

    const [position, setPosition] = useState({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
      image8: { x: 0, y: 0 },
      image9: { x: 0, y: 0 },
      image10: { x: 0, y: 0 },
      image11: { x: 0, y: 0 },
      image12: { x: 0, y: 0 },
      image13: { x: 0, y: 0 },
    });

    const [rotation, setRotation] = useState({
      image1: 0,
      image2: 0,
      image3: 0,
      image4: 0,
      image5: 0,
      image6: 0,
      image7: 0,
      image8: 0,
      image9: 0,
      image10: 0,
      image11: 0,
      image12: 0,
      image13: 0,
    });

    const [dragging, setDragging] = useState({
      image1: false,
      image2: false,
      image3: false,
      image4: false,
      image5: false,
      image6: false,
      image7: false,
      image8: false,
      image9: false,
      image10: false,
      image11: false,
      image12: false,
      image13: false,
    });

    const lastPosition = useRef({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
      image8: { x: 0, y: 0 },
      image9: { x: 0, y: 0 },
      image10: { x: 0, y: 0 },
      image11: { x: 0, y: 0 },
      image12: { x: 0, y: 0 },
      image13: { x: 0, y: 0 },
    });

    // ── 6. Modal & Slot States ────────────────────────────────────────────────
    const [processingSlots, setProcessingSlots] = useState<
      Record<string, boolean>
    >({});
    const [imageUuids, setImageUuids] = useState<Record<string, string>>({});
    const [deletedImageSlots, setDeletedImageSlots] = useState<string[]>([]);
    const [deletedImageUuids, setDeletedImageUuids] = useState<string[]>([]);
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(
      null,
    );
    const [showGallery, setShowGallery] = useState(false);

    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
    const [activeSlot, setActiveSlot] = useState<string | null>(null);

    const isSlotActive = (key: string) =>
      hoveredSlot === key ||
      activeSlot === key ||
      Boolean(dragging[key as keyof typeof dragging]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-image-slot="true"]')) {
          setActiveSlot(null);
        }
      };
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // File inputs
    const fileInputRef1 = useRef<HTMLInputElement | null>(null);
    const fileInputRef2 = useRef<HTMLInputElement | null>(null);
    const fileInputRef3 = useRef<HTMLInputElement | null>(null);
    const fileInputRef4 = useRef<HTMLInputElement | null>(null);
    const fileInputRef5 = useRef<HTMLInputElement | null>(null);
    const fileInputRef6 = useRef<HTMLInputElement | null>(null);
    const fileInputRef7 = useRef<HTMLInputElement | null>(null);
    const fileInputRef8 = useRef<HTMLInputElement | null>(null);
    const fileInputRef9 = useRef<HTMLInputElement | null>(null);
    const fileInputRef10 = useRef<HTMLInputElement | null>(null);
    const fileInputRef11 = useRef<HTMLInputElement | null>(null);
    const fileInputRef12 = useRef<HTMLInputElement | null>(null);
    const fileInputRef13 = useRef<HTMLInputElement | null>(null);

    const getFileInputRef = (key: string) => {
      switch (key) {
        case "image1":
          return fileInputRef1;
        case "image2":
          return fileInputRef2;
        case "image3":
          return fileInputRef3;
        case "image4":
          return fileInputRef4;
        case "image5":
          return fileInputRef5;
        case "image6":
          return fileInputRef6;
        case "image7":
          return fileInputRef7;
        case "image8":
          return fileInputRef8;
        case "image9":
          return fileInputRef9;
        case "image10":
          return fileInputRef10;
        case "image11":
          return fileInputRef11;
        case "image12":
          return fileInputRef12;
        case "image13":
          return fileInputRef13;
        default:
          return fileInputRef1;
      }
    };

    // Auto populate agent logo if available
    useEffect(() => {
      if (orderData) {
        if (orderData.property) {
          if (orderData.property.listing_price)
            setAmount(orderData.property.listing_price.toString());
          if (orderData.property.bedrooms)
            setBedroom(orderData.property.bedrooms.toString());
          if (orderData.property.bathrooms)
            setBathroom(orderData.property.bathrooms.toString());
          if (orderData.property.square_footage)
            setSqft(orderData.property.square_footage.toString());
          if (orderData.property.year_constructed)
            setBuiltYear(orderData.property.year_constructed.toString());
          if (orderData.property.description)
            setDescription(orderData.property.description);
          if (orderData.property.mls_number)
            setMlsNumber(orderData.property.mls_number);

          let suite = orderData.property.suite
            ? String(orderData.property.suite).trim()
            : "";
          let rawAddress = (
            orderData.property.address ||
            (orderData as any).property_address ||
            ""
          ).trim();
          if (rawAddress.includes(",")) {
            rawAddress = rawAddress.split(",")[0].trim();
          }

          // 1. Detect if suite is prefixed in address (e.g. "101 - 3612 13 Ave" or "#101 3612 13 Ave")
          const suiteMatch = rawAddress.match(
            /^(?:#\s*|suite\s*|unit\s*)?(\d+[A-Za-z]?)\s*[-–—]\s*(.*)$/i,
          );
          if (suiteMatch) {
            if (!suite) suite = suiteMatch[1];
            rawAddress = suiteMatch[2].trim();
          }

          // 2. Separate Code, Street Number, and Street Name from rawAddress
          const twoNumMatch = rawAddress.match(
            /^(\d+[A-Za-z]?)\s+(\d+(?:st|nd|rd|th|[A-Za-z])?)\s+(.+)$/i,
          );
          const oneNumMatch = rawAddress.match(/^(\d+[A-Za-z]?)\s+(.+)$/);

          if (twoNumMatch) {
            setAddressCode(twoNumMatch[1]);
            setNumberLabel(twoNumMatch[2]);
            setRoadLabel(twoNumMatch[3]);
          } else if (oneNumMatch) {
            setNumberLabel(oneNumMatch[1]);
            setRoadLabel(oneNumMatch[2]);
          } else {
            setNumberLabel("");
            setRoadLabel(rawAddress);
          }

          // Suite -> roadName (if suite is null, empty or zero, leave as "" to show "0" via placeholder)
          if (!suite || suite === "0") {
            setRoadName("");
          } else {
            setRoadName(suite);
          }

          setDeletedStandardFieldIds((prev) =>
            prev.filter(
              (id) =>
                id !== "addressCode" &&
                id !== "addressHash" &&
                id !== "numberLabel" &&
                id !== "roadName" &&
                id !== "roadLabel",
            ),
          );

          // Clean city line
          const cityParts: string[] = [];
          if (orderData.property.city)
            cityParts.push(orderData.property.city.trim());
          if (orderData.property.province)
            cityParts.push(orderData.property.province.trim());
          if (orderData.property.postal_code)
            cityParts.push(orderData.property.postal_code.trim());

          let cleanCity = cityParts.join(", ");
          cleanCity = cleanCity
            .replace(/,\s*(?:CA|Canada)\s*,?/gi, ", ")
            .replace(/,\s*,+/g, ", ")
            .trim();
          if (cleanCity) setCityLine(cleanCity);
        }
        if (orderData.agent) {
          const agent = orderData.agent;
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if (agent.primary_phone) setNumber(agent.primary_phone);
          if (agent.company_name) setPropertyName(agent.company_name);

          const agentLogo =
            (agent as any)?.company_logo_url ||
            (agent as any)?.logo_url ||
            (agent as any)?.logo ||
            agent.avatar_url ||
            null;
          if (agentLogo) {
            setImages((prev) => ({
              ...prev,
              image7: prev.image7 || agentLogo,
            }));
          }
        }
      }
    }, [orderData]);

    // Image Handlers
    const handleImageChange = (
      key: keyof typeof images,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setDeletedImageSlots((prev) => prev.filter((s) => s !== key));
        setImages((prev) => ({ ...prev, [key]: url }));
      }
    };

    const handleDelete = (
      key: keyof typeof images,
      inputRef: React.RefObject<HTMLInputElement | null>,
    ) => {
      const existingUuid = imageUuids[key];
      if (existingUuid) {
        setDeletedImageUuids((prev) =>
          Array.from(new Set([...prev, existingUuid])),
        );
      }
      setDeletedImageSlots((prev) => Array.from(new Set([...prev, key])));
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (inputRef.current) inputRef.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const step = 0.03; // Smooth 3% zoom step
        const current = prev[key] ?? 1;
        const newScale = direction === "in" ? current + step : current - step;
        const rounded = Math.round(newScale * 1000) / 1000;
        const bounded = Math.min(Math.max(rounded, 0.1), 5);
        return { ...prev, [key]: bounded };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({
        ...prev,
        [key]: (prev[key] + 90) % 360,
      }));
    };

    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      if (e.altKey) return;
      setActiveSlot(key);
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      const dx = (e.clientX - lastPosition.current[key].x) / 0.85;
      const dy = (e.clientY - lastPosition.current[key].y) / 0.85;
      setPosition((prev) => ({
        ...prev,
        [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
      }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (key: keyof typeof images) => {
      setDragging((prev) => ({ ...prev, [key]: false }));
    };

    const handleMouseLeave = (key: keyof typeof images) => {
      setDragging((prev) => ({ ...prev, [key]: false }));
    };

    const openImageSourceModal = (imageSlot: string, e?: React.MouseEvent) => {
      if (e?.altKey) return;
      setCurrentImageSlot(imageSlot);
      setShowGallery(true);
    };

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (!currentImageSlot) return;
      setDeletedImageSlots((prev) =>
        prev.filter((s) => s !== currentImageSlot),
      );
      setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    // Helper renderer for image slot containers
    const renderImageSlot = (
      key: keyof typeof images,
      containerClassName: string,
      placeholderText = "Select Image",
      isLogoSlot = false,
      style?: React.CSSProperties,
    ) => {
      const inputRef = getFileInputRef(key);
      const hasImage = !!images[key];
      const isTopPhoto =
        key === "image1" ||
        key === "image2" ||
        key === "image3" ||
        key === "image4";

      return (
        <div
          data-image-slot="true"
          style={style}
          {...(isTopPhoto ? { "data-no-shadow": "true" } : {})}
          {...(isLogoSlot
            ? {
                id: `agentLogo_${key}`,
                "data-slot-type": "logo",
                "data-logo-slot": "true",
              }
            : {})}
          className={`relative overflow-hidden group cursor-pointer ${containerClassName} ${
            isLogoSlot || key === "image6" || isTopPhoto
              ? ""
              : hasImage
                ? "bg-transparent shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
                : ""
          }`}
          onMouseEnter={() => setHoveredSlot(key)}
          onMouseLeave={() => setHoveredSlot(null)}
          onClick={(e) => {
            if (e.altKey) return;
            e.stopPropagation();
            setActiveSlot(key);
          }}
        >
          <BoxIndicator isVisible={isSlotActive(key)} />

          {/* Top-Left Image Controls Toolbar for Logo: Border, Shadow, Background */}
          {isLogoSlot && (
            <div
              data-html2canvas-ignore="true"
              className={`absolute top-1.5 left-1.5 z-30 flex gap-1 ${
                isSlotActive(key)
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
              } print:hidden`}
            >
              {/* Button 1: Border Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImageSetting(key, "showBorder");
                }}
                className={`p-1 rounded-full shadow text-xs transition-colors cursor-pointer ${
                  (imageSettings[key]?.showBorder ?? true)
                    ? "bg-[#8B3DFF] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                title={
                  (imageSettings[key]?.showBorder ?? true)
                    ? "Hide Border"
                    : "Show Border"
                }
              >
                <Square className="w-3 h-3" />
              </button>

              {/* Button 2: Shadow Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImageSetting(key, "showShadow");
                }}
                className={`p-1 rounded-full shadow text-xs transition-colors cursor-pointer ${
                  (imageSettings[key]?.showShadow ?? true)
                    ? "bg-[#8B3DFF] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                title={
                  (imageSettings[key]?.showShadow ?? true)
                    ? "Hide Shadow"
                    : "Show Shadow"
                }
              >
                <Layers className="w-3 h-3" />
              </button>

              {/* Button 3: Background Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImageSetting(key, "showWhiteBg");
                }}
                className={`p-1 rounded-full shadow text-xs transition-colors cursor-pointer ${
                  (imageSettings[key]?.showWhiteBg ?? true)
                    ? "bg-[#8B3DFF] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                title={
                  (imageSettings[key]?.showWhiteBg ?? true)
                    ? "Hide Background (Make Transparent)"
                    : "Show Background"
                }
              >
                <Sun className="w-3 h-3" />
              </button>
            </div>
          )}

          <div
            className="w-full h-full relative overflow-hidden flex items-center justify-center"
            onMouseMove={(e) => handleMouseMove(key, e)}
            onMouseUp={() => handleMouseUp(key)}
            onMouseLeave={() => handleMouseLeave(key)}
          >
            {hasImage ? (
              images[key] === "processing" ||
              images[key]?.includes("processing") ? (
                <div
                  data-html2canvas-ignore="true"
                  className="w-full h-full bg-slate-900/90 text-white flex flex-col items-center justify-center p-2 text-center pointer-events-none z-10"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-[#00B9F2] mb-1" />
                  <span className="text-xs font-semibold text-gray-200">
                    Processing...
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5">
                    Auto-refreshing every 30s
                  </span>
                </div>
              ) : (
                <>
                  <div
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleMouseDown(key, e)}
                  >
                    <ImageEditor
                      src={images[key]!}
                      scale={scale[key]}
                      position={position[key]}
                      rotation={rotation[key]}
                      objectFit={isLogoSlot ? "contain" : "cover"}
                      isProcessing={processingSlots[key]}
                    />
                  </div>

                  {/* Zoom Controls */}
                  <div
                    className={`absolute ${
                      key === "image6"
                        ? "bottom-[120px] left-3"
                        : key === "image5"
                          ? "bottom-[52px] left-3"
                          : "bottom-2 left-2"
                    } flex gap-1.5 ${
                      isSlotActive(key)
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    } z-30`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoom(key, "in");
                      }}
                      className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoom(key, "out");
                      }}
                      className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                  </div>

                  {/* Rotate */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRotate(key);
                    }}
                    className={`absolute ${key === "image5" ? "top-[48px]" : "top-2"} right-[70px] z-40 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 ${
                      isSlotActive(key)
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    } print:hidden`}
                    title="Rotate image"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-gray-700" />
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={(e) => openImageSourceModal(key, e)}
                    className={`absolute ${key === "image5" ? "top-[48px]" : "top-2"} right-9 z-40 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 ${
                      isSlotActive(key)
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    }`}
                    title="Edit image"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-700" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(key, inputRef);
                    }}
                    className={`absolute ${key === "image5" ? "top-[48px]" : "top-2"} right-2 z-40 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 ${
                      isSlotActive(key)
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    }`}
                    title="Delete image"
                  >
                    <Trash className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </>
              )
            ) : (
              <div
                data-html2canvas-ignore="true"
                onClick={(e) => openImageSourceModal(key, e)}
                className={`w-full h-full flex items-center justify-center cursor-pointer border border-dashed transition-colors p-2 text-center ${
                  key === "image6"
                    ? "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 font-medium text-sm rounded shadow-sm"
                    : "bg-gray-200 text-gray-600 border-gray-400 font-medium text-xs hover:bg-gray-300"
                }`}
              >
                {placeholderText}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              ref={inputRef}
              onChange={(e) => handleImageChange(key, e)}
              className="hidden"
            />
          </div>
        </div>
      );
    };

    // ── 7. FormData Sync ─────────────────────────────────────────────────────
    useEffect(() => {
      updateFormData({
        deletedStandardFieldIds,
        deletedDetailFields,
        byLawRestrictions,
        maintenanceFees,
        maintenanceFeesInclude,
        featuresIncluded,
        siteInfluences,
        amenities,
        view,
        description,
        fullName,
        email,
        propertyName,
        amount,
        number,
        addressCode,
        roadName,
        cityLine,
        bedroom,
        bathroom,
        sqft,
        builtYear,
        patioSqft,
        ceilingHeight,
        mlsNumber,
        contactLabel,
        phoneLabel,
        emailLabel,
        bedroomLabel,
        bathroomLabel,
        sqftLabel,
        builtYearLabel,
        numberLabel,
        roadLabel,
        byLawLabel,
        maintFeesLabel,
        maintFeesIncludeLabel,
        featuresIncludedLabel,
        siteInfluencesLabel,
        amenitiesLabel,
        viewLabel,
        mlsLabel,
        disclaimerText,
        floorPlanDisclaimerText,
        footerCredit,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldPositions,
        fieldStyles,
        imageSettings,
      } as any);
    }, [
      deletedStandardFieldIds,
      deletedDetailFields,
      byLawRestrictions,
      maintenanceFees,
      maintenanceFeesInclude,
      featuresIncluded,
      siteInfluences,
      amenities,
      view,
      description,
      fullName,
      email,
      propertyName,
      amount,
      number,
      addressCode,
      roadName,
      cityLine,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      patioSqft,
      ceilingHeight,
      mlsNumber,
      contactLabel,
      phoneLabel,
      emailLabel,
      bedroomLabel,
      bathroomLabel,
      sqftLabel,
      builtYearLabel,
      numberLabel,
      roadLabel,
      byLawLabel,
      maintFeesLabel,
      maintFeesIncludeLabel,
      featuresIncludedLabel,
      siteInfluencesLabel,
      amenitiesLabel,
      viewLabel,
      mlsLabel,
      disclaimerText,
      floorPlanDisclaimerText,
      footerCredit,
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      fieldStyles,
      imageSettings,
      updateFormData,
    ]);


    // ── 8. Imperative Handle for Payload Export/Import ────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard18",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#404040",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "14.5px",
            },
          },
          realtorName: {
            value: fullName,
            style: {
              ...fieldStyles.fullName,
              fontSize: fieldStyles.fullName?.fontSize || "13px",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "10px",
            },
          },
          companyName: {
            value: propertyName,
            style: {
              ...fieldStyles.propertyName,
              fontSize: fieldStyles.propertyName?.fontSize || "11px",
            },
          },
          propertyNotesTitle: {
            value: roadName,
            style: {
              ...fieldStyles.roadName,
              fontSize: fieldStyles.roadName?.fontSize || "18px",
              fontFamily: fieldStyles.roadName?.fontFamily || "sans-serif",
              fontWeight: fieldStyles.roadName?.fontWeight || "500",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "11.5px",
            },
          },
          expandedDetail1Title: {
            value: "By-law Restrictions",
            style: fieldStyles.byLawLabel,
          },
          expandedDetail1Description: {
            value: byLawRestrictions,
            style: {
              ...fieldStyles.byLawRestrictions,
              fontSize: fieldStyles.byLawRestrictions?.fontSize || "11.5px",
            },
          },
          expandedDetail2Title: {
            value: "Maint. Fees",
            style: fieldStyles.maintFeesLabel,
          },
          expandedDetail2Description: {
            value: maintenanceFees,
            style: {
              ...fieldStyles.maintenanceFees,
              fontSize: fieldStyles.maintenanceFees?.fontSize || "11.5px",
            },
          },
          expandedDetail3Title: {
            value: "Maint. Fees Include",
            style: fieldStyles.maintFeesIncludeLabel,
          },
          expandedDetail3Description: {
            value: maintenanceFeesInclude,
            style: {
              ...fieldStyles.maintenanceFeesInclude,
              fontSize:
                fieldStyles.maintenanceFeesInclude?.fontSize || "11.5px",
            },
          },
          expandedDetail4Title: {
            value: "Features Included",
            style: fieldStyles.featuresIncludedLabel,
          },
          expandedDetail4Description: {
            value: featuresIncluded,
            style: {
              ...fieldStyles.featuresIncluded,
              fontSize: fieldStyles.featuresIncluded?.fontSize || "11.5px",
            },
          },
          keyHighlightLabel: {
            value: "Site Influences",
            style: fieldStyles.siteInfluencesLabel,
          },
          keyHighlights: siteInfluences
            ? siteInfluences.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            maintenanceFees,
            maintenanceFeesInclude,
            amenities,
            view,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            addressCode,
            roadName,
            cityLine,
            mlsNumber,
            patioSqft,
            ceilingHeight,
            contactLabel,
            phoneLabel,
            emailLabel,
            bedroomLabel,
            bathroomLabel,
            sqftLabel,
            builtYearLabel,
            numberLabel,
            roadLabel,
            byLawLabel,
            maintFeesLabel,
            maintFeesIncludeLabel,
            featuresIncludedLabel,
            siteInfluencesLabel,
            amenitiesLabel,
            viewLabel,
            mlsLabel,

            disclaimerText,
            floorPlanDisclaimerText,
            footerCredit,
            imageSettings,
            fieldStyles,
            fieldPositions,
            _lockedSections: lockedSections,
            _deletedDetailFields: deletedDetailFields,
            _deletedStandardFieldIds: deletedStandardFieldIds,
            _deletedImageSlots: deletedImageSlots,
            _deletedImageUuids: deletedImageUuids,
            deletedDetailFields,
            deletedStandardFieldIds,
            deletedImageSlots,
            deletedImageUuids,
          },
          images,
          deletedImageSlots,
          deletedImageUuids,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
          fieldPositions,
          fieldStyles,
        });
        payload.fieldPositions = fieldPositions;
        payload.fieldStyles = fieldStyles;
        (payload as any).deletedStandardFieldIds = deletedStandardFieldIds;
        (payload as any).deletedDetailFields = deletedDetailFields;
        (payload as any).deletedImageSlots = deletedImageSlots;
        (payload as any).deletedImageUuids = deletedImageUuids;
        if (payload.content) {
          (payload.content as any).fieldStyles = fieldStyles;
          (payload.content as any).fieldPositions = fieldPositions;
          (payload.content as any).deletedStandardFieldIds =
            deletedStandardFieldIds;
          (payload.content as any).deletedDetailFields = deletedDetailFields;
          (payload.content as any).deletedImageSlots = deletedImageSlots;
          (payload.content as any).deletedImageUuids = deletedImageUuids;
        }
        return payload;
      },
      importFromPayload: (payload: FeatureSheetResponse) => {
        if (!payload) return;
        const c = payload.content;
        const styles: Record<string, TextStyle> = {};
        const st = (field: any) => field?.style;

        const getValString = (val: any): string => {
          if (val === null || val === undefined) return "";
          if (typeof val === "string") return val;
          if (typeof val === "object" && "value" in val)
            return getValString(val.value);
          if (Array.isArray(val)) return val.map(getValString).join("\n");
          return String(val);
        };

        if (c) {
          if (c.offeredAtPrice?.value !== undefined)
            setAmount(getValString(c.offeredAtPrice.value));
          if (st(c.offeredAtPrice)) styles.amount = st(c.offeredAtPrice);

          if (c.realtorName?.value !== undefined)
            setFullName(getValString(c.realtorName.value));
          if (st(c.realtorName)) styles.fullName = st(c.realtorName);

          if (c.companyName?.value !== undefined)
            setPropertyName(getValString(c.companyName.value));
          if (st(c.companyName)) styles.propertyName = st(c.companyName);

          if (c.emailLink?.value !== undefined)
            setEmail(getValString(c.emailLink.value));
          if (st(c.emailLink)) styles.email = st(c.emailLink);

          if (c.propertyNotesTitle?.value !== undefined)
            setRoadName(getValString(c.propertyNotesTitle.value));
          if (st(c.propertyNotesTitle))
            styles.roadName = st(c.propertyNotesTitle);

          if (c.propertyNotesDescription?.value !== undefined)
            setDescription(getValString(c.propertyNotesDescription.value));
          if (st(c.propertyNotesDescription))
            styles.description = st(c.propertyNotesDescription);

          if (c.expandedDetail1Description?.value !== undefined)
            setByLawRestrictions(
              getValString(c.expandedDetail1Description.value),
            );
          if (st(c.expandedDetail1Description))
            styles.byLawRestrictions = st(c.expandedDetail1Description);

          if (c.expandedDetail2Description?.value !== undefined)
            setMaintenanceFees(
              getValString(c.expandedDetail2Description.value),
            );
          if (st(c.expandedDetail2Description))
            styles.maintenanceFees = st(c.expandedDetail2Description);

          if (c.expandedDetail3Description?.value !== undefined)
            setMaintenanceFeesInclude(
              getValString(c.expandedDetail3Description.value),
            );
          if (st(c.expandedDetail3Description))
            styles.maintenanceFeesInclude = st(c.expandedDetail3Description);

          if (c.expandedDetail4Description?.value !== undefined)
            setFeaturesIncluded(
              getValString(c.expandedDetail4Description.value),
            );
          if (st(c.expandedDetail4Description))
            styles.featuresIncluded = st(c.expandedDetail4Description);

          if (c.keyHighlights) {
            const kh: any = c.keyHighlights;
            if (Array.isArray(kh)) {
              setSiteInfluences(kh.join("\n"));
            } else if (Array.isArray(kh.value)) {
              setSiteInfluences(kh.value.join("\n"));
            }
          }

          if (c.otherDetails) {
            const details = c.otherDetails as Record<string, any>;
            if (details.maintenanceFees !== undefined)
              setMaintenanceFees(getValString(details.maintenanceFees));
            if (details.maintenanceFeesInclude !== undefined)
              setMaintenanceFeesInclude(
                getValString(details.maintenanceFeesInclude),
              );
            if (details.amenities !== undefined)
              setAmenities(getValString(details.amenities));
            if (details.view !== undefined) setView(getValString(details.view));
            if (details.bedroom !== undefined)
              setBedroom(getValString(details.bedroom));
            if (details.bathroom !== undefined)
              setBathroom(getValString(details.bathroom));
            if (details.sqft !== undefined) setSqft(getValString(details.sqft));
            if (details.builtYear !== undefined)
              setBuiltYear(getValString(details.builtYear));
            if (details.number !== undefined)
              setNumber(getValString(details.number));
            if (details.addressCode !== undefined)
              setAddressCode(getValString(details.addressCode));
            if (details.roadName !== undefined)
              setRoadName(getValString(details.roadName));
            if (details.cityLine !== undefined)
              setCityLine(getValString(details.cityLine));
            if (details.mlsNumber !== undefined)
              setMlsNumber(getValString(details.mlsNumber));
            if (details.patioSqft !== undefined)
              setPatioSqft(getValString(details.patioSqft));
            if (details.ceilingHeight !== undefined)
              setCeilingHeight(getValString(details.ceilingHeight));

            if (details.contactLabel !== undefined)
              setContactLabel(getValString(details.contactLabel));
            if (details.phoneLabel !== undefined)
              setPhoneLabel(getValString(details.phoneLabel));
            if (details.emailLabel !== undefined)
              setEmailLabel(getValString(details.emailLabel));
            if (details.bedroomLabel !== undefined)
              setBedroomLabel(getValString(details.bedroomLabel));
            if (details.bathroomLabel !== undefined)
              setBathroomLabel(getValString(details.bathroomLabel));
            if (details.sqftLabel !== undefined)
              setSqftLabel(getValString(details.sqftLabel));
            if (details.builtYearLabel !== undefined)
              setBuiltYearLabel(getValString(details.builtYearLabel));
            if (details.numberLabel !== undefined)
              setNumberLabel(getValString(details.numberLabel));
            if (details.roadLabel !== undefined)
              setRoadLabel(getValString(details.roadLabel));
            if (details.byLawLabel !== undefined)
              setByLawLabel(getValString(details.byLawLabel));
            if (details.maintFeesLabel !== undefined)
              setMaintFeesLabel(getValString(details.maintFeesLabel));
            if (details.maintFeesIncludeLabel !== undefined)
              setMaintFeesIncludeLabel(
                getValString(details.maintFeesIncludeLabel),
              );
            if (details.featuresIncludedLabel !== undefined)
              setFeaturesIncludedLabel(
                getValString(details.featuresIncludedLabel),
              );
            if (details.siteInfluencesLabel !== undefined)
              setSiteInfluencesLabel(getValString(details.siteInfluencesLabel));
            if (details.amenitiesLabel !== undefined)
              setAmenitiesLabel(getValString(details.amenitiesLabel));
            if (details.viewLabel !== undefined)
              setViewLabel(getValString(details.viewLabel));
            if (details.mlsLabel !== undefined)
              setMlsLabel(getValString(details.mlsLabel));
            if (details.disclaimerText !== undefined)
              setDisclaimerText(getValString(details.disclaimerText));
            if (details.floorPlanDisclaimerText !== undefined)
              setFloorPlanDisclaimerText(
                getValString(details.floorPlanDisclaimerText),
              );
            if (details.footerCredit !== undefined)
              setFooterCredit(getValString(details.footerCredit));
          }
        }

        // Parse DB & gallery images using parsePayloadToState
        const state = featureSheetService.parsePayloadToState(payload);

        const c18 = (payload?.content as Record<string, any>) || {};
        const od18 = (c18.otherDetails as Record<string, any>) || {};
        const incomingStyles18: Record<string, TextStyle> = {
          ...((od18.fieldStyles as Record<string, TextStyle>) || {}),
          ...((c18.fieldStyles as Record<string, TextStyle>) || {}),
          ...((state.fieldStyles as Record<string, TextStyle>) || {}),
          ...((payload.fieldStyles as Record<string, TextStyle>) || {}),
          ...styles,
        };

        if (incomingStyles18.fullName?.fontSize === "20px") {
          incomingStyles18.fullName = {
            ...incomingStyles18.fullName,
            fontSize: "13px",
          };
        }
        if (incomingStyles18.propertyName?.fontSize === "20px") {
          incomingStyles18.propertyName = {
            ...incomingStyles18.propertyName,
            fontSize: "11px",
          };
        }
        if (incomingStyles18.number?.fontSize === "20px") {
          incomingStyles18.number = {
            ...incomingStyles18.number,
            fontSize: "11px",
          };
        }
        if (incomingStyles18.email?.fontSize === "20px") {
          incomingStyles18.email = {
            ...incomingStyles18.email,
            fontSize: "10px",
          };
        }
        const barFieldKeys = [
          "addressCode",
          "roadName",
          "numberLabel",
          "roadLabel",
          "cityLine",
          "bedroom",
          "bedroomLabel",
          "bathroom",
          "bathroomLabel",
          "sqft",
          "sqftLabel",
          "builtYearLabel",
          "builtYear",
          "amount",
        ];
        barFieldKeys.forEach((fKey) => {
          if (!incomingStyles18[fKey]) {
            incomingStyles18[fKey] = {
              fontSize: "18px",
              fontFamily: "sans-serif",
              fontWeight: "400",
              color:
                fKey.includes("bedroom") ||
                fKey.includes("bathroom") ||
                fKey.includes("sqft") ||
                fKey.includes("builtYear") ||
                fKey === "amount"
                  ? "#444444"
                  : "#4A4A4A",
            };
          } else {
            if (!incomingStyles18[fKey].fontSize) {
              incomingStyles18[fKey].fontSize = "18px";
            }
            if (
              incomingStyles18[fKey].fontFamily?.includes("Raleway") ||
              incomingStyles18[fKey].fontFamily?.includes("Gothic")
            ) {
              incomingStyles18[fKey].fontFamily = "sans-serif";
            }
            if (
              incomingStyles18[fKey].fontWeight === "500" ||
              incomingStyles18[fKey].fontWeight === "300" ||
              incomingStyles18[fKey].fontWeight === "100" ||
              incomingStyles18[fKey].fontWeight === "thin" ||
              incomingStyles18[fKey].fontWeight === "light"
            ) {
              incomingStyles18[fKey].fontWeight = "400";
            }
          }
        });

        if ((state as any).imageUuids) {
          setImageUuids((state as any).imageUuids);
        }
        if ((state as any).deletedImageSlots) {
          setDeletedImageSlots((state as any).deletedImageSlots);
        }
        if ((state as any).deletedImageUuids) {
          setDeletedImageUuids((state as any).deletedImageUuids);
        }

        const sProcessing =
          (state as any).processingSlots ||
          (payload as any).processingSlots ||
          {};
        const sDeleted =
          (state as any).deletedImageSlots || deletedImageSlots || [];
        setProcessingSlots(sProcessing);

        const savedDeletedStandard =
          od18._deletedStandardFieldIds ||
          od18.deletedStandardFieldIds ||
          (payload as any).deletedStandardFieldIds ||
          [];
        const savedDeletedDetails =
          od18._deletedDetailFields ||
          od18.deletedDetailFields ||
          (payload as any).deletedDetailFields ||
          [];

        if (Array.isArray(savedDeletedStandard)) {
          setDeletedStandardFieldIds(savedDeletedStandard);
        }
        if (Array.isArray(savedDeletedDetails)) {
          setDeletedDetailFields(savedDeletedDetails);
        }

        if (state.images) {
          setImages((prev) =>
            featureSheetService.mergeResolvedImages(
              prev,
              state.images as any,
              sProcessing,
              sDeleted,
            ),
          );
        }
        if (state.imageScales) {
          setScale((prev) => ({ ...prev, ...state.imageScales }));
        }
        if (state.imagePositions) {
          setPosition((prev) => ({ ...prev, ...state.imagePositions }));
        }
        if (state.imageRotations) {
          setRotation((prev) => ({ ...prev, ...state.imageRotations }));
        }
        if ((state as any).fieldPositions) {
          setFieldPositions((state as any).fieldPositions);
        }
        if (Object.keys(incomingStyles18).length > 0) {
          setFieldStyles((prev) => ({ ...prev, ...incomingStyles18 }));
        } else if (Object.keys(styles).length > 0) {
          setFieldStyles((prev) => ({ ...prev, ...styles }));
        }

        const savedImageSettings =
          (state as any).imageSettings ||
          (payload as any).imageSettings ||
          od18.imageSettings ||
          (c?.otherDetails as any)?.imageSettings;
        if (savedImageSettings) {
          setImageSettings((prev) => ({ ...prev, ...savedImageSettings }));
        }
      },
    }));

    const bleedHorizontalStyle = {
      marginLeft: showBleed ? "-0.375in" : "-0.25in",
      marginRight: showBleed ? "-0.375in" : "-0.25in",
      width: showBleed ? "calc(100% + 0.75in)" : "calc(100% + 0.5in)",
    };

    const topBleedStyle = {
      marginLeft: showBleed ? "-0.375in" : "-0.25in",
      marginRight: showBleed ? "-0.375in" : "-0.25in",
      marginTop: showBleed ? "-0.375in" : "-0.25in",
      width: showBleed ? "calc(100% + 0.75in)" : "calc(100% + 0.5in)",
    };

    const bottomBleedStyle = {
      marginLeft: showBleed ? "-0.375in" : "-0.25in",
      marginRight: showBleed ? "-0.375in" : "-0.25in",
      marginBottom: showBleed ? "-0.375in" : "-0.25in",
      width: showBleed ? "calc(100% + 0.75in)" : "calc(100% + 0.5in)",
    };

    return (
      <div className="flex flex-col items-center justify-center font-sans">
        {showGallery && (
          <FileManagerGallery
            isOpen={showGallery}
            onClose={() => {
              setShowGallery(false);
              setCurrentImageSlot(null);
            }}
            onImageSelect={handleGalleryImageSelect}
            usedImageUrls={Object.values(images).filter((url): url is string =>
              Boolean(url),
            )}
          />
        )}

        {/* --- PAGE 1 DIVIDER --- */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* --- PAGE 1 WRAPPER --- */}
        <div
          className="pdf-page bg-[#3E3E3E] shadow-xl relative overflow-hidden flex flex-col justify-between"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div
              data-safezone-container="true"
              className="relative w-full h-full flex flex-col justify-between z-10 select-none"
            >
              {/* Top Section: Brown Header Band & 4-Photo Row (Expanded to Bleed Edge) */}
              <div
                className="w-full shrink-0 relative z-10 flex flex-col"
                style={topBleedStyle}
              >
                {/* Top Brown Header Band */}
                <div
                  className="w-full bg-[#3E3E3E] shrink-0"
                  style={{
                    height: showBleed
                      ? "calc(25px + 0.375in)"
                      : "calc(25px + 0.25in)",
                  }}
                />

                {/* Top White Border Line */}
                <div
                  className="w-full bg-white shrink-0"
                  style={{ height: "3.5px", minHeight: "3.5px" }}
                />

                {/* Top 4-Photo Row (3mm extra width allocated to outer images for bleed trim) */}
                <div
                  className="w-full h-[136px] grid bg-[#3E3E3E] shrink-0"
                  style={{
                    gridTemplateColumns: showBleed
                      ? "calc(25% + 0.0625in) calc(25% - 0.0625in) calc(25% - 0.0625in) calc(25% + 0.0625in)"
                      : "repeat(4, minmax(0, 1fr))",
                  }}
                >
                  {renderImageSlot(
                    "image1",
                    "w-full h-full",
                    "Select image",
                    false,
                    { borderRight: "4.5px solid #ffffff" },
                  )}
                  {renderImageSlot(
                    "image2",
                    "w-full h-full",
                    "Select image",
                    false,
                    { borderRight: "4.5px solid #ffffff" },
                  )}
                  {renderImageSlot(
                    "image3",
                    "w-full h-full",
                    "Select image",
                    false,
                    { borderRight: "4.5px solid #ffffff" },
                  )}
                  {renderImageSlot("image4", "w-full h-full", "Select image")}
                </div>

                {/* Bottom White Border Line */}
                <div
                  className="w-full bg-white shrink-0"
                  style={{ height: "3.5px", minHeight: "3.5px" }}
                />
              </div>

              {/* Main Hero Photo Container with Overlay Title Header & Specs Summary Bars (Expanded to Bleed Edge) */}
              <div
                className="h-[460px] relative bg-[#3E3E3E] shrink-0 z-20"
                style={bleedHorizontalStyle}
              >
                {/* Main Hero Photo (Image 5) */}
                {renderImageSlot(
                  "image5",
                  "w-full h-full",
                  "Select Main Hero Photo",
                )}

                {/* Address & Logo Header Bar (Overlay on Top Edge of Main Image) */}
                <div
                  data-drag-container="true"
                  style={{
                    backgroundColor: "rgba(221, 216, 211, 0.65)",
                    paddingLeft: showBleed ? "48px" : "36px",
                    paddingRight: showBleed ? "48px" : "36px",
                  }}
                  className={`absolute top-0 left-0 right-0 h-[42px] flex items-center justify-between z-30 shrink-0 border-b font-serif transition-all duration-150 group/sec border border-transparent bg-[#DDD8D3]/65 backdrop-blur-sm ${
                    lockedSections.headerBar
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("headerBar");
                    }}
                    className={`absolute top-1 right-1 z-40 p-1 rounded-md transition-all duration-150
                      shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                      opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.headerBar
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                    title={
                      lockedSections.headerBar
                        ? "Unlock Header Bar Section"
                        : "Lock Header Bar Section"
                    }
                  >
                    {lockedSections.headerBar ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Lock</span>
                      </>
                    )}
                  </button>

                  {/* Left Address Line with 0000-0000 Suite # Number Road */}
                  <div className="flex items-center gap-1.5 text-[18px] text-[#4A4A4A] font-normal tracking-wide z-20 whitespace-nowrap">
                    {!isFieldDeleted("addressCode") && (
                      <DraggableBox
                        id="addressCode"
                        position={fieldPositions.addressCode}
                        onPositionChange={updateFieldPosition}
                        label="MLS / Code"
                        zoom={0.85}
                        disabled={lockedSections.headerBar}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "addressCode",
                            "MLS / Code",
                            addressCode,
                            "Header Bar",
                            fieldStyles.addressCode,
                          )
                        }
                        deleteTitle="Remove MLS / Code"
                      >
                        <StyledInput
                          value={addressCode}
                          onChange={(e) => setAddressCode(e.target.value)}
                          inputStyle={fieldStyles["addressCode"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("addressCode", s)
                          }
                          className="font-sans font-normal text-[18px] text-[#4A4A4A] bg-transparent focus:outline-none border-none placeholder-gray-600 leading-none whitespace-nowrap"
                          placeholder="0000-0000"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("roadName") && (
                      <DraggableBox
                        id="roadName"
                        position={fieldPositions.roadName}
                        onPositionChange={updateFieldPosition}
                        label="Suite #"
                        zoom={0.85}
                        disabled={lockedSections.headerBar}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "roadName",
                            "Suite #",
                            roadName,
                            "Header Bar",
                            fieldStyles.roadName,
                          )
                        }
                        deleteTitle="Remove Suite #"
                      >
                        <StyledInput
                          value={roadName}
                          onChange={(e) => setRoadName(e.target.value)}
                          inputStyle={fieldStyles["roadName"]}
                          onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                          className="font-sans font-normal text-[18px] text-[#4A4A4A] bg-transparent focus:outline-none border-none placeholder-gray-600 leading-none whitespace-nowrap min-w-[1ch] text-center"
                          placeholder="0"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("numberLabel") && (
                      <DraggableBox
                        id="numberLabel"
                        position={fieldPositions.numberLabel}
                        onPositionChange={updateFieldPosition}
                        label="Street Number"
                        zoom={0.85}
                        disabled={lockedSections.headerBar}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "numberLabel",
                            "Street Number",
                            numberLabel,
                            "Header Bar",
                            fieldStyles.numberLabel,
                          )
                        }
                        deleteTitle="Remove Street Number"
                      >
                        <StyledInput
                          value={numberLabel}
                          onChange={(e) => setNumberLabel(e.target.value)}
                          inputStyle={fieldStyles["numberLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("numberLabel", s)
                          }
                          className="font-sans font-normal text-[18px] text-[#4A4A4A] leading-none bg-transparent border-none focus:outline-none whitespace-nowrap"
                          placeholder="Number"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("roadLabel") && (
                      <DraggableBox
                        id="roadLabel"
                        position={fieldPositions.roadLabel}
                        onPositionChange={updateFieldPosition}
                        label="Street Name"
                        zoom={0.85}
                        disabled={lockedSections.headerBar}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "roadLabel",
                            "Street Name",
                            roadLabel,
                            "Header Bar",
                            fieldStyles.roadLabel,
                          )
                        }
                        deleteTitle="Remove Street Name"
                      >
                        <StyledInput
                          value={roadLabel}
                          onChange={(e) => setRoadLabel(e.target.value)}
                          inputStyle={fieldStyles["roadLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("roadLabel", s)
                          }
                          className="font-sans font-normal text-[18px] text-[#4A4A4A] leading-none bg-transparent border-none focus:outline-none whitespace-nowrap"
                          placeholder="Road"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}
                  </div>

                  {/* Center Macdonald Realty Logo Overlay Box (Height 100px, Vertically Centered on Address Bar) */}
                  <div
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 shrink-0 overflow-hidden w-[185px] h-[100px] rounded-sm flex items-center justify-center transition-all ${
                      (imageSettings.image7?.showWhiteBg ?? true)
                        ? "bg-white"
                        : "bg-transparent"
                    } ${
                      (imageSettings.image7?.showBorder ?? true)
                        ? "border border-gray-200"
                        : "border-0 border-transparent"
                    } ${
                      (imageSettings.image7?.showShadow ?? true)
                        ? "shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                        : "shadow-none"
                    }`}
                  >
                    {renderImageSlot(
                      "image7",
                      "w-full h-full",
                      "Logo Image",
                      true,
                    )}
                  </div>

                  {/* Right City Line Subtitle */}
                  <div className="flex justify-end z-20">
                    {!isFieldDeleted("cityLine") && (
                      <DraggableBox
                        id="cityLine"
                        position={fieldPositions.cityLine}
                        onPositionChange={updateFieldPosition}
                        label="City Subtitle"
                        zoom={0.85}
                        disabled={lockedSections.headerBar}
                        onDelete={() =>
                          removeStandardField(
                            "cityLine",
                            "City Subtitle",
                            cityLine,
                            "Header Bar",
                            fieldStyles.cityLine,
                          )
                        }
                        deleteTitle="Remove City Subtitle"
                      >
                        <StyledInput
                          value={cityLine}
                          onChange={(e) => setCityLine(e.target.value)}
                          inputStyle={fieldStyles["cityLine"]}
                          onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                          className="font-sans font-normal text-[18px] text-[#4A4A4A] text-right bg-transparent focus:outline-none border-none placeholder-gray-600 leading-none whitespace-nowrap"
                          placeholder="Brighouse South, Richmond"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Specs Summary Row (Overlay on Bottom Edge of Main Image) */}
                <div
                  data-drag-container="true"
                  style={{
                    backgroundColor: "rgba(220, 216, 212, 0.65)",
                    paddingLeft: showBleed ? "48px" : "36px",
                    paddingRight: showBleed ? "48px" : "36px",
                  }}
                  className={`absolute bottom-0 left-0 right-0 py-2 text-nowrap flex items-center justify-between text-[18px] font-sans font-normal text-[#444444] tracking-wider uppercase z-20 border-t transition-all duration-150 group/sec border border-transparent bg-[#DCD8D4]/65 backdrop-blur-sm ${
                    lockedSections.specsBar
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("specsBar");
                    }}
                    className={`absolute top-0.5 right-1 z-40 p-1 rounded-md transition-all duration-150
                      shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                      opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.specsBar
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                    title={
                      lockedSections.specsBar
                        ? "Unlock Specs Bar Section"
                        : "Lock Specs Bar Section"
                    }
                  >
                    {lockedSections.specsBar ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Lock</span>
                      </>
                    )}
                  </button>

                  {!isFieldDeleted("specBedroom") && (
                    <DraggableBox
                      id="specBedroom"
                      position={fieldPositions.specBedroom}
                      onPositionChange={updateFieldPosition}
                      label="Bedrooms"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "specBedroom",
                          "Bedrooms",
                          bedroom,
                          "Specs Bar",
                          fieldStyles.bedroom,
                        )
                      }
                      deleteTitle="Remove Bedrooms"
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <StyledInput
                          value={bedroom}
                          onChange={(e) => setBedroom(e.target.value)}
                          inputStyle={fieldStyles["bedroom"]}
                          onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                          className="font-sans font-normal text-[18px] text-[#444444] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                          placeholder="0"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={bedroomLabel}
                          onChange={(e) => setBedroomLabel(e.target.value)}
                          inputStyle={fieldStyles["bedroomLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("bedroomLabel", s)
                          }
                          className="font-sans font-normal text-[18px] text-[#444444] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                          placeholder="BEDROOM"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                  <span className="text-gray-500 font-normal text-[18px] select-none">
                    •
                  </span>

                  {!isFieldDeleted("specBathroom") && (
                    <DraggableBox
                      id="specBathroom"
                      position={fieldPositions.specBathroom}
                      onPositionChange={updateFieldPosition}
                      label="Bathrooms"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "specBathroom",
                          "Bathrooms",
                          bathroom,
                          "Specs Bar",
                          fieldStyles.bathroom,
                        )
                      }
                      deleteTitle="Remove Bathrooms"
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <StyledInput
                          value={bathroom}
                          onChange={(e) => setBathroom(e.target.value)}
                          inputStyle={fieldStyles["bathroom"]}
                          onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                          className="font-sans font-normal text-[18px] text-[#444444] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                          placeholder="0"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={bathroomLabel}
                          onChange={(e) => setBathroomLabel(e.target.value)}
                          inputStyle={fieldStyles["bathroomLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("bathroomLabel", s)
                          }
                          className="font-sans font-normal text-[18px] text-[#444444] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                          placeholder="BATHROOM"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                  <span className="text-gray-500 font-normal text-[18px] select-none">
                    •
                  </span>

                  {!isFieldDeleted("specSqft") && (
                    <DraggableBox
                      id="specSqft"
                      position={fieldPositions.specSqft}
                      onPositionChange={updateFieldPosition}
                      label="Square Feet"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "specSqft",
                          "Square Feet",
                          sqft,
                          "Specs Bar",
                          fieldStyles.sqft,
                        )
                      }
                      deleteTitle="Remove Square Feet"
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <StyledInput
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          inputStyle={fieldStyles["sqft"]}
                          onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                          className="font-sans font-normal text-[18px] text-[#444444] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                          placeholder="000"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={sqftLabel}
                          onChange={(e) => setSqftLabel(e.target.value)}
                          inputStyle={fieldStyles["sqftLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("sqftLabel", s)
                          }
                          className="font-sans font-normal text-[18px] text-[#444444] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                          placeholder="SQ FT"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                  <span className="text-gray-500 font-normal text-[18px] select-none">
                    •
                  </span>

                  {!isFieldDeleted("specBuiltYear") && (
                    <DraggableBox
                      id="specBuiltYear"
                      position={fieldPositions.specBuiltYear}
                      onPositionChange={updateFieldPosition}
                      label="Built Year"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "specBuiltYear",
                          "Built Year",
                          builtYear,
                          "Specs Bar",
                          fieldStyles.builtYear,
                        )
                      }
                      deleteTitle="Remove Built Year"
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <StyledInput
                          value={builtYearLabel}
                          onChange={(e) => setBuiltYearLabel(e.target.value)}
                          inputStyle={fieldStyles["builtYearLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYearLabel", s)
                          }
                          className="font-sans font-normal text-[18px] text-[#444444] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                          placeholder="BUILT IN"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={builtYear}
                          onChange={(e) => setBuiltYear(e.target.value)}
                          inputStyle={fieldStyles["builtYear"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYear", s)
                          }
                          className="font-sans font-normal text-[18px] text-[#444444] text-left bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                          placeholder="0000"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                  <span className="text-gray-500 font-normal text-[18px] select-none">
                    •
                  </span>

                  {!isFieldDeleted("priceAmount") && (
                    <DraggableBox
                      id="priceAmount"
                      position={fieldPositions.priceAmount}
                      onPositionChange={updateFieldPosition}
                      label="Price"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "priceAmount",
                          "Price",
                          amount,
                          "Specs Bar",
                          fieldStyles.amount,
                        )
                      }
                      deleteTitle="Remove Price"
                    >
                      <StyledInput
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputStyle={fieldStyles["amount"]}
                        onChangeStyle={(s) => updateFieldStyle("amount", s)}
                        className="font-sans font-normal text-[18px] text-[#444444] text-left bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                        placeholder="$000,000"
                        wrapperClassName="w-auto shrink-0"
                      />
                    </DraggableBox>
                  )}
                </div>
              </div>

              {/* Lower Content Details Section (Dark Charcoal Background - Expanded to Bleed Edge) */}
              <div
                className="flex-1 bg-[#3E3E3E] text-white pt-4 pb-[165px] flex flex-col justify-start relative z-10"
                style={{
                  ...bottomBleedStyle,
                  paddingLeft: showBleed ? "48px" : "36px",
                  paddingRight: showBleed ? "48px" : "36px",
                }}
              >
                <div className="grid grid-cols-12 gap-6 w-full h-full relative">
                  {/* Description Column (Left - 50% HALF OF SHEET SPACE) */}
                  <div
                    data-drag-container="true"
                    className={`col-span-6 pr-2 relative transition-all duration-150 group/sec border border-transparent flex flex-col justify-start ${
                      lockedSections.description
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("description");
                      }}
                      className={`absolute top-1 right-1 z-40 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.description
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.description
                          ? "Unlock Description Section"
                          : "Lock Description Section"
                      }
                    >
                      {lockedSections.description ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Lock</span>
                        </>
                      )}
                    </button>

                    {!isFieldDeleted("propertyDescription") && (
                      <DraggableBox
                        id="propertyDescription"
                        position={fieldPositions.propertyDescription}
                        onPositionChange={updateFieldPosition}
                        label="Property Description"
                        zoom={0.85}
                        disabled={lockedSections.description}
                        containerClassName="w-full"
                        onDelete={() =>
                          removeStandardField(
                            "propertyDescription",
                            "Property Description",
                            description,
                            "Description",
                            fieldStyles.description,
                          )
                        }
                        deleteTitle="Remove Description"
                      >
                        <StyledInput
                          value={description}
                          rows={10}
                          onChange={(e) => setDescription(e.target.value)}
                          inputStyle={fieldStyles["description"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("description", s)
                          }
                          fieldId="description"
                          fieldLabel="Property Description"
                          className="text-[12px] font-normal text-left text-white/95 leading-snug bg-transparent w-full focus:outline-none border-none placeholder-white/80"
                          placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge private balcony, great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your viewing."
                        />
                      </DraggableBox>
                    )}
                  </div>

                  {/* Specs Column 1 (Middle ~25%) */}
                  <div
                    data-drag-container="true"
                    className={`col-span-3 flex flex-col items-start text-left gap-1 text-[12px] relative transition-all duration-150 group/sec border border-transparent ${
                      lockedSections.specsCol1
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("specsCol1");
                      }}
                      className={`absolute top-1 right-1 z-40 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.specsCol1
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.specsCol1
                          ? "Unlock Specs Column 1 Section"
                          : "Lock Specs Column 1 Section"
                      }
                    >
                      {lockedSections.specsCol1 ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Lock</span>
                        </>
                      )}
                    </button>

                    {!isFieldDeleted("byLawRestrictions") && (
                      <DraggableBox
                        id="byLawRestrictions"
                        position={fieldPositions.byLawRestrictions}
                        onPositionChange={updateFieldPosition}
                        label="By-law Restrictions"
                        zoom={0.85}
                        disabled={lockedSections.specsCol1}
                        onDelete={() =>
                          removeStandardField(
                            "byLawRestrictions",
                            "By-law Restrictions",
                            byLawRestrictions,
                            "Specs Column 1",
                            fieldStyles.byLawRestrictions,
                          )
                        }
                        deleteTitle="Remove By-law Restrictions"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={byLawLabel}
                            onChange={(e) => setByLawLabel(e.target.value)}
                            inputStyle={fieldStyles["byLawLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("byLawLabel", s)
                            }
                            className="font-gothic font-thin text-[14px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="BY-LAW RESTRICTIONS:"
                          />
                          <StyledInput
                            value={byLawRestrictions}
                            onChange={(e) =>
                              setByLawRestrictions(e.target.value)
                            }
                            inputStyle={fieldStyles["byLawRestrictions"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("byLawRestrictions", s)
                            }
                            className="font-gothic font-thin text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Pets Allowed w/Rest., Rentals Allowed"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("maintenanceFees") && (
                      <DraggableBox
                        id="maintenanceFees"
                        position={fieldPositions.maintenanceFees}
                        onPositionChange={updateFieldPosition}
                        label="Maintenance Fees"
                        zoom={0.85}
                        disabled={lockedSections.specsCol1}
                        onDelete={() =>
                          removeStandardField(
                            "maintenanceFees",
                            "Maintenance Fees",
                            maintenanceFees,
                            "Specs Column 1",
                            fieldStyles.maintenanceFees,
                          )
                        }
                        deleteTitle="Remove Maintenance Fees"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={maintFeesLabel}
                            onChange={(e) => setMaintFeesLabel(e.target.value)}
                            inputStyle={fieldStyles["maintFeesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintFeesLabel", s)
                            }
                            className="font-gothic font-thin text-[14px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="MAINT. FEES:"
                          />
                          <StyledInput
                            value={maintenanceFees}
                            onChange={(e) => setMaintenanceFees(e.target.value)}
                            inputStyle={fieldStyles["maintenanceFees"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintenanceFees", s)
                            }
                            className="font-gothic font-thin text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="$000.00"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("maintenanceFeesInclude") && (
                      <DraggableBox
                        id="maintenanceFeesInclude"
                        position={fieldPositions.maintenanceFeesInclude}
                        onPositionChange={updateFieldPosition}
                        label="Maintenance Fees Include"
                        zoom={0.85}
                        disabled={lockedSections.specsCol1}
                        onDelete={() =>
                          removeStandardField(
                            "maintenanceFeesInclude",
                            "Maintenance Fees Include",
                            maintenanceFeesInclude,
                            "Specs Column 1",
                            fieldStyles.maintenanceFeesInclude,
                          )
                        }
                        deleteTitle="Remove Maint. Fees Include"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={maintFeesIncludeLabel}
                            onChange={(e) =>
                              setMaintFeesIncludeLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["maintFeesIncludeLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintFeesIncludeLabel", s)
                            }
                            className="font-gothic font-thin text-[14px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="MAINT. FEES INCLUDE:"
                          />
                          <StyledInput
                            value={maintenanceFeesInclude}
                            onChange={(e) =>
                              setMaintenanceFeesInclude(e.target.value)
                            }
                            inputStyle={fieldStyles["maintenanceFeesInclude"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintenanceFeesInclude", s)
                            }
                            className="font-gothic font-thin text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("featuresIncluded") && (
                      <DraggableBox
                        id="featuresIncluded"
                        position={fieldPositions.featuresIncluded}
                        onPositionChange={updateFieldPosition}
                        label="Features Included"
                        zoom={0.85}
                        disabled={lockedSections.specsCol1}
                        onDelete={() =>
                          removeStandardField(
                            "featuresIncluded",
                            "Features Included",
                            featuresIncluded,
                            "Specs Column 1",
                            fieldStyles.featuresIncluded,
                          )
                        }
                        deleteTitle="Remove Features Included"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={featuresIncludedLabel}
                            onChange={(e) =>
                              setFeaturesIncludedLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["featuresIncludedLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("featuresIncludedLabel", s)
                            }
                            className="font-gothic font-thin text-[14px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="FEATURES INCLUDED:"
                          />
                          <StyledInput
                            value={featuresIncluded}
                            onChange={(e) =>
                              setFeaturesIncluded(e.target.value)
                            }
                            inputStyle={fieldStyles["featuresIncluded"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("featuresIncluded", s)
                            }
                            className="font-gothic font-thin text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>

                  {/* Specs Column 2 (Right ~25%) */}
                  <div
                    data-drag-container="true"
                    className={`col-span-3 flex flex-col items-start text-left gap-1 text-[12px] relative transition-all duration-150 group/sec border border-transparent ${
                      lockedSections.specsCol2
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("specsCol2");
                      }}
                      className={`absolute top-1 right-1 z-40 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.specsCol2
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.specsCol2
                          ? "Unlock Specs Column 2 Section"
                          : "Lock Specs Column 2 Section"
                      }
                    >
                      {lockedSections.specsCol2 ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Lock</span>
                        </>
                      )}
                    </button>

                    {!isFieldDeleted("siteInfluences") && (
                      <DraggableBox
                        id="siteInfluences"
                        position={fieldPositions.siteInfluences}
                        onPositionChange={updateFieldPosition}
                        label="Site Influences"
                        zoom={0.85}
                        disabled={lockedSections.specsCol2}
                        onDelete={() =>
                          removeStandardField(
                            "siteInfluences",
                            "Site Influences",
                            siteInfluences,
                            "Specs Column 2",
                            fieldStyles.siteInfluences,
                          )
                        }
                        deleteTitle="Remove Site Influences"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={siteInfluencesLabel}
                            onChange={(e) =>
                              setSiteInfluencesLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["siteInfluencesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("siteInfluencesLabel", s)
                            }
                            className="font-gothic font-thin text-[14px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="SITE INFLUENCES:"
                          />
                          <StyledInput
                            value={siteInfluences}
                            onChange={(e) => setSiteInfluences(e.target.value)}
                            inputStyle={fieldStyles["siteInfluences"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("siteInfluences", s)
                            }
                            className="font-gothic font-thin text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("amenities") && (
                      <DraggableBox
                        id="amenities"
                        position={fieldPositions.amenities}
                        onPositionChange={updateFieldPosition}
                        label="Amenities"
                        zoom={0.85}
                        disabled={lockedSections.specsCol2}
                        onDelete={() =>
                          removeStandardField(
                            "amenities",
                            "Amenities",
                            amenities,
                            "Specs Column 2",
                            fieldStyles.amenities,
                          )
                        }
                        deleteTitle="Remove Amenities"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={amenitiesLabel}
                            onChange={(e) => setAmenitiesLabel(e.target.value)}
                            inputStyle={fieldStyles["amenitiesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("amenitiesLabel", s)
                            }
                            className="font-gothic font-thin text-[14px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="AMENITIES:"
                          />
                          <StyledInput
                            value={amenities}
                            onChange={(e) => setAmenities(e.target.value)}
                            inputStyle={fieldStyles["amenities"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("amenities", s)
                            }
                            className="font-gothic font-thin text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("view") && (
                      <DraggableBox
                        id="view"
                        position={fieldPositions.view}
                        onPositionChange={updateFieldPosition}
                        label="View"
                        zoom={0.85}
                        disabled={lockedSections.specsCol2}
                        onDelete={() =>
                          removeStandardField(
                            "view",
                            "View",
                            view,
                            "Specs Column 2",
                            fieldStyles.view,
                          )
                        }
                        deleteTitle="Remove View"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={viewLabel}
                            onChange={(e) => setViewLabel(e.target.value)}
                            inputStyle={fieldStyles["viewLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("viewLabel", s)
                            }
                            className="font-gothic font-thin text-[14px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="VIEW:"
                          />
                          <StyledInput
                            value={view}
                            onChange={(e) => setView(e.target.value)}
                            inputStyle={fieldStyles["view"]}
                            onChangeStyle={(s) => updateFieldStyle("view", s)}
                            className="font-gothic font-thin text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="South & SW - Van Isl."
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("mlsNumber") && (
                      <DraggableBox
                        id="mlsNumber"
                        position={fieldPositions.mlsNumber}
                        onPositionChange={updateFieldPosition}
                        label="MLS #"
                        zoom={0.85}
                        disabled={lockedSections.specsCol2}
                        onDelete={() =>
                          removeStandardField(
                            "mlsNumber",
                            "MLS #",
                            mlsNumber,
                            "Specs Column 2",
                            fieldStyles.mlsNumber,
                          )
                        }
                        deleteTitle="Remove MLS #"
                      >
                        <div className="flex items-center gap-1 mt-1 text-left">
                          <StyledInput
                            value={mlsLabel}
                            onChange={(e) => setMlsLabel(e.target.value)}
                            inputStyle={fieldStyles["mlsLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsLabel", s)
                            }
                            className="font-gothic font-thin text-[14px] uppercase text-left text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="MLS* "
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={mlsNumber}
                            onChange={(e) => setMlsNumber(e.target.value)}
                            inputStyle={fieldStyles["mlsNumber"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsNumber", s)
                            }
                            className="font-gothic font-thin text-left text-[12px] text-white bg-transparent focus:outline-none border-none placeholder-white whitespace-nowrap"
                            placeholder="0000000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Swooping White Contact Card Footer (Expanded to Bleed Edge) */}
              <div
                data-drag-container="true"
                className={`absolute h-[175px] z-20 pointer-events-none flex flex-col justify-end transition-all duration-150 group/sec border border-transparent ${
                  lockedSections.contactCard
                    ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                    : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                }`}
                style={{
                  left: showBleed ? "-0.375in" : "-0.25in",
                  right: showBleed ? "-0.375in" : "-0.25in",
                  bottom: showBleed ? "-0.375in" : "-0.25in",
                  width: showBleed
                    ? "calc(100% + 0.75in)"
                    : "calc(100% + 0.5in)",
                }}
              >
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionLock("contactCard");
                  }}
                  className={`absolute top-6 right-8 z-40 p-1 rounded-md transition-all duration-150
                    shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer pointer-events-auto
                    opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.contactCard
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                  title={
                    lockedSections.contactCard
                      ? "Unlock Contact Card Section"
                      : "Lock Contact Card Section"
                  }
                >
                  {lockedSections.contactCard ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Lock</span>
                    </>
                  )}
                </button>

                {/* Footer Wave Background Image */}
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden flex flex-col justify-end">
                  <img
                    src="/flyer18-footer-wave.png"
                    alt=""
                    className="w-full object-fill pointer-events-none select-none block shrink-0"
                    style={{ height: "145px" }}
                  />
                  <div className="w-full bg-white flex-1 min-h-[35px]" />
                </div>

                {/* Contact Info Overlay on White Curve */}
                <div className="relative z-10 px-10 pb-3 h-[120px] pt-0 flex justify-between items-start pointer-events-auto">
                  <div className="flex flex-col gap-0.5 text-gray-900 w-full">
                    {!isFieldDeleted("contactName") && (
                      <DraggableBox
                        id="contactName"
                        position={fieldPositions.contactName}
                        onPositionChange={updateFieldPosition}
                        label="Contact & Agent Name"
                        zoom={0.85}
                        disabled={lockedSections.contactCard}
                        containerClassName="w-fit max-w-full inline-flex items-center shrink-0"
                        onDelete={() =>
                          removeStandardField(
                            "contactName",
                            "Contact & Agent Name",
                            `${contactLabel} ${fullName}`,
                            "Contact Card",
                            fieldStyles.fullName,
                          )
                        }
                        deleteTitle="Remove Contact Name"
                      >
                        <div className="flex items-center gap-1.5 text-[16px] whitespace-nowrap">
                          <StyledInput
                            value={contactLabel}
                            onChange={(e) => setContactLabel(e.target.value)}
                            inputStyle={fieldStyles["contactLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("contactLabel", s)
                            }
                            className="font-gothic font-normal text-[16px] text-gray-900 bg-transparent border-none focus:outline-none whitespace-nowrap uppercase"
                            placeholder="CONTACT:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            inputStyle={fieldStyles["fullName"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("fullName", s)
                            }
                            className="font-gothic font-normal text-left text-[16px] text-gray-900 bg-transparent focus:outline-none border-none uppercase placeholder-gray-800 whitespace-nowrap min-w-[19ch]"
                            placeholder="FIRSTNAME LASTNAME"
                            wrapperClassName="w-auto shrink-0 min-w-[19ch]"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("contactBrokerage") && (
                      <DraggableBox
                        id="contactBrokerage"
                        position={fieldPositions.contactBrokerage}
                        onPositionChange={updateFieldPosition}
                        label="Company Name"
                        zoom={0.85}
                        disabled={lockedSections.contactCard}
                        containerClassName="w-fit max-w-full inline-flex items-center shrink-0"
                        onDelete={() =>
                          removeStandardField(
                            "contactBrokerage",
                            "Company Name",
                            propertyName,
                            "Contact Card",
                            fieldStyles.propertyName,
                          )
                        }
                        deleteTitle="Remove Company Name"
                      >
                        <StyledInput
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          inputStyle={fieldStyles["propertyName"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("propertyName", s)
                          }
                          className="font-gothic font-normal text-left text-[13px] text-gray-900 bg-transparent focus:outline-none border-none uppercase placeholder-gray-700 whitespace-nowrap min-w-[16ch]"
                          placeholder="MACDONALD REALTY"
                          wrapperClassName="w-auto shrink-0 min-w-[16ch]"
                        />
                      </DraggableBox>
                    )}

                    <div className="flex items-center gap-6 text-[13px] text-gray-900">
                      {!isFieldDeleted("contactPhone") && (
                        <DraggableBox
                          id="contactPhone"
                          position={fieldPositions.contactPhone}
                          onPositionChange={updateFieldPosition}
                          label="Phone Number"
                          zoom={0.85}
                          disabled={lockedSections.contactCard}
                          containerClassName="w-fit inline-flex items-center shrink-0"
                          onDelete={() =>
                            removeStandardField(
                              "contactPhone",
                              "Phone Number",
                              `${phoneLabel} ${number}`,
                              "Contact Card",
                              fieldStyles.number,
                            )
                          }
                          deleteTitle="Remove Phone Number"
                        >
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <StyledInput
                              value={phoneLabel}
                              onChange={(e) => setPhoneLabel(e.target.value)}
                              inputStyle={fieldStyles["phoneLabel"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("phoneLabel", s)
                              }
                              className="font-gothic font-normal text-[13px] text-gray-900 bg-transparent border-none focus:outline-none whitespace-nowrap uppercase"
                              placeholder="PHONE:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              inputStyle={fieldStyles["number"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("number", s)
                              }
                              className="font-gothic font-normal text-left text-[13px] text-gray-900 bg-transparent focus:outline-none border-none placeholder-gray-800 whitespace-nowrap min-w-[12ch]"
                              placeholder="604.000.0000"
                              wrapperClassName="w-auto shrink-0 min-w-[12ch]"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("contactEmail") && (
                        <DraggableBox
                          id="contactEmail"
                          position={fieldPositions.contactEmail}
                          onPositionChange={updateFieldPosition}
                          label="Email Link"
                          zoom={0.85}
                          disabled={lockedSections.contactCard}
                          containerClassName="w-fit inline-flex items-center shrink-0"
                          onDelete={() =>
                            removeStandardField(
                              "contactEmail",
                              "Email Link",
                              `${emailLabel} ${email}`,
                              "Contact Card",
                              fieldStyles.email,
                            )
                          }
                          deleteTitle="Remove Email Link"
                        >
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <StyledInput
                              value={emailLabel}
                              onChange={(e) => setEmailLabel(e.target.value)}
                              inputStyle={fieldStyles["emailLabel"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("emailLabel", s)
                              }
                              className="font-gothic font-normal text-[13px] text-gray-900 bg-transparent border-none focus:outline-none whitespace-nowrap uppercase"
                              placeholder="EMAIL:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              inputStyle={fieldStyles["email"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("email", s)
                              }
                              className="font-gothic font-normal text-left text-[13px] text-gray-900 bg-transparent focus:outline-none border-none uppercase placeholder-gray-800 whitespace-nowrap min-w-[22ch]"
                              placeholder="FIRSTNAME@LASTNAME.COM"
                              wrapperClassName="w-auto shrink-0 min-w-[22ch]"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>

                    {/* Fine Print Disclaimer with Home & Equal Housing Opportunity icons */}
                    {!isFieldDeleted("contactDisclaimer") && (
                      <DraggableBox
                        id="contactDisclaimer"
                        position={fieldPositions.contactDisclaimer}
                        onPositionChange={updateFieldPosition}
                        label="Disclaimer"
                        zoom={0.85}
                        disabled={lockedSections.contactCard}
                        onDelete={() =>
                          removeStandardField(
                            "contactDisclaimer",
                            "Disclaimer",
                            disclaimerText,
                            "Contact Card",
                            fieldStyles.disclaimerText,
                          )
                        }
                        deleteTitle="Remove Disclaimer"
                      >
                        <div className="flex items-center gap-1.5 pt-1 text-[7.5px] font-bold text-black leading-[1.15] tracking-tight">
                          <StyledInput
                            value={disclaimerText}
                            rows={2}
                            onChange={(e) => setDisclaimerText(e.target.value)}
                            inputStyle={fieldStyles["disclaimerText"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("disclaimerText", s)
                            }
                            className="text-[7.5px] font-bold text-black leading-[1.15] tracking-tight bg-transparent border-none focus:outline-none w-full"
                            placeholder="All information deemed reliable..."
                          />
                          <div className="flex items-center gap-1 shrink-0 text-black">
                            <svg
                              className="w-3.5 h-3.5 shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <line x1="9" y1="12" x2="15" y2="12" />
                              <line x1="9" y1="16" x2="15" y2="16" />
                            </svg>
                            <div className="w-3.5 h-3.5 border border-black rounded-[1px] flex items-center justify-center shrink-0">
                              <span className="text-[7px] font-bold font-serif leading-none">
                                R
                              </span>
                            </div>
                          </div>
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>

        {/* --- PAGE 2 DIVIDER --- */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 2
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* --- PAGE 2 WRAPPER --- */}
        <div
          className="pdf-page bg-[#404040] shadow-xl relative overflow-hidden flex flex-col justify-between"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div
              data-safezone-container="true"
              className="relative w-full h-full flex flex-col justify-between z-10 select-none"
            >
              {/* PAGE 2 CONTENT: Floor Plan Image Slot (Full available area, transparent background) */}
              <div className="relative z-0 w-full h-full flex flex-col p-0 pb-[50px]">
                <div className="w-full h-full p-0 flex-1 flex items-center justify-center bg-transparent">
                  {renderImageSlot(
                    "image6",
                    "w-full h-full bg-transparent",
                    "Select Image",
                  )}
                </div>
              </div>

              {/* Bottom Swooping White Footer Wave for Page 2 (Expanded to Bleed Edge) */}
              <div
                data-drag-container="true"
                className={`absolute h-[160px] z-20 pointer-events-none flex flex-col justify-end transition-all duration-150 group/sec border border-transparent ${
                  lockedSections.page2Footer
                    ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                    : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                }`}
                style={{
                  left: showBleed ? "-0.375in" : "-0.25in",
                  right: showBleed ? "-0.375in" : "-0.25in",
                  bottom: showBleed ? "-0.375in" : "-0.25in",
                  width: showBleed
                    ? "calc(100% + 0.75in)"
                    : "calc(100% + 0.5in)",
                }}
              >
                {/* Lock / Unlock button for Page 2 Footer */}
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionLock("page2Footer");
                  }}
                  className={`absolute top-6 right-8 z-40 p-1 rounded-md transition-all duration-150
                    shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer pointer-events-auto
                    opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.page2Footer
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                  title={
                    lockedSections.page2Footer
                      ? "Unlock Page 2 Footer Section"
                      : "Lock Page 2 Footer Section"
                  }
                >
                  {lockedSections.page2Footer ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Lock</span>
                    </>
                  )}
                </button>

                {/* Footer Wave Background Image */}
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden flex flex-col justify-end">
                  <img
                    src="/flyer18-footer-wave.png"
                    alt=""
                    className="w-full object-fill pointer-events-none select-none block shrink-0"
                    style={{ height: "135px" }}
                  />
                  <div className="w-full bg-white flex-1 min-h-[30px]" />
                </div>

                {/* Footer Credit Text on White Background */}
                <div className="relative z-10 w-full pb-3.5 pt-1 flex justify-center items-center pointer-events-auto">
                  {!isFieldDeleted("footerCreditPage2") && (
                    <DraggableBox
                      id="footerCreditPage2"
                      position={fieldPositions.footerCreditPage2}
                      onPositionChange={updateFieldPosition}
                      label="Footer Credit"
                      zoom={0.85}
                      disabled={lockedSections.page2Footer}
                      containerClassName="w-full"
                      className="w-full flex justify-center"
                      onDelete={() =>
                        removeStandardField(
                          "footerCreditPage2",
                          "Footer Credit",
                          footerCredit,
                          "Page 2 Footer",
                          fieldStyles.footerCredit,
                        )
                      }
                      deleteTitle="Remove Footer Credit"
                    >
                      <StyledInput
                        value={footerCredit}
                        onChange={(e) => setFooterCredit(e.target.value)}
                        inputStyle={fieldStyles["footerCredit"]}
                        onChangeStyle={(s) =>
                          updateFieldStyle("footerCredit", s)
                        }
                        className="w-full text-center text-[#3E3E3E] text-[12px] font-bold tracking-wider bg-transparent border-none focus:outline-none"
                        placeholder="DESIGNED AND PRINTED BY BC FLOOR PLANS"
                      />
                    </DraggableBox>
                  )}
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>
      </div>
    );
  },
);

BcfpStandard18.displayName = "BcfpStandard18";

export default BcfpStandard18;
