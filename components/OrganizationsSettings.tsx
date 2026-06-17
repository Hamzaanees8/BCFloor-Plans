"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Loader2, Edit2, Trash2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import DropdownActions from "./DropdownActions";
import {
    Organization,
    GetOrganizations,
    DeleteOrganization,
    UpdateOrganization,
    GetUserOrganization,
    GetOrganizationBranding,
    UpdateOrganizationBranding,
} from "@/app/dashboard/global-settings/global-settings";
import CreateOrganizationDialog from "./CreateOrganizationDialog";
import { DateTime } from "luxon";
import { usePermissions } from "@/app/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    isDefaultDomain,
    isDomainMatchingSubdomain,
    extractBaseDomain,
    getDefaultDomainErrorMessage,
    getSubdomainMismatchWarning,
    getDefaultDomains,
} from "@/lib/config/domains";

const OrganizationsSettings = React.forwardRef<
    { save: () => Promise<void> },
    object
>((props, ref) => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || "admin";
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings["admin"];

    const { isSuperAdmin } = usePermissions();

    React.useImperativeHandle(ref, () => ({
        save: handleSaveOwnOrg,
    }));

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editTarget, setEditTarget] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    // Non-super-admin own organization state
    const [ownOrg, setOwnOrg] = useState<Organization | null>(null);
    const [ownOrgLoading, setOwnOrgLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formState, setFormState] = useState<{
        name: string;
        contact_name: string;
        contact_email: string;
        contact_phone: string;
        address_line_1: string;
        city: string;
        province: string;
        country: string;
        postal_code: string;
        // Whitelabel fields
        is_whitelabel: boolean;
        portal_type: 'agent' | 'vendor' | null;
        slug: string;
        domain: string;
        primary_color: string;
        secondary_color: string;
        logo: string;
        from_name: string;
        from_email: string;
        domains: any[];
        disable_next_day_booking: boolean;
        booking_cutoff_time: string;
        show_org_details_on_empty_schedule: boolean;
    }>({
        name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        address_line_1: "",
        city: "",
        province: "",
        country: "",
        postal_code: "",
        is_whitelabel: false,
        portal_type: "agent",
        slug: "",
        domain: "",
        primary_color: "#6BAE41",
        secondary_color: "#DC9600",
        logo: "",
        from_name: "",
        from_email: "",
        domains: [],
        disable_next_day_booking: false,
        booking_cutoff_time: "17:00",
        show_org_details_on_empty_schedule: false,
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const orgLogoRef = useRef<HTMLInputElement>(null);

    const [newDomain, setNewDomain] = useState("");
    const [newPortalType, setNewPortalType] = useState<'admin' | 'agent' | 'vendor'>('agent');
    const [editDomainIndex, setEditDomainIndex] = useState<number | null>(null);
    const [domainValidationError, setDomainValidationError] = useState<string | null>(null);
    const [subdomainWarnings, setSubdomainWarnings] = useState<Map<number, string>>(new Map());

    // Validate custom domain for whitelabel orgs (check if it's a default domain)
    useEffect(() => {
        if (!formState.is_whitelabel || !formState.domain) {
            setDomainValidationError(null);
            return;
        }

        const customDomain = formState.domain.trim();
        if (isDefaultDomain(customDomain)) {
            setDomainValidationError(getDefaultDomainErrorMessage(customDomain));
        } else {
            setDomainValidationError(null);
        }
    }, [formState.domain, formState.is_whitelabel]);

    // Validate subdomains for whitelabel orgs (check if they match custom domain)
    useEffect(() => {
        if (!formState.is_whitelabel || !formState.domain || !formState.domains || formState.domains.length === 0) {
            setSubdomainWarnings(new Map());
            return;
        }

        const customDomain = formState.domain.trim().toLowerCase();
        const newWarnings = new Map<number, string>();

        formState.domains.forEach((domainObj, index) => {
            if (domainObj.domain && !isDomainMatchingSubdomain(customDomain, domainObj.domain)) {
                const subdomainBase = extractBaseDomain(domainObj.domain);
                newWarnings.set(index, getSubdomainMismatchWarning(customDomain, subdomainBase));
            }
        });

        setSubdomainWarnings(newWarnings);
    }, [formState.domains, formState.domain, formState.is_whitelabel]);

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await GetOrganizations();
            setOrganizations(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load organizations");
            setOrganizations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all organizations for super admin on mount
    useEffect(() => {
        if (isSuperAdmin) {
            fetchOrganizations();
        }
    }, [fetchOrganizations, isSuperAdmin]);

    // Fetch own organization for regular admin on mount
    useEffect(() => {
        if (isSuperAdmin) return;
        setOwnOrgLoading(true);
        GetUserOrganization()
            .then(async (res) => {
                const org = res.data;
                setOwnOrg(org);

                let primary_color = org.primary_color || "#6BAE41";
                let secondary_color = org.secondary_color || "#DC9600";
                let logo = org.logo || "";

                try {
                    const brandingRes = await GetOrganizationBranding(org.uuid);
                    if (brandingRes?.data) {
                        primary_color = brandingRes.data.primary_color || primary_color;
                        secondary_color = brandingRes.data.secondary_color || secondary_color;
                        logo = brandingRes.data.logo_url || brandingRes.data.logo || logo;
                    }
                } catch (e) {
                    console.error("Failed to load organization branding", e);
                }

                setFormState({
                    name: org.name || "",
                    contact_name: org.contact_name || "",
                    contact_email: org.contact_email || "",
                    contact_phone: org.contact_phone || "",
                    address_line_1: org.address_line_1 || "",
                    city: org.city || "",
                    province: org.province || "",
                    country: org.country || "",
                    postal_code: org.postal_code || "",
                    is_whitelabel: org.is_whitelabel ?? false,
                    portal_type: org.portal_type || "agent",
                    slug: org.slug || "",
                    domain: org.domain || "",
                    primary_color,
                    secondary_color,
                    logo,
                    from_name: org.from_name || "",
                    from_email: org.from_email || "",
                    domains: org.domains || [],
                    disable_next_day_booking: org.disable_next_day_booking ?? false,
                    booking_cutoff_time: org.booking_cutoff_time || "17:00",
                    show_org_details_on_empty_schedule: org.show_org_details_on_empty_schedule ?? false,
                });
            })
            .catch(() => toast.error("Failed to load your organization"))
            .finally(() => setOwnOrgLoading(false));
    }, [isSuperAdmin]);

    const handleSaveOwnOrg = async () => {
        if (!ownOrg) return;
        if (!formState.name.trim()) {
            toast.error("Organization name is required.");
            return;
        }
        if (formState.name.trim().length < 2) {
            toast.error("Organization name must be at least 2 characters.");
            return;
        }
        if (formState.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.contact_email)) {
            toast.error("Please enter a valid email address.");
            return;
        }
        if (formState.contact_phone && !/^[\d\s\+\-\(\)]{7,20}$/.test(formState.contact_phone)) {
            toast.error("Please enter a valid phone number.");
            return;
        }

        // Custom domain validations (same as CreateOrganizationDialog)
        if (formState.is_whitelabel) {
            const isValidDomain = (value: string): boolean => {
                const val = value.trim().toLowerCase();
                if (val.includes("localhost")) return true;
                return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/.test(val);
            };
            if (formState.domain && !isValidDomain(formState.domain)) {
                toast.error("Enter a valid domain (e.g. myportalmedia.com)");
                return;
            }
            if (domainValidationError) {
                toast.error(domainValidationError);
                return;
            }
            if (formState.slug && !/^[a-z0-9\-]+$/.test(formState.slug)) {
                toast.error("Slug may only contain lowercase letters, numbers, and hyphens.");
                return;
            }
        }

        setIsSaving(true);
        try {
            // Update base details
            await UpdateOrganization(ownOrg.uuid, {
                name: formState.name,
                contact_name: formState.contact_name,
                contact_email: formState.contact_email,
                contact_phone: formState.contact_phone,
                address_line_1: formState.address_line_1,
                city: formState.city,
                province: formState.province,
                country: formState.country,
                postal_code: formState.postal_code,
                is_whitelabel: formState.is_whitelabel,
                portal_type: formState.portal_type || undefined,
                slug: formState.slug || undefined,
                domain: formState.is_whitelabel ? (formState.domain?.trim() || null) : null,
                from_name: formState.is_whitelabel ? (formState.from_name?.trim() || null) : null,
                from_email: formState.is_whitelabel ? (formState.from_email?.trim() || null) : null,
                domains: formState.is_whitelabel ? formState.domains : [],
                logo: formState.logo,
                disable_next_day_booking: formState.disable_next_day_booking,
                booking_cutoff_time: formState.booking_cutoff_time,
                show_org_details_on_empty_schedule: formState.show_org_details_on_empty_schedule,
            });

            // Update branding if whitelabel is enabled and branding info is changed
            if (formState.is_whitelabel && (logoFile || formState.primary_color || formState.secondary_color)) {
                const formData = new FormData();
                if (formState.primary_color) formData.append('primary_color', formState.primary_color);
                if (formState.secondary_color) formData.append('secondary_color', formState.secondary_color);
                if (logoFile) formData.append('logo', logoFile);
                await UpdateOrganizationBranding(ownOrg.uuid, formData);
            }

            toast.success("Organization updated successfully");
        } catch (err) {
            const e = err as Error;
            toast.error(e.message || "Failed to save organization");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddDomain = () => {
        if (!newDomain.trim()) {
            toast.error("Please enter a domain.");
            return;
        }
        const isValidDomain = (value: string): boolean => {
            const val = value.trim().toLowerCase();
            if (val.includes("localhost")) return true;
            return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/.test(val);
        };
        if (!isValidDomain(newDomain)) {
            toast.error("Enter a valid domain (e.g. media.commerx.com)");
            return;
        }

        const trimmedDomain = newDomain.trim().toLowerCase();
        const domains = [...(formState.domains || [])];

        const domainExists = domains.some((d, idx) => d.domain.toLowerCase() === trimmedDomain && idx !== editDomainIndex);
        if (domainExists) {
            toast.error("This domain is already added.");
            return;
        }

        const typeExists = domains.some((d, idx) => d.portal_type === newPortalType && idx !== editDomainIndex);
        if (typeExists) {
            toast.error(`A domain is already mapped to the ${newPortalType} portal. Only one domain per portal is allowed.`);
            return;
        }

        if (editDomainIndex !== null) {
            domains[editDomainIndex] = { domain: trimmedDomain, portal_type: newPortalType };
            toast.success("Domain mapping updated.");
        } else {
            domains.push({ domain: trimmedDomain, portal_type: newPortalType });
            toast.success("Domain mapping added.");
        }

        setFormState(prev => ({ ...prev, domains }));
        setNewDomain("");
        setEditDomainIndex(null);
    };

    const handleEditDomain = (index: number) => {
        const item = (formState.domains || [])[index];
        if (!item) return;
        setNewDomain(item.domain);
        setNewPortalType(item.portal_type);
        setEditDomainIndex(index);
    };

    const handleRemoveDomain = (index: number) => {
        const domains = [...(formState.domains || [])];
        domains.splice(index, 1);
        setFormState(prev => ({ ...prev, domains }));
        if (editDomainIndex === index) {
            setEditDomainIndex(null);
            setNewDomain("");
        } else if (editDomainIndex !== null && index < editDomainIndex) {
            setEditDomainIndex(editDomainIndex - 1);
        }
    };

    const handleDelete = async (uuid: string) => {
        try {
            await DeleteOrganization(uuid);
            setOrganizations((prev) => prev.filter((o) => o.uuid !== uuid));
            toast.success("Organization deleted successfully");
        } catch (err) {
            const e = err as Error;
            toast.error(e.message || "Failed to delete organization");
        }
    };

    const handleToggleStatus = async (uuid: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        // Optimistic update
        setOrganizations((prev) =>
            prev.map((o) => (o.uuid === uuid ? { ...o, is_active: newStatus } : o))
        );
        try {
            await UpdateOrganization(uuid, { is_active: newStatus });
            toast.success(`Organization ${newStatus ? "activated" : "deactivated"}`);
        } catch (err) {
            // Revert
            setOrganizations((prev) =>
                prev.map((o) => (o.uuid === uuid ? { ...o, is_active: currentStatus } : o))
            );
            const e = err as Error;
            toast.error(e.message || "Failed to update status");
        }
    };

    const columns: ColumnDef<Organization>[] = [
        {
            accessorKey: "name",
            header: "NAME",
            cell: ({ row }) => (
                <div className="font-medium text-[#444]">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "slug",
            header: "SLUG",
            cell: ({ row }) => (
                <div className="text-[#666666] font-mono text-xs">{row.getValue("slug") || "—"}</div>
            ),
        },
        {
            accessorKey: "domain",
            header: "DOMAIN",
            cell: ({ row }) => (
                <div className="text-[#666666] text-xs">{row.getValue("domain") || "—"}</div>
            ),
        },
        {
            accessorKey: "contact_email",
            header: "CONTACT EMAIL",
            cell: ({ row }) => (
                <div className="text-[#666666]">{row.getValue("contact_email") || "—"}</div>
            ),
        },
        {
            accessorKey: "contact_phone",
            header: "PHONE",
            cell: ({ row }) => (
                <div className="text-[#666666]">{row.getValue("contact_phone") || "—"}</div>
            ),
        },
        {
            accessorKey: "city",
            header: "CITY",
            cell: ({ row }) => (
                <div className="text-[#666666]">{row.getValue("city") || "—"}</div>
            ),
        },
        {
            accessorKey: "trial_ends_at",
            header: "TRIAL ENDS",
            cell: ({ row }) => {
                const val = row.getValue("trial_ends_at") as string | null;
                if (!val) return <div className="text-[#666666]">—</div>;
                return (
                    <div className="text-[#666666]">
                        {DateTime.fromISO(val).toFormat("LLL dd, yyyy")}
                    </div>
                );
            },
        },
        {
            accessorKey: "is_active",
            header: "STATUS",
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <div className="flex items-center gap-[10px]">
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={isActive}
                                onCheckedChange={() =>
                                    handleToggleStatus(row.original.uuid, isActive)
                                }
                                className={
                                    isActive
                                        ? "data-[state=checked]:bg-[#6BAE41]"
                                        : "data-[state=unchecked]:bg-red-500"
                                }
                            />
                        </div>
                        <DropdownActions
                            options={[
                                {
                                    label: "Edit",
                                    onClick: () => {
                                        setEditTarget(row.original);
                                        setOpenDialog(true);
                                    },
                                },
                                {
                                    label: "Delete",
                                    onClick: () => handleDelete(row.original.uuid),
                                    confirm1: true,
                                },
                            ]}
                        />
                    </div>
                );
            },
        },
    ];

    const accentColor = userType === "admin" ? "#4290E9" : "#6BAE41";

    if (!isSuperAdmin) {
        return (
            <div className="w-full flex-col flex">

                {ownOrgLoading ? (
                    <div className="w-full flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
                    </div>
                ) : (
                    <div className="w-full mt-6 px-6 py-6 shadow-sm font-alexandria" style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                        <fieldset disabled={isSaving} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#424242]">
                            {/* Organization Name */}
                            <div>
                                <label className="text-sm font-semibold mb-2 block">
                                    Organization Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formState.name}
                                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="Organization Name"
                                />
                            </div>

                            {/* Contact Name */}
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Contact Name</label>
                                <Input
                                    value={formState.contact_name}
                                    onChange={(e) => setFormState(prev => ({ ...prev, contact_name: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="Contact Name"
                                />
                            </div>

                            {/* Contact Email */}
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Contact Email</label>
                                <Input
                                    value={formState.contact_email}
                                    onChange={(e) => setFormState(prev => ({ ...prev, contact_email: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="Contact Email"
                                    type="email"
                                />
                            </div>

                            {/* Contact Phone */}
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Contact Phone</label>
                                <Input
                                    value={formState.contact_phone}
                                    onChange={(e) => setFormState(prev => ({ ...prev, contact_phone: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="Contact Phone"
                                    type="tel"
                                />
                            </div>

                            {/* Address Line 1 */}
                            <div className="md:col-span-2">
                                <label className="text-sm font-semibold mb-2 block">Address Line 1</label>
                                <Input
                                    value={formState.address_line_1}
                                    onChange={(e) => setFormState(prev => ({ ...prev, address_line_1: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="Address Line 1"
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label className="text-sm font-semibold mb-2 block">City</label>
                                <Input
                                    value={formState.city}
                                    onChange={(e) => setFormState(prev => ({ ...prev, city: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="City"
                                />
                            </div>

                            {/* Province */}
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Province / State</label>
                                <Input
                                    value={formState.province}
                                    onChange={(e) => setFormState(prev => ({ ...prev, province: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="Province"
                                />
                            </div>

                            {/* Country */}
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Country</label>
                                <Input
                                    value={formState.country}
                                    onChange={(e) => setFormState(prev => ({ ...prev, country: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="Country"
                                />
                            </div>

                            {/* Postal Code */}
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Postal Code</label>
                                <Input
                                    value={formState.postal_code}
                                    onChange={(e) => setFormState(prev => ({ ...prev, postal_code: e.target.value }))}
                                    className="h-[42px] border-[1px] placeholder:text-[#9ca3af] border-[#BBBBBB]"
                                    style={{
                                        backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                                    }}
                                    placeholder="Postal Code"
                                />
                            </div>


                            {/* Whitelabel Branding Fields (rendered if organization is whitelabeled) */}
                            {formState.is_whitelabel && (
                                <>
                                    <hr className="col-span-1 md:col-span-2 border-[#BBBBBB] my-4" />

                                    <div className="col-span-1 md:col-span-2">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Whitelabel Branding</p>
                                    </div>

                                    {/* Portal Type */}
                                    <div>
                                        <Label className="text-sm font-semibold mb-2 block">Default Portal Type</Label>
                                        <Select
                                            value={formState.portal_type || "agent"}
                                            onValueChange={(val: 'agent' | 'vendor') => setFormState(prev => ({ ...prev, portal_type: val }))}
                                        >
                                            <SelectTrigger className="h-[42px] border-[1px] border-[#BBBBBB]" style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                                                <SelectValue placeholder="Select Portal" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="agent">Agent Portal</SelectItem>
                                                <SelectItem value="vendor">Vendor Portal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Slug */}
                                    <div>
                                        <Label className="text-sm font-semibold mb-2 block">
                                            Slug <span className="text-[#999] text-xs font-normal">(auto-generated if blank)</span>
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. acme-realty"
                                            value={formState.slug}
                                            onChange={(e) => setFormState(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                                            className="h-[42px] border-[1px] border-[#BBBBBB]"
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                        {formState.slug && (
                                            <p className="text-[10px] text-[#999] mt-1">
                                                Portal URL preview:{' '}
                                                <span className="font-mono text-[#4290E9]">
                                                    {`${formState.slug}.${getDefaultDomains()[1] || 'bookings-new.bcfloorplans.com'}`}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Custom Domain */}
                                    <div>
                                        <Label className="text-sm font-semibold mb-2 block">Custom Domain</Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. mypropertymedia.com"
                                            value={formState.domain}
                                            onChange={(e) => setFormState(prev => ({ ...prev, domain: e.target.value }))}
                                            className={`h-[42px] border-[1px] ${domainValidationError ? "border-red-400 bg-red-50" : "border-[#BBBBBB]"}`}
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                        {domainValidationError && (
                                            <div className="flex gap-2 items-start mt-2 p-2 bg-red-50 rounded border border-red-200">
                                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-red-600 text-[10px]">{domainValidationError}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Logo */}
                                    <div>
                                        <Label className="text-sm font-semibold mb-2 block">Organization Logo</Label>
                                        {(logoFile || formState.logo) && (
                                            <div className="mt-2 mb-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={logoFile ? URL.createObjectURL(logoFile) : formState.logo}
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
                                                {logoFile ? logoFile.name : (formState.logo ? 'Change Logo' : 'Upload Logo')}
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
                                            {(logoFile || formState.logo) && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setLogoFile(null);
                                                        setFormState(prev => ({ ...prev, logo: '' }));
                                                        if (orgLogoRef.current) orgLogoRef.current.value = '';
                                                    }}
                                                    className="h-[42px] border-red-200 text-red-600 hover:bg-red-50 px-3 bg-white"
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* From Name */}
                                    <div>
                                        <Label className="text-sm font-semibold mb-2 block">Email &quot;From&quot; Name</Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. BC Floorplans Support"
                                            value={formState.from_name}
                                            onChange={(e) => setFormState(prev => ({ ...prev, from_name: e.target.value }))}
                                            className="h-[42px] border-[1px] border-[#BBBBBB]"
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                    </div>

                                    {/* From Email */}
                                    <div>
                                        <Label className="text-sm font-semibold mb-2 block">Email &quot;From&quot; Address</Label>
                                        <Input
                                            type="email"
                                            placeholder="e.g. support@bcfloorplans.com"
                                            value={formState.from_email}
                                            onChange={(e) => setFormState(prev => ({ ...prev, from_email: e.target.value }))}
                                            className="h-[42px] border-[1px] border-[#BBBBBB]"
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                    </div>

                                    {/* Custom Domain Mappings */}
                                    <div className="col-span-1 md:col-span-2 mt-6 border-t border-[#BBBBBB] pt-5">
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
                                                    className={`h-[36px] px-4 text-xs text-white ${editDomainIndex !== null ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-600 hover:bg-slate-700'} ${domainValidationError ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {editDomainIndex !== null ? 'Update' : 'Add Mapping'}
                                                </Button>
                                                {editDomainIndex !== null && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditDomainIndex(null);
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
                                            {formState.domains && formState.domains.length > 0 ? (
                                                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                                                    <table className="w-full text-left text-xs border-collapse">
                                                        <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
                                                            <tr>
                                                                <th className="px-3 py-2 border-b">Domain</th>
                                                                <th className="px-3 py-2 border-b">Target Portal</th>
                                                                <th className="px-3 py-2 border-b w-[50px]"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {formState.domains.map((d, i) => (
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
                                                                                    className={`${editDomainIndex === i ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'} transition-colors`}
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
                                                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 italic text-xs bg-white">
                                                    No custom domains mapped yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* DevOps Checklist Box */}
                                    <div className="col-span-1 md:col-span-2 mt-6 border-t border-slate-200 pt-5">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                                                DevOps Checklist for Whitelabeling
                                            </p>
                                            <ul className="space-y-2 text-xs text-slate-600 font-medium">
                                                <li className="flex items-start gap-2">
                                                    <input type="checkbox" readOnly checked className="mt-0.5 pointer-events-none rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    <span><strong>DNS Setup:</strong> Add CNAME/A records pointing your custom subdomains to AWS Route 53.</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <input type="checkbox" readOnly checked className="mt-0.5 pointer-events-none rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    <span><strong>AWS Amplify:</strong> Attach the custom subdomains to the Amplify hosted app in the AWS console.</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <input type="checkbox" readOnly checked className="mt-0.5 pointer-events-none rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    <span><strong>Resend Email:</strong> Verify the custom domain in your Resend console for domain alignment authentication.</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </fieldset>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full flex-col flex rounded-lg">
            {/* Header */}
            <div
                className="flex items-center justify-between w-full px-4 py-4"
                style={{
                    backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)`,
                }}
            >
                <p
                    className="text-[18px] font-semibold uppercase"
                    style={{ color: accentColor }}
                >
                    ORGANIZATIONS
                </p>
                <div
                    onClick={() => {
                        setEditTarget(null);
                        setOpenDialog(true);
                    }}
                    className="flex items-center gap-x-[10px] cursor-pointer"
                >
                    <p
                        className="text-base font-semibold font-raleway"
                        style={{ color: accentColor }}
                    >
                        Create Organization
                    </p>
                    <Plus
                        className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="w-full mt-4">
                <DataTable
                    data={organizations}
                    columns={columns}
                    loading={loading}
                    error={false}
                    dataName="Organizations"
                    userType={userType}
                />
            </div>

            {/* Dialog */}
            <CreateOrganizationDialog
                open={openDialog}
                setOpen={(open) => {
                    setOpenDialog(open);
                    if (!open) setEditTarget(null);
                }}
                onSuccess={fetchOrganizations}
                initialData={editTarget}
            />
        </div>
    );
});
OrganizationsSettings.displayName = "OrganizationsSettings";

export default OrganizationsSettings;
