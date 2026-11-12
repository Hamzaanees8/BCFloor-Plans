"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import { useOrganization } from "@/app/context/OrganizationContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { interpolateTemplate } from "@/lib/email-templates";
import {
  EmailTemplate,
  RecipientRole,
} from "@/app/dashboard/global-settings/templates";

interface TemplatePreviewDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  template: EmailTemplate | null;
  onEdit?: (template: EmailTemplate) => void;
}

const DUMMY_PREVIEW_VALUES: Record<string, string> = {
  order_id: "1001",
  property_address: "123 Main Street, Vancouver, BC",
  property_location: "Vancouver, BC",
  listing_address: "123 Main Street, Vancouver, BC",
  listing_location: "Vancouver, BC",
  service_name: "Matterport 3D Tour & 2D Floor Plan",
  recipient_name: "Sarah Jenkins",
  user_name: "Sarah Jenkins",
  agent_name: "Sarah Jenkins",
  agent_email: "sarah.jenkins@realty.ca",
  agent_phone: "(604) 555-0199",
  vendor_name: "Alex Rivera",
  vendor_number: "(604) 555-0144",
  vendor_phone: "(604) 555-0144",
  vendor_email: "alex@bcfvendors.com",
  amount: "$250.00 CAD",
  payment_for: "Full Order Invoice",
  payment_scope: "Full Order Invoice",
  payment_method: "Credit Card (Visa •••• 4242)",
  payment_date: "November 3, 2026 10:15 AM",
  payment_id: "PAY-8821",
  transfer_id: "tr_1Nxy2Z9Sample",
  schedule_date: "November 3, 2026",
  appointment_date: "November 3, 2026",
  date: "November 3, 2026",
  schedule_time: "10:00 AM - 11:30 AM",
  appointment_time: "10:00 AM - 11:30 AM",
  start_time: "10:00 AM",
  end_time: "11:30 AM",
  new_date: "November 5, 2026",
  new_time: "2:00 PM - 3:30 PM",
  old_date: "November 1, 2026",
  old_time: "9:00 AM - 10:30 AM",
  invoice_number: "#INV-BCF-2026-00329",
  invoice_id: "1001",
  receipt_url: "https://billing.stripe.com/receipt/sample",
  copies: "50",
  with_bleed: "Standard (No Bleed)",
  additional_info: "Please use 100lb glossy cardstock",
  pdf_url: "https://teams.tojuco.com/storage/feature-sheets/sample.pdf",
  cancellation_reason: "Client requested reschedule due to weather",
  cancellation_fee: "$50.00 CAD",
  expiry_date: "November 10, 2026",
  days_remaining: "7",
  new_expiry_date: "May 3, 2027",
  duration_months: "6",
  renewal_url: "https://bookings.tojuco.com/tours/renew/sample",
  service_url: "https://teams.tojuco.com/dashboard/file-manager/sample",
  completed_by: "Alex Rivera",
  media_count: "12",
  uploaded_by: "Alex Rivera",
  custom_message:
    "High-resolution photos and Matterport scan are ready for download.",
  changes_summary: "Appointment rescheduled to Nov 5, 2026 at 2:00 PM",
  floorplan_areas: "Garage, Covered Deck, Detached Studio",
  floorplan_notes: "Please include exterior dimensions for the detached studio.",
  floorplan_section:
    "Requested Areas: Garage, Covered Deck, Detached Studio. Special Instructions: Please include exterior dimensions for the detached studio.",
  scheduled_appointments:
    "Matterport 3D Tour & 2D Floor Plan — November 3, 2026 at 10:00 AM - 11:30 AM (Alex Rivera)",
  payer_name: "Sarah Jenkins",
  organization_name: "BC Floor Plans",
  email: "sarah.jenkins@realty.ca",
  name: "Sarah Jenkins",
  url: "https://teams.tojuco.com/dashboard",
  reset_link: "https://teams.tojuco.com/reset-password?token=sample",
  company_name: "BC Floor Plans",
  company_email: "mail@bcfloorplans.com",
  company_phone: "604-788-7783",
};

function buildMasterHtml(
  content: string,
  branding: {
    name: string;
    logoUrl?: string | null;
    primaryColor: string;
  } = {
    name: "BC Floor Plans",
    logoUrl: null,
    primaryColor: "#6BAE41",
  },
) {
  if (content.includes("<!DOCTYPE") || content.includes("<html")) {
    return content;
  }

  const { name, logoUrl, primaryColor } = branding;

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Preview</title>
    <style>
        body { margin: 0; padding: 0; background-color: #F5F5F5; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; }
        img { max-width: 100%; height: auto; }
        * { box-sizing: border-box; }
        a { color: #15803D; text-decoration: underline; }
        h1, h2, h3, p { margin-top: 0; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0; background-color: #F5F5F5;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: left;">
                    <!-- Header Branding -->
                    <tr>
                        <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 3px solid ${primaryColor};">
                            ${
                              logoUrl
                                ? `<img src="${logoUrl}" alt="${name} Logo" style="max-width: 200px; max-height: 80px; object-fit: contain; border: none; display: block;" />`
                                : `<h2 style="margin: 0; color: #333333; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif;">${name}</h2>`
                            }
                        </td>
                    </tr>
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px 30px; font-family: Arial, sans-serif; color: #3d4852; line-height: 1.6; font-size: 14px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 25px 20px; text-align: center; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; font-family: Arial, sans-serif;">
                            <p style="font-size: 12px; color: #9CA3AF; margin: 0 0 8px;">
                                &copy; ${new Date().getFullYear()} ${name}. All rights reserved.
                            </p>
                            <p style="font-size: 11px; color: #D1D5DB; margin: 0;">
                                Powered by <a href="https://tojuco.com" style="color: #9CA3AF; text-decoration: underline;">Tojuco</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export default function TemplatePreviewDialog({
  open,
  setOpen,
  template,
}: TemplatePreviewDialogProps) {
  const { organizationId } = useAppContext();
  const { organization } = useOrganization();
  const { appliedSettings, organizations } = useWhiteLabel();

  const userInfo = useMemo(() => {
    try {
      return typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("userInfo") || "{}")
        : {};
    } catch {
      return {};
    }
  }, []);

  const currentOrgObj = useMemo(() => {
    return (
      organizations?.find((o) => o.uuid === organizationId) ||
      organization ||
      userInfo?.organization ||
      null
    );
  }, [organizations, organizationId, organization, userInfo]);

  const [activeRole, setActiveRole] = useState<RecipientRole>("agent");

  // Determine available roles for this template
  const availableRoles = useMemo<RecipientRole[]>(() => {
    if (!template) return ["agent"];
    if (Array.isArray(template.recipient_type) && template.recipient_type.length > 0) {
      return template.recipient_type;
    }
    return ["agent", "vendor", "admin"];
  }, [template]);

  // Set default active role when template opens
  useEffect(() => {
    if (open && template) {
      if (availableRoles.length > 0 && !availableRoles.includes(activeRole)) {
        setActiveRole(availableRoles[0]);
      }
    }
  }, [open, template, availableRoles, activeRole]);

  // 1. Comprehensive Organization Name resolution (supports Whitelabel)
  const orgName = useMemo(() => {
    return (
      currentOrgObj?.name ||
      organization?.name ||
      currentOrgObj?.from_name ||
      organization?.from_name ||
      userInfo?.organization?.name ||
      "BC Floor Plans"
    );
  }, [currentOrgObj, organization, userInfo]);

  // 2. Comprehensive Organization Logo resolution (supports Whitelabel)
  const orgLogo = useMemo(() => {
    // A. Applied Whitelabel Settings (for active role, admin, or agent)
    const wlLogo =
      appliedSettings?.[activeRole]?.logo ||
      appliedSettings?.admin?.logo ||
      appliedSettings?.agent?.logo;
    if (wlLogo) return wlLogo;

    // B. Organization Branding logo
    if (currentOrgObj?.branding?.logo) return currentOrgObj.branding.logo;
    if (organization?.branding?.logo) return organization.branding.logo;

    // C. Organization company_logos_urls (primary or first)
    const orgLogos = (currentOrgObj as any)?.company_logos_urls || (organization as any)?.company_logos_urls || [];
    if (orgLogos.length > 0) {
      const primary = orgLogos.find((l: any) => l.type === "primary_logo") || orgLogos[0];
      if (primary?.url) return primary.url;
    }

    // D. User Session Organization logos
    const userOrgLogos = userInfo?.organization?.company_logos_urls || userInfo?.company_logos_urls || [];
    if (userOrgLogos.length > 0) {
      const primary = userOrgLogos.find((l: any) => l.type === "primary_logo") || userOrgLogos[0];
      if (primary?.url) return primary.url;
    }

    // E. Direct logo properties
    if ((currentOrgObj as any)?.logo) return (currentOrgObj as any).logo;
    if ((organization as any)?.logo) return (organization as any).logo;
    if (userInfo?.company_logo_url) return userInfo.company_logo_url;

    // F. CSS Variable fallback (SSR / Whitelabel Domain wrapper)
    if (typeof document !== "undefined") {
      const wrapper = document.getElementById("global-whitelabel-root");
      if (wrapper) {
        const style = window.getComputedStyle(wrapper);
        const urlVar =
          style.getPropertyValue("--org-logo").trim() ||
          style.getPropertyValue("--logo-url").trim();
        if (urlVar && urlVar !== "none") {
          const match = urlVar.match(/url\(["']?(.*?)["']?\)/);
          if (match && match[1]) return match[1];
        }
      }
    }

    return null;
  }, [appliedSettings, activeRole, currentOrgObj, organization, userInfo]);

  // 3. Comprehensive Organization Primary Color resolution (supports Whitelabel)
  const orgPrimaryColor = useMemo(() => {
    // A. Applied Whitelabel Color
    const wlColor =
      appliedSettings?.[activeRole]?.pageTabColor ||
      appliedSettings?.admin?.pageTabColor ||
      appliedSettings?.agent?.pageTabColor;
    if (wlColor) return wlColor;

    // B. Organization Branding primary color
    const orgColor =
      currentOrgObj?.branding?.primary_color ||
      organization?.branding?.primary_color;
    if (orgColor) {
      if (typeof orgColor === "object" && orgColor.value) return orgColor.value;
      if (typeof orgColor === "string") return orgColor;
    }

    // C. Direct primary color
    const directColor = (currentOrgObj as any)?.primary_color || (organization as any)?.primary_color;
    if (directColor) {
      if (typeof directColor === "object" && directColor.value) return directColor.value;
      if (typeof directColor === "string") return directColor;
    }

    return "#4290E9";
  }, [appliedSettings, activeRole, currentOrgObj, organization]);

  // 4. Contact details
  const orgEmail =
    currentOrgObj?.contact_email ||
    organization?.contact_email ||
    currentOrgObj?.from_email ||
    organization?.from_email ||
    "mail@bcfloorplans.com";

  const orgPhone =
    currentOrgObj?.contact_phone ||
    organization?.contact_phone ||
    "604-788-7783";

  const orgSlug =
    currentOrgObj?.slug?.toUpperCase() ||
    organization?.slug?.toUpperCase() ||
    "BCF";

  // Build dynamic preview data identically to AddTemplateDialog (Create Template Popup)
  const currentPreviewValues = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {
      ...DUMMY_PREVIEW_VALUES,
      company_name: orgName,
      company_email: orgEmail,
      company_phone: orgPhone,
      invoice_number: `#INV-${orgSlug}-2026-00329`,
    };

    if (activeRole === "vendor") {
      base.recipient_name = "Alex Rivera";
      base.user_name = "Alex Rivera";
    } else if (activeRole === "admin") {
      base.recipient_name = "Admin Operations";
      base.user_name = "Admin Operations";
    } else {
      base.recipient_name = "Sarah Jenkins";
      base.user_name = "Sarah Jenkins";
    }

    return base;
  }, [orgName, orgEmail, orgPhone, orgSlug, activeRole]);

  // Render preview document identically to AddTemplateDialog (Create Template Popup)
  const renderedHtml = useMemo(() => {
    if (!open || !template) return "";

    let rawHtml =
      template.content ||
      "<p style='color:#888; text-align:center;'>No content in this template.</p>";

    // 1. Replace all {{placeholders}} with realistic dummy values
    Object.entries(currentPreviewValues).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      rawHtml = rawHtml.replace(regex, val);
    });

    // 2. Also interpolate single brace or human readable placeholders if any
    rawHtml = interpolateTemplate(rawHtml, currentPreviewValues);

    if (rawHtml.includes("<!DOCTYPE") || rawHtml.includes("<html")) {
      return rawHtml;
    }

    return buildMasterHtml(rawHtml, {
      name: orgName,
      logoUrl: orgLogo,
      primaryColor: orgPrimaryColor,
    });
  }, [open, template, currentPreviewValues, orgName, orgLogo, orgPrimaryColor]);

  if (!template) return null;

  const interpolatedSubject = interpolateTemplate(
    template.title,
    currentPreviewValues,
  );

  const recipientEmailDisplay =
    activeRole === "vendor"
      ? "Alex Rivera <alex@bcfvendors.com>"
      : activeRole === "admin"
      ? "Operations Team <admin@bcfloorplans.com>"
      : "Sarah Jenkins <sarah.jenkins@realty.ca>";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[1050px] max-w-[95vw] h-[92vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[14px] font-alexandria shadow-2xl border border-gray-200">
        {/* Clean Header starting directly from Dummy Subject & Meta */}
        <DialogHeader className="px-6 py-3.5 flex-shrink-0 bg-white z-20 border-b border-[#E5E7EB]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-500 text-xs flex-shrink-0">
                  Subject:
                </span>
                <DialogTitle className="text-sm sm:text-base font-bold text-gray-900 truncate">
                  {interpolatedSubject}
                </DialogTitle>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
                <div>
                  <span className="font-semibold text-gray-500">From: </span>
                  <span className="text-gray-700">
                    {orgName} &lt;{orgEmail}&gt;
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">To: </span>
                  <span className="text-gray-700">{recipientEmailDisplay}</span>
                </div>
              </div>
            </div>

            {/* Controls: Role selector (if applicable) and Close button */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {availableRoles.length > 1 && (
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  {availableRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setActiveRole(role)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                        activeRole === role
                          ? "bg-white text-[#4290E9] shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Body Viewport */}
        <div className="flex-1 w-full bg-[#ECEEF1] p-4 sm:p-6 overflow-hidden flex items-center justify-center">
          <iframe
            title="Email Template Preview"
            srcDoc={renderedHtml}
            className="h-full w-[680px] max-w-full bg-white rounded-lg shadow-md border border-gray-300 transition-all"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-white border-t border-gray-200 flex justify-between items-center text-xs text-gray-500 flex-shrink-0">
          <span>
            Rendering preview with realistic dummy data & active organization
            branding.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-8 px-4 text-xs font-semibold cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
