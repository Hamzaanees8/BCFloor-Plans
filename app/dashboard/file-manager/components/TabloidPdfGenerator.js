import html2canvas from "html2canvas";
import jsPDF from "jspdf";


const TabloidPdfGenerator = async (
  elementId,
  fileName = "sheet.pdf",
  withBleed = false,
  withSafeZone = false
) => {
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

  // Full render dimensions including 0.125" bleed zone on all 4 sides (17.25" x 11.25")
  const fullWidth = 17.25;
  const fullHeight = 11.25;

  // Reference dimensions in px at 96 DPI
  const renderWidth = fullWidth * 96;  // 1656px
  const renderHeight = fullHeight * 96; // 1080px

  // ─── Capture image transforms & metrics from live DOM BEFORE cloning ───────
  const liveImages = Array.from(section.querySelectorAll('img[alt="uploaded"]'));
  const capturedTransforms = liveImages.map((img, idx) => {
    const computedStyle = window.getComputedStyle(img);
    const liveTransform = computedStyle.transform;
    const container = img.closest('.relative.flex.items-center.justify-center');
    const page = img.closest('.pdf-page');

    const metrics = {
      index: idx,
      sheetWidth: page ? page.clientWidth : section.clientWidth,
      sheetHeight: page ? page.clientHeight : section.clientHeight,
      containerWidth: container ? container.clientWidth : 0,
      containerHeight: container ? container.clientHeight : 0,
      imageRenderedWidth: img.clientWidth,
      imageRenderedHeight: img.clientHeight,
      imageBoundingClientRect: img.getBoundingClientRect(),
      containerBoundingClientRect: container ? container.getBoundingClientRect() : null,
      pageBoundingClientRect: page ? page.getBoundingClientRect() : section.getBoundingClientRect(),
      offsetWidth: img.offsetWidth,
      offsetHeight: img.offsetHeight,
      scrollWidth: img.scrollWidth,
      scrollHeight: img.scrollHeight,
      computedTransform: liveTransform,
    };

    console.log(`[TabloidPdfGenerator Debug BEFORE] Image #${idx}:`, metrics);

    return { img, liveTransform, container, metrics };
  });

  const clone = section.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = `${renderWidth}px`;
  clone.style.height = "auto"; // Allow container to expand naturally for multi-page tabloid sheets
  clone.style.overflow = "visible";
  clone.style.maxHeight = "none";
  // Set zoom=1 and enforce full 17.25x11.25 rendering size so bleed area and elements render accurately
  const pdfPages = clone.querySelectorAll('.pdf-page');
  pdfPages.forEach(page => {
    page.style.zoom = '1';
    page.style.width = `${renderWidth}px`;
    page.style.height = `${renderHeight}px`;
    page.style.flexShrink = '0';
  });

  document.body.appendChild(clone);

  await preloadImages(clone);

  // ─── Re-apply image transforms with explicit aspect ratio in clone ────────
  const cloneImages = Array.from(clone.querySelectorAll('img[alt="uploaded"]'));
  capturedTransforms.forEach(({ liveTransform, container: origContainer }, i) => {
    const cloneImg = cloneImages[i];
    if (!cloneImg) return;

    const cloneContainer = cloneImg.closest('.relative.flex.items-center.justify-center');

    const matrixMatch = liveTransform.match(/matrix\(([^)]+)\)/);
    if (!matrixMatch) return;

    const parts = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
    const [a, b, , , tx, ty] = parts;
    const liveScale = Math.sqrt(a * a + b * b);
    const liveAngleDeg = Math.round(Math.atan2(b, a) * 180 / Math.PI);

    const cloneW = cloneContainer ? cloneContainer.clientWidth : 0;
    const cloneH = cloneContainer ? cloneContainer.clientHeight : 0;
    const origW = origContainer ? origContainer.clientWidth : cloneW;
    const origH = origContainer ? origContainer.clientHeight : cloneH;
    const natW = cloneImg.naturalWidth;
    const natH = cloneImg.naturalHeight;

    if (cloneW > 0 && cloneH > 0 && natW > 0 && natH > 0) {
      const isRotated90 = Math.abs(liveAngleDeg) === 90 || Math.abs(liveAngleDeg) === 270;
      const effW = isRotated90 ? natH : natW;
      const effH = isRotated90 ? natW : natH;
      const imageAR = effW / effH;

      const containerAR = cloneW / cloneH;
      let drawnW, drawnH;
      if (imageAR > containerAR) {
        drawnW = cloneW;
        drawnH = cloneW / imageAR;
      } else {
        drawnH = cloneH;
        drawnW = cloneH * imageAR;
      }

      const newBaseScale = Math.max(cloneW / drawnW, cloneH / drawnH);

      const origContainerAR = origW / (origH || 1);
      let oDrawnW, oDrawnH;
      if (imageAR > origContainerAR) {
        oDrawnW = origW;
        oDrawnH = origW / imageAR;
      } else {
        oDrawnH = origH;
        oDrawnW = origH * imageAR;
      }
      const origBaseScale = Math.max(origW / (oDrawnW || 1), origH / (oDrawnH || 1));

      const userScale = origBaseScale > 0 ? liveScale / origBaseScale : liveScale;
      const scaleRatio = cloneW / (origW || 1);
      const userTx = tx * scaleRatio;
      const userTy = ty * scaleRatio;

      const imgW = isRotated90 ? drawnH : drawnW;
      const imgH = isRotated90 ? drawnW : drawnH;

      cloneImg.style.position = 'absolute';
      cloneImg.style.left = '50%';
      cloneImg.style.top = '50%';
      cloneImg.style.width = `${imgW}px`;
      cloneImg.style.height = `${imgH}px`;
      cloneImg.style.maxWidth = 'none';
      cloneImg.style.maxHeight = 'none';
      cloneImg.style.objectFit = 'fill';
      
      const finalScale = userScale * newBaseScale;
      cloneImg.style.transform = `translate(-50%, -50%) translate(${userTx}px, ${userTy}px) scale(${finalScale}) rotate(${liveAngleDeg}deg)`;
      cloneImg.style.transition = 'none';
    }
  });

  // Sync inputs, excluding file inputs entirely to avoid InvalidStateError
  const originalInputs = section.querySelectorAll("input:not([type='file']), textarea");
  const cloneInputs = clone.querySelectorAll("input:not([type='file']), textarea");

  originalInputs.forEach((input, index) => {
    if (!cloneInputs[index]) return;
    const cloneInput = cloneInputs[index];
    const inputType = input.type.toLowerCase();
    
    if (inputType === 'file') {
      return;
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

  // Convert non-uploaded images (logos, icons) with object-fit cover/contain to div elements
  const imagesToConvert = clone.querySelectorAll("img");
  imagesToConvert.forEach(img => {
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
    const pWidth = renderWidth;
    const pHeight = renderHeight;

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

    const finalPaperWidth = withBleed ? 17.25 : 17;
    const finalPaperHeight = withBleed ? 11.25 : 11;

    const orientation = "landscape";
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "in",
      format: [finalPaperWidth, finalPaperHeight],
      compress: true
    });

    for (let i = 0; i < elementsToCapture.length; i++) {
      const el = elementsToCapture[i];
      
      const isExplicitPage = pages.length > 0;
      const totalHeight = isExplicitPage ? pHeight : Math.max(pHeight, el.scrollHeight);

      // Ensure the page element is properly sized for capture
      el.style.width = `${pWidth}px`;
      el.style.height = `${totalHeight}px`;
      el.style.overflow = "hidden";
      el.style.display = "flex";

      const elOptions = {
        ...options,
        height: totalHeight,
        windowHeight: totalHeight,
      };

      const canvas = await html2canvas(el, elOptions);

      let finalCanvas = canvas;

      if (!withBleed) {
        // Crop out the 0.125" outer bleed zone from all 4 edges (area outside red border)
        const scale = options.scale || 3;
        const cropPx = 0.125 * 96 * scale; // 0.125" bleed in canvas pixels
        const cropWidth = canvas.width - (cropPx * 2);
        const cropHeight = canvas.height - (cropPx * 2);

        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const ctx = croppedCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          cropPx, cropPx, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );
        finalCanvas = croppedCanvas;
      }

      const finalImgData = finalCanvas.toDataURL("image/jpeg", 0.90);

      if (i > 0) {
        pdf.addPage([finalPaperWidth, finalPaperHeight], orientation);
      }

      if (withSafeZone && !withBleed) {
        const safeMargin = 0.25;
        const safeImgWidth = 17 - safeMargin * 2;   // 16.5"
        const safeImgHeight = 11 - safeMargin * 2; // 10.5"
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