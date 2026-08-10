---
name: implement-safe-zone-and-bleed-system
description: >
  Standardizes and applies the Safe Zone, Bleed Border, Three-Container layout architecture, Edge-to-Edge Bleed techniques, and Three-Layer Image Crop Container pattern across all BCFP listing flyers (Letter 8.5x11) and tabloid sheets (17x11) based on BcfpStandard6.
---

# SKILL: Safe Zone, Bleed Border & Three-Container Architecture (Flyers & Tabloids)

This skill provides the focused standard for applying **Safe Zone**, **Bleed Border**, **Three-Container Sheet Architecture**, **Edge-to-Edge Bleed Handling**, and the **Three-Layer Image Crop Pattern** across all BCFP listing flyers (Letter 8.5" x 11") and tabloid sheets (Tabloid 17" x 11") as implemented in `BcfpStandard6.tsx`.

---

## 1. THE THREE-CONTAINER SHEET ARCHITECTURE

Every listing flyer or tabloid sheet layout is structured around 3 distinct nested containers:

```
+-----------------------------------------------------------------------------------+
| CONTAINER 1: Outer Page / Bleed Wrapper (.pdf-page)                               |
| - Dimensions: 17.25" x 11.25" (Tabloid) or 8.75" x 11.25" (Flyer)                 |
| - Handles paper size, preview zoom (e.g. zoom: 0.55), shadow & overflow: hidden   |
| - Holds edge-to-edge bleed backgrounds (gradients, full-bleed color sidebars)     |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | CONTAINER 2: SafeZoneWrapper (0.125" Bleed Pad + 0.25" Safe Zone Inset)    |  |
|  | - Red Dashed Bleed Border Guide (data-html2canvas-ignore="true")           |  |
|  | - Emerald Dashed Safe Zone Border Guide (data-html2canvas-ignore="true")   |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | CONTAINER 3: Inner Content Container (relative w-full h-full z-10)   |  |  |
|  |  | - Hosts text inputs (StyledInput), property grids, logos, image slots |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Dimension & Sizing Specifications

| Parameter | Tabloid (17x11) with Bleed | Tabloid (17x11) No Bleed | Flyer (8.5x11) with Bleed | Flyer (8.5x11) No Bleed |
| :--- | :--- | :--- | :--- | :--- |
| **Width** | `17.25in` | `17in` | `8.75in` | `8.5in` |
| **Height** | `11.25in` | `11in` | `11.25in` | `11in` |
| **Bleed Padding** | `0.125in` (3mm) per edge | `0in` | `0.125in` (3mm) per edge | `0in` |
| **Safe Zone Inset**| `0.25in` (6mm) per edge | `0.25in` | `0.25in` (6mm) per edge | `0.25in` |
| **Preview Zoom** | `zoom: 0.55` | `zoom: 0.55` | `zoom: 0.85` or `1` | `zoom: 0.85` or `1` |

### Code Structure

```tsx
{/* CONTAINER 1: Outer .pdf-page Bleed Wrapper */}
<div
  className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
  style={{
    width: showBleed ? "17.25in" : "17in", // Use 8.75in / 8.5in for Letter Flyers
    height: showBleed ? "11.25in" : "11in",
    zoom: 0.55,
    margin: "0 auto",
    marginBottom: "40px",
  }}
>
  {/* Edge-to-edge bleed elements placed in Container 1 (outside SafeZoneWrapper) */}
  <div
    className="absolute bottom-0 left-0 right-0 h-[180px] pointer-events-none z-0"
    style={{
      background:
        "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #186C9B 89%, #226392 100%)",
    }}
  />

  {/* CONTAINER 2: SafeZoneWrapper */}
  <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
    {/* CONTAINER 3: Inner Content Container */}
    <div className="w-full h-full flex flex-col justify-between font-alexandria relative z-10">
      {/* Content layout, text fields, grid, image slots */}
    </div>
  </SafeZoneWrapper>
</div>
```

---

## 2. EDGE-TO-EDGE BLEED TECHNIQUES

When visual graphics, colored panels, or footers need to extend to the physical outer edge of the paper:

### Technique A: Container 1 Absolute Background Layers
Place background shapes or full-width gradient banners directly inside Container 1 (outside `SafeZoneWrapper`) with `absolute inset-0` or fixed edge positions:
```tsx
{/* Background gradient spanning outer bleed boundary */}
<div
  className="absolute bottom-0 left-0 right-0 h-[180px] pointer-events-none z-0"
  style={{
    background: "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #186C9B 89%, #226392 100%)",
  }}
/>
```

### Technique B: Negative Margin Extension from Container 3
When a sidebar or footer block inside Container 3 needs to touch the outer bleed edge:
- Use **negative horizontal/vertical margins** matching the total offset (`-0.125in` bleed + `-0.25in` safe padding = `-0.375in` total offset when `showBleed` is active):
```tsx
{/* Right sidebar extending to outer right bleed edge */}
<div
  className="bg-[#376173] flex flex-col relative shrink-0"
  style={{
    width: showBleed ? "calc(50% + 0.375in)" : "calc(50% + 0.25in)",
    marginRight: showBleed ? "-0.375in" : "-0.25in",
  }}
>
  {/* Sidebar content */}
</div>

{/* Footer bar extending to outer left & right bleed edges */}
<div
  className="flex h-[180px] px-[40px] shrink-0 relative z-20"
  style={{
    marginLeft: showBleed ? "-0.375in" : "-0.25in",
    marginRight: showBleed ? "-0.375in" : "-0.25in",
    background: "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #186C9B 89%, #226392 100%)",
  }}
>
  {/* Footer content */}
</div>
```

---

## 3. THREE-LAYER IMAGE CROP CONTAINER PATTERN

Every image slot in a template MUST use this three-layer pattern to isolate sizing, mouse move/drag handlers, and transformed image rendering with controls.

### Layer Breakdown

```
+-------------------------------------------------------------------------------+
| LAYER 1: Outer Slot Container                                                 |
| - Sets slot bounds (e.g., w-full h-[580px] or w-[200px] h-[110px])           |
| - Uses relative overflow-hidden group                                         |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | LAYER 2: Middle Mouse Event Container                                   |  |
|  | - Handles onMouseMove, onMouseUp, onMouseLeave                            |  |
|  |                                                                         |  |
|  |  +-------------------------------------------------------------------+  |  |
|  |  | LAYER 3: Inner Drag Wrapper + ImageEditor                         |  |  |
|  |  | - Handles onMouseDown for dragging                                |  |  |
|  |  | - Renders <ImageEditor src scale position rotation />             |  |  |
|  |  | - Hover controls (Zoom In/Out, Rotate, Pencil/Edit Modal, Delete) |  |  |
|  |  +-------------------------------------------------------------------+  |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

### Code Structure

```tsx
{/* LAYER 1: Outer Slot Container */}
<div className="w-full h-[580px] relative overflow-hidden group">
  {/* LAYER 2: Middle Mouse Event Container */}
  <div
    className="w-full h-full relative overflow-hidden flex items-center justify-center"
    onMouseMove={(e) => handleMouseMove("image1", e)}
    onMouseUp={() => handleMouseUp("image1")}
    onMouseLeave={() => handleMouseLeave("image1")}
  >
    {images.image1 ? (
      <>
        {/* LAYER 3: Inner Drag Wrapper */}
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

        {/* Rotate Control */}
        <button
          type="button"
          onClick={() => handleRotate("image1")}
          className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
          title="Rotate image"
        >
          <RotateCw className="w-4 h-4 text-gray-700" />
        </button>

        {/* Edit / Replace Control (Opens ImageSourceModal) */}
        <button
          type="button"
          onClick={() => openImageSourceModal("image1")}
          className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          title="Edit image"
        >
          <Pencil className="w-4 h-4 text-gray-700" />
        </button>

        {/* Delete Control */}
        <button
          type="button"
          onClick={() => handleDelete("image1", fileInputRef1)}
          className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          title="Delete image"
        >
          <Trash className="w-4 h-4 text-red-500" />
        </button>
      </>
    ) : (
      <div
        onClick={() => openImageSourceModal("image1")}
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

### Drag Mouse Movement Delta Rule
In `handleMouseMove`, divide `dx` and `dy` by the preview zoom factor (e.g. `0.55` for 17x11 tabloids) so the image moves 1:1 with the mouse cursor:

```tsx
const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
  if (!dragging[key]) return;
  // Divide mouse delta by preview scale factor (0.55) for 1:1 cursor movement
  const dx = (e.clientX - lastPosition.current[key].x) / 0.55;
  const dy = (e.clientY - lastPosition.current[key].y) / 0.55;
  setPosition((prev) => ({
    ...prev,
    [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
  }));
  lastPosition.current[key] = { x: e.clientX, y: e.clientY };
};
```
