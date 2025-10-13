"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Underline, ChevronDown } from "lucide-react";

type StyledInputProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function StyledInput({
  className,
  value,
  onChange,
  ...props
}: StyledInputProps) {
  const [fontWeight, setFontWeight] = useState("font-normal");
  const [fontSize, setFontSize] = useState<string>("16px");
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [fontFamily, setFontFamily] = useState<string>("font-sans");

  const [showMenu, setShowMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    if (className) {
      const match = className.match(/text-\[(\d+)px\]/);
      if (match) {
        setFontSize(`${match[1]}px`);
      }
      if (className.includes("text-left")) setTextAlign("left");
      if (className.includes("text-right")) setTextAlign("right");
      if (className.includes("text-center")) setTextAlign("center");
    }
  }, [className]);

  const handleMouseEnter = (key: string) => {
    setActiveDropdown(key);
  };

  const handleMouseLeave = (key: string) => {
    if (activeDropdown === key) setActiveDropdown(null);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block w-full"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => {
        hoverRef.current = false;
        if (
          document.activeElement !== wrapperRef.current?.querySelector("textarea")
        ) {
          setShowMenu(false);
          setActiveDropdown(null);
        }
      }}
    >
      <textarea
        value={value}
        onChange={onChange}
        onFocus={() => setShowMenu(true)}
        onBlur={() => {
          if (!hoverRef.current) {
            setShowMenu(false);
            setActiveDropdown(null);
          }
        }}
        style={{ fontSize, textAlign }}
        className={cn(
          "placeholder-gray-400 border rounded w-full resize-none focus:outline-none border-none overflow-hidden",
          className,
          fontWeight,
          fontFamily,
          italic && "italic",
          underline && "underline"
        )}
        {...props}
      />

      {showMenu && (
        <div
          className="absolute z-[999] top-full left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded-md p-2 w-auto flex gap-2"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Font Weight */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("weight")}
            onMouseLeave={() => handleMouseLeave("weight")}
          >
            <button
              type="button"
              className="px-2 py-2 text-xs text-black border w-fit text-nowrap rounded flex items-center gap-1 hover:bg-gray-100"
            >
              {
                {
                  "font-thin": "Thin",
                  "font-normal": "Normal",
                  "font-medium": "Medium",
                  "font-bold": "Bold",
                  "font-extrabold": "Extra Bold",
                }[fontWeight]
              } <ChevronDown className="w-3 h-3" />
            </button>
            {activeDropdown === "weight" && (
              <div className="absolute left-0  bg-white border rounded shadow-md z-[999] w-28">
                {[
                  { label: "Thin", value: "font-thin" },
                  { label: "Normal", value: "font-normal" },
                  { label: "Medium", value: "font-medium" },
                  { label: "Bold", value: "font-bold" },
                  { label: "Extra Bold", value: "font-extrabold" },
                ].map((fw) => (
                  <button
                    key={fw.value}
                    type="button"
                    className={cn(
                      "block w-[90%] justify-self-center m-1 text-black rounded-[2px] text-left px-2 py-1 text-[12px] font-[400] bg-gray-100 hover:bg-gray-800 hover:text-white",
                      fontWeight === fw.value && "bg-gray-800 text-white"
                    )}
                    onClick={() => {
                      setFontWeight(fw.value);
                      setActiveDropdown(null);
                    }}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("size")}
            onMouseLeave={() => handleMouseLeave("size")}
          >
            <button
              type="button"
              className="px-2 py-2 text-xs text-black border w-fit text-nowrap rounded flex items-center gap-1 hover:bg-gray-100"
            >
              {fontSize.replace("px", "")} px <ChevronDown className="w-3 h-3" />
            </button>
            {activeDropdown === "size" && (
              <div className="absolute left-0  bg-white border rounded shadow-md z-[999] w-28 max-h-40 overflow-auto">
                {[8, 12, 14, 16, 18, 24, 28, 36, 40, 48].map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={cn(
                      "block w-[90%] justify-self-center m-1 text-black rounded-[2px] text-left px-2 py-1 text-[12px] font-[400] bg-gray-100 hover:bg-gray-800 hover:text-white",
                      fontSize === `${size}px` && "bg-gray-800 text-white"
                    )}
                    onClick={() => {
                      setFontSize(`${size}px`);
                      setActiveDropdown(null);
                    }}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Family */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("family")}
            onMouseLeave={() => handleMouseLeave("family")}
          >
            <button
              type="button"
              className="px-2 py-2 text-xs text-black border w-fit text-nowrap rounded flex items-center gap-1 hover:bg-gray-100"
            >
              {
                {
                  "font-alexandria": "Alexandria",
                  "font-raleway": "Raleway",
                  "font-sans": "Sans Serif",
                }[fontFamily]
              } <ChevronDown className="w-3 h-3" />
            </button>
            {activeDropdown === "family" && (
              <div className="absolute left-0  bg-white border rounded shadow-md z-[999] w-32">
                {[
                  { label: "Alexandria", value: "font-alexandria" },
                  { label: "Raleway", value: "font-raleway" },
                  { label: "Sans Serif", value: "font-sans" },
                ].map((ff) => (
                  <button
                    key={ff.value}
                    type="button"
                    className={cn(
                      "block w-[90%] justify-self-center m-1 text-black rounded-[2px] text-left px-2 py-1 text-[12px] font-[400] bg-gray-100 hover:bg-gray-800 hover:text-white",
                      fontFamily === ff.value && "bg-gray-800 text-white"
                    )}
                    onClick={() => {
                      setFontFamily(ff.value);
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
              onClick={() => setItalic(!italic)}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "p-1 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100",
                underline && "bg-gray-800 text-white"
              )}
              onClick={() => setUnderline(!underline)}
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "p-2 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100",
                fontWeight === "font-bold" && "bg-gray-800 text-white"
              )}
              onClick={() => setFontWeight("font-bold")}
            >
              <Bold className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
