import {
  House,
  Pencil,
  RotateCw,
  Trash,
  ZoomIn,
  ZoomOut,
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
import ImageEditor from "./ImageEditor";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetPayload,
  FeatureSheetResponse,
  TextStyle,
} from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

export interface BcfpStandard22Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard22Props {
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

const BcfpStandard22 = forwardRef<BcfpStandard22Ref, BcfpStandard22Props>(
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

    // ── 2. Text Fields State ──────────────────────────────────────────────────
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

    // ── 3. Editable Labels State ─────────────────────────────────────────────
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
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
    const [mlsLabel, setMlsLabel] = useState("MLS #");
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
    );
    const [footerText, setFooterText] = useState(
      "DESIGNED AND PRINTED BY BC FLOOR PLANS",
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
      amount: { fontSize: "14px" },
      fullName: { fontSize: "13px" },
      propertyName: { fontSize: "11px" },
      number: { fontSize: "11px" },
      email: { fontSize: "11px" },
      roadName: { fontSize: "15px" },
      cityLine: { fontSize: "12px" },
      description: { fontSize: "10px" },
      byLawLabel: { fontSize: "12px" },
      byLawRestrictions: { fontSize: "12px" },
      maintFeesLabel: { fontSize: "12px" },
      maintenanceFees: { fontSize: "12px" },
      maintFeesIncludeLabel: { fontSize: "12px" },
      maintenanceFeesInclude: { fontSize: "12px" },
      featuresIncludedLabel: { fontSize: "12px" },
      featuresIncluded: { fontSize: "12px" },
      siteInfluencesLabel: { fontSize: "12px" },
      siteInfluences: { fontSize: "12px" },
      amenitiesLabel: { fontSize: "12px" },
      amenities: { fontSize: "12px" },
      viewLabel: { fontSize: "12px" },
      view: { fontSize: "12px" },
      mlsLabel: { fontSize: "12px" },
      mlsNumber: { fontSize: "12px" },
      mlsNumberTop: { fontSize: "42px", fontFamily: "BickhamScript, cursive" },
      roadLabelBefore: {
        fontSize: "42px",
        fontFamily: "BickhamScript, cursive",
      },
      addressCode: { fontSize: "42px", fontFamily: "BickhamScript, cursive" },
      roadLabelAfter: {
        fontSize: "42px",
        fontFamily: "BickhamScript, cursive",
      },
      footerText: { fontSize: "11px" },
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
      footer: false,
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
    });

    const [scale, setScale] = useState<Record<string, number>>({
      image1: 1,
      image2: 1,
      image3: 1,
      image4: 1,
      image5: 1,
      image6: 1,
      image7: 1,
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
    });

    const [rotation, setRotation] = useState<Record<string, number>>({
      image1: 0,
      image2: 0,
      image3: 0,
      image4: 0,
      image5: 0,
      image6: 0,
      image7: 0,
    });

    const [dragging, setDragging] = useState<Record<string, boolean>>({
      image1: false,
      image2: false,
      image3: false,
      image4: false,
      image5: false,
      image6: false,
      image7: false,
    });

    const lastPosition = useRef<Record<string, { x: number; y: number }>>({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
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
      // Mouse drag zoom divisor is 0.85 (matches preview zoom)
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
        if (formData.mlsLabel) setMlsLabel(formData.mlsLabel);
        if (formData.contactLabel) setContactLabel(formData.contactLabel);
        if (formData.phoneLabel) setPhoneLabel(formData.phoneLabel);
        if (formData.emailLabel) setEmailLabel(formData.emailLabel);
        if (formData.disclaimerText) setDisclaimerText(formData.disclaimerText);
        if ((formData as any).footerText)
          setFooterText((formData as any).footerText);

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
      (updateFormData as any)({
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
        mlsLabel,
        contactLabel,
        phoneLabel,
        emailLabel,
        disclaimerText,
        footerText,
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
      mlsLabel,
      contactLabel,
      phoneLabel,
      emailLabel,
      disclaimerText,
      footerText,
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
          templateKey: "BCFPStandard22",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#8B0000",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "14px",
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
              fontSize: fieldStyles.email?.fontSize || "11px",
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
              fontSize: fieldStyles.roadName?.fontSize || "15px",
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
              fontSize: fieldStyles.byLawLabel?.fontSize || "12px",
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
              fontSize: fieldStyles.maintFeesLabel?.fontSize || "12px",
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
              fontSize: fieldStyles.maintFeesIncludeLabel?.fontSize || "12px",
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
              fontSize: fieldStyles.featuresIncludedLabel?.fontSize || "12px",
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
              fontSize: fieldStyles.siteInfluencesLabel?.fontSize || "12px",
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
            mlsLabel,
            contactLabel,
            phoneLabel,
            emailLabel,
            disclaimerText,
            footerText,
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
          if (details.mlsLabel) setMlsLabel(details.mlsLabel as string);
          if (details.contactLabel)
            setContactLabel(details.contactLabel as string);
          if (details.phoneLabel) setPhoneLabel(details.phoneLabel as string);
          if (details.emailLabel) setEmailLabel(details.emailLabel as string);
          if (details.disclaimerText)
            setDisclaimerText(details.disclaimerText as string);
          if (details.footerText) setFooterText(details.footerText as string);

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
          const s = helperSt(c.realtorName)!;
          styles.fullName =
            s.fontSize === "20px" ? { ...s, fontSize: "13px" } : s;
        }
        if (helperSt(c.companyName)) {
          const s = helperSt(c.companyName)!;
          styles.propertyName =
            s.fontSize === "20px" ? { ...s, fontSize: "11px" } : s;
        }
        if (helperSt(c.emailLink)) {
          const s = helperSt(c.emailLink)!;
          styles.email = s.fontSize === "20px" ? { ...s, fontSize: "11px" } : s;
        }
        if (helperSt(c.offeredAtPrice)) {
          const s = helperSt(c.offeredAtPrice)!;
          styles.amount =
            s.fontSize === "36px" ? { ...s, fontSize: "14px" } : s;
        }
        if (helperSt(c.propertyNotesTitle)) {
          const s = helperSt(c.propertyNotesTitle)!;
          styles.roadName =
            s.fontSize === "28px" ? { ...s, fontSize: "15px" } : s;
        }
        if (helperSt(c.propertyNotesDescription)) {
          const s = helperSt(c.propertyNotesDescription)!;
          styles.description =
            s.fontSize === "28px" ? { ...s, fontSize: "10px" } : s;
        }

        if (helperSt(od.number) || helperSt(od.phone)) {
          const numStyle = helperSt(od.number) || helperSt(od.phone);
          if (numStyle) {
            styles.number = numStyle;
          }
        }

        setFieldStyles(styles);
      },
    }));

    // ── 14. Image Slot Renderer Helper ────────────────────────────────────────
    const renderImageSlot = (
      key: string,
      placeholderText: string,
      containerClassName: string,
      slotType: "image" | "logo" | "floorplan" = "image",
    ) => {
      const inputRef = getFileInputRef(key);
      const hasImage = !!images[key];
      const isLogo = slotType === "logo";
      const isFloorplan = slotType === "floorplan";

      return (
        <div
          data-image-slot="true"
          {...(isLogo
            ? {
                "data-slot-type": "logo",
                "data-logo-slot": "true",
                id: "agentLogo",
              }
            : {})}
          className={`relative overflow-hidden group select-none ${
            isLogo
              ? images[key]
                ? "bg-transparent"
                : "border-2 border-white shadow-md bg-white"
              : isFloorplan
                ? "bg-transparent shadow-none border-none"
                : "shadow-[4px_4px_6px_rgba(0,0,0,0.4)]"
          } ${containerClassName}`}
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

                  {/* Zoom Controls (Bottom Left, NO data-html2canvas-ignore) */}
                  <div
                    className={`absolute ${
                      isFloorplan ? "bottom-28 left-4" : "bottom-2 left-2"
                    } flex gap-1.5 z-30 ${
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

                  {/* Rotate Button */}
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

                  {/* Edit Button */}
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

                  {/* Delete Button */}
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
              )
            ) : (
              <div
                data-html2canvas-ignore="true"
                onClick={(e) => openImageSourceModal(key, e)}
                className={`w-full h-full flex items-center justify-center cursor-pointer p-2 text-center text-xs font-medium transition-colors ${
                  isLogo
                    ? "text-gray-400 hover:bg-gray-100"
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

        {/* ── PAGE 1 CONTAINER 1 (Outer Bleed Wrapper) ────────────────────── */}
        <div
          className="pdf-page bg-[#8B0000] shadow-xl relative overflow-hidden flex flex-col font-sans"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          {/* Full-bleed background SVG curve across bottom of sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 w-full z-0 pointer-events-none flex flex-col justify-end"
            style={{ height: "185px" }}
          >
            <svg
              viewBox="0 0 1313 289"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              <g opacity="0.35">
                <path
                  d="M1313 76.38C1313 76.38 1026.29 191.58 578.91 55.42C131.52 -80.74 0 95.95 0 95.95V289H1313Z"
                  fill="white"
                />
              </g>
              <path
                d="M1313 122.01C1313 122.01 1020.55 230.97 579.17 77.83C137.79 -75.3 0 101.39 0 101.39V289H1313Z"
                fill="white"
              />
            </svg>
          </div>

          {/* ── PAGE 1 CONTAINER 2 (SafeZoneWrapper) ──────────────────────── */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            {/* ── PAGE 1 CONTAINER 3 (Inner Content Container) ────────────── */}
            <div
              data-safezone-container="true"
              className="relative w-full h-full flex flex-col justify-between z-10"
            >
              {/* Top Hero Photo Container (Image 1) */}
              <div
                className="relative shrink-0"
                style={{
                  marginTop: showBleed ? "-0.375in" : "-0.25in",
                  marginLeft: showBleed ? "-0.375in" : "-0.25in",
                  marginRight: showBleed ? "-0.375in" : "-0.25in",
                  width: showBleed
                    ? "calc(100% + 0.75in)"
                    : "calc(100% + 0.5in)",
                  height: "470px",
                }}
              >
                {renderImageSlot(
                  "image1",
                  "Select Main Hero Photo (Image 1)",
                  "w-full h-full",
                )}

                {/* Address Overlay Header at Top Center of Hero Image (Full Width till Safe Zone) */}
                <div
                  className="absolute top-6 z-20 pointer-events-auto flex flex-col items-center drop-shadow-md"
                  style={{
                    left: showBleed ? "0.375in" : "0.25in",
                    right: showBleed ? "0.375in" : "0.25in",
                    width: showBleed
                      ? "calc(100% - 0.75in)"
                      : "calc(100% - 0.5in)",
                  }}
                >
                  <div
                    data-drag-container="true"
                    data-section-container="true"
                    data-safezone-container="true"
                    className={`w-full flex flex-col items-center justify-center relative py-1.5 px-4 border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
                      lockedSections.header
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Header Section Lock Toggle */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("header");
                      }}
                      className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    {/* Top Address Line: # mlsNumber Number addressCode Road */}
                    <div
                      className="flex items-center justify-center text-[#8B0000] text-[42px] leading-none font-normal flex-nowrap shrink-0 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]"
                      style={{ fontFamily: "'BickhamScript', cursive" }}
                    >
                      {!isFieldDeleted("mlsNumberTop") && (
                        <DraggableBox
                          id="mlsNumberTop"
                          position={fieldPositions.mlsNumberTop}
                          onPositionChange={updateFieldPosition}
                          label="MLS / Code"
                          zoom={0.85}
                          disabled={lockedSections.header}
                          containerClassName="w-auto inline-flex items-center shrink-0"
                          className="w-auto inline-flex items-center"
                          onDelete={() =>
                            removeStandardField(
                              "mlsNumberTop",
                              "MLS / Code",
                              mlsNumber,
                              "Header",
                              fieldStyles.mlsNumberTop,
                            )
                          }
                          deleteTitle="Remove MLS Number"
                        >
                          <div className="flex items-center whitespace-nowrap">
                            <span
                              className="text-[28px] mt-[4px] mr-1 select-none font-bold"
                              style={{ fontFamily: "'BickhamScript', cursive" }}
                            >
                              #
                            </span>
                            <StyledInput
                              value={mlsNumber}
                              onChange={(e) => setMlsNumber(e.target.value)}
                              inputStyle={fieldStyles.mlsNumberTop}
                              onChangeStyle={(s) =>
                                updateFieldStyle("mlsNumberTop", s)
                              }
                              className="font-normal text-[42px] h-[48px] w-[180px] bg-transparent text-[#8B0000] focus:outline-none border-none placeholder-[#8B0000]/90 text-right whitespace-nowrap"
                              placeholder="000-0000"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("roadLabelBefore") && (
                        <DraggableBox
                          id="roadLabelBefore"
                          position={fieldPositions.roadLabelBefore}
                          onPositionChange={updateFieldPosition}
                          label="Number Label"
                          zoom={0.85}
                          disabled={lockedSections.header}
                          containerClassName="w-auto inline-flex items-center shrink-0"
                          className="w-auto inline-flex items-center"
                          onDelete={() =>
                            removeStandardField(
                              "roadLabelBefore",
                              "Number Label",
                              roadLabelBefore,
                              "Header",
                              fieldStyles.roadLabelBefore,
                            )
                          }
                          deleteTitle="Remove Number Label"
                        >
                          <StyledInput
                            value={roadLabelBefore}
                            onChange={(e) => setRoadLabelBefore(e.target.value)}
                            inputStyle={fieldStyles.roadLabelBefore}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadLabelBefore", s)
                            }
                            className="font-normal text-[42px] h-[48px] bg-transparent text-[#8B0000] ml-2 focus:outline-none border-none placeholder-[#8B0000]/90 whitespace-nowrap"
                            placeholder="Number"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("addressCode") && (
                        <DraggableBox
                          id="addressCode"
                          position={fieldPositions.addressCode}
                          onPositionChange={updateFieldPosition}
                          label="Unit #"
                          zoom={0.85}
                          disabled={lockedSections.header}
                          containerClassName="w-auto inline-flex items-center shrink-0"
                          className="w-auto inline-flex items-center"
                          onDelete={() =>
                            removeStandardField(
                              "addressCode",
                              "Unit #",
                              addressCode,
                              "Header",
                              fieldStyles.addressCode,
                            )
                          }
                          deleteTitle="Remove Unit #"
                        >
                          <StyledInput
                            value={addressCode}
                            onChange={(e) => setAddressCode(e.target.value)}
                            inputStyle={fieldStyles.addressCode}
                            onChangeStyle={(s) =>
                              updateFieldStyle("addressCode", s)
                            }
                            className="font-normal text-[42px] h-[48px] w-[50px] bg-transparent text-[#8B0000] text-center ml-1 focus:outline-none border-none placeholder-[#8B0000]/90 whitespace-nowrap"
                            placeholder="0"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("roadLabelAfter") && (
                        <DraggableBox
                          id="roadLabelAfter"
                          position={fieldPositions.roadLabelAfter}
                          onPositionChange={updateFieldPosition}
                          label="Road Label"
                          zoom={0.85}
                          disabled={lockedSections.header}
                          containerClassName="w-auto inline-flex items-center shrink-0"
                          className="w-auto inline-flex items-center"
                          onDelete={() =>
                            removeStandardField(
                              "roadLabelAfter",
                              "Road Label",
                              roadLabelAfter,
                              "Header",
                              fieldStyles.roadLabelAfter,
                            )
                          }
                          deleteTitle="Remove Road Label"
                        >
                          <StyledInput
                            value={roadLabelAfter}
                            onChange={(e) => setRoadLabelAfter(e.target.value)}
                            inputStyle={fieldStyles.roadLabelAfter}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadLabelAfter", s)
                            }
                            className="font-normal text-[42px] h-[48px] bg-transparent text-[#8B0000] ml-1 focus:outline-none border-none placeholder-[#8B0000]/90 whitespace-nowrap"
                            placeholder="Road"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </DraggableBox>
                      )}
                    </div>

                    {/* Road Name (Street Address) */}
                    {!isFieldDeleted("roadName") && (
                      <DraggableBox
                        id="roadName"
                        position={fieldPositions.roadName}
                        onPositionChange={updateFieldPosition}
                        label="Street Address"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        containerClassName="w-auto flex justify-center shrink-0"
                        className="w-auto flex justify-center"
                        onDelete={() =>
                          removeStandardField(
                            "roadName",
                            "Street Address",
                            roadName,
                            "Header",
                            fieldStyles.roadName,
                          )
                        }
                        deleteTitle="Remove Street Address"
                      >
                        <StyledInput
                          value={roadName}
                          onChange={(e) => setRoadName(e.target.value)}
                          inputStyle={fieldStyles.roadName}
                          onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                          className="font-sans font-semibold text-[16px] h-[24px] mt-0.5 bg-transparent text-gray-900 tracking-[0.16em] uppercase focus:outline-none border-none placeholder-gray-700/80 text-center w-[480px] whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
                          placeholder="BRIGHOUSE SOUTH, RICHMOND"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    {/* City / Province Line */}
                    {!isFieldDeleted("cityLine") && cityLine && (
                      <DraggableBox
                        id="cityLine"
                        position={fieldPositions.cityLine}
                        onPositionChange={updateFieldPosition}
                        label="City / Subtitle"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        containerClassName="w-auto flex justify-center shrink-0"
                        className="w-auto flex justify-center"
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
                          value={cityLine}
                          onChange={(e) => setCityLine(e.target.value)}
                          inputStyle={fieldStyles.cityLine}
                          onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                          className="font-sans font-normal text-[12px] h-[18px] bg-transparent text-gray-800/90 tracking-widest uppercase focus:outline-none border-none placeholder-gray-700/80 text-center w-[350px] whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
                          placeholder="CITY, PROVINCE"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}
                  </div>
                </div>
              </div>

              {/* Red Separator Bar */}
              <div
                className="h-[4px] bg-[#8B0000] z-10 shrink-0"
                style={{
                  marginLeft: showBleed ? "-0.375in" : "-0.25in",
                  marginRight: showBleed ? "-0.375in" : "-0.25in",
                  width: showBleed
                    ? "calc(100% + 0.75in)"
                    : "calc(100% + 0.5in)",
                }}
              />

              {/* Horizontal Row of 4 Photos (Image 2, 3, 4, 5) */}
              <div
                className="grid grid-cols-4 border-b-4 border-[#8B0000] shrink-0 bg-white"
                style={{
                  marginLeft: showBleed ? "-0.375in" : "-0.25in",
                  marginRight: showBleed ? "-0.375in" : "-0.25in",
                  width: showBleed
                    ? "calc(100% + 0.75in)"
                    : "calc(100% + 0.5in)",
                  height: "125px",
                }}
              >
                {renderImageSlot(
                  "image2",
                  "Photo 2",
                  "w-full h-full border-r-2 border-[#8B0000]",
                )}
                {renderImageSlot(
                  "image3",
                  "Photo 3",
                  "w-full h-full border-r-2 border-[#8B0000]",
                )}
                {renderImageSlot(
                  "image4",
                  "Photo 4",
                  "w-full h-full border-r-2 border-[#8B0000]",
                )}
                {renderImageSlot("image5", "Photo 5", "w-full h-full")}
              </div>

              {/* Main Feature Info Section */}
              <div className="flex-1 bg-transparent text-white pt-3 pb-4 flex flex-col justify-start relative z-10">
                {/* Specs Summary Line Section */}
                <div
                  data-safezone-container="true"
                  className={`flex items-center justify-between w-full text-[14px] font-bold uppercase tracking-wider text-center text-white pb-3 mb-2 border-b border-white/20 relative rounded-lg border-[3.5px] border-solid  transition-all duration-150 group/sec ${
                    lockedSections.specs
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  {/* Specs Lock Toggle */}
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("specs");
                    }}
                    className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.specs
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                    title={
                      lockedSections.specs
                        ? "Unlock Specs Section"
                        : "Lock Specs Section"
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

                  {/* Bedroom Spec */}
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
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <StyledInput
                          value={bedroom}
                          onChange={(e) => setBedroom(e.target.value)}
                          inputStyle={fieldStyles.bedroom}
                          onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                          className="font-bold text-[14px] text-white w-[18px] text-right bg-transparent focus:outline-none border-none placeholder-white whitespace-nowrap"
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
                          className="font-bold text-[14px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                          placeholder="BEDROOM"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}

                  <span className="select-none">•</span>

                  {/* Bathroom Spec */}
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
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <StyledInput
                          value={bathroom}
                          onChange={(e) => setBathroom(e.target.value)}
                          inputStyle={fieldStyles.bathroom}
                          onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                          className="font-bold text-[14px] text-white w-[18px] text-right bg-transparent focus:outline-none border-none placeholder-white whitespace-nowrap"
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
                          className="font-bold text-[14px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                          placeholder="BATHROOM"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}

                  <span className="select-none">•</span>

                  {/* Square Footage Spec */}
                  {!isFieldDeleted("specSqft") && (
                    <DraggableBox
                      id="specSqft"
                      position={fieldPositions.specSqft}
                      onPositionChange={updateFieldPosition}
                      label="Square Feet"
                      zoom={0.85}
                      disabled={lockedSections.specs}
                      containerClassName="w-auto inline-flex items-center shrink-0"
                      className="w-auto inline-flex items-center"
                      onDelete={() =>
                        removeStandardField(
                          "specSqft",
                          "Square Feet",
                          sqft,
                          "Specs",
                          fieldStyles.sqft,
                        )
                      }
                      deleteTitle="Remove Square Feet"
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <StyledInput
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          inputStyle={fieldStyles.sqft}
                          onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                          className="font-bold text-[14px] text-white w-[45px] text-right bg-transparent focus:outline-none border-none placeholder-white whitespace-nowrap"
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
                          className="font-bold text-[14px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                          placeholder="SQ FT"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}

                  <span className="select-none">•</span>

                  {/* Built Year Spec */}
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
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <StyledInput
                          value={builtYearLabel}
                          onChange={(e) => setBuiltYearLabel(e.target.value)}
                          inputStyle={fieldStyles.builtYearLabel}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYearLabel", s)
                          }
                          className="font-bold text-[14px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                          placeholder="BUILT IN"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={builtYear}
                          onChange={(e) => setBuiltYear(e.target.value)}
                          inputStyle={fieldStyles.builtYear}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYear", s)
                          }
                          className="font-bold text-[14px] text-white w-[42px] text-left bg-transparent focus:outline-none border-none placeholder-white whitespace-nowrap"
                          placeholder="0000"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}

                  <span className="select-none">•</span>

                  {/* Price Spec */}
                  {!isFieldDeleted("priceAmount") && (
                    <DraggableBox
                      id="priceAmount"
                      position={fieldPositions.priceAmount}
                      onPositionChange={updateFieldPosition}
                      label="Price"
                      zoom={0.85}
                      disabled={lockedSections.specs}
                      containerClassName="w-auto inline-flex items-center shrink-0"
                      className="w-auto inline-flex items-center"
                      onDelete={() =>
                        removeStandardField(
                          "priceAmount",
                          "Price",
                          amount,
                          "Specs",
                          fieldStyles.amount,
                        )
                      }
                      deleteTitle="Remove Price"
                    >
                      <StyledInput
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputStyle={fieldStyles.amount}
                        onChangeStyle={(s) => updateFieldStyle("amount", s)}
                        className="font-bold text-[14px] text-white w-[100px] text-left bg-transparent focus:outline-none border-none placeholder-white whitespace-nowrap"
                        placeholder="$000,000"
                        wrapperClassName="w-auto shrink-0"
                      />
                    </DraggableBox>
                  )}
                </div>

                {/* 2-Section Content Details (Description 50% & Specs/Details 50%) */}
                <div className="grid grid-cols-12 gap-5 text-white h-[280px] max-h-[280px]">
                  {/* Description Column (Left 50%) */}
                  <div
                    data-drag-container="true"
                    data-section-container="true"
                    className={`col-span-6 h-[280px] max-h-[280px] overflow-hidden flex flex-col relative rounded-lg border-[3.5px] border-solid border-transparent p-1 transition-all duration-150 group/sec ${
                      lockedSections.description
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Description Lock Toggle */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("description");
                      }}
                      className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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
                        label="Description"
                        zoom={0.85}
                        disabled={lockedSections.description}
                        containerClassName="w-full h-auto flex flex-col"
                        className="w-full h-auto flex flex-col"
                        onDelete={() =>
                          removeStandardField(
                            "propertyDescription",
                            "Description",
                            description,
                            "Content",
                            fieldStyles.description,
                          )
                        }
                        deleteTitle="Remove Description"
                      >
                        <StyledInput
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          inputStyle={fieldStyles.description}
                          onChangeStyle={(s) =>
                            updateFieldStyle("description", s)
                          }
                          className="text-[10px] text-white/95 leading-tight italic text-justify bg-transparent w-full focus:outline-none border-none placeholder-white/80"
                          placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South West providing unhindered privacy..."
                          wrapperClassName="h-auto"
                        />
                      </DraggableBox>
                    )}
                  </div>

                  {/* Specs & Features Columns Container (Right 50%) */}
                  <div
                    data-drag-container="true"
                    data-section-container="true"
                    className={`col-span-6 h-[280px] max-h-[280px] overflow-hidden grid grid-cols-2 gap-4 relative rounded-lg border-[3.5px] border-solid border-transparent p-1 transition-all duration-150 group/sec ${
                      lockedSections.details
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Details Lock Toggle */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("details");
                      }}
                      className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.details
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
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

                    {/* Specs Column 1 */}
                    <div className="flex flex-col gap-1.5 justify-start">
                      {!isFieldDeleted("byLawRestrictions") && (
                        <DraggableBox
                          id="byLawRestrictions"
                          position={fieldPositions.byLawRestrictions}
                          onPositionChange={updateFieldPosition}
                          label="By-law Restrictions"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full h-auto flex flex-col"
                          className="w-full h-auto flex flex-col"
                          onDelete={() =>
                            removeStandardField(
                              "byLawRestrictions",
                              "By-law Restrictions",
                              byLawRestrictions,
                              "Specs 1",
                              fieldStyles.byLawRestrictions,
                            )
                          }
                          deleteTitle="Remove By-law Restrictions"
                        >
                          <div>
                            <StyledInput
                              value={byLawLabel}
                              onChange={(e) => setByLawLabel(e.target.value)}
                              inputStyle={fieldStyles.byLawLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawLabel", s)
                              }
                              className="font-bold uppercase block text-[12px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="BY-LAW RESTRICTIONS:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={byLawRestrictions}
                              onChange={(e) =>
                                setByLawRestrictions(e.target.value)
                              }
                              inputStyle={fieldStyles.byLawRestrictions}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawRestrictions", s)
                              }
                              className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
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
                          label="Maint. Fees"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full h-auto flex flex-col"
                          className="w-full h-auto flex flex-col"
                          onDelete={() =>
                            removeStandardField(
                              "maintenanceFees",
                              "Maint. Fees",
                              maintenanceFees,
                              "Specs 1",
                              fieldStyles.maintenanceFees,
                            )
                          }
                          deleteTitle="Remove Maint. Fees"
                        >
                          <div>
                            <StyledInput
                              value={maintFeesLabel}
                              onChange={(e) =>
                                setMaintFeesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.maintFeesLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesLabel", s)
                              }
                              className="font-bold uppercase block text-[12px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="MAINT. FEES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={maintenanceFees}
                              onChange={(e) =>
                                setMaintenanceFees(e.target.value)
                              }
                              inputStyle={fieldStyles.maintenanceFees}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintenanceFees", s)
                              }
                              className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
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
                          label="Maint. Fees Include"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full h-auto flex flex-col"
                          className="w-full h-auto flex flex-col"
                          onDelete={() =>
                            removeStandardField(
                              "maintenanceFeesInclude",
                              "Maint. Fees Include",
                              maintenanceFeesInclude,
                              "Specs 1",
                              fieldStyles.maintenanceFeesInclude,
                            )
                          }
                          deleteTitle="Remove Maint. Fees Include"
                        >
                          <div>
                            <StyledInput
                              value={maintFeesIncludeLabel}
                              onChange={(e) =>
                                setMaintFeesIncludeLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.maintFeesIncludeLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesIncludeLabel", s)
                              }
                              className="font-bold uppercase block text-[12px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="MAINT. FEES INCLUDE:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={maintenanceFeesInclude}
                              onChange={(e) =>
                                setMaintenanceFeesInclude(e.target.value)
                              }
                              inputStyle={fieldStyles.maintenanceFeesInclude}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintenanceFeesInclude", s)
                              }
                              className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
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
                          containerClassName="w-full h-auto flex flex-col"
                          className="w-full h-auto flex flex-col"
                          onDelete={() =>
                            removeStandardField(
                              "featuresIncluded",
                              "Features Included",
                              featuresIncluded,
                              "Specs 1",
                              fieldStyles.featuresIncluded,
                            )
                          }
                          deleteTitle="Remove Features Included"
                        >
                          <div>
                            <StyledInput
                              value={featuresIncludedLabel}
                              onChange={(e) =>
                                setFeaturesIncludedLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.featuresIncludedLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncludedLabel", s)
                              }
                              className="font-bold uppercase block text-[12px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="FEATURES INCLUDED:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={featuresIncluded}
                              onChange={(e) =>
                                setFeaturesIncluded(e.target.value)
                              }
                              inputStyle={fieldStyles.featuresIncluded}
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncluded", s)
                              }
                              className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                              placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>

                    {/* Specs Column 2 */}
                    <div className="flex flex-col gap-1.5 justify-start">
                      {!isFieldDeleted("siteInfluences") && (
                        <DraggableBox
                          id="siteInfluences"
                          position={fieldPositions.siteInfluences}
                          onPositionChange={updateFieldPosition}
                          label="Site Influences"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          containerClassName="w-full h-auto flex flex-col"
                          className="w-full h-auto flex flex-col"
                          onDelete={() =>
                            removeStandardField(
                              "siteInfluences",
                              "Site Influences",
                              siteInfluences,
                              "Specs 2",
                              fieldStyles.siteInfluences,
                            )
                          }
                          deleteTitle="Remove Site Influences"
                        >
                          <div>
                            <StyledInput
                              value={siteInfluencesLabel}
                              onChange={(e) =>
                                setSiteInfluencesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.siteInfluencesLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluencesLabel", s)
                              }
                              className="font-bold uppercase block text-[12px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="SITE INFLUENCES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={siteInfluences}
                              onChange={(e) =>
                                setSiteInfluences(e.target.value)
                              }
                              inputStyle={fieldStyles.siteInfluences}
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluences", s)
                              }
                              className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
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
                          containerClassName="w-full h-auto flex flex-col"
                          className="w-full h-auto flex flex-col"
                          onDelete={() =>
                            removeStandardField(
                              "amenities",
                              "Amenities",
                              amenities,
                              "Specs 2",
                              fieldStyles.amenities,
                            )
                          }
                          deleteTitle="Remove Amenities"
                        >
                          <div>
                            <StyledInput
                              value={amenitiesLabel}
                              onChange={(e) =>
                                setAmenitiesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles.amenitiesLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenitiesLabel", s)
                              }
                              className="font-bold uppercase block text-[12px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="AMENITIES:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={amenities}
                              onChange={(e) => setAmenities(e.target.value)}
                              inputStyle={fieldStyles.amenities}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenities", s)
                              }
                              className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
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
                          containerClassName="w-full h-auto flex flex-col"
                          className="w-full h-auto flex flex-col"
                          onDelete={() =>
                            removeStandardField(
                              "view",
                              "View",
                              view,
                              "Specs 2",
                              fieldStyles.view,
                            )
                          }
                          deleteTitle="Remove View"
                        >
                          <div>
                            <StyledInput
                              value={viewLabel}
                              onChange={(e) => setViewLabel(e.target.value)}
                              inputStyle={fieldStyles.viewLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("viewLabel", s)
                              }
                              className="font-bold uppercase block text-[12px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="VIEW:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={view}
                              onChange={(e) => setView(e.target.value)}
                              inputStyle={fieldStyles.view}
                              onChangeStyle={(s) => updateFieldStyle("view", s)}
                              className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
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
                          disabled={lockedSections.details}
                          containerClassName="w-auto h-auto inline-flex items-center shrink-0 mt-1"
                          className="w-auto h-auto inline-flex items-center"
                          onDelete={() =>
                            removeStandardField(
                              "mlsNumber",
                              "MLS #",
                              mlsNumber,
                              "Specs 2",
                              fieldStyles.mlsNumber,
                            )
                          }
                          deleteTitle="Remove MLS #"
                        >
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <StyledInput
                              value={mlsLabel}
                              onChange={(e) => setMlsLabel(e.target.value)}
                              inputStyle={fieldStyles.mlsLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("mlsLabel", s)
                              }
                              className="font-bold uppercase text-[12px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="MLS #"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={mlsNumber}
                              onChange={(e) => setMlsNumber(e.target.value)}
                              inputStyle={fieldStyles.mlsNumber}
                              onChangeStyle={(s) =>
                                updateFieldStyle("mlsNumber", s)
                              }
                              className="font-bold text-left text-[12px] text-white bg-transparent focus:outline-none border-none placeholder-white whitespace-nowrap"
                              placeholder="000000"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Contact Card & Logo Overlay (Fixed at bottom inside Safe Zone) */}
              <div
                data-safezone-container="true"
                className={`absolute bottom-0 left-0 right-0 z-20 px-8 pb-2 pt-1 flex justify-between items-end pointer-events-auto w-full border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
                  lockedSections.contact
                    ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                    : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                }`}
              >
                {/* Contact Section Lock Toggle */}
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionLock("contact");
                  }}
                  className={`absolute top-1 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                    lockedSections.contact
                      ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                      : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                  }`}
                  title={
                    lockedSections.contact
                      ? "Unlock Contact Section"
                      : "Lock Contact Section"
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

                {/* Left: Contact Info */}
                <div className="flex flex-col gap-0.5 text-gray-900">
                  {!isFieldDeleted("contactName") && (
                    <DraggableBox
                      id="contactName"
                      position={fieldPositions.contactName}
                      onPositionChange={updateFieldPosition}
                      label="Agent Name"
                      zoom={0.85}
                      disabled={lockedSections.contact}
                      containerClassName="w-auto inline-flex items-baseline shrink-0"
                      className="w-auto inline-flex items-baseline"
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
                      <div className="flex items-baseline gap-1 text-[13px] whitespace-nowrap">
                        <StyledInput
                          value={contactLabel}
                          onChange={(e) => setContactLabel(e.target.value)}
                          inputStyle={fieldStyles.contactLabel}
                          onChangeStyle={(s) =>
                            updateFieldStyle("contactLabel", s)
                          }
                          className="font-bold text-gray-800 bg-transparent focus:outline-none border-none whitespace-nowrap"
                          placeholder="CONTACT:"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          inputStyle={fieldStyles.fullName}
                          onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                          className="font-bold text-left text-[13px] text-gray-900 h-[18px] w-[260px] bg-transparent focus:outline-none border-none uppercase placeholder-gray-800 whitespace-nowrap"
                          placeholder="FIRSTNAME LASTNAME"
                          wrapperClassName="w-auto shrink-0"
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
                      containerClassName="w-auto inline-flex items-center shrink-0"
                      className="w-auto inline-flex items-center"
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
                        value={propertyName}
                        onChange={(e) => setPropertyName(e.target.value)}
                        inputStyle={fieldStyles.propertyName}
                        onChangeStyle={(s) =>
                          updateFieldStyle("propertyName", s)
                        }
                        className="font-normal text-left text-[11px] text-gray-800 h-[16px] w-[260px] bg-transparent focus:outline-none border-none uppercase placeholder-gray-700 whitespace-nowrap"
                        placeholder="MACDONALD REALTY"
                        wrapperClassName="w-auto shrink-0"
                      />
                    </DraggableBox>
                  )}

                  <div className="flex items-center gap-3 text-[10.5px] text-gray-900">
                    {!isFieldDeleted("contactPhone") && (
                      <DraggableBox
                        id="contactPhone"
                        position={fieldPositions.contactPhone}
                        onPositionChange={updateFieldPosition}
                        label="Phone"
                        zoom={0.85}
                        disabled={lockedSections.contact}
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
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
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <StyledInput
                            value={phoneLabel}
                            onChange={(e) => setPhoneLabel(e.target.value)}
                            inputStyle={fieldStyles.phoneLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("phoneLabel", s)
                            }
                            className="font-bold bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="PHONE:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            inputStyle={fieldStyles.number}
                            onChangeStyle={(s) => updateFieldStyle("number", s)}
                            className="font-normal text-left text-[11px] text-gray-900 h-[16px] w-[110px] bg-transparent focus:outline-none border-none placeholder-gray-800 whitespace-nowrap"
                            placeholder="604000.0000"
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
                        containerClassName="w-auto inline-flex items-center shrink-0"
                        className="w-auto inline-flex items-center"
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
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <StyledInput
                            value={emailLabel}
                            onChange={(e) => setEmailLabel(e.target.value)}
                            inputStyle={fieldStyles.emailLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("emailLabel", s)
                            }
                            className="font-bold bg-transparent focus:outline-none border-none whitespace-nowrap"
                            placeholder="EMAIL:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputStyle={fieldStyles.email}
                            onChangeStyle={(s) => updateFieldStyle("email", s)}
                            className="font-normal text-[11px] text-left text-gray-900 h-[16px] w-[180px] bg-transparent focus:outline-none border-none uppercase placeholder-gray-800 whitespace-nowrap"
                            placeholder="FIRST@LAST.COM"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>

                  {/* Disclaimer Fine Print */}
                  {!isFieldDeleted("contactDisclaimer") && (
                    <DraggableBox
                      id="contactDisclaimer"
                      position={fieldPositions.contactDisclaimer}
                      onPositionChange={updateFieldPosition}
                      label="Disclaimer"
                      zoom={0.85}
                      disabled={lockedSections.contact}
                      containerClassName="w-auto flex items-center shrink-0 pt-1"
                      className="w-auto flex items-center"
                      onDelete={() =>
                        removeStandardField(
                          "contactDisclaimer",
                          "Disclaimer",
                          disclaimerText,
                          "Contact",
                          fieldStyles.disclaimerText,
                        )
                      }
                      deleteTitle="Remove Disclaimer"
                    >
                      <div className="flex items-center gap-1.5 text-[8px] text-gray-600 leading-tight">
                        <House className="w-3.5 h-3.5 shrink-0 text-gray-700" />
                        <p className="max-w-[500px] text-[8px] leading-tight text-gray-600 select-none">
                          {disclaimerText}
                        </p>
                      </div>
                    </DraggableBox>
                  )}
                </div>

                {/* Right: Agency Logo Card Overlay */}
                <div className="w-[160px] h-[75px] shrink-0 mb-1 z-30 overflow-hidden">
                  {renderImageSlot(
                    "image7",
                    "Select Logo",
                    "w-full h-full",
                    "logo",
                  )}
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

        {/* ── PAGE 2 CONTAINER 1 (Outer Bleed Wrapper) ────────────────────── */}
        <div
          className="pdf-page bg-[#8B0000] shadow-xl relative overflow-hidden flex flex-col font-sans"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          {/* Background SVG curve at bottom (Full Bleed across sheet end) */}
          <div
            className="absolute bottom-0 left-0 right-0 w-full z-20 pointer-events-none flex flex-col justify-end"
            style={{ height: "185px" }}
          >
            <svg
              viewBox="0 0 1313 289"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              <g opacity="0.35">
                <path
                  d="M1313 76.38C1313 76.38 1026.29 191.58 578.91 55.42C131.52 -80.74 0 95.95 0 95.95V289H1313Z"
                  fill="white"
                />
              </g>
              <path
                d="M1313 122.01C1313 122.01 1020.55 230.97 579.17 77.83C137.79 -75.3 0 101.39 0 101.39V289H1313Z"
                fill="white"
              />
            </svg>
          </div>

          {/* ── PAGE 2 CONTAINER 2 (SafeZoneWrapper) ──────────────────────── */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            {/* ── PAGE 2 CONTAINER 3 (Inner Content Container) ────────────── */}
            <div
              data-safezone-container="true"
              className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden"
            >
              {/* Floor Plan Image Slot (Image 6) */}
              <div className="w-full flex-1 min-h-0 flex flex-col">
                {renderImageSlot(
                  "image6",
                  "Select Floor Plan Image (Image 6)",
                  "w-full h-full flex-1",
                  "floorplan",
                )}
              </div>

              {/* Bottom Page 2 Footer Banner */}
              <div
                data-safezone-container="true"
                className={`w-full flex justify-center items-center pb-[10px] pt-1 z-30 relative rounded-lg border-[3.5px] border-solid border-transparent transition-all duration-150 group/sec shrink-0 ${
                  lockedSections.footer
                    ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                    : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                }`}
              >
                {/* Footer Section Lock Toggle */}
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionLock("footer");
                  }}
                  className={`absolute -top-3 right-4 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                    lockedSections.footer
                      ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                      : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                  }`}
                  title={
                    lockedSections.footer
                      ? "Unlock Footer Section"
                      : "Lock Footer Section"
                  }
                >
                  {lockedSections.footer ? (
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

                {!isFieldDeleted("footerText") && (
                  <DraggableBox
                    id="footerText"
                    position={fieldPositions.footerText}
                    onPositionChange={updateFieldPosition}
                    label="Footer Banner"
                    zoom={0.85}
                    disabled={lockedSections.footer}
                    containerClassName="w-auto inline-flex items-center shrink-0"
                    className="w-auto inline-flex items-center"
                    onDelete={() =>
                      removeStandardField(
                        "footerText",
                        "Footer Banner",
                        footerText,
                        "Page 2 Footer",
                        fieldStyles.footerText,
                      )
                    }
                    deleteTitle="Remove Footer Banner"
                  >
                    <StyledInput
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      inputStyle={fieldStyles.footerText}
                      onChangeStyle={(s) => updateFieldStyle("footerText", s)}
                      className="text-center text-gray-900 text-[11px] font-bold tracking-wider bg-transparent focus:outline-none border-none whitespace-nowrap"
                      placeholder="DESIGNED AND PRINTED BY BC FLOOR PLANS"
                      wrapperClassName="w-auto shrink-0"
                    />
                  </DraggableBox>
                )}
              </div>
            </div>
          </SafeZoneWrapper>
        </div>
      </div>
    );
  },
);

BcfpStandard22.displayName = "BcfpStandard22";

export default BcfpStandard22;
