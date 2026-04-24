// components/DropdownActions.tsx
"use client"

import React, { useState, useEffect } from "react"
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
import { Admin } from "@/lib/types"

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

const STORAGE_KEY_DELETE = 'confirmation_dialog_delete_show_again';
const STORAGE_KEY_MERGE = 'confirmation_dialog_merge_show_again';

const DropdownActions: React.FC<Props> = ({ options, data }) => {
  const [confirmOpen1, setConfirmOpen1] = useState(false)
  const [pendingAction1, setPendingAction1] = useState<(() => void) | null>(null)
  const [showAgain1, setShowAgain1] = useState(true)

  const [confirmOpen2, setConfirmOpen2] = useState(false)
  const [pendingAction2, setPendingAction2] = useState<(() => void) | null>(null)
  const [showAgain2, setShowAgain2] = useState(true)

  // LOAD FROM LOCALSTORAGE ON MOUNT
  useEffect(() => {
    const savedDelete = localStorage.getItem(STORAGE_KEY_DELETE);
    if (savedDelete !== null) {
      setShowAgain1(JSON.parse(savedDelete));
    }

    const savedMerge = localStorage.getItem(STORAGE_KEY_MERGE);
    if (savedMerge !== null) {
      setShowAgain2(JSON.parse(savedMerge));
    }
  }, []);

  const handleItemClick1 = (option: Option) => {
    if (option.confirm1 && option.onClick) {
      if (showAgain1) {
        setPendingAction1(() => option.onClick)
        setConfirmOpen1(true)
      } else {
        // EXECUTE IMMEDIATELY IF "DON'T SHOW AGAIN" IS CHECKED
        option.onClick()
      }
    }
    else if (option.confirm2 && option.onClick) {
      if (showAgain2) {
        setPendingAction2(() => option.onClick)
        setConfirmOpen2(true)
      } else {
        // EXECUTE IMMEDIATELY IF "DON'T SHOW AGAIN" IS CHECKED
        option.onClick()
      }
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

  const handleToggleShowAgain1 = () => {
    const newValue = !showAgain1;
    setShowAgain1(newValue);
    localStorage.setItem(STORAGE_KEY_DELETE, JSON.stringify(newValue));
  }

  const handleToggleShowAgain2 = () => {
    const newValue = !showAgain2;
    setShowAgain2(newValue);
    localStorage.setItem(STORAGE_KEY_MERGE, JSON.stringify(newValue));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" className="h-8 w-8 p-0">
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
        toggleShowAgain={handleToggleShowAgain1} // CHANGED THIS
      />
      <MergeDialog
        open={confirmOpen2}
        setOpen={setConfirmOpen2}
        onConfirm={confirmAndExecute2}
        showAgain={showAgain2}
        toggleShowAgain={handleToggleShowAgain2} // CHANGED THIS
        data={data ?? []}
      />
    </>
  )
}

export default DropdownActions