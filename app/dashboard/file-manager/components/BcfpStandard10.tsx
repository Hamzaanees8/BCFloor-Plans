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

export interface BcfpStandard10Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard10Props {
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
// Renders a single editable title + editable value input row for Page 2 details.
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
              : { ...field.titleStyle, fontSize: "12px" }
          }
          className="font-bold text-[#B8CCA6] text-[12px] leading-tight bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 uppercase tracking-wide whitespace-nowrap"
          placeholder="ENTER TITLE HERE"
          wrapperClassName="w-auto shrink-0"
        />
        {onRemove && (
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={onRemove}
            className="opacity-0 group-hover/row:opacity-100 text-white/70 hover:text-red-400 p-0.5 rounded transition-opacity"
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
            : { ...field.style, fontSize: "12px" }
        }
        className="font-normal text-white text-[12px] leading-snug bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-200 placeholder:font-[400] resize-none"
        placeholder="Enter details here"
      />
    </div>
  );
};

// Default detail fields for BcfpStandard10 (Page 2, 3-column details)
const DEFAULT_COL1_DETAIL_FIELDS: DetailField[] = [
  {
    id: "byLawRestrictions",
    title: "BY-LAW RESTRICTIONS:",
    value: "Pets Allowed w/Rest., Rentals Allowed",
    style: { fontSize: "12px" },
    titleStyle: { fontSize: "12px" },
  },
  {
    id: "maintFees",
    title: "MAINT. FEES:",
    value: "$000.00",
    style: { fontSize: "12px" },
    titleStyle: { fontSize: "12px" },
  },
  {
    id: "view",
    title: "VIEW:",
    value: "South & SW - Van Isl.",
    style: { fontSize: "12px" },
    titleStyle: { fontSize: "12px" },
  },
];

const DEFAULT_COL2_DETAIL_FIELDS: DetailField[] = [
  {
    id: "maintFeesInclude",
    title: "MAINT. FEES INCLUDE:",
    value:
      "Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker",
    style: { fontSize: "12px" },
    titleStyle: { fontSize: "12px" },
  },
  {
    id: "featuresIncluded",
    title: "FEATURES INCLUDED:",
    value: "Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings",
    style: { fontSize: "12px" },
    titleStyle: { fontSize: "12px" },
  },
];

const DEFAULT_COL3_DETAIL_FIELDS: DetailField[] = [
  {
    id: "siteInfluences",
    title: "SITE INFLUENCES:",
    value:
      "Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby",
    style: { fontSize: "12px" },
    titleStyle: { fontSize: "12px" },
  },
  {
    id: "amenities",
    title: "AMENITIES:",
    value: "Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room",
    style: { fontSize: "12px" },
    titleStyle: { fontSize: "12px" },
  },
];

const DEFAULT_SPEC_STYLE: TextStyle = {
  fontSize: "16px",
  fontWeight: "700",
  fontFamily: "Alexandria, sans-serif",
  color: "#2E4F23",
};

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
  "headline",
  "propertyDescription",
  "specBedroom",
  "specBathroom",
  "specSqft",
  "specBuiltYear",
]);

const BcfpStandard10 = forwardRef<BcfpStandard10Ref, BcfpStandard10Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── 1. Detail Fields (3 Columns) ─────────────────────────────────────────
    const [col1DetailFields, setCol1DetailFields] = useState<DetailField[]>(
      DEFAULT_COL1_DETAIL_FIELDS,
    );
    const [col2DetailFields, setCol2DetailFields] = useState<DetailField[]>(
      DEFAULT_COL2_DETAIL_FIELDS,
    );
    const [col3DetailFields, setCol3DetailFields] = useState<DetailField[]>(
      DEFAULT_COL3_DETAIL_FIELDS,
    );

    const updateDetailTitle = (id: string, title: string) => {
      setCol1DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, title } : f)),
      );
      setCol2DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, title } : f)),
      );
      setCol3DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, title } : f)),
      );
    };

    const updateDetailValue = (id: string, value: string) => {
      setCol1DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, value } : f)),
      );
      setCol2DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, value } : f)),
      );
      setCol3DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, value } : f)),
      );
    };

    const updateDetailStyle = (id: string, style: TextStyle) => {
      setCol1DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, style } : f)),
      );
      setCol2DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, style } : f)),
      );
      setCol3DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, style } : f)),
      );
    };

    const updateDetailTitleStyle = (id: string, style: TextStyle) => {
      setCol1DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, titleStyle: style } : f)),
      );
      setCol2DetailFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, titleStyle: style } : f)),
      );
      setCol3DetailFields((prev) =>
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
      const col1Field = col1DetailFields.find((f) => f.id === id);
      if (col1Field) {
        const newDeleted: DeletedDetailFieldItem[] = [
          ...deletedDetailFields.filter((f) => f.id !== id),
          {
            ...col1Field,
            column: "col1",
            section: "Page 2 - Details Col 1",
            deletedAt: Date.now(),
          },
        ];
        setDeletedDetailFields(newDeleted);
        updateFormData({ deletedDetailFields: newDeleted });
        setCol1DetailFields((prev) => prev.filter((f) => f.id !== id));
        return;
      }

      const col2Field = col2DetailFields.find((f) => f.id === id);
      if (col2Field) {
        const newDeleted: DeletedDetailFieldItem[] = [
          ...deletedDetailFields.filter((f) => f.id !== id),
          {
            ...col2Field,
            column: "col2",
            section: "Page 2 - Details Col 2",
            deletedAt: Date.now(),
          },
        ];
        setDeletedDetailFields(newDeleted);
        updateFormData({ deletedDetailFields: newDeleted });
        setCol2DetailFields((prev) => prev.filter((f) => f.id !== id));
        return;
      }

      const col3Field = col3DetailFields.find((f) => f.id === id);
      if (col3Field) {
        const newDeleted: DeletedDetailFieldItem[] = [
          ...deletedDetailFields.filter((f) => f.id !== id),
          {
            ...col3Field,
            column: "col3",
            section: "Page 2 - Details Col 3",
            deletedAt: Date.now(),
          },
        ];
        setDeletedDetailFields(newDeleted);
        updateFormData({ deletedDetailFields: newDeleted });
        setCol3DetailFields((prev) => prev.filter((f) => f.id !== id));
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

          if (fieldToRestore.column === "col3") {
            setCol3DetailFields((prev) => [
              ...prev.filter((f) => f.id !== id),
              cleanField,
            ]);
          } else if (fieldToRestore.column === "col2") {
            setCol2DetailFields((prev) => [
              ...prev.filter((f) => f.id !== id),
              cleanField,
            ]);
          } else {
            setCol1DetailFields((prev) => [
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
        const col1Restored: DetailField[] = [];
        const col2Restored: DetailField[] = [];
        const col3Restored: DetailField[] = [];

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
          if (field.column === "col3") col3Restored.push(cleanField);
          else if (field.column === "col2") col2Restored.push(cleanField);
          else col1Restored.push(cleanField);
        });

        if (col1Restored.length > 0)
          setCol1DetailFields((prev) => [...prev, ...col1Restored]);
        if (col2Restored.length > 0)
          setCol2DetailFields((prev) => [...prev, ...col2Restored]);
        if (col3Restored.length > 0)
          setCol3DetailFields((prev) => [...prev, ...col3Restored]);

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
    const [fullName, setFullName] = useState("FIRSTNAME LASTNAME");
    const [email, setEmail] = useState("firstname@last.com");
    const [number, setNumber] = useState("604.000.0000");
    const [propertyName, setPropertyName] = useState("Macdonald Realty");
    const [amount, setAmount] = useState("$000,000");
    const [addressCode, setAddressCode] = useState("0000-0000");
    const [roadName, setRoadName] = useState("0");
    const [cityLine, setCityLine] = useState("BRIGHOUSE SOUTH, RICHMOND");
    const [bedroom, setBedroom] = useState("0");
    const [bathroom, setBathroom] = useState("0");
    const [sqft, setSqft] = useState("000");
    const [builtYear, setBuiltYear] = useState("0000");
    const [description, setDescription] = useState("");
    const [headline, setHeadline] = useState(
      "ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.",
    );

    // Editable labels
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("Phone:");
    const [emailLabel, setEmailLabel] = useState("Email:");
    const [addressHashLabel, setAddressHashLabel] = useState("#");
    const [roadLabelBefore, setRoadLabelBefore] = useState("NUMBER");
    const [roadLabelAfter, setRoadLabelAfter] = useState("ROAD");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM |");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM |");
    const [sqftLabel, setSqftLabel] = useState("SQ FT |");
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
      price: false,
      description: false,
      details: false,
      specs: false,
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 6. Image States (16 Slots) ────────────────────────────────────────────
    const [images, setImages] = useState({
      image1: null as string | null,
      image2: null as string | null, // Page 4 Agent Logo
      image3: null as string | null,
      image4: null as string | null,
      image5: null as string | null,
      image6: null as string | null,
      image7: null as string | null,
      image8: null as string | null, // Page 1 Agent Logo
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

    // Image toolbar settings: showBorder, showWhiteBg, showShadow
    const [imageSettings, setImageSettings] = useState<
      Record<
        keyof typeof images,
        {
          showBorder: boolean;
          showWhiteBg: boolean;
          showShadow: boolean;
        }
      >
    >({
      image1: { showBorder: true, showWhiteBg: true, showShadow: false },
      image2: { showBorder: false, showWhiteBg: false, showShadow: false },
      image3: { showBorder: true, showWhiteBg: true, showShadow: false },
      image4: { showBorder: true, showWhiteBg: true, showShadow: false },
      image5: { showBorder: true, showWhiteBg: true, showShadow: false },
      image6: { showBorder: true, showWhiteBg: true, showShadow: false },
      image7: { showBorder: true, showWhiteBg: true, showShadow: false },
      image8: { showBorder: false, showWhiteBg: false, showShadow: false },
      image9: { showBorder: true, showWhiteBg: true, showShadow: false },
      image10: { showBorder: true, showWhiteBg: true, showShadow: false },
      image11: { showBorder: true, showWhiteBg: true, showShadow: false },
      image12: { showBorder: true, showWhiteBg: true, showShadow: false },
      image13: { showBorder: true, showWhiteBg: true, showShadow: false },
      image14: { showBorder: true, showWhiteBg: true, showShadow: false },
      image15: { showBorder: true, showWhiteBg: true, showShadow: false },
      image16: { showBorder: true, showWhiteBg: true, showShadow: false },
    });

    const toggleImageSetting = (
      key: keyof typeof images,
      setting: "showBorder" | "showWhiteBg" | "showShadow",
    ) => {
      setImageSettings((prev) => {
        const current = prev[key] || {
          showBorder: true,
          showWhiteBg: true,
          showShadow: false,
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

    // ── 7. Gallery and Slot Active States ─────────────────────────────────────
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
              image2: prev.image2 || agentLogo,
              image8: prev.image8 || agentLogo,
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
        if (formData.disclaimerText)
          setDisclaimerText(s(formData.disclaimerText));
        if (formData.printedByText) setPrintedByText(s(formData.printedByText));

        if ((formData as any).col1DetailFields) {
          setCol1DetailFields(
            (formData as any).col1DetailFields as DetailField[],
          );
        }
        if ((formData as any).col2DetailFields) {
          setCol2DetailFields(
            (formData as any).col2DetailFields as DetailField[],
          );
        }
        if ((formData as any).col3DetailFields) {
          setCol3DetailFields(
            (formData as any).col3DetailFields as DetailField[],
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
        if (formData.imageSettings) {
          setImageSettings((prev) => ({
            ...prev,
            ...(formData.imageSettings as typeof imageSettings),
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
        detailFields: [
          ...col1DetailFields,
          ...col2DetailFields,
          ...col3DetailFields,
        ],
        col1DetailFields,
        col2DetailFields,
        col3DetailFields,
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
        disclaimerText,
        printedByText,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        imageSettings,
        fieldStyles,
        fieldPositions,
        lockedSections,
      } as any);
    }, [
      col1DetailFields,
      col2DetailFields,
      col3DetailFields,
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
      disclaimerText,
      printedByText,
      images,
      scale,
      position,
      rotation,
      imageSettings,
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
          templateKey: "BCFPStandard10",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#2E4F23",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "38px",
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
              fontSize: fieldStyles.email?.fontSize || "13px",
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
              fontSize: fieldStyles.roadName?.fontSize || "24px",
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
            col1DetailFields.find((f) => f.id === "byLawRestrictions")?.title ||
            "BY-LAW RESTRICTIONS:",
          expandedDetail1Description: {
            value:
              col1DetailFields.find((f) => f.id === "byLawRestrictions")
                ?.value || "",
            style:
              col1DetailFields.find((f) => f.id === "byLawRestrictions")
                ?.style || ({} as TextStyle),
          },
          expandedDetail2Title:
            col1DetailFields.find((f) => f.id === "maintFees")?.title ||
            "MAINT. FEES:",
          expandedDetail2Description: {
            value:
              col1DetailFields.find((f) => f.id === "maintFees")?.value || "",
            style:
              col1DetailFields.find((f) => f.id === "maintFees")?.style ||
              ({} as TextStyle),
          },
          expandedDetail3Title:
            col2DetailFields.find((f) => f.id === "maintFeesInclude")?.title ||
            "MAINT. FEES INCLUDE:",
          expandedDetail3Description: {
            value:
              col2DetailFields.find((f) => f.id === "maintFeesInclude")
                ?.value || "",
            style:
              col2DetailFields.find((f) => f.id === "maintFeesInclude")
                ?.style || ({} as TextStyle),
          },
          expandedDetail4Title:
            col2DetailFields.find((f) => f.id === "featuresIncluded")?.title ||
            "FEATURES INCLUDED:",
          expandedDetail4Description: {
            value:
              col2DetailFields.find((f) => f.id === "featuresIncluded")
                ?.value || "",
            style:
              col2DetailFields.find((f) => f.id === "featuresIncluded")
                ?.style || ({} as TextStyle),
          },
          keyHighlightLabel:
            col3DetailFields.find((f) => f.id === "siteInfluences")?.title ||
            "SITE INFLUENCES:",
          keyHighlights: col3DetailFields.find((f) => f.id === "siteInfluences")
            ?.value
            ? col3DetailFields
                .find((f) => f.id === "siteInfluences")!
                .value.split("\n")
                .filter(Boolean)
            : [],
          otherDetails: {
            view: {
              value: col1DetailFields.find((f) => f.id === "view")?.value || "",
              style:
                col1DetailFields.find((f) => f.id === "view")?.style ||
                ({} as TextStyle),
              title:
                col1DetailFields.find((f) => f.id === "view")?.title || "VIEW:",
            },
            amenities: {
              value:
                col3DetailFields.find((f) => f.id === "amenities")?.value || "",
              style:
                col3DetailFields.find((f) => f.id === "amenities")?.style ||
                ({} as TextStyle),
              title:
                col3DetailFields.find((f) => f.id === "amenities")?.title ||
                "AMENITIES:",
            },
            col1DetailFields,
            col2DetailFields,
            col3DetailFields,
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
                fontSize: fieldStyles.number?.fontSize || "13px",
              },
            },
            phone: {
              value: number,
              style: {
                ...fieldStyles.number,
                fontSize: fieldStyles.number?.fontSize || "13px",
              },
            },
            addressCode: {
              value: addressCode,
              style: {
                ...fieldStyles.addressCode,
                fontSize: fieldStyles.addressCode?.fontSize || "24px",
              },
            },
            cityLine: {
              value: cityLine,
              style: {
                ...fieldStyles.cityLine,
                fontSize: fieldStyles.cityLine?.fontSize || "11px",
              },
            },
            headline: {
              value: headline,
              style: {
                ...fieldStyles.headline,
                fontSize: fieldStyles.headline?.fontSize || "13.5px",
              },
            },
            contactLabel: {
              value: contactLabel,
              style: {
                ...fieldStyles.contactLabel,
                fontSize: fieldStyles.contactLabel?.fontSize || "13px",
              },
            },
            phoneLabel: {
              value: phoneLabel,
              style: {
                ...fieldStyles.phoneLabel,
                fontSize: fieldStyles.phoneLabel?.fontSize || "13px",
              },
            },
            emailLabel: {
              value: emailLabel,
              style: {
                ...fieldStyles.emailLabel,
                fontSize: fieldStyles.emailLabel?.fontSize || "13px",
              },
            },
            addressHashLabel: {
              value: addressHashLabel,
              style: {
                ...fieldStyles.addressHashLabel,
                fontSize: fieldStyles.addressHashLabel?.fontSize || "20px",
              },
            },
            roadLabelBefore: {
              value: roadLabelBefore,
              style: {
                ...fieldStyles.roadLabelBefore,
                fontSize: fieldStyles.roadLabelBefore?.fontSize || "24px",
              },
            },
            roadLabelAfter: {
              value: roadLabelAfter,
              style: {
                ...fieldStyles.roadLabelAfter,
                fontSize: fieldStyles.roadLabelAfter?.fontSize || "24px",
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
            disclaimerText: {
              value: disclaimerText,
              style: {
                ...fieldStyles.disclaimerText,
                fontSize: fieldStyles.disclaimerText?.fontSize || "10px",
              },
            },
            printedByText: {
              value: printedByText,
              style: {
                ...fieldStyles.printedByText,
                fontSize: fieldStyles.printedByText?.fontSize || "15px",
              },
            },
            imageSettings,
            fieldPositions,
            _lockedSections: lockedSections,
            _deletedStandardFieldIds: deletedStandardFieldIds,
            _deletedDetailFields: deletedDetailFields,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
        });
        return payload;
      },

      importFromPayload: (payload: FeatureSheetResponse) => {
        if (!payload?.content) return;
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

        const rawOtherDetails =
          (payload.content.otherDetails as Record<string, any>) || {};

        // Reconstruct detail fields
        if (rawOtherDetails.col1DetailFields) {
          setCol1DetailFields(
            rawOtherDetails.col1DetailFields as DetailField[],
          );
        }
        if (rawOtherDetails.col2DetailFields) {
          setCol2DetailFields(
            rawOtherDetails.col2DetailFields as DetailField[],
          );
        }
        if (rawOtherDetails.col3DetailFields) {
          setCol3DetailFields(
            rawOtherDetails.col3DetailFields as DetailField[],
          );
        }

        if (
          !rawOtherDetails.col1DetailFields &&
          !rawOtherDetails.col2DetailFields &&
          !rawOtherDetails.col3DetailFields
        ) {
          const recCol1: DetailField[] = [];
          const recCol2: DetailField[] = [];
          const recCol3: DetailField[] = [];

          if (state.expandedDetail1Description !== undefined) {
            recCol1.push({
              id: "byLawRestrictions",
              title:
                (payload.content as any).expandedDetail1Title ||
                "BY-LAW RESTRICTIONS:",
              value: s(state.expandedDetail1Description),
              style: (state.expandedDetail1Description as any)?.style,
            });
          }
          if (state.expandedDetail2Description !== undefined) {
            recCol1.push({
              id: "maintFees",
              title:
                (payload.content as any).expandedDetail2Title || "MAINT. FEES:",
              value: s(state.expandedDetail2Description),
              style: (state.expandedDetail2Description as any)?.style,
            });
          }
          if (rawOtherDetails.view) {
            recCol1.push({
              id: "view",
              title: rawOtherDetails.view.title || "VIEW:",
              value: s(rawOtherDetails.view),
              style: rawOtherDetails.view.style,
            });
          }

          if (state.expandedDetail3Description !== undefined) {
            recCol2.push({
              id: "maintFeesInclude",
              title:
                (payload.content as any).expandedDetail3Title ||
                "MAINT. FEES INCLUDE:",
              value: s(state.expandedDetail3Description),
              style: (state.expandedDetail3Description as any)?.style,
            });
          }
          if (state.expandedDetail4Description !== undefined) {
            recCol2.push({
              id: "featuresIncluded",
              title:
                (payload.content as any).expandedDetail4Title ||
                "FEATURES INCLUDED:",
              value: s(state.expandedDetail4Description),
              style: (state.expandedDetail4Description as any)?.style,
            });
          }

          if (state.keyHighlights) {
            recCol3.push({
              id: "siteInfluences",
              title:
                (payload.content as any).keyHighlightLabel ||
                "SITE INFLUENCES:",
              value: Array.isArray(state.keyHighlights)
                ? state.keyHighlights.map((h) => s(h)).join("\n")
                : s(state.keyHighlights),
            });
          }
          if (rawOtherDetails.amenities) {
            recCol3.push({
              id: "amenities",
              title: rawOtherDetails.amenities.title || "AMENITIES:",
              value: s(rawOtherDetails.amenities),
              style: rawOtherDetails.amenities.style,
            });
          }

          if (recCol1.length > 0) setCol1DetailFields(recCol1);
          if (recCol2.length > 0) setCol2DetailFields(recCol2);
          if (recCol3.length > 0) setCol3DetailFields(recCol3);
        }

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, any>;
          if (details.bedroom) setBedroom(s(details.bedroom));
          if (details.bathroom) setBathroom(s(details.bathroom));
          if (details.sqft) setSqft(s(details.sqft));
          if (details.builtYear) setBuiltYear(s(details.builtYear));
          if (details.number || details.phone)
            setNumber(s(details.number || details.phone));
          if (details.addressCode) setAddressCode(s(details.addressCode));
          if (details.cityLine) setCityLine(s(details.cityLine));
          if (details.headline) setHeadline(s(details.headline));

          if (details.contactLabel) setContactLabel(s(details.contactLabel));
          if (details.phoneLabel) setPhoneLabel(s(details.phoneLabel));
          if (details.emailLabel) setEmailLabel(s(details.emailLabel));
          if (details.addressHashLabel)
            setAddressHashLabel(s(details.addressHashLabel));
          if (details.roadLabelBefore)
            setRoadLabelBefore(s(details.roadLabelBefore));
          if (details.roadLabelAfter)
            setRoadLabelAfter(s(details.roadLabelAfter));
          if (details.bedroomLabel) setBedroomLabel(s(details.bedroomLabel));
          if (details.bathroomLabel) setBathroomLabel(s(details.bathroomLabel));
          if (details.sqftLabel) setSqftLabel(s(details.sqftLabel));
          if (details.builtYearLabel)
            setBuiltYearLabel(s(details.builtYearLabel));
          if (details.disclaimerText)
            setDisclaimerText(s(details.disclaimerText));
          if (details.printedByText) setPrintedByText(s(details.printedByText));
        }

        const styles: Record<string, TextStyle> = {};
        const c = payload.content;
        const st = (f: any) => (f as StyledTextField)?.style;

        if (st(c.offeredAtPrice)) styles.amount = st(c.offeredAtPrice);
        if (st(c.realtorName)) styles.fullName = st(c.realtorName);
        if (st(c.emailLink)) styles.email = st(c.emailLink);
        if (st(c.companyName)) styles.propertyName = st(c.companyName);
        if (st(c.propertyNotesTitle))
          styles.roadName = st(c.propertyNotesTitle);
        if (st(c.propertyNotesDescription))
          styles.description = st(c.propertyNotesDescription);

        const od = c.otherDetails as Record<string, any>;
        if (od) {
          if (st(od.bedroom)) styles.bedroom = st(od.bedroom);
          if (st(od.bathroom)) styles.bathroom = st(od.bathroom);
          if (st(od.sqft)) styles.sqft = st(od.sqft);
          if (st(od.builtYear)) styles.builtYear = st(od.builtYear);
          if (st(od.number) || st(od.phone)) {
            const numStyle = st(od.number) || st(od.phone);
            styles.number = numStyle;
            styles.phone = numStyle;
          }
          if (st(od.addressCode)) styles.addressCode = st(od.addressCode);
          if (st(od.cityLine)) styles.cityLine = st(od.cityLine);
          if (st(od.headline)) styles.headline = st(od.headline);
          if (st(od.contactLabel)) styles.contactLabel = st(od.contactLabel);
          if (st(od.phoneLabel)) styles.phoneLabel = st(od.phoneLabel);
          if (st(od.emailLabel)) styles.emailLabel = st(od.emailLabel);
          if (st(od.addressHashLabel))
            styles.addressHashLabel = st(od.addressHashLabel);
          if (st(od.roadLabelBefore))
            styles.roadLabelBefore = st(od.roadLabelBefore);
          if (st(od.roadLabelAfter))
            styles.roadLabelAfter = st(od.roadLabelAfter);
          if (st(od.bedroomLabel)) styles.bedroomLabel = st(od.bedroomLabel);
          if (st(od.bathroomLabel)) styles.bathroomLabel = st(od.bathroomLabel);
          if (st(od.sqftLabel)) styles.sqftLabel = st(od.sqftLabel);
          if (st(od.builtYearLabel))
            styles.builtYearLabel = st(od.builtYearLabel);
          if (st(od.disclaimerText))
            styles.disclaimerText = st(od.disclaimerText);
          if (st(od.printedByText)) styles.printedByText = st(od.printedByText);
        }

        setFieldStyles(styles);

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
        if (rawOtherDetails.imageSettings) {
          const loaded = rawOtherDetails.imageSettings as Record<string, any>;
          const normalized: Record<
            keyof typeof images,
            {
              showBorder: boolean;
              showWhiteBg: boolean;
              showShadow: boolean;
            }
          > = {} as any;
          (Object.keys(images) as Array<keyof typeof images>).forEach((k) => {
            const item = loaded[k] || {};
            const border = item.showBorder ?? true;
            const whiteBg =
              item.showWhiteBg !== undefined
                ? Boolean(item.showWhiteBg)
                : item.transparentBg !== undefined
                  ? !item.transparentBg
                  : true;
            const shadow = Boolean(
              item.showShadow || item.boxShadow || item.imageShadow,
            );
            normalized[k] = {
              showBorder: border,
              showWhiteBg: whiteBg,
              showShadow: shadow,
            };
          });
          setImageSettings(normalized);
        }
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
        if (rawOtherDetails._lockedSections) {
          setLockedSections((prev) => ({
            ...prev,
            ...(rawOtherDetails._lockedSections as Record<string, boolean>),
          }));
        }
        if (rawOtherDetails._deletedStandardFieldIds) {
          setDeletedStandardFieldIds(
            rawOtherDetails._deletedStandardFieldIds as string[],
          );
        }
        if (rawOtherDetails._deletedDetailFields) {
          setDeletedDetailFields(
            rawOtherDetails._deletedDetailFields as DeletedDetailFieldItem[],
          );
        }
      },
    }));

    // ── Image Manipulation Handlers ───────────────────────────────────────────
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
      // Tabloid spread zoom factor 0.55
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

    // ── Helper: Render Modernized Image Slot ──────────────────────────────────
    const renderImageSlot = (
      key: keyof typeof images,
      className: string,
      placeholderText: string = "Select Image",
      isLogoSlot: boolean = false,
    ) => {
      const inputRef = fileInputRefs[key];
      const settings = imageSettings[key] || {
        showBorder: true,
        showWhiteBg: true,
        showShadow: false,
      };

      let effectiveClassName = className;
      if (!settings.showBorder) {
        effectiveClassName =
          effectiveClassName.replace(/\bborder\S*/g, "").trim() +
          " !border-transparent !border-0";
      } else if (isLogoSlot && !effectiveClassName.includes("border")) {
        effectiveClassName += " border border-gray-200";
      }

      if (!settings.showWhiteBg) {
        effectiveClassName =
          effectiveClassName.replace(/\bbg-\S*/g, "").trim() +
          " !bg-transparent";
      } else {
        if (!effectiveClassName.includes("bg-")) {
          effectiveClassName += " bg-white";
        }
      }

      // Conditional logo styling: strictly respect settings
      const logoStyles = isLogoSlot
        ? settings.showWhiteBg
          ? "bg-white"
          : "!bg-transparent shadow-none"
        : "";

      const containerStyle: React.CSSProperties = {
        backgroundColor: settings.showWhiteBg ? "#ffffff" : "transparent",
        borderColor: settings.showBorder ? undefined : "transparent",
        boxShadow: settings.showShadow
          ? "4px 4px 6px rgba(0, 0, 0, 0.75)"
          : "none",
      };

      const isHero = key === "image3" || key === "image9";
      const isLogo = isLogoSlot;
      const slotActive = isSlotActive(key);
      const topClass =
        key === "image3"
          ? "top-[88px]"
          : key === "image9"
            ? "top-[52px]"
            : isLogo
              ? "top-1.5"
              : "top-2";

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
          <BoxIndicator isVisible={slotActive} />

          {/* Top-Left Image Controls Toolbar: Border, Shadow, White Background */}
          <div
            data-html2canvas-ignore="true"
            className={`absolute ${topClass} ${
              isHero ? "left-3" : isLogo ? "left-1.5" : "left-2"
            } z-30 flex ${isLogo ? "gap-0.5" : "gap-1"} ${
              slotActive
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            } print:hidden`}
          >
            {/* Button 1: Border Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleImageSetting(key, "showBorder");
              }}
              className={`${
                isLogo ? "p-1" : "p-1.5"
              } rounded-full shadow text-xs transition-colors ${
                settings.showBorder
                  ? "bg-[#8B3DFF] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              title={settings.showBorder ? "Hide Border" : "Show Border"}
            >
              <Square className={isLogo ? "w-3 h-3" : "w-3.5 h-3.5"} />
            </button>

            {/* Button 2: Shadow Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleImageSetting(key, "showShadow");
              }}
              className={`${
                isLogo ? "p-1" : "p-1.5"
              } rounded-full shadow text-xs transition-colors ${
                settings.showShadow
                  ? "bg-[#8B3DFF] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              title={settings.showShadow ? "Hide Shadow" : "Show Shadow"}
            >
              <Layers className={isLogo ? "w-3 h-3" : "w-3.5 h-3.5"} />
            </button>

            {/* Button 3: White Background Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleImageSetting(key, "showWhiteBg");
              }}
              className={`${
                isLogo ? "p-1" : "p-1.5"
              } rounded-full shadow text-xs transition-colors ${
                settings.showWhiteBg
                  ? "bg-[#8B3DFF] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              title={
                settings.showWhiteBg
                  ? "Hide White Background (Make Transparent)"
                  : "Show White Background"
              }
            >
              <Sun className={isLogo ? "w-3 h-3" : "w-3.5 h-3.5"} />
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
                <div
                  className={`absolute ${
                    isLogo
                      ? "bottom-1.5 left-1.5 gap-1"
                      : "bottom-1 left-1 gap-2"
                  } flex ${
                    slotActive
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  } z-30`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoom(key, "in");
                    }}
                    className={`bg-white ${
                      isLogo ? "p-1" : "p-1.5"
                    } rounded-full shadow hover:bg-gray-100`}
                    title="Zoom In"
                  >
                    <ZoomIn
                      className={`${isLogo ? "w-3 h-3" : "w-3.5 h-3.5"} text-gray-700`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoom(key, "out");
                    }}
                    className={`bg-white ${
                      isLogo ? "p-1" : "p-1.5"
                    } rounded-full shadow hover:bg-gray-100`}
                    title="Zoom Out"
                  >
                    <ZoomOut
                      className={`${isLogo ? "w-3 h-3" : "w-3.5 h-3.5"} text-gray-700`}
                    />
                  </button>
                </div>

                {/* Rotate — Standalone Absolute Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate(key);
                  }}
                  className={`absolute ${topClass} ${
                    isHero
                      ? "right-[76px]"
                      : isLogo
                        ? "right-[52px]"
                        : "right-[72px]"
                  } z-30 bg-white ${
                    isLogo ? "p-1" : "p-1.5"
                  } rounded-full shadow hover:bg-gray-100 ${
                    slotActive
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  } print:hidden`}
                  title="Rotate image"
                >
                  <RotateCw
                    className={`${isLogo ? "w-3 h-3" : "w-3.5 h-3.5"} text-gray-700`}
                  />
                </button>

                {/* Edit — Standalone Absolute Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageSourceModal(key, e);
                  }}
                  className={`absolute ${topClass} ${
                    isHero ? "right-11" : isLogo ? "right-7" : "right-10"
                  } z-30 bg-white ${
                    isLogo ? "p-1" : "p-1.5"
                  } rounded-full shadow hover:bg-gray-100 ${
                    slotActive
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  }`}
                  title="Edit image"
                >
                  <Pencil
                    className={`${isLogo ? "w-3 h-3" : "w-3.5 h-3.5"} text-gray-700`}
                  />
                </button>

                {/* Delete — Standalone Absolute Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(key, inputRef);
                  }}
                  className={`absolute ${topClass} ${
                    isHero ? "right-3" : isLogo ? "right-1.5" : "right-2"
                  } z-30 bg-white ${
                    isLogo ? "p-1" : "p-1.5"
                  } rounded-full shadow hover:bg-gray-100 ${
                    slotActive
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  }`}
                  title="Delete image"
                >
                  <Trash
                    className={`${isLogo ? "w-3 h-3" : "w-3.5 h-3.5"} text-red-500`}
                  />
                </button>
              </>
            ) : (
              /* Empty state placeholder — MUST have data-html2canvas-ignore="true" */
              <div
                data-html2canvas-ignore="true"
                onClick={(e) => openImageSourceModal(key, e)}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 text-center px-2"
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
            className="flex items-stretch pdf-page bg-[#2E4F23] shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
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
              {/* CONTAINER 3: Inner Content Container */}
              <div className="w-full h-full flex gap-8 p-[20px] relative z-10 font-alexandria text-white">
                {/* ─────────────────────────────────────────────────────────────
                    PAGE 4: Left Half (Floor Plan + Contact Info + Logo)
                   ───────────────────────────────────────────────────────────── */}
                <div className="w-1/2 flex flex-col relative z-[1] h-full gap-3">
                  {/* image1: Large Floor Plan / Feature Photo - takes all available height */}
                  <div className="w-full flex-1 min-h-0 relative">
                    {renderImageSlot(
                      "image1",
                      "w-full h-full border-[2px] border-white shadow-sm place-self-center bg-white",
                      "Select Floor Plan / Image 1",
                    )}
                  </div>

                  {/* Contact & Disclaimer Section Container - strictly fixed height, cannot expand */}
                  <div
                    data-safezone-container="true"
                    className={`flex items-end justify-between w-full h-[165px] shrink-0 overflow-hidden relative z-[19] border-[3.5px] border-solid border-transparent rounded-lg transition-all duration-150 group/sec ${
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

                    {/* Left Column: Contact details + Disclaimer + Print credit */}
                    <div className="flex flex-col flex-1 max-w-[500px] h-full justify-between gap-1 overflow-hidden">
                      {/* Agent Details: Name, Brokerage, Phone, Email */}
                      <div className="flex flex-col gap-0.5">
                        {/* CONTACT label */}
                        <StyledInput
                          value={contactLabel}
                          onChange={(e) => setContactLabel(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("contactLabel", s)
                          }
                          inputStyle={fieldStyles.contactLabel}
                          className="text-[13px] text-[#B3B394] font-semibold bg-transparent text-left focus:outline-none border-none placeholder-[#B3B394] tracking-wider"
                          placeholder="CONTACT:"
                          wrapperClassName="w-auto shrink-0"
                        />

                        {/* Full Name */}
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
                              onChange={(e) => setFullName(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("fullName", s)
                              }
                              inputStyle={fieldStyles.fullName}
                              className="text-[13px] text-[#B3B394] font-bold h-[20px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#B3B394] uppercase tracking-wide"
                              placeholder="FIRSTNAME LASTNAME"
                            />
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
                              onChange={(e) => setPropertyName(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("propertyName", s)
                              }
                              inputStyle={fieldStyles.propertyName}
                              className="text-[13px] font-normal h-[20px] bg-transparent text-left text-white w-full focus:outline-none border-none placeholder-white"
                              placeholder="Macdonald Realty"
                            />
                          </DraggableBox>
                        )}

                        {/* Phone */}
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
                            <div className="flex items-center gap-1 font-light text-[13px] text-white">
                              <StyledInput
                                value={phoneLabel}
                                onChange={(e) => setPhoneLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("phoneLabel", s)
                                }
                                inputStyle={fieldStyles.phoneLabel}
                                className="text-[13px] font-normal text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                                placeholder="Phone:"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("number", s)
                                }
                                inputStyle={fieldStyles.number}
                                className="font-light text-[13px] h-[20px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white"
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
                            <div className="flex items-center gap-1 font-light text-[13px] text-white">
                              <StyledInput
                                value={emailLabel}
                                onChange={(e) => setEmailLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("emailLabel", s)
                                }
                                inputStyle={fieldStyles.emailLabel}
                                className="text-[13px] font-normal text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                                placeholder="Email:"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("email", s)
                                }
                                inputStyle={fieldStyles.email}
                                className="font-light text-[13px] h-[20px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white"
                                placeholder="firstname@last.com"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

                      {/* Disclaimer and Real Estate Icons */}
                      <div className="flex gap-2 items-start text-white">
                        <span className="flex flex-col mt-0.5 shrink-0 gap-1">
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
                        {!isFieldDeleted("contactDisclaimer") && (
                          <DraggableBox
                            id="contactDisclaimer"
                            position={fieldPositions.contactDisclaimer}
                            onPositionChange={updateFieldPosition}
                            label="Disclaimer"
                            zoom={0.55}
                            disabled={lockedSections.contact}
                            onDelete={() =>
                              removeStandardField(
                                "contactDisclaimer",
                                "Disclaimer",
                                disclaimerText,
                                "Page 4 - Contact",
                                fieldStyles.disclaimerText,
                              )
                            }
                            deleteTitle="Remove Disclaimer"
                          >
                            <p
                              style={{
                                fontSize:
                                  fieldStyles.disclaimerText?.fontSize || "8px",
                                fontWeight:
                                  fieldStyles.disclaimerText?.fontWeight ||
                                  "400",
                                fontFamily:
                                  fieldStyles.disclaimerText?.fontFamily ||
                                  "inherit",
                                color:
                                  fieldStyles.disclaimerText?.color ||
                                  "inherit",
                                textAlign:
                                  (fieldStyles.disclaimerText
                                    ?.textAlign as any) || "left",
                              }}
                              className="text-[8px] font-normal text-white/90 leading-tight w-full select-none line-clamp-3 m-0"
                            >
                              {disclaimerText}
                            </p>
                          </DraggableBox>
                        )}
                      </div>

                      {/* Print Credit */}
                      {!isFieldDeleted("printedByText") && (
                        <DraggableBox
                          id="printedByText"
                          position={fieldPositions.printedByText}
                          onPositionChange={updateFieldPosition}
                          label="Print Credit"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "printedByText",
                              "Print Credit",
                              printedByText,
                              "Page 4 - Contact",
                              fieldStyles.printedByText,
                            )
                          }
                          deleteTitle="Remove Print Credit"
                        >
                          <StyledInput
                            value={printedByText}
                            onChange={(e) => setPrintedByText(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("printedByText", s)
                            }
                            inputStyle={fieldStyles.printedByText}
                            className="text-[11px] font-bold text-white bg-transparent text-left focus:outline-none border-none placeholder-white uppercase whitespace-nowrap"
                            placeholder="DESIGNED AND PRINTED BY BC FLOOR PLANS"
                          />
                        </DraggableBox>
                      )}
                    </div>

                    {/* image2: Page 4 Agent Logo Card */}
                    <div className="w-[205px] h-[110px] shrink-0 flex items-center justify-center mb-0.5 relative">
                      {renderImageSlot(
                        "image2",
                        "w-full h-full rounded-sm p-1",
                        "Select Logo",
                        true,
                      )}
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    PAGE 1: Right Half (Cover Hero + Address + 4 Photos + Price)
                   ───────────────────────────────────────────────────────────── */}
                <div className="w-1/2 flex flex-col justify-between relative z-[1] h-full">
                  {/* Hero Cover Image (image3) with Address Overlay - Increased height */}
                  <div className="relative w-full h-[460px] z-10 shrink-0">
                    {renderImageSlot(
                      "image3",
                      "w-full h-full border-[2px] border-white shadow-sm place-self-center",
                      "Select Cover Hero Image",
                    )}

                    {/* Address Overlay Container */}
                    <div
                      data-safezone-container="true"
                      className={`absolute top-0 left-0 right-0 py-2.5 px-4 bg-white/75 backdrop-blur-sm shadow-sm z-[19] flex flex-col items-center justify-center border-[3.5px] border-solid border-transparent rounded-b-lg transition-all duration-150 group/sec ${
                        lockedSections.address
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

                      <div className="text-[24px] font-light leading-none text-[#2E4F23] flex items-center justify-center gap-1 flex-nowrap">
                        {/* # Code */}
                        {!isFieldDeleted("addressCode") && (
                          <DraggableBox
                            id="addressCode"
                            position={fieldPositions.addressCode}
                            onPositionChange={updateFieldPosition}
                            label="MLS / Suite"
                            zoom={0.55}
                            disabled={lockedSections.address}
                            onDelete={() =>
                              removeStandardField(
                                "addressCode",
                                "MLS / Suite #",
                                addressCode,
                                "Page 1 - Address",
                                fieldStyles.addressCode,
                              )
                            }
                            deleteTitle="Remove MLS/Suite #"
                          >
                            <div className="flex items-center gap-0.5">
                              <StyledInput
                                value={addressHashLabel}
                                onChange={(e) =>
                                  setAddressHashLabel(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("addressHashLabel", s)
                                }
                                inputStyle={fieldStyles.addressHashLabel}
                                className="text-[20px] text-[#2E4F23] bg-transparent focus:outline-none border-none whitespace-nowrap"
                                placeholder="#"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={addressCode}
                                onChange={(e) => setAddressCode(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("addressCode", s)
                                }
                                inputStyle={fieldStyles.addressCode}
                                className="font-light text-[24px] h-[28px] w-[140px] leading-none bg-transparent text-[#2E4F23] text-left focus:outline-none border-none placeholder-[#2E4F23] placeholder:font-[200]"
                                placeholder="0000-0000"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {/* Number Road */}
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
                            <div className="flex items-center gap-1 text-[#2E4F23]">
                              <StyledInput
                                value={roadLabelBefore}
                                onChange={(e) =>
                                  setRoadLabelBefore(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("roadLabelBefore", s)
                                }
                                inputStyle={fieldStyles.roadLabelBefore}
                                className="text-[24px] font-light text-[#2E4F23] bg-transparent focus:outline-none border-none whitespace-nowrap"
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
                                className="font-light text-[24px] h-[28px] leading-none bg-transparent text-[#2E4F23] text-center w-[60px] focus:outline-none border-none placeholder-[#2E4F23] placeholder:font-[200]"
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
                                className="text-[24px] font-light text-[#2E4F23] bg-transparent focus:outline-none border-none whitespace-nowrap"
                                placeholder="ROAD"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

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
                          <StyledInput
                            value={cityLine}
                            onChange={(e) => setCityLine(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("cityLine", s)
                            }
                            inputStyle={fieldStyles.cityLine}
                            className="text-[#2E4F23] text-[11px] h-[20px] bg-transparent text-center w-[320px] focus:outline-none border-none placeholder-[#2E4F23] placeholder:font-[200] uppercase tracking-[0.25em]"
                            placeholder="BRIGHOUSE SOUTH, RICHMOND"
                          />
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  {/* 4 Photos Grid (image4 - image7) with Overlapping Centered Logo (image8)
                      Increased height for each image (170px) and 40px overlap with main image */}
                  <div className="relative w-full -mt-[100px] z-20 shrink-0 px-16">
                    <div className="grid grid-cols-2 gap-2.5 w-full">
                      {/* image4 */}
                      <div className="w-full h-[170px] relative">
                        {renderImageSlot(
                          "image4",
                          "w-full h-full border-[2px] border-white shadow-md place-self-center",
                          "Select Image 4",
                        )}
                      </div>
                      {/* image5 */}
                      <div className="w-full h-[170px] relative">
                        {renderImageSlot(
                          "image5",
                          "w-full h-full border-[2px] border-white shadow-md place-self-center",
                          "Select Image 5",
                        )}
                      </div>
                      {/* image6 */}
                      <div className="w-full h-[170px] relative">
                        {renderImageSlot(
                          "image6",
                          "w-full h-full border-[2px] border-white shadow-md place-self-center",
                          "Select Image 6",
                        )}
                      </div>
                      {/* image7 */}
                      <div className="w-full h-[170px] relative">
                        {renderImageSlot(
                          "image7",
                          "w-full h-full border-[2px] border-white shadow-md place-self-center",
                          "Select Image 7",
                        )}
                      </div>
                    </div>

                    {/* image8: Floating Center Logo overlapping all 4 photos */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[160px] h-[82px] flex items-center justify-center">
                      {renderImageSlot(
                        "image8",
                        "w-full h-full rounded-sm p-1",
                        "Select Logo",
                        true,
                      )}
                    </div>
                  </div>

                  {/* Headline and Price Container */}
                  <div
                    data-safezone-container="true"
                    className={`text-[#B3B394] w-full text-center flex flex-col items-center justify-center border-[3.5px] border-solid border-transparent rounded-lg p-1.5 transition-all duration-150 group/sec ${
                      lockedSections.price
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
                        toggleSectionLock("price");
                      }}
                      className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                    {/* Headline */}
                    {!isFieldDeleted("headline") && (
                      <DraggableBox
                        id="headline"
                        position={fieldPositions.headline}
                        onPositionChange={updateFieldPosition}
                        label="Headline"
                        zoom={0.55}
                        disabled={lockedSections.price}
                        onDelete={() =>
                          removeStandardField(
                            "headline",
                            "Headline",
                            headline,
                            "Page 1 - Price",
                            fieldStyles.headline,
                          )
                        }
                        deleteTitle="Remove Headline"
                      >
                        <StyledInput
                          value={headline}
                          rows={2}
                          onChange={(e) => setHeadline(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("headline", s)}
                          inputStyle={fieldStyles.headline}
                          className="font-normal text-center text-[#B3B394] text-[13.5px] leading-snug bg-transparent w-full focus:outline-none border-none placeholder-[#B3B394] uppercase tracking-wider"
                          placeholder="ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING."
                        />
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
                        disabled={lockedSections.price}
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
                          onChange={(e) => setAmount(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("amount", s)}
                          inputStyle={fieldStyles.amount}
                          className="font-light text-center text-[#B3B394] text-[38px] h-[48px] leading-none bg-transparent w-full focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[300]"
                          placeholder="$000,000"
                        />
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
            className="flex items-stretch pdf-page bg-[#2E4F23] shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
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
              {/* CONTAINER 3: Inner Content Container */}
              <div className="w-full h-full flex gap-8 p-[20px] relative z-10 font-alexandria text-white">
                {/* ─────────────────────────────────────────────────────────────
                    PAGE 2: Left Half (Top Photos + Description + Details + Bottom Photo w/ Specs)
                   ───────────────────────────────────────────────────────────── */}
                <div className="w-1/2 flex flex-col justify-between relative z-[1] h-full gap-2.5">
                  {/* Top 2 Photos Grid (image10 & image11) */}
                  <div className="grid grid-cols-2 gap-5 w-full h-[210px] shrink-0">
                    <div className="h-[210px] relative">
                      {renderImageSlot(
                        "image10",
                        "w-full h-full border-[2px] border-white shadow-md place-self-center",
                      )}
                    </div>
                    <div className="h-[210px] relative">
                      {renderImageSlot(
                        "image11",
                        "w-full h-full border-[2px] border-white shadow-md place-self-center",
                      )}
                    </div>
                  </div>

                  {/* Middle Text Section: Description + 3-Column Details */}
                  <div className="flex flex-col gap-1.5 w-full flex-1 min-h-0 justify-between">
                    {/* Description Container - flex-1 with fixed min height */}
                    <div
                      data-safezone-container="true"
                      className={`relative w-full flex-1 min-h-[85px] flex flex-col justify-start items-start border-[3.5px] border-solid border-transparent rounded-lg p-1 transition-all duration-150 group/sec ${
                        lockedSections.description
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
                          toggleSectionLock("description");
                        }}
                        className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                      {!isFieldDeleted("propertyDescription") && (
                        <DraggableBox
                          id="propertyDescription"
                          position={fieldPositions.propertyDescription}
                          onPositionChange={updateFieldPosition}
                          label="Description"
                          zoom={0.55}
                          disabled={lockedSections.description}
                          className="w-full h-auto"
                          containerClassName="w-full h-auto"
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
                            onChange={(e) => setDescription(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("description", s)
                            }
                            inputStyle={fieldStyles.description}
                            className="font-normal text-[9.5px] leading-[1.55] not-italic text-white bg-transparent text-left focus:outline-none border-none placeholder-white w-full h-auto min-h-[20px] resize-none"
                            placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South West providing unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge private balcony, great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your viewing. MLS # 000000"
                          />
                        </DraggableBox>
                      )}
                    </div>

                    {/* 3-Column Detail Fields Container - strictly fixed height */}
                    <div
                      data-safezone-container="true"
                      className={`relative w-full h-[145px] shrink-0 overflow-hidden border-[3.5px] border-solid border-transparent rounded-lg p-1 transition-all duration-150 group/sec ${
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
                        className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                      <div className="grid grid-cols-3 gap-3 w-full text-white">
                        {/* Column 1 */}
                        <div className="space-y-1.5">
                          {col1DetailFields.map((field) => (
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
                            >
                              <DetailFieldRow
                                field={field}
                                onTitleChange={(t) =>
                                  updateDetailTitle(field.id, t)
                                }
                                onTitleStyleChange={(s) =>
                                  updateDetailTitleStyle(field.id, s)
                                }
                                onValueChange={(v) =>
                                  updateDetailValue(field.id, v)
                                }
                                onStyleChange={(s) =>
                                  updateDetailStyle(field.id, s)
                                }
                                onRemove={
                                  lockedSections.details
                                    ? undefined
                                    : () => removeDetailField(field.id)
                                }
                              />
                            </DraggableBox>
                          ))}
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-1.5">
                          {col2DetailFields.map((field) => (
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
                            >
                              <DetailFieldRow
                                field={field}
                                onTitleChange={(t) =>
                                  updateDetailTitle(field.id, t)
                                }
                                onTitleStyleChange={(s) =>
                                  updateDetailTitleStyle(field.id, s)
                                }
                                onValueChange={(v) =>
                                  updateDetailValue(field.id, v)
                                }
                                onStyleChange={(s) =>
                                  updateDetailStyle(field.id, s)
                                }
                                onRemove={
                                  lockedSections.details
                                    ? undefined
                                    : () => removeDetailField(field.id)
                                }
                              />
                            </DraggableBox>
                          ))}
                        </div>

                        {/* Column 3 */}
                        <div className="space-y-1.5">
                          {col3DetailFields.map((field) => (
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
                            >
                              <DetailFieldRow
                                field={field}
                                onTitleChange={(t) =>
                                  updateDetailTitle(field.id, t)
                                }
                                onTitleStyleChange={(s) =>
                                  updateDetailTitleStyle(field.id, s)
                                }
                                onValueChange={(v) =>
                                  updateDetailValue(field.id, v)
                                }
                                onStyleChange={(s) =>
                                  updateDetailStyle(field.id, s)
                                }
                                onRemove={
                                  lockedSections.details
                                    ? undefined
                                    : () => removeDetailField(field.id)
                                }
                              />
                            </DraggableBox>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Image (image9) with Specs Bar Overlay - strictly fixed height */}
                  <div className="w-full h-[400px] shrink-0 relative">
                    {renderImageSlot(
                      "image9",
                      "w-full h-full border-[2px] border-white shadow-md place-self-center",
                      "Select Bottom Image",
                    )}

                    {/* Specs Overlay Container */}
                    <div
                      data-safezone-container="true"
                      className={`absolute top-0 left-0 font-alexandria right-0 py-2.5 px-4  z-[19] flex items-center justify-center gap-2 border-[3.5px] border-solid border-transparent transition-all duration-150 group/sec text-[#2E4F23] ${
                        lockedSections.specs
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
                          toggleSectionLock("specs");
                        }}
                        className={`absolute top-1.5 right-2 z-30 p-3 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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
                              inputStyle={
                                fieldStyles.bedroom
                                  ? {
                                      ...DEFAULT_SPEC_STYLE,
                                      ...fieldStyles.bedroom,
                                    }
                                  : DEFAULT_SPEC_STYLE
                              }
                              className="font-bold font-alexandria text-[16px] bg-transparent text-right w-[30px] focus:outline-none border-none text-[#2E4F23]"
                              placeholder="0"
                            />
                            <StyledInput
                              value={bedroomLabel}
                              onChange={(e) => setBedroomLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bedroomLabel", s)
                              }
                              inputStyle={
                                fieldStyles.bedroomLabel
                                  ? {
                                      ...DEFAULT_SPEC_STYLE,
                                      ...fieldStyles.bedroomLabel,
                                    }
                                  : DEFAULT_SPEC_STYLE
                              }
                              className="font-bold font-alexandria text-[16px] text-[#2E4F23] bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="BEDROOM |"
                              wrapperClassName="w-auto shrink-0"
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
                              inputStyle={
                                fieldStyles.bathroom
                                  ? {
                                      ...DEFAULT_SPEC_STYLE,
                                      ...fieldStyles.bathroom,
                                    }
                                  : DEFAULT_SPEC_STYLE
                              }
                              className="font-bold font-alexandria text-[16px] bg-transparent text-right w-[30px] focus:outline-none border-none text-[#2E4F23]"
                              placeholder="0"
                            />
                            <StyledInput
                              value={bathroomLabel}
                              onChange={(e) => setBathroomLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bathroomLabel", s)
                              }
                              inputStyle={
                                fieldStyles.bathroomLabel
                                  ? {
                                      ...DEFAULT_SPEC_STYLE,
                                      ...fieldStyles.bathroomLabel,
                                    }
                                  : DEFAULT_SPEC_STYLE
                              }
                              className="font-bold font-alexandria text-[16px] text-[#2E4F23] bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="BATHROOM |"
                              wrapperClassName="w-auto shrink-0"
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
                          label="Sq Ft"
                          zoom={0.55}
                          disabled={lockedSections.specs}
                          onDelete={() =>
                            removeStandardField(
                              "specSqft",
                              "Sq Ft",
                              sqft,
                              "Page 2 - Specs",
                              fieldStyles.sqft,
                            )
                          }
                          deleteTitle="Remove Sq Ft"
                        >
                          <div className="flex items-center gap-1">
                            <StyledInput
                              value={sqft}
                              onChange={(e) => setSqft(e.target.value)}
                              onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                              inputStyle={
                                fieldStyles.sqft
                                  ? {
                                      ...DEFAULT_SPEC_STYLE,
                                      ...fieldStyles.sqft,
                                    }
                                  : DEFAULT_SPEC_STYLE
                              }
                              className="font-bold font-alexandria text-[16px] bg-transparent text-right w-[55px] focus:outline-none border-none text-[#2E4F23]"
                              placeholder="000"
                            />
                            <StyledInput
                              value={sqftLabel}
                              onChange={(e) => setSqftLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("sqftLabel", s)
                              }
                              inputStyle={
                                fieldStyles.sqftLabel
                                  ? {
                                      ...DEFAULT_SPEC_STYLE,
                                      ...fieldStyles.sqftLabel,
                                    }
                                  : DEFAULT_SPEC_STYLE
                              }
                              className="font-bold font-alexandria text-[16px] text-[#2E4F23] bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="SQ FT |"
                              wrapperClassName="w-auto shrink-0"
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
                              "Page 2 - Specs",
                              fieldStyles.builtYear,
                            )
                          }
                          deleteTitle="Remove Built Year"
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
                              inputStyle={
                                fieldStyles.builtYearLabel
                                  ? {
                                      ...DEFAULT_SPEC_STYLE,
                                      ...fieldStyles.builtYearLabel,
                                    }
                                  : DEFAULT_SPEC_STYLE
                              }
                              className="font-bold font-alexandria text-[16px] text-[#2E4F23] bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="BUILT IN"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={builtYear}
                              onChange={(e) => setBuiltYear(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("builtYear", s)
                              }
                              inputStyle={
                                fieldStyles.builtYear
                                  ? {
                                      ...DEFAULT_SPEC_STYLE,
                                      ...fieldStyles.builtYear,
                                    }
                                  : DEFAULT_SPEC_STYLE
                              }
                              className="font-bold font-alexandria text-[16px] bg-transparent text-left w-[55px] focus:outline-none border-none text-[#2E4F23]"
                              placeholder="0000"
                            />
                          </div>
                        </DraggableBox>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    PAGE 3: Right Half (5 Feature Photos Gallery)
                   ───────────────────────────────────────────────────────────── */}
                <div className="w-1/2 flex flex-col justify-between relative z-[1] h-full gap-5">
                  {/* Top 2 Photos (image12 & image13) */}
                  <div className="grid grid-cols-2 gap-5 w-full h-[210px] shrink-0">
                    <div className="h-[210px] relative">
                      {renderImageSlot(
                        "image12",
                        "w-full h-full border-[2px] border-white shadow-md place-self-center",
                      )}
                    </div>
                    <div className="h-[210px] relative">
                      {renderImageSlot(
                        "image13",
                        "w-full h-full border-[2px] border-white shadow-md place-self-center",
                      )}
                    </div>
                  </div>

                  {/* Middle Photo (image14) */}
                  <div className="w-full flex-1 min-h-[380px] relative">
                    {renderImageSlot(
                      "image14",
                      "w-full h-full border-[2px] border-white shadow-md place-self-center",
                    )}
                  </div>

                  {/* Bottom 2 Photos (image15 & image16) */}
                  <div className="grid grid-cols-2 gap-5 w-full h-[210px] shrink-0">
                    <div className="h-[210px] relative">
                      {renderImageSlot(
                        "image15",
                        "w-full h-full border-[2px] border-white shadow-md place-self-center",
                      )}
                    </div>
                    <div className="h-[210px] relative">
                      {renderImageSlot(
                        "image16",
                        "w-full h-full border-[2px] border-white shadow-md place-self-center",
                      )}
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

BcfpStandard10.displayName = "BcfpStandard10";

export default BcfpStandard10;
