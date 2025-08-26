// components/DropdownActions.tsx
"use client"

import React from "react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

type Option = {
    label: string
    onClick?: () => void
    confirm1?: boolean
    confirm2?: boolean
}

type Props = {
    options: Option[],
    data: string[]
}

const DropdownActions: React.FC<Props> = ({ options, data }) => {



    console.log('data', data);


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
                        // onClick={() => handleItemClick1(option)}
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}

export default DropdownActions
