import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DownloadPdf = async (
  elementId,
  fileName = "section.pdf",
  withBleed = false,
  paperSize = { width: 8.5, height: 11 }
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

  // Reference width for consistent layout rendering
  // We use 96 DPI as base browser reference (1 inch = 96px)
  const renderWidth = paperSize.width * 96;
  const renderHeight = paperSize.height * 96;

  const clone = section.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = `${renderWidth}px`;
  clone.style.height = `${renderHeight}px`; // Force exact height for aspect ratio
  clone.style.overflow = "hidden";
  clone.style.maxHeight = "none";
  document.body.appendChild(clone);

  // Sync inputs
  const originalInputs = section.querySelectorAll("input, textarea");
  const cloneInputs = clone.querySelectorAll("input, textarea");

  originalInputs.forEach((input, index) => {
    if (!cloneInputs[index]) return;
    const cloneInput = cloneInputs[index];
    const inputType = input.type.toLowerCase();
    if (inputType === 'checkbox' || inputType === 'radio') {
      cloneInput.checked = input.checked;
    } else if (inputType === 'textarea' || input.tagName.toLowerCase() === 'textarea') {
      cloneInput.value = input.value;
      cloneInput.textContent = input.value;
    } else {
      cloneInput.value = input.value;
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

    const pages = clone.querySelectorAll(".pdf-page");
    const elementsToCapture = pages.length > 0 ? Array.from(pages) : [clone];

    const orientation = paperSize.width > paperSize.height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation: orientation,
      unit: "in",
      format: [paperSize.width, paperSize.height]
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
      el.style.display = "block"; // Ensure it's not hidden

      const elOptions = {
        ...options,
        height: totalHeight,
        windowHeight: totalHeight,
      };

      const canvas = await html2canvas(el, elOptions);
      const imgData = canvas.toDataURL("image/png", 1.0);

      const imgHeightInches = totalHeight / 96;

      for (let p = 0; p < numPages; p++) {
        if (i > 0 || p > 0) {
          pdf.addPage([paperSize.width, paperSize.height], orientation);
        }

        if (withBleed) {
          pdf.addImage(
            imgData, 
            "PNG", 
            0, 
            -(p * paperSize.height), 
            paperSize.width, 
            imgHeightInches
          );
        } else {
          const margin = 0.1;
          const scaleFactor = (paperSize.width - (margin * 2)) / paperSize.width;
          const targetWidth = paperSize.width - (margin * 2);
          const targetHeight = imgHeightInches * scaleFactor;
          const pageContentHeight = paperSize.height - (margin * 2);

          pdf.setFillColor(bgColor);
          pdf.rect(0, 0, paperSize.width, paperSize.height, 'F');
          pdf.addImage(
            imgData, 
            "PNG", 
            margin, 
            margin - (p * pageContentHeight), 
            targetWidth, 
            targetHeight
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