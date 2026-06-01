import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getDefaultDomains } from "./config/domains"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppOrigin(): string {
  if (typeof window === "undefined") return "";

  // Check if we are inside a frame/iframe
  const isFramed = window.self !== window.top;

  if (isFramed) {
    // 1. Try ancestorOrigins (Chrome, Edge, Safari)
    if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
      const ancestorOrigin = window.location.ancestorOrigins[0];
      if (ancestorOrigin && !ancestorOrigin.includes("amplifyapp.com")) {
        return ancestorOrigin;
      }
    }

    // 2. Try document.referrer (Firefox / generic fallback)
    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        if (referrerUrl.origin && !referrerUrl.hostname.includes("amplifyapp.com")) {
          return referrerUrl.origin;
        }
      } catch {
        // Ignore invalid URL
      }
    }

    // 3. Fallbacks based on path context for the demo
    const path = window.location.pathname;
    const defaultDomains = getDefaultDomains();

    if (path.includes("/agent") || path.includes("/book")) {
      return `https://${defaultDomains[1] || 'bookings.tojuco.com'}`;
    } else if (path.includes("/vendor")) {
      return `https://${defaultDomains[2] || 'vendors.tojuco.com'}`;
    } else if (path.includes("/teams")) {
      return `https://${defaultDomains[0] || 'teams.tojuco.com'}`;
    }

    // Default fallback
    return `https://${defaultDomains[1] || 'bookings.tojuco.com'}`;
  }

  return window.location.origin;
}

export function getAppHostname(): string {
  if (typeof window === "undefined") return "";
  try {
    const origin = getAppOrigin();
    return origin ? new URL(origin).hostname : window.location.hostname;
  } catch {
    return window.location.hostname;
  }
}

export function formatPhoneNumber(value: string): string {
  if (!value) return value;

  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");

  // Keep only digits
  const cleaned = trimmed.replace(/\D/g, "");
  const length = cleaned.length;

  if (length === 0) return hasPlus ? "+" : "";

  // If it starts with country code 1 (either +1 or 1)
  if (cleaned.startsWith("1") || (hasPlus && cleaned.startsWith("1"))) {
    // Ensure it starts with 1
    const digits = cleaned.startsWith("1") ? cleaned : "1" + cleaned;
    const dLength = digits.length;

    if (dLength <= 1) {
      return "+1";
    }
    if (dLength <= 4) {
      return `+1 (${digits.slice(1)}`;
    }
    if (dLength <= 7) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    }
    if (dLength <= 11) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)} ext. ${digits.slice(11, 16)}`;
  }

  // If it starts with a plus but is NOT +1 (e.g. international number)
  if (hasPlus) {
    return "+" + cleaned;
  }

  // Fallback to standard 10-digit formatting (without +1)
  if (length <= 3) {
    return cleaned;
  }
  if (length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }
  if (length <= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)} ext. ${cleaned.slice(10, 15)}`;
}

export function isValidPhoneNumber(value: string): boolean {
  if (!value) return false;

  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const cleaned = trimmed.replace(/\D/g, "");

  // If it starts with '+' but NOT '+1' (or starts with a digit that is not 1 and has a plus)
  if (hasPlus && !cleaned.startsWith("1")) {
    // Basic international number check: 7 to 15 digits
    return cleaned.length >= 7 && cleaned.length <= 15;
  }

  // Otherwise, it is treated as a USA/Canada number
  let core = cleaned;
  if (cleaned.startsWith("1")) {
    core = cleaned.slice(1);
  }

  // Core must have at least 10 digits (the main phone number)
  if (core.length < 10) return false;

  // Extract area code and prefix
  const areaCode = core.slice(0, 3);
  const prefix = core.slice(3, 6);

  // North American Numbering Plan rules:
  // Area code and prefix cannot start with 0 or 1
  if (areaCode.startsWith("0") || areaCode.startsWith("1")) return false;
  if (prefix.startsWith("0") || prefix.startsWith("1")) return false;

  return true;
}

export function isValidWebsite(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    // Add temp prefix if not present to let URL parser work
    const urlToTest = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
    const parsed = new URL(urlToTest);

    // The hostname must contain at least one dot
    const hostname = parsed.hostname;
    if (!hostname.includes('.')) return false;

    // If it starts with www., it must have at least two dots (e.g., www.example.com)
    if (hostname.startsWith('www.') && (hostname.match(/\./g) || []).length < 2) {
      return false;
    }

    // The last part (TLD) must be at least 2 characters long and consist of letters only
    const parts = hostname.split('.');
    const tld = parts[parts.length - 1];
    if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}




