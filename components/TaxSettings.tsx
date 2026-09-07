"use client";
import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { Country, State } from "country-state-city";
import { toast } from "sonner";
import {
  Percent,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Code2,
  Copy,
  Check,
  Globe2,
  ShieldCheck,
  Building2,
  MapPin,
  Calculator,
  Info,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppContext } from "@/app/context/AppContext";
import {
  GetTaxSettings,
  SaveTaxSettings,
  CalculateTaxPreview,
  TaxSettingsPayload,
  DestinationRule,
  TaxItem,
  FallbackTax,
  TaxCalculationPreviewResponse,
  defaultCanadaRules,
  defaultOriginTaxes,
  defaultTaxSettings,
} from "@/app/dashboard/global-settings/tax-settings";

export interface TaxSettingsHandle {
  save: () => Promise<void>;
}

const TaxSettings = forwardRef<TaxSettingsHandle, object>((props, ref) => {
  const { userType } = useAppContext();
  const accentColor = userType === "admin" ? "#4290E9" : "#6BAE41";

  // Master State
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [calculationBasis, setCalculationBasis] = useState<"origin" | "destination" | string>("destination");
  const [originTaxes, setOriginTaxes] = useState<TaxItem[]>(defaultOriginTaxes);
  const [destinationRules, setDestinationRules] = useState<DestinationRule[]>([]);
  const [unmatchedPolicy, setUnmatchedPolicy] = useState<"zero_tax" | "fallback_rate">("zero_tax");
  const [fallbackTax, setFallbackTax] = useState<FallbackTax>({
    name: "Tax",
    rate: 0.0,
    registration_number: "",
  });

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [addRuleModalOpen, setAddRuleModalOpen] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("CA");
  const [selectedState, setSelectedState] = useState<string>("");
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [confirmPresetModal, setConfirmPresetModal] = useState<boolean>(false);

  // Tax Calculator Preview State
  const [calcModalOpen, setCalcModalOpen] = useState<boolean>(false);
  const [calcCountry, setCalcCountry] = useState<string>("CA");
  const [calcState, setCalcState] = useState<string>("BC");
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);
  const [calcResult, setCalcResult] = useState<TaxCalculationPreviewResponse | null>(null);

  // Country and State data
  const allCountries = useMemo(() => {
    return Country.getAllCountries().map((c) => ({
      code: c.isoCode,
      name: c.name,
      flag: c.flag,
    }));
  }, []);

  const availableStates = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry).map((s) => ({
      code: s.isoCode,
      name: s.name,
    }));
  }, [selectedCountry]);

  const calcAvailableStates = useMemo(() => {
    if (!calcCountry) return [];
    return State.getStatesOfCountry(calcCountry).map((s) => ({
      code: s.isoCode,
      name: s.name,
    }));
  }, [calcCountry]);

  // Load Settings on Mount
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await GetTaxSettings();
      setIsConfigured(data.is_configured !== false);
      setIsEnabled(data.is_enabled !== false);
      setCalculationBasis(data.calculation_basis || "destination");
      setOriginTaxes(
        data.origin_taxes && data.origin_taxes.length > 0
          ? data.origin_taxes
          : defaultOriginTaxes
      );
      setDestinationRules(data.destination_rules || []);
      setUnmatchedPolicy(
        data.unmatched_destination_policy === "fallback_rate" ? "fallback_rate" : "zero_tax"
      );
      setFallbackTax(
        data.fallback_tax || {
          name: "Tax",
          rate: 0.0,
          registration_number: "",
        }
      );
    } catch (err) {
      console.error("Failed to load tax settings:", err);
      toast.error("Failed to load tax settings. Using defaults.");
      setIsConfigured(false);
      setIsEnabled(defaultTaxSettings.is_enabled);
      setCalculationBasis(defaultTaxSettings.calculation_basis);
      setOriginTaxes(defaultOriginTaxes);
      setDestinationRules(defaultTaxSettings.destination_rules || []);
      setUnmatchedPolicy(
        defaultTaxSettings.unmatched_destination_policy === "fallback_rate"
          ? "fallback_rate"
          : "zero_tax"
      );
      setFallbackTax(defaultTaxSettings.fallback_tax || { name: "Tax", rate: 0.0, registration_number: "" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save Settings Function
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: TaxSettingsPayload = {
        is_enabled: isEnabled,
        calculation_basis: calculationBasis,
        ...(calculationBasis === "origin"
          ? {
              origin_taxes: originTaxes,
            }
          : {
              destination_rules: destinationRules,
              unmatched_destination_policy: unmatchedPolicy,
              fallback_tax: fallbackTax,
            }),
      };

      await SaveTaxSettings(payload);
      setIsConfigured(true);
      toast.success("Tax settings saved successfully to /api/tax-settings");
    } catch (err: any) {
      console.error("Save tax settings error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to save tax settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Expose save method to parent GlobalSettings sticky header button
  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  // Current JSON Payload for preview & copying
  const currentPayload = useMemo(() => {
    if (calculationBasis === "origin") {
      return {
        is_enabled: isEnabled,
        calculation_basis: "origin",
        origin_taxes: originTaxes.map((t) => ({
          name: t.name,
          rate: Number(t.rate) || 0,
          registration_number: t.registration_number,
          is_enabled: t.is_enabled,
        })),
      };
    }

    return {
      is_enabled: isEnabled,
      calculation_basis: "destination",
      destination_rules: destinationRules.map((rule) => ({
        state_province: rule.state_province,
        country: rule.country,
        taxes: rule.taxes.map((t) => ({
          name: t.name,
          rate: Number(t.rate) || 0,
          registration_number: t.registration_number,
          is_enabled: t.is_enabled,
        })),
      })),
      unmatched_destination_policy: unmatchedPolicy,
      fallback_tax: {
        name: fallbackTax.name,
        rate: Number(fallbackTax.rate) || 0,
        registration_number: fallbackTax.registration_number,
      },
    };
  }, [isEnabled, calculationBasis, originTaxes, destinationRules, unmatchedPolicy, fallbackTax]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setCopiedJson(true);
    toast.success("Tax payload JSON copied to clipboard");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Preload Canada Standard Rules
  const handlePreloadCanada = () => {
    setDestinationRules(
      defaultCanadaRules.map((rule, idx) => ({
        ...rule,
        id: `rule-canada-${idx}-${Date.now()}`,
        taxes: rule.taxes.map((t, tIdx) => ({
          ...t,
          id: `tax-canada-${idx}-${tIdx}-${Date.now()}`,
        })),
      }))
    );
    setCalculationBasis("destination");
    setConfirmPresetModal(false);
    toast.success("Standard Canadian tax rates loaded");
  };

  // Origin Taxes Management
  const handleAddOriginTax = () => {
    const newTax: TaxItem = {
      id: `origin-tax-${Date.now()}`,
      name: "PST",
      rate: 7.0,
      registration_number: "",
      is_enabled: true,
    };
    setOriginTaxes((prev) => [...prev, newTax]);
  };

  const handleRemoveOriginTax = (index: number) => {
    if (originTaxes.length <= 1) {
      toast.error("At least one origin tax is required");
      return;
    }
    setOriginTaxes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateOriginTax = (index: number, field: keyof TaxItem, value: any) => {
    setOriginTaxes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Destination Rule Management
  const handleAddDestinationRule = () => {
    if (!selectedCountry) {
      toast.error("Please select a country");
      return;
    }
    if (!selectedState) {
      toast.error("Please select a state or province");
      return;
    }

    const exists = destinationRules.some(
      (r) =>
        r.country.toUpperCase() === selectedCountry.toUpperCase() &&
        r.state_province.toUpperCase() === selectedState.toUpperCase()
    );

    if (exists) {
      toast.error(`Rule for ${selectedState}, ${selectedCountry} already exists`);
      return;
    }

    const newRule: DestinationRule = {
      id: `rule-${Date.now()}`,
      country: selectedCountry.toUpperCase(),
      state_province: selectedState.toUpperCase(),
      taxes: [
        {
          id: `tax-${Date.now()}-1`,
          name: selectedCountry === "CA" ? "GST" : "Sales Tax",
          rate: selectedCountry === "CA" ? 5.0 : 0.0,
          registration_number: "",
          is_enabled: true,
        },
      ],
    };

    setDestinationRules((prev) => [...prev, newRule]);
    setSelectedState("");
    setAddRuleModalOpen(false);
    toast.success(`Added tax rule for ${newRule.state_province}, ${newRule.country}`);
  };

  const handleRemoveDestinationRule = (ruleIndex: number) => {
    const rule = destinationRules[ruleIndex];
    setDestinationRules((prev) => prev.filter((_, idx) => idx !== ruleIndex));
    toast.success(`Removed tax rule for ${rule.state_province}, ${rule.country}`);
  };

  const handleAddTaxItem = (ruleIndex: number) => {
    setDestinationRules((prev) => {
      const updated = [...prev];
      const targetRule = { ...updated[ruleIndex] };
      const newTax: TaxItem = {
        id: `tax-${Date.now()}-${targetRule.taxes.length + 1}`,
        name: targetRule.country === "CA" ? "PST" : "Local Tax",
        rate: 0.0,
        registration_number: "",
        is_enabled: true,
      };
      targetRule.taxes = [...targetRule.taxes, newTax];
      updated[ruleIndex] = targetRule;
      return updated;
    });
  };

  const handleRemoveTaxItem = (ruleIndex: number, taxIndex: number) => {
    setDestinationRules((prev) => {
      const updated = [...prev];
      const targetRule = { ...updated[ruleIndex] };
      if (targetRule.taxes.length <= 1) {
        toast.error("At least one tax item is required per destination rule");
        return prev;
      }
      targetRule.taxes = targetRule.taxes.filter((_, idx) => idx !== taxIndex);
      updated[ruleIndex] = targetRule;
      return updated;
    });
  };

  const handleUpdateTaxItem = (
    ruleIndex: number,
    taxIndex: number,
    field: keyof TaxItem,
    value: any
  ) => {
    setDestinationRules((prev) => {
      const updated = [...prev];
      const targetRule = { ...updated[ruleIndex] };
      const targetTaxes = [...targetRule.taxes];
      targetTaxes[taxIndex] = {
        ...targetTaxes[taxIndex],
        [field]: value,
      };
      targetRule.taxes = targetTaxes;
      updated[ruleIndex] = targetRule;
      return updated;
    });
  };

  // Tax Preview Calculation Handler
  const handleCalculatePreview = async () => {
    setCalcLoading(true);
    try {
      const result = await CalculateTaxPreview({
        country: calcCountry,
        state_province: calcState,
        subtotal: calcAmount,
      });
      setCalcResult(result);
      toast.success("Tax calculated successfully");
    } catch (err: any) {
      console.warn("API preview failed, calculating locally:", err);
      // Local fallback calculation
      const matchingRule = destinationRules.find(
        (r) =>
          r.country.toUpperCase() === calcCountry.toUpperCase() &&
          r.state_province.toUpperCase() === calcState.toUpperCase()
      );

      let taxesToApply: Array<{ name: string; rate: number; amount: number; registration_number?: string }> = [];

      if (calculationBasis === "origin") {
        taxesToApply = originTaxes
          .filter((t) => t.is_enabled)
          .map((t) => ({
            name: t.name,
            rate: t.rate,
            amount: (calcAmount * t.rate) / 100,
            registration_number: t.registration_number,
          }));
      } else if (matchingRule) {
        taxesToApply = matchingRule.taxes
          .filter((t) => t.is_enabled)
          .map((t) => ({
            name: t.name,
            rate: t.rate,
            amount: (calcAmount * t.rate) / 100,
            registration_number: t.registration_number,
          }));
      } else if (unmatchedPolicy === "fallback_rate" && fallbackTax.rate > 0) {
        taxesToApply = [
          {
            name: fallbackTax.name,
            rate: fallbackTax.rate,
            amount: (calcAmount * fallbackTax.rate) / 100,
            registration_number: fallbackTax.registration_number,
          },
        ];
      }

      const totalTax = taxesToApply.reduce((sum, t) => sum + t.amount, 0);
      setCalcResult({
        country: calcCountry,
        state_province: calcState,
        subtotal: calcAmount,
        tax_amount: totalTax,
        total: calcAmount + totalTax,
        applied_taxes: taxesToApply,
      });
    } finally {
      setCalcLoading(false);
    }
  };

  const getCountryName = (code: string) => {
    const country = Country.getCountryByCode(code);
    return country ? country.name : code;
  };

  const getStateName = (countryCode: string, stateCode: string) => {
    const state = State.getStateByCodeAndCountry(stateCode, countryCode);
    return state ? state.name : stateCode;
  };

  const calculateTotalRuleRate = (taxes: TaxItem[]) => {
    const total = taxes
      .filter((t) => t.is_enabled)
      .reduce((sum, t) => sum + (Number(t.rate) || 0), 0);
    return total.toFixed(total % 1 === 0 ? 1 : 3);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#4290E9] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#666666] font-medium text-sm">Loading Tax Settings...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 font-alexandria">
      {/* ─── Unconfigured Notice Banner ───────────────────────────────────── */}
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">
              Automatic Canadian Place-of-Supply Fallback Active
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Custom tax rules have not been saved for this organization yet. The system is currently
              using default Canadian provincial tax rates. Saving your settings below will activate
              your custom tax configuration.
            </p>
          </div>
        </div>
      )}

      {/* ─── Hero / Header Card ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              backgroundColor: isEnabled ? `${accentColor}15` : "#F3F4F6",
              color: isEnabled ? accentColor : "#9CA3AF",
            }}
          >
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#111827]">Tax Settings</h1>
              <Badge
                variant="outline"
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                  isEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {isEnabled ? "Tax Calculation Active" : "Tax Calculation Disabled"}
              </Badge>
            </div>
            <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">
              Configure tenant organization tax calculation basis (Origin or Destination), regional
              tax components (GST, PST, HST), and fallback policies via <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">/api/tax-settings</code>.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCalcModalOpen(true)}
            className="h-9 px-3 text-xs font-medium border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            Tax Preview
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmPresetModal(true)}
            className="h-9 px-3 text-xs font-medium border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Load Canada Preset
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="h-9 px-3 text-xs font-medium border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5 text-[#4290E9]" />
            {showJsonPreview ? "Hide JSON" : "View JSON Payload"}
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-4 text-xs font-semibold bg-[#4290E9] hover:bg-[#327ac7] text-white shadow-sm flex items-center gap-1.5"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* ─── Master Toggle & Calculation Basis ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enable / Disable Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Master Switch
              </span>
              <h3 className="text-base font-semibold text-[#111827]">
                Enable Tax Calculation
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                When enabled, taxes will be automatically computed on checkout, orders, and
                invoices based on the active rules.
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              className="data-[state=unchecked]:bg-[#E5E7EB] data-[state=checked]:bg-[#4290E9] mt-1"
            />
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center gap-2 text-xs text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Applies to tenant orders and invoices</span>
          </div>
        </div>

        {/* Calculation Basis Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Tax Calculation Basis
              </span>
              <Badge className="bg-[#4290E9]/10 text-[#4290E9] border-none text-[11px] font-medium">
                {calculationBasis === "origin" ? "Example A: Origin Mode" : "Example B: Destination Mode"}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-[#111827]">
              Select Tax Calculation Basis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Destination Option (Example B) */}
              <div
                onClick={() => setCalculationBasis("destination")}
                className={`cursor-pointer rounded-lg p-4 border transition-all ${
                  calculationBasis === "destination"
                    ? "border-[#4290E9] bg-[#4290E9]/5 ring-1 ring-[#4290E9]"
                    : "border-[#E5E7EB] hover:border-[#D1D5DB] bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={`w-4 h-4 ${
                        calculationBasis === "destination" ? "text-[#4290E9]" : "text-[#6B7280]"
                      }`}
                    />
                    <span className="text-xs font-bold text-[#111827]">Destination-Based (Example B)</span>
                  </div>
                  {calculationBasis === "destination" && (
                    <CheckCircle2 className="w-4 h-4 text-[#4290E9]" />
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280] leading-tight">
                  Taxes calculated based on customer or property location (Country & Province/State rules).
                </p>
              </div>

              {/* Origin Option (Example A) */}
              <div
                onClick={() => setCalculationBasis("origin")}
                className={`cursor-pointer rounded-lg p-4 border transition-all ${
                  calculationBasis === "origin"
                    ? "border-[#4290E9] bg-[#4290E9]/5 ring-1 ring-[#4290E9]"
                    : "border-[#E5E7EB] hover:border-[#D1D5DB] bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Building2
                      className={`w-4 h-4 ${
                        calculationBasis === "origin" ? "text-[#4290E9]" : "text-[#6B7280]"
                      }`}
                    />
                    <span className="text-xs font-bold text-[#111827]">Origin-Based (Example A)</span>
                  </div>
                  {calculationBasis === "origin" && (
                    <CheckCircle2 className="w-4 h-4 text-[#4290E9]" />
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280] leading-tight">
                  Taxes calculated using your organization headquarters rate regardless of customer location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODE A: Origin-Based Taxes Section ───────────────────────────── */}
      {calculationBasis === "origin" && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#4290E9]" />
                <h2 className="text-base font-bold text-[#111827]">Origin Taxes Configuration</h2>
                <Badge className="bg-[#4290E9] text-white text-xs font-semibold px-2">
                  {originTaxes.length} {originTaxes.length === 1 ? "Tax" : "Taxes"}
                </Badge>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                Configure the tax rates and registration numbers applied on all orders based on your organization origin location.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleAddOriginTax}
              className="h-9 px-3.5 text-xs font-semibold bg-[#4290E9] hover:bg-[#327ac7] text-white shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Origin Tax
            </Button>
          </div>

          <div className="p-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F1F5F9] text-[#6B7280] uppercase tracking-wider font-semibold">
                  <th className="pb-2.5 pl-2 font-semibold">Tax Name</th>
                  <th className="pb-2.5 px-3 font-semibold w-36">Rate (%)</th>
                  <th className="pb-2.5 px-3 font-semibold">Registration / Tax Number</th>
                  <th className="pb-2.5 px-3 font-semibold text-center w-24">Status</th>
                  <th className="pb-2.5 pr-2 font-semibold text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {originTaxes.map((tax, taxIdx) => (
                  <tr key={tax.id || `origin-tax-${taxIdx}`} className="group hover:bg-[#F8FAFC]">
                    <td className="py-2.5 pl-2">
                      <Input
                        value={tax.name}
                        onChange={(e) => handleUpdateOriginTax(taxIdx, "name", e.target.value)}
                        placeholder="e.g. GST"
                        className="h-9 text-xs font-semibold text-[#111827] bg-white border-[#E2E8F0] focus:border-[#4290E9]"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={tax.rate}
                          onChange={(e) =>
                            handleUpdateOriginTax(taxIdx, "rate", parseFloat(e.target.value) || 0)
                          }
                          className="h-9 text-xs font-semibold text-[#111827] pr-7 bg-white border-[#E2E8F0] focus:border-[#4290E9]"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7280] pointer-events-none">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Input
                        value={tax.registration_number}
                        onChange={(e) =>
                          handleUpdateOriginTax(taxIdx, "registration_number", e.target.value)
                        }
                        placeholder="e.g. 123456789 RT0001"
                        className="h-9 text-xs text-[#374151] bg-white border-[#E2E8F0] focus:border-[#4290E9]"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={tax.is_enabled}
                          onCheckedChange={(checked) =>
                            handleUpdateOriginTax(taxIdx, "is_enabled", checked)
                          }
                          className="data-[state=unchecked]:bg-[#E5E7EB] data-[state=checked]:bg-[#4290E9]"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 pr-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOriginTax(taxIdx)}
                        disabled={originTaxes.length <= 1}
                        className="h-8 w-8 p-0 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODE B: Destination-Based Rules Section ──────────────────────── */}
      {calculationBasis === "destination" && (
        <>
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="p-5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-[#4290E9]" />
                  <h2 className="text-base font-bold text-[#111827]">Destination Tax Rules</h2>
                  <Badge className="bg-[#4290E9] text-white text-xs font-semibold px-2">
                    {destinationRules.length} {destinationRules.length === 1 ? "Rule" : "Rules"}
                  </Badge>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  Specify regional tax components (GST, PST, HST, QST) and registration numbers for each
                  country and province/state.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setAddRuleModalOpen(true)}
                className="h-9 px-3.5 text-xs font-semibold bg-[#4290E9] hover:bg-[#327ac7] text-white shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Destination Rule
              </Button>
            </div>

            {/* Rules Container */}
            <div className="p-5 space-y-5">
              {destinationRules.length === 0 ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-[#F3F4F6] text-[#9CA3AF] flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#111827]">No Destination Rules Configured</h4>
                  <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1 mb-4">
                    Add province/state specific tax rates or load standard Canadian tax rates to get
                    started.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      onClick={() => setConfirmPresetModal(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                      Load Canadian Standard Rates
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setAddRuleModalOpen(true)}
                      size="sm"
                      className="bg-[#4290E9] hover:bg-[#327ac7] text-white text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Custom Rule
                    </Button>
                  </div>
                </div>
              ) : (
                destinationRules.map((rule, ruleIdx) => {
                  const totalRate = calculateTotalRuleRate(rule.taxes);
                  const countryName = getCountryName(rule.country);
                  const stateName = getStateName(rule.country, rule.state_province);

                  return (
                    <div
                      key={rule.id || `rule-${ruleIdx}`}
                      className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-white shadow-xs hover:border-[#D1D5DB] transition-all"
                    >
                      {/* Rule Header */}
                      <div className="p-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#4290E9]/10 text-[#4290E9] flex items-center justify-center font-bold text-xs uppercase">
                            {rule.state_province}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-[#111827]">
                                {stateName} ({rule.state_province})
                              </h3>
                              <span className="text-xs text-[#6B7280]">•</span>
                              <span className="text-xs font-medium text-[#6B7280]">
                                {countryName} ({rule.country})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-[#6B7280]">
                                {rule.taxes.filter((t) => t.is_enabled).length} of {rule.taxes.length}{" "}
                                taxes active
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1">
                            Combined Rate: {totalRate}%
                          </Badge>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTaxItem(ruleIdx)}
                            className="h-8 px-2.5 text-xs text-[#4290E9] border-[#4290E9]/30 hover:bg-[#4290E9]/10 hover:text-[#4290E9] flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Tax
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDestinationRule(ruleIdx)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            title="Delete this region rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Taxes Grid / Table */}
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-[#F1F5F9] text-[#6B7280] uppercase tracking-wider font-semibold">
                              <th className="pb-2.5 pl-2 font-semibold">Tax Name</th>
                              <th className="pb-2.5 px-3 font-semibold w-32">Rate (%)</th>
                              <th className="pb-2.5 px-3 font-semibold">Registration / Tax Number</th>
                              <th className="pb-2.5 px-3 font-semibold text-center w-24">Status</th>
                              <th className="pb-2.5 pr-2 font-semibold text-right w-16">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9]">
                            {rule.taxes.map((tax, taxIdx) => (
                              <tr key={tax.id || `tax-${ruleIdx}-${taxIdx}`} className="group hover:bg-[#F8FAFC]">
                                <td className="py-2.5 pl-2">
                                  <Input
                                    value={tax.name}
                                    onChange={(e) =>
                                      handleUpdateTaxItem(ruleIdx, taxIdx, "name", e.target.value)
                                    }
                                    placeholder="e.g. GST, PST, HST"
                                    className="h-9 text-xs font-semibold text-[#111827] bg-white border-[#E2E8F0] focus:border-[#4290E9]"
                                  />
                                </td>

                                <td className="py-2.5 px-3">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="0.001"
                                      min="0"
                                      max="100"
                                      value={tax.rate}
                                      onChange={(e) =>
                                        handleUpdateTaxItem(
                                          ruleIdx,
                                          taxIdx,
                                          "rate",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="h-9 text-xs font-semibold text-[#111827] pr-7 bg-white border-[#E2E8F0] focus:border-[#4290E9]"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7280] pointer-events-none">
                                      %
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3">
                                  <Input
                                    value={tax.registration_number}
                                    onChange={(e) =>
                                      handleUpdateTaxItem(
                                        ruleIdx,
                                        taxIdx,
                                        "registration_number",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. 123456789 RT0001"
                                    className="h-9 text-xs text-[#374151] bg-white border-[#E2E8F0] focus:border-[#4290E9]"
                                  />
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center">
                                    <Switch
                                      checked={tax.is_enabled}
                                      onCheckedChange={(checked) =>
                                        handleUpdateTaxItem(ruleIdx, taxIdx, "is_enabled", checked)
                                      }
                                      className="data-[state=unchecked]:bg-[#E5E7EB] data-[state=checked]:bg-[#4290E9]"
                                    />
                                  </div>
                                </td>

                                <td className="py-2.5 pr-2 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveTaxItem(ruleIdx, taxIdx)}
                                    disabled={rule.taxes.length <= 1}
                                    className="h-8 w-8 p-0 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30"
                                    title={
                                      rule.taxes.length <= 1
                                        ? "At least one tax is required"
                                        : "Delete tax item"
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ─── Unmatched Policy & Fallback Tax Section ──────────────────── */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#111827]">
                Unmatched Destination Policy & Fallback Tax
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Determine how taxes should be calculated when an order destination does not match any
                configured destination rule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policy Choice Cards */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Policy for Unmatched Locations
                </Label>

                {/* Zero Tax Option */}
                <div
                  onClick={() => setUnmatchedPolicy("zero_tax")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    unmatchedPolicy === "zero_tax"
                      ? "border-[#4290E9] bg-[#4290E9]/5 ring-1 ring-[#4290E9]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#111827]">Zero Tax (zero_tax)</span>
                    {unmatchedPolicy === "zero_tax" && (
                      <CheckCircle2 className="w-4 h-4 text-[#4290E9]" />
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Do not charge tax on orders outside configured destination rules (0.0% rate applied).
                  </p>
                </div>

                {/* Fallback Rate Option */}
                <div
                  onClick={() => setUnmatchedPolicy("fallback_rate")}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    unmatchedPolicy === "fallback_rate"
                      ? "border-[#4290E9] bg-[#4290E9]/5 ring-1 ring-[#4290E9]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#111827]">
                      Fallback Rate (fallback_rate)
                    </span>
                    {unmatchedPolicy === "fallback_rate" && (
                      <CheckCircle2 className="w-4 h-4 text-[#4290E9]" />
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Apply a default fallback tax rate when an order location is unknown or unlisted.
                  </p>
                </div>
              </div>

              {/* Fallback Tax Parameters */}
              <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Fallback Tax Configuration
                  </span>
                  {unmatchedPolicy === "fallback_rate" ? (
                    <Badge className="bg-[#4290E9] text-white text-[10px]">Active Fallback</Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 text-[10px]">
                      Inactive (Zero Tax Selected)
                    </Badge>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-[#374151]">Fallback Tax Name</Label>
                  <Input
                    value={fallbackTax.name}
                    onChange={(e) => setFallbackTax((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Tax, Standard Tax"
                    className="mt-1 h-9 text-xs bg-white"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-[#374151]">
                    Fallback Rate (%)
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={fallbackTax.rate}
                      onChange={(e) =>
                        setFallbackTax((prev) => ({
                          ...prev,
                          rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0.0"
                      className="h-9 text-xs pr-7 bg-white"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7280] pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-[#374151]">
                    Registration / Tax Number (Optional)
                  </Label>
                  <Input
                    value={fallbackTax.registration_number}
                    onChange={(e) =>
                      setFallbackTax((prev) => ({ ...prev, registration_number: e.target.value }))
                    }
                    placeholder="e.g. 123456789 RT0001"
                    className="mt-1 h-9 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── JSON Payload Inspector (Collapsible) ────────────────────────── */}
      {showJsonPreview && (
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-5 shadow-md text-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Request Payload Preview (POST /api/tax-settings)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              className="h-7 px-2.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 flex items-center gap-1.5"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>
          <pre className="mt-4 text-xs font-mono bg-[#0F172A] p-4 rounded-lg overflow-x-auto text-emerald-400 leading-relaxed max-h-80">
            {JSON.stringify(currentPayload, null, 2)}
          </pre>
        </div>
      )}

      {/* ─── Bottom Action Bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
        <div className="text-xs text-[#6B7280]">
          {calculationBasis === "origin"
            ? `Origin mode active with ${originTaxes.length} tax component(s)`
            : `${destinationRules.length} regional destination ${destinationRules.length === 1 ? "rule" : "rules"} configured`}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadSettings}
            disabled={isLoading || isSaving}
            className="h-9 px-3.5 text-xs border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-5 text-xs font-semibold bg-[#4290E9] hover:bg-[#327ac7] text-white shadow-sm flex items-center gap-1.5"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Tax Settings
          </Button>
        </div>
      </div>

      {/* ─── Add Destination Rule Modal ───────────────────────────────────── */}
      <Dialog open={addRuleModalOpen} onOpenChange={setAddRuleModalOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-xl font-alexandria">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#111827]">
              Add Destination Rule
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Select the country and state/province to configure specific tax rates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <Label className="text-xs font-semibold text-[#374151]">Country</Label>
              <Select
                value={selectedCountry}
                onValueChange={(val) => {
                  setSelectedCountry(val);
                  setSelectedState("");
                }}
              >
                <SelectTrigger className="w-full mt-1 text-xs h-9 bg-white border-[#E2E8F0]">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {allCountries.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-xs">
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#374151]">State / Province</Label>
              {availableStates.length > 0 ? (
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full mt-1 text-xs h-9 bg-white border-[#E2E8F0]">
                    <SelectValue placeholder="Select Province / State" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableStates.map((s) => (
                      <SelectItem key={s.code} value={s.code} className="text-xs">
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value.toUpperCase())}
                  placeholder="Enter state/province code (e.g. BC, NY)"
                  className="mt-1 text-xs h-9"
                />
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddRuleModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddDestinationRule}
              className="bg-[#4290E9] hover:bg-[#327ac7] text-white text-xs font-semibold"
            >
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Load Canadian Preset Modal ───────────────────────────── */}
      <Dialog open={confirmPresetModal} onOpenChange={setConfirmPresetModal}>
        <DialogContent className="max-w-md bg-white p-6 rounded-xl font-alexandria">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-[#111827]">
              Load Standard Canadian Tax Rates?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              This will populate standard Canadian tax rules for BC (GST 5% + PST 7%), ON (HST 13%),
              AB (GST 5%), QC (GST 5% + QST 9.975%), SK, MB, NS, NB, NL, PE, and Territories in
              Destination-Based mode.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmPresetModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePreloadCanada}
              className="bg-[#4290E9] hover:bg-[#327ac7] text-white text-xs font-semibold"
            >
              Load Preset Rates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Tax Calculation Preview Modal ───────────────────────────────── */}
      <Dialog open={calcModalOpen} onOpenChange={setCalcModalOpen}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-xl font-alexandria">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Calculator className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-[#111827]">
              Tax Calculation Preview
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Test real-time tax calculation for an order based on destination location and subtotal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#374151]">Country</Label>
                <Select
                  value={calcCountry}
                  onValueChange={(val) => {
                    setCalcCountry(val);
                    setCalcState("");
                  }}
                >
                  <SelectTrigger className="w-full mt-1 text-xs h-9 bg-white">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {allCountries.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-xs">
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#374151]">Province / State</Label>
                {calcAvailableStates.length > 0 ? (
                  <Select value={calcState} onValueChange={setCalcState}>
                    <SelectTrigger className="w-full mt-1 text-xs h-9 bg-white">
                      <SelectValue placeholder="Province / State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {calcAvailableStates.map((s) => (
                        <SelectItem key={s.code} value={s.code} className="text-xs">
                          {s.name} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={calcState}
                    onChange={(e) => setCalcState(e.target.value.toUpperCase())}
                    placeholder="e.g. BC"
                    className="mt-1 text-xs h-9"
                  />
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#374151]">Order Subtotal ($)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7280]">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                  className="pl-7 text-xs h-9"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleCalculatePreview}
              disabled={calcLoading}
              className="w-full bg-[#4290E9] hover:bg-[#327ac7] text-white text-xs font-semibold h-9"
            >
              {calcLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Calculator className="w-4 h-4 mr-1.5" />
              )}
              Compute Preview
            </Button>

            {/* Calculation Result */}
            {calcResult && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3 mt-3">
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#111827]">${calcResult.subtotal.toFixed(2)}</span>
                </div>

                {calcResult.applied_taxes && calcResult.applied_taxes.length > 0 ? (
                  calcResult.applied_taxes.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[#374151]">{t.name} ({t.rate}%)</span>
                        {t.registration_number && (
                          <span className="text-[10px] text-[#9CA3AF]">[{t.registration_number}]</span>
                        )}
                      </div>
                      <span className="font-semibold text-[#111827]">${Number(t.amount).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#6B7280] italic">No taxes applied (0%)</div>
                )}

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-sm font-bold text-[#111827]">
                  <span>Total Amount</span>
                  <span className="text-[#4290E9]">${Number(calcResult.total).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCalcModalOpen(false)}
              className="text-xs w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

TaxSettings.displayName = "TaxSettings";

export default TaxSettings;
