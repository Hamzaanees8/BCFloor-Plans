import {
  House,
  Pencil,
  Trash,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock,
  Square,
  Layers,
  Sun,
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
import StyledInput, { FontFolderProvider } from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";

export interface BcfpStandard9Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard9Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

// ─── BoxIndicator ─────────────────────────────────────────────────────────────
// Renders a Canva-style 3.5px purple border indicator to show the bounds
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

// ─── DetailFieldRow ────────────────────────────────────────────────────────────
// Renders a single editable title + editable value input row for Page 3 details.
interface DetailFieldRowProps {
  field: {
    id: string;
    title: string;
    value: string;
    style?: TextStyle;
    titleStyle?: TextStyle;
  };
  onTitleChange: (title: string) => void;
  onTitleStyleChange?: (style: TextStyle) => void;
  onValueChange: (value: string) => void;
  onStyleChange: (style: TextStyle) => void;
  onRemove?: () => void;
  align?: "left" | "right";
}

const DetailFieldRow: React.FC<DetailFieldRowProps> = ({
  field,
  onTitleChange,
  onTitleStyleChange,
  onValueChange,
  onStyleChange,
  onRemove,
  align = "right",
}) => {
  const isRight = align === "right";

  return (
    <div className="relative group/row w-full flex flex-col items-end">
      <div
        className={`flex items-center gap-1 relative w-full ${isRight ? "justify-end" : "justify-start"}`}
      >
        {!isRight && onRemove && (
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={onRemove}
            className="opacity-0 group-hover/row:opacity-100 text-white/70 hover:text-red-300 p-0.5 rounded transition-opacity"
            title="Remove detail field"
          >
            <Trash className="w-3 h-3" />
          </button>
        )}
        <StyledInput
          value={field.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onChangeStyle={onTitleStyleChange}
          inputStyle={field.titleStyle}
          className={`font-bold text-white text-[12px] bg-transparent w-full focus:outline-none border-none placeholder-gray-300 uppercase whitespace-nowrap ${
            isRight ? "text-right" : "text-left"
          }`}
          placeholder="ENTER TITLE HERE"
          wrapperClassName="w-auto shrink-0"
        />
        {isRight && onRemove && (
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={onRemove}
            className="opacity-0 group-hover/row:opacity-100 text-white/70 hover:text-red-300 p-0.5 rounded transition-opacity"
            title="Remove detail field"
          >
            <Trash className="w-3 h-3" />
          </button>
        )}
      </div>
      <StyledInput
        value={field.value}
        onChange={(e) => onValueChange(e.target.value)}
        onChangeStyle={onStyleChange}
        inputStyle={field.style}
        className={`font-semibold text-white text-[9px] bg-transparent w-full focus:outline-none border-none placeholder-gray-200 placeholder:font-[500] ${
          isRight ? "text-right" : "text-left"
        }`}
        placeholder="Enter details here"
      />
    </div>
  );
};

// Default detail fields for BcfpStandard9 (Page 3 Top Right)
const DEFAULT_LEFT_DETAIL_FIELDS: DetailField[] = [
  {
    id: "byLawRestrictions",
    title: "BY-LAW RESTRICTIONS:",
    value: "Pets Allowed w/Rest., Rentals Allowed",
  },
  { id: "maintFees", title: "MAINTENANCE FEES:", value: "$000.00" },
  {
    id: "maintFeesInclude",
    title: "MAINTENANCE FEES INCLUDE:",
    value:
      "Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker",
  },
  {
    id: "featuresIncluded",
    title: "FEATURES INCLUDED:",
    value: "Clothes",
  },
];

const DEFAULT_RIGHT_DETAIL_FIELDS: DetailField[] = [
  {
    id: "siteInfluences",
    title: "SITE INFLUENCES:",
    value: "Central Location, Golf Course Nearby",
  },
  {
    id: "amenities",
    title: "AMENITIES:",
    value: "Exercise Centre, Garden, In Suite Laundry",
  },
  { id: "view", title: "VIEW:", value: "South & SW - van island" },
];

const STANDARD_FIELD_IDS = new Set([
  "addressCode",
  "roadName",
  "cityLine",
  "contactName",
  "contactBrokerage",
  "contactPhone",
  "contactEmail",
  "contactPrice",
  "mlsNumber",
  "contactDisclaimer",
  "printedByText",
  "priceAmount",
  "propertyDescription",
  "headline",
  "specBedroom",
  "specBathroom",
  "specSqft",
  "specBuiltYear",
]);

const BcfpStandard9 = forwardRef<BcfpStandard9Ref, BcfpStandard9Props>(
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

    const removeDetailField = (id: string) => {
      const leftField = leftDetailFields.find((f) => f.id === id);
      if (leftField) {
        const newDeleted: DeletedDetailFieldItem[] = [
          ...deletedDetailFields.filter((f) => f.id !== id),
          {
            ...leftField,
            column: "left",
            section: "Page 3 - Details",
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
            section: "Page 3 - Details",
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

    // Top-level DeletedFieldsPanel context registration
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

    // ── 3. Text Fields ────────────────────────────────────────────────────────
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [amount, setAmount] = useState("");
    const [mlsNumber, setMlsNumber] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [headline, setHeadline] = useState(
      "ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.",
    );

    // Editable labels
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [mlsLabel, setMlsLabel] = useState("MLS #");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM |");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM |");
    const [sqftLabel, setSqftLabel] = useState("SQ FT |");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [addressHashLabel, setAddressHashLabel] = useState("#");
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
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

    // ── 5. Styles & Positions & Locks ────────────────────────────────────────
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
      address: false,
      contact: false,
      disclaimer: false,
      specs: false,
      description: false,
      details: false,
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 6. Image States (13 Slots) ────────────────────────────────────────────
    const [images, setImages] = useState({
      image1: null as string | null,
      image2: null as string | null, // Page 4 Agent Logo
      image3: null as string | null,
      image4: null as string | null, // Page 1 Agent Logo
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

    const [imageSettings, setImageSettings] = useState<
      Record<
        keyof typeof images,
        { showBorder: boolean; boxShadow: boolean; imageShadow: boolean }
      >
    >({
      image1: { showBorder: false, boxShadow: false, imageShadow: false },
      image2: { showBorder: true, boxShadow: false, imageShadow: false },
      image3: { showBorder: false, boxShadow: false, imageShadow: false },
      image4: { showBorder: true, boxShadow: false, imageShadow: false },
      image5: { showBorder: true, boxShadow: false, imageShadow: false },
      image6: { showBorder: true, boxShadow: false, imageShadow: false },
      image7: { showBorder: true, boxShadow: false, imageShadow: false },
      image8: { showBorder: true, boxShadow: false, imageShadow: false },
      image9: { showBorder: true, boxShadow: false, imageShadow: false },
      image10: { showBorder: true, boxShadow: false, imageShadow: false },
      image11: { showBorder: true, boxShadow: false, imageShadow: false },
      image12: { showBorder: true, boxShadow: false, imageShadow: false },
      image13: { showBorder: true, boxShadow: false, imageShadow: false },
    });

    const toggleImageSetting = (
      key: keyof typeof images,
      setting: "showBorder" | "boxShadow" | "imageShadow",
    ) => {
      setImageSettings((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [setting]: !prev[key][setting],
        },
      }));
    };

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

    // File input refs for local file selection
    const fileInputRefs = {
      image1: useRef<HTMLInputElement | null>(null),
      image2: useRef<HTMLInputElement | null>(null),
      image3: useRef<HTMLInputElement | null>(null),
      image4: useRef<HTMLInputElement | null>(null),
      image5: useRef<HTMLInputElement | null>(null),
      image6: useRef<HTMLInputElement | null>(null),
      image7: useRef<HTMLInputElement | null>(null),
      image8: useRef<HTMLInputElement | null>(null),
      image9: useRef<HTMLInputElement | null>(null),
      image10: useRef<HTMLInputElement | null>(null),
      image11: useRef<HTMLInputElement | null>(null),
      image12: useRef<HTMLInputElement | null>(null),
      image13: useRef<HTMLInputElement | null>(null),
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
          if (prop.mls_number) setMlsNumber(prop.mls_number);

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
          const agentPhone =
            (agent as any)?.phone || (agent as any)?.mobile || "";
          if (agentPhone) setNumber(agentPhone);
          if (agent.company_name) setPropertyName(agent.company_name);

          // Auto-populate agent logo in image2 and image4 if available
          const agentLogo =
            (agent as any)?.company_logo_url ||
            (agent as any)?.logo_url ||
            (agent as any)?.logo ||
            null;
          if (agentLogo) {
            setImages((prev) => ({
              ...prev,
              image2: prev.image2 || agentLogo,
              image4: prev.image4 || agentLogo,
            }));
          }
        }
      }

      if (formData) {
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";
        if (formData.fullName) setFullName(s(formData.fullName));
        if (formData.email) setEmail(s(formData.email));
        if (formData.number) setNumber(s(formData.number));
        if (formData.phone) setNumber(s(formData.phone));
        if (formData.phoneLabel) setPhoneLabel(s(formData.phoneLabel));
        if (formData.emailLabel) setEmailLabel(s(formData.emailLabel));
        if (formData.mlsLabel) setMlsLabel(s(formData.mlsLabel));
        if (formData.propertyName) setPropertyName(s(formData.propertyName));
        if (formData.amount) setAmount(s(formData.amount));
        if (formData.mlsNumber) setMlsNumber(s(formData.mlsNumber));
        if (formData.bedroom) setBedroom(s(formData.bedroom));
        if (formData.bathroom) setBathroom(s(formData.bathroom));
        if (formData.sqft) setSqft(s(formData.sqft));
        if (formData.builtYear) setBuiltYear(s(formData.builtYear));
        if (formData.description) setDescription(s(formData.description));
        if (formData.addressCode) setAddressCode(s(formData.addressCode));
        if (formData.roadName) setRoadName(s(formData.roadName));
        if (formData.cityLine) setCityLine(s(formData.cityLine));
        if (formData.headline) setHeadline(s(formData.headline));

        // Restore detail fields from context
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

        // Restore deleted fields tracking
        if (formData.deletedStandardFieldIds) {
          setDeletedStandardFieldIds(formData.deletedStandardFieldIds);
        }
        if (formData.deletedDetailFields) {
          setDeletedDetailFields(formData.deletedDetailFields);
        }

        // Restore image states using standard keys
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
        if (formData.fieldStyles) {
          setFieldStyles(formData.fieldStyles as Record<string, TextStyle>);
        }
        if (formData.fieldPositions) {
          setFieldPositions(
            formData.fieldPositions as Record<string, { x: number; y: number }>,
          );
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

    // Update context when local state changes
    useEffect(() => {
      updateFormData({
        fullName,
        email,
        number,
        phone: number,
        phoneLabel,
        emailLabel,
        mlsLabel,
        propertyName,
        amount,
        mlsNumber,
        bedroom,
        bathroom,
        sqft,
        builtYear,
        description,
        addressCode,
        roadName,
        cityLine,
        headline,
        leftDetailFields,
        rightDetailFields,
        deletedStandardFieldIds,
        deletedDetailFields,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldStyles,
        fieldPositions,
      });
    }, [
      fullName,
      email,
      number,
      phoneLabel,
      emailLabel,
      mlsLabel,
      propertyName,
      amount,
      mlsNumber,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      description,
      addressCode,
      roadName,
      cityLine,
      headline,
      leftDetailFields,
      rightDetailFields,
      deletedStandardFieldIds,
      deletedDetailFields,
      images,
      scale,
      position,
      rotation,
      fieldStyles,
      fieldPositions,
      updateFormData,
    ]);

    // ── 8. Image Manipulation Handlers ────────────────────────────────────────
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

    // Tabloid Zoom Divisor (0.55) ensures 1:1 cursor-to-image movement
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

    const openImageSourceModal = (
      slot: keyof typeof images,
      e?: React.MouseEvent,
    ) => {
      if (e?.altKey) return;
      setCurrentImageSlot(slot);
      setShowGallery(true);
    };

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (!currentImageSlot) return;
      setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    // ── 9. Expose Imperative Methods via Ref ──────────────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const byLawObj = leftDetailFields.find(
          (f) => f.id === "byLawRestrictions",
        );
        const maintObj = leftDetailFields.find((f) => f.id === "maintFees");
        const maintIncObj = leftDetailFields.find(
          (f) => f.id === "maintFeesInclude",
        );
        const featObj = leftDetailFields.find(
          (f) => f.id === "featuresIncluded",
        );
        const siteObj = rightDetailFields.find(
          (f) => f.id === "siteInfluences",
        );
        const amenObj = rightDetailFields.find((f) => f.id === "amenities");
        const viewObj = rightDetailFields.find((f) => f.id === "view");

        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard9",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#2AA5B9",
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
              fontSize: fieldStyles.fullName?.fontSize || "28px",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "16px",
            },
          },
          companyName: {
            value: propertyName,
            style: {
              ...fieldStyles.propertyName,
              fontSize: fieldStyles.propertyName?.fontSize || "16px",
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
              fontSize: fieldStyles.description?.fontSize || "9px",
            },
          },

          expandedDetail1Title: byLawObj?.title || "BY-LAW RESTRICTIONS:",
          expandedDetail1Description: {
            value: byLawObj?.value || "",
            style: byLawObj?.style || ({} as TextStyle),
          },
          expandedDetail2Title: maintObj?.title || "MAINTENANCE FEES:",
          expandedDetail2Description: {
            value: maintObj?.value || "",
            style: maintObj?.style || ({} as TextStyle),
          },
          expandedDetail3Title:
            maintIncObj?.title || "MAINTENANCE FEES INCLUDE:",
          expandedDetail3Description: {
            value: maintIncObj?.value || "",
            style: maintIncObj?.style || ({} as TextStyle),
          },
          expandedDetail4Title: featObj?.title || "FEATURES INCLUDED:",
          expandedDetail4Description: {
            value: featObj?.value || "",
            style: featObj?.style || ({} as TextStyle),
          },
          keyHighlightLabel: siteObj?.title || "SITE INFLUENCES:",
          keyHighlights: siteObj?.value
            ? siteObj.value.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            amenities: {
              value: amenObj?.value || "",
              style: amenObj?.style || ({} as TextStyle),
            },
            view: {
              value: viewObj?.value || "",
              style: viewObj?.style || ({} as TextStyle),
            },
            bedroom: {
              value: bedroom,
              style: {
                ...fieldStyles.bedroom,
                fontSize: fieldStyles.bedroom?.fontSize || "13px",
              },
            },
            bathroom: {
              value: bathroom,
              style: {
                ...fieldStyles.bathroom,
                fontSize: fieldStyles.bathroom?.fontSize || "13px",
              },
            },
            sqft: {
              value: sqft,
              style: {
                ...fieldStyles.sqft,
                fontSize: fieldStyles.sqft?.fontSize || "13px",
              },
            },
            builtYear: {
              value: builtYear,
              style: {
                ...fieldStyles.builtYear,
                fontSize: fieldStyles.builtYear?.fontSize || "13px",
              },
            },
            addressCode: {
              value: addressCode,
              style: {
                ...fieldStyles.addressCode,
                fontSize: fieldStyles.addressCode?.fontSize || "28px",
              },
            },
            cityLine: {
              value: cityLine,
              style: {
                ...fieldStyles.cityLine,
                fontSize: fieldStyles.cityLine?.fontSize || "10px",
              },
            },
            mlsNumber: {
              value: mlsNumber,
              style: {
                ...fieldStyles.mlsNumber,
                fontSize: fieldStyles.mlsNumber?.fontSize || "14px",
              },
            },
            phone: {
              value: number,
              style: {
                ...fieldStyles.number,
                fontSize: fieldStyles.number?.fontSize || "10.5px",
              },
            },
            number: {
              value: number,
              style: {
                ...fieldStyles.number,
                fontSize: fieldStyles.number?.fontSize || "10.5px",
              },
            },
            phoneLabel: {
              value: phoneLabel,
              style: {
                ...fieldStyles.phoneLabel,
                fontSize: fieldStyles.phoneLabel?.fontSize || "10.5px",
              },
            },
            emailLabel: {
              value: emailLabel,
              style: {
                ...fieldStyles.emailLabel,
                fontSize: fieldStyles.emailLabel?.fontSize || "10.5px",
              },
            },
            mlsLabel: {
              value: mlsLabel,
              style: {
                ...fieldStyles.mlsLabel,
                fontSize: fieldStyles.mlsLabel?.fontSize || "10.5px",
              },
            },
            headline: {
              value: headline,
              style: {
                ...fieldStyles.headline,
                fontSize: fieldStyles.headline?.fontSize || "16px",
              },
            },
            _leftDetailFields: leftDetailFields,
            _rightDetailFields: rightDetailFields,
            fieldPositions,
            deletedStandardFieldIds,
            deletedDetailFields,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
        });
        return payload;
      },

      importFromPayload: (payload: FeatureSheetResponse) => {
        if (!payload) return;
        const state = featureSheetService.parsePayloadToState(payload);
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";

        if (state.offeredAtPrice) setAmount(s(state.offeredAtPrice));
        if (state.realtorName) setFullName(s(state.realtorName));
        if (state.emailLink) setEmail(s(state.emailLink));
        if (state.propertyNotesTitle) setRoadName(s(state.propertyNotesTitle));
        if (state.propertyNotesDescription)
          setDescription(s(state.propertyNotesDescription));

        // Restore details fields
        const rawOtherDetails = (payload.content?.otherDetails || {}) as Record<
          string,
          any
        >;

        if (
          rawOtherDetails._leftDetailFields &&
          Array.isArray(rawOtherDetails._leftDetailFields)
        ) {
          setLeftDetailFields(
            rawOtherDetails._leftDetailFields as DetailField[],
          );
        } else {
          // Fallback extraction from expandedDetail slots
          if (state.expandedDetail1Description) {
            setLeftDetailFields((prev) =>
              prev.map((f) =>
                f.id === "byLawRestrictions"
                  ? { ...f, value: s(state.expandedDetail1Description) }
                  : f,
              ),
            );
          }
          if (state.expandedDetail2Description) {
            setLeftDetailFields((prev) =>
              prev.map((f) =>
                f.id === "maintFees"
                  ? { ...f, value: s(state.expandedDetail2Description) }
                  : f,
              ),
            );
          }
          if (state.expandedDetail3Description) {
            setLeftDetailFields((prev) =>
              prev.map((f) =>
                f.id === "maintFeesInclude"
                  ? { ...f, value: s(state.expandedDetail3Description) }
                  : f,
              ),
            );
          }
          if (state.expandedDetail4Description) {
            setLeftDetailFields((prev) =>
              prev.map((f) =>
                f.id === "featuresIncluded"
                  ? { ...f, value: s(state.expandedDetail4Description) }
                  : f,
              ),
            );
          }
        }

        if (
          rawOtherDetails._rightDetailFields &&
          Array.isArray(rawOtherDetails._rightDetailFields)
        ) {
          setRightDetailFields(
            rawOtherDetails._rightDetailFields as DetailField[],
          );
        } else {
          if (state.keyHighlights) {
            const highlightsVal = Array.isArray(state.keyHighlights)
              ? state.keyHighlights.map((h) => s(h)).join("\n")
              : s(state.keyHighlights);
            setRightDetailFields((prev) =>
              prev.map((f) =>
                f.id === "siteInfluences" ? { ...f, value: highlightsVal } : f,
              ),
            );
          }
          if (state.otherDetails) {
            const od = state.otherDetails as Record<string, any>;
            if (od.amenities) {
              setRightDetailFields((prev) =>
                prev.map((f) =>
                  f.id === "amenities" ? { ...f, value: s(od.amenities) } : f,
                ),
              );
            }
            if (od.view) {
              setRightDetailFields((prev) =>
                prev.map((f) =>
                  f.id === "view" ? { ...f, value: s(od.view) } : f,
                ),
              );
            }
          }
        }

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, any>;
          if (details.bedroom) setBedroom(s(details.bedroom));
          if (details.bathroom) setBathroom(s(details.bathroom));
          if (details.sqft) setSqft(s(details.sqft));
          if (details.builtYear) setBuiltYear(s(details.builtYear));
          if (details.addressCode) setAddressCode(s(details.addressCode));
          if (details.cityLine) setCityLine(s(details.cityLine));
          if (details.mlsNumber) setMlsNumber(s(details.mlsNumber));
          if (details.phone) setNumber(s(details.phone));
          if (details.number) setNumber(s(details.number));
          if (details.phoneLabel) setPhoneLabel(s(details.phoneLabel));
          if (details.emailLabel) setEmailLabel(s(details.emailLabel));
          if (details.mlsLabel) setMlsLabel(s(details.mlsLabel));
          if (details.propertyName) setPropertyName(s(details.propertyName));
          if (details.headline) setHeadline(s(details.headline));
          if (details.fieldPositions) setFieldPositions(details.fieldPositions);
          if (details.deletedStandardFieldIds)
            setDeletedStandardFieldIds(details.deletedStandardFieldIds);
          if (details.deletedDetailFields)
            setDeletedDetailFields(details.deletedDetailFields);
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

        // Restore styles with font size normalization
        const styles: Record<string, TextStyle> = {};
        const c = payload.content;
        const st = (f: any) => (f as StyledTextField)?.style;

        if (st(c.offeredAtPrice)) {
          const s = st(c.offeredAtPrice);
          styles.amount =
            s.fontSize === "36px" ? { ...s, fontSize: "28px" } : s;
        }
        if (st(c.realtorName)) {
          const s = st(c.realtorName);
          styles.fullName =
            s.fontSize === "20px" ? { ...s, fontSize: "28px" } : s;
        }
        if (st(c.companyName)) {
          const s = st(c.companyName);
          styles.propertyName =
            s.fontSize === "20px" ? { ...s, fontSize: "16px" } : s;
        }
        if (st(c.emailLink)) {
          const s = st(c.emailLink);
          styles.email = s.fontSize === "20px" ? { ...s, fontSize: "16px" } : s;
        }
        if (st(c.propertyNotesTitle)) {
          const s = st(c.propertyNotesTitle);
          styles.roadName =
            s.fontSize === "28px" ? { ...s, fontSize: "28px" } : s;
        }
        if (st(c.propertyNotesDescription)) {
          const s = st(c.propertyNotesDescription);
          styles.description =
            s.fontSize === "14px" || s.fontSize === "10px"
              ? { ...s, fontSize: "9px" }
              : s;
        }

        const od = c.otherDetails as Record<string, any>;
        if (od) {
          if (st(od.bedroom)) styles.bedroom = st(od.bedroom);
          if (st(od.bathroom)) styles.bathroom = st(od.bathroom);
          if (st(od.sqft)) styles.sqft = st(od.sqft);
          if (st(od.builtYear)) styles.builtYear = st(od.builtYear);
          if (st(od.addressCode)) styles.addressCode = st(od.addressCode);
          if (st(od.cityLine)) styles.cityLine = st(od.cityLine);
          if (st(od.mlsNumber)) styles.mlsNumber = st(od.mlsNumber);
          if (st(od.phone)) styles.number = st(od.phone);
          if (st(od.number)) styles.number = st(od.number);
          if (st(od.phoneLabel)) styles.phoneLabel = st(od.phoneLabel);
          if (st(od.emailLabel)) styles.emailLabel = st(od.emailLabel);
          if (st(od.mlsLabel)) styles.mlsLabel = st(od.mlsLabel);
          if (st(od.headline)) styles.headline = st(od.headline);
        }

        setFieldStyles(styles);
      },
    }));

    // ── 10. Image Slot Renderer Helper ────────────────────────────────────────
    const renderImageSlot = (
      key: keyof typeof images,
      className: string,
      placeholderText: string = "Select Image",
      isLogoSlot: boolean = false,
    ) => {
      const inputRef = fileInputRefs[key];
      const settings = imageSettings[key];

      let effectiveClassName = className;
      if (!settings.showBorder) {
        effectiveClassName = effectiveClassName
          .replace(/\bborder\S*/g, "")
          .trim();
      }

      // Conditional logo styling: transparent if image loaded, white box if empty
      const logoStyles = isLogoSlot
        ? images[key]
          ? "bg-transparent shadow-none border-none"
          : "border-[2px] border-white shadow-md bg-white"
        : "";

      const containerStyle: React.CSSProperties = {
        boxShadow: settings.boxShadow
          ? "6px 6px 4px 0px rgba(0, 0, 0, 0.75)"
          : undefined,
        filter: settings.imageShadow
          ? "drop-shadow(6px 6px 4px rgba(0, 0, 0, 0.75))"
          : undefined,
      };

      return (
        <div
          id={key}
          data-image-slot="true"
          {...(isLogoSlot
            ? { "data-slot-type": "logo", "data-logo-slot": "true" }
            : {})}
          className={`relative group cursor-pointer ${effectiveClassName} ${logoStyles}`}
          style={containerStyle}
          onMouseEnter={() => setHoveredSlot(key)}
          onMouseLeave={() => setHoveredSlot(null)}
          onClick={(e) => {
            if (e.altKey) return;
            e.stopPropagation();
            setActiveSlot(key);
          }}
        >
          {/* Canva-Style Box Indicator */}
          <BoxIndicator isVisible={isSlotActive(key)} />

          {/* Top-Left Image Controls Toolbar: Border, Box Shadow, Image Shadow */}
          <div
            data-html2canvas-ignore="true"
            className="absolute top-2 left-2 z-20 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleImageSetting(key, "showBorder");
              }}
              className={`p-1.5 rounded-full shadow text-xs transition-colors ${
                settings.showBorder
                  ? "bg-[#8B3DFF] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              title={settings.showBorder ? "Hide Border" : "Show Border"}
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleImageSetting(key, "boxShadow");
              }}
              className={`p-1.5 rounded-full shadow text-xs transition-colors ${
                settings.boxShadow
                  ? "bg-[#8B3DFF] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              title={settings.boxShadow ? "Hide Box Shadow" : "Show Box Shadow"}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleImageSetting(key, "imageShadow");
              }}
              className={`p-1.5 rounded-full shadow text-xs transition-colors ${
                settings.imageShadow
                  ? "bg-[#8B3DFF] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              title={
                settings.imageShadow ? "Hide Image Shadow" : "Show Image Shadow"
              }
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* LAYER 2: Middle Mouse Event Container */}
          <div
            className="w-full h-full relative overflow-hidden flex items-center justify-center"
            onMouseMove={(e) => handleMouseMove(key, e)}
            onMouseUp={() => handleMouseUp(key)}
            onMouseLeave={() => handleMouseLeave(key)}
          >
            {images[key] ? (
              <>
                {/* LAYER 3: Inner Drag Wrapper + ImageEditor */}
                <div
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => handleMouseDown(key, e)}
                >
                  <ImageEditor
                    src={images[key]}
                    scale={scale[key]}
                    position={position[key]}
                    rotation={rotation[key]}
                    objectFit="contain"
                  />
                </div>

                {/* Zoom Controls — bottom-left, NO data-html2canvas-ignore */}
                <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                  <button
                    type="button"
                    onClick={() => handleZoom(key, "in")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(key, "out")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                {/* Rotate — Standalone Absolute Button */}
                <button
                  type="button"
                  onClick={() => handleRotate(key)}
                  className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                  title="Rotate image"
                >
                  <RotateCw className="w-4 h-4 text-gray-700" />
                </button>

                {/* Edit — Standalone Absolute Button */}
                <button
                  type="button"
                  onClick={(e) => openImageSourceModal(key, e)}
                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>

                {/* Delete — Standalone Absolute Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(key, inputRef)}
                  className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              /* Empty state placeholder — MUST have data-html2canvas-ignore="true" */
              <div
                data-html2canvas-ignore="true"
                onClick={(e) => openImageSourceModal(key, e)}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
      <FontFolderProvider value="BcfpStandard6">
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

        <div className="w-full flex flex-col items-center justify-center font-alexandria py-8 gap-0 select-none">
          {/* TOP SHEET BANNERS (PAGE 4 | PAGE 1) */}
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

          {/* ═══════════════════════════════════════════════════════════════════
              SPREAD 1: PAGE 4 | PAGE 1 (Outer Bleed Wrapper - Container 1)
             ═══════════════════════════════════════════════════════════════════ */}
          <div
            className="flex items-stretch pdf-page shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden bg-white"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            {/* CONTAINER 2: SafeZoneWrapper */}
            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              {/* CONTAINER 3: Inner Content Container with column-anchored bleed expansions */}
              <div className="w-full h-full flex items-stretch relative z-10 font-alexandria">
                {/* ─────────────────────────────────────────────────────────────
                    PAGE 4: Left Column (Expands to outer left edge of bleed)
                   ───────────────────────────────────────────────────────────── */}
                <div
                  className="flex flex-col relative shrink-0 items-center justify-between pr-[20px] pl-[40px] pt-[40px] pb-[40px]"
                  style={{
                    width: showBleed
                      ? "calc(50% + 0.375in)"
                      : "calc(50% + 0.25in)",
                    height: showBleed
                      ? "calc(100% + 0.75in)"
                      : "calc(100% + 0.5in)",
                    marginLeft: showBleed ? "-0.375in" : "-0.25in",
                    marginTop: showBleed ? "-0.375in" : "-0.25in",
                    marginBottom: showBleed ? "-0.375in" : "-0.25in",
                    background: "#2AA5B9",
                  }}
                >
                  {/* image1: Floor Plan - Maximum Height */}
                  <div className="w-full flex-1 min-h-[640px] max-h-[720px] h-[680px] relative">
                    {renderImageSlot(
                      "image1",
                      "w-full h-full shadow-[4px_4px_10px_rgba(0,0,0,0.3)] place-self-center",
                    )}
                  </div>

                  {/* image2: Agent Logo - Matched with right side (w-[200px] h-[100px]) */}
                  <div className="my-1.5 w-[200px] h-[100px] relative shrink-0">
                    {renderImageSlot(
                      "image2",
                      "w-[200px] h-[100px]",
                      "Select Logo",
                      true,
                    )}
                  </div>

                  {/* Page 4: Contact Info Section - Full Width, Minimal Gap */}
                  <div
                    data-safezone-container="true"
                    className={`flex flex-col relative z-[19] items-center text-white leading-tight px-2 w-full border-[3.5px] border-solid border-transparent rounded-lg py-1 transition-all duration-150 group/sec ${
                      lockedSections.contact
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Lock / Unlock Toggle Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("contact");
                      }}
                      className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    <div className="w-full flex flex-col items-center gap-0.5">
                      {/* Name & Brokerage Row */}
                      <div className="flex items-center justify-center gap-2 w-full">
                        {!isFieldDeleted("contactName") && (
                          <DraggableBox
                            id="contactName"
                            position={fieldPositions.contactName}
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
                            <StyledInput
                              value={fullName}
                              onChangeStyle={(style) =>
                                updateFieldStyle("fullName", style)
                              }
                              inputStyle={fieldStyles.fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="font-bold text-[15px] uppercase tracking-wide bg-transparent text-right focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
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
                              onChangeStyle={(style) =>
                                updateFieldStyle("propertyName", style)
                              }
                              inputStyle={fieldStyles.propertyName}
                              onChange={(e) => setPropertyName(e.target.value)}
                              className="font-normal text-[13px] uppercase tracking-wide bg-transparent text-left focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                              placeholder="MACDONALD REALTY"
                            />
                          </DraggableBox>
                        )}
                      </div>

                      {/* Phone & Email Row */}
                      <div className="flex items-center justify-center gap-4 w-full mt-0.5">
                        {!isFieldDeleted("contactPhone") && (
                          <DraggableBox
                            id="contactPhone"
                            position={fieldPositions.contactPhone}
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
                            <div className="flex items-center gap-1">
                              <StyledInput
                                value={phoneLabel}
                                onChange={(e) => setPhoneLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("phoneLabel", s)
                                }
                                inputStyle={fieldStyles.phoneLabel}
                                className="font-bold text-[10.5px] uppercase tracking-wider bg-transparent text-white focus:outline-none border-none whitespace-nowrap w-[48px]"
                                placeholder="PHONE:"
                              />
                              <StyledInput
                                value={number}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("number", style)
                                }
                                inputStyle={fieldStyles.number}
                                onChange={(e) => setNumber(e.target.value)}
                                className="font-medium text-[10.5px] bg-transparent text-white focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
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
                            <div className="flex items-center gap-1">
                              <StyledInput
                                value={emailLabel}
                                onChange={(e) => setEmailLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("emailLabel", s)
                                }
                                inputStyle={fieldStyles.emailLabel}
                                className="font-bold text-[10.5px] uppercase tracking-wider bg-transparent text-white focus:outline-none border-none whitespace-nowrap w-[44px]"
                                placeholder="EMAIL:"
                              />
                              <StyledInput
                                value={email}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("email", style)
                                }
                                inputStyle={fieldStyles.email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="font-medium text-[10.5px] uppercase bg-transparent text-white focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                                placeholder="FIRST@LAST.COM"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

                      {/* MLS # Row */}
                      {!isFieldDeleted("mlsNumber") && (
                        <div className="flex items-center justify-center w-full mt-0.5">
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
                                mlsNumber,
                                "Page 4 - Contact",
                                fieldStyles.mlsNumber,
                              )
                            }
                            deleteTitle="Remove MLS #"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <StyledInput
                                value={mlsLabel}
                                onChange={(e) => setMlsLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("mlsLabel", s)
                                }
                                inputStyle={fieldStyles.mlsLabel}
                                className="font-bold text-[10.5px] uppercase tracking-wider bg-transparent text-white focus:outline-none border-none whitespace-nowrap w-[44px]"
                                placeholder="MLS #"
                              />
                              <StyledInput
                                value={mlsNumber}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("mlsNumber", style)
                                }
                                inputStyle={fieldStyles.mlsNumber}
                                onChange={(e) => setMlsNumber(e.target.value)}
                                className="font-medium text-[10.5px] bg-transparent text-white focus:outline-none border-none placeholder-gray-300 whitespace-nowrap"
                                placeholder="00000"
                              />
                            </div>
                          </DraggableBox>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Page 4: Disclaimer Section - Full Width */}
                  <div
                    data-safezone-container="true"
                    className={`text-white leading-tight w-full border-[3.5px] border-solid border-transparent rounded-lg px-2 py-0.5 transition-all duration-150 group/sec relative mt-0.5 ${
                      lockedSections.disclaimer
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Lock / Unlock Toggle Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("disclaimer");
                      }}
                      className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    {!isFieldDeleted("contactDisclaimer") && (
                      <DraggableBox
                        id="contactDisclaimer"
                        containerClassName="w-full"
                        className="w-full"
                        position={fieldPositions.contactDisclaimer}
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
                        <div className="w-full text-start font-light flex items-start justify-between gap-2">
                          <p className="text-[8px] text-white leading-[1.2] font-light select-none m-0 flex-1">
                            {disclaimerText}
                          </p>
                          <span className="flex items-center shrink-0 gap-1 mt-0.5">
                            <House className="w-3.5 h-3.5 text-white" />
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 8 8"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1.07208 6.90507H1.20908C1.29908 6.90507 1.36508 6.90507 1.41708 6.95207C1.46108 6.99307 1.48508 7.04807 1.48508 7.11207C1.48508 7.22007 1.40508 7.30107 1.28408 7.30107H1.19308L1.47508 7.75507H1.58608L1.35708 7.38907C1.48808 7.37607 1.58608 7.25507 1.58608 7.11207C1.58608 7.01407 1.53908 6.91807 1.46108 6.86707C1.39608 6.81707 1.32508 6.81007 1.23408 6.81007H0.981079V7.75507H1.07208V6.90507Z"
                                fill="white"
                              />
                              <path
                                d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z"
                                fill="white"
                              />
                              <path
                                d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z"
                                fill="white"
                              />
                              <path
                                d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z"
                                fill="white"
                              />
                              <path
                                d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z"
                                fill="white"
                              />
                              <path
                                d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z"
                                fill="white"
                              />
                              <path
                                d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z"
                                fill="white"
                              />
                              <path
                                d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z"
                                fill="white"
                              />
                              <path
                                d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9616 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z"
                                fill="white"
                              />
                            </svg>
                          </span>
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("printedByText") && (
                      <DraggableBox
                        id="printedByText"
                        containerClassName="w-full"
                        className="w-full"
                        position={fieldPositions.printedByText}
                        onPositionChange={updateFieldPosition}
                        label="Printed By"
                        zoom={0.55}
                        disabled={lockedSections.disclaimer}
                        onDelete={() =>
                          removeStandardField(
                            "printedByText",
                            "Printed By",
                            printedByText,
                            "Page 4 - Disclaimer",
                            fieldStyles.printedByText,
                          )
                        }
                        deleteTitle="Remove Printed By"
                      >
                        <p className="text-left font-semibold text-[9px] mt-0.5 text-white whitespace-nowrap tracking-wide select-none m-0">
                          {printedByText}
                        </p>
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    PAGE 1: Right Column (Expands to outer right edge of bleed)
                   ───────────────────────────────────────────────────────────── */}
                <div
                  className="bg-gray-200 flex flex-col relative shrink-0 overflow-hidden group items-center justify-center"
                  style={{
                    width: showBleed
                      ? "calc(50% + 0.375in)"
                      : "calc(50% + 0.25in)",
                    height: showBleed
                      ? "calc(100% + 0.75in)"
                      : "calc(100% + 0.5in)",
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                    marginTop: showBleed ? "-0.375in" : "-0.25in",
                    marginBottom: showBleed ? "-0.375in" : "-0.25in",
                  }}
                >
                  {/* Top Wave SVG */}
                  <svg
                    width="100%"
                    height="418"
                    viewBox="0 0 632 418"
                    fill="none"
                    preserveAspectRatio="none"
                    className="absolute top-0 right-0 left-0 w-full z-[1] pointer-events-none"
                  >
                    <path
                      d="M0.692032 115.581L631.688 101L630.405 418C630.405 418 587.402 78.0195 0.688049 173.546L0.692032 115.581Z"
                      fill="#FFFFFF"
                      fillOpacity="0.5"
                    />
                    <mask
                      id="mask0_72_1672"
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
                    <g mask="url(#mask0_72_1672)">
                      <rect
                        x="0"
                        y="0"
                        width="632"
                        height="418"
                        fill="url(#paint0_linear_72_1672)"
                      />
                    </g>
                    <defs>
                      <linearGradient
                        id="paint0_linear_72_1672"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                        gradientUnits="objectBoundingBox"
                      >
                        <stop stopColor="#2AA5B9" />
                        <stop offset="0.391667" stopColor="#2AA5B9" />
                        <stop offset="0.515476" stopColor="#2AA5B9" />
                        <stop offset="0.892857" stopColor="#2AA5B9" />
                        <stop offset="1" stopColor="#2AA5B9" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Page 1: Address & Price Overlay Section */}
                  <div
                    data-safezone-container="true"
                    className={`flex justify-center content-center absolute top-8 left-0 right-0 px-12 z-20 border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec ${
                      lockedSections.address
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Lock / Unlock Toggle Button */}
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

                    <div className="w-full">
                      {/* Address Code & Road Name Row */}
                      {(!isFieldDeleted("addressCode") ||
                        !isFieldDeleted("roadName")) && (
                        <div className="text-[28px] font-light leading-none mt-0 text-white flex justify-center items-center gap-1 flex-wrap">
                          {!isFieldDeleted("addressCode") && (
                            <DraggableBox
                              id="addressCode"
                              position={fieldPositions.addressCode}
                              onPositionChange={updateFieldPosition}
                              label="Suite / MLS #"
                              zoom={0.55}
                              disabled={lockedSections.address}
                              onDelete={() =>
                                removeStandardField(
                                  "addressCode",
                                  "Suite / MLS #",
                                  addressCode,
                                  "Page 1 - Address",
                                  fieldStyles.addressCode,
                                )
                              }
                              deleteTitle="Remove Suite / MLS #"
                              className="inline-flex items-center"
                            >
                              <div className="flex items-center">
                                <StyledInput
                                  value={addressHashLabel}
                                  onChange={(e) =>
                                    setAddressHashLabel(e.target.value)
                                  }
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("addressHashLabel", s)
                                  }
                                  inputStyle={fieldStyles.addressHashLabel}
                                  className="text-[16px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                                  placeholder="#"
                                  wrapperClassName="w-auto shrink-0"
                                />
                                <StyledInput
                                  value={addressCode}
                                  onChangeStyle={(style) =>
                                    updateFieldStyle("addressCode", style)
                                  }
                                  inputStyle={fieldStyles.addressCode}
                                  onChange={(e) =>
                                    setAddressCode(e.target.value)
                                  }
                                  className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
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
                              label="Road Name"
                              zoom={0.55}
                              disabled={lockedSections.address}
                              onDelete={() =>
                                removeStandardField(
                                  "roadName",
                                  "Road Name",
                                  roadName,
                                  "Page 1 - Address",
                                  fieldStyles.roadName,
                                )
                              }
                              deleteTitle="Remove Road Name"
                              className="inline-flex items-center"
                            >
                              <span className="text-white flex items-center uppercase whitespace-nowrap">
                                <StyledInput
                                  value={roadLabelBefore}
                                  onChange={(e) =>
                                    setRoadLabelBefore(e.target.value)
                                  }
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("roadLabelBefore", s)
                                  }
                                  inputStyle={fieldStyles.roadLabelBefore}
                                  className="text-[28px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap font-light"
                                  placeholder="Number"
                                  wrapperClassName="w-auto shrink-0"
                                />
                                <StyledInput
                                  value={roadName}
                                  onChangeStyle={(style) =>
                                    updateFieldStyle("roadName", style)
                                  }
                                  inputStyle={fieldStyles.roadName}
                                  onChange={(e) => setRoadName(e.target.value)}
                                  className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-white text-center w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
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
                                  className="text-[28px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap font-light"
                                  placeholder="Road"
                                  wrapperClassName="w-auto shrink-0"
                                />
                              </span>
                            </DraggableBox>
                          )}
                        </div>
                      )}

                      {/* City Line */}
                      {!isFieldDeleted("cityLine") && (
                        <div className="text-white text-[10px] justify-self-center text-center mt-1">
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
                            <StyledInput
                              value={cityLine}
                              onChangeStyle={(style) =>
                                updateFieldStyle("cityLine", style)
                              }
                              inputStyle={fieldStyles.cityLine}
                              onChange={(e) => setCityLine(e.target.value)}
                              className="text-white text-[10px] h-[20px] bg-transparent text-center w-[250px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
                              placeholder="BRIGHOUSE SOUTH, RICHMOND"
                            />
                          </DraggableBox>
                        </div>
                      )}

                      {/* Price Amount */}
                      {!isFieldDeleted("priceAmount") && (
                        <div className="text-center justify-self-center mt-1">
                          <DraggableBox
                            id="priceAmount"
                            position={fieldPositions.priceAmount}
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
                            <StyledInput
                              value={amount}
                              onChangeStyle={(style) =>
                                updateFieldStyle("amount", style)
                              }
                              inputStyle={fieldStyles.amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-center focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap"
                              placeholder="$000,000"
                            />
                          </DraggableBox>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* image3: Main Cover Image */}
                  <div className="w-full h-full justify-center content-center relative">
                    {renderImageSlot(
                      "image3",
                      "w-full h-full shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                      "Select Cover Image",
                    )}
                  </div>

                  {/* Bottom Wave SVG */}
                  <svg
                    width="100%"
                    height="319"
                    viewBox="0 0 634 319"
                    fill="none"
                    preserveAspectRatio="none"
                    className="absolute bottom-0 -right-1 left-0 w-full pointer-events-none z-[1]"
                  >
                    <path
                      d="M633.05 280.308L4.3773 293L0.0778809 -2.80029e-06C0.0778809 -2.80029e-06 43.2047 299.058 633.078 215.36L633.05 280.308Z"
                      fill="#FFFFFF"
                      fillOpacity="0.5"
                    />
                    <mask
                      id="mask0_73_1690"
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
                    <g mask="url(#mask0_73_1690)">
                      <path
                        d="M633.441 -509.198H-630.832V318.802H633.441V-509.198Z"
                        fill="url(#paint0_linear_73_1690)"
                      />
                    </g>
                    <defs>
                      <linearGradient
                        id="paint0_linear_73_1690"
                        x1="633.441"
                        y1="308.014"
                        x2="0.837279"
                        y2="308.014"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#2AA5B9" />
                        <stop offset="0.391667" stopColor="#2AA5B9" />
                        <stop offset="0.515476" stopColor="#2AA5B9" />
                        <stop offset="0.892857" stopColor="#2AA5B9" />
                        <stop offset="1" stopColor="#2AA5B9" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* image4: Page 1 Bottom Agent Logo */}
                  <div className="absolute bottom-2 right-0 left-3 z-20">
                    <div className="my-3 w-[200px] h-[100px] relative">
                      {renderImageSlot(
                        "image4",
                        "w-[200px] h-[100px]",
                        "Select Logo",
                        true,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SafeZoneWrapper>
          </div>

          {/* BOTTOM SHEET BANNERS (PAGE 2 | PAGE 3) */}
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

          {/* ═══════════════════════════════════════════════════════════════════
              SPREAD 2: PAGE 2 | PAGE 3 (Outer Bleed Wrapper - Container 1)
             ═══════════════════════════════════════════════════════════════════ */}
          <div
            className="flex items-stretch pdf-page bg-[#B3B394] shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            {/* Background SVG - Left Wave (Page 2) */}
            <div className="w-1/2 h-full absolute top-0 bottom-0 left-0 pointer-events-none z-0">
              <svg
                width="400px"
                height="100%"
                viewBox="0 0 569 828"
                fill="none"
                preserveAspectRatio="none"
                className="absolute -top-[1px] -right-[1px] -bottom-[1px] -left-[1px] w-[calc(100%+2px)] h-[calc(100%+2px)]"
              >
                <path
                  d="M64.9235 -3.07471L42.1565 822.334L568.239 827.848C568.239 827.848 31.2785 771.359 181.536 -3.13971L64.9235 -3.07471Z"
                  fill="#FFFFFF"
                  fillOpacity="0.5"
                />
                <mask
                  id="mask0_77_1804"
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
                <g mask="url(#mask0_77_1804)">
                  <path
                    d="M1260.33 0V828H0.333249V0H1260.33Z"
                    fill="url(#paint0_linear_77_1804)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_77_1804"
                    x1="22.4077"
                    y1="-0.318146"
                    x2="22.4077"
                    y2="826.954"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#2AA5B9" />
                    <stop offset="0.391667" stopColor="#2AA5B9" />
                    <stop offset="0.515476" stopColor="#2AA5B9" />
                    <stop offset="0.892857" stopColor="#2AA5B9" />
                    <stop offset="1" stopColor="#2AA5B9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Background SVG - Right Wave (Page 3) */}
            <div className="w-1/2 h-full absolute top-0 bottom-0 right-0 pointer-events-none z-0">
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
                  fill="#FFFFFF"
                  fillOpacity="0.5"
                />
                <mask
                  id="mask0_77_1803"
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
                <g mask="url(#mask0_77_1803)">
                  <path
                    d="M-568.667 828V4.1431e-05H691.333V828H-568.667Z"
                    fill="url(#paint0_linear_77_1803)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_77_1803"
                    x1="661.929"
                    y1="826.95"
                    x2="661.929"
                    y2="-3.59994"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#2AA5B9" />
                    <stop offset="0.391667" stopColor="#2AA5B9" />
                    <stop offset="0.515476" stopColor="#2AA5B9" />
                    <stop offset="0.892857" stopColor="#2AA5B9" />
                    <stop offset="1" stopColor="#2AA5B9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* CONTAINER 2: SafeZoneWrapper */}
            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              {/* CONTAINER 3: Inner Content Container */}
              <div className="relative w-full h-full z-10 flex gap-4 p-4 font-alexandria">
                {/* ─────────────────────────────────────────────────────────────
                    PAGE 2: Left Column
                   ───────────────────────────────────────────────────────────── */}
                <div className="w-1/2 h-full flex flex-col gap-4">
                  {/* image5 with Overlaid Headline & Specs */}
                  <div className="w-full h-[416px] relative">
                    {renderImageSlot(
                      "image5",
                      "w-full h-full border-[2px] border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] place-self-center",
                    )}

                    {/* Overlaid Headline & Specs Section Container */}
                    <div
                      data-safezone-container="true"
                      className={`absolute top-4 place-items-center w-[85%] left-1/2 -translate-x-1/2 z-10 border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec ${
                        lockedSections.specs
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                    >
                      {/* Lock / Unlock Toggle Button */}
                      <button
                        type="button"
                        data-html2canvas-ignore="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionLock("specs");
                        }}
                        className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                      {/* Headline */}
                      {!isFieldDeleted("headline") && (
                        <div className="w-full flex justify-center">
                          <DraggableBox
                            id="headline"
                            position={fieldPositions.headline}
                            onPositionChange={updateFieldPosition}
                            label="Headline"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "headline",
                                "Headline",
                                headline,
                                "Page 2 - Headline",
                                fieldStyles.headline,
                              )
                            }
                            deleteTitle="Remove Headline"
                            className="w-full"
                          >
                            <StyledInput
                              value={headline}
                              rows={2}
                              onChangeStyle={(style) =>
                                updateFieldStyle("headline", style)
                              }
                              inputStyle={fieldStyles.headline}
                              onChange={(e) => setHeadline(e.target.value)}
                              className="text-[#2C2E35] font-bold text-[16px] text-center w-full bg-transparent focus:outline-none border-none leading-snug"
                              placeholder="ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING."
                            />
                          </DraggableBox>
                        </div>
                      )}

                      {/* Property Specs Row */}
                      <div className="font-bold text-[14px] text-[#2C2E35] flex flex-wrap gap-2 justify-center items-center mt-1">
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
                                "Page 2 - Specs",
                                fieldStyles.bedroom,
                              )
                            }
                            deleteTitle="Remove Bedrooms"
                            className="inline-flex items-center gap-1"
                          >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <StyledInput
                                value={bedroom}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("bedroom", style)
                                }
                                inputStyle={fieldStyles.bedroom}
                                onChange={(e) => setBedroom(e.target.value)}
                                className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
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
                                className="font-bold text-[14px] text-[#2C2E35] bg-transparent focus:outline-none border-none whitespace-nowrap"
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
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specBathroom",
                                "Bathrooms",
                                bathroom,
                                "Page 2 - Specs",
                                fieldStyles.bathroom,
                              )
                            }
                            deleteTitle="Remove Bathrooms"
                            className="inline-flex items-center gap-1"
                          >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <StyledInput
                                value={bathroom}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("bathroom", style)
                                }
                                inputStyle={fieldStyles.bathroom}
                                onChange={(e) => setBathroom(e.target.value)}
                                className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
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
                                className="font-bold text-[14px] text-[#2C2E35] bg-transparent focus:outline-none border-none whitespace-nowrap"
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
                            label="Square Footage"
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specSqft",
                                "Square Footage",
                                sqft,
                                "Page 2 - Specs",
                                fieldStyles.sqft,
                              )
                            }
                            deleteTitle="Remove Square Footage"
                            className="inline-flex items-center gap-1"
                          >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <StyledInput
                                value={sqft}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("sqft", style)
                                }
                                inputStyle={fieldStyles.sqft}
                                onChange={(e) => setSqft(e.target.value)}
                                className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
                                placeholder="000"
                              />
                              <StyledInput
                                value={sqftLabel}
                                onChange={(e) => setSqftLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("sqftLabel", s)
                                }
                                inputStyle={fieldStyles.sqftLabel}
                                className="font-bold text-[14px] text-[#2C2E35] bg-transparent focus:outline-none border-none whitespace-nowrap"
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
                            zoom={0.55}
                            disabled={lockedSections.specs}
                            onDelete={() =>
                              removeStandardField(
                                "specBuiltYear",
                                "Year Built",
                                builtYear,
                                "Page 2 - Specs",
                                fieldStyles.builtYear,
                              )
                            }
                            deleteTitle="Remove Year Built"
                            className="inline-flex items-center gap-1"
                          >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <StyledInput
                                value={builtYear}
                                onChangeStyle={(style) =>
                                  updateFieldStyle("builtYear", style)
                                }
                                inputStyle={fieldStyles.builtYear}
                                onChange={(e) => setBuiltYear(e.target.value)}
                                className="font-semibold text-[13px] bg-transparent text-left h-[30px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500] whitespace-nowrap"
                                placeholder="0000"
                              />
                              <StyledInput
                                value={builtYearLabel}
                                onChange={(e) =>
                                  setBuiltYearLabel(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("builtYearLabel", s)
                                }
                                inputStyle={fieldStyles.builtYearLabel}
                                className="font-bold text-[14px] text-[#2C2E35] bg-transparent focus:outline-none border-none whitespace-nowrap"
                                placeholder="BUILT IN"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: image6 & image7 */}
                  <div className="flex gap-4">
                    <div className="w-1/2 h-[235px] relative">
                      {renderImageSlot(
                        "image6",
                        "w-full h-full border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                      )}
                    </div>
                    <div className="w-1/2 h-[235px] relative">
                      {renderImageSlot(
                        "image7",
                        "w-full h-full border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: image8 & Property Description */}
                  <div className="flex gap-4">
                    <div className="w-1/2 h-[235px] relative">
                      {renderImageSlot(
                        "image8",
                        "w-full h-full border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                      )}
                    </div>

                    <div
                      data-safezone-container="true"
                      className={`w-1/2 h-[235px] flex flex-col relative z-[19] border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec ${
                        lockedSections.description
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                    >
                      {/* Lock / Unlock Toggle Button */}
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

                      {!isFieldDeleted("propertyDescription") && (
                        <DraggableBox
                          id="propertyDescription"
                          position={fieldPositions.propertyDescription}
                          onPositionChange={updateFieldPosition}
                          label="Description"
                          zoom={0.55}
                          disabled={lockedSections.description}
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
                          className="w-full h-full"
                        >
                          <StyledInput
                            value={description}
                            rows={10}
                            onChangeStyle={(style) =>
                              updateFieldStyle("description", style)
                            }
                            inputStyle={fieldStyles.description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="font-normal w-full text-[9px] text-[#2C2E35] h-full bg-transparent text-left focus:outline-none border-none placeholder-gray-600 placeholder:font-[500] leading-relaxed"
                            placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS..."
                          />
                        </DraggableBox>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    PAGE 3: Right Column
                   ───────────────────────────────────────────────────────────── */}
                <div className="w-1/2 h-full flex flex-col relative">
                  {/* Top-Right Detail Fields Section Overlay */}
                  <div
                    data-safezone-container="true"
                    className={`absolute top-[20px] right-[20px] z-20 text-right w-[320px] min-h-[320px] border-[3.5px] border-solid border-transparent rounded-lg p-2.5 transition-all duration-150 group/sec ${
                      lockedSections.details
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Lock / Unlock Toggle Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("details");
                      }}
                      className={`absolute -top-1 -left-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    <div className="flex flex-col gap-2.5 w-full items-end">
                      {/* Left Detail Fields */}
                      {leftDetailFields.map((field) => (
                        <DraggableBox
                          key={field.id}
                          id={field.id}
                          position={fieldPositions[field.id]}
                          onPositionChange={updateFieldPosition}
                          label={field.title}
                          zoom={0.55}
                          disabled={lockedSections.details}
                          onDelete={() => removeDetailField(field.id)}
                          deleteTitle={`Remove ${field.title}`}
                          className="w-full"
                        >
                          <DetailFieldRow
                            field={field}
                            onTitleChange={(title) =>
                              updateDetailTitle(field.id, title)
                            }
                            onTitleStyleChange={(style) =>
                              updateDetailTitleStyle(field.id, style)
                            }
                            onValueChange={(val) =>
                              updateDetailValue(field.id, val)
                            }
                            onStyleChange={(style) =>
                              updateDetailStyle(field.id, style)
                            }
                            onRemove={
                              lockedSections.details
                                ? undefined
                                : () => removeDetailField(field.id)
                            }
                            align="right"
                          />
                        </DraggableBox>
                      ))}

                      {/* Right Detail Fields */}
                      {rightDetailFields.map((field) => (
                        <DraggableBox
                          key={field.id}
                          id={field.id}
                          position={fieldPositions[field.id]}
                          onPositionChange={updateFieldPosition}
                          label={field.title}
                          zoom={0.55}
                          disabled={lockedSections.details}
                          onDelete={() => removeDetailField(field.id)}
                          deleteTitle={`Remove ${field.title}`}
                          className="w-full"
                        >
                          <DetailFieldRow
                            field={field}
                            onTitleChange={(title) =>
                              updateDetailTitle(field.id, title)
                            }
                            onTitleStyleChange={(style) =>
                              updateDetailTitleStyle(field.id, style)
                            }
                            onValueChange={(val) =>
                              updateDetailValue(field.id, val)
                            }
                            onStyleChange={(style) =>
                              updateDetailStyle(field.id, style)
                            }
                            onRemove={
                              lockedSections.details
                                ? undefined
                                : () => removeDetailField(field.id)
                            }
                            align="right"
                          />
                        </DraggableBox>
                      ))}
                    </div>
                  </div>

                  {/* Page 3 Image Layout */}
                  <div className="flex gap-4 w-full h-full">
                    {/* Left Subcolumn: image9, image10, image11, image12 */}
                    <div className="w-1/2 flex flex-col gap-4">
                      <div className="w-full h-[210px] relative">
                        {renderImageSlot(
                          "image9",
                          "w-full h-full border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                        )}
                      </div>
                      <div className="w-full h-[210px] relative">
                        {renderImageSlot(
                          "image10",
                          "w-full h-full border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                        )}
                      </div>
                      <div className="w-full h-[210px] relative">
                        {renderImageSlot(
                          "image11",
                          "w-full h-full border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                        )}
                      </div>
                      <div className="w-full h-[210px] relative">
                        {renderImageSlot(
                          "image12",
                          "w-full h-full border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                        )}
                      </div>
                    </div>

                    {/* Right Subcolumn: image13 aligned to bottom */}
                    <div className="w-1/2 flex flex-col justify-end">
                      <div className="w-full h-[500px] relative">
                        {renderImageSlot(
                          "image13",
                          "w-full h-full border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)]",
                        )}
                      </div>
                    </div>
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

BcfpStandard9.displayName = "BcfpStandard9";

export default BcfpStandard9;
