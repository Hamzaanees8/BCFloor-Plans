---
name: fix-tabloid-17x11-sheet
description: >
  Converts or audits any existing BcfpStandard tabloid sheet that uses the
  17in x 11in zoom pattern (BcfpStandard3, etc.) to ensure it has the correct
  layout, page-number banners, ImageEditor integration, property/order data
  auto-population, and PDF-accurate image capture. Use this skill whenever a
  17x11 tabloid sheet is broken, missing features, or producing incorrect PDFs.
---

# SKILL: Fix Tabloid 17x11 Sheet (Full Checklist)

This skill covers all required changes to make a 17x11-inch Tabloid sheet
work correctly end-to-end: layout, preview zoom, page labels, ImageEditor,
data population, and PDF accuracy.

---

## ARCHITECTURE -- 17x11 Zoom Pattern

This family of sheets does NOT use the four w-[816px] pages of the standard
Tabloid pattern. Instead each physical Tabloid sheet is one 17in x 11in div
zoomed to 55% for preview. The sheet always has 2 pdf-page divs (two
physical Tabloid sheets = 4 half-pages viewed side by side).

  pdf-page 1 = Left half + Right half (one Tabloid sheet)
  pdf-page 2 = Left half + Right half (second Tabloid sheet)

---

## CHECKLIST -- apply every item below

### 1. Page Wrapper Sizing & Zoom

Each pdf-page wrapper must have exactly this inline style:

```tsx
<div
  className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
  style={{ width: "17in", height: "11in", zoom: 0.55, margin: "0 auto", marginBottom: "40px" }}
>
  <div className="w-1/2 ...">{ /* left half */ }</div>
  <div className="w-1/2 ...">{ /* right half */ }</div>
</div>
```

Rules:
- zoom: 0.55 -- preview only, never remove it
- width: "17in" and height: "11in" -- real paper dimensions
- overflow-hidden -- prevents bleed
- Both halves use w-1/2 so they fill the 17in width equally
- Do NOT use pixel widths on the wrapper. Use only "17in" / "11in".

---

### 2. Page Number Banners (not captured in PDF)

Add a divider banner ABOVE each pdf-page.
It must use data-html2canvas-ignore="true" so it is excluded from PDF capture.

```tsx
{/* Page 1 divider */}
<div
  className="w-full flex items-center justify-center my-8"
  data-html2canvas-ignore="true"
>
  <div className="h-[1px] bg-gray-300 flex-1"></div>
  <span className="text-gray-400 font-medium tracking-widest text-sm px-4 select-none">
    PAGE 1
  </span>
  <div className="h-[1px] bg-gray-300 flex-1"></div>
</div>
```

Repeat with PAGE 2 above the second pdf-page.

---

### 3. Outer Grid Wrapper

Wrap both page-banners and pdf-pages in a single scroll container:

```tsx
<div className="w-full flex flex-col items-center justify-center font-alexandria py-8 gap-0">
  {/* PAGE 1 banner */}
  {/* pdf-page 1 */}
  {/* PAGE 2 banner */}
  {/* pdf-page 2 */}
</div>
```

This keeps both pages centred and scrollable.

---

### 4. Imports

Always import the external ImageEditor component (do not inline it):

```tsx
import { House, Pencil, Trash, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import ImageEditor from "./ImageEditor";
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import { featureSheetService } from "../file-manager";
import type { FeatureSheetPayload, FeatureSheetResponse, TextStyle, StyledTextField } from "../types/featureSheetTypes";
```

CRITICAL: Do NOT define ImageEditor inline inside the file. Import from "./ImageEditor".

---

### 5. Image State (one entry per slot)

```tsx
const [images, setImages] = useState({
  image1: null as string | null,
  image2: null as string | null,
  // ... one per slot
});
const [scale, setScale] = useState({ image1: 1, image2: 1 /* ... */ });
const [position, setPosition] = useState({
  image1: { x: 0, y: 0 },
  image2: { x: 0, y: 0 },
  // ...
});
const [rotation, setRotation] = useState({ image1: 0, image2: 0 /* ... */ });
const [dragging, setDragging] = useState({ image1: false, image2: false /* ... */ });
const lastPosition = useRef({ image1: { x: 0, y: 0 }, image2: { x: 0, y: 0 } /* ... */ });
```

---

### 6. Image Handlers (copy verbatim)

```tsx
const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
  setDragging((prev) => ({ ...prev, [key]: true }));
  lastPosition.current[key] = { x: e.clientX, y: e.clientY };
};

const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
  if (!dragging[key]) return;
  const dx = e.clientX - lastPosition.current[key].x;
  const dy = e.clientY - lastPosition.current[key].y;
  setPosition((prev) => ({
    ...prev,
    [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
  }));
  lastPosition.current[key] = { x: e.clientX, y: e.clientY };
};

const handleMouseUp    = (key: keyof typeof images) => setDragging((prev) => ({ ...prev, [key]: false }));
const handleMouseLeave = (key: keyof typeof images) => setDragging((prev) => ({ ...prev, [key]: false }));

const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
  setScale((prev) => {
    const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
    return { ...prev, [key]: Math.min(Math.max(newScale, 0.1), 5) };
  });
};

const handleRotate = (key: keyof typeof images) => {
  setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
};

const handleDelete = (key: keyof typeof images, ref: React.RefObject<HTMLInputElement | null>) => {
  setImages((prev)  => ({ ...prev, [key]: null }));
  setScale((prev)   => ({ ...prev, [key]: 1 }));
  setPosition((prev)=> ({ ...prev, [key]: { x: 0, y: 0 } }));
  if (ref.current) ref.current.value = "";
};

const handleImageChange = (key: keyof typeof images, e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setImages((prev) => ({ ...prev, [key]: URL.createObjectURL(e.target.files![0]) }));
  }
};
```

---

### 7. Image Slot Template (THREE-LAYER PATTERN -- mandatory)

Replace N with the slot number (1, 2, 3...) and SIZE_CLASSES with the actual size.

```tsx
{/* imageN */}
<div className="[SIZE_CLASSES] relative overflow-hidden group">
  {/* Layer 2 -- mouse move/up/leave */}
  <div
    className="w-full h-full relative overflow-hidden flex items-center justify-center"
    onMouseMove={(e) => handleMouseMove("imageN", e)}
    onMouseUp={() => handleMouseUp("imageN")}
    onMouseLeave={() => handleMouseLeave("imageN")}
  >
    {images.imageN ? (
      <>
        {/* Layer 3 -- drag wrapper */}
        <div
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleMouseDown("imageN", e)}
        >
          <ImageEditor
            src={images.imageN}
            scale={scale.imageN}
            position={position.imageN}
            rotation={rotation.imageN}
          />
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
          <button type="button" onClick={() => handleZoom("imageN", "in")}
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100" title="Zoom In">
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <button type="button" onClick={() => handleZoom("imageN", "out")}
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100" title="Zoom Out">
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Rotate */}
        <button type="button" onClick={() => handleRotate("imageN")}
          className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
          title="Rotate image">
          <RotateCw className="w-4 h-4 text-gray-700" />
        </button>

        {/* Edit/Replace */}
        <button type="button" onClick={() => openImageSourceModal("imageN")}
          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          title="Edit image">
          <Pencil className="w-4 h-4 text-gray-700" />
        </button>

        {/* Delete */}
        <button type="button" onClick={() => handleDelete("imageN", fileInputRefN)}
          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          title="Delete image">
          <Trash className="w-4 h-4 text-red-500" />
        </button>
      </>
    ) : (
      <div
        onClick={() => openImageSourceModal("imageN")}
        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
      >
        Select Image
      </div>
    )}
    <input type="file" accept="image/*" ref={fileInputRefN}
      onChange={(e) => handleImageChange("imageN", e)} className="hidden" />
  </div>
</div>
```

Layer rules:
- Layer 1 = outer div with size + relative overflow-hidden group
- Layer 2 = mouse move/up/leave handlers + relative overflow-hidden flex
- Layer 3 = drag div with onMouseDown wrapping ImageEditor
- Never attach onMouseDown to the same div as onMouseMove.

---

### 8. Property & Order Auto-Population

```tsx
useEffect(() => {
  if (orderData) {
    const prop  = orderData.property;
    const agent = orderData.agent;

    if (prop) {
      if (prop.listing_price)    setAmount(prop.listing_price.toString());
      if (prop.bedrooms)         setBedroom(prop.bedrooms.toString());
      if (prop.bathrooms)        setBathroom(prop.bathrooms.toString());
      if (prop.square_footage)   setSqft(prop.square_footage.toString());
      if (prop.year_constructed) setBuiltYear(prop.year_constructed.toString());
      if (prop.description)      setDescription(prop.description);
      if (prop.mls_number)       setMlsNumber(prop.mls_number);

      const fullAddress = prop.suite ? `${prop.suite} - ${prop.address}` : prop.address;
      if (fullAddress) setTitle(fullAddress);

      let city = "";
      if (prop.city)        city += prop.city;
      if (prop.province)    city += (city ? ", " : "") + prop.province;
      if (prop.postal_code) city += (city ? " "  : "") + prop.postal_code;
      if (city) setSubtitle(city);
    }

    if (agent) {
      if (agent.first_name || agent.last_name)
        setFullName(`${agent.first_name || ""} ${agent.last_name || ""}`.trim());
      if (agent.email)        setEmail(agent.email);
      if (agent.company_name) setPropertyName(agent.company_name);
    }
  }

  // Allow context formData to override
  if (formData) {
    const s = (val: any) => (typeof val === "string" ? val : val?.value || "");
    if (formData.title)          setTitle(s(formData.title));
    if (formData.subtitle)       setSubtitle(s(formData.subtitle));
    if (formData.fullName)       setFullName(s(formData.fullName));
    if (formData.email)          setEmail(s(formData.email));
    if (formData.propertyName)   setPropertyName(s(formData.propertyName));
    if (formData.description)    setDescription(s(formData.description));
    if (formData.amount)         setAmount(s(formData.amount));
    if (formData.mlsNumber)      setMlsNumber(s(formData.mlsNumber));
    if (formData.images)         setImages(prev => ({ ...prev, ...(formData.images as typeof images) }));
    if (formData.imageScales)    setScale(prev  => ({ ...prev, ...(formData.imageScales as typeof scale) }));
    if (formData.imagePositions) setPosition(prev => ({ ...prev, ...(formData.imagePositions as typeof position) }));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [orderData]);
```

---

### 9. PDF Generation -- Must Use TabloidPdfGenerator

When the user clicks Download for any 17x11 sheet, the code in
CreateFeatureSheet.tsx must route to TabloidPdfGenerator.js, NOT DownloadPdf.js.

Check handleDownload in CreateFeatureSheet.tsx:

```tsx
import TabloidPdfGenerator from "./TabloidPdfGenerator";

const handleDownload = async (withBleed: boolean) => {
  setIsDownloading(true);
  try {
    const fileName = `${address}_${sheetName}.pdf`;
    const currentTemplate = templateImages.find(t => t.id === selectedTemplate);
    const isTabloid = currentTemplate?.type === "tabloid";

    if (isTabloid) {
      await TabloidPdfGenerator("pdf-section", fileName, withBleed);
    } else {
      await DownloadPdf("pdf-section", fileName, withBleed, { width: 8.5, height: 11 });
    }
  } catch (e) { /* ... */ }
  finally { setIsDownloading(false); }
};
```

All tabloid templates must have type: "tabloid" in the templateImages array.

---

### 10. PDF Image Capture -- TabloidPdfGenerator.js Must Sync Transforms

The TabloidPdfGenerator.js file must do the following BEFORE calling
html2canvas, to ensure images appear exactly as shown on screen.

The root cause of wrong PDF images: the preview page is zoomed to 0.55,
so ImageEditor computed a baseScale for a small container. The PDF clone
runs at full 17x11in size -- the same transform produces wrong scale.

Step A -- Capture live transforms BEFORE cloning:
```js
const liveImages = Array.from(section.querySelectorAll('img[alt="uploaded"]'));
const capturedTransforms = liveImages.map(img => {
  const liveTransform = window.getComputedStyle(img).transform;
  const container = img.closest('.relative.flex.items-center.justify-center');
  return { img, liveTransform, origContainer: container };
});
```

Step B -- After cloning, remove zoom from .pdf-page wrappers:
```js
clone.querySelectorAll('.pdf-page').forEach(page => {
  page.style.zoom  = '1';
  page.style.width  = `${renderWidth}px`;
  page.style.height = `${renderHeight}px`;
});
```

Step C -- Re-compute and re-apply transforms on cloned images.
For each cloned img[alt="uploaded"]:
1. Parse liveTransform matrix -- extract liveScale, tx, ty, angleDeg
2. Get cloneContainer.clientWidth/Height (full-res)
3. Re-derive newBaseScale = Math.max(cloneW / drawnW, cloneH / drawnH)
4. Get origContainer.clientWidth (preview, zoomed)
5. Re-derive origBaseScale from preview container
6. userScale = liveScale / origBaseScale
7. scaleRatio = cloneW / origW --> newTx = tx * scaleRatio, newTy = ty * scaleRatio
8. Apply: cloneImg.style.transform = translate(newTx px, newTy px) scale(userScale * newBaseScale) rotate(angleDeg deg)

Step D -- Skip img[alt="uploaded"] in the object-contain to background conversion:
```js
imagesToConvert.forEach(img => {
  if (img.alt === 'uploaded') return; // skip ImageEditor images
  // ... normal background conversion for other images
});
```

This 4-step process ensures images in the PDF match the on-screen preview
exactly, regardless of the preview zoom level.

---

## PRE-FLIGHT CHECKLIST

Before marking task complete, verify all of the following:

- Both pdf-page divs have style={{ width: "17in", height: "11in", zoom: 0.55 }}
- overflow-hidden present on every pdf-page
- data-html2canvas-ignore="true" on every page-number banner element
- PAGE 1 / PAGE 2 banners visible above each sheet during preview
- All images use three-layer drag pattern (outer group > middle handlers > inner drag > ImageEditor)
- ImageEditor imported from "./ImageEditor" (not inlined)
- rotation prop passed to every ImageEditor usage
- handleRotate, handleZoom, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave all wired up
- Zoom In/Out + Rotate + Edit + Delete controls all visible on hover only
- orderData.property auto-populates address/price/beds/baths/sqft/year/description/mls
- orderData.agent auto-populates name/email/company
- formData context values can override orderData values
- useImperativeHandle exposes exportToPayload and importFromPayload
- exportToPayload uses templateKey: "BCFPStandardN" matching the sheet number
- CreateFeatureSheet.tsx routes sheet to TabloidPdfGenerator (not DownloadPdf)
- Sheet has type: "tabloid" in templateImages array
- TabloidPdfGenerator.js skips img[alt="uploaded"] from background conversion
- TabloidPdfGenerator.js re-syncs image transforms after removing pdf-page zoom
