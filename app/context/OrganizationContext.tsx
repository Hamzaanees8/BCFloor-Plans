"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDefaultDomains } from "@/lib/config/domains";
import { getAppOrigin } from "@/lib/utils";


interface ColorValue {
  value: string;
}

interface OrganizationBranding {
  primary_color: string | ColorValue;
  secondary_color: string | ColorValue;
  logo: string | null;
  white_label_styles?: any;
}

interface OrganizationData {
  org_id: number;
  uuid: string;
  slug: string;
  name?: string;
  portal_type: "admin" | "agent" | "vendor";
  is_whitelabel: boolean;
  from_name: string;
  from_email: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  branding: OrganizationBranding;
}

interface OrganizationContextType {
  organization: OrganizationData | null;
  isOrganizationLoaded: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Helper: extract color string from either a plain string or a { value: "..." } object
function extractColorValue(color: string | ColorValue | undefined, fallback: string): string {
  if (!color) return fallback;
  if (typeof color === 'object') return color.value || fallback;
  return color || fallback;
}

function updatePageMetadata(org: OrganizationData) {
  if (typeof document === "undefined") return;

  // Only update when we have real org data — never overwrite with defaults
  // before the API response arrives (avoids the flash of "Tojuco Solutions").
  const title = org.name || org.from_name;
  if (title) document.title = title;

  const faviconUrl = org.branding?.logo;
  if (!faviconUrl) return;

  const relTypes = ["icon", "shortcut icon", "apple-touch-icon"];
  relTypes.forEach((rel) => {
    let link: HTMLLinkElement | null = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  });
}

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [isOrganizationLoaded, setIsOrganizationLoaded] = useState(false);

  useEffect(() => {
    // Only update metadata when we actually have org data loaded.
    // Skipping the null case prevents the tab from briefly showing
    // "Tojuco Solutions" before the API response arrives.
    if (organization) {
      updatePageMetadata(organization);
    }
  }, [organization]);

  useEffect(() => {
    const origin = getAppOrigin();
    console.log("OrganizationProvider: resolving for origin:", origin);

    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const applyBranding = (data: OrganizationData) => {
      if (data.branding) {
        const root = document.documentElement;

        const primaryColor = extractColorValue(data.branding.primary_color, '#6BAE41');
        const secondaryColor = extractColorValue(data.branding.secondary_color, '#DC9600');

        root.style.setProperty('--org-primary', primaryColor);
        root.style.setProperty('--primary-color', primaryColor);       // legacy compat

        root.style.setProperty('--org-secondary', secondaryColor);
        root.style.setProperty('--secondary-color', secondaryColor);   // legacy compat

        if (data.branding.logo) {
          root.style.setProperty('--org-logo', `url(${data.branding.logo})`);
          root.style.setProperty('--logo-url', `url(${data.branding.logo})`); // legacy compat
        }
      }
    };

    const resolveDomain = async (fullUrl: string) => {
      const hostname = fullUrl.replace(/^https?:\/\//, '').split(':')[0];
      const domainWithoutPort = hostname.split(':')[0];
      const envDefaultDomains = getDefaultDomains();
      const defaultDomains = [
        ...envDefaultDomains,
        "bookings-new.localhost",
        "booking-new.localhost",
        "teams-new.localhost",
        "vendors-new.localhost",
        "agents-new.localhost",
        "localhost"
      ];
      
      if (defaultDomains.includes(domainWithoutPort)) {
         console.log("OrganizationProvider: skipping resolution for default domain:", domainWithoutPort);
         return;
      }

      try {
        console.log("OrganizationProvider: fetching resolution for hostname:", domainWithoutPort);
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com').replace(/\/api\/?$/, '');
        // Use cache: 'no-store' so each client fetch is fresh.
        // The middleware + cookie already cache org_data for 1 hour;
        // this path only runs when the cookie is missing.
        const res = await fetch(`${baseUrl}/api/domains/resolve?domain=${domainWithoutPort}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          console.log("OrganizationProvider: resolved:", data.slug, data.portal_type);
          applyBranding(data);
          setOrganization(data);
        } else {
          console.warn("OrganizationProvider: resolution failed with status:", res.status);
        }
      } catch (err) {
        console.warn("OrganizationProvider: resolution error:", err);
      }
    };

    const orgDataCookie = getCookie("org_data");
    if (orgDataCookie) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(orgDataCookie));
        console.log("OrganizationProvider: loaded from cookie:", parsedData.slug);
        setOrganization(parsedData);
        applyBranding(parsedData);
      } catch (e) {
        console.error("OrganizationProvider: failed to parse org_data cookie:", e);
        resolveDomain(origin);
      }
    } else {
      console.warn("OrganizationProvider: no org_data cookie found — resolving directly.");
      resolveDomain(origin);
    }

    setIsOrganizationLoaded(true);
  }, []);

  return (
    <OrganizationContext.Provider value={{ organization, isOrganizationLoaded }}>
      {children}
    </OrganizationContext.Provider>
  );
};


export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
};

export const useOptionalOrganization = () => {
  return useContext(OrganizationContext);
};
