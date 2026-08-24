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
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput, { FontFolderProvider } from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import ImageEditor from "./ImageEditor";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetPayload,
  FeatureSheetResponse,
  TextStyle,
} from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";

export interface BcfpStandard17Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard17Props {
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

const BcfpStandard17 = forwardRef<BcfpStandard17Ref, BcfpStandard17Props>(
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
    const [byLawRestrictions, setByLawRestrictions] = useState("");
    const [maintenanceFees, setMaintenanceFees] = useState("");
    const [maintenanceFeesInclude, setMaintenanceFeesInclude] = useState("");
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
    const [headlineText, setHeadlineText] = useState(
      "ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.",
    );
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM |");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM |");
    const [sqftLabel, setSqftLabel] = useState("SQ FT |");
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
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
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

    // ── 5. Styles, Positions & Locks ──────────────────────────────────────────
    const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>(
      {},
    );
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
      price: false,
      page2Header: false,
    });

    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 6. Images States ──────────────────────────────────────────────────────
    const [images, setImages] = useState<{ [key: string]: string | null }>({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
      image5: null,
      image6: null,
      image7: null,
      image8: null,
      image9: null,
      image10: null,
      image11: null,
      image12: null,
      image13: null,
    });

    const [scale, setScale] = useState<{ [key: string]: number }>({
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

    const [position, setPosition] = useState<{
      [key: string]: { x: number; y: number };
    }>({
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

    const [rotation, setRotation] = useState<{ [key: string]: number }>({
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

    const [dragging, setDragging] = useState<{ [key: string]: boolean }>({
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

    const lastPosition = useRef<{
      [key: string]: { x: number; y: number };
    }>({
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

    // ── 7. Modal & Slot States ────────────────────────────────────────────────
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

    const fileInputRef1 = useRef<HTMLInputElement | null>(null);
    const fileInputRef2 = useRef<HTMLInputElement | null>(null);
    const fileInputRef3 = useRef<HTMLInputElement | null>(null);
    const fileInputRef4 = useRef<HTMLInputElement | null>(null);
    const fileInputRef5 = useRef<HTMLInputElement | null>(null);
    const fileInputRef6 = useRef<HTMLInputElement | null>(null);
    const fileInputRef8 = useRef<HTMLInputElement | null>(null);


    // Initial sync from context & orderData
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
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if (agent.primary_phone) setNumber(agent.primary_phone);
          if (agent.company_name) setPropertyName(agent.company_name);
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
        if ((formData as any).headlineText)
          setHeadlineText((formData as any).headlineText);
        if (formData.disclaimerText) setDisclaimerText(formData.disclaimerText);
        if ((formData as any).footerText)
          setFooterText((formData as any).footerText);

        if (formData.images)
          setImages((prev) => ({ ...prev, ...formData.images }));
        if (formData.imageScales)
          setScale((prev) => ({ ...prev, ...formData.imageScales }));
        if (formData.imagePositions)
          setPosition((prev) => ({ ...prev, ...formData.imagePositions }));
        if (formData.imageRotations)
          setRotation((prev) => ({ ...prev, ...formData.imageRotations }));
        if (formData.fieldPositions)
          setFieldPositions((prev) => ({
            ...prev,
            ...formData.fieldPositions,
          }));
        if (formData.fieldStyles)
          setFieldStyles((prev) => ({ ...prev, ...formData.fieldStyles }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync formData
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
        headlineText,
        disclaimerText,
        footerText,
        contactLabel,
        phoneLabel,
        emailLabel,
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
        roadLabelBefore,
        roadLabelAfter,
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
      headlineText,
      disclaimerText,
      footerText,
      contactLabel,
      phoneLabel,
      emailLabel,
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
      roadLabelBefore,
      roadLabelAfter,
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      fieldStyles,
      updateFormData,
    ]);

    // ── 9. Payload Export / Import Handlers ─────────────────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard17",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#2B612A",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "36px",
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
              fontSize: fieldStyles.roadName?.fontSize || "28px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "14px",
            },
          },
          expandedDetail1Title: "By-law Restrictions",
          expandedDetail1Description: {
            value: byLawRestrictions,
            style: {
              ...fieldStyles.byLawRestrictions,
              fontSize: fieldStyles.byLawRestrictions?.fontSize || "12px",
            },
          },
          expandedDetail2Title: "Maint. Fees",
          expandedDetail2Description: {
            value: maintenanceFees,
            style: {
              ...fieldStyles.maintenanceFees,
              fontSize: fieldStyles.maintenanceFees?.fontSize || "12px",
            },
          },
          expandedDetail3Title: "Maint. Fees Include",
          expandedDetail3Description: {
            value: maintenanceFeesInclude,
            style: {
              ...fieldStyles.maintenanceFeesInclude,
              fontSize: fieldStyles.maintenanceFeesInclude?.fontSize || "12px",
            },
          },
          expandedDetail4Title: "Features Included",
          expandedDetail4Description: {
            value: featuresIncluded,
            style: {
              ...fieldStyles.featuresIncluded,
              fontSize: fieldStyles.featuresIncluded?.fontSize || "12px",
            },
          },
          keyHighlightLabel: "Site Influences",
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
            headlineText,
            disclaimerText,
            footerText,
            contactLabel,
            phoneLabel,
            emailLabel,
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
            roadLabelBefore,
            roadLabelAfter,
            deletedStandardFieldIds,
            deletedDetailFields,
            _deletedStandardFieldIds: deletedStandardFieldIds,
            _deletedDetailFields: deletedDetailFields,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
          fieldPositions,
          fieldStyles,
        });
        (payload as any).deletedStandardFieldIds = deletedStandardFieldIds;
        (payload as any).deletedDetailFields = deletedDetailFields;
        if (payload.content) {
          (payload.content as any).deletedStandardFieldIds = deletedStandardFieldIds;
          (payload.content as any).deletedDetailFields = deletedDetailFields;
        }
        return payload;
      },
      importFromPayload: (payload: FeatureSheetResponse) => {
        if (!payload) return;
        const state = featureSheetService.parsePayloadToState(payload);

        const st = (field: any): TextStyle | undefined => {
          if (!field) return undefined;
          if (typeof field === "object" && "style" in field) return field.style;
          return undefined;
        };
        const val = (field: any): string => {
          if (!field) return "";
          if (typeof field === "object" && "value" in field)
            return field.value || "";
          if (typeof field === "string") return field;
          return "";
        };

        if (state.offeredAtPrice) setAmount(val(state.offeredAtPrice));
        if (state.realtorName) setFullName(val(state.realtorName));
        if (state.emailLink) setEmail(val(state.emailLink));
        if (state.companyName) setPropertyName(val(state.companyName));
        if (state.propertyNotesTitle)
          setRoadName(val(state.propertyNotesTitle));
        if (state.propertyNotesDescription)
          setDescription(val(state.propertyNotesDescription));

        if (state.expandedDetail1Description)
          setByLawRestrictions(val(state.expandedDetail1Description));
        if (state.expandedDetail2Description)
          setMaintenanceFees(val(state.expandedDetail2Description));
        if (state.expandedDetail3Description)
          setMaintenanceFeesInclude(val(state.expandedDetail3Description));
        if (state.expandedDetail4Description)
          setFeaturesIncluded(val(state.expandedDetail4Description));

        if (state.keyHighlights) {
          if (Array.isArray(state.keyHighlights))
            setSiteInfluences(state.keyHighlights.join("\n"));
          else setSiteInfluences(val(state.keyHighlights));
        }

        const styles: Record<string, TextStyle> = {};
        if (st(state.offeredAtPrice)) {
          const s = st(state.offeredAtPrice)!;
          styles.amount =
            s.fontSize === "36px" ? { ...s, fontSize: "36px" } : s;
        }
        if (st(state.realtorName)) {
          const s = st(state.realtorName)!;
          styles.fullName =
            s.fontSize === "20px" ? { ...s, fontSize: "16px" } : s;
        }
        if (st(state.emailLink)) {
          const s = st(state.emailLink)!;
          styles.email = s.fontSize === "20px" ? { ...s, fontSize: "11px" } : s;
        }
        if (st(state.companyName)) {
          const s = st(state.companyName)!;
          styles.propertyName =
            s.fontSize === "20px" ? { ...s, fontSize: "12px" } : s;
        }
        if (st(state.propertyNotesTitle))
          styles.roadName = st(state.propertyNotesTitle)!;
        if (st(state.propertyNotesDescription))
          styles.description = st(state.propertyNotesDescription)!;

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, any>;
          if (details.maintenanceFees)
            setMaintenanceFees(details.maintenanceFees);
          if (details.maintenanceFeesInclude)
            setMaintenanceFeesInclude(details.maintenanceFeesInclude);
          if (details.amenities) setAmenities(details.amenities);
          if (details.view) setView(details.view);
          if (details.bedroom) setBedroom(details.bedroom);
          if (details.bathroom) setBathroom(details.bathroom);
          if (details.sqft) setSqft(details.sqft);
          if (details.builtYear) setBuiltYear(details.builtYear);
          if (details.number) setNumber(details.number);
          if (details.addressCode) setAddressCode(details.addressCode);
          if (details.cityLine) setCityLine(details.cityLine);
          if (details.headlineText) setHeadlineText(details.headlineText);
          if (details.disclaimerText) setDisclaimerText(details.disclaimerText);
          if (details.footerText) setFooterText(details.footerText);

          if (details.contactLabel) setContactLabel(details.contactLabel);
          if (details.phoneLabel) setPhoneLabel(details.phoneLabel);
          if (details.emailLabel) setEmailLabel(details.emailLabel);
          if (details.bedroomLabel) setBedroomLabel(details.bedroomLabel);
          if (details.bathroomLabel) setBathroomLabel(details.bathroomLabel);
          if (details.sqftLabel) setSqftLabel(details.sqftLabel);
          if (details.builtYearLabel) setBuiltYearLabel(details.builtYearLabel);
          if (details.byLawLabel) setByLawLabel(details.byLawLabel);
          if (details.maintFeesLabel) setMaintFeesLabel(details.maintFeesLabel);
          if (details.maintFeesIncludeLabel)
            setMaintFeesIncludeLabel(details.maintFeesIncludeLabel);
          if (details.featuresIncludedLabel)
            setFeaturesIncludedLabel(details.featuresIncludedLabel);
          if (details.siteInfluencesLabel)
            setSiteInfluencesLabel(details.siteInfluencesLabel);
          if (details.amenitiesLabel) setAmenitiesLabel(details.amenitiesLabel);
          if (details.viewLabel) setViewLabel(details.viewLabel);
          if (details.roadLabelBefore)
            setRoadLabelBefore(details.roadLabelBefore);
          if (details.roadLabelAfter) setRoadLabelAfter(details.roadLabelAfter);

          const rawOtherDetails =
            (payload.content?.otherDetails as Record<string, any>) || {};

          const savedDeletedStandard =
            rawOtherDetails._deletedStandardFieldIds ||
            rawOtherDetails.deletedStandardFieldIds ||
            (payload as any).deletedStandardFieldIds ||
            [];

          const savedDeletedDetails =
            rawOtherDetails._deletedDetailFields ||
            rawOtherDetails.deletedDetailFields ||
            (payload as any).deletedDetailFields ||
            [];

          if (Array.isArray(savedDeletedStandard)) {
            setDeletedStandardFieldIds(savedDeletedStandard);
          }
          if (Array.isArray(savedDeletedDetails)) {
            setDeletedDetailFields(savedDeletedDetails);
          }
        }

        if (state.images)
          setImages((prev) => ({ ...prev, ...(state.images as any) }));
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
        if (state.fieldPositions)
          setFieldPositions((prev) => ({
            ...prev,
            ...(state.fieldPositions as any),
          }));
        if (state.fieldStyles)
          setFieldStyles((prev) => ({
            ...prev,
            ...styles,
            ...(state.fieldStyles as any),
          }));
        else if (Object.keys(styles).length > 0)
          setFieldStyles((prev) => ({ ...prev, ...styles }));
      },
    }));

    // ── 10. Image Event Handlers ──────────────────────────────────────────────
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
      ref: React.RefObject<HTMLInputElement | null>,
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (ref.current) ref.current.value = "";
    };

    const handleRotate = (key: string) => {
      setRotation((prev) => ({
        ...prev,
        [key]: (prev[key] + 90) % 360,
      }));
    };

    const handleZoom = (key: string, direction: "in" | "out") => {
      setScale((prev) => {
        const step = 0.1;
        const newScale =
          direction === "in" ? prev[key] + step : prev[key] - step;
        const bounded = Math.min(Math.max(newScale, 0.2), 4);
        return { ...prev, [key]: parseFloat(bounded.toFixed(2)) };
      });
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

    const handleMouseUp = (key: string) => {
      setDragging((prev) => ({ ...prev, [key]: false }));
    };

    const handleMouseLeave = (key: string) => {
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

    return (
      <FontFolderProvider value="BcfpStandard17">
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

          {/* Page 1 Divider - screen only */}
          <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
            <div className="h-[1px] bg-gray-300 flex-1"></div>
            <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
              PAGE 1
            </span>
            <div className="h-[1px] bg-gray-300 flex-1"></div>
          </div>

          {/* ── PAGE 1 OUTER BLEED CONTAINER ── */}
          <div
            className="flex flex-col pdf-page bg-[#2B612A] shadow-xl relative overflow-hidden select-none font-['ArialBoldBcfp17'] font-bold"
            style={{
              width: showBleed ? "8.75in" : "8.5in",
              height: showBleed ? "11.25in" : "11.0in",
              zoom: 0.85,
              fontFamily: "'ArialBoldBcfp17', Arial, sans-serif",
              fontWeight: 700,
            }}
          >
            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="bg-[#2B612A] relative flex-1 h-full w-full flex flex-col font-['ArialBoldBcfp17'] font-bold">
                {/* ── HEADER SECTION CONTAINER ── */}
                <div
                  data-safezone-container="true"
                  className={`absolute top-4 right-[0px] z-20 bg-[#2B612A] p-1 px-3 border-[3.5px] border-solid border-transparent transition-all duration-150 group/sec ${
                    lockedSections.header
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                  }`}
                >
                  {/* Lock / Unlock Button */}
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("header");
                    }}
                    className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                  <div className="flex flex-col items-center">
                    <div className="text-[28px] font-light leading-none mt-0 text-white flex justify-center items-center gap-1">
                      <span className="text-[16px]">#</span>
                      {!isFieldDeleted("addressCode") && (
                        <DraggableBox
                          id="addressCode"
                          position={fieldPositions.addressCode}
                          onPositionChange={updateFieldPosition}
                          label="MLS / Code"
                          zoom={0.85}
                          disabled={lockedSections.header}
                          onDelete={() =>
                            removeStandardField(
                              "addressCode",
                              "MLS / Code",
                              addressCode,
                              "Header",
                              fieldStyles.addressCode,
                            )
                          }
                          deleteTitle="Remove Code"
                        >
                          <StyledInput
                            value={addressCode}
                            onChange={(e) => setAddressCode(e.target.value)}
                            inputStyle={fieldStyles.addressCode}
                            onChangeStyle={(s) =>
                              updateFieldStyle("addressCode", s)
                            }
                            className="font-light text-[28px] w-[150px] mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
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
                          label="Road / Suite"
                          zoom={0.85}
                          disabled={lockedSections.header}
                          onDelete={() =>
                            removeStandardField(
                              "roadName",
                              "Road / Suite",
                              roadName,
                              "Header",
                              fieldStyles.roadName,
                            )
                          }
                          deleteTitle="Remove Road / Suite"
                        >
                          <div className="text-white flex uppercase items-center gap-1">
                            <StyledInput
                              value={roadLabelBefore}
                              onChange={(e) =>
                                setRoadLabelBefore(e.target.value)
                              }
                              inputStyle={fieldStyles.roadLabelBefore}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadLabelBefore", s)
                              }
                              className="text-white text-[28px] uppercase bg-transparent text-right focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                              placeholder="Number"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={roadName}
                              onChange={(e) => setRoadName(e.target.value)}
                              inputStyle={fieldStyles.roadName}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadName", s)
                              }
                              className="font-light text-[28px] mt-0 bg-transparent text-white text-center w-[85px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
                              placeholder="0"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={roadLabelAfter}
                              onChange={(e) =>
                                setRoadLabelAfter(e.target.value)
                              }
                              inputStyle={fieldStyles.roadLabelAfter}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadLabelAfter", s)
                              }
                              className="text-white text-[28px] uppercase bg-transparent text-left focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                              placeholder="Road"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-1">
                    {!isFieldDeleted("cityLine") && (
                      <DraggableBox
                        id="cityLine"
                        position={fieldPositions.cityLine}
                        onPositionChange={updateFieldPosition}
                        label="City / Area"
                        zoom={0.85}
                        disabled={lockedSections.header}
                        onDelete={() =>
                          removeStandardField(
                            "cityLine",
                            "City / Area",
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
                          inputStyle={fieldStyles.cityLine}
                          onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                          className="text-white text-[16px] h-[20px] bg-transparent text-right w-[350px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
                          placeholder="BRIGHOUSE SOUTH, RICHMOND"
                        />
                      </DraggableBox>
                    )}
                  </div>

                  {/* Specs Bar */}
                  <div className="font-bold items-center text-[14px] text-[#B3B394] flex flex-wrap gap-2 mt-2">
                    {!isFieldDeleted("specBedroom") && (
                      <DraggableBox
                        id="specBedroom"
                        position={fieldPositions.specBedroom}
                        onPositionChange={updateFieldPosition}
                        label="Bedrooms"
                        zoom={0.85}
                        disabled={lockedSections.header}
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
                        <div className="flex items-center gap-1 whitespace-nowrap flex-nowrap shrink-0">
                          <StyledInput
                            value={bedroom}
                            onChange={(e) => setBedroom(e.target.value)}
                            inputStyle={fieldStyles.bedroom}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bedroom", s)
                            }
                            className="font-semibold text-[13px] bg-transparent text-left w-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
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
                            className="font-bold text-[14px] text-[#B3B394] bg-transparent text-left focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                            placeholder="BEDROOM |"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("specBathroom") && (
                      <DraggableBox
                        id="specBathroom"
                        position={fieldPositions.specBathroom}
                        onPositionChange={updateFieldPosition}
                        label="Bathrooms"
                        zoom={0.85}
                        disabled={lockedSections.header}
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
                        <div className="flex items-center gap-1 whitespace-nowrap flex-nowrap shrink-0">
                          <StyledInput
                            value={bathroom}
                            onChange={(e) => setBathroom(e.target.value)}
                            inputStyle={fieldStyles.bathroom}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bathroom", s)
                            }
                            className="font-semibold text-[13px] bg-transparent text-left w-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
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
                            className="font-bold text-[14px] text-[#B3B394] bg-transparent text-left focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                            placeholder="BATHROOM |"
                            wrapperClassName="w-auto shrink-0"
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
                        disabled={lockedSections.header}
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
                        <div className="flex items-center gap-1 whitespace-nowrap flex-nowrap shrink-0">
                          <StyledInput
                            value={sqft}
                            onChange={(e) => setSqft(e.target.value)}
                            inputStyle={fieldStyles.sqft}
                            onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                            className="font-semibold text-[13px] bg-transparent text-left w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
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
                            className="font-bold text-[14px] text-[#B3B394] bg-transparent text-left focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                            placeholder="SQ FT |"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("specBuiltYear") && (
                      <DraggableBox
                        id="specBuiltYear"
                        position={fieldPositions.specBuiltYear}
                        onPositionChange={updateFieldPosition}
                        label="Year Built"
                        zoom={0.85}
                        disabled={lockedSections.header}
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
                        <div className="flex items-center gap-1 whitespace-nowrap flex-nowrap shrink-0">
                          <StyledInput
                            value={builtYearLabel}
                            onChange={(e) => setBuiltYearLabel(e.target.value)}
                            inputStyle={fieldStyles.builtYearLabel}
                            onChangeStyle={(s) =>
                              updateFieldStyle("builtYearLabel", s)
                            }
                            className="font-bold text-[14px] text-[#B3B394] bg-transparent text-left focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
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
                            className="font-semibold text-[13px] bg-transparent text-left w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
                            placeholder="0000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* ── IMAGE 1 (TOP HERO SLOT) ── */}
                <div
                  data-image-slot="true"
                  className="relative overflow-hidden group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)] border-[#fff] shrink-0"
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
                            objectFit="contain"
                          />
                        </div>

                        {/* Zoom Controls */}
                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                          className="absolute top-[150px] right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => openImageSourceModal("image1", e)}
                          className="absolute top-[150px] right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete("image1", fileInputRef1)}
                          className="absolute top-[150px] right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        data-html2canvas-ignore="true"
                        onClick={(e) => openImageSourceModal("image1", e)}
                        className="w-full h-full bg-white text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-100 transition-colors"
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

                {/* ── BOTTOM SECTION SPLIT ── */}
                <div className="flex gap-4 pl-[15px] pb-[20px] pt-2">
                  {/* ── LEFT COLUMN (75%) ── */}
                  <div className="w-[73%] flex flex-col flex-1 h-full">
                    <div className="mt-[-60px] relative z-10">
                      <div className="flex flex-col relative justify-center items-center">
                        {/* Grid of 4 Images + Overlapping Center Image */}
                        <div className="grid grid-cols-2 gap-3 w-[95%] relative">
                          {/* IMAGE 2 SLOT */}
                          <div
                            data-image-slot="true"
                            className={`w-full h-[150px] relative border-2 border-[#fff] ${images.image2 ? "bg-transparent" : "bg-white"} shadow-[4px_4px_6px_rgba(0,0,0,0.4)] group overflow-hidden cursor-pointer`}
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
                                      objectFit="contain"
                                    />
                                  </div>

                                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                                      onClick={() =>
                                        handleZoom("image2", "out")
                                      }
                                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                      title="Zoom Out"
                                    >
                                      <ZoomOut className="w-4 h-4 text-gray-700" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRotate("image2")}
                                    className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                    title="Rotate image"
                                  >
                                    <RotateCw className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      openImageSourceModal("image2", e)
                                    }
                                    className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                    title="Edit image"
                                  >
                                    <Pencil className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete("image2", fileInputRef2)
                                    }
                                    className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                                  className="w-full h-full bg-white text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs hover:bg-gray-100"
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

                          {/* IMAGE 3 SLOT */}
                          <div
                            data-image-slot="true"
                            className={`w-full h-[150px] relative border-2 border-[#fff] ${images.image3 ? "bg-transparent" : "bg-white"} shadow-[4px_4px_6px_rgba(0,0,0,0.4)] group overflow-hidden cursor-pointer`}
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
                                      objectFit="contain"
                                    />
                                  </div>

                                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                                      onClick={() =>
                                        handleZoom("image3", "out")
                                      }
                                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                      title="Zoom Out"
                                    >
                                      <ZoomOut className="w-4 h-4 text-gray-700" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRotate("image3")}
                                    className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                    title="Rotate image"
                                  >
                                    <RotateCw className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      openImageSourceModal("image3", e)
                                    }
                                    className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                    title="Edit image"
                                  >
                                    <Pencil className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete("image3", fileInputRef3)
                                    }
                                    className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                                  className="w-full h-full bg-white text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs hover:bg-gray-100"
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

                          {/* IMAGE 4 SLOT */}
                          <div
                            data-image-slot="true"
                            className={`w-full h-[150px] relative border-2 border-[#fff] ${images.image4 ? "bg-transparent" : "bg-white"} shadow-[4px_4px_6px_rgba(0,0,0,0.4)] group overflow-hidden cursor-pointer`}
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
                                      objectFit="contain"
                                    />
                                  </div>

                                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                                      onClick={() =>
                                        handleZoom("image4", "out")
                                      }
                                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                      title="Zoom Out"
                                    >
                                      <ZoomOut className="w-4 h-4 text-gray-700" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRotate("image4")}
                                    className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                    title="Rotate image"
                                  >
                                    <RotateCw className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      openImageSourceModal("image4", e)
                                    }
                                    className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                    title="Edit image"
                                  >
                                    <Pencil className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete("image4", fileInputRef4)
                                    }
                                    className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                                  className="w-full h-full bg-white text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs hover:bg-gray-100"
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

                          {/* IMAGE 5 SLOT */}
                          <div
                            data-image-slot="true"
                            className={`w-full h-[150px] relative border-2 border-[#fff] ${images.image5 ? "bg-transparent" : "bg-white"} shadow-[4px_4px_6px_rgba(0,0,0,0.4)] group overflow-hidden cursor-pointer`}
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
                                      objectFit="contain"
                                    />
                                  </div>

                                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                                      onClick={() =>
                                        handleZoom("image5", "out")
                                      }
                                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                      title="Zoom Out"
                                    >
                                      <ZoomOut className="w-4 h-4 text-gray-700" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRotate("image5")}
                                    className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                    title="Rotate image"
                                  >
                                    <RotateCw className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      openImageSourceModal("image5", e)
                                    }
                                    className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                    title="Edit image"
                                  >
                                    <Pencil className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete("image5", fileInputRef5)
                                    }
                                    className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                                  className="w-full h-full bg-white text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs hover:bg-gray-100"
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

                        {/* IMAGE 6 SLOT (OVERLAPPING CENTER IMAGE) */}
                        <div className="absolute group z-10 top-1/2 -translate-y-1/2">
                          <div
                            data-image-slot="true"
                            className={`w-[160px] h-[100px] relative border-2 border-[#fff] ${images.image6 ? "bg-transparent" : "bg-white"} shadow-[4px_4px_6px_rgba(0,0,0,0.6)] group overflow-hidden cursor-pointer`}
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
                                      objectFit="contain"
                                    />
                                  </div>

                                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                                      onClick={() =>
                                        handleZoom("image6", "out")
                                      }
                                      className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                      title="Zoom Out"
                                    >
                                      <ZoomOut className="w-3 h-3 text-gray-700" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRotate("image6")}
                                    className="absolute top-1 right-[50px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                    title="Rotate image"
                                  >
                                    <RotateCw className="w-3 h-3 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      openImageSourceModal("image6", e)
                                    }
                                    className="absolute top-1 right-7 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                    title="Edit image"
                                  >
                                    <Pencil className="w-3 h-3 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete("image6", fileInputRef6)
                                    }
                                    className="absolute top-1 right-1 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                    title="Delete image"
                                  >
                                    <Trash className="w-3 h-3 text-red-500" />
                                  </button>
                                </>
                              ) : (
                                <div
                                  data-html2canvas-ignore="true"
                                  onClick={(e) =>
                                    openImageSourceModal("image6", e)
                                  }
                                  className="w-full h-full bg-white text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-[10px] hover:bg-gray-100"
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

                      {/* Headline, Description & Disclaimer Container */}
                      <div
                        data-safezone-container="true"
                        className={`text-[10px] justify-self-center mt-3 w-full flex flex-col justify-between h-[290px] max-h-[290px] font-normal text-[#ffffff] italic relative z-10 leading-[1.6] border-[3.5px] border-solid border-transparent rounded-lg px-2 pt-2 pb-3 overflow-hidden transition-all duration-150 group/sec ${
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
                          className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                        {/* Headline Text */}
                        {!isFieldDeleted("headlineText") && (
                          <DraggableBox
                            id="headlineText"
                            position={fieldPositions.headlineText}
                            onPositionChange={updateFieldPosition}
                            label="Headline"
                            zoom={0.85}
                            disabled={lockedSections.description}
                            containerClassName="shrink-0 w-full"
                            onDelete={() =>
                              removeStandardField(
                                "headlineText",
                                "Headline",
                                headlineText,
                                "Description",
                                fieldStyles.headlineText,
                              )
                            }
                            deleteTitle="Remove Headline"
                          >
                            <StyledInput
                              value={headlineText}
                              onChange={(e) => setHeadlineText(e.target.value)}
                              inputStyle={fieldStyles.headlineText}
                              onChangeStyle={(s) =>
                                updateFieldStyle("headlineText", s)
                              }
                              className="text-[16px] px-0 text-center tracking-[-1px] leading-snug font-bold text-[#B3B394] w-full bg-transparent focus:outline-none border-none placeholder-[#B3B394]"
                              placeholder="ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING."
                            />
                          </DraggableBox>
                        )}

                        {/* Property Description */}
                        {!isFieldDeleted("propertyDescription") && (
                          <DraggableBox
                            id="propertyDescription"
                            position={fieldPositions.propertyDescription}
                            onPositionChange={updateFieldPosition}
                            label="Description"
                            zoom={0.85}
                            disabled={lockedSections.description}
                            containerClassName="h-[140px] flex-1 w-full shrink-0 my-1 p-1"
                            className="h-full max-h-full w-full overflow-hidden"
                            onDelete={() =>
                              removeStandardField(
                                "propertyDescription",
                                "Description",
                                description,
                                "Description",
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
                              rows={6}
                              wrapperClassName="h-full max-h-full w-full overflow-hidden"
                              className="font-normal text-[14px] w-full h-full max-h-full z-20 text-[#ffffff] leading-[1.4] italic bg-transparent text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500] overflow-y-auto resize-none"
                              placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible..."
                            />
                          </DraggableBox>
                        )}

                        {/* Disclaimer Text */}
                        {!isFieldDeleted("disclaimer") && (
                          <DraggableBox
                            id="disclaimer"
                            position={fieldPositions.disclaimer}
                            onPositionChange={updateFieldPosition}
                            label="Disclaimer"
                            zoom={0.85}
                            disabled={lockedSections.description}
                            containerClassName="shrink-0 w-full"
                            onDelete={() =>
                              removeStandardField(
                                "disclaimer",
                                "Disclaimer",
                                disclaimerText,
                                "Description",
                                fieldStyles.disclaimerText,
                              )
                            }
                            deleteTitle="Remove Disclaimer"
                          >
                            <div className="relative px-2 pt-1 pb-0 z-2 gap-2 flex justify-self-center text-[#B3B394] mb-[10px] shrink-0">
                              <span className="flex flex-col mt-0.5 shrink-0">
                                <House className="w-4 h-4" />
                              </span>
                              <p className="text-[8px] leading-tight text-[#B3B394] select-none pointer-events-none">
                                {disclaimerText ||
                                  "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless."}
                              </p>
                            </div>
                          </DraggableBox>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN (25%) ── */}
                  <div className="w-[27%] flex flex-col gap-2 relative">
                    {/* Price Section - Overlaying bottom-right of main hero image */}
                    {!isFieldDeleted("priceAmount") && (
                      <div className="mt-[-65px] mb-1 relative z-20 px-1">
                        <StyledInput
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          inputStyle={fieldStyles.amount}
                          onChangeStyle={(s) => updateFieldStyle("amount", s)}
                          className="font-bold text-[36px] h-[40px] w-full leading-none mt-0 bg-transparent text-[#B3B394] text-left focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[200] whitespace-nowrap"
                          placeholder="$000,000"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    )}

                    {/* Details List Section */}
                    <div
                      data-safezone-container="true"
                      className={`space-y-1 text-[8px] relative border-[3.5px] border-solid border-transparent flex-1 rounded-lg p-0.5 transition-all duration-150 group/sec ${
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
                        className={`absolute top-0 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                      {/* By-Law Restrictions */}
                      {!isFieldDeleted("byLawRestrictions") && (
                        <DraggableBox
                          id="byLawRestrictions"
                          position={fieldPositions.byLawRestrictions}
                          onPositionChange={updateFieldPosition}
                          label="By-Law Restrictions"
                          zoom={0.85}
                          disabled={lockedSections.details}
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
                          <div>
                            <StyledInput
                              value={byLawLabel}
                              onChange={(e) => setByLawLabel(e.target.value)}
                              inputStyle={fieldStyles.byLawLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawLabel", s)
                              }
                              className="font-bold text-[#B3B394] text-[10px] whitespace-nowrap bg-transparent focus:outline-none border-none uppercase"
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
                              className="font-normal text-white text-[12px] bg-transparent text-left w-full h-[20px] focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="Pets Allowed w/Rest., Rentals Allowed"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Maint. Fees */}
                      {!isFieldDeleted("maintenanceFees") && (
                        <DraggableBox
                          id="maintenanceFees"
                          position={fieldPositions.maintenanceFees}
                          onPositionChange={updateFieldPosition}
                          label="Maint. Fees"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          onDelete={() =>
                            removeStandardField(
                              "maintenanceFees",
                              "Maint. Fees",
                              maintenanceFees,
                              "Details",
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
                              className="font-bold text-[#B3B394] text-[10px] whitespace-nowrap bg-transparent focus:outline-none border-none uppercase"
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
                              className="font-normal text-white text-[12px] bg-transparent text-left w-full h-[20px] focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="$000.00"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Maint. Fees Include */}
                      {!isFieldDeleted("maintenanceFeesInclude") && (
                        <DraggableBox
                          id="maintenanceFeesInclude"
                          position={fieldPositions.maintenanceFeesInclude}
                          onPositionChange={updateFieldPosition}
                          label="Maint. Fees Include"
                          zoom={0.85}
                          disabled={lockedSections.details}
                          onDelete={() =>
                            removeStandardField(
                              "maintenanceFeesInclude",
                              "Maint. Fees Include",
                              maintenanceFeesInclude,
                              "Details",
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
                              className="font-bold text-[#B3B394] text-[10px] whitespace-nowrap bg-transparent focus:outline-none border-none uppercase"
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
                              className="font-normal text-white text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="Gardening, Garbage Pickup, Gas..."
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
                              className="font-bold text-[#B3B394] text-[10px] whitespace-nowrap bg-transparent focus:outline-none border-none uppercase"
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
                              className="font-normal text-white text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="Clothes Washer/Dryer/Fridge..."
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
                              className="font-bold text-[#B3B394] text-[10px] whitespace-nowrap bg-transparent focus:outline-none border-none uppercase"
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
                              className="font-normal text-white text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="Central Location, Golf Course..."
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
                              className="font-bold text-[#B3B394] text-[10px] whitespace-nowrap bg-transparent focus:outline-none border-none uppercase"
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
                              className="font-normal text-white text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="Exercise Centre, Garden..."
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
                          <div>
                            <StyledInput
                              value={viewLabel}
                              onChange={(e) => setViewLabel(e.target.value)}
                              inputStyle={fieldStyles.viewLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("viewLabel", s)
                              }
                              className="font-bold text-[#B3B394] text-[10px] whitespace-nowrap bg-transparent focus:outline-none border-none uppercase"
                              placeholder="VIEW:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={view}
                              onChange={(e) => setView(e.target.value)}
                              inputStyle={fieldStyles.view}
                              onChangeStyle={(s) => updateFieldStyle("view", s)}
                              className="font-normal text-white text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                              placeholder="South & SW - Van Isl."
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>

                    {/* Contact Section */}
                    <div
                      data-safezone-container="true"
                      className={`text-[#B3B394] relative mb-2 border-[3.5px] border-solid border-transparent rounded-lg p-0.5 transition-all duration-150 group/sec ${
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
                        className={`absolute top-0 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                      {/* Contact Name */}
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
                          <div className="font-bold text-[10px] mb-0.5 flex flex-col gap-0.5 whitespace-nowrap">
                            <StyledInput
                              value={contactLabel}
                              onChange={(e) => setContactLabel(e.target.value)}
                              inputStyle={fieldStyles.contactLabel}
                              onChangeStyle={(s) =>
                                updateFieldStyle("contactLabel", s)
                              }
                              className="font-normal text-[10px] text-[#B3B394] uppercase bg-transparent focus:outline-none border-none"
                              placeholder="CONTACT:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              inputStyle={fieldStyles.fullName}
                              onChangeStyle={(s) =>
                                updateFieldStyle("fullName", s)
                              }
                              rows={1}
                              className="text-[15px] text-[#B3B394] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[500]"
                              placeholder="FIRSTNAME LASTNAME"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Brokerage Name */}
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
                            inputStyle={fieldStyles.propertyName}
                            onChangeStyle={(s) =>
                              updateFieldStyle("propertyName", s)
                            }
                            className="text-[12px] font-thin h-[18px] bg-transparent text-left text-white w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                            placeholder="MACDONALD Realty"
                          />
                        </DraggableBox>
                      )}

                      <div className="w-full mt-0.5">
                        {/* Phone Number */}
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
                            <div className="flex gap-1 text-white text-[12px] items-center whitespace-nowrap">
                              <StyledInput
                                value={phoneLabel}
                                onChange={(e) => setPhoneLabel(e.target.value)}
                                inputStyle={fieldStyles.phoneLabel}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("phoneLabel", s)
                                }
                                className="text-white text-[12px] bg-transparent focus:outline-none border-none uppercase"
                                placeholder="PHONE:"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                inputStyle={fieldStyles.number}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("number", s)
                                }
                                rows={1}
                                className="font-thin text-[12px] h-[18px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                                placeholder="604.000.0000"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Email */}
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
                            <div className="flex gap-1 text-white text-[11px] items-center whitespace-nowrap">
                              <StyledInput
                                value={emailLabel}
                                onChange={(e) => setEmailLabel(e.target.value)}
                                inputStyle={fieldStyles.emailLabel}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("emailLabel", s)
                                }
                                className="text-white text-[11px] bg-transparent focus:outline-none border-none uppercase"
                                placeholder="EMAIL:"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                inputStyle={fieldStyles.email}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("email", s)
                                }
                                rows={1}
                                className="font-thin text-[11px] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                                placeholder="FIRST@LAST.COM"
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

          {/* Page 2 Divider - screen only */}
          <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
            <div className="h-[1px] bg-gray-300 flex-1"></div>
            <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
              PAGE 2
            </span>
            <div className="h-[1px] bg-gray-300 flex-1"></div>
          </div>

          {/* ── PAGE 2 OUTER BLEED CONTAINER ── */}
          <div
            className="flex flex-col pdf-page bg-[#2B612A] shadow-xl relative overflow-hidden select-none font-['ArialBoldBcfp17'] font-bold"
            style={{
              width: showBleed ? "8.75in" : "8.5in",
              height: showBleed ? "11.25in" : "11.0in",
              zoom: 0.85,
              fontFamily: "'ArialBoldBcfp17', Arial, sans-serif",
              fontWeight: 700,
            }}
          >
            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="relative bg-[#2B612A] w-full flex-1 h-full flex flex-col py-3 font-['ArialBoldBcfp17'] font-bold">
                {/* PAGE 2 HEADER */}
                <div
                  data-safezone-container="true"
                  className={`flex flex-col self-end bg-[#2B612A] relative border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec ${
                    lockedSections.page2Header
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("page2Header");
                    }}
                    className={`absolute top-0 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.page2Header
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                    title={
                      lockedSections.page2Header
                        ? "Unlock Header Section"
                        : "Lock Header Section"
                    }
                  >
                    {lockedSections.page2Header ? (
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

                  <div className="flex flex-col items-center">
                    <div className="text-[28px] font-light leading-none mt-0 text-white flex justify-center items-center gap-1">
                      <span className="text-[16px]">#</span>
                      <StyledInput
                        value={addressCode}
                        onChange={(e) => setAddressCode(e.target.value)}
                        inputStyle={fieldStyles.addressCode}
                        onChangeStyle={(s) =>
                          updateFieldStyle("addressCode", s)
                        }
                        className="font-light text-[28px] w-[150px] mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
                        placeholder="0000-0000"
                        wrapperClassName="w-auto shrink-0"
                      />
                      {!isFieldDeleted("roadName") && (
                        <DraggableBox
                          id="roadNamePage2"
                          position={fieldPositions.roadName}
                          onPositionChange={updateFieldPosition}
                          label="Road / Suite"
                          zoom={0.85}
                          disabled={lockedSections.page2Header}
                          onDelete={() =>
                            removeStandardField(
                              "roadName",
                              "Road / Suite",
                              roadName,
                              "Header",
                              fieldStyles.roadName,
                            )
                          }
                          deleteTitle="Remove Road / Suite"
                        >
                          <div className="text-white flex uppercase items-center gap-1">
                            <StyledInput
                              value={roadLabelBefore}
                              onChange={(e) =>
                                setRoadLabelBefore(e.target.value)
                              }
                              inputStyle={fieldStyles.roadLabelBefore}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadLabelBefore", s)
                              }
                              className="text-white text-[28px] uppercase bg-transparent text-right focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                              placeholder="Number"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={roadName}
                              onChange={(e) => setRoadName(e.target.value)}
                              inputStyle={fieldStyles.roadName}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadName", s)
                              }
                              className="font-light text-[28px] mt-0 bg-transparent text-white text-center w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
                              placeholder="0"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={roadLabelAfter}
                              onChange={(e) =>
                                setRoadLabelAfter(e.target.value)
                              }
                              inputStyle={fieldStyles.roadLabelAfter}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadLabelAfter", s)
                              }
                              className="text-white text-[28px] uppercase bg-transparent text-left focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                              placeholder="Road"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-1">
                    <StyledInput
                      value={cityLine}
                      onChange={(e) => setCityLine(e.target.value)}
                      inputStyle={fieldStyles.cityLine}
                      onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                      className="text-white text-[18px] bg-transparent text-right w-[500px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
                      placeholder="BRIGHOUSE SOUTH, RICHMOND"
                    />
                  </div>
                </div>

                {/* PAGE 2 IMAGE SLOT (IMAGE 8) */}
                <div className="relative flex-1 mt-4 w-full h-full min-h-0 self-center">
                  <div
                    data-image-slot="true"
                    className="w-full h-full overflow-hidden flex justify-center items-center transition-all duration-200 group relative cursor-pointer"
                    onMouseEnter={() => setHoveredSlot("image8")}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={(e) => {
                      if (e.altKey) return;
                      e.stopPropagation();
                      setActiveSlot("image8");
                    }}
                  >
                    <BoxIndicator isVisible={isSlotActive("image8")} />
                    <div
                      className={`w-full h-full relative overflow-hidden flex items-center justify-center ${images.image8 ? "bg-transparent" : "bg-white"}`}
                      onMouseMove={(e) => handleMouseMove("image8", e)}
                      onMouseUp={() => handleMouseUp("image8")}
                      onMouseLeave={() => handleMouseLeave("image8")}
                    >
                      {images.image8 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image8", e)}
                          >
                            <ImageEditor
                              src={images.image8}
                              scale={scale.image8}
                              position={position.image8}
                              rotation={rotation.image8}
                              objectFit="contain"
                            />
                          </div>

                          {/* Zoom Controls */}
                          <div className="absolute z-[22] bottom-3 right-8 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => handleZoom("image8", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image8", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          {/* Rotate / Edit / Delete Buttons */}
                          <button
                            type="button"
                            onClick={() => handleRotate("image8")}
                            className="absolute z-[22] top-3 right-[112px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image8", e)}
                            className="absolute z-[22] top-3 right-16 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image8", fileInputRef8)
                            }
                            className="absolute z-[22] top-3 right-3 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image8", e)}
                          className="w-full relative z-10 h-full text-gray-600 bg-white flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-100 transition-colors"
                        >
                          Select Image
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef8}
                        onChange={(e) => handleImageChange("image8", e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* PAGE 2 FOOTER */}
                <div className="text-left text-white text-[10px] mt-6 flex mb-2">
                  <StyledInput
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    inputStyle={fieldStyles.footerText}
                    onChangeStyle={(s) => updateFieldStyle("footerText", s)}
                    className="text-left text-white text-[10px] bg-transparent focus:outline-none border-none placeholder-white uppercase"
                    placeholder="DESIGNED AND PRINTED BY BC FLOOR PLANS"
                  />
                </div>
              </div>
            </SafeZoneWrapper>
          </div>
        </>
      </FontFolderProvider>
    );
  },
);

BcfpStandard17.displayName = "BcfpStandard17";

export default BcfpStandard17;
