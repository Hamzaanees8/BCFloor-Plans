---
name: tabloid-sheet-modernization
description: >
  Standardizes and upgrades BCFP Tabloid Sheets (17" x 11" 4-page spreads / single spreads) with Guided Lines (Bleed & Safe Zone), Canva-style Box Indicators, Draggable & Deletable Fields, Field Restores, Text Styling, Three-Layer Image Editors, Section Drag Locks, and Three-Container Architecture based on BcfpStandard6.
---

# Tabloid Sheet Modernization & Upgrade Standard (17" x 11")

This skill is the comprehensive, authoritative runbook for upgrading any BCFP Tabloid Feature Sheet (e.g. `BcfpStandard1.tsx` through `BcfpStandard10.tsx`, tabloid 4-page / 2-page spreads) to the modern standard established in `BcfpStandard6.tsx`.

> **CRITICAL:** Every pattern in this document is extracted directly from `BcfpStandard6.tsx`. Do not deviate — implement exactly as shown, including prop names, class names, and state variable names.

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

> **NOTE:** `GripVertical` is NOT imported in Standard6 — do not import it.

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

The state must be declared in this exact order:

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

    // ── 1. Detail Fields ─────────────────────────────────────────────────────
    const [leftDetailFields, setLeftDetailFields] = useState<DetailField[]>(
      DEFAULT_LEFT_DETAIL_FIELDS
    );
    const [rightDetailFields, setRightDetailFields] = useState<DetailField[]>(
      DEFAULT_RIGHT_DETAIL_FIELDS
    );

    // Detail field update helpers
    const updateDetailTitle = (id: string, title: string) => {
      setLeftDetailFields((prev) => prev.map((f) => (f.id === id ? { ...f, title } : f)));
      setRightDetailFields((prev) => prev.map((f) => (f.id === id ? { ...f, title } : f)));
    };
    const updateDetailValue = (id: string, value: string) => {
      setLeftDetailFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
      setRightDetailFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
    };
    const updateDetailStyle = (id: string, style: TextStyle) => {
      setLeftDetailFields((prev) => prev.map((f) => (f.id === id ? { ...f, style } : f)));
      setRightDetailFields((prev) => prev.map((f) => (f.id === id ? { ...f, style } : f)));
    };
    const updateDetailTitleStyle = (id: string, style: TextStyle) => {
      setLeftDetailFields((prev) => prev.map((f) => (f.id === id ? { ...f, titleStyle: style } : f)));
      setRightDetailFields((prev) => prev.map((f) => (f.id === id ? { ...f, titleStyle: style } : f)));
    };

    // ── 2. Deletion & Restoration State ──────────────────────────────────────
    const [deletedDetailFields, setDeletedDetailFields] = useState<any[]>(
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
          id, title, value: value || "", section, style, deletedAt: Date.now(),
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
              updateFormData({ deletedStandardFieldIds: updatedStandard, deletedDetailFields: updatedDeleted });
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
            id: fieldToRestore.id, title: fieldToRestore.title, value: fieldToRestore.value,
            style: fieldToRestore.style, titleStyle: fieldToRestore.titleStyle,
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
          if (STANDARD_FIELD_IDS.has(field.id) || deletedStandardFieldIds.includes(field.id)) return;
          const cleanField: DetailField = {
            id: field.id, title: field.title, value: field.value,
            style: field.style, titleStyle: field.titleStyle,
          };
          if (field.column === "right") rightRestored.push(cleanField);
          else leftRestored.push(cleanField);
        });
        if (leftRestored.length > 0) setLeftDetailFields((prev) => [...prev, ...leftRestored]);
        if (rightRestored.length > 0) setRightDetailFields((prev) => [...prev, ...rightRestored]);
        setDeletedStandardFieldIds([]);
        updateFormData({ deletedStandardFieldIds: [], deletedDetailFields: [] });
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

    // ── 3. Text Fields ────────────────────────────────────────────────────────
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

    // ── 4. Bleed & Guide ─────────────────────────────────────────────────────
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed = propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide = propShowGuide !== undefined ? propShowGuide : showGuideState;

    // ── 5. Styles & Positions & Locks ────────────────────────────────────────
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

    // ── 6. Image States ───────────────────────────────────────────────────────
    // (Declare images, scale, position, rotation, dragging, lastPosition here)
    // ...

    // ── 7. Modal & Slot States ────────────────────────────────────────────────
    const [showImageSourceModal, setShowImageSourceModal] = useState(false);
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);

    // hoveredSlot / activeSlot — used by isSlotActive() and BoxIndicator
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
    const [activeSlot, setActiveSlot] = useState<string | null>(null);

    const isSlotActive = (key: string) =>
      hoveredSlot === key ||
      activeSlot === key ||
      Boolean(dragging[key as keyof typeof dragging]);

    // Click-outside clears activeSlot
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
```

---

## 6. IMAGE SLOTS & THREE-LAYER PATTERN

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

### 6.2 `openImageSourceModal` — Goes Directly to Gallery & Respects Alt Key
```tsx
// ✅ CORRECT — skips ImageSourceModal, opens gallery directly, ignores Alt+click canvas pan
const openImageSourceModal = (imageSlot: string, e?: React.MouseEvent) => {
  if (e?.altKey) return;
  setCurrentImageSlot(imageSlot);
  setShowGallery(true);       // <-- gallery, NOT setShowImageSourceModal(true)
};
```

### 6.3 Full JSX Pattern for Every Image Slot

> **KEY RULES:**
> - Outer container MUST have `data-image-slot="true"`, `onMouseEnter/Leave` (sets `hoveredSlot`), and `onClick` (checks `e.altKey` before setting `activeSlot`).
> - `BoxIndicator` uses `isSlotActive("imageN")` helper — NOT `hoveredImage`.
> - Rotate, Edit, Delete are **3 separate `absolute` buttons** — NOT in a shared flex wrapper.
> - Zoom controls div has **NO** `data-html2canvas-ignore`.
> - Each individual control button (Rotate, Edit, Delete) does NOT need `data-html2canvas-ignore` either — they use CSS `opacity-0 group-hover:opacity-100` to hide.
> - Empty state placeholder div MUST have `data-html2canvas-ignore="true"` and pass `(e) => openImageSourceModal("imageN", e)`.

```tsx
{/* LAYER 1: Outer Slot Container */}
<div
  data-image-slot="true"
  className="w-full h-[580px] place-self-center relative overflow-hidden group cursor-pointer"
  onMouseEnter={() => setHoveredSlot("image1")}
  onMouseLeave={() => setHoveredSlot(null)}
  onClick={(e) => {
    if (e.altKey) return;
    e.stopPropagation();
    setActiveSlot("image1");
  }}
>
  {/* Canva-Style Box Indicator — uses isSlotActive helper */}
  <BoxIndicator isVisible={isSlotActive("image1")} />

  {/* LAYER 2: Middle Mouse Event Container */}
  <div
    className="w-full h-full relative overflow-hidden flex items-center justify-center"
    onMouseMove={(e) => handleMouseMove("image1", e)}
    onMouseUp={() => handleMouseUp("image1")}
    onMouseLeave={() => handleMouseLeave("image1")}
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

        {/* Zoom Controls — bottom-left, NO data-html2canvas-ignore */}
        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

        {/* Rotate — standalone absolute button */}
        <button
          type="button"
          onClick={() => handleRotate("image1")}
          className="absolute top-24 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
          title="Rotate image"
        >
          <RotateCw className="w-4 h-4 text-gray-700" />
        </button>

        {/* Edit — standalone absolute button */}
        <button
          type="button"
          onClick={(e) => openImageSourceModal("image1", e)}
          className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          title="Edit image"
        >
          <Pencil className="w-4 h-4 text-gray-700" />
        </button>

        {/* Delete — standalone absolute button, text-red-500 icon */}
        <button
          type="button"
          onClick={() => handleDelete("image1", fileInputRef1)}
          className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          title="Delete image"
        >
          <Trash className="w-4 h-4 text-red-500" />
        </button>
      </>
    ) : (
      /* Empty state — MUST have data-html2canvas-ignore="true" */
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
```

---

## 7. DRAGGABLE & DELETABLE TEXT FIELD PATTERNS

### 7.1 DraggableBox — Correct Prop API

> **CRITICAL PROP DIFFERENCES vs old pattern:**
> | Prop | ❌ OLD (wrong) | ✅ NEW (correct) |
> |---|---|---|
> | Position | `initialPosition={fieldPositions.id \|\| {x:0,y:0}}` | `position={fieldPositions.id}` |
> | Lock | `isLocked={lockedSections.section}` | `disabled={lockedSections.section}` |
> | Position change | `onPositionChange={(pos) => updateFieldPosition("id", pos)}` | `onPositionChange={updateFieldPosition}` (direct ref) |
> | Delete | Manual `<button>` child inside box | `onDelete={() => removeStandardField(...)}` prop |
> | Tooltip | — | `deleteTitle="Remove Field Name"` prop |
> | Zoom | — | `zoom={0.55}` (MUST match page zoom) |
> | Label | — | `label="Field Label"` |

### 7.2 Single Editable & Draggable Field with Delete
```tsx
{!isFieldDeleted("priceAmount") && (
  <DraggableBox
    id="priceAmount"
    position={fieldPositions.priceAmount}
    onPositionChange={updateFieldPosition}
    label="Price"
    zoom={0.55}
    disabled={lockedSections.price}
    onDelete={() =>
      removeStandardField("priceAmount", "Price", amount, "Cover Price", fieldStyles.amount)
    }
    deleteTitle="Remove Price"
  >
    <StyledInput
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      onChangeStyle={(style) => updateFieldStyle("amount", style)}
      inputStyle={fieldStyles.amount}
      className="text-[28px] font-bold text-gray-900 bg-transparent border-none focus:outline-none w-full"
      placeholder="$0,000,000"
    />
  </DraggableBox>
)}
```

### 7.3 Section Container with Lock Button — COMPLETE PATTERN

> **This is the most critical pattern.** The lock button lives INSIDE the section container.
> The container itself changes its hover glow color based on lock state (purple = unlocked, amber = locked).
> The lock button is HIDDEN (`opacity-0`) until the user hovers the section (`group-hover/sec:opacity-100`).
> When **locked**: button is `bg-amber-500 text-white` (filled amber). When **unlocked**: `bg-white/90 text-gray-700 border border-gray-200` (ghost).

```tsx
{/* Section Container — group/sec for hover detection */}
<div
  data-safezone-container="true"
  className={`flex w-full flex-col justify-center relative z-[19] items-center
    pt-[45px] pb-2 border-[3.5px] border-solid border-transparent rounded-lg px-2
    transition-all duration-150 group/sec ${
    lockedSections.address
      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
  }`}
>
  {/* Lock / Unlock Toggle Button — hidden until hover, inside the container */}
  <button
    type="button"
    data-html2canvas-ignore="true"
    onClick={(e) => {
      e.stopPropagation();              // ← REQUIRED
      toggleSectionLock("address");
    }}
    className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150
      shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
      opacity-0 group-hover/sec:opacity-100 ${
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
      <><Lock className="w-3 h-3" /><span>Locked</span></>
    ) : (
      <><Unlock className="w-3 h-3" /><span>Lock</span></>
    )}
  </button>

  {/* Fields inside: use DraggableBox with disabled={lockedSections.address} */}
  {!isFieldDeleted("addressCode") && (
    <DraggableBox
      id="addressCode"
      position={fieldPositions.addressCode}
      onPositionChange={updateFieldPosition}
      label="MLS"
      zoom={0.55}
      disabled={lockedSections.address}
      onDelete={() =>
        removeStandardField("addressCode", "MLS #", addressCode || "0000-0000", "Page 1 - Address", fieldStyles.addressCode)
      }
      deleteTitle="Remove MLS Code"
    >
      <StyledInput
        value={addressCode}
        onChange={(e) => setAddressCode(e.target.value)}
        onChangeStyle={(s) => updateFieldStyle("addressCode", s)}
        inputStyle={fieldStyles.addressCode}
        className="font-light text-[28px] h-[30px] w-[150px] leading-none bg-transparent text-[#00B9F2] focus:outline-none border-none"
        placeholder="0000-0000"
      />
    </DraggableBox>
  )}
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

## 9. FORMDATA SYNC — CORRECT KEY NAMES

> **CRITICAL:** Image state is saved under `imageScales`, `imagePositions`, `imageRotations` — NOT `scale`, `position`, `rotation`.

```tsx
// ✅ Correct — in the context sync useEffect
updateFormData({
  leftDetailFields,
  rightDetailFields,
  deletedStandardFieldIds,
  deletedDetailFields,
  bedroom, bathroom, sqft, builtYear, description,
  fullName, email, propertyName, amount, number,
  addressCode, roadName, cityLine,
  images,
  imageScales: scale,        // ← "imageScales" not "scale"
  imagePositions: position,  // ← "imagePositions" not "position"
  imageRotations: rotation,  // ← "imageRotations" not "rotation"
  fieldPositions,
});

// ✅ Correct — restoring from formData
if (formData.imageScales) setScale((prev) => ({ ...prev, ...formData.imageScales }));
if (formData.imagePositions) setPosition((prev) => ({ ...prev, ...formData.imagePositions }));
if (formData.imageRotations) setRotation((prev) => ({ ...prev, ...formData.imageRotations }));
```

---

## 10. EXPORT PAYLOAD — USES `featureSheetService.buildPayload`

> **Do NOT export a plain object.** Always use `featureSheetService.buildPayload()`.

```tsx
useImperativeHandle(ref, () => ({
  exportToPayload: async (): Promise<FeatureSheetPayload> => {
    const payload = await featureSheetService.buildPayload({
      orderUuid: orderData?.uuid || "",
      templateKey: "BCFPStandardN",   // ← use the correct template key
      uploadedBy: "admin",
      type: "template",
      primaryColor: "#376173",
      offeredAtPrice: { value: amount, style: fieldStyles.amount || ({} as TextStyle) },
      realtorName: { value: fullName, style: fieldStyles.fullName || ({} as TextStyle) },
      emailLink: { value: email, style: fieldStyles.email || ({} as TextStyle) },
      companyName: { value: propertyName, style: fieldStyles.propertyName || ({} as TextStyle) },
      propertyNotesTitle: { value: roadName, style: fieldStyles.roadName || ({} as TextStyle) },
      propertyNotesDescription: { value: description, style: fieldStyles.description || ({} as TextStyle) },
      // ... map remaining detail fields to their named payload keys
    });
    return payload;
  },
  importFromPayload: (payload: FeatureSheetResponse) => {
    if (!payload?.data) return;
    // Restore via the same field mapping in reverse
  },
}));
```

---

## 11. GALLERY JSX RENDERING — Modal Pair

The `showImageSourceModal` state exists but Standard6 **never shows** it from `openImageSourceModal`.
Only render the `FileManagerGallery` — `ImageSourceModal` can be omitted or kept for future use:

```tsx
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

    {/* Page banners */}
    <div data-html2canvas-ignore="true" ...>PAGE 4 | PAGE 1</div>

    {/* pdf-page — outer bleed container */}
    <div
      className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
      style={{
        width: showBleed ? "17.25in" : "17in",
        height: showBleed ? "11.25in" : "11in",
        zoom: 0.55,
      }}
    >
      {/* Full-bleed gradients at Container 1 level */}
      ...
      <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
        {/* Container 3 content */}
      </SafeZoneWrapper>
    </div>
  </>
);
```

---

## 12. TABLOID VERIFICATION CHECKLIST (95%+ PASS RATE)

Before considering any Tabloid Sheet upgrade complete, verify every item:

- [ ] Outer page style has `width: showBleed ? "17.25in" : "17.0in"`, `height: showBleed ? "11.25in" : "11.0in"`, and `zoom: 0.55`.
- [ ] `SafeZoneWrapper` wraps Container 3 content with `showBleed` and `showGuide` forwarded.
- [ ] All image mouse movements divide by `0.55` (`(clientX - lastX) / 0.55`).
- [ ] `BoxIndicator` uses `isSlotActive("imageN")` — NOT `hoveredImage`.
- [ ] Every image slot outer div has `data-image-slot="true"`, `onMouseEnter` (sets `hoveredSlot`), `onMouseLeave`, and `onClick` (sets `activeSlot` with `e.stopPropagation()`).
- [ ] Click-outside `useEffect` on `window` clears `activeSlot` when click is outside `[data-image-slot="true"]`.
- [ ] Empty image placeholder divs have `data-html2canvas-ignore="true"`.
- [ ] Rotate, Edit, Delete are **3 separate `absolute` buttons** (NOT in a shared flex wrapper).
- [ ] Zoom controls div does **NOT** have `data-html2canvas-ignore`.
- [ ] `openImageSourceModal` sets `showGallery(true)` — NOT `showImageSourceModal(true)`.
- [ ] Section containers use `group/sec` class and color-switching hover border (`#8B3DFF` purple / `amber-400` amber).
- [ ] Lock button is inside the section container, `opacity-0 group-hover/sec:opacity-100`, with `e.stopPropagation()` and `data-html2canvas-ignore="true"`.
- [ ] When locked: lock button is `bg-amber-500 text-white hover:bg-amber-600`. When unlocked: `bg-white/90 text-gray-700 border border-gray-200`.
- [ ] Lock button label: **"Lock"** (unlocked state), **"Locked"** (locked state). NOT "Unlocked".
- [ ] `DraggableBox` props use `position=` (not `initialPosition=`), `disabled=` (not `isLocked=`), `onPositionChange={updateFieldPosition}` (direct ref), `zoom={0.55}`, `label=`, `onDelete=`, `deleteTitle=`.
- [ ] `updateFormData` uses `imageScales:`, `imagePositions:`, `imageRotations:` keys (NOT `scale:`, `position:`, `rotation:`).
- [ ] Export uses `featureSheetService.buildPayload()` — NOT a plain object return.
- [ ] Deleting a standard or detail field registers in `DeletedFieldsPanel` and can be restored individually or via "Restore All".
- [ ] PDF export does not contain any border indicators, guides, or hover buttons.
