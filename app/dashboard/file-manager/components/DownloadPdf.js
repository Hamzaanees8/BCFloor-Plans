import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { applySafeZoneToClone } from "../utils/safeZoneUtils";

const copyComputedStyles = (sourceNode, targetNode) => {
  if (!sourceNode || !targetNode || sourceNode.nodeType !== 1 || targetNode.nodeType !== 1) return;

  const computed = window.getComputedStyle(sourceNode);

  const styleProperties = [
    "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight",
    "letterSpacing", "wordSpacing", "whiteSpace", "wordBreak", "overflowWrap",
    "textAlign", "textTransform", "verticalAlign",
    "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
    "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
    "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "boxSizing", "display", "position", "top", "right", "bottom", "left",
    "flex", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent",
    "gridTemplateColumns", "gridTemplateRows", "gap", "rowGap", "columnGap",
    "overflow", "overflowX", "overflowY"
  ];

  for (let prop of styleProperties) {
    const val = computed[prop];
    if (val && val !== "auto" && val !== "normal") {
      try {
        targetNode.style[prop] = val;
      } catch {}
    }
  }

  const sourceChildren = Array.from(sourceNode.children);
  const targetChildren = Array.from(targetNode.children);
  const count = Math.min(sourceChildren.length, targetChildren.length);

  for (let i = 0; i < count; i++) {
    copyComputedStyles(sourceChildren[i], targetChildren[i]);
  }
};

const DownloadPdf = async (
  elementId,
  fileName = "section.pdf",
  withBleed = false,
  paperSize = { width: 8.5, height: 11 },
  withSafeZone = false
) => {
  const section = document.getElementById(elementId);

  if (!section) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
  }

  // Ensure fonts are ready before layout measurement and cloning
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Detect background color
  const getBackgroundColor = (el) => {
    const child = el.firstElementChild;
    let bgColor = window.getComputedStyle(child || el).backgroundColor;
    if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
      if (child && child.firstElementChild) {
        bgColor = window.getComputedStyle(child.firstElementChild).backgroundColor;
      }
    }
    return bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent" ? "#ffffff" : bgColor;
  };

  const bgColor = getBackgroundColor(section);

  const sectionRect = section.getBoundingClientRect();
  const renderWidth = sectionRect.width || paperSize.width * 96;
  const renderHeight = sectionRect.height || paperSize.height * 96;

  const clone = section.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = `${renderWidth}px`;
  clone.style.height = `${renderHeight}px`;
  clone.style.overflow = "hidden";
  clone.style.maxHeight = "none";
  clone.style.margin = "0";
  clone.style.padding = "0";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.border = "none";
  document.body.appendChild(clone);

  // Copy exact computed styles from live rendered DOM to clone to prevent reflow
  copyComputedStyles(section, clone);

  if (withSafeZone) {
    applySafeZoneToClone(clone, false);
  }

  // Sync inputs, excluding file inputs entirely to avoid InvalidStateError
  const originalInputs = section.querySelectorAll("input:not([type='file']), textarea");
  const cloneInputs = clone.querySelectorAll("input:not([type='file']), textarea");

  originalInputs.forEach((input, index) => {
    if (!cloneInputs[index]) return;
    const cloneInput = cloneInputs[index];
    const inputType = input.type.toLowerCase();
    
    if (inputType === 'file') {
      return; // Skip setting value for file inputs as it throws InvalidStateError
    } else if (inputType === 'checkbox' || inputType === 'radio') {
      try { cloneInput.checked = input.checked; } catch {}
    } else if (inputType === 'textarea' || input.tagName.toLowerCase() === 'textarea') {
      try { 
        cloneInput.value = input.value;
        cloneInput.textContent = input.value;
      } catch {}
    } else {
      try { cloneInput.value = input.value; } catch {}
    }
  });

  await preloadImages(clone);

  const imagesToConvert = clone.querySelectorAll("img");
  imagesToConvert.forEach(img => {
    const compStyle = window.getComputedStyle(img);
    const isCover = img.classList.contains('object-cover') || compStyle.objectFit === 'cover' || img.style.objectFit === 'cover';
    const isContain = img.classList.contains('object-contain') || compStyle.objectFit === 'contain' || img.style.objectFit === 'contain';
    
    if (isCover || isContain) {
      const objectFit = isCover ? 'cover' : 'contain';
      const div = document.createElement("div");
      div.className = img.className;
      div.style.cssText = img.style.cssText;
      div.style.backgroundImage = `url("${img.src}")`;
      div.style.backgroundSize = objectFit;
      div.style.backgroundPosition = "center";
      div.style.backgroundRepeat = "no-repeat";
      img.parentNode.replaceChild(div, img);
    }
  });

  // Strip UI shadows, outer margins, rounded corners, and borders from cloned pdf-pages before capture
  const clonePages = clone.querySelectorAll(".pdf-page");
  clonePages.forEach((page) => {
    page.style.boxShadow = "none";
    page.style.margin = "0";
    page.style.borderRadius = "0";
    page.style.border = "none";
    page.style.outline = "none";
  });

  // Deterministically wait for fonts & layout settling without arbitrary setTimeout timeouts
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Verify dimensions match between original section and clone
  const cloneRect = clone.getBoundingClientRect();
  if (Math.abs(sectionRect.height - cloneRect.height) > 1 || Math.abs(sectionRect.width - cloneRect.width) > 1) {
    console.warn(
      `[DownloadPdf] Dimension mismatch detected! Section: ${sectionRect.width}x${sectionRect.height}px, Clone: ${cloneRect.width}x${cloneRect.height}px`
    );
  }

  try {
    const pWidth = paperSize.width * 96;
    const pHeight = paperSize.height * 96;

    const options = {
      scale: 3, // Premium quality (>300 DPI)
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent" ? null : bgColor,
      width: pWidth,
      height: pHeight,
      windowWidth: pWidth,
      windowHeight: pHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    };

    const pages = clone.querySelectorAll(".pdf-page");
    const elementsToCapture = pages.length > 0 ? Array.from(pages) : [clone];

    // Standard print bleed: 3 mm on each side (top, bottom, left, right)
    // 3 mm = 3 / 25.4 inches = ~0.11811 inches per side
    // Total addition = (3 / 25.4) * 2 = 6 / 25.4 = ~0.23622 inches
    const BLEED_INCHES = 3 / 25.4;
    const TOTAL_BLEED_ADDITION = BLEED_INCHES * 2;

    const finalPaperWidth = withBleed ? paperSize.width + TOTAL_BLEED_ADDITION : paperSize.width;
    const finalPaperHeight = withBleed ? paperSize.height + TOTAL_BLEED_ADDITION : paperSize.height;

    const orientation = paperSize.width > paperSize.height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "in",
      format: [finalPaperWidth, finalPaperHeight]
    });

    for (let i = 0; i < elementsToCapture.length; i++) {
      const el = elementsToCapture[i];
      
      const isExplicitPage = pages.length > 0;
      const totalHeight = isExplicitPage ? pHeight : Math.max(pHeight, el.scrollHeight);
      const numPages = isExplicitPage ? 1 : Math.ceil(totalHeight / pHeight);

      // Ensure the page element is properly sized for native capture with no shadow or margin
      el.style.width = `${pWidth}px`;
      el.style.height = `${totalHeight}px`;
      el.style.overflow = "hidden";
      el.style.display = "block"; // Ensure it's not hidden
      el.style.boxShadow = "none";
      el.style.margin = "0";
      el.style.borderRadius = "0";
      el.style.border = "none";

      const elOptions = {
        ...options,
        height: totalHeight,
        windowHeight: totalHeight,
      };

      const canvas = await html2canvas(el, elOptions);

      let finalImgData;
      let finalImgHeightInches;

      if (withBleed) {
        const scale = options.scale || 3;
        const bleedPx = BLEED_INCHES * 96 * scale; // 3 mm at scale 3
        
        const origWidth = canvas.width;
        const origHeight = canvas.height;
        const extWidth = Math.round(origWidth + (bleedPx * 2));
        const extHeight = Math.round(origHeight + (bleedPx * 2));
        
        const extCanvas = document.createElement('canvas');
        extCanvas.width = extWidth;
        extCanvas.height = extHeight;
        const ctx = extCanvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, extWidth, extHeight);
        
        // Draw original sheet at offset 3 mm (bleedPx, bleedPx)
        ctx.drawImage(canvas, bleedPx, bleedPx);
        
        // Extend Top Edge into top 3 mm bleed margin
        ctx.drawImage(canvas, 0, 0, origWidth, 1, bleedPx, 0, origWidth, bleedPx);
        // Extend Bottom Edge into bottom 3 mm bleed margin
        ctx.drawImage(canvas, 0, origHeight - 1, origWidth, 1, bleedPx, extHeight - bleedPx, origWidth, bleedPx);
        // Extend Left Edge into left 3 mm bleed margin
        ctx.drawImage(canvas, 0, 0, 1, origHeight, 0, bleedPx, bleedPx, origHeight);
        // Stretch Right Edge into right 3 mm bleed margin
        ctx.drawImage(canvas, origWidth - 1, 0, 1, origHeight, extWidth - bleedPx, bleedPx, bleedPx, origHeight);
        
        // Extend 4 Corners into bleed corners
        // Top-Left Corner
        ctx.drawImage(canvas, 0, 0, 1, 1, 0, 0, bleedPx, bleedPx);
        // Top-Right Corner
        ctx.drawImage(canvas, origWidth - 1, 0, 1, 1, extWidth - bleedPx, 0, bleedPx, bleedPx);
        // Bottom-Left Corner
        ctx.drawImage(canvas, 0, origHeight - 1, 1, 1, 0, extHeight - bleedPx, bleedPx, bleedPx);
        // Bottom-Right Corner
        ctx.drawImage(canvas, origWidth - 1, origHeight - 1, 1, 1, extWidth - bleedPx, extHeight - bleedPx, bleedPx, bleedPx);
        
        finalImgData = extCanvas.toDataURL("image/png", 1.0);
        finalImgHeightInches = (totalHeight / 96) + TOTAL_BLEED_ADDITION;
      } else {
        finalImgData = canvas.toDataURL("image/png", 1.0);
        finalImgHeightInches = totalHeight / 96;
      }

      for (let p = 0; p < numPages; p++) {
        if (i > 0 || p > 0) {
          pdf.addPage([finalPaperWidth, finalPaperHeight], orientation);
        }

        if (withBleed) {
          pdf.addImage(
            finalImgData, 
            "PNG", 
            0, 
            -(p * finalPaperHeight), 
            finalPaperWidth, 
            finalImgHeightInches
          );
        } else {
          pdf.addImage(
            finalImgData, 
            "PNG", 
            0, 
            -(p * paperSize.height), 
            paperSize.width, 
            finalImgHeightInches
          );
        }
      }
    }

    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }

    pdf.save(fileName);

  } catch (error) {
    console.error("Error generating PDF:", error);
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
};

const preloadImages = (element) => {
  const images = element.getElementsByTagName('img');
  const promises = [];

  for (let img of images) {
    let changed = false;
    // Check if the image has a source and isn't a data URI or blob URI
    if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
      // Add a cache-busting query parameter to force a fresh request with CORS headers
      try {
        const url = new URL(img.src, window.location.href);
        url.searchParams.set('_t', Date.now().toString() + Math.random().toString().substring(2, 8));
        img.crossOrigin = "anonymous";
        img.src = url.toString();
        changed = true;
      } catch (e) {
        console.error("Error parsing image URL:", e);
      }
    }

    // Wait for the image to load (either freshly from network or already complete)
    if (changed || !img.complete || img.naturalHeight === 0) {
      const promise = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 5000); // Increased timeout to 5s for network requests
      });
      if (img.complete && img.naturalHeight !== 0) {
        // Just in case it was somehow instantly satisfied (e.g. data URI or highly aggressive cache)
      } else {
        promises.push(promise);
      }
    }
  }

  return Promise.all(promises);
};

export default DownloadPdf;