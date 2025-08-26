// components/DropdownActions.tsx
"use client"

import React, { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import ConfirmationDialog from "./ConfirmationDialog"
import MergeDialog from "./MergeDialog"
import { Admin } from "./AdminTable"

type Option = {
  label: string
  onClick?: () => void
  confirm1?: boolean
  confirm2?: boolean
}

type Props = {
  options: Option[],
  data?: Admin[]
}

const DropdownActions: React.FC<Props> = ({ options, data }) => {
  const [confirmOpen1, setConfirmOpen1] = useState(false)
  const [pendingAction1, setPendingAction1] = useState<(() => void) | null>(null)
  const [showAgain1, setShowAgain1] = useState(true)
  const [confirmOpen2, setConfirmOpen2] = useState(false)
  const [pendingAction2, setPendingAction2] = useState<(() => void) | null>(null)
  const [showAgain2, setShowAgain2] = useState(true)
  const handleItemClick1 = (option: Option) => {
    if (option.confirm1 && showAgain1) {
      setPendingAction1(() => option.onClick)
      setConfirmOpen1(true)
    }
    else if (option.confirm2 && showAgain2) {
      setPendingAction2(() => option.onClick)
      setConfirmOpen2(true)
    }
    else {
      option.onClick?.()
    }
  }

  const confirmAndExecute1 = () => {
    pendingAction1?.()
    setPendingAction1(null)
  }
  const confirmAndExecute2 = () => {
    pendingAction2?.()
    setPendingAction2(null)
  }



  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-none bg-[#F3F3F3] text-[16px] font-[500] text-[#666666]">
          {options.map((option, i) => (
            <DropdownMenuItem
              className="cursor-pointer"
              key={i}
              onClick={() => handleItemClick1(option)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={confirmOpen1}
        setOpen={setConfirmOpen1}
        onConfirm={confirmAndExecute1}
        showAgain={showAgain1}
        toggleShowAgain={() => setShowAgain1(!showAgain1)}
      />
      <MergeDialog
        open={confirmOpen2}
        setOpen={setConfirmOpen2}
        onConfirm={confirmAndExecute2}
        showAgain={showAgain2}
        toggleShowAgain={() => setShowAgain2(!showAgain2)}
        data={data ?? []}
      />
    </>
  )
}

export default DropdownActions
