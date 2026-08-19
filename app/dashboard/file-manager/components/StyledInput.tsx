"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MoreVertical,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from "lucide-react";
import type { TextStyle } from "../types/featureSheetTypes";

export interface CustomFontOption {
  label: string;
  value: string;
  css: string;
}

export const FONT_FOLDERS: Record<
  string,
  { name: string; fonts: CustomFontOption[] }
> = {
  BcfpStandard3: {
    name: "BcfpStandard3",
    fonts: [
      {
        label: "Gothic",
        value: "font-gothic",
        css: "GothicRegularBcfp3, sans-serif",
      },
      {
        label: "Gothic Bold",
        value: "font-gothic-bold",
        css: "GothicBoldBcfp3, sans-serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp3, sans-serif",
      },
    ],
  },
  bcfpstandard3: {
    name: "BcfpStandard3",
    fonts: [
      {
        label: "Gothic",
        value: "font-gothic",
        css: "GothicRegularBcfp3, sans-serif",
      },
      {
        label: "Gothic Bold",
        value: "font-gothic-bold",
        css: "GothicBoldBcfp3, sans-serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp3, sans-serif",
      },
    ],
  },
  BcfpStandard4: {
    name: "BcfpStandard4",
    fonts: [
      {
        label: "Caslon Pro Bold",
        value: "font-caslon-bold",
        css: "ACaslonProBold, serif",
      },
      {
        label: "Caslon Pro Regular",
        value: "font-caslon-regular",
        css: "ACaslonProRegular, serif",
      },
      {
        label: "Caslon Pro Italic",
        value: "font-caslon-italic",
        css: "ACaslonProItalic, serif",
      },
      {
        label: "Bickham Script Bold",
        value: "font-bickham-bold",
        css: "BickhamScriptBold, cursive",
      },
      {
        label: "Bickham Script",
        value: "font-bickham-regular",
        css: "BickhamScriptRegular, cursive",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp4, sans-serif",
      },
    ],
  },
  bcfpstandard4: {
    name: "BcfpStandard4",
    fonts: [
      {
        label: "Caslon Pro Bold",
        value: "font-caslon-bold",
        css: "ACaslonProBold, serif",
      },
      {
        label: "Caslon Pro Regular",
        value: "font-caslon-regular",
        css: "ACaslonProRegular, serif",
      },
      {
        label: "Caslon Pro Italic",
        value: "font-caslon-italic",
        css: "ACaslonProItalic, serif",
      },
      {
        label: "Bickham Script Bold",
        value: "font-bickham-bold",
        css: "BickhamScriptBold, cursive",
      },
      {
        label: "Bickham Script",
        value: "font-bickham-regular",
        css: "BickhamScriptRegular, cursive",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp4, sans-serif",
      },
    ],
  },
  BcfpStandard6: {
    name: "BcfpStandard6",
    fonts: [
      {
        label: "Caslon Pro Bold",
        value: "font-caslon",
        css: "ACaslonPro, serif",
      },
      {
        label: "Bickham Script",
        value: "font-bickham",
        css: "BickhamScript, cursive",
      },
      {
        label: "Gothic",
        value: "font-gothic",
        css: "GothicRegular, sans-serif",
      },
      {
        label: "Gothic Bold",
        value: "font-gothic-bold",
        css: "GothicBold, sans-serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanPro, serif",
      },
      {
        label: "Trajan Pro",
        value: "font-trajan",
        css: "TrajanProRegular, serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBold, sans-serif",
      },
    ],
  },
  bcfpstandard6: {
    name: "BcfpStandard6",
    fonts: [
      {
        label: "Caslon Pro Bold",
        value: "font-caslon",
        css: "ACaslonPro, serif",
      },
      {
        label: "Bickham Script",
        value: "font-bickham",
        css: "BickhamScript, cursive",
      },
      {
        label: "Gothic",
        value: "font-gothic",
        css: "GothicRegular, sans-serif",
      },
      {
        label: "Gothic Bold",
        value: "font-gothic-bold",
        css: "GothicBold, sans-serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanPro, serif",
      },
      {
        label: "Trajan Pro",
        value: "font-trajan",
        css: "TrajanProRegular, serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBold, sans-serif",
      },
    ],
  },
};

export const FontFolderContext = createContext<string | undefined>(undefined);

export const FontFolderProvider: React.FC<{
  value?: string;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <FontFolderContext.Provider value={value}>
      {children}
    </FontFolderContext.Provider>
  );
};

type StyledInputProps = {
  className?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Called whenever the user changes any style property from the toolbar */
  onChangeStyle?: (style: TextStyle) => void;
  /** Pass a saved TextStyle to restore styles (e.g. after importFromPayload) */
  inputStyle?: TextStyle;
  placeholder?: string;
  /** Optional font folder override (e.g. "BcfpStandard6"). If not specified, checks FontFolderContext */
  fontFolder?: string;
  wrapperClassName?: string;
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

/** Convert a CSS fontFamily string back to an internal key for display.
 *  Used when restoring a saved TextStyle (importFromPayload). */
function fontFamilyToClass(ff?: string): string {
  if (!ff) return "font-sans";
  const f = ff.toLowerCase();
  if (f.includes("alexandria")) return "font-alexandria";
  if (f.includes("raleway")) return "font-raleway";
  // BcfpStandard4 fonts
  if (
    f.includes("acaslonproitalic") ||
    (f.includes("caslon") && f.includes("italic"))
  )
    return "font-caslon-italic";
  if (
    f.includes("acaslonproregular") ||
    (f.includes("caslon") && f.includes("regular"))
  )
    return "font-caslon-regular";
  if (
    f.includes("acaslonprobold") ||
    (f.includes("caslon") && f.includes("bold"))
  )
    return "font-caslon-bold";
  if (
    f.includes("bickhamscriptregular") ||
    (f.includes("bickham") && f.includes("regular"))
  )
    return "font-bickham-regular";
  if (
    f.includes("bickhamscriptbold") ||
    (f.includes("bickham") && f.includes("bold"))
  )
    return "font-bickham-bold";
  // BcfpStandard6 fonts
  if (f.includes("acaslonpro") || f.includes("caslon")) return "font-caslon";
  if (f.includes("bickhamscript") || f.includes("bickham"))
    return "font-bickham";
  if (f.includes("gothicbold") || f.includes("gothic bold"))
    return "font-gothic-bold";
  if (
    f.includes("gothicregular") ||
    (f.includes("gothic") && !f.includes("bold"))
  )
    return "font-gothic";
  if (
    f.includes("trajanproregular") ||
    (f.includes("trajan") && f.includes("regular"))
  )
    return "font-trajan";
  if (f.includes("trajanpro") || f.includes("trajan"))
    return "font-trajan-bold";
  if (f.includes("arialbold") || f.includes("arial bold"))
    return "font-arial-bold";
  return "font-sans";
}

export default function StyledInput({
  className,
  value,
  onChange,
  onChangeStyle,
  inputStyle,
  placeholder,
  fontFolder,
  wrapperClassName,
  ...props
}: StyledInputProps) {
  const contextFontFolder = useContext(FontFolderContext);
  const activeFontFolder = fontFolder || contextFontFolder;
  const folderConfig = activeFontFolder
    ? FONT_FOLDERS[activeFontFolder] ||
      FONT_FOLDERS[activeFontFolder.toLowerCase()]
    : undefined;
  const customFonts = folderConfig?.fonts || [];

  const [fontWeight, setFontWeight] = useState("font-normal");
  const [fontSize, setFontSize] = useState<string>("16px");
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<
    "left" | "center" | "right" | "justify"
  >("center");
  const [verticalAlign, setVerticalAlign] = useState<
    "top" | "center" | "bottom"
  >("center");
  const [fontFamily, setFontFamily] = useState<string>("font-sans");
  const [internalValue, setInternalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(!value);

  const [showMenu, setShowMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const editableRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const defaultFontSizeRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [menuCoords, setMenuCoords] = useState({
    top: 0,
    left: 0,
    transform: "translateX(-50%)",
  });

  const updatePosition = useCallback(() => {
    if (showMenu && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      let top = rect.bottom + window.scrollY + 4;
      let left = rect.left + window.scrollX + rect.width / 2;
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
      const stringValue =
        typeof value === "string"
          ? value
          : value && typeof value === "object" && "value" in (value as any)
            ? (value as any).value || ""
            : String(value || "");

      setInternalValue(stringValue);
      setShowPlaceholder(!stringValue);
      if (
        editableRef.current &&
        editableRef.current.textContent !== stringValue
      ) {
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
      if (className.includes("text-justify")) setTextAlign("justify");
    }
  }, [className]);

  // ─── Restore saved styles (from importFromPayload) ────────────────
  useEffect(() => {
    if (!inputStyle) return;
    if (inputStyle.fontSize) setFontSize(inputStyle.fontSize);
    if (inputStyle.fontWeight !== undefined) {
      setFontWeight(fontWeightToClass(inputStyle.fontWeight));
    }
    if (inputStyle.fontFamily)
      setFontFamily(fontFamilyToClass(inputStyle.fontFamily));
    if (inputStyle.textAlign) setTextAlign(inputStyle.textAlign);
    if (inputStyle.verticalAlign) {
      setVerticalAlign(inputStyle.verticalAlign);
    } else if (inputStyle.alignContent) {
      if (inputStyle.alignContent === "start") setVerticalAlign("top");
      else if (inputStyle.alignContent === "end") setVerticalAlign("bottom");
      else setVerticalAlign("center");
    }
    // italic / underline not stored in TextStyle currently — skip
  }, [inputStyle]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const getFontWeightStyle = () => {
    switch (fontWeight) {
      case "font-thin":
        return "100";
      case "font-normal":
        return "400";
      case "font-medium":
        return "500";
      case "font-bold":
        return "700";
      case "font-extrabold":
        return "800";
      default:
        return "400";
    }
  };

  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case "font-alexandria":
        return "Alexandria, sans-serif";
      case "font-raleway":
        return "Raleway, sans-serif";
      // BcfpStandard4
      case "font-caslon-bold":
        return "ACaslonProBold, serif";
      case "font-caslon-regular":
        return "ACaslonProRegular, serif";
      case "font-caslon-italic":
        return "ACaslonProItalic, serif";
      case "font-bickham-bold":
        return "BickhamScriptBold, cursive";
      case "font-bickham-regular":
        return "BickhamScriptRegular, cursive";
      // BcfpStandard6
      case "font-caslon":
        return "ACaslonPro, serif";
      case "font-bickham":
        return "BickhamScript, cursive";
      case "font-gothic":
        return "GothicRegular, sans-serif";
      case "font-gothic-bold":
        return "GothicBold, sans-serif";
      case "font-trajan-bold":
        return "TrajanPro, serif";
      case "font-trajan":
        return "TrajanProRegular, serif";
      case "font-arial-bold":
        return "ArialBold, sans-serif";
      case "font-sans":
      default:
        return "sans-serif";
    }
  };

  const getAlignContentStyle = () => {
    switch (verticalAlign) {
      case "top":
        return "start";
      case "bottom":
        return "end";
      case "center":
      default:
        return "center";
    }
  };

  /** Build a TextStyle snapshot and notify parent. */
  const notifyStyleChange = useCallback(
    (
      overrides: Partial<{
        fw: string;
        fs: string;
        ff: string;
        it: boolean;
        ul: boolean;
        ta: "left" | "center" | "right" | "justify";
        va: "top" | "center" | "bottom";
      }>,
    ) => {
      if (!onChangeStyle) return;
      const fw = overrides.fw ?? fontWeight;
      const fs = overrides.fs ?? fontSize;
      const ff = overrides.ff ?? fontFamily;
      const ta = overrides.ta ?? textAlign;
      const va = overrides.va ?? verticalAlign;

      const fwNum = (() => {
        switch (fw) {
          case "font-thin":
            return "100";
          case "font-normal":
            return "400";
          case "font-medium":
            return "500";
          case "font-bold":
            return "700";
          case "font-extrabold":
            return "800";
          default:
            return "400";
        }
      })();

      const ffCss = (() => {
        switch (ff) {
          case "font-alexandria":
            return "Alexandria, sans-serif";
          case "font-raleway":
            return "Raleway, sans-serif";
          // BcfpStandard4
          case "font-caslon-bold":
            return "ACaslonProBold, serif";
          case "font-caslon-regular":
            return "ACaslonProRegular, serif";
          case "font-caslon-italic":
            return "ACaslonProItalic, serif";
          case "font-bickham-bold":
            return "BickhamScriptBold, cursive";
          case "font-bickham-regular":
            return "BickhamScriptRegular, cursive";
          // BcfpStandard6
          case "font-caslon":
            return "ACaslonPro, serif";
          case "font-bickham":
            return "BickhamScript, cursive";
          case "font-gothic":
            return "GothicRegular, sans-serif";
          case "font-gothic-bold":
            return "GothicBold, sans-serif";
          case "font-trajan-bold":
            return "TrajanPro, serif";
          case "font-trajan":
            return "TrajanProRegular, serif";
          case "font-arial-bold":
            return "ArialBold, sans-serif";
          default:
            return "sans-serif";
        }
      })();

      const alignContentStr = (() => {
        switch (va) {
          case "top":
            return "start";
          case "bottom":
            return "end";
          default:
            return "center";
        }
      })();

      onChangeStyle({
        fontSize: fs,
        fontWeight: fwNum,
        fontFamily: ffCss,
        textAlign: ta,
        verticalAlign: va,
        alignContent: alignContentStr as any,
      });
    },
    [onChangeStyle, fontWeight, fontSize, fontFamily, textAlign, verticalAlign],
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
  const handleMouseLeave = (key: string) =>
    activeDropdown === key && setActiveDropdown(null);

  const applyStyle = (style: string, val: any) => {
    if (!editableRef.current) return;

    let newFw = fontWeight,
      newFs = fontSize,
      newFf = fontFamily,
      newIt = italic,
      newUl = underline,
      newTa = textAlign,
      newVa = verticalAlign;

    switch (style) {
      case "fontWeight":
        setFontWeight(val);
        newFw = val;
        break;
      case "fontSize":
        setFontSize(val);
        newFs = val;
        break;
      case "italic":
        setItalic(val);
        newIt = val;
        break;
      case "underline":
        setUnderline(val);
        newUl = val;
        break;
      case "textAlign":
        setTextAlign(val);
        newTa = val;
        break;
      case "verticalAlign":
        setVerticalAlign(val);
        newVa = val;
        break;
      case "fontFamily":
        setFontFamily(val);
        newFf = val;
        break;
    }

    notifyStyleChange({
      fw: newFw,
      fs: newFs,
      ff: newFf,
      it: newIt,
      ul: newUl,
      ta: newTa,
      va: newVa,
    });
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative inline-block w-full content-center",
        wrapperClassName,
      )}
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
        <div
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
            lineHeight: 1.2,
            margin: 0,
            padding: 0,
            boxSizing: "border-box",
            display: "block",
            outline: "none",
            alignContent: getAlignContentStyle(),
          }}
          className={cn(
            "col-start-1 row-start-1",
            "placeholder-gray-400 border rounded w-full resize-none focus:outline-none border-none pr-1",
            "whitespace-pre-wrap break-words transition-all",
            !isFocused &&
              "hover:ring-1 hover:ring-white/30 hover:bg-black/5 cursor-text",
            className,
            isFocused && "ring-2 ring-blue-500",
          )}
          suppressContentEditableWarning={true}
          {...props}
        >
          {internalValue}
        </div>

        {showPlaceholder && placeholder && (
          <div
            className={cn(
              "col-start-1 row-start-1 pr-2 pointer-events-none break-words whitespace-pre-wrap opacity-70",
              className,
            )}
            style={{
              fontSize,
              textAlign,
              fontWeight: getFontWeightStyle(),
              fontStyle: italic ? "italic" : "normal",
              fontFamily: getFontFamilyStyle(),
              lineHeight: 1.2,
              margin: 0,
              padding: 0,
              boxSizing: "border-box",
              display: "block",
              alignContent: getAlignContentStyle(),
              backgroundColor: "transparent",
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {mounted &&
        showMenu &&
        createPortal(
          <div
            className="absolute z-[99999] bg-white border shadow-lg rounded-md p-2 w-max flex gap-2"
            style={{
              top: menuCoords.top,
              left: menuCoords.left,
              transform: menuCoords.transform,
            }}
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
                {
                  {
                    "font-thin": "Thin",
                    "font-normal": "Normal",
                    "font-medium": "Medium",
                    "font-bold": "Bold",
                    "font-extrabold": "Extra Bold",
                  }[fontWeight]
                }{" "}
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
                        fontWeight === fw.value && "bg-gray-800 text-white",
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
                {fontSize.replace("px", "")} px{" "}
                <ChevronDown className="w-3 h-3" />
              </button>

              {activeDropdown === "size" && (
                <div className="absolute left-0 bg-white border rounded shadow-md z-[999] w-28 max-h-64 overflow-auto">
                  {(() => {
                    const ALL_SIZES = [
                      8, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72,
                    ];
                    let allowedSizes = [8, 12, 14, 16, 18, 24, 28, 36, 40, 48];

                    const activeNum = parseInt(fontSize.replace("px", ""), 10);
                    const targetSize =
                      defaultFontSizeRef.current !== null
                        ? defaultFontSizeRef.current
                        : !isNaN(activeNum)
                          ? activeNum
                          : 16;

                    if (targetSize !== null && targetSize !== undefined) {
                      const sorted = Array.from(
                        new Set([...ALL_SIZES, targetSize]),
                      ).sort((a, b) => a - b);
                      const idx = sorted.indexOf(targetSize);
                      allowedSizes = sorted.slice(
                        Math.max(0, idx - 3),
                        idx + 4,
                      );
                    }

                    return allowedSizes.map((size) => (
                      <button
                        key={size}
                        className={cn(
                          "block w-[90%] m-1 text-black rounded px-2 py-1 text-[12px] bg-gray-100 hover:bg-gray-800 hover:text-white",
                          fontSize === `${size}px` && "bg-gray-800 text-white",
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
                className="px-2 py-2 text-xs text-black border rounded flex items-center gap-1 hover:bg-gray-100 max-w-[120px] truncate"
              >
                {(
                  {
                    "font-sans": "Sans Serif",
                    "font-alexandria": "Alexandria",
                    "font-raleway": "Raleway",
                    "font-caslon-bold": "Caslon Pro Bold",
                    "font-caslon-regular": "Caslon Pro Regular",
                    "font-caslon-italic": "Caslon Pro Italic",
                    "font-bickham-bold": "Bickham Script Bold",
                    "font-bickham-regular": "Bickham Script",
                    "font-caslon": "Caslon Pro Bold",
                    "font-bickham": "Bickham Script",
                    "font-gothic": "Gothic",
                    "font-gothic-bold": "Gothic Bold",
                    "font-trajan-bold": "Trajan Pro Bold",
                    "font-trajan": "Trajan Pro",
                    "font-arial-bold": "Arial Bold",
                  } as Record<string, string>
                )[fontFamily] ?? "Sans Serif"}{" "}
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>

              {activeDropdown === "family" && (
                <div className="absolute left-0 bg-white border rounded shadow-md z-[999] w-44 max-h-64 overflow-y-auto">
                  {/* ── Sheet Custom Fonts (shown on TOP) ── */}
                  {customFonts.length > 0 && (
                    <>
                      <p className="px-2 py-0.5 text-[9px] text-gray-400 font-semibold uppercase tracking-wider select-none">
                        Sheet Fonts
                      </p>

                      {customFonts.map((ff) => (
                        <button
                          key={ff.value}
                          className={cn(
                            "block w-[90%] m-1 text-black rounded px-2 py-1 text-[12px] bg-gray-100 hover:bg-gray-800 hover:text-white",
                            fontFamily === ff.value && "bg-gray-800 text-white",
                          )}
                          style={{ fontFamily: ff.css }}
                          onClick={() => {
                            applyStyle("fontFamily", ff.value);
                            setActiveDropdown(null);
                          }}
                        >
                          {ff.label}
                        </button>
                      ))}

                      <div className="mx-2 my-1 border-t border-gray-200" />
                    </>
                  )}

                  {/* ── Default Fonts (shown on BOTTOM) ── */}
                  <p className="px-2 py-0.5 text-[9px] text-gray-400 font-semibold uppercase tracking-wider select-none">
                    Default Fonts
                  </p>

                  {[
                    {
                      label: "Sans Serif",
                      value: "font-sans",
                      css: "sans-serif",
                    },
                    {
                      label: "Alexandria",
                      value: "font-alexandria",
                      css: "Alexandria, sans-serif",
                    },
                    {
                      label: "Raleway",
                      value: "font-raleway",
                      css: "Raleway, sans-serif",
                    },
                  ].map((ff) => (
                    <button
                      key={ff.value}
                      className={cn(
                        "block w-[90%] m-1 text-black rounded px-2 py-1 text-[12px] bg-gray-100 hover:bg-gray-800 hover:text-white",
                        fontFamily === ff.value && "bg-gray-800 text-white",
                      )}
                      style={{ fontFamily: ff.css }}
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

            {/* Alignment Options (Google Docs Style) */}
            <div className="flex gap-0.5 border rounded p-0.5 bg-gray-50 items-center">
              <button
                type="button"
                title="Align Left"
                className={cn(
                  "p-1 rounded text-gray-700 hover:bg-gray-200 transition-colors",
                  textAlign === "left" &&
                    "bg-gray-800 text-white hover:bg-gray-800",
                )}
                onClick={() => applyStyle("textAlign", "left")}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                title="Align Center"
                className={cn(
                  "p-1 rounded text-gray-700 hover:bg-gray-200 transition-colors",
                  textAlign === "center" &&
                    "bg-gray-800 text-white hover:bg-gray-800",
                )}
                onClick={() => applyStyle("textAlign", "center")}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                title="Align Right"
                className={cn(
                  "p-1 rounded text-gray-700 hover:bg-gray-200 transition-colors",
                  textAlign === "right" &&
                    "bg-gray-800 text-white hover:bg-gray-800",
                )}
                onClick={() => applyStyle("textAlign", "right")}
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                title="Justify"
                className={cn(
                  "p-1 rounded text-gray-700 hover:bg-gray-200 transition-colors",
                  textAlign === "justify" &&
                    "bg-gray-800 text-white hover:bg-gray-800",
                )}
                onClick={() => applyStyle("textAlign", "justify")}
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Style Icons */}
            <div className="flex gap-1">
              <button
                type="button"
                className={cn(
                  "p-2 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100",
                  italic && "bg-gray-800 text-white",
                )}
                onClick={() => applyStyle("italic", !italic)}
              >
                <Italic className="h-4 w-4" />
              </button>

              <button
                type="button"
                className={cn(
                  "p-1 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100",
                  underline && "bg-gray-800 text-white",
                )}
                onClick={() => applyStyle("underline", !underline)}
              >
                <Underline className="h-4 w-4" />
              </button>

              <button
                type="button"
                className={cn(
                  "p-2 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100",
                  fontWeight === "font-bold" && "bg-gray-800 text-white",
                )}
                onClick={() => applyStyle("fontWeight", "font-bold")}
              >
                <Bold className="h-4 w-4" />
              </button>
            </div>

            {/* Options (Three Dots) Menu */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("options")}
              onMouseLeave={() => handleMouseLeave("options")}
            >
              <button
                type="button"
                title="More Options"
                className={cn(
                  "p-1.5 border rounded text-gray-800 hover:bg-gray-800 hover:text-gray-100 flex items-center justify-center",
                  activeDropdown === "options" && "bg-gray-800 text-white",
                )}
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "options" ? null : "options",
                  )
                }
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {activeDropdown === "options" && (
                <div className="absolute right-0 top-[calc(100%-1px)] bg-white border rounded shadow-lg z-[999] p-2 w-48 text-gray-800">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5 select-none">
                    Vertical Alignment
                  </p>
                  <div className="flex gap-1 border rounded p-1 bg-gray-50 items-center justify-around">
                    <button
                      type="button"
                      title="Align Top"
                      className={cn(
                        "p-1.5 rounded text-gray-700 hover:bg-gray-200 transition-colors",
                        verticalAlign === "top" &&
                          "bg-gray-800 text-white hover:bg-gray-800",
                      )}
                      onClick={() => {
                        applyStyle("verticalAlign", "top");
                        setActiveDropdown(null);
                      }}
                    >
                      <AlignVerticalJustifyStart className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      title="Align Middle (Center)"
                      className={cn(
                        "p-1.5 rounded text-gray-700 hover:bg-gray-200 transition-colors",
                        verticalAlign === "center" &&
                          "bg-gray-800 text-white hover:bg-gray-800",
                      )}
                      onClick={() => {
                        applyStyle("verticalAlign", "center");
                        setActiveDropdown(null);
                      }}
                    >
                      <AlignVerticalJustifyCenter className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      title="Align Bottom"
                      className={cn(
                        "p-1.5 rounded text-gray-700 hover:bg-gray-200 transition-colors",
                        verticalAlign === "bottom" &&
                          "bg-gray-800 text-white hover:bg-gray-800",
                      )}
                      onClick={() => {
                        applyStyle("verticalAlign", "bottom");
                        setActiveDropdown(null);
                      }}
                    >
                      <AlignVerticalJustifyEnd className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
