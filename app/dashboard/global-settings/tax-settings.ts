import { api } from "@/lib/api";

export interface TaxItem {
  id?: string;
  name: string;
  rate: number;
  registration_number: string;
  is_enabled: boolean;
  quickbooks_tax_code_id?: string;
}

export interface DestinationRule {
  id?: string;
  state_province: string;
  country: string;
  taxes: TaxItem[];
}

export interface FallbackTax {
  name: string;
  rate: number;
  registration_number: string;
}

export interface TaxSettingsPayload {
  is_configured?: boolean;
  is_enabled: boolean;
  calculation_basis: "origin" | "destination" | string;
  origin_taxes?: TaxItem[];
  destination_rules?: DestinationRule[];
  unmatched_destination_policy?: "zero_tax" | "fallback_rate" | string;
  fallback_tax?: FallbackTax;
}

export interface TaxCalculationPreviewRequest {
  country: string;
  state_province: string;
  subtotal: number;
}

export interface TaxCalculationPreviewResponse {
  country: string;
  state_province: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  applied_taxes: Array<{
    name: string;
    rate: number;
    amount: number;
    registration_number?: string;
  }>;
}

export interface QuickBooksTaxCode {
  id: string;
  name: string;
  description?: string;
  rate?: number;
}

export const defaultCanadaRules: DestinationRule[] = [
  {
    state_province: "BC",
    country: "CA",
    taxes: [
      { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
      { name: "PST", rate: 7.0, registration_number: "PST-987654321", is_enabled: true },
    ],
  },
  {
    state_province: "ON",
    country: "CA",
    taxes: [
      { name: "HST", rate: 13.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
  {
    state_province: "AB",
    country: "CA",
    taxes: [
      { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
  {
    state_province: "QC",
    country: "CA",
    taxes: [
      { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
      { name: "QST", rate: 9.975, registration_number: "1234567890 TQ0001", is_enabled: true },
    ],
  },
  {
    state_province: "SK",
    country: "CA",
    taxes: [
      { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
      { name: "PST", rate: 6.0, registration_number: "SK-PST-123456", is_enabled: true },
    ],
  },
  {
    state_province: "MB",
    country: "CA",
    taxes: [
      { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
      { name: "RST", rate: 7.0, registration_number: "MB-RST-123456", is_enabled: true },
    ],
  },
  {
    state_province: "NS",
    country: "CA",
    taxes: [
      { name: "HST", rate: 15.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
  {
    state_province: "NB",
    country: "CA",
    taxes: [
      { name: "HST", rate: 15.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
  {
    state_province: "NL",
    country: "CA",
    taxes: [
      { name: "HST", rate: 15.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
  {
    state_province: "PE",
    country: "CA",
    taxes: [
      { name: "HST", rate: 15.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
  {
    state_province: "YT",
    country: "CA",
    taxes: [
      { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
  {
    state_province: "NT",
    country: "CA",
    taxes: [
      { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
  {
    state_province: "NU",
    country: "CA",
    taxes: [
      { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
    ],
  },
];

export const defaultOriginTaxes: TaxItem[] = [
  {
    id: "tax-origin-1",
    name: "GST",
    rate: 5.0,
    registration_number: "123456789 RT0001",
    is_enabled: true,
  },
];

export const defaultTaxSettings: TaxSettingsPayload = {
  is_configured: false,
  is_enabled: true,
  calculation_basis: "destination",
  origin_taxes: defaultOriginTaxes,
  destination_rules: [
    {
      state_province: "BC",
      country: "CA",
      taxes: [
        { name: "GST", rate: 5.0, registration_number: "123456789 RT0001", is_enabled: true },
        { name: "PST", rate: 7.0, registration_number: "PST-987654321", is_enabled: true },
      ],
    },
    {
      state_province: "ON",
      country: "CA",
      taxes: [
        { name: "HST", rate: 13.0, registration_number: "123456789 RT0001", is_enabled: true },
      ],
    },
  ],
  unmatched_destination_policy: "zero_tax",
  fallback_tax: {
    name: "Tax",
    rate: 0.0,
    registration_number: "",
  },
};

export function normalizeTaxSettings(data: any): TaxSettingsPayload {
  if (!data || typeof data !== "object") {
    return defaultTaxSettings;
  }

  // Handle origin taxes
  const rawOriginTaxes = Array.isArray(data.origin_taxes)
    ? data.origin_taxes
    : defaultOriginTaxes;

  const origin_taxes: TaxItem[] = rawOriginTaxes.map((tax: any, taxIdx: number) => ({
    id: tax.id || `origin-tax-${taxIdx}-${Date.now()}`,
    name: typeof tax.name === "string" ? tax.name : "Tax",
    rate: Number(tax.rate) >= 0 ? Number(tax.rate) : 0,
    registration_number: typeof tax.registration_number === "string" ? tax.registration_number : "",
    is_enabled: tax.is_enabled !== undefined ? Boolean(tax.is_enabled) : true,
    quickbooks_tax_code_id: tax.quickbooks_tax_code_id || undefined,
  }));

  // Handle destination rules
  const rawRules = Array.isArray(data.destination_rules)
    ? data.destination_rules
    : defaultTaxSettings.destination_rules || [];

  const destination_rules: DestinationRule[] = rawRules.map((rule: any, ruleIdx: number) => {
    const rawTaxes = Array.isArray(rule.taxes) ? rule.taxes : [];
    const taxes: TaxItem[] = rawTaxes.map((tax: any, taxIdx: number) => ({
      id: tax.id || `tax-${ruleIdx}-${taxIdx}-${Date.now()}`,
      name: typeof tax.name === "string" ? tax.name : "Tax",
      rate: Number(tax.rate) >= 0 ? Number(tax.rate) : 0,
      registration_number: typeof tax.registration_number === "string" ? tax.registration_number : "",
      is_enabled: tax.is_enabled !== undefined ? Boolean(tax.is_enabled) : true,
      quickbooks_tax_code_id: tax.quickbooks_tax_code_id || undefined,
    }));

    return {
      id: rule.id || `rule-${ruleIdx}-${Date.now()}`,
      state_province: rule.state_province || "",
      country: rule.country || "CA",
      taxes: taxes.length > 0 ? taxes : [{ name: "Tax", rate: 0, registration_number: "", is_enabled: true }],
    };
  });

  return {
    is_configured: data.is_configured !== undefined ? Boolean(data.is_configured) : true,
    is_enabled: data.is_enabled !== undefined ? Boolean(data.is_enabled) : true,
    calculation_basis: data.calculation_basis || "destination",
    origin_taxes,
    destination_rules,
    unmatched_destination_policy: data.unmatched_destination_policy || "zero_tax",
    fallback_tax: {
      name: data.fallback_tax?.name || "Tax",
      rate: Number(data.fallback_tax?.rate) >= 0 ? Number(data.fallback_tax?.rate) : 0,
      registration_number: data.fallback_tax?.registration_number || "",
    },
  };
}

/**
 * 1. GET /api/tax-settings
 * Fetches the active tax configuration for the authenticated tenant organization.
 */
export async function GetTaxSettings(): Promise<TaxSettingsPayload> {
  try {
    const response = await api.get("/tax-settings");
    const data = response.data?.data ?? response.data;
    if (data && typeof data === "object") {
      return normalizeTaxSettings(data);
    }
  } catch (err: any) {
    console.warn("GET /tax-settings error, checking fallback:", err?.message || err);
  }

  // Fallback check if needed
  try {
    const fallbackRes = await api.get("/settings/tax_settings");
    const val = fallbackRes.data?.value ?? fallbackRes.data?.data?.value ?? fallbackRes.data?.data ?? fallbackRes.data;
    if (val && typeof val === "object") {
      return normalizeTaxSettings(val);
    }
  } catch {
    // Ignore fallback errors
  }

  return defaultTaxSettings;
}

/**
 * 2. POST /api/tax-settings
 * Saves the tenant organization's updated tax settings.
 */
export async function SaveTaxSettings(payload: TaxSettingsPayload) {
  let cleanPayload: Record<string, any>;

  if (payload.calculation_basis === "origin") {
    // Example A: Origin-Based Mode
    cleanPayload = {
      is_enabled: Boolean(payload.is_enabled),
      calculation_basis: "origin",
      origin_taxes: (payload.origin_taxes || []).map((tax) => ({
        name: tax.name || "GST",
        rate: Number(tax.rate) || 0,
        registration_number: tax.registration_number || "",
        is_enabled: Boolean(tax.is_enabled),
        ...(tax.quickbooks_tax_code_id ? { quickbooks_tax_code_id: tax.quickbooks_tax_code_id } : {}),
      })),
    };
  } else {
    // Example B: Destination-Based Mode
    cleanPayload = {
      is_enabled: Boolean(payload.is_enabled),
      calculation_basis: "destination",
      destination_rules: (payload.destination_rules || []).map((rule) => ({
        state_province: rule.state_province,
        country: rule.country,
        taxes: (rule.taxes || []).map((tax) => ({
          name: tax.name || "",
          rate: Number(tax.rate) || 0,
          registration_number: tax.registration_number || "",
          is_enabled: Boolean(tax.is_enabled),
          ...(tax.quickbooks_tax_code_id ? { quickbooks_tax_code_id: tax.quickbooks_tax_code_id } : {}),
        })),
      })),
      unmatched_destination_policy: payload.unmatched_destination_policy || "zero_tax",
      fallback_tax: {
        name: payload.fallback_tax?.name || "Tax",
        rate: Number(payload.fallback_tax?.rate) || 0,
        registration_number: payload.fallback_tax?.registration_number || "",
      },
    };
  }

  const response = await api.post("/tax-settings", cleanPayload);
  return response.data;
}

/**
 * POST /api/tax-settings/calculate-preview
 */
export async function CalculateTaxPreview(
  request: TaxCalculationPreviewRequest
): Promise<TaxCalculationPreviewResponse> {
  const response = await api.post("/tax-settings/calculate-preview", request);
  return response.data?.data ?? response.data;
}

/**
 * GET /api/quickbooks/tax-codes
 */
export async function GetQuickBooksTaxCodes(): Promise<QuickBooksTaxCode[]> {
  try {
    const response = await api.get("/quickbooks/tax-codes");
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("Failed to fetch QuickBooks tax codes:", error);
    return [];
  }
}

export interface RealtimeTaxPreviewItem {
  amount: number;
  is_taxable?: boolean;
}

export interface RealtimeTaxPreviewRequest {
  org_slug?: string;
  org_uuid?: string;
  property_province: string;
  property_country?: string;
  items: RealtimeTaxPreviewItem[];
}

export interface RealtimeTaxDetail {
  rate: number;
  amount: number;
  registration_number?: string;
}

export interface RealtimeTaxPreviewResponseData {
  subtotal: number;
  total_tax_amount: number;
  effective_tax_rate: number;
  tax_details: Record<string, RealtimeTaxDetail>;
  tax_numbers?: string;
  total: number;
  calculation_basis?: string;
  jurisdiction?: string;
  items?: Array<{
    index: number;
    amount: number;
    is_taxable: boolean;
    tax_amount: number;
    gst_amount?: number;
    pst_amount?: number;
    hst_amount?: number;
  }>;
}

/**
 * Real-time tax calculation engine for Order Creation, Checkout, and Book Now flow.
 * Tries authenticated POST /tax-settings/calculate-preview, falling back to POST /public/tax-preview.
 * Provides a local Canadian tax rule fallback if offline.
 */
export async function CalculateRealtimeTaxPreview(
  request: RealtimeTaxPreviewRequest
): Promise<RealtimeTaxPreviewResponseData> {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("agentToken")) : null;

  // Try authenticated route if token is present
  if (token) {
    try {
      const response = await api.post("/tax-settings/calculate-preview", request);
      const resData = response.data?.data ?? response.data;
      if (resData && typeof resData === "object" && typeof resData.total_tax_amount === "number") {
        return resData;
      }
    } catch (err: any) {
      console.warn("POST /tax-settings/calculate-preview failed, trying /public/tax-preview:", err?.message || err);
    }
  }

  // Fallback to public route
  try {
    const response = await api.post("/public/tax-preview", {
      org_slug: request.org_slug || "bc-floor-plans",
      ...request,
    });
    const resData = response.data?.data ?? response.data;
    if (resData && typeof resData === "object" && typeof resData.total_tax_amount === "number") {
      return resData;
    }
  } catch (err: any) {
    console.warn("POST /public/tax-preview failed, computing fallback:", err?.message || err);
  }

  // Graceful local fallback calculation based on Canadian province rules
  const subtotal = request.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxableSubtotal = request.items
    .filter((i) => i.is_taxable !== false)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const prov = (request.property_province || "BC").trim().toUpperCase();
  const taxRule = defaultCanadaRules.find(
    (r) => r.state_province.toUpperCase() === prov || r.state_province.toUpperCase() === prov.slice(0, 2)
  ) || defaultCanadaRules[0]; // default to BC

  const taxDetails: Record<string, RealtimeTaxDetail> = {};
  let totalTax = 0;

  taxRule.taxes.filter((t) => t.is_enabled).forEach((t) => {
    const taxAmt = Number(((taxableSubtotal * t.rate) / 100).toFixed(2));
    taxDetails[t.name] = {
      rate: t.rate,
      amount: taxAmt,
      registration_number: t.registration_number,
    };
    totalTax += taxAmt;
  });

  return {
    subtotal: Number(subtotal.toFixed(2)),
    total_tax_amount: Number(totalTax.toFixed(2)),
    effective_tax_rate: subtotal > 0 ? Number(((totalTax / subtotal) * 100).toFixed(2)) : 0,
    tax_details: taxDetails,
    tax_numbers: "",
    total: Number((subtotal + totalTax).toFixed(2)),
    calculation_basis: "destination",
    jurisdiction: `Fallback (${taxRule.state_province})`,
  };
}

