'use client'
import React from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { useAppContext } from '@/app/context/AppContext'

interface ImagePopupProps {
  imageUrl?: string
  open: boolean
  onClose: () => void
}

export default function ImagePopup({ imageUrl, open, onClose }: ImagePopupProps) {
  const { userType } = useAppContext();

  if (!open || !imageUrl) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white overflow-hidden flex-col shadow-lg border rounded-xl p-4 !w-[700px] !max-w-none h-[500px] flex fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [&>button]:hidden">
        <DialogHeader className="mb-2">
          <DialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[700] border-b-[1px] border-[#E4E4E4] pb-2`}>
            PHOTO
            <DialogClose className="border-none !shadow-none">
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </DialogClose>
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="sr-only">
          This is an image preview modal. Press escape or close to dismiss.
        </DialogDescription>

        <button
          onClick={onClose}
          className="absolute top-4 right-3 z-10 text-gray-500 hover:text-gray-400 bg-transparent p-1 rounded-full shadow"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Container - Takes remaining space */}
        <div className="flex-1 w-full relative">
          <Image
            src={imageUrl}
            alt="Image Preview"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}