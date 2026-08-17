---
name: listing-flyer-modernization
description: >
  Standardizes and upgrades BCFP Listing Flyers (Letter 8.5" x 11" Single & Multi-Page Flyers) with Guided Lines (Bleed & Safe Zone), Canva-style Box Indicators, Draggable & Deletable Fields, Field Restores, Text Styling, Three-Layer Image Editors, Section Drag Locks, and Three-Container Architecture.
---

# Listing Flyer Modernization & Upgrade Standard (Letter 8.5" x 11")

This skill is the comprehensive, authoritative runbook for upgrading any BCFP Listing Flyer (e.g. `Sheet1.tsx` through `Sheet13.tsx`, letter flyers) to the modern standard with Guided Lines, Draggable & Deletable Fields, Image Indicators, Three-Layer Image Crop pattern, and Safe Zone/Bleed architecture.

---

## 1. CORE ARCHITECTURE & SIZING SPECIFICATIONS (LETTER 8.5" x 11")

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

    // 3. Styles, Positions & Locks
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

    // 4. Deletion & Restoration State
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
      updateFormData({
        deletedStandardFieldIds: [],
        deletedDetailFields: [],
      });
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

### 6.2 JSX Pattern for Letter Image Slots
```tsx
{/* LAYER 1: Outer Slot Container with group */}
<div className="w-full h-[360px] relative overflow-hidden group">
  {/* Canva-Style Box Indicator */}
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

        {/* Floating Zoom Controls */}
        <div
          data-html2canvas-ignore="true"
          className="absolute bottom-2 left-2 flex gap-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20"
        >
          <button
            type="button"
            onClick={() => handleZoom("image1", "in")}
            className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 text-gray-700"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom("image1", "out")}
            className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 text-gray-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Rotate, Edit, Delete */}
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
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openImageSourceModal("image1")}
            className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 text-gray-700"
            title="Replace Image"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete("image1", fileInputRef1)}
            className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100 text-red-500"
            title="Delete Image"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </>
    ) : (
      <div
        onClick={() => openImageSourceModal("image1")}
        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs hover:bg-gray-300 transition-colors"
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

## 7. DRAGGABLE & DELETABLE FIELDS (LETTER FLYERS)

```tsx
<div className="relative">
  {/* Section Lock/Unlock Toggle */}
  <div data-html2canvas-ignore="true" className="absolute -top-5 right-0 z-30">
    <button
      type="button"
      onClick={() => toggleSectionLock("specs")}
      className="flex items-center gap-1 text-[9px] text-gray-500 bg-white/90 px-1.5 py-0.5 rounded shadow border border-gray-200 hover:text-gray-900"
      title={lockedSections.specs ? "Unlock specs movement" : "Lock specs in place"}
    >
      {lockedSections.specs ? (
        <>
          <Lock className="w-2.5 h-2.5 text-amber-600" />
          <span className="text-amber-700 font-semibold">Locked</span>
        </>
      ) : (
        <>
          <Unlock className="w-2.5 h-2.5 text-gray-500" />
          <span>Unlocked</span>
        </>
      )}
    </button>
  </div>

  {/* Draggable Specs Grid */}
  <DraggableBox
    id="specsGrid"
    initialPosition={fieldPositions.specsGrid || { x: 0, y: 0 }}
    onPositionChange={(pos) => updateFieldPosition("specsGrid", pos)}
    isLocked={lockedSections.specs}
  >
    <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
      {!isFieldDeleted("specBedroom") && (
        <div className="relative group/spec flex flex-col">
          <span className="text-[9px] font-semibold text-gray-400 uppercase">Bedrooms</span>
          <div className="flex items-center justify-between">
            <StyledInput
              value={bedroom}
              onChange={(e) => setBedroom(e.target.value)}
              onChangeStyle={(style) => updateFieldStyle("bedroom", style)}
              inputStyle={fieldStyles.bedroom}
              className="text-sm font-bold text-gray-800 bg-transparent border-none focus:outline-none"
              placeholder="0"
            />
            <button
              data-html2canvas-ignore="true"
              type="button"
              onClick={() =>
                removeStandardField("specBedroom", "Bedrooms", bedroom, "Specs", fieldStyles.bedroom)
              }
              className="opacity-0 group-hover/spec:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity"
            >
              <Trash className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      {/* Bathroom, SqFt, Year Built follow exact same pattern */}
    </div>
  </DraggableBox>
</div>
```

---

## 8. EXPORT & IMPORT PAYLOAD COMPLIANCE

```tsx
useImperativeHandle(ref, () => ({
  exportToPayload: async (): Promise<FeatureSheetPayload> => {
    return {
      templateId: "sheet-standard",
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
    if (d.fieldStyles) setFieldStyles(d.fieldStyles);
    if (d.fieldPositions) setFieldPositions(d.fieldPositions);
    if (d.deletedStandardFieldIds) setDeletedStandardFieldIds(d.deletedStandardFieldIds);
    if (d.deletedDetailFields) setDeletedDetailFields(d.deletedDetailFields);
    if (d.lockedSections) setLockedSections(d.lockedSections);
  },
}));
```

---

## 9. LISTING FLYER VERIFICATION CHECKLIST (95%+ PASS RATE)

Before considering any Listing Flyer upgrade complete, verify:
- [ ] Outer page style has `width: showBleed ? "8.75in" : "8.5in"`, `height: showBleed ? "11.25in" : "11.0in"`, and `zoom: 0.85`.
- [ ] `SafeZoneWrapper` wraps Container 3 content with `showBleed` and `showGuide` forwarded.
- [ ] Image drag mouse movements divide by `0.85` (`(clientX - lastX) / 0.85`).
- [ ] `BoxIndicator` is active on hover/drag for every image slot.
- [ ] All action buttons have `data-html2canvas-ignore="true"`.
- [ ] Deleting a field registers in `DeletedFieldsPanel` and can be restored.
- [ ] `DraggableBox` moves smoothly and respects section lock states.
- [ ] PDF export produces a clean, high-resolution flyer without UI overlays.
