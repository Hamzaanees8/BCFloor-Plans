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

export interface BcfpStandard14Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard14Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

// ─── BoxIndicator ─────────────────────────────────────────────────────────────
// Canva-style 3.5px colored border indicator for active/hovered image slots
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

const BcfpStandard14 = forwardRef<BcfpStandard14Ref, BcfpStandard14Props>(
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
    const [headline, setHeadline] = useState("ON TOP OF IT ALL!");
    const [subheadline, setSubheadline] = useState(
      "BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.",
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
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM |");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM |");
    const [sqftLabel, setSqftLabel] = useState("SQ FT |");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
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
      contact: false,
      disclaimer: false,
      address: false,
      specs: false,
      headlineDesc: false,
      details: false,
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 5. Image States (16 Slots) ────────────────────────────────────────────
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
      image14: null as string | null,
      image15: null as string | null,
      image16: null as string | null,
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
      image14: 1,
      image15: 1,
      image16: 1,
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
      image14: { x: 0, y: 0 },
      image15: { x: 0, y: 0 },
      image16: { x: 0, y: 0 },
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
      image14: 0,
      image15: 0,
      image16: 0,
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
      image14: false,
      image15: false,
      image16: false,
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
      image14: { x: 0, y: 0 },
      image15: { x: 0, y: 0 },
      image16: { x: 0, y: 0 },
    });

    // ── 6. Modals & Slot Selection ────────────────────────────────────────────
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

    // Click outside clears activeSlot
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

    // ── 7. Image Input Refs ───────────────────────────────────────────────────
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
    const fileInputRef14 = useRef<HTMLInputElement | null>(null);
    const fileInputRef15 = useRef<HTMLInputElement | null>(null);
    const fileInputRef16 = useRef<HTMLInputElement | null>(null);

    const fileInputRefs: Record<
      string,
      React.RefObject<HTMLInputElement | null>
    > = {
      image1: fileInputRef1,
      image2: fileInputRef2,
      image3: fileInputRef3,
      image4: fileInputRef4,
      image5: fileInputRef5,
      image6: fileInputRef6,
      image7: fileInputRef7,
      image8: fileInputRef8,
      image9: fileInputRef9,
      image10: fileInputRef10,
      image11: fileInputRef11,
      image12: fileInputRef12,
      image13: fileInputRef13,
      image14: fileInputRef14,
      image15: fileInputRef15,
      image16: fileInputRef16,
    };

    // Auto-populate from orderData and context formData
    useEffect(() => {
      if (orderData) {
        const prop = orderData.property;
        const agent = orderData.agent;

        if (prop) {
          if (prop.listing_price) setAmount(prop.listing_price.toString());
          if (prop.bedrooms) setBedroom(prop.bedrooms.toString());
          if (prop.bathrooms) setBathroom(prop.bathrooms.toString());
          if (prop.square_footage) setSqft(prop.square_footage.toString());
          if (prop.year_constructed)
            setBuiltYear(prop.year_constructed.toString());
          if (prop.description) setDescription(prop.description);
          if (prop.mls_number) setAddressCode(prop.mls_number);

          const fullAddress = prop.suite
            ? `${prop.suite} - ${prop.address}`
            : prop.address;
          if (fullAddress) setRoadName(prop.suite ?? "");

          let city = "";
          if (prop.city) city += prop.city;
          if (prop.province) city += (city ? ", " : "") + prop.province;
          if (prop.postal_code) city += (city ? " " : "") + prop.postal_code;
          if (city) setCityLine(prop.address || city);
        }

        if (agent) {
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if (agent.company_name) setPropertyName(agent.company_name);
          if (agent.primary_phone) setNumber(agent.primary_phone);

          const agentLogo =
            (agent as any)?.company_logo_url ||
            (agent as any)?.logo_url ||
            (agent as any)?.logo ||
            null;
          if (agentLogo) {
            setImages((prev) => ({
              ...prev,
              image2: prev.image2 || agentLogo,
            }));
          }
        }
      }

      if (formData) {
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";
        if (formData.byLawRestrictions)
          setByLawRestrictions(s(formData.byLawRestrictions));
        if (formData.maintenanceFees) setMaintFees(s(formData.maintenanceFees));
        if (formData.maintenanceFeesInclude)
          setMaintFeesInclude(s(formData.maintenanceFeesInclude));
        if (formData.featuresIncluded)
          setFeaturesIncluded(s(formData.featuresIncluded));
        if (formData.siteInfluences)
          setSiteInfluences(s(formData.siteInfluences));
        if (formData.amenities) setAmenities(s(formData.amenities));
        if (formData.view) setView(s(formData.view));
        if (formData.headline) setHeadline(s(formData.headline));
        if ((formData as any)?.subheadline || formData.subtitle)
          setSubheadline(
            s((formData as any)?.subheadline || formData.subtitle),
          );
        if (formData.description) setDescription(s(formData.description));
        if (formData.fullName) setFullName(s(formData.fullName));
        if (formData.email) setEmail(s(formData.email));
        if (formData.propertyName) setPropertyName(s(formData.propertyName));
        if (formData.amount) setAmount(s(formData.amount));
        if (formData.number) setNumber(s(formData.number));
        if (formData.addressCode) setAddressCode(s(formData.addressCode));
        if (formData.roadName) setRoadName(s(formData.roadName));
        if (formData.cityLine) setCityLine(s(formData.cityLine));
        if (formData.bedroom) setBedroom(s(formData.bedroom));
        if (formData.bathroom) setBathroom(s(formData.bathroom));
        if (formData.sqft) setSqft(s(formData.sqft));
        if (formData.builtYear) setBuiltYear(s(formData.builtYear));

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
          setFieldStyles(formData.fieldStyles as Record<string, TextStyle>);
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

    // Update context when local state changes
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
        subtitle: subheadline,
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
      subheadline,
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

    // Expose export/import methods via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard14",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#3A8D3D",
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
              fontSize: fieldStyles.fullName?.fontSize || "11px",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "9px",
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
              fontSize: fieldStyles.roadName?.fontSize || "13px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "10px",
            },
          },
          expandedDetail1Title: byLawLabel || "BY-LAW RESTRICTIONS:",
          expandedDetail1Description: byLawRestrictions,
          expandedDetail2Title: maintFeesLabel || "MAINT. FEES:",
          expandedDetail2Description: maintFees,
          expandedDetail3Title: maintFeesIncludeLabel || "MAINT. FEES INCLUDE:",
          expandedDetail3Description: maintFeesInclude,
          expandedDetail4Title: featuresIncludedLabel || "FEATURES INCLUDED:",
          expandedDetail4Description: featuresIncluded,
          keyHighlightLabel: siteInfluencesLabel || "SITE INFLUENCES:",
          keyHighlights: siteInfluences
            ? siteInfluences.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            headline,
            subheadline,
            amenities,
            view,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            addressCode,
            cityLine,
            contactLabel,
            phoneLabel,
            emailLabel,
            bedroomLabel,
            bathroomLabel,
            sqftLabel,
            builtYearLabel,
            roadLabelBefore,
            roadLabelAfter,
            byLawLabel,
            maintFeesLabel,
            maintFeesIncludeLabel,
            featuresIncludedLabel,
            siteInfluencesLabel,
            amenitiesLabel,
            viewLabel,
            disclaimerText,
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
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";

        if (state.offeredAtPrice) setAmount(s(state.offeredAtPrice));
        if (state.realtorName) setFullName(s(state.realtorName));
        if (state.emailLink) setEmail(s(state.emailLink));
        if (state.companyName) setPropertyName(s(state.companyName));
        if (state.propertyNotesTitle) setRoadName(s(state.propertyNotesTitle));
        if (state.propertyNotesDescription)
          setDescription(s(state.propertyNotesDescription));

        if (state.expandedDetail1Description)
          setByLawRestrictions(s(state.expandedDetail1Description));
        if (state.expandedDetail2Description)
          setMaintFees(s(state.expandedDetail2Description));
        if (state.expandedDetail3Description)
          setMaintFeesInclude(s(state.expandedDetail3Description));
        if (state.expandedDetail4Description)
          setFeaturesIncluded(s(state.expandedDetail4Description));

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
          if (details.headline) setHeadline(s(details.headline));
          if (details.subheadline) setSubheadline(s(details.subheadline));
          if (details.amenities) setAmenities(s(details.amenities));
          if (details.view) setView(s(details.view));
          if (details.bedroom) setBedroom(s(details.bedroom));
          if (details.bathroom) setBathroom(s(details.bathroom));
          if (details.sqft) setSqft(s(details.sqft));
          if (details.builtYear) setBuiltYear(s(details.builtYear));
          if (details.number) setNumber(s(details.number));
          if (details.addressCode) setAddressCode(s(details.addressCode));
          if (details.cityLine) setCityLine(s(details.cityLine));

          if (details.contactLabel) setContactLabel(s(details.contactLabel));
          if (details.phoneLabel) setPhoneLabel(s(details.phoneLabel));
          if (details.emailLabel) setEmailLabel(s(details.emailLabel));
          if (details.bedroomLabel) setBedroomLabel(s(details.bedroomLabel));
          if (details.bathroomLabel) setBathroomLabel(s(details.bathroomLabel));
          if (details.sqftLabel) setSqftLabel(s(details.sqftLabel));
          if (details.builtYearLabel)
            setBuiltYearLabel(s(details.builtYearLabel));
          if (details.roadLabelBefore)
            setRoadLabelBefore(s(details.roadLabelBefore));
          if (details.roadLabelAfter)
            setRoadLabelAfter(s(details.roadLabelAfter));
          if (details.byLawLabel) setByLawLabel(s(details.byLawLabel));
          if (details.maintFeesLabel)
            setMaintFeesLabel(s(details.maintFeesLabel));
          if (details.maintFeesIncludeLabel)
            setMaintFeesIncludeLabel(s(details.maintFeesIncludeLabel));
          if (details.featuresIncludedLabel)
            setFeaturesIncludedLabel(s(details.featuresIncludedLabel));
          if (details.siteInfluencesLabel)
            setSiteInfluencesLabel(s(details.siteInfluencesLabel));
          if (details.amenitiesLabel)
            setAmenitiesLabel(s(details.amenitiesLabel));
          if (details.viewLabel) setViewLabel(s(details.viewLabel));
          if (details.disclaimerText)
            setDisclaimerText(s(details.disclaimerText));

          if (details.fieldPositions) {
            setFieldPositions(
              details.fieldPositions as Record<
                string,
                { x: number; y: number }
              >,
            );
          }
        }

        const rawStyles =
          (payload.content?.fieldStyles as unknown as Record<
            string,
            TextStyle
          >) || {};
        const styles: Record<string, TextStyle> = { ...rawStyles };

        // Normalize foreign backend defaults
        if (styles.fullName && styles.fullName.fontSize === "20px") {
          styles.fullName = { ...styles.fullName, fontSize: "11px" };
        }
        if (styles.propertyName && styles.propertyName.fontSize === "20px") {
          styles.propertyName = { ...styles.propertyName, fontSize: "11px" };
        }
        if (styles.email && styles.email.fontSize === "20px") {
          styles.email = { ...styles.email, fontSize: "9px" };
        }
        if (styles.roadName && styles.roadName.fontSize === "28px") {
          styles.roadName = { ...styles.roadName, fontSize: "13px" };
        }
        if (styles.amount && styles.amount.fontSize === "28px") {
          styles.amount = { ...styles.amount, fontSize: "36px" };
        }
        if (styles.description && styles.description.fontSize === "20px") {
          styles.description = { ...styles.description, fontSize: "10px" };
        }

        setFieldStyles(styles);

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
      },
    }));

    // ── Image Handlers ─────────────────────────────────────────────────────────
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
      refObj: React.RefObject<HTMLInputElement | null>,
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (refObj.current) refObj.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        return { ...prev, [key]: Math.min(Math.max(newScale, 0.1), 5) };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
    };

    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      if (e.altKey) return;
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      const dx = (e.clientX - lastPosition.current[key].x) / 0.55;
      const dy = (e.clientY - lastPosition.current[key].y) / 0.55;

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

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (!currentImageSlot) return;
      setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    const openImageSourceModal = (imageSlot: string, e?: React.MouseEvent) => {
      if (e?.altKey) return;
      setCurrentImageSlot(imageSlot);
      setShowGallery(true);
    };

    // Helper renderer for Three-Layer Image Pattern
    const renderImageSlot = (
      slotKey: keyof typeof images,
      containerClass: string,
      zoomClass = "bottom-2 right-2",
      editClass = "top-2 right-10",
      deleteClass = "top-2 right-2",
      rotateClass = "top-2 right-[72px]",
      isLogoSlot = false,
      objectFit: "contain" | "cover" = "cover",
    ) => {
      const refObj = fileInputRefs[slotKey];
      return (
        <div
          data-image-slot="true"
          data-slot-type={isLogoSlot ? "logo" : undefined}
          data-logo-slot={isLogoSlot ? "true" : undefined}
          className={`${containerClass} relative overflow-hidden group cursor-pointer select-none`}
          onMouseEnter={() => setHoveredSlot(slotKey)}
          onMouseLeave={() => setHoveredSlot(null)}
          onClick={(e) => {
            if (e.altKey) return;
            e.stopPropagation();
            setActiveSlot(slotKey);
          }}
        >
          {/* Canva-style Box Indicator */}
          <BoxIndicator isVisible={isSlotActive(slotKey)} />

          {/* LAYER 2: Mouse Event Container */}
          <div
            className="w-full h-full relative overflow-hidden flex items-center justify-center border-t-2 border-b-2 border-white"
            onMouseMove={(e) => handleMouseMove(slotKey, e)}
            onMouseUp={() => handleMouseUp(slotKey)}
            onMouseLeave={() => handleMouseLeave(slotKey)}
          >
            {images[slotKey] ? (
              <>
                {/* LAYER 3: Drag Wrapper + ImageEditor */}
                <div
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => handleMouseDown(slotKey, e)}
                >
                  <ImageEditor
                    src={images[slotKey]!}
                    scale={scale[slotKey]}
                    position={position[slotKey]}
                    rotation={rotation[slotKey]}
                    objectFit={objectFit}
                  />
                </div>

                {/* Zoom Controls (NO data-html2canvas-ignore) */}
                <div
                  className={`absolute ${zoomClass} flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20`}
                >
                  <button
                    type="button"
                    onClick={() => handleZoom(slotKey, "in")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(slotKey, "out")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                {/* Rotate Button */}
                <button
                  type="button"
                  onClick={() => handleRotate(slotKey)}
                  className={`absolute ${rotateClass} z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden`}
                  title="Rotate image"
                >
                  <RotateCw className="w-4 h-4 text-gray-700" />
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={(e) => openImageSourceModal(slotKey, e)}
                  className={`absolute ${editClass} z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto`}
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(slotKey, refObj)}
                  className={`absolute ${deleteClass} z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto`}
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                data-html2canvas-ignore="true"
                onClick={(e) => openImageSourceModal(slotKey, e)}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
              >
                Select Image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              ref={refObj}
              onChange={(e) => handleImageChange(slotKey, e)}
              className="hidden"
            />
          </div>
        </div>
      );
    };

    return (
      <div className="w-full flex flex-col items-center justify-center font-alexandria py-8 gap-0">
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

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SPREAD 1: TOP SHEET BANNERS (PAGE 4 | PAGE 1)                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div
          data-html2canvas-ignore="true"
          className="w-[17in] flex items-center justify-between gap-6 select-none"
          style={{ zoom: 0.55, margin: "0 auto 32px auto" }}
        >
          <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
            PAGE 4
          </div>
          <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
            PAGE 1
          </div>
        </div>

        {/* SPREAD 1: CONTAINER 1 (.pdf-page) */}
        <div
          className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
          style={{
            width: showBleed ? "17.25in" : "17.0in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.55,
            margin: "0 auto",
            marginBottom: "40px",
          }}
        >
          {/* Full Bleed Green Background on Right Page (Page 1) */}
          <div
            className="absolute inset-y-0 right-0 w-1/2 z-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
            }}
          />

          {/* SPREAD 1: CONTAINER 2 (SafeZoneWrapper) */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            {/* SPREAD 1: CONTAINER 3 (Content Container) */}
            <div className="relative w-full h-full flex items-stretch font-alexandria">
              {/* ───────────────────────────────────────────────────────────── */}
              {/* PAGE 4 (LEFT HALF): Floor Plan / Main Image on White          */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="w-1/2 relative h-full flex flex-col justify-between bg-white overflow-visible">
                {/* Main Image 1 (Floor Plan) — Inside safezone with 20px less height */}
                <div className="absolute inset-x-0 top-0 bottom-[100px] z-10 bg-white flex items-center justify-center">
                  {renderImageSlot(
                    "image1",
                    "w-full h-full bg-white",
                    "bottom-3 right-3",
                    "top-4 right-10",
                    "top-4 right-2",
                    "top-4 right-[72px]",
                    false,
                    "contain",
                  )}
                </div>

                {/* Contact Box (Top Left Over Main Image - Touching Top Edge) */}
                <div
                  className="absolute left-[40px] w-[190px] z-20"
                  style={{ top: showBleed ? "-0.375in" : "-0.25in" }}
                >
                  <div
                    data-safezone-container="true"
                    className={`flex flex-col gap-1 p-3 pt-16 pb-3.5 relative border-[3.5px] border-solid border-transparent rounded-none transition-all duration-150 group/sec ${
                      lockedSections.contact
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                    style={{
                      background:
                        "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                    }}
                  >
                    {/* Section Lock Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("contact");
                      }}
                      className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    {/* Agent Name */}
                    {!isFieldDeleted("contactName") && (
                      <DraggableBox
                        id="fullName"
                        position={fieldPositions.fullName}
                        onPositionChange={updateFieldPosition}
                        label="Agent Name"
                        zoom={0.55}
                        disabled={lockedSections.contact}
                        onDelete={() =>
                          removeStandardField(
                            "contactName",
                            "Agent Name",
                            fullName,
                            "Page 4 - Contact",
                            fieldStyles.fullName,
                          )
                        }
                        deleteTitle="Remove Agent Name"
                      >
                        <div className="font-bold text-[11px] text-[#B3B394] flex flex-col">
                          <StyledInput
                            value={contactLabel}
                            onChange={(e) => setContactLabel(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("contactLabel", s)
                            }
                            inputStyle={fieldStyles.contactLabel}
                            className="font-normal text-[10px] text-[#B3B394] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#B3B394] uppercase whitespace-nowrap"
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
                            className="text-[12px] font-bold text-[#B3B394] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[500]"
                            placeholder="FIRSTNAME LASTNAME"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {/* Company / Brokerage */}
                    {!isFieldDeleted("contactBrokerage") && (
                      <DraggableBox
                        id="propertyName"
                        position={fieldPositions.propertyName}
                        onPositionChange={updateFieldPosition}
                        label="Brokerage"
                        zoom={0.55}
                        disabled={lockedSections.contact}
                        onDelete={() =>
                          removeStandardField(
                            "contactBrokerage",
                            "Brokerage",
                            propertyName,
                            "Page 4 - Contact",
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
                          className="text-[11px] font-bold h-[18px] bg-transparent text-left text-white w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                          placeholder="Macdonald Realty"
                        />
                      </DraggableBox>
                    )}

                    <hr className="border-t-2 my-2 border-dotted border-white w-full" />

                    {/* Phone */}
                    {!isFieldDeleted("contactPhone") && (
                      <DraggableBox
                        id="number"
                        position={fieldPositions.number}
                        onPositionChange={updateFieldPosition}
                        label="Phone"
                        zoom={0.55}
                        disabled={lockedSections.contact}
                        onDelete={() =>
                          removeStandardField(
                            "contactPhone",
                            "Phone",
                            number,
                            "Page 4 - Contact",
                            fieldStyles.number,
                          )
                        }
                        deleteTitle="Remove Phone"
                      >
                        <div className="flex gap-2 text-white text-[9px] items-center whitespace-nowrap">
                          <StyledInput
                            value={phoneLabel}
                            onChange={(e) => setPhoneLabel(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("phoneLabel", s)
                            }
                            inputStyle={fieldStyles.phoneLabel}
                            className="text-white text-[9px] bg-transparent text-left focus:outline-none border-none placeholder-white uppercase whitespace-nowrap"
                            placeholder="PHONE:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            inputStyle={fieldStyles.number}
                            onChangeStyle={(s) => updateFieldStyle("number", s)}
                            className="font-thin inline text-[9px] h-[16px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                            placeholder="604.000.0000"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {/* Email */}
                    {!isFieldDeleted("contactEmail") && (
                      <DraggableBox
                        id="email"
                        position={fieldPositions.email}
                        onPositionChange={updateFieldPosition}
                        label="Email"
                        zoom={0.55}
                        disabled={lockedSections.contact}
                        onDelete={() =>
                          removeStandardField(
                            "contactEmail",
                            "Email",
                            email,
                            "Page 4 - Contact",
                            fieldStyles.email,
                          )
                        }
                        deleteTitle="Remove Email"
                      >
                        <div className="flex gap-2 text-white text-[9px] items-center whitespace-nowrap">
                          <StyledInput
                            value={emailLabel}
                            onChange={(e) => setEmailLabel(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("emailLabel", s)
                            }
                            inputStyle={fieldStyles.emailLabel}
                            className="text-white text-[9px] bg-transparent text-left focus:outline-none border-none placeholder-white uppercase whitespace-nowrap"
                            placeholder="EMAIL:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputStyle={fieldStyles.email}
                            onChangeStyle={(s) => updateFieldStyle("email", s)}
                            className="font-thin inline text-[9px] h-[16px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                            placeholder="FIRST@LAST.COM"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Page 4 Bottom Section */}
                <div className="absolute bottom-0 w-full z-20">
                  {/* Stepped Gradient Swatches & Bar */}
                  <div className="flex gap-2 absolute bottom-[65px] right-0 h-[28px] items-center">
                    <div
                      className="opacity-[25%] w-[32px] h-[28px]"
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                      }}
                    />
                    <div
                      className="opacity-[50%] w-[32px] h-[28px]"
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                      }}
                    />
                    <div
                      className="opacity-[75%] w-[32px] h-[28px]"
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                      }}
                    />
                    <div
                      className="flex w-[280px] h-[28px]"
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                      }}
                    />
                  </div>

                  {/* Disclaimer Section */}
                  <div className="absolute bottom-0 right-0 px-6 py-2 z-2 w-[68%]">
                    <div
                      data-safezone-container="true"
                      className={`flex gap-2 text-gray-500 relative border-[3.5px] border-solid border-transparent rounded-none transition-all duration-150 group/sec ${
                        lockedSections.disclaimer
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
                          toggleSectionLock("disclaimer");
                        }}
                        className={`absolute -top-3 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.disclaimer
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                        title={
                          lockedSections.disclaimer
                            ? "Unlock Disclaimer Section"
                            : "Lock Disclaimer Section"
                        }
                      >
                        {lockedSections.disclaimer ? (
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

                      <span className="flex flex-col mt-1 shrink-0">
                        <House className="w-4 h-4 text-gray-400" />
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 8 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1.07208 6.90507H1.20908C1.29908 6.90507 1.36508 6.90507 1.41708 6.95207C1.46108 6.99307 1.48508 7.04807 1.48508 7.11207C1.48508 7.22007 1.40508 7.30107 1.28408 7.30107H1.19308L1.47508 7.75507H1.58608L1.35708 7.38907C1.48808 7.37607 1.58608 7.25507 1.58608 7.11207C1.58608 7.01407 1.53908 6.91807 1.46108 6.86707C1.39608 6.81707 1.32508 6.81007 1.23408 6.81007H0.981079V7.75507H1.07208V6.90507Z"
                            fill="#888888"
                          />
                          <path
                            d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z"
                            fill="#888888"
                          />
                          <path
                            d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z"
                            fill="#888888"
                          />
                          <path
                            d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z"
                            fill="#888888"
                          />
                          <path
                            d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z"
                            fill="#888888"
                          />
                          <path
                            d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z"
                            fill="#888888"
                          />
                          <path
                            d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z"
                            fill="#888888"
                          />
                          <path
                            d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z"
                            fill="#888888"
                          />
                          <path
                            d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9776 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z"
                            fill="#888888"
                          />
                        </svg>
                      </span>

                      {!isFieldDeleted("contactDisclaimer") && (
                        <DraggableBox
                          id="disclaimerText"
                          position={fieldPositions.disclaimerText}
                          onPositionChange={updateFieldPosition}
                          label="Disclaimer"
                          zoom={0.55}
                          disabled={lockedSections.disclaimer}
                          onDelete={() =>
                            removeStandardField(
                              "contactDisclaimer",
                              "Disclaimer",
                              disclaimerText,
                              "Page 4 - Disclaimer",
                              fieldStyles.disclaimerText,
                            )
                          }
                          deleteTitle="Remove Disclaimer"
                        >
                          <StyledInput
                            value={disclaimerText}
                            rows={3}
                            onChange={(e) => setDisclaimerText(e.target.value)}
                            inputStyle={fieldStyles.disclaimerText}
                            onChangeStyle={(s) =>
                              updateFieldStyle("disclaimerText", s)
                            }
                            className="text-[9px] leading-tight text-gray-500 bg-transparent text-left focus:outline-none border-none placeholder-gray-400"
                            placeholder="Enter disclaimer here"
                          />
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  {/* Agent Logo Slot 2 (Bottom Left) */}
                  <div className="absolute left-[35px] bottom-[20px] z-20">
                    {renderImageSlot(
                      "image2",
                      `w-[180px] h-[95px] ${images.image2 ? "bg-transparent" : "border-[2px] border-white shadow-md bg-white"}`,
                      "bottom-2 right-2",
                      "top-2 right-10",
                      "top-2 right-2",
                      "top-2 right-[72px]",
                      true,
                      "contain",
                    )}
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* PAGE 1 (RIGHT HALF): Front Cover Layout                       */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="w-1/2 relative h-full flex flex-col justify-start font-alexandria">
                {/* Top Section: Hero Image 3 with Overlaid Address, Price & Specs Touching Right Edge */}
                <div
                  className="relative h-[550px] overflow-hidden"
                  style={{
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                    marginTop: "35px",
                  }}
                >
                  {renderImageSlot(
                    "image3",
                    "w-full h-full shadow-[4px_4px_8px_rgba(0,0,0,0.5)]",
                    "bottom-3 right-3",
                    "top-4 right-10",
                    "top-4 right-2",
                    "top-4 right-[72px]",
                    false,
                    "cover",
                  )}

                  {/* Address & Price Box (Top Left of Image 3) */}
                  <div className="flex flex-col gap-1 absolute top-[2px] left-[40px] w-[180px] z-20">
                    <div
                      data-safezone-container="true"
                      className={`p-3 relative  border-transparent rounded-none transition-all duration-150 group/sec ${
                        lockedSections.address
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                      }}
                    >
                      {/* Section Lock Button */}
                      <button
                        type="button"
                        data-html2canvas-ignore="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionLock("address");
                        }}
                        className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.address
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                        title={
                          lockedSections.address
                            ? "Unlock Address Section"
                            : "Lock Address Section"
                        }
                      >
                        {lockedSections.address ? (
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

                      {/* MLS / Address Code */}
                      {!isFieldDeleted("addressCode") && (
                        <DraggableBox
                          id="addressCode"
                          position={fieldPositions.addressCode}
                          onPositionChange={updateFieldPosition}
                          label="MLS / Code"
                          zoom={0.55}
                          disabled={lockedSections.address}
                          onDelete={() =>
                            removeStandardField(
                              "addressCode",
                              "MLS / Code",
                              addressCode,
                              "Page 1 - Address",
                              fieldStyles.addressCode,
                            )
                          }
                          deleteTitle="Remove MLS Code"
                        >
                          <div className="tracking-wide text-white mt-0 flex items-center">
                            <span className="text-white text-[22px] font-light">
                              #
                            </span>
                            <StyledInput
                              value={addressCode}
                              onChange={(e) => setAddressCode(e.target.value)}
                              inputStyle={fieldStyles.addressCode}
                              onChangeStyle={(s) =>
                                updateFieldStyle("addressCode", s)
                              }
                              className="font-light text-[22px] h-[26px] w-[145px] leading-none mt-0 bg-transparent text-[#ffffff] text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                              placeholder="0000-0000"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {/* Road Line */}
                      {!isFieldDeleted("roadName") && (
                        <DraggableBox
                          id="roadName"
                          position={fieldPositions.roadName}
                          onPositionChange={updateFieldPosition}
                          label="Road Line"
                          zoom={0.55}
                          disabled={lockedSections.address}
                          onDelete={() =>
                            removeStandardField(
                              "roadName",
                              "Road Line",
                              roadName,
                              "Page 1 - Address",
                              fieldStyles.roadName,
                            )
                          }
                          deleteTitle="Remove Road Line"
                        >
                          <div className="text-[13px] text-white font-bold leading-none mt-0 flex items-center gap-1 whitespace-nowrap">
                            <StyledInput
                              value={roadLabelBefore}
                              onChange={(e) =>
                                setRoadLabelBefore(e.target.value)
                              }
                              inputStyle={fieldStyles.roadLabelBefore}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadLabelBefore", s)
                              }
                              className="text-[13px] text-white font-bold bg-transparent text-left focus:outline-none border-none placeholder-white whitespace-nowrap"
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
                              className="font-light text-[13px] h-[24px] leading-none mt-0 bg-transparent text-[#ffffff] text-center w-[35px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                              placeholder="0"
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
                              className="text-[13px] text-white font-bold bg-transparent text-left focus:outline-none border-none placeholder-white whitespace-nowrap"
                              placeholder="Road"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      <hr className="border-t-2 mt-2 border-dotted border-white w-full" />

                      {/* City Line */}
                      {!isFieldDeleted("cityLine") && (
                        <DraggableBox
                          id="cityLine"
                          position={fieldPositions.cityLine}
                          onPositionChange={updateFieldPosition}
                          label="City Line"
                          zoom={0.55}
                          disabled={lockedSections.address}
                          onDelete={() =>
                            removeStandardField(
                              "cityLine",
                              "City Line",
                              cityLine,
                              "Page 1 - Address",
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
                              inputStyle={fieldStyles.cityLine}
                              onChangeStyle={(s) =>
                                updateFieldStyle("cityLine", s)
                              }
                              className="text-[#B3B394] text-[13px] font-bold h-[40px] bg-transparent text-center focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[200]"
                              placeholder="BRIGHOUSE SOUTH, RICHMOND"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>

                    {/* Price Block */}
                    {!isFieldDeleted("priceAmount") && (
                      <DraggableBox
                        id="amount"
                        position={fieldPositions.amount}
                        onPositionChange={updateFieldPosition}
                        label="Price"
                        zoom={0.55}
                        disabled={lockedSections.address}
                        onDelete={() =>
                          removeStandardField(
                            "priceAmount",
                            "Price",
                            amount,
                            "Page 1 - Price",
                            fieldStyles.amount,
                          )
                        }
                        deleteTitle="Remove Price"
                      >
                        <div
                          className="flex items-center justify-center text-[30px] font-light mt-0 px-2"
                          style={{
                            background:
                              "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                            opacity: 0.95,
                          }}
                        >
                          <StyledInput
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputStyle={fieldStyles.amount}
                            onChangeStyle={(s) => updateFieldStyle("amount", s)}
                            className="font-semibold text-center text-[#ffffff] text-[36px] h-[40px] bg-transparent w-full focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                            placeholder="$000,000"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>

                  {/* Specs Bar Overlay (Bottom Right of Image 3, above overlapping photos) */}
                  <div className="flex gap-2 absolute bottom-[65px] right-0 z-20">
                    <div
                      className="opacity-[25%] w-[32px] h-[34px]"
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                      }}
                    />
                    <div
                      className="opacity-[50%] w-[32px] h-[34px]"
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                      }}
                    />
                    <div
                      className="opacity-[75%] w-[32px] h-[34px]"
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
                      }}
                    />
                    <div
                      data-safezone-container="true"
                      className={`flex items-center px-5 pr-[24px] py-1 relative border-[3.5px] border-solid border-transparent rounded-none transition-all duration-150 group/sec ${
                        lockedSections.specs
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                      style={{
                        background:
                          "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
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

                      <div className="font-bold items-center text-[13px] text-[#B3B394] flex flex-wrap gap-2 whitespace-nowrap">
                        {/* Bedroom */}
                        {!isFieldDeleted("specBedroom") && (
                          <DraggableBox
                            id="specBedroom"
                            position={fieldPositions.specBedroom}
                            onPositionChange={updateFieldPosition}
                            label="Bedrooms"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specBedroom",
                                "Bedrooms",
                                bedroom,
                                "Page 1 - Specs",
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
                                onChangeStyle={(s) =>
                                  updateFieldStyle("bedroom", s)
                                }
                                className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0"
                              />
                              <StyledInput
                                value={bedroomLabel}
                                onChange={(e) =>
                                  setBedroomLabel(e.target.value)
                                }
                                inputStyle={fieldStyles.bedroomLabel}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("bedroomLabel", s)
                                }
                                className="font-bold text-[13px] text-[#B3B394] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="BEDROOM |"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Bathroom */}
                        {!isFieldDeleted("specBathroom") && (
                          <DraggableBox
                            id="specBathroom"
                            position={fieldPositions.specBathroom}
                            onPositionChange={updateFieldPosition}
                            label="Bathrooms"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specBathroom",
                                "Bathrooms",
                                bathroom,
                                "Page 1 - Specs",
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
                                onChangeStyle={(s) =>
                                  updateFieldStyle("bathroom", s)
                                }
                                className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0"
                              />
                              <StyledInput
                                value={bathroomLabel}
                                onChange={(e) =>
                                  setBathroomLabel(e.target.value)
                                }
                                inputStyle={fieldStyles.bathroomLabel}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("bathroomLabel", s)
                                }
                                className="font-bold text-[13px] text-[#B3B394] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="BATHROOM |"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Sqft */}
                        {!isFieldDeleted("specSqft") && (
                          <DraggableBox
                            id="specSqft"
                            position={fieldPositions.specSqft}
                            onPositionChange={updateFieldPosition}
                            label="Square Footage"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specSqft",
                                "Square Footage",
                                sqft,
                                "Page 1 - Specs",
                                fieldStyles.sqft,
                              )
                            }
                            deleteTitle="Remove Sqft"
                          >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <StyledInput
                                value={sqft}
                                onChange={(e) => setSqft(e.target.value)}
                                inputStyle={fieldStyles.sqft}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("sqft", s)
                                }
                                className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="000"
                              />
                              <StyledInput
                                value={sqftLabel}
                                onChange={(e) => setSqftLabel(e.target.value)}
                                inputStyle={fieldStyles.sqftLabel}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("sqftLabel", s)
                                }
                                className="font-bold text-[13px] text-[#B3B394] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="SQ FT |"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Built Year */}
                        {!isFieldDeleted("specBuiltYear") && (
                          <DraggableBox
                            id="specBuiltYear"
                            position={fieldPositions.specBuiltYear}
                            onPositionChange={updateFieldPosition}
                            label="Built Year"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specBuiltYear",
                                "Built Year",
                                builtYear,
                                "Page 1 - Specs",
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
                                inputStyle={fieldStyles.builtYearLabel}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("builtYearLabel", s)
                                }
                                className="font-bold text-[13px] text-[#B3B394] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="BUILT IN"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                              <StyledInput
                                value={builtYear}
                                onChange={(e) => setBuiltYear(e.target.value)}
                                inputStyle={fieldStyles.builtYear}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("builtYear", s)
                                }
                                className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0000"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: 4 Photo Grid with Centered Logo Overlay (Overlapping image3) */}
                <div
                  className="w-full relative z-20 px-20"
                  style={{ marginTop: "-55px" }}
                >
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {renderImageSlot(
                      "image4",
                      "w-full h-[180px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] place-self-center",
                      "bottom-3 right-3",
                      "top-4 right-10",
                      "top-4 right-2",
                      "top-4 right-[72px]",
                    )}
                    {renderImageSlot(
                      "image5",
                      "w-full h-[180px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] place-self-center",
                      "bottom-3 right-3",
                      "top-4 right-10",
                      "top-4 right-2",
                      "top-4 right-[72px]",
                    )}
                    {renderImageSlot(
                      "image6",
                      "w-full h-[180px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] place-self-center",
                      "bottom-3 right-3",
                      "top-4 right-10",
                      "top-4 right-2",
                      "top-4 right-[72px]",
                    )}
                    {renderImageSlot(
                      "image7",
                      "w-full h-[180px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] place-self-center",
                      "bottom-3 right-3",
                      "top-4 right-10",
                      "top-4 right-2",
                      "top-4 right-[72px]",
                    )}
                  </div>

                  {/* Centered Logo Overlay (Image 8) */}
                  <div className="absolute inset-0 m-auto w-[180px] h-[95px] z-30 flex items-center justify-center">
                    {renderImageSlot(
                      "image8",
                      `w-[180px] h-[95px] ${images.image8 ? "bg-transparent" : "bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.5)] border border-gray-100"}`,
                      "bottom-2 right-2",
                      "top-2 right-10",
                      "top-2 right-2",
                      "top-2 right-[72px]",
                      true,
                      "contain",
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SPREAD 2: BOTTOM SHEET BANNERS (PAGE 2 | PAGE 3)                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div
          data-html2canvas-ignore="true"
          className="w-[17in] flex items-center justify-between gap-6 select-none"
          style={{ zoom: 0.55, margin: "48px auto 32px auto" }}
        >
          <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
            PAGE 2
          </div>
          <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
            PAGE 3
          </div>
        </div>

        {/* SPREAD 2: CONTAINER 1 (.pdf-page) */}
        <div
          className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
          style={{
            width: showBleed ? "17.25in" : "17.0in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.55,
            margin: "0 auto",
            marginBottom: "40px",
          }}
        >
          {/* Full Bleed Green Background across entire Spread 2 (Pages 2 & 3) */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, #00843D 0%, #007A38 20%, #006F32 38%, #00652D 54%, #004D22 100%)",
            }}
          />

          {/* SPREAD 2: CONTAINER 2 (SafeZoneWrapper) */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            {/* SPREAD 2: CONTAINER 3 (Content Container) */}
            <div className="relative w-full h-full flex gap-8 font-alexandria">
              {/* ───────────────────────────────────────────────────────────── */}
              {/* PAGE 2 (LEFT HALF)                                            */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="w-1/2 flex flex-col gap-6">
                <div className="flex gap-4">
                  {/* Left Column: Headlines, Description & Details (50-50% Section Heights) */}
                  <div className="w-6/12 flex flex-col justify-between h-[494px] gap-2">
                    {/* Headline & Description Section (50% height) */}
                    <div
                      data-safezone-container="true"
                      className={`flex-1 flex flex-col justify-between p-2 relative border-[3.5px] border-solid border-transparent rounded-none transition-all duration-150 group/sec ${
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
                        className={`absolute top-0 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.headlineDesc
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                        title={
                          lockedSections.headlineDesc
                            ? "Unlock Headline & Description"
                            : "Lock Headline & Description"
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

                      {/* Main Headline */}
                      {!isFieldDeleted("headline") && (
                        <DraggableBox
                          id="headline"
                          position={fieldPositions.headline}
                          onPositionChange={updateFieldPosition}
                          label="Main Headline"
                          zoom={0.55}
                          disabled={lockedSections.headlineDesc}
                          onDelete={() =>
                            removeStandardField(
                              "headline",
                              "Main Headline",
                              headline,
                              "Page 2 - Description",
                              fieldStyles.headline,
                            )
                          }
                          deleteTitle="Remove Main Headline"
                        >
                          <StyledInput
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            inputStyle={fieldStyles.headline}
                            onChangeStyle={(s) =>
                              updateFieldStyle("headline", s)
                            }
                            className="text-[22px] px-2 text-center tracking-[-1px] font-bold text-[#B3B394] bg-transparent focus:outline-none border-none placeholder-[#B3B394]"
                            placeholder="ON TOP OF IT ALL!"
                          />
                        </DraggableBox>
                      )}

                      {/* Subheadline */}
                      {!isFieldDeleted("subheadline") && (
                        <DraggableBox
                          id="subheadline"
                          position={fieldPositions.subheadline}
                          onPositionChange={updateFieldPosition}
                          label="Subheadline"
                          zoom={0.55}
                          disabled={lockedSections.headlineDesc}
                          onDelete={() =>
                            removeStandardField(
                              "subheadline",
                              "Subheadline",
                              subheadline,
                              "Page 2 - Description",
                              fieldStyles.subheadline,
                            )
                          }
                          deleteTitle="Remove Subheadline"
                        >
                          <StyledInput
                            value={subheadline}
                            rows={2}
                            onChange={(e) => setSubheadline(e.target.value)}
                            inputStyle={fieldStyles.subheadline}
                            onChangeStyle={(s) =>
                              updateFieldStyle("subheadline", s)
                            }
                            className="text-[16px] px-2 text-center tracking-[-1px] font-bold text-[#B3B394] bg-transparent focus:outline-none border-none placeholder-[#B3B394]"
                            placeholder="BEAUTIFUL SUB-PENTHOUSE..."
                          />
                        </DraggableBox>
                      )}

                      {/* Description */}
                      {!isFieldDeleted("propertyDescription") && (
                        <DraggableBox
                          id="description"
                          position={fieldPositions.description}
                          onPositionChange={updateFieldPosition}
                          label="Description"
                          zoom={0.55}
                          disabled={lockedSections.headlineDesc}
                          onDelete={() =>
                            removeStandardField(
                              "propertyDescription",
                              "Description",
                              description,
                              "Page 2 - Description",
                              fieldStyles.description,
                            )
                          }
                          deleteTitle="Remove Description"
                        >
                          <StyledInput
                            value={description}
                            rows={6}
                            onChange={(e) => setDescription(e.target.value)}
                            inputStyle={fieldStyles.description}
                            onChangeStyle={(s) =>
                              updateFieldStyle("description", s)
                            }
                            className="font-normal text-[10px] min-h-[110px] max-h-[150px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                            placeholder="This centrally located 2 bedroom..."
                          />
                        </DraggableBox>
                      )}
                    </div>

                    {/* Details Section Container (50% height) */}
                    <div
                      data-safezone-container="true"
                      className={`flex-1 grid grid-cols-2 gap-2 p-2 text-white relative border-[3.5px] border-solid border-transparent rounded-none transition-all duration-150 group/sec ${
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

                      {/* Left Column Details */}
                      <div className="flex flex-col gap-2">
                        {/* By-Law Restrictions */}
                        {!isFieldDeleted("byLawRestrictions") && (
                          <DraggableBox
                            id="byLawRestrictions"
                            position={fieldPositions.byLawRestrictions}
                            onPositionChange={updateFieldPosition}
                            label="By-Law Restrictions"
                            zoom={0.55}
                            disabled={lockedSections.details}
                            onDelete={() =>
                              removeStandardField(
                                "byLawRestrictions",
                                "By-Law Restrictions",
                                byLawRestrictions,
                                "Page 2 - Details",
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
                                className="font-bold text-[#B3B394] text-[12px] bg-transparent text-left focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="BY-LAW RESTRICTIONS:"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                              <StyledInput
                                value={byLawRestrictions}
                                rows={1}
                                onChange={(e) =>
                                  setByLawRestrictions(e.target.value)
                                }
                                inputStyle={fieldStyles.byLawRestrictions}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("byLawRestrictions", s)
                                }
                                className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                                placeholder="Pets Allowed w/Rest., Rentals Allowed"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Maint Fees */}
                        {!isFieldDeleted("maintFees") && (
                          <DraggableBox
                            id="maintFees"
                            position={fieldPositions.maintFees}
                            onPositionChange={updateFieldPosition}
                            label="Maint. Fees"
                            zoom={0.55}
                            disabled={lockedSections.details}
                            onDelete={() =>
                              removeStandardField(
                                "maintFees",
                                "Maint. Fees",
                                maintFees,
                                "Page 2 - Details",
                                fieldStyles.maintFees,
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
                                className="font-bold text-[#B3B394] text-[12px] bg-transparent text-left focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="MAINT. FEES:"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                              <StyledInput
                                value={maintFees}
                                rows={1}
                                onChange={(e) => setMaintFees(e.target.value)}
                                inputStyle={fieldStyles.maintFees}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("maintFees", s)
                                }
                                className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                                placeholder="$000.00"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Maint Fees Include */}
                        {!isFieldDeleted("maintFeesInclude") && (
                          <DraggableBox
                            id="maintFeesInclude"
                            position={fieldPositions.maintFeesInclude}
                            onPositionChange={updateFieldPosition}
                            label="Maint. Fees Include"
                            zoom={0.55}
                            disabled={lockedSections.details}
                            onDelete={() =>
                              removeStandardField(
                                "maintFeesInclude",
                                "Maint. Fees Include",
                                maintFeesInclude,
                                "Page 2 - Details",
                                fieldStyles.maintFeesInclude,
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
                                className="font-bold text-[#B3B394] text-[12px] bg-transparent text-left focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="MAINT. FEES INCLUDE:"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                              <StyledInput
                                value={maintFeesInclude}
                                onChange={(e) =>
                                  setMaintFeesInclude(e.target.value)
                                }
                                inputStyle={fieldStyles.maintFeesInclude}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("maintFeesInclude", s)
                                }
                                className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
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
                            zoom={0.55}
                            disabled={lockedSections.details}
                            onDelete={() =>
                              removeStandardField(
                                "featuresIncluded",
                                "Features Included",
                                featuresIncluded,
                                "Page 2 - Details",
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
                                className="font-bold text-[#B3B394] text-[12px] bg-transparent text-left focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="FEATURES INCLUDED:"
                                wrapperClassName="w-auto whitespace-nowrap"
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
                                className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#fff] placeholder:font-[500]"
                                placeholder="Clothes Washer/Dryer/Fridge..."
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

                      {/* Right Column Details */}
                      <div className="flex flex-col gap-2">
                        {/* Site Influences */}
                        {!isFieldDeleted("siteInfluences") && (
                          <DraggableBox
                            id="siteInfluences"
                            position={fieldPositions.siteInfluences}
                            onPositionChange={updateFieldPosition}
                            label="Site Influences"
                            zoom={0.55}
                            disabled={lockedSections.details}
                            onDelete={() =>
                              removeStandardField(
                                "siteInfluences",
                                "Site Influences",
                                siteInfluences,
                                "Page 2 - Details",
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
                                className="font-bold text-[#B3B394] text-[12px] bg-transparent text-left focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="SITE INFLUENCES:"
                                wrapperClassName="w-auto whitespace-nowrap"
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
                                className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                            zoom={0.55}
                            disabled={lockedSections.details}
                            onDelete={() =>
                              removeStandardField(
                                "amenities",
                                "Amenities",
                                amenities,
                                "Page 2 - Details",
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
                                className="font-bold text-[#B3B394] text-[12px] bg-transparent text-left focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="AMENITIES:"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                              <StyledInput
                                value={amenities}
                                onChange={(e) => setAmenities(e.target.value)}
                                inputStyle={fieldStyles.amenities}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("amenities", s)
                                }
                                className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                            zoom={0.55}
                            disabled={lockedSections.details}
                            onDelete={() =>
                              removeStandardField(
                                "view",
                                "View",
                                view,
                                "Page 2 - Details",
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
                                className="font-bold text-[#B3B394] text-[12px] bg-transparent text-left focus:outline-none border-none uppercase whitespace-nowrap"
                                placeholder="VIEW:"
                                wrapperClassName="w-auto whitespace-nowrap"
                              />
                              <StyledInput
                                value={view}
                                rows={1}
                                onChange={(e) => setView(e.target.value)}
                                inputStyle={fieldStyles.view}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("view", s)
                                }
                                className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                                placeholder="South & SW - Van Isl."
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column of Page 2: Images 9 & 10 */}
                  <div className="grid grid-cols-1 gap-6 w-6/12">
                    {renderImageSlot(
                      "image9",
                      "h-[235px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] z-10",
                      "bottom-2 right-2",
                      "top-2 right-10",
                      "top-2 right-2",
                      "top-2 right-[72px]",
                    )}
                    {renderImageSlot(
                      "image10",
                      "h-[235px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] z-10",
                      "bottom-2 right-2",
                      "top-2 right-10",
                      "top-2 right-2",
                      "top-2 right-[72px]",
                    )}
                  </div>
                </div>

                {/* Bottom of Page 2: Full-Width Image 11 */}
                {renderImageSlot(
                  "image11",
                  "w-full h-[440px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] place-self-center z-10",
                  "bottom-2 right-2",
                  "top-4 right-10",
                  "top-4 right-2",
                  "top-4 right-[72px]",
                )}
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* PAGE 3 (RIGHT HALF)                                           */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="w-1/2 flex gap-4">
                <div className="w-full flex flex-col gap-6">
                  {/* Row 1: Images 12 & 13 */}
                  <div className="grid grid-cols-2 gap-6">
                    {renderImageSlot(
                      "image12",
                      "h-[235px] z-10 border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                      "bottom-2 right-2",
                      "top-2 right-10",
                      "top-2 right-2",
                      "top-2 right-[72px]",
                    )}
                    {renderImageSlot(
                      "image13",
                      "h-[235px] z-10 border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                      "bottom-2 right-2",
                      "top-2 right-10",
                      "top-2 right-2",
                      "top-2 right-[72px]",
                    )}
                  </div>

                  {/* Row 2: Images 14 & 15 */}
                  <div className="grid grid-cols-2 gap-6">
                    {renderImageSlot(
                      "image14",
                      "h-[235px] z-10 border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                      "bottom-2 right-2",
                      "top-2 right-10",
                      "top-2 right-2",
                      "top-2 right-[72px]",
                    )}
                    {renderImageSlot(
                      "image15",
                      "h-[235px] z-10 border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                      "bottom-2 right-2",
                      "top-2 right-10",
                      "top-2 right-2",
                      "top-2 right-[72px]",
                    )}
                  </div>

                  {/* Bottom: Wide Image 16 */}
                  {renderImageSlot(
                    "image16",
                    "h-[440px] z-10 border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                    "bottom-2 right-2",
                    "top-4 right-10",
                    "top-4 right-2",
                    "top-4 right-[72px]",
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

BcfpStandard14.displayName = "BcfpStandard14";

export default BcfpStandard14;
