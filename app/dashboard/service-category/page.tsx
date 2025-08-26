'use client'
import CategoryDialog from '@/components/CategoryDialog'
import { Plus } from 'lucide-react';
import React, { useState } from 'react'

function Page() {

    const [openCaegoryDialog, setOpenCaegoryDialog] = useState(true);
    return (
        <div className='flex justify-center items-center pt-[80px]'>
            <div className='col-span-2 h-[50%] grid-rows-2 grid-cols-2 self-end justify-self-end flex items-center'>
                <p onClick={() => setOpenCaegoryDialog(true)} className='text-[#4290E9] text-[10px] font-semibold flex gap-[10px] cursor-pointer place-items-end pb-[10px]'><span className='flex bg-[#4290E9] w-[15px] h-[15px] rounded-[3px] justify-center items-center'><Plus className='text-[#F2F2F2] w-[12px]' /></span>Create New Category </p>
            </div>
            <CategoryDialog
                open={openCaegoryDialog}
                setOpen={setOpenCaegoryDialog}
            /></div>
    )
}

export default Page