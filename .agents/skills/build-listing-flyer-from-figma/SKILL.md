---
name: build-listing-flyer-from-figma
description: >
  Builds or converts a listing flyer component (e.g. BcfpStandardX.tsx) to match a provided 
  Figma design image, while strictly enforcing the standard data structure, editable inputs, 
  and two-page PDF rendering logic established in BcfpStandard13.
---

# Task: Build Listing Flyer from Figma Design

## STEP 1 — Analyze the Provided Design Image
The user has provided an image showing a new Listing Flyer layout (typically 2 pages).
1. Visually break down the layout into Flexbox/Grid structures.
2. Note the positions of all required text fields (Address, Price, Beds/Baths, Contact Info, Description).
3. Identify where the image slots (`image1`, `image2`, etc.) are placed.
4. Note the color palette, fonts, and graphical elements (lines, backgrounds, gradients).

## STEP 2 — Reference the Standard Logic (BcfpStandard13.tsx)
Your code must visually match the user's Figma image, but **structurally and logically** it must match `BcfpStandard13.tsx`.
If you are unfamiliar with the backend data flow, read `app/dashboard/file-manager/components/BcfpStandard13.tsx` as your source of truth for logic.

## RULE 1: STRICT 2-PAGE PDF STRUCTURE
The return statement MUST be composed of exactly two `pdf-page` wrapper divs, even if the user only provides a 1-page design (leave the second page blank with a logo if needed).
```tsx
return (
  <>
    {/* Page 1 Divider - screen only */}
    <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
      <div className="h-[1px] bg-gray-300 flex-1"></div>
      <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 1</span>
      <div className="h-[1px] bg-gray-300 flex-1"></div>
    </div>

    {/* Page 1 */}
    <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden flex flex-col bg-white" style={{/* branding */}}>
      [PAGE 1 CONTENT FROM FIGMA]
    </div>

    {/* Page 2 Divider - screen only */}
    <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
      <div className="h-[1px] bg-gray-300 flex-1"></div>
      <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 2</span>
      <div className="h-[1px] bg-gray-300 flex-1"></div>
    </div>

    {/* Page 2 */}
    <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden flex flex-col bg-white" style={{/* branding */}}>
      [PAGE 2 CONTENT FROM FIGMA]
    </div>
  </>
);
```
- `pdf-page`, `w-[8.5in]`, `h-[11in]`, and `overflow-hidden` are **MANDATORY**. Missing these breaks PDF export.

## RULE 2: STATE & PAYLOAD MANAGEMENT (PROPERTY & AGENT DATA)
You MUST define and manage all the standard fields, regardless of whether the Figma design shows them all.
1. **Fetch and Populate Data:** Each file MUST fetch and populate both the property data AND agent data into the flyers/sheets using the `orderData` object.
2. Include all `useState` hooks for fields: `amount`, `bedroom`, `bathroom`, `sqft`, `builtYear`, `description`, `addressCode`, `roadName`, `cityLine`, `fullName`, `email`, `number`, `propertyName`, `byLawRestrictions`, `maintFees`, `maintFeesInclude`, `featuresIncluded`, `siteInfluences`, `amenities`, `view`.
3. `exportToPayload`: Must call `featureSheetService.buildPayload` containing all the fields (exactly like Sheet 13). Do NOT change the `templateKey`.
4. `importFromPayload`: Must restore all fields from the backend response.
5. Auto-populate `useEffect` must exist to pull defaults from `orderData`.

## RULE 3: EDITABLE FIELDS
Text on the flyer MUST NOT be hardcoded if it relates to the property or agent.
- You must use the `<StyledInput />` component for **every** editable text field.
- Example:
```tsx
<StyledInput
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  inputStyle={fieldStyles["amount"]}
  onChangeStyle={(style) => updateFieldStyle("amount", style)}
  className="font-bold text-[30px] text-white bg-transparent..."
  placeholder="$000,000"
/>
```

## RULE 4: IMAGE HANDLING (IMAGE EDITOR, ZOOM & ROTATE)
Each sheet MUST implement the rotate image feature and use the new `<ImageEditor />` component to adjust images (drag-to-pan) and handle zoom in/out.
1. **New Image Editor:** Do not manually apply inline transform styles to `NextImage`. Instead, use the `<ImageEditor />` component for every image slot. Example: `<ImageEditor src={images.image1} scale={scale.image1} position={position.image1} rotation={rotation?.image1 || 0} />`
2. **Drag-to-Pan Feature:** The image slot wrapper must contain the mouse event handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`) to track mouse movement, updating the `position` state which is passed to `<ImageEditor />`.
   **CRITICAL FIX (Drag Inversion Bug):** When implementing `handleMouseMove`, DO NOT adjust or invert `dx` and `dy` based on the image's rotation angle! Since `<ImageEditor />` applies the CSS `translate` before `rotate`, translations happen in screen-space. You must directly add `dx = e.clientX - lastX` and `dy = e.clientY - lastY` to the position state without any switch/case angle logic.
3. **Zoom In / Zoom Out:** The zoom handlers must limit zooming between 0.1x and 5x (e.g. `Math.min(Math.max(newScale, 0.1), 5)`). Pass the `scale` state to `<ImageEditor />`.
4. **Rotate Feature:** Each sheet must have the rotate image feature for its image slots. Include a `RotateCw` button (from `lucide-react`) in the controls UI, add a `useState` for the rotation angle (`(r + 90) % 360`), and pass this to the editor or parent wrapper.
5. **Controls UI & File Input:** Must include absolute positioned overlay buttons for Zoom In, Zoom Out, Rotate (RotateCw), Edit (Pencil), and Delete (Trash) that appear on `group-hover`. Must also include an `<input type="file" ... />` hidden ref mapped to the Edit button.

## PRE-FLIGHT CHECKLIST
Before marking the task complete, verify:
[ ] Does the layout match the provided Figma image visually?
[ ] Are there exactly two `<div className="pdf-page w-[8.5in] h-[11in] ...">` wrappers?
[ ] Is `overflow-hidden` present on both pages?
[ ] Are all editable text fields using `<StyledInput>`?
[ ] Does `exportToPayload` map all state variables correctly?
[ ] Do all image slots use `<ImageEditor>` with drag, zoom, rotate, edit, and delete functionality?
[ ] Does the component properly fetch and populate property and agent data from `orderData`?

## TRIGGER PROMPT
To invoke this skill, paste the following to the agent:

"Build the listing flyer layout shown in the attached image for [BcfpStandardX.tsx]. Use skill: build-listing-flyer-from-figma. Follow the rules for standard data binding and PDF page wrapping."
