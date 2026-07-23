/**
 * Utility functions for implementing an optional 0.25-inch internal Safe Zone margin for PDF exports.
 */

const SAFE_MARGIN_INCHES = 0.25;
const BASE_DPI = 96;
const TARGET_SAFE_PX = SAFE_MARGIN_INCHES * BASE_DPI; // 24px

/**
 * Checks if an element is a background or decorative layer that should remain full-bleed.
 */
export function isBackgroundOrDecorative(el) {
  if (!el) return false;

  const dataBg = el.getAttribute ? el.getAttribute("data-background") : null;
  const dataDec = el.getAttribute ? el.getAttribute("data-decorative") : null;
  if (dataBg === "true" || dataDec === "true") return true;

  const className = (el.className || "").toString().toLowerCase();
  if (
    className.includes("bg-svg") ||
    className.includes("decorative") ||
    className.includes("background") ||
    className.includes("bg-layer") ||
    className.includes("overlay")
  ) {
    return true;
  }

  const tagName = (el.tagName || "").toLowerCase();
  if (
    tagName === "svg" &&
    (className.includes("absolute") || className.includes("fixed")) &&
    (className.includes("inset-0") || className.includes("w-full"))
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if an element represents printable content (text, logos, property/agent info, QR codes, icons, photos).
 */
export function isPrintableContent(el) {
  if (!el || isBackgroundOrDecorative(el)) return false;

  const tagName = (el.tagName || "").toLowerCase();

  // Common printable content elements
  if (
    ["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "input", "textarea", "label", "img", "canvas", "table", "td", "th", "li"].includes(
      tagName
    )
  ) {
    return true;
  }

  // SVG icons or QR code SVGs (not full-screen background SVGs)
  if (tagName === "svg" && !isBackgroundOrDecorative(el)) {
    return true;
  }

  // Text nodes
  if (el.childNodes) {
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === 3 && child.textContent && child.textContent.trim().length > 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Applies the 0.25-inch safe zone adjustment to a cloned DOM before PDF capture.
 *
 * @param {HTMLElement} clone - The cloned DOM node attached to document.body
 * @param {boolean} isTabloid - Whether the template is a Tabloid format (17x11)
 */
export function applySafeZoneToClone(clone, isTabloid = false) {
  if (!clone) return;

  const pages = Array.from(clone.querySelectorAll(".pdf-page, .tabloid-sheet"));
  const elementsToProcess = pages.length > 0 ? pages : [clone];

  elementsToProcess.forEach((pageEl) => {
    let unitsToProcess = [pageEl];

    if (isTabloid) {
      // Check if physical tabloid sheet contains two sub-pages (e.g. w-1/2 divs)
      const halfDivs = Array.from(pageEl.querySelectorAll(".w-1\\/2"));
      if (halfDivs.length >= 2) {
        unitsToProcess = halfDivs;
      }
    }

    unitsToProcess.forEach((unit) => {
      processUnitSafeZone(unit);
    });
  });
}

function processUnitSafeZone(unit) {
  const unitRect = unit.getBoundingClientRect();
  if (unitRect.width === 0 || unitRect.height === 0) return;

  const allElements = Array.from(unit.querySelectorAll("*"));
  const printableElements = allElements.filter((el) => {
    if (!isPrintableContent(el)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return true;
  });

  if (printableElements.length === 0) return;

  // Measure minimum existing spacing from unit edges to printable content
  let minDistLeft = Infinity;
  let minDistRight = Infinity;
  let minDistTop = Infinity;
  let minDistBottom = Infinity;

  printableElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const distLeft = rect.left - unitRect.left;
    const distRight = unitRect.right - rect.right;
    const distTop = rect.top - unitRect.top;
    const distBottom = unitRect.bottom - rect.bottom;

    if (distLeft < minDistLeft) minDistLeft = distLeft;
    if (distRight < minDistRight) minDistRight = distRight;
    if (distTop < minDistTop) minDistTop = distTop;
    if (distBottom < minDistBottom) minDistBottom = distBottom;
  });

  // Calculate additional spacing required (target safe zone is 24px = 0.25in at 96 DPI)
  const padLeft = Math.max(0, TARGET_SAFE_PX - minDistLeft);
  const padRight = Math.max(0, TARGET_SAFE_PX - minDistRight);
  const padTop = Math.max(0, TARGET_SAFE_PX - minDistTop);
  const padBottom = Math.max(0, TARGET_SAFE_PX - minDistBottom);

  if (padLeft <= 0 && padRight <= 0 && padTop <= 0 && padBottom <= 0) {
    return; // Already has 0.25in or more on all sides
  }

  // Find or apply spacing to dedicated content wrapper
  let contentWrapper = unit.querySelector(".pdf-content-wrapper, .pdf-safe-zone-wrapper");

  if (!contentWrapper) {
    const directChildren = Array.from(unit.children);
    const contentChildren = directChildren.filter((child) => !isBackgroundOrDecorative(child));

    if (contentChildren.length === 1) {
      contentWrapper = contentChildren[0];
    } else if (contentChildren.length > 1) {
      contentWrapper = document.createElement("div");
      contentWrapper.className = "pdf-safe-zone-wrapper";
      contentWrapper.style.boxSizing = "border-box";
      contentWrapper.style.width = "100%";
      contentWrapper.style.height = "100%";
      contentWrapper.style.position = "relative";

      contentChildren.forEach((child) => {
        contentWrapper.appendChild(child);
      });
      unit.appendChild(contentWrapper);
    }
  }

  if (contentWrapper) {
    contentWrapper.style.boxSizing = "border-box";
    if (padLeft > 0) contentWrapper.style.paddingLeft = `${padLeft}px`;
    if (padRight > 0) contentWrapper.style.paddingRight = `${padRight}px`;
    if (padTop > 0) contentWrapper.style.paddingTop = `${padTop}px`;
    if (padBottom > 0) contentWrapper.style.paddingBottom = `${padBottom}px`;
  }

  // Handle absolute elements touching boundaries
  printableElements.forEach((el) => {
    const computed = window.getComputedStyle(el);
    if (computed.position === "absolute" || computed.position === "fixed") {
      const rect = el.getBoundingClientRect();
      const distLeft = rect.left - unitRect.left;
      const distTop = rect.top - unitRect.top;
      const distRight = unitRect.right - rect.right;
      const distBottom = unitRect.bottom - rect.bottom;

      let shiftX = 0;
      let shiftY = 0;

      if (distLeft < TARGET_SAFE_PX) shiftX = TARGET_SAFE_PX - distLeft;
      else if (distRight < TARGET_SAFE_PX) shiftX = -(TARGET_SAFE_PX - distRight);

      if (distTop < TARGET_SAFE_PX) shiftY = TARGET_SAFE_PX - distTop;
      else if (distBottom < TARGET_SAFE_PX) shiftY = -(TARGET_SAFE_PX - distBottom);

      if (shiftX !== 0 || shiftY !== 0) {
        const currTransform = el.style.transform || "";
        el.style.transform = `translate(${shiftX}px, ${shiftY}px) ${currTransform}`.trim();
      }
    }
  });
}
