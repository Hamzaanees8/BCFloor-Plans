import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DownloadPdf = async (elementId, fileName = "section.pdf", withBleed = false) => {
  const section = document.getElementById(elementId);

  if (!section) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
  }

  const clone = section.cloneNode(true);
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = `${section.offsetWidth}px`;
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

  const options = {
    scale: 2, // Use higher scale for better quality
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: '#ffffff',
    removeContainer: true,
    width: clone.scrollWidth,
    height: clone.scrollHeight,
    windowWidth: clone.scrollWidth,
    windowHeight: clone.scrollHeight,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById(elementId);
      if (clonedElement) {
        clonedElement.style.width = '100%';
        clonedElement.style.overflow = 'visible';
      }
    }
  };

  try {
    const canvas = await html2canvas(clone, options);

    document.body.removeChild(clone);

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // A4 dimensions at 72 DPI (default for jsPDF)
    // However, the code uses 794x1123 (approx 96 DPI)
    const a4Width = 794;
    const a4Height = 1123;

    // Bleed calculation (3mm on each side)
    // 1mm = 3.7795275591 pixels (at 96 DPI)
    // 3mm = 11.338582677 pixels
    const bleedPx = withBleed ? 11.34 : 0;
    
    // Final PDF page dimensions including bleed
    const finalPageWidth = a4Width + (bleedPx * 2);
    const finalPageHeight = a4Height + (bleedPx * 2);

    let pdfWidth = a4Width + (bleedPx * 2);
    let pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    // If the content is taller than the page, scale it down
    if (pdfHeight > finalPageHeight) {
      pdfHeight = finalPageHeight;
      pdfWidth = (imgWidth * finalPageHeight) / imgHeight;
    }

    const orientation = finalPageHeight > finalPageWidth ? "portrait" : "landscape";

    const pdf = new jsPDF({
      orientation: orientation,
      unit: "px",
      format: [finalPageWidth, finalPageHeight]
    });

    // Center the image on the PDF page
    const x = (finalPageWidth - pdfWidth) / 2;
    const y = (finalPageHeight - pdfHeight) / 2;

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight);
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
    // Check if the image has a source and isn't a data URI
    if (img.src && !img.src.startsWith('data:')) {
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