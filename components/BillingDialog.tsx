// components/BillingDialog.tsx
"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useAppContext } from "@/app/context/AppContext"

type Props = {
  open: boolean
  setOpen: (value: boolean) => void
  onConfirm: () => void
  showAgain: boolean
  toggleShowAgain: () => void
}

const BillingDialog: React.FC<Props> = ({
  open,
  setOpen,
  onConfirm,
}) => {
  const { userType } = useAppContext()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[320px] md:w-[593px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria [&>button]:hidden"
        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
      >
        <DialogHeader className="mb-2">
          <DialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] uppercase font-[600] border-b-[1px] border-[#BBBBBB] pb-2`}>
            Status: Arrears
            <Button variant="ghost" className="p-0 h-auto hover:bg-transparent" onClick={() => setOpen(false)}>
              <X className=" cursor-pointer text-[#7D7D7D] hover:text-[#4290E9]" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3">
          <DialogDescription className="text-[14px] font-[400] text-[#7D7D7D] ">
            <p className="mb-3 font-[400] text-[16px]">Musawar Ahmed account is in arrears.</p>
            <p className="mb-3"><span className="text-[#E06D5E] font-semibold">$430.80</span> is owed since Mar 3, 2025.</p>
            <p className="">Automated reminder emails have been sent.</p>
          </DialogDescription>
        </div>


        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria border-t-[1px] border-[#BBBBBB] pt-[16px]">
          <Button onClick={() => setOpen(false)} className={`bg-white w-full md:w-[170px] py-[12px] text-[20px] font-[400] ${userType}-border ${userType}-text hover-${userType}-bg hover:text-[#ffffff] font-raleway focus-visible:ring-0`}>
            Cancel
          </Button>
          <Button
            className={`${userType}-bg hover:text-white text-white hover-${userType}-bg w-full  md:w-[170px] py-[12px] font-[400] text-[20px] font-raleway focus-visible:ring-0`}
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            View Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BillingDialog
