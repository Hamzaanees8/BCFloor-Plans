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

export interface BcfpStandard8Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard8Props {
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
  onRemove,
}) => {
  return (
    <div className="relative group/row">
      <div className="flex items-center gap-1 relative">
        <StyledInput
          value={field.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onChangeStyle={onTitleStyleChange}
          inputStyle={field.titleStyle}
          className="font-bold text-[#FFFFFF] text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 uppercase"
          placeholder="ENTER TITLE HERE"
        />
        {onRemove && (
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
        className="font-semibold text-[#FFFFFF] text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
        placeholder="Enter details here"
      />
    </div>
  );
};

const DEFAULT_LEFT_DETAIL_FIELDS: DetailField[] = [
  {
    id: "byLawRestrictions",
    title: "BY-LAW RESTRICTIONS:",
    value: "Pets Allowed w/Rest., Rentals Allowed",
  },
  { id: "maintFees", title: "MAINT. FEES:", value: "$000.00" },
  {
    id: "maintFeesInclude",
    title: "MAINT. FEES INCLUDE:",
    value:
      "Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker",
  },
  {
    id: "featuresIncluded",
    title: "FEATURES INCLUDED:",
    value: "Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings",
  },
];

const DEFAULT_RIGHT_DETAIL_FIELDS: DetailField[] = [
  {
    id: "siteInfluences",
    title: "SITE INFLUENCES:",
    value:
      "Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby",
  },
  {
    id: "amenities",
    title: "AMENITIES:",
    value: "Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room",
  },
  { id: "view", title: "VIEW:", value: "South & SW - Van Isl." },
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
  "address",
  "mlsNumber",
  "number",
]);

const BcfpStandard8 = forwardRef<BcfpStandard8Ref, BcfpStandard8Props>(
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
            section: "Page 3 - Left Details Column",
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
            section: "Page 3 - Right Details Column",
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

    // ── 3. Text Fields ────────────────────────────────────────────────────────
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [mlsNumber, setMlsNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [number, setNumber] = useState("");
    const [address, setAddress] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("ADDRESS AVENUE");

    // Editable Labels
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("Phone:");
    const [emailLabel, setEmailLabel] = useState("Email:");
    const [mlsLabel, setMlsLabel] = useState("MLS#");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM •");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM •");
    const [sqftLabel, setSqftLabel] = useState("SQ FT •");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
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

    // ── 6. Images States ──────────────────────────────────────────────────────
    type ImageSettingOptions = {
      showBorder: boolean;
      boxShadow: boolean;
      imageShadow: boolean;
    };

    const [imageSettings, setImageSettings] = useState<
      Record<string, ImageSettingOptions>
    >(() => ({
      image1: { showBorder: true, boxShadow: true, imageShadow: false },
      image2: { showBorder: true, boxShadow: true, imageShadow: false },
      image3: { showBorder: true, boxShadow: true, imageShadow: false },
      image4: { showBorder: true, boxShadow: true, imageShadow: false },
      image5: { showBorder: true, boxShadow: true, imageShadow: false },
      image6: { showBorder: true, boxShadow: true, imageShadow: false },
      image7: { showBorder: true, boxShadow: true, imageShadow: false },
      image8: { showBorder: true, boxShadow: true, imageShadow: false },
      image9: { showBorder: true, boxShadow: true, imageShadow: false },
      image10: { showBorder: true, boxShadow: true, imageShadow: false },
      image11: { showBorder: true, boxShadow: true, imageShadow: false },
      image12: { showBorder: true, boxShadow: true, imageShadow: false },
      ...(formData.imageSettings || {}),
    }));

    const toggleImageSetting = (
      key: string,
      setting: keyof ImageSettingOptions,
    ) => {
      setImageSettings((prev) => {
        const current = prev[key] || {
          showBorder: true,
          boxShadow: true,
          imageShadow: false,
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
    });

    // Modal & Gallery state
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(
      null,
    );
    const [showGallery, setShowGallery] = useState(false);

    // Box Indicator active & hover states
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

    // Refs for image file inputs
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
        case "image8":
          return fileInputRef8;
        case "image9":
          return fileInputRef9;
        case "image10":
          return fileInputRef10;
        case "image11":
          return fileInputRef11;
        case "image12":
          return fileInputRef12;
        default:
          return { current: null };
      }
    };

    // Auto-populate from orderData & initial sync from context
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
          if (prop.address)
            setAddress(prop.address || (prop.suite ? `${prop.suite}` : ""));

          let city = "";
          if (prop.city) city += prop.city;
          if (prop.province) city += (city ? ", " : "") + prop.province;
          if (prop.postal_code) city += (city ? " " : "") + prop.postal_code;
          if (city) setCityLine(city);
        }

        if (agent) {
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if ((agent as any)?.phone || (agent as any)?.phone_number)
            setNumber((agent as any).phone || (agent as any).phone_number);
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

        if (formData.bedroom) setBedroom(s(formData.bedroom));
        if (formData.bathroom) setBathroom(s(formData.bathroom));
        if (formData.sqft) setSqft(s(formData.sqft));
        if (formData.builtYear) setBuiltYear(s(formData.builtYear));
        if (formData.description) setDescription(s(formData.description));
        if (formData.fullName) setFullName(s(formData.fullName));
        if (formData.email) setEmail(s(formData.email));
        if (formData.mlsNumber) setMlsNumber(s(formData.mlsNumber));
        if (formData.amount) setAmount(s(formData.amount));
        if (formData.number) setNumber(s(formData.number));
        if (formData.address) setAddress(s(formData.address));
        if (formData.addressCode) setAddressCode(s(formData.addressCode));
        if (formData.roadName) setRoadName(s(formData.roadName));
        if (formData.cityLine) setCityLine(s(formData.cityLine));
        if (formData.contactLabel) setContactLabel(s(formData.contactLabel));
        if (formData.phoneLabel) setPhoneLabel(s(formData.phoneLabel));
        if (formData.emailLabel) setEmailLabel(s(formData.emailLabel));
        if (formData.mlsLabel) setMlsLabel(s(formData.mlsLabel));
        if (formData.bedroomLabel) setBedroomLabel(s(formData.bedroomLabel));
        if (formData.bathroomLabel) setBathroomLabel(s(formData.bathroomLabel));
        if (formData.sqftLabel) setSqftLabel(s(formData.sqftLabel));
        if (formData.builtYearLabel)
          setBuiltYearLabel(s(formData.builtYearLabel));
        if (formData.roadLabelBefore)
          setRoadLabelBefore(s(formData.roadLabelBefore));
        if (formData.roadLabelAfter)
          setRoadLabelAfter(s(formData.roadLabelAfter));
        if (formData.disclaimerText)
          setDisclaimerText(s(formData.disclaimerText));

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
        if (formData.imageSettings) {
          setImageSettings((prev) => ({
            ...prev,
            ...(formData.imageSettings as typeof imageSettings),
          }));
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

    // Context sync useEffect
    useEffect(() => {
      updateFormData({
        leftDetailFields,
        rightDetailFields,
        deletedStandardFieldIds,
        deletedDetailFields,
        bedroom,
        bathroom,
        sqft,
        builtYear,
        description,
        fullName,
        email,
        mlsNumber,
        amount,
        number,
        address,
        addressCode,
        roadName,
        cityLine,
        contactLabel,
        phoneLabel,
        emailLabel,
        mlsLabel,
        bedroomLabel,
        bathroomLabel,
        sqftLabel,
        builtYearLabel,
        roadLabelBefore,
        roadLabelAfter,
        disclaimerText,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldPositions,
        imageSettings,
      });
    }, [
      leftDetailFields,
      rightDetailFields,
      deletedStandardFieldIds,
      deletedDetailFields,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      description,
      fullName,
      email,
      mlsNumber,
      amount,
      number,
      address,
      addressCode,
      roadName,
      cityLine,
      contactLabel,
      phoneLabel,
      emailLabel,
      mlsLabel,
      bedroomLabel,
      bathroomLabel,
      sqftLabel,
      builtYearLabel,
      roadLabelBefore,
      roadLabelAfter,
      disclaimerText,
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      imageSettings,
      updateFormData,
    ]);

    // Expose imperative methods via ref
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
          templateKey: "BCFPStandard8",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#647074",
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
              fontSize: fieldStyles.fullName?.fontSize || "20px",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "20px",
            },
          },
          propertyNotesTitle: {
            value: roadName,
            style: {
              ...fieldStyles.roadName,
              fontSize: fieldStyles.roadName?.fontSize || "18px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "10px",
            },
          },
          expandedDetail1Title: byLawObj?.title || "BY-LAW RESTRICTIONS:",
          expandedDetail1Description: {
            value: byLawObj?.value || "",
            style: byLawObj?.style || ({} as TextStyle),
          },
          expandedDetail2Title: maintObj?.title || "MAINT. FEES:",
          expandedDetail2Description: {
            value: maintObj?.value || "",
            style: maintObj?.style || ({} as TextStyle),
          },
          expandedDetail3Title: maintIncObj?.title || "MAINT. FEES INCLUDE:",
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
            number: {
              value: number,
              style: {
                ...fieldStyles.number,
                fontSize: fieldStyles.number?.fontSize || "20px",
              },
            },
            address: {
              value: address,
              style: {
                ...fieldStyles.address,
                fontSize: fieldStyles.address?.fontSize || "28px",
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
                fontSize: fieldStyles.cityLine?.fontSize || "10px",
              },
            },
            mlsNumber: {
              value: mlsNumber,
              style: {
                ...fieldStyles.mlsNumber,
                fontSize: fieldStyles.mlsNumber?.fontSize || "20px",
              },
            },
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
        });
        return payload;
      },

      importFromPayload: (payload: FeatureSheetResponse) => {
        const state = featureSheetService.parsePayloadToState(payload);
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";

        if (state.offeredAtPrice) setAmount(s(state.offeredAtPrice));
        if (state.realtorName) setFullName(s(state.realtorName));
        if (state.emailLink) setEmail(s(state.emailLink));
        if (state.propertyNotesTitle) setRoadName(s(state.propertyNotesTitle));
        if (state.propertyNotesDescription)
          setDescription(s(state.propertyNotesDescription));

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
          const details = state.otherDetails as Record<string, any>;
          if (details.amenities) {
            setRightDetailFields((prev) =>
              prev.map((f) =>
                f.id === "amenities"
                  ? { ...f, value: s(details.amenities) }
                  : f,
              ),
            );
          }
          if (details.view) {
            setRightDetailFields((prev) =>
              prev.map((f) =>
                f.id === "view" ? { ...f, value: s(details.view) } : f,
              ),
            );
          }
          if (details.bedroom) setBedroom(s(details.bedroom));
          if (details.bathroom) setBathroom(s(details.bathroom));
          if (details.sqft) setSqft(s(details.sqft));
          if (details.builtYear) setBuiltYear(s(details.builtYear));
          if (details.number) setNumber(s(details.number));
          if (details.address) setAddress(s(details.address));
          if (details.addressCode) setAddressCode(s(details.addressCode));
          if (details.cityLine) setCityLine(s(details.cityLine));
          if (details.mlsNumber) setMlsNumber(s(details.mlsNumber));
        }

        // Restore saved styles
        const styles: Record<string, TextStyle> = {};
        const c = payload.content;
        const st = (f: any) => (f as StyledTextField)?.style;

        if (st(c.offeredAtPrice)) styles.amount = st(c.offeredAtPrice);
        if (st(c.realtorName)) styles.fullName = st(c.realtorName);
        if (st(c.emailLink)) styles.email = st(c.emailLink);
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
          if (st(od.number)) styles.number = st(od.number);
          if (st(od.address)) styles.address = st(od.address);
          if (st(od.addressCode)) styles.addressCode = st(od.addressCode);
          if (st(od.cityLine)) styles.cityLine = st(od.cityLine);
          if (st(od.mlsNumber)) styles.mlsNumber = st(od.mlsNumber);
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

    // Image handlers
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
      // Divide mouse delta by preview zoom (0.55) for 1:1 cursor tracking on Tabloids
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

    // Helper to render an image slot using modern three-layer pattern & BoxIndicator
    const renderImageSlot = (
      key: keyof typeof images,
      className: string,
      placeholderText: string = "Select Image",
    ) => {
      const inputRef = getFileInputRef(key);
      const settings = imageSettings[key] || {
        showBorder: true,
        boxShadow: true,
        imageShadow: false,
      };

      let effectiveClassName = className.replace(/\bshadow\S*/g, "").trim();
      if (!settings.showBorder) {
        effectiveClassName = effectiveClassName
          .replace(/\bborder\S*/g, "")
          .trim();
      }

      const containerStyle: React.CSSProperties = {
        boxShadow: settings.boxShadow
          ? "6px 6px 4px 0px rgba(0, 0, 0, 0.75)"
          : "none",
        filter: settings.imageShadow
          ? "drop-shadow(6px 6px 4px rgba(0, 0, 0, 0.75))"
          : "none",
      };

      return (
        <div
          data-image-slot="true"
          className={`relative group cursor-pointer ${effectiveClassName}`}
          style={containerStyle}
          onMouseEnter={() => setHoveredSlot(key)}
          onMouseLeave={() => setHoveredSlot(null)}
          onClick={(e) => {
            if (e.altKey) return;
            e.stopPropagation();
            setActiveSlot(key);
          }}
        >
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
                  />
                </div>

                <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                  className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                  title="Rotate image"
                >
                  <RotateCw className="w-4 h-4 text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={(e) => openImageSourceModal(key, e)}
                  className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(key, inputRef)}
                  className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
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
      <FontFolderProvider value="BcfpStandard8">
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
          {/* TOP SPREAD BANNERS (PAGE 4 | PAGE 1) */}
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

          {/* SPREAD 1: PAGE 4 | PAGE 1 */}
          <div
            className="flex items-stretch pdf-page bg-[#647074] shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="flex gap-10  bg-[#647074] relative w-full h-full p-6">
                {/* PAGE 4 CONTENT */}
                <div className="w-1/2 flex flex-col gap-4 relative z-[1]">
                  {/* image1 */}
                  {renderImageSlot(
                    "image1",
                    "flex-1 min-h-[700px] w-full bg-white border-[2px] border-white shadow-md place-self-center",
                  )}

                  <div className="flex flex-col gap-4">
                    <div className="group z-10 flex gap-4">
                      {/* image2 */}
                      {renderImageSlot(
                        "image2",
                        "w-[200px] h-[110px] bg-white shadow-md",
                      )}

                      {/* Contact Info Section */}
                      <div
                        data-safezone-container="true"
                        className={`flex flex-col relative z-[19] border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec flex-1 ${
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
                          className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
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
                            <div className="flex flex-col">
                              <StyledInput
                                value={contactLabel}
                                onChange={(e) =>
                                  setContactLabel(e.target.value)
                                }
                                onChangeStyle={(s) =>
                                  updateFieldStyle("contactLabel", s)
                                }
                                inputStyle={fieldStyles.contactLabel}
                                className="text-[20px] text-white font-bold bg-transparent text-left focus:outline-none border-none uppercase"
                                placeholder="CONTACT:"
                              />
                              <StyledInput
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("fullName", s)
                                }
                                inputStyle={fieldStyles.fullName}
                                className="text-[20px] text-white h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                                placeholder="FIRSTNAME LASTNAME"
                              />
                            </div>
                          </DraggableBox>
                        )}

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
                                "Phone Number",
                                number,
                                "Page 4 - Contact",
                                fieldStyles.number,
                              )
                            }
                            deleteTitle="Remove Phone"
                          >
                            <div className="flex gap-2 font-normal text-[20px] text-white items-center">
                              <StyledInput
                                value={phoneLabel}
                                onChange={(e) => setPhoneLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("phoneLabel", s)
                                }
                                inputStyle={fieldStyles.phoneLabel}
                                className="font-normal text-[20px] text-white bg-transparent text-left focus:outline-none border-none"
                                placeholder="Phone:"
                                wrapperClassName="w-auto"
                              />
                              <StyledInput
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("number", s)
                                }
                                inputStyle={fieldStyles.number}
                                className="font-thin text-[20px] h-[22px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
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
                            <div className="flex gap-2 font-normal text-[20px] text-white items-center w-full">
                              <StyledInput
                                value={emailLabel}
                                onChange={(e) => setEmailLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("emailLabel", s)
                                }
                                inputStyle={fieldStyles.emailLabel}
                                className="font-normal text-[20px] text-white bg-transparent text-left focus:outline-none border-none shrink-0"
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
                                className="font-thin text-[20px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                                wrapperClassName="flex-1 min-w-0"
                                placeholder="Enter email here"
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
                            zoom={0.55}
                            disabled={lockedSections.contact}
                            onDelete={() =>
                              removeStandardField(
                                "mlsNumber",
                                "MLS Number",
                                mlsNumber,
                                "Page 4 - Contact",
                                fieldStyles.mlsNumber,
                              )
                            }
                            deleteTitle="Remove MLS #"
                          >
                            <div className="flex gap-2 font-normal text-[20px] text-white items-center">
                              <StyledInput
                                value={mlsLabel}
                                onChange={(e) => setMlsLabel(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("mlsLabel", s)
                                }
                                inputStyle={fieldStyles.mlsLabel}
                                className="font-normal text-[20px] text-white bg-transparent text-left focus:outline-none border-none"
                                placeholder="MLS#"
                                wrapperClassName="w-auto"
                              />
                              <StyledInput
                                value={mlsNumber}
                                onChange={(e) => setMlsNumber(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("mlsNumber", s)
                                }
                                inputStyle={fieldStyles.mlsNumber}
                                className="font-thin text-[20px] h-[22px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-white placeholder:font-[200]"
                                placeholder="Enter MLS here"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer Section */}
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
                          "Page 4 - Footer",
                          fieldStyles.disclaimerText,
                        )
                      }
                      deleteTitle="Remove Disclaimer"
                    >
                      <div className="text-start w-full font-thin flex gap-2 text-white items-end pt-2">
                        <StyledInput
                          value={disclaimerText}
                          onChange={(e) => setDisclaimerText(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("disclaimerText", s)
                          }
                          inputStyle={fieldStyles.disclaimerText}
                          className="text-[8px] font-bold leading-normal text-white bg-transparent border-none focus:outline-none w-full"
                          rows={3}
                          placeholder="Disclaimer text..."
                        />
                        <span className="flex flex-col shrink-0 mb-1">
                          <House className="w-4 h-4" />
                          <svg
                            width="16"
                            height="16"
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
                </div>

                {/* PAGE 1 CONTENT */}
                <div className="w-1/2 justify-between flex flex-col relative z-[1] gap-4">
                  {/* image3 */}
                  {renderImageSlot(
                    "image3",
                    "w-full h-[480px] border-[2px] border-white shadow-md place-self-center",
                  )}

                  {/* Address & Price Container */}
                  <div
                    data-safezone-container="true"
                    className={`flex w-full flex-col justify-center relative z-[19] items-center border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec ${
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

                    {/* Row 1: addressCode (000-0000) + Title Field (cityLine: ADDRESS AVENUE) */}
                    <div className="text-[28px] font-normal leading-none mt-0 text-white flex items-center justify-center gap-2 uppercase w-full">
                      {!isFieldDeleted("addressCode") && (
                        <DraggableBox
                          id="addressCode"
                          position={fieldPositions.addressCode}
                          onPositionChange={updateFieldPosition}
                          label="Address Code"
                          zoom={0.55}
                          disabled={lockedSections.address}
                          onDelete={() =>
                            removeStandardField(
                              "addressCode",
                              "Address Code",
                              addressCode,
                              "Page 1 - Cover",
                              fieldStyles.addressCode,
                            )
                          }
                          deleteTitle="Remove Address Code"
                        >
                          <StyledInput
                            value={addressCode}
                            onChange={(e) => setAddressCode(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("addressCode", s)
                            }
                            inputStyle={fieldStyles.addressCode}
                            className="font-normal text-[28px] leading-tight bg-transparent text-white text-right focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] w-auto min-w-[60px] uppercase whitespace-nowrap"
                            placeholder="000-0000"
                            wrapperClassName="w-auto"
                          />
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("cityLine") && (
                        <DraggableBox
                          id="cityLine"
                          position={fieldPositions.cityLine}
                          onPositionChange={updateFieldPosition}
                          label="Title Field"
                          zoom={0.55}
                          disabled={lockedSections.address}
                          onDelete={() =>
                            removeStandardField(
                              "cityLine",
                              "Title Line",
                              cityLine,
                              "Page 1 - Cover",
                              fieldStyles.cityLine,
                            )
                          }
                          deleteTitle="Remove Title Field"
                        >
                          <StyledInput
                            value={cityLine}
                            onChange={(e) => setCityLine(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("cityLine", s)
                            }
                            inputStyle={fieldStyles.cityLine}
                            className="font-normal text-[28px] tracking-wide leading-tight bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] w-auto min-w-[100px] uppercase whitespace-nowrap"
                            placeholder="ADDRESS AVENUE"
                            wrapperClassName="w-auto"
                          />
                        </DraggableBox>
                      )}
                    </div>

                    {/* Row 2: address (BRIGHOUSE SOUTH, LANGLEY) */}
                    {!isFieldDeleted("address") && (
                      <DraggableBox
                        id="address"
                        position={fieldPositions.address}
                        onPositionChange={updateFieldPosition}
                        label="Address"
                        zoom={0.55}
                        disabled={lockedSections.address}
                        onDelete={() =>
                          removeStandardField(
                            "address",
                            "Street Address",
                            address,
                            "Page 1 - Cover",
                            fieldStyles.address,
                          )
                        }
                        deleteTitle="Remove Address"
                      >
                        <StyledInput
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("address", s)}
                          inputStyle={fieldStyles.address}
                          className="text-white text-[16px] tracking-wider font-light bg-transparent text-center w-full max-w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] uppercase whitespace-nowrap px-4"
                          placeholder="BRIGHOUSE SOUTH, LANGLEY"
                          wrapperClassName="w-full flex justify-center"
                        />
                      </DraggableBox>
                    )}

                    {/* Row 3: priceAmount ($000,000) */}
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
                            "Listing Price",
                            amount,
                            "Page 1 - Cover",
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
                          className="font-light text-[30px] leading-none mt-1 bg-transparent text-white text-center w-full max-w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200] whitespace-nowrap px-4"
                          placeholder="$000,000"
                          wrapperClassName="w-full flex justify-center"
                        />
                      </DraggableBox>
                    )}
                  </div>

                  {/* image4 container */}
                  <div className="flex flex-col relative justify-center items-center">
                    {renderImageSlot(
                      "image4",
                      "w-[480px] h-[320px] border-[2px] border-white shadow-md place-self-center z-10",
                    )}

                    <div
                      className="flex flex-col absolute z-[1] top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: "0px",
                        right: showBleed ? "-1in" : "-0.75in",
                      }}
                    >
                      <hr className="border-t-[8px] border-white border-dotted w-full" />
                      <div className="h-[140px] w-full bg-[#9BA4A7] my-3"></div>
                      <hr className="border-t-[8px] border-white border-dotted w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </SafeZoneWrapper>
          </div>

          {/* BOTTOM SPREAD BANNERS (PAGE 2 | PAGE 3) */}
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

          {/* SPREAD 2: PAGE 2 | PAGE 3 */}
          <div
            className="flex items-stretch pdf-page bg-[#647074] shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="flex gap-10 bg-[#647074] relative w-full h-full">
                {/* PAGE 2 CONTENT */}
                <div className="w-1/2 pl-[24px] py-[24px] flex flex-col gap-4">
                  {/* image5 */}
                  {renderImageSlot(
                    "image5",
                    "w-full h-[460px] border-[2px] border-white shadow-md place-self-center",
                  )}

                  {/* Specs Bar Section */}
                  <div
                    data-safezone-container="true"
                    className={`flex flex-wrap items-center gap-2 border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec relative ${
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
                      className={`absolute -top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.specs
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.specs
                          ? "Unlock Property Specs Section"
                          : "Lock Property Specs Section"
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

                    <div className="font-bold text-[18px] text-[#FFFFFF] flex flex-wrap gap-2 items-center">
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
                              inputStyle={fieldStyles.bedroom}
                              className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                              placeholder="0"
                            />
                            <StyledInput
                              value={bedroomLabel}
                              onChange={(e) => setBedroomLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bedroomLabel", s)
                              }
                              inputStyle={fieldStyles.bedroomLabel}
                              className="font-bold text-[18px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="BEDROOM •"
                              wrapperClassName="w-auto"
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
                              onChange={(e) => setBathroomLabel(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("bathroomLabel", s)
                              }
                              inputStyle={fieldStyles.bathroomLabel}
                              className="font-bold text-[18px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="BATHROOM •"
                              wrapperClassName="w-auto"
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
                              className="font-bold text-[18px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="SQ FT •"
                              wrapperClassName="w-auto"
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
                              className="font-bold text-[18px] text-white bg-transparent focus:outline-none border-none whitespace-nowrap"
                              placeholder="BUILT IN"
                              wrapperClassName="w-auto"
                            />
                            <StyledInput
                              value={builtYear}
                              onChange={(e) => setBuiltYear(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("builtYear", s)
                              }
                              inputStyle={fieldStyles.builtYear}
                              className="font-semibold text-[13px] bg-transparent text-left h-[30px] w-[80px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
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
                    className={`flex-1 flex flex-col border-[3.5px] border-solid border-transparent rounded-lg p-2 transition-all duration-150 group/sec relative ${
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
                      className={`absolute top-1 right-1 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.description
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.description
                          ? "Unlock Property Description Section"
                          : "Lock Property Description Section"
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
                            "Property Description",
                            description,
                            "Page 2 - Body",
                            fieldStyles.description,
                          )
                        }
                        deleteTitle="Remove Description"
                        className="flex-1 flex flex-col"
                      >
                        <StyledInput
                          value={description}
                          rows={8}
                          onChange={(e) => setDescription(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("description", s)
                          }
                          inputStyle={fieldStyles.description}
                          className="font-normal text-[10px] h-full min-h-[90px] flex-1 z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500] w-full"
                          wrapperClassName="flex-1 flex flex-col"
                          placeholder="Property description text..."
                        />
                      </DraggableBox>
                    )}
                  </div>

                  {/* 2-column image grid (image6, image7) */}
                  <div className="grid grid-cols-2 gap-4">
                    {renderImageSlot(
                      "image6",
                      "h-[230px] border-[2px] border-white shadow-md",
                    )}
                    {renderImageSlot(
                      "image7",
                      "h-[230px] border-[2px] border-white shadow-md",
                    )}
                  </div>
                </div>

                {/* PAGE 3 CONTENT */}
                <div className="w-1/2 flex gap-4">
                  {/* Left Column photos (w-[70%]) */}
                  <div className="w-[70%] flex flex-col gap-4 py-[24px]">
                    <div className="grid grid-cols-2 gap-4">
                      {renderImageSlot(
                        "image8",
                        "h-[165px] border-[2px] border-white shadow-md",
                      )}
                      {renderImageSlot(
                        "image9",
                        "h-[165px] border-[2px] border-white shadow-md",
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {renderImageSlot(
                        "image10",
                        "h-[165px] border-[2px] border-white shadow-md",
                      )}
                      {renderImageSlot(
                        "image11",
                        "h-[165px] border-[2px] border-white shadow-md",
                      )}
                    </div>
                    {renderImageSlot(
                      "image12",
                      "flex-1 min-h-[480px] border-[2px] border-white shadow-md",
                    )}
                  </div>

                  {/* Right Sidebar Details Column (w-[30%] bg-[#9BA4A7]) */}
                  <div
                    data-safezone-container="true"
                    className={`bg-[#9BA4A7] shrink-0 border-[3.5px] border-solid border-transparent transition-all duration-150 group/sec relative ${
                      lockedSections.details
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                    style={{
                      width: showBleed
                        ? "calc(30% + 0.75in)"
                        : "calc(30% + 0.5in)",
                      marginRight: showBleed ? "-0.75in" : "-0.5in",
                      marginTop: showBleed ? "-0.5in" : "-0.25in",
                      marginBottom: showBleed ? "-0.5in" : "-0.25in",
                      paddingTop: showBleed
                        ? "calc(40px + 0.375in)"
                        : "calc(40px + 0.25in)",
                      paddingBottom: showBleed
                        ? "calc(40px + 0.375in)"
                        : "calc(40px + 0.25in)",
                      paddingLeft: "18px",
                      paddingRight: showBleed
                        ? "calc(30px + 0.375in)"
                        : "calc(30px + 0.25in)",
                    }}
                  >
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
                          ? "Unlock Details Sidebar Section"
                          : "Lock Details Sidebar Section"
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

                    <div className="flex flex-col gap-2 text-black text-[12px] leading-relaxed relative z-10">
                      {!isFieldDeleted("mlsNumber") && (
                        <DraggableBox
                          id="mlsNumber"
                          position={fieldPositions.mlsNumber}
                          onPositionChange={updateFieldPosition}
                          label="MLS #"
                          zoom={0.55}
                          disabled={lockedSections.details}
                          onDelete={() =>
                            removeStandardField(
                              "mlsNumber",
                              "MLS Number",
                              mlsNumber,
                              "Page 3 - Sidebar",
                              fieldStyles.mlsNumber,
                            )
                          }
                          deleteTitle="Remove MLS #"
                        >
                          <div className="text-[28px] flex font-light leading-none mt-0 text-white items-center">
                            <span className="text-[16px]">#</span>
                            <StyledInput
                              value={mlsNumber}
                              onChange={(e) => setMlsNumber(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("mlsNumber", s)
                              }
                              inputStyle={fieldStyles.mlsNumber}
                              className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
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
                          disabled={lockedSections.details}
                          onDelete={() =>
                            removeStandardField(
                              "roadName",
                              "Road Name",
                              roadName,
                              "Page 3 - Sidebar",
                              fieldStyles.roadName,
                            )
                          }
                          deleteTitle="Remove Road Name"
                        >
                          <div className="text-white flex text-[18px] items-center gap-1">
                            <StyledInput
                              value={roadLabelBefore}
                              onChange={(e) =>
                                setRoadLabelBefore(e.target.value)
                              }
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadLabelBefore", s)
                              }
                              inputStyle={fieldStyles.roadLabelBefore}
                              className="text-white text-[18px] bg-transparent focus:outline-none border-none"
                              placeholder="Number"
                              wrapperClassName="w-auto"
                            />
                            <StyledInput
                              value={roadName}
                              onChange={(e) => setRoadName(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("roadName", s)
                              }
                              inputStyle={fieldStyles.roadName}
                              className="font-light text-[18px] h-[30px] leading-none mt-0 bg-transparent text-white text-center w-auto min-w-[20px] px-0.5 focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                              placeholder="0"
                              wrapperClassName="w-auto"
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
                              className="text-white text-[18px] bg-transparent focus:outline-none border-none"
                              placeholder="Road"
                              wrapperClassName="w-auto"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("propertyDescription") && (
                        <DraggableBox
                          id="propertyDescription"
                          position={fieldPositions.propertyDescription}
                          onPositionChange={updateFieldPosition}
                          label="Description Notes"
                          zoom={0.55}
                          disabled={lockedSections.details}
                          onDelete={() =>
                            removeStandardField(
                              "propertyDescription",
                              "Property Description",
                              description,
                              "Page 3 - Sidebar",
                              fieldStyles.description,
                            )
                          }
                          deleteTitle="Remove Description"
                        >
                          <StyledInput
                            value={description}
                            rows={8}
                            onChange={(e) => setDescription(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("descriptionRight", s)
                            }
                            inputStyle={
                              fieldStyles.descriptionRight ||
                              fieldStyles.description
                            }
                            className="font-normal text-[12px] h-auto min-h-[100px] w-full text-white bg-transparent text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                            placeholder="Property description notes..."
                          />
                        </DraggableBox>
                      )}

                      {/* Left Detail Fields Column */}
                      <div className="space-y-2 text-[8px]">
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
                            />
                          </DraggableBox>
                        ))}
                      </div>

                      {/* Right Detail Fields Column */}
                      <div className="space-y-2 text-[8px] pt-2">
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
                            />
                          </DraggableBox>
                        ))}
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

BcfpStandard8.displayName = "BcfpStandard8";

export default BcfpStandard8;
