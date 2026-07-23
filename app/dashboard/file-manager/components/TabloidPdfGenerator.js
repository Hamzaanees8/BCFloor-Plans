import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { applySafeZoneToClone } from "../utils/safeZoneUtils";

const TabloidPdfGenerator = async (
  elementId,
  fileName = "sheet.pdf",
  withBleed = false,
  withSafeZone = false
) => {
  const paperSize = { width: 17, height: 11 }; // Enforce Tabloid size
  const section = document.getElementById(elementId);

  if (!section) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
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

  // Reference width for consistent layout rendering
  // We use 96 DPI as base browser reference (1 inch = 96px)
  const renderWidth = paperSize.width * 96; // 1632px
  const renderHeight = paperSize.height * 96; // 1056px

  // ─── Capture image transforms from the live DOM BEFORE cloning ────────────
  // The live page is zoomed (e.g. 0.55), so the ImageEditor's baseScale was
  // computed for a smaller container. We need to re-derive the correct
  // baseScale for the full-resolution (unzoomed) container and rebuild the
  // transform so the PDF looks identical to the screen preview.
  const liveImages = Array.from(section.querySelectorAll('img[alt="uploaded"]'));
  const capturedTransforms = liveImages.map(img => {
    // Read the live computed transform (includes translate + scale + rotate from React state)
    const computedStyle = window.getComputedStyle(img);
    const liveTransform = computedStyle.transform; // e.g. "matrix(a,b,c,d,tx,ty)"

    // Walk up to find the ImageEditor container (first ancestor that has overflow:hidden and w-full h-full)
    const container = img.closest('.relative.flex.items-center.justify-center');
    const containerRect = container ? container.getBoundingClientRect() : null;

    return { img, liveTransform, containerRect };
  });

  const clone = section.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = `${renderWidth}px`;
  clone.style.height = `${renderHeight}px`; // Force exact height for aspect ratio
  clone.style.overflow = "hidden";
  clone.style.maxHeight = "none";
  // Remove zoom from the pdf-page wrappers so layout renders at true 17x11 size
  const pdfPages = clone.querySelectorAll('.pdf-page');
  pdfPages.forEach(page => {
    page.style.zoom = '1';
    page.style.width = `${renderWidth}px`;
    page.style.height = `${renderHeight}px`;
  });

  document.body.appendChild(clone);

  if (withSafeZone) {
    applySafeZoneToClone(clone, true);
  }

  // ─── Re-apply corrected image transforms in the clone ──────────────────────
  // The clone is now at full 17x11in resolution. We need to recalculate
  // baseScale for each image at the full-res container size, then rebuild
  // the transform using the same user scale/translate/rotate as on screen.
  const cloneImages = Array.from(clone.querySelectorAll('img[alt="uploaded"]'));
  capturedTransforms.forEach(({ img: origImg, liveTransform }, i) => {
    const cloneImg = cloneImages[i];
    if (!cloneImg) return;

    // Parse the live matrix to extract: scaleX, translateX, translateY, rotation
    // matrix(a,b,c,d,tx,ty)  or  matrix3d(...)
    const matrixMatch = liveTransform.match(/matrix\(([^)]+)\)/);
    if (!matrixMatch) {
      // No transform, just keep object-contain behaviour
      cloneImg.style.transform = 'none';
      return;
    }
    const parts = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
    // [a, b, c, d, tx, ty]
    const [a, b, , , tx, ty] = parts;
    // Extract scale magnitude and rotation from matrix
    const liveScale = Math.sqrt(a * a + b * b);
    const liveAngleDeg = Math.round(Math.atan2(b, a) * 180 / Math.PI);

    // Find the clone container for this image to recalculate baseScale
    const cloneContainer = cloneImg.closest('.relative.flex.items-center.justify-center');
    if (!cloneContainer) {
      cloneImg.style.transform = liveTransform;
      return;
    }

    const cloneW = cloneContainer.clientWidth;
    const cloneH = cloneContainer.clientHeight;
    const natW = cloneImg.naturalWidth;
    const natH = cloneImg.naturalHeight;

    if (cloneW === 0 || cloneH === 0 || natW === 0 || natH === 0) {
      cloneImg.style.transform = liveTransform;
      return;
    }

    // Re-derive baseScale for the full-res container
    const isRotated90 = Math.abs(liveAngleDeg) === 90 || Math.abs(liveAngleDeg) === 270;
    const effW = isRotated90 ? natH : natW;
    const effH = isRotated90 ? natW : natH;
    const containerAR = cloneW / cloneH;
    const imageAR = effW / effH;
    let drawnW, drawnH;
    if (imageAR > containerAR) { drawnW = cloneW; drawnH = cloneW / imageAR; }
    else { drawnH = cloneH; drawnW = cloneH * imageAR; }
    const newBaseScale = Math.max(cloneW / drawnW, cloneH / drawnH);

    // The user's zoom level on screen was: liveScale / liveBaseScale
    // We don't know liveBaseScale directly, but we can get it from the original container
    const origContainer = origImg.closest('.relative.flex.items-center.justify-center');
    if (!origContainer) {
      cloneImg.style.transform = `translate(${tx}px, ${ty}px) scale(${newBaseScale}) rotate(${liveAngleDeg}deg)`;
      return;
    }
    const origW = origContainer.clientWidth;
    const origH = origContainer.clientHeight;
    let origBaseScale = 1;
    if (origW > 0 && origH > 0 && natW > 0 && natH > 0) {
      let oDrawnW, oDrawnH;
      if (imageAR > origW / origH) { oDrawnW = origW; oDrawnH = origW / imageAR; }
      else { oDrawnH = origH; oDrawnW = origH * imageAR; }
      origBaseScale = Math.max(origW / oDrawnW, origH / oDrawnH);
    }

    // User's intended scale (the scale prop passed to ImageEditor)
    const userScale = origBaseScale > 0 ? liveScale / origBaseScale : liveScale;

    // Scale the translate proportionally to the container size ratio
    const scaleRatio = cloneW / (origW || 1);
    const newTx = tx * scaleRatio;
    const newTy = ty * scaleRatio;

    const finalScale = userScale * newBaseScale;
    cloneImg.style.transform = `translate(${newTx}px, ${newTy}px) scale(${finalScale}) rotate(${liveAngleDeg}deg)`;
    cloneImg.style.transition = 'none';
  });


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
    // Skip ImageEditor uploaded images — they are handled by our custom
    // transform-sync logic above and must remain as <img> tags so the
    // computed transform (translate/scale/rotate) is honoured by html2canvas.
    if (img.alt === 'uploaded') return;

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

  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const pWidth = paperSize.width * 96;
    const pHeight = paperSize.height * 96;

    const options = {
      scale: 3, // Premium quality (>300 DPI)
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: bgColor,
      width: pWidth,
      height: pHeight,
      windowWidth: pWidth,
      windowHeight: pHeight,
    };

    const pages = clone.querySelectorAll(".tabloid-sheet, .pdf-page");
    const elementsToCapture = pages.length > 0 ? Array.from(pages) : [clone];

    const finalPaperWidth = withBleed ? paperSize.width + 0.25 : paperSize.width;
    const finalPaperHeight = withBleed ? paperSize.height + 0.25 : paperSize.height;

    const orientation = "landscape";
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

      // Ensure the page element is properly sized for capture
      el.style.width = `${pWidth}px`;
      el.style.height = `${totalHeight}px`;
      el.style.overflow = "hidden";
      el.style.display = "flex"; // Changed from block to flex for tabloid sheets to keep side-by-side pages intact

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
        const bleedPx = 0.125 * 96 * scale; // pixels for 0.125" at this scale
        
        const origWidth = canvas.width;
        const origHeight = canvas.height;
        const extWidth = origWidth + (bleedPx * 2);
        const extHeight = origHeight + (bleedPx * 2);
        
        const extCanvas = document.createElement('canvas');
        extCanvas.width = extWidth;
        extCanvas.height = extHeight;
        const ctx = extCanvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, extWidth, extHeight);
        
        // Draw original centered
        ctx.drawImage(canvas, bleedPx, bleedPx);
        
        // Stretch Top Edge
        ctx.drawImage(canvas, 0, 0, origWidth, 1, bleedPx, 0, origWidth, bleedPx);
        // Stretch Bottom Edge
        ctx.drawImage(canvas, 0, origHeight - 1, origWidth, 1, bleedPx, extHeight - bleedPx, origWidth, bleedPx);
        // Stretch Left Edge
        ctx.drawImage(canvas, 0, 0, 1, origHeight, 0, bleedPx, bleedPx, origHeight);
        // Stretch Right Edge
        ctx.drawImage(canvas, origWidth - 1, 0, 1, origHeight, extWidth - bleedPx, bleedPx, bleedPx, origHeight);
        
        // Corner: Top-Left
        ctx.drawImage(canvas, 0, 0, 1, 1, 0, 0, bleedPx, bleedPx);
        // Corner: Top-Right
        ctx.drawImage(canvas, origWidth - 1, 0, 1, 1, extWidth - bleedPx, 0, bleedPx, bleedPx);
        // Corner: Bottom-Left
        ctx.drawImage(canvas, 0, origHeight - 1, 1, 1, 0, extHeight - bleedPx, bleedPx, bleedPx);
        // Corner: Bottom-Right
        ctx.drawImage(canvas, origWidth - 1, origHeight - 1, 1, 1, extWidth - bleedPx, extHeight - bleedPx, bleedPx, bleedPx);
        
        finalImgData = extCanvas.toDataURL("image/png", 1.0);
        finalImgHeightInches = (totalHeight / 96) + 0.25;
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

export default TabloidPdfGenerator;