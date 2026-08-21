import {
  House,
  Pencil,
  Trash,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock,
} from "lucide-react";
import ImageEditor from "./ImageEditor";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
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

export interface BcfpStandard13Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard13Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
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
// ──────────────────────────────────────────────────────────────────────────────

const BcfpStandard13 = forwardRef<BcfpStandard13Ref, BcfpStandard13Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── 1. Deletion & Restoration State ──────────────────────────────────────
    const [deletedDetailFields, setDeletedDetailFields] = useState<any[]>(
      formData?.deletedDetailFields || [],
    );
    const [deletedStandardFieldIds, setDeletedStandardFieldIds] = useState<
      string[]
    >(formData?.deletedStandardFieldIds || []);

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

    // Register restoration handlers with context
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

    // ── 2. Text Fields & Editable Labels ──────────────────────────────────────
    const [byLawRestrictions, setByLawRestrictions] = useState("");
    const [maintFees, setMaintFees] = useState("");
    const [maintFeesInclude, setMaintFeesInclude] = useState("");
    const [featuresIncluded, setFeaturesIncluded] = useState("");
    const [siteInfluences, setSiteInfluences] = useState("");
    const [amenities, setAmenities] = useState("");
    const [view, setView] = useState("");
    const [headline, setHeadline] = useState(
      "ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.",
    );
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

    // Editable Labels
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
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM |");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM |");
    const [sqftLabel, setSqftLabel] = useState("SQ FT |");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
    );

    // ── 3. Bleed & Guide ──────────────────────────────────────────────────────
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed =
      propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide =
      propShowGuide !== undefined ? propShowGuide : showGuideState;

    // ── 4. Styles, Positions & Locks ──────────────────────────────────────────
    const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>(
      {},
    );
    const updateFieldStyle = (field: string, style: TextStyle) =>
      setFieldStyles((prev) => ({ ...prev, [field]: style }));

    const [fieldPositions, setFieldPositions] = useState<
      Record<string, { x: number; y: number }>
    >({});
    const updateFieldPosition = (id: string, pos: { x: number; y: number }) => {
      setFieldPositions((prev) => ({ ...prev, [id]: pos }));
    };

    const [lockedSections, setLockedSections] = useState<
      Record<string, boolean>
    >({
      headerAddress: false,
      headerAddressPage2: false,
      price: false,
      specs: false,
      details: false,
      contact: false,
      headlineDesc: false,
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
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
    });

    const [scale, setScale] = useState({
      image1: 1,
      image2: 1,
      image3: 1,
      image4: 1,
      image5: 1,
      image6: 1,
      image7: 1,
    });

    const [position, setPosition] = useState({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
    });

    const [rotation, setRotation] = useState({
      image1: 0,
      image2: 0,
      image3: 0,
      image4: 0,
      image5: 0,
      image6: 0,
      image7: 0,
    });

    const [dragging, setDragging] = useState({
      image1: false,
      image2: false,
      image3: false,
      image4: false,
      image5: false,
      image6: false,
      image7: false,
    });

    const lastPosition = useRef({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
    });

    // ── 6. Modal & Slot States ────────────────────────────────────────────────
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

    // Click-outside clears activeSlot
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

    // Refs for file inputs
    const fileInputRef1 = useRef<HTMLInputElement | null>(null);
    const fileInputRef2 = useRef<HTMLInputElement | null>(null);
    const fileInputRef3 = useRef<HTMLInputElement | null>(null);
    const fileInputRef4 = useRef<HTMLInputElement | null>(null);
    const fileInputRef5 = useRef<HTMLInputElement | null>(null);
    const fileInputRef6 = useRef<HTMLInputElement | null>(null);
    const fileInputRef7 = useRef<HTMLInputElement | null>(null);

    // ── 7. Image Handlers ─────────────────────────────────────────────────────
    const handleImageChange = (
      key: keyof typeof images,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setImages((prev) => ({ ...prev, [key]: url }));
      }
    };

    const handleDelete = (
      key: keyof typeof images,
      ref: React.RefObject<HTMLInputElement | null>,
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (ref.current) ref.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        const bounded = Math.min(Math.max(newScale, 0.1), 5);
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
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      // Mouse drag delta divided by 0.85 (letter preview zoom)
      let dx = (e.clientX - lastPosition.current[key].x) / 0.85;
      let dy = (e.clientY - lastPosition.current[key].y) / 0.85;

      const currentRot = rotation[key] || 0;
      if (currentRot % 360 !== 0) {
        const angle = ((currentRot % 360) + 360) % 360;
        if (angle === 90) {
          const temp = dx;
          dx = dy;
          dy = -temp;
        } else if (angle === 180) {
          dx = -dx;
          dy = -dy;
        } else if (angle === 270) {
          const temp = dx;
          dx = -dy;
          dy = temp;
        }
      }

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
      setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    // ── 8. Context Sync & Mounting Effects ────────────────────────────────────
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
            setAddressCode(orderData.property.mls_number);
          if (orderData.property.suite) setRoadName(orderData.property.suite);

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
          if (agent.first_name || agent.last_name) {
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          }
          if (agent.email) setEmail(agent.email);
          if (agent.primary_phone) setNumber(agent.primary_phone);
          if (agent.company_name) setPropertyName(agent.company_name);
        }
      }

      if (formData) {
        if (formData.byLawRestrictions)
          setByLawRestrictions(formData.byLawRestrictions);
        if (formData.maintenanceFees) setMaintFees(formData.maintenanceFees);
        if (formData.maintenanceFeesInclude)
          setMaintFeesInclude(formData.maintenanceFeesInclude);
        if (formData.featuresIncluded)
          setFeaturesIncluded(formData.featuresIncluded);
        if (formData.siteInfluences) setSiteInfluences(formData.siteInfluences);
        if (formData.amenities) setAmenities(formData.amenities);
        if (formData.view) setView(formData.view);
        if (formData.headline) setHeadline(formData.headline);
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

        if (formData.images) {
          setImages((prev) => ({
            ...prev,
            ...(formData.images as typeof images),
          }));
        }
        if (formData.imageScales) {
          setScale((prev) => ({
            ...prev,
            ...(formData.imageScales as typeof scale),
          }));
        }
        if (formData.imagePositions) {
          setPosition((prev) => ({
            ...prev,
            ...(formData.imagePositions as typeof position),
          }));
        }
        if (formData.imageRotations) {
          setRotation((prev) => ({
            ...prev,
            ...(formData.imageRotations as typeof rotation),
          }));
        }
        if (formData.fieldPositions) {
          setFieldPositions(formData.fieldPositions);
        }
        if (formData.fieldStyles) {
          setFieldStyles(formData.fieldStyles);
        }
        if (formData.deletedDetailFields) {
          setDeletedDetailFields(formData.deletedDetailFields);
        }
        if (formData.deletedStandardFieldIds) {
          setDeletedStandardFieldIds(formData.deletedStandardFieldIds);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

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
        headline,
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
      headline,
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
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      fieldStyles,
      updateFormData,
    ]);

    // ── 9. Payload Export & Import Handlers ────────────────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard13",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#3A8D3D",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "28px",
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
              fontSize: fieldStyles.email?.fontSize || "11px",
            },
          },
          companyName: {
            value: propertyName,
            style: {
              ...fieldStyles.propertyName,
              fontSize: fieldStyles.propertyName?.fontSize || "12px",
            },
          },
          propertyNotesTitle: {
            value: roadName,
            style: {
              ...fieldStyles.roadName,
              fontSize: fieldStyles.roadName?.fontSize || "13px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "12px",
            },
          },
          expandedDetail1Title: "By-law Restrictions",
          expandedDetail1Description: byLawRestrictions,
          expandedDetail2Title: "Maint. Fees",
          expandedDetail2Description: maintFees,
          expandedDetail3Title: "Maint. Fees Include",
          expandedDetail3Description: maintFeesInclude,
          expandedDetail4Title: "Features Included",
          expandedDetail4Description: featuresIncluded,
          keyHighlightLabel: "Site Influences",
          keyHighlights: siteInfluences
            ? siteInfluences.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            headline,
            amenities,
            view,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            addressCode,
            cityLine,
            fieldPositions,
            _deletedDetailFields: deletedDetailFields,
            _deletedStandardFieldIds: deletedStandardFieldIds,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
          fieldPositions,
          fieldStyles,
        });
        payload.fieldPositions = fieldPositions;
        payload.fieldStyles = fieldStyles;
        return payload;
      },
      importFromPayload: (payload: FeatureSheetResponse) => {
        const state = featureSheetService.parsePayloadToState(payload);
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
          setMaintFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description)
          setMaintFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description)
          setFeaturesIncluded(state.expandedDetail4Description as string);

        if (state.keyHighlights)
          setSiteInfluences(state.keyHighlights.join("\n"));

        const rawOtherDetails =
          (payload.content?.otherDetails as Record<string, any>) || {};

        if (
          rawOtherDetails._deletedDetailFields &&
          Array.isArray(rawOtherDetails._deletedDetailFields)
        ) {
          setDeletedDetailFields(
            rawOtherDetails._deletedDetailFields as DeletedDetailFieldItem[],
          );
        }

        if (
          rawOtherDetails._deletedStandardFieldIds &&
          Array.isArray(rawOtherDetails._deletedStandardFieldIds)
        ) {
          setDeletedStandardFieldIds(
            rawOtherDetails._deletedStandardFieldIds as string[],
          );
        }

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.headline) setHeadline(details.headline as string);
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
        }

        if (state.images)
          setImages((prev) => ({
            ...prev,
            ...(state.images as unknown as typeof images),
          }));
        if (state.imageScales)
          setScale((prev) => ({
            ...prev,
            ...(state.imageScales as unknown as typeof scale),
          }));
        if (state.imagePositions)
          setPosition((prev) => ({
            ...prev,
            ...(state.imagePositions as unknown as typeof position),
          }));
        if (state.imageRotations)
          setRotation((prev) => ({
            ...prev,
            ...(state.imageRotations as unknown as typeof rotation),
          }));

        if (rawOtherDetails.fieldPositions) {
          setFieldPositions(
            rawOtherDetails.fieldPositions as Record<
              string,
              { x: number; y: number }
            >,
          );
        } else if (state.fieldPositions || payload.fieldPositions) {
          setFieldPositions(
            (state.fieldPositions || payload.fieldPositions) as Record<
              string,
              { x: number; y: number }
            >,
          );
        }

        if (state.fieldStyles)
          setFieldStyles(state.fieldStyles as Record<string, TextStyle>);
      },
    }));

    return (
      <>
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

        {/* Page 1 Divider */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* CONTAINER 1: Outer Page / Bleed Wrapper */}
        <div
          className="pdf-page shadow-xl relative overflow-hidden flex flex-col"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
            background:
              "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
          }}
        >
          {/* CONTAINER 2: SafeZoneWrapper */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            {/* CONTAINER 3: Inner Content Container */}
            <div className="w-full h-full flex flex-col justify-start gap-1 font-alexandria relative">
              {/* IMAGE 1 SLOT (Top Photo) & OVERLAY CARDS */}
              <div className="relative">
                {/* Image 1 Three-Layer Slot Container */}
                <div
                  data-image-slot="true"
                  className="relative overflow-hidden group cursor-pointer"
                  style={{
                    marginTop: showBleed ? "-0.375in" : "-0.25in",
                    marginLeft: showBleed ? "-0.375in" : "-0.25in",
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                    width: showBleed
                      ? "calc(100% + 0.75in)"
                      : "calc(100% + 0.5in)",
                    height: showBleed
                      ? "calc(450px + 0.375in)"
                      : "calc(450px + 0.25in)",
                  }}
                  onMouseEnter={() => setHoveredSlot("image1")}
                  onMouseLeave={() => setHoveredSlot(null)}
                  onClick={(e) => {
                    if (e.altKey) return;
                    e.stopPropagation();
                    setActiveSlot("image1");
                  }}
                >
                  <BoxIndicator isVisible={isSlotActive("image1")} />

                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image1", e)}
                    onMouseUp={() => handleMouseUp("image1")}
                    onMouseLeave={() => handleMouseLeave("image1")}
                  >
                    {images.image1 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image1", e)}
                        >
                          <ImageEditor
                            src={images.image1}
                            scale={scale.image1}
                            position={position.image1}
                            rotation={rotation.image1}
                          />
                        </div>

                        {/* Zoom Controls */}
                        <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image1", "in")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image1", "out")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        {/* Rotate Button */}
                        <button
                          type="button"
                          onClick={() => handleRotate("image1")}
                          className="absolute top-[45px] right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => openImageSourceModal("image1", e)}
                          className="absolute top-[45px] right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete("image1", fileInputRef1)}
                          className="absolute top-[45px] right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        data-html2canvas-ignore="true"
                        onClick={(e) => openImageSourceModal("image1", e)}
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
                      >
                        Select Image
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef1}
                      onChange={(e) => handleImageChange("image1", e)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Specs Bar Overlay (Bottom Right of Image 1) */}
                <div className="flex gap-2 absolute bottom-[100px] right-[0px] z-20">
                  <div
                    className="opacity-[25%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                  <div
                    className="opacity-[50%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                  <div
                    className="opacity-[75%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>

                  {/* Section Container for Specs Bar */}
                  <div
                    data-safezone-container="true"
                    className={`flex items-center px-5 pr-[64px] py-1 relative border-[3.5px] border-solid border-transparent rounded-none transition-all duration-150 group/sec ${
                      lockedSections.specs
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  >
                    {/* Section Lock Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("specs");
                      }}
                      className={`absolute -top-3 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    <DraggableBox
                      id="specsBar"
                      position={fieldPositions.specsBar}
                      onPositionChange={updateFieldPosition}
                      label="Property Specs Bar"
                      zoom={0.85}
                      disabled={lockedSections.specs}
                    >
                      <div className="font-bold items-center text-[14px] text-[#B3B394] flex flex-nowrap gap-2 whitespace-nowrap">
                        {!isFieldDeleted("specBedroom") && (
                          <DraggableBox
                            id="specBedroom"
                            position={fieldPositions.specBedroom}
                            onPositionChange={updateFieldPosition}
                            label="Bedroom"
                            zoom={0.85}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specBedroom",
                                "Bedroom",
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
                                inputStyle={fieldStyles["bedroom"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("bedroom", style)
                                }
                                className="font-semibold text-[13px] bg-transparent text-left w-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0"
                              />
                              <StyledInput
                                value={bedroomLabel}
                                onChange={(e) =>
                                  setBedroomLabel(e.target.value)
                                }
                                inputStyle={fieldStyles["bedroomLabel"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("bedroomLabel", style)
                                }
                                className="font-bold text-[14px] text-[#B3B394] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="BEDROOM |"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {!isFieldDeleted("specBathroom") && (
                          <DraggableBox
                            id="specBathroom"
                            position={fieldPositions.specBathroom}
                            onPositionChange={updateFieldPosition}
                            label="Bathroom"
                            zoom={0.85}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specBathroom",
                                "Bathroom",
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
                                inputStyle={fieldStyles["bathroom"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("bathroom", style)
                                }
                                className="font-semibold text-[13px] bg-transparent text-left w-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0"
                              />
                              <StyledInput
                                value={bathroomLabel}
                                onChange={(e) =>
                                  setBathroomLabel(e.target.value)
                                }
                                inputStyle={fieldStyles["bathroomLabel"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("bathroomLabel", style)
                                }
                                className="font-bold text-[14px] text-[#B3B394] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="BATHROOM |"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {!isFieldDeleted("specSqft") && (
                          <DraggableBox
                            id="specSqft"
                            position={fieldPositions.specSqft}
                            onPositionChange={updateFieldPosition}
                            label="Square Feet"
                            zoom={0.85}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specSqft",
                                "Square Feet",
                                sqft,
                                "Specs",
                                fieldStyles.sqft,
                              )
                            }
                            deleteTitle="Remove SqFt"
                          >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <StyledInput
                                value={sqft}
                                onChange={(e) => setSqft(e.target.value)}
                                inputStyle={fieldStyles["sqft"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("sqft", style)
                                }
                                className="font-semibold text-[13px] bg-transparent text-left w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="000"
                              />
                              <StyledInput
                                value={sqftLabel}
                                onChange={(e) => setSqftLabel(e.target.value)}
                                inputStyle={fieldStyles["sqftLabel"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("sqftLabel", style)
                                }
                                className="font-bold text-[14px] text-[#B3B394] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="SQ FT |"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {!isFieldDeleted("specBuiltYear") && (
                          <DraggableBox
                            id="specBuiltYear"
                            position={fieldPositions.specBuiltYear}
                            onPositionChange={updateFieldPosition}
                            label="Built Year"
                            zoom={0.85}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specBuiltYear",
                                "Built Year",
                                builtYear,
                                "Specs",
                                fieldStyles.builtYear,
                              )
                            }
                            deleteTitle="Remove Built Year"
                          >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <StyledInput
                                value={builtYearLabel}
                                onChange={(e) =>
                                  setBuiltYearLabel(e.target.value)
                                }
                                inputStyle={fieldStyles["builtYearLabel"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("builtYearLabel", style)
                                }
                                className="font-bold text-[14px] text-[#B3B394] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="BUILT IN"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                              <StyledInput
                                value={builtYear}
                                onChange={(e) => setBuiltYear(e.target.value)}
                                inputStyle={fieldStyles["builtYear"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("builtYear", style)
                                }
                                className="font-semibold text-[13px] bg-transparent text-left w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0000"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>
                    </DraggableBox>
                  </div>
                </div>

                {/* Floating Address & Price Card (Absolute Top Left over Image 1) */}
                <div
                  data-safezone-container="true"
                  className={`flex flex-col gap-1 absolute top-[30px] left-[50px] w-[160px] z-20 border-[3.5px] border-solid border-transparent rounded-lg p-1 transition-all duration-150 group/sec ${
                    lockedSections.headerAddress
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  {/* Section Lock Toggle */}
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("headerAddress");
                    }}
                    className={`absolute -top-3 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.headerAddress
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                    title={
                      lockedSections.headerAddress
                        ? "Unlock Header Address Section"
                        : "Lock Header Address Section"
                    }
                  >
                    {lockedSections.headerAddress ? (
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
                    id="headerAddress"
                    position={fieldPositions.headerAddress}
                    onPositionChange={updateFieldPosition}
                    label="Address & Price Card"
                    zoom={0.85}
                    disabled={lockedSections.headerAddress}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div
                        className="p-3 shadow-md rounded-sm"
                        style={{
                          background:
                            "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                        }}
                      >
                        {!isFieldDeleted("addressCode") && (
                          <DraggableBox
                            id="addressCode"
                            position={fieldPositions.addressCode}
                            onPositionChange={updateFieldPosition}
                            label="Unit Number"
                            zoom={0.85}
                            disabled={lockedSections.headerAddress}
                            onDelete={() =>
                              removeStandardField(
                                "addressCode",
                                "Unit Number",
                                addressCode,
                                "Header Address",
                                fieldStyles.addressCode,
                              )
                            }
                            deleteTitle="Remove Unit Number"
                          >
                            <div className="tracking-wide text-white mt-0 flex items-center">
                              <span className="mr-0.5">#</span>
                              <StyledInput
                                value={addressCode}
                                onChange={(e) => setAddressCode(e.target.value)}
                                inputStyle={fieldStyles["addressCode"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("addressCode", style)
                                }
                                className="font-light text-[18px] h-[24px] w-[120px] flex-1 leading-none mt-0 bg-transparent text-[#ffffff] text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200] whitespace-nowrap"
                                placeholder="0000-0000"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {!isFieldDeleted("roadName") && (
                          <DraggableBox
                            id="roadName"
                            position={fieldPositions.roadName}
                            onPositionChange={updateFieldPosition}
                            label="Street / Road"
                            zoom={0.85}
                            disabled={lockedSections.headerAddress}
                            onDelete={() =>
                              removeStandardField(
                                "roadName",
                                "Street / Road",
                                roadName,
                                "Header Address",
                                fieldStyles.roadName,
                              )
                            }
                            deleteTitle="Remove Street / Road"
                          >
                            <div className="text-[13px] mb-3 text-white font-bold leading-none mt-0 flex items-center justify-center whitespace-nowrap w-full">
                              <StyledInput
                                value={roadLabelBefore}
                                onChange={(e) =>
                                  setRoadLabelBefore(e.target.value)
                                }
                                inputStyle={fieldStyles["roadLabelBefore"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("roadLabelBefore", style)
                                }
                                className="font-bold text-[13px] bg-transparent text-white focus:outline-none border-none"
                                placeholder="Number"
                                wrapperClassName="w-auto"
                              />
                              <StyledInput
                                value={roadName}
                                onChange={(e) => setRoadName(e.target.value)}
                                inputStyle={fieldStyles["roadName"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("roadName", style)
                                }
                                className="font-light text-[13px] h-[16px] leading-[13px] p-0 mx-1 mt-[2px] bg-transparent text-[#ffffff] text-center flex-1 min-w-[20px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                                placeholder="0"
                              />
                              <StyledInput
                                value={roadLabelAfter}
                                onChange={(e) =>
                                  setRoadLabelAfter(e.target.value)
                                }
                                inputStyle={fieldStyles["roadLabelAfter"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("roadLabelAfter", style)
                                }
                                className="font-bold text-[13px] bg-transparent text-white focus:outline-none border-none"
                                placeholder="Road"
                                wrapperClassName="w-auto"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        <hr className="border-t-2 border-dotted border-white w-full" />

                        {!isFieldDeleted("cityLine") && (
                          <DraggableBox
                            id="cityLine"
                            position={fieldPositions.cityLine}
                            onPositionChange={updateFieldPosition}
                            label="City Line"
                            zoom={0.85}
                            disabled={lockedSections.headerAddress}
                            onDelete={() =>
                              removeStandardField(
                                "cityLine",
                                "City Line",
                                cityLine,
                                "Header Address",
                                fieldStyles.cityLine,
                              )
                            }
                            deleteTitle="Remove City Line"
                          >
                            <div className="uppercase mt-2 flex justify-center">
                              <StyledInput
                                value={cityLine}
                                rows={2}
                                onChange={(e) => setCityLine(e.target.value)}
                                inputStyle={fieldStyles["cityLine"]}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("cityLine", style)
                                }
                                className="text-[#B3B394] text-[13px] h-[40px] bg-transparent text-center focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[200]"
                                placeholder="BRIGHOUSE SOUTH, RICHMOND"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

                      {!isFieldDeleted("priceAmount") && (
                        <DraggableBox
                          id="priceAmount"
                          position={fieldPositions.priceAmount}
                          onPositionChange={updateFieldPosition}
                          label="Listing Price"
                          zoom={0.85}
                          disabled={lockedSections.headerAddress}
                          onDelete={() =>
                            removeStandardField(
                              "priceAmount",
                              "Listing Price",
                              amount,
                              "Header Address",
                              fieldStyles.amount,
                            )
                          }
                          deleteTitle="Remove Price"
                        >
                          <div
                            className="h-[40px] rounded-sm shadow-md flex items-center"
                            style={{
                              background:
                                "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                              opacity: 0.95,
                            }}
                          >
                            <StyledInput
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              onChangeStyle={(style) =>
                                updateFieldStyle("amount", style)
                              }
                              inputStyle={fieldStyles["amount"]}
                              placeholder="$000,000"
                              className="text-center text-[#ffffff] text-[28px] w-full bg-transparent border-none focus:outline-none outline-none placeholder-[#ffffff] placeholder:font-[500] px-2"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </DraggableBox>
                </div>
              </div>

              {/* BOTTOM SECTION: Left Details Column (25%) + Right Image Grid & Desc (75%) */}
              <div className="flex gap-4 px-[20px] pb-[5px] flex-1 min-h-0">
                {/* LEFT COLUMN (25%): Property Details + Agent Contact */}
                <div className="w-[30%] flex flex-col gap-2">
                  {/* Property Details Section Container */}
                  <div
                    data-safezone-container="true"
                    className={`flex flex-col flex-1 space-y-2 relative border-[3.5px] border-solid border-transparent rounded-lg p-1 transition-all duration-150 group/sec ${
                      lockedSections.details
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Section Lock Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("details");
                      }}
                      className={`absolute -top-3 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.details
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.details
                          ? "Unlock Property Details Section"
                          : "Lock Property Details Section"
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

                    <div className="space-y-1.5 text-[8px] text-left">
                      {!isFieldDeleted("byLawRestrictions") && (
                        <DraggableBox
                          id="byLawRestrictions"
                          position={fieldPositions.byLawRestrictions}
                          onPositionChange={updateFieldPosition}
                          label="By-law Restrictions"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          onDelete={() =>
                            removeStandardField(
                              "byLawRestrictions",
                              "By-law Restrictions",
                              byLawRestrictions,
                              "Details",
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
                              onChangeStyle={(style) =>
                                updateFieldStyle("byLawLabel", style)
                              }
                              className="font-bold text-[#B3B394] text-[12px] bg-transparent border-none focus:outline-none uppercase text-left"
                              placeholder="BY-LAW RESTRICTIONS:"
                            />
                            <StyledInput
                              value={byLawRestrictions}
                              onChange={(e) =>
                                setByLawRestrictions(e.target.value)
                              }
                              inputStyle={fieldStyles["byLawRestrictions"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("byLawRestrictions", style)
                              }
                              className="font-normal text-[12px] text-[#FFFFFF] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                          onDelete={() =>
                            removeStandardField(
                              "maintFees",
                              "Maint. Fees",
                              maintFees,
                              "Details",
                              fieldStyles.maintFees,
                            )
                          }
                          deleteTitle="Remove Maintenance Fees"
                        >
                          <div className="text-left">
                            <StyledInput
                              value={maintFeesLabel}
                              onChange={(e) =>
                                setMaintFeesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles["maintFeesLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("maintFeesLabel", style)
                              }
                              className="font-bold text-[#B3B394] text-[12px] bg-transparent border-none focus:outline-none uppercase text-left"
                              placeholder="MAINT. FEES:"
                            />
                            <StyledInput
                              value={maintFees}
                              onChange={(e) => setMaintFees(e.target.value)}
                              inputStyle={fieldStyles["maintFees"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("maintFees", style)
                              }
                              className="font-normal text-[12px] text-[#FFFFFF] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                          onDelete={() =>
                            removeStandardField(
                              "maintFeesInclude",
                              "Maint. Fees Include",
                              maintFeesInclude,
                              "Details",
                              fieldStyles.maintFeesInclude,
                            )
                          }
                          deleteTitle="Remove Maintenance Fees Include"
                        >
                          <div className="text-left">
                            <StyledInput
                              value={maintFeesIncludeLabel}
                              onChange={(e) =>
                                setMaintFeesIncludeLabel(e.target.value)
                              }
                              inputStyle={fieldStyles["maintFeesIncludeLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("maintFeesIncludeLabel", style)
                              }
                              className="font-bold text-[#B3B394] text-[12px] bg-transparent border-none focus:outline-none uppercase text-left"
                              placeholder="MAINT. FEES INCLUDE:"
                            />
                            <StyledInput
                              value={maintFeesInclude}
                              onChange={(e) =>
                                setMaintFeesInclude(e.target.value)
                              }
                              inputStyle={fieldStyles["maintFeesInclude"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("maintFeesInclude", style)
                              }
                              className="font-normal text-[12px] text-[#FFFFFF] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                          <div className="text-left">
                            <StyledInput
                              value={featuresIncludedLabel}
                              onChange={(e) =>
                                setFeaturesIncludedLabel(e.target.value)
                              }
                              inputStyle={fieldStyles["featuresIncludedLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("featuresIncludedLabel", style)
                              }
                              className="font-bold text-[#B3B394] text-[12px] bg-transparent border-none focus:outline-none uppercase text-left"
                              placeholder="FEATURES INCLUDED:"
                            />
                            <StyledInput
                              value={featuresIncluded}
                              onChange={(e) =>
                                setFeaturesIncluded(e.target.value)
                              }
                              inputStyle={fieldStyles["featuresIncluded"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("featuresIncluded", style)
                              }
                              className="font-normal text-[12px] text-[#FFFFFF] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
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
                          <div className="text-left">
                            <StyledInput
                              value={siteInfluencesLabel}
                              onChange={(e) =>
                                setSiteInfluencesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles["siteInfluencesLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("siteInfluencesLabel", style)
                              }
                              className="font-bold text-[#B3B394] text-[12px] bg-transparent border-none focus:outline-none uppercase text-left"
                              placeholder="SITE INFLUENCES:"
                            />
                            <StyledInput
                              value={siteInfluences}
                              onChange={(e) =>
                                setSiteInfluences(e.target.value)
                              }
                              inputStyle={fieldStyles["siteInfluences"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("siteInfluences", style)
                              }
                              className="font-normal text-[12px] text-[#FFFFFF] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                          <div className="text-left">
                            <StyledInput
                              value={amenitiesLabel}
                              onChange={(e) =>
                                setAmenitiesLabel(e.target.value)
                              }
                              inputStyle={fieldStyles["amenitiesLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("amenitiesLabel", style)
                              }
                              className="font-bold text-[#B3B394] text-[12px] bg-transparent border-none focus:outline-none uppercase text-left"
                              placeholder="AMENITIES:"
                            />
                            <StyledInput
                              value={amenities}
                              onChange={(e) => setAmenities(e.target.value)}
                              inputStyle={fieldStyles["amenities"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("amenities", style)
                              }
                              className="font-normal text-[12px] text-[#FFFFFF] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                          <div className="text-left">
                            <StyledInput
                              value={viewLabel}
                              onChange={(e) => setViewLabel(e.target.value)}
                              inputStyle={fieldStyles["viewLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("viewLabel", style)
                              }
                              className="font-bold text-[#B3B394] text-[12px] bg-transparent border-none focus:outline-none uppercase text-left"
                              placeholder="VIEW:"
                            />
                            <StyledInput
                              value={view}
                              onChange={(e) => setView(e.target.value)}
                              inputStyle={fieldStyles["view"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("view", style)
                              }
                              className="font-normal text-[12px] text-[#FFFFFF] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="South & SW - Van Isl."
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  {/* Agent Contact Box Container */}
                  <div
                    data-safezone-container="true"
                    className={`flex flex-col relative border-[3.5px] border-solid border-transparent rounded-lg p-1 transition-all duration-150 group/sec ${
                      lockedSections.contact
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Section Lock Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("contact");
                      }}
                      className={`absolute -top-3 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    <div className="text-[#B3B394]">
                      {!isFieldDeleted("contactName") && (
                        <DraggableBox
                          id="contactName"
                          position={fieldPositions.contactName}
                          onPositionChange={updateFieldPosition}
                          label="Agent Name"
                          zoom={0.85}
                          disabled={lockedSections.contact}
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
                          <div className="font-bold text-[14px] flex flex-col gap-0">
                            <StyledInput
                              value={contactLabel}
                              onChange={(e) => setContactLabel(e.target.value)}
                              inputStyle={fieldStyles["contactLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("contactLabel", style)
                              }
                              className="font-normal text-[12px] bg-transparent text-left focus:outline-none border-none placeholder-gray-300 uppercase"
                              placeholder="CONTACT:"
                              wrapperClassName="w-auto"
                            />
                            <StyledInput
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              rows={1}
                              inputStyle={fieldStyles["fullName"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("fullName", style)
                              }
                              className="text-[16px] text-[#B3B394] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[500]"
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
                            rows={1}
                            onChange={(e) => setPropertyName(e.target.value)}
                            inputStyle={fieldStyles["propertyName"]}
                            onChangeStyle={(style) =>
                              updateFieldStyle("propertyName", style)
                            }
                            className="text-[12px] font-thin h-[18px] bg-transparent text-left text-white w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                            placeholder="MACDONALD Realty"
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
                          <div className="flex gap-2 text-white text-[12px] items-center">
                            <StyledInput
                              value={phoneLabel}
                              onChange={(e) => setPhoneLabel(e.target.value)}
                              inputStyle={fieldStyles["phoneLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("phoneLabel", style)
                              }
                              className="font-bold text-[12px] text-white bg-transparent focus:outline-none border-none"
                              placeholder="PHONE:"
                              wrapperClassName="w-auto"
                            />
                            <StyledInput
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              rows={1}
                              inputStyle={fieldStyles["number"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("number", style)
                              }
                              className="font-thin inline text-[12px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
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
                          <div className="flex gap-2 text-white text-[11px] items-center">
                            <StyledInput
                              value={emailLabel}
                              onChange={(e) => setEmailLabel(e.target.value)}
                              inputStyle={fieldStyles["emailLabel"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("emailLabel", style)
                              }
                              className="font-bold text-[11px] text-white bg-transparent focus:outline-none border-none"
                              placeholder="EMAIL:"
                              wrapperClassName="w-auto"
                            />
                            <StyledInput
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              rows={1}
                              inputStyle={fieldStyles["email"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("email", style)
                              }
                              className="font-thin inline text-[11px] h-[22px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                              placeholder="FIRST@LAST.COM"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (75%): Image Grid (2,3,4,5 + center overlap 6) & Headline / Desc */}
                <div className="w-[70%] flex flex-col flex-1 min-h-0 justify-between">
                  <div className="relative -mt-[60px] flex flex-col flex-1 min-h-0 h-full">
                    <div className="flex flex-col relative justify-center items-center flex-1 min-h-0 h-full w-full">
                      {/* 2x2 Image Grid (Images 2, 3, 4, 5) */}
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {/* Image 2 Slot */}
                        <div
                          data-image-slot="true"
                          className="w-full h-[160px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] place-self-center relative overflow-hidden flex items-center justify-center group cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image2")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image2");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image2")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image2", e)}
                            onMouseUp={() => handleMouseUp("image2")}
                            onMouseLeave={() => handleMouseLeave("image2")}
                          >
                            {images.image2 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image2", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image2}
                                    scale={scale.image2}
                                    position={position.image2}
                                    rotation={rotation.image2}
                                  />
                                </div>
                                <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image2", "in")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image2", "out")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image2")}
                                  className="absolute top-4 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    openImageSourceModal("image2", e)
                                  }
                                  className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image2", fileInputRef2)
                                  }
                                  className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image2", e)
                                }
                                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                              >
                                Select Image
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef2}
                              onChange={(e) => handleImageChange("image2", e)}
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Image 3 Slot */}
                        <div
                          data-image-slot="true"
                          className="w-full h-[160px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] place-self-center relative overflow-hidden flex items-center justify-center group cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image3")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image3");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image3")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image3", e)}
                            onMouseUp={() => handleMouseUp("image3")}
                            onMouseLeave={() => handleMouseLeave("image3")}
                          >
                            {images.image3 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image3", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image3}
                                    scale={scale.image3}
                                    position={position.image3}
                                    rotation={rotation.image3}
                                  />
                                </div>
                                <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image3", "in")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image3", "out")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image3")}
                                  className="absolute top-4 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    openImageSourceModal("image3", e)
                                  }
                                  className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image3", fileInputRef3)
                                  }
                                  className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image3", e)
                                }
                                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                              >
                                Select Image
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef3}
                              onChange={(e) => handleImageChange("image3", e)}
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Image 4 Slot */}
                        <div
                          data-image-slot="true"
                          className="w-full h-[160px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] place-self-center relative overflow-hidden flex items-center justify-center group cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image4")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image4");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image4")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image4", e)}
                            onMouseUp={() => handleMouseUp("image4")}
                            onMouseLeave={() => handleMouseLeave("image4")}
                          >
                            {images.image4 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image4", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image4}
                                    scale={scale.image4}
                                    position={position.image4}
                                    rotation={rotation.image4}
                                  />
                                </div>
                                <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image4", "in")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image4", "out")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image4")}
                                  className="absolute top-4 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    openImageSourceModal("image4", e)
                                  }
                                  className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image4", fileInputRef4)
                                  }
                                  className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image4", e)
                                }
                                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                              >
                                Select Image
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef4}
                              onChange={(e) => handleImageChange("image4", e)}
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Image 5 Slot */}
                        <div
                          data-image-slot="true"
                          className="w-full h-[160px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] place-self-center relative overflow-hidden flex items-center justify-center group cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image5")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image5");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image5")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image5", e)}
                            onMouseUp={() => handleMouseUp("image5")}
                            onMouseLeave={() => handleMouseLeave("image5")}
                          >
                            {images.image5 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image5", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image5}
                                    scale={scale.image5}
                                    position={position.image5}
                                    rotation={rotation.image5}
                                  />
                                </div>
                                <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image5", "in")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image5", "out")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image5")}
                                  className="absolute top-4 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    openImageSourceModal("image5", e)
                                  }
                                  className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image5", fileInputRef5)
                                  }
                                  className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image5", e)
                                }
                                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                              >
                                Select Image
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef5}
                              onChange={(e) => handleImageChange("image5", e)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Center Inset Overlapping Image 6 Slot */}
                      <div className="absolute z-10">
                        <div
                          data-image-slot="true"
                          className="w-[150px] h-[100px] relative bg-white border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] overflow-hidden group cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image6")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image6");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image6")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image6", e)}
                            onMouseUp={() => handleMouseUp("image6")}
                            onMouseLeave={() => handleMouseLeave("image6")}
                          >
                            {images.image6 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image6", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image6}
                                    scale={scale.image6}
                                    position={position.image6}
                                    rotation={rotation.image6}
                                  />
                                </div>
                                <div className="absolute bottom-2 left-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image6", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-3 h-3 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image6", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-3 h-3 text-gray-700" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image6")}
                                  className="absolute top-2 right-[60px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-3 h-3 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    openImageSourceModal("image6", e)
                                  }
                                  className="absolute top-2 right-8 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image6", fileInputRef6)
                                  }
                                  className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image6", e)
                                }
                                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 text-xs"
                              >
                                Select Image
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef6}
                              onChange={(e) => handleImageChange("image6", e)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Headline & Description Section Container */}
                    <div
                      data-safezone-container="true"
                      className={`flex flex-col flex-1 min-h-0 h-full relative justify-self-center mt-[20px] w-[100%] border-[3.5px] border-solid border-transparent rounded-lg p-1 transition-all duration-150 group/sec ${
                        lockedSections.headlineDesc
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                    >
                      {/* Section Lock Button */}
                      <button
                        type="button"
                        data-html2canvas-ignore="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionLock("headlineDesc");
                        }}
                        className={`absolute -top-3 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.headlineDesc
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                        title={
                          lockedSections.headlineDesc
                            ? "Unlock Headline & Description Section"
                            : "Lock Headline & Description Section"
                        }
                      >
                        {lockedSections.headlineDesc ? (
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
                      {!isFieldDeleted("headline") && (
                        <DraggableBox
                          id="headline"
                          position={fieldPositions.headline}
                          onPositionChange={updateFieldPosition}
                          label="Headline"
                          zoom={0.85}
                          disabled={lockedSections.headlineDesc}
                          containerClassName="shrink-0 mt-[20px]"
                          onDelete={() =>
                            removeStandardField(
                              "headline",
                              "Headline",
                              headline,
                              "Description Section",
                              fieldStyles.headline,
                            )
                          }
                          deleteTitle="Remove Headline"
                        >
                          <StyledInput
                            value={headline}
                            rows={2}
                            onChange={(e) => setHeadline(e.target.value)}
                            inputStyle={fieldStyles["headline"]}
                            onChangeStyle={(style) =>
                              updateFieldStyle("headline", style)
                            }
                            className="text-[16px] leading-relaxed px-5 text-center tracking-[-0.5px] mb-[15px] font-bold text-[#B3B394] bg-transparent border-none focus:outline-none uppercase"
                            placeholder="ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING."
                          />
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("propertyDescription") && (
                        <DraggableBox
                          id="propertyDescription"
                          position={fieldPositions.propertyDescription}
                          onPositionChange={updateFieldPosition}
                          label="Property Description"
                          zoom={0.85}
                          disabled={lockedSections.headlineDesc}
                          containerClassName="flex-1 flex flex-col min-h-0 h-full w-full"
                          className="flex-1 flex flex-col min-h-0 h-full w-full"
                          onDelete={() =>
                            removeStandardField(
                              "propertyDescription",
                              "Property Description",
                              description,
                              "Description Section",
                              fieldStyles.description,
                            )
                          }
                          deleteTitle="Remove Description"
                        >
                          <StyledInput
                            value={description}
                            rows={7}
                            onChange={(e) => setDescription(e.target.value)}
                            inputStyle={fieldStyles["description"]}
                            onChangeStyle={(style) =>
                              updateFieldStyle("description", style)
                            }
                            wrapperClassName="flex-1 flex flex-col min-h-0 h-full w-full"
                            className="font-normal text-[12px] h-full flex-1 min-h-0 w-full overflow-hidden z-20 text-[#ffffff] leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500] resize-none"
                            placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible..."
                          />
                        </DraggableBox>
                      )}

                      {/* Equal Housing / Realtor Logos & Disclaimer */}
                      {!isFieldDeleted("contactDisclaimer") && (
                        <DraggableBox
                          id="contactDisclaimer"
                          position={fieldPositions.contactDisclaimer}
                          onPositionChange={updateFieldPosition}
                          label="Disclaimer & Logos"
                          zoom={0.85}
                          disabled={lockedSections.headlineDesc}
                          containerClassName="shrink-0 mt-auto"
                          onDelete={() =>
                            removeStandardField(
                              "contactDisclaimer",
                              "Disclaimer & Logos",
                              disclaimerText,
                              "Description Section",
                              fieldStyles.disclaimerText,
                            )
                          }
                          deleteTitle="Remove Disclaimer"
                        >
                          <div className="relative px-2 py-0  z-2 w-full gap-2 flex text-[#B3B394]">
                            <span className="flex flex-col mt-1 shrink-0">
                              <House className="w-4 h-4 text-[#B3B394]" />
                            </span>
                            <StyledInput
                              value={disclaimerText}
                              rows={3}
                              onChange={(e) =>
                                setDisclaimerText(e.target.value)
                              }
                              inputStyle={fieldStyles["disclaimerText"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("disclaimerText", style)
                              }
                              className="text-[10px] leading-tight text-[#B3B394] bg-transparent border-none focus:outline-none"
                              placeholder="All information deemed reliable but not guaranteed..."
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>

        {/* Page 2 Divider */}
        <div className="w-[8.5in] mt-1 flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 2
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* CONTAINER 1: Outer Page / Bleed Wrapper (Page 2) */}
        <div
          className="pdf-page bg-white shadow-xl relative overflow-hidden flex flex-col"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
            backgroundColor: "#ffffff",
          }}
        >
          {/* CONTAINER 2: SafeZoneWrapper (Page 2) */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            {/* CONTAINER 3: Inner Content Container (Page 2) */}
            <div className="w-full h-full flex flex-col justify-center font-alexandria relative">
              {/* IMAGE 7 SLOT (Page 2 Full Photo / Floorplan) */}
              <div
                data-image-slot="true"
                className="relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
                style={{
                  marginTop: showBleed ? "-0.375in" : "-0.25in",
                  marginBottom: showBleed ? "-0.375in" : "-0.25in",
                  marginLeft: showBleed ? "-0.375in" : "-0.25in",
                  marginRight: showBleed ? "-0.375in" : "-0.25in",
                  width: showBleed
                    ? "calc(100% + 0.75in)"
                    : "calc(100% + 0.5in)",
                  height: showBleed
                    ? "calc(100% + 0.75in)"
                    : "calc(100% + 0.5in)",
                }}
                onMouseEnter={() => setHoveredSlot("image7")}
                onMouseLeave={() => setHoveredSlot(null)}
                onClick={(e) => {
                  if (e.altKey) return;
                  e.stopPropagation();
                  setActiveSlot("image7");
                }}
              >
                <BoxIndicator isVisible={isSlotActive("image7")} />

                <div
                  className="w-full h-full relative overflow-hidden flex items-center justify-center"
                  onMouseMove={(e) => handleMouseMove("image7", e)}
                  onMouseUp={() => handleMouseUp("image7")}
                  onMouseLeave={() => handleMouseLeave("image7")}
                >
                  {images.image7 ? (
                    <>
                      <div
                        className="w-full h-full cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image7", e)}
                      >
                        <ImageEditor
                          src={images.image7}
                          scale={scale.image7}
                          position={position.image7}
                          rotation={rotation.image7}
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image7", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image7", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Rotate Button */}
                      <button
                        type="button"
                        onClick={() => handleRotate("image7")}
                        className="absolute top-[45px] right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Rotate image"
                      >
                        <RotateCw className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => openImageSourceModal("image7", e)}
                        className="absolute top-[45px] right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image7", fileInputRef7)}
                        className="absolute top-[45px] right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      data-html2canvas-ignore="true"
                      onClick={(e) => openImageSourceModal("image7", e)}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
                    >
                      Select Image
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef7}
                    onChange={(e) => handleImageChange("image7", e)}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Floating Address Card Header (Page 2) */}
              <div className="absolute top-[-40px] left-[50px] w-[160px] z-20">
                <div
                  data-safezone-container="true"
                  className={`flex flex-col gap-1 relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
                    lockedSections.headerAddressPage2
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  {/* Section Lock Button */}
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("headerAddressPage2");
                    }}
                    className={`absolute -top-3 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.headerAddressPage2
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                    title={
                      lockedSections.headerAddressPage2
                        ? "Unlock Header Address Section (Page 2)"
                        : "Lock Header Address Section (Page 2)"
                    }
                  >
                    {lockedSections.headerAddressPage2 ? (
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
                    id="headerAddressCardPage2"
                    position={fieldPositions.headerAddressCardPage2}
                    onPositionChange={updateFieldPosition}
                    label="Header Address Card (Page 2)"
                    zoom={0.85}
                    disabled={lockedSections.headerAddressPage2}
                  >
                    <div
                      className="p-3 pt-[80px] shadow-md rounded-b-sm"
                      style={{
                        background:
                          "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                      }}
                    >
                      {!isFieldDeleted("addressCodePage2") && (
                        <DraggableBox
                          id="addressCodePage2"
                          position={fieldPositions.addressCodePage2}
                          onPositionChange={updateFieldPosition}
                          label="Unit Number"
                          zoom={0.85}
                          disabled={lockedSections.headerAddressPage2}
                          onDelete={() =>
                            removeStandardField(
                              "addressCodePage2",
                              "Unit Number",
                              addressCode,
                              "Header Address (Page 2)",
                              fieldStyles.addressCode,
                            )
                          }
                          deleteTitle="Remove Unit Number"
                        >
                          <div className="tracking-wide text-white mt-0 mb-2 flex items-center">
                            <span className="mr-0.5">#</span>
                            <StyledInput
                              value={addressCode}
                              onChange={(e) => setAddressCode(e.target.value)}
                              inputStyle={fieldStyles["addressCode"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("addressCode", style)
                              }
                              className="font-light text-[21px] h-[42px] w-[120px] leading-none mt-0 bg-transparent text-[#ffffff] text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                              placeholder="0000-0000"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("roadNamePage2") && (
                        <DraggableBox
                          id="roadNamePage2"
                          position={fieldPositions.roadNamePage2}
                          onPositionChange={updateFieldPosition}
                          label="Street / Road"
                          zoom={0.85}
                          disabled={lockedSections.headerAddressPage2}
                          onDelete={() =>
                            removeStandardField(
                              "roadNamePage2",
                              "Street / Road",
                              roadName,
                              "Header Address (Page 2)",
                              fieldStyles.roadName,
                            )
                          }
                          deleteTitle="Remove Street / Road"
                        >
                          <div className="text-[13px] text-white font-bold leading-none mt-0 flex items-center justify-center whitespace-nowrap w-full mb-3">
                            <StyledInput
                              value={roadLabelBefore}
                              onChange={(e) =>
                                setRoadLabelBefore(e.target.value)
                              }
                              inputStyle={fieldStyles["roadLabelBefore"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("roadLabelBefore", style)
                              }
                              className="font-bold text-[13px] bg-transparent text-white focus:outline-none border-none"
                              placeholder="Number"
                              wrapperClassName="w-auto"
                            />
                            <StyledInput
                              value={roadName}
                              onChange={(e) => setRoadName(e.target.value)}
                              inputStyle={fieldStyles["roadName"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("roadName", style)
                              }
                              className="font-light text-[13px] h-[16px] leading-[13px] p-0 mx-1 mt-[2px] bg-transparent text-[#ffffff] text-center flex-1 min-w-[20px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                              placeholder="0"
                            />
                            <StyledInput
                              value={roadLabelAfter}
                              onChange={(e) =>
                                setRoadLabelAfter(e.target.value)
                              }
                              inputStyle={fieldStyles["roadLabelAfter"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("roadLabelAfter", style)
                              }
                              className="font-bold text-[13px] bg-transparent text-white focus:outline-none border-none"
                              placeholder="Road"
                              wrapperClassName="w-auto"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      <hr className="border-t-2 border-dotted border-white w-full" />

                      {!isFieldDeleted("cityLinePage2") && (
                        <DraggableBox
                          id="cityLinePage2"
                          position={fieldPositions.cityLinePage2}
                          onPositionChange={updateFieldPosition}
                          label="City Line"
                          zoom={0.85}
                          disabled={lockedSections.headerAddressPage2}
                          onDelete={() =>
                            removeStandardField(
                              "cityLinePage2",
                              "City Line",
                              cityLine,
                              "Header Address (Page 2)",
                              fieldStyles.cityLine,
                            )
                          }
                          deleteTitle="Remove City Line"
                        >
                          <div className="uppercase mt-2 flex justify-center">
                            <StyledInput
                              value={cityLine}
                              rows={2}
                              onChange={(e) => setCityLine(e.target.value)}
                              inputStyle={fieldStyles["cityLine"]}
                              onChangeStyle={(style) =>
                                updateFieldStyle("cityLine", style)
                              }
                              className="text-[#B3B394] text-[13px] h-[40px] bg-transparent text-center focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[200]"
                              placeholder="BRIGHOUSE SOUTH, RICHMOND"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </DraggableBox>
                </div>
              </div>

              {/* Bottom Gradient Bar (Page 2) */}
              <div className="flex gap-2 absolute bottom-[60px] right-0 h-[30px] z-20">
                <div
                  className="opacity-[25%] w-[35px]"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                ></div>
                <div
                  className="opacity-[50%] w-[35px]"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                ></div>
                <div
                  className="opacity-[75%] w-[35px]"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                ></div>
                <div
                  className="flex w-[500px]"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                ></div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>
      </>
    );
  },
);

BcfpStandard13.displayName = "BcfpStandard13";
export default BcfpStandard13;
