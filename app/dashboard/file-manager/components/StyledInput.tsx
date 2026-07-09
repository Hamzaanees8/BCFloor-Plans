"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Bold, Italic, Underline, ChevronDown } from "lucide-react";
import type { TextStyle } from "../types/featureSheetTypes";

type StyledInputProps = {
  className?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Called whenever the user changes any style property from the toolbar */
  onChangeStyle?: (style: TextStyle) => void;
  /** Pass a saved TextStyle to restore styles (e.g. after importFromPayload) */
  inputStyle?: TextStyle;
  placeholder?: string;
  [key: string]: any;
};

// --- ⭐ CARET SAVE / RESTORE FIX ---
function saveCaretPosition(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();

  preCaretRange.selectNodeContents(el);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  return preCaretRange.toString().length;
}

function restoreCaretPosition(el: HTMLElement, offset: number) {
  const selection = window.getSelection();
  if (!selection) return;

  let charIndex = 0;
  const range = document.createRange();
  range.setStart(el, 0);
  range.collapse(true);

  const nodeStack: Node[] = [el];
  let node: Node | undefined;

  while ((node = nodeStack.pop())) {
    if (node.nodeType === 3) {
      const textLength = node.textContent?.length ?? 0;

      if (charIndex + textLength >= offset) {
        range.setStart(node, offset - charIndex);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }

      charIndex += textLength;
    } else {
      let i = node.childNodes.length;
      while (i--) nodeStack.push(node.childNodes[i]);
    }
  }
}

/** Convert a TextStyle fontWeight string/number to a Tailwind class for display. */
function fontWeightToClass(fw?: string | number): string {
  const fwStr = String(fw ?? "400");
  if (fwStr === "100") return "font-thin";
  if (fwStr === "500") return "font-medium";
  if (fwStr === "700") return "font-bold";
  if (fwStr === "800") return "font-extrabold";
  return "font-normal";
}

/** Convert a CSS fontFamily string to Tailwind class for display. */
function fontFamilyToClass(ff?: string): string {
  if (!ff) return "font-sans";
  if (ff.toLowerCase().includes("alexandria")) return "font-alexandria";
  if (ff.toLowerCase().includes("raleway")) return "font-raleway";
  return "font-sans";
}

export default function StyledInput({
  className,
  value,
  onChange,
  onChangeStyle,
  inputStyle,
  placeholder,
  ...props
}: StyledInputProps) {
  const [fontWeight, setFontWeight] = useState("font-normal");
  const [fontSize, setFontSize] = useState<string>("16px");
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [fontFamily, setFontFamily] = useState<string>("font-sans");
  const [internalValue, setInternalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(!value);

  const [showMenu, setShowMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const editableRef = useRef<HTMLParagraphElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const defaultFontSizeRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, transform: "translateX(-50%)" });

  const updatePosition = useCallback(() => {
    if (showMenu && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      let top = rect.bottom + window.scrollY + 4;
      let left = rect.left + window.scrollX + (rect.width / 2);
      let transform = "translateX(-50%)";

      // If it would go off the bottom of the viewport
      if (rect.bottom + 150 > window.innerHeight) {
        top = rect.top + window.scrollY - 50; // Pop up above the input
      }

      // If it would go off the left side
      if (rect.left < 150) {
        left = rect.left + window.scrollX;
        transform = "none";
      } 
      // If it would go off the right side
      else if (rect.right + 150 > window.innerWidth) {
        left = rect.right + window.scrollX;
        transform = "translateX(-100%)";
      }

      setMenuCoords({ top, left, transform });
    }
  }, [showMenu]);

  useEffect(() => {
    updatePosition();
    if (showMenu) {
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [showMenu, updatePosition]);

  // ─── Sync value from parent ───────────────────────────────────────
  useEffect(() => {
    if (value !== undefined) {
      // Robustly extract string value if an object {value, style} was passed
      const stringValue = typeof value === 'string'
        ? value
        : (value && typeof value === 'object' && 'value' in (value as any))
          ? (value as any).value || ''
          : String(value || '');

      setInternalValue(stringValue);
      setShowPlaceholder(!stringValue);
      if (editableRef.current && editableRef.current.textContent !== stringValue) {
        editableRef.current.textContent = stringValue;
      }
    }
  }, [value]);

  // ─── Sync className-embedded size/align (initial layout only) ────
  useEffect(() => {
    if (className) {
      const match = className.match(/text-\[(\d+)px\]/);
      if (match) {
        setFontSize(`${match[1]}px`);
        if (defaultFontSizeRef.current === null) {
          defaultFontSizeRef.current = parseInt(match[1], 10);
        }
      }
      if (className.includes("text-left")) setTextAlign("left");
      if (className.includes("text-right")) setTextAlign("right");
      if (className.includes("text-center")) setTextAlign("center");
    }
  }, [className]);

  // ─── Restore saved styles (from importFromPayload) ────────────────
  useEffect(() => {
    if (!inputStyle) return;
    if (inputStyle.fontSize) setFontSize(inputStyle.fontSize);
    if (inputStyle.fontWeight !== undefined) {
      setFontWeight(fontWeightToClass(inputStyle.fontWeight));
    }
    if (inputStyle.fontFamily) setFontFamily(fontFamilyToClass(inputStyle.fontFamily));
    if (inputStyle.textAlign) setTextAlign(inputStyle.textAlign);
    // italic / underline not stored in TextStyle currently — skip
  }, [inputStyle]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const getFontWeightStyle = () => {
    switch (fontWeight) {
      case "font-thin": return "100";
      case "font-normal": return "400";
      case "font-medium": return "500";
      case "font-bold": return "700";
      case "font-extrabold": return "800";
      default: return "400";
    }
  };

  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case "font-alexandria": return "Alexandria, sans-serif";
      case "font-raleway": return "Raleway, sans-serif";
      case "font-sans": return "sans-serif";
      default: return "sans-serif";
    }
  };

  /** Build a TextStyle snapshot and notify parent. */
  const notifyStyleChange = useCallback(
    (overrides: Partial<{ fw: string; fs: string; ff: string; it: boolean; ul: boolean; ta: "left" | "center" | "right" }>) => {
      if (!onChangeStyle) return;
      const fw = overrides.fw ?? fontWeight;
      const fs = overrides.fs ?? fontSize;
      const ff = overrides.ff ?? fontFamily;
      const ta = overrides.ta ?? textAlign;

      const fwNum = (() => {
        switch (fw) {
          case "font-thin": return "100";
          case "font-normal": return "400";
          case "font-medium": return "500";
          case "font-bold": return "700";
          case "font-extrabold": return "800";
          default: return "400";
        }
      })();

      const ffCss = (() => {
        switch (ff) {
          case "font-alexandria": return "Alexandria, sans-serif";
          case "font-raleway": return "Raleway, sans-serif";
          default: return "sans-serif";
        }
      })();

      onChangeStyle({
        fontSize: fs,
        fontWeight: fwNum,
        fontFamily: ffCss,
        textAlign: ta,
      });
    },
    [onChangeStyle, fontWeight, fontSize, fontFamily, textAlign]
  );

  // ─── Input handler ────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    const el = editableRef.current;
    if (!el) return;

    const caret = saveCaretPosition(el);

    const newValue = el.textContent || "";
    setInternalValue(newValue);
    setShowPlaceholder(newValue.length === 0);

    if (onChange) {
      const syntheticEvent = {
        target: {
          value: newValue,
          name: props.name,
          type: "text",
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }

    requestAnimationFrame(() => {
      if (editableRef.current && caret !== null) {
        restoreCaretPosition(editableRef.current, caret);
      }
    });
  }, [onChange, props.name]);

  const handleFocus = () => {
    setIsFocused(true);
    setShowMenu(true);
    setShowPlaceholder(false);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setShowPlaceholder(internalValue.length === 0);

    if (!hoverRef.current) {
      setShowMenu(false);
      setActiveDropdown(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      editableRef.current?.blur();
    }
  };

  const handleMouseEnter = (key: string) => setActiveDropdown(key);
  const handleMouseLeave = (key: string) => activeDropdown === key && setActiveDropdown(null);

  const applyStyle = (style: string, val: any) => {
    if (!editableRef.current) return;

    let newFw = fontWeight, newFs = fontSize, newFf = fontFamily, newIt = italic, newUl = underline, newTa = textAlign;

    switch (style) {
      case "fontWeight": setFontWeight(val); newFw = val; break;
      case "fontSize": setFontSize(val); newFs = val; break;
      case "italic": setItalic(val); newIt = val; break;
      case "underline": setUnderline(val); newUl = val; break;
      case "textAlign": setTextAlign(val); newTa = val; break;
      case "fontFamily": setFontFamily(val); newFf = val; break;
    }

    notifyStyleChange({ fw: newFw, fs: newFs, ff: newFf, it: newIt, ul: newUl, ta: newTa });
  };

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block w-full content-center"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => {
        hoverRef.current = false;
        if (!isFocused) {
          setShowMenu(false);
          setActiveDropdown(null);
        }
      }}
    >
      <div className="relative grid">
        <p
          ref={editableRef}
          contentEditable
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            fontSize,
            textAlign,
            fontWeight: getFontWeightStyle(),
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
            fontFamily: getFontFamilyStyle(),
            lineHeight: "100%",
            minHeight: `calc(${fontSize} + 10px)`,
            outline: "none",
            alignContent: "center",
          }}
          className={cn(
            "col-start-1 row-start-1",
            "placeholder-gray-400 border rounded w-full resize-none focus:outline-none border-none px-2",
            "whitespace-pre-wrap break-words transition-all",
            !isFocused && "hover:ring-1 hover:ring-white/30 hover:bg-black/5 cursor-text",
            className,
            isFocused && "ring-2 ring-blue-500"
          )}
          suppressContentEditableWarning={true}
          {...props}
        >
          {internalValue}
        </p>

        {showPlaceholder && placeholder && (
          <div
            className={cn(
              "col-start-1 row-start-1 px-2 pointer-events-none break-words whitespace-pre-wrap opacity-70",
              className
            )}
            style={{
              fontSize,
              textAlign,
              fontWeight: getFontWeightStyle(),
              fontStyle: italic ? "italic" : "normal",
              fontFamily: getFontFamilyStyle(),
              lineHeight: "100%",
              minHeight: `calc(${fontSize} + 10px)`,
              alignContent: "center",
              backgroundColor: "transparent",
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {mounted && showMenu && createPortal(
        <div
          className="absolute z-[99999] bg-white border shadow-lg rounded-md p-2 w-max flex gap-2"
          style={{ top: menuCoords.top, left: menuCoords.left, transform: menuCoords.transform }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Weight */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("weight")}
            onMouseLeave={() => handleMouseLeave("weight")}
          >
            <button
              type="button"
              className="px-2 py-2 text-xs text-black border rounded flex items-center gap-1 hover:bg-gray-100"
            >
              {{
                "font-thin": "Thin",
                "font-normal": "Normal",
                "font-medium": "Medium",
                "font-bold": "Bold",
                "font-extrabold": "Extra Bold",
              }[fontWeight]}{" "}
              <ChevronDown className="w-3 h-3" />
            </button>

            {activeDropdown === "weight" && (
              <div className="absolute left-0 bg-white border rounded shadow-md z-[999] w-28">
                {[
                  { label: "Thin", value: "font-thin" },
                  { label: "Normal", value: "font-normal" },
                  { label: "Medium", value: "font-medium" },
                  { label: "Bold", value: "font-bold" },
                  { label: "Extra Bold", value: "font-extrabold" },
                ].map((fw) => (
                  <button
                    key={fw.value}
                    className={cn(
                      "block w-[90%] m-1 text-black rounded px-2 py-1 text-[12px] bg-gray-100 hover:bg-gray-800 hover:text-white",
                      fontWeight === fw.value && "bg-gray-800 text-white"
                    )}
                    onClick={() => {
                      applyStyle("fontWeight", fw.value);
                      setActiveDropdown(null);
                    }}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("size")}
            onMouseLeave={() => handleMouseLeave("size")}
          >
            <button
              type="button"
              className="px-2 py-2 text-xs text-black border rounded flex items-center gap-1 hover:bg-gray-100"
            >
              {fontSize.replace("px", "")} px <ChevronDown className="w-3 h-3" />
            </button>

            {activeDropdown === "size" && (
              <div className="absolute left-0 bg-white border rounded shadow-md z-[999] w-28 max-h-40 overflow-auto">
                {(() => {
                  const ALL_SIZES = [8, 10, 12, 14, 16, 18, 20, 21, 24, 28, 32, 36, 40, 48, 60, 72];
                  let allowedSizes = [8, 12, 14, 16, 18, 24, 28, 36, 40, 48];
                  
                  if (defaultFontSizeRef.current !== null) {
                    const sorted = Array.from(new Set([...ALL_SIZES, defaultFontSizeRef.current])).sort((a, b) => a - b);
                    const idx = sorted.indexOf(defaultFontSizeRef.current);
                    allowedSizes = sorted.slice(Math.max(0, idx - 2), idx + 3);
                  }
                  
                  return allowedSizes.map((size) => (
                    <button
                      key={size}
                      className={cn(
                        "block w-[90%] m-1 text-black rounded px-2 py-1 text-[12px] bg-gray-100 hover:bg-gray-800 hover:text-white",
                        fontSize === `${size}px` && "bg-gray-800 text-white"
                      )}
                      onClick={() => {
                        applyStyle("fontSize", `${size}px`);
                        setActiveDropdown(null);
                      }}
                    >
                      {size}px
                    </button>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Family */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("family")}
            onMouseLeave={() => handleMouseLeave("family")}
          >
            <button
              type="button"
              className="px-2 py-2 text-xs text-black border rounded flex items-center gap-1 hover:bg-gray-100"
            >
              {{
                "font-alexandria": "Alexandria",
                "font-raleway": "Raleway",
                "font-sans": "Sans Serif",
              }[fontFamily]}{" "}
              <ChevronDown className="w-3 h-3" />
            </button>

            {activeDropdown === "family" && (
              <div className="absolute left-0 bg-white border rounded shadow-md z-[999] w-32">
                {[
                  { label: "Alexandria", value: "font-alexandria" },
                  { label: "Raleway", value: "font-raleway" },
                  { label: "Sans Serif", value: "font-sans" },
                ].map((ff) => (
                  <button
                    key={ff.value}
                    className={cn(
                      "block w-[90%] m-1 text-black rounded px-2 py-1 text-[12px] bg-gray-100 hover:bg-gray-800 hover:text-white",
                      fontFamily === ff.value && "bg-gray-800 text-white"
                    )}
                    onClick={() => {
                      applyStyle("fontFamily", ff.value);
                      setActiveDropdown(null);
                    }}
                  >
                    {ff.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Style Icons */}
          <div className="flex gap-1">
            <button
              type="button"
              className={cn(
                "p-2 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100",
                italic && "bg-gray-800 text-white"
              )}
              onClick={() => applyStyle("italic", !italic)}
            >
              <Italic className="h-4 w-4" />
            </button>

            <button
              type="button"
              className={cn(
                "p-1 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100",
                underline && "bg-gray-800 text-white"
              )}
              onClick={() => applyStyle("underline", !underline)}
            >
              <Underline className="h-4 w-4" />
            </button>

            <button
              type="button"
              className={cn(
                "p-2 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100",
                fontWeight === "font-bold" && "bg-gray-800 text-white"
              )}
              onClick={() => applyStyle("fontWeight", "font-bold")}
            >
              <Bold className="h-4 w-4" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
