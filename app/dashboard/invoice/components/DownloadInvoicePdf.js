import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DownloadInvoicePdf = async (elementId, fileName = "invoice.pdf") => {
  const section = document.getElementById(elementId);
  if (!section) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
  }

  // 1. Wait for custom fonts to load completely
  // This is the #1 reason for text baseline shifts in html2canvas (e.g., text drifting out of badges or buttons)
  if (document.fonts) {
      await document.fonts.ready;
  }

  // Wait a moment for any lazy re-renders
  await new Promise(r => setTimeout(r, 500));

  // 2. Capture the actual DOM element, no cloning
    const options = {
    scale: 2, 
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 800, // Lock the capture width
    onclone: (clonedDoc) => {
        // html2canvas clones the document internally to capture it
        const el = clonedDoc.getElementById(elementId);
        if (el) {
            // Ensure the element in the internal clone wrapper is visible and fully styled
            el.style.display = 'block';
            
            // Inject a style block into the cloned document to force system fonts
            // Custom fonts like Alexandria frequently cause vertical alignment (baseline) bugs in html2canvas
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
                * {
                    font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif !important;
                }
            `;
            clonedDoc.head.appendChild(style);
            
            // Force svgs to block to prevent inline whitespace bugs
            const svgs = el.querySelectorAll('svg');
            svgs.forEach(svg => {
                svg.style.display = 'block';
            });
        }
    }
  };

  try {
    const canvas = await html2canvas(section, options);
    const imgData = canvas.toDataURL("image/png", 1.0);
    
    // Calculate PDF dimensions (A4 is approx 794x1123 at 96 DPI)
    const pdfWidth = 794; 
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [pdfWidth, Math.max(pdfHeight, 1123)]
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating Invoice PDF:", error);
  }
};

export default DownloadInvoicePdf;
