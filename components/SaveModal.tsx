"use client";

// import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import Link from "next/link";
import { useAppContext } from "@/app/context/AppContext";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  backLink?: string;
  title?: string;
}

export function SaveModal({
  isOpen,
  onClose,
  isLoading,
  isSuccess,
  backLink,
  title,
}: SaveModalProps) {
  const {userType} = useAppContext(); 
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm text-center font-alexandria py-6 px-6">
        <AlertDialogHeader>
          <AlertDialogTitle>
            <h2 className={`font-semibold text-lg ${userType}-text`}>
              {isLoading ? "SAVING..." : "SUCCESS"}
            </h2>
          </AlertDialogTitle>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </AlertDialogHeader>
        <hr />
        <div className="my-2 flex flex-col items-center gap-4">
          {isLoading ? (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              {/* <p className="text-sm text-muted-foreground">Generating {title} URL…</p> */}
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Saved successfully!
              </p>
              {/* <p className="text-sm text-muted-foreground">{title} created successfully!</p> */}
            </>
          ) : null}
        </div>

        <hr />
        {backLink && (
          <Button
            disabled={isLoading}
            className={`w-full hover:opacity-85 hover-${userType}-bg ${userType}-bg `}
            onClick={onClose}
            asChild={isSuccess}
          >
            {isSuccess ? (
              <Link
                href={backLink ?? "/"}
                className="w-full block text-center "
              >
                Back to {title}
              </Link>
            ) : (
              <span className="opacity-50 bg-[#4290E9] hover:bg-[#397fcf] cursor-pointer">
                Back To {title} Page
              </span>
            )}
          </Button>
          
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
