import {
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
import StyledInput, { FontFolderProvider } from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";

export interface BcfpStandard4Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard4Props {
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

// ─── DetailFieldRow ────────────────────────────────────────────────────────────
// Renders a single editable title + editable value input row.
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
}) => {
  const sharedFontFamily =
    field.style?.fontFamily || field.titleStyle?.fontFamily;

  const effectiveTitleStyle: TextStyle = {
    fontSize: field.titleStyle?.fontSize || "8px",
    fontWeight: field.titleStyle?.fontWeight,
    fontFamily: field.titleStyle?.fontFamily || sharedFontFamily,
    color: field.titleStyle?.color,
    textAlign: field.titleStyle?.textAlign,
  };

  const effectiveValueStyle: TextStyle = {
    fontSize: field.style?.fontSize || "10px",
    fontWeight: field.style?.fontWeight,
    fontFamily: field.style?.fontFamily || sharedFontFamily,
    color: field.style?.color,
    textAlign: field.style?.textAlign,
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 relative">
        <StyledInput
          value={field.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onChangeStyle={onTitleStyleChange}
          inputStyle={effectiveTitleStyle}
          className="font-bold text-[#00B9F2] text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 uppercase"
          placeholder="ENTER TITLE HERE"
        />
      </div>
      <StyledInput
        value={field.value}
        onChange={(e) => onValueChange(e.target.value)}
        onChangeStyle={onStyleChange}
        inputStyle={effectiveValueStyle}
        className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
        placeholder="Enter details here"
      />
    </div>
  );
};

// Default detail fields — defined at module scope
const DEFAULT_LEFT_DETAIL_FIELDS: DetailField[] = [
  { id: "byLawRestrictions", title: "BY-LAW RESTRICTIONS:", value: "" },
  { id: "maintFees", title: "MAINT. FEES:", value: "" },
  { id: "maintFeesInclude", title: "MAINT. FEES INCLUDE:", value: "" },
  { id: "featuresIncluded", title: "FEATURES INCLUDED:", value: "" },
];

const DEFAULT_RIGHT_DETAIL_FIELDS: DetailField[] = [
  { id: "siteInfluences", title: "SITE INFLUENCES:", value: "" },
  { id: "amenities", title: "AMENITIES:", value: "" },
  { id: "view", title: "VIEW:", value: "" },
  { id: "mlsNumber", title: "MLS#:", value: "" },
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
  "priceAmount",
  "propertyDescription",
  "specBedroom",
  "specBathroom",
  "specSqft",
  "specBuiltYear",
]);

/** Helper to convert a font-family class/string to full CSS font-family value for inline styling */
// function getFontFamilyCss(ff?: string): string | undefined {
//   if (!ff) return undefined;
//   const f = ff.toLowerCase();
//   if (f.includes("alexandria")) return "Alexandria, sans-serif";
//   if (f.includes("raleway")) return "Raleway, sans-serif";
//   if (
//     f.includes("acaslonproitalic") ||
//     (f.includes("caslon") && f.includes("italic"))
//   )
//     return "ACaslonProItalic, serif";
//   if (
//     f.includes("acaslonproregular") ||
//     (f.includes("caslon") && f.includes("regular"))
//   )
//     return "ACaslonProRegular, serif";
//   if (
//     f.includes("acaslonprobold") ||
//     (f.includes("caslon") && f.includes("bold"))
//   )
//     return "ACaslonProBold, serif";
//   if (f.includes("acaslonpro") || f.includes("caslon"))
//     return "ACaslonProBold, serif";
//   if (
//     f.includes("bickhamscriptregular") ||
//     (f.includes("bickham") && f.includes("regular"))
//   )
//     return "BickhamScriptRegular, cursive";
//   if (
//     f.includes("bickhamscriptbold") ||
//     f.includes("bickhamscript") ||
//     f.includes("bickham")
//   )
//     return "BickhamScriptBold, cursive";
//   if (
//     f.includes("gothicbold") ||
//     f.includes("gothic bold") ||
//     f.includes("gothic-bold")
//   )
//     return "GothicBold, sans-serif";
//   if (f.includes("gothicregular") || f.includes("gothic"))
//     return "GothicRegular, sans-serif";
//   if (
//     f.includes("trajanproregular") ||
//     (f.includes("trajan") && f.includes("regular"))
//   )
//     return "TrajanProRegular, serif";
//   if (f.includes("trajanpro") || f.includes("trajan"))
//     return "TrajanPro, serif";
//   if (
//     f.includes("arialboldbcfp4") ||
//     f.includes("arialbold") ||
//     f.includes("arial bold") ||
//     f.includes("arial")
//   )
//     return "ArialBoldBcfp4, sans-serif";
//   return ff;
// }

const BcfpStandard4 = forwardRef<BcfpStandard4Ref, BcfpStandard4Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

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
        prev.map((f) => {
          if (f.id !== id) return f;
          const updatedTitleStyle: TextStyle | undefined = style.fontFamily
            ? f.titleStyle
              ? { ...f.titleStyle, fontFamily: style.fontFamily }
              : { fontSize: "8px", fontFamily: style.fontFamily }
            : f.titleStyle;
          return { ...f, style, titleStyle: updatedTitleStyle };
        }),
      );
      setRightDetailFields((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const updatedTitleStyle: TextStyle | undefined = style.fontFamily
            ? f.titleStyle
              ? { ...f.titleStyle, fontFamily: style.fontFamily }
              : { fontSize: "8px", fontFamily: style.fontFamily }
            : f.titleStyle;
          return { ...f, style, titleStyle: updatedTitleStyle };
        }),
      );
    };

    const updateDetailTitleStyle = (id: string, style: TextStyle) => {
      setLeftDetailFields((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const updatedValueStyle: TextStyle | undefined = style.fontFamily
            ? f.style
              ? { ...f.style, fontFamily: style.fontFamily }
              : { fontSize: "10px", fontFamily: style.fontFamily }
            : f.style;
          return { ...f, titleStyle: style, style: updatedValueStyle };
        }),
      );
      setRightDetailFields((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const updatedValueStyle: TextStyle | undefined = style.fontFamily
            ? f.style
              ? { ...f.style, fontFamily: style.fontFamily }
              : { fontSize: "10px", fontFamily: style.fontFamily }
            : f.style;
          return { ...f, titleStyle: style, style: updatedValueStyle };
        }),
      );
    };

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
          const newDeletedDetailFields = [
            ...prevDetail.filter((f) => f.id !== id),
            deletedItem,
          ];
          updateFormData({
            deletedStandardFieldIds: newDeletedStandard,
            deletedDetailFields: newDeletedDetailFields,
          });
          return newDeletedDetailFields;
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
            section: "Page 2 - Details",
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
            section: "Page 2 - Details",
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
          ) {
            return;
          }
          const cleanField: DetailField = {
            id: field.id,
            title: field.title,
            value: field.value,
            style: field.style,
            titleStyle: field.titleStyle,
          };
          if (field.column === "right") {
            rightRestored.push(cleanField);
          } else {
            leftRestored.push(cleanField);
          }
        });

        if (leftRestored.length > 0) {
          setLeftDetailFields((prev) => [...prev, ...leftRestored]);
        }
        if (rightRestored.length > 0) {
          setRightDetailFields((prev) => [...prev, ...rightRestored]);
        }
        setDeletedStandardFieldIds([]);
        updateFormData({
          deletedStandardFieldIds: [],
          deletedDetailFields: [],
        });
        return [];
      });
    }, [deletedStandardFieldIds, updateFormData]);

    useEffect(() => {
      if (setRestoreDetailFieldHandler) {
        setRestoreDetailFieldHandler(() => restoreDetailField);
      }
      if (setRestoreAllDetailFieldsHandler) {
        setRestoreAllDetailFieldsHandler(() => restoreAllDetailFields);
      }
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

    // ── Field Value States ────────────────────────────────────────────────
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [amount, setAmount] = useState("");
    const [number, setNumber] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM •");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM •");
    const [sqftLabel, setSqftLabel] = useState("SQ FT •");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
    );

    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);

    const showBleed =
      propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide =
      propShowGuide !== undefined ? propShowGuide : showGuideState;

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
      specs: false,
      details: false,
    });

    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── Images States ──────────────────────────────────────────────────────
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

    // ── Image Input Refs ──────────────────────────────────────────────────
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

    // Auto-populate from orderData and context
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

          if (prop.suite) setAddressCode(prop.suite.toString());
          if (prop.address) setRoadName(prop.suite ?? "");

          let city = "";
          if (prop.city) city += prop.city;
          if (prop.province) city += (city ? ", " : "") + prop.province;
          if (prop.postal_code) city += (city ? " " : "") + prop.postal_code;
          if (city) setCityLine(prop.address || city);

          // Populate MLS Number from orderData
          if (prop.mls_number) {
            setRightDetailFields((prev) =>
              prev.map((f) =>
                f.id === "mlsNumber"
                  ? { ...f, value: prop.mls_number!.toString() }
                  : f,
              ),
            );
          }
        }

        if (agent) {
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if (agent.company_name) setPropertyName(agent.company_name);

          const agentLogo =
            (agent as any).company_logo_url ||
            (agent as any).logo_url ||
            (agent as any).logo ||
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
        leftDetailFields,
        rightDetailFields,
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
        deletedStandardFieldIds,
        deletedDetailFields,
      });
    }, [
      leftDetailFields,
      rightDetailFields,
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
      deletedStandardFieldIds,
      deletedDetailFields,
      updateFormData,
    ]);

    // ── Image Handlers ────────────────────────────────────────────────────
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

    const handleMouseUp = (key: keyof typeof images) =>
      setDragging((prev) => ({ ...prev, [key]: false }));
    const handleMouseLeave = (key: keyof typeof images) =>
      setDragging((prev) => ({ ...prev, [key]: false }));

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        return { ...prev, [key]: Math.min(Math.max(newScale, 0.1), 5) };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
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

    const handleImageChange = (
      key: keyof typeof images,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (e.target.files && e.target.files[0]) {
        setImages((prev) => ({
          ...prev,
          [key]: URL.createObjectURL(e.target.files![0]),
        }));
      }
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

    // ── Expose imperative methods to parent ──────────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard4",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#416173",
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
            (f) => f.id === "maintFees",
          )
            ? {
                value: leftDetailFields.find((f) => f.id === "maintFees")!
                  .title,
                style:
                  leftDetailFields.find((f) => f.id === "maintFees")!
                    .titleStyle || ({} as TextStyle),
              }
            : undefined,
          expandedDetail2Description: leftDetailFields.find(
            (f) => f.id === "maintFees",
          )
            ? {
                value: leftDetailFields.find((f) => f.id === "maintFees")!
                  .value,
                style:
                  leftDetailFields.find((f) => f.id === "maintFees")!.style ||
                  ({} as TextStyle),
              }
            : undefined,
          expandedDetail3Title: leftDetailFields.find(
            (f) => f.id === "maintFeesInclude",
          )
            ? {
                value: leftDetailFields.find(
                  (f) => f.id === "maintFeesInclude",
                )!.title,
                style:
                  leftDetailFields.find((f) => f.id === "maintFeesInclude")!
                    .titleStyle || ({} as TextStyle),
              }
            : undefined,
          expandedDetail3Description: leftDetailFields.find(
            (f) => f.id === "maintFeesInclude",
          )
            ? {
                value: leftDetailFields.find(
                  (f) => f.id === "maintFeesInclude",
                )!.value,
                style:
                  leftDetailFields.find((f) => f.id === "maintFeesInclude")!
                    .style || ({} as TextStyle),
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
                    "maintFees",
                    "maintFeesInclude",
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
            bedroom: {
              value: bedroom,
              style: fieldStyles.bedroom || ({} as TextStyle),
            },
            bathroom: {
              value: bathroom,
              style: fieldStyles.bathroom || ({} as TextStyle),
            },
            sqft: { value: sqft, style: fieldStyles.sqft || ({} as TextStyle) },
            builtYear: {
              value: builtYear,
              style: fieldStyles.builtYear || ({} as TextStyle),
            },
            number: {
              value: number,
              style: fieldStyles.number || ({} as TextStyle),
            },
            addressCode: {
              value: addressCode,
              style: fieldStyles.addressCode || ({} as TextStyle),
            },
            cityLine: {
              value: cityLine,
              style: fieldStyles.cityLine || ({} as TextStyle),
            },
            contactLabel: {
              value: contactLabel,
              style: fieldStyles.contactLabel || ({} as TextStyle),
            },
            phoneLabel: {
              value: phoneLabel,
              style: fieldStyles.phoneLabel || ({} as TextStyle),
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
        if (state.companyName) setPropertyName(s(state.companyName));
        const companyNameVal =
          s(state.companyName) || orderData?.agent?.company_name || "";
        const titleVal = s(state.propertyNotesTitle);
        if (titleVal === companyNameVal || !titleVal) {
          setRoadName(orderData?.property?.suite?.toString() ?? "");
        } else {
          setRoadName(titleVal);
        }
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
              "maintFees",
              "MAINT. FEES:",
              state.expandedDetail2Description,
              (payload.content as any).expandedDetail2Title,
            );
          if (state.expandedDetail3Description !== undefined)
            addField(
              reconstructedLeft,
              "maintFeesInclude",
              "MAINT. FEES INCLUDE:",
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
          if (rawOtherDetails.mlsNumber) {
            const f = rawOtherDetails.mlsNumber;
            reconstructedRight.push({
              id: "mlsNumber",
              title: f.title || "MLS#:",
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
          if (details.disclaimerText)
            setDisclaimerText(s(details.disclaimerText));
          if (details._lockedSections) {
            setLockedSections((prev) => ({
              ...prev,
              ...details._lockedSections,
            }));
          }
        }

        const styles: Record<string, TextStyle> = {};
        const c = payload.content;
        const st = (f: any) => (f as StyledTextField)?.style;

        if (st(c.offeredAtPrice)) {
          const s = st(c.offeredAtPrice);
          styles.amount =
            s.fontSize === "36px" ? { ...s, fontSize: "30px" } : s;
        }
        if (st(c.realtorName)) {
          const s = st(c.realtorName);
          styles.fullName =
            s.fontSize === "20px" ? { ...s, fontSize: "11px" } : s;
        }
        if (st(c.emailLink)) {
          const s = st(c.emailLink);
          styles.email = s.fontSize === "20px" ? { ...s, fontSize: "11px" } : s;
        }
        if (st(c.companyName)) {
          const s = st(c.companyName);
          styles.propertyName =
            s.fontSize === "20px" ? { ...s, fontSize: "11px" } : s;
        }
        if (st(c.propertyNotesTitle)) {
          const s = st(c.propertyNotesTitle);
          styles.roadName =
            s.fontSize === "28px" ? { ...s, fontSize: "30px" } : s;
        }
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
          if (st(od.contactLabel)) styles.contactLabel = st(od.contactLabel);
          if (st(od.phoneLabel)) styles.phoneLabel = st(od.phoneLabel);
          if (st(od.emailLabel)) styles.emailLabel = st(od.emailLabel);
          if (st(od.bedroomLabel)) styles.bedroomLabel = st(od.bedroomLabel);
          if (st(od.bathroomLabel)) styles.bathroomLabel = st(od.bathroomLabel);
          if (st(od.sqftLabel)) styles.sqftLabel = st(od.sqftLabel);
          if (st(od.builtYearLabel))
            styles.builtYearLabel = st(od.builtYearLabel);
          if (st(od.roadLabelBefore))
            styles.roadLabelBefore = st(od.roadLabelBefore);
          if (st(od.roadLabelAfter))
            styles.roadLabelAfter = st(od.roadLabelAfter);
          if (st(od.disclaimerText))
            styles.disclaimerText = st(od.disclaimerText);
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
      <FontFolderProvider value="BcfpStandard4">
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

          {/* pdf-page 1 */}
          <div
            className="flex items-stretch pdf-page bg-white shadow-[6px_6px_12px_rgba(0,0,0,0.85)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="w-full flex justify-center font-alexandria h-full relative z-10">
                {/* Page 1 Left Column */}
                <div className="w-1/2 flex flex-col justify-between relative h-full">
                  <div
                    className="p-[50px] flex-1 flex flex-col justify-center items-center bg-[#416173]"
                    style={{
                      marginTop: showBleed ? "-0.375in" : "-0.25in",
                      marginLeft: showBleed ? "-0.375in" : "-0.25in",
                      marginRight: showBleed ? "-0.375in" : "-0.25in",
                      width: showBleed
                        ? "calc(100% + 0.375in)"
                        : "calc(100% + 0.25in)",
                    }}
                  >
                    {/* image1 */}
                    <div
                      data-image-slot="true"
                      className="w-full h-full mb-[20px] place-self-center relative overflow-hidden group pb-2 cursor-pointer"
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
                            <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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

                  <div
                    className="relative shrink-0 mt-[-65px] z-10"
                    style={{
                      marginLeft: showBleed ? "-0.375in" : "-0.25in",
                      marginBottom: showBleed ? "-0.375in" : "-0.25in",
                      width: showBleed
                        ? "calc(100% + 0.375in)"
                        : "calc(100% + 0.25in)",
                    }}
                  >
                    {/* SVG Wave in DOM flow for html2canvas PDF capture */}
                    <svg
                      viewBox="163 79 631 114"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-[75px] block pointer-events-none relative z-10"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M793.592 138.135C793.592 138.135 655.583 191.415 440.821 116.535C226.06 41.6551 163 128.055 163 128.055V193H477.5H794L793.592 139.575"
                        fill="white"
                      />
                      <path
                        opacity={0.350006}
                        d="M794 115.5C794 115.5 656.323 173.19 441.12 104.904C225.916 36.6177 166 124.936 166 124.936L167.5 192.5H794V117.5"
                        fill="white"
                      />
                    </svg>

                    {/* Solid white card below wave curve with section lock */}
                    <div
                      data-safezone-container="true"
                      className={` relative z-10 text-black mt-[-35px] transition-all duration-150 group/sec border-[3.5px] border-solid border-transparent ${
                        lockedSections.contact
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                      style={{
                        paddingLeft: showBleed
                          ? "calc(0.375in + 20px)"
                          : "24px",
                        paddingRight: "185px",
                        paddingTop: "10px",
                        paddingBottom: showBleed
                          ? "calc(0.375in + 8px)"
                          : "12px",
                      }}
                    >
                      {/* Lock / Unlock Toggle Button */}
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
                              "Page 1 - Contact",
                              fieldStyles.fullName,
                            )
                          }
                          deleteTitle="Remove Agent Name"
                        >
                          <div className="font-bold text-[11px] pt-1 flex items-center gap-1">
                            <StyledInput
                              value={contactLabel}
                              onChange={(e) => setContactLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("contactLabel", s)
                              }
                              inputStyle={fieldStyles.contactLabel}
                              className="font-bold text-[11px] bg-transparent text-left focus:outline-none border-none placeholder-gray-400"
                              placeholder="CONTACT:"
                              wrapperClassName="w-auto shrink-0"
                            />
                            <StyledInput
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("fullName", s)
                              }
                              inputStyle={fieldStyles.fullName}
                              className="font-bold text-[11px] bg-transparent text-left focus:outline-none border-none placeholder-gray-400"
                              placeholder="Agent Full Name"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("propertyName") && (
                        <DraggableBox
                          id="propertyName"
                          position={fieldPositions.propertyName}
                          onPositionChange={updateFieldPosition}
                          label="Brokerage"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "propertyName",
                              "Brokerage",
                              propertyName,
                              "Page 1 - Contact",
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
                            className="text-[11px] font-thin h-[18px] bg-transparent text-left focus:outline-none border-none placeholder-gray-400"
                            placeholder="Brokerage Office Name"
                          />
                        </DraggableBox>
                      )}

                      <div className="flex gap-2">
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
                                number,
                                "Page 1 - Contact",
                                fieldStyles.phone,
                              )
                            }
                            deleteTitle="Remove Phone"
                          >
                            <div className="text-[11px] flex items-center gap-1">
                              <StyledInput
                                value={phoneLabel}
                                onChange={(e) => setPhoneLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("phoneLabel", s)
                                }
                                inputStyle={fieldStyles.phoneLabel}
                                className="font-semibold text-[11px] bg-transparent text-left focus:outline-none border-none placeholder-gray-400"
                                placeholder="PHONE:"
                                wrapperClassName="w-auto shrink-0"
                              />
                              <StyledInput
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("phone", s)
                                }
                                inputStyle={fieldStyles.phone}
                                className="text-[11px] bg-transparent text-left focus:outline-none border-none placeholder-gray-400"
                                placeholder="000.000.0000"
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
                                email,
                                "Page 1 - Contact",
                                fieldStyles.email,
                              )
                            }
                            deleteTitle="Remove Email"
                          >
                            <div className="text-[11px] flex items-center gap-1">
                              <StyledInput
                                value={emailLabel}
                                onChange={(e) => setEmailLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("emailLabel", s)
                                }
                                inputStyle={fieldStyles.emailLabel}
                                className="font-semibold text-[11px] bg-transparent text-left focus:outline-none border-none placeholder-gray-400"
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
                                className="text-[11px] bg-transparent text-left focus:outline-none border-none placeholder-gray-400"
                                placeholder="agent@email.com"
                                wrapperClassName="w-auto shrink-0"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

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
                              "Page 1 - Contact",
                              fieldStyles.disclaimerText,
                            )
                          }
                          deleteTitle="Remove Disclaimer"
                        >
                          <StyledInput
                            value={disclaimerText}
                            onChange={(e) => setDisclaimerText(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("disclaimerText", s)
                            }
                            inputStyle={fieldStyles.disclaimerText}
                            className="text-[6px] w-full leading-tight bg-transparent text-left focus:outline-none border-none placeholder-gray-400 font-[300]"
                            placeholder="Disclaimer text..."
                          />
                        </DraggableBox>
                      )}

                      <p className="font-bold text-[10px]">
                        DESIGNED AND PRINTED BY BC FLOOR PLANS
                      </p>

                      {/* image2 */}
                      <div
                        id="agentLogo2"
                        data-image-slot="true"
                        data-slot-type="logo"
                        data-logo-slot="true"
                        className="absolute right-[24px] top-[-35px] z-20 group cursor-pointer w-[140px] h-[77px] overflow-hidden"
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

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image2", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image2", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
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
                                onClick={(e) =>
                                  openImageSourceModal("image2", e)
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
                    </div>
                  </div>
                </div>

                {/* Page 1 Right Column */}
                <div
                  className="bg-[#416173] flex flex-col relative shrink-0"
                  style={{
                    width: showBleed
                      ? "calc(50% + 0.375in)"
                      : "calc(50% + 0.25in)",
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                    marginTop: showBleed ? "-0.375in" : "-0.25in",
                    marginBottom: showBleed ? "-0.375in" : "-0.25in",
                  }}
                >
                  <div className="relative z-10">
                    <svg
                      viewBox="163 83 631 114"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute top-0 right-0 left-0 w-full h-[180px] pointer-events-none"
                      preserveAspectRatio="none"
                    >
                      <g opacity={0.350006} filter="url(#filter0_d_20_1415)">
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
                          id="filter0_d_20_1415"
                          x={0.5}
                          y={0}
                          width={953.5}
                          height={433.744}
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood
                            floodOpacity={0}
                            result="BackgroundImageFix"
                          />
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
                            result="effect1_dropShadow_20_1415"
                          />
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_20_1415"
                            result="shape"
                          />
                        </filter>
                      </defs>
                    </svg>

                    {/* image3 */}
                    <div
                      id="agentLogo3"
                      data-image-slot="true"
                      data-slot-type="logo"
                      data-logo-slot="true"
                      className="absolute top-[50px] left-[68px] group cursor-pointer z-20 w-[170px] h-[94px] overflow-hidden"
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
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image3", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
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
                  </div>

                  {/* image4 */}
                  <div
                    data-image-slot="true"
                    className="w-full h-[580px] mt-[0px] place-self-center relative overflow-hidden group cursor-pointer"
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
                            />
                          </div>

                          {/* Zoom Controls */}
                          <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                            className="absolute top-24 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image4", e)}
                            className="absolute top-24 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image4", fileInputRef4)
                            }
                            className="absolute top-24 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image4", e)}
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

                  {/* 4 Bottom Grid Photos (image5, image6, image7, image8) */}
                  <div className="grid grid-cols-4">
                    {/* image5 */}
                    <div
                      data-image-slot="true"
                      className="h-[150px] relative group overflow-hidden cursor-pointer"
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
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image5", "in")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image5", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
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
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                    {/* image6 */}
                    <div
                      data-image-slot="true"
                      className="h-[150px] relative group overflow-hidden cursor-pointer"
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
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image6", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
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
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                      className="h-[150px] relative group overflow-hidden cursor-pointer"
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
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image7", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
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
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                    {/* image8 */}
                    <div
                      data-image-slot="true"
                      className="h-[150px] relative group overflow-hidden cursor-pointer"
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
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image8", "in")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image8", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
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
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                  </div>

                  {/* Text Info Section (Address & Price) with Section Lock */}
                  <div
                    data-safezone-container="true"
                    className={`text-white flex flex-col items-center justify-center py-10 gap-2 relative transition-all duration-150 group/sec rounded-lg border-[3.5px] border-solid border-transparent ${
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
                            "MLS / Suite",
                            addressCode,
                            "Page 1 - Address",
                            fieldStyles.addressCode,
                          )
                        }
                        deleteTitle="Remove MLS / Suite"
                      >
                        <div className="tracking-wide mt-0 flex items-center">
                          <span className="shrink-0">#</span>
                          <StyledInput
                            value={addressCode}
                            onChange={(e) => setAddressCode(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("addressCode", s)
                            }
                            inputStyle={fieldStyles.addressCode}
                            className="font-light text-[30px] h-[30px] w-[180px] leading-none mt-0 bg-transparent text-[#FFF] text-left focus:outline-none border-none placeholder-[#FFF] placeholder:font-[200]"
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
                      >
                        <div className="text-[60px] font-light leading-none mt-0 flex items-center">
                          <StyledInput
                            value={roadLabelBefore}
                            onChange={(e) => setRoadLabelBefore(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadLabelBefore", s)
                            }
                            inputStyle={fieldStyles.roadLabelBefore}
                            className="font-light text-[60px] leading-none bg-transparent text-white focus:outline-none border-none placeholder-white"
                            placeholder="Number"
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={roadName}
                            onChange={(e) => setRoadName(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadName", s)
                            }
                            inputStyle={fieldStyles.roadName}
                            className="font-light text-[30px] h-[30px] leading-none mt-0 bg-transparent text-[#fff] text-center w-[65px] focus:outline-none border-none placeholder-[#fff] placeholder:font-[200]"
                            placeholder="0"
                          />
                          <StyledInput
                            value={roadLabelAfter}
                            onChange={(e) => setRoadLabelAfter(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadLabelAfter", s)
                            }
                            inputStyle={fieldStyles.roadLabelAfter}
                            className="font-light text-[60px] leading-none bg-transparent text-white focus:outline-none border-none placeholder-white"
                            placeholder="Road"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}

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
                        <div className="tracking-[2px] uppercase mt-0 flex justify-center">
                          <StyledInput
                            value={cityLine}
                            onChange={(e) => setCityLine(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("cityLine", s)
                            }
                            inputStyle={fieldStyles.cityLine}
                            className="text-white text-[16px] h-[20px] bg-transparent text-center w-[700px] focus:outline-none border-none placeholder-[#FFF] placeholder:font-[200]"
                            placeholder="BRIGHOUSE SOUTH, RICHMOND"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("amount") && (
                      <DraggableBox
                        id="amount"
                        position={fieldPositions.amount}
                        onPositionChange={updateFieldPosition}
                        label="Price"
                        zoom={0.55}
                        disabled={lockedSections.address}
                        onDelete={() =>
                          removeStandardField(
                            "amount",
                            "Price",
                            amount,
                            "Page 1 - Address",
                            fieldStyles.amount,
                          )
                        }
                        deleteTitle="Remove Price"
                      >
                        <div className="text-[30px] font-light mt-0">
                          <StyledInput
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onChangeStyle={(s) => updateFieldStyle("amount", s)}
                            inputStyle={fieldStyles.amount}
                            className="font-semibold text-center text-[#fff] text-[30px] h-[40px] bg-transparent w-[150px] focus:outline-none border-none placeholder-[#fff] placeholder:font-[500]"
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

          {/* pdf-page 2 */}
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
            {/* Page 2 background color in parent bleed container for edge-to-edge coverage */}
            <div className="absolute inset-0 bg-[#416173] pointer-events-none z-0" />

            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="w-full flex flex-col justify-between font-alexandria relative z-10 h-full p-0">
                <div className="flex gap-6 flex-1 items-stretch min-h-0">
                  {/* Page 2 Left Column */}
                  <div className="w-1/2 flex flex-col justify-between gap-6 h-full">
                    {/* image9 */}
                    <div
                      data-image-slot="true"
                      className="w-full flex-1 place-self-center z-10 relative overflow-hidden group shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
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
                            <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image9")}
                              className="absolute top-24 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image9", e)}
                              className="absolute top-24 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                              className="absolute top-24 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                    <div className="grid grid-cols-2 gap-4">
                      {/* image10 */}
                      <div
                        data-image-slot="true"
                        className="h-[210px] relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
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
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image10", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
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
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                        className="h-[210px] relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
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
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image11", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
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
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                    {/* Description Section with Section Lock */}
                    <div
                      data-safezone-container="true"
                      className={`text-[10px] font-normal text-white italic relative z-10 transition-all duration-150 group/sec rounded-lg border-[3.5px] border-solid border-transparent ${
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
                        className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                      {!isFieldDeleted("description") && (
                        <DraggableBox
                          id="description"
                          position={fieldPositions.description}
                          onPositionChange={updateFieldPosition}
                          label="Description"
                          zoom={0.55}
                          disabled={lockedSections.description}
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
                            className="font-normal text-[14px] min-h-[100px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                            placeholder="Enter description here..."
                          />
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  {/* Page 2 Right Column */}
                  <div className="w-1/2 flex gap-6 h-full">
                    <div className="w-[40%] flex flex-col justify-between gap-2 h-full">
                      <div className="grid grid-rows-4 gap-6 flex-1 h-full">
                        {/* image12 */}
                        <div
                          data-image-slot="true"
                          className="w-full h-full relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
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
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image12", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
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
                                  onClick={() =>
                                    openImageSourceModal("image12")
                                  }
                                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                        {/* image13 */}
                        <div
                          data-image-slot="true"
                          className="w-full h-full relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
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
                                  onMouseDown={(e) =>
                                    handleMouseDown("image13", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image13}
                                    scale={scale.image13}
                                    position={position.image13}
                                    rotation={rotation.image13}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image13", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image13", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
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
                                  onClick={() =>
                                    openImageSourceModal("image13")
                                  }
                                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                                onClick={(e) =>
                                  openImageSourceModal("image13", e)
                                }
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

                        {/* image14 */}
                        <div
                          data-image-slot="true"
                          className="w-full h-full relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
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
                                  onMouseDown={(e) =>
                                    handleMouseDown("image14", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image14}
                                    scale={scale.image14}
                                    position={position.image14}
                                    rotation={rotation.image14}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image14", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image14", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
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
                                  onClick={() =>
                                    openImageSourceModal("image14")
                                  }
                                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                                onClick={(e) =>
                                  openImageSourceModal("image14", e)
                                }
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

                        {/* image15 */}
                        <div
                          data-image-slot="true"
                          className="w-full h-full relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image15")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image15");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image15")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image15", e)}
                            onMouseUp={() => handleMouseUp("image15")}
                            onMouseLeave={() => handleMouseLeave("image15")}
                          >
                            {images.image15 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image15", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image15}
                                    scale={scale.image15}
                                    position={position.image15}
                                    rotation={rotation.image15}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image15", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image15", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image15")}
                                  className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image15")
                                  }
                                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image15", fileInputRef15)
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
                                  openImageSourceModal("image15", e)
                                }
                                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                              >
                                Select Image
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef15}
                              onChange={(e) => handleImageChange("image15", e)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-[60%] flex flex-col justify-between gap-4 h-full">
                      {/* Details section with section lock */}
                      <div
                        data-safezone-container="true"
                        className={`relative z-10 flex gap-4 pb-[5px] text-white text-[12px] leading-relaxed pt-[16px] min-h-[240px] border-[3.5px] border-solid border-transparent rounded-lg p-2.5 transition-all duration-150 group/sec ${
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
                          className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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

                        {/* Left column fields */}
                        <div className="space-y-2 text-[10px] w-1/2">
                          {leftDetailFields.map((field) => (
                            <DraggableBox
                              key={field.id}
                              id={field.id}
                              position={fieldPositions[field.id]}
                              onPositionChange={updateFieldPosition}
                              label={
                                field.title.replace(/[:]/g, "").slice(0, 15) ||
                                "Field"
                              }
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() => removeDetailField(field.id)}
                              deleteTitle="Remove field"
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
                              />
                            </DraggableBox>
                          ))}
                        </div>

                        {/* Right column fields */}
                        <div className="space-y-2 text-[10px] w-1/2">
                          {rightDetailFields.map((field) => (
                            <DraggableBox
                              key={field.id}
                              id={field.id}
                              position={fieldPositions[field.id]}
                              onPositionChange={updateFieldPosition}
                              label={
                                field.title.replace(/[:]/g, "").slice(0, 15) ||
                                "Field"
                              }
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() => removeDetailField(field.id)}
                              deleteTitle="Remove field"
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
                              />
                            </DraggableBox>
                          ))}
                        </div>
                      </div>

                      {/* image16 */}
                      <div
                        data-image-slot="true"
                        className="w-full h-[650px] place-self-center border-2 z-10 border-[#fff] relative overflow-hidden group shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                        onMouseEnter={() => setHoveredSlot("image16")}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={(e) => {
                          if (e.altKey) return;
                          e.stopPropagation();
                          setActiveSlot("image16");
                        }}
                      >
                        <BoxIndicator isVisible={isSlotActive("image16")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image16", e)}
                          onMouseUp={() => handleMouseUp("image16")}
                          onMouseLeave={() => handleMouseLeave("image16")}
                        >
                          {images.image16 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image16", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image16}
                                  scale={scale.image16}
                                  position={position.image16}
                                  rotation={rotation.image16}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image16", "in")}
                                  className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image16", "out")}
                                  className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image16")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image16", e)
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
                                  handleDelete("image16", fileInputRef16)
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
                                openImageSourceModal("image16", e)
                              }
                              className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                            >
                              Select Image
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef16}
                            onChange={(e) => handleImageChange("image16", e)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Specs Bar Section with Section Lock */}
                <div
                  data-safezone-container="true"
                  className={`font-bold text-white text-[27px] tracking-[4px] h-[80px] relative z-10 pt-4 pb-1 shrink-0 flex items-center transition-all duration-150 group/sec rounded-lg border-[3.5px] border-solid border-transparent ${
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
                    className={`absolute top-0 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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
                          bedroom,
                          "Page 2 - Specs",
                          fieldStyles.bedroom,
                        )
                      }
                      deleteTitle="Remove Bedrooms"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StyledInput
                          value={bedroom}
                          onChange={(e) => setBedroom(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                          inputStyle={fieldStyles.bedroom}
                          className="font-semibold text-[22px] bg-transparent text-left w-[40px] h-[30px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0"
                        />
                        <StyledInput
                          value={bedroomLabel}
                          onChange={(e) => setBedroomLabel(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("bedroomLabel", s)
                          }
                          inputStyle={fieldStyles.bedroomLabel}
                          className="font-normal text-[22px] bg-transparent text-left focus:outline-none border-none placeholder-gray-300"
                          placeholder="BEDROOM •"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}

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
                          bathroom,
                          "Page 2 - Specs",
                          fieldStyles.bathroom,
                        )
                      }
                      deleteTitle="Remove Bathrooms"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StyledInput
                          value={bathroom}
                          onChange={(e) => setBathroom(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                          inputStyle={fieldStyles.bathroom}
                          className="font-semibold text-[22px] bg-transparent text-left w-[40px] h-[30px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0"
                        />
                        <StyledInput
                          value={bathroomLabel}
                          onChange={(e) => setBathroomLabel(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("bathroomLabel", s)
                          }
                          inputStyle={fieldStyles.bathroomLabel}
                          className="font-normal text-[22px] bg-transparent text-left focus:outline-none border-none placeholder-gray-300"
                          placeholder="BATHROOM •"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}

                  {!isFieldDeleted("sqft") && (
                    <DraggableBox
                      id="sqft"
                      position={fieldPositions.sqft}
                      onPositionChange={updateFieldPosition}
                      label="Sq Ft"
                      zoom={0.55}
                      disabled={lockedSections.specs}
                      onDelete={() =>
                        removeStandardField(
                          "sqft",
                          "Sq Ft",
                          sqft,
                          "Page 2 - Specs",
                          fieldStyles.sqft,
                        )
                      }
                      deleteTitle="Remove Sq Ft"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StyledInput
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                          inputStyle={fieldStyles.sqft}
                          className="font-semibold text-[22px] bg-transparent text-left h-[30px] w-[90px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="000"
                        />
                        <StyledInput
                          value={sqftLabel}
                          onChange={(e) => setSqftLabel(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("sqftLabel", s)
                          }
                          inputStyle={fieldStyles.sqftLabel}
                          className="font-normal text-[22px] bg-transparent text-left focus:outline-none border-none placeholder-gray-300"
                          placeholder="SQ FT •"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}

                  {!isFieldDeleted("builtYear") && (
                    <DraggableBox
                      id="builtYear"
                      position={fieldPositions.builtYear}
                      onPositionChange={updateFieldPosition}
                      label="Built Year"
                      zoom={0.55}
                      disabled={lockedSections.specs}
                      onDelete={() =>
                        removeStandardField(
                          "builtYear",
                          "Built Year",
                          builtYear,
                          "Page 2 - Specs",
                          fieldStyles.builtYear,
                        )
                      }
                      deleteTitle="Remove Built Year"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StyledInput
                          value={builtYear}
                          onChange={(e) => setBuiltYear(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYear", s)
                          }
                          inputStyle={fieldStyles.builtYear}
                          className="font-semibold text-[22px] mr-[5px] bg-transparent text-left h-[30px] w-[90px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0000"
                        />
                        <StyledInput
                          value={builtYearLabel}
                          onChange={(e) => setBuiltYearLabel(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYearLabel", s)
                          }
                          inputStyle={fieldStyles.builtYearLabel}
                          className="font-normal text-[22px] bg-transparent text-left focus:outline-none border-none placeholder-gray-300"
                          placeholder="BUILT IN"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                </div>

                <svg
                  viewBox="164 80 628 81.73"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute bottom-[30%] pointer-events-none z-0"
                  preserveAspectRatio="none"
                  style={{
                    marginLeft: showBleed ? "-0.375in" : "-0.25in",
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                    width: showBleed
                      ? "calc(100% + 0.75in)"
                      : "calc(100% + 0.5in)",
                  }}
                >
                  <path
                    opacity="0.350006"
                    d="M792 116.5C792 116.5 654.323 174.19 439.12 105.904C223.916 37.6178 164 125.936 164 125.936C164 125.936 210.5 45.0673 441.5 123.5C656.5 196.5 792 142.5 792 142.5V118.5"
                    fill="white"
                  ></path>
                  <g opacity="0.350006" filter="url(#filter0_d_36_1418)">
                    <path
                      d="M792 136.347C792 136.347 677.111 184.924 461.737 122.645C221.546 32.1944 164 126 164 126V128C164 128 218.35 46.7071 461.737 129C652.5 193.5 792 142.5 792 142.5V136.347Z"
                      fill="black"
                    ></path>
                  </g>
                  <defs>
                    <filter
                      id="filter0_d_36_1418"
                      x="0"
                      y="0.296387"
                      width="952"
                      height="402.344"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood
                        floodOpacity="0"
                        result="BackgroundImageFix"
                      ></feFlood>
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      ></feColorMatrix>
                      <feOffset dx="-2" dy="79"></feOffset>
                      <feGaussianBlur stdDeviation="81"></feGaussianBlur>
                      <feComposite in2="hardAlpha" operator="out"></feComposite>
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                      ></feColorMatrix>
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_36_1418"
                      ></feBlend>
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_36_1418"
                        result="shape"
                      ></feBlend>
                    </filter>
                  </defs>
                </svg>
              </div>
            </SafeZoneWrapper>
          </div>
        </div>
      </FontFolderProvider>
    );
  },
);

BcfpStandard4.displayName = "BcfpStandard4";

export default BcfpStandard4;
