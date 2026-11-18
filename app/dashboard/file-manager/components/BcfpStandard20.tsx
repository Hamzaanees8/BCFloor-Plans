import {
  Pencil,
  Trash,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock,
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
import StyledInput, { FontFolderProvider } from "./StyledInput";
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
import { BackgroundSVG } from "./BackgroundSVG";

export interface BcfpStandard20Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard20Props {
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


const BcfpStandard20 = forwardRef<BcfpStandard20Ref, BcfpStandard20Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
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
      setDeletedStandardFieldIds((prevStandard) => {
        if (prevStandard.includes(id)) return prevStandard;
        const newDeletedStandard = [...prevStandard, id];
        const deletedItem: DeletedDetailFieldItem = {
          id,
          title,
          value: value || "",
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

    // ── 2. Text Fields ────────────────────────────────────────────────────────
    const [suite, setSuite] = useState("");
    const [mlsNumber, setMlsNumber] = useState("");
    const [byLawRestrictions, setByLawRestrictions] = useState("");
    const [maintFees, setMaintFees] = useState("");
    const [maintFeesInclude, setMaintFeesInclude] = useState("");
    const [featuresIncluded, setFeaturesIncluded] = useState("");
    const [siteInfluences, setSiteInfluences] = useState("");
    const [amenities, setAmenities] = useState("");
    const [view, setView] = useState("");
    const [description, setDescription] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [amount, setAmount] = useState("");
    const [number, setNumber] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");

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
      // Row 1: Address Fields (Trajan Pro, 24px, thin 100)
      roadName: {
        fontSize: "24px",
        fontWeight: "100",
        fontFamily: "TrajanProRegular, serif",
        textAlign: "center",
        color: "#ffffff",
      },
      suite: {
        fontSize: "24px",
        fontWeight: "100",
        fontFamily: "TrajanProRegular, serif",
        textAlign: "center",
        color: "#ffffff",
      },
      addressCode: {
        fontSize: "24px",
        fontWeight: "100",
        fontFamily: "TrajanProRegular, serif",
        textAlign: "left",
        color: "#ffffff",
      },
      mlsNumber: {
        fontSize: "24px",
        fontWeight: "100",
        fontFamily: "TrajanProRegular, serif",
        textAlign: "left",
        color: "#ffffff",
      },
      roadLabelBefore: {
        fontSize: "24px",
        fontWeight: "100",
        fontFamily: "TrajanProRegular, serif",
        textAlign: "right",
        color: "#ffffff",
      },
      roadLabelAfter: {
        fontSize: "24px",
        fontWeight: "100",
        fontFamily: "TrajanProRegular, serif",
        textAlign: "left",
        color: "#ffffff",
      },

      // Row 2: City Line & Header Price (Caslon Pro Regular, 18px, thin 100)
      cityLine: {
        fontSize: "18px",
        fontWeight: "100",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "left",
        color: "#ffffff",
      },
      headerAmount: {
        fontSize: "18px",
        fontWeight: "100",
        fontFamily: "ACaslonProRegular, serif",
        textAlign: "right",
        color: "#ffffff",
      },

      // Specs Row: 14px, Trajan Pro, normal weight (400)
      bedroom: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
      },
      bedroomLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
      },
      bathroom: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
      },
      bathroomLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
      },
      sqft: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
      },
      sqftLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
      },
      builtYear: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
      },
      builtYearLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
      },

      // Description: 12px, Caslon Pro Regular, weight normal (400), italic
      description: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "ACaslonProRegular, serif",
        fontStyle: "italic",
        color: "#000000",
        textAlign: "left",
      },

      // Extra Details Title Fields: 14px, Trajan Pro, normal (400)
      byLawLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      maintFeesLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      maintFeesIncludeLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      featuresIncludedLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      siteInfluencesLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      amenitiesLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      viewLabel: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },

      // Extra Details Value Fields: 12px, Trajan Pro, normal (400), text-left
      byLawRestrictions: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      maintFees: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      maintFeesInclude: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      featuresIncluded: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      siteInfluences: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      amenities: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      view: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },

      // Contact & Price Section (All Trajan Pro)
      // Contact & Name: 16px, Trajan Pro, normal (400)
      contactLabel: {
        fontSize: "16px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      fullName: {
        fontSize: "16px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      contactName: {
        fontSize: "16px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      // Price: 32px, Trajan Pro, medium (500)
      amount: {
        fontSize: "32px",
        fontWeight: "500",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "right",
      },
      priceAmount: {
        fontSize: "32px",
        fontWeight: "500",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "right",
      },
      // Phone & Email labels: 14px, Trajan Pro, medium (500)
      phoneLabel: {
        fontSize: "14px",
        fontWeight: "500",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      emailLabel: {
        fontSize: "14px",
        fontWeight: "500",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      // Other contact fields: 14px, Trajan Pro, normal (400)
      propertyName: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      contactBrokerage: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      number: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      contactPhone: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      email: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
      },
      contactEmail: {
        fontSize: "14px",
        fontWeight: "400",
        fontFamily: "TrajanProRegular, serif",
        color: "#000000",
        textAlign: "left",
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
      specs: false,
      description: false,
      details: false,
      contact: false,
    });

    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 6. Images State ───────────────────────────────────────────────────────
    const [images, setImages] = useState<Record<string, string | null>>(() => {
      const defaultAgentLogo =
        (formData as any)?.images?.image8 ||
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
      const initialImages = {
        image1: null,
        image2: null,
        image3: null,
        image4: null,
        image5: null,
        image6: null,
        image7: null,
        image8: defaultAgentLogo as string | null,
        ...((formData as any)?.images || {}),
      };
      if (!initialImages.image8 && defaultAgentLogo) {
        initialImages.image8 = defaultAgentLogo;
      }
      return initialImages;
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
    const [processingSlots, setProcessingSlots] = useState<Record<string, boolean>>({});
    const [deletedImageSlots, setDeletedImageSlots] = useState<string[]>([]);
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
        const step = 0.03; // Smooth 3% zoom step
        const current = prev[key] ?? 1;
        const newScale = direction === "in" ? current + step : current - step;
        const rounded = Math.round(newScale * 1000) / 1000;
        const bounded = Math.min(Math.max(rounded, 0.1), 5);
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
        setDeletedImageSlots((prev) => prev.filter((s) => s !== currentImageSlot));
        setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      }
      setShowGallery(false);
      setCurrentImageSlot(null);
    };


    // ── 11. Initial Order Data Sync & Context Restoration ──────────────────────
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

          // Suite -> suite & roadName (if suite is null, empty or zero, leave as "" to show "0" via placeholder)
          if (!suiteVal || suiteVal === "0") {
            setSuite("");
            setRoadName("");
          } else {
            setSuite(suiteVal);
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
              image8: prev.image8 || agentLogo,
            }));
          }
        }
      }
    }, [orderData]);

    // Auto-fetch agent company logo into image8 if available
    useEffect(() => {
      if (!orderData) return;
      const agent = orderData.agent;
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
          image8: prev.image8 || agentLogo,
        }));
      }
    }, [orderData]);

    // ── 12. Context Sync ──────────────────────────────────────────────────────
    useEffect(() => {
      updateFormData({
        deletedStandardFieldIds,
        deletedDetailFields,
        byLawRestrictions,
        maintenanceFees: maintFees,
        maintenanceFeesInclude: maintFeesInclude,
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
        suite,
        mlsNumber,
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
      maintFees,
      maintFeesInclude,
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
      suite,
      mlsNumber,
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
          templateKey: "BCFPStandard20",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#000000",
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
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "14px",
            },
          },
          companyName: {
            value: propertyName,
            style: {
              ...fieldStyles.propertyName,
              fontSize: fieldStyles.propertyName?.fontSize || "14px",
            },
          },
          propertyNotesTitle: {
            value: suite || roadName,
            style: {
              ...fieldStyles.suite,
              fontSize: fieldStyles.suite?.fontSize || "24px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "12px",
            },
          },
          expandedDetail1Title: {
            value: byLawLabel,
            style: {
              ...fieldStyles.byLawLabel,
              fontSize: fieldStyles.byLawLabel?.fontSize || "14px",
            },
          },
          expandedDetail1Description: {
            value: byLawRestrictions,
            style: {
              ...fieldStyles.byLawRestrictions,
              fontSize: fieldStyles.byLawRestrictions?.fontSize || "12px",
            },
          },
          expandedDetail2Title: {
            value: maintFeesLabel,
            style: {
              ...fieldStyles.maintFeesLabel,
              fontSize: fieldStyles.maintFeesLabel?.fontSize || "14px",
            },
          },
          expandedDetail2Description: {
            value: maintFees,
            style: {
              ...fieldStyles.maintFees,
              fontSize: fieldStyles.maintFees?.fontSize || "12px",
            },
          },
          expandedDetail3Title: {
            value: maintFeesIncludeLabel,
            style: {
              ...fieldStyles.maintFeesIncludeLabel,
              fontSize: fieldStyles.maintFeesIncludeLabel?.fontSize || "14px",
            },
          },
          expandedDetail3Description: {
            value: maintFeesInclude,
            style: {
              ...fieldStyles.maintFeesInclude,
              fontSize: fieldStyles.maintFeesInclude?.fontSize || "12px",
            },
          },
          expandedDetail4Title: {
            value: featuresIncludedLabel,
            style: {
              ...fieldStyles.featuresIncludedLabel,
              fontSize: fieldStyles.featuresIncludedLabel?.fontSize || "14px",
            },
          },
          expandedDetail4Description: {
            value: featuresIncluded,
            style: {
              ...fieldStyles.featuresIncluded,
              fontSize: fieldStyles.featuresIncluded?.fontSize || "12px",
            },
          },
          keyHighlightLabel: {
            value: siteInfluencesLabel,
            style: {
              ...fieldStyles.siteInfluencesLabel,
              fontSize: fieldStyles.siteInfluencesLabel?.fontSize || "14px",
            },
          },
          keyHighlights: siteInfluences
            ? siteInfluences.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            amenities,
            view,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            addressCode,
            cityLine,
            suite,
            mlsNumber,
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
            disclaimerText,
            _deletedDetailFields: deletedDetailFields,
            _deletedStandardFieldIds: deletedStandardFieldIds,
            deletedStandardFieldIds,
            deletedDetailFields,
            fieldStyles,
            fieldPositions,
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
        if (state.propertyNotesTitle && state.propertyNotesTitle !== "0") {
          setRoadName(state.propertyNotesTitle as string);
          setSuite(state.propertyNotesTitle as string);
        }
        if (state.propertyNotesDescription)
          setDescription(state.propertyNotesDescription as string);
        if (state.expandedDetail1Description)
          setByLawRestrictions(state.expandedDetail1Description as string);
        if (state.expandedDetail2Description)
          setMaintFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description)
          setMaintFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description)
          setFeaturesIncluded(state.expandedDetail4Description as string);
        if (state.keyHighlights)
          setSiteInfluences(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
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
          if (details.cityLine) setCityLine(details.cityLine as string);
          if (details.suite !== undefined && details.suite !== "0") {
            setSuite(details.suite as string);
            setRoadName(details.suite as string);
          }
          if (details.roadName !== undefined && details.roadName !== "0") {
            setRoadName(details.roadName as string);
            setSuite(details.roadName as string);
          }
          if (details.mlsNumber !== undefined) {
            setMlsNumber(details.mlsNumber as string);
            setAddressCode(details.mlsNumber as string);
          }

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
          if (details.disclaimerText)
            setDisclaimerText(details.disclaimerText as string);
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
                image8:
                  (state.images as any).image8 ||
                  prev.image8 ||
                  defaultAgentLogo,
              },
              sProcessing,
              sDeleted,
            ),
          );
        } else if (defaultAgentLogo) {
          setImages((prev) => ({
            ...prev,
            image8: prev.image8 || defaultAgentLogo,
          }));
        }
        if (state.imageScales)
          setScale((prev) => ({ ...prev, ...(state.imageScales as any) }));
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
        const c = (payload?.content as Record<string, any>) || {};
        const od = (c.otherDetails as Record<string, any>) || {};

        const incomingPositions =
          (od.fieldPositions as Record<string, { x: number; y: number }>) ||
          (c.fieldPositions as Record<string, { x: number; y: number }>) ||
          (state.fieldPositions as Record<string, { x: number; y: number }>) ||
          (payload.fieldPositions as Record<string, { x: number; y: number }>);
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

        if (!incomingStyles.fullName && helperSt(state.realtorName)) {
          incomingStyles.fullName = helperSt(state.realtorName)!;
        }
        if (!incomingStyles.propertyName && helperSt(state.companyName)) {
          incomingStyles.propertyName = helperSt(state.companyName)!;
        }
        if (!incomingStyles.email && helperSt(state.emailLink)) {
          incomingStyles.email = helperSt(state.emailLink)!;
        }
        if (!incomingStyles.amount && helperSt(state.offeredAtPrice)) {
          incomingStyles.amount = helperSt(state.offeredAtPrice)!;
        }
        if (!incomingStyles.suite && helperSt(state.propertyNotesTitle)) {
          incomingStyles.suite = helperSt(state.propertyNotesTitle)!;
          if (!incomingStyles.roadName) incomingStyles.roadName = incomingStyles.suite;
        }
        if (!incomingStyles.description && helperSt(state.propertyNotesDescription)) {
          incomingStyles.description = helperSt(state.propertyNotesDescription)!;
        }
        if (!incomingStyles.byLawRestrictions && helperSt(state.expandedDetail1Description)) {
          incomingStyles.byLawRestrictions = helperSt(state.expandedDetail1Description)!;
        }
        if (!incomingStyles.maintFees && helperSt(state.expandedDetail2Description)) {
          incomingStyles.maintFees = helperSt(state.expandedDetail2Description)!;
        }
        if (!incomingStyles.maintFeesInclude && helperSt(state.expandedDetail3Description)) {
          incomingStyles.maintFeesInclude = helperSt(state.expandedDetail3Description)!;
        }
        if (!incomingStyles.featuresIncluded && helperSt(state.expandedDetail4Description)) {
          incomingStyles.featuresIncluded = helperSt(state.expandedDetail4Description)!;
        }

        // Only fix legacy 20px defaults if that leaked from backend template creation:
        if (incomingStyles.fullName?.fontSize === "20px") {
          incomingStyles.fullName = { ...incomingStyles.fullName, fontSize: "16px", fontFamily: incomingStyles.fullName.fontFamily || "TrajanProRegular, serif" };
        }
        if (incomingStyles.propertyName?.fontSize === "20px") {
          incomingStyles.propertyName = { ...incomingStyles.propertyName, fontSize: "14px", fontFamily: incomingStyles.propertyName.fontFamily || "TrajanProRegular, serif" };
        }
        if (incomingStyles.number?.fontSize === "20px") {
          incomingStyles.number = { ...incomingStyles.number, fontSize: "14px", fontFamily: incomingStyles.number.fontFamily || "TrajanProRegular, serif" };
        }
        if (incomingStyles.email?.fontSize === "20px") {
          incomingStyles.email = { ...incomingStyles.email, fontSize: "14px", fontFamily: incomingStyles.email.fontFamily || "TrajanProRegular, serif" };
        }

        if (Object.keys(incomingStyles).length > 0) {
          setFieldStyles((prev) => ({
            ...prev,
            ...incomingStyles,
          }));
        }

        const rawOtherDetails =
          (payload.content?.otherDetails as Record<string, any>) || {};

        const restoredDeletedDetail = (
          rawOtherDetails._deletedDetailFields &&
          Array.isArray(rawOtherDetails._deletedDetailFields)
            ? rawOtherDetails._deletedDetailFields
            : rawOtherDetails.deletedDetailFields &&
              Array.isArray(rawOtherDetails.deletedDetailFields)
            ? rawOtherDetails.deletedDetailFields
            : (state as any).deletedDetailFields &&
              Array.isArray((state as any).deletedDetailFields)
            ? (state as any).deletedDetailFields
            : []
        ) as any[];

        const restoredDeletedStandard = (
          rawOtherDetails._deletedStandardFieldIds &&
          Array.isArray(rawOtherDetails._deletedStandardFieldIds)
            ? rawOtherDetails._deletedStandardFieldIds
            : rawOtherDetails.deletedStandardFieldIds &&
              Array.isArray(rawOtherDetails.deletedStandardFieldIds)
            ? rawOtherDetails.deletedStandardFieldIds
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
    ) => {
      const inputRef = getFileInputRef(key);
      const hasImage = !!images[key];

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
            isLogoSlot
              ? hasImage
                ? "bg-transparent"
                : "border border-dashed border-gray-400 bg-white/10"
              : hasImage
                ? "bg-transparent"
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

          <div
            className="w-full h-full relative overflow-hidden flex items-center justify-center"
            onMouseMove={(e) => handleMouseMove(key, e)}
            onMouseUp={() => handleMouseUp(key)}
            onMouseLeave={() => handleMouseLeave(key)}
          >
            {hasImage ? (
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
                <div className="absolute bottom-1.5 left-1.5 flex gap-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                {/* Rotate */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate(key);
                  }}
                  className="absolute top-2 right-[68px] z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                  title="Rotate image"
                >
                  <RotateCw className="w-3.5 h-3.5 text-gray-700" />
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={(e) => openImageSourceModal(key, e)}
                  className="absolute top-2 right-9 z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                  className="absolute top-2 right-2 z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-3.5 h-3.5 text-red-500" />
                </button>
              </>
            ) : (
              <div
                data-html2canvas-ignore="true"
                onClick={(e) => openImageSourceModal(key, e)}
                className={`w-full h-full flex items-center justify-center cursor-pointer p-2 text-center text-xs font-medium transition-colors ${
                  isLogoSlot
                    ? "text-gray-300 hover:bg-white/20"
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

    // ── 15. Header Layout with Negative Bleed Margin ──────────────────────────
    const headerBleedStyle: React.CSSProperties = {
      marginLeft: showBleed ? "-0.375in" : "-0.25in",
      marginRight: showBleed ? "-0.375in" : "-0.25in",
      marginTop: showBleed ? "-0.375in" : "-0.25in",
      width: showBleed ? "calc(100% + 0.75in)" : "calc(100% + 0.5in)",
      paddingLeft: showBleed ? "calc(10px + 0.375in)" : "calc(10px + 0.25in)",
      paddingRight: showBleed ? "calc(10px + 0.375in)" : "calc(10px + 0.25in)",
      paddingTop: showBleed ? "calc(0.25in + 0.375in)" : "0.5in",
      paddingBottom: "15px",
      minHeight: showBleed ? "calc(120px + 0.375in)" : "calc(120px + 0.25in)",
    };

    const renderHeader = () => (
      <div
        style={headerBleedStyle}
        className="bg-black/80 shadow-sm relative flex items-center justify-between gap-[20px] border-y-[3px] border-white"
      >
        {/* Left Side: Address & Price Dragbox Section */}
        <div
          data-safezone-container="true"
          data-drag-container="true"
          className={`relative z-10 flex flex-col justify-center gap-2 w-[65%] min-w-0 p-1.5 rounded-md border border-transparent transition-all duration-150 group/sec ${
            lockedSections.header
              ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
              : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
          }`}
        >
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={(e) => {
              e.stopPropagation();
              toggleSectionLock("header");
            }}
            className={`absolute -top-3 right-0 z-40 p-1 rounded-md transition-all duration-150
              shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
              opacity-0 group-hover/sec:opacity-100 ${
                lockedSections.header
                  ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                  : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
              }`}
            title={
              lockedSections.header
                ? "Unlock Header Section (enable dragging)"
                : "Lock Header Section (disable dragging)"
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

          {/* Top Line */}
          <div className="flex items-center gap-2 font-thin text-[24px] text-[#ffffff] leading-none whitespace-nowrap flex-nowrap shrink-0">
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
                    fieldStyles.mlsNumber,
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
                  inputStyle={fieldStyles.addressCode || fieldStyles.mlsNumber}
                  onChangeStyle={(s) => {
                    updateFieldStyle("mlsNumber", s);
                    updateFieldStyle("addressCode", s);
                  }}
                  className="w-auto bg-transparent text-[#ffffff] font-trajan-regular font-thin text-[24px] focus:outline-none placeholder-gray-400 placeholder:font-thin whitespace-nowrap border-none"
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
                disabled={lockedSections.header}
                containerClassName="w-auto inline-flex items-center shrink-0"
                className="w-auto inline-flex items-center"
                onDelete={() =>
                  removeStandardField(
                    "roadName",
                    "Suite #",
                    suite || roadName,
                    "Header",
                    fieldStyles.suite || fieldStyles.roadName,
                  )
                }
                deleteTitle="Remove Suite #"
              >
                <StyledInput
                  fieldId="roadName"
                  fieldLabel="Suite #"
                  value={suite || roadName}
                  onChange={(e) => {
                    setSuite(e.target.value);
                    setRoadName(e.target.value);
                  }}
                  inputStyle={fieldStyles.suite || fieldStyles.roadName}
                  onChangeStyle={(s) => {
                    updateFieldStyle("suite", s);
                    updateFieldStyle("roadName", s);
                  }}
                  className="w-auto min-w-[1ch] text-center bg-transparent text-[#ffffff] font-trajan-regular font-thin text-[24px] focus:outline-none placeholder-gray-400 placeholder:font-thin whitespace-nowrap border-none"
                  placeholder="0"
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
                  className="bg-transparent text-[#ffffff] font-trajan-regular font-thin text-[24px] focus:outline-none border-none placeholder-gray-400 placeholder:font-thin whitespace-nowrap"
                  placeholder="Number"
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
                  className="bg-transparent text-[#ffffff] font-trajan-regular font-thin text-[24px] focus:outline-none border-none placeholder-gray-400 placeholder:font-thin whitespace-nowrap"
                  placeholder="Road"
                  wrapperClassName="w-auto shrink-0"
                />
              </DraggableBox>
            )}
          </div>

          {/* Bottom Line */}
          <div className="flex items-center justify-between pr-4 mt-2 whitespace-nowrap">
            {!isFieldDeleted("cityLine") && (
              <DraggableBox
                id="cityLine"
                position={fieldPositions.cityLine}
                onPositionChange={updateFieldPosition}
                label="City / Subtitle"
                zoom={0.85}
                disabled={lockedSections.header}
                containerClassName="w-auto inline-flex items-center shrink-0"
                className="w-auto inline-flex items-center"
                onDelete={() =>
                  removeStandardField(
                    "cityLine",
                    "City / Subtitle",
                    cityLine,
                    "Header",
                    fieldStyles.cityLine,
                  )
                }
                deleteTitle="Remove City / Subtitle"
              >
                <StyledInput
                  fieldId="cityLine"
                  fieldLabel="City / Subtitle"
                  value={cityLine}
                  onChange={(e) => setCityLine(e.target.value)}
                  inputStyle={fieldStyles.cityLine}
                  onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                  className="w-auto bg-transparent text-[#ffffff] font-caslon-regular font-thin text-[18px] tracking-widest uppercase focus:outline-none placeholder-gray-400 placeholder:font-thin whitespace-nowrap border-none"
                  placeholder="BRIGHOUSE SOUTH, RICHMOND"
                  wrapperClassName="w-auto shrink-0"
                />
              </DraggableBox>
            )}

            {!isFieldDeleted("headerAmount") && (
              <DraggableBox
                id="headerAmount"
                position={fieldPositions.headerAmount}
                onPositionChange={updateFieldPosition}
                label="Header Price"
                zoom={0.85}
                disabled={lockedSections.header}
                containerClassName="w-auto inline-flex items-center shrink-0"
                className="w-auto inline-flex items-center"
                onDelete={() =>
                  removeStandardField(
                    "headerAmount",
                    "Header Price",
                    amount,
                    "Header",
                    fieldStyles.headerAmount || fieldStyles.amount,
                  )
                }
                deleteTitle="Remove Header Price"
              >
                <StyledInput
                  fieldId="headerAmount"
                  fieldLabel="Header Price"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputStyle={fieldStyles.headerAmount || fieldStyles.amount}
                  onChangeStyle={(s) => {
                    updateFieldStyle("headerAmount", s);
                    updateFieldStyle("amount", s);
                  }}
                  className="w-auto bg-transparent text-[#ffffff] font-caslon-regular font-thin text-[18px] text-right focus:outline-none placeholder-gray-400 placeholder:font-thin whitespace-nowrap border-none"
                  placeholder="$000,000"
                  wrapperClassName="w-auto shrink-0"
                />
              </DraggableBox>
            )}
          </div>
        </div>

        {/* Right Side: Logo Slot */}
        <div className="relative z-10 w-[35%] h-[80px] flex items-center justify-center">
          {renderImageSlot("image8", "w-full h-full", "Logo Image", true)}
        </div>
      </div>
    );

    return (
      <FontFolderProvider value="BcfpStandard20">
        <div className="flex flex-col items-center justify-center font-serif">
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

        {/* ── Page 1 Divider ─────────────────────────────────────────────── */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* ── Page 1 Outer Container ─────────────────────────────────────── */}
        <div
          className="pdf-page bg-[#fbfbfb] shadow-xl relative overflow-hidden flex flex-col font-serif"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          {/* Full-bleed background layer */}
          <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
            <BackgroundSVG />
          </div>

          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div
              data-safezone-container="true"
              className="relative w-full h-full flex flex-col z-10"
            >
              {renderHeader()}

              <div className="flex w-full px-[10px] pt-[15px] pb-[4px] gap-[20px] flex-1 min-h-0">
                {/* Left Column (65%) */}
                <div className="w-[65%] flex flex-col h-full text-black">
                  {/* Hero Photo (image1) */}
                  <div
                    style={{ height: "calc(40% - 4.8px)" }}
                    className="w-full bg-white relative mb-3 border-[3px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] shrink-0"
                  >
                    {renderImageSlot(
                      "image1",
                      "w-full h-full",
                      "Select Main Image",
                    )}
                  </div>

                  {/* Specs Row Section */}
                  <div
                    data-safezone-container="true"
                    className={`relative flex items-center justify-center mb-3 border border-transparent rounded-md transition-all duration-150 group/sec ${
                      lockedSections.specs
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("specs");
                      }}
                      className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.specs
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.specs
                          ? "Unlock Specs Section (enable dragging)"
                          : "Lock Specs Section (disable dragging)"
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

                    <div className="flex flex-nowrap whitespace-nowrap font-normal font-trajan-regular text-[14px] items-center justify-center uppercase text-black">
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
                              "Specs",
                              fieldStyles.bedroom,
                            )
                          }
                          deleteTitle="Remove Bedrooms"
                        >
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <StyledInput
                              fieldId="bedroom"
                              fieldLabel="Bedrooms"
                              value={bedroom}
                              onChange={(e) => setBedroom(e.target.value)}
                              inputStyle={fieldStyles.bedroom}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bedroom", s)
                              }
                              className="w-auto bg-transparent text-right focus:outline-none placeholder-gray-600 font-trajan-regular font-normal text-[14px] border-none whitespace-nowrap"
                              placeholder="0"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="bedroomLabel"
                              fieldLabel="Bedroom Label"
                              value={bedroomLabel}
                              onChange={(e) => setBedroomLabel(e.target.value)}
                              inputStyle={fieldStyles.bedroomLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bedroomLabel", s)
                              }
                              className="w-auto bg-transparent border-none focus:outline-none uppercase font-trajan-regular font-normal text-[14px] whitespace-nowrap"
                              placeholder="BEDROOM"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      <span className="text-[14px] font-normal font-trajan-regular text-black mx-[8px] select-none">
                        ·
                      </span>

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
                              "Specs",
                              fieldStyles.bathroom,
                            )
                          }
                          deleteTitle="Remove Bathrooms"
                        >
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <StyledInput
                              fieldId="bathroom"
                              fieldLabel="Bathrooms"
                              value={bathroom}
                              onChange={(e) => setBathroom(e.target.value)}
                              inputStyle={fieldStyles.bathroom}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bathroom", s)
                              }
                              className="w-auto bg-transparent text-right focus:outline-none placeholder-gray-600 font-trajan-regular font-normal text-[14px] border-none whitespace-nowrap"
                              placeholder="0"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="bathroomLabel"
                              fieldLabel="Bathroom Label"
                              value={bathroomLabel}
                              onChange={(e) => setBathroomLabel(e.target.value)}
                              inputStyle={fieldStyles.bathroomLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bathroomLabel", s)
                              }
                              className="w-auto bg-transparent border-none focus:outline-none uppercase font-trajan-regular font-normal text-[14px] whitespace-nowrap"
                              placeholder="BATHROOM"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      <span className="text-[14px] font-normal font-trajan-regular text-black mx-[8px] select-none">
                        ·
                      </span>

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
                              "Square Footage",
                              sqft,
                              "Specs",
                              fieldStyles.sqft,
                            )
                          }
                          deleteTitle="Remove Square Footage"
                        >
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <StyledInput
                              fieldId="sqft"
                              fieldLabel="Square Footage"
                              value={sqft}
                              onChange={(e) => setSqft(e.target.value)}
                              inputStyle={fieldStyles.sqft}
                              onChangeStyle={(s) =>
                                updateFieldStyle("sqft", s)
                              }
                              className="w-auto bg-transparent text-right focus:outline-none placeholder-gray-600 font-trajan-regular font-normal text-[14px] border-none whitespace-nowrap"
                              placeholder="000"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="sqftLabel"
                              fieldLabel="Sq Ft Label"
                              value={sqftLabel}
                              onChange={(e) => setSqftLabel(e.target.value)}
                              inputStyle={fieldStyles.sqftLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("sqftLabel", s)
                              }
                              className="w-auto bg-transparent border-none focus:outline-none uppercase font-trajan-regular font-normal text-[14px] whitespace-nowrap"
                              placeholder="SQ FT"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      <span className="text-[14px] font-normal font-trajan-regular text-black mx-[8px] select-none">
                        ·
                      </span>

                      {!isFieldDeleted("specBuiltYear") && (
                        <DraggableBox
                          id="specBuiltYear"
                          position={fieldPositions.specBuiltYear}
                          onPositionChange={updateFieldPosition}
                          label="Year Built"
                          zoom={0.85}
                          disabled={lockedSections.specs}
                          containerClassName="w-auto inline-flex items-center shrink-0"
                          className="w-auto inline-flex items-center"
                          onDelete={() =>
                            removeStandardField(
                              "specBuiltYear",
                              "Year Built",
                              builtYear,
                              "Specs",
                              fieldStyles.builtYear,
                            )
                          }
                          deleteTitle="Remove Year Built"
                        >
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <StyledInput
                              fieldId="builtYearLabel"
                              fieldLabel="Built Year Label"
                              value={builtYearLabel}
                              onChange={(e) =>
                                setBuiltYearLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.builtYearLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("builtYearLabel", s)
                              }
                              className="w-auto bg-transparent border-none focus:outline-none uppercase font-trajan-regular font-normal text-[14px] whitespace-nowrap"
                              placeholder="BUILT IN"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="builtYear"
                              fieldLabel="Year Built"
                              value={builtYear}
                              onChange={(e) => setBuiltYear(e.target.value)}
                              inputStyle={fieldStyles.builtYear}
                              onChangeStyle={(s) =>
                                updateFieldStyle("builtYear", s)
                              }
                              className="w-auto bg-transparent text-left focus:outline-none placeholder-gray-600 font-trajan-regular font-normal text-[14px] border-none whitespace-nowrap"
                              placeholder="0000"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  {/* Property Description Section */}
                  <div
                    data-safezone-container="true"
                    className={`relative flex flex-col w-full mb-2 border border-transparent rounded-md transition-all duration-150 group/sec ${
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
                      className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.description
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.description
                          ? "Unlock Description Section (enable dragging)"
                          : "Lock Description Section (disable dragging)"
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

                    {/* Property Description (Draggable Alone) */}
                    {!isFieldDeleted("propertyDescription") && (
                      <DraggableBox
                        id="propertyDescription"
                        position={fieldPositions.propertyDescription}
                        onPositionChange={updateFieldPosition}
                        label="Description"
                        zoom={0.85}
                        disabled={lockedSections.description}
                        containerClassName="w-full max-w-full min-w-0"
                        className="w-full max-w-full min-w-0"
                        onDelete={() =>
                          removeStandardField(
                            "propertyDescription",
                            "Property Description",
                            description,
                            "Description",
                            fieldStyles.description,
                          )
                        }
                        deleteTitle="Remove Property Description"
                      >
                        <div className="w-full max-w-full min-w-0 min-h-[90px] flex">
                          <StyledInput
                            fieldId="description"
                            fieldLabel="Property Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            inputStyle={fieldStyles.description}
                            onChangeStyle={(s) =>
                              updateFieldStyle("description", s)
                            }
                            rows={6}
                            className="text-[12px] font-caslon-regular font-normal italic text-black text-left w-full min-h-[90px] bg-transparent focus:outline-none resize-none placeholder-gray-600 leading-[1.4] border-none break-words"
                            placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge private balcony, great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your viewing. MLS#000000"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>

                  {/* Extra Details Section */}
                  <div
                    data-safezone-container="true"
                    className={`relative flex-1 min-h-0 flex flex-col gap-1 w-full mb-2 border border-transparent rounded-md transition-all duration-150 group/sec ${
                      lockedSections.details
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("details");
                      }}
                      className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.details
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.details
                          ? "Unlock Details Section (enable dragging)"
                          : "Lock Details Section (disable dragging)"
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

                    {/* Details List (Each Field Draggable Alone) */}
                    <div className="flex flex-col gap-1 w-full max-w-full min-w-0">
                      {/* By-Law Restrictions */}
                      {!isFieldDeleted("byLawRestrictions") && (
                        <DraggableBox
                          id="byLawRestrictions"
                          position={fieldPositions.byLawRestrictions}
                          onPositionChange={updateFieldPosition}
                          label="By-Law Restrictions"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "byLawRestrictions",
                              "By-Law Restrictions",
                              byLawRestrictions,
                              "Details",
                              fieldStyles.byLawRestrictions,
                            )
                          }
                          deleteTitle="Remove By-Law Restrictions"
                        >
                          <div className="flex items-start justify-between w-full max-w-full min-w-0 gap-2">
                            <StyledInput
                              fieldId="byLawLabel"
                              fieldLabel="By-Law Label"
                              value={byLawLabel}
                              onChange={(e) => setByLawLabel(e.target.value)}
                              inputStyle={fieldStyles.byLawLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawLabel", s)
                              }
                              className="text-[14px] font-normal font-trajan-regular shrink-0 uppercase bg-transparent border-none focus:outline-none whitespace-nowrap text-left"
                              placeholder="BY-LAW RESTRICTIONS:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="byLawRestrictions"
                              fieldLabel="By-Law Restrictions"
                              value={byLawRestrictions}
                              onChange={(e) =>
                                setByLawRestrictions(e.target.value)
                              }
                              inputStyle={fieldStyles.byLawRestrictions}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawRestrictions", s)
                              }
                              rows={1}
                              className="flex-1 min-w-0 max-w-full bg-transparent text-[12px] font-normal font-trajan-regular focus:outline-none placeholder-gray-600 text-black leading-tight border-none text-left break-words"
                              placeholder="Pets Allowed w/Rest., Rentals Allowed"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Maintenance Fees */}
                      {!isFieldDeleted("maintFees") && (
                        <DraggableBox
                          id="maintFees"
                          position={fieldPositions.maintFees}
                          onPositionChange={updateFieldPosition}
                          label="Maintenance Fees"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "maintFees",
                              "Maintenance Fees",
                              maintFees,
                              "Details",
                              fieldStyles.maintFees,
                            )
                          }
                          deleteTitle="Remove Maintenance Fees"
                        >
                          <div className="flex items-start justify-between w-full max-w-full min-w-0 gap-2">
                            <StyledInput
                              fieldId="maintFeesLabel"
                              fieldLabel="Maint. Fees Label"
                              value={maintFeesLabel}
                              onChange={(e) =>
                                setMaintFeesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.maintFeesLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesLabel", s)
                              }
                              className="text-[14px] font-normal font-trajan-regular shrink-0 uppercase bg-transparent border-none focus:outline-none whitespace-nowrap text-left"
                              placeholder="MAINT. FEES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="maintFees"
                              fieldLabel="Maintenance Fees"
                              value={maintFees}
                              onChange={(e) => setMaintFees(e.target.value)}
                              inputStyle={fieldStyles.maintFees}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFees", s)
                              }
                              rows={1}
                              className="flex-1 min-w-0 max-w-full bg-transparent text-[12px] font-normal font-trajan-regular focus:outline-none placeholder-gray-600 text-black leading-tight border-none text-left break-words"
                              placeholder="$000.00"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Maintenance Fees Include */}
                      {!isFieldDeleted("maintFeesInclude") && (
                        <DraggableBox
                          id="maintFeesInclude"
                          position={fieldPositions.maintFeesInclude}
                          onPositionChange={updateFieldPosition}
                          label="Maint. Fees Include"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "maintFeesInclude",
                              "Maint. Fees Include",
                              maintFeesInclude,
                              "Details",
                              fieldStyles.maintFeesInclude,
                            )
                          }
                          deleteTitle="Remove Maint. Fees Include"
                        >
                          <div className="flex items-start justify-between w-full max-w-full min-w-0 gap-2">
                            <StyledInput
                              fieldId="maintFeesIncludeLabel"
                              fieldLabel="Maint. Fees Include Label"
                              value={maintFeesIncludeLabel}
                              onChange={(e) =>
                                setMaintFeesIncludeLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.maintFeesIncludeLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesIncludeLabel", s)
                              }
                              className="text-[14px] font-normal font-trajan-regular shrink-0 uppercase bg-transparent border-none focus:outline-none whitespace-nowrap text-left"
                              placeholder="MAINT. FEES INCLUDE:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="maintFeesInclude"
                              fieldLabel="Maint. Fees Include"
                              value={maintFeesInclude}
                              onChange={(e) =>
                                setMaintFeesInclude(e.target.value)
                              }
                              inputStyle={fieldStyles.maintFeesInclude}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesInclude", s)
                              }
                              rows={2}
                              className="flex-1 min-w-0 max-w-full bg-transparent text-[12px] font-normal font-trajan-regular focus:outline-none placeholder-gray-600 text-black leading-tight border-none text-left break-words"
                              placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Features Included */}
                      {!isFieldDeleted("featuresIncluded") && (
                        <DraggableBox
                          id="featuresIncluded"
                          position={fieldPositions.featuresIncluded}
                          onPositionChange={updateFieldPosition}
                          label="Features Included"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "featuresIncluded",
                              "Features Included",
                              featuresIncluded,
                              "Details",
                              fieldStyles.featuresIncluded,
                            )
                          }
                          deleteTitle="Remove Features Included"
                        >
                          <div className="flex items-start justify-between w-full max-w-full min-w-0 gap-2">
                            <StyledInput
                              fieldId="featuresIncludedLabel"
                              fieldLabel="Features Included Label"
                              value={featuresIncludedLabel}
                              onChange={(e) =>
                                setFeaturesIncludedLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.featuresIncludedLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncludedLabel", s)
                              }
                              className="text-[14px] font-normal font-trajan-regular shrink-0 uppercase bg-transparent border-none focus:outline-none whitespace-nowrap text-left"
                              placeholder="FEATURES INCLUDED:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="featuresIncluded"
                              fieldLabel="Features Included"
                              value={featuresIncluded}
                              onChange={(e) =>
                                setFeaturesIncluded(e.target.value)
                              }
                              inputStyle={fieldStyles.featuresIncluded}
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncluded", s)
                              }
                              rows={2}
                              className="flex-1 min-w-0 max-w-full bg-transparent text-[12px] font-normal font-trajan-regular focus:outline-none placeholder-gray-600 text-black leading-tight border-none text-left break-words"
                              placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Site Influences */}
                      {!isFieldDeleted("siteInfluences") && (
                        <DraggableBox
                          id="siteInfluences"
                          position={fieldPositions.siteInfluences}
                          onPositionChange={updateFieldPosition}
                          label="Site Influences"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "siteInfluences",
                              "Site Influences",
                              siteInfluences,
                              "Details",
                              fieldStyles.siteInfluences,
                            )
                          }
                          deleteTitle="Remove Site Influences"
                        >
                          <div className="flex items-start justify-between w-full max-w-full min-w-0 gap-2">
                            <StyledInput
                              fieldId="siteInfluencesLabel"
                              fieldLabel="Site Influences Label"
                              value={siteInfluencesLabel}
                              onChange={(e) =>
                                setSiteInfluencesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.siteInfluencesLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluencesLabel", s)
                              }
                              className="text-[14px] font-normal font-trajan-regular shrink-0 uppercase bg-transparent border-none focus:outline-none whitespace-nowrap text-left"
                              placeholder="SITE INFLUENCES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="siteInfluences"
                              fieldLabel="Site Influences"
                              value={siteInfluences}
                              onChange={(e) =>
                                setSiteInfluences(e.target.value)
                              }
                              inputStyle={fieldStyles.siteInfluences}
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluences", s)
                              }
                              rows={2}
                              className="flex-1 min-w-0 max-w-full bg-transparent text-[12px] font-normal font-trajan-regular focus:outline-none placeholder-gray-600 text-black leading-tight border-none text-left break-words"
                              placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Amenities */}
                      {!isFieldDeleted("amenities") && (
                        <DraggableBox
                          id="amenities"
                          position={fieldPositions.amenities}
                          onPositionChange={updateFieldPosition}
                          label="Amenities"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "amenities",
                              "Amenities",
                              amenities,
                              "Details",
                              fieldStyles.amenities,
                            )
                          }
                          deleteTitle="Remove Amenities"
                        >
                          <div className="flex items-start justify-between w-full max-w-full min-w-0 gap-2">
                            <StyledInput
                              fieldId="amenitiesLabel"
                              fieldLabel="Amenities Label"
                              value={amenitiesLabel}
                              onChange={(e) =>
                                setAmenitiesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.amenitiesLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenitiesLabel", s)
                              }
                              className="text-[14px] font-normal font-trajan-regular shrink-0 uppercase bg-transparent border-none focus:outline-none whitespace-nowrap text-left"
                              placeholder="AMENITIES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="amenities"
                              fieldLabel="Amenities"
                              value={amenities}
                              onChange={(e) => setAmenities(e.target.value)}
                              inputStyle={fieldStyles.amenities}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenities", s)
                              }
                              rows={2}
                              className="flex-1 min-w-0 max-w-full bg-transparent text-[12px] font-normal font-trajan-regular focus:outline-none placeholder-gray-600 text-black leading-tight border-none text-left break-words"
                              placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* View */}
                      {!isFieldDeleted("view") && (
                        <DraggableBox
                          id="view"
                          position={fieldPositions.view}
                          onPositionChange={updateFieldPosition}
                          label="View"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "view",
                              "View",
                              view,
                              "Details",
                              fieldStyles.view,
                            )
                          }
                          deleteTitle="Remove View"
                        >
                          <div className="flex items-start justify-between w-full max-w-full min-w-0 gap-2">
                            <StyledInput
                              fieldId="viewLabel"
                              fieldLabel="View Label"
                              value={viewLabel}
                              onChange={(e) => setViewLabel(e.target.value)}
                              inputStyle={fieldStyles.viewLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("viewLabel", s)
                              }
                              className="text-[14px] font-normal font-trajan-regular shrink-0 uppercase bg-transparent border-none focus:outline-none whitespace-nowrap text-left"
                              placeholder="VIEW:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="view"
                              fieldLabel="View"
                              value={view}
                              onChange={(e) => setView(e.target.value)}
                              inputStyle={fieldStyles.view}
                              onChangeStyle={(s) => updateFieldStyle("view", s)}
                              rows={1}
                              className="flex-1 min-w-0 max-w-full bg-transparent text-[12px] font-normal font-trajan-regular focus:outline-none placeholder-gray-600 text-black leading-tight border-none text-left break-words"
                              placeholder="South & SW - Van Isl."
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  {/* Contact & Price Section */}
                  <div
                    data-safezone-container="true"
                    className={`relative flex flex-row items-end justify-between w-full pb-2 mt-3 border border-transparent rounded-md transition-all duration-150 group/sec ${
                      lockedSections.contact
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("contact");
                      }}
                      className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.contact
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.contact
                          ? "Unlock Contact Section (enable dragging)"
                          : "Lock Contact Section (disable dragging)"
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

                    {/* Contact details */}
                    <div className="flex flex-col text-black leading-snug w-[60%]">
                      {!isFieldDeleted("contactName") && (
                        <DraggableBox
                          id="contactName"
                          position={fieldPositions.contactName}
                          onPositionChange={updateFieldPosition}
                          label="Agent Name"
                          zoom={0.85}
                          disabled={lockedSections.contact}
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "contactName",
                              "Agent Name",
                              fullName,
                              "Contact",
                              fieldStyles.fullName,
                            )
                          }
                          deleteTitle="Remove Agent Name"
                        >
                          <div className="flex items-center w-full min-w-0 whitespace-nowrap">
                            <StyledInput
                              fieldId="contactLabel"
                              fieldLabel="Contact Label"
                              value={contactLabel}
                              onChange={(e) => setContactLabel(e.target.value)}
                              inputStyle={fieldStyles.contactLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("contactLabel", s)
                              }
                              className="font-normal font-trajan-regular text-[16px] uppercase mr-1 bg-transparent border-none focus:outline-none whitespace-nowrap text-black"
                              placeholder="CONTACT:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="fullName"
                              fieldLabel="Agent Name"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              inputStyle={fieldStyles.fullName}
                              onChangeStyle={(s) =>
                                updateFieldStyle("fullName", s)
                              }
                              className="uppercase font-normal font-trajan-regular text-[16px] bg-transparent focus:outline-none placeholder-gray-600 flex-1 min-w-0 border-none whitespace-nowrap text-black"
                              placeholder="FIRSTNAME LASTNAME"
                            />
                          </div>
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
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "contactBrokerage",
                              "Brokerage",
                              propertyName,
                              "Contact",
                              fieldStyles.propertyName,
                            )
                          }
                          deleteTitle="Remove Brokerage"
                        >
                          <StyledInput
                            fieldId="propertyName"
                            fieldLabel="Brokerage"
                            value={propertyName}
                            onChange={(e) => setPropertyName(e.target.value)}
                            inputStyle={fieldStyles.propertyName}
                            onChangeStyle={(s) =>
                              updateFieldStyle("propertyName", s)
                            }
                            className="bg-transparent focus:outline-none placeholder-gray-600 w-full border-none whitespace-nowrap text-[14px] font-normal font-trajan-regular text-black"
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
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "contactPhone",
                              "Phone",
                              number,
                              "Contact",
                              fieldStyles.number,
                            )
                          }
                          deleteTitle="Remove Phone"
                        >
                          <div className="flex items-center w-full min-w-0 whitespace-nowrap mt-1">
                            <StyledInput
                              fieldId="phoneLabel"
                              fieldLabel="Phone Label"
                              value={phoneLabel}
                              onChange={(e) => setPhoneLabel(e.target.value)}
                              inputStyle={fieldStyles.phoneLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("phoneLabel", s)
                              }
                              className="font-medium font-trajan-regular text-[14px] mr-1 bg-transparent border-none focus:outline-none whitespace-nowrap text-black"
                              placeholder="Phone:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="number"
                              fieldLabel="Phone Number"
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              inputStyle={fieldStyles.number}
                              onChangeStyle={(s) =>
                                updateFieldStyle("number", s)
                              }
                              className="bg-transparent text-[14px] font-normal font-trajan-regular focus:outline-none placeholder-gray-600 flex-1 min-w-0 border-none whitespace-nowrap text-black"
                              placeholder="604.000.0000"
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
                          containerClassName="w-full max-w-full min-w-0"
                          className="w-full max-w-full min-w-0"
                          onDelete={() =>
                            removeStandardField(
                              "contactEmail",
                              "Email",
                              email,
                              "Contact",
                              fieldStyles.email,
                            )
                          }
                          deleteTitle="Remove Email"
                        >
                          <div className="flex items-center w-full min-w-0 whitespace-nowrap">
                            <StyledInput
                              fieldId="emailLabel"
                              fieldLabel="Email Label"
                              value={emailLabel}
                              onChange={(e) => setEmailLabel(e.target.value)}
                              inputStyle={fieldStyles.emailLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("emailLabel", s)
                              }
                              className="font-medium font-trajan-regular text-[14px] mr-1 bg-transparent border-none focus:outline-none whitespace-nowrap text-black"
                              placeholder="Email:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              fieldId="email"
                              fieldLabel="Email Address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              inputStyle={fieldStyles.email}
                              onChangeStyle={(s) =>
                                updateFieldStyle("email", s)
                              }
                              className="bg-transparent focus:outline-none placeholder-gray-600 flex-1 min-w-0 border-none whitespace-nowrap text-[14px] font-normal font-trajan-regular text-black"
                              placeholder="email@address.com"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>

                    {/* Price Block */}
                    {!isFieldDeleted("priceAmount") && (
                      <DraggableBox
                        id="priceAmount"
                        position={fieldPositions.priceAmount}
                        onPositionChange={updateFieldPosition}
                        label="Price"
                        zoom={0.85}
                        disabled={lockedSections.contact}
                        containerClassName="w-auto max-w-full min-w-0 self-end"
                        className="w-auto max-w-full min-w-0"
                        onDelete={() =>
                          removeStandardField(
                            "priceAmount",
                            "Price",
                            amount,
                            "Contact",
                            fieldStyles.amount,
                          )
                        }
                        deleteTitle="Remove Price"
                      >
                        <div className="text-[32px] font-medium font-trajan-regular text-black leading-none pb-1 flex justify-end">
                          <StyledInput
                            fieldId="amount"
                            fieldLabel="Price"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputStyle={fieldStyles.amount}
                            onChangeStyle={(s) => updateFieldStyle("amount", s)}
                            className="bg-transparent focus:outline-none placeholder-gray-600 w-full text-right border-none whitespace-nowrap text-[32px] font-medium font-trajan-regular text-black"
                            placeholder="$000,000"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Right Column (35%) - 5 Stacked Side Photos */}
                <div className="w-[35%] flex flex-col gap-2 h-full min-h-0">
                  <div className="w-full flex-1 min-h-0 bg-white relative border-[3px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)]">
                    {renderImageSlot(
                      "image2",
                      "w-full h-full",
                      "Select Image 2",
                    )}
                  </div>
                  <div className="w-full flex-1 min-h-0 bg-white relative border-[3px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)]">
                    {renderImageSlot(
                      "image3",
                      "w-full h-full",
                      "Select Image 3",
                    )}
                  </div>
                  <div className="w-full flex-1 min-h-0 bg-white relative border-[3px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)]">
                    {renderImageSlot(
                      "image4",
                      "w-full h-full",
                      "Select Image 4",
                    )}
                  </div>
                  <div className="w-full flex-1 min-h-0 bg-white relative border-[3px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)]">
                    {renderImageSlot(
                      "image5",
                      "w-full h-full",
                      "Select Image 5",
                    )}
                  </div>
                  <div className="w-full flex-1 min-h-0 bg-white relative border-[3px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)]">
                    {renderImageSlot(
                      "image6",
                      "w-full h-full",
                      "Select Image 6",
                    )}
                  </div>
                </div>
              </div>

              {/* Full Width Footer Legal / Disclaimer Text */}
              {!isFieldDeleted("contactDisclaimer") && (
                <div className="w-full px-[10px] pb-2 pt-1 shrink-0">
                  <div
                    style={{ fontSize: "8px", lineHeight: "1.2" }}
                    className="font-sans font-bold text-black border-t border-gray-300 pt-1 text-justify w-full select-none"
                  >
                    {disclaimerText ||
                      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless."}
                  </div>
                </div>
              )}
            </div>
          </SafeZoneWrapper>
        </div>

        {/* ── Page 2 Divider ─────────────────────────────────────────────── */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 2
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* ── Page 2 Outer Container ─────────────────────────────────────── */}
        <div
          className="pdf-page bg-[#fbfbfb] shadow-xl relative overflow-hidden flex flex-col font-serif"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
            <BackgroundSVG />
          </div>

          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div
              data-safezone-container="true"
              className="relative w-full h-full flex flex-col z-10"
            >
              {renderHeader()}
              <div className="flex-1 w-full flex flex-col relative pt-4 pb-2">
                <div className="w-full flex-1 bg-transparent relative">
                  {renderImageSlot("image7", "w-full h-full", "Floor Plan")}
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>
      </div>
    </FontFolderProvider>
    );
  },
);

BcfpStandard20.displayName = "BcfpStandard20";

export default BcfpStandard20;
