import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DownloadPdf = async (elementId, fileName = "section.pdf") => {
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
    scale: 1,
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
    
    const a4Width = 794; 
    const a4Height = 1123; 

    let pdfWidth = a4Width;
    let pdfHeight = (imgHeight * a4Width) / imgWidth;

    if (pdfHeight > a4Height) {
      pdfHeight = a4Height;
      pdfWidth = (imgWidth * a4Height) / imgHeight;
    }

    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
      unit: "px",
      format: [a4Width, a4Height]
    });

    const x = (a4Width - pdfWidth) / 2;
    const y = (a4Height - pdfHeight) / 2;

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight);
    pdf.save(fileName);

  } catch (error) {
    console.error("Error generating PDF:", error);
    document.body.removeChild(clone);
  }
};

const preloadImages = (element) => {
  const images = element.getElementsByTagName('img');
  const promises = [];

  for (let img of images) {
    if (!img.complete || img.naturalHeight === 0) {
      const promise = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; 
        setTimeout(resolve, 3000);
      });
      promises.push(promise);
    }
  }

  return Promise.all(promises);
};

export default DownloadPdf;