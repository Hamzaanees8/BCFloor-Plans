"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Underline, ChevronDown } from "lucide-react";

type StyledInputProps = {
  className?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
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

export default function StyledInput({
  className,
  value,
  onChange,
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

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
      setShowPlaceholder(!value);
      if (editableRef.current && editableRef.current.textContent !== value) {
        editableRef.current.textContent = value;
      }
    }
  }, [value]);

  useEffect(() => {
    if (className) {
      const match = className.match(/text-\[(\d+)px\]/);
      if (match) setFontSize(`${match[1]}px`);
      if (className.includes("text-left")) setTextAlign("left");
      if (className.includes("text-right")) setTextAlign("right");
      if (className.includes("text-center")) setTextAlign("center");
    }
  }, [className]);

  // ⭐ FIXED HANDLE_INPUT WITH CARET PRESERVATION
  const handleInput = useCallback(() => {
    const el = editableRef.current;
    if (!el) return;

    const caret = saveCaretPosition(el); // <-- save caret

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
        restoreCaretPosition(editableRef.current, caret); // <-- restore caret
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

  const applyStyle = (style: string, value: any) => {
    if (!editableRef.current) return;

    switch (style) {
      case "fontWeight": setFontWeight(value); break;
      case "fontSize": setFontSize(value); break;
      case "italic": setItalic(value); break;
      case "underline": setUnderline(value); break;
      case "textAlign": setTextAlign(value); break;
      case "fontFamily": setFontFamily(value); break;
    }
  };

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
            "placeholder-gray-400 border rounded w-full resize-none focus:outline-none border-none  px-2",
            "whitespace-pre-wrap break-words",
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
            className="col-start-1 row-start-1 px-2 pointer-events-none break-words whitespace-pre-wrap"
            style={{
              fontSize,
              textAlign,
              fontWeight: getFontWeightStyle(),
              fontStyle: italic ? "italic" : "normal",
              fontFamily: getFontFamilyStyle(),
              lineHeight: "100%",
              minHeight: `calc(${fontSize} + 10px)`,
              color: "#575a60",
              alignContent: "center",
              backgroundColor: "#cccccc3b",
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {showMenu && (
        <div
          className="absolute z-[999] top-full left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded-md p-2 w-auto flex gap-2 mt-1"
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
                {[8, 12, 14, 16, 18, 24, 28, 36, 40, 48].map((size) => (
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
                ))}
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
        </div>
      )}
    </div>
  );
}
