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
      <AlertDialogContent
        className="bg-white overflow-hidden shadow-lg border rounded-xl p-0 w-auto h-auto max-w-[90vw] max-h-[90vh] flex items-center justify-center fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <AlertDialogTitle className="sr-only">Image Preview</AlertDialogTitle>
        <AlertDialogDescription className="sr-only">
          This is an image preview modal. Press escape or close to dismiss.
        </AlertDialogDescription>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative w-[80vw] max-w-[600px] h-[80vh] max-h-[600px]">
          <Image
            src={imageUrl}
            alt="Image Preview"
            fill
            className="object-contain rounded-lg"
            unoptimized
          />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
