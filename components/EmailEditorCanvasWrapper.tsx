"use client";
import React, { useState } from "react";
import { Lock, Eye, EyeOff, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface EmailEditorCanvasWrapperProps {
  orgName: string;
  logoUrl?: string | null;
  primaryColor?: string;
  orgEmail?: string;
  orgPhone?: string;
  isWhitelabel?: boolean;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function EmailEditorCanvasWrapper({
  orgName,
  logoUrl,
  primaryColor = "#2563EB",
  orgEmail,
  orgPhone,
  isWhitelabel = false,
  children,
  defaultExpanded = true,
}: EmailEditorCanvasWrapperProps) {
  const [showFraming, setShowFraming] = useState<boolean>(defaultExpanded);

  return (
    <div className="border border-[#DDDDDD] bg-white rounded-lg p-0 flex-1 w-full max-w-full flex flex-col min-h-[640px] md:min-h-[680px] overflow-hidden shadow-xs relative">
      {/* HEADER SECTION */}
      {showFraming ? (
        <div className="bg-[#FAFBFD] border-b border-[#E2E8F0] select-none shrink-0 transition-all">
          {/* Top Micro-Bar with System Badging & Toggle */}
          <div className="px-3.5 py-1 bg-[#F1F5F9] border-b border-[#E2E8F0]/80 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-gray-700 text-[10px] uppercase tracking-wider">
                System Header
              </span>
              <span className="text-[10px] text-gray-400 hidden sm:inline">
                · Automatically included on send
              </span>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200/90 shadow-2xs flex items-center gap-1 cursor-default">
                      <Lock className="w-2.5 h-2.5 text-gray-400" />
                      Branding (Read-only)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[220px]">
                    This header branding is automatically added to the top of all outgoing emails. You do not need to re-add your logo here.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <button
                type="button"
                onClick={() => setShowFraming(false)}
                title="Collapse header/footer to get maximum editing height"
                className="text-[10px] text-gray-400 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-200/60 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <EyeOff className="w-2.5 h-2.5" />
                <span className="hidden md:inline">Collapse</span>
              </button>
            </div>
          </div>

          {/* Visual Logo / Organization Header */}
          <div
            className="py-4 px-6 bg-white flex items-center justify-center text-center min-h-[76px] transition-all"
            style={{ borderBottom: `3px solid ${primaryColor || "#2563EB"}` }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${orgName} Logo`}
                className="max-h-[68px] max-w-[210px] w-auto h-auto object-contain block select-none pointer-events-none"
              />
            ) : (
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight m-0 font-sans select-none">
                {orgName}
              </h3>
            )}
          </div>
        </div>
      ) : (
        /* Collapsed minimal banner */
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-3 py-1 flex items-center justify-between text-[10px] text-gray-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Lock className="w-2.5 h-2.5 text-gray-400" />
            <span>Header & Footer hidden (will still be included on send)</span>
          </span>
          <button
            type="button"
            onClick={() => setShowFraming(true)}
            className="text-[#4290E9] hover:underline font-medium flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-2.5 h-2.5" />
            <span>Show Header & Footer</span>
          </button>
        </div>
      )}

      {/* EDITABLE BODY CONTENT (SunEditor) - Expanded height */}
      <div className="flex-1 w-full min-h-[420px] md:min-h-[480px] flex flex-col relative overflow-hidden bg-white">
        {children}
      </div>

      {/* FOOTER SECTION - Exactly matches email master layout */}
      {showFraming && (
        <div className="bg-[#F9FAFB] border-t border-[#E5E7EB] py-5 px-5 text-center shrink-0 select-none transition-all">
          <p className="text-[12px] text-[#9CA3AF] m-0 mb-1.5 leading-normal font-sans">
            &copy; {new Date().getFullYear()} {orgName}. All rights reserved.
          </p>
          {!isWhitelabel && (
            <p className="text-[11px] text-[#D1D5DB] m-0 leading-normal font-sans">
              Powered by{" "}
              <a
                href="https://tojuco.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#9CA3AF] underline decoration-[#9CA3AF] pointer-events-none"
              >
                Tojuco
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
