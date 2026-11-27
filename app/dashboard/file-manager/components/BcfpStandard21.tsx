import {
  House,
  Pencil,
  Trash,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetPayload,
  FeatureSheetResponse,
  TextStyle,
} from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";
import ImageEditor from "./ImageEditor";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";

export interface BcfpStandard21Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard21Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

// ─── BoxIndicator ─────────────────────────────────────────────────────────────
// Canva-style 3.5px colored border indicator to show bounds of active/hovered image slot.
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

const BcfpStandard21 = forwardRef<BcfpStandard21Ref, BcfpStandard21Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── 1. Deletion & Restoration State ──────────────────────────────────────
    const [deletedDetailFields, setDeletedDetailFields] = useState<any[]>([]);
    const [deletedStandardFieldIds, setDeletedStandardFieldIds] = useState<
      string[]
    >([]);

    const isFieldDeleted = (id: string) => deletedStandardFieldIds.includes(id);

    const removeStandardField = (
      id: string,
      title: string,
      value: string,
      section: string,
      style?: TextStyle,
    ) => {
      setDeletedStandardFieldIds((prevStandard) =>
        prevStandard.includes(id) ? prevStandard : [...prevStandard, id],
      );
      const deletedItem: DeletedDetailFieldItem = {
        id,
        title,
        value: value || "",
        section,
        style,
        deletedAt: Date.now(),
      };
      setDeletedDetailFields((prevDetail) => [
        ...prevDetail.filter((f) => f.id !== id),
        deletedItem,
      ]);
    };

    const restoreDetailField = useCallback((id: string) => {
      setDeletedStandardFieldIds((prevStandard) =>
        prevStandard.filter((fId) => fId !== id),
      );
      setDeletedDetailFields((prevDetail) =>
        prevDetail.filter((f) => f.id !== id),
      );
    }, []);

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

    // ── 2. Text Fields ────────────────────────────────────────────────────────
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
    const [headline, setHeadline] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [patioSqft, setPatioSqft] = useState("");
    const [ceilingHeight, setCeilingHeight] = useState("");

    // ── 3. Editable Labels ───────────────────────────────────────────────────
    const [roadLabelBefore, setRoadLabelBefore] = useState("");
    const [roadLabelAfter, setRoadLabelAfter] = useState("");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM");
    const [sqftLabel, setSqftLabel] = useState("SQ FT");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
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
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("Phone:");
    const [emailLabel, setEmailLabel] = useState("Email:");
    const [mlsLabel, setMlsLabel] = useState("MLS #");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
    );

    // ── 4. Bleed & Guide State ────────────────────────────────────────────────
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed =
      propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide =
      propShowGuide !== undefined ? propShowGuide : showGuideState;

    // ── 5. Field Styles, Positions & Section Locks ─────────────────────────────
    const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>({
      description: {
        fontSize: "11px",
        fontWeight: "normal",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
      },
      byLawLabel: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
        textAlign: "left",
      },
      byLawRestrictions: {
        fontSize: "11px",
        fontWeight: "normal",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
      },
      maintFeesLabel: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
        textAlign: "left",
      },
      maintenanceFees: {
        fontSize: "11px",
        fontWeight: "normal",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
      },
      maintFeesIncludeLabel: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
        textAlign: "left",
      },
      maintenanceFeesInclude: {
        fontSize: "11px",
        fontWeight: "normal",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
      },
      featuresIncludedLabel: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
        textAlign: "left",
      },
      featuresIncluded: {
        fontSize: "11px",
        fontWeight: "normal",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
      },
      siteInfluencesLabel: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
        textAlign: "left",
      },
      siteInfluences: {
        fontSize: "11px",
        fontWeight: "normal",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
      },
      amenitiesLabel: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
        textAlign: "left",
      },
      amenities: {
        fontSize: "11px",
        fontWeight: "normal",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
      },
      viewLabel: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
        textAlign: "left",
      },
      view: {
        fontSize: "11px",
        fontWeight: "normal",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
      },
      headline: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
        textAlign: "center",
      },
      bedroom: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
      },
      bedroomLabel: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
      },
      bathroom: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
      },
      bathroomLabel: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
      },
      sqft: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
      },
      sqftLabel: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
      },
      builtYearLabel: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
      },
      builtYear: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "ChampagneLimousines, sans-serif",
        color: "#000000",
      },
      contactLabel: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
      },
      fullName: {
        fontSize: "16px",
        fontWeight: "normal",
        fontFamily: "Raleway, sans-serif",
      },
      propertyName: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "TrajanProRegular, serif",
      },
      phoneLabel: {
        fontSize: "12px",
        fontWeight: "500",
        fontFamily: "TrajanProRegular, serif",
      },
      number: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "TrajanProRegular, serif",
      },
      emailLabel: {
        fontSize: "12px",
        fontWeight: "500",
        fontFamily: "TrajanProRegular, serif",
      },
      email: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "TrajanProRegular, serif",
      },
      mlsLabel: {
        fontSize: "12px",
        fontWeight: "500",
        fontFamily: "TrajanProRegular, serif",
      },
      mlsNumber: {
        fontSize: "12px",
        fontWeight: "normal",
        fontFamily: "TrajanProRegular, serif",
      },
    });
    const updateFieldStyle = (fieldName: string, style: TextStyle) => {
      setFieldStyles((prev) => ({ ...prev, [fieldName]: style }));
    };

    const [fieldPositions, setFieldPositions] = useState<
      Record<string, { x: number; y: number }>
    >({});
    const updateFieldPosition = (id: string, pos: { x: number; y: number }) => {
      setFieldPositions((prev) => ({ ...prev, [id]: pos }));
    };

    const [lockedSections, setLockedSections] = useState<
      Record<string, boolean>
    >({
      header: false,
      details: false,
      headline: false,
      specs: false,
      contact: false,
    });

    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 6. Images State ───────────────────────────────────────────────────────
    const [images, setImages] = useState<Record<string, string | null>>({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
      image5: null,
      image6: null,
      image7: null,
      image8: null,
    });

    const [scale, setScale] = useState<Record<string, number>>({
      image1: 1,
      image2: 1,
      image3: 1,
      image4: 1,
      image5: 1,
      image6: 1,
      image7: 1,
      image8: 1,
    });

    const [position, setPosition] = useState<
      Record<string, { x: number; y: number }>
    >({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
      image8: { x: 0, y: 0 },
    });

    const [rotation, setRotation] = useState<Record<string, number>>({
      image1: 0,
      image2: 0,
      image3: 0,
      image4: 0,
      image5: 0,
      image6: 0,
      image7: 0,
      image8: 0,
    });

    const [dragging, setDragging] = useState<Record<string, boolean>>({
      image1: false,
      image2: false,
      image3: false,
      image4: false,
      image5: false,
      image6: false,
      image7: false,
      image8: false,
    });

    const lastPosition = useRef<Record<string, { x: number; y: number }>>({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
      image8: { x: 0, y: 0 },
    });

    // ── 7. Modals & Slot Activity State ───────────────────────────────────────
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(
      null,
    );
    const [showGallery, setShowGallery] = useState(false);

    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
    const [activeSlot, setActiveSlot] = useState<string | null>(null);
    const [processingSlots, setProcessingSlots] = useState<
      Record<string, boolean>
    >({});
    const [deletedImageSlots, setDeletedImageSlots] = useState<string[]>([]);

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

    // ── 8. File Input Refs ────────────────────────────────────────────────────
    const fileInputRef1 = useRef<HTMLInputElement | null>(null);
    const fileInputRef2 = useRef<HTMLInputElement | null>(null);
    const fileInputRef3 = useRef<HTMLInputElement | null>(null);
    const fileInputRef4 = useRef<HTMLInputElement | null>(null);
    const fileInputRef5 = useRef<HTMLInputElement | null>(null);
    const fileInputRef6 = useRef<HTMLInputElement | null>(null);
    const fileInputRef7 = useRef<HTMLInputElement | null>(null);
    const fileInputRef8 = useRef<HTMLInputElement | null>(null);

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
        default:
          return fileInputRef1;
      }
    };

    // ── 9. Image Handlers ─────────────────────────────────────────────────────
    const handleImageChange = (
      key: string,
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
      key: string,
      refToReset: React.RefObject<HTMLInputElement | null>,
    ) => {
      setDeletedImageSlots((prev) => [...prev, key]);
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (refToReset.current) refToReset.current.value = "";
    };

    const handleZoom = (key: string, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale =
          direction === "in" ? prev[key] + 0.03 : prev[key] - 0.03;
        const bounded = Math.min(Math.max(newScale, 0.1), 5);
        return { ...prev, [key]: bounded };
      });
    };

    const handleRotate = (key: string) => {
      setRotation((prev) => ({
        ...prev,
        [key]: ((prev[key] || 0) + 90) % 360,
      }));
    };

    const handleMouseDown = (key: string, e: React.MouseEvent) => {
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: string, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      const dx = (e.clientX - lastPosition.current[key].x) / 0.85;
      const dy = (e.clientY - lastPosition.current[key].y) / 0.85;

      setPosition((prev) => ({
        ...prev,
        [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
      }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (key: string) =>
      setDragging((prev) => ({ ...prev, [key]: false }));
    const handleMouseLeave = (key: string) =>
      setDragging((prev) => ({ ...prev, [key]: false }));

    const openImageSourceModal = (imageSlot: string, e?: React.MouseEvent) => {
      if (e?.altKey) return;
      setCurrentImageSlot(imageSlot);
      setShowGallery(true);
    };

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (currentImageSlot) {
        setDeletedImageSlots((prev) =>
          prev.filter((s) => s !== currentImageSlot),
        );
        setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      }
      setShowGallery(false);
      setCurrentImageSlot(null);
    };


    // ── 11. Initial Order Data Sync ──────────────────────────────────────────
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
          const propertyTitle = (
            orderData.property.heading ||
            (orderData.property as any).title ||
            ""
          ).trim();
          if (propertyTitle) setHeadline(propertyTitle);

          let suiteVal = orderData.property.suite
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
          const suiteMatch =
            rawAddress.match(
              /^(?:#\s*|suite\s*|unit\s*)?(\d+[A-Za-z]?)\s*[-–—]\s*(.*)$/i,
            ) ||
            rawAddress.match(
              /^(?:#\s*|suite\s+|unit\s+)(\d+[A-Za-z]?)[,\s]+(.*)$/i,
            );
          if (suiteMatch) {
            if (!suiteVal) suiteVal = suiteMatch[1];
            rawAddress = suiteMatch[2].trim();
          }

          // MLS Number -> addressCode (fallback before two-number address parsing)
          if (orderData.property.mls_number) {
            setAddressCode(orderData.property.mls_number.toString());
            setMlsNumber(orderData.property.mls_number.toString());
          } else if ((orderData.property as any).mls) {
            setAddressCode(String((orderData.property as any).mls));
            setMlsNumber(String((orderData.property as any).mls));
          } else {
            setAddressCode("");
            setMlsNumber("");
          }

          // 2. Separate Code, Street Number, and Street Name from rawAddress
          const twoNumMatch = rawAddress.match(
            /^(\d+[A-Za-z]?)\s+(\d+(?:st|nd|rd|th|[A-Za-z])?)\s+(.+)$/i,
          );
          const oneNumMatch = rawAddress.match(/^(\d+[A-Za-z]?)\s+(.+)$/);

          if (twoNumMatch) {
            setAddressCode(twoNumMatch[1]);
            setMlsNumber(twoNumMatch[1]);
            setRoadLabelBefore(twoNumMatch[2]);
            setRoadLabelAfter(twoNumMatch[3]);
          } else if (oneNumMatch) {
            setRoadLabelBefore(oneNumMatch[1]);
            setRoadLabelAfter(oneNumMatch[2]);
          } else {
            setRoadLabelBefore("");
            setRoadLabelAfter(rawAddress);
          }

          // Suite -> roadName (if suite is null, empty or zero, leave as "" to show "0" via placeholder)
          if (!suiteVal || suiteVal === "0") {
            setRoadName("");
          } else {
            setRoadName(suiteVal);
          }

          setDeletedStandardFieldIds((prev) =>
            prev.filter(
              (id) =>
                id !== "addressCode" &&
                id !== "addressHash" &&
                id !== "roadLabelBefore" &&
                id !== "roadName" &&
                id !== "roadLabelAfter",
            ),
          );

          // Clean city line
          const IGNORED_COUNTRY = /^(CA|Canada)$/i;
          const subArea = ((orderData.property as any).sub_area || "").trim();
          const city = (orderData.property.city || "").trim();
          const province = (orderData.property.province || "").trim();
          const postalCode = (orderData.property.postal_code || "").trim();
          const country = ((orderData.property as any).country || "").trim();

          const locationParts: string[] = [];
          if (subArea) locationParts.push(subArea);
          if (city) locationParts.push(city);

          let provincePostal = "";
          const provinceClean = IGNORED_COUNTRY.test(province) ? "" : province;
          if (provinceClean && postalCode)
            provincePostal = `${provinceClean} ${postalCode}`;
          else if (provinceClean) provincePostal = provinceClean;
          else if (postalCode) provincePostal = postalCode;

          if (provincePostal) locationParts.push(provincePostal);
          if (country && !IGNORED_COUNTRY.test(country))
            locationParts.push(country);
          if (locationParts.length > 0) setCityLine(locationParts.join(", "));
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
            (agent as any)?.company_logo ||
            (agent as any)?.logo_url ||
            (agent as any)?.logo ||
            (orderData as any)?.property?.realtor_logo ||
            (orderData as any)?.realtor_logo ||
            (orderData as any)?.organization?.company_logo_url ||
            (orderData as any)?.organization?.logo_url ||
            (orderData as any)?.organization?.company_logos_urls?.[0] ||
            (agent as any)?.avatar_url ||
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

    // ── 12. Context Sync ──────────────────────────────────────────────────────
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
        headline,
        mlsNumber,
        patioSqft,
        ceilingHeight,
        roadLabelBefore,
        roadLabelAfter,
        bedroomLabel,
        bathroomLabel,
        sqftLabel,
        builtYearLabel,
        byLawLabel,
        maintFeesLabel,
        maintFeesIncludeLabel,
        featuresIncludedLabel,
        siteInfluencesLabel,
        amenitiesLabel,
        viewLabel,
        contactLabel,
        phoneLabel,
        emailLabel,
        mlsLabel,
        disclaimerText,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldPositions,
        fieldStyles,
      });
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
      headline,
      mlsNumber,
      patioSqft,
      ceilingHeight,
      roadLabelBefore,
      roadLabelAfter,
      bedroomLabel,
      bathroomLabel,
      sqftLabel,
      builtYearLabel,
      byLawLabel,
      maintFeesLabel,
      maintFeesIncludeLabel,
      featuresIncludedLabel,
      siteInfluencesLabel,
      amenitiesLabel,
      viewLabel,
      contactLabel,
      phoneLabel,
      emailLabel,
      mlsLabel,
      disclaimerText,
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      fieldStyles,
      updateFormData,
    ]);

    // ── 13. Imperative Handle: Export & Import Payload ────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard21",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#184260",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "32px",
            },
          },
          realtorName: {
            value: fullName,
            style: {
              ...fieldStyles.fullName,
              fontSize: fieldStyles.fullName?.fontSize || "16px",
              fontFamily:
                fieldStyles.fullName?.fontFamily || "Raleway, sans-serif",
              fontWeight: fieldStyles.fullName?.fontWeight || "normal",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "12px",
              fontFamily:
                fieldStyles.email?.fontFamily || "TrajanProRegular, serif",
              fontWeight: fieldStyles.email?.fontWeight || "normal",
            },
          },
          companyName: {
            value: propertyName,
            style: {
              ...fieldStyles.propertyName,
              fontSize: fieldStyles.propertyName?.fontSize || "12px",
              fontFamily:
                fieldStyles.propertyName?.fontFamily ||
                "TrajanProRegular, serif",
              fontWeight: fieldStyles.propertyName?.fontWeight || "normal",
            },
          },
          propertyNotesTitle: {
            value: roadName,
            style: {
              ...fieldStyles.roadName,
              fontSize: fieldStyles.roadName?.fontSize || "24px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "11px",
              fontFamily:
                fieldStyles.description?.fontFamily ||
                "ACaslonProRegular, serif",
              fontWeight: fieldStyles.description?.fontWeight || "normal",
            },
          },
          expandedDetail1Title: {
            value: byLawLabel,
            style: {
              ...fieldStyles.byLawLabel,
              fontSize: fieldStyles.byLawLabel?.fontSize || "12px",
              fontFamily:
                fieldStyles.byLawLabel?.fontFamily || "Raleway, sans-serif",
              fontWeight: fieldStyles.byLawLabel?.fontWeight || "normal",
            },
          },
          expandedDetail1Description: {
            value: byLawRestrictions,
            style: {
              ...fieldStyles.byLawRestrictions,
              fontSize: fieldStyles.byLawRestrictions?.fontSize || "11px",
              fontFamily:
                fieldStyles.byLawRestrictions?.fontFamily ||
                "ACaslonProRegular, serif",
              fontWeight: fieldStyles.byLawRestrictions?.fontWeight || "normal",
            },
          },
          expandedDetail2Title: {
            value: maintFeesLabel,
            style: {
              ...fieldStyles.maintFeesLabel,
              fontSize: fieldStyles.maintFeesLabel?.fontSize || "12px",
              fontFamily:
                fieldStyles.maintFeesLabel?.fontFamily || "Raleway, sans-serif",
              fontWeight: fieldStyles.maintFeesLabel?.fontWeight || "normal",
            },
          },
          expandedDetail2Description: {
            value: maintenanceFees,
            style: {
              ...fieldStyles.maintenanceFees,
              fontSize: fieldStyles.maintenanceFees?.fontSize || "11px",
              fontFamily:
                fieldStyles.maintenanceFees?.fontFamily ||
                "ACaslonProRegular, serif",
              fontWeight: fieldStyles.maintenanceFees?.fontWeight || "normal",
            },
          },
          expandedDetail3Title: {
            value: maintFeesIncludeLabel,
            style: {
              ...fieldStyles.maintFeesIncludeLabel,
              fontSize: fieldStyles.maintFeesIncludeLabel?.fontSize || "12px",
              fontFamily:
                fieldStyles.maintFeesIncludeLabel?.fontFamily ||
                "Raleway, sans-serif",
              fontWeight:
                fieldStyles.maintFeesIncludeLabel?.fontWeight || "normal",
            },
          },
          expandedDetail3Description: {
            value: maintenanceFeesInclude,
            style: {
              ...fieldStyles.maintenanceFeesInclude,
              fontSize: fieldStyles.maintenanceFeesInclude?.fontSize || "11px",
              fontFamily:
                fieldStyles.maintenanceFeesInclude?.fontFamily ||
                "ACaslonProRegular, serif",
              fontWeight:
                fieldStyles.maintenanceFeesInclude?.fontWeight || "normal",
            },
          },
          expandedDetail4Title: {
            value: featuresIncludedLabel,
            style: {
              ...fieldStyles.featuresIncludedLabel,
              fontSize: fieldStyles.featuresIncludedLabel?.fontSize || "12px",
              fontFamily:
                fieldStyles.featuresIncludedLabel?.fontFamily ||
                "Raleway, sans-serif",
              fontWeight:
                fieldStyles.featuresIncludedLabel?.fontWeight || "normal",
            },
          },
          expandedDetail4Description: {
            value: featuresIncluded,
            style: {
              ...fieldStyles.featuresIncluded,
              fontSize: fieldStyles.featuresIncluded?.fontSize || "11px",
              fontFamily:
                fieldStyles.featuresIncluded?.fontFamily ||
                "ACaslonProRegular, serif",
              fontWeight: fieldStyles.featuresIncluded?.fontWeight || "normal",
            },
          },
          keyHighlightLabel: {
            value: siteInfluencesLabel,
            style: {
              ...fieldStyles.siteInfluencesLabel,
              fontSize: fieldStyles.siteInfluencesLabel?.fontSize || "12px",
              fontFamily:
                fieldStyles.siteInfluencesLabel?.fontFamily ||
                "Raleway, sans-serif",
              fontWeight:
                fieldStyles.siteInfluencesLabel?.fontWeight || "normal",
            },
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
            cityLine,
            mlsNumber,
            headline,
            patioSqft,
            ceilingHeight,
            roadLabelBefore,
            roadLabelAfter,
            bedroomLabel,
            bathroomLabel,
            sqftLabel,
            builtYearLabel,
            byLawLabel,
            maintFeesLabel,
            maintFeesIncludeLabel,
            featuresIncludedLabel,
            siteInfluencesLabel,
            amenitiesLabel,
            viewLabel,
            contactLabel,
            phoneLabel,
            emailLabel,
            mlsLabel,
            disclaimerText,
            roadName,
            _deletedDetailFields: deletedDetailFields,
            _deletedStandardFieldIds: deletedStandardFieldIds,
            deletedStandardFieldIds,
            deletedDetailFields,
            fieldStyles,
            fieldPositions,
            processingSlots,
          },
          images,
          deletedImageSlots,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
          fieldPositions,
          fieldStyles,
        });
        payload.fieldPositions = fieldPositions;
        payload.fieldStyles = fieldStyles;
        (payload as any).deletedImageSlots = deletedImageSlots;
        if (payload.content) {
          (payload.content as any).deletedImageSlots = deletedImageSlots;
          (payload.content as any).fieldStyles = fieldStyles;
          (payload.content as any).fieldPositions = fieldPositions;
          if ((payload.content as any).otherDetails) {
            (payload.content as any).otherDetails.fieldStyles = fieldStyles;
            (payload.content as any).otherDetails.fieldPositions = fieldPositions;
          }
        }
        return payload;
      },
      importFromPayload: (payload: FeatureSheetResponse) => {
        if (!payload) return;
        const state = featureSheetService.parsePayloadToState(payload);

        const helperSt = (field: any): TextStyle | undefined => {
          if (!field) return undefined;
          if (typeof field === "object" && field.style)
            return field.style as TextStyle;
          return undefined;
        };

        if (state.offeredAtPrice) setAmount(state.offeredAtPrice as string);
        if (state.realtorName) setFullName(state.realtorName as string);
        if (state.emailLink) setEmail(state.emailLink as string);
        if (state.companyName) setPropertyName(state.companyName as string);
        if (state.propertyNotesTitle && state.propertyNotesTitle !== "0")
          setRoadName(state.propertyNotesTitle as string);
        if (state.propertyNotesDescription)
          setDescription(state.propertyNotesDescription as string);

        if (state.expandedDetail1Description)
          setByLawRestrictions(state.expandedDetail1Description as string);
        if (state.expandedDetail2Description)
          setMaintenanceFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description)
          setMaintenanceFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description)
          setFeaturesIncluded(state.expandedDetail4Description as string);

        if (state.keyHighlights)
          setSiteInfluences(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.maintenanceFees)
            setMaintenanceFees(details.maintenanceFees as string);
          if (details.maintenanceFeesInclude)
            setMaintenanceFeesInclude(details.maintenanceFeesInclude as string);
          if (details.amenities) setAmenities(details.amenities as string);
          if (details.view) setView(details.view as string);
          if (details.bedroom) setBedroom(details.bedroom as string);
          if (details.bathroom) setBathroom(details.bathroom as string);
          if (details.sqft) setSqft(details.sqft as string);
          if (details.builtYear) setBuiltYear(details.builtYear as string);
          if (details.number) setNumber(details.number as string);
          if (details.addressCode !== undefined) {
            setAddressCode(details.addressCode as string);
            setMlsNumber(details.addressCode as string);
          }
          if (details.roadName !== undefined && details.roadName !== "0") {
            setRoadName(details.roadName as string);
          }
          if (details.cityLine) setCityLine(details.cityLine as string);
          if (details.mlsNumber !== undefined) {
            setMlsNumber(details.mlsNumber as string);
            setAddressCode(details.mlsNumber as string);
          }
          if (details.headline) setHeadline(details.headline as string);
          if (details.patioSqft) setPatioSqft(details.patioSqft as string);
          if (details.ceilingHeight)
            setCeilingHeight(details.ceilingHeight as string);

          if (
            details.roadLabelBefore &&
            String(details.roadLabelBefore).toLowerCase() !== "number"
          )
            setRoadLabelBefore(details.roadLabelBefore as string);
          if (
            details.roadLabelAfter &&
            String(details.roadLabelAfter).toLowerCase() !== "road"
          )
            setRoadLabelAfter(details.roadLabelAfter as string);
          if (details.bedroomLabel)
            setBedroomLabel(details.bedroomLabel as string);
          if (details.bathroomLabel)
            setBathroomLabel(details.bathroomLabel as string);
          if (details.sqftLabel) setSqftLabel(details.sqftLabel as string);
          if (details.builtYearLabel)
            setBuiltYearLabel(details.builtYearLabel as string);
          if (details.byLawLabel) setByLawLabel(details.byLawLabel as string);
          if (details.maintFeesLabel)
            setMaintFeesLabel(details.maintFeesLabel as string);
          if (details.maintFeesIncludeLabel)
            setMaintFeesIncludeLabel(details.maintFeesIncludeLabel as string);
          if (details.featuresIncludedLabel)
            setFeaturesIncludedLabel(details.featuresIncludedLabel as string);
          if (details.siteInfluencesLabel)
            setSiteInfluencesLabel(details.siteInfluencesLabel as string);
          if (details.amenitiesLabel)
            setAmenitiesLabel(details.amenitiesLabel as string);
          if (details.viewLabel) setViewLabel(details.viewLabel as string);
          if (details.contactLabel)
            setContactLabel(details.contactLabel as string);
          if (details.phoneLabel) setPhoneLabel(details.phoneLabel as string);
          if (details.emailLabel) setEmailLabel(details.emailLabel as string);
          if (details.mlsLabel) setMlsLabel(details.mlsLabel as string);
          if (details.disclaimerText)
            setDisclaimerText(details.disclaimerText as string);

          if (details.processingSlots)
            setProcessingSlots(details.processingSlots as Record<string, boolean>);
        }

        const defaultAgentLogo =
          (orderData?.agent as any)?.company_logo_url ||
          (orderData?.agent as any)?.company_logo ||
          (orderData?.agent as any)?.logo_url ||
          (orderData?.agent as any)?.logo ||
          (orderData as any)?.property?.realtor_logo ||
          (orderData as any)?.realtor_logo ||
          (orderData as any)?.organization?.company_logo_url ||
          (orderData as any)?.organization?.logo_url ||
          (orderData as any)?.organization?.company_logos_urls?.[0] ||
          (orderData?.agent as any)?.avatar_url ||
          null;

        const sProcessing =
          (state as any).processingSlots ||
          (payload as any).processingSlots ||
          {};
        const sDeleted =
          (state as any).deletedImageSlots || deletedImageSlots || [];
        setProcessingSlots(sProcessing);

        if ((state as any).deletedImageSlots) {
          setDeletedImageSlots((state as any).deletedImageSlots);
        }

        if (state.images) {
          setImages((prev) =>
            featureSheetService.mergeResolvedImages(
              prev,
              {
                ...(state.images as any),
                image7:
                  (state.images as any).image7 ||
                  prev.image7 ||
                  defaultAgentLogo,
              },
              sProcessing,
              sDeleted,
            ),
          );
        } else if (defaultAgentLogo) {
          setImages((prev) => ({
            ...prev,
            image7: prev.image7 || defaultAgentLogo,
          }));
        }
        if (state.imageScales)
          setScale((prev) => ({
            ...prev,
            ...(state.imageScales as any),
          }));
        if (state.imagePositions)
          setPosition((prev) => ({
            ...prev,
            ...(state.imagePositions as any),
          }));
        if (state.imageRotations)
          setRotation((prev) => ({
            ...prev,
            ...(state.imageRotations as any),
          }));

        // Restore field styles & positions with template size normalization
        const rawPayload = payload as any;
        const c = (payload?.content as Record<string, any>) || rawPayload?.data?.content || {};
        const od =
          (c.otherDetails as Record<string, any>) ||
          rawPayload?.data?.other_details ||
          rawPayload?.other_details ||
          {};

        const incomingPositions =
          (od.fieldPositions as Record<string, { x: number; y: number }>) ||
          (c.fieldPositions as Record<string, { x: number; y: number }>) ||
          (state.fieldPositions as Record<string, { x: number; y: number }>) ||
          (payload.fieldPositions as Record<string, { x: number; y: number }>) ||
          rawPayload?.data?.field_positions;
        if (incomingPositions) {
          setFieldPositions(incomingPositions);
        } else if (state.fieldPositions) {
          setFieldPositions(
            state.fieldPositions as Record<string, { x: number; y: number }>,
          );
        }

        const incomingStyles: Record<string, TextStyle> = {
          ...((od.fieldStyles as Record<string, TextStyle>) || {}),
          ...((c.fieldStyles as Record<string, TextStyle>) || {}),
          ...((state.fieldStyles as Record<string, TextStyle>) || {}),
          ...((payload.fieldStyles as Record<string, TextStyle>) || {}),
        };

        if (!incomingStyles.fullName && helperSt(c.realtorName || state.realtorName)) {
          incomingStyles.fullName = helperSt(c.realtorName || state.realtorName)!;
        }
        if (!incomingStyles.propertyName && helperSt(c.companyName || state.companyName)) {
          incomingStyles.propertyName = helperSt(c.companyName || state.companyName)!;
        }
        if (!incomingStyles.email && helperSt(c.emailLink || state.emailLink)) {
          incomingStyles.email = helperSt(c.emailLink || state.emailLink)!;
        }
        if (!incomingStyles.amount && helperSt(c.offeredAtPrice || state.offeredAtPrice)) {
          incomingStyles.amount = helperSt(c.offeredAtPrice || state.offeredAtPrice)!;
        }
        if (!incomingStyles.roadName && helperSt(c.propertyNotesTitle || state.propertyNotesTitle)) {
          incomingStyles.roadName = helperSt(c.propertyNotesTitle || state.propertyNotesTitle)!;
        }
        if (!incomingStyles.description && helperSt(c.propertyNotesDescription || state.propertyNotesDescription)) {
          incomingStyles.description = helperSt(c.propertyNotesDescription || state.propertyNotesDescription)!;
        }
        if (!incomingStyles.byLawRestrictions && helperSt(c.expandedDetail1Description || state.expandedDetail1Description)) {
          incomingStyles.byLawRestrictions = helperSt(c.expandedDetail1Description || state.expandedDetail1Description)!;
        }
        if (!incomingStyles.maintenanceFees && helperSt(c.expandedDetail2Description || state.expandedDetail2Description)) {
          incomingStyles.maintenanceFees = helperSt(c.expandedDetail2Description || state.expandedDetail2Description)!;
        }
        if (!incomingStyles.maintenanceFeesInclude && helperSt(c.expandedDetail3Description || state.expandedDetail3Description)) {
          incomingStyles.maintenanceFeesInclude = helperSt(c.expandedDetail3Description || state.expandedDetail3Description)!;
        }
        if (!incomingStyles.featuresIncluded && helperSt(c.expandedDetail4Description || state.expandedDetail4Description)) {
          incomingStyles.featuresIncluded = helperSt(c.expandedDetail4Description || state.expandedDetail4Description)!;
        }

        if (incomingStyles.fullName?.fontSize === "20px") {
          incomingStyles.fullName = { ...incomingStyles.fullName, fontSize: "16px" };
        }
        if (incomingStyles.propertyName?.fontSize === "20px") {
          incomingStyles.propertyName = { ...incomingStyles.propertyName, fontSize: "12px" };
        }
        if (incomingStyles.email?.fontSize === "20px") {
          incomingStyles.email = { ...incomingStyles.email, fontSize: "12px" };
        }
        if (incomingStyles.amount?.fontSize === "36px") {
          incomingStyles.amount = { ...incomingStyles.amount, fontSize: "32px" };
        }
        if (incomingStyles.description?.fontSize === "20px") {
          incomingStyles.description = { ...incomingStyles.description, fontSize: "11px" };
        }
        if (helperSt(od.number) || helperSt(od.phone)) {
          const numStyle = (helperSt(od.number) || helperSt(od.phone))!;
          incomingStyles.number =
            numStyle.fontSize === "20px"
              ? { ...numStyle, fontSize: "12px" }
              : numStyle;
          incomingStyles.phone = incomingStyles.number;
        } else if (incomingStyles.number?.fontSize === "20px") {
          incomingStyles.number = { ...incomingStyles.number, fontSize: "12px" };
        }

        if (Object.keys(incomingStyles).length > 0) {
          setFieldStyles((prev) => ({
            ...prev,
            ...incomingStyles,
          }));
        }

        const restoredDeletedDetail = (
          od._deletedDetailFields && Array.isArray(od._deletedDetailFields)
            ? od._deletedDetailFields
            : od.deletedDetailFields && Array.isArray(od.deletedDetailFields)
              ? od.deletedDetailFields
              : (state as any).deletedDetailFields &&
                  Array.isArray((state as any).deletedDetailFields)
                ? (state as any).deletedDetailFields
                : []
        ) as any[];

        const restoredDeletedStandard = (
          od._deletedStandardFieldIds &&
          Array.isArray(od._deletedStandardFieldIds)
            ? od._deletedStandardFieldIds
            : od.deletedStandardFieldIds &&
                Array.isArray(od.deletedStandardFieldIds)
              ? od.deletedStandardFieldIds
              : (state as any).deletedStandardFieldIds &&
                  Array.isArray((state as any).deletedStandardFieldIds)
                ? (state as any).deletedStandardFieldIds
                : []
        ) as string[];

        setDeletedDetailFields(restoredDeletedDetail);
        setDeletedStandardFieldIds(restoredDeletedStandard);

        updateFormData({
          deletedStandardFieldIds: restoredDeletedStandard,
          deletedDetailFields: restoredDeletedDetail,
        });
      },
    }));

    // ── 14. Image Slot Renderer ───────────────────────────────────────────────
    const renderImageSlot = (
      key: string,
      containerClassName: string,
      placeholderText = "Select Image",
      isLogoSlot = false,
      controlsPosition?: "default" | "below-top-svg",
    ) => {
      const inputRef = getFileInputRef(key);
      const hasImage = !!images[key];
      const isBelowTopSvg = controlsPosition === "below-top-svg";

      return (
        <div
          data-image-slot="true"
          {...(isLogoSlot
            ? {
                id: `agentLogo_${key}`,
                "data-slot-type": "logo",
                "data-logo-slot": "true",
              }
            : {})}
          className={`relative overflow-hidden group cursor-pointer ${containerClassName} ${
            isBelowTopSvg
              ? "border-none shadow-none bg-white"
              : isLogoSlot
                ? hasImage
                  ? "bg-transparent drop-shadow-sm"
                  : "border border-dashed border-white/60 bg-white/10"
                : hasImage
                  ? "border-[3.5px] border-white shadow-[2px_3px_8px_rgba(0,0,0,0.3)] bg-transparent"
                  : "border-[3.5px] border-white shadow-[2px_3px_8px_rgba(0,0,0,0.2)] bg-gray-200"
          }`}
          onMouseEnter={() => setHoveredSlot(key)}
          onMouseLeave={() => setHoveredSlot(null)}
          onClick={(e) => {
            if (e.altKey) return;
            e.stopPropagation();
            setActiveSlot(key);
            if (!hasImage) {
              openImageSourceModal(key, e);
            }
          }}
        >
          <BoxIndicator isVisible={isSlotActive(key)} />

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

                  {/* Hover Controls - Zoom Buttons (Bottom Left, NO data-html2canvas-ignore) */}
                  {!isBelowTopSvg && (
                    <div
                      className={`absolute bottom-1.5 left-1.5 flex gap-1.5 z-20 ${
                        isSlotActive(key)
                          ? "opacity-100 pointer-events-auto"
                          : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoom(key, "in");
                        }}
                        className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
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
                        className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                    </div>
                  )}

                  {!isBelowTopSvg && (
                    <>
                      {/* Rotate — standalone absolute button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotate(key);
                        }}
                        className={`absolute top-2 right-[68px] z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 print:hidden ${
                          isSlotActive(key)
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        }`}
                        title="Rotate image"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-gray-700" />
                      </button>

                      {/* Edit — standalone absolute button */}
                      <button
                        type="button"
                        onClick={(e) => openImageSourceModal(key, e)}
                        className={`absolute top-2 right-9 z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 ${
                          isSlotActive(key)
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        }`}
                        title="Edit image"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-700" />
                      </button>

                      {/* Delete — standalone absolute button with text-red-500 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(key, inputRef);
                        }}
                        className={`absolute top-2 right-2 z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 ${
                          isSlotActive(key)
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        }`}
                        title="Delete image"
                      >
                        <Trash className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </>
                  )}
                </>
              )
            ) : (
              <div
                data-html2canvas-ignore="true"
                onClick={(e) => openImageSourceModal(key, e)}
                className={`w-full h-full flex items-center justify-center cursor-pointer p-2 text-center text-xs font-medium transition-colors ${
                  isLogoSlot
                    ? "text-gray-300 hover:bg-white/20"
                    : isBelowTopSvg
                      ? "bg-white text-gray-600 hover:bg-gray-50"
                      : "border border-dashed border-gray-400 bg-gray-200 text-gray-600 hover:bg-gray-300"
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
          usedImageUrls={Object.values(images).filter((url): url is string => Boolean(url))}
          />
        )}

        {/* ── PAGE 1 DIVIDER ─────────────────────────────────────────────── */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* ── PAGE 1 OUTER BLEED WRAPPER ──────────────────────────────────── */}
        <div
          className="pdf-page bg-white shadow-xl relative overflow-hidden flex flex-col font-sans"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          {/* Background SVG graphics spanning full bleed */}
          <svg
            viewBox="0 0 1296 1656"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            preserveAspectRatio="none"
          >
            <mask
              id="mask0_14_129"
              style={{ maskType: "luminance" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1296"
              height="1656"
            >
              <path d="M0 0H1296V1656H0V0Z" fill="white" />
            </mask>
            <g mask="url(#mask0_14_129)">
              <path d="M0 1638H1296V18H0V1638Z" fill="#B3B394" />
              <g opacity="0.5">
                <path
                  d="M1344.92 245.667L-2 216.781L1.13427 828C1.13427 828 92.5039 172.531 1345 357.441L1344.92 245.667Z"
                  fill="white"
                />
              </g>
              <path
                d="M1310 0H0V792C0 792 83.9471 125.304 1308.34 287.463L1310 0Z"
                fill="#184260"
              />
              <g opacity="0.5">
                <path
                  d="M-3.90001 1573.28L1288.86 1601.75L1297.49 952.11C1297.49 952.11 1209.02 1615.16 -4.01001 1429.28L-3.90001 1573.28Z"
                  fill="white"
                />
              </g>
              <path
                d="M0 1656H1300L1298.35 948C1298.35 948 1215.06 1643.97 0 1476.21V1656Z"
                fill="#184260"
              />
            </g>
          </svg>

          {/* SafeZoneWrapper for Page 1 Content */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div
              data-safezone-container="true"
              className="relative z-10 w-full h-full flex flex-col justify-between px-4 pt-5 pb-3 overflow-hidden"
            >
              {/* ── Header Section ─────────────────────────────────────── */}
              <div className="flex gap-4 items-center pt-2 pb-2 w-full shrink-0">
                {/* Logo Slot (Left 28.5%, outside editable content section) */}
                <div className="w-[28.5%] shrink-0">
                  <div className="w-[190px] h-[65px] relative">
                    {renderImageSlot(
                      "image7",
                      "w-full h-full",
                      "Select Logo (Image 7)",
                      true,
                    )}
                  </div>
                </div>

                {/* Address Header (Right 69%, aligned to main image left edge) */}
                <div
                  data-safezone-container="true"
                  className={`w-[69%] flex flex-col items-start text-left text-white relative rounded-lg border-[3.5px] border-solid border-transparent transition-all duration-150 group/sec shrink-0 ${
                    lockedSections.header
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  {/* Lock button */}
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("header");
                    }}
                    className={`absolute -top-2 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.header
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                    title={
                      lockedSections.header
                        ? "Unlock Header Section"
                        : "Lock Header Section"
                    }
                  >
                    {lockedSections.header ? (
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

                  <div className="flex items-center text-white text-[24px] font-normal font-sans tracking-wide uppercase leading-none gap-2 whitespace-nowrap flex-nowrap shrink-0">
                    {!isFieldDeleted("roadName") && (
                      <DraggableBox
                        id="roadName"
                        position={fieldPositions.roadName}
                        onPositionChange={updateFieldPosition}
                        label="Suite #"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "roadName",
                            "Suite #",
                            roadName,
                            "Header",
                            fieldStyles.roadName,
                          )
                        }
                        deleteTitle="Remove Suite #"
                      >
                        <StyledInput
                          fieldId="roadName"
                          fieldLabel="Suite #"
                          value={roadName}
                          onChange={(e) => setRoadName(e.target.value)}
                          inputStyle={fieldStyles.roadName}
                          onChangeStyle={(s) =>
                            updateFieldStyle("roadName", s)
                          }
                          className="w-auto min-w-[1ch] text-left bg-transparent text-white font-normal font-sans text-[24px] focus:outline-none placeholder-white/90 placeholder:font-normal whitespace-nowrap border-none"
                          placeholder="0"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("addressCode") && (
                      <DraggableBox
                        id="addressCode"
                        position={fieldPositions.addressCode}
                        onPositionChange={updateFieldPosition}
                        label="MLS / Code"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "addressCode",
                            "MLS / Code",
                            mlsNumber || addressCode,
                            "Header",
                            fieldStyles.addressCode,
                          )
                        }
                        deleteTitle="Remove MLS / Code"
                      >
                        <StyledInput
                          fieldId="addressCode"
                          fieldLabel="MLS / Code"
                          value={mlsNumber || addressCode}
                          onChange={(e) => {
                            setMlsNumber(e.target.value);
                            setAddressCode(e.target.value);
                          }}
                          inputStyle={fieldStyles.addressCode}
                          onChangeStyle={(s) =>
                            updateFieldStyle("addressCode", s)
                          }
                          className="w-auto bg-transparent text-white font-normal font-sans text-[24px] focus:outline-none placeholder-white/90 placeholder:font-normal whitespace-nowrap border-none text-left"
                          placeholder="0000-0000"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("roadLabelBefore") && (
                      <DraggableBox
                        id="roadLabelBefore"
                        position={fieldPositions.roadLabelBefore}
                        onPositionChange={updateFieldPosition}
                        label="Street Number"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "roadLabelBefore",
                            "Street Number",
                            roadLabelBefore,
                            "Header",
                            fieldStyles.roadLabelBefore,
                          )
                        }
                        deleteTitle="Remove Street Number"
                      >
                        <StyledInput
                          fieldId="roadLabelBefore"
                          fieldLabel="Street Number"
                          value={roadLabelBefore}
                          onChange={(e) => setRoadLabelBefore(e.target.value)}
                          inputStyle={fieldStyles.roadLabelBefore}
                          onChangeStyle={(s) =>
                            updateFieldStyle("roadLabelBefore", s)
                          }
                          className="w-auto bg-transparent text-white font-normal font-sans text-[24px] focus:outline-none border-none placeholder-white/90 placeholder:font-normal whitespace-nowrap"
                          placeholder="NUMBER"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("roadLabelAfter") && (
                      <DraggableBox
                        id="roadLabelAfter"
                        position={fieldPositions.roadLabelAfter}
                        onPositionChange={updateFieldPosition}
                        label="Street Name"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "roadLabelAfter",
                            "Street Name",
                            roadLabelAfter,
                            "Header",
                            fieldStyles.roadLabelAfter,
                          )
                        }
                        deleteTitle="Remove Street Name"
                      >
                        <StyledInput
                          fieldId="roadLabelAfter"
                          fieldLabel="Street Name"
                          value={roadLabelAfter}
                          onChange={(e) => setRoadLabelAfter(e.target.value)}
                          inputStyle={fieldStyles.roadLabelAfter}
                          onChangeStyle={(s) =>
                            updateFieldStyle("roadLabelAfter", s)
                          }
                          className="w-auto bg-transparent text-white font-normal font-sans text-[24px] focus:outline-none border-none placeholder-white/90 placeholder:font-normal whitespace-nowrap"
                          placeholder="ROAD"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}
                  </div>

                  {!isFieldDeleted("cityLine") && (
                    <DraggableBox
                      id="cityLine"
                      position={fieldPositions.cityLine}
                      onPositionChange={updateFieldPosition}
                      label="City Line"
                      zoom={0.85}
                      disabled={lockedSections.header}
                      containerClassName="w-auto inline-flex items-center shrink-0"
                      className="w-auto inline-flex items-center"
                      onDelete={() =>
                        removeStandardField(
                          "cityLine",
                          "City Line",
                          cityLine,
                          "Header",
                          fieldStyles.cityLine,
                        )
                      }
                      deleteTitle="Remove City Line"
                    >
                      <StyledInput
                        fieldId="cityLine"
                        fieldLabel="City Line"
                        value={cityLine}
                        onChange={(e) => setCityLine(e.target.value)}
                        inputStyle={{
                          fontFamily: "Arial, sans-serif",
                          ...fieldStyles["cityLine"],
                        }}
                        onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                        className="font-thin text-[16px] h-[22px] mt-1 bg-transparent text-[#d4e3ec] text-left w-auto min-w-[200px] tracking-[0.16em] focus:outline-none border-none uppercase placeholder-white/70 whitespace-nowrap"
                        placeholder="BRIGHOUSE SOUTH, RICHMOND"
                        wrapperClassName="w-auto shrink-0"
                      />
                    </DraggableBox>
                  )}
                </div>
              </div>

              {/* ── Main Body (2 Columns with isolated heights to prevent cross-column overflow) ── */}
              <div className="flex gap-4 flex-1 min-h-0 items-start my-1 w-full">
                {/* ── LEFT COLUMN (28.5%) ──────────────────────────────────── */}
                <div className="w-[28.5%] h-full min-h-0 flex flex-col justify-between relative">
                  {/* White Gradient Background: starts at top of Image 1 and fades to 0 opacity before bottom SVG */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 left-0 right-0 bottom-[84px] z-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 20%, rgba(255, 255, 255, 0) 100%)",
                    }}
                  />

                  {/* Top: Image 1 (Standalone, outside dragbox and section lock) */}
                  <div className="w-full shrink-0 mb-1.5 relative z-10">
                    {renderImageSlot(
                      "image1",
                      "w-full h-[135px]",
                      "Select Image 1",
                    )}
                  </div>

                  {/* ── Details Section (Fields can be dragged freely across safe zone) ── */}
                  <div className="flex-1 min-h-0 relative z-10 w-full p-2 mb-[58px] flex flex-col justify-between">
                    {/* Lock button for details draggable section */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("details");
                      }}
                      className={`absolute -top-2.5 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 hover:opacity-100 ${
                        lockedSections.details
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600 !opacity-100"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.details
                          ? "Unlock Details Section"
                          : "Lock Details Section"
                      }
                    >
                      {lockedSections.details ? (
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

                    {/* 1. Description (Individually Draggable, 11px, Caslon Pro Regular, Normal, Left-aligned) */}
                    {!isFieldDeleted("propertyDescription") && (
                      <DraggableBox
                        id="propertyDescription"
                        position={fieldPositions.propertyDescription}
                        onPositionChange={updateFieldPosition}
                        label="Description"
                        zoom={0.85}
                        disabled={lockedSections.details}
                        containerClassName="w-full shrink-0 mb-1"
                        className="w-full"
                        onDelete={() =>
                          removeStandardField(
                            "propertyDescription",
                            "Description",
                            description,
                            "Property Description",
                            fieldStyles.description,
                          )
                        }
                        deleteTitle="Remove Description"
                      >
                        <StyledInput
                          value={description}
                          rows={7}
                          onChange={(e) => setDescription(e.target.value)}
                          inputStyle={{
                            ...fieldStyles["description"],
                            fontFamily:
                              fieldStyles["description"]?.fontFamily ||
                              "ACaslonProRegular, serif",
                            fontSize:
                              fieldStyles["description"]?.fontSize || "11px",
                            fontWeight:
                              fieldStyles["description"]?.fontWeight ||
                              "normal",
                            textAlign:
                              fieldStyles["description"]?.textAlign || "left",
                          }}
                          onChangeStyle={(s) =>
                            updateFieldStyle("description", s)
                          }
                          className="text-[11px] font-caslon-regular font-normal text-[#2d3748] leading-[1.3] text-left bg-transparent w-full focus:outline-none border-none placeholder-gray-500 whitespace-pre-wrap break-words"
                          placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South West providing unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms."
                        />
                      </DraggableBox>
                    )}

                    {/* 2. Specs List (Individually Draggable, 12px Raleway Normal Title, 11px Caslon Pro Regular Normal Value, Left-aligned) */}
                    <div className="flex flex-col gap-1 text-[11px] leading-tight font-sans my-auto">
                      {!isFieldDeleted("byLawRestrictions") && (
                        <DraggableBox
                          id="byLawRestrictions"
                          position={fieldPositions.byLawRestrictions}
                          onPositionChange={updateFieldPosition}
                          label="By-law Restrictions"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full"
                          className="w-full"
                          onDelete={() =>
                            removeStandardField(
                              "byLawRestrictions",
                              "By-law Restrictions",
                              byLawRestrictions,
                              "Property Specs",
                              fieldStyles.byLawRestrictions,
                            )
                          }
                          deleteTitle="Remove By-law Restrictions"
                        >
                          <div className="flex flex-col text-left">
                            <StyledInput
                              value={byLawLabel}
                              onChange={(e) => setByLawLabel(e.target.value)}
                              inputStyle={{
                                ...fieldStyles.byLawLabel,
                                fontFamily:
                                  fieldStyles.byLawLabel?.fontFamily ||
                                  "Raleway, sans-serif",
                                fontSize:
                                  fieldStyles.byLawLabel?.fontSize || "12px",
                                fontWeight:
                                  fieldStyles.byLawLabel?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles.byLawLabel?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawLabel", s)
                              }
                              className="font-normal font-raleway text-[12px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="BY-LAW RESTRICTIONS:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={byLawRestrictions}
                              onChange={(e) =>
                                setByLawRestrictions(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles["byLawRestrictions"],
                                fontFamily:
                                  fieldStyles["byLawRestrictions"]?.fontFamily ||
                                  "ACaslonProRegular, serif",
                                fontSize:
                                  fieldStyles["byLawRestrictions"]?.fontSize ||
                                  "11px",
                                fontWeight:
                                  fieldStyles["byLawRestrictions"]?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles["byLawRestrictions"]?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawRestrictions", s)
                              }
                              className="text-[11px] font-caslon-regular font-normal text-[#2d3748] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
                              placeholder="Pets Allowed w/Rest., Rentals Allowed"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("maintFees") && (
                        <DraggableBox
                          id="maintFees"
                          position={fieldPositions.maintFees}
                          onPositionChange={updateFieldPosition}
                          label="Maint. Fees"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full"
                          className="w-full"
                          onDelete={() =>
                            removeStandardField(
                              "maintFees",
                              "Maint. Fees",
                              maintenanceFees,
                              "Property Specs",
                              fieldStyles.maintenanceFees,
                            )
                          }
                          deleteTitle="Remove Maint. Fees"
                        >
                          <div className="flex flex-col text-left">
                            <StyledInput
                              value={maintFeesLabel}
                              onChange={(e) =>
                                setMaintFeesLabel(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles.maintFeesLabel,
                                fontFamily:
                                  fieldStyles.maintFeesLabel?.fontFamily ||
                                  "Raleway, sans-serif",
                                fontSize:
                                  fieldStyles.maintFeesLabel?.fontSize ||
                                  "12px",
                                fontWeight:
                                  fieldStyles.maintFeesLabel?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles.maintFeesLabel?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesLabel", s)
                              }
                              className="font-normal font-raleway text-[12px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="MAINT. FEES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={maintenanceFees}
                              onChange={(e) =>
                                setMaintenanceFees(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles["maintenanceFees"],
                                fontFamily:
                                  fieldStyles["maintenanceFees"]?.fontFamily ||
                                  "ACaslonProRegular, serif",
                                fontSize:
                                  fieldStyles["maintenanceFees"]?.fontSize ||
                                  "11px",
                                fontWeight:
                                  fieldStyles["maintenanceFees"]?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles["maintenanceFees"]?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintenanceFees", s)
                              }
                              className="text-[11px] font-caslon-regular font-normal text-[#2d3748] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
                              placeholder="$000.00"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("maintFeesInclude") && (
                        <DraggableBox
                          id="maintFeesInclude"
                          position={fieldPositions.maintFeesInclude}
                          onPositionChange={updateFieldPosition}
                          label="Maint. Fees Include"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full"
                          className="w-full"
                          onDelete={() =>
                            removeStandardField(
                              "maintFeesInclude",
                              "Maint. Fees Include",
                              maintenanceFeesInclude,
                              "Property Specs",
                              fieldStyles.maintenanceFeesInclude,
                            )
                          }
                          deleteTitle="Remove Maint. Fees Include"
                        >
                          <div className="flex flex-col text-left">
                            <StyledInput
                              value={maintFeesIncludeLabel}
                              onChange={(e) =>
                                setMaintFeesIncludeLabel(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles.maintFeesIncludeLabel,
                                fontFamily:
                                  fieldStyles.maintFeesIncludeLabel
                                    ?.fontFamily || "Raleway, sans-serif",
                                fontSize:
                                  fieldStyles.maintFeesIncludeLabel?.fontSize ||
                                  "12px",
                                fontWeight:
                                  fieldStyles.maintFeesIncludeLabel
                                    ?.fontWeight || "normal",
                                textAlign:
                                  fieldStyles.maintFeesIncludeLabel
                                    ?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesIncludeLabel", s)
                              }
                              className="font-normal font-raleway text-[12px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="MAINT. FEES INCLUDE:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={maintenanceFeesInclude}
                              onChange={(e) =>
                                setMaintenanceFeesInclude(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles["maintenanceFeesInclude"],
                                fontFamily:
                                  fieldStyles["maintenanceFeesInclude"]
                                    ?.fontFamily || "ACaslonProRegular, serif",
                                fontSize:
                                  fieldStyles["maintenanceFeesInclude"]
                                    ?.fontSize || "11px",
                                fontWeight:
                                  fieldStyles["maintenanceFeesInclude"]
                                    ?.fontWeight || "normal",
                                textAlign:
                                  fieldStyles["maintenanceFeesInclude"]
                                    ?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintenanceFeesInclude", s)
                              }
                              className="text-[11px] font-caslon-regular font-normal text-[#2d3748] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                          disabled={lockedSections.details}
                          containerClassName="w-full"
                          className="w-full"
                          onDelete={() =>
                            removeStandardField(
                              "featuresIncluded",
                              "Features Included",
                              featuresIncluded,
                              "Property Specs",
                              fieldStyles.featuresIncluded,
                            )
                          }
                          deleteTitle="Remove Features Included"
                        >
                          <div className="flex flex-col text-left">
                            <StyledInput
                              value={featuresIncludedLabel}
                              onChange={(e) =>
                                setFeaturesIncludedLabel(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles.featuresIncludedLabel,
                                fontFamily:
                                  fieldStyles.featuresIncludedLabel
                                    ?.fontFamily || "Raleway, sans-serif",
                                fontSize:
                                  fieldStyles.featuresIncludedLabel?.fontSize ||
                                  "12px",
                                fontWeight:
                                  fieldStyles.featuresIncludedLabel
                                    ?.fontWeight || "normal",
                                textAlign:
                                  fieldStyles.featuresIncludedLabel
                                    ?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncludedLabel", s)
                              }
                              className="font-normal font-raleway text-[12px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="FEATURES INCLUDED:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={featuresIncluded}
                              onChange={(e) =>
                                setFeaturesIncluded(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles["featuresIncluded"],
                                fontFamily:
                                  fieldStyles["featuresIncluded"]?.fontFamily ||
                                  "ACaslonProRegular, serif",
                                fontSize:
                                  fieldStyles["featuresIncluded"]?.fontSize ||
                                  "11px",
                                fontWeight:
                                  fieldStyles["featuresIncluded"]?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles["featuresIncluded"]?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncluded", s)
                              }
                              className="text-[11px] font-caslon-regular font-normal text-[#2d3748] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
                              placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("siteInfluences") && (
                        <DraggableBox
                          id="siteInfluences"
                          position={fieldPositions.siteInfluences}
                          onPositionChange={updateFieldPosition}
                          label="Site Influences"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full"
                          className="w-full"
                          onDelete={() =>
                            removeStandardField(
                              "siteInfluences",
                              "Site Influences",
                              siteInfluences,
                              "Property Specs",
                              fieldStyles.siteInfluences,
                            )
                          }
                          deleteTitle="Remove Site Influences"
                        >
                          <div className="flex flex-col text-left">
                            <StyledInput
                              value={siteInfluencesLabel}
                              onChange={(e) =>
                                setSiteInfluencesLabel(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles.siteInfluencesLabel,
                                fontFamily:
                                  fieldStyles.siteInfluencesLabel?.fontFamily ||
                                  "Raleway, sans-serif",
                                fontSize:
                                  fieldStyles.siteInfluencesLabel?.fontSize ||
                                  "12px",
                                fontWeight:
                                  fieldStyles.siteInfluencesLabel?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles.siteInfluencesLabel?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluencesLabel", s)
                              }
                              className="font-normal font-raleway text-[12px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="SITE INFLUENCES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={siteInfluences}
                              onChange={(e) =>
                                setSiteInfluences(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles["siteInfluences"],
                                fontFamily:
                                  fieldStyles["siteInfluences"]?.fontFamily ||
                                  "ACaslonProRegular, serif",
                                fontSize:
                                  fieldStyles["siteInfluences"]?.fontSize ||
                                  "11px",
                                fontWeight:
                                  fieldStyles["siteInfluences"]?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles["siteInfluences"]?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluences", s)
                              }
                              className="text-[11px] font-caslon-regular font-normal text-[#2d3748] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                          disabled={lockedSections.details}
                          containerClassName="w-full"
                          className="w-full"
                          onDelete={() =>
                            removeStandardField(
                              "amenities",
                              "Amenities",
                              amenities,
                              "Property Specs",
                              fieldStyles.amenities,
                            )
                          }
                          deleteTitle="Remove Amenities"
                        >
                          <div className="flex flex-col text-left">
                            <StyledInput
                              value={amenitiesLabel}
                              onChange={(e) =>
                                setAmenitiesLabel(e.target.value)
                              }
                              inputStyle={{
                                ...fieldStyles.amenitiesLabel,
                                fontFamily:
                                  fieldStyles.amenitiesLabel?.fontFamily ||
                                  "Raleway, sans-serif",
                                fontSize:
                                  fieldStyles.amenitiesLabel?.fontSize ||
                                  "12px",
                                fontWeight:
                                  fieldStyles.amenitiesLabel?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles.amenitiesLabel?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenitiesLabel", s)
                              }
                              className="font-normal font-raleway text-[12px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="AMENITIES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={amenities}
                              onChange={(e) => setAmenities(e.target.value)}
                              inputStyle={{
                                ...fieldStyles["amenities"],
                                fontFamily:
                                  fieldStyles["amenities"]?.fontFamily ||
                                  "ACaslonProRegular, serif",
                                fontSize:
                                  fieldStyles["amenities"]?.fontSize || "11px",
                                fontWeight:
                                  fieldStyles["amenities"]?.fontWeight ||
                                  "normal",
                                textAlign:
                                  fieldStyles["amenities"]?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenities", s)
                              }
                              className="text-[11px] font-caslon-regular font-normal text-[#2d3748] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                          disabled={lockedSections.details}
                          containerClassName="w-full"
                          className="w-full"
                          onDelete={() =>
                            removeStandardField(
                              "view",
                              "View",
                              view,
                              "Property Specs",
                              fieldStyles.view,
                            )
                          }
                          deleteTitle="Remove View"
                        >
                          <div className="flex flex-col text-left">
                            <StyledInput
                              value={viewLabel}
                              onChange={(e) => setViewLabel(e.target.value)}
                              inputStyle={{
                                ...fieldStyles.viewLabel,
                                fontFamily:
                                  fieldStyles.viewLabel?.fontFamily ||
                                  "Raleway, sans-serif",
                                fontSize:
                                  fieldStyles.viewLabel?.fontSize || "12px",
                                fontWeight:
                                  fieldStyles.viewLabel?.fontWeight || "normal",
                                textAlign:
                                  fieldStyles.viewLabel?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("viewLabel", s)
                              }
                              className="font-normal font-raleway text-[12px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="VIEW:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={view}
                              onChange={(e) => setView(e.target.value)}
                              inputStyle={{
                                ...fieldStyles["view"],
                                fontFamily:
                                  fieldStyles["view"]?.fontFamily ||
                                  "ACaslonProRegular, serif",
                                fontSize:
                                  fieldStyles["view"]?.fontSize || "11px",
                                fontWeight:
                                  fieldStyles["view"]?.fontWeight || "normal",
                                textAlign:
                                  fieldStyles["view"]?.textAlign || "left",
                              }}
                              onChangeStyle={(s) => updateFieldStyle("view", s)}
                              className="text-[11px] font-caslon-regular font-normal text-[#2d3748] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
                              placeholder="South & SW - Van Isl."
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>

                    {/* 3. Bottom: Price (Individually Draggable, Left-aligned) */}
                    {!isFieldDeleted("priceAmount") && (
                      <DraggableBox
                        id="priceAmount"
                        position={fieldPositions.priceAmount}
                        onPositionChange={updateFieldPosition}
                        label="Price"
                        zoom={0.85}
                        disabled={lockedSections.details}
                        containerClassName="w-full shrink-0"
                        className="w-full"
                        onDelete={() =>
                          removeStandardField(
                            "priceAmount",
                            "Price",
                            amount,
                            "Price",
                            fieldStyles.amount,
                          )
                        }
                        deleteTitle="Remove Price"
                      >
                        <div className="pt-1 mt-auto relative group/price shrink-0 text-left">
                          <StyledInput
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputStyle={{
                              ...fieldStyles["amount"],
                              fontSize:
                                fieldStyles["amount"]?.fontSize || "32px",
                              textAlign:
                                fieldStyles["amount"]?.textAlign || "left",
                            }}
                            onChangeStyle={(s) => updateFieldStyle("amount", s)}
                            className="font-normal text-[32px] text-[#184260] leading-none bg-transparent text-left w-full focus:outline-none border-none placeholder-[#184260] whitespace-nowrap tracking-tight"
                            placeholder="$000,000"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* ── RIGHT COLUMN (69%) with strict height and layout preservation ── */}
                <div className="w-[69%] h-full min-h-0 flex flex-col justify-between shrink-0">
                  {/* Hero Photo (Image 2) */}
                  <div className="w-full shrink-0">
                    {renderImageSlot(
                      "image2",
                      "w-full h-[285px]",
                      "Select Main Photo (Image 2)",
                    )}
                  </div>

                  {/* Headline Text (Comfortable height, no overflow clipping, 14px gap from Image 2, 12px gap to Specs) */}
                  {!isFieldDeleted("headline") && (
                    <div
                      data-safezone-container="true"
                      className={`text-center min-h-[46px] mt-[14px] flex items-center justify-center shrink-0 relative z-10 transition-all duration-150 group/sec rounded ${
                        lockedSections.headline
                          ? "ring-2 ring-amber-400/50 bg-amber-500/5"
                          : "hover:ring-2 hover:ring-[#8B3DFF]/50"
                      }`}
                    >
                      <button
                        type="button"
                        data-html2canvas-ignore="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionLock("headline");
                        }}
                        className={`absolute top-0.5 right-0.5 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.headline
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                        title={
                          lockedSections.headline
                            ? "Unlock Headline"
                            : "Lock Headline"
                        }
                      >
                        {lockedSections.headline ? (
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

                      <DraggableBox
                        id="headline"
                        position={fieldPositions.headline}
                        onPositionChange={updateFieldPosition}
                        label="Headline"
                        zoom={0.85}
                        disabled={lockedSections.headline}
                        containerClassName="w-full"
                        className="w-full"
                        onDelete={() =>
                          removeStandardField(
                            "headline",
                            "Headline",
                            headline,
                            "Headline",
                            fieldStyles.headline,
                          )
                        }
                        deleteTitle="Remove Headline"
                      >
                        <StyledInput
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          inputStyle={{
                            ...fieldStyles["headline"],
                            fontFamily:
                              fieldStyles["headline"]?.fontFamily ||
                              "ChampagneLimousines, sans-serif",
                            fontSize:
                              fieldStyles["headline"]?.fontSize || "16px",
                            fontWeight:
                              fieldStyles["headline"]?.fontWeight || "normal",
                            color: fieldStyles["headline"]?.color || "#000000",
                          }}
                          onChangeStyle={(s) => updateFieldStyle("headline", s)}
                          className="font-normal font-champagne text-[16px] text-black uppercase tracking-wider text-center bg-transparent w-full focus:outline-none border-none placeholder-black/70 whitespace-pre-wrap break-words leading-normal py-1"
                          placeholder="ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING."
                        />
                      </DraggableBox>
                    </div>
                  )}

                  {/* Specs Summary Row (Fixed Height, 12px gap from Headline, 14px gap to 2x2 Photo Grid) */}
                  <div
                    data-safezone-container="true"
                    className={`flex items-center justify-center gap-1.5 w-full h-[28px] mt-[12px] mb-[14px] text-[16px] font-normal font-champagne text-black uppercase tracking-normal text-center shrink-0 relative z-10 group/sec transition-all duration-150 rounded ${
                      lockedSections.specs
                        ? "ring-2 ring-amber-400/50 bg-amber-500/5"
                        : "hover:ring-2 hover:ring-[#8B3DFF]/50"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("specs");
                      }}
                      className={`absolute -top-5 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 pointer-events-none group-hover/sec:opacity-100 group-hover/sec:pointer-events-auto ${
                        lockedSections.specs
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.specs ? "Unlock Specs" : "Lock Specs"
                      }
                    >
                      {lockedSections.specs ? (
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
                        disabled={lockedSections.specs}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "specBedroom",
                            "Bedrooms",
                            bedroom,
                            "Property Specs",
                            fieldStyles.bedroom,
                          )
                        }
                        deleteTitle="Remove Bedrooms"
                      >
                        <div className="flex items-center gap-0.5 whitespace-nowrap">
                          <StyledInput
                            value={bedroom}
                            onChange={(e) => setBedroom(e.target.value)}
                            inputStyle={{
                              ...fieldStyles["bedroom"],
                              fontFamily:
                                fieldStyles["bedroom"]?.fontFamily ||
                                "ChampagneLimousines, sans-serif",
                              fontSize:
                                fieldStyles["bedroom"]?.fontSize || "16px",
                              fontWeight:
                                fieldStyles["bedroom"]?.fontWeight || "normal",
                              color: fieldStyles["bedroom"]?.color || "#000000",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bedroom", s)
                            }
                            className="font-normal font-champagne text-[16px] text-black w-auto min-w-[1ch] text-right bg-transparent focus:outline-none border-none placeholder-black/70 whitespace-nowrap"
                            placeholder="0"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={bedroomLabel}
                            onChange={(e) => setBedroomLabel(e.target.value)}
                            inputStyle={{
                              ...fieldStyles.bedroomLabel,
                              fontFamily:
                                fieldStyles.bedroomLabel?.fontFamily ||
                                "ChampagneLimousines, sans-serif",
                              fontSize:
                                fieldStyles.bedroomLabel?.fontSize || "16px",
                              fontWeight:
                                fieldStyles.bedroomLabel?.fontWeight ||
                                "normal",
                              color:
                                fieldStyles.bedroomLabel?.color || "#000000",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bedroomLabel", s)
                            }
                            className="text-nowrap font-normal font-champagne text-[16px] text-black uppercase bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="BEDROOM"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    <span className="text-black/60 select-none">|</span>

                    {!isFieldDeleted("specBathroom") && (
                      <DraggableBox
                        id="specBathroom"
                        position={fieldPositions.specBathroom}
                        onPositionChange={updateFieldPosition}
                        label="Bathrooms"
                        zoom={0.85}
                        disabled={lockedSections.specs}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "specBathroom",
                            "Bathrooms",
                            bathroom,
                            "Property Specs",
                            fieldStyles.bathroom,
                          )
                        }
                        deleteTitle="Remove Bathrooms"
                      >
                        <div className="flex items-center gap-0.5 whitespace-nowrap">
                          <StyledInput
                            value={bathroom}
                            onChange={(e) => setBathroom(e.target.value)}
                            inputStyle={{
                              ...fieldStyles["bathroom"],
                              fontFamily:
                                fieldStyles["bathroom"]?.fontFamily ||
                                "ChampagneLimousines, sans-serif",
                              fontSize:
                                fieldStyles["bathroom"]?.fontSize || "16px",
                              fontWeight:
                                fieldStyles["bathroom"]?.fontWeight || "normal",
                              color:
                                fieldStyles["bathroom"]?.color || "#000000",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bathroom", s)
                            }
                            className="font-normal font-champagne text-[16px] text-black w-auto min-w-[1ch] text-right bg-transparent focus:outline-none border-none placeholder-black/70 whitespace-nowrap"
                            placeholder="0"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={bathroomLabel}
                            onChange={(e) => setBathroomLabel(e.target.value)}
                            inputStyle={{
                              ...fieldStyles.bathroomLabel,
                              fontFamily:
                                fieldStyles.bathroomLabel?.fontFamily ||
                                "ChampagneLimousines, sans-serif",
                              fontSize:
                                fieldStyles.bathroomLabel?.fontSize || "16px",
                              fontWeight:
                                fieldStyles.bathroomLabel?.fontWeight ||
                                "normal",
                              color:
                                fieldStyles.bathroomLabel?.color || "#000000",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bathroomLabel", s)
                            }
                            className="text-nowrap font-normal font-champagne text-[16px] text-black uppercase bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="BATHROOM"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    <span className="text-black/60 select-none">|</span>

                    {!isFieldDeleted("specSqft") && (
                      <DraggableBox
                        id="specSqft"
                        position={fieldPositions.specSqft}
                        onPositionChange={updateFieldPosition}
                        label="Sq Ft"
                        zoom={0.85}
                        disabled={lockedSections.specs}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "specSqft",
                            "Sq Ft",
                            sqft,
                            "Property Specs",
                            fieldStyles.sqft,
                          )
                        }
                        deleteTitle="Remove Sq Ft"
                      >
                        <div className="flex items-center gap-0.5 whitespace-nowrap">
                          <StyledInput
                            value={sqft}
                            onChange={(e) => setSqft(e.target.value)}
                            inputStyle={{
                              ...fieldStyles["sqft"],
                              fontFamily:
                                fieldStyles["sqft"]?.fontFamily ||
                                "ChampagneLimousines, sans-serif",
                              fontSize: fieldStyles["sqft"]?.fontSize || "16px",
                              fontWeight:
                                fieldStyles["sqft"]?.fontWeight || "normal",
                              color: fieldStyles["sqft"]?.color || "#000000",
                            }}
                            onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                            className="font-normal font-champagne text-[16px] text-black w-auto min-w-[3ch] text-right bg-transparent focus:outline-none border-none placeholder-black/70 whitespace-nowrap"
                            placeholder="000"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={sqftLabel}
                            onChange={(e) => setSqftLabel(e.target.value)}
                            inputStyle={{
                              ...fieldStyles.sqftLabel,
                              fontFamily:
                                fieldStyles.sqftLabel?.fontFamily ||
                                "ChampagneLimousines, sans-serif",
                              fontSize:
                                fieldStyles.sqftLabel?.fontSize || "16px",
                              fontWeight:
                                fieldStyles.sqftLabel?.fontWeight || "normal",
                              color: fieldStyles.sqftLabel?.color || "#000000",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("sqftLabel", s)
                            }
                            className="text-nowrap font-normal font-champagne text-[16px] text-black uppercase bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="SQ FT"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    <span className="text-black/60 select-none">|</span>

                    {!isFieldDeleted("specBuiltYear") && (
                      <DraggableBox
                        id="specBuiltYear"
                        position={fieldPositions.specBuiltYear}
                        onPositionChange={updateFieldPosition}
                        label="Built Year"
                        zoom={0.85}
                        disabled={lockedSections.specs}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "specBuiltYear",
                            "Built Year",
                            builtYear,
                            "Property Specs",
                            fieldStyles.builtYear,
                          )
                        }
                        deleteTitle="Remove Built Year"
                      >
                        <div className="flex items-center gap-0.5 whitespace-nowrap">
                          <StyledInput
                            value={builtYearLabel}
                            onChange={(e) => setBuiltYearLabel(e.target.value)}
                            inputStyle={{
                              ...fieldStyles.builtYearLabel,
                              fontFamily:
                                fieldStyles.builtYearLabel?.fontFamily ||
                                "ChampagneLimousines, sans-serif",
                              fontSize:
                                fieldStyles.builtYearLabel?.fontSize || "16px",
                              fontWeight:
                                fieldStyles.builtYearLabel?.fontWeight ||
                                "normal",
                              color:
                                fieldStyles.builtYearLabel?.color || "#000000",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("builtYearLabel", s)
                            }
                            className="text-nowrap font-normal font-champagne text-[16px] text-black uppercase bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="BUILT IN"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={builtYear}
                            onChange={(e) => setBuiltYear(e.target.value)}
                            inputStyle={{
                              ...fieldStyles["builtYear"],
                              fontFamily:
                                fieldStyles["builtYear"]?.fontFamily ||
                                "ChampagneLimousines, sans-serif",
                              fontSize:
                                fieldStyles["builtYear"]?.fontSize || "16px",
                              fontWeight:
                                fieldStyles["builtYear"]?.fontWeight ||
                                "normal",
                              color:
                                fieldStyles["builtYear"]?.color || "#000000",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("builtYear", s)
                            }
                            className="font-normal font-champagne text-[16px] text-black w-auto min-w-[4ch] text-left bg-transparent focus:outline-none border-none placeholder-black/70 whitespace-nowrap"
                            placeholder="0000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>

                  {/* 2x2 Photo Grid */}
                  <div className="grid grid-cols-2 gap-2 w-full shrink-0">
                    {renderImageSlot("image3", "w-full h-[150px]", "Image 3")}
                    {renderImageSlot("image4", "w-full h-[150px]", "Image 4")}
                    {renderImageSlot("image5", "w-full h-[150px]", "Image 5")}
                    {renderImageSlot("image6", "w-full h-[150px]", "Image 6")}
                  </div>

                  {/* Contact Box (Fixed height, pinned right above disclaimer in dark blue wave) */}
                  <div
                    data-safezone-container="true"
                    className={`self-end flex flex-col items-end justify-between text-right text-white mt-auto pl-4 pr-2 pt-1 pb-4 shrink-0 relative transition-all duration-150 group/sec rounded-lg min-w-[220px] h-[160px] ${
                      lockedSections.contact
                        ? "ring-2 ring-amber-400/50 bg-amber-500/5"
                        : "hover:ring-2 hover:ring-[#8B3DFF]/50"
                    }`}
                  >
                    {/* Lock Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("contact");
                      }}
                      className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.contact
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600 !opacity-100"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.contact
                          ? "Unlock Contact"
                          : "Lock Contact"
                      }
                    >
                      {lockedSections.contact ? (
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

                    <StyledInput
                      value={contactLabel}
                      onChange={(e) => setContactLabel(e.target.value)}
                      inputStyle={{
                        ...fieldStyles.contactLabel,
                        fontFamily:
                          fieldStyles.contactLabel?.fontFamily ||
                          "Raleway, sans-serif",
                        fontSize:
                          fieldStyles.contactLabel?.fontSize || "16px",
                        fontWeight:
                          fieldStyles.contactLabel?.fontWeight || "normal",
                      }}
                      onChangeStyle={(s) => updateFieldStyle("contactLabel", s)}
                      className="text-[16px] font-raleway font-normal tracking-widest uppercase text-white bg-transparent text-right focus:outline-none border-none whitespace-nowrap leading-none"
                      placeholder="CONTACT:"
                      wrapperClassName="w-auto shrink-0 self-end px-1"
                    />

                    {!isFieldDeleted("contactName") && (
                      <DraggableBox
                        id="contactName"
                        position={fieldPositions.contactName}
                        onPositionChange={updateFieldPosition}
                        label="Agent Name"
                        zoom={0.85}
                        disabled={lockedSections.contact}
                        containerClassName="w-auto self-end shrink-0 px-1 py-0.5"
                        onDelete={() =>
                          removeStandardField(
                            "contactName",
                            "Agent Name",
                            fullName,
                            "Contact Info",
                            fieldStyles.fullName,
                          )
                        }
                        deleteTitle="Remove Agent Name"
                      >
                        <StyledInput
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          inputStyle={{
                            ...fieldStyles["fullName"],
                            fontFamily:
                              fieldStyles["fullName"]?.fontFamily ||
                              "Raleway, sans-serif",
                            fontSize:
                              fieldStyles["fullName"]?.fontSize || "16px",
                            fontWeight:
                              fieldStyles["fullName"]?.fontWeight || "normal",
                          }}
                          onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                          className="font-normal font-raleway text-[16px] h-[22px] bg-transparent text-white text-right focus:outline-none border-none uppercase placeholder-white whitespace-nowrap tracking-wide leading-tight"
                          placeholder="FIRSTNAME LASTNAME"
                        />
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("contactBrokerage") && (
                      <DraggableBox
                        id="contactBrokerage"
                        position={fieldPositions.contactBrokerage}
                        onPositionChange={updateFieldPosition}
                        label="Brokerage"
                        zoom={0.85}
                        disabled={lockedSections.contact}
                        containerClassName="w-auto self-end shrink-0 px-1 py-0.5"
                        onDelete={() =>
                          removeStandardField(
                            "contactBrokerage",
                            "Brokerage",
                            propertyName,
                            "Contact Info",
                            fieldStyles.propertyName,
                          )
                        }
                        deleteTitle="Remove Brokerage"
                      >
                        <StyledInput
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          inputStyle={{
                            ...fieldStyles["propertyName"],
                            fontFamily:
                              fieldStyles["propertyName"]?.fontFamily ||
                              "TrajanProRegular, serif",
                            fontSize:
                              fieldStyles["propertyName"]?.fontSize || "12px",
                            fontWeight:
                              fieldStyles["propertyName"]?.fontWeight ||
                              "normal",
                          }}
                          onChangeStyle={(s) =>
                            updateFieldStyle("propertyName", s)
                          }
                          className="font-normal font-trajan-regular text-[12px] h-[16px] bg-transparent text-white/95 text-right focus:outline-none border-none placeholder-white/80 whitespace-nowrap leading-tight"
                          placeholder="Macdonald Realty"
                        />
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("contactPhone") && (
                      <DraggableBox
                        id="contactPhone"
                        position={fieldPositions.contactPhone}
                        onPositionChange={updateFieldPosition}
                        label="Phone"
                        zoom={0.85}
                        disabled={lockedSections.contact}
                        containerClassName="w-auto self-end shrink-0 px-1 py-0.5"
                        onDelete={() =>
                          removeStandardField(
                            "contactPhone",
                            "Phone",
                            number,
                            "Contact Info",
                            fieldStyles.number,
                          )
                        }
                        deleteTitle="Remove Phone"
                      >
                        <div className="flex items-center justify-end gap-1 text-[12px] text-white whitespace-nowrap leading-tight">
                          <StyledInput
                            value={phoneLabel}
                            onChange={(e) => setPhoneLabel(e.target.value)}
                            inputStyle={{
                              ...fieldStyles.phoneLabel,
                              fontFamily:
                                fieldStyles.phoneLabel?.fontFamily ||
                                "TrajanProRegular, serif",
                              fontSize:
                                fieldStyles.phoneLabel?.fontSize || "12px",
                              fontWeight:
                                fieldStyles.phoneLabel?.fontWeight || "500",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("phoneLabel", s)
                            }
                            className="font-medium font-trajan-regular text-[12px] text-white bg-transparent text-right focus:outline-none border-none whitespace-nowrap"
                            placeholder="Phone:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            inputStyle={{
                              ...fieldStyles["number"],
                              fontFamily:
                                fieldStyles["number"]?.fontFamily ||
                                "TrajanProRegular, serif",
                              fontSize:
                                fieldStyles["number"]?.fontSize || "12px",
                              fontWeight:
                                fieldStyles["number"]?.fontWeight || "normal",
                            }}
                            onChangeStyle={(s) => updateFieldStyle("number", s)}
                            className="font-normal font-trajan-regular text-[12px] h-[16px] w-auto min-w-[110px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white whitespace-nowrap"
                            placeholder="604.000.0000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("contactEmail") && (
                      <DraggableBox
                        id="contactEmail"
                        position={fieldPositions.contactEmail}
                        onPositionChange={updateFieldPosition}
                        label="Email"
                        zoom={0.85}
                        disabled={lockedSections.contact}
                        containerClassName="w-auto self-end shrink-0 px-1 py-0.5"
                        onDelete={() =>
                          removeStandardField(
                            "contactEmail",
                            "Email",
                            email,
                            "Contact Info",
                            fieldStyles.email,
                          )
                        }
                        deleteTitle="Remove Email"
                      >
                        <div className="flex items-center justify-end gap-1 text-[12px] text-white whitespace-nowrap leading-tight">
                          <StyledInput
                            value={emailLabel}
                            onChange={(e) => setEmailLabel(e.target.value)}
                            inputStyle={{
                              ...fieldStyles.emailLabel,
                              fontFamily:
                                fieldStyles.emailLabel?.fontFamily ||
                                "TrajanProRegular, serif",
                              fontSize:
                                fieldStyles.emailLabel?.fontSize || "12px",
                              fontWeight:
                                fieldStyles.emailLabel?.fontWeight || "500",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("emailLabel", s)
                            }
                            className="font-medium font-trajan-regular text-[12px] text-white bg-transparent text-right focus:outline-none border-none whitespace-nowrap"
                            placeholder="Email:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputStyle={{
                              ...fieldStyles["email"],
                              fontFamily:
                                fieldStyles["email"]?.fontFamily ||
                                "TrajanProRegular, serif",
                              fontSize:
                                fieldStyles["email"]?.fontSize || "12px",
                              fontWeight:
                                fieldStyles["email"]?.fontWeight || "normal",
                            }}
                            onChangeStyle={(s) => updateFieldStyle("email", s)}
                            className="font-normal font-trajan-regular text-[12px] h-[16px] w-auto min-w-[170px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white/80 whitespace-nowrap"
                            placeholder="agent@example.com"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("contactMls") && (
                      <DraggableBox
                        id="contactMls"
                        position={fieldPositions.contactMls}
                        onPositionChange={updateFieldPosition}
                        label="MLS #"
                        zoom={0.85}
                        disabled={lockedSections.contact}
                        containerClassName="w-auto self-end shrink-0 px-1 py-0.5"
                        onDelete={() =>
                          removeStandardField(
                            "contactMls",
                            "MLS #",
                            mlsNumber,
                            "Contact Info",
                            fieldStyles.mlsNumber,
                          )
                        }
                        deleteTitle="Remove MLS #"
                      >
                        <div className="flex items-center justify-end gap-1 text-[12px] text-white whitespace-nowrap leading-tight">
                          <StyledInput
                            value={mlsLabel}
                            onChange={(e) => setMlsLabel(e.target.value)}
                            inputStyle={{
                              ...fieldStyles.mlsLabel,
                              fontFamily:
                                fieldStyles.mlsLabel?.fontFamily ||
                                "TrajanProRegular, serif",
                              fontSize:
                                fieldStyles.mlsLabel?.fontSize || "12px",
                              fontWeight:
                                fieldStyles.mlsLabel?.fontWeight || "500",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsLabel", s)
                            }
                            className="font-medium font-trajan-regular text-[12px] text-white bg-transparent text-right focus:outline-none border-none whitespace-nowrap"
                            placeholder="MLS #"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={mlsNumber}
                            onChange={(e) => setMlsNumber(e.target.value)}
                            inputStyle={{
                              ...fieldStyles["mlsNumber"],
                              fontFamily:
                                fieldStyles["mlsNumber"]?.fontFamily ||
                                "TrajanProRegular, serif",
                              fontSize:
                                fieldStyles["mlsNumber"]?.fontSize || "12px",
                              fontWeight:
                                fieldStyles["mlsNumber"]?.fontWeight || "normal",
                            }}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsNumber", s)
                            }
                            className="font-normal font-trajan-regular text-[12px] h-[16px] w-auto min-w-[80px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white whitespace-nowrap"
                            placeholder="00000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Disclaimer Bar (Bottom-most, Fixed 8px, Non-editable) ── */}
              <div className="w-full shrink-0 pt-1 border-t border-white/20">
                <div className="flex items-center gap-2 text-white/90 select-none">
                  <House className="w-3.5 h-3.5 text-white shrink-0" />
                  <p
                    style={{ fontSize: "8px", lineHeight: "1.25" }}
                    className="flex-1 text-white/90 m-0 p-0 select-none"
                  >
                    {disclaimerText ||
                      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless."}
                  </p>
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>

        {/* ── PAGE 2 DIVIDER ─────────────────────────────────────────────── */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 2
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* ── PAGE 2 OUTER BLEED WRAPPER ──────────────────────────────────── */}
        <div
          data-image-slot="true"
          className="pdf-page bg-white shadow-xl relative overflow-hidden flex flex-col font-sans group/page2 cursor-pointer"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
          onClick={(e) => {
            if (e.altKey) return;
            setActiveSlot("image8");
            if (!images.image8) {
              openImageSourceModal("image8", e);
            }
          }}
          onMouseEnter={() => setHoveredSlot("image8")}
          onMouseLeave={() => setHoveredSlot(null)}
        >
          {/* Background Image (under background SVG) */}
          <div
            className="absolute inset-0 w-full h-full z-10"
            data-background="true"
          >
            {renderImageSlot(
              "image8",
              "w-full h-full",
              "Select Background Image (Image 8)",
              false,
              "below-top-svg",
            )}
          </div>

          {/* Background SVG graphics (Top & Bottom) spanning full bleed */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-20 flex flex-col justify-between"
            data-background="true"
            data-decorative="true"
          >
            {/* Top SVG */}
            <svg
              viewBox="0 0 1291 548"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
              preserveAspectRatio="none"
            >
              <mask
                id="mask0_16_581_top"
                style={{ maskType: "luminance" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="1291"
                height="548"
              >
                <path d="M0 0H1291V548H0V0Z" fill="white" />
              </mask>
              <g mask="url(#mask0_16_581_top)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1309 1471.02C85.232 1603.33 0.952255 1163.48 0.952255 1163.48L4.87283 1595L1307.83 1566.69L1309 1471.02ZM-7 185.26C1213.91 23.5255 1300.77 582.619 1300.77 582.619L1305.83 61L-6.55659 89.8818L-7 185.26Z"
                  fill="#B3B394"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1304 1526.79C77.7255 1642.12 -6.33974 1163.64 -6.33974 1163.64L-8 1653H1304V1526.79ZM-6.33974 127.638C1219.92 -13.8149 1304 567.77 1304 567.77V0H-8L-6.33974 127.638Z"
                  fill="#184260"
                />
              </g>
            </svg>

            {/* Bottom SVG */}
            <svg
              viewBox="0 0 1293 553"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
              preserveAspectRatio="none"
            >
              <mask
                id="mask0_16_581_bottom"
                style={{ maskType: "luminance" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="1294"
                height="553"
              >
                <path
                  d="M1290.99 552.733L-8.70824e-05 547.996L2.01045 0.000115885L1293 4.73662L1290.99 552.733Z"
                  fill="white"
                />
              </mask>
              <g mask="url(#mask0_16_581_bottom)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M-12.6031 -923.079C1211.64 -1050.9 1294.31 -610.742 1294.31 -610.742L1291.97 -1042.27L-11.0829 -1018.74L-12.6031 -923.079ZM1298.67 367.5C77.1799 524.754 -7.62802 -34.6547 -7.62802 -34.6547L-14.6014 486.942L1297.88 462.876L1298.67 367.5Z"
                  fill="#B3B394"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M-7.39862 -978.83C1219.29 -1089.66 1301.6 -610.874 1301.6 -610.874L1305.06 -1100.23L-6.93557 -1105.04L-7.39862 -978.83ZM1297.8 425.119C71.0238 562.072 -10.9171 -19.817 -10.9171 -19.817L-13.0002 547.949L1298.99 552.762L1297.8 425.119Z"
                  fill="#184260"
                />
              </g>
            </svg>
          </div>

          {/* SafeZoneWrapper for Page 2 Content */}
          <SafeZoneWrapper
            showBleed={showBleed}
            showGuide={showGuide}
            className="pointer-events-none absolute inset-0 z-30"
          >
            <div
              data-safezone-container="true"
              className="relative w-full h-full flex flex-col justify-between p-6 pointer-events-none"
            >
              <div className="pt-2 pointer-events-auto" />

              {/* Page 2 space filler */}
              <div className="my-auto w-full flex-1 pointer-events-none" />

              {/* Bottom Page 2 Footer Banner */}
              <div className="absolute bottom-2 left-0 w-full text-center text-white text-[11px] font-semibold tracking-wider pointer-events-auto">
                DESIGNED AND PRINTED BY BC FLOOR PLANS
              </div>
            </div>
          </SafeZoneWrapper>

          {/* ── Page 2 Floating Action Controls for image8 (Z-40: Always Above Decorative SVGs) ── */}
          {images.image8 && (
            <>
              {/* Top-Right Controls Toolbar: Zoom, Rotate, Edit, Delete */}
              <div
                data-html2canvas-ignore="true"
                data-image-slot="true"
                className={`absolute top-5 right-5 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-gray-200/80 transition-all duration-150 ${
                  isSlotActive("image8")
                    ? "opacity-100 pointer-events-auto scale-100"
                    : "opacity-0 pointer-events-none group-hover/page2:opacity-100 group-hover/page2:pointer-events-auto hover:opacity-100 hover:pointer-events-auto scale-95 hover:scale-100"
                }`}
              >
                {/* Zoom In */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoom("image8", "in");
                  }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                </button>

                {/* Zoom Out */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoom("image8", "out");
                  }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-gray-700" />
                </button>

                <div className="w-[1px] h-4 bg-gray-200 mx-0.5" />

                {/* Rotate */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate("image8");
                  }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition-colors print:hidden"
                  title="Rotate image"
                >
                  <RotateCw className="w-3.5 h-3.5 text-gray-700" />
                </button>

                {/* Edit / Change Image */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageSourceModal("image8", e);
                  }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
                  title="Edit image"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-700" />
                </button>

                {/* Delete Image */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete("image8", fileInputRef8);
                  }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
                  title="Delete image"
                >
                  <Trash className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>

              {/* Bottom-Left Zoom Controls Pill */}
              <div
                data-html2canvas-ignore="true"
                data-image-slot="true"
                className={`absolute bottom-6 left-6 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-gray-200/80 transition-all duration-150 ${
                  isSlotActive("image8")
                    ? "opacity-100 pointer-events-auto scale-100"
                    : "opacity-0 pointer-events-none group-hover/page2:opacity-100 group-hover/page2:pointer-events-auto hover:opacity-100 hover:pointer-events-auto scale-95 hover:scale-100"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoom("image8", "in");
                  }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoom("image8", "out");
                  }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-gray-700" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
);

BcfpStandard21.displayName = "BcfpStandard21";

export default BcfpStandard21;
