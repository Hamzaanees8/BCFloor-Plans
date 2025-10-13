import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addPayment: (payment: {
    payment_type: string;
    cheque_number?: string;
    bank_name?: string;
    transfer_ref?: string;
    notes?: string;
  }) => void;
}

const ManualPayment: React.FC<Props> = ({ open, setOpen, addPayment }) => {
  const [paymentType, setPaymentType] = useState<string>("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [notes, setNotes] = useState("");

  const { userType } = useAppContext();

  // Format cheque number with spaces for readability
  const formatChequeNumber = (val: string) => {
    const digits = val.replace(/\D/g, ""); // only digits
    return digits.replace(/(\d{4})(?=\d)/g, "$1 "); // space after every 4 digits
  };

  // Format transfer ref as uppercase alphanumeric
  const formatTransferRef = (val: string) => {
    return val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  };

  const handleAdd = () => {
    if (!paymentType) {
      toast.error("Please select a payment type");
      return;
    }

    // Validation for cheque
    if (paymentType === "cheque") {
      const rawCheque = chequeNumber.replace(/\s/g, "");
      if (rawCheque.length < 6) {
        toast.error("Cheque number must be at least 6 digits");
        return;
      }
      if (!/^\d+$/.test(rawCheque)) {
        toast.error("Cheque number must be numeric only");
        return;
      }
      if (!bankName.trim()) {
        toast.error("Bank name is required for cheque payments");
        return;
      }
    }

    // Validation for bank transfer
    if (paymentType === "bank_transfer") {
      if (transferRef.trim().length < 6) {
        toast.error("Transfer reference must be at least 6 characters");
        return;
      }
    }

    addPayment({
      payment_type: paymentType,
      cheque_number: chequeNumber || undefined,
      bank_name: bankName || undefined,
      transfer_ref: transferRef || undefined,
      notes: notes || undefined,
    });

    toast.success("Payment added successfully!");

    // reset state
    setPaymentType("");
    setChequeNumber("");
    setBankName("");
    setTransferRef("");
    setNotes("");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md rounded-xl p-6 font-alexandria">
        <AlertDialogHeader>
          <AlertDialogTitle
            className={`flex items-center justify-between ${userType}-text text-[18px] font-[600]`}
          >
            MANUAL PAYMENT
            <AlertDialogCancel className="border-none !shadow-none">
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </AlertDialogCancel>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Payment Type */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              Payment Type
            </Label>
            <Select onValueChange={setPaymentType} value={paymentType}>
              <SelectTrigger className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]">
                <SelectValue placeholder="Select Payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields */}
          {paymentType === "cheque" && (
            <>
              <div className="space-y-1">
                <Label>Cheque Number</Label>
                <Input
                  value={chequeNumber}
                  onChange={(e) =>
                    setChequeNumber(formatChequeNumber(e.target.value))
                  }
                  placeholder="Enter Cheque Number"
                  maxLength={20}
                  className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                />
              </div>
              <div className="space-y-1">
                <Label>Bank Name</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter Bank Name"
                  className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
                />
              </div>
            </>
          )}

          {paymentType === "bank_transfer" && (
            <div className="space-y-1">
              <Label>Transfer Reference</Label>
              <Input
                value={transferRef}
                onChange={(e) =>
                  setTransferRef(formatTransferRef(e.target.value))
                }
                placeholder="Enter Transfer Reference"
                maxLength={20}
                className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px]"
              />
            </div>
          )}

          {/* Notes for all */}
          <div className="space-y-1">
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter Notes"
              className="w-full h-16 border rounded-md p-2 text-sm resize-none bg-[#EEEEEE] border-[#BBBBBB]"
            />
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-between gap-[5px] mt-2 font-alexandria">
          <AlertDialogCancel
            className={`bg-white w-full md:w-[170px] h-[44px] font-[400] ${userType}-border ${userType}-text ${userType}-button hover-${userType}-bg`}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAdd}
            className={`${userType}-bg text-white hover-${userType}-bg w-full md:w-[170px] h-[44px] font-[400]`}
          >
            Add Payment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ManualPayment;
