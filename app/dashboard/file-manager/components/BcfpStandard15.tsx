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

export interface BcfpStandard15Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard15Props {
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

const BcfpStandard15 = forwardRef<BcfpStandard15Ref, BcfpStandard15Props>(
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
    const [mlsNumber, setMlsNumber] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");

    // ── 3. Editable Labels ───────────────────────────────────────────────────
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [mlsLabel, setMlsLabel] = useState("MLS #:");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM •");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM •");
    const [sqftLabel, setSqftLabel] = useState("SQ FT •");
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

    // ── 4. Bleed & Guide State ────────────────────────────────────────────────
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed =
      propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide =
      propShowGuide !== undefined ? propShowGuide : showGuideState;

    // ── 5. Field Styles, Field Positions & Section Locks ─────────────────────
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
      address: false,
      specs: false,
      description: false,
      details: false,
      contact: false,
      price: false,
    });

    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 6. Images State ───────────────────────────────────────────────────────
    const [images, setImages] = useState({
      image1: null as string | null,
      image2: null as string | null,
      image4: null as string | null,
      image5: null as string | null,
      image6: null as string | null,
      image7: null as string | null,
      image8: null as string | null,
      image9: null as string | null,
    });

    const [scale, setScale] = useState({
      image1: 1,
      image2: 1,
      image4: 1,
      image5: 1,
      image6: 1,
      image7: 1,
      image8: 1,
      image9: 1,
    });

    const [position, setPosition] = useState({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
      image8: { x: 0, y: 0 },
      image9: { x: 0, y: 0 },
    });

    const [rotation, setRotation] = useState({
      image1: 0,
      image2: 0,
      image4: 0,
      image5: 0,
      image6: 0,
      image7: 0,
      image8: 0,
      image9: 0,
    });

    const [dragging, setDragging] = useState({
      image1: false,
      image2: false,
      image4: false,
      image5: false,
      image6: false,
      image7: false,
      image8: false,
      image9: false,
    });

    const lastPosition = useRef({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
      image8: { x: 0, y: 0 },
      image9: { x: 0, y: 0 },
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
    const fileInputRef4 = useRef<HTMLInputElement | null>(null);
    const fileInputRef5 = useRef<HTMLInputElement | null>(null);
    const fileInputRef6 = useRef<HTMLInputElement | null>(null);
    const fileInputRef7 = useRef<HTMLInputElement | null>(null);
    const fileInputRef8 = useRef<HTMLInputElement | null>(null);
    const fileInputRef9 = useRef<HTMLInputElement | null>(null);

    // ── 9. Imperative Handle: Export & Import Payload ────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard15",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#229AD6",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "40px",
            },
          },
          realtorName: {
            value: fullName,
            style: {
              ...fieldStyles.fullName,
              fontSize: fieldStyles.fullName?.fontSize || "14px",
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
              fontSize: fieldStyles.propertyName?.fontSize || "10px",
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
              fontSize: fieldStyles.description?.fontSize || "16px",
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
            contactLabel,
            phoneLabel,
            emailLabel,
            mlsLabel,
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

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
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

          if (details.contactLabel)
            setContactLabel(details.contactLabel as string);
          if (details.phoneLabel) setPhoneLabel(details.phoneLabel as string);
          if (details.emailLabel) setEmailLabel(details.emailLabel as string);
          if (details.mlsLabel) setMlsLabel(details.mlsLabel as string);
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
          if (details.roadLabelBefore)
            setRoadLabelBefore(details.roadLabelBefore as string);
          if (details.roadLabelAfter)
            setRoadLabelAfter(details.roadLabelAfter as string);
          if (details.disclaimerText)
            setDisclaimerText(details.disclaimerText as string);
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
        if (state.fieldPositions)
          setFieldPositions(
            state.fieldPositions as Record<string, { x: number; y: number }>,
          );
        if (state.fieldStyles)
          setFieldStyles(state.fieldStyles as Record<string, TextStyle>);
        if ((state as any).deletedStandardFieldIds)
          setDeletedStandardFieldIds((state as any).deletedStandardFieldIds);
        if ((state as any).deletedDetailFields)
          setDeletedDetailFields((state as any).deletedDetailFields);
      },
    }));

    // ── 10. Initial Order Data Sync & Context Restoration ──────────────────────
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

          const agentLogo =
            (agent as any)?.company_logo_url ||
            (agent as any)?.logo_url ||
            (agent as any)?.avatar_url ||
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

        if (formData.contactLabel) setContactLabel(formData.contactLabel);
        if (formData.phoneLabel) setPhoneLabel(formData.phoneLabel);
        if (formData.emailLabel) setEmailLabel(formData.emailLabel);
        if (formData.mlsLabel) setMlsLabel(formData.mlsLabel);
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
        if (formData.roadLabelBefore)
          setRoadLabelBefore(formData.roadLabelBefore);
        if (formData.roadLabelAfter) setRoadLabelAfter(formData.roadLabelAfter);
        if (formData.disclaimerText) setDisclaimerText(formData.disclaimerText);

        if (formData.images)
          setImages((prev) => ({
            ...prev,
            ...(formData.images as typeof images),
          }));
        if (formData.imageScales)
          setScale((prev) => ({
            ...prev,
            ...(formData.imageScales as typeof scale),
          }));
        if (formData.imagePositions)
          setPosition((prev) => ({
            ...prev,
            ...(formData.imagePositions as typeof position),
          }));
        if (formData.imageRotations)
          setRotation((prev) => ({
            ...prev,
            ...(formData.imageRotations as typeof rotation),
          }));
        if (formData.fieldPositions)
          setFieldPositions((prev) => ({
            ...prev,
            ...(formData.fieldPositions as typeof fieldPositions),
          }));
        if (formData.fieldStyles)
          setFieldStyles((prev) => ({
            ...prev,
            ...(formData.fieldStyles as typeof fieldStyles),
          }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 11. Context Sync ──────────────────────────────────────────────────────
    useEffect(() => {
      updateFormData({
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
        mlsNumber,
        contactLabel,
        phoneLabel,
        emailLabel,
        mlsLabel,
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
        disclaimerText,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldPositions,
        fieldStyles,
        deletedStandardFieldIds,
        deletedDetailFields,
      });
    }, [
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
      mlsNumber,
      contactLabel,
      phoneLabel,
      emailLabel,
      mlsLabel,
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
      disclaimerText,
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      fieldStyles,
      deletedStandardFieldIds,
      deletedDetailFields,
      updateFormData,
    ]);

    // ── 12. Image Handler Helpers ─────────────────────────────────────────────
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

    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
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

    return (
      <FontFolderProvider value="BcfpStandard15">
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

        {/* ── PAGE 1 Divider ──────────────────────────────────────────────── */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* ── PAGE 1 Container 1 (Outer Bleed Wrapper) ────────────────────── */}
        <div
          className="flex flex-col pdf-page bg-white shadow-xl relative overflow-hidden font-alexandria"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11in",
            zoom: 0.85,
          }}
        >
          {/* ── Container 2: SafeZoneWrapper ──────────────────────────────── */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            {/* ── Container 3: Inner Content ────────────────────────────────── */}
            <div
              data-safezone-container="true"
              className="relative w-full h-full z-10 font-alexandria grid grid-cols-[70%_30%]"
            >
              {/* Left Column (70%) */}
              <div className="w-full h-full min-w-0 py-[15px] px-[15px] relative flex flex-col">
                {/* Left Column Full-Bleed Background Layer */}
                <div
                  className="absolute bg-[#229AD6] z-0 pointer-events-none"
                  style={{
                    top: showBleed ? "-0.375in" : "-0.25in",
                    bottom: showBleed ? "-0.375in" : "-0.25in",
                    left: showBleed ? "-0.375in" : "-0.25in",
                    right: 0,
                  }}
                />
                {/* Header Address Section */}
                <div
                  data-safezone-container="true"
                  className={`flex w-full flex-col relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
                    lockedSections.address
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("address");
                    }}
                    className={`absolute -top-2 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                  <div className="flex flex-col items-center w-full">
                    <div className="flex items-center justify-center gap-4 w-full flex-nowrap shrink-0">
                      {!isFieldDeleted("addressCode") && (
                        <DraggableBox
                          id="addressCode"
                          position={fieldPositions.addressCode}
                          onPositionChange={updateFieldPosition}
                          label="Unit #"
                          zoom={0.85}
                          disabled={lockedSections.address}
                          onDelete={() =>
                            removeStandardField(
                              "addressCode",
                              "Unit #",
                              addressCode,
                              "Header Address",
                              fieldStyles.addressCode,
                            )
                          }
                          deleteTitle="Remove Unit #"
                        >
                          <div className="text-[28px] justify-center font-light leading-none mt-0 text-[#ffffff] flex shrink-0 items-center whitespace-nowrap">
                            <span className="text-[20px] mt-1">#</span>
                            <span className="inline">
                              <StyledInput
                                value={addressCode}
                                onChange={(e) => setAddressCode(e.target.value)}
                                inputStyle={fieldStyles["addressCode"]}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("addressCode", s)
                                }
                                className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-[#ffffff] text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200] whitespace-nowrap"
                                placeholder="0000-0000"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </span>
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("roadName") && (
                        <DraggableBox
                          id="roadName"
                          position={fieldPositions.roadName}
                          onPositionChange={updateFieldPosition}
                          label="Street Address"
                          zoom={0.85}
                          disabled={lockedSections.address}
                          onDelete={() =>
                            removeStandardField(
                              "roadName",
                              "Street Address",
                              roadName,
                              "Header Address",
                              fieldStyles.roadName,
                            )
                          }
                          deleteTitle="Remove Street Address"
                        >
                          <div className="text-[28px] justify-center font-light leading-none text-[#ffffff] flex flex-nowrap shrink-0 items-center gap-1 whitespace-nowrap">
                            <StyledInput
                              value={roadLabelBefore}
                              onChange={(e) =>
                                setRoadLabelBefore(e.target.value)
                              }
                              inputStyle={fieldStyles["roadLabelBefore"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadLabelBefore", s)
                              }
                              className="font-light text-[28px] h-[30px] leading-none bg-transparent text-[#ffffff] focus:outline-none border-none whitespace-nowrap"
                              placeholder="Number"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={roadName}
                              onChange={(e) => setRoadName(e.target.value)}
                              inputStyle={fieldStyles["roadName"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadName", s)
                              }
                              className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-[#ffffff] text-center focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200] whitespace-nowrap"
                              placeholder="0"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={roadLabelAfter}
                              onChange={(e) =>
                                setRoadLabelAfter(e.target.value)
                              }
                              inputStyle={fieldStyles["roadLabelAfter"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadLabelAfter", s)
                              }
                              className="font-light text-[28px] h-[30px] leading-none bg-transparent text-[#ffffff] focus:outline-none border-none whitespace-nowrap"
                              placeholder="Road"
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
                        label="City / Province"
                        zoom={0.85}
                        disabled={lockedSections.address}
                        onDelete={() =>
                          removeStandardField(
                            "cityLine",
                            "City / Province",
                            cityLine,
                            "Header Address",
                            fieldStyles.cityLine,
                          )
                        }
                        deleteTitle="Remove City / Province"
                      >
                        <div className="text-[#ffffff] text-[10px] text-center mb-2 shrink-0 w-full">
                          <StyledInput
                            value={cityLine}
                            onChange={(e) => setCityLine(e.target.value)}
                            inputStyle={fieldStyles["cityLine"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("cityLine", s)
                            }
                            className="text-white text-[21px] h-[40px] bg-transparent text-center w-full focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                            placeholder="BRIGHOUSE SOUTH, RICHMOND"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Main Image Slot 1 */}
                <div
                  data-image-slot="true"
                  className="w-full h-[300px] min-w-0 border-2 border-white relative overflow-hidden flex items-center justify-center group select-none bg-black/10 shrink-0 shadow-[4px_4px_6px_rgba(0,0,0,0.4)] cursor-pointer"
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
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => openImageSourceModal("image1", e)}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete("image1", fileInputRef1)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
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

                {/* Specs Section */}
                <div
                  data-safezone-container="true"
                  className={`flex w-full flex-col relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec mt-2 ${
                    lockedSections.specs
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("specs");
                    }}
                    className={`absolute -top-2 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                  <div className="font-semibold text-[12px] text-[#FFFFFF] flex flex-nowrap items-center justify-center gap-1.5 shrink-0 whitespace-nowrap">
                    {!isFieldDeleted("specBedroom") && (
                      <DraggableBox
                        id="specBedroom"
                        position={fieldPositions.specBedroom}
                        onPositionChange={updateFieldPosition}
                        label="Bedrooms"
                        zoom={0.85}
                        disabled={lockedSections.specs}
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
                            inputStyle={fieldStyles["bedroom"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bedroom", s)
                            }
                            className="font-semibold text-[14px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
                            placeholder="0"
                          />
                          <StyledInput
                            value={bedroomLabel}
                            onChange={(e) => setBedroomLabel(e.target.value)}
                            inputStyle={fieldStyles["bedroomLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bedroomLabel", s)
                            }
                            className="font-semibold text-[12px] bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                            placeholder="BEDROOM •"
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
                        disabled={lockedSections.specs}
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
                            inputStyle={fieldStyles["bathroom"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bathroom", s)
                            }
                            className="font-semibold text-[14px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
                            placeholder="0"
                          />
                          <StyledInput
                            value={bathroomLabel}
                            onChange={(e) => setBathroomLabel(e.target.value)}
                            inputStyle={fieldStyles["bathroomLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("bathroomLabel", s)
                            }
                            className="font-semibold text-[12px] bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                            placeholder="BATHROOM •"
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
                        label="Sq Ft"
                        zoom={0.85}
                        disabled={lockedSections.specs}
                        onDelete={() =>
                          removeStandardField(
                            "specSqft",
                            "Sq Ft",
                            sqft,
                            "Specs",
                            fieldStyles.sqft,
                          )
                        }
                        deleteTitle="Remove Sq Ft"
                      >
                        <div className="flex items-center gap-1 whitespace-nowrap flex-nowrap shrink-0">
                          <StyledInput
                            value={sqft}
                            onChange={(e) => setSqft(e.target.value)}
                            inputStyle={fieldStyles["sqft"]}
                            onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                            className="font-semibold text-[14px] bg-transparent text-center h-[20px] w-[50px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
                            placeholder="000"
                          />
                          <StyledInput
                            value={sqftLabel}
                            onChange={(e) => setSqftLabel(e.target.value)}
                            inputStyle={fieldStyles["sqftLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("sqftLabel", s)
                            }
                            className="font-semibold text-[12px] bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                            placeholder="SQ FT •"
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
                        disabled={lockedSections.specs}
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
                            inputStyle={fieldStyles["builtYearLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("builtYearLabel", s)
                            }
                            className="font-semibold text-[12px] bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
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
                            className="font-semibold text-[14px] bg-transparent text-left w-[45px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
                            placeholder="0000"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Description Section */}
                <div
                  data-safezone-container="true"
                  className={`flex w-full flex-col relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec mt-2 flex-1 min-h-0 ${
                    lockedSections.description
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("description");
                    }}
                    className={`absolute -top-2 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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
                      <div className="w-full h-full overflow-hidden">
                        <StyledInput
                          value={description}
                          rows={6}
                          onChange={(e) => setDescription(e.target.value)}
                          inputStyle={fieldStyles["description"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("description", s)
                          }
                          className="font-normal text-[16px] h-full w-full z-20 text-white leading-[1.3] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                          placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home boasts incredible views..."
                        />
                      </div>
                    </DraggableBox>
                  )}
                </div>

                {/* 4-Grid Image Slots (image4, image5, image6, image7) */}
                <div className="grid grid-cols-2 gap-2 w-full justify-self-center mt-[15px] shrink-0">
                  {/* Slot image4 */}
                  <div
                    data-image-slot="true"
                    className="w-full min-w-0 h-[150px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] place-self-center relative overflow-hidden flex items-center justify-center group select-none bg-black/10 cursor-pointer"
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
                            onMouseDown={(e) => handleMouseDown("image4", e)}
                          >
                            <ImageEditor
                              src={images.image4}
                              scale={scale.image4}
                              position={position.image4}
                              rotation={rotation.image4}
                              objectFit="contain"
                            />
                          </div>

                          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                            className="absolute top-4 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image4", e)}
                            className="absolute top-4 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image4", fileInputRef4)
                            }
                            className="absolute top-4 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image4", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
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

                  {/* Slot image5 */}
                  <div
                    data-image-slot="true"
                    className="w-full min-w-0 h-[150px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] place-self-center relative overflow-hidden flex items-center justify-center group select-none bg-black/10 cursor-pointer"
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
                            onMouseDown={(e) => handleMouseDown("image5", e)}
                          >
                            <ImageEditor
                              src={images.image5}
                              scale={scale.image5}
                              position={position.image5}
                              rotation={rotation.image5}
                              objectFit="contain"
                            />
                          </div>

                          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                            className="absolute top-4 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image5", e)}
                            className="absolute top-4 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image5", fileInputRef5)
                            }
                            className="absolute top-4 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image5", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
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

                  {/* Slot image6 */}
                  <div
                    data-image-slot="true"
                    className="w-full min-w-0 h-[150px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] place-self-center relative overflow-hidden flex items-center justify-center group select-none bg-black/10 cursor-pointer"
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
                            onMouseDown={(e) => handleMouseDown("image6", e)}
                          >
                            <ImageEditor
                              src={images.image6}
                              scale={scale.image6}
                              position={position.image6}
                              rotation={rotation.image6}
                              objectFit="contain"
                            />
                          </div>

                          <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image6", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image6", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRotate("image6")}
                            className="absolute top-4 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image6", e)}
                            className="absolute top-4 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image6", fileInputRef6)
                            }
                            className="absolute top-4 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image6", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
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

                  {/* Slot image7 */}
                  <div
                    data-image-slot="true"
                    className="w-full min-w-0 h-[150px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] place-self-center relative overflow-hidden flex items-center justify-center group select-none bg-black/10 cursor-pointer"
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
                              objectFit="contain"
                            />
                          </div>

                          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                          <button
                            type="button"
                            onClick={() => handleRotate("image7")}
                            className="absolute top-4 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image7", e)}
                            className="absolute top-4 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image7", fileInputRef7)
                            }
                            className="absolute top-4 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
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
                </div>

                {/* Disclaimer Footer */}
                <div className="relative w-full justify-self-center flex gap-2 pt-2 pb-1 z-2 text-[#ffffff] shrink-0 mt-2 items-center">
                  <span className="flex flex-col shrink-0">
                    <House className="w-3 h-3" />
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 8 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.07208 6.90507H1.20908C1.29908 6.90507 1.36508 6.90507 1.41708 6.95207C1.46108 6.99307 1.48508 7.04807 1.48508 7.11207C1.48508 7.22007 1.40508 7.30107 1.28408 7.30107H1.19308L1.47508 7.75507H1.58608L1.35708 7.38907C1.48808 7.37607 1.58608 7.25507 1.58608 7.11207C1.58608 7.01407 1.53908 6.91807 1.46108 6.86707C1.39608 6.81707 1.32508 6.81007 1.23408 6.81007H0.981079V7.75507H1.07208V6.90507Z"
                        fill="#ffffff"
                      />
                      <path
                        d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z"
                        fill="#ffffff"
                      />
                      <path
                        d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z"
                        fill="#ffffff"
                      />
                      <path
                        d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z"
                        fill="#ffffff"
                      />
                      <path
                        d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z"
                        fill="#ffffff"
                      />
                      <path
                        d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z"
                        fill="#ffffff"
                      />
                      <path
                        d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z"
                        fill="#ffffff"
                      />
                      <path
                        d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z"
                        fill="#ffffff"
                      />
                    </svg>
                  </span>
                  <StyledInput
                    value={disclaimerText}
                    rows={2}
                    onChange={(e) => setDisclaimerText(e.target.value)}
                    inputStyle={fieldStyles["disclaimerText"]}
                    onChangeStyle={(s) => updateFieldStyle("disclaimerText", s)}
                    className="text-[8px] font-light leading-tight text-white/90 bg-transparent text-left w-full focus:outline-none border-none"
                    placeholder="All information deemed reliable but not guaranteed..."
                  />
                </div>
                <hr className="absolute top-0 right-[-1px] border-l-2 border-white border-dotted h-[11in] w-0 z-20" />
              </div>

              {/* Right Column (30%) */}
              <div className="w-full h-full min-w-0 pr-[5px] pl-[5px] py-[15px] relative flex flex-col">
                {/* Right Column Full-Bleed Background Layer */}
                <div
                  className="absolute bg-[#72C3EC] z-0 pointer-events-none"
                  style={{
                    top: showBleed ? "-0.375in" : "-0.25in",
                    bottom: showBleed ? "-0.375in" : "-0.25in",
                    left: 0,
                    right: showBleed ? "-0.375in" : "-0.25in",
                  }}
                />
                {/* Slot image9 (Top Right Photo) */}
                <div
                  data-image-slot="true"
                  className="w-full min-w-0 h-[135px] border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] relative z-10 group select-none bg-black/10 shrink-0 cursor-pointer"
                  onMouseEnter={() => setHoveredSlot("image9")}
                  onMouseLeave={() => setHoveredSlot(null)}
                  onClick={(e) => {
                    if (e.altKey) return;
                    e.stopPropagation();
                    setActiveSlot("image9");
                  }}
                >
                  <BoxIndicator isVisible={isSlotActive("image9")} />

                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image9", e)}
                    onMouseUp={() => handleMouseUp("image9")}
                    onMouseLeave={() => handleMouseLeave("image9")}
                  >
                    {images.image9 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image9", e)}
                        >
                          <ImageEditor
                            src={images.image9}
                            scale={scale.image9}
                            position={position.image9}
                            rotation={rotation.image9}
                            objectFit="contain"
                          />
                        </div>

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                          <button
                            type="button"
                            onClick={() => handleZoom("image9", "in")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image9", "out")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRotate("image9")}
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => openImageSourceModal("image9", e)}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image9", fileInputRef9)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        data-html2canvas-ignore="true"
                        onClick={(e) => openImageSourceModal("image9", e)}
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
                      >
                        Select Image
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef9}
                      onChange={(e) => handleImageChange("image9", e)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Details Section */}
                <div
                  data-safezone-container="true"
                  className={`flex w-full flex-col relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec py-2 flex-1 min-h-0 ${
                    lockedSections.details
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
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

                  <div className="flex flex-col gap-3 text-white w-full h-full overflow-hidden">
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
                            inputStyle={fieldStyles["byLawLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("byLawLabel", s)
                            }
                            className="font-serif text-[12px] tracking-wide text-white/95 uppercase block leading-tight bg-transparent text-left w-full focus:outline-none border-none"
                            placeholder="BY-LAW RESTRICTIONS:"
                          />
                          <StyledInput
                            value={byLawRestrictions}
                            rows={1}
                            onChange={(e) =>
                              setByLawRestrictions(e.target.value)
                            }
                            inputStyle={fieldStyles["byLawRestrictions"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("byLawRestrictions", s)
                            }
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 leading-tight mt-0.5"
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
                        deleteTitle="Remove Maint. Fees"
                      >
                        <div>
                          <StyledInput
                            value={maintFeesLabel}
                            onChange={(e) => setMaintFeesLabel(e.target.value)}
                            inputStyle={fieldStyles["maintFeesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintFeesLabel", s)
                            }
                            className="font-serif text-[12px] tracking-wide text-white/95 uppercase block leading-tight bg-transparent text-left w-full focus:outline-none border-none"
                            placeholder="MAINT. FEES:"
                          />
                          <StyledInput
                            value={maintFees}
                            rows={1}
                            onChange={(e) => setMaintFees(e.target.value)}
                            inputStyle={fieldStyles["maintFees"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintFees", s)
                            }
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 leading-tight mt-0.5"
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
                        deleteTitle="Remove Maint. Fees Include"
                      >
                        <div>
                          <StyledInput
                            value={maintFeesIncludeLabel}
                            onChange={(e) =>
                              setMaintFeesIncludeLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["maintFeesIncludeLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintFeesIncludeLabel", s)
                            }
                            className="font-serif text-[12px] tracking-wide text-white/95 uppercase block leading-tight bg-transparent text-left w-full focus:outline-none border-none"
                            placeholder="MAINT. FEES INCLUDE:"
                          />
                          <StyledInput
                            value={maintFeesInclude}
                            onChange={(e) =>
                              setMaintFeesInclude(e.target.value)
                            }
                            inputStyle={fieldStyles["maintFeesInclude"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintFeesInclude", s)
                            }
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 leading-tight mt-0.5"
                            placeholder="Gardening, Garbage Pickup, Gas, Hot Water..."
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
                        <div>
                          <StyledInput
                            value={featuresIncludedLabel}
                            onChange={(e) =>
                              setFeaturesIncludedLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["featuresIncludedLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("featuresIncludedLabel", s)
                            }
                            className="font-serif text-[12px] tracking-wide text-white/95 uppercase block leading-tight bg-transparent text-left w-full focus:outline-none border-none"
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
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 leading-tight mt-0.5"
                            placeholder="Clothes Washer/Dryer/Fridge/Stove/DW..."
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
                        <div>
                          <StyledInput
                            value={siteInfluencesLabel}
                            onChange={(e) =>
                              setSiteInfluencesLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["siteInfluencesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("siteInfluencesLabel", s)
                            }
                            className="font-serif text-[12px] tracking-wide text-white/95 uppercase block leading-tight bg-transparent text-left w-full focus:outline-none border-none"
                            placeholder="SITE INFLUENCES:"
                          />
                          <StyledInput
                            value={siteInfluences}
                            onChange={(e) => setSiteInfluences(e.target.value)}
                            inputStyle={fieldStyles["siteInfluences"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("siteInfluences", s)
                            }
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 leading-tight mt-0.5"
                            placeholder="Central Location, Golf Course Nearby..."
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
                        <div>
                          <StyledInput
                            value={amenitiesLabel}
                            onChange={(e) => setAmenitiesLabel(e.target.value)}
                            inputStyle={fieldStyles["amenitiesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("amenitiesLabel", s)
                            }
                            className="font-serif text-[12px] tracking-wide text-white/95 uppercase block leading-tight bg-transparent text-left w-full focus:outline-none border-none"
                            placeholder="AMENITIES:"
                          />
                          <StyledInput
                            value={amenities}
                            onChange={(e) => setAmenities(e.target.value)}
                            inputStyle={fieldStyles["amenities"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("amenities", s)
                            }
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 leading-tight mt-0.5"
                            placeholder="Exercise Centre, Garden, In Suite Laundry..."
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
                        <div>
                          <StyledInput
                            value={viewLabel}
                            onChange={(e) => setViewLabel(e.target.value)}
                            inputStyle={fieldStyles["viewLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("viewLabel", s)
                            }
                            className="font-serif text-[12px] tracking-wide text-white/95 uppercase block leading-tight bg-transparent text-left w-full focus:outline-none border-none"
                            placeholder="VIEW:"
                          />
                          <StyledInput
                            value={view}
                            rows={1}
                            onChange={(e) => setView(e.target.value)}
                            inputStyle={fieldStyles["view"]}
                            onChangeStyle={(s) => updateFieldStyle("view", s)}
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 leading-tight mt-0.5"
                            placeholder="South & SW - Van Isl."
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Headshot / Agent Logo Slot 2 */}
                <div
                  id="agentLogo2"
                  data-image-slot="true"
                  data-slot-type="logo"
                  data-logo-slot="true"
                  className={`w-full min-w-0 h-[110px] relative z-10 group select-none overflow-hidden shrink-0 mt-[12px] cursor-pointer ${
                    images.image2
                      ? "bg-transparent"
                      : "border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.4)] bg-white"
                  }`}
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
                          onMouseDown={(e) => handleMouseDown("image2", e)}
                        >
                          <ImageEditor
                            src={images.image2}
                            scale={scale.image2}
                            position={position.image2}
                            rotation={rotation.image2}
                            objectFit="contain"
                          />
                        </div>

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => openImageSourceModal("image2", e)}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image2", fileInputRef2)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        data-html2canvas-ignore="true"
                        onClick={(e) => openImageSourceModal("image2", e)}
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
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

                <hr className="w-[90%] border-t-[1.5px] border-white my-2 self-center shrink-0" />

                {/* Contact Card Section */}
                <div
                  data-safezone-container="true"
                  className={`flex w-full flex-col relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec shrink-0 ${
                    lockedSections.contact
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("contact");
                    }}
                    className={`absolute -top-2 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                  <div className="flex flex-col gap-[4px] py-1 text-white">
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
                            "Contact Info",
                            fieldStyles.fullName,
                          )
                        }
                        deleteTitle="Remove Agent Name"
                      >
                        <div className="flex flex-col">
                          <StyledInput
                            value={contactLabel}
                            onChange={(e) => setContactLabel(e.target.value)}
                            inputStyle={fieldStyles["contactLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("contactLabel", s)
                            }
                            className="text-[13px] text-white font-serif tracking-widest uppercase bg-transparent text-left w-full focus:outline-none border-none"
                            placeholder="CONTACT:"
                          />
                          <StyledInput
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            inputStyle={fieldStyles["fullName"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("fullName", s)
                            }
                            className="text-[14px] text-white font-serif uppercase tracking-widest bg-transparent text-left w-full focus:outline-none border-none placeholder-white/90"
                            placeholder="FIRSTNAME LAST"
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
                          className="text-[10px] text-white font-light uppercase tracking-wider bg-transparent text-left w-full focus:outline-none border-none placeholder-white/90"
                          placeholder="MACDONALD REALTY"
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
                            "Contact Info",
                            fieldStyles.number,
                          )
                        }
                        deleteTitle="Remove Phone"
                      >
                        <div className="flex items-center gap-1 font-bold text-[10px] text-white mt-0.5">
                          <StyledInput
                            value={phoneLabel}
                            onChange={(e) => setPhoneLabel(e.target.value)}
                            inputStyle={fieldStyles["phoneLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("phoneLabel", s)
                            }
                            className="text-[10px] font-bold text-white bg-transparent text-left focus:outline-none border-none"
                            placeholder="PHONE:"
                            wrapperClassName="w-auto"
                          />
                          <StyledInput
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            inputStyle={fieldStyles["number"]}
                            onChangeStyle={(s) => updateFieldStyle("number", s)}
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 tracking-wide"
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
                            "Contact Info",
                            fieldStyles.email,
                          )
                        }
                        deleteTitle="Remove Email"
                      >
                        <div className="flex items-center gap-1 font-bold text-[10px] text-white">
                          <StyledInput
                            value={emailLabel}
                            onChange={(e) => setEmailLabel(e.target.value)}
                            inputStyle={fieldStyles["emailLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("emailLabel", s)
                            }
                            className="text-[10px] font-bold text-white bg-transparent text-left focus:outline-none border-none"
                            placeholder="EMAIL:"
                            wrapperClassName="w-auto"
                          />
                          <StyledInput
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputStyle={fieldStyles["email"]}
                            onChangeStyle={(s) => updateFieldStyle("email", s)}
                            className="font-light text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white/80 uppercase tracking-wide"
                            placeholder="FIRST@LAST.COM"
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
                        <div className="flex items-center gap-1 font-bold text-[10px] text-white whitespace-nowrap flex-nowrap shrink-0">
                          <StyledInput
                            value={mlsLabel}
                            onChange={(e) => setMlsLabel(e.target.value)}
                            inputStyle={fieldStyles["mlsLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsLabel", s)
                            }
                            className="text-[10px] font-bold text-white bg-transparent text-left focus:outline-none border-none whitespace-nowrap"
                            placeholder="MLS #:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={mlsNumber}
                            onChange={(e) => setMlsNumber(e.target.value)}
                            inputStyle={fieldStyles["mlsNumber"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsNumber", s)
                            }
                            className="font-light text-[10px] bg-transparent text-left focus:outline-none border-none placeholder-white/80 tracking-wide whitespace-nowrap"
                            placeholder="00000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Price Section */}
                <div
                  data-safezone-container="true"
                  className={`flex w-full flex-col relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec shrink-0 mt-2 ${
                    lockedSections.price
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("price");
                    }}
                    className={`absolute -top-2 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.price
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                    title={
                      lockedSections.price
                        ? "Unlock Price Section"
                        : "Lock Price Section"
                    }
                  >
                    {lockedSections.price ? (
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

                  {!isFieldDeleted("priceAmount") && (
                    <DraggableBox
                      id="priceAmount"
                      position={fieldPositions.priceAmount}
                      onPositionChange={updateFieldPosition}
                      label="Price"
                      zoom={0.85}
                      disabled={lockedSections.price}
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
                      <div className="w-full flex items-end">
                        <StyledInput
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          inputStyle={fieldStyles["amount"]}
                          onChangeStyle={(s) => updateFieldStyle("amount", s)}
                          className="text-[40px] h-[60px] font-serif tracking-tighter text-white/95 bg-transparent text-left w-full focus:outline-none border-none placeholder-white/90 leading-none"
                          placeholder="$000,000"
                        />
                      </div>
                    </DraggableBox>
                  )}
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>

        {/* ── PAGE 2 Divider ──────────────────────────────────────────────── */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 2
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* ── PAGE 2 Container 1 (Outer Bleed Wrapper) ────────────────────── */}
        <div
          className="flex flex-col pdf-page bg-white shadow-xl relative overflow-hidden font-alexandria"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11in",
            zoom: 0.85,
          }}
        >
          {/* ── Container 2: SafeZoneWrapper ──────────────────────────────── */}
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            {/* ── Container 3: Inner Content ────────────────────────────────── */}
            <div
              data-safezone-container="true"
              className="relative w-full h-full z-10 font-alexandria flex flex-col"
            >
              {/* Top Header Address Section */}
              <div className="w-full z-20 pt-[15px] pb-2 px-6 flex flex-col items-center relative">
                {/* Page 2 Top Header Full-Bleed Background Layer */}
                <div
                  className="absolute bg-[#229AD6] z-0 pointer-events-none"
                  style={{
                    top: showBleed ? "-0.375in" : "-0.25in",
                    left: showBleed ? "-0.375in" : "-0.25in",
                    right: showBleed ? "-0.375in" : "-0.25in",
                    bottom: 0,
                  }}
                />
                <div
                  data-safezone-container="true"
                  className={`flex w-full flex-col relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
                    lockedSections.address
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("address");
                    }}
                    className={`absolute -top-2 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                  <div className="flex flex-col items-center w-full">
                    <div className="flex items-center justify-center gap-4 w-full flex-nowrap shrink-0">
                      {!isFieldDeleted("addressCode") && (
                        <DraggableBox
                          id="addressCodePage2"
                          position={fieldPositions.addressCodePage2}
                          onPositionChange={updateFieldPosition}
                          label="Page 2 Unit #"
                          zoom={0.85}
                          disabled={lockedSections.address}
                        >
                          <div className="text-[28px] justify-center pb-2 items-center font-light leading-none text-[#ffffff] flex shrink-0 whitespace-nowrap">
                            <span className="text-[16px] mt-1">#</span>
                            <span className="inline">
                              <StyledInput
                                value={addressCode}
                                onChange={(e) => setAddressCode(e.target.value)}
                                inputStyle={fieldStyles["addressCode"]}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("addressCode", s)
                                }
                                className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-[#ffffff] text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200] whitespace-nowrap"
                                placeholder="0000-0000"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </span>
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("roadName") && (
                        <DraggableBox
                          id="roadNamePage2"
                          position={fieldPositions.roadNamePage2}
                          onPositionChange={updateFieldPosition}
                          label="Page 2 Street Address"
                          zoom={0.85}
                          disabled={lockedSections.address}
                        >
                          <div className="text-[28px] justify-center pb-2 items-center font-light leading-none text-[#ffffff] flex flex-nowrap shrink-0 whitespace-nowrap">
                            <span className="text-[#ffffff] flex items-center gap-1 flex-nowrap shrink-0 whitespace-nowrap">
                              <StyledInput
                                value={roadLabelBefore}
                                onChange={(e) =>
                                  setRoadLabelBefore(e.target.value)
                                }
                                inputStyle={fieldStyles["roadLabelBefore"]}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("roadLabelBefore", s)
                                }
                                className="font-light text-[28px] h-[30px] leading-none bg-transparent text-[#ffffff] focus:outline-none border-none whitespace-nowrap"
                                placeholder="Number"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={roadName}
                                onChange={(e) => setRoadName(e.target.value)}
                                inputStyle={fieldStyles["roadName"]}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("roadName", s)
                                }
                                className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-[#ffffff] text-center focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200] whitespace-nowrap"
                                placeholder="0"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={roadLabelAfter}
                                onChange={(e) =>
                                  setRoadLabelAfter(e.target.value)
                                }
                                inputStyle={fieldStyles["roadLabelAfter"]}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("roadLabelAfter", s)
                                }
                                className="font-light text-[28px] h-[30px] leading-none bg-transparent text-[#ffffff] focus:outline-none border-none whitespace-nowrap"
                                placeholder="Road"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </span>
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>
                </div>
                <hr className="w-full h-3 rotate-180 border-t-4 border-white border-dotted mt-1" />
              </div>

              {/* Slot image8 (Page 2 Floor Plan Photo) */}
              <div
                data-image-slot="true"
                className="flex-1 relative bg-white group select-none overflow-hidden z-10 cursor-pointer shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
                style={{
                  marginLeft: showBleed ? "-0.375in" : "-0.25in",
                  marginRight: showBleed ? "-0.375in" : "-0.25in",
                  marginBottom: showBleed ? "-0.375in" : "-0.25in",
                  width: showBleed
                    ? "calc(100% + 0.75in)"
                    : "calc(100% + 0.5in)",
                  height: showBleed
                    ? "calc(100% + 0.375in)"
                    : "calc(100% + 0.25in)",
                }}
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
                  className="w-full h-full relative overflow-hidden flex items-center justify-center"
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

                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                      <button
                        type="button"
                        onClick={() => handleRotate("image8")}
                        className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Rotate image"
                      >
                        <RotateCw className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => openImageSourceModal("image8", e)}
                        className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("image8", fileInputRef8)}
                        className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      data-html2canvas-ignore="true"
                      onClick={(e) => openImageSourceModal("image8", e)}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm hover:bg-gray-300 transition-colors"
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
          </SafeZoneWrapper>
        </div>
      </FontFolderProvider>
    );
  },
);

BcfpStandard15.displayName = "BcfpStandard15";

export default BcfpStandard15;
