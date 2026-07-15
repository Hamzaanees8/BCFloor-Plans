---
name: convert-listing-flyer-to-sheet13
description: >
  Converts any BCFPStandard listing flyer component (BcfpStandard15-22) to match
  the exact 2-page structure and content field layout of BcfpStandard13 (Listing Flyer 9).
  Use this when a listing flyer is missing the pdf-page class, has incorrect page sizing,
  or needs its content fields realigned with the Sheet 13 standard.
---

# Task: Convert Listing Flyer to Match Sheet 13 Layout

## STEP 1 — View Reference Images FIRST (before writing any code)

The target layout is Sheet 13 / BcfpStandard13 — a 2-page listing flyer.
Read and visually study BOTH images before touching any code:

- Page 1 reference: .agents/skills/convert-listing-flyer-to-sheet13/references/sheet13_page1.png
- Page 2 reference: .agents/skills/convert-listing-flyer-to-sheet13/references/sheet13_page2.png

Your job: make the target sheet render a layout that matches these two pages structurally.
Keep the target sheet's OWN color palette / branding. Only the structure must match.

## STEP 2 — Read the Model Source

Read the full reference file for exact JSX patterns to copy:
  app/dashboard/file-manager/components/BcfpStandard13.tsx

## STEP 3 — Read the Target File

Read the target file you are converting (e.g. BcfpStandard19.tsx, BcfpStandard20.tsx, etc.)
Note its existing: color values, gradient strings, font sizes, component name, templateKey string.

---

## PAGE STRUCTURE RULES (MANDATORY)

Every listing flyer MUST have exactly this wrapper structure in its JSX return():

```
{/* Page 1 Divider - screen only */}
<div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
  <div className="h-[1px] bg-gray-300 flex-1"></div>
  <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 1</span>
  <div className="h-[1px] bg-gray-300 flex-1"></div>
</div>

<div className="pdf-page w-[8.5in] h-[11in] relative bg-white overflow-hidden flex flex-col">
  [ PAGE 1 CONTENT ]
</div>

{/* Page 2 Divider - screen only */}
<div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
  <div className="h-[1px] bg-gray-300 flex-1"></div>
  <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 2</span>
  <div className="h-[1px] bg-gray-300 flex-1"></div>
</div>

<div className="pdf-page w-[8.5in] h-[11in] relative bg-white overflow-hidden flex flex-col">
  [ PAGE 2 CONTENT ]
</div>
```

CRITICAL RULES:
- The pdf-page class MUST be present on BOTH page divs
- DownloadPdf.js uses querySelectorAll(".pdf-page") - if missing, PDF is broken
- Both pages must be exactly w-[8.5in] h-[11in]
- overflow-hidden is required - content must NOT overflow past 11in
- Never use scrollable containers inside pdf-page

---

## PAGE LAYOUTS

**IMPORTANT: Do not follow a hardcoded text layout, because each flyer has a different layout.**

Instead, closely follow the layout from the reference images provided in the prompt or in the `public` folder (or `references` folder). Examine those images carefully to understand where images, texts, icons, and blocks are placed, and replicate that exact visual structure in your JSX structure.

---

## REQUIRED STATE VARIABLES

The component MUST have ALL these state variables:

```tsx
const [byLawRestrictions, setByLawRestrictions] = useState("");
const [maintFees, setMaintFees] = useState("");
const [maintFeesInclude, setMaintFeesInclude] = useState("");
const [featuresIncluded, setFeaturesIncluded] = useState("");
const [siteInfluences, setSiteInfluences] = useState("");
const [amenities, setAmenities] = useState("");
const [view, setView] = useState("");
const [description, setDescription] = useState("");
const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [propertyName, setPropertyName] = useState("");
const [amount, setAmount] = useState("");
const [number, setNumber] = useState("");
const [addressCode, setAddressCode] = useState("");
const [roadName, setRoadName] = useState("");
const [cityLine, setCityLine] = useState("");
const [bedroom, setBedroom] = useState("");
const [bathroom, setBathroom] = useState("");
const [sqft, setSqft] = useState("");
const [builtYear, setBuiltYear] = useState("");
const [fieldStyles, setFieldStyles] = useState<Record<string, any>>({});
```

Images state - use as many slots as the layout needs (minimum image1-image7):
```tsx
const [images, setImages] = useState({
  image1: null as string | null,
  image2: null as string | null,
  // ... up to image13
});
```

---

## INPUT COMPONENTS

All editable text fields MUST use StyledInput, not plain input/textarea:

```tsx
import StyledInput from "./StyledInput";

<StyledInput
  value={fieldValue}
  onChange={(e) => setFieldValue(e.target.value)}
  inputStyle={fieldStyles["fieldName"]}
  onChangeStyle={(style) => updateFieldStyle("fieldName", style)}
  className="..."
  placeholder="..."
/>
```

---

## EXPORT/IMPORT PAYLOAD

exportToPayload MUST call featureSheetService.buildPayload with ALL fields:
```tsx
exportToPayload: async () => {
  const payload = await featureSheetService.buildPayload({
    orderUuid: orderData?.uuid || "",
    templateKey: "BCFPStandard{N}",  // keep original templateKey!
    uploadedBy: "admin",
    type: "template",
    primaryColor: "...",             // sheet's own color
    offeredAtPrice: amount,
    realtorName: fullName,
    emailLink: email,
    companyName: propertyName,
    propertyNotesTitle: roadName,
    propertyNotesDescription: description,
    expandedDetail1Title: "By-law Restrictions",
    expandedDetail1Description: byLawRestrictions,
    expandedDetail2Title: "Maint. Fees",
    expandedDetail2Description: maintFees,
    expandedDetail3Title: "Maint. Fees Include",
    expandedDetail3Description: maintFeesInclude,
    expandedDetail4Title: "Features Included",
    expandedDetail4Description: featuresIncluded,
    keyHighlightLabel: "Site Influences",
    keyHighlights: siteInfluences ? siteInfluences.split("\n").filter(Boolean) : [],
    otherDetails: { amenities, view, bedroom, bathroom, sqft, builtYear, number, addressCode, cityLine },
    images,
    imageScales: scale,
    imagePositions: position,
    fieldStyles,
  });
  return payload;
},
```

importFromPayload MUST restore ALL fields from parsePayloadToState.

---

## AUTO-POPULATE FROM orderData

On mount, populate fields from orderData:
```tsx
useEffect(() => {
  if (orderData?.property) {
    if (orderData.property.listing_price) setAmount(orderData.property.listing_price.toString());
    if (orderData.property.bedrooms) setBedroom(orderData.property.bedrooms.toString());
    if (orderData.property.bathrooms) setBathroom(orderData.property.bathrooms.toString());
    if (orderData.property.square_footage) setSqft(orderData.property.square_footage.toString());
    if (orderData.property.year_constructed) setBuiltYear(orderData.property.year_constructed.toString());
    if (orderData.property.description) setDescription(orderData.property.description);
    if (orderData.property.mls_number) setAddressCode(orderData.property.mls_number);
    if (orderData.property.suite) setRoadName(orderData.property.suite);
    // build cityLine from city + province + postal_code
  }
  if (orderData?.agent) {
    setFullName(`${orderData.agent.first_name || ""} ${orderData.agent.last_name || ""}`.trim());
    if (orderData.agent.email) setEmail(orderData.agent.email);
    if (orderData.agent.primary_phone) setNumber(orderData.agent.primary_phone);
    if (orderData.agent.company_name) setPropertyName(orderData.agent.company_name);
  }
}, []);
```

---

## PRE-FLIGHT CHECKLIST

Before marking conversion complete, verify every item:

[ ] Has exactly 2 pdf-page divs
[ ] Both pdf-page divs: w-[8.5in] h-[11in] overflow-hidden
[ ] Page dividers (PAGE 1, PAGE 2 labels) have print:hidden
[ ] Page 1: hero image slot (image1), address overlay, stats bar, 25/75 column split
[ ] Page 2: agent headshot (image7), image gallery grid, site influences bullets
[ ] All text fields use StyledInput (NOT plain input)
[ ] exportToPayload includes all 20+ fields
[ ] importFromPayload restores all 20+ fields
[ ] orderData auto-populate useEffect present
[ ] updateFormData sync useEffect present
[ ] ImageSourceModal + FileManagerGallery wired for all image slots
[ ] Each image slot has: zoom in, zoom out, drag-to-pan, edit, delete controls
[ ] templateKey string unchanged from original (BCFPStandard{N})
[ ] Component name unchanged (BcfpStandard{N})
[ ] forwardRef + useImperativeHandle structure intact

---

## DO NOT CHANGE

- The component name (BcfpStandard{N})
- The templateKey value inside buildPayload
- The forwardRef / useImperativeHandle signatures
- The export default at the bottom
- The color palette (gradients, hex colors) of the target sheet

---

## QUICK TRIGGER PROMPT

To invoke this skill, paste the following to the agent:

"Convert [BcfpStandard{N}.tsx] to match the Sheet 13 two-page listing flyer layout.
Use skill: convert-listing-flyer-to-sheet13.
Reference images: sheet13_page1.png and sheet13_page2.png in the references/ folder.
Keep the sheet's existing color palette. Follow the full checklist in SKILL.md."
