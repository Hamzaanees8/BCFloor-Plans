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
import { useFieldPanel } from "./FieldPanelContext";
import { DraggableBoxContext } from "./DraggableBox";

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
  BcfpStandard7: {
    name: "BcfpStandard7",
    fonts: [
      {
        label: "Caslon Pro Bold",
        value: "font-caslon-bold",
        css: "ACaslonProBoldBcfp7, serif",
      },
      {
        label: "Arial",
        value: "font-arial-regular",
        css: "ArialRegularBcfp7, sans-serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp7, sans-serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanProBoldBcfp7, serif",
      },
    ],
  },
  bcfpstandard7: {
    name: "BcfpStandard7",
    fonts: [
      {
        label: "Caslon Pro Bold",
        value: "font-caslon-bold",
        css: "ACaslonProBoldBcfp7, serif",
      },
      {
        label: "Arial",
        value: "font-arial-regular",
        css: "ArialRegularBcfp7, sans-serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp7, sans-serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanProBoldBcfp7, serif",
      },
    ],
  },
  BcfpStandard8: {
    name: "BcfpStandard8",
    fonts: [
      {
        label: "Gothic",
        value: "font-gothic",
        css: "GothicRegularBcfp8, sans-serif",
      },
      {
        label: "Gothic Bold",
        value: "font-gothic-bold",
        css: "GothicBoldBcfp8, sans-serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanProBoldBcfp8, serif",
      },
      {
        label: "Trajan Pro Regular",
        value: "font-trajan-regular",
        css: "TrajanProRegularBcfp8, serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp8, sans-serif",
      },
    ],
  },
  bcfpstandard8: {
    name: "BcfpStandard8",
    fonts: [
      {
        label: "Gothic",
        value: "font-gothic",
        css: "GothicRegularBcfp8, sans-serif",
      },
      {
        label: "Gothic Bold",
        value: "font-gothic-bold",
        css: "GothicBoldBcfp8, sans-serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanProBoldBcfp8, serif",
      },
      {
        label: "Trajan Pro Regular",
        value: "font-trajan-regular",
        css: "TrajanProRegularBcfp8, serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp8, sans-serif",
      },
    ],
  },
  BcfpStandard15: {
    name: "BcfpStandard15",
    fonts: [
      {
        label: "Gothic",
        value: "font-gothic",
        css: "GothicRegularBcfp15, sans-serif",
      },
      {
        label: "Gothic Bold",
        value: "font-gothic-bold",
        css: "GothicBoldBcfp15, sans-serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanProBoldBcfp15, serif",
      },
      {
        label: "Trajan Pro Regular",
        value: "font-trajan-regular",
        css: "TrajanProRegularBcfp15, serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp15, sans-serif",
      },
    ],
  },
  bcfpstandard15: {
    name: "BcfpStandard15",
    fonts: [
      {
        label: "Gothic",
        value: "font-gothic",
        css: "GothicRegularBcfp15, sans-serif",
      },
      {
        label: "Gothic Bold",
        value: "font-gothic-bold",
        css: "GothicBoldBcfp15, sans-serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanProBoldBcfp15, serif",
      },
      {
        label: "Trajan Pro Regular",
        value: "font-trajan-regular",
        css: "TrajanProRegularBcfp15, serif",
      },
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp15, sans-serif",
      },
    ],
  },
  BcfpStandard17: {
    name: "BcfpStandard17",
    fonts: [
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp17, sans-serif",
      },
      {
        label: "Caslon Pro Bold",
        value: "font-caslon-bold",
        css: "ACaslonProBoldBcfp17, serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanProBoldBcfp17, serif",
      },
      {
        label: "Trajan Pro",
        value: "font-trajan-regular",
        css: "TrajanProRegularBcfp17, serif",
      },
      {
        label: "Arial Regular",
        value: "font-arial-regular",
        css: "ArialRegularBcfp17, sans-serif",
      },
    ],
  },
  bcfpstandard17: {
    name: "BcfpStandard17",
    fonts: [
      {
        label: "Arial Bold",
        value: "font-arial-bold",
        css: "ArialBoldBcfp17, sans-serif",
      },
      {
        label: "Caslon Pro Bold",
        value: "font-caslon-bold",
        css: "ACaslonProBoldBcfp17, serif",
      },
      {
        label: "Trajan Pro Bold",
        value: "font-trajan-bold",
        css: "TrajanProBoldBcfp17, serif",
      },
      {
        label: "Trajan Pro",
        value: "font-trajan-regular",
        css: "TrajanProRegularBcfp17, serif",
      },
      {
        label: "Arial Regular",
        value: "font-arial-regular",
        css: "ArialRegularBcfp17, sans-serif",
      },
    ],
  },
};

// Add uppercase and clean key aliases
FONT_FOLDERS["BCFPStandard3"] = FONT_FOLDERS["BcfpStandard3"];
FONT_FOLDERS["BCFPStandard4"] = FONT_FOLDERS["BcfpStandard4"];
FONT_FOLDERS["BCFPStandard6"] = FONT_FOLDERS["BcfpStandard6"];
FONT_FOLDERS["BCFPStandard7"] = FONT_FOLDERS["BcfpStandard7"];
FONT_FOLDERS["BCFPStandard8"] = FONT_FOLDERS["BcfpStandard8"];
FONT_FOLDERS["BCFPStandard15"] = FONT_FOLDERS["BcfpStandard15"];
FONT_FOLDERS["BCFPStandard17"] = FONT_FOLDERS["BcfpStandard17"];

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
  /** Unique field identifier used to register this field in FieldPanelContext */
  fieldId?: string;
  /** Human-readable label shown in the side panel header */
  fieldLabel?: string;
  /** Nudge callback passed from DraggableBox parent — forwarded to the panel */
  onNudge?: (dx: number, dy: number) => void;
  /** Delete callback forwarded to the panel */
  onDelete?: () => void;
  /** Reset position callback forwarded to the panel */
  onResetPosition?: () => void;
  /** Opt-in block paragraph mode so wrapped lines flow underneath a leading label via textIndentPx */
  flowMode?: boolean;
  /** First-line horizontal indent (px) applied when flowMode is true */
  textIndentPx?: number;
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
  if (!fw) return "font-normal";
  const fwStr = String(fw).toLowerCase();
  if (fwStr === "bold" || fwStr === "bolder" || fwStr === "700") return "font-bold";
  if (fwStr === "normal" || fwStr === "400") return "font-normal";
  if (
    fwStr === "100" ||
    fwStr === "200" ||
    fwStr === "300" ||
    fwStr === "thin" ||
    fwStr === "light"
  )
    return "font-thin";
  if (fwStr === "500" || fwStr === "medium") return "font-medium";
  if (fwStr === "600" || fwStr === "semibold") return "font-semibold";
  if (fwStr === "800" || fwStr === "extrabold") return "font-extrabold";
  if (fwStr === "900" || fwStr === "black") return "font-black";
  return "font-normal";
}

/** Convert a CSS fontFamily string back to an internal key for display.
 *  Used when restoring a saved TextStyle (importFromPayload). */
function fontFamilyToClass(ff?: string): string {
  if (!ff) return "font-sans";
  const f = ff.toLowerCase();
  if (
    f.includes("champagnelimousinesbold") ||
    (f.includes("champagne") && (f.includes("bold") || f.includes("700")))
  )
    return "font-champagne-bold";
  if (f.includes("champagne")) return "font-champagne";
  if (f.includes("gothici") || (f.includes("gothic") && f.includes("italic")))
    return "font-gothic-italic";
  if (f.includes("alexandria")) return "font-alexandria";
  if (f.includes("raleway")) return "font-raleway";
  // BcfpStandard7 fonts
  if (f.includes("acaslonproboldbcfp7")) return "font-caslon-bold";
  if (f.includes("arialregularbcfp7")) return "font-arial-regular";
  if (f.includes("arialboldbcfp7")) return "font-arial-bold";
  if (f.includes("trajanproboldbcfp7")) return "font-trajan-bold";
  // BcfpStandard8 fonts
  if (f.includes("gothicregularbcfp8")) return "font-gothic";
  if (f.includes("gothicboldbcfp8")) return "font-gothic-bold";
  if (f.includes("trajanproboldbcfp8")) return "font-trajan-bold";
  if (f.includes("trajanproregularbcfp8")) return "font-trajan-regular";
  if (f.includes("arialboldbcfp8")) return "font-arial-bold";
  // BcfpStandard15 fonts
  if (f.includes("gothicregularbcfp15")) return "font-gothic";
  if (f.includes("gothicboldbcfp15")) return "font-gothic-bold";
  if (f.includes("trajanproboldbcfp15")) return "font-trajan-bold";
  if (f.includes("trajanproregularbcfp15")) return "font-trajan-regular";
  if (f.includes("arialboldbcfp15")) return "font-arial-bold";
  // BcfpStandard17 fonts
  if (f.includes("acaslonproboldbcfp17")) return "font-caslon-bold";
  if (f.includes("trajanproboldbcfp17")) return "font-trajan-bold";
  if (f.includes("trajanproregularbcfp17")) return "font-trajan-regular";
  if (f.includes("arialregularbcfp17")) return "font-arial-regular";
  if (f.includes("arialboldbcfp17")) return "font-arial-bold";
  // BcfpStandard3 fonts
  if (f.includes("gothicregularbcfp3")) return "font-gothic";
  if (f.includes("gothicboldbcfp3")) return "font-gothic-bold";
  if (f.includes("arialboldbcfp3")) return "font-arial-bold";
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
  if (
    f.includes("gothicbold") ||
    f.includes("gothic bold") ||
    (f.includes("gothic") && (f.includes("bold") || f.includes("700")))
  )
    return "font-gothic-bold";
  if (
    f.includes("gothicregular") ||
    (f.includes("gothic") && !f.includes("bold"))
  )
    return "font-gothic";
  if (
    f.includes("trajanproregular") ||
    (f.includes("trajan") && (f.includes("regular") || !f.includes("bold")))
  )
    return "font-trajan-regular";
  if (f.includes("trajanpro") || f.includes("trajan"))
    return "font-trajan-bold";
  if (
    f.includes("arialbold") ||
    f.includes("arial bold") ||
    (f.includes("arial") && (f.includes("bold") || f.includes("700")))
  )
    return "font-arial-bold";
  if (f.includes("arial")) return "font-arial-regular";
  if (f.includes("serif") && !f.includes("sans-serif")) return "font-serif";
  return "font-sans";
}

export const toCleanString = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && "value" in val) return toCleanString(val.value);
  if (Array.isArray(val)) return val.map(toCleanString).join("\n");
  return String(val);
};

export default function StyledInput({
  className,
  value,
  onChange,
  onChangeStyle,
  inputStyle,
  placeholder,
  fontFolder,
  wrapperClassName,
  fieldId,
  fieldLabel,
  onNudge,
  onDelete,
  onResetPosition,
  flowMode = false,
  textIndentPx,
  style: passedStyle,
  ...props
}: StyledInputProps) {
  const contextFontFolder = useContext(FontFolderContext);
  const activeFontFolder = fontFolder || contextFontFolder;
  const folderConfig = activeFontFolder
    ? FONT_FOLDERS[activeFontFolder] ||
      FONT_FOLDERS[activeFontFolder.toLowerCase()] ||
      Object.values(FONT_FOLDERS).find(
        (f) => f.name.toLowerCase() === activeFontFolder.toLowerCase(),
      )
    : undefined;
  const customFonts = folderConfig?.fonts || [];

  // FieldPanel context – optional; graceful no-op when not inside a provider
  const fieldPanel = useFieldPanel();
  // Parent DraggableBox context if wrapped inside one
  const draggableBox = useContext(DraggableBoxContext);
  const draggableBoxRef = useRef(draggableBox);
  draggableBoxRef.current = draggableBox;

  const onNudgeRef = useRef(onNudge);
  onNudgeRef.current = onNudge;

  const onResetPositionRef = useRef(onResetPosition);
  onResetPositionRef.current = onResetPosition;

  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;

  // Panel is "active" for this field when the panel is open and showing THIS field
  const isPanelActive = !!fieldPanel;

  const effectiveFieldId = fieldId || draggableBox?.id || "field";
  const effectiveFieldLabel =
    fieldLabel ||
    draggableBox?.label ||
    (draggableBox?.id
      ? draggableBox.id.charAt(0).toUpperCase() + draggableBox.id.slice(1)
      : "Text Field");

  const [fontWeight, setFontWeight] = useState<string>(() => {
    if (inputStyle?.fontWeight) return fontWeightToClass(inputStyle.fontWeight);
    if (className) {
      if (className.includes("font-extrabold")) return "font-extrabold";
      if (className.includes("font-bold")) return "font-bold";
      if (className.includes("font-semibold")) return "font-semibold";
      if (className.includes("font-medium")) return "font-medium";
      if (className.includes("font-light") || className.includes("font-thin")) return "font-thin";
      if (className.includes("font-normal")) return "font-normal";
    }
    return "font-normal";
  });
  const [fontSize, setFontSize] = useState<string>(() => {
    if (inputStyle?.fontSize) return inputStyle.fontSize;
    if (className) {
      const match = className.match(/text-\[(\d+px)\]/);
      if (match) return match[1];
    }
    return "16px";
  });
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<
    "left" | "center" | "right" | "justify"
  >("center");
  const [verticalAlign, setVerticalAlign] = useState<
    "top" | "center" | "bottom"
  >("center");
  const [fontFamily, setFontFamily] = useState<string>(() => {
    if (inputStyle?.fontFamily) return fontFamilyToClass(inputStyle.fontFamily);
    if (className) {
      if (className.includes("font-champagne-bold")) return "font-champagne-bold";
      if (className.includes("font-champagne")) return "font-champagne";
      if (className.includes("font-gothic-italic")) return "font-gothic-italic";
      if (className.includes("font-raleway")) return "font-raleway";
      if (className.includes("font-alexandria")) return "font-alexandria";
      if (className.includes("font-caslon-bold")) return "font-caslon-bold";
      if (className.includes("font-caslon")) return "font-caslon";
      if (className.includes("font-trajan-bold")) return "font-trajan-bold";
      if (className.includes("font-trajan-regular") || className.includes("font-trajan")) return "font-trajan-regular";
      if (className.includes("font-gothic-bold")) return "font-gothic-bold";
      if (className.includes("font-gothic")) return "font-gothic";
      if (className.includes("font-arial-bold")) return "font-arial-bold";
      if (className.includes("font-arial-regular") || className.includes("font-arial")) return "font-arial-regular";
      if (className.includes("font-serif")) return "font-serif";
    }
    return "font-sans";
  });
  const [internalValue, setInternalValue] = useState<string>(() =>
    toCleanString(value),
  );
  const [isFocused, setIsFocused] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(
    !toCleanString(value),
  );

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
      const isAbove = rect.bottom + 150 > window.innerHeight;

      const top = isAbove
        ? rect.top + window.scrollY - 10
        : rect.bottom + window.scrollY + 10;

      let left = rect.left + window.scrollX + rect.width / 2;
      let transformX = "translateX(-50%)";

      // If it would go off the left side
      if (rect.left < 150) {
        left = rect.left + window.scrollX;
        transformX = "none";
      }
      // If it would go off the right side
      else if (rect.right + 150 > window.innerWidth) {
        left = rect.right + window.scrollX;
        transformX = "translateX(-100%)";
      }

      const transformY = isAbove ? "translateY(-100%)" : "";
      const transform =
        transformX === "none"
          ? transformY || "none"
          : `${transformX} ${transformY}`.trim();

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
      const stringValue = toCleanString(value);

      setInternalValue(stringValue);
      setShowPlaceholder(!stringValue);
      if (
        editableRef.current &&
        editableRef.current.innerText !== stringValue &&
        editableRef.current.textContent !== stringValue
      ) {
        editableRef.current.innerText = stringValue;
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

      if (className.includes("font-extrabold")) setFontWeight("font-extrabold");
      else if (className.includes("font-bold")) setFontWeight("font-bold");
      else if (className.includes("font-semibold")) setFontWeight("font-semibold");
      else if (className.includes("font-medium")) setFontWeight("font-medium");
      else if (className.includes("font-light")) setFontWeight("font-thin");
      else if (className.includes("font-thin")) setFontWeight("font-thin");
      else if (className.includes("font-normal")) setFontWeight("font-normal");

      if (className.includes("font-champagne-bold")) setFontFamily("font-champagne-bold");
      else if (className.includes("font-champagne")) setFontFamily("font-champagne");
      else if (className.includes("font-gothic-italic")) setFontFamily("font-gothic-italic");
      else if (className.includes("font-alexandria")) setFontFamily("font-alexandria");
      else if (className.includes("font-raleway")) setFontFamily("font-raleway");
      else if (className.includes("font-caslon-bold")) setFontFamily("font-caslon-bold");
      else if (className.includes("font-caslon")) setFontFamily("font-caslon");
      else if (className.includes("font-trajan-bold")) setFontFamily("font-trajan-bold");
      else if (className.includes("font-trajan-regular") || className.includes("font-trajan")) setFontFamily("font-trajan-regular");
      else if (className.includes("font-gothic-bold")) setFontFamily("font-gothic-bold");
      else if (className.includes("font-gothic")) setFontFamily("font-gothic");
      else if (className.includes("font-arial-bold")) setFontFamily("font-arial-bold");
      else if (className.includes("font-arial-regular") || className.includes("font-arial")) setFontFamily("font-arial-regular");
      else if (className.includes("font-serif")) setFontFamily("font-serif");
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
    if (inputStyle.fontStyle !== undefined) {
      setItalic(inputStyle.fontStyle === "italic");
    }
    if (inputStyle.textDecoration !== undefined) {
      setUnderline(inputStyle.textDecoration === "underline");
    }
    if (inputStyle.textAlign) setTextAlign(inputStyle.textAlign);
    if (inputStyle.verticalAlign) {
      setVerticalAlign(inputStyle.verticalAlign);
    } else if (inputStyle.alignContent) {
      if (inputStyle.alignContent === "start") setVerticalAlign("top");
      else if (inputStyle.alignContent === "end") setVerticalAlign("bottom");
      else setVerticalAlign("center");
    }
  }, [inputStyle]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const getFontWeightStyle = () => {
    switch (fontWeight) {
      case "font-thin":
        return "200";
      case "font-light":
        return "300";
      case "font-normal":
        return "400";
      case "font-medium":
        return "500";
      case "font-semibold":
        return "600";
      case "font-bold":
        return "700";
      case "font-extrabold":
        return "800";
      case "font-black":
        return "900";
      default:
        return "400";
    }
  };

  const getFontStrokeStyle = (): string | undefined => {
    switch (fontWeight) {
      case "font-medium":
        return "0.35px currentColor";
      case "font-semibold":
        return "0.5px currentColor";
      case "font-extrabold":
        return "0.6px currentColor";
      case "font-black":
        return "0.8px currentColor";
      default:
        return undefined;
    }
  };

  const getLetterSpacingStyle = (): string | undefined => {
    switch (fontWeight) {
      case "font-thin":
        return "0.015em";
      default:
        return undefined;
    }
  };

  const getFontFamilyStyle = () => {
    const isThin = fontWeight === "font-thin" || fontWeight === "font-light";
    const matchCustom = customFonts.find(
      (f) =>
        f.value === fontFamily ||
        (f.css && fontFamily && f.css.toLowerCase() === fontFamily.toLowerCase()),
    );
    if (matchCustom) {
      if (isThin && matchCustom.css.toLowerCase().includes("gothic")) {
        return `'Gothic A1', Mulish, ${matchCustom.css}`;
      }
      return matchCustom.css;
    }
    const f = (fontFamily || "").toLowerCase();
    if (f === "font-sans" || f === "sans-serif" || f === "sans") {
      if (isThin) return "'Gothic A1', Mulish, sans-serif";
      return "sans-serif";
    }
    if (
      f.includes("champagne-bold") ||
      f.includes("champagnelimousinesbold") ||
      (f.includes("champagne") && (f.includes("bold") || f.includes("700")))
    )
      return "ChampagneLimousinesBold, sans-serif";
    if (f.includes("champagne")) return "ChampagneLimousines, sans-serif";
    if (
      f.includes("gothic-italic") ||
      f.includes("gothici") ||
      (f.includes("gothic") && f.includes("italic"))
    )
      return "GothicItalic, sans-serif";
    if (f.includes("alexandria")) return "var(--font-alexandria), Alexandria, sans-serif";
    if (f.includes("raleway")) return "Raleway, sans-serif";
    if (f.includes("acaslonproboldbcfp7") || f.includes("caslon-bold") || (f.includes("caslon") && f.includes("bold")))
      return "ACaslonProBold, serif";
    if (f.includes("acaslonproregular") || f.includes("caslon-regular"))
      return "ACaslonProRegular, serif";
    if (f.includes("acaslonproitalic") || f.includes("caslon-italic"))
      return "ACaslonProItalic, serif";
    if (f.includes("bickhamscriptbold") || f.includes("bickham-bold") || (f.includes("bickham") && f.includes("bold")))
      return "BickhamScriptBold, cursive";
    if (f.includes("bickhamscriptregular") || f.includes("bickham-regular"))
      return "BickhamScriptRegular, cursive";
    if (f.includes("caslon")) return "ACaslonPro, serif";
    if (f.includes("bickham")) return "BickhamScript, cursive";
    if (f.includes("gothic-bold") || f.includes("gothicbold") || (f.includes("gothic") && f.includes("bold")))
      return "GothicBold, 'Gothic A1', Mulish, sans-serif";
    if (f.includes("gothic")) {
      if (isThin) return "'Gothic A1', Mulish, GothicRegular, sans-serif";
      return "GothicRegular, 'Gothic A1', Mulish, sans-serif";
    }
    if (f.includes("trajan-bold") || f.includes("trajanprobold") || (f.includes("trajan") && f.includes("bold")))
      return "TrajanProBold, serif";
    if (f.includes("trajan")) return "TrajanProRegular, serif";
    if (f.includes("arial-bold") || f.includes("arialbold") || (f.includes("arial") && f.includes("bold")))
      return "ArialBold, sans-serif";
    if (f.includes("arial")) {
      if (isThin) return "'Gothic A1', Mulish, Arial, sans-serif";
      return "Arial, sans-serif";
    }
    if (f.includes("serif") && !f.includes("sans-serif")) return "serif";
    if (isThin) return "'Gothic A1', Mulish, sans-serif";
    return customFonts.length > 0 ? customFonts[0].css : "Mulish, sans-serif";
  };

  const getAlignContentStyle = () => {
    const va = verticalAlign || inputStyle?.verticalAlign || "center";
    switch (va) {
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
          case "font-light":
            return "300";
          case "font-normal":
            return "400";
          case "font-medium":
            return "500";
          case "font-semibold":
            return "600";
          case "font-bold":
            return "700";
          case "font-extrabold":
            return "800";
          case "font-black":
            return "900";
          default:
            return "400";
        }
      })();

      const ffCss = (() => {
        const matchCustom = customFonts.find((f) => f.value === ff);
        if (matchCustom) return matchCustom.css;
        if (customFonts.length > 0 && (ff === "font-sans" || ff === "sans-serif")) {
          return customFonts[0].css;
        }
        const f = (ff || "").toLowerCase();
        if (
          f.includes("champagne-bold") ||
          f.includes("champagnelimousinesbold") ||
          (f.includes("champagne") && (f.includes("bold") || f.includes("700")))
        )
          return "ChampagneLimousinesBold, sans-serif";
        if (f.includes("champagne")) return "ChampagneLimousines, sans-serif";
        if (
          f.includes("gothic-italic") ||
          f.includes("gothici") ||
          (f.includes("gothic") && f.includes("italic"))
        )
          return "GothicItalic, sans-serif";
        if (f.includes("alexandria")) return "var(--font-alexandria), Alexandria, sans-serif";
        if (f.includes("raleway")) return "Raleway, sans-serif";
        if (f.includes("caslon") && f.includes("bold")) return "ACaslonProBold, serif";
        if (f.includes("caslon") && f.includes("italic")) return "ACaslonProItalic, serif";
        if (f.includes("caslon") && f.includes("regular")) return "ACaslonProRegular, serif";
        if (f.includes("caslon")) return "ACaslonPro, serif";
        if (f.includes("bickham") && f.includes("bold")) return "BickhamScriptBold, cursive";
        if (f.includes("bickham")) return "BickhamScript, cursive";
        if (f.includes("gothic") && f.includes("bold")) return "GothicBold, sans-serif";
        if (f.includes("gothic")) return "GothicRegular, sans-serif";
        if (f.includes("trajan") && f.includes("bold")) return "TrajanProBold, serif";
        if (f.includes("trajan")) return "TrajanProRegular, serif";
        if (f.includes("arial") && f.includes("bold")) return "ArialBold, sans-serif";
        if (f.includes("arial")) return "Arial, sans-serif";
        if (f.includes("serif") && !f.includes("sans-serif")) return "serif";
        return customFonts.length > 0 ? customFonts[0].css : "sans-serif";
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

      const itVal = overrides.it ?? italic;
      const ulVal = overrides.ul ?? underline;

      onChangeStyle({
        fontSize: fs,
        fontWeight: fwNum,
        fontFamily: ffCss,
        fontStyle: itVal ? "italic" : "normal",
        textDecoration: ulVal ? "underline" : "none",
        textAlign: ta,
        verticalAlign: va,
        alignContent: alignContentStr as any,
        letterSpacing: activeLetterSpacing,
        wordSpacing: activeWordSpacing,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      onChangeStyle,
      fontWeight,
      fontSize,
      fontFamily,
      textAlign,
      verticalAlign,
      customFonts,
    ],
  );

  // ─── Input handler ────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    const el = editableRef.current;
    if (!el) return;

    const caret = saveCaretPosition(el);

    const rawValue = (el.innerText !== undefined ? el.innerText : el.textContent) || "";
    const newValue = rawValue.replace(/\r\n/g, "\n");
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
    setShowPlaceholder((internalValue || "").length === 0);

    if (isPanelActive && fieldPanel) {
      const nudgeFn = (dx: number, dy: number) => {
        const dBox = draggableBoxRef.current;
        if (dBox?.onNudge) {
          dBox.onNudge(dx, dy);
        } else if (dBox) {
          const currentX = dBox.position?.x || 0;
          const currentY = dBox.position?.y || 0;
          dBox.onPositionChange(dBox.id, {
            x: currentX + dx,
            y: currentY + dy,
          });
        } else if (onNudgeRef.current) {
          onNudgeRef.current(dx, dy);
        }
      };

      const resetFn = () => {
        const dBox = draggableBoxRef.current;
        if (dBox) {
          dBox.onPositionChange(dBox.id, { x: 0, y: 0 });
        } else if (onResetPositionRef.current) {
          onResetPositionRef.current();
        }
      };

      const deleteFn = () => {
        if (onDeleteRef.current) onDeleteRef.current();
        else if (draggableBoxRef.current?.onDelete)
          draggableBoxRef.current.onDelete();
      };

      const getDropdownFontFamily = () => {
        const f = (fontFamily || inputStyle?.fontFamily || "").toLowerCase();
        if (
          f === "font-sans" ||
          f === "sans-serif" ||
          f === "sans" ||
          f.includes("mulish")
        )
          return "sans-serif";
        if (
          f.includes("champagne-bold") ||
          f.includes("champagnelimousinesbold")
        )
          return "ChampagneLimousinesBold, sans-serif";
        if (f.includes("champagne")) return "ChampagneLimousines, sans-serif";
        if (f.includes("gothic-bold") || f.includes("gothicbold"))
          return "GothicBold, sans-serif";
        if (f.includes("gothic")) return "GothicRegular, sans-serif";
        if (f.includes("alexandria")) return "Alexandria, sans-serif";
        if (f.includes("raleway")) return "Raleway, sans-serif";
        if (f.includes("arial-bold") || f.includes("arialbold"))
          return "ArialBold, sans-serif";
        if (f.includes("arial")) return "ArialRegular, sans-serif";
        if (f.includes("caslon-bold")) return "ACaslonProBold, serif";
        if (f.includes("caslon")) return "ACaslonProRegular, serif";
        if (f.includes("serif") && !f.includes("sans-serif")) return "serif";
        if (inputStyle?.fontFamily) return inputStyle.fontFamily;
        return "sans-serif";
      };

      fieldPanel.openPanel({
        fieldId: effectiveFieldId,
        fieldLabel: effectiveFieldLabel,
        currentStyle: {
          fontSize,
          fontWeight: getFontWeightStyle(),
          fontFamily: getDropdownFontFamily(),
          textAlign,
          verticalAlign,
          alignContent: getAlignContentStyle() as any,
          fontStyle: italic ? "italic" : "normal",
          textDecoration: underline ? "underline" : "none",
        },
        customFonts,
        onStyleChange: (style) => {
          if (style.fontSize) setFontSize(style.fontSize);
          if (style.fontWeight !== undefined) {
            setFontWeight(fontWeightToClass(style.fontWeight));
          }
          if (style.fontFamily) {
            setFontFamily(fontFamilyToClass(style.fontFamily));
          }
          if (style.textAlign) setTextAlign(style.textAlign);
          if (style.verticalAlign) setVerticalAlign(style.verticalAlign);
          if (style.fontStyle !== undefined)
            setItalic(style.fontStyle === "italic");
          if (style.textDecoration !== undefined)
            setUnderline(style.textDecoration === "underline");

          if (onChangeStyle) onChangeStyle(style);
        },
        onNudge: nudgeFn,
        onResetPosition: resetFn,
        onDelete: deleteFn,
      });
    } else {
      setShowMenu(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setShowPlaceholder(internalValue.length === 0);

    if (!isPanelActive && !hoverRef.current) {
      setShowMenu(false);
      setActiveDropdown(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      handleInput();
      return;
    }
    const isDeleteKey =
      e.key === "Delete" ||
      e.key === "Del" ||
      (e.metaKey && e.key === "Backspace");
    if ((e.ctrlKey || e.metaKey) && isDeleteKey) {
      e.preventDefault();
      e.stopPropagation();
      if (onDeleteRef.current) onDeleteRef.current();
      else if (draggableBoxRef.current?.onDelete)
        draggableBoxRef.current.onDelete();
      fieldPanel?.closePanel();
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

  const activeTextAlign = textAlign || inputStyle?.textAlign || "left";
  const activeVerticalAlign =
    verticalAlign || inputStyle?.verticalAlign || "center";

  const isSingleLine =
    (props.rows === undefined || Number(props.rows) <= 1) &&
    !props.multiline &&
    !String(internalValue || "").includes("\n");

  const activeLineHeight = (() => {
    if (passedStyle?.lineHeight) return passedStyle.lineHeight;
    if (className?.includes("leading-none")) return 1;
    if (className?.includes("leading-tight")) return 1.25;
    if (className?.includes("leading-snug")) return 1.375;
    if (className?.includes("leading-normal")) return 1.5;
    const matchLeading = className?.match(/leading-\[(\d+(\.\d+)?(px|rem|em)?)\]/);
    if (matchLeading) return matchLeading[1];
    return isSingleLine ? 1 : 1.25;
  })();

  const activeLetterSpacing = (() => {
    if (passedStyle?.letterSpacing) return passedStyle.letterSpacing;
    if (inputStyle?.letterSpacing) return inputStyle.letterSpacing;
    const matchTracking = className?.match(/tracking-\[([^\]]+)\]/);
    if (matchTracking) return matchTracking[1];
    if (className?.includes("tracking-tighter")) return "-0.05em";
    if (className?.includes("tracking-tight")) return "-0.025em";
    if (className?.includes("tracking-wide")) return "0.025em";
    if (className?.includes("tracking-wider")) return "0.05em";
    if (className?.includes("tracking-widest")) return "0.1em";
    return getLetterSpacingStyle();
  })();

  const activeWordSpacing = (() => {
    if (passedStyle?.wordSpacing) return passedStyle.wordSpacing;
    if (inputStyle?.wordSpacing) return inputStyle.wordSpacing;
    const matchWordSpacing = className?.match(/(?:\[word-spacing:([^\]]+)\]|word-spacing-\[([^\]]+)\])/);
    if (matchWordSpacing) return matchWordSpacing[1] || matchWordSpacing[2];
    return undefined;
  })();

  const cleanedClassName = className
    ? className
        .replace(
          /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|serif|sans|mono)\b/g,
          "",
        )
        .replace(
          /\b(italic|not-italic|underline|no-underline|line-through)\b/g,
          "",
        )
        .replace(/\btext-(left|right|center|justify)\b/g, "")
        .trim()
    : "";

  return (
    <div
      ref={wrapperRef}
      data-styled-input-wrapper="true"
      data-single-line={isSingleLine ? "true" : "false"}
      className={cn(
        flowMode ? "relative block w-full" : "relative inline-block w-full content-center",
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
      <div className="relative grid h-full w-full flex-1 min-h-0">
        <div
          ref={editableRef}
          contentEditable
          data-styled-input="true"
          data-single-line={isSingleLine ? "true" : "false"}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            ...passedStyle,
            fontSize,
            textAlign: activeTextAlign,
            fontWeight: getFontWeightStyle(),
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
            fontFamily: getFontFamilyStyle(),
            lineHeight: activeLineHeight,
            WebkitTextStroke: getFontStrokeStyle(),
            letterSpacing: activeLetterSpacing,
            wordSpacing: activeWordSpacing,
            margin: 0,
            padding: "0 2px",
            minWidth: passedStyle?.minWidth || "1.25ch",
            boxSizing: "border-box",
            ...(flowMode
              ? {
                  display: "block",
                  textIndent:
                    textIndentPx !== undefined ? `${textIndentPx}px` : undefined,
                  minHeight: "1.35em",
                }
              : {
                  display: "flex",
                  flexDirection: isSingleLine ? "row" : "column",
                  justifyContent: isSingleLine
                    ? activeTextAlign === "left"
                      ? "flex-start"
                      : activeTextAlign === "right"
                        ? "flex-end"
                        : activeTextAlign === "justify"
                          ? "stretch"
                          : "center"
                    : activeVerticalAlign === "top"
                      ? "flex-start"
                      : activeVerticalAlign === "bottom"
                        ? "flex-end"
                        : "center",
                  alignItems: isSingleLine
                    ? activeVerticalAlign === "top"
                      ? "flex-start"
                      : activeVerticalAlign === "bottom"
                        ? "flex-end"
                        : "center"
                    : activeTextAlign === "left"
                      ? "flex-start"
                      : activeTextAlign === "right"
                        ? "flex-end"
                        : activeTextAlign === "justify"
                          ? "stretch"
                          : "center",
                  alignContent: getAlignContentStyle(),
                }),
            width: "100%",
            height: "100%",
            outline: "none",
          }}
          className={cn(
            "col-start-1 row-start-1",
            "placeholder-gray-400 border rounded w-full resize-none focus:outline-none border-none pr-1",
            "whitespace-pre-wrap break-words transition-all",
            !isFocused &&
              "hover:ring-1 hover:ring-white/30 hover:bg-black/5 cursor-text",
            cleanedClassName,
            isFocused && "ring-2 ring-blue-500",
          )}
          suppressContentEditableWarning={true}
          {...props}
        >
          {toCleanString(internalValue)}
        </div>

        {showPlaceholder && placeholder && (
          <div
            data-styled-input-placeholder="true"
            data-html2canvas-ignore="true"
            className={cn(
              "col-start-1 row-start-1 pr-2 pointer-events-none break-words whitespace-pre-wrap opacity-70",
              "print:hidden",
              cleanedClassName,
            )}
            style={{
              fontSize,
              textAlign: activeTextAlign,
              fontWeight: getFontWeightStyle(),
              fontStyle: italic ? "italic" : "normal",
              fontFamily: getFontFamilyStyle(),
              lineHeight: activeLineHeight,
              WebkitTextStroke: getFontStrokeStyle(),
              letterSpacing: activeLetterSpacing,
              wordSpacing: activeWordSpacing,
              margin: 0,
              padding: "0 2px",
              minWidth: passedStyle?.minWidth || "1.25ch",
              boxSizing: "border-box",
              ...(flowMode
                ? {
                    display: "block",
                    textIndent:
                      textIndentPx !== undefined ? `${textIndentPx}px` : undefined,
                  }
                : {
                    display: "flex",
                    flexDirection: isSingleLine ? "row" : "column",
                    justifyContent: isSingleLine
                      ? activeTextAlign === "left"
                        ? "flex-start"
                        : activeTextAlign === "right"
                          ? "flex-end"
                          : activeTextAlign === "justify"
                            ? "stretch"
                            : "center"
                      : activeVerticalAlign === "top"
                        ? "flex-start"
                        : activeVerticalAlign === "bottom"
                          ? "flex-end"
                          : "center",
                    alignItems: isSingleLine
                      ? activeVerticalAlign === "top"
                        ? "flex-start"
                        : activeVerticalAlign === "bottom"
                          ? "flex-end"
                          : "center"
                      : activeTextAlign === "left"
                        ? "flex-start"
                        : activeTextAlign === "right"
                          ? "flex-end"
                          : activeTextAlign === "justify"
                            ? "stretch"
                            : "center",
                    alignContent: getAlignContentStyle(),
                  }),
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {mounted &&
        !isPanelActive &&
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
                {(() => {
                  const custom = customFonts.find(
                    (f) => f.value === fontFamily,
                  );
                  if (custom) return custom.label;
                  const defaults: Record<string, string> = {
                    "font-sans": "Sans Serif",
                    "font-alexandria": "Alexandria",
                    "font-raleway": "Raleway",
                    "font-champagne": "Champagne & Limousines",
                    "font-champagne-bold": "Champagne & Limousines Bold",
                    "font-caslon-bold": "Caslon Pro Bold",
                    "font-caslon-regular": "Caslon Pro Regular",
                    "font-caslon-italic": "Caslon Pro Italic",
                    "font-bickham-bold": "Bickham Script Bold",
                    "font-bickham-regular": "Bickham Script",
                    "font-caslon": "Caslon Pro Bold",
                    "font-bickham": "Bickham Script",
                    "font-gothic": "Gothic",
                    "font-gothic-bold": "Gothic Bold",
                    "font-gothic-italic": "Gothic Italic",
                    "font-trajan-bold": "Trajan Pro Bold",
                    "font-trajan": "Trajan Pro",
                    "font-arial-bold": "Arial Bold",
                    "font-arial-regular": "Arial",
                  };
                  return defaults[fontFamily] ?? "Sans Serif";
                })()}{" "}
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
                      css: "var(--font-alexandria), Alexandria, sans-serif",
                    },
                    {
                      label: "Raleway",
                      value: "font-raleway",
                      css: "Raleway, sans-serif",
                    },
                    {
                      label: "Champagne & Limousines",
                      value: "font-champagne",
                      css: "ChampagneLimousines, sans-serif",
                    },
                    {
                      label: "Champagne & Limousines Bold",
                      value: "font-champagne-bold",
                      css: "ChampagneLimousinesBold, sans-serif",
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
                      label: "Gothic Italic",
                      value: "font-gothic-italic",
                      css: "GothicItalic, sans-serif",
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
