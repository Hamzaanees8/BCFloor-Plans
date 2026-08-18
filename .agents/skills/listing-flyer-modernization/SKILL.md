---
name: listing-flyer-modernization
description: >
  Standardizes and upgrades BCFP Listing Flyers (Letter 8.5" x 11" Single & Multi-Page Flyers) with Guided Lines (Bleed & Safe Zone), Canva-style Box Indicators, Draggable & Deletable Fields, Field Restores, Text Styling, Three-Layer Image Editors, Section Drag Locks, and Three-Container Architecture.
---

# Listing Flyer Modernization & Upgrade Standard (Letter 8.5" x 11")

This skill is the comprehensive, authoritative runbook for upgrading any BCFP Listing Flyer (e.g. `Sheet1.tsx` through `Sheet13.tsx`, letter flyers) to the modern standard with Guided Lines, Draggable & Deletable Fields, Image Indicators, Three-Layer Image Crop pattern, and Safe Zone/Bleed architecture.

> **CRITICAL:** All UI patterns, prop names, state variable names, and behaviors must match the `BcfpStandard6.tsx` source of truth — only the sizing and zoom values differ for letter format. Do not deviate.

---

## 1. CORE ARCHITECTURE & SIZING SPECIFICATIONS (LETTER 8.5x11)

Every Listing Flyer is structured using the nested **Three-Container Architecture**:

```
+-----------------------------------------------------------------------------------+
| CONTAINER 1: Outer Page / Bleed Wrapper (.pdf-page)                               |
| - Dimensions: 8.75" x 11.25" (with Bleed) or 8.50" x 11.00" (no Bleed)            |
| - Style: zoom: 0.85 (or 1), relative, overflow: hidden, bg-white, shadow-xl       |
| - Edge-to-edge bleed layers (gradients, header/footer bands) live here             |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | CONTAINER 2: SafeZoneWrapper (0.125" Bleed Pad + 0.25" Safe Zone Inset)    |  |
|  | - Red Dashed Bleed Border Guide (data-html2canvas-ignore="true")           |  |
|  | - Emerald Dashed Safe Zone Border Guide (data-html2canvas-ignore="true")   |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | CONTAINER 3: Inner Content Container (relative w-full h-full z-10)   |  |  |
|  |  | - Hosts DraggableBox, StyledInput, property specs, logos, image slots |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Exact Dimension & Sizing Table (Letter 8.5x11)

| Parameter | Letter (8.5x11) with Bleed | Letter (8.5x11) No Bleed |
| :--- | :--- | :--- |
| **Page Width** | `8.75in` | `8.5in` |
| **Page Height** | `11.25in` | `11.0in` |
| **Bleed Padding** | `0.125in` (3mm) per edge | `0in` |
| **Safe Zone Inset** | `0.25in` (6mm) per edge | `0.25in` |
| **Preview Zoom** | `zoom: 0.85` (or `1.0`) | `zoom: 0.85` (or `1.0`) |
| **Negative Bleed Offset** | `marginLeft/Right: -0.375in`, `width: calc(... + 0.375in)` | `marginLeft/Right: -0.25in`, `width: calc(... + 0.25in)` |
| **Mouse Drag Zoom Divisor** | `0.85` (matches preview zoom) | `0.85` (or `1.0`) |

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
```

---

## 5. COMPLETE STATE PATTERN FOR LISTING FLYERS

The state must be declared in this exact order (same as Standard6):

```tsx
export interface ListingFlyerRef {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface ListingFlyerProps {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

const ListingFlyer = forwardRef<ListingFlyerRef, ListingFlyerProps>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── 1. Deletion & Restoration State ──────────────────────────────────────
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
      [updateFormData]
    );

    const restoreAllDetailFields = useCallback(() => {
      setDeletedStandardFieldIds([]);
      setDeletedDetailFields([]);
      updateFormData({ deletedStandardFieldIds: [], deletedDetailFields: [] });
    }, [updateFormData]);

    // Register restoration handlers with context
    useEffect(() => {
      if (setRestoreDetailFieldHandler) setRestoreDetailFieldHandler(() => restoreDetailField);
      if (setRestoreAllDetailFieldsHandler) setRestoreAllDetailFieldsHandler(() => restoreAllDetailFields);
      return () => {
        if (setRestoreDetailFieldHandler) setRestoreDetailFieldHandler(null);
        if (setRestoreAllDetailFieldsHandler) setRestoreAllDetailFieldsHandler(null);
      };
    }, [restoreDetailField, restoreAllDetailFields, setRestoreDetailFieldHandler, setRestoreAllDetailFieldsHandler]);

    // ── 2. Text Fields ────────────────────────────────────────────────────────
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
    const [contactLabel, setContactLabel] = useState("Contact:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("Email:");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM •");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM •");
    const [sqftLabel, setSqftLabel] = useState("SQ FT •");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [roadLabelBefore, setRoadLabelBefore] = useState("Number");
    const [roadLabelAfter, setRoadLabelAfter] = useState("Road");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
    );

    // ── 3. Bleed & Guide ─────────────────────────────────────────────────────
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed = propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide = propShowGuide !== undefined ? propShowGuide : showGuideState;

    // ── 4. Styles, Positions & Locks ──────────────────────────────────────────
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
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 5. Image States ───────────────────────────────────────────────────────
    // (Declare images, scale, position, rotation, dragging, lastPosition here)

    // ── 6. Modal & Slot States ────────────────────────────────────────────────
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

## 6. IMAGE SLOTS & THREE-LAYER PATTERN (LETTER FLYERS)

### 6.1 Drag Delta Calculation (Letter Zoom 0.85)
```tsx
const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
  if (!dragging[key]) return;
  // Divide mouse delta by preview zoom (0.85) for 1:1 cursor movement
  const dx = (e.clientX - lastPosition.current[key].x) / 0.85;
  const dy = (e.clientY - lastPosition.current[key].y) / 0.85;
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

### 6.3 Full JSX Pattern for Letter Image Slots

> **KEY RULES (identical to tabloid, just zoom changes):**
> - Outer container MUST have `data-image-slot="true"`, `onMouseEnter/Leave` (sets `hoveredSlot`), and `onClick` (checks `e.altKey` before setting `activeSlot`).
> - `BoxIndicator` uses `isSlotActive("imageN")` helper — NOT `hoveredImage`.
> - Rotate, Edit, Delete are **3 separate `absolute` buttons** — NOT in a shared flex wrapper.
> - Zoom controls div has **NO** `data-html2canvas-ignore`.
> - Empty state placeholder div MUST have `data-html2canvas-ignore="true"` and pass `(e) => openImageSourceModal("imageN", e)`.

```tsx
{/* LAYER 1: Outer Slot Container */}
<div
  data-image-slot="true"
  className="w-full h-[360px] relative overflow-hidden group cursor-pointer"
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

### 7.1 DraggableBox — Correct Prop API

> **CRITICAL PROP DIFFERENCES vs old pattern:**
> | Prop | ❌ OLD (wrong) | ✅ NEW (correct) |
> |---|---|---|
> | Position | `initialPosition={fieldPositions.id \|\| {x:0,y:0}}` | `position={fieldPositions.id}` |
> | Lock | `isLocked={lockedSections.section}` | `disabled={lockedSections.section}` |
> | Position change | `onPositionChange={(pos) => updateFieldPosition("id", pos)}` | `onPositionChange={updateFieldPosition}` (direct ref) |
> | Delete | Manual `<button>` child inside box | `onDelete={() => removeStandardField(...)}` prop |
> | Tooltip | — | `deleteTitle="Remove Field Name"` prop |
> | Zoom | — | `zoom={0.85}` (MUST match page zoom for letter flyers) |
> | Label | — | `label="Field Label"` |

### 7.2 Single Editable & Draggable Field with Delete
```tsx
{!isFieldDeleted("priceAmount") && (
  <DraggableBox
    id="priceAmount"
    position={fieldPositions.priceAmount}
    onPositionChange={updateFieldPosition}
    label="Price"
    zoom={0.85}
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
  className={`flex w-full flex-col relative pt-[45px] pb-2 border-[3.5px] border-solid
    border-transparent rounded-lg px-2 transition-all duration-150 group/sec ${
    lockedSections.specs
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
      toggleSectionLock("specs");
    }}
    className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150
      shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
      opacity-0 group-hover/sec:opacity-100 ${
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
      <><Lock className="w-3 h-3" /><span>Locked</span></>
    ) : (
      <><Unlock className="w-3 h-3" /><span>Lock</span></>
    )}
  </button>

  {/* Specs Grid with DraggableBox fields */}
  <DraggableBox
    id="specsGrid"
    position={fieldPositions.specsGrid}
    onPositionChange={updateFieldPosition}
    label="Specs"
    zoom={0.85}
    disabled={lockedSections.specs}
  >
    <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
      {!isFieldDeleted("specBedroom") && (
        <DraggableBox
          id="specBedroom"
          position={fieldPositions.specBedroom}
          onPositionChange={updateFieldPosition}
          label="Bedrooms"
          zoom={0.85}
          disabled={lockedSections.specs}
          onDelete={() =>
            removeStandardField("specBedroom", "Bedrooms", bedroom, "Specs", fieldStyles.bedroom)
          }
          deleteTitle="Remove Bedrooms"
        >
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold text-gray-400 uppercase">Bedrooms</span>
            <StyledInput
              value={bedroom}
              onChange={(e) => setBedroom(e.target.value)}
              onChangeStyle={(style) => updateFieldStyle("bedroom", style)}
              inputStyle={fieldStyles.bedroom}
              className="text-sm font-bold text-gray-800 bg-transparent border-none focus:outline-none"
              placeholder="0"
            />
          </div>
        </DraggableBox>
      )}
      {/* Bathroom, SqFt, Year Built follow exact same pattern */}
    </div>
  </DraggableBox>
</div>
```

### 7.4 Editable Labels & Section Titles Pattern (`StyledInput`)

> **RULE:** Static text labels (e.g. `"Contact:"`, `"PHONE:"`, `"Email:"`, `"BEDROOM •"`, `"BATHROOM •"`, `"SQ FT •"`, `"BUILT IN"`, `"Number"`, `"Road"`, and Disclaimer text) **MUST NOT** be hardcoded static `<span>` elements.
> Wrap all labels in `StyledInput` so users can edit label text inline and customize font family, size, weight, alignment, and color from the floating toolbar portal.

```tsx
{/* Editable Contact Label */}
<StyledInput
  value={contactLabel}
  onChange={(e) => setContactLabel(e.target.value)}
  onChangeStyle={(s) => updateFieldStyle("contactLabel", s)}
  inputStyle={fieldStyles.contactLabel}
  className="text-[20px] font-[300] bg-transparent text-left focus:outline-none border-none placeholder-gray-300"
  placeholder="Contact:"
/>

{/* Editable Property Spec Label */}
<StyledInput
  value={bedroomLabel}
  onChange={(e) => setBedroomLabel(e.target.value)}
  onChangeStyle={(s) => updateFieldStyle("bedroomLabel", s)}
  inputStyle={fieldStyles.bedroomLabel}
  className="font-bold text-[18px] text-white bg-transparent text-left focus:outline-none border-none placeholder-gray-300 uppercase"
  placeholder="BEDROOM •"
/>
```

---

## 8. FORMDATA SYNC — CORRECT KEY NAMES

> **CRITICAL:** Image state is saved under `imageScales`, `imagePositions`, `imageRotations` — NOT `scale`, `position`, `rotation`.

```tsx
// ✅ Correct — in the context sync useEffect
updateFormData({
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

## 9. EXPORT PAYLOAD — USES `featureSheetService.buildPayload`

> **Do NOT export a plain object.** Always use `featureSheetService.buildPayload()`.

```tsx
useImperativeHandle(ref, () => ({
  exportToPayload: async (): Promise<FeatureSheetPayload> => {
    const payload = await featureSheetService.buildPayload({
      orderUuid: orderData?.uuid || "",
      templateKey: "SheetN",           // ← use the correct template key for this flyer
      uploadedBy: "admin",
      type: "template",
      primaryColor: "#376173",
      offeredAtPrice: { value: amount, style: fieldStyles.amount || ({} as TextStyle) },
      realtorName: { value: fullName, style: fieldStyles.fullName || ({} as TextStyle) },
      emailLink: { value: email, style: fieldStyles.email || ({} as TextStyle) },
      companyName: { value: propertyName, style: fieldStyles.propertyName || ({} as TextStyle) },
      propertyNotesTitle: { value: roadName, style: fieldStyles.roadName || ({} as TextStyle) },
      propertyNotesDescription: { value: description, style: fieldStyles.description || ({} as TextStyle) },
      // ... map remaining fields
    });
    return payload;
  },
  importFromPayload: (payload: FeatureSheetResponse) => {
    if (!payload?.data) return;
    // Restore fields in reverse from the same mapping
  },
}));
```

---

## 10. GALLERY JSX RENDERING

The `showImageSourceModal` state exists but `openImageSourceModal` never triggers it.
Open `FileManagerGallery` directly:

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

    {/* pdf-page — outer bleed container */}
    <div
      className="flex items-stretch pdf-page bg-white shadow-xl relative overflow-hidden"
      style={{
        width: showBleed ? "8.75in" : "8.5in",
        height: showBleed ? "11.25in" : "11in",
        zoom: 0.85,
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

## 11. LISTING FLYER VERIFICATION CHECKLIST (95%+ PASS RATE)

Before considering any Listing Flyer upgrade complete, verify every item:

- [ ] Outer page style has `width: showBleed ? "8.75in" : "8.5in"`, `height: showBleed ? "11.25in" : "11.0in"`, and `zoom: 0.85`.
- [ ] `SafeZoneWrapper` wraps Container 3 content with `showBleed` and `showGuide` forwarded.
- [ ] Image drag mouse movements divide by `0.85` (`(clientX - lastX) / 0.85`).
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
- [ ] `DraggableBox` props use `position=` (not `initialPosition=`), `disabled=` (not `isLocked=`), `onPositionChange={updateFieldPosition}` (direct ref), `zoom={0.85}`, `label=`, `onDelete=`, `deleteTitle=`.
- [ ] `updateFormData` uses `imageScales:`, `imagePositions:`, `imageRotations:` keys (NOT `scale:`, `position:`, `rotation:`).
- [ ] Section labels (`Contact:`, `PHONE:`, `Email:`, `BEDROOM •`, `BATHROOM •`, `SQ FT •`, `BUILT IN`, `Number`, `Road`, `Disclaimer`) use `StyledInput` instead of hardcoded static `<span>` elements.
- [ ] Label states (`contactLabel`, `phoneLabel`, etc.) and `fieldStyles` are synced in `updateFormData`, exported in `exportToPayload`, and restored in `importFromPayload`.
- [ ] Export uses `featureSheetService.buildPayload()` — NOT a plain object return.
- [ ] Deleting a field registers in `DeletedFieldsPanel` and can be restored.
- [ ] `DraggableBox` moves smoothly and respects section lock states.
- [ ] PDF export produces a clean, high-resolution flyer without UI overlays.
