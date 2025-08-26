import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DownloadPdf = (elementId, fileName = "section.pdf") => {
  const section = document.getElementById(elementId);

  if (!section) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
  }

  html2canvas(section, { scale: 1, useCORS: true }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png", 0.8);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(fileName);
  });
};
export default DownloadPdf