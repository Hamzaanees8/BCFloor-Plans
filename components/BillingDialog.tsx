// components/BillingDialog.tsx
"use client"

import React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="w-[320px] md:w-[593px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
        <AlertDialogHeader className="mb-2">
          <AlertDialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] uppercase font-[600] border-b-[1px] border-[#BBBBBB] pb-2`}>
            Status: Arrears
            <AlertDialogCancel className="border-none !shadow-none !w-[12px] !h-[12px] !p-0 hover:bg-transparent">
              <X className=" cursor-pointer text-[#7D7D7D] hover:text-[#4290E9]" />
            </AlertDialogCancel>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex items-start gap-3">
          <AlertDialogDescription className="text-[14px] font-[400] text-[#7D7D7D] ">
            <p className="mb-3 font-[400] text-[16px]">Janet Janetson account is in arrears.</p>
            <p className="mb-3"><span className="text-[#E06D5E] font-semibold">$430.80</span> is owed since Mar 3, 2025.</p>
            <p className="">Automated reminder emails have been sent.</p>
          </AlertDialogDescription>
        </div>


        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria border-t-[1px] border-[#BBBBBB] pt-[16px]">
          <AlertDialogCancel className={`bg-white w-full md:w-[170px] py-[12px] text-[20px] font-[400] ${userType}-border ${userType}-text hover-${userType}-bg hover:text-[#ffffff] font-raleway focus-visible:ring-0`}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={`${userType}-bg hover:text-white text-white hover-${userType}-bg w-full  md:w-[170px] py-[12px] font-[400] text-[20px] font-raleway focus-visible:ring-0`}
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            View Details
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default BillingDialog
