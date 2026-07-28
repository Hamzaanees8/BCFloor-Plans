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

  const tagName = (el.tagName || "").toLowerCase();
  if (tagName === "svg" || tagName === "path" || tagName === "g" || tagName === "rect" || tagName === "circle") {
    return true; // All SVGs and SVG graphics remain full-bleed background layers
  }

  const dataBg = el.getAttribute ? el.getAttribute("data-background") : null;
  const dataDec = el.getAttribute ? el.getAttribute("data-decorative") : null;
  if (dataBg === "true" || dataDec === "true") return true;

  const className = (el.className || "").toString().toLowerCase();
  if (
    className.includes("bg-svg") ||
    className.includes("decorative") ||
    className.includes("background") ||
    className.includes("bg-layer") ||
    className.includes("overlay") ||
    className.includes("bg-gradient")
  ) {
    return true;
  }

  return false;
}

/**
 * Applies the 0.25-inch safe zone margin (24px) to a cloned DOM before PDF capture.
 * Keeps background SVGs and background graphics full-bleed (zero shift),
 * while insetting/shrinking images and printable content by 0.25" on all 4 sides.
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
  if (unit.querySelector(".pdf-safe-zone-wrapper")) return;

  // Mark all SVGs and their parent wrapper containers as decorative background layers so they are never shifted
  const svgs = Array.from(unit.querySelectorAll("svg"));
  svgs.forEach((svg) => {
    svg.setAttribute("data-decorative", "true");
    if (svg.parentElement) {
      svg.parentElement.setAttribute("data-decorative", "true");
    }
  });

  // Identify container for content elements
  let container = unit;
  if (unit.children.length === 1 && !isBackgroundOrDecorative(unit.children[0])) {
    container = unit.children[0];
  }

  const children = Array.from(container.children);
  const contentChildren = [];

  children.forEach((child) => {
    if (isBackgroundOrDecorative(child) || child.querySelector("svg")) {
      // Background SVGs and background layers stay full-bleed at native positions
      child.style.position = child.style.position || "absolute";
    } else {
      contentChildren.push(child);
    }
  });

  if (contentChildren.length === 0) return;

  // Create safe zone wrapper that insets images & content by 0.25" (24px) on top, bottom, left, and right
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-safe-zone-wrapper";
  wrapper.style.position = "absolute";
  wrapper.style.top = `${TARGET_SAFE_PX}px`;
  wrapper.style.left = `${TARGET_SAFE_PX}px`;
  wrapper.style.width = `calc(100% - ${TARGET_SAFE_PX * 2}px)`;
  wrapper.style.height = `calc(100% - ${TARGET_SAFE_PX * 2}px)`;
  wrapper.style.overflow = "hidden";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.zIndex = "10";

  contentChildren.forEach((child) => {
    wrapper.appendChild(child);
  });

  container.appendChild(wrapper);
}
