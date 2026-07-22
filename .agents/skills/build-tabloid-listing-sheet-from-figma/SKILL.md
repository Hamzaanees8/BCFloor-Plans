---
name: build-tabloid-listing-sheet-from-figma
description: >
  Builds or converts a Tabloid listing sheet from provided Figma images.
  Unlike Letter templates, a Tabloid template is split into FOUR independent
  Letter-sized pages which are later combined into TWO physical Tabloid sheets
  during PDF generation.
---

# Task: Build Tabloid Listing Sheet from Figma Design

## IMPORTANT — TABLOID ARCHITECTURE

DO NOT build a 17in x 11in page.

DO NOT attempt to build two large pages with nested sections.

Instead, every Tabloid template is divided into FOUR completely independent Letter-sized pages.

Each page represents one quarter (quadrant) of the final printed Tabloid sheet.

The mapping is always:

Page 1 = Top Left
Page 2 = Top Right
Page 3 = Bottom Left
Page 4 = Bottom Right

Visual Layout:

+------------------------+------------------------+
|                        |                        |
|        PAGE 1          |        PAGE 2          |
|      (Top Left)        |      (Top Right)       |
|                        |                        |
+------------------------+------------------------+
|                        |                        |
|        PAGE 3          |        PAGE 4          |
|     (Bottom Left)      |    (Bottom Right)      |
|                        |                        |
+------------------------+------------------------+

The provided reference images already follow this structure.
Each image represents ONE page.
Never merge multiple images into one React page.
Never recreate the entire 17x11 sheet inside the component.
Your responsibility is ONLY to recreate each Letter-sized page individually.

The PDF generation system will later combine:
Page 1 + Page 2 into Physical Tabloid Sheet 1
and
Page 3 + Page 4 into Physical Tabloid Sheet 2.

----------------------------------------------------

# STEP 1 — ANALYZE THE PROVIDED IMAGES

The user will provide four images.
Image 1 -> Page 1 (Top Left)
Image 2 -> Page 2 (Top Right)
Image 3 -> Page 3 (Bottom Left)
Image 4 -> Page 4 (Bottom Right)

Each image should be recreated independently.
Do NOT attempt to align them together.
Do NOT estimate spacing between quadrants.
Only reproduce the page shown in that image.

----------------------------------------------------

# RULE 1 — PAGE STRUCTURE

The component MUST contain exactly FOUR pdf-page wrappers.
They MUST be paired and wrapped in a TabloidSheetContainer component.

Define this container at the top of the file:
```tsx
const TabloidSheetContainer = ({ pageNum1, pageNum2, children }: { pageNum1: number, pageNum2: number, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <div className="flex w-[1632px]">
      <span data-html2canvas-ignore="true" className="w-1/2 text-[14px] font-bold text-gray-500 print:hidden select-none uppercase tracking-wider">
        PAGE {pageNum1}
      </span>
      <span data-html2canvas-ignore="true" className="w-1/2 text-[14px] font-bold text-gray-500 print:hidden select-none uppercase tracking-wider pl-[50px]">
        PAGE {pageNum2}
      </span>
    </div>
    <div className="tabloid-sheet flex gap-x-0 w-[1632px] h-[1056px]">
      {children}
    </div>
  </div>
);
```

Also define the ImageEditor component at the top of the file:
```tsx
const ImageEditor = ({
  src,
  scale,
  position,
  className = ""
}: {
  src: string;
  scale: number;
  position: { x: number; y: number };
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!containerRef.current) return;
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const { clientWidth, clientHeight } = containerRef.current;
    
    if (naturalWidth === 0 || naturalHeight === 0 || clientWidth === 0 || clientHeight === 0) return;
    
    const containerAR = clientWidth / clientHeight;
    const imageAR = naturalWidth / naturalHeight;
    
    let drawnWidth, drawnHeight;
    if (imageAR > containerAR) {
      drawnWidth = clientWidth;
      drawnHeight = clientWidth / imageAR;
    } else {
      drawnHeight = clientHeight;
      drawnWidth = clientHeight * imageAR;
    }
    
    const requiredScale = Math.max(clientWidth / drawnWidth, clientHeight / drawnHeight);
    setBaseScale(requiredScale);
  };

  return (
    <div ref={containerRef} className={`w-full h-full relative flex items-center justify-center ${className}`}>
      <Image
        src={src}
        onLoad={handleLoad}
        alt="uploaded"
        fill
        unoptimized
        className="object-contain pointer-events-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale * baseScale})`,
          transition: 'transform 0.1s ease-out'
        }}
      />
    </div>
  );
};
```

Then structure your main component render as:
```tsx
<PreviewGrid>
  <TabloidSheetContainer pageNum1={1} pageNum2={2}>
    <div className="pdf-page w-[816px] h-[1056px] relative overflow-hidden flex flex-col">
       {/* Page 1 Content */}
    </div>
    <div className="pdf-page w-[816px] h-[1056px] relative overflow-hidden flex flex-col">
       {/* Page 2 Content */}
    </div>
  </TabloidSheetContainer>

  <TabloidSheetContainer pageNum1={3} pageNum2={4}>
    {/* Page 3 and Page 4 Content */}
  </TabloidSheetContainer>
</PreviewGrid>
```

Mandatory classes on each pdf-page div:
- pdf-page
- w-[816px] (Exactly half of 1632px)
- h-[1056px]
- relative
- overflow-hidden

Do not remove them.

----------------------------------------------------

# RULE 1 ALTERNATE — 17in x 11in ZOOM PATTERN

Some existing sheets (BcfpStandard3 etc.) use two full 17in x 11in pdf-page divs each zoomed to 55% for preview:

```tsx
<div
  className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
  style={{ width: "17in", height: "11in", zoom: 0.55, margin: "0 auto", marginBottom: "40px" }}
>
  <div className="w-1/2 ...">...</div>
  <div className="w-1/2 ...">...</div>
</div>
```

When working with these sheets:
- Each 17in page is ONE pdf-page containing two w-1/2 halves
- Add PAGE N divider banners ABOVE each pdf-page (see RULE 2)
- The zoom:0.55 is preview-only; do not remove it

----------------------------------------------------

# RULE 2 — PAGE DIVIDERS

The TabloidSheetContainer handles page labels automatically.

However, if using the 17in x 11in zoom pattern, add explicit divider banners above each pdf-page:

```tsx
{/* Page 1 Divider */}
<div className="w-full flex items-center justify-center my-8">
  <div className="h-px bg-gray-300 flex-1"></div>
  <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 1</span>
  <div className="h-px bg-gray-300 flex-1"></div>
</div>
```

----------------------------------------------------

# RULE 3 — FIGMA MATCHING

Each page must visually match its corresponding Figma image. Recreate:
- Layout, Typography, Colors
- SVG backgrounds
- Decorative graphics, Borders, Shadows, Gradients
- Image placements, Spacing

Do not simplify the design.

----------------------------------------------------

# RULE 4 — STANDARD DATA STRUCTURE

Use BcfpStandard13 as the source of truth.
Do not change payload structure, templateKey, backend field names, export/import structure.

----------------------------------------------------

# RULE 5 — PROPERTY AND AGENT DATA

Include all standard property and agent fields.
Auto-populate using orderData on initial mount, then allow formData to override if context values exist.
Support exportToPayload and importFromPayload exactly like BcfpStandard13.

### Required orderData Auto-Population Pattern:
```tsx
useEffect(() => {
  // 1. Auto-populate from orderData when available
  if (orderData) {
    if (orderData.property) {
      const prop = orderData.property;
      if (prop.listing_price) setAmount(prop.listing_price.toString());
      if (prop.bedrooms) setBedroom?.(prop.bedrooms.toString());
      if (prop.bathrooms) setBathroom?.(prop.bathrooms.toString());
      if (prop.square_footage) setSqft?.(prop.square_footage.toString());
      if (prop.year_constructed) setBuiltYear?.(prop.year_constructed.toString());
      if (prop.description) setDescription(prop.description);
      if (prop.mls_number) setMlsNumber(prop.mls_number);

      const fullAddress = prop.suite ? `${prop.suite} - ${prop.address}` : prop.address;
      if (fullAddress) setTitle(fullAddress);

      let cityString = "";
      if (prop.city) cityString += prop.city;
      if (prop.province) cityString += (cityString ? ", " : "") + prop.province;
      if (prop.postal_code) cityString += (cityString ? " " : "") + prop.postal_code;
      if (cityString) setSubtitle(cityString);
    }

    if (orderData.agent) {
      const agent = orderData.agent;
      if (agent.first_name || agent.last_name) {
        setFullName(`${agent.first_name || ''} ${agent.last_name || ''}`.trim());
      }
      if (agent.email) setEmail(agent.email);
      if (agent.primary_phone) setPhone?.(agent.primary_phone);
      if (agent.company_name) setPropertyName(agent.company_name);
    }
  }

  // 2. Allow existing formData to override if context has truthy values
  if (formData) {
    const s = (val: any) => (typeof val === 'string' ? val : (val?.value || ''));

    if (formData.title) setTitle(s(formData.title));
    if (formData.subtitle) setSubtitle(s(formData.subtitle));
    if (formData.fullName) setFullName(s(formData.fullName));
    if (formData.email) setEmail(s(formData.email));
    if (formData.phone) setPhone?.(s(formData.phone));
    if (formData.propertyName) setPropertyName(s(formData.propertyName));
    if (formData.description) setDescription(s(formData.description));
    if (formData.amount) setAmount(s(formData.amount));
    if (formData.mlsNumber) setMlsNumber(s(formData.mlsNumber));
  }
}, [orderData]);
```

----------------------------------------------------

# RULE 6 — EDITABLE FIELDS

Every editable field must use StyledInput.
Never hardcode editable property or agent text.
All StyledInput components must support: value, onChange, placeholder, inputStyle (fieldStyles[key]), onChangeStyle (updateFieldStyle).

----------------------------------------------------

# RULE 7 — IMAGE HANDLING WITH ImageEditor

Every image placeholder must use ImageEditor — NOT raw Image or img tags.

Required imports:
```tsx
import { Pencil, Trash, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import ImageSourceModal from "./ImageSourceModal";
import Image from "next/image";
```

Required state (one entry per image slot):
```tsx
const [images, setImages] = useState({
  image1: null as string | null,
  image2: null as string | null,
  // one per slot
});
const [scale, setScale] = useState({ image1: 1, image2: 1, /* ... */ });
const [position, setPosition] = useState({
  image1: { x: 0, y: 0 },
  image2: { x: 0, y: 0 },
  // ...
});
const [rotation, setRotation] = useState({ image1: 0, image2: 0, /* ... */ });
const [dragging, setDragging] = useState({ image1: false, image2: false, /* ... */ });
const lastPosition = useRef({ image1: { x: 0, y: 0 }, image2: { x: 0, y: 0 }, /* ... */ });
```

Required handlers:
```tsx
const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
  setDragging((prev) => ({ ...prev, [key]: true }));
  lastPosition.current[key] = { x: e.clientX, y: e.clientY };
};
const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
  if (!dragging[key]) return;
  const dx = e.clientX - lastPosition.current[key].x;
  const dy = e.clientY - lastPosition.current[key].y;
  setPosition((prev) => ({ ...prev, [key]: { x: prev[key].x + dx, y: prev[key].y + dy } }));
  lastPosition.current[key] = { x: e.clientX, y: e.clientY };
};
const handleMouseUp = (key: keyof typeof images) => { setDragging((prev) => ({ ...prev, [key]: false })); };
const handleMouseLeave = (key: keyof typeof images) => { setDragging((prev) => ({ ...prev, [key]: false })); };
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
  setImages((prev) => ({ ...prev, [key]: null }));
  setScale((prev) => ({ ...prev, [key]: 1 }));
  setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
  if (ref.current) ref.current.value = "";
};
const handleImageChange = (key: keyof typeof images, e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const url = URL.createObjectURL(e.target.files[0]);
    setImages((prev) => ({ ...prev, [key]: url }));
  }
};
```

IMAGE SLOT TEMPLATE — use for EVERY image slot in the layout:
```tsx
{/* imageN */}
<div className="[SIZE CLASSES] relative overflow-hidden group">
  <div
    className="w-full h-full relative overflow-hidden flex items-center justify-center"
    onMouseMove={(e) => handleMouseMove("imageN", e)}
    onMouseUp={() => handleMouseUp("imageN")}
    onMouseLeave={() => handleMouseLeave("imageN")}
  >
    {images.imageN ? (
      <>
        {/* Drag wrapper — MUST wrap ImageEditor */}
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
          <button type="button" onClick={() => handleZoom("imageN", "in")} className="bg-white p-2 rounded-full shadow hover:bg-gray-100" title="Zoom In">
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <button type="button" onClick={() => handleZoom("imageN", "out")} className="bg-white p-2 rounded-full shadow hover:bg-gray-100" title="Zoom Out">
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
        </div>
        {/* Rotate */}
        <button type="button" onClick={() => handleRotate("imageN")} className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto" title="Rotate image">
          <RotateCw className="w-4 h-4 text-gray-700" />
        </button>
        {/* Edit/Replace */}
        <button type="button" onClick={() => openImageSourceModal("imageN")} className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto" title="Edit image">
          <Pencil className="w-4 h-4 text-gray-700" />
        </button>
        {/* Delete */}
        <button type="button" onClick={() => handleDelete("imageN", fileInputRefN)} className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto" title="Delete image">
          <Trash className="w-4 h-4 text-red-500" />
        </button>
      </>
    ) : (
      <div onClick={() => openImageSourceModal("imageN")} className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400">
        Select Image
      </div>
    )}
    <input type="file" accept="image/*" ref={fileInputRefN} onChange={(e) => handleImageChange("imageN", e)} className="hidden" />
  </div>
</div>
```

----------------------------------------------------

# RULE 8 — DRAG IMPLEMENTATION

Three-layer structure is MANDATORY:
1. OUTER GROUP DIV — size classes, relative, overflow-hidden, group
2. MIDDLE CONTAINER — onMouseMove, onMouseUp, onMouseLeave, relative overflow-hidden flex
3. INNER DRAG DIV — onMouseDown, cursor-grab active:cursor-grabbing — wraps ImageEditor

dx = currentX - previousX (screen space, no rotation compensation)
dy = currentY - previousY

----------------------------------------------------

# RULE 9 — IMAGE CONTROLS

Controls only appear on hover via: opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto

Positioning:
- Zoom:   absolute bottom-1 left-1 flex gap-2
- Rotate: absolute top-2 right-[72px]
- Edit:   absolute top-2 right-10
- Delete: absolute top-2 right-2

----------------------------------------------------

# RULE 10 — SVG Z-INDEX STACKING RULES

When a page has SVG decorative backgrounds AND content above them:

- SVG behind all content         -> no z-index (or pointer-events-none only)
- SVG that overlays a hero image -> z-10 pointer-events-none
- Content (text, logos) above SVG overlay -> z-20
- Price/amount field above a bottom wave SVG -> z-10 on its own absolute div

Example — top SVG wave over hero image, text above both:
```tsx
{/* Hero image — base layer */}
<div className="w-full h-full ...">
  <ImageEditor ... />
</div>

{/* SVG wave overlay — sits above hero image but below text */}
<svg className="absolute top-0 right-0 left-0 w-full z-10 pointer-events-none" ...>...
</svg>

{/* Title/Subtitle/Logo — sits above SVG wave */}
<div className="absolute top-0 left-0 right-0 px-12 z-20">
  <StyledInput value={title} ... />
</div>
```

Example — bottom wave SVG with price overlay:
```tsx
{/* Bottom wave SVG */}
<svg className="absolute bottom-0 left-0 w-full" ...>...</svg>

{/* Price overlay — appears above the wave */}
<div className="absolute bottom-6 right-6 z-10 text-white text-right">
  <StyledInput
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    onChangeStyle={(s) => updateFieldStyle("amount", s)}
    inputStyle={fieldStyles.amount}
    className="font-bold text-[42px] bg-transparent text-right w-full focus:outline-none border-none placeholder-white/60 text-white"
    placeholder="$000,000"
  />
</div>
```

----------------------------------------------------

# RULE 11 — BACKGROUND GRAPHICS

Reproduce the background exactly as shown in each page.
Do not attempt to continue graphics into another page. Each page is independent.

----------------------------------------------------

# RULE 12 — PAGE ISOLATION

Every page is completely independent.
Absolute positioning must always be relative to its own page.
Never reference another page.
Never position content outside its page.
Every page must use overflow-hidden.

----------------------------------------------------

# PRE-FLIGHT CHECKLIST

Before marking the task complete verify:

Check: exactly FOUR pdf-page wrappers.
Check: every page is correct size (w-[816px] h-[1056px] or 17in x 11in zoom:0.55).
Check: overflow-hidden on every page.
Check: layout matches Figma.
Check: all SVG backgrounds recreated.
Check: SVG z-index stacking correct (z-10 pointer-events-none over hero; z-20 for text above; z-10 for price overlay over bottom wave).
Check: StyledInput for every editable field.
Check: property/agent data auto-populated.
Check: exportToPayload and importFromPayload match BcfpStandard13.
Check: every image uses three-layer drag pattern (outer group -> middle mouse handlers -> inner drag wrapper -> ImageEditor).
Check: drag, zoom, rotate, replace, delete all work.
Check: controls only appear on hover.
Check: no content overflows outside its page.
Check: page divider banners above each pdf-page.
Check: amount/price field is z-10 over bottom wave SVG when design requires it.

----------------------------------------------------

# FINAL OUTPUT

Generate one component with exactly four Letter-sized pages.

Page order MUST be:
Page 1 -> Top Left
Page 2 -> Top Right
Page 3 -> Bottom Left
Page 4 -> Bottom Right

Group inside TWO TabloidSheetContainer components.

PDF export will combine:
Page 1 + Page 2 into Physical Sheet 1
Page 3 + Page 4 into Physical Sheet 2

CRITICAL NOTE FOR PDF GENERATION:
When updating or building Tabloid feature sheets, verify the Download PDF button is calling TabloidPdfGenerator.js logic instead of DownloadPdf.js. TabloidPdfGenerator is specifically built to strip transform:scale from the Print DOM to avoid squishing the 17x11 layouts.

----------------------------------------------------
