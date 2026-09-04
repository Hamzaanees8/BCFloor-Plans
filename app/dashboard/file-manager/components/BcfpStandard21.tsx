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

const STANDARD_FIELD_IDS = new Set([
  "leftContentGroup",
  "addressCode",
  "roadName",
  "cityLine",
  "mlsNumberTop",
  "propertyDescription",
  "byLawRestrictions",
  "maintFees",
  "maintFeesInclude",
  "featuresIncluded",
  "siteInfluences",
  "amenities",
  "view",
  "priceAmount",
  "headline",
  "specBedroom",
  "specBathroom",
  "specSqft",
  "specBuiltYear",
  "contactName",
  "contactBrokerage",
  "contactPhone",
  "contactEmail",
  "contactMls",
  "contactDisclaimer",
]);

const BcfpStandard21 = forwardRef<BcfpStandard21Ref, BcfpStandard21Props>(
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
    const [roadLabelBefore, setRoadLabelBefore] = useState("NUMBER");
    const [roadLabelAfter, setRoadLabelAfter] = useState("ROAD");
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
    const [disclaimerText] = useState(
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
      description: { fontSize: "10px", textAlign: "left" },
      byLawLabel: { fontSize: "14px", textAlign: "left" },
      byLawRestrictions: { fontSize: "12px", textAlign: "left" },
      maintFeesLabel: { fontSize: "14px", textAlign: "left" },
      maintenanceFees: { fontSize: "12px", textAlign: "left" },
      maintFeesIncludeLabel: { fontSize: "14px", textAlign: "left" },
      maintenanceFeesInclude: { fontSize: "12px", textAlign: "left" },
      featuresIncludedLabel: { fontSize: "14px", textAlign: "left" },
      featuresIncluded: { fontSize: "12px", textAlign: "left" },
      siteInfluencesLabel: { fontSize: "14px", textAlign: "left" },
      siteInfluences: { fontSize: "12px", textAlign: "left" },
      amenitiesLabel: { fontSize: "14px", textAlign: "left" },
      amenities: { fontSize: "12px", textAlign: "left" },
      viewLabel: { fontSize: "14px", textAlign: "left" },
      view: { fontSize: "12px", textAlign: "left" },
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
        setImages((prev) => ({ ...prev, [key]: url }));
      }
    };

    const handleDelete = (
      key: string,
      refToReset: React.RefObject<HTMLInputElement | null>,
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (refToReset.current) refToReset.current.value = "";
    };

    const handleZoom = (key: string, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
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
        setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      }
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    // ── 10. Background Media 30s Polling ──────────────────────────────────────
    useEffect(() => {
      if (!orderData?.uuid) return;

      const intervalId = setInterval(async () => {
        try {
          const sheets = await featureSheetService.getFeatureSheetsByOrder(
            orderData.uuid,
          );
          if (sheets && sheets.length > 0) {
            const currentSheet = sheets[0];
            if (currentSheet) {
              const state =
                featureSheetService.parsePayloadToState(currentSheet);
              if (state.images) {
                setImages((prev) => ({ ...prev, ...(state.images as any) }));
              }
            }
          }
        } catch (err) {
          console.error(
            "Silent background polling error for feature sheet media:",
            err,
          );
        }
      }, 30000);

      return () => clearInterval(intervalId);
    }, [orderData?.uuid]);

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
          if (orderData.property.mls_number)
            setMlsNumber(orderData.property.mls_number);
          if (orderData.property.suite)
            setAddressCode(orderData.property.suite);
          if (orderData.property.address)
            setRoadName(orderData.property.address);

          let cityString = "";
          if (orderData.property.city) cityString += orderData.property.city;
          if (orderData.property.province)
            cityString +=
              (cityString ? ", " : "") + orderData.property.province;
          if (orderData.property.postal_code)
            cityString +=
              (cityString ? " " : "") + orderData.property.postal_code;
          if (cityString) setCityLine(cityString);
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
            (agent as any)?.avatar_url ||
            (agent as any)?.logo ||
            null;
          if (agentLogo) {
            setImages((prev) => ({
              ...prev,
              image7: prev.image7 || agentLogo,
            }));
          }
        }
      }

      if (formData) {
        if (formData.byLawRestrictions)
          setByLawRestrictions(formData.byLawRestrictions);
        if (formData.maintenanceFees)
          setMaintenanceFees(formData.maintenanceFees);
        if (formData.maintenanceFeesInclude)
          setMaintenanceFeesInclude(formData.maintenanceFeesInclude);
        if (formData.featuresIncluded)
          setFeaturesIncluded(formData.featuresIncluded);
        if (formData.siteInfluences) setSiteInfluences(formData.siteInfluences);
        if (formData.amenities) setAmenities(formData.amenities);
        if (formData.view) setView(formData.view);
        if (formData.description) setDescription(formData.description);
        if (formData.fullName) setFullName(formData.fullName);
        if (formData.email) setEmail(formData.email);
        if (formData.propertyName) setPropertyName(formData.propertyName);
        if (formData.amount) setAmount(formData.amount);
        if (formData.number) setNumber(formData.number);
        if (formData.addressCode) setAddressCode(formData.addressCode);
        if (formData.roadName) setRoadName(formData.roadName);
        if (formData.cityLine) setCityLine(formData.cityLine);
        if (formData.bedroom) setBedroom(formData.bedroom);
        if (formData.bathroom) setBathroom(formData.bathroom);
        if (formData.sqft) setSqft(formData.sqft);
        if (formData.builtYear) setBuiltYear(formData.builtYear);
        if (formData.headline) setHeadline(formData.headline);
        if (formData.mlsNumber) setMlsNumber(formData.mlsNumber);
        if (formData.patioSqft) setPatioSqft(formData.patioSqft);
        if (formData.ceilingHeight) setCeilingHeight(formData.ceilingHeight);

        if (formData.roadLabelBefore)
          setRoadLabelBefore(formData.roadLabelBefore);
        if (formData.roadLabelAfter) setRoadLabelAfter(formData.roadLabelAfter);
        if (formData.bedroomLabel) setBedroomLabel(formData.bedroomLabel);
        if (formData.bathroomLabel) setBathroomLabel(formData.bathroomLabel);
        if (formData.sqftLabel) setSqftLabel(formData.sqftLabel);
        if (formData.builtYearLabel) setBuiltYearLabel(formData.builtYearLabel);
        if (formData.byLawLabel) setByLawLabel(formData.byLawLabel);
        if (formData.maintFeesLabel) setMaintFeesLabel(formData.maintFeesLabel);
        if (formData.maintFeesIncludeLabel)
          setMaintFeesIncludeLabel(formData.maintFeesIncludeLabel);
        if (formData.featuresIncludedLabel)
          setFeaturesIncludedLabel(formData.featuresIncludedLabel);
        if (formData.siteInfluencesLabel)
          setSiteInfluencesLabel(formData.siteInfluencesLabel);
        if (formData.amenitiesLabel) setAmenitiesLabel(formData.amenitiesLabel);
        if (formData.viewLabel) setViewLabel(formData.viewLabel);
        if (formData.contactLabel) setContactLabel(formData.contactLabel);
        if (formData.phoneLabel) setPhoneLabel(formData.phoneLabel);
        if (formData.emailLabel) setEmailLabel(formData.emailLabel);
        if (formData.mlsLabel) setMlsLabel(formData.mlsLabel);

        if (formData.images)
          setImages((prev) => ({ ...prev, ...(formData.images as any) }));
        if (formData.imageScales)
          setScale((prev) => ({ ...prev, ...(formData.imageScales as any) }));
        if (formData.imagePositions)
          setPosition((prev) => ({
            ...prev,
            ...(formData.imagePositions as any),
          }));
        if (formData.imageRotations)
          setRotation((prev) => ({
            ...prev,
            ...(formData.imageRotations as any),
          }));
        if (formData.fieldPositions) setFieldPositions(formData.fieldPositions);
        if (formData.fieldStyles)
          setFieldStyles((prev) => ({
            ...prev,
            ...formData.fieldStyles,
            description: {
              fontSize: "10px",
              ...(formData.fieldStyles?.description || {}),
            },
          }));
        if (formData.deletedStandardFieldIds)
          setDeletedStandardFieldIds(formData.deletedStandardFieldIds);
        if (formData.deletedDetailFields)
          setDeletedDetailFields(formData.deletedDetailFields);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
              fontSize: fieldStyles.fullName?.fontSize || "20px",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "11.5px",
            },
          },
          companyName: {
            value: propertyName,
            style: {
              ...fieldStyles.propertyName,
              fontSize: fieldStyles.propertyName?.fontSize || "13px",
            },
          },
          propertyNotesTitle: {
            value: roadName,
            style: {
              ...fieldStyles.roadName,
              fontSize: fieldStyles.roadName?.fontSize || "25px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "10px",
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
            value: maintenanceFees,
            style: {
              ...fieldStyles.maintenanceFees,
              fontSize: fieldStyles.maintenanceFees?.fontSize || "12px",
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
            value: maintenanceFeesInclude,
            style: {
              ...fieldStyles.maintenanceFeesInclude,
              fontSize: fieldStyles.maintenanceFeesInclude?.fontSize || "12px",
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
            deletedStandardFieldIds,
            deletedDetailFields,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
          fieldPositions,
          fieldStyles,
        });
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
        if (state.propertyNotesTitle)
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
          if (details.addressCode)
            setAddressCode(details.addressCode as string);
          if (details.cityLine) setCityLine(details.cityLine as string);
          if (details.mlsNumber) setMlsNumber(details.mlsNumber as string);
          if (details.headline) setHeadline(details.headline as string);
          if (details.patioSqft) setPatioSqft(details.patioSqft as string);
          if (details.ceilingHeight)
            setCeilingHeight(details.ceilingHeight as string);

          if (details.roadLabelBefore)
            setRoadLabelBefore(details.roadLabelBefore as string);
          if (details.roadLabelAfter)
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

          if (details.deletedStandardFieldIds)
            setDeletedStandardFieldIds(
              details.deletedStandardFieldIds as string[],
            );
          if (details.deletedDetailFields)
            setDeletedDetailFields(details.deletedDetailFields as any[]);
        }

        if (state.images)
          setImages((prev) => ({
            ...prev,
            ...(state.images as any),
          }));
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

        // Restore field styles with template size normalization
        const styles: Record<string, TextStyle> = {};
        if (state.fieldStyles) {
          Object.assign(styles, state.fieldStyles);
        }

        const rawPayload = payload as any;
        const c = rawPayload?.data?.content || rawPayload?.content || {};
        const od =
          rawPayload?.data?.other_details || rawPayload?.other_details || {};

        if (helperSt(c.realtorName)) {
          styles.fullName = helperSt(c.realtorName)!;
        }
        if (helperSt(c.companyName)) {
          styles.propertyName = helperSt(c.companyName)!;
        }
        if (helperSt(c.emailLink)) {
          styles.email = helperSt(c.emailLink)!;
        }
        if (helperSt(c.offeredAtPrice)) {
          const s = helperSt(c.offeredAtPrice)!;
          styles.amount =
            s.fontSize === "36px" ? { ...s, fontSize: "32px" } : s;
        }
        if (helperSt(c.propertyNotesTitle)) {
          styles.roadName = helperSt(c.propertyNotesTitle)!;
        }
        if (helperSt(c.propertyNotesDescription)) {
          const s = helperSt(c.propertyNotesDescription)!;
          styles.description =
            s.fontSize === "20px" ? { ...s, fontSize: "10px" } : s;
        }

        if (helperSt(od.number) || helperSt(od.phone)) {
          const numStyle = helperSt(od.number) || helperSt(od.phone);
          styles.number = numStyle!;
        }

        setFieldStyles(styles);

        if (rawPayload?.data?.field_positions) {
          setFieldPositions(rawPayload.data.field_positions);
        } else if (rawPayload?.field_positions) {
          setFieldPositions(rawPayload.field_positions);
        }
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
              ? hasImage
                ? "border-none shadow-none bg-[#B3B394]"
                : "border-none shadow-none bg-gray-200"
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
                      objectFit="contain"
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
              className="relative z-10 w-full h-full flex flex-col justify-between px-6 pt-5 pb-3 overflow-hidden"
            >
              {/* ── Header Section ─────────────────────────────────────── */}
              <div
                data-safezone-container="true"
                className={`flex justify-between items-center pt-2 pb-2 text-white relative rounded-lg border-[3.5px] border-solid border-transparent transition-all duration-150 group/sec shrink-0 ${
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

                {/* Logo Slot (Left) */}
                <div className="w-[190px] h-[65px] relative">
                  {renderImageSlot(
                    "image7",
                    "w-full h-full",
                    "Select Logo (Image 7)",
                    true,
                  )}
                </div>

                {/* Address Header (Right) */}
                <div className="flex flex-col items-end text-right">
                  <div className="flex items-center text-white text-[26px] font-light tracking-wide uppercase leading-none">
                    {!isFieldDeleted("mlsNumberTop") && (
                      <DraggableBox
                        id="mlsNumberTop"
                        position={fieldPositions.mlsNumberTop}
                        onPositionChange={updateFieldPosition}
                        label="MLS #"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "mlsNumberTop",
                            "MLS #",
                            mlsNumber,
                            "Header",
                            fieldStyles.mlsNumberTop,
                          )
                        }
                        deleteTitle="Remove MLS #"
                      >
                        <div className="inline-flex items-center whitespace-nowrap">
                          <span className="text-[15px] select-none mr-0.5">
                            #
                          </span>
                          <StyledInput
                            value={mlsNumber}
                            onChange={(e) => setMlsNumber(e.target.value)}
                            inputStyle={fieldStyles["mlsNumberTop"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsNumberTop", s)
                            }
                            className="font-light text-[26px] h-[32px] w-[145px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white/90 whitespace-nowrap"
                            placeholder="0000-0000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("roadName") && (
                      <DraggableBox
                        id="roadName"
                        position={fieldPositions.roadName}
                        onPositionChange={updateFieldPosition}
                        label="Road / Number"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        containerClassName="w-auto inline-flex items-center shrink-0 ml-2"
                        className="w-auto inline-flex items-center"
                        onDelete={() =>
                          removeStandardField(
                            "roadName",
                            "Road / Number",
                            `${roadLabelBefore} ${addressCode} ${roadLabelAfter}`,
                            "Header",
                            fieldStyles.roadName,
                          )
                        }
                        deleteTitle="Remove Road / Number"
                      >
                        <div className="inline-flex items-center whitespace-nowrap">
                          <StyledInput
                            value={roadLabelBefore}
                            onChange={(e) => setRoadLabelBefore(e.target.value)}
                            inputStyle={fieldStyles.roadLabelBefore}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadLabelBefore", s)
                            }
                            className="bg-transparent text-white font-light text-[26px] focus:outline-none border-none whitespace-nowrap"
                            placeholder="NUMBER"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={addressCode}
                            onChange={(e) => setAddressCode(e.target.value)}
                            inputStyle={fieldStyles["addressCode"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("addressCode", s)
                            }
                            className="font-light text-[26px] h-[32px] w-[45px] bg-transparent text-white text-center ml-1 focus:outline-none border-none placeholder-white/90 uppercase whitespace-nowrap"
                            placeholder="0"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={roadLabelAfter}
                            onChange={(e) => setRoadLabelAfter(e.target.value)}
                            inputStyle={fieldStyles.roadLabelAfter}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadLabelAfter", s)
                            }
                            className="ml-1 bg-transparent text-white font-light text-[26px] focus:outline-none border-none whitespace-nowrap"
                            placeholder="ROAD"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
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
                        value={cityLine}
                        onChange={(e) => setCityLine(e.target.value)}
                        inputStyle={fieldStyles["cityLine"]}
                        onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                        className="font-normal text-[13px] h-[18px] mt-1 bg-transparent text-[#d4e3ec] text-right w-[300px] tracking-[0.16em] focus:outline-none border-none uppercase placeholder-white/70 whitespace-nowrap"
                        placeholder="BRIGHOUSE SOUTH, RICHMOND"
                      />
                    </DraggableBox>
                  )}
                </div>
              </div>

              {/* ── Main Body (2 Columns with isolated heights to prevent cross-column overflow) ── */}
              <div className="flex gap-4 flex-1 min-h-0 items-start my-1 w-full">
                {/* ── LEFT COLUMN (28.5%) ──────────────────────────────────── */}
                <div className="w-[28.5%] h-full min-h-0 flex flex-col justify-between relative">
                  {/* Top: Image 1 (Standalone, outside dragbox and section lock) */}
                  <div className="w-full shrink-0 mb-1.5">
                    {renderImageSlot(
                      "image1",
                      "w-full h-[135px]",
                      "Select Image 1",
                    )}
                  </div>

                  {/* ── Details Section with White Gradient Background (Fields can be dragged freely across safe zone) ── */}
                  <div
                    className="flex-1 min-h-0 relative w-full p-2 mb-[58px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.45) 45%, rgba(255, 255, 255, 0.03) 100%)",
                    }}
                  >
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

                    {/* 1. Description (Individually Draggable, 10px, Left-aligned) */}
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
                            fontSize:
                              fieldStyles["description"]?.fontSize || "10px",
                            textAlign:
                              fieldStyles["description"]?.textAlign || "left",
                          }}
                          onChangeStyle={(s) =>
                            updateFieldStyle("description", s)
                          }
                          className="text-[10px] text-[#2d3748] leading-[1.3] text-left bg-transparent w-full focus:outline-none border-none placeholder-gray-500 whitespace-pre-wrap break-words"
                          placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South West providing unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms."
                        />
                      </DraggableBox>
                    )}

                    {/* 2. Specs List (Individually Draggable, 14px Title, 12px Value, Left-aligned) */}
                    <div className="flex flex-col gap-1 text-[12px] leading-tight font-sans my-auto">
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
                                fontSize:
                                  fieldStyles.byLawLabel?.fontSize || "14px",
                                textAlign:
                                  fieldStyles.byLawLabel?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawLabel", s)
                              }
                              className="font-bold text-[14px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
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
                                fontSize:
                                  fieldStyles["byLawRestrictions"]?.fontSize ||
                                  "12px",
                                textAlign:
                                  fieldStyles["byLawRestrictions"]?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawRestrictions", s)
                              }
                              className="text-[12px] text-[#2d3748] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                                fontSize:
                                  fieldStyles.maintFeesLabel?.fontSize ||
                                  "14px",
                                textAlign:
                                  fieldStyles.maintFeesLabel?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesLabel", s)
                              }
                              className="font-bold text-[14px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
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
                                fontSize:
                                  fieldStyles["maintenanceFees"]?.fontSize ||
                                  "12px",
                                textAlign:
                                  fieldStyles["maintenanceFees"]?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintenanceFees", s)
                              }
                              className="text-[12px] text-[#2d3748] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                                fontSize:
                                  fieldStyles.maintFeesIncludeLabel?.fontSize ||
                                  "14px",
                                textAlign:
                                  fieldStyles.maintFeesIncludeLabel
                                    ?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesIncludeLabel", s)
                              }
                              className="font-bold text-[14px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
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
                                fontSize:
                                  fieldStyles["maintenanceFeesInclude"]
                                    ?.fontSize || "12px",
                                textAlign:
                                  fieldStyles["maintenanceFeesInclude"]
                                    ?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintenanceFeesInclude", s)
                              }
                              className="text-[12px] text-[#2d3748] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                                fontSize:
                                  fieldStyles.featuresIncludedLabel?.fontSize ||
                                  "14px",
                                textAlign:
                                  fieldStyles.featuresIncludedLabel
                                    ?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncludedLabel", s)
                              }
                              className="font-bold text-[14px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
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
                                fontSize:
                                  fieldStyles["featuresIncluded"]?.fontSize ||
                                  "12px",
                                textAlign:
                                  fieldStyles["featuresIncluded"]?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncluded", s)
                              }
                              className="text-[12px] text-[#2d3748] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                                fontSize:
                                  fieldStyles.siteInfluencesLabel?.fontSize ||
                                  "14px",
                                textAlign:
                                  fieldStyles.siteInfluencesLabel?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluencesLabel", s)
                              }
                              className="font-bold text-[14px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
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
                                fontSize:
                                  fieldStyles["siteInfluences"]?.fontSize ||
                                  "12px",
                                textAlign:
                                  fieldStyles["siteInfluences"]?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluences", s)
                              }
                              className="text-[12px] text-[#2d3748] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                                fontSize:
                                  fieldStyles.amenitiesLabel?.fontSize ||
                                  "14px",
                                textAlign:
                                  fieldStyles.amenitiesLabel?.textAlign ||
                                  "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenitiesLabel", s)
                              }
                              className="font-bold text-[14px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="AMENITIES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={amenities}
                              onChange={(e) => setAmenities(e.target.value)}
                              inputStyle={{
                                ...fieldStyles["amenities"],
                                fontSize:
                                  fieldStyles["amenities"]?.fontSize || "12px",
                                textAlign:
                                  fieldStyles["amenities"]?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenities", s)
                              }
                              className="text-[12px] text-[#2d3748] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                                fontSize:
                                  fieldStyles.viewLabel?.fontSize || "14px",
                                textAlign:
                                  fieldStyles.viewLabel?.textAlign || "left",
                              }}
                              onChangeStyle={(s) =>
                                updateFieldStyle("viewLabel", s)
                              }
                              className="font-bold text-[14px] text-[#184260] uppercase bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                              placeholder="VIEW:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={view}
                              onChange={(e) => setView(e.target.value)}
                              inputStyle={{
                                ...fieldStyles["view"],
                                fontSize:
                                  fieldStyles["view"]?.fontSize || "12px",
                                textAlign:
                                  fieldStyles["view"]?.textAlign || "left",
                              }}
                              onChangeStyle={(s) => updateFieldStyle("view", s)}
                              className="text-[12px] text-[#2d3748] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-500"
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
                          inputStyle={fieldStyles["headline"]}
                          onChangeStyle={(s) => updateFieldStyle("headline", s)}
                          className="font-medium text-[11.5px] text-[#184260] uppercase tracking-wider text-center bg-transparent w-full focus:outline-none border-none placeholder-gray-600 whitespace-pre-wrap break-words leading-normal py-1"
                          placeholder="ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING."
                        />
                      </DraggableBox>
                    </div>
                  )}

                  {/* Specs Summary Row (Fixed Height, 12px gap from Headline, 14px gap to 2x2 Photo Grid) */}
                  <div
                    data-safezone-container="true"
                    className={`flex items-center justify-center gap-2.5 w-full h-[28px] mt-[12px] mb-[14px] text-[10.5px] font-medium text-[#184260] uppercase tracking-wider text-center shrink-0 relative z-10 group/sec transition-all duration-150 rounded ${
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
                      className={`absolute top-0.5 right-0.5 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <StyledInput
                            value={bedroom}
                            onChange={(e) => setBedroom(e.target.value)}
                            inputStyle={fieldStyles["bedroom"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bedroom", s)
                            }
                            className="font-medium text-[10.5px] text-[#184260] w-[14px] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                            placeholder="0"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={bedroomLabel}
                            onChange={(e) => setBedroomLabel(e.target.value)}
                            inputStyle={fieldStyles.bedroomLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bedroomLabel", s)
                            }
                            className="text-nowrap font-medium text-[10.5px] text-[#184260] uppercase bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="BEDROOM"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    <span className="text-[#184260]/60 select-none">|</span>

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
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <StyledInput
                            value={bathroom}
                            onChange={(e) => setBathroom(e.target.value)}
                            inputStyle={fieldStyles["bathroom"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bathroom", s)
                            }
                            className="font-medium text-[10.5px] text-[#184260] w-[14px] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                            placeholder="0"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={bathroomLabel}
                            onChange={(e) => setBathroomLabel(e.target.value)}
                            inputStyle={fieldStyles.bathroomLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bathroomLabel", s)
                            }
                            className="text-nowrap font-medium text-[10.5px] text-[#184260] uppercase bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="BATHROOM"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    <span className="text-[#184260]/60 select-none">|</span>

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
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <StyledInput
                            value={sqft}
                            onChange={(e) => setSqft(e.target.value)}
                            inputStyle={fieldStyles["sqft"]}
                            onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                            className="font-medium text-[10.5px] text-[#184260] w-[35px] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                            placeholder="000"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={sqftLabel}
                            onChange={(e) => setSqftLabel(e.target.value)}
                            inputStyle={fieldStyles.sqftLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("sqftLabel", s)
                            }
                            className="text-nowrap font-medium text-[10.5px] text-[#184260] uppercase bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="SQ FT"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    <span className="text-[#184260]/60 select-none">|</span>

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
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <StyledInput
                            value={builtYearLabel}
                            onChange={(e) => setBuiltYearLabel(e.target.value)}
                            inputStyle={fieldStyles.builtYearLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("builtYearLabel", s)
                            }
                            className="text-nowrap font-medium text-[10.5px] text-[#184260] uppercase bg-transparent focus:outline-none border-none whitespace-nowrap"
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
                            className="font-medium text-[10.5px] text-[#184260] w-[45px] text-left bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
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
                      inputStyle={fieldStyles.contactLabel}
                      onChangeStyle={(s) => updateFieldStyle("contactLabel", s)}
                      className="text-[10.5px] font-bold tracking-widest uppercase text-white bg-transparent text-right focus:outline-none border-none whitespace-nowrap leading-none"
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
                          inputStyle={fieldStyles["fullName"]}
                          onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                          className="font-bold text-[18px] h-[22px] bg-transparent text-white text-right focus:outline-none border-none uppercase placeholder-white whitespace-nowrap tracking-wide leading-tight"
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
                          inputStyle={fieldStyles["propertyName"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("propertyName", s)
                          }
                          className="font-normal text-[12px] h-[16px] bg-transparent text-white/95 text-right focus:outline-none border-none placeholder-white/80 whitespace-nowrap leading-tight"
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
                        <div className="flex items-center justify-end gap-1 text-[11px] text-white whitespace-nowrap leading-tight">
                          <StyledInput
                            value={phoneLabel}
                            onChange={(e) => setPhoneLabel(e.target.value)}
                            inputStyle={fieldStyles.phoneLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("phoneLabel", s)
                            }
                            className="font-bold text-[11px] text-white bg-transparent text-right focus:outline-none border-none whitespace-nowrap"
                            placeholder="Phone:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            inputStyle={fieldStyles["number"]}
                            onChangeStyle={(s) => updateFieldStyle("number", s)}
                            className="font-normal text-[11px] h-[15px] w-[110px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white whitespace-nowrap"
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
                        <div className="flex items-center justify-end gap-1 text-[11px] text-white whitespace-nowrap leading-tight">
                          <StyledInput
                            value={emailLabel}
                            onChange={(e) => setEmailLabel(e.target.value)}
                            inputStyle={fieldStyles.emailLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("emailLabel", s)
                            }
                            className="font-bold text-[11px] text-white bg-transparent text-right focus:outline-none border-none whitespace-nowrap"
                            placeholder="Email:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputStyle={fieldStyles["email"]}
                            onChangeStyle={(s) => updateFieldStyle("email", s)}
                            className="font-normal text-[11px] h-[15px] w-[170px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white/80 whitespace-nowrap"
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
                        <div className="flex items-center justify-end gap-1 text-[11px] text-white whitespace-nowrap leading-tight">
                          <StyledInput
                            value={mlsLabel}
                            onChange={(e) => setMlsLabel(e.target.value)}
                            inputStyle={fieldStyles.mlsLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsLabel", s)
                            }
                            className="font-bold text-[11px] text-white bg-transparent text-right focus:outline-none border-none whitespace-nowrap"
                            placeholder="MLS #"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={mlsNumber}
                            onChange={(e) => setMlsNumber(e.target.value)}
                            inputStyle={fieldStyles["mlsNumber"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsNumber", s)
                            }
                            className="font-bold text-[11px] h-[15px] w-[80px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white whitespace-nowrap"
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
              <div className="absolute bottom-2 mb-[20px] left-0 w-full text-center text-white text-[11px] font-semibold tracking-wider pointer-events-auto">
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
