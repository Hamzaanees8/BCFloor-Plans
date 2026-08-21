import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { applySafeZoneToClone } from "../utils/safeZoneUtils";

const DownloadPdf = async (
  elementId,
  fileName = "sheet.pdf",
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

  // The DOM is ALWAYS rendered at full bleed size (e.g. 8.75" × 11.25" for 8.5" × 11" paper).
  // For no-bleed output we crop the captured canvas by 0.125" on each edge
  // to remove the bleed zone before writing to the PDF.
  const BLEED_IN = 0.125; // 3mm per edge
  const bleedWidth = paperSize.width + BLEED_IN * 2; // 8.75"
  const bleedHeight = paperSize.height + BLEED_IN * 2; // 11.25"

  // Reference dimensions in px at 96 DPI — always full bleed canvas
  const renderWidth = bleedWidth * 96; // 840px for Letter
  const renderHeight = bleedHeight * 96; // 1080px for Letter

  // Capture inline transforms from live DOM BEFORE cloning for uploaded images
  const liveImages = Array.from(section.querySelectorAll('img[alt="uploaded"]'));
  const capturedTransforms = liveImages.map((img) => ({
    inlineTransform: img.style.transform || "",
  }));

  const livePages = Array.from(section.querySelectorAll(".pdf-page"));

  const clone = section.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = `${renderWidth}px`;
  clone.style.height = "auto";
  clone.style.overflow = "visible";
  clone.style.maxHeight = "none";
  clone.style.margin = "0";
  clone.style.padding = "0";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.border = "none";
  clone.style.backgroundColor = "transparent";

  // Preserve exact background properties from original live .pdf-page elements
  const clonePages = Array.from(clone.querySelectorAll(".pdf-page"));
  clonePages.forEach((clonePage, index) => {
    const livePage = livePages[index];
    clonePage.style.zoom = "1";
    clonePage.style.width = `${renderWidth}px`;
    clonePage.style.height = `${renderHeight}px`;
    clonePage.style.flexShrink = "0";
    clonePage.style.boxShadow = "none";
    clonePage.style.margin = "0";
    clonePage.style.borderRadius = "0";
    clonePage.style.border = "none";
    clonePage.style.outline = "none";

    if (livePage) {
      const comp = window.getComputedStyle(livePage);
      if (comp.backgroundColor && comp.backgroundColor !== "rgba(0, 0, 0, 0)" && comp.backgroundColor !== "transparent") {
        clonePage.style.backgroundColor = comp.backgroundColor;
      }
      if (comp.backgroundImage && comp.backgroundImage !== "none") {
        clonePage.style.backgroundImage = comp.backgroundImage;
      }
    }
  });

  document.body.appendChild(clone);

  // Preserve live DOM computed layout, positioning, flex alignment, line heights, padding & transforms
  syncLiveLayout(section, clone);

  await preloadImages(clone);

  // Fix uploaded img sizing so html2canvas captures without stretching
  const cloneImages = Array.from(clone.querySelectorAll('img[alt="uploaded"]'));
  capturedTransforms.forEach(({ inlineTransform }, i) => {
    const cloneImg = cloneImages[i];
    if (!cloneImg) return;

    const natW = cloneImg.naturalWidth;
    const natH = cloneImg.naturalHeight;
    if (!natW || !natH) return;

    const cloneContainer = cloneImg.closest(".relative.flex.items-center.justify-center") || cloneImg.parentElement;
    if (!cloneContainer) return;

    const cloneW = cloneContainer.clientWidth;
    const cloneH = cloneContainer.clientHeight;
    if (!cloneW || !cloneH) return;

    const imageAR = natW / natH;
    const containerAR = cloneW / cloneH;
    let imgW, imgH;
    if (imageAR > containerAR) {
      imgW = cloneW;
      imgH = cloneW / imageAR;
    } else {
      imgH = cloneH;
      imgW = cloneH * imageAR;
    }

    cloneImg.style.position = "absolute";
    cloneImg.style.inset = "auto";
    cloneImg.style.left = "50%";
    cloneImg.style.top = "50%";
    cloneImg.style.width = `${imgW}px`;
    cloneImg.style.height = `${imgH}px`;
    cloneImg.style.maxWidth = "none";
    cloneImg.style.maxHeight = "none";
    cloneImg.style.objectFit = "none";
    cloneImg.style.transform = `translate(-50%, -50%) ${inlineTransform}`;
    cloneImg.style.transformOrigin = "center center";
    cloneImg.style.transition = "none";
  });

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

    if (inputType === "file") {
      return;
    } else if (inputType === "checkbox" || inputType === "radio") {
      try { cloneInput.checked = input.checked; } catch {}
    } else if (inputType === "textarea" || input.tagName.toLowerCase() === "textarea") {
      try {
        cloneInput.value = input.value;
        cloneInput.textContent = input.value;
      } catch {}
    } else {
      try { cloneInput.value = input.value; } catch {}
    }
  });

  // Convert non-uploaded images (logos, icons) with object-fit cover/contain to div elements
  const imagesToConvert = clone.querySelectorAll("img");
  imagesToConvert.forEach((img) => {
    if (img.alt === "uploaded") return;

    const compStyle = window.getComputedStyle(img);
    const isCover =
      img.classList.contains("object-cover") ||
      compStyle.objectFit === "cover" ||
      img.style.objectFit === "cover";
    const isContain =
      img.classList.contains("object-contain") ||
      compStyle.objectFit === "contain" ||
      img.style.objectFit === "contain";

    if (isCover || isContain) {
      const objectFit = isCover ? "cover" : "contain";
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

  // Explicitly render shadows as faux shadow layers for 100% accurate html2canvas capture
  applyFauxShadows(clone);

  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const pWidth = renderWidth;
    const pHeight = renderHeight;

    const options = {
      scale: 6.25, // 600 DPI print-quality resolution (6.25 * 96 DPI)
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: null,
      width: pWidth,
      height: pHeight,
      windowWidth: pWidth,
      windowHeight: pHeight,
    };

    const pages = clone.querySelectorAll(".pdf-page");
    const elementsToCapture = pages.length > 0 ? Array.from(pages) : [clone];

    const finalPaperWidth = withBleed ? bleedWidth : paperSize.width;
    const finalPaperHeight = withBleed ? bleedHeight : paperSize.height;

    const orientation = paperSize.width > paperSize.height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "in",
      format: [finalPaperWidth, finalPaperHeight],
      compress: true,
    });

    for (let i = 0; i < elementsToCapture.length; i++) {
      const el = elementsToCapture[i];
      const livePage = livePages[i];

      const isExplicitPage = pages.length > 0;
      const totalHeight = isExplicitPage ? pHeight : Math.max(pHeight, el.scrollHeight);

      el.style.width = `${pWidth}px`;
      el.style.height = `${totalHeight}px`;
      el.style.overflow = "hidden";
      el.style.display = "flex";

      let pageBg = null;
      if (livePage) {
        const comp = window.getComputedStyle(livePage);
        if (comp.backgroundColor && comp.backgroundColor !== "rgba(0, 0, 0, 0)" && comp.backgroundColor !== "transparent") {
          pageBg = comp.backgroundColor;
        }
      }

      const elOptions = {
        ...options,
        backgroundColor: pageBg,
        height: totalHeight,
        windowHeight: totalHeight,
      };

      const canvas = await html2canvas(el, elOptions);

      // For no-bleed: crop the 0.125" bleed zone from all 4 edges of the
      // captured canvas, leaving only the 8.5" × 11" safe-zone content.
      // For with-bleed: use the full canvas as-is (8.75" × 11.25").
      let finalImgData;
      if (!withBleed) {
        const scale = options.scale || 6.25;
        const cropPx = Math.round(BLEED_IN * 96 * scale); // 0.125" in canvas px
        const cropW = canvas.width - cropPx * 2;
        const cropH = canvas.height - cropPx * 2;
        const cropped = document.createElement("canvas");
        cropped.width = cropW;
        cropped.height = cropH;
        cropped.getContext("2d").drawImage(
          canvas,
          cropPx, cropPx, cropW, cropH,
          0, 0, cropW, cropH
        );
        finalImgData = cropped.toDataURL("image/jpeg", 0.95);
      } else {
        finalImgData = canvas.toDataURL("image/jpeg", 0.95);
      }

      if (i > 0) {
        pdf.addPage([finalPaperWidth, finalPaperHeight], orientation);
      }

      if (withSafeZone && !withBleed) {
        const safeMargin = 0.25;
        const safeImgWidth = paperSize.width - safeMargin * 2;
        const safeImgHeight = paperSize.height - safeMargin * 2;
        pdf.addImage(
          finalImgData,
          "JPEG",
          safeMargin,
          safeMargin,
          safeImgWidth,
          safeImgHeight
        );
      } else {
        pdf.addImage(
          finalImgData,
          "JPEG",
          0,
          0,
          finalPaperWidth,
          finalPaperHeight
        );
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

/**
 * Synchronizes computed layout, flex alignment, line heights, padding, positioning,
 * and transforms directly from live DOM elements to cloned DOM elements.
 */
const syncLiveLayout = (liveRoot, cloneRoot) => {
  const liveElements = Array.from(liveRoot.querySelectorAll("*"));
  const cloneElements = Array.from(cloneRoot.querySelectorAll("*"));

  const count = Math.min(liveElements.length, cloneElements.length);

  for (let i = 0; i < count; i++) {
    const liveEl = liveElements[i];
    const cloneEl = cloneElements[i];

    if (!liveEl || !cloneEl) continue;
    if (cloneEl.getAttribute("data-html2canvas-ignore") === "true") continue;

    const comp = window.getComputedStyle(liveEl);

    // Flexbox & Grid Alignment
    if (comp.display.includes("flex")) {
      cloneEl.style.display = comp.display;
      cloneEl.style.flexDirection = comp.flexDirection;
      cloneEl.style.alignItems = comp.alignItems;
      cloneEl.style.justifyContent = comp.justifyContent;
      cloneEl.style.flexWrap = comp.flexWrap;
      cloneEl.style.alignContent = comp.alignContent;
    } else if (comp.display.includes("grid")) {
      cloneEl.style.display = comp.display;
      cloneEl.style.alignItems = comp.alignItems;
      cloneEl.style.justifyContent = comp.justifyContent;
      cloneEl.style.alignContent = comp.alignContent;
      cloneEl.style.justifyItems = comp.justifyItems;
    }

    // Line height, padding, text alignment
    if (comp.lineHeight && comp.lineHeight !== "normal") {
      cloneEl.style.lineHeight = comp.lineHeight;
    }
    if (comp.padding && comp.padding !== "0px") {
      cloneEl.style.padding = comp.padding;
    }
    if (comp.textAlign) {
      cloneEl.style.textAlign = comp.textAlign;
    }
    if (comp.verticalAlign && comp.verticalAlign !== "baseline") {
      cloneEl.style.verticalAlign = comp.verticalAlign;
    }

    // Preserve position / top / left / width / height / transform from live DOM if set
    if (liveEl.style.position || comp.position === "absolute" || comp.position === "relative") {
      cloneEl.style.position = comp.position;
      if (liveEl.style.top) cloneEl.style.top = liveEl.style.top;
      if (liveEl.style.left) cloneEl.style.left = liveEl.style.left;
    }

    if (liveEl.style.width) cloneEl.style.width = liveEl.style.width;
    if (liveEl.style.height) cloneEl.style.height = liveEl.style.height;

    // Only copy inline transform when explicitly defined on live element (e.g. DraggableBox translate3d)
    if (liveEl.style.transform) {
      cloneEl.style.transform = liveEl.style.transform;
    }
  }
};

const preloadImages = (element) => {
  const images = element.getElementsByTagName("img");
  const promises = [];

  for (let img of images) {
    let changed = false;
    if (img.src && !img.src.startsWith("data:") && !img.src.startsWith("blob:")) {
      try {
        const url = new URL(img.src, window.location.href);
        url.searchParams.set("_t", Date.now().toString() + Math.random().toString().substring(2, 8));
        img.crossOrigin = "anonymous";
        img.src = url.toString();
        changed = true;
      } catch (e) {
        console.error("Error parsing image URL:", e);
      }
    }

    if (changed || !img.complete || img.naturalHeight === 0) {
      const promise = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 5000);
      });
      promises.push(promise);
    }
  }

  return Promise.all(promises);
};

const tailwindShadowMap = {
  "shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  "shadow": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  "shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  "shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  "shadow-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  "shadow-2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  "shadow-inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
};

const parseBoxShadow = (shadowStr) => {
  if (!shadowStr || shadowStr === "none") return [];

  const shadows = [];
  const parts = [];
  let current = "";
  let parenDepth = 0;

  for (let i = 0; i < shadowStr.length; i++) {
    const char = shadowStr[i];
    if (char === "(") parenDepth++;
    else if (char === ")") parenDepth--;
    else if (char === "," && parenDepth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());

  for (const part of parts) {
    let color = "rgba(0, 0, 0, 0.25)";
    let rest = part;

    const colorMatch = part.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]+|hsla?\([^)]+\))/);
    if (colorMatch) {
      color = colorMatch[1];
      rest = part.replace(colorMatch[1], "").trim();
    }

    const isInset = rest.includes("inset");
    rest = rest.replace(/inset/g, "").trim();

    const lengths = rest.split(/\s+/).filter(Boolean).map((s) => parseFloat(s) || 0);
    const offsetX = lengths[0] || 0;
    const offsetY = lengths[1] || 0;
    const blur = lengths[2] || 0;
    const spread = lengths[3] || 0;

    shadows.push({ offsetX, offsetY, blur, spread, color, isInset });
  }

  return shadows;
};

const applyFauxShadows = (cloneRoot) => {
  const allElements = Array.from(cloneRoot.querySelectorAll("*"));

  allElements.forEach((el) => {
    if (el.classList.contains("pdf-page") || el.getAttribute("data-html2canvas-ignore") === "true") {
      return;
    }

    const computed = window.getComputedStyle(el);
    let rawShadow = computed.boxShadow;

    for (const [cls, val] of Object.entries(tailwindShadowMap)) {
      if (el.classList.contains(cls)) {
        if (!rawShadow || rawShadow === "none" || rawShadow.includes("var(")) {
          rawShadow = val;
        }
        break;
      }
    }

    if (!rawShadow || rawShadow === "none" || rawShadow.includes("var(")) {
      const arbitraryShadow = Array.from(el.classList).find(
        (c) => c.startsWith("shadow-[") && c.endsWith("]")
      );
      if (arbitraryShadow) {
        rawShadow = arbitraryShadow.slice(8, -1).replace(/_/g, " ");
      }
    }

    if (!rawShadow || rawShadow === "none" || rawShadow.includes("var(")) {
      return;
    }

    const shadows = parseBoxShadow(rawShadow);
    if (shadows.length === 0) return;

    const outerShadows = shadows.filter((s) => !s.isInset);
    if (outerShadows.length === 0) return;

    el.style.boxShadow = "none";

    const currentPosition = computed.position;
    if (currentPosition === "static") {
      el.style.position = "relative";
    }

    const hasInnerClipping = el.querySelector(
      ".overflow-hidden, [style*='overflow: hidden'], [style*='overflow:hidden'], img, [data-image-slot]"
    );
    if (hasInnerClipping) {
      el.style.overflow = "visible";
      el.style.overflowX = "visible";
      el.style.overflowY = "visible";
    }

    const borderRadius = computed.borderRadius;

    const shadowHost = document.createElement("div");
    shadowHost.className = "pdf-faux-shadow-host";
    shadowHost.style.position = "absolute";
    shadowHost.style.top = "0";
    shadowHost.style.left = "0";
    shadowHost.style.width = "100%";
    shadowHost.style.height = "100%";
    shadowHost.style.pointerEvents = "none";
    shadowHost.style.zIndex = "0";

    outerShadows.forEach((shadow) => {
      let r = 0,
        g = 0,
        b = 0,
        baseAlpha = 0.3;

      const rgbaMatch = shadow.color.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
      );
      if (rgbaMatch) {
        r = parseInt(rgbaMatch[1], 10);
        g = parseInt(rgbaMatch[2], 10);
        b = parseInt(rgbaMatch[3], 10);
        baseAlpha = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
      } else if (shadow.color.startsWith("#")) {
        let hex = shadow.color.slice(1);
        if (hex.length === 3)
          hex = hex
            .split("")
            .map((c) => c + c)
            .join("");
        r = parseInt(hex.substring(0, 2), 16) || 0;
        g = parseInt(hex.substring(2, 4), 16) || 0;
        b = parseInt(hex.substring(4, 6), 16) || 0;
        baseAlpha = 0.5;
      }

      const blur = Math.max(shadow.blur, 1);
      const numSteps = Math.min(Math.max(Math.round(blur * 1.5), 6), 14);
      const maxSpread = shadow.spread + blur;

      for (let i = 1; i <= numSteps; i++) {
        const fraction = i / numSteps;
        const spreadOffset = maxSpread * fraction;
        const layerAlpha =
          (baseAlpha / numSteps) * Math.pow(1 - fraction, 0.7) * 1.6;

        const layer = document.createElement("div");
        layer.style.position = "absolute";
        layer.style.top = `${shadow.offsetY - spreadOffset}px`;
        layer.style.left = `${shadow.offsetX - spreadOffset}px`;
        layer.style.right = `${-shadow.offsetX - spreadOffset}px`;
        layer.style.bottom = `${-shadow.offsetY - spreadOffset}px`;
        layer.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${layerAlpha.toFixed(4)})`;
        layer.style.borderRadius =
          borderRadius && borderRadius !== "0px"
            ? `calc(${borderRadius} + ${spreadOffset}px)`
            : `${spreadOffset}px`;
        layer.style.pointerEvents = "none";
        shadowHost.appendChild(layer);
      }
    });

    Array.from(el.children).forEach((child) => {
      const childStyle = window.getComputedStyle(child);
      if (childStyle.position === "static") {
        child.style.position = "relative";
      }
      if (!child.style.zIndex || child.style.zIndex === "auto" || child.style.zIndex === "0") {
        child.style.zIndex = "1";
      }
    });

    el.insertBefore(shadowHost, el.firstChild);
  });
};

export default DownloadPdf;