import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DownloadPdf = async (elementId, fileName = "section.pdf", withBleed = false) => {
  const section = document.getElementById(elementId);

  if (!section) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
  }

  // Detect background color from the first child (template root) or section itself
  const getBackgroundColor = (el) => {
    const child = el.firstElementChild;
    let bgColor = window.getComputedStyle(child || el).backgroundColor;
    // If transparent, try searching deeper or default to white
    if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
      if (child && child.firstElementChild) {
        bgColor = window.getComputedStyle(child.firstElementChild).backgroundColor;
      }
    }
    return bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent" ? "#ffffff" : bgColor;
  };

  const bgColor = getBackgroundColor(section);

  const clone = section.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = `${section.offsetWidth}px`;
  clone.style.height = "auto";
  clone.style.overflow = "visible";
  clone.style.maxHeight = "none";
  document.body.appendChild(clone);

  const originalInputs = section.querySelectorAll("input, textarea");
  const cloneInputs = clone.querySelectorAll("input, textarea");

  originalInputs.forEach((input, index) => {
    if (!cloneInputs[index]) return;

    const cloneInput = cloneInputs[index];
    const inputType = input.type.toLowerCase();

    if (inputType === 'file') {
      cloneInput.value = "";
      if (input.files && input.files[0]) {
        const fileNameDisplay = document.createElement('span');
        // fileNameDisplay.textContent = `Selected file: ${input.files[0].name}`;
        // fileNameDisplay.style.color = '#666';
        // fileNameDisplay.style.fontStyle = 'italic';
        cloneInput.parentNode?.insertBefore(fileNameDisplay, cloneInput.nextSibling);
        cloneInput.style.display = 'none';
      }
      return;
    }

    if (inputType === 'checkbox' || inputType === 'radio') {
      cloneInput.checked = input.checked;
    } else if (inputType === 'textarea' || input.tagName.toLowerCase() === 'textarea') {
      cloneInput.value = input.value;
      cloneInput.textContent = input.value;
    } else {
      cloneInput.value = input.value;
      cloneInput.setAttribute("value", input.value);
    }
  });

  await preloadImages(clone);

  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // Measure natural dimensions from the clone (off-screen, fully expanded)
    const originalWidth = clone.scrollWidth;
    const originalHeight = clone.scrollHeight;

    // Bleed calculation (3mm ≈ 11.34px at 96 DPI)
    const bleedPx = withBleed ? 11.34 : 0;
    
    // Final PDF page dimensions including optional bleed
    const finalPageWidth = originalWidth + (bleedPx * 2);
    const finalPageHeight = originalHeight + (bleedPx * 2);

    const options = {
      scale: 2, // High quality
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: bgColor,
      removeContainer: true,
      width: originalWidth,
      height: originalHeight,
      // windowWidth/windowHeight intentionally omitted so html2canvas
      // captures the full content without any viewport clipping
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.width = `${originalWidth}px`;
          clonedElement.style.height = `${originalHeight}px`;
          clonedElement.style.overflow = 'visible';
          clonedElement.style.maxHeight = 'none';
          clonedElement.style.backgroundColor = bgColor;
        }
      }
    };

    const canvas = await html2canvas(clone, options);
    
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }

    // PDF orientation based on actual content dimensions
    const orientation = finalPageHeight > finalPageWidth ? "portrait" : "landscape";

    const pdf = new jsPDF({
      orientation: orientation,
      unit: "px",
      format: [finalPageWidth, finalPageHeight],
      hotfixes: ["px_scaling"] // Prevent jsPDF from applying its own DPI scaling
    });

    // Fill background
    pdf.setFillColor(bgColor);
    pdf.rect(0, 0, finalPageWidth, finalPageHeight, 'F');

    const imgData = canvas.toDataURL("image/png", 1.0);
    
    // Place image to fill the entire PDF page (plus bleed offset if any)
    pdf.addImage(imgData, "PNG", bleedPx, bleedPx, originalWidth, originalHeight);
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