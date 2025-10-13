// components/ConfirmationDialog.tsx
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
import WarningIcon from "./Icons"
import { useAppContext } from "@/app/context/AppContext"

type Props = {
  open: boolean
  setOpen: (value: boolean) => void
  onConfirm: () => void
  showAgain: boolean
  toggleShowAgain: () => void
}

const ConfirmationDialog: React.FC<Props> = ({
  open,
  setOpen,
  onConfirm,
  showAgain,
  toggleShowAgain,
}) => {
  const { userType } = useAppContext();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="w-[320px] md:w-[593px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
        <AlertDialogHeader className="mb-2">
          <AlertDialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}>
            CONFIRMATION
            <AlertDialogCancel className="border-none !shadow-none">
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </AlertDialogCancel>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex items-start gap-3">
          <div className="w-fit">
            <WarningIcon width={48} />
          </div>
          <AlertDialogDescription className="text-[14px] font-[400] text-[#666666]">
            Are you sure you want to take this action? This cannot be undone and you will have to re-enter the information.
          </AlertDialogDescription>
        </div>

        <div className="mt-4 flex items-center gap-2 border-b-[1px] border-[#E4E4E4] pb-2">
          <input
            type="checkbox"
            id="no-show"
            checked={!showAgain}
            onChange={toggleShowAgain}
            className="accent-[#0078D4]"
          />
          <label htmlFor="no-show" className="text-[14px] font-[400] text-[#666666]">Do not show again.</label>
        </div>

        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria">
          <AlertDialogCancel
           className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] ${userType}-text border ${userType}-border text-[#0078D4] hover-${userType}-bg ${userType}-button`}
           >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={`${userType}-bg hover:opacity-90 text-white hover-${userType}-bg w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmationDialog
