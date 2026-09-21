"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isDefaultDomain, isLocalhostDomain, cleanDomain } from "@/lib/config/domains";

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
  portal_type: "admin" | "agent" | "vendor" | "tours";
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

function updatePageMetadata(org: OrganizationData | null) {
  if (typeof document === "undefined") return;

  if (!org) {
    document.title = "Tojuco Solutions";
    const faviconUrl = "/default-favicon.png";
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
    return;
  }

  const title = org.name || org.from_name;
  if (title) document.title = title;

  const faviconUrl = org.branding?.logo || "/default-favicon.png";
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
    if (organization) {
      updatePageMetadata(organization);
    }
  }, [organization]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const hostname = window.location.hostname;
    const cleanHost = cleanDomain(hostname);
    const isConfiguredDefaultDomain = isDefaultDomain(cleanHost);
    console.log("OrganizationProvider: initializing for hostname:", cleanHost);

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

        const logoValue = data.branding.logo ? `url(${data.branding.logo})` : 'none';
        root.style.setProperty('--org-logo', logoValue);
        root.style.setProperty('--logo-url', logoValue); // legacy compat
      }
    };

    // Localhost and configured platform domains do not have organization
    // mappings. Custom production hostnames are resolved by exact hostname.
    if (isLocalhostDomain(cleanHost) || isConfiguredDefaultDomain) {
      console.log("OrganizationProvider: local/default domain detected:", cleanHost);
      updatePageMetadata(null);
      setIsOrganizationLoaded(true);
      return;
    }

    const resolveDomain = async (targetDomain: string) => {
      try {
        console.log("OrganizationProvider: fetching resolution for hostname:", targetDomain);
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com').replace(/\/api\/?$/, '');
        const res = await fetch(`${baseUrl}/api/domains/resolve?domain=${targetDomain}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          console.log("OrganizationProvider: resolved:", data.slug, data.portal_type, data.branding?.logo);
          applyBranding(data);
          setOrganization(data);
          updatePageMetadata(data);
        } else {
          console.warn("OrganizationProvider: resolution failed with status:", res.status);
          if (!cancelled) {
            setOrganization(null);
            updatePageMetadata(null);
          }
        }
      } catch (err) {
        console.warn("OrganizationProvider: resolution error:", err);
        if (!cancelled) {
          setOrganization(null);
          updatePageMetadata(null);
        }
      } finally {
        if (!cancelled) setIsOrganizationLoaded(true);
      }
    };

    const orgDataCookie = getCookie("org_data");
    if (orgDataCookie) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(orgDataCookie));
        console.log("OrganizationProvider: loaded from cookie:", parsedData.slug);
        setOrganization(parsedData);
        applyBranding(parsedData);
        updatePageMetadata(parsedData);
      } catch (e) {
        console.error("OrganizationProvider: failed to parse org_data cookie:", e);
      }
    }

    // Always resolve domain on client to ensure freshest branding & validation
    resolveDomain(cleanHost);

    return () => {
      cancelled = true;
    };
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
