"use client";

import React, { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ChevronDown,
  Trash2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  Type,
} from "lucide-react";
import type { TextStyle } from "../types/featureSheetTypes";
import type { CustomFontOption } from "./StyledInput";
import type { ActiveFieldInfo } from "./FieldPanelContext";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FieldSidePanelProps {
  isOpen: boolean;
  activeField: ActiveFieldInfo | null;
  onStyleChange: (style: TextStyle) => void;
  onSave: () => void;
  isSaving: boolean;
  onClose: () => void;
  userType?: string;
}

// ─── Font Weight Map ──────────────────────────────────────────────────────────

const WEIGHT_OPTIONS = [
  { label: "Thin", value: "100" },
  { label: "Normal", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Bold", value: "700" },
  { label: "Extra Bold", value: "800" },
];

const FONT_SIZE_OPTIONS = [
  8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 60, 72,
];

// ─── Standard & Public Fonts List ─────────────────────────────────────────────

const DEFAULT_FONT_OPTIONS: { label: string; value: string; css: string }[] = [
  { label: "Sans Serif", value: "sans-serif", css: "sans-serif" },
  { label: "Alexandria", value: "Alexandria, sans-serif", css: "Alexandria, sans-serif" },
  { label: "Raleway", value: "Raleway, sans-serif", css: "Raleway, sans-serif" },
  { label: "Gothic", value: "GothicRegular, sans-serif", css: "GothicRegular, sans-serif" },
  { label: "Gothic Bold", value: "GothicBold, sans-serif", css: "GothicBold, sans-serif" },
  { label: "Caslon Pro Bold", value: "ACaslonPro, serif", css: "ACaslonPro, serif" },
  { label: "Caslon Pro Regular", value: "ACaslonProRegular, serif", css: "ACaslonProRegular, serif" },
  { label: "Caslon Pro Italic", value: "ACaslonProItalic, serif", css: "ACaslonProItalic, serif" },
  { label: "Bickham Script", value: "BickhamScript, cursive", css: "BickhamScript, cursive" },
  { label: "Bickham Script Bold", value: "BickhamScriptBold, cursive", css: "BickhamScriptBold, cursive" },
  { label: "Trajan Pro", value: "TrajanProRegular, serif", css: "TrajanProRegular, serif" },
  { label: "Trajan Pro Bold", value: "TrajanPro, serif", css: "TrajanPro, serif" },
  { label: "Arial Bold", value: "ArialBold, sans-serif", css: "ArialBold, sans-serif" },
];

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Dropdown helper ─────────────────────────────────────────────────────────

function PanelDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string; css?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(
    (o) =>
      o.value === value ||
      (o.css && value && o.css.toLowerCase() === value.toLowerCase()) ||
      (value && o.css && value.toLowerCase().includes(o.css.split(",")[0].toLowerCase())),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 hover:bg-gray-100 transition-colors"
      >
        <span className="truncate" style={current?.css ? { fontFamily: current.css } : undefined}>
          {current?.label ?? label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[200] max-h-52 overflow-auto">
          {options.map((o) => (
            <button
              key={o.value + o.label}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={o.css ? { fontFamily: o.css } : undefined}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors ${
                o.value === value || (o.css && value && o.css.toLowerCase() === value.toLowerCase())
                  ? "bg-gray-800 text-white hover:bg-gray-700"
                  : "text-gray-800"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FieldSidePanel({
  isOpen,
  activeField,
  onStyleChange,
  onSave,
  isSaving,
  onClose,
  userType = "admin",
}: FieldSidePanelProps) {
  const style: TextStyle = activeField?.currentStyle ?? { fontSize: "16px" };
  const customFonts: CustomFontOption[] = activeField?.customFonts ?? [];

  // ── Derived state from current style ──────────────────────────────────────
  const currentFontSize = style.fontSize;
  const currentFontWeight = style.fontWeight ?? "400";
  const currentTextAlign = style.textAlign ?? "center";
  const currentVerticalAlign = style.verticalAlign ?? "center";
  const currentFontFamily = style.fontFamily ?? "";

  // Combine sheet-specific custom fonts with default/standard fonts without duplicates
  const customFontLabelSet = new Set(customFonts.map((f) => f.label.toLowerCase()));
  const fontOptions: { label: string; value: string; css?: string }[] = [
    ...customFonts.map((f) => ({ label: f.label, value: f.css, css: f.css })),
    ...DEFAULT_FONT_OPTIONS.filter(
      (df) => !customFontLabelSet.has(df.label.toLowerCase()),
    ),
  ];

  // ── Helpers ───────────────────────────────────────────────────────────────
  const emit = (partial: Partial<TextStyle>) => {
    onStyleChange({ ...style, fontSize: style.fontSize ?? "16px", ...partial } as TextStyle);
  };

  // ── Mouse Hold / Continuous Repeat Nudge Logic ────────────────────────────
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const stopNudgeTimer = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startNudgeTimer = React.useCallback(
    (dx: number, dy: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      stopNudgeTimer();

      const shift = e.shiftKey;
      const step = shift ? 10 : 1;

      // 1. Immediate step on press
      activeField?.onNudge?.(dx * step, dy * step);

      // 2. Hold delay (220ms) before continuous repeat
      timeoutRef.current = setTimeout(() => {
        // 3. Smooth repeat tick every 35ms (~28 updates/sec)
        intervalRef.current = setInterval(() => {
          activeField?.onNudge?.(dx * step, dy * step);
        }, 35);
      }, 220);
    },
    [activeField, stopNudgeTimer],
  );

  React.useEffect(() => {
    const handleGlobalMouseUp = () => stopNudgeTimer();
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      stopNudgeTimer();
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [stopNudgeTimer]);

  // ── Icon button helper ────────────────────────────────────────────────────
  const IconBtn = ({
    active,
    onClick,
    title,
    children,
    variant = "default",
  }: {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    variant?: "default" | "danger" | "neutral";
  }) => {
    const base =
      "flex items-center justify-center w-8 h-8 rounded-lg border text-xs transition-all font-medium";
    const variants = {
      default: active
        ? "bg-gray-800 text-white border-gray-800"
        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
      danger:
        "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300",
      neutral:
        "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300",
    };

    return (
      <button
        type="button"
        title={title}
        onClick={onClick}
        className={`${base} ${variants[variant]}`}
      >
        {children}
      </button>
    );
  };

  return (
    <>
      {/* Slide-in panel */}
      <div
        data-html2canvas-ignore="true"
        className={`fixed top-0 right-0 h-full z-[9999] flex flex-col bg-white border-l border-gray-200 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 280 }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 ${userType}-bg`}
        >
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-white opacity-90" />
            <div>
              <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider leading-none">
                Field Editor
              </p>
              <p className="text-[13px] font-bold text-white leading-tight truncate max-w-[170px]">
                {activeField?.fieldLabel ?? "No field selected"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close panel"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {!activeField ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Type className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400 leading-snug">
                Click on any text field in the sheet to edit its style
              </p>
            </div>
          ) : (
            <>
              {/* FONT FAMILY */}
              <Section title="Font Family">
                <PanelDropdown
                  label="Font Family"
                  options={fontOptions}
                  value={currentFontFamily}
                  onChange={(v) => emit({ fontFamily: v })}
                />
              </Section>

              {/* FONT WEIGHT */}
              <Section title="Font Weight">
                <PanelDropdown
                  label="Weight"
                  options={WEIGHT_OPTIONS}
                  value={String(currentFontWeight)}
                  onChange={(v) => emit({ fontWeight: v })}
                />
              </Section>

              {/* FONT SIZE */}
              <Section title="Font Size">
                <PanelDropdown
                  label="Size"
                  options={FONT_SIZE_OPTIONS.map((s) => ({
                    label: `${s}px`,
                    value: `${s}px`,
                  }))}
                  value={currentFontSize}
                  onChange={(v) => emit({ fontSize: v })}
                />
              </Section>

              {/* TEXT STYLE */}
              <Section title="Text Style">
                <div className="flex gap-1.5">
                  <IconBtn
                    title="Bold"
                    active={
                      currentFontWeight === "700" ||
                      currentFontWeight === "800" ||
                      currentFontWeight === "bold"
                    }
                    onClick={() =>
                      emit({
                        fontWeight:
                          currentFontWeight === "700" ? "400" : "700",
                      })
                    }
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </IconBtn>
                  <IconBtn
                    title="Italic"
                    active={style.fontStyle === "italic"}
                    onClick={() =>
                      emit({
                        fontStyle:
                          style.fontStyle === "italic" ? "normal" : "italic",
                      })
                    }
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </IconBtn>
                  <IconBtn
                    title="Underline"
                    active={style.textDecoration === "underline"}
                    onClick={() =>
                      emit({
                        textDecoration:
                          style.textDecoration === "underline"
                            ? "none"
                            : "underline",
                      })
                    }
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </IconBtn>
                </div>
              </Section>

              {/* TEXT ALIGN */}
              <Section title="Text Align">
                <div className="flex gap-1.5">
                  {(
                    [
                      { val: "left", Icon: AlignLeft, title: "Left" },
                      { val: "center", Icon: AlignCenter, title: "Center" },
                      { val: "right", Icon: AlignRight, title: "Right" },
                      { val: "justify", Icon: AlignJustify, title: "Justify" },
                    ] as const
                  ).map(({ val, Icon, title }) => (
                    <IconBtn
                      key={val}
                      title={title}
                      active={currentTextAlign === val}
                      onClick={() => emit({ textAlign: val })}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </IconBtn>
                  ))}
                </div>
              </Section>

              {/* VERTICAL ALIGN */}
              <Section title="Vertical Align">
                <div className="flex gap-1.5">
                  {(
                    [
                      {
                        val: "top",
                        Icon: AlignVerticalJustifyStart,
                        title: "Top",
                      },
                      {
                        val: "center",
                        Icon: AlignVerticalJustifyCenter,
                        title: "Middle",
                      },
                      {
                        val: "bottom",
                        Icon: AlignVerticalJustifyEnd,
                        title: "Bottom",
                      },
                    ] as const
                  ).map(({ val, Icon, title }) => (
                    <IconBtn
                      key={val}
                      title={title}
                      active={currentVerticalAlign === val}
                      onClick={() =>
                        emit({
                          verticalAlign: val,
                          alignContent:
                            val === "top"
                              ? "start"
                              : val === "bottom"
                                ? "end"
                                : "center",
                        })
                      }
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </IconBtn>
                  ))}
                </div>
              </Section>

              {/* POSITION NUDGE */}
              <Section title="Nudge Position (Hold to move continuous, Shift = ×10)">
                <div className="flex flex-col items-center gap-1">
                  {/* Up */}
                  <button
                    type="button"
                    title="Move up (Hold to move continuously, Shift for 10px)"
                    onMouseDown={(e) => startNudgeTimer(0, -1, e)}
                    onMouseUp={stopNudgeTimer}
                    onMouseLeave={stopNudgeTimer}
                    className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 active:bg-gray-200 select-none cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  {/* Left + Right */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Move left (Hold to move continuously, Shift for 10px)"
                      onMouseDown={(e) => startNudgeTimer(-1, 0, e)}
                      onMouseUp={stopNudgeTimer}
                      onMouseLeave={stopNudgeTimer}
                      className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 active:bg-gray-200 select-none cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    {/* Center dot */}
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>
                    <button
                      type="button"
                      title="Move right (Hold to move continuously, Shift for 10px)"
                      onMouseDown={(e) => startNudgeTimer(1, 0, e)}
                      onMouseUp={stopNudgeTimer}
                      onMouseLeave={stopNudgeTimer}
                      className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 active:bg-gray-200 select-none cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Down */}
                  <button
                    type="button"
                    title="Move down (Hold to move continuously, Shift for 10px)"
                    onMouseDown={(e) => startNudgeTimer(0, 1, e)}
                    onMouseUp={stopNudgeTimer}
                    onMouseLeave={stopNudgeTimer}
                    className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 active:bg-gray-200 select-none cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Section>

              {/* DELETE + RESET */}
              <Section title="Field Actions">
                <div className="flex gap-2">
                  <button
                    type="button"
                    title="Reset position"
                    onClick={() => {
                      activeField.onResetPosition?.();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Pos
                  </button>
                  <button
                    type="button"
                    title="Delete field"
                    onClick={() => {
                      activeField.onDelete?.();
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </Section>
            </>
          )}
        </div>

        {/* ── Footer: Save Button ───────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            type="button"
            disabled={isSaving}
            onClick={onSave}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 ${userType}-bg hover:opacity-90`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Sheet"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
