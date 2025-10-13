import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PopupProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  success: boolean;
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PayInvoiceModal({ open, setOpen, success, setSuccess }: PopupProps) {
  const [loading, setLoading] = useState(false);
console.log('success',success);

  const handlePayService = async () => {
    setLoading(true);
    setSuccess(false);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 900);
  };

  const handlePayFull = async () => {
    setLoading(true);
    setSuccess(false);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[420px] md:w-[480px] p-6 rounded-[6px] shadow-2xl font-alexandria">
        <div className="flex items-start justify-between mb-4 border-gray-400 border-b-[1px] pb-3">
          <DialogHeader className="p-0">
            <DialogTitle className="text-[#6BAE41] font-[600] text-lg">PAY INVOICE</DialogTitle>
          </DialogHeader>
        </div>

        <div className="min-h-[180px] flex flex-col items-center justify-center gap-6">
          {success ? (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full p-4 bg-green-100">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Payment Successful</h3>
              <p className="text-sm text-gray-600">Thank you — the invoice has been paid.</p>
              <Button
                onClick={() => {
                  setOpen(false);
                }}
                className="mt-4 bg-[#6BAE41] hover:bg-[#5fa43a] text-white"
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <Button
                onClick={handlePayService}
                disabled={loading}
                className="w-64 h-11 rounded-[6px] bg-[#6BAE41] hover:bg-[#5fa43a] text-white shadow-md"
              >
                {loading ? "Processing..." : "Pay Service Invoice"}
              </Button>

              <Button
                onClick={handlePayFull}
                disabled={loading}
                className="w-64 h-11 rounded-[6px] bg-[#6BAE41] hover:bg-[#5fa43a] text-white shadow-md"
              >
                {loading ? "Processing..." : "Pay Full Invoice"}
              </Button>

              <div className="w-full flex justify-start border-gray-400 border-t-[1px]">
                <button
                  onClick={() => setOpen(false)}
                  className="mt-3 px-6 py-2 rounded-md border border-[#6BAE41] text-[#6BAE41]"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
