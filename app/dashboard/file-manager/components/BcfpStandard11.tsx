import {
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
  DetailField,
} from "../types/featureSheetTypes";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";

export interface BcfpStandard11Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard11Props {
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
}

const DetailFieldRow: React.FC<DetailFieldRowProps> = ({
  field,
  onTitleChange,
  onTitleStyleChange,
  onValueChange,
  onStyleChange,
  onRemove,
}) => {
  return (
    <div className="relative group/row w-full flex flex-col items-start">
      <div className="flex items-center gap-1 relative w-full justify-start">
        <StyledInput
          value={field.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onChangeStyle={onTitleStyleChange}
          inputStyle={
            field.titleStyle?.fontSize
              ? field.titleStyle
              : { ...field.titleStyle, fontSize: "8px" }
          }
          className="font-bold text-[#595B61] text-[8px] leading-tight bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-400 uppercase tracking-wide whitespace-nowrap"
          placeholder="ENTER TITLE HERE"
          wrapperClassName="w-auto shrink-0"
        />
        {onRemove && (
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={onRemove}
            className="opacity-0 group-hover/row:opacity-100 text-gray-500 hover:text-red-500 p-0.5 rounded transition-opacity"
            title="Remove detail field"
          >
            <Trash className="w-3 h-3" />
          </button>
        )}
      </div>
      <StyledInput
        value={field.value}
        rows={field.value.length > 50 ? 3 : field.value.length > 25 ? 2 : 1}
        onChange={(e) => onValueChange(e.target.value)}
        onChangeStyle={onStyleChange}
        inputStyle={
          field.style?.fontSize
            ? field.style
            : { ...field.style, fontSize: "8px" }
        }
        className="font-semibold text-[#595B61] text-[8px] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500] resize-none"
        placeholder="Enter details here"
      />
    </div>
  );
};

// Default detail fields for BcfpStandard11 (Page 3, 2-column details)
const DEFAULT_LEFT_DETAIL_FIELDS: DetailField[] = [
  {
    id: "byLawRestrictions",
    title: "BY-LAW RESTRICTIONS:",
    value: "Pets Allowed w/Rest., Rentals Allowed",
    style: { fontSize: "8px" },
    titleStyle: { fontSize: "8px" },
  },
  {
    id: "maintFees",
    title: "MAINT. FEES:",
    value: "$000.00",
    style: { fontSize: "8px" },
    titleStyle: { fontSize: "8px" },
  },
  {
    id: "maintFeesInclude",
    title: "MAINT. FEES INCLUDE:",
    value:
      "Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker",
    style: { fontSize: "8px" },
    titleStyle: { fontSize: "8px" },
  },
  {
    id: "featuresIncluded",
    title: "FEATURES INCLUDED:",
    value: "Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings",
    style: { fontSize: "8px" },
    titleStyle: { fontSize: "8px" },
  },
];

const DEFAULT_RIGHT_DETAIL_FIELDS: DetailField[] = [
  {
    id: "siteInfluences",
    title: "SITE INFLUENCES:",
    value:
      "Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby",
    style: { fontSize: "8px" },
    titleStyle: { fontSize: "8px" },
  },
  {
    id: "amenities",
    title: "AMENITIES:",
    value: "Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room",
    style: { fontSize: "8px" },
    titleStyle: { fontSize: "8px" },
  },
  {
    id: "view",
    title: "VIEW:",
    value: "South & SW - Van Isl.",
    style: { fontSize: "8px" },
    titleStyle: { fontSize: "8px" },
  },
  {
    id: "mlsNumber",
    title: "MLS #:",
    value: "Enter MLS here",
    style: { fontSize: "8px" },
    titleStyle: { fontSize: "8px" },
  },
];

const STANDARD_FIELD_IDS = new Set([
  "addressCode",
  "roadName",
  "cityLine",
  "contactName",
  "contactBrokerage",
  "contactPhone",
  "contactEmail",
  "contactDisclaimer",
  "printedByText",
  "priceAmount",
  "specPrice",
  "headline",
  "propertyDescription",
  "specBedroom",
  "specBathroom",
  "specSqft",
  "specBuiltYear",
]);

const BcfpStandard11 = forwardRef<BcfpStandard11Ref, BcfpStandard11Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── 1. Detail Fields (2 Columns) ─────────────────────────────────────────
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
            section: "Page 3 - Left Details",
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
            section: "Page 3 - Right Details",
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
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");
    const [headline, setHeadline] = useState(
      "ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.",
    );

    // Editable labels
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [addressHashLabel, setAddressHashLabel] = useState("#");
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM •");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM •");
    const [sqftLabel, setSqftLabel] = useState("SQ FT •");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [priceDotLabel, setPriceDotLabel] = useState("•");
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
      contact: false,
      address: false,
      specs: false,
      description: false,
      details: false,
      disclaimer: false,
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 6. Image States (18 Slots) ────────────────────────────────────────────
    const [images, setImages] = useState({
      image1: null as string | null, // Page 4 Agent Logo
      image2: null as string | null, // Page 4 Main Photo
      image3: null as string | null, // Page 1 Agent Logo
      image4: null as string | null, // Page 1 Strip 1
      image5: null as string | null, // Page 1 Strip 2
      image6: null as string | null, // Page 1 Strip 3
      image7: null as string | null, // Page 1 Strip 4
      image8: null as string | null, // Page 1 Hero Photo
      image9: null as string | null, // Page 2 Photo 1
      image10: null as string | null, // Page 2 Photo 2
      image11: null as string | null, // Page 2 Bottom Photo
      image12: null as string | null, // Page 3 Stack 1
      image13: null as string | null, // Page 3 Stack 2
      image14: null as string | null, // Page 3 Stack 3
      image15: null as string | null, // Page 3 Stack 4
      image16: null as string | null, // Page 3 Spare slot
      image17: null as string | null, // Page 3 Right Top Photo
      image18: null as string | null, // Page 3 Right Bottom Photo
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
      image17: 1,
      image18: 1,
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
      image17: { x: 0, y: 0 },
      image18: { x: 0, y: 0 },
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
      image17: 0,
      image18: 0,
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
      image17: false,
      image18: false,
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
      image17: { x: 0, y: 0 },
      image18: { x: 0, y: 0 },
    });

    // ── Image Settings (Border, Shadow, WhiteBg toggles) ──────────────────────
    interface ImageSettingOptions {
      showBorder: boolean;
      showWhiteBg: boolean;
      showShadow: boolean;
    }

    const [imageSettings, setImageSettings] = useState<
      Record<string, ImageSettingOptions>
    >(() => ({
      image1: { showBorder: true, showWhiteBg: true, showShadow: true },
      image3: { showBorder: true, showWhiteBg: true, showShadow: true },
      ...(formData.imageSettings || {}),
    }));

    const toggleImageSetting = (
      key: keyof typeof images,
      setting: "showBorder" | "showWhiteBg" | "showShadow",
    ) => {
      setImageSettings((prev) => {
        const current = prev[key] || {
          showBorder: true,
          showWhiteBg: true,
          showShadow: true,
        };
        return {
          ...prev,
          [key]: {
            ...current,
            [setting]: !current[setting],
          },
        };
      });
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

    const openImageSourceModal = (
      slot: string | null,
      e?: React.MouseEvent,
    ) => {
      if (e?.altKey) return;
      setCurrentImageSlot(slot);
      setShowGallery(true);
    };

    // File input refs
    const fileInputRefs: Record<
      keyof typeof images,
      React.RefObject<HTMLInputElement | null>
    > = {
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
      image14: useRef<HTMLInputElement | null>(null),
      image15: useRef<HTMLInputElement | null>(null),
      image16: useRef<HTMLInputElement | null>(null),
      image17: useRef<HTMLInputElement | null>(null),
      image18: useRef<HTMLInputElement | null>(null),
    };

    // ── Auto-population from orderData and context formData ───────────────────
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
              image1: prev.image1 || agentLogo,
              image3: prev.image3 || agentLogo,
            }));
          }
        }
      }

      if (formData) {
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";

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
        if (formData.headline) setHeadline(s(formData.headline));

        if (formData.contactLabel) setContactLabel(s(formData.contactLabel));
        if (formData.phoneLabel) setPhoneLabel(s(formData.phoneLabel));
        if (formData.emailLabel) setEmailLabel(s(formData.emailLabel));
        if ((formData as any).addressHashLabel)
          setAddressHashLabel(s((formData as any).addressHashLabel));
        if (formData.roadLabelBefore)
          setRoadLabelBefore(s(formData.roadLabelBefore));
        if (formData.roadLabelAfter)
          setRoadLabelAfter(s(formData.roadLabelAfter));
        if (formData.bedroomLabel) setBedroomLabel(s(formData.bedroomLabel));
        if (formData.bathroomLabel) setBathroomLabel(s(formData.bathroomLabel));
        if (formData.sqftLabel) setSqftLabel(s(formData.sqftLabel));
        if (formData.builtYearLabel)
          setBuiltYearLabel(s(formData.builtYearLabel));
        if ((formData as any).priceDotLabel)
          setPriceDotLabel(s((formData as any).priceDotLabel));
        if (formData.disclaimerText)
          setDisclaimerText(s(formData.disclaimerText));
        if (formData.printedByText) setPrintedByText(s(formData.printedByText));

        if ((formData as any).leftDetailFields) {
          setLeftDetailFields(
            (formData as any).leftDetailFields as DetailField[],
          );
        }
        if ((formData as any).rightDetailFields) {
          setRightDetailFields(
            (formData as any).rightDetailFields as DetailField[],
          );
        }

        if (formData.deletedStandardFieldIds) {
          setDeletedStandardFieldIds(formData.deletedStandardFieldIds);
        }
        if (formData.deletedDetailFields) {
          setDeletedDetailFields(formData.deletedDetailFields);
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
        if (formData.fieldStyles) {
          setFieldStyles(formData.fieldStyles as Record<string, TextStyle>);
        }
        if (formData.fieldPositions) {
          setFieldPositions(
            formData.fieldPositions as Record<string, { x: number; y: number }>,
          );
        }
        if ((formData as any).lockedSections) {
          setLockedSections(
            (formData as any).lockedSections as Record<string, boolean>,
          );
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

    // ── Update context when local state changes ──────────────────────────────
    useEffect(() => {
      updateFormData({
        detailFields: [...leftDetailFields, ...rightDetailFields],
        leftDetailFields,
        rightDetailFields,
        deletedStandardFieldIds,
        deletedDetailFields,
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
        contactLabel,
        phoneLabel,
        emailLabel,
        addressHashLabel,
        roadLabelBefore,
        roadLabelAfter,
        bedroomLabel,
        bathroomLabel,
        sqftLabel,
        builtYearLabel,
        priceDotLabel,
        disclaimerText,
        printedByText,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldStyles,
        fieldPositions,
        lockedSections,
      } as any);
    }, [
      leftDetailFields,
      rightDetailFields,
      deletedStandardFieldIds,
      deletedDetailFields,
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
      contactLabel,
      phoneLabel,
      emailLabel,
      addressHashLabel,
      roadLabelBefore,
      roadLabelAfter,
      bedroomLabel,
      bathroomLabel,
      sqftLabel,
      builtYearLabel,
      priceDotLabel,
      disclaimerText,
      printedByText,
      images,
      scale,
      position,
      rotation,
      fieldStyles,
      fieldPositions,
      lockedSections,
      updateFormData,
    ]);

    // ── Expose methods via ref ────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard11",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#43454B",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "30px",
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
              fontSize: fieldStyles.roadName?.fontSize || "30px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "10px",
            },
          },
          expandedDetail1Title:
            leftDetailFields[0]?.title || "By-law Restrictions",
          expandedDetail1Description: {
            value: leftDetailFields[0]?.value || "",
            style: {
              ...leftDetailFields[0]?.style,
              fontSize: leftDetailFields[0]?.style?.fontSize || "8px",
            },
          },
          expandedDetail2Title: leftDetailFields[1]?.title || "Maint. Fees",
          expandedDetail2Description: {
            value: leftDetailFields[1]?.value || "",
            style: {
              ...leftDetailFields[1]?.style,
              fontSize: leftDetailFields[1]?.style?.fontSize || "8px",
            },
          },
          expandedDetail3Title:
            leftDetailFields[2]?.title || "Maint. Fees Include",
          expandedDetail3Description: {
            value: leftDetailFields[2]?.value || "",
            style: {
              ...leftDetailFields[2]?.style,
              fontSize: leftDetailFields[2]?.style?.fontSize || "8px",
            },
          },
          expandedDetail4Title:
            leftDetailFields[3]?.title || "Features Included",
          expandedDetail4Description: {
            value: leftDetailFields[3]?.value || "",
            style: {
              ...leftDetailFields[3]?.style,
              fontSize: leftDetailFields[3]?.style?.fontSize || "8px",
            },
          },
          keyHighlightLabel: "Site Influences",
          keyHighlights: rightDetailFields[0]?.value
            ? rightDetailFields[0].value.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            amenities: {
              value: rightDetailFields[1]?.value || "",
              style: {
                ...rightDetailFields[1]?.style,
                fontSize: rightDetailFields[1]?.style?.fontSize || "8px",
              },
            },
            view: {
              value: rightDetailFields[2]?.value || "",
              style: {
                ...rightDetailFields[2]?.style,
                fontSize: rightDetailFields[2]?.style?.fontSize || "8px",
              },
            },
            mlsNumber: {
              value: rightDetailFields[3]?.value || "",
              style: {
                ...rightDetailFields[3]?.style,
                fontSize: rightDetailFields[3]?.style?.fontSize || "8px",
              },
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
            number: {
              value: number,
              style: {
                ...fieldStyles.number,
                fontSize: fieldStyles.number?.fontSize || "11px",
              },
            },
            addressCode: {
              value: addressCode,
              style: {
                ...fieldStyles.addressCode,
                fontSize: fieldStyles.addressCode?.fontSize || "30px",
              },
            },
            cityLine: {
              value: cityLine,
              style: {
                ...fieldStyles.cityLine,
                fontSize: fieldStyles.cityLine?.fontSize || "13px",
              },
            },
            propertyName: {
              value: propertyName,
              style: {
                ...fieldStyles.propertyName,
                fontSize: fieldStyles.propertyName?.fontSize || "11px",
              },
            },
            headline: {
              value: headline,
              style: {
                ...fieldStyles.headline,
                fontSize: fieldStyles.headline?.fontSize || "22px",
              },
            },
            disclaimerText: {
              value: disclaimerText,
              style: {
                ...fieldStyles.disclaimerText,
                fontSize: fieldStyles.disclaimerText?.fontSize || "6px",
              },
            },
            printedByText: {
              value: printedByText,
              style: {
                ...fieldStyles.printedByText,
                fontSize: fieldStyles.printedByText?.fontSize || "10px",
              },
            },
            contactLabel: {
              value: contactLabel,
              style: {
                ...fieldStyles.contactLabel,
                fontSize: fieldStyles.contactLabel?.fontSize || "11px",
              },
            },
            phoneLabel: {
              value: phoneLabel,
              style: {
                ...fieldStyles.phoneLabel,
                fontSize: fieldStyles.phoneLabel?.fontSize || "11px",
              },
            },
            emailLabel: {
              value: emailLabel,
              style: {
                ...fieldStyles.emailLabel,
                fontSize: fieldStyles.emailLabel?.fontSize || "11px",
              },
            },
            addressHashLabel: {
              value: addressHashLabel,
              style: {
                ...fieldStyles.addressHashLabel,
                fontSize: fieldStyles.addressHashLabel?.fontSize || "30px",
              },
            },
            roadLabelBefore: {
              value: roadLabelBefore,
              style: {
                ...fieldStyles.roadLabelBefore,
                fontSize: fieldStyles.roadLabelBefore?.fontSize || "60px",
              },
            },
            roadLabelAfter: {
              value: roadLabelAfter,
              style: {
                ...fieldStyles.roadLabelAfter,
                fontSize: fieldStyles.roadLabelAfter?.fontSize || "60px",
              },
            },
            bedroomLabel: {
              value: bedroomLabel,
              style: {
                ...fieldStyles.bedroomLabel,
                fontSize: fieldStyles.bedroomLabel?.fontSize || "14px",
              },
            },
            bathroomLabel: {
              value: bathroomLabel,
              style: {
                ...fieldStyles.bathroomLabel,
                fontSize: fieldStyles.bathroomLabel?.fontSize || "14px",
              },
            },
            sqftLabel: {
              value: sqftLabel,
              style: {
                ...fieldStyles.sqftLabel,
                fontSize: fieldStyles.sqftLabel?.fontSize || "14px",
              },
            },
            builtYearLabel: {
              value: builtYearLabel,
              style: {
                ...fieldStyles.builtYearLabel,
                fontSize: fieldStyles.builtYearLabel?.fontSize || "14px",
              },
            },
            priceDotLabel: {
              value: priceDotLabel,
              style: {
                ...fieldStyles.priceDotLabel,
                fontSize: fieldStyles.priceDotLabel?.fontSize || "14px",
              },
            },
            leftDetailFields,
            rightDetailFields,
            deletedStandardFieldIds,
            deletedDetailFields,
            fieldPositions,
            imageSettings,
          } as any,
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
        const c =
          payload.content || (payload as any)?.data?.content || ({} as any);
        const od = ((c as any).otherDetails || {}) as Record<string, any>;
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";
        const st = (val: any) =>
          typeof val === "object" && val?.style ? val.style : null;

        if (state.offeredAtPrice) setAmount(s(state.offeredAtPrice));
        if (state.realtorName) setFullName(s(state.realtorName));
        if (state.emailLink) setEmail(s(state.emailLink));
        if (state.propertyNotesTitle) setRoadName(s(state.propertyNotesTitle));
        if (state.propertyNotesDescription)
          setDescription(s(state.propertyNotesDescription));

        if (od.headline) setHeadline(s(od.headline));
        if (od.number) setNumber(s(od.number));
        if (od.addressCode) setAddressCode(s(od.addressCode));
        if (od.cityLine) setCityLine(s(od.cityLine));
        if (od.bedroom) setBedroom(s(od.bedroom));
        if (od.bathroom) setBathroom(s(od.bathroom));
        if (od.sqft) setSqft(s(od.sqft));
        if (od.builtYear) setBuiltYear(s(od.builtYear));
        if (od.propertyName) setPropertyName(s(od.propertyName));
        if (od.disclaimerText) setDisclaimerText(s(od.disclaimerText));
        if (od.printedByText) setPrintedByText(s(od.printedByText));

        if (od.contactLabel) setContactLabel(s(od.contactLabel));
        if (od.phoneLabel) setPhoneLabel(s(od.phoneLabel));
        if (od.emailLabel) setEmailLabel(s(od.emailLabel));
        if (od.addressHashLabel) setAddressHashLabel(s(od.addressHashLabel));
        if (od.roadLabelBefore) setRoadLabelBefore(s(od.roadLabelBefore));
        if (od.roadLabelAfter) setRoadLabelAfter(s(od.roadLabelAfter));
        if (od.bedroomLabel) setBedroomLabel(s(od.bedroomLabel));
        if (od.bathroomLabel) setBathroomLabel(s(od.bathroomLabel));
        if (od.sqftLabel) setSqftLabel(s(od.sqftLabel));
        if (od.builtYearLabel) setBuiltYearLabel(s(od.builtYearLabel));
        if (od.priceDotLabel) setPriceDotLabel(s(od.priceDotLabel));

        // Restore styles with backend default normalizations
        const styles: Record<string, TextStyle> = {};
        if (st(c.offeredAtPrice)) {
          const style = st(c.offeredAtPrice);
          styles.amount =
            style.fontSize === "36px" ? { ...style, fontSize: "30px" } : style;
        }
        if (st(c.realtorName)) {
          const style = st(c.realtorName);
          styles.fullName =
            style.fontSize === "20px" ? { ...style, fontSize: "11px" } : style;
        }
        if (st(c.emailLink)) {
          const style = st(c.emailLink);
          styles.email =
            style.fontSize === "20px" ? { ...style, fontSize: "11px" } : style;
        }
        if (st(c.companyName)) {
          const style = st(c.companyName);
          styles.propertyName =
            style.fontSize === "20px" ? { ...style, fontSize: "11px" } : style;
        }
        if (st(c.propertyNotesTitle)) {
          const style = st(c.propertyNotesTitle);
          styles.roadName =
            style.fontSize === "28px" ? { ...style, fontSize: "30px" } : style;
        }
        if (st(c.propertyNotesDescription)) {
          styles.description = st(c.propertyNotesDescription);
        }

        Object.keys(od).forEach((k) => {
          if (st(od[k])) {
            styles[k] = st(od[k]);
          }
        });

        if (Object.keys(styles).length > 0) {
          setFieldStyles((prev) => ({ ...prev, ...styles }));
        }

        // Restore detail fields
        if (od.leftDetailFields && Array.isArray(od.leftDetailFields)) {
          setLeftDetailFields(od.leftDetailFields);
        } else {
          const left: DetailField[] = [...DEFAULT_LEFT_DETAIL_FIELDS];
          if (c.expandedDetail1Description)
            left[0].value = s(c.expandedDetail1Description);
          if (c.expandedDetail2Description)
            left[1].value = s(c.expandedDetail2Description);
          if (c.expandedDetail3Description)
            left[2].value = s(c.expandedDetail3Description);
          if (c.expandedDetail4Description)
            left[3].value = s(c.expandedDetail4Description);
          setLeftDetailFields(left);
        }

        if (od.rightDetailFields && Array.isArray(od.rightDetailFields)) {
          setRightDetailFields(od.rightDetailFields);
        } else {
          const right: DetailField[] = [...DEFAULT_RIGHT_DETAIL_FIELDS];
          if (c.keyHighlights) {
            right[0].value = Array.isArray(c.keyHighlights)
              ? c.keyHighlights.map((h: any) => s(h)).join("\n")
              : s(c.keyHighlights);
          }
          if (od.amenities) right[1].value = s(od.amenities);
          if (od.view) right[2].value = s(od.view);
          if (od.mlsNumber) right[3].value = s(od.mlsNumber);
          setRightDetailFields(right);
        }

        if (od.deletedStandardFieldIds) {
          setDeletedStandardFieldIds(od.deletedStandardFieldIds);
        }
        if (od.deletedDetailFields) {
          setDeletedDetailFields(od.deletedDetailFields);
        }
        if (od.fieldPositions) {
          setFieldPositions(od.fieldPositions);
        }
        if (od.imageSettings) {
          setImageSettings(od.imageSettings);
        }

        if (state.images) {
          setImages((prev) => ({
            ...prev,
            ...(state.images as unknown as typeof images),
          }));
        }
        if (state.imageScales) {
          setScale((prev) => ({
            ...prev,
            ...(state.imageScales as unknown as typeof scale),
          }));
        }
        if (state.imagePositions) {
          setPosition((prev) => ({
            ...prev,
            ...(state.imagePositions as unknown as typeof position),
          }));
        }
        if (state.imageRotations) {
          setRotation((prev) => ({
            ...prev,
            ...(state.imageRotations as unknown as typeof rotation),
          }));
        }
      },
    }));

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

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      // Tabloid 17x11 preview zoom divisor: 0.55
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

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SPREAD 1: PAGE 4 (Left) | PAGE 1 (Right)                             */}
        {/* ═════════════════════════════════════════════════════════════════════ */}

        {/* Top Sheet Banners (PAGE 4 | PAGE 1) */}
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

        {/* SPREAD 1 Outer Page / Bleed Wrapper */}
        <div
          className="flex items-stretch pdf-page bg-[#43454B] shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
          style={{
            width: showBleed ? "17.25in" : "17in",
            height: showBleed ? "11.25in" : "11in",
            zoom: 0.55,
            margin: "0 auto",
            marginBottom: "40px",
          }}
        >
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div className="relative w-full h-full z-10 flex font-alexandria">
              {/* ───────────────────────────────────────────────────────────── */}
              {/* PAGE 4 (Left Half)                                            */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="w-1/2 flex flex-col justify-between relative pr-2">
                {/* Top Curve SVG & Contact Header */}
                <div
                  className="relative z-10"
                  style={{
                    marginTop: showBleed ? "-0.375in" : "-0.25in",
                    marginLeft: showBleed ? "-0.375in" : "-0.25in",
                  }}
                >
                  <svg
                    viewBox="163 83 631 114"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto pointer-events-none"
                  >
                    <g opacity={0.350006} filter="url(#filter0_d_p4_11)">
                      <path
                        d="M794 141C794 141 678.203 92.031 463 154C223 244 164.5 149 164.5 149V83H794V144.5"
                        fill="black"
                      />
                    </g>
                    <path
                      d="M793.592 137.865C793.592 137.865 655.583 84.5849 440.821 159.465C226.06 234.345 163 147.945 163 147.945V83H477.5H794L793.592 136.425"
                      fill="white"
                    />
                    <path
                      opacity={0.350006}
                      d="M794 160.5C794 160.5 656.323 102.81 441.12 171.096C225.916 239.382 166 151.064 166 151.064L167.5 83.5H794V158.5"
                      fill="white"
                    />
                    <defs>
                      <filter
                        id="filter0_d_p4_11"
                        x={0.5}
                        y={0}
                        width={953.5}
                        height={433.744}
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                      >
                        <feFlood floodOpacity={0} result="BackgroundImageFix" />
                        <feColorMatrix
                          in="SourceAlpha"
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                          result="hardAlpha"
                        />
                        <feOffset dx={-2} dy={79} />
                        <feGaussianBlur stdDeviation={81} />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                        />
                        <feBlend
                          mode="normal"
                          in2="BackgroundImageFix"
                          result="effect1_dropShadow_p4_11"
                        />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="effect1_dropShadow_p4_11"
                          result="shape"
                        />
                      </filter>
                    </defs>
                  </svg>

                  {/* Logo: image1 (Agent Logo on Top-Right of Page 4 Header inside Safe Zone) */}
                  <div
                    id="agentLogo1"
                    data-image-slot="true"
                    data-slot-type="logo"
                    data-logo-slot="true"
                    className={`absolute top-[32px] right-[40px] z-20 group cursor-pointer w-[210px] h-[100px] overflow-hidden rounded-sm flex items-center justify-center p-1.5 transition-all ${
                      (imageSettings.image1?.showWhiteBg ?? true)
                        ? "bg-white"
                        : "bg-transparent"
                    } ${
                      (imageSettings.image1?.showBorder ?? true)
                        ? "border border-gray-100"
                        : "border-0"
                    } ${
                      (imageSettings.image1?.showShadow ?? true)
                        ? "shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                        : ""
                    }`}
                    onMouseEnter={() => setHoveredSlot("image1")}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={(e) => {
                      if (e.altKey) return;
                      e.stopPropagation();
                      setActiveSlot("image1");
                    }}
                  >
                    <BoxIndicator isVisible={isSlotActive("image1")} />

                    {/* Top-Left Border, Shadow, Bg Toggles */}
                    <div
                      data-html2canvas-ignore="true"
                      className="absolute top-1 left-1 z-30 flex gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSetting("image1", "showBorder");
                        }}
                        className={`p-1 rounded-full shadow text-xs transition-colors ${
                          (imageSettings.image1?.showBorder ?? true)
                            ? "bg-[#8B3DFF] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        title={
                          (imageSettings.image1?.showBorder ?? true)
                            ? "Hide Border"
                            : "Show Border"
                        }
                      >
                        <Square className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSetting("image1", "showShadow");
                        }}
                        className={`p-1 rounded-full shadow text-xs transition-colors ${
                          (imageSettings.image1?.showShadow ?? true)
                            ? "bg-[#8B3DFF] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        title={
                          (imageSettings.image1?.showShadow ?? true)
                            ? "Hide Shadow"
                            : "Show Shadow"
                        }
                      >
                        <Layers className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSetting("image1", "showWhiteBg");
                        }}
                        className={`p-1 rounded-full shadow text-xs transition-colors ${
                          (imageSettings.image1?.showWhiteBg ?? true)
                            ? "bg-[#8B3DFF] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        title={
                          (imageSettings.image1?.showWhiteBg ?? true)
                            ? "Hide White Background (Make Transparent)"
                            : "Show White Background"
                        }
                      >
                        <Sun className="w-3 h-3" />
                      </button>
                    </div>

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

                          <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image1", "in")}
                              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image1", "out")}
                              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-3.5 h-3.5 text-gray-700" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRotate("image1")}
                            className="absolute top-1 right-[56px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image1", e)}
                            className="absolute top-1 right-7 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-3.5 h-3.5 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image1", fileInputRefs.image1)
                            }
                            className="absolute top-1 right-1 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image1", e)}
                          className="w-full h-full bg-gray-100 text-gray-500 flex items-center justify-center cursor-pointer border border-dashed border-gray-300 text-[11px] font-medium"
                        >
                          Select Logo
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRefs.image1}
                        onChange={(e) => handleImageChange("image1", e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Contact Info Header Section (Positioned inside Safe Zone) */}
                  <div
                    data-safezone-container="true"
                    className={`absolute top-[38px] left-[36px] z-20 text-black border-[3.5px] border-solid border-transparent rounded-lg p-1.5 transition-all duration-150 group/sec ${
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
                      className={`absolute -top-1 -right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    {/* Agent Name */}
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
                        <div className="font-bold text-[11px] flex gap-1.5 items-center whitespace-nowrap">
                          <StyledInput
                            value={contactLabel}
                            onChange={(e) => setContactLabel(e.target.value)}
                            onChangeStyle={(style) =>
                              updateFieldStyle("contactLabel", style)
                            }
                            inputStyle={fieldStyles.contactLabel}
                            className="font-bold text-black text-[11px] bg-transparent text-left focus:outline-none border-none placeholder-gray-400 whitespace-nowrap"
                            placeholder="CONTACT:"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            inputStyle={
                              fieldStyles.fullName?.fontSize
                                ? fieldStyles.fullName
                                : { ...fieldStyles.fullName, fontSize: "11px" }
                            }
                            onChangeStyle={(style) =>
                              updateFieldStyle("fullName", style)
                            }
                            rows={1}
                            className="text-[11px] text-black font-bold h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-black placeholder:font-[700] whitespace-nowrap uppercase"
                            placeholder="DANE KINGSBURY"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {/* Brokerage */}
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
                          rows={1}
                          onChange={(e) => setPropertyName(e.target.value)}
                          inputStyle={
                            fieldStyles.propertyName?.fontSize
                              ? fieldStyles.propertyName
                              : {
                                  ...fieldStyles.propertyName,
                                  fontSize: "11px",
                                }
                          }
                          onChangeStyle={(style) =>
                            updateFieldStyle("propertyName", style)
                          }
                          className="text-[11px] font-normal h-[18px] bg-transparent text-left text-black w-full focus:outline-none border-none placeholder-black uppercase whitespace-nowrap"
                          placeholder="MACDONALD REALTY"
                        />
                      </DraggableBox>
                    )}

                    {/* Phone & Email Row */}
                    <div className="flex gap-4 items-center mt-0.5">
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
                          <div className="flex gap-1 items-center text-black text-[11px] whitespace-nowrap">
                            <StyledInput
                              value={phoneLabel}
                              onChange={(e) => setPhoneLabel(e.target.value)}
                              onChangeStyle={(style) =>
                                updateFieldStyle("phoneLabel", style)
                              }
                              inputStyle={fieldStyles.phoneLabel}
                              className="text-[11px] font-bold text-black bg-transparent text-left focus:outline-none border-none placeholder-gray-400 whitespace-nowrap"
                              placeholder="PHONE:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              inputStyle={
                                fieldStyles.number?.fontSize
                                  ? fieldStyles.number
                                  : { ...fieldStyles.number, fontSize: "11px" }
                              }
                              onChangeStyle={(style) =>
                                updateFieldStyle("number", style)
                              }
                              rows={1}
                              className="font-normal inline text-[11px] h-[20px] bg-transparent text-left w-[95px] focus:outline-none border-none placeholder-black whitespace-nowrap"
                              placeholder="604.721.0484"
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
                          <div className="flex gap-1 items-center text-black text-[11px] whitespace-nowrap">
                            <StyledInput
                              value={emailLabel}
                              onChange={(e) => setEmailLabel(e.target.value)}
                              onChangeStyle={(style) =>
                                updateFieldStyle("emailLabel", style)
                              }
                              inputStyle={fieldStyles.emailLabel}
                              className="text-[11px] font-bold text-black bg-transparent text-left focus:outline-none border-none placeholder-gray-400 whitespace-nowrap"
                              placeholder="EMAIL:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              inputStyle={
                                fieldStyles.email?.fontSize
                                  ? fieldStyles.email
                                  : { ...fieldStyles.email, fontSize: "11px" }
                              }
                              onChangeStyle={(style) =>
                                updateFieldStyle("email", style)
                              }
                              rows={1}
                              className="font-normal inline text-[11px] h-[20px] bg-transparent text-left w-[150px] focus:outline-none border-none placeholder-black whitespace-nowrap"
                              placeholder="EMAIL@DOMAIN.COM"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Feature Image / Floor Plan: image2 (Maximized to take full height and width) */}
                <div className="flex-1 w-full flex items-center justify-center px-6 py-2 my-auto">
                  <div
                    data-image-slot="true"
                    className="w-full h-[840px] max-w-[800px] border-2 border-white shadow-[3px_3px_6px_rgba(0,0,0,0.85)] relative overflow-hidden group cursor-pointer bg-transparent"
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
                      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-transparent"
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
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image2", fileInputRefs.image2)
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
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-sm"
                        >
                          Select Floor Plan / Main Image
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRefs.image2}
                        onChange={(e) => handleImageChange("image2", e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Disclaimer (Inside Safe Zone) */}
                <div
                  data-safezone-container="true"
                  className={`relative px-[36px] pb-[16px] text-white border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
                    lockedSections.disclaimer
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("disclaimer");
                    }}
                    className={`absolute top-0 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.disclaimer
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                    title={
                      lockedSections.disclaimer
                        ? "Unlock Disclaimer Section (enable dragging)"
                        : "Lock Disclaimer Section (disable dragging)"
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
                          "Page 4 - Footer",
                          fieldStyles.disclaimerText,
                        )
                      }
                      deleteTitle="Remove Disclaimer"
                    >
                      <StyledInput
                        value={disclaimerText}
                        rows={2}
                        onChange={(e) => setDisclaimerText(e.target.value)}
                        inputStyle={
                          fieldStyles.disclaimerText?.fontSize
                            ? fieldStyles.disclaimerText
                            : {
                                ...fieldStyles.disclaimerText,
                                fontSize: "6.5px",
                              }
                        }
                        onChangeStyle={(style) =>
                          updateFieldStyle("disclaimerText", style)
                        }
                        className="text-[6.5px] w-[95%] leading-tight text-white/80 bg-transparent text-left focus:outline-none border-none placeholder-white/50"
                        placeholder="All information deemed reliable but not guaranteed..."
                      />
                    </DraggableBox>
                  )}
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* PAGE 1 (Right Half - Cover)                                   */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="w-1/2 flex flex-col justify-between relative pl-2">
                {/* Combined Top 4 Strip Images + Overlapping Agent Logo + Main Hero Photo + Specs Bar */}
                <div className="relative w-full mt-10">
                  {/* Top 4 Images Grid - 2-3px white border each */}
                  <div className="grid grid-cols-4 w-full">
                    {[
                      { key: "image4" as const, ref: fileInputRefs.image4 },
                      { key: "image5" as const, ref: fileInputRefs.image5 },
                      { key: "image6" as const, ref: fileInputRefs.image6 },
                      { key: "image7" as const, ref: fileInputRefs.image7 },
                    ].map(({ key, ref: fRef }) => (
                      <div
                        key={key}
                        data-image-slot="true"
                        className="h-[130px] relative group border-[3px] border-white overflow-hidden cursor-pointer bg-transparent"
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
                          className="w-full h-full relative overflow-hidden flex items-center justify-center bg-transparent"
                          onMouseMove={(e) => handleMouseMove(key, e)}
                          onMouseUp={() => handleMouseUp(key)}
                          onMouseLeave={() => handleMouseLeave(key)}
                        >
                          {images[key] ? (
                            <>
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

                              <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                <button
                                  type="button"
                                  onClick={() => handleZoom(key, "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-3 h-3 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom(key, "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRotate(key)}
                                className="absolute top-1.5 right-[52px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-3 h-3 text-gray-700" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => openImageSourceModal(key, e)}
                                className="absolute top-1.5 right-6 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-3 h-3 text-gray-700" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(key, fRef)}
                                className="absolute top-1.5 right-1 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Delete image"
                              >
                                <Trash className="w-3 h-3 text-red-500" />
                              </button>
                            </>
                          ) : (
                            <div
                              data-html2canvas-ignore="true"
                              onClick={(e) => openImageSourceModal(key, e)}
                              className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 text-[10px] font-medium"
                            >
                              Select Image
                            </div>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            ref={fRef}
                            onChange={(e) => handleImageChange(key, e)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main Hero Photo (image8) - Combined directly under top 4 strip, NO border (except main image) */}
                  <div
                    data-image-slot="true"
                    className="w-full h-[500px] border-0 relative overflow-hidden group cursor-pointer bg-transparent"
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
                      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-transparent"
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

                          <div className="absolute bottom-4 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                            className="absolute top-3 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image8", e)}
                            className="absolute top-3 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image8", fileInputRefs.image8)
                            }
                            className="absolute top-3 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image8", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-base"
                        >
                          Select Hero Image
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRefs.image8}
                        onChange={(e) => handleImageChange("image8", e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Overlapping Agent Logo Box (Centered over boundary between 4-strip and hero image) */}
                  <div
                    id="agentLogo3"
                    data-image-slot="true"
                    data-slot-type="logo"
                    data-logo-slot="true"
                    className={`absolute top-[130px] -translate-y-1/2 left-1/2 -translate-x-1/2 z-30 group cursor-pointer w-[190px] h-[90px] rounded-sm flex items-center justify-center p-1.5 overflow-hidden transition-all ${
                      (imageSettings.image3?.showWhiteBg ?? true)
                        ? "bg-white"
                        : "bg-transparent"
                    } ${
                      (imageSettings.image3?.showBorder ?? true)
                        ? "border-2 border-white"
                        : "border-0"
                    } ${
                      (imageSettings.image3?.showShadow ?? true)
                        ? "shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
                        : ""
                    }`}
                    onMouseEnter={() => setHoveredSlot("image3")}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={(e) => {
                      if (e.altKey) return;
                      e.stopPropagation();
                      setActiveSlot("image3");
                    }}
                  >
                    <BoxIndicator isVisible={isSlotActive("image3")} />

                    {/* Top-Left Border, Shadow, Bg Toggles */}
                    <div
                      data-html2canvas-ignore="true"
                      className="absolute top-1 left-1 z-30 flex gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSetting("image3", "showBorder");
                        }}
                        className={`p-1 rounded-full shadow text-xs transition-colors ${
                          (imageSettings.image3?.showBorder ?? true)
                            ? "bg-[#8B3DFF] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        title={
                          (imageSettings.image3?.showBorder ?? true)
                            ? "Hide Border"
                            : "Show Border"
                        }
                      >
                        <Square className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSetting("image3", "showShadow");
                        }}
                        className={`p-1 rounded-full shadow text-xs transition-colors ${
                          (imageSettings.image3?.showShadow ?? true)
                            ? "bg-[#8B3DFF] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        title={
                          (imageSettings.image3?.showShadow ?? true)
                            ? "Hide Shadow"
                            : "Show Shadow"
                        }
                      >
                        <Layers className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSetting("image3", "showWhiteBg");
                        }}
                        className={`p-1 rounded-full shadow text-xs transition-colors ${
                          (imageSettings.image3?.showWhiteBg ?? true)
                            ? "bg-[#8B3DFF] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        title={
                          (imageSettings.image3?.showWhiteBg ?? true)
                            ? "Hide White Background (Make Transparent)"
                            : "Show White Background"
                        }
                      >
                        <Sun className="w-3 h-3" />
                      </button>
                    </div>

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
                              objectFit="contain"
                            />
                          </div>

                          <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                          <button
                            type="button"
                            onClick={() => handleRotate("image3")}
                            className="absolute top-1 right-[50px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-3 h-3 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image3", e)}
                            className="absolute top-1 right-6 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-3 h-3 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image3", fileInputRefs.image3)
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
                          onClick={(e) => openImageSourceModal("image3", e)}
                          className="w-full h-full bg-gray-100 text-gray-500 flex items-center justify-center cursor-pointer border border-dashed border-gray-300 font-medium text-[10px]"
                        >
                          Select Logo
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRefs.image3}
                        onChange={(e) => handleImageChange("image3", e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Specs Bar Overlay directly OVER bottom of Hero Image */}
                  <div
                    data-safezone-container="true"
                    className="absolute bottom-0 left-0 right-0 w-full py-2 px-3 bg-white/75  z-20 transition-all duration-150 group/sec"
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("specs");
                      }}
                      className={`absolute top-1 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    <div className="font-semibold text-[12px] text-[#2C2E35] flex flex-wrap items-center gap-2 justify-center tracking-wide">
                      {!isFieldDeleted("specBedroom") && (
                        <DraggableBox
                          id="specBedroom"
                          position={fieldPositions.specBedroom}
                          onPositionChange={updateFieldPosition}
                          label="Bedroom"
                          zoom={0.55}
                          disabled={lockedSections.specs}
                          onDelete={() =>
                            removeStandardField(
                              "specBedroom",
                              "Bedroom",
                              bedroom,
                              "Page 1 - Specs",
                              fieldStyles.bedroom,
                            )
                          }
                          deleteTitle="Remove Bedroom"
                        >
                          <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                            <StyledInput
                              value={bedroom}
                              onChange={(e) => setBedroom(e.target.value)}
                              inputStyle={
                                fieldStyles.bedroom?.fontSize
                                  ? fieldStyles.bedroom
                                  : {
                                      ...fieldStyles.bedroom,
                                      fontSize: "12px",
                                    }
                              }
                              onChangeStyle={(style) =>
                                updateFieldStyle("bedroom", style)
                              }
                              className="font-semibold text-[12px] bg-transparent text-left w-[16px] h-[18px] focus:outline-none border-none placeholder-black whitespace-nowrap"
                              placeholder="0"
                            />
                            <StyledInput
                              value={bedroomLabel}
                              onChange={(e) => setBedroomLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bedroomLabel", s)
                              }
                              inputStyle={fieldStyles.bedroomLabel}
                              className="font-semibold text-[12px] text-[#2C2E35] bg-transparent text-left focus:outline-none border-none placeholder-gray-600 uppercase whitespace-nowrap"
                              placeholder="BEDROOMS •"
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
                          label="Bathroom"
                          zoom={0.55}
                          disabled={lockedSections.specs}
                          onDelete={() =>
                            removeStandardField(
                              "specBathroom",
                              "Bathroom",
                              bathroom,
                              "Page 1 - Specs",
                              fieldStyles.bathroom,
                            )
                          }
                          deleteTitle="Remove Bathroom"
                        >
                          <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                            <StyledInput
                              value={bathroom}
                              onChange={(e) => setBathroom(e.target.value)}
                              inputStyle={
                                fieldStyles.bathroom?.fontSize
                                  ? fieldStyles.bathroom
                                  : {
                                      ...fieldStyles.bathroom,
                                      fontSize: "12px",
                                    }
                              }
                              onChangeStyle={(style) =>
                                updateFieldStyle("bathroom", style)
                              }
                              className="font-semibold text-[12px] bg-transparent text-left w-[16px] h-[18px] focus:outline-none border-none placeholder-black whitespace-nowrap"
                              placeholder="0"
                            />
                            <StyledInput
                              value={bathroomLabel}
                              onChange={(e) => setBathroomLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bathroomLabel", s)
                              }
                              inputStyle={fieldStyles.bathroomLabel}
                              className="font-semibold text-[12px] text-[#2C2E35] bg-transparent text-left focus:outline-none border-none placeholder-gray-600 uppercase whitespace-nowrap"
                              placeholder="BATHROOMS •"
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
                              "Page 1 - Specs",
                              fieldStyles.sqft,
                            )
                          }
                          deleteTitle="Remove Square Footage"
                        >
                          <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                            <StyledInput
                              value={sqft}
                              onChange={(e) => setSqft(e.target.value)}
                              inputStyle={
                                fieldStyles.sqft?.fontSize
                                  ? fieldStyles.sqft
                                  : { ...fieldStyles.sqft, fontSize: "12px" }
                              }
                              onChangeStyle={(style) =>
                                updateFieldStyle("sqft", style)
                              }
                              className="font-semibold text-[12px] bg-transparent text-left h-[18px] w-[36px] focus:outline-none border-none placeholder-black whitespace-nowrap"
                              placeholder="000"
                            />
                            <StyledInput
                              value={sqftLabel}
                              onChange={(e) => setSqftLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("sqftLabel", s)
                              }
                              inputStyle={fieldStyles.sqftLabel}
                              className="font-semibold text-[12px] text-[#2C2E35] bg-transparent text-left focus:outline-none border-none placeholder-gray-600 uppercase whitespace-nowrap"
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
                          <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                            <StyledInput
                              value={builtYearLabel}
                              onChange={(e) =>
                                setBuiltYearLabel(e.target.value)
                              }
                              onChangeStyle={(s) =>
                                updateFieldStyle("builtYearLabel", s)
                              }
                              inputStyle={fieldStyles.builtYearLabel}
                              className="font-semibold text-[12px] text-[#2C2E35] bg-transparent text-left focus:outline-none border-none placeholder-gray-600 uppercase whitespace-nowrap"
                              placeholder="BUILT IN"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={builtYear}
                              onChange={(e) => setBuiltYear(e.target.value)}
                              inputStyle={
                                fieldStyles.builtYear?.fontSize
                                  ? fieldStyles.builtYear
                                  : {
                                      ...fieldStyles.builtYear,
                                      fontSize: "12px",
                                    }
                              }
                              onChangeStyle={(style) =>
                                updateFieldStyle("builtYear", style)
                              }
                              className="font-semibold text-[12px] bg-transparent text-left h-[18px] w-[40px] focus:outline-none border-none placeholder-black whitespace-nowrap"
                              placeholder="0000"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("specPrice") && (
                        <DraggableBox
                          id="specPrice"
                          position={fieldPositions.specPrice}
                          onPositionChange={updateFieldPosition}
                          label="Price"
                          zoom={0.55}
                          disabled={lockedSections.specs}
                          onDelete={() =>
                            removeStandardField(
                              "specPrice",
                              "Price",
                              amount,
                              "Page 1 - Specs",
                              fieldStyles.amount,
                            )
                          }
                          deleteTitle="Remove Price"
                        >
                          <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                            <StyledInput
                              value={priceDotLabel}
                              onChange={(e) => setPriceDotLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("priceDotLabel", s)
                              }
                              inputStyle={fieldStyles.priceDotLabel}
                              className="font-semibold text-[12px] text-[#2C2E35] bg-transparent text-left focus:outline-none border-none placeholder-gray-600 uppercase whitespace-nowrap"
                              placeholder="•"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              inputStyle={
                                fieldStyles.amount?.fontSize
                                  ? fieldStyles.amount
                                  : { ...fieldStyles.amount, fontSize: "12px" }
                              }
                              onChangeStyle={(style) =>
                                updateFieldStyle("amount", style)
                              }
                              className="font-semibold text-[12px] bg-transparent text-left h-[18px] w-[75px] focus:outline-none border-none placeholder-black whitespace-nowrap"
                              placeholder="$000,000"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address & City Section (Clean centered text directly matching reference) */}
                <div
                  data-safezone-container="true"
                  className={`text-white flex flex-col items-center justify-center my-auto py-2 relative border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
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
                    className={`absolute top-1 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                  {/* MLS Code */}
                  {!isFieldDeleted("addressCode") && (
                    <DraggableBox
                      id="addressCode"
                      position={fieldPositions.addressCode}
                      onPositionChange={updateFieldPosition}
                      label="MLS Code"
                      zoom={0.55}
                      disabled={lockedSections.address}
                      onDelete={() =>
                        removeStandardField(
                          "addressCode",
                          "MLS Code",
                          addressCode,
                          "Page 1 - Address",
                          fieldStyles.addressCode,
                        )
                      }
                      deleteTitle="Remove MLS Code"
                    >
                      <div className="tracking-wide flex items-center gap-1 whitespace-nowrap">
                        <StyledInput
                          value={addressHashLabel}
                          onChange={(e) => setAddressHashLabel(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("addressHashLabel", s)
                          }
                          inputStyle={fieldStyles.addressHashLabel}
                          className="font-light text-[30px] h-[30px] leading-none bg-transparent text-white focus:outline-none border-none placeholder-white whitespace-nowrap"
                          placeholder="#"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={addressCode}
                          onChange={(e) => setAddressCode(e.target.value)}
                          inputStyle={
                            fieldStyles.addressCode?.fontSize
                              ? fieldStyles.addressCode
                              : {
                                  ...fieldStyles.addressCode,
                                  fontSize: "30px",
                                }
                          }
                          onChangeStyle={(style) =>
                            updateFieldStyle("addressCode", style)
                          }
                          className="font-light text-[30px] h-[30px] w-[250px] leading-none bg-transparent text-white text-left focus:outline-none border-none placeholder-white placeholder:font-[200] whitespace-nowrap"
                          placeholder="0000-0000"
                        />
                      </div>
                    </DraggableBox>
                  )}

                  {/* Road Name */}
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
                    >
                      <div className="text-[60px] font-light leading-none flex items-center justify-center whitespace-nowrap">
                        <StyledInput
                          value={roadLabelBefore}
                          onChange={(e) => setRoadLabelBefore(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("roadLabelBefore", s)
                          }
                          inputStyle={fieldStyles.roadLabelBefore}
                          className="font-light text-[60px] leading-none bg-transparent text-white text-right focus:outline-none border-none placeholder-white whitespace-nowrap"
                          placeholder="Number"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={roadName}
                          onChange={(e) => setRoadName(e.target.value)}
                          inputStyle={
                            fieldStyles.roadName?.fontSize
                              ? fieldStyles.roadName
                              : { ...fieldStyles.roadName, fontSize: "30px" }
                          }
                          onChangeStyle={(style) =>
                            updateFieldStyle("roadName", style)
                          }
                          className="font-light text-[30px] h-[30px] leading-none bg-transparent text-white text-center w-[65px] focus:outline-none border-none placeholder-white placeholder:font-[200] whitespace-nowrap mx-1"
                          placeholder="0"
                        />
                        <StyledInput
                          value={roadLabelAfter}
                          onChange={(e) => setRoadLabelAfter(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("roadLabelAfter", s)
                          }
                          inputStyle={fieldStyles.roadLabelAfter}
                          className="font-light text-[60px] leading-none bg-transparent text-white text-left focus:outline-none border-none placeholder-white whitespace-nowrap"
                          placeholder="Road"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}

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
                      <div className="tracking-[2px] uppercase flex justify-center whitespace-nowrap">
                        <StyledInput
                          value={cityLine}
                          onChange={(e) => setCityLine(e.target.value)}
                          inputStyle={
                            fieldStyles.cityLine?.fontSize
                              ? fieldStyles.cityLine
                              : { ...fieldStyles.cityLine, fontSize: "13px" }
                          }
                          onChangeStyle={(style) =>
                            updateFieldStyle("cityLine", style)
                          }
                          className="text-white text-[13px] h-[20px] bg-transparent text-center w-[300px] focus:outline-none border-none placeholder-white placeholder:font-[200] whitespace-nowrap"
                          placeholder="BRIGHOUSE SOUTH, RICHMOND"
                        />
                      </div>
                    </DraggableBox>
                  )}

                  {/* Price */}
                  {!isFieldDeleted("priceAmount") && (
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
                          "Page 1 - Address",
                          fieldStyles.amount,
                        )
                      }
                      deleteTitle="Remove Price"
                    >
                      <div className="text-[30px] font-light flex justify-center whitespace-nowrap">
                        <StyledInput
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          inputStyle={
                            fieldStyles.amount?.fontSize
                              ? fieldStyles.amount
                              : { ...fieldStyles.amount, fontSize: "30px" }
                          }
                          onChangeStyle={(style) =>
                            updateFieldStyle("amount", style)
                          }
                          className="font-semibold text-center text-white text-[30px] h-[40px] bg-transparent w-[200px] focus:outline-none border-none placeholder-white placeholder:font-[500] whitespace-nowrap"
                          placeholder="$000,000"
                        />
                      </div>
                    </DraggableBox>
                  )}
                </div>

                {/* Bottom Curve SVG */}
                <div
                  className="relative z-10"
                  style={{
                    marginBottom: showBleed ? "-0.375in" : "-0.25in",
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                  }}
                >
                  <svg
                    viewBox="163 79 631 114"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto pointer-events-none"
                  >
                    <g opacity={0.350006} filter="url(#filter0_d_p1_11)">
                      <path
                        d="M794 135C794 135 678.203 183.969 463 122C223 32 164.5 127 164.5 127V193H794V131.5"
                        fill="black"
                      />
                    </g>
                    <path
                      d="M793.592 138.135C793.592 138.135 655.583 191.415 440.821 116.535C226.06 41.6551 163 128.055 163 128.055V193H477.5H794L793.592 139.575"
                      fill="white"
                    />
                    <path
                      opacity={0.350006}
                      d="M794 115.5C794 115.5 656.323 173.19 441.12 104.904C225.916 36.6177 166 124.936 166 124.936L167.5 192.5H794V117.5"
                      fill="white"
                    />
                    <defs>
                      <filter
                        id="filter0_d_p1_11"
                        x={0.5}
                        y={0.256348}
                        width={953.5}
                        height={433.744}
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                      >
                        <feFlood floodOpacity={0} result="BackgroundImageFix" />
                        <feColorMatrix
                          in="SourceAlpha"
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                          result="hardAlpha"
                        />
                        <feOffset dx={-2} dy={79} />
                        <feGaussianBlur stdDeviation={81} />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                        />
                        <feBlend
                          mode="normal"
                          in2="BackgroundImageFix"
                          result="effect1_dropShadow_p1_11"
                        />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="effect1_dropShadow_p1_11"
                          result="shape"
                        />
                      </filter>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SPREAD 2: PAGE 2 (Left) | PAGE 3 (Right)                             */}
        {/* ═════════════════════════════════════════════════════════════════════ */}

        {/* Bottom Sheet Banners (PAGE 2 | PAGE 3) */}
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

        {/* SPREAD 2 Outer Page / Bleed Wrapper */}
        <div
          className="flex items-stretch pdf-page bg-[#43454B] shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
          style={{
            width: showBleed ? "17.25in" : "17in",
            height: showBleed ? "11.25in" : "11in",
            zoom: 0.55,
            margin: "0 auto",
            marginBottom: "40px",
          }}
        >
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div className="relative w-full h-full z-10 flex gap-4 font-alexandria">
              {/* ───────────────────────────────────────────────────────────── */}
              {/* PAGE 2 (Left Half)                                            */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="w-1/2 flex flex-col justify-between py-[20px] pl-[20px] pr-2">
                <div className="flex gap-4 items-start">
                  {/* Left Column: image9 and image10 */}
                  <div className="grid grid-cols-1 gap-5 w-[45%]">
                    {/* image9 */}
                    <div
                      data-image-slot="true"
                      className="h-[220px] relative group border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer"
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

                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image9", fileInputRefs.image9)
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
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs"
                          >
                            Select Image
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRefs.image9}
                          onChange={(e) => handleImageChange("image9", e)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* image10 */}
                    <div
                      data-image-slot="true"
                      className="h-[220px] relative group border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer"
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
                              onMouseDown={(e) => handleMouseDown("image10", e)}
                            >
                              <ImageEditor
                                src={images.image10}
                                scale={scale.image10}
                                position={position.image10}
                                rotation={rotation.image10}
                                objectFit="contain"
                              />
                            </div>

                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image10", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image10", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRotate("image10")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

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

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image10", fileInputRefs.image10)
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
                            onClick={(e) => openImageSourceModal("image10", e)}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs"
                          >
                            Select Image
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRefs.image10}
                          onChange={(e) => handleImageChange("image10", e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Headline & Description Section */}
                  <div
                    data-safezone-container="true"
                    className={`w-[55%] h-[460px] flex flex-col justify-start font-normal text-white italic relative z-10 leading-[1.6] border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
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
                      className={`absolute top-1 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    {!isFieldDeleted("headline") && (
                      <DraggableBox
                        id="headline"
                        position={fieldPositions.headline}
                        onPositionChange={updateFieldPosition}
                        label="Headline"
                        zoom={0.55}
                        disabled={lockedSections.description}
                        onDelete={() =>
                          removeStandardField(
                            "headline",
                            "Headline",
                            headline,
                            "Page 2 - Description",
                            fieldStyles.headline,
                          )
                        }
                        deleteTitle="Remove Headline"
                      >
                        <StyledInput
                          value={headline}
                          rows={3}
                          onChange={(e) => setHeadline(e.target.value)}
                          inputStyle={
                            fieldStyles.headline?.fontSize
                              ? fieldStyles.headline
                              : {
                                  ...fieldStyles.headline,
                                  fontSize: "22px",
                                }
                          }
                          onChangeStyle={(style) =>
                            updateFieldStyle("headline", style)
                          }
                          className="text-[22px] tracking-[-0.5px] font-bold mb-3 not-italic uppercase text-white bg-transparent text-left focus:outline-none border-none placeholder-white/60 leading-tight w-full"
                          placeholder="ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE..."
                        />
                      </DraggableBox>
                    )}

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
                      >
                        <StyledInput
                          value={description}
                          rows={14}
                          onChange={(e) => setDescription(e.target.value)}
                          inputStyle={
                            fieldStyles.description?.fontSize
                              ? fieldStyles.description
                              : {
                                  ...fieldStyles.description,
                                  fontSize: "9.5px",
                                }
                          }
                          onChangeStyle={(style) =>
                            updateFieldStyle("description", style)
                          }
                          className="font-normal text-[9.5px] w-full min-h-[300px] text-white leading-[1.65] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500] resize-none"
                          placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS..."
                        />
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Bottom Image: image11 */}
                <div className="mt-4">
                  <div
                    data-image-slot="true"
                    className="w-full h-[480px] place-self-center z-10 relative border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] overflow-hidden group cursor-pointer"
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
                            onMouseDown={(e) => handleMouseDown("image11", e)}
                          >
                            <ImageEditor
                              src={images.image11}
                              scale={scale.image11}
                              position={position.image11}
                              rotation={rotation.image11}
                              objectFit="contain"
                            />
                          </div>

                          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image11", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image11", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRotate("image11")}
                            className="absolute top-10 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image11", e)}
                            className="absolute top-10 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image11", fileInputRefs.image11)
                            }
                            className="absolute top-10 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image11", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs"
                        >
                          Select Image
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRefs.image11}
                        onChange={(e) => handleImageChange("image11", e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* PAGE 3 (Right Half)                                           */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="w-1/2 flex gap-4 relative h-full">
                {/* Full-bleed light gray background panel for right section */}
                <div
                  data-html2canvas-ignore="false"
                  className="absolute pointer-events-none z-0"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    top: showBleed ? "-0.375in" : "-0.25in",
                    bottom: showBleed ? "-0.375in" : "-0.25in",
                    right: showBleed ? "-0.375in" : "-0.25in",
                    left: "calc(45% + 8px)",
                  }}
                />

                {/* Left Column (45%): 4 Stacked Images */}
                <div className="w-[45%] h-full py-[10px] flex flex-col relative z-10">
                  <div className="h-full flex flex-col justify-between gap-3">
                    {[
                      { key: "image12" as const, ref: fileInputRefs.image12 },
                      { key: "image13" as const, ref: fileInputRefs.image13 },
                      { key: "image14" as const, ref: fileInputRefs.image14 },
                      { key: "image15" as const, ref: fileInputRefs.image15 },
                    ].map(({ key, ref: fRef }) => (
                      <div
                        key={key}
                        data-image-slot="true"
                        className="flex-1 min-h-0 relative z-10 group border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer"
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
                          {images[key] ? (
                            <>
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

                              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                              <button
                                type="button"
                                onClick={() => handleRotate(key)}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => openImageSourceModal(key, e)}
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(key, fRef)}
                                className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Delete image"
                              >
                                <Trash className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          ) : (
                            <div
                              data-html2canvas-ignore="true"
                              onClick={(e) => openImageSourceModal(key, e)}
                              className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs"
                            >
                              Select Image
                            </div>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            ref={fRef}
                            onChange={(e) => handleImageChange(key, e)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column (55%): Image17, Details Grid, Image18 */}
                <div className="w-[55%] h-full flex flex-col justify-between py-[10px] pl-[10px] pr-[10px] relative z-10">
                  {/* Top Image: image17 */}
                  <div
                    data-image-slot="true"
                    className="h-[200px] relative z-10 group border-2 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer"
                    onMouseEnter={() => setHoveredSlot("image17")}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={(e) => {
                      if (e.altKey) return;
                      e.stopPropagation();
                      setActiveSlot("image17");
                    }}
                  >
                    <BoxIndicator isVisible={isSlotActive("image17")} />
                    <div
                      className="w-full h-full relative overflow-hidden flex items-center justify-center"
                      onMouseMove={(e) => handleMouseMove("image17", e)}
                      onMouseUp={() => handleMouseUp("image17")}
                      onMouseLeave={() => handleMouseLeave("image17")}
                    >
                      {images.image17 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image17", e)}
                          >
                            <ImageEditor
                              src={images.image17}
                              scale={scale.image17}
                              position={position.image17}
                              rotation={rotation.image17}
                              objectFit="contain"
                            />
                          </div>

                          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image17", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image17", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRotate("image17")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image17", e)}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image17", fileInputRefs.image17)
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
                          onClick={(e) => openImageSourceModal("image17", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs"
                        >
                          Select Image
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRefs.image17}
                        onChange={(e) => handleImageChange("image17", e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* 2-Column Details Section */}
                  <div
                    data-safezone-container="true"
                    className={`flex gap-4 text-[#595B61] text-[12px] leading-relaxed my-2 relative border-[3.5px] border-solid border-transparent rounded-lg p-1.5 transition-all duration-150 group/sec h-[320px] shrink-0 ${
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
                      className={`absolute top-1 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    {/* Left Detail Column */}
                    <div className="w-1/2 space-y-2 text-[8px]">
                      {leftDetailFields.map((field) => (
                        <DetailFieldRow
                          key={field.id}
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
                          onRemove={() => removeDetailField(field.id)}
                        />
                      ))}
                    </div>

                    {/* Right Detail Column */}
                    <div className="w-1/2 space-y-2 text-[8px]">
                      {rightDetailFields.map((field) => (
                        <DetailFieldRow
                          key={field.id}
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
                          onRemove={() => removeDetailField(field.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Bottom Image: image18 */}
                  <div
                    data-image-slot="true"
                    className="w-full h-[430px] place-self-center border-2 z-10 border-white shadow-[4px_4px_6px_rgba(0,0,0,0.85)] relative overflow-hidden group cursor-pointer"
                    onMouseEnter={() => setHoveredSlot("image18")}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={(e) => {
                      if (e.altKey) return;
                      e.stopPropagation();
                      setActiveSlot("image18");
                    }}
                  >
                    <BoxIndicator isVisible={isSlotActive("image18")} />
                    <div
                      className="w-full h-full relative overflow-hidden flex items-center justify-center"
                      onMouseMove={(e) => handleMouseMove("image18", e)}
                      onMouseUp={() => handleMouseUp("image18")}
                      onMouseLeave={() => handleMouseLeave("image18")}
                    >
                      {images.image18 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image18", e)}
                          >
                            <ImageEditor
                              src={images.image18}
                              scale={scale.image18}
                              position={position.image18}
                              rotation={rotation.image18}
                              objectFit="contain"
                            />
                          </div>

                          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image18", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image18", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRotate("image18")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image18", e)}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image18", fileInputRefs.image18)
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
                          onClick={(e) => openImageSourceModal("image18", e)}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs"
                        >
                          Select Image
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRefs.image18}
                        onChange={(e) => handleImageChange("image18", e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom SVG Wave Curve on Spread 2 */}
                <svg
                  viewBox="164 80 628 81.73"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute bottom-1 left-0 right-0 pointer-events-none z-0"
                >
                  <path
                    opacity="0.350006"
                    d="M792 116.5C792 116.5 654.323 174.19 439.12 105.904C223.916 37.6178 164 125.936 164 125.936C164 125.936 210.5 45.0673 441.5 123.5C656.5 196.5 792 142.5 792 142.5V118.5"
                    fill="white"
                  />
                  <g opacity="0.350006" filter="url(#filter0_d_p2_11)">
                    <path
                      d="M792 136.347C792 136.347 677.111 184.924 461.737 122.645C221.546 32.1944 164 126 164 126V128C164 128 218.35 46.7071 461.737 129C652.5 193.5 792 142.5 792 142.5V136.347Z"
                      fill="black"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_d_p2_11"
                      x="0"
                      y="0.296387"
                      width="952"
                      height="402.344"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feOffset dx="-2" dy="79" />
                      <feGaussianBlur stdDeviation="81" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_p2_11"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_p2_11"
                        result="shape"
                      />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>
      </div>
    );
  },
);

BcfpStandard11.displayName = "BcfpStandard11";

export default BcfpStandard11;
