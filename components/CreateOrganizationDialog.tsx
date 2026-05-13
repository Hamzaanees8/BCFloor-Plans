"use client";
import React, { useEffect, useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Edit2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import {
    Organization,
    OrganizationPayload,
    CreateOrganization,
    UpdateOrganization,
} from "@/app/dashboard/global-settings/global-settings";
import {
    AgentAudio,
    GetOrganizationAudios,
    DeleteOrganizationAudio,
} from "@/app/dashboard/agents/agent-audio";
import { uploadAudioFile } from "@/lib/upload/audio-upload";
import { GetOrganizationBranding, UpdateOrganizationBranding } from '@/app/dashboard/global-settings/global-settings';
import {
    isDefaultDomain,
    isDomainMatchingSubdomain,
    extractBaseDomain,
    getDefaultDomainErrorMessage,
    getSubdomainMismatchWarning,
    getDefaultDomains,
} from "@/lib/config/domains";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: Organization | null;
}

interface FormErrors {
    name?: string;
    contact_email?: string;
    contact_phone?: string;
    slug?: string;
    trial_ends_at?: string;
    domain?: string;
    customDomain?: string;
}

// Accepts hostnames like: example.com, sub.example.com, my-brand.agent.bcfloorplans.com
// Rejects: spaces, http://, paths, ports
function isValidDomain(value: string): boolean {
    const val = value.trim().toLowerCase();
    // Allow localhost with optional protocol and port for testing
    if (val.includes("localhost")) return true;

    // Standard domain regex
    return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/.test(val);
}

const emptyForm = (): OrganizationPayload => ({
    name: "",
    slug: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    province: "",
    country: "",
    postal_code: "",
    is_active: true,
    trial_ends_at: null,
    primary_color: "#6BAE41",
    secondary_color: "#DC9600",
    logo: "",
    portal_type: "agent",
    is_whitelabel: false,
    domain: "",
    from_name: "",
    from_email: "",
    domains: [],
});

const CreateOrganizationDialog: React.FC<Props> = ({ open, setOpen, onSuccess, initialData }) => {
    const { userType } = useAppContext();
    const isEdit = !!initialData;

    const [form, setForm] = useState<OrganizationPayload>(emptyForm());
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [domainValidationError, setDomainValidationError] = useState<string | null>(null);
    const [subdomainWarnings, setSubdomainWarnings] = useState<Map<number, string>>(new Map());

    const [orgAudios, setOrgAudios] = useState<AgentAudio[]>([]);
    const [audioUploading, setAudioUploading] = useState(false);
    const orgAudioRef = useRef<HTMLInputElement>(null);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const orgLogoRef = useRef<HTMLInputElement>(null);

    // Populate form on open/edit
    useEffect(() => {
        if (open) {
            if (initialData) {
                setForm({
                    name: initialData.name || "",
                    slug: initialData.slug || "",
                    contact_name: initialData.contact_name || "",
                    contact_email: initialData.contact_email || "",
                    contact_phone: initialData.contact_phone || "",
                    address_line_1: initialData.address_line_1 || "",
                    address_line_2: initialData.address_line_2 || "",
                    city: initialData.city || "",
                    province: initialData.province || "",
                    country: initialData.country || "",
                    postal_code: initialData.postal_code || "",
                    is_active: initialData.is_active ?? true,
                    trial_ends_at: initialData.trial_ends_at || null,
                    primary_color: initialData.primary_color || "#6BAE41",
                    secondary_color: initialData.secondary_color || "#DC9600",
                    logo: initialData.logo || "",
                    portal_type: initialData.portal_type || "agent",
                    is_whitelabel: initialData.is_whitelabel ?? false,
                    domain: initialData.domain || "",
                    from_name: initialData.from_name || "",
                    from_email: initialData.from_email || "",
                    domains: initialData.domains || [],
                });
            } else {
                setForm(emptyForm());
            }
            setErrors({});
            setLogoFile(null); // Reset file selection
            setIsDomainsManuallyEdited(false);
            setEditIndex(null);
            setNewDomain("");

            if (initialData?.uuid) {
                // Fetch current branding to pre-fill colors and logo
                GetOrganizationBranding(initialData.uuid)
                    .then(res => {
                        if (res?.data) {
                            setForm(prev => ({
                                ...prev,
                                primary_color: res.data.primary_color || prev.primary_color,
                                secondary_color: res.data.secondary_color || prev.secondary_color,
                                logo: res.data.logo_url || res.data.logo || prev.logo
                            }));
                        }
                    })
                    .catch(err => console.error("Failed to load branding", err));
            }
        }
    }, [open, initialData]);

    // Fetch audio files on open (edit mode only)
    useEffect(() => {
        if (open && isEdit && initialData?.uuid) {
            GetOrganizationAudios(initialData.uuid)
                .then(res => setOrgAudios(Array.isArray(res.data) ? res.data : []))
                .catch(() => setOrgAudios([]));
        }
        if (!open) setOrgAudios([]);
    }, [open, isEdit, initialData?.uuid]);

    const [newDomain, setNewDomain] = useState("");
    const [newPortalType, setNewPortalType] = useState<'admin' | 'agent' | 'vendor'>('agent');
    const [isDomainsManuallyEdited, setIsDomainsManuallyEdited] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);

    // Auto-populate default domains based on slug and custom domain
    useEffect(() => {
        // We need EITHER a slug or a custom domain to generate anything
        if (!open || !form.is_whitelabel || (!form.slug && !form.domain) || isEdit || isDomainsManuallyEdited) return;

        const slug = form.slug?.trim() || "";
        const customDomain = form.domain?.trim();
        const envDefaultDomains = getDefaultDomains();

        const defaultMappings = customDomain
            ? [
                { domain: `booking-new.${customDomain}`, portal_type: 'agent' },
                { domain: `vendor-new.${customDomain}`, portal_type: 'vendor' },
                { domain: `teams-new.${customDomain}`, portal_type: 'admin' },
            ]
            : slug ? [
                { domain: `${slug}.${envDefaultDomains[0] || 'teams-new.bcfloorplans.com'}`, portal_type: 'admin' },
                { domain: `${slug}.${envDefaultDomains[1] || 'bookings-new.bcfloorplans.com'}`, portal_type: 'agent' },
                { domain: `${slug}.${envDefaultDomains[2] || 'vendor-new.bcfloorplans.com'}`, portal_type: 'vendor' },
            ] : [];

        if (defaultMappings.length > 0) {
            setField("domains", defaultMappings);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.slug, form.domain, form.is_whitelabel, open, isEdit, isDomainsManuallyEdited]);

    // Validate custom domain for whitelabel orgs (check if it's a default domain)
    useEffect(() => {
        if (!form.is_whitelabel || !form.domain) {
            setDomainValidationError(null);
            return;
        }

        const customDomain = form.domain.trim();
        if (isDefaultDomain(customDomain)) {
            setDomainValidationError(getDefaultDomainErrorMessage(customDomain));
        } else {
            setDomainValidationError(null);
        }
    }, [form.domain, form.is_whitelabel]);

    // Validate subdomains for whitelabel orgs (check if they match custom domain)
    useEffect(() => {
        if (!form.is_whitelabel || !form.domain || !form.domains || form.domains.length === 0) {
            setSubdomainWarnings(new Map());
            return;
        }

        const customDomain = form.domain.trim().toLowerCase();
        const newWarnings = new Map<number, string>();

        form.domains.forEach((domainObj, index) => {
            if (domainObj.domain && !isDomainMatchingSubdomain(customDomain, domainObj.domain)) {
                const subdomainBase = extractBaseDomain(domainObj.domain);
                newWarnings.set(index, getSubdomainMismatchWarning(customDomain, subdomainBase));
            }
        });

        setSubdomainWarnings(newWarnings);
    }, [form.domains, form.domain, form.is_whitelabel]);

    const setField = (key: keyof OrganizationPayload, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (key in errors) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Organization name is required.";
        } else if (form.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters.";
        }

        if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
            newErrors.contact_email = "Please enter a valid email address.";
        }

        if (form.contact_phone && !/^[\d\s\+\-\(\)]{7,20}$/.test(form.contact_phone)) {
            newErrors.contact_phone = "Please enter a valid phone number.";
        }

        if (form.slug && !/^[a-z0-9\-]+$/.test(form.slug)) {
            newErrors.slug = "Slug may only contain lowercase letters, numbers, and hyphens.";
        }

        if (form.trial_ends_at && isNaN(Date.parse(form.trial_ends_at))) {
            newErrors.trial_ends_at = "Please enter a valid date.";
        }

        if (form.domain && !isValidDomain(form.domain)) {
            newErrors.domain = "Enter a valid domain (e.g. myportalmedia.com)";
        }

        // Check for domain validation errors (default domain attempts) for whitelabel orgs
        if (form.is_whitelabel && domainValidationError) {
            newErrors.customDomain = domainValidationError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            const payload: OrganizationPayload = {
                ...form,
                slug: form.slug?.trim() || undefined,
                contact_name: form.contact_name?.trim() || undefined,
                contact_email: form.contact_email?.trim() || undefined,
                contact_phone: form.contact_phone?.trim() || undefined,
                address_line_1: form.address_line_1?.trim() || undefined,
                address_line_2: form.address_line_2?.trim() || undefined,
                city: form.city?.trim() || undefined,
                province: form.province?.trim() || undefined,
                country: form.country?.trim() || undefined,
                postal_code: form.postal_code?.trim() || undefined,
                trial_ends_at: form.trial_ends_at || null,
                primary_color: form.primary_color,
                secondary_color: form.secondary_color,
                logo: form.logo,
                portal_type: form.portal_type,
                is_whitelabel: form.is_whitelabel,
                domain: form.domain?.trim() || undefined,
                from_name: form.from_name?.trim() || undefined,
                from_email: form.from_email?.trim() || undefined,
                domains: form.domains,
            };

            if (isEdit && initialData) {
                await UpdateOrganization(initialData.uuid, payload);

                // Update branding
                if (logoFile || form.primary_color || form.secondary_color) {
                    const formData = new FormData();
                    if (form.primary_color) formData.append('primary_color', form.primary_color);
                    if (form.secondary_color) formData.append('secondary_color', form.secondary_color);
                    if (logoFile) formData.append('logo', logoFile);
                    await UpdateOrganizationBranding(initialData.uuid, formData);
                }

                toast.success("Organization updated successfully.");
            } else {
                const createdOrg = await CreateOrganization(payload);

                // Update branding for new org
                if (createdOrg?.data?.uuid && (logoFile || form.primary_color || form.secondary_color)) {
                    const formData = new FormData();
                    if (form.primary_color) formData.append('primary_color', form.primary_color);
                    if (form.secondary_color) formData.append('secondary_color', form.secondary_color);
                    if (logoFile) formData.append('logo', logoFile);
                    await UpdateOrganizationBranding(createdOrg.data.uuid, formData);
                }

                toast.success("Organization created successfully.");
            }

            onSuccess();
            setOpen(false);
        } catch (err) {
            const apiError = err as { message?: string; errors?: Record<string, string[]> };
            if (apiError.errors) {
                const mapped: FormErrors = {};
                if (apiError.errors.name) mapped.name = apiError.errors.name[0];
                if (apiError.errors.contact_email) mapped.contact_email = apiError.errors.contact_email[0];
                if (apiError.errors.contact_phone) mapped.contact_phone = apiError.errors.contact_phone[0];
                if (apiError.errors.slug) mapped.slug = apiError.errors.slug[0];
                setErrors(mapped);
                const first = Object.values(apiError.errors).flat()[0];
                toast.error(first || "Validation error, please check the form.");
            } else {
                toast.error(apiError.message || "Something went wrong.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrgAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !initialData?.uuid) return;

        if (file.size > 20 * 1024 * 1024) {
            toast.error("File exceeds the 20 MB size limit");
            return;
        }

        setAudioUploading(true);
        try {
            const result = await uploadAudioFile({
                entityType: 'organization-audio',
                entityId: initialData.uuid,
                file: file
            });

            if (result.success) {
                toast.success("Audio uploaded successfully.");
                const fresh = await GetOrganizationAudios(initialData.uuid);
                setOrgAudios(Array.isArray(fresh.data) ? fresh.data : []);
            } else {
                toast.error(result.error || "Failed to upload audio.");
            }
        } catch {
            toast.error("Failed to upload audio.");
        } finally {
            setAudioUploading(false);
            if (orgAudioRef.current) orgAudioRef.current.value = "";
        }
    };

    const handleOrgAudioDelete = async (uuid: string) => {
        try {
            await DeleteOrganizationAudio(uuid);
            setOrgAudios(prev => prev.filter(a => a.uuid !== uuid));
            toast.success("Audio removed successfully.");
        } catch {
            toast.error("Failed to remove audio.");
        }
    };

    const handleAddDomain = () => {
        if (!newDomain.trim()) {
            toast.error("Please enter a domain.");
            return;
        }
        if (!isValidDomain(newDomain)) {
            toast.error("Enter a valid domain (e.g. media.commerx.com)");
            return;
        }

        const trimmedDomain = newDomain.trim().toLowerCase();
        const domains = [...(form.domains || [])];

        // Check for duplicate domain (excluding current item if editing)
        const domainExists = domains.some((d, idx) => d.domain.toLowerCase() === trimmedDomain && idx !== editIndex);
        if (domainExists) {
            toast.error("This domain is already added.");
            return;
        }

        // Check for duplicate portal type (excluding current item if editing)
        const typeExists = domains.some((d, idx) => d.portal_type === newPortalType && idx !== editIndex);
        if (typeExists) {
            toast.error(`A domain is already mapped to the ${newPortalType} portal. Only one domain per portal is allowed.`);
            return;
        }

        if (editIndex !== null) {
            domains[editIndex] = { domain: trimmedDomain, portal_type: newPortalType };
            toast.success("Domain mapping updated.");
        } else {
            domains.push({ domain: trimmedDomain, portal_type: newPortalType });
            toast.success("Domain mapping added.");
        }

        setField("domains", domains);
        setNewDomain("");
        setEditIndex(null);
        setIsDomainsManuallyEdited(true);
    };

    const handleEditDomain = (index: number) => {
        const item = (form.domains || [])[index];
        if (!item) return;
        setNewDomain(item.domain);
        setNewPortalType(item.portal_type);
        setEditIndex(index);
    };

    const handleRemoveDomain = (index: number) => {
        const domains = [...(form.domains || [])];
        domains.splice(index, 1);
        setField("domains", domains);
        setIsDomainsManuallyEdited(true);
        if (editIndex === index) {
            setEditIndex(null);
            setNewDomain("");
        } else if (editIndex !== null && index < editIndex) {
            setEditIndex(editIndex - 1);
        }
    };

    const inputCls = (err?: string) =>
        `h-[42px] border-[1px] mt-[6px] ${err ? "border-red-400 bg-red-50" : "border-[#BBBBBB]"}`;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="w-[700px] max-w-[95vw] max-h-[90vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[8px] font-alexandria shadow-lg [&>button]:hidden"
                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 flex-shrink-0 border-b border-[#BBBBBB]"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                >
                    <DialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[18px] font-[600]">
                        {isEdit ? "Edit Organization" : "Create Organization"}
                        <DialogClose className="border-none shadow-none hover:bg-transparent !p-0">
                            <X className="w-5 h-5 text-[#7D7D7D] cursor-pointer" />
                        </DialogClose>
                    </DialogTitle>
                </DialogHeader>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 text-sm font-normal text-[#424242]">

                    {/* ── Basic Info ── */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Basic Information</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <Label>
                                    Organization Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="org-name"
                                    type="text"
                                    placeholder="e.g. Acme Realty Corp"
                                    value={form.name}
                                    onChange={(e) => setField("name", e.target.value)}
                                    className={inputCls(errors.name)}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                                {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
                            </div>

                        </div>
                    </div>

                    <hr className="border-[#BBBBBB]" />

                    {/* ── Contact Info ── */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Contact Information</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label>Contact Name</Label>
                                <Input
                                    id="org-contact-name"
                                    type="text"
                                    placeholder="e.g. John Smith"
                                    value={form.contact_name ?? ""}
                                    onChange={(e) => setField("contact_name", e.target.value)}
                                    className={inputCls()}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                            </div>
                            <div>
                                <Label>Contact Email</Label>
                                <Input
                                    id="org-contact-email"
                                    type="email"
                                    placeholder="e.g. contact@acme.com"
                                    value={form.contact_email ?? ""}
                                    onChange={(e) => setField("contact_email", e.target.value)}
                                    className={inputCls(errors.contact_email)}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                                {errors.contact_email && (
                                    <p className="text-red-500 text-[10px] mt-1">{errors.contact_email}</p>
                                )}
                            </div>
                            <div>
                                <Label>Contact Phone</Label>
                                <Input
                                    id="org-contact-phone"
                                    type="tel"
                                    placeholder="e.g. +1-800-000-0000"
                                    value={form.contact_phone ?? ""}
                                    onChange={(e) => setField("contact_phone", e.target.value)}
                                    className={inputCls(errors.contact_phone)}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                                {errors.contact_phone && (
                                    <p className="text-red-500 text-[10px] mt-1">{errors.contact_phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <hr className="border-[#BBBBBB]" />

                    {/* ── Address ── */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Address</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Address Line 1</Label>
                                <Input
                                    id="org-address-1"
                                    type="text"
                                    placeholder="e.g. 123 Main Street"
                                    value={form.address_line_1 ?? ""}
                                    onChange={(e) => setField("address_line_1", e.target.value)}
                                    className={inputCls()}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                            </div>
                            <div>
                                <Label>Address Line 2</Label>
                                <Input
                                    id="org-address-2"
                                    type="text"
                                    placeholder="e.g. Suite 200"
                                    value={form.address_line_2 ?? ""}
                                    onChange={(e) => setField("address_line_2", e.target.value)}
                                    className={inputCls()}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            <div>
                                <Label>City</Label>
                                <Input
                                    id="org-city"
                                    type="text"
                                    placeholder="City"
                                    value={form.city ?? ""}
                                    onChange={(e) => setField("city", e.target.value)}
                                    className={inputCls()}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                            </div>
                            <div>
                                <Label>Province / State</Label>
                                <Input
                                    id="org-province"
                                    type="text"
                                    placeholder="Province"
                                    value={form.province ?? ""}
                                    onChange={(e) => setField("province", e.target.value)}
                                    className={inputCls()}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                            </div>
                            <div>
                                <Label>Country</Label>
                                <Input
                                    id="org-country"
                                    type="text"
                                    placeholder="Country"
                                    value={form.country ?? ""}
                                    onChange={(e) => setField("country", e.target.value)}
                                    className={inputCls()}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                            </div>
                            <div>
                                <Label>Postal Code</Label>
                                <Input
                                    id="org-postal"
                                    type="text"
                                    placeholder="Postal Code"
                                    value={form.postal_code ?? ""}
                                    onChange={(e) => setField("postal_code", e.target.value)}
                                    className={inputCls()}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-[#BBBBBB]" />

                    {/* ── Settings ── */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Settings</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                            <div>
                                <Label>Trial Ends At</Label>
                                <Input
                                    id="org-trial"
                                    type="date"
                                    value={form.trial_ends_at ?? ""}
                                    onChange={(e) => setField("trial_ends_at", e.target.value || null)}
                                    className={inputCls(errors.trial_ends_at)}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                />
                                {errors.trial_ends_at && (
                                    <p className="text-red-500 text-[10px] mt-1">{errors.trial_ends_at}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 pt-5">
                                <Switch
                                    id="org-active"
                                    checked={form.is_active ?? true}
                                    onCheckedChange={(val) => setField("is_active", val)}
                                    className={
                                        form.is_active
                                            ? "data-[state=checked]:bg-[#6BAE41]"
                                            : "data-[state=unchecked]:bg-red-500"
                                    }
                                />
                                <Label htmlFor="org-active" className="cursor-pointer">
                                    {form.is_active ? "Active" : "Inactive"}
                                </Label>
                            </div>
                        </div>
                    </div>

                    <hr className="border-[#BBBBBB]" />

                    {/* ── Whitelabel Branding ── */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Whitelabel Branding</p>

                        {/* Portal Type + Whitelabel Toggle — always visible */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Default Portal Type</Label>
                                <Select
                                    value={form.portal_type || "agent"}
                                    onValueChange={(val: 'agent' | 'vendor') => setField("portal_type", val)}
                                >
                                    <SelectTrigger className={inputCls()} style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                                        <SelectValue placeholder="Select Portal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="agent">Agent Portal</SelectItem>
                                        <SelectItem value="vendor">Vendor Portal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Whitelabel Toggle */}
                            <div className="flex items-center gap-3 pt-5">
                                <Switch
                                    id="org-whitelabel"
                                    checked={form.is_whitelabel ?? false}
                                    onCheckedChange={(val) => setField("is_whitelabel", val)}
                                    className={
                                        form.is_whitelabel
                                            ? "data-[state=checked]:bg-[#6BAE41]"
                                            : "data-[state=unchecked]:bg-slate-200"
                                    }
                                />
                                <Label htmlFor="org-whitelabel" className="cursor-pointer">
                                    Enable Whitelabeling
                                </Label>
                            </div>
                        </div>

                        {/* Whitelabel-only fields */}
                        {form.is_whitelabel ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    {/* Slug */}
                                    <div>
                                        <Label>
                                            Slug{" "}
                                            <span className="text-[#999] text-xs font-normal">(auto-generated if blank)</span>
                                        </Label>
                                        <Input
                                            id="org-slug"
                                            type="text"
                                            placeholder="e.g. acme-realty"
                                            value={form.slug ?? ""}
                                            onChange={(e) =>
                                                setField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
                                            }
                                            className={inputCls(errors.slug)}
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                        {errors.slug && <p className="text-red-500 text-[10px] mt-1">{errors.slug}</p>}
                                        {form.slug && (
                                            <p className="text-[10px] text-[#999] mt-1">
                                                Portal URL preview:{' '}
                                                <span className="font-mono text-[#4290E9]">
                                                    {`${form.slug}.${getDefaultDomains()[1] || 'bookings-new.bcfloorplans.com'}`}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Custom Domain */}
                                    <div>
                                        <Label>Custom Domain</Label>
                                        <Input
                                            id="org-domain"
                                            type="text"
                                            placeholder="e.g. mypropertymedia.com"
                                            value={form.domain ?? ""}
                                            onChange={(e) => setField("domain", e.target.value)}
                                            className={inputCls(errors.domain || domainValidationError ? "error" : "")}
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                        {errors.domain && <p className="text-red-500 text-[10px] mt-1">{errors.domain}</p>}
                                        {domainValidationError && (
                                            <div className="flex gap-2 items-start mt-2 p-2 bg-red-50 rounded border border-red-200">
                                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-red-600 text-[10px]">{domainValidationError}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Logo */}
                                <div className="mt-4">
                                    <Label>Organization Logo</Label>
                                    {(logoFile || form.logo) && (
                                        <div className="mt-2 mb-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={logoFile ? URL.createObjectURL(logoFile) : form.logo}
                                                alt="Organization Logo"
                                                className="max-h-[60px] object-contain rounded border border-gray-200"
                                            />
                                        </div>
                                    )}
                                    <div className="flex gap-2 items-center mt-[6px]">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => orgLogoRef.current?.click()}
                                            className="h-[42px] border-[#BBBBBB] flex-1 bg-white truncate px-3"
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        >
                                            {logoFile ? logoFile.name : (form.logo ? 'Change Logo' : 'Upload Logo')}
                                        </Button>
                                        <input
                                            ref={orgLogoRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setLogoFile(file);
                                            }}
                                            className="hidden"
                                        />
                                        {(logoFile || form.logo) && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setLogoFile(null);
                                                    setField('logo', '');
                                                    if (orgLogoRef.current) orgLogoRef.current.value = '';
                                                }}
                                                className="h-[42px] border-red-200 text-red-600 hover:bg-red-50 px-3 bg-white"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

                                    {/* From Name */}
                                    <div>
                                        <Label>Email {"From"} Name</Label>
                                        <Input
                                            id="org-from-name"
                                            type="text"
                                            placeholder="e.g. BC Floorplans Support"
                                            value={form.from_name ?? ""}
                                            onChange={(e) => setField("from_name", e.target.value)}
                                            className={inputCls()}
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                    </div>
                                    {/* From Email */}
                                    <div>
                                        <Label>Email {"From"} Address</Label>
                                        <Input
                                            id="org-from-email"
                                            type="email"
                                            placeholder="e.g. support@bcfloorplans.com"
                                            value={form.from_email ?? ""}
                                            onChange={(e) => setField("from_email", e.target.value)}
                                            className={inputCls()}
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                    </div>
                                </div>

                                {/* Custom Domain Mappings */}
                                <div className="mt-6 border-t border-[#BBBBBB] pt-5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Custom Domain Mappings</p>
                                    <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex-1 min-w-[200px]">
                                            <Label className="text-[11px] text-slate-500">Domain Name</Label>
                                            <Input
                                                placeholder="e.g. media.myproperty.com"
                                                value={newDomain}
                                                onChange={(e) => setNewDomain(e.target.value)}
                                                className="h-[36px] mt-1 bg-white"
                                            />
                                        </div>
                                        <div className="w-[150px]">
                                            <Label className="text-[11px] text-slate-500">Portal Type</Label>
                                            <Select
                                                value={newPortalType}
                                                onValueChange={(val: any) => setNewPortalType(val)}
                                            >
                                                <SelectTrigger className="h-[36px] mt-1 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin Portal</SelectItem>
                                                    <SelectItem value="agent">Agent Portal</SelectItem>
                                                    <SelectItem value="vendor">Vendor Portal</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={handleAddDomain}
                                                disabled={domainValidationError !== null}
                                                title={domainValidationError || undefined}
                                                className={`h-[36px] px-4 text-xs text-white ${editIndex !== null ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-600 hover:bg-slate-700'} ${domainValidationError ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {editIndex !== null ? 'Update' : 'Add Mapping'}
                                            </Button>
                                            {editIndex !== null && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditIndex(null);
                                                        setNewDomain("");
                                                    }}
                                                    className="h-[36px] px-3 text-xs text-slate-500"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {form.domains && form.domains.length > 0 ? (
                                            <div className="border border-slate-200 rounded-md overflow-hidden">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
                                                        <tr>
                                                            <th className="px-3 py-2 border-b">Domain</th>
                                                            <th className="px-3 py-2 border-b">Target Portal</th>
                                                            <th className="px-3 py-2 border-b w-[50px]"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {form.domains.map((d, i) => (
                                                            <React.Fragment key={i}>
                                                                <tr className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-3 py-2 font-mono text-[#4290E9]">{d.domain}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${d.portal_type === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                                                d.portal_type === 'vendor' ? 'bg-orange-100 text-orange-700' :
                                                                                    'bg-blue-100 text-blue-700'
                                                                            }`}>
                                                                            {d.portal_type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleEditDomain(i)}
                                                                                className={`${editIndex === i ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'} transition-colors`}
                                                                                title="Edit"
                                                                            >
                                                                                <Edit2 className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveDomain(i)}
                                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                                                title="Remove"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                {subdomainWarnings.has(i) && (
                                                                    <tr className="bg-amber-50">
                                                                        <td colSpan={3} className="px-3 py-2">
                                                                            <div className="flex gap-2 items-start text-amber-700 text-[10px]">
                                                                                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                                                <span>{subdomainWarnings.get(i)}</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 italic text-xs">
                                                No custom domains mapped yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* No whitelabel permission banner */
                            <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                <div>
                                    <p className="text-sm font-semibold text-amber-700">Whitelabeling not enabled</p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        This organization does not have whitelabel permission. Enable the toggle above to unlock slug, domain, logo, and custom domain mapping settings.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                        {isEdit && (
                            <>
                                <hr className="border-[#BBBBBB]" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Audio Files</p>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Button
                                            type="button"
                                            onClick={() => orgAudioRef.current?.click()}
                                            disabled={audioUploading}
                                            className="h-[36px] px-4 text-sm font-medium text-white admin-bg hover:opacity-90"
                                        >
                                            {audioUploading ? "Uploading..." : "+ Upload Audio"}
                                        </Button>
                                        <span className="text-xs text-[#999]">MP3 / WAV · max 20 MB</span>
                                        <input
                                            ref={orgAudioRef}
                                            type="file"
                                            accept="audio/*"
                                            className="hidden"
                                            onChange={handleOrgAudioUpload}
                                        />
                                    </div>
                                    {orgAudios.length > 0 ? (
                                        <div className="border border-[#BBBBBB] rounded-[6px] overflow-hidden divide-y divide-[#BBBBBB]">
                                            {orgAudios.map(audio => (
                                                <div key={audio.uuid} className="flex items-center justify-between px-3 py-2 hover:bg-[#F9F9F9]">
                                                    <span className="text-xs text-[#666] truncate flex-1">{audio.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOrgAudioDelete(audio.uuid)}
                                                        className="ml-2 text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[#999] italic">No audio files uploaded yet.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className="px-6 py-4 border-t border-[#BBBBBB] flex justify-end gap-3 flex-shrink-0"
                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        <Button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="bg-white w-[140px] h-[44px] text-[16px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className={`w-[180px] h-[44px] text-[16px] font-[400] text-white ${userType}-bg hover:opacity-90 transition-opacity`}
                        >
                            {isLoading
                                ? isEdit ? "Saving..." : "Creating..."
                                : isEdit ? "Save Changes" : "Create Organization"
                            }
                        </Button>
                    </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOrganizationDialog;
