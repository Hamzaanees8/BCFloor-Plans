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
import { useWhiteLabel } from "@/app/context/Whitelabel";

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
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent
        className="max-w-sm text-center font-alexandria py-6 px-6 border-none"
        style={{ backgroundColor: roleSettings.pageBg }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            <h2 className="font-semibold text-lg" style={{ color: roleSettings.pageTabColor }}>
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
        <hr className="border-[#BBBBBB]" />
        <div className="my-2 flex flex-col items-center gap-4">
          {isLoading ? (
            <>
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: roleSettings.pageTabColor }} />
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="text-sm font-[400]" style={{ color: roleSettings.pageText }}>
                Saved successfully!
              </p>
            </>
          ) : null}
        </div>

        <hr className="border-[#BBBBBB]" />
        {backLink && (
          <Button
            disabled={isLoading}
            className="w-full hover:brightness-110 border-none transition-all"
            style={{ backgroundColor: roleSettings.pageTabColor }}
            onClick={onClose}
            asChild={isSuccess}
          >
            {isSuccess ? (
              <Link
                href={backLink ?? "/"}
                className="w-full block text-center text-white"
              >
                Back to {title}
              </Link>
            ) : (
              <span className="opacity-50 cursor-pointer text-white">
                Back To {title} Page
              </span>
            )}
          </Button>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
