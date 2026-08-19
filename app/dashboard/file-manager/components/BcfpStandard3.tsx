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
  StyledTextField,
  DetailField,
} from "../types/featureSheetTypes";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";
import DetailFieldsSection from "./DetailFieldsSection";

export interface BcfpStandard3Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard3Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

// ─── BoxIndicator ─────────────────────────────────────────────────────────────
// Renders a Canva-style 3.5px colored border indicator to indicate the bounds
// of an image container on hover, click (active), or drag.
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

// ─── Default Detail Fields ───────────────────────────────────────────────────
const DEFAULT_LEFT_DETAIL_FIELDS: DetailField[] = [
  { id: "byLawRestrictions", title: "BY-LAW RESTRICTIONS:", value: "" },
  { id: "maintenanceFees", title: "MAINTENANCE FEES:", value: "" },
  {
    id: "maintenanceFeesInclude",
    title: "MAINTENANCE FEES INCLUDE:",
    value: "",
  },
  { id: "featuresIncluded", title: "FEATURES INCLUDED:", value: "" },
];

const DEFAULT_RIGHT_DETAIL_FIELDS: DetailField[] = [
  { id: "siteInfluences", title: "SITE INFLUENCES:", value: "" },
  { id: "amenities", title: "AMENITIES:", value: "" },
  { id: "view", title: "VIEW:", value: "" },
];

const STANDARD_FIELD_IDS = new Set([
  "fullName",
  "companyName",
  "propertyName",
  "amount",
  "email",
  "phone",
  "mlsNumber",
  "addressCode",
  "roadName",
  "cityLine",
  "bedroom",
  "bathroom",
  "sqft",
  "builtYear",
  "description",
  "disclaimerText",
  "printedByText",
]);

const BcfpStandard3 = forwardRef<BcfpStandard3Ref, BcfpStandard3Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── 1. Detail Fields ─────────────────────────────────────────────────────
    const [leftDetailFields, setLeftDetailFields] = useState<DetailField[]>(
      DEFAULT_LEFT_DETAIL_FIELDS,
    );
    const [rightDetailFields, setRightDetailFields] = useState<DetailField[]>(
      DEFAULT_RIGHT_DETAIL_FIELDS,
    );

    const updateDetailTitle = (id: string, title: string) => {
      setLeftDetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, title } : f)),
      );
      setRightDetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, title } : f)),
      );
    };

    const updateDetailValue = (id: string, value: string) => {
      setLeftDetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, value } : f)),
      );
      setRightDetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, value } : f)),
      );
    };

    const updateDetailStyle = (id: string, style: TextStyle) => {
      setLeftDetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, style } : f)),
      );
      setRightDetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, style } : f)),
      );
    };

    const updateDetailTitleStyle = (id: string, style: TextStyle) => {
      setLeftDetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, titleStyle: style } : f)),
      );
      setRightDetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, titleStyle: style } : f)),
      );
    };

    // ── 2. Deletion & Restoration State ──────────────────────────────────────
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

    const removeDetailField = (id: string) => {
      const leftField = leftDetailFields.find((f) => f.id === id);
      if (leftField) {
        const newDeleted: DeletedDetailFieldItem[] = [
          ...deletedDetailFields.filter((f) => f.id !== id),
          {
            ...leftField,
            column: "left",
            section: "Page 3 - Detail Fields",
            deletedAt: Date.now(),
          },
        ];
        setDeletedDetailFields(newDeleted);
        updateFormData({ deletedDetailFields: newDeleted });
        setLeftDetailFields((prev) => prev.filter((f) => f.id !== id));
        return;
      }
      const rightField = rightDetailFields.find((f) => f.id === id);
      if (rightField) {
        const newDeleted: DeletedDetailFieldItem[] = [
          ...deletedDetailFields.filter((f) => f.id !== id),
          {
            ...rightField,
            column: "right",
            section: "Page 3 - Detail Fields",
            deletedAt: Date.now(),
          },
        ];
        setDeletedDetailFields(newDeleted);
        updateFormData({ deletedDetailFields: newDeleted });
        setRightDetailFields((prev) => prev.filter((f) => f.id !== id));
      }
    };

    const restoreDetailField = useCallback(
      (id: string) => {
        const isStandard =
          STANDARD_FIELD_IDS.has(id) || deletedStandardFieldIds.includes(id);
        if (isStandard) {
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
          return;
        }
        setDeletedDetailFields((prevDetail) => {
          const fieldToRestore = prevDetail.find((f) => f.id === id);
          if (!fieldToRestore) return prevDetail;
          const cleanField: DetailField = {
            id: fieldToRestore.id,
            title: fieldToRestore.title,
            value: fieldToRestore.value,
            style: fieldToRestore.style,
            titleStyle: fieldToRestore.titleStyle,
          };
          if (fieldToRestore.column === "right") {
            setRightDetailFields((prev) => [
              ...prev.filter((f) => f.id !== id),
              cleanField,
            ]);
          } else {
            setLeftDetailFields((prev) => [
              ...prev.filter((f) => f.id !== id),
              cleanField,
            ]);
          }
          const updated = prevDetail.filter((f) => f.id !== id);
          updateFormData({ deletedDetailFields: updated });
          return updated;
        });
      },
      [deletedStandardFieldIds, updateFormData],
    );

    const restoreAllDetailFields = useCallback(() => {
      setDeletedDetailFields((prevDetail) => {
        const leftRestored: DetailField[] = [];
        const rightRestored: DetailField[] = [];
        prevDetail.forEach((field) => {
          if (
            STANDARD_FIELD_IDS.has(field.id) ||
            deletedStandardFieldIds.includes(field.id)
          )
            return;
          const cleanField: DetailField = {
            id: field.id,
            title: field.title,
            value: field.value,
            style: field.style,
            titleStyle: field.titleStyle,
          };
          if (field.column === "right") rightRestored.push(cleanField);
          else leftRestored.push(cleanField);
        });
        if (leftRestored.length > 0)
          setLeftDetailFields((prev) => [...prev, ...leftRestored]);
        if (rightRestored.length > 0)
          setRightDetailFields((prev) => [...prev, ...rightRestored]);
        setDeletedStandardFieldIds([]);
        updateFormData({
          deletedStandardFieldIds: [],
          deletedDetailFields: [],
        });
        return [];
      });
    }, [deletedStandardFieldIds, updateFormData]);

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

    // ── 3. Text Fields & Labels ───────────────────────────────────────────────
    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [amount, setAmount] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [mlsNumber, setMlsNumber] = useState("");
    const [roadName, setRoadName] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");

    // Editable Labels
    const [realtorLabel, setRealtorLabel] = useState("REALTOR:");
    const [propertyLabel, setPropertyLabel] = useState("PROPERTY:");
    const [priceLabel, setPriceLabel] = useState("PRICE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [mlsLabel, setMlsLabel] = useState("MLS #");
    const [roadLabelBefore, setRoadLabelBefore] = useState("NUMBER");
    const [roadLabelAfter, setRoadLabelAfter] = useState("ROAD");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM •");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM •");
    const [sqftLabel, setSqftLabel] = useState("SQ FT •");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
    );
    const [printedByText, setPrintedByText] = useState(
      "DESIGNED AND PRINTED BY BC FLOOR PLANS",
    );

    // ── 4. Bleed & Guide ─────────────────────────────────────────────────────
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed =
      propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide =
      propShowGuide !== undefined ? propShowGuide : showGuideState;

    // ── 5. Styles, Positions & Locks ─────────────────────────────────────────
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
      address: false,
      price: false,
      specs: false,
      description: false,
      details: false,
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 6. Images States (image1 through image14) ──────────────────────────────
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
    });

    // ── 7. Modals & Slot Active States ────────────────────────────────────────
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

    // File input refs
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

    // ── Auto-populate from orderData & Sync on mount ──────────────────────────
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
          if (prop.mls_number) setMlsNumber(prop.mls_number);
          if (prop.suite) setRoadName(prop.suite.toString());

          let fullAddr = prop.address || "";
          if (prop.city) fullAddr += (fullAddr ? ", " : "") + prop.city;
          if (prop.province) fullAddr += (fullAddr ? ", " : "") + prop.province;
          if (fullAddr) setPropertyName(fullAddr);
        }

        if (agent) {
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          const agPhone =
            (agent as any)?.phone ||
            (agent as any)?.phone_number ||
            (agent as any)?.mobile_number;
          if (agPhone) setPhone(agPhone);
          if (agent.company_name) setCompanyName(agent.company_name);

          const agentLogo =
            (agent as any)?.company_logo_url ||
            (agent as any)?.logo_url ||
            (agent as any)?.logo ||
            null;
          if (agentLogo) {
            setImages((prev) => ({
              ...prev,
              image2: prev.image2 || agentLogo,
              image3: prev.image3 || agentLogo,
            }));
          }
        }
      }

      if (formData) {
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";

        if (formData.fullName) setFullName(s(formData.fullName));
        if (formData.companyName) setCompanyName(s(formData.companyName));
        if (formData.email) setEmail(s(formData.email));
        if (formData.phone) setPhone(s(formData.phone));
        if (formData.propertyName) setPropertyName(s(formData.propertyName));
        if (formData.roadName) setRoadName(s(formData.roadName));
        if (formData.amount) setAmount(s(formData.amount));
        if (formData.mlsNumber) setMlsNumber(s(formData.mlsNumber));
        if (formData.bedroom) setBedroom(s(formData.bedroom));
        if (formData.bathroom) setBathroom(s(formData.bathroom));
        if (formData.sqft) setSqft(s(formData.sqft));
        if (formData.builtYear) setBuiltYear(s(formData.builtYear));
        if (formData.description) setDescription(s(formData.description));

        if (formData.realtorLabel) setRealtorLabel(s(formData.realtorLabel));
        if (formData.propertyLabel) setPropertyLabel(s(formData.propertyLabel));
        if (formData.priceLabel) setPriceLabel(s(formData.priceLabel));
        if (formData.emailLabel) setEmailLabel(s(formData.emailLabel));
        if (formData.phoneLabel) setPhoneLabel(s(formData.phoneLabel));
        if (formData.mlsLabel) setMlsLabel(s(formData.mlsLabel));
        if (formData.roadLabelBefore)
          setRoadLabelBefore(s(formData.roadLabelBefore));
        if (formData.roadLabelAfter)
          setRoadLabelAfter(s(formData.roadLabelAfter));
        if (formData.bedroomLabel) setBedroomLabel(s(formData.bedroomLabel));
        if (formData.bathroomLabel) setBathroomLabel(s(formData.bathroomLabel));
        if (formData.sqftLabel) setSqftLabel(s(formData.sqftLabel));
        if (formData.builtYearLabel)
          setBuiltYearLabel(s(formData.builtYearLabel));
        if (formData.disclaimerText)
          setDisclaimerText(s(formData.disclaimerText));
        if (formData.printedByText) setPrintedByText(s(formData.printedByText));

        if (
          formData.leftDetailFields &&
          Array.isArray(formData.leftDetailFields)
        ) {
          setLeftDetailFields(formData.leftDetailFields as DetailField[]);
        }
        if (
          formData.rightDetailFields &&
          Array.isArray(formData.rightDetailFields)
        ) {
          setRightDetailFields(formData.rightDetailFields as DetailField[]);
        }
        if (
          formData.deletedStandardFieldIds &&
          Array.isArray(formData.deletedStandardFieldIds)
        ) {
          setDeletedStandardFieldIds(
            formData.deletedStandardFieldIds as string[],
          );
        }
        if (
          formData.deletedDetailFields &&
          Array.isArray(formData.deletedDetailFields)
        ) {
          setDeletedDetailFields(formData.deletedDetailFields as any[]);
        }

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
          setFieldPositions(
            formData.fieldPositions as Record<string, { x: number; y: number }>,
          );
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

    // ── Sync to Context ───────────────────────────────────────────────────────
    useEffect(() => {
      updateFormData({
        fullName,
        email,
        propertyName,
        roadName,
        amount,
        mlsNumber,
        bedroom,
        bathroom,
        sqft,
        builtYear,
        description,
        realtorLabel,
        propertyLabel,
        priceLabel,
        emailLabel,
        roadLabelBefore,
        roadLabelAfter,
        bedroomLabel,
        bathroomLabel,
        sqftLabel,
        builtYearLabel,
        disclaimerText,
        leftDetailFields,
        rightDetailFields,
        deletedStandardFieldIds,
        deletedDetailFields,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldPositions,
      });
    }, [
      fullName,
      email,
      propertyName,
      roadName,
      amount,
      mlsNumber,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      description,
      realtorLabel,
      propertyLabel,
      priceLabel,
      emailLabel,
      roadLabelBefore,
      roadLabelAfter,
      bedroomLabel,
      bathroomLabel,
      sqftLabel,
      builtYearLabel,
      disclaimerText,
      leftDetailFields,
      rightDetailFields,
      deletedStandardFieldIds,
      deletedDetailFields,
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      updateFormData,
    ]);

    // ── Image Handlers ────────────────────────────────────────────────────────
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
        const bounded = Math.min(Math.max(newScale, 0.1), 5);
        return { ...prev, [key]: bounded };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
    };

    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      if (e.altKey) return;
      setActiveSlot(key);
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

    // ── Export & Import Payloads ──────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard3",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#00B9F2",
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
              fontSize: fieldStyles.fullName?.fontSize || "14px",
            },
          },
          companyName: {
            value: companyName,
            style: {
              ...fieldStyles.companyName,
              fontSize: fieldStyles.companyName?.fontSize || "14px",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "12px",
            },
          },
          propertyNotesTitle: {
            value: roadName,
            style: {
              ...fieldStyles.roadName,
              fontSize: fieldStyles.roadName?.fontSize || "30px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "14px",
            },
          },
          expandedDetail1Title: leftDetailFields.find(
            (f) => f.id === "byLawRestrictions",
          )
            ? {
                value: leftDetailFields.find(
                  (f) => f.id === "byLawRestrictions",
                )!.title,
                style:
                  leftDetailFields.find((f) => f.id === "byLawRestrictions")!
                    .titleStyle || ({} as TextStyle),
              }
            : undefined,
          expandedDetail1Description: leftDetailFields.find(
            (f) => f.id === "byLawRestrictions",
          )
            ? {
                value: leftDetailFields.find(
                  (f) => f.id === "byLawRestrictions",
                )!.value,
                style:
                  leftDetailFields.find((f) => f.id === "byLawRestrictions")!
                    .style || ({} as TextStyle),
              }
            : undefined,
          expandedDetail2Title: leftDetailFields.find(
            (f) => f.id === "maintenanceFees",
          )
            ? {
                value: leftDetailFields.find((f) => f.id === "maintenanceFees")!
                  .title,
                style:
                  leftDetailFields.find((f) => f.id === "maintenanceFees")!
                    .titleStyle || ({} as TextStyle),
              }
            : undefined,
          expandedDetail2Description: leftDetailFields.find(
            (f) => f.id === "maintenanceFees",
          )
            ? {
                value: leftDetailFields.find((f) => f.id === "maintenanceFees")!
                  .value,
                style:
                  leftDetailFields.find((f) => f.id === "maintenanceFees")!
                    .style || ({} as TextStyle),
              }
            : undefined,
          expandedDetail3Title: leftDetailFields.find(
            (f) => f.id === "maintenanceFeesInclude",
          )
            ? {
                value: leftDetailFields.find(
                  (f) => f.id === "maintenanceFeesInclude",
                )!.title,
                style:
                  leftDetailFields.find(
                    (f) => f.id === "maintenanceFeesInclude",
                  )!.titleStyle || ({} as TextStyle),
              }
            : undefined,
          expandedDetail3Description: leftDetailFields.find(
            (f) => f.id === "maintenanceFeesInclude",
          )
            ? {
                value: leftDetailFields.find(
                  (f) => f.id === "maintenanceFeesInclude",
                )!.value,
                style:
                  leftDetailFields.find(
                    (f) => f.id === "maintenanceFeesInclude",
                  )!.style || ({} as TextStyle),
              }
            : undefined,
          expandedDetail4Title: rightDetailFields.find(
            (f) => f.id === "amenities",
          )
            ? {
                value: rightDetailFields.find((f) => f.id === "amenities")!
                  .title,
                style:
                  rightDetailFields.find((f) => f.id === "amenities")!
                    .titleStyle || ({} as TextStyle),
              }
            : undefined,
          expandedDetail4Description: rightDetailFields.find(
            (f) => f.id === "amenities",
          )
            ? {
                value: rightDetailFields.find((f) => f.id === "amenities")!
                  .value,
                style:
                  rightDetailFields.find((f) => f.id === "amenities")!.style ||
                  ({} as TextStyle),
              }
            : undefined,
          keyHighlightLabel:
            leftDetailFields.find((f) => f.id === "featuresIncluded")?.title ||
            "FEATURES INCLUDED:",
          keyHighlights: (() => {
            const sf = leftDetailFields.find(
              (f) => f.id === "featuresIncluded",
            );
            return sf && sf.value ? sf.value.split("\n").filter(Boolean) : [];
          })(),
          otherDetails: {
            ...[...leftDetailFields, ...rightDetailFields]
              .filter(
                (f) =>
                  ![
                    "byLawRestrictions",
                    "maintenanceFees",
                    "maintenanceFeesInclude",
                    "featuresIncluded",
                    "amenities",
                  ].includes(f.id),
              )
              .reduce(
                (acc, f) => ({
                  ...acc,
                  [f.id]: {
                    title: f.title,
                    value: f.value,
                    style: f.style || ({} as TextStyle),
                    titleStyle: f.titleStyle || ({} as TextStyle),
                  },
                }),
                {} as Record<string, any>,
              ),
            mlsNumber: {
              value: mlsNumber,
              style: fieldStyles.mlsNumber || ({} as TextStyle),
            },
            bedroom: {
              value: bedroom,
              style: fieldStyles.bedroom || ({} as TextStyle),
            },
            bathroom: {
              value: bathroom,
              style: fieldStyles.bathroom || ({} as TextStyle),
            },
            sqft: {
              value: sqft,
              style: fieldStyles.sqft || ({} as TextStyle),
            },
            builtYear: {
              value: builtYear,
              style: fieldStyles.builtYear || ({} as TextStyle),
            },
            realtorLabel: {
              value: realtorLabel,
              style: fieldStyles.realtorLabel || ({} as TextStyle),
            },
            propertyLabel: {
              value: propertyLabel,
              style: fieldStyles.propertyLabel || ({} as TextStyle),
            },
            priceLabel: {
              value: priceLabel,
              style: fieldStyles.priceLabel || ({} as TextStyle),
            },
            emailLabel: {
              value: emailLabel,
              style: fieldStyles.emailLabel || ({} as TextStyle),
            },
            bedroomLabel: {
              value: bedroomLabel,
              style: fieldStyles.bedroomLabel || ({} as TextStyle),
            },
            bathroomLabel: {
              value: bathroomLabel,
              style: fieldStyles.bathroomLabel || ({} as TextStyle),
            },
            sqftLabel: {
              value: sqftLabel,
              style: fieldStyles.sqftLabel || ({} as TextStyle),
            },
            builtYearLabel: {
              value: builtYearLabel,
              style: fieldStyles.builtYearLabel || ({} as TextStyle),
            },
            propertyName: {
              value: propertyName,
              style: fieldStyles.propertyName || ({} as TextStyle),
            },
            phone: {
              value: phone,
              style: fieldStyles.phone || ({} as TextStyle),
            },
            phoneLabel: {
              value: phoneLabel,
              style: fieldStyles.phoneLabel || ({} as TextStyle),
            },
            mlsLabel: {
              value: mlsLabel,
              style: fieldStyles.mlsLabel || ({} as TextStyle),
            },
            roadLabelBefore: {
              value: roadLabelBefore,
              style: fieldStyles.roadLabelBefore || ({} as TextStyle),
            },
            roadLabelAfter: {
              value: roadLabelAfter,
              style: fieldStyles.roadLabelAfter || ({} as TextStyle),
            },
            disclaimerText: {
              value: disclaimerText,
              style: fieldStyles.disclaimerText || ({} as TextStyle),
            },
            printedByText: {
              value: printedByText,
              style: fieldStyles.printedByText || ({} as TextStyle),
            },
            fieldPositions,
            _lockedSections: lockedSections,
            _leftDetailFields: leftDetailFields,
            _rightDetailFields: rightDetailFields,
            _deletedDetailFields: deletedDetailFields,
            _deletedStandardFieldIds: deletedStandardFieldIds,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
        });
        payload.fieldPositions = fieldPositions;
        return payload;
      },

      importFromPayload: (payload: FeatureSheetResponse) => {
        const state = featureSheetService.parsePayloadToState(payload);
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";

        if (state.offeredAtPrice) setAmount(s(state.offeredAtPrice));
        if (state.realtorName) setFullName(s(state.realtorName));
        if (state.emailLink) setEmail(s(state.emailLink));
        if (state.companyName) setCompanyName(s(state.companyName));
        if (state.propertyNotesTitle) setRoadName(s(state.propertyNotesTitle));
        if (state.propertyNotesDescription)
          setDescription(s(state.propertyNotesDescription));

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

        if (
          rawOtherDetails._leftDetailFields &&
          Array.isArray(rawOtherDetails._leftDetailFields)
        ) {
          setLeftDetailFields(
            rawOtherDetails._leftDetailFields as DetailField[],
          );
        }
        if (
          rawOtherDetails._rightDetailFields &&
          Array.isArray(rawOtherDetails._rightDetailFields)
        ) {
          setRightDetailFields(
            rawOtherDetails._rightDetailFields as DetailField[],
          );
        } else {
          const reconstructedLeft: DetailField[] = [];
          const reconstructedRight: DetailField[] = [];

          const addField = (
            targetList: DetailField[],
            id: string,
            defaultTitle: string,
            val: any,
            titleRaw: any,
          ) => {
            const titleStr =
              typeof titleRaw === "string"
                ? titleRaw
                : titleRaw?.value || defaultTitle;
            const titleStyle =
              typeof titleRaw === "object"
                ? (titleRaw as any)?.style
                : undefined;
            const valStr = typeof val === "string" ? val : val?.value || "";
            const style = (val as any)?.style as TextStyle | undefined;
            targetList.push({
              id,
              title: titleStr,
              value: valStr,
              ...(style ? { style } : {}),
              ...(titleStyle ? { titleStyle } : {}),
            });
          };

          if (state.expandedDetail1Description !== undefined)
            addField(
              reconstructedLeft,
              "byLawRestrictions",
              "BY-LAW RESTRICTIONS:",
              state.expandedDetail1Description,
              (payload.content as any).expandedDetail1Title,
            );
          if (state.expandedDetail2Description !== undefined)
            addField(
              reconstructedLeft,
              "maintenanceFees",
              "MAINTENANCE FEES:",
              state.expandedDetail2Description,
              (payload.content as any).expandedDetail2Title,
            );
          if (state.expandedDetail3Description !== undefined)
            addField(
              reconstructedLeft,
              "maintenanceFeesInclude",
              "MAINTENANCE FEES INCLUDE:",
              state.expandedDetail3Description,
              (payload.content as any).expandedDetail3Title,
            );
          if (state.keyHighlights) {
            const sfVal = Array.isArray(state.keyHighlights)
              ? state.keyHighlights.map((h) => s(h)).join("\n")
              : s(state.keyHighlights);
            const sfTitle =
              s((payload.content as any).keyHighlightLabel) ||
              "FEATURES INCLUDED:";
            reconstructedLeft.push({
              id: "featuresIncluded",
              title: sfTitle,
              value: sfVal,
              style: (payload.content.otherDetails as any)?.featuresIncluded
                ?.style,
            });
          }

          if (rawOtherDetails.siteInfluences) {
            const f = rawOtherDetails.siteInfluences;
            reconstructedRight.push({
              id: "siteInfluences",
              title: f.title || "SITE INFLUENCES:",
              value: s(f),
              ...(f.style ? { style: f.style } : {}),
            });
          }
          if (state.expandedDetail4Description !== undefined)
            addField(
              reconstructedRight,
              "amenities",
              "AMENITIES:",
              state.expandedDetail4Description,
              (payload.content as any).expandedDetail4Title,
            );
          if (rawOtherDetails.view) {
            const f = rawOtherDetails.view;
            reconstructedRight.push({
              id: "view",
              title: f.title || "VIEW:",
              value: s(f),
              ...(f.style ? { style: f.style } : {}),
            });
          }

          if (reconstructedLeft.length > 0)
            setLeftDetailFields(reconstructedLeft);
          if (reconstructedRight.length > 0)
            setRightDetailFields(reconstructedRight);
        }

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, any>;
          if (details.bedroom) setBedroom(s(details.bedroom));
          if (details.bathroom) setBathroom(s(details.bathroom));
          if (details.sqft) setSqft(s(details.sqft));
          if (details.builtYear) setBuiltYear(s(details.builtYear));
          if (details.mlsNumber) setMlsNumber(s(details.mlsNumber));
          if (details.realtorLabel) setRealtorLabel(s(details.realtorLabel));
          if (details.propertyLabel) setPropertyLabel(s(details.propertyLabel));
          if (details.priceLabel) setPriceLabel(s(details.priceLabel));
          if (details.emailLabel) setEmailLabel(s(details.emailLabel));
          if (details.bedroomLabel) setBedroomLabel(s(details.bedroomLabel));
          if (details.bathroomLabel) setBathroomLabel(s(details.bathroomLabel));
          if (details.sqftLabel) setSqftLabel(s(details.sqftLabel));
          if (details.builtYearLabel)
            setBuiltYearLabel(s(details.builtYearLabel));
          if (details.phone) setPhone(s(details.phone));
          if (details.phoneLabel) setPhoneLabel(s(details.phoneLabel));
          if (details.mlsLabel) setMlsLabel(s(details.mlsLabel));
          if (details.roadLabelBefore)
            setRoadLabelBefore(s(details.roadLabelBefore));
          if (details.roadLabelAfter)
            setRoadLabelAfter(s(details.roadLabelAfter));
          if (details.disclaimerText)
            setDisclaimerText(s(details.disclaimerText));
          if (details.printedByText) setPrintedByText(s(details.printedByText));
          if (details.companyName) setCompanyName(s(details.companyName));
          if (details.propertyName) setPropertyName(s(details.propertyName));

          if (details._lockedSections) {
            setLockedSections((prev) => ({
              ...prev,
              ...details._lockedSections,
            }));
          }
        }

        // Restore styles with font-size normalization
        const styles: Record<string, TextStyle> = {};
        const c = payload.content;
        const st = (f: any) => (f as StyledTextField)?.style;

        if (st(c.offeredAtPrice)) {
          const sObj = st(c.offeredAtPrice);
          styles.amount =
            sObj.fontSize === "36px" ? { ...sObj, fontSize: "32px" } : sObj;
        }
        if (st(c.realtorName)) {
          const sObj = st(c.realtorName);
          styles.fullName =
            sObj.fontSize === "20px" ? { ...sObj, fontSize: "14px" } : sObj;
        }
        if (st(c.companyName)) {
          const sObj = st(c.companyName);
          styles.companyName =
            sObj.fontSize === "20px" ? { ...sObj, fontSize: "14px" } : sObj;
        }
        if (st(c.emailLink)) {
          const sObj = st(c.emailLink);
          styles.email =
            sObj.fontSize === "20px" ? { ...sObj, fontSize: "12px" } : sObj;
        }
        if (st(c.propertyNotesTitle)) {
          const sObj = st(c.propertyNotesTitle);
          styles.roadName =
            sObj.fontSize === "28px" ? { ...sObj, fontSize: "30px" } : sObj;
        }
        if (st(c.propertyNotesDescription)) {
          styles.description = st(c.propertyNotesDescription);
        }

        const od = (c.otherDetails as Record<string, any>) || {};
        if (od.mlsNumber?.style) styles.mlsNumber = od.mlsNumber.style;
        if (od.bedroom?.style) styles.bedroom = od.bedroom.style;
        if (od.bathroom?.style) styles.bathroom = od.bathroom.style;
        if (od.sqft?.style) styles.sqft = od.sqft.style;
        if (od.builtYear?.style) styles.builtYear = od.builtYear.style;
        if (od.realtorLabel?.style) styles.realtorLabel = od.realtorLabel.style;
        if (od.propertyLabel?.style)
          styles.propertyLabel = od.propertyLabel.style;
        if (od.priceLabel?.style) styles.priceLabel = od.priceLabel.style;
        if (od.emailLabel?.style) styles.emailLabel = od.emailLabel.style;
        if (od.bedroomLabel?.style) styles.bedroomLabel = od.bedroomLabel.style;
        if (od.bathroomLabel?.style)
          styles.bathroomLabel = od.bathroomLabel.style;
        if (od.sqftLabel?.style) styles.sqftLabel = od.sqftLabel.style;
        if (od.builtYearLabel?.style)
          styles.builtYearLabel = od.builtYearLabel.style;
        if (od.roadLabelBefore?.style)
          styles.roadLabelBefore = od.roadLabelBefore.style;
        if (od.roadLabelAfter?.style)
          styles.roadLabelAfter = od.roadLabelAfter.style;
        if (od.disclaimerText?.style)
          styles.disclaimerText = od.disclaimerText.style;

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
        if (rawOtherDetails.fieldPositions) {
          setFieldPositions(
            rawOtherDetails.fieldPositions as Record<
              string,
              { x: number; y: number }
            >,
          );
        } else if (payload.fieldPositions) {
          setFieldPositions(
            payload.fieldPositions as Record<string, { x: number; y: number }>,
          );
        }
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

        <div className="w-full flex flex-col items-center justify-center font-alexandria pb-8 pt-0 gap-0">
          {/* TOP SHEET BANNERS (PAGE 4 | PAGE 1) */}
          <div
            data-html2canvas-ignore="true"
            className="flex items-center justify-between gap-6 select-none"
            style={{
              width: showBleed ? "17.25in" : "17in",
              zoom: 0.55,
              margin: "0 auto 32px auto",
            }}
          >
            <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
              PAGE 4
            </div>
            <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
              PAGE 1
            </div>
          </div>

          {/* SPREAD 1 (PAGE 4 | PAGE 1) */}
          <div
            className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            {/* Page 4 Background Gradient in parent bleed container for edge-to-edge coverage */}
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none z-0"
              style={{
                width: "50%",
                height: "100%",
                left: 0,
                background:
                  "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #1B6C9B 89%, #226392 100%)",
              }}
            />

            {/* Page 1 (Cover) Full-Bleed Background & Image4 Slot */}
            <div
              data-image-slot="true"
              className="absolute top-0 bottom-0 right-0 bg-gray-200 overflow-hidden group cursor-pointer z-0 pointer-events-auto"
              style={{
                width: "50%",
                height: "100%",
                left: "50%",
                right: 0,
              }}
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
                className="w-full h-full relative overflow-hidden flex items-center justify-center pointer-events-auto"
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
                      />
                    </div>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                    {/* Rotate */}
                    <button
                      type="button"
                      onClick={() => handleRotate("image4")}
                      className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                      title="Rotate image"
                    >
                      <RotateCw className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={(e) => openImageSourceModal("image4", e)}
                      className="absolute top-1/3 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image4", fileInputRef4)}
                      className="absolute top-1/3 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      openImageSourceModal("image4", e);
                    }}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 text-lg font-medium pointer-events-auto select-none"
                  >
                    Select Cover Image
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

              {/* Top Wave SVG - Full Bleed */}
              <svg
                width="100%"
                height="418"
                viewBox="0 0 632 418"
                fill="none"
                preserveAspectRatio="none"
                className="absolute top-0 right-0 left-0 w-full z-10 pointer-events-none"
              >
                <path
                  d="M0.692032 115.581L631.688 101L630.405 418C630.405 418 587.402 78.0195 0.688049 173.546L0.692032 115.581Z"
                  fill="#00B9F2"
                />
                <mask
                  id="mask0_72_1672_std3"
                  style={{ maskType: "luminance" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="632"
                  height="405"
                >
                  <path
                    d="M0 0L0.799988 146.9C590.8 64.1 631.3 404.8 631.3 404.8V0H0Z"
                    fill="white"
                  />
                </mask>
                <g mask="url(#mask0_72_1672_std3)">
                  <rect
                    x="0"
                    y="0"
                    width="632"
                    height="418"
                    fill="url(#paint0_linear_72_1672_std3)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_72_1672_std3"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                    gradientUnits="objectBoundingBox"
                  >
                    <stop stopColor="#00B9F2" />
                    <stop offset="0.391667" stopColor="#0097C9" />
                    <stop offset="0.515476" stopColor="#028DBD" />
                    <stop offset="0.892857" stopColor="#1B6C9B" />
                    <stop offset="1" stopColor="#226392" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Bottom Wave SVG - Full Bleed */}
              <svg
                width="100%"
                height="319"
                viewBox="0 0 634 319"
                fill="none"
                preserveAspectRatio="none"
                className="absolute bottom-0 -right-1 left-0 w-full z-10 pointer-events-none"
              >
                <path
                  d="M633.05 280.308L4.3773 293L0.0778809 -2.80029e-06C0.0778809 -2.80029e-06 43.2047 299.058 633.078 215.36L633.05 280.308Z"
                  fill="#00B9F2"
                />
                <mask
                  id="mask0_73_1690_std3"
                  style={{ maskType: "luminance" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="6"
                  width="634"
                  height="313"
                >
                  <path
                    d="M0 318.802H633.441V239.402C41.4401 313.502 0.802701 6.00183 0.802701 6.00183L0 318.802Z"
                    fill="white"
                  />
                </mask>
                <g mask="url(#mask0_73_1690_std3)">
                  <path
                    d="M633.441 -509.198H-630.832V318.802H633.441V-509.198Z"
                    fill="url(#paint0_linear_73_1690_std3)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_73_1690_std3"
                    x1="633.441"
                    y1="308.014"
                    x2="0.837279"
                    y2="308.014"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B9F2" />
                    <stop offset="0.391667" stopColor="#0097C9" />
                    <stop offset="0.515476" stopColor="#028DBD" />
                    <stop offset="0.892857" stopColor="#1B6C9B" />
                    <stop offset="1" stopColor="#226392" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <SafeZoneWrapper
              showBleed={showBleed}
              showGuide={showGuide}
              className="pointer-events-none"
            >
              <div className="w-full flex items-stretch h-full relative z-10 pointer-events-none">
                {/* ── PAGE 4 (Left Side of Spread 1 - Back Cover) ────────────────────────── */}
                <div className="w-1/2 flex flex-col justify-between relative overflow-hidden py-0 px-4 h-full pointer-events-auto">
                  {/* Top Photo / Floor Plan Slot (image1) - Max Height & 95% Width */}
                  <div className="w-full flex items-center justify-center">
                    <div
                      data-image-slot="true"
                      className="w-[95%] h-[760px] relative overflow-hidden group cursor-pointer"
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
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image1", "in")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3 h-3 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image1", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3 h-3 text-gray-700" />
                              </button>
                            </div>

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image1")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image1", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image1", fileInputRef1)
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
                            onClick={(e) => openImageSourceModal("image1", e)}
                            className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 text-gray-400 flex items-center justify-center cursor-pointer text-base font-medium"
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
                  </div>

                  {/* image2: Agent Logo Slot (Page 4) */}
                  <div
                    id="agentLogo2"
                    data-image-slot="true"
                    data-slot-type="logo"
                    data-logo-slot="true"
                    className="w-[240px] h-[75px] mx-auto my-1 relative overflow-hidden group cursor-pointer"
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
                            />
                          </div>

                          {/* Zoom Controls */}
                          <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image2", "in")}
                              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-3 h-3 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image2", "out")}
                              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-3 h-3 text-gray-700" />
                            </button>
                          </div>

                          {/* Rotate */}
                          <button
                            type="button"
                            onClick={() => handleRotate("image2")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image2", e)}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Delete */}
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
                          onClick={(e) => openImageSourceModal("image2", e)}
                          className="w-full h-full bg-white/20 text-white flex items-center justify-center cursor-pointer border border-dashed border-white/50 text-xs font-medium"
                        >
                          Select Agent Logo
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

                  {/* Section Container: Contact Details */}
                  <div
                    data-safezone-container="true"
                    className={`flex flex-col items-center gap-1 w-full relative z-10 border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 p-2 text-center group/sec ${
                      lockedSections.contact
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
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
                      className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    {/* Line 1: Agent Full Name and Company Name */}
                    <div className="flex items-center justify-center gap-1.5 flex-wrap text-center">
                      {!isFieldDeleted("fullName") && (
                        <DraggableBox
                          id="fullName"
                          position={fieldPositions.fullName}
                          onPositionChange={updateFieldPosition}
                          label="Agent Name"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "fullName",
                              "Agent Name",
                              fullName,
                              "Page 4 - Contact",
                              fieldStyles.fullName,
                            )
                          }
                          deleteTitle="Remove Agent Name"
                        >
                          <StyledInput
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("fullName", s)
                            }
                            inputStyle={fieldStyles.fullName}
                            className="font-bold text-[14px] text-white bg-transparent text-center focus:outline-none border-none placeholder-white placeholder:font-bold uppercase tracking-wider"
                            placeholder="FIRSTNAME LASTNAME"
                            wrapperClassName="w-auto shrink-0 inline-block"
                          />
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("companyName") && (
                        <DraggableBox
                          id="companyName"
                          position={fieldPositions.companyName}
                          onPositionChange={updateFieldPosition}
                          label="Company Name"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "companyName",
                              "Company Name",
                              companyName,
                              "Page 4 - Contact",
                              fieldStyles.companyName,
                            )
                          }
                          deleteTitle="Remove Company Name"
                        >
                          <StyledInput
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("companyName", s)
                            }
                            inputStyle={fieldStyles.companyName}
                            className="font-normal text-[14px] text-white/90 bg-transparent text-center focus:outline-none border-none placeholder-white/80 placeholder:font-normal uppercase tracking-wider"
                            placeholder="MACDONALD REALTY"
                            wrapperClassName="w-auto shrink-0 inline-block"
                          />
                        </DraggableBox>
                      )}
                    </div>

                    {/* Line 2: Phone & Email */}
                    <div className="flex items-center justify-center gap-3 flex-wrap text-center">
                      {!isFieldDeleted("phone") && (
                        <DraggableBox
                          id="phone"
                          position={fieldPositions.phone}
                          onPositionChange={updateFieldPosition}
                          label="Phone"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "phone",
                              "Phone",
                              `${phoneLabel} ${phone}`,
                              "Page 4 - Contact",
                              fieldStyles.phone,
                            )
                          }
                          deleteTitle="Remove Phone"
                        >
                          <div className="flex items-center gap-1">
                            <StyledInput
                              value={phoneLabel}
                              onChange={(e) => setPhoneLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("phoneLabel", s)
                              }
                              inputStyle={fieldStyles.phoneLabel}
                              className="font-bold text-[12px] text-white bg-transparent text-right focus:outline-none border-none"
                              placeholder="PHONE:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("phone", s)
                              }
                              inputStyle={fieldStyles.phone}
                              className="font-medium text-[12px] text-white/90 bg-transparent text-left focus:outline-none border-none placeholder-white/80"
                              placeholder="604.000.0000"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("email") && (
                        <DraggableBox
                          id="email"
                          position={fieldPositions.email}
                          onPositionChange={updateFieldPosition}
                          label="Email"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "email",
                              "Email",
                              `${emailLabel} ${email}`,
                              "Page 4 - Contact",
                              fieldStyles.email,
                            )
                          }
                          deleteTitle="Remove Email"
                        >
                          <div className="flex items-center gap-1">
                            <StyledInput
                              value={emailLabel}
                              onChange={(e) => setEmailLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("emailLabel", s)
                              }
                              inputStyle={fieldStyles.emailLabel}
                              className="font-bold text-[12px] text-white bg-transparent text-right focus:outline-none border-none"
                              placeholder="EMAIL:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("email", s)
                              }
                              inputStyle={fieldStyles.email}
                              className="font-medium text-[12px] text-white/90 bg-transparent text-left focus:outline-none border-none placeholder-white/80 uppercase"
                              placeholder="FIRST@LAST.COM"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>

                    {/* Line 3: MLS Number */}
                    {!isFieldDeleted("mlsNumber") && (
                      <DraggableBox
                        id="mlsNumber"
                        position={fieldPositions.mlsNumber}
                        onPositionChange={updateFieldPosition}
                        label="MLS #"
                        zoom={0.55}
                        disabled={lockedSections.contact}
                        onDelete={() =>
                          removeStandardField(
                            "mlsNumber",
                            "MLS #",
                            `${mlsLabel} ${mlsNumber}`,
                            "Page 4 - Contact",
                            fieldStyles.mlsNumber,
                          )
                        }
                        deleteTitle="Remove MLS #"
                      >
                        <div className="flex items-center justify-center gap-1 text-center">
                          <StyledInput
                            value={mlsLabel}
                            onChange={(e) => setMlsLabel(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsLabel", s)
                            }
                            inputStyle={fieldStyles.mlsLabel}
                            className="font-bold text-[13px] text-white bg-transparent text-right focus:outline-none border-none"
                            placeholder="MLS #"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={mlsNumber}
                            onChange={(e) => setMlsNumber(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsNumber", s)
                            }
                            inputStyle={fieldStyles.mlsNumber}
                            className="font-bold text-[13px] text-white bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-bold"
                            placeholder="000000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {/* Disclaimer & Printed By Footer */}
                    {!isFieldDeleted("disclaimerText") && (
                      <DraggableBox
                        id="disclaimerText"
                        position={fieldPositions.disclaimerText}
                        onPositionChange={updateFieldPosition}
                        label="Disclaimer & Footer"
                        zoom={0.55}
                        disabled={lockedSections.contact}
                        onDelete={() =>
                          removeStandardField(
                            "disclaimerText",
                            "Disclaimer & Footer",
                            disclaimerText,
                            "Page 4 - Footer",
                            fieldStyles.disclaimerText,
                          )
                        }
                        deleteTitle="Remove Disclaimer"
                      >
                        <div className="text-white text-center w-full px-1 mt-1 cursor-default select-none pointer-events-auto">
                          <div className="text-left font-normal flex items-start gap-1.5">
                            <p className="text-[8px] leading-[1] text-white/90 text-left w-full m-0 select-none pointer-events-none">
                              {disclaimerText}
                            </p>
                            <span className="flex mt-0.5 items-center gap-1 shrink-0">
                              <House className="w-3.5 h-3.5 text-white" />
                              <svg
                                className="w-3.5 h-3.5 text-white fill-current"
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-7 2.5l5 3.75v6.5h-3v-4h-4v4H7v-6.5l5-3.75z" />
                              </svg>
                            </span>
                          </div>
                          <p className="text-left font-bold text-[9px] mt-1 text-white uppercase tracking-wider select-none pointer-events-none m-0">
                            {printedByText}
                          </p>
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* ── PAGE 1 (Right Side of Spread 1 - Cover) ────────────────── */}
                <div className="w-1/2 relative h-full pointer-events-none py-0 px-6 flex flex-col justify-between">
                  {/* Top Header Address Section */}
                  <div
                    data-safezone-container="true"
                    className={`flex justify-between items-start pt-2 relative z-20 border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec pointer-events-auto ${
                      lockedSections.address
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Lock Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("address");
                      }}
                      className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.address
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.address
                          ? "Unlock Address Section (enable dragging)"
                          : "Lock Address Section (disable dragging)"
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

                    {/* Address Line & Community */}
                    <div className="flex flex-col text-white">
                      <div className="flex items-baseline gap-4 flex-wrap">
                        {/* MLS Number / Suite */}
                        {!isFieldDeleted("addressCode") && (
                          <DraggableBox
                            id="addressCode"
                            position={fieldPositions.addressCode}
                            onPositionChange={updateFieldPosition}
                            label="MLS / Suite #"
                            zoom={0.55}
                            disabled={lockedSections.address}
                            onDelete={() =>
                              removeStandardField(
                                "addressCode",
                                "MLS / Suite #",
                                `#${mlsNumber}`,
                                "Page 1 - Cover",
                                fieldStyles.mlsNumber,
                              )
                            }
                            deleteTitle="Remove MLS #"
                          >
                            <div className="flex items-baseline font-light text-[30px] leading-none gap-0.5">
                              <span className="font-extrabold text-[24px] text-white">
                                #
                              </span>
                              <StyledInput
                                value={mlsNumber}
                                onChange={(e) => setMlsNumber(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("mlsNumber", s)
                                }
                                inputStyle={fieldStyles.mlsNumber}
                                className="font-light text-[30px] h-[35px] w-[140px] leading-none bg-transparent text-white text-left focus:outline-none border-none placeholder-white placeholder:font-[200]"
                                placeholder="A2342"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Combined Road & Number Field */}
                        {!isFieldDeleted("roadName") && (
                          <DraggableBox
                            id="roadName"
                            position={fieldPositions.roadName}
                            onPositionChange={updateFieldPosition}
                            label="Road & Number"
                            zoom={0.55}
                            disabled={lockedSections.address}
                            onDelete={() =>
                              removeStandardField(
                                "roadName",
                                "Road & Number",
                                `${roadLabelBefore} ${roadName} ${roadLabelAfter}`,
                                "Page 1 - Cover",
                                fieldStyles.roadName,
                              )
                            }
                            deleteTitle="Remove Road Info"
                          >
                            <div className="flex items-baseline font-light text-[30px] leading-none gap-1">
                              <StyledInput
                                value={roadLabelBefore}
                                onChange={(e) =>
                                  setRoadLabelBefore(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("roadLabelBefore", s)
                                }
                                inputStyle={fieldStyles.roadLabelBefore}
                                className="font-light text-[30px] text-white uppercase bg-transparent border-none focus:outline-none"
                                placeholder="NUMBER"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={roadName}
                                onChange={(e) => setRoadName(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("roadName", s)
                                }
                                inputStyle={fieldStyles.roadName}
                                className="font-light text-[30px] h-[35px] leading-none bg-transparent text-white text-center w-[50px] focus:outline-none border-none placeholder-white placeholder:font-[200]"
                                placeholder="0"
                              />
                              <StyledInput
                                value={roadLabelAfter}
                                onChange={(e) =>
                                  setRoadLabelAfter(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("roadLabelAfter", s)
                                }
                                inputStyle={fieldStyles.roadLabelAfter}
                                className="font-light text-[30px] text-white uppercase ml-1 bg-transparent border-none focus:outline-none"
                                placeholder="ROAD"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

                      {!isFieldDeleted("propertyName") && (
                        <DraggableBox
                          id="cityLine"
                          position={fieldPositions.cityLine}
                          onPositionChange={updateFieldPosition}
                          label="Community / Property"
                          zoom={0.55}
                          disabled={lockedSections.address}
                          onDelete={() =>
                            removeStandardField(
                              "propertyName",
                              "Community / Property",
                              propertyName,
                              "Page 1 - Cover",
                              fieldStyles.propertyName,
                            )
                          }
                          deleteTitle="Remove Community"
                        >
                          <div className="mt-1">
                            <StyledInput
                              value={propertyName}
                              onChange={(e) => setPropertyName(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("propertyName", s)
                              }
                              inputStyle={fieldStyles.propertyName}
                              className="font-light text-[15px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[200] tracking-[1.5px] uppercase"
                              placeholder="BRIGHOUSE SOUTH, RICHMOND"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>

                    {/* image3: Agent Logo Slot (Cover) */}
                    <div
                      id="agentLogo3"
                      data-image-slot="true"
                      data-slot-type="logo"
                      data-logo-slot="true"
                      className="my-1 w-[200px] h-[100px] relative overflow-hidden group cursor-pointer"
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
                              onMouseDown={(e) => handleMouseDown("image3", e)}
                            >
                              <ImageEditor
                                src={images.image3}
                                scale={scale.image3}
                                position={position.image3}
                                rotation={rotation.image3}
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image3", "in")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3 h-3 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image3", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3 h-3 text-gray-700" />
                              </button>
                            </div>

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image3")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image3", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
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
                            onClick={(e) => openImageSourceModal("image3", e)}
                            className="w-full h-full bg-white/20 text-white flex items-center justify-center cursor-pointer border border-dashed border-white/50 text-xs"
                          >
                            Select Agent Logo
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
                  </div>

                  {/* Bottom Cover Price Section */}
                  <div
                    data-safezone-container="true"
                    className={`relative w-[500px] z-20 pb-2 border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec pointer-events-auto ${
                      lockedSections.price
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Lock Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("price");
                      }}
                      className={`absolute -top-6 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.price
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.price
                          ? "Unlock Price Section (enable dragging)"
                          : "Lock Price Section (disable dragging)"
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

                    {!isFieldDeleted("amount") && (
                      <DraggableBox
                        id="amount"
                        position={fieldPositions.amount}
                        onPositionChange={updateFieldPosition}
                        label="Property Price"
                        zoom={0.55}
                        disabled={lockedSections.price}
                        onDelete={() =>
                          removeStandardField(
                            "amount",
                            "Property Price",
                            amount,
                            "Page 1 - Cover",
                            fieldStyles.amount,
                          )
                        }
                        deleteTitle="Remove Property Price"
                      >
                        <div className="flex flex-col text-left">
                          <StyledInput
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onChangeStyle={(s) => updateFieldStyle("amount", s)}
                            inputStyle={fieldStyles.amount}
                            className="font-extrabold text-[32px] text-white bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-bold leading-tight"
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

          {/* BOTTOM SHEET BANNERS (PAGE 2 | PAGE 3) */}
          <div
            data-html2canvas-ignore="true"
            className="flex items-center justify-between gap-6 select-none"
            style={{
              width: showBleed ? "17.25in" : "17in",
              zoom: 0.55,
              margin: "48px auto 32px auto",
            }}
          >
            <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
              PAGE 2
            </div>
            <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
              PAGE 3
            </div>
          </div>

          {/* SPREAD 2 (PAGE 2 | PAGE 3) */}
          <div
            className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            {/* Page 2 Left SVG Background */}
            <div
              className="w-1/2 absolute top-0 bottom-0 left-0 pointer-events-none"
              style={{
                height: "100%",
                width: "50%",
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 569 828"
                fill="none"
                preserveAspectRatio="none"
                className="absolute top-0 right-0 bottom-0 w-full h-full"
              >
                <path
                  d="M64.9235 -3.07471L42.1565 822.334L568.239 827.848C568.239 827.848 31.2785 771.359 181.536 -3.13971L64.9235 -3.07471Z"
                  fill="#00B9F2"
                />
                <mask
                  id="mask0_77_1804_std3"
                  style={{ maskType: "luminance" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="558"
                  height="828"
                >
                  <path
                    d="M0.333252 0V828L557.333 827C557.333 827 12.8333 773.9 143.933 0H0.333252Z"
                    fill="white"
                  />
                </mask>
                <g mask="url(#mask0_77_1804_std3)">
                  <path
                    d="M1260.33 0V828H0.333249V0H1260.33Z"
                    fill="url(#paint0_linear_77_1804_std3)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_77_1804_std3"
                    x1="22.4077"
                    y1="-0.318146"
                    x2="22.4077"
                    y2="826.954"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B9F2" />
                    <stop offset="0.391667" stopColor="#0097C9" />
                    <stop offset="0.515476" stopColor="#028DBD" />
                    <stop offset="0.892857" stopColor="#1B6C9B" />
                    <stop offset="1" stopColor="#226392" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Page 3 Right SVG Background */}
            <div
              className="w-1/2 absolute top-0 bottom-0 right-0 pointer-events-none"
              style={{
                height: "100%",
                width: "50%",
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 692 828"
                fill="none"
                preserveAspectRatio="none"
                className="absolute top-0 bottom-0 left-0 w-full h-full"
              >
                <path
                  d="M607.291 828.48L637.013 -3.89404L0.845947 -1.79901C0.845947 -1.79901 683.097 54.4949 490.964 828.559L607.291 828.48Z"
                  fill="#00B9F2"
                />
                <mask
                  id="mask0_77_1803_std3"
                  style={{ maskType: "luminance" }}
                  maskUnits="userSpaceOnUse"
                  x="40"
                  y="0"
                  width="652"
                  height="828"
                >
                  <path
                    d="M40.0332 0C168.833 20.2 687.233 144.5 538.533 827L691.333 828V0H40.0332Z"
                    fill="white"
                  />
                </mask>
                <g mask="url(#mask0_77_1803_std3)">
                  <path
                    d="M-568.667 828V4.1431e-05H691.333V828H-568.667Z"
                    fill="url(#paint0_linear_77_1803_std3)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_77_1803_std3"
                    x1="661.929"
                    y1="826.95"
                    x2="661.929"
                    y2="-3.59994"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B9F2" />
                    <stop offset="0.391667" stopColor="#0097C9" />
                    <stop offset="0.515476" stopColor="#028DBD" />
                    <stop offset="0.892857" stopColor="#1B6C9B" />
                    <stop offset="1" stopColor="#226392" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="flex gap-6 items-stretch h-full w-full relative z-10 p-[0px]">
                {/* ── PAGE 2 (Left Side of Spread 2) ────────────────────────── */}
                <div className="w-1/2 h-full flex flex-col justify-between gap-4">
                  {/* image13: Top Photo */}
                  <div
                    data-image-slot="true"
                    className="h-[490px] border-2 border-[#fff] relative overflow-hidden group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
                    onMouseEnter={() => setHoveredSlot("image13")}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={(e) => {
                      if (e.altKey) return;
                      e.stopPropagation();
                      setActiveSlot("image13");
                    }}
                  >
                    <BoxIndicator isVisible={isSlotActive("image13")} />
                    <div
                      className="w-full h-full relative overflow-hidden flex items-center justify-center"
                      onMouseMove={(e) => handleMouseMove("image13", e)}
                      onMouseUp={() => handleMouseUp("image13")}
                      onMouseLeave={() => handleMouseLeave("image13")}
                    >
                      {images.image13 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image13", e)}
                          >
                            <ImageEditor
                              src={images.image13}
                              scale={scale.image13}
                              position={position.image13}
                              rotation={rotation.image13}
                            />
                          </div>

                          {/* Zoom Controls */}
                          <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image13", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image13", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          {/* Rotate */}
                          <button
                            type="button"
                            onClick={() => handleRotate("image13")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image13", e)}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image13", fileInputRef13)
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
                          onClick={(e) => openImageSourceModal("image13", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                        >
                          Select Image
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef13}
                        onChange={(e) => handleImageChange("image13", e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Middle Row: image5 + Specs & Description */}
                  <div className="flex gap-4">
                    {/* image5: Middle Left Photo */}
                    <div
                      data-image-slot="true"
                      className="w-[300px] h-[200px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group cursor-pointer shrink-0 shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
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
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image5")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image5", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
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
                            onClick={(e) => openImageSourceModal("image5", e)}
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

                    {/* Specs & Description Section */}
                    <div
                      data-safezone-container="true"
                      className={`flex-1 flex flex-col gap-2 relative z-[19] border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec ${
                        lockedSections.specs
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                    >
                      {/* Lock Button */}
                      <button
                        type="button"
                        data-html2canvas-ignore="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionLock("specs");
                        }}
                        className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                      {/* Specs Row */}
                      <div className="font-bold text-[12px] text-[#226292] flex flex-wrap gap-2 items-center leading-tight">
                        {/* Bedrooms */}
                        {!isFieldDeleted("bedroom") && (
                          <DraggableBox
                            id="bedroom"
                            position={fieldPositions.bedroom}
                            onPositionChange={updateFieldPosition}
                            label="Bedrooms"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "bedroom",
                                "Bedrooms",
                                `${bedroom} ${bedroomLabel}`,
                                "Page 2 - Specs",
                                fieldStyles.bedroom,
                              )
                            }
                            deleteTitle="Remove Bedrooms"
                          >
                            <div className="flex items-center gap-1">
                              <StyledInput
                                value={bedroom}
                                onChange={(e) => setBedroom(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("bedroom", s)
                                }
                                inputStyle={fieldStyles.bedroom}
                                className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0"
                              />
                              <StyledInput
                                value={bedroomLabel}
                                onChange={(e) =>
                                  setBedroomLabel(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("bedroomLabel", s)
                                }
                                inputStyle={fieldStyles.bedroomLabel}
                                className="font-bold text-[12px] text-[#226292] bg-transparent focus:outline-none border-none uppercase"
                                placeholder="BEDROOM •"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Bathrooms */}
                        {!isFieldDeleted("bathroom") && (
                          <DraggableBox
                            id="bathroom"
                            position={fieldPositions.bathroom}
                            onPositionChange={updateFieldPosition}
                            label="Bathrooms"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "bathroom",
                                "Bathrooms",
                                `${bathroom} ${bathroomLabel}`,
                                "Page 2 - Specs",
                                fieldStyles.bathroom,
                              )
                            }
                            deleteTitle="Remove Bathrooms"
                          >
                            <div className="flex items-center gap-1">
                              <StyledInput
                                value={bathroom}
                                onChange={(e) => setBathroom(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("bathroom", s)
                                }
                                inputStyle={fieldStyles.bathroom}
                                className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0"
                              />
                              <StyledInput
                                value={bathroomLabel}
                                onChange={(e) =>
                                  setBathroomLabel(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("bathroomLabel", s)
                                }
                                inputStyle={fieldStyles.bathroomLabel}
                                className="font-bold text-[12px] text-[#226292] bg-transparent focus:outline-none border-none uppercase"
                                placeholder="BATHROOM •"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* SqFt */}
                        {!isFieldDeleted("sqft") && (
                          <DraggableBox
                            id="sqft"
                            position={fieldPositions.sqft}
                            onPositionChange={updateFieldPosition}
                            label="Square Footage"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "sqft",
                                "Square Footage",
                                `${sqft} ${sqftLabel}`,
                                "Page 2 - Specs",
                                fieldStyles.sqft,
                              )
                            }
                            deleteTitle="Remove SqFt"
                          >
                            <div className="flex items-center gap-1">
                              <StyledInput
                                value={sqft}
                                onChange={(e) => setSqft(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("sqft", s)
                                }
                                inputStyle={fieldStyles.sqft}
                                className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[60px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="000"
                              />
                              <StyledInput
                                value={sqftLabel}
                                onChange={(e) => setSqftLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("sqftLabel", s)
                                }
                                inputStyle={fieldStyles.sqftLabel}
                                className="font-bold text-[12px] text-[#226292] bg-transparent focus:outline-none border-none uppercase"
                                placeholder="SQ FT •"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Built In Year */}
                        {!isFieldDeleted("builtYear") && (
                          <DraggableBox
                            id="builtYear"
                            position={fieldPositions.builtYear}
                            onPositionChange={updateFieldPosition}
                            label="Built In Year"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "builtYear",
                                "Built In Year",
                                `${builtYearLabel} ${builtYear}`,
                                "Page 2 - Specs",
                                fieldStyles.builtYear,
                              )
                            }
                            deleteTitle="Remove Built In"
                          >
                            <div className="flex items-center gap-1">
                              <StyledInput
                                value={builtYearLabel}
                                onChange={(e) =>
                                  setBuiltYearLabel(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("builtYearLabel", s)
                                }
                                inputStyle={fieldStyles.builtYearLabel}
                                className="font-bold text-[12px] text-[#226292] bg-transparent focus:outline-none border-none uppercase"
                                placeholder="BUILT IN"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={builtYear}
                                onChange={(e) => setBuiltYear(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("builtYear", s)
                                }
                                inputStyle={fieldStyles.builtYear}
                                className="font-semibold text-[13px] bg-transparent text-left h-[30px] w-[60px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                                placeholder="0000"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

                      {/* Description Field */}
                      {!isFieldDeleted("description") && (
                        <DraggableBox
                          id="description"
                          position={fieldPositions.description}
                          onPositionChange={updateFieldPosition}
                          label="Description"
                          zoom={0.55}
                          disabled={lockedSections.specs}
                          onDelete={() =>
                            removeStandardField(
                              "description",
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
                            onChange={(e) => setDescription(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("description", s)
                            }
                            inputStyle={fieldStyles.description}
                            className="font-normal text-[14px] leading-relaxed text-[#2C2E35] bg-transparent text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] w-full"
                            placeholder="Enter property description here..."
                          />
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  {/* Bottom Photos Row: image6 + image7 */}
                  <div className="flex gap-4">
                    {/* image6 */}
                    <div
                      data-image-slot="true"
                      className="w-1/2 h-[250px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
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
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image6")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image6", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image6", fileInputRef6)
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
                            onClick={(e) => openImageSourceModal("image6", e)}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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

                    {/* image7 */}
                    <div
                      data-image-slot="true"
                      className="w-1/2 h-[250px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
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
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image7", "in")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3 h-3 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image7", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3 h-3 text-gray-700" />
                              </button>
                            </div>

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image7")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image7", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image7", fileInputRef7)
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
                            onClick={(e) => openImageSourceModal("image7", e)}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
                </div>

                {/* ── PAGE 3 (Right Side of Spread 2) ───────────────────────── */}
                <div className="w-1/2 h-full flex flex-col gap-3 relative">
                  {/* Top Right Detail Fields Section */}
                  <div
                    data-safezone-container="true"
                    className={`absolute top-0 right-0 z-20 text-right w-[400px] border-[3.5px] border-solid border-transparent rounded-lg p-0 transition-all duration-150 group/sec ${
                      lockedSections.details
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Lock Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("details");
                      }}
                      className={`absolute -top-3 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.details
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.details
                          ? "Unlock Detail Fields (enable dragging)"
                          : "Lock Detail Fields (disable dragging)"
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

                    <DetailFieldsSection
                      leftFields={leftDetailFields}
                      rightFields={rightDetailFields}
                      onLeftFieldsChange={setLeftDetailFields}
                      onRightFieldsChange={setRightDetailFields}
                      onTitleChange={updateDetailTitle}
                      onTitleStyleChange={updateDetailTitleStyle}
                      onValueChange={updateDetailValue}
                      onValueStyleChange={updateDetailStyle}
                      onRemoveField={removeDetailField}
                      fieldPositions={fieldPositions}
                      onPositionChange={updateFieldPosition}
                      zoom={0.55}
                    />
                  </div>

                  {/* image8: Top Left Photo of Page 3 */}
                  <div
                    data-image-slot="true"
                    className="w-1/2 h-[250px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
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
                            />
                          </div>

                          {/* Zoom Controls */}
                          <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                          {/* Rotate */}
                          <button
                            type="button"
                            onClick={() => handleRotate("image8")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image8", e)}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image8", fileInputRef8)
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
                          onClick={(e) => openImageSourceModal("image8", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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

                  {/* Middle Sub-Grid: image9, image10, image11, image12 */}
                  <div className="flex gap-3">
                    {/* image9 */}
                    <div
                      data-image-slot="true"
                      className="w-1/2 h-[230px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
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
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image9", "in")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3 h-3 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image9", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3 h-3 text-gray-700" />
                              </button>
                            </div>

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image9")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image9", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image9", fileInputRef9)
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
                            onClick={(e) => openImageSourceModal("image9", e)}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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

                    {/* image10 & image11 column */}
                    <div className="flex flex-col gap-3">
                      {/* image10 */}
                      <div
                        data-image-slot="true"
                        className="w-[150px] h-[110px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
                        onMouseEnter={() => setHoveredSlot("image10")}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={(e) => {
                          if (e.altKey) return;
                          e.stopPropagation();
                          setActiveSlot("image10");
                        }}
                      >
                        <BoxIndicator isVisible={isSlotActive("image10")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image10", e)}
                          onMouseUp={() => handleMouseUp("image10")}
                          onMouseLeave={() => handleMouseLeave("image10")}
                        >
                          {images.image10 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image10", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image10}
                                  scale={scale.image10}
                                  position={position.image10}
                                  rotation={rotation.image10}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image10", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-3 h-3 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image10", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image10")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image10", e)
                                }
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image10", fileInputRef10)
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
                                openImageSourceModal("image10", e)
                              }
                              className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                            >
                              Select Image
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef10}
                            onChange={(e) => handleImageChange("image10", e)}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* image11 */}
                      <div
                        data-image-slot="true"
                        className="w-[150px] h-[110px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
                        onMouseEnter={() => setHoveredSlot("image11")}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={(e) => {
                          if (e.altKey) return;
                          e.stopPropagation();
                          setActiveSlot("image11");
                        }}
                      >
                        <BoxIndicator isVisible={isSlotActive("image11")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image11", e)}
                          onMouseUp={() => handleMouseUp("image11")}
                          onMouseLeave={() => handleMouseLeave("image11")}
                        >
                          {images.image11 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image11", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image11}
                                  scale={scale.image11}
                                  position={position.image11}
                                  rotation={rotation.image11}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image11", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-3 h-3 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image11", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image11")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image11", e)
                                }
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image11", fileInputRef11)
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
                                openImageSourceModal("image11", e)
                              }
                              className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                            >
                              Select Image
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef11}
                            onChange={(e) => handleImageChange("image11", e)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* image12 */}
                    <div className="flex flex-col gap-3 justify-end">
                      <div
                        data-image-slot="true"
                        className="w-[150px] h-[110px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
                        onMouseEnter={() => setHoveredSlot("image12")}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={(e) => {
                          if (e.altKey) return;
                          e.stopPropagation();
                          setActiveSlot("image12");
                        }}
                      >
                        <BoxIndicator isVisible={isSlotActive("image12")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image12", e)}
                          onMouseUp={() => handleMouseUp("image12")}
                          onMouseLeave={() => handleMouseLeave("image12")}
                        >
                          {images.image12 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image12", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image12}
                                  scale={scale.image12}
                                  position={position.image12}
                                  rotation={rotation.image12}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image12", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-3 h-3 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image12", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image12")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image12", e)
                                }
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image12", fileInputRef12)
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
                                openImageSourceModal("image12", e)
                              }
                              className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                            >
                              Select Image
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef12}
                            onChange={(e) => handleImageChange("image12", e)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* image14: Bottom Photo */}
                  <div
                    data-image-slot="true"
                    className="h-[500px] border-2 border-[#fff] relative overflow-hidden group cursor-pointer shadow-[4px_4px_6px_rgba(0,0,0,0.85)]"
                    onMouseEnter={() => setHoveredSlot("image14")}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={(e) => {
                      if (e.altKey) return;
                      e.stopPropagation();
                      setActiveSlot("image14");
                    }}
                  >
                    <BoxIndicator isVisible={isSlotActive("image14")} />
                    <div
                      className="w-full h-full relative overflow-hidden flex items-center justify-center"
                      onMouseMove={(e) => handleMouseMove("image14", e)}
                      onMouseUp={() => handleMouseUp("image14")}
                      onMouseLeave={() => handleMouseLeave("image14")}
                    >
                      {images.image14 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image14", e)}
                          >
                            <ImageEditor
                              src={images.image14}
                              scale={scale.image14}
                              position={position.image14}
                              rotation={rotation.image14}
                            />
                          </div>

                          {/* Zoom Controls */}
                          <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image14", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image14", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          {/* Rotate */}
                          <button
                            type="button"
                            onClick={() => handleRotate("image14")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image14", e)}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image14", fileInputRef14)
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
                          onClick={(e) => openImageSourceModal("image14", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                        >
                          Select Image
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef14}
                        onChange={(e) => handleImageChange("image14", e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SafeZoneWrapper>
          </div>
        </div>
      </>
    );
  },
);

BcfpStandard3.displayName = "BcfpStandard3";

export default BcfpStandard3;
