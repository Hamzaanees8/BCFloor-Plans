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

