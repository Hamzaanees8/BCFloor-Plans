"use client";
import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import RichTextEditor from "@/app/dashboard/calendar/components/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreateSignature, UpdateSignature, Signature } from "@/app/dashboard/global-settings/signatures";

interface SignatureLayout {
    id: string;
    name: string;
    html: string;
    thumbnail: string;
}

const SIGNATURE_LAYOUTS: SignatureLayout[] = [
    {
        id: "classic-realtor",
        name: "Classic Realtor",
        thumbnail: "CR",
        html: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; border-left: 4px solid #4290E9; padding-left: 15px;">
  <div style="font-size: 18px; font-weight: bold; color: #4290E9;">{{Full Name}}</div>
  <div style="font-size: 14px; color: #666; margin-bottom: 8px;">{{Job Title}} | {{Company Name}}</div>
  <table border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #444;">
    <tr><td style="padding-bottom: 2px;">📞 {{Phone Number}}</td></tr>
    <tr><td style="padding-bottom: 2px;">✉️ {{Email Address}}</td></tr>
    <tr><td style="padding-bottom: 2px;">🌐 {{Website}}</td></tr>
    <tr><td style="padding-bottom: 2px;">📍 {{Office Address}}</td></tr>
    <tr><td style="font-size: 12px; color: #999;">License #: {{License Number}}</td></tr>
  </table>
  <div style="margin-top: 12px; font-style: italic; color: #555; border-top: 1px solid #eee; padding-top: 8px; font-size: 13px;">
    Helping buyers and sellers make confident real estate decisions.
  </div>
</div>`,
    },
    {
        id: "luxury-advisor",
        name: "Luxury Advisor",
        thumbnail: "LA",
        html: `<div style="font-family: 'Times New Roman', Times, serif; color: #1a1a1a; line-height: 1.6; max-width: 450px;">
  <div style="font-size: 22px; letter-spacing: 1px; text-transform: uppercase; font-weight: normal; margin-bottom: 4px;">{{Full Name}}</div>
  <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #8a7350; margin-bottom: 15px;">Luxury Real Estate Advisor | {{Company Name}}</div>
  <div style="font-size: 13px; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; padding: 10px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
    <div><strong>Direct:</strong> {{Phone Number}}</div>
    <div><strong>Email:</strong> {{Email Address}}</div>
    <div><strong>Web:</strong> {{Website}}</div>
    <div><strong>Office:</strong> {{Office Address}}</div>
  </div>
  <div style="font-size: 11px; color: #999; margin: 10px 0;">License #: {{License Number}}</div>
  <div style="font-size: 14px; font-style: italic; color: #444; text-align: center; border-left: 2px solid #8a7350; padding: 5px 15px;">
    Exclusive properties. Exceptional service. Results that move with the market.
  </div>
</div>`,
    },
    {
        id: "modern-minimal",
        name: "Modern Minimal",
        thumbnail: "MM",
        html: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
  <div style="font-size: 19px; font-weight: 800; text-transform: lowercase;">{{Full Name}}.</div>
  <div style="font-size: 13px; font-weight: 300; margin-bottom: 15px;">{{Job Title}} @ {{Company Name}}</div>
  <div style="font-size: 12px; color: #666; display: flex; flex-wrap: wrap; gap: 8px 15px;">
    <span><strong>P</strong> {{Phone Number}}</span>
    <span><strong>E</strong> {{Email Address}}</span>
    <span><strong>W</strong> {{Website}}</span>
    <span><strong>A</strong> {{Office Address}}</span>
  </div>
  <div style="font-size: 11px; color: #ccc; margin-top: 10px;">LIC# {{License Number}}</div>
</div>`,
    },
    {
        id: "friendly-agent",
        name: "Friendly Agent",
        thumbnail: "FA",
        html: `<div style="font-family: 'Segoe UI', Roboto, sans-serif; color: #444; background: #fdfdfd; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px; max-width: 400px;">
  <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
    <div style="width: 50px; hieght: 50px; background: #6BAE41; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px;">👋</div>
    <div>
      <div style="font-size: 18px; font-weight: bold; color: #2e7d32;">{{Full Name}}</div>
      <div style="font-size: 13px;">{{Job Title}} at {{Company Name}}</div>
    </div>
  </div>
  <div style="font-size: 13px; color: #666; line-height: 1.8;">
    <div>📱 <strong>Call/Text:</strong> {{Phone Number}}</div>
    <div>📧 <strong>Email:</strong> {{Email Address}}</div>
    <div>💻 <strong>Website:</strong> {{Website}}</div>
    <div>📍 <strong>Office:</strong> {{Office Address}}</div>
    <div style="font-size: 11px; margin-top: 5px; opacity: 0.7;">License #: {{License Number}}</div>
  </div>
  <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 14px; color: #333;">
    I’m here to make your buying or selling experience smooth, informed, and stress-free.
  </div>
</div>`,
    },
    {
        id: "brokerage-team",
        name: "Brokerage Team",
        thumbnail: "BT",
        html: `<div style="font-family: Arial, sans-serif; color: #2c3e50;">
  <table border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-right: 20px; vertical-align: middle;">
          <div style="width: 60px; height: 60px; background: #4290E9; color: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px;">{{Team Name}}</div>
      </td>
      <td style="padding-left: 20px; border-left: 2px solid #4290E9;">
        <div style="font-size: 18px; font-weight: bold;">{{Full Name}}</div>
        <div style="font-size: 13px;">{{Job Title}}</div>
        <div style="font-size: 13px; font-weight: bold; color: #4290E9; margin-bottom: 5px;">{{Team Name}} | {{Company Name}}</div>
        <div style="font-size: 12px; color: #7f8c8d;">
          Phone: {{Phone Number}} | Email: {{Email Address}}<br>
          Website: {{Website}} | Office: {{Office Address}}<br>
          License #: {{License Number}}
        </div>
      </td>
    </tr>
  </table>
  <div style="font-size: 12px; margin-top: 10px; color: #95a5a6; border-top: 1px solid #ecf0f1; padding-top: 5px;">
    Supporting your real estate journey with responsive service and expert coordination.
  </div>
</div>`,
    },
    {
        id: "listing-specialist",
        name: "Listing Specialist",
        thumbnail: "LS",
        html: `<div style="font-family: 'Trebuchet MS', sans-serif; color: #333; border-top: 3px solid #e74c3c; padding-top: 10px;">
  <div style="font-size: 19px; font-weight: bold; color: #e74c3c;">{{Full Name}}</div>
  <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Listing Specialist | {{Company Name}}</div>
  <table border="0" cellpadding="0" cellspacing="0" style="font-size: 13px;">
    <tr><td style="padding-bottom: 2px;"><strong>Direct:</strong> {{Phone Number}}</td></tr>
    <tr><td style="padding-bottom: 2px;"><strong>Email:</strong> {{Email Address}}</td></tr>
    <tr><td style="padding-bottom: 2px;"><strong>Website:</strong> {{Website}}</td></tr>
    <tr><td style="padding-bottom: 2px;"><strong>Office:</strong> {{Office Address}}</td></tr>
    <tr><td style="padding-bottom: 2px;"><strong>License #:</strong> {{License Number}}</td></tr>
  </table>
  <div style="background: #e74c3c; color: white; padding: 8px 15px; margin-top: 12px; font-size: 13px; display: inline-block; border-radius: 4px;">
    Strategic pricing • Professional marketing • Stronger exposure
  </div>
</div>`,
    },
    {
        id: "buyers-agent",
        name: "Buyer's Agent",
        thumbnail: "BA",
        html: `<div style="font-family: Arial, sans-serif; color: #2980b9;">
  <div style="font-size: 18px; font-weight: bold;">{{Full Name}}</div>
  <div style="font-size: 14px; color: #34495e; margin-bottom: 10px;">Buyer’s Agent | {{Company Name}}</div>
  <div style="font-size: 13px; color: #34495e; line-height: 1.6;">
    <strong>Phone:</strong> {{Phone Number}} • <strong>Email:</strong> {{Email Address}}<br>
    <strong>Website:</strong> {{Website}} • <strong>Office:</strong> {{Office Address}}<br>
    <strong>License #:</strong> {{License Number}}
  </div>
  <div style="margin-top: 15px; border-top: 2px solid #2980b9; padding-top: 10px; color: #2980b9; font-size: 14px; font-weight: bold;">
    Guiding buyers from search to closing with clarity, speed, and confidence.
  </div>
</div>`,
    },
    {
        id: "transaction-coordinator",
        name: "Transaction Coordinator",
        thumbnail: "TC",
        html: `<div style="font-family: 'Courier New', Courier, monospace; color: #2c3e50; border: 1px solid #ccc; padding: 15px; background: #fff;">
  <div style="font-size: 17px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #2c3e50; display: inline-block; margin-bottom: 5px;">{{Full Name}}</div>
  <div style="font-size: 14px;">Transaction Coordinator</div>
  <div style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">{{Company Name}}</div>
  <div style="font-size: 13px; margin-bottom: 15px;">
    <strong>Phone:</strong> {{Phone Number}}<br>
    <strong>Email:</strong> {{Email Address}}<br>
    <strong>Office:</strong> {{Office Address}}
  </div>
  <div style="font-size: 12px; color: #7f8c8d; font-style: italic;">
    Coordinating timelines, documents, and communication from contract to close.
  </div>
</div>`,
    },
    {
        id: "open-house",
        name: "Open House/Marketing",
        thumbnail: "OH",
        html: `<div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #444; border: 1px solid #000; padding: 20px;">
  <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #000;">{{Full Name}}</div>
  <div style="font-size: 13px; text-transform: uppercase; color: #666; margin-bottom: 15px;">{{Job Title}} | {{Company Name}}</div>
  <table border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; margin-bottom: 15px;">
    <tr><td style="padding-bottom: 2px; border-bottom: 1px solid #eee;">Phone: {{Phone Number}}</td></tr>
    <tr><td style="padding-bottom: 2px; border-bottom: 1px solid #eee;">Email: {{Email Address}}</td></tr>
    <tr><td style="padding-bottom: 2px; border-bottom: 1px solid #eee;">Website: {{Website}}</td></tr>
    <tr><td style="padding-bottom: 2px; border-bottom: 1px solid #eee;">Office: {{Office Address}}</td></tr>
    <tr><td style="padding-bottom: 2px; font-size: 11px; opacity: 0.6;">License #: {{License Number}}</td></tr>
  </table>
  <div style="font-size: 14px; font-weight: bold; color: #4290E9; letter-spacing: 1px;">
    NEW LISTINGS • OPEN HOUSES • MARKET UPDATES
  </div>
</div>`,
    },
    {
        id: "compliance",
        name: "High-Trust Compliance",
        thumbnail: "HC",
        html: `<div style="font-family: Arial, sans-serif; color: #333; max-width: 500px;">
  <div style="font-size: 16px; font-weight: bold;">{{Full Name}}</div>
  <div style="font-size: 13px;">{{Job Title}}</div>
  <div style="font-size: 13px; font-weight: bold; margin-bottom: 10px;">{{Company Name}}</div>
  <div style="font-size: 12px; line-height: 1.4; color: #555;">
    <strong>Direct:</strong> {{Phone Number}}<br>
    <strong>Email:</strong> {{Email Address}}<br>
    <strong>Website:</strong> {{Website}}<br>
    <strong>Office Address:</strong> {{Office Address}}<br>
    <strong>License #:</strong> {{License Number}}
  </div>
  <div style="margin-top: 15px; font-size: 11px; color: #999; padding-top: 10px; border-top: 1px solid #eee; line-height: 1.2;">
    This communication is intended for informational purposes only and does not constitute a binding agreement unless confirmed in writing.
  </div>
</div>`,
    }
];

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSave?: (signature: Signature) => void;
    initialData?: Signature | null;
}

const SignatureCreatorDialog: React.FC<Props> = ({ open, setOpen, onSave, initialData }) => {
    const { userType, organizationId } = useAppContext();
    const [userData, setUserData] = useState<any>(null);
    const [showLogo, setShowLogo] = useState(true);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string>(SIGNATURE_LAYOUTS[0].id);
    const [signatureName, setSignatureName] = useState("");
    const [currentHtml, setCurrentHtml] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load user data directly from localStorage on mount
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const userInfoStr = localStorage.getItem('userInfo');
            if (userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);
                    console.log('Loaded userInfo from localStorage:', userInfo);
                    setUserData(userInfo);
                } catch (e) {
                    console.error('Failed to parse userInfo:', e);
                }
            }
        }
    }, []);

    const interpolateSignature = (html: string, data: any, displayLogo: boolean) => {
        if (!data) return html;

        // Get organization data - prefer organization object
        const org = data?.organization || {};
        const userInfo = data;

        // Prepare interpolation context with fallbacks to placeholders
        // Priority: use organization data first, then user data, then placeholders
        const context = {
            fullName: userInfo?.full_name || userInfo?.name || "{{Full Name}}",
            jobTitle: "{{Job Title}}", // No job title in data, keep placeholder
            companyName: org?.name || userInfo?.company_name || "{{Company Name}}",
            phoneNumber: org?.contact_phone || userInfo?.primary_phone || "{{Phone Number}}",
            emailAddress: org?.contact_email || userInfo?.email || "{{Email Address}}",
            websiteUrl: userInfo?.website || "{{Website}}",
            officeAddress: org?.address_line_1
                ? `${org.address_line_1}${org.address_line_2 ? ', ' + org.address_line_2 : ''} ${org.city || ''} ${org.province || ''}`.trim().replace(/,\s+/g, ', ')
                : userInfo ? `${userInfo.address || ""} ${userInfo.city || ""} ${userInfo.province || ""}`.trim()
                    : "{{Office Address}}",
            licenseNumber: "{{License Number}}",
            teamName: "{{Team Name}}",
        };

        let result = html
            .replace(/\{\{Full Name\}\}/g, context.fullName)
            .replace(/\{\{Job Title\}\}/g, context.jobTitle)
            .replace(/\{\{Company Name\}\}/g, context.companyName)
            .replace(/\{\{Phone Number\}\}/g, context.phoneNumber)
            .replace(/\{\{Email Address\}\}/g, context.emailAddress)
            .replace(/\{\{Website\}\}/g, context.websiteUrl)
            .replace(/\{\{Office Address\}\}/g, context.officeAddress)
            .replace(/\{\{License Number\}\}/g, context.licenseNumber)
            .replace(/\{\{Team Name\}\}/g, context.teamName);

        // Handle logo - get from organization logos (prefer org > user fallback)
        let logoUrl: string | null = null;

        // Try organization.company_logos_urls first
        const orgLogos = org?.company_logos_urls || [];
        if (orgLogos.length > 0) {
            logoUrl = orgLogos[0]?.url || null;
        }
        // Fallback to top-level company_logos_urls on userInfo
        if (!logoUrl) {
            const rootLogos = userInfo?.company_logos_urls || [];
            if (rootLogos.length > 0) {
                logoUrl = rootLogos[0]?.url || null;
            }
        }
        // Final fallback to company_logo_url
        if (!logoUrl) {
            logoUrl = userInfo?.company_logo_url || null;
        }

        // Dynamically prepend logo block when show logo is enabled and a URL exists
        if (displayLogo && logoUrl) {
            const logoBlock = `<div style="margin-bottom:12px;"><img src="${logoUrl}" alt="Organization Logo" style="max-height:60px;max-width:180px;object-fit:contain;display:block;" /></div>`;
            result = logoBlock + result;
        }

        // Clean up any legacy {{logo_url}} or placeholder.com references from old layouts
        result = result.replace(/<img[^>]*src="\{\{logo_url\}\}"[^>]*>/g, "");
        result = result.replace(/<img[^>]*src="https:\/\/via\.placeholder\.com\/80"[^>]*>/g, "");

        return result;
    };

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                // When editing an existing signature, show the saved HTML with name
                setSignatureName(initialData.name);
                setCurrentHtml(initialData.html_content);
                setIsEditing(false); // Show preview by default when editing
            } else if (!isEditing && userData) {
                // When creating new signature, show the selected layout interpolated with user data
                const layout = SIGNATURE_LAYOUTS.find(l => l.id === selectedLayoutId) || SIGNATURE_LAYOUTS[0];
                setCurrentHtml(interpolateSignature(layout.html, userData, showLogo));
            }
        } else if (!open) {
            // Reset on close
            setSignatureName("");
            setCurrentHtml("");
            setIsEditing(false);
            setSelectedLayoutId(SIGNATURE_LAYOUTS[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialData, userData]);

    // Update preview when layout selection changes (for new signatures)
    React.useEffect(() => {
        if (open && !initialData && userData && !isEditing) {
            const layout = SIGNATURE_LAYOUTS.find(l => l.id === selectedLayoutId) || SIGNATURE_LAYOUTS[0];
            setCurrentHtml(interpolateSignature(layout.html, userData, showLogo));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLayoutId, showLogo, userData]);

    const handleSelectLayout = (layout: SignatureLayout) => {
        setSelectedLayoutId(layout.id);
        setIsEditing(false);
        // Immediately update preview with interpolated layout
        if (userData) {
            setCurrentHtml(interpolateSignature(layout.html, userData, showLogo));
        } else {
            setCurrentHtml(layout.html);
        }
    };

    const handleSave = async () => {
        if (!signatureName.trim()) {
            toast.error("Please enter a signature name");
            return;
        }

        // Resolve org UUID: context > userData.organization.uuid
        const targetOrgId = organizationId ||
            userData?.organization?.uuid ||
            null;
        if (!targetOrgId) {
            toast.error("Organization information missing. Unable to save.");
            return;
        }

        // Resolve logo URL for media_url field
        const orgLogoUrl =
            userData?.organization?.company_logos_urls?.[0]?.url ||
            userData?.company_logos_urls?.[0]?.url ||
            userData?.company_logo_url ||
            null;

        setLoading(true);
        try {
            const payload = {
                name: signatureName,
                html_content: currentHtml,
                media_url: orgLogoUrl
            };

            let res;
            if (initialData?.uuid) {
                res = await UpdateSignature(initialData.uuid, payload);
            } else {
                res = await CreateSignature(targetOrgId, payload);
            }

            if (res.status !== false) {
                toast.success(initialData ? "Signature updated successfully" : "Signature created successfully");
                if (onSave) {
                    onSave(res.data);
                }
                setOpen(false);
            } else {
                toast.error(res.message || "Failed to save signature");
            }
        } catch (error) {
            console.error("Error saving signature:", error);
            toast.error("An error occurred while saving the signature");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="w-[1000px] max-w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[8px] font-alexandria shadow-lg"
            >
                <DialogHeader className="px-6 py-4 flex-shrink-0 bg-[#FAFAFA] border-b border-[#BBBBBB]">
                    <DialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[18px] font-[600]">
                        Professional Signature Creator
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar: Layout Gallery */}
                    <div className="w-[280px] border-right border-[#BBBBBB] bg-white overflow-y-auto p-4 flex flex-col gap-4">
                        <h4 className="text-sm font-semibold text-[#666666] uppercase mb-2">Choose Layout</h4>
                        {SIGNATURE_LAYOUTS.map((layout) => (
                            <div
                                key={layout.id}
                                onClick={() => handleSelectLayout(layout)}
                                className={`group relative cursor-pointer border-2 rounded-lg p-3 transition-all ${selectedLayoutId === layout.id
                                    ? "border-[#4290E9] bg-[#f0f7ff]"
                                    : "border-[#EEEEEE] hover:border-[#BBBBBB]"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-bold ${selectedLayoutId === layout.id ? "text-[#4290E9]" : "text-[#7D7D7D]"}`}>
                                        {layout.name}
                                    </span>
                                    {selectedLayoutId === layout.id && <Check className="w-4 h-4 text-[#4290E9]" />}
                                </div>
                                <div className="h-[100px] bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center text-[24px] font-bold text-gray-300">
                                    {layout.thumbnail}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content: Preview and Editor */}
                    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
                        {/* Signature Name Area */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="signature-name" className="text-sm font-semibold text-[#666666] uppercase">Signature Name</Label>
                            <Input
                                id="signature-name"
                                placeholder="e.g. Primary Marketing Signature"
                                value={signatureName}
                                onChange={(e) => setSignatureName(e.target.value)}
                                disabled={initialData ? true : false}
                                className="h-10 border-[#BBBBBB] disabled:bg-gray-100 disabled:text-gray-600"
                            />
                            {initialData && (
                                <p className="text-[11px] text-gray-500">Name cannot be changed. Delete and recreate to change name.</p>
                            )}
                        </div>

                        {/* Organization Details - Show when editing */}
                        {initialData && userData && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h4 className="text-xs font-semibold text-[#666666] uppercase mb-3">Organization & Contact Details</h4>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-gray-500 text-[10px]">Organization:</span>
                                        <p className="text-gray-800 font-medium">{userData?.organization?.name || userData?.company_name || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-[10px]">Contact Email:</span>
                                        <p className="text-gray-800 font-medium">{userData?.organization?.contact_email || userData?.email || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-[10px]">Contact Phone:</span>
                                        <p className="text-gray-800 font-medium">{userData?.organization?.contact_phone || userData?.primary_phone || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-[10px]">Address:</span>
                                        <p className="text-gray-800 font-medium text-[11px]">
                                            {userData?.organization?.address_line_1
                                                ? `${userData.organization.address_line_1}${userData.organization.address_line_2 ? ', ' + userData.organization.address_line_2 : ''}`
                                                : userData?.address || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Editor Area - Shows when isEditing = true */}
                        {isEditing && (
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-semibold text-[#666666] uppercase">Edit Signature</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                        className="h-8 text-xs font-semibold"
                                    >
                                        Done Editing
                                    </Button>
                                </div>
                                <div className="flex-1 border border-[#BBBBBB] bg-white rounded-md overflow-hidden">
                                    <RichTextEditor
                                        value={currentHtml}
                                        onChange={setCurrentHtml}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Preview Area - Shows when not editing */}
                        {!isEditing && (
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-semibold text-[#666666] uppercase">Preview</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor="show-logo" className="text-xs text-[#7D7D7D] cursor-pointer">
                                                {showLogo ? "Logo: ON" : "Logo: OFF"}
                                            </Label>
                                            <Switch
                                                id="show-logo"
                                                checked={showLogo}
                                                onCheckedChange={setShowLogo}
                                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="h-8 text-xs font-semibold"
                                        >
                                            Edit Signature
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white border border-[#BBBBBB] rounded-lg p-8 shadow-sm flex items-center justify-center overflow-auto">
                                    <div
                                        className="w-full max-w-[500px]"
                                        dangerouslySetInnerHTML={{ __html: currentHtml }}
                                    />
                                </div>
                                {/* <p className="text-[10px] text-gray-400 italic">
                                    Note: Placeholders like {"{{Full Name}}"} will be automatically filled when sending emails.
                                </p> */}
                            </div>
                        )}

                        {!isEditing && !initialData && (
                            <div className="flex-1 flex flex-col gap-4">
                                <h4 className="text-sm font-semibold text-[#666666] uppercase">Instructions</h4>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 leading-relaxed">
                                    <p className="mb-2"><strong>How to use:</strong></p>
                                    <ul className="list-disc ml-5 space-y-1">
                                        <li>Select a professional layout from the left sidebar.</li>
                                        <li>The preview shows how it will appear to your clients.</li>
                                        <li>Organization details are automatically populated from your account.</li>
                                        <li>You can click &quot;Edit HTML&quot; to customize colors, fonts, or move elements.</li>
                                        <li>Use curly braces like <code>{`{{Phone Number}}`}</code> to insert dynamic data.</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#BBBBBB] flex justify-end gap-3 flex-shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="w-[120px] h-[44px] text-[#7D7D7D] font-semibold"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className={`w-[160px] h-[44px] text-white ${userType}-bg hover:${userType}-bg transition-all uppercase font-semibold`}
                    >
                        {loading ? "Saving..." : (initialData ? "Update Signature" : "Save Signature")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SignatureCreatorDialog;
