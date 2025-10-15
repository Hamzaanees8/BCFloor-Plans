'use client'
import React from 'react'
import { X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle
} from './ui/alert-dialog'
import Image from 'next/image'

interface ImagePopupProps {
  imageUrl?: string
  open: boolean
  onClose: () => void
}

export default function ImagePopup({ imageUrl, open, onClose }: ImagePopupProps) {
  if (!open || !imageUrl) return null

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white overflow-hidden flex-col shadow-lg border rounded-xl p-4 !w-[700px] !max-w-none h-[500px] flex fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-full h-[40px] px-5 flex items-center border-b-2 border-gray-200">
          <AlertDialogTitle className="text-[#6BAE41] font-[700] text-[18px]">
            PHOTO
          </AlertDialogTitle>
        </div>

        <AlertDialogDescription className="sr-only">
          This is an image preview modal. Press escape or close to dismiss.
        </AlertDialogDescription>

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
      </AlertDialogContent>
    </AlertDialog>
  )
}