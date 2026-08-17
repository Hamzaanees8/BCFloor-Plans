---
name: tabloid-sheet-modernization
description: >
  Standardizes and upgrades BCFP Tabloid Sheets (17" x 11" 4-page spreads / single spreads) with Guided Lines (Bleed & Safe Zone), Canva-style Box Indicators, Draggable & Deletable Fields, Field Restores, Text Styling, Three-Layer Image Editors, Section Drag Locks, and Three-Container Architecture based on BcfpStandard6.
---

# Tabloid Sheet Modernization & Upgrade Standard (17" x 11")

This skill is the comprehensive, authoritative runbook for upgrading any BCFP Tabloid Feature Sheet (e.g. `BcfpStandard1.tsx` through `BcfpStandard10.tsx`, tabloid 4-page / 2-page spreads) to the modern standard established in `BcfpStandard6.tsx`.

---

## 1. CORE ARCHITECTURE & SIZING SPECIFICATIONS (TABLOID 17" x 11")

Every Tabloid Sheet is constructed with a nested **Three-Container Architecture**:

```
+-----------------------------------------------------------------------------------+
| CONTAINER 1: Outer Page / Bleed Wrapper (.pdf-page)                               |
| - Dimensions: 17.25" x 11.25" (with Bleed) or 17.00" x 11.00" (no Bleed)          |
| - Style: zoom: 0.55, relative, overflow: hidden, bg-white, shadow-2xl             |
| - Edge-to-edge bleed layers (gradients, color bands) live here (outside SafeZone)|
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | CONTAINER 2: SafeZoneWrapper (0.125" Bleed Pad + 0.25" Safe Zone Inset)    |  |
|  | - Red Dashed Bleed Border Guide (data-html2canvas-ignore="true")           |  |
|  | - Emerald Dashed Safe Zone Border Guide (data-html2canvas-ignore="true")   |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | CONTAINER 3: Inner Content Container (relative w-full h-full z-10)   |  |  |
|  |  | - Hosts DraggableBox, StyledInput, property grids, image slots       |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Exact Dimension & Sizing Table

| Parameter | Tabloid (17x11) with Bleed | Tabloid (17x11) No Bleed |
| :--- | :--- | :--- |
| **Page Width** | `17.25in` | `17.0in` |
| **Page Height** | `11.25in` | `11.0in` |
| **Bleed Padding** | `0.125in` (3mm) per edge | `0in` |
| **Safe Zone Inset** | `0.25in` (6mm) per edge | `0.25in` |
| **Preview Zoom** | `zoom: 0.55` | `zoom: 0.55` |
| **Negative Bleed Offset** | `marginLeft/Right: -0.375in`, `width: calc(... + 0.375in)` | `marginLeft/Right: -0.25in`, `width: calc(... + 0.25in)` |
| **Mouse Drag Zoom Divisor** | `0.55` | `0.55` |

---

## 2. REQUIRED IMPORTS & TYPES

```tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  House,
  Pencil,
  Trash,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock,
  GripVertical,
} from "lucide-react";
import ImageEditor from "./ImageEditor";
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
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";
```

---

## 3. SUB-COMPONENTS & HELPERS

### 3.1 BoxIndicator (Canva-Style Image Border)
```tsx
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
```

### 3.2 DetailFieldRow
```tsx
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
  return (
    <div className="relative">
      <div className="flex items-center gap-1 relative">
        <StyledInput
          value={field.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onChangeStyle={onTitleStyleChange}
          inputStyle={field.titleStyle}
          className="font-bold text-[#00B9F2] text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 uppercase"
          placeholder="ENTER TITLE HERE"
        />
      </div>
      <StyledInput
        value={field.value}
        onChange={(e) => onValueChange(e.target.value)}
        onChangeStyle={onStyleChange}
        inputStyle={field.style}
        className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
        placeholder="Enter details here"
      />
    </div>
  );
};
```

---

## 4. STANDARD FIELD IDS & MODULE CONSTANTS

```tsx
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
];
```

---

## 5. COMPLETE STATE PATTERN FOR TABLOID TEMPLATES

```tsx
export interface BcfpStandardRef {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandardProps {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

const BcfpStandard = forwardRef<BcfpStandardRef, BcfpStandardProps>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // 1. Bleed & Guide Resolution
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed = propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide = propShowGuide !== undefined ? propShowGuide : showGuideState;

    // 2. Text Fields State
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
    const [companyName, setCompanyName] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");

    // 3. Detail Fields State (Page 4 Specifications)
    const [leftDetailFields, setLeftDetailFields] = useState<DetailField[]>(
      DEFAULT_LEFT_DETAIL_FIELDS
    );
    const [rightDetailFields, setRightDetailFields] = useState<DetailField[]>(
      DEFAULT_RIGHT_DETAIL_FIELDS
    );

    // 4. Styles, Positions & Locks
    const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>({});
    const updateFieldStyle = (field: string, style: TextStyle) =>
      setFieldStyles((prev) => ({ ...prev, [field]: style }));

    const [fieldPositions, setFieldPositions] = useState<Record<string, { x: number; y: number }>>({});
    const updateFieldPosition = (id: string, pos: { x: number; y: number }) => {
      setFieldPositions((prev) => ({ ...prev, [id]: pos }));
    };

    const [lockedSections, setLockedSections] = useState<Record<string, boolean>>({
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

    // 5. Deletion & Restoration State
    const [deletedDetailFields, setDeletedDetailFields] = useState<DeletedDetailFieldItem[]>(
      formData.deletedDetailFields || []
    );
    const [deletedStandardFieldIds, setDeletedStandardFieldIds] = useState<string[]>(
      formData.deletedStandardFieldIds || []
    );

    const isFieldDeleted = (id: string) => deletedStandardFieldIds.includes(id);

    const removeStandardField = (
      id: string,
      title: string,
      value: string,
      section: string,
      style?: TextStyle
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
          { ...leftField, column: "left", section: "Page 4 - Left Column", deletedAt: Date.now() },
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
          { ...rightField, column: "right", section: "Page 4 - Right Column", deletedAt: Date.now() },
        ];
        setDeletedDetailFields(newDeleted);
        updateFormData({ deletedDetailFields: newDeleted });
        setRightDetailFields((prev) => prev.filter((f) => f.id !== id));
      }
    };

    const restoreDetailField = useCallback(
      (id: string) => {
        const isStandard = STANDARD_FIELD_IDS.has(id) || deletedStandardFieldIds.includes(id);

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
            setRightDetailFields((prev) => [...prev.filter((f) => f.id !== id), cleanField]);
          } else {
            setLeftDetailFields((prev) => [...prev.filter((f) => f.id !== id), cleanField]);
          }
          const updated = prevDetail.filter((f) => f.id !== id);
          updateFormData({ deletedDetailFields: updated });
          return updated;
        });
      },
      [deletedStandardFieldIds, updateFormData]
    );

    const restoreAllDetailFields = useCallback(() => {
      setDeletedDetailFields((prevDetail) => {
        const leftRestored: DetailField[] = [];
        const rightRestored: DetailField[] = [];

        prevDetail.forEach((field) => {
          if (STANDARD_FIELD_IDS.has(field.id) || deletedStandardFieldIds.includes(field.id)) {
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

        if (leftRestored.length > 0) setLeftDetailFields((prev) => [...prev, ...leftRestored]);
        if (rightRestored.length > 0) setRightDetailFields((prev) => [...prev, ...rightRestored]);

        setDeletedStandardFieldIds([]);
        updateFormData({
          deletedStandardFieldIds: [],
          deletedDetailFields: [],
        });
        return [];
      });
    }, [deletedStandardFieldIds, updateFormData]);

    // Context registration for top-level restoration panel
    useEffect(() => {
      if (setRestoreDetailFieldHandler) setRestoreDetailFieldHandler(() => restoreDetailField);
      if (setRestoreAllDetailFieldsHandler) setRestoreAllDetailFieldsHandler(() => restoreAllDetailFields);
      return () => {
        if (setRestoreDetailFieldHandler) setRestoreDetailFieldHandler(null);
        if (setRestoreAllDetailFieldsHandler) setRestoreAllDetailFieldsHandler(null);
      };
    }, [restoreDetailField, restoreAllDetailFields, setRestoreDetailFieldHandler, setRestoreAllDetailFieldsHandler]);
```

---

## 6. IMAGE SLOTS & THREE-LAYER PATTERN (WITH BOX INDICATOR & ZOOM CALIBRATION)

### 6.1 Drag Delta Calculation (Tabloid Zoom 0.55)
```tsx
const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
  if (!dragging[key]) return;
  // Divide mouse delta by preview zoom (0.55) for 1:1 cursor movement on 17x11 tabloids
  const dx = (e.clientX - lastPosition.current[key].x) / 0.55;
  const dy = (e.clientY - lastPosition.current[key].y) / 0.55;
  setPosition((prev) => ({
    ...prev,
    [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
  }));
  lastPosition.current[key] = { x: e.clientX, y: e.clientY };
};
```

### 6.2 JSX Pattern for Every Image Slot
```tsx
{/* LAYER 1: Outer Slot Container with group */}
<div className="w-full h-[580px] relative overflow-hidden group">
  {/* Canva-Style Box Indicator on hover/active */}
  <BoxIndicator isVisible={hoveredImage === "image1" || dragging.image1} />

  {/* LAYER 2: Middle Mouse Event Container */}
  <div
    className="w-full h-full relative overflow-hidden flex items-center justify-center"
    onMouseMove={(e) => handleMouseMove("image1", e)}
    onMouseUp={() => handleMouseUp("image1")}
    onMouseLeave={() => handleMouseLeave("image1")}
    onMouseEnter={() => setHoveredImage("image1")}
  >
    {images.image1 ? (
      <>
        {/* LAYER 3: Inner Drag Wrapper + ImageEditor */}
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

        {/* Floating Controls: Zoom In / Zoom Out */}
        <div
          data-html2canvas-ignore="true"
          className="absolute bottom-2 left-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20"
        >
          <button
            type="button"
            onClick={() => handleZoom("image1", "in")}
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100 text-gray-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom("image1", "out")}
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100 text-gray-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Controls: Rotate, Edit, Delete */}
        <div
          data-html2canvas-ignore="true"
          className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20"
        >
          <button
            type="button"
            onClick={() => handleRotate("image1")}
            className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 text-gray-700"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openImageSourceModal("image1")}
            className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 text-gray-700"
            title="Replace Image"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete("image1", fileInputRef1)}
            className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 text-red-500"
            title="Delete Image"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </>
    ) : (
      <div
        onClick={() => openImageSourceModal("image1")}
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
```

---

## 7. DRAGGABLE & DELETABLE TEXT FIELD PATTERNS

### 7.1 Single Editable & Draggable Field with Delete
```tsx
{!isFieldDeleted("priceAmount") && (
  <DraggableBox
    id="priceAmount"
    initialPosition={fieldPositions.priceAmount || { x: 0, y: 0 }}
    onPositionChange={(pos) => updateFieldPosition("priceAmount", pos)}
    isLocked={lockedSections.price}
  >
    <div className="relative group/field flex items-center">
      <StyledInput
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onChangeStyle={(style) => updateFieldStyle("amount", style)}
        inputStyle={fieldStyles.amount}
        className="text-[28px] font-bold text-gray-900 bg-transparent border-none focus:outline-none w-full"
        placeholder="$0,000,000"
      />
      <button
        data-html2canvas-ignore="true"
        type="button"
        onClick={() =>
          removeStandardField("priceAmount", "Price", amount, "Cover Price", fieldStyles.amount)
        }
        className="opacity-0 group-hover/field:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity ml-1"
        title="Delete Field"
      >
        <Trash className="w-3.5 h-3.5" />
      </button>
    </div>
  </DraggableBox>
)}
```

### 7.2 Draggable Section Block with Section Lock
```tsx
<div className="relative">
  {/* Section Lock/Unlock Toggle */}
  <div data-html2canvas-ignore="true" className="absolute -top-6 right-0 z-30">
    <button
      type="button"
      onClick={() => toggleSectionLock("address")}
      className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/90 px-2 py-0.5 rounded shadow border border-gray-200 hover:text-gray-900"
      title={lockedSections.address ? "Unlock section movement" : "Lock section in place"}
    >
      {lockedSections.address ? (
        <>
          <Lock className="w-3 h-3 text-amber-600" />
          <span className="text-amber-700 font-semibold">Locked</span>
        </>
      ) : (
        <>
          <Unlock className="w-3 h-3 text-gray-500" />
          <span>Unlocked</span>
        </>
      )}
    </button>
  </div>

  {/* Draggable Address Header */}
  <DraggableBox
    id="addressHeader"
    initialPosition={fieldPositions.addressHeader || { x: 0, y: 0 }}
    onPositionChange={(pos) => updateFieldPosition("addressHeader", pos)}
    isLocked={lockedSections.address}
  >
    {/* Address fields with delete buttons */}
    <div className="flex flex-col">
      {!isFieldDeleted("addressCode") && (
        <StyledInput
          value={addressCode}
          onChange={(e) => setAddressCode(e.target.value)}
          onChangeStyle={(style) => updateFieldStyle("addressCode", style)}
          inputStyle={fieldStyles.addressCode}
          className="text-[32px] font-extrabold text-[#00B9F2] bg-transparent border-none focus:outline-none"
          placeholder="SUITE / NUMBER"
        />
      )}
      {!isFieldDeleted("roadName") && (
        <StyledInput
          value={roadName}
          onChange={(e) => setRoadName(e.target.value)}
          onChangeStyle={(style) => updateFieldStyle("roadName", style)}
          inputStyle={fieldStyles.roadName}
          className="text-[22px] font-bold text-gray-800 bg-transparent border-none focus:outline-none"
          placeholder="STREET NAME"
        />
      )}
    </div>
  </DraggableBox>
</div>
```

---

## 8. EDGE-TO-EDGE BLEED HANDLING IN TABLOIDS

When a background gradient, header, or footer touches the paper edge:
1. **Container 1 Backgrounds:** Place full-bleed gradient bars directly in Container 1 with `absolute inset-0` or `absolute bottom-0 left-0 right-0 h-[180px]`.
2. **Container 3 Negative Margins:** For sidebars or footers inside Container 3 that need to touch the outer sheet bleed:
```tsx
<div
  className="flex h-[180px] px-[40px] shrink-0 relative z-20"
  style={{
    marginLeft: showBleed ? "-0.375in" : "-0.25in",
    marginRight: showBleed ? "-0.375in" : "-0.25in",
    background: "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #186C9B 89%, #226392 100%)",
  }}
>
  {/* Content */}
</div>
```

---

## 9. EXPORT & IMPORT PAYLOAD COMPLIANCE

Always include `fieldPositions`, `fieldStyles`, `deletedStandardFieldIds`, and `deletedDetailFields` in `exportToPayload` and restore them in `importFromPayload`:

```tsx
useImperativeHandle(ref, () => ({
  exportToPayload: async (): Promise<FeatureSheetPayload> => {
    return {
      templateId: "bcfp-standard-6",
      data: {
        bedroom,
        bathroom,
        sqft,
        builtYear,
        description,
        fullName,
        email,
        propertyName,
        amount,
        number,
        addressCode,
        companyName,
        roadName,
        cityLine,
        images,
        scale,
        position,
        rotation,
        leftDetailFields,
        rightDetailFields,
        fieldStyles,
        fieldPositions,
        deletedStandardFieldIds,
        deletedDetailFields,
        lockedSections,
      },
    };
  },
  importFromPayload: (payload: FeatureSheetResponse) => {
    if (!payload?.data) return;
    const d = payload.data;
    if (d.bedroom !== undefined) setBedroom(d.bedroom);
    if (d.bathroom !== undefined) setBathroom(d.bathroom);
    if (d.sqft !== undefined) setSqft(d.sqft);
    if (d.builtYear !== undefined) setBuiltYear(d.builtYear);
    if (d.description !== undefined) setDescription(d.description);
    if (d.fullName !== undefined) setFullName(d.fullName);
    if (d.email !== undefined) setEmail(d.email);
    if (d.propertyName !== undefined) setPropertyName(d.propertyName);
    if (d.amount !== undefined) setAmount(d.amount);
    if (d.number !== undefined) setNumber(d.number);
    if (d.addressCode !== undefined) setAddressCode(d.addressCode);
    if (d.companyName !== undefined) setCompanyName(d.companyName);
    if (d.roadName !== undefined) setRoadName(d.roadName);
    if (d.cityLine !== undefined) setCityLine(d.cityLine);
    if (d.images) setImages((prev) => ({ ...prev, ...d.images }));
    if (d.scale) setScale((prev) => ({ ...prev, ...d.scale }));
    if (d.position) setPosition((prev) => ({ ...prev, ...d.position }));
    if (d.rotation) setRotation((prev) => ({ ...prev, ...d.rotation }));
    if (d.leftDetailFields) setLeftDetailFields(d.leftDetailFields);
    if (d.rightDetailFields) setRightDetailFields(d.rightDetailFields);
    if (d.fieldStyles) setFieldStyles(d.fieldStyles);
    if (d.fieldPositions) setFieldPositions(d.fieldPositions);
    if (d.deletedStandardFieldIds) setDeletedStandardFieldIds(d.deletedStandardFieldIds);
    if (d.deletedDetailFields) setDeletedDetailFields(d.deletedDetailFields);
    if (d.lockedSections) setLockedSections(d.lockedSections);
  },
}));
```

---

## 10. TABLOID VERIFICATION CHECKLIST (95%+ PASS RATE)

Before considering any Tabloid Sheet upgrade complete, verify:
- [ ] Outer page style has `width: showBleed ? "17.25in" : "17.0in"`, `height: showBleed ? "11.25in" : "11.0in"`, and `zoom: 0.55`.
- [ ] `SafeZoneWrapper` wraps Container 3 content with `showBleed` and `showGuide` forwarded.
- [ ] All image mouse movements divide by `0.55` (`(clientX - lastX) / 0.55`).
- [ ] `BoxIndicator` is placed inside every image slot with `isVisible={hoveredImage === key || dragging[key]}`.
- [ ] All hover buttons (Zoom, Rotate, Edit, Trash, Lock) have `data-html2canvas-ignore="true"`.
- [ ] Deleting a standard or detail field registers in `DeletedFieldsPanel` and can be restored individually or via "Restore All".
- [ ] Freeform dragging via `DraggableBox` moves smoothly and obeys section lock state.
- [ ] PDF export does not contain any border indicators, guides, or hover buttons.
