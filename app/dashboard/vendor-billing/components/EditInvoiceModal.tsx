"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save, X } from "lucide-react";
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";
import { vendorBillingService, VendorInvoice } from "../VendorBillingService";
import { toast } from "sonner";

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: VendorInvoice | null;
  onSuccess: () => void;
  roleSettings: any;
}

export default function EditInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
  roleSettings,
}: EditInvoiceModalProps) {
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Normalise vendor `lines[]` -> `items[]` for InvoiceDocument
  useEffect(() => {
    if (!invoice) return;

    const rawTaxNumber = invoice.tax_number || invoice.vendor?.tax_number || invoice.vendor?.settings?.tax_number || "";
    const cleanTax = rawTaxNumber
      .replace(/^(GST\/HST:\s*|GST:\s*|PST:\s*|QST:\s*|US State Tax ID:\s*|Tax ID:\s*)/i, "")
      .replace(/^GST\s*:\s*/i, "")
      .replace(/^PST\s*:\s*/i, "")
      .replace(/^HST\s*:\s*/i, "")
      .trim();

    const taxType = invoice.tax_type || invoice.vendor?.settings?.tax_type || "GST";
    const taxRate = parseFloat(String(invoice.tax_rate ?? 5)) || 0;

    const rawLines = (invoice.lines && invoice.lines.length > 0) ? invoice.lines : ((invoice as any).items || []);
    const items = rawLines.map((line: any) => {
      const qty = parseFloat(String(line.quantity ?? 1)) || 1;
      const rawAmount = parseFloat(String(line.amount ?? 0)) || 0;
      const rawUnitPrice = parseFloat(String(line.unit_price ?? 0)) || 0;
      const unit_price = rawUnitPrice > 0 ? rawUnitPrice : (rawAmount > 0 ? rawAmount / qty : 0);
      const amount = rawAmount > 0 ? rawAmount : (qty * unit_price);
      const isTaxable = line.is_taxable !== undefined ? Boolean(line.is_taxable) : true;
      const gstEnabled = line.gst_enabled !== undefined ? Boolean(line.gst_enabled) : isTaxable;
      const pstEnabled = line.pst_enabled !== undefined ? Boolean(line.pst_enabled) : (isTaxable && (taxType === "GST_PST" || Boolean(line.pst_enabled)));

      return {
        id: line.id,
        uuid: line.uuid,
        description: line.description || "",
        quantity: qty,
        unit_price: unit_price,
        amount: amount,
        type: line.type || "service",
        is_taxable: isTaxable,
        gst_enabled: gstEnabled,
        pst_enabled: pstEnabled,
        order_service_id: line.order_service_id ?? null,
      };
    });

    const vendorDetails = invoice.vendor_details || {
      first_name: invoice.vendor?.first_name || "",
      last_name: invoice.vendor?.last_name || "",
      name: invoice.vendor ? `${invoice.vendor.first_name || ""} ${invoice.vendor.last_name || ""}`.trim() : "",
      company_name: invoice.vendor?.company?.name || invoice.vendor?.company_name || "",
      email: invoice.vendor?.email || "",
      phone: invoice.vendor?.phone || "",
      address: invoice.vendor?.addresses?.[0] ? `${invoice.vendor.addresses[0].address_line_1 || ""}, ${invoice.vendor.addresses[0].city || ""}` : "",
      tax_number: cleanTax,
      tax_type: taxType,
      tax_rate: taxRate,
    };

    const orgDetails = invoice.org_details || {
      id: invoice.organization_id || invoice.organization?.id,
      name: invoice.organization?.name || "BC Floor plans",
      email: invoice.organization?.contact_email || invoice.organization?.from_email || "info@bcfloorplans.com",
      phone: invoice.organization?.phone || "",
      address: invoice.organization?.address || "",
    };

    const initialTotals = recalculateTotals(
      items,
      taxRate,
      taxType,
      invoice.tax_details,
      (invoice.vendor?.addresses?.[0]?.province || "BC")
    );

    setEditData({
      ...invoice,
      items,
      vendor_details: { ...vendorDetails, tax_number: cleanTax },
      org_details: orgDetails,
      tax_rate: taxRate,
      tax_type: taxType,
      tax_number: cleanTax,
      ...initialTotals,
      notes: invoice.notes || "",
    });
  }, [invoice]);

  const recalculateTotals = (
    items: any[],
    taxRate: number,
    taxType: string = "GST",
    existingTaxDetails: any = null,
    province: string = "BC"
  ) => {
    const subtotal = items
      .filter((i: any) => i.type === "service")
      .reduce(
        (acc: number, item: any) =>
          acc + (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || item.amount || 0)) || 0),
        0
      );

    const travelAmount = items
      .filter((i: any) => i.type === "travel")
      .reduce(
        (acc: number, item: any) =>
          acc + (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || item.amount || 0)) || 0),
        0
      );

    const totalLines = items.reduce(
      (acc: number, item: any) =>
        acc + (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || item.amount || 0)) || 0),
      0
    );

    const normalizedProv = (province || "BC").toUpperCase().trim();
    const isHstProvince = ["ON", "ONTARIO", "NB", "NEW BRUNSWICK", "NL", "NEWFOUNDLAND", "NS", "NOVA SCOTIA", "PE", "PRINCE EDWARD ISLAND"].includes(normalizedProv);
    const hasPst = ["BC", "BRITISH COLUMBIA", "SK", "SASKATCHEWAN", "MB", "MANITOBA", "QC", "QUEBEC"].includes(normalizedProv);

    const gstRate = 5.0;
    const pstRate = normalizedProv === "QC" ? 9.975 : (normalizedProv === "SK" ? 6.0 : 7.0);

    let gstSum = 0;
    let pstSum = 0;
    let singleTaxSum = 0;

    items.forEach((item: any) => {
      const lineAmt = (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || item.amount || 0))) || 0;
      const isGst = item.gst_enabled !== undefined ? Boolean(item.gst_enabled) : (item.is_taxable !== undefined ? Boolean(item.is_taxable) : true);
      const isPst = item.pst_enabled !== undefined ? Boolean(item.pst_enabled) : false;

      if (isHstProvince) {
        if (isGst) singleTaxSum += lineAmt * (taxRate / 100);
      } else if (hasPst && (taxType === "GST_PST" || isPst || (existingTaxDetails && existingTaxDetails.PST))) {
        if (isGst) gstSum += lineAmt * (gstRate / 100);
        if (isPst) pstSum += lineAmt * (pstRate / 100);
      } else {
        if (isGst) singleTaxSum += lineAmt * (taxRate / 100);
      }
    });

    if (travelAmount > 0 && taxRate > 0) {
      if (isHstProvince) {
        singleTaxSum += travelAmount * (taxRate / 100);
      } else if (hasPst && (taxType === "GST_PST" || (existingTaxDetails && existingTaxDetails.PST))) {
        gstSum += travelAmount * (gstRate / 100);
      } else {
        singleTaxSum += travelAmount * (taxRate / 100);
      }
    }

    let calculatedTaxDetails: any = null;
    let totalTax = 0;

    if (hasPst && (taxType === "GST_PST" || pstSum > 0 || (existingTaxDetails && existingTaxDetails.PST))) {
      calculatedTaxDetails = {
        "GST": { rate: gstRate, amount: parseFloat(gstSum.toFixed(2)) },
        "PST": { rate: pstRate, amount: parseFloat(pstSum.toFixed(2)) },
      };
      totalTax = gstSum + pstSum;
    } else if (isHstProvince) {
      calculatedTaxDetails = {
        "HST": { rate: taxRate, amount: parseFloat(singleTaxSum.toFixed(2)) },
      };
      totalTax = singleTaxSum;
    } else {
      calculatedTaxDetails = {
        [taxType || "GST"]: { rate: taxRate, amount: parseFloat(singleTaxSum.toFixed(2)) },
      };
      totalTax = singleTaxSum;
    }

    return {
      subtotal: subtotal.toFixed(2),
      travel_amount: travelAmount.toFixed(2),
      tax_amount: totalTax.toFixed(2),
      total: (totalLines + totalTax).toFixed(2),
      tax_details: calculatedTaxDetails,
    };
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...editData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      const qty = parseFloat(String(newItems[index].quantity || 1)) || 1;
      const unitPrice = parseFloat(String(newItems[index].unit_price || 0)) || 0;
      newItems[index].amount = (qty * unitPrice).toFixed(2);
    }
    if (field === "gst_enabled" || field === "pst_enabled") {
      newItems[index].is_taxable = Boolean(newItems[index].gst_enabled || newItems[index].pst_enabled);
    }
    const totals = recalculateTotals(
      newItems,
      parseFloat(String(editData.tax_rate || 0)) || 0,
      editData.tax_type || "GST",
      editData.tax_details,
      (editData.vendor?.addresses?.[0]?.province || "BC")
    );
    setEditData({ ...editData, items: newItems, ...totals });
  };

  const addItem = () => {
    const newItem = {
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0,
      type: "service",
      is_taxable: true,
      gst_enabled: true,
      pst_enabled: editData.tax_type === "GST_PST",
      order_service_id: null,
    };
    const newItems = [...editData.items, newItem];
    const totals = recalculateTotals(
      newItems,
      parseFloat(String(editData.tax_rate || 0)) || 0,
      editData.tax_type || "GST",
      editData.tax_details,
      (editData.vendor?.addresses?.[0]?.province || "BC")
    );
    setEditData({ ...editData, items: newItems, ...totals });
  };

  const removeItem = (index: number) => {
    const newItems = editData.items.filter((_: any, i: number) => i !== index);
    const totals = recalculateTotals(
      newItems,
      parseFloat(String(editData.tax_rate || 0)) || 0,
      editData.tax_type || "GST",
      editData.tax_details,
      (editData.vendor?.addresses?.[0]?.province || "BC")
    );
    setEditData({ ...editData, items: newItems, ...totals });
  };

  const updateTaxRate = (val: string) => {
    const rate = parseFloat(val) || 0;
    const totals = recalculateTotals(
      editData.items,
      rate,
      editData.tax_type || "GST",
      editData.tax_details,
      (editData.vendor?.addresses?.[0]?.province || "BC")
    );
    setEditData({ ...editData, tax_rate: val, ...totals });
  };

  const updateTaxType = (val: string) => {
    const totals = recalculateTotals(
      editData.items,
      parseFloat(String(editData.tax_rate || 0)) || 0,
      val,
      editData.tax_details,
      (editData.vendor?.addresses?.[0]?.province || "BC")
    );
    setEditData({ ...editData, tax_type: val, ...totals });
  };

  const handleSave = async () => {
    if (!editData || !invoice) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      const payload = {
        notes: editData.notes,
        tax_rate: editData.tax_rate,
        tax_type: editData.tax_type,
        tax_number: editData.tax_number,
        vendor_details: editData.vendor_details,
        org_details: editData.org_details,
        tax_details: editData.tax_details,
        lines: editData.items.map((item: any) => {
          const qty = parseFloat(String(item.quantity ?? 1)) || 1;
          const rawPrice = parseFloat(String(item.unit_price ?? 0)) || 0;
          const rawAmount = parseFloat(String(item.amount ?? 0)) || 0;
          const unit_price = rawPrice > 0 ? rawPrice : (rawAmount > 0 ? rawAmount / qty : 0);
          const amount = rawAmount > 0 ? rawAmount : (qty * unit_price);

          return {
            id: item.id,
            uuid: item.uuid,
            description: item.description,
            quantity: qty,
            unit_price: unit_price,
            amount: amount,
            type: item.type || "service",
            is_taxable: item.is_taxable !== undefined ? Boolean(item.is_taxable) : true,
            order_service_id: item.order_service_id || null,
          };
        }),
      };
      await vendorBillingService.updateInvoice(invoice.uuid, payload as any, token);
      toast.success("Invoice updated successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Update failed:", err);
      toast.error(err.response?.data?.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  if (!editData || !invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={saving ? undefined : onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-[90vw] p-4 sm:p-6">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3 pr-8">
          <DialogTitle
            className="text-base sm:text-xl font-bold text-left"
            style={{ color: roleSettings.pageTabColor }}
          >
            Edit Vendor Invoice: {invoice.invoice_number || invoice.id}
          </DialogTitle>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 gap-2 flex-1 sm:flex-none justify-center"
              onClick={onClose}
              disabled={saving}
            >
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button
              size="sm"
              className="h-9 px-5 gap-2 text-white hover:brightness-110 active:scale-[0.98] transition-all flex-1 sm:flex-none justify-center"
              style={{ backgroundColor: roleSettings.pageTabColor }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          <InvoiceDocument
            invoice={editData}
            editData={editData}
            setEditData={setEditData}
            isEditing={true}
            updateItem={updateItem}
            addItem={addItem}
            removeItem={removeItem}
            updateTaxRate={updateTaxRate}
            updateTaxType={updateTaxType}
            roleSettings={roleSettings}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
