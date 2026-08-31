"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Loader2, Calendar, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { MatterportAd, RenewMatterport, RenewalPlan } from "@/app/dashboard/matterport/matterport";


interface MatterportRenewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourItem: MatterportAd | null;
  onSuccess: () => void;
  renewalPlans?: RenewalPlan[];
  isAgentView?: boolean;
}

const defaultPlans: RenewalPlan[] = [
  { id: "3_months", months: 3, label: "3 Months", price: 35 },
  { id: "6_months", months: 6, label: "6 Months", price: 60 },
  { id: "12_months", months: 12, label: "1 Year (12 Months)", price: 100 },
];

export default function MatterportRenewModal({
  open,
  onOpenChange,
  tourItem,
  onSuccess,
  renewalPlans = defaultPlans,
  isAgentView = false,
}: MatterportRenewModalProps) {
  const plans = renewalPlans && renewalPlans.length > 0 ? renewalPlans : defaultPlans;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[1]?.id || plans[0]?.id || "6_months");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>(isAgentView ? "invoice" : "manual");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const finalPrice = customPrice !== "" ? parseFloat(customPrice) || 0 : (selectedPlan?.price ?? 60);

  useEffect(() => {
    if (plans.length > 0) {
      const defaultP = plans[1] || plans[0];
      setSelectedPlanId(defaultP.id);
      setCustomPrice(String(defaultP.price));
    }
  }, [tourItem, plans]);

  const calculateNewExpiry = () => {
    const months = selectedPlan?.months || 6;
    let base = new Date();
    if (tourItem?.rawExpiryDate) {
      const currentExpiry = new Date(tourItem.rawExpiryDate);
      if (currentExpiry > new Date()) {
        base = currentExpiry;
      }
    }
    const newDate = new Date(base);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleRenew = async () => {
    if (!tourItem) return;
    const token = localStorage.getItem("token") || "";
    if (!token) {
      toast.error("You must be logged in to perform this action.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        duration_months: selectedPlan?.months || 6,
        amount: finalPrice,
        payment_method: paymentMethod,
        notes: notes,
      };

      const res = await RenewMatterport(token, tourItem.tourUuid || tourItem.orderuud, payload);
      if (res.success) {
        toast.success(res.message || "Matterport hosting successfully renewed!");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.message || "Failed to renew hosting.");
      }
    } catch (err: any) {
      console.error("Renewal error:", err);
      toast.error(err.response?.data?.message || "An error occurred while renewing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-xl p-6 shadow-2xl border border-gray-100 font-alexandria">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Renew 3D Tour / Matterport Hosting
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500">
            Extend hosting duration and update public 3D tour status.
          </DialogDescription>
        </DialogHeader>

        {tourItem && (
          <div className="space-y-4">
            {/* Tour Info Card */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Property:</span>
                <span className="text-gray-900 font-semibold truncate max-w-[220px]">
                  {tourItem.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Agent:</span>
                <span className="text-gray-800">{tourItem.agentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Current Expiry:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-900 font-semibold">{tourItem.renewalDate}</span>
                  {tourItem.status === "EXPIRED" ? (
                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                      Expired
                    </span>
                  ) : tourItem.status === "EXPIRING_SOON" ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                      Expiring Soon
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Plan Selection Tiers */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Select Renewal Extension</Label>
              <div className="grid grid-cols-3 gap-2">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPlanId(p.id);
                        setCustomPrice(String(p.price));
                      }}
                      className={`cursor-pointer p-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "border-[#4290E9] bg-blue-50/50 shadow-xs"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-800">{p.label}</div>
                      <div className="text-sm font-extrabold text-[#4290E9] mt-1">
                        ${Number(p.price).toFixed(0)} <span className="text-[10px] font-normal text-gray-500">CAD</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* New Expiration Preview */}
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>New Expiry Date:</span>
              </div>
              <span className="font-bold text-emerald-900">{calculateNewExpiry()}</span>
            </div>

            {/* Payment & Amount details for Admin */}
            {!isAgentView ? (
              <div className="space-y-3 pt-1 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Amount ($ CAD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Payment Handling</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Mark Paid (Manual/Cash)</SelectItem>
                        <SelectItem value="invoice">Generate Invoice</SelectItem>
                        <SelectItem value="stripe">Charge Card (Stripe)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Notes (Optional)</Label>
                  <Input
                    placeholder="e.g. Agent requested 6mo extension"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-xs text-gray-500">
                <p>
                  Total Due: <strong className="text-gray-900">${finalPrice.toFixed(2)} CAD</strong> (+ applicable GST/PST).
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-9 text-xs font-medium px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRenew}
                disabled={loading}
                className="h-9 text-xs font-bold px-5 bg-[#4290E9] hover:bg-[#357ac8] text-white flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirm & Renew
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
