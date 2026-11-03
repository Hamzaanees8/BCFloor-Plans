// components/RichTextEditor.tsx
"use client";
import dynamic from "next/dynamic";
import "suneditor/dist/css/suneditor.min.css"; // Import CSS globally
import type SunEditorCore from "suneditor/src/lib/core";
import plugins from "suneditor/src/plugins";

import { useRef, useEffect, useMemo } from "react";

const SunEditor = dynamic(() => import("suneditor-react"), {
    ssr: false,
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    insertText?: string;
    onTextInserted?: () => void;
}

// Custom Emoji & Special Symbols plugin for SunEditor
const emojiPlugin: any = {
    name: "emoji",
    display: "submenu",
    title: "Insert Emoji / Symbol",
    buttonClass: "",
    innerHTML: '<span style="font-size: 15px; display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%;">😀</span>',
    add: function (core: any, targetElement: any) {
        const listDiv = (this as any).setSubmenu(core);

        listDiv.addEventListener("mousedown", (e: MouseEvent) => {
            e.stopPropagation();
        });

        listDiv.addEventListener("click", (e: MouseEvent) => {
            const btn = (e.target as HTMLElement)?.closest("button[data-emoji]");
            if (!btn) return;
            const emoji = btn.getAttribute("data-emoji");
            if (emoji) {
                core.insertHTML(emoji, true, true);
                core.submenuOff();
                core.focus();
            }
        });
        core.initMenuTarget(this.name, targetElement, listDiv);
    },
    on: function () {
        const menu = (this as any).submenu;
        const btn = (this as any).submenuActiveButton;
        if (menu && btn) {
            const topPos = btn.offsetTop + btn.offsetHeight + 4;
            menu.style.top = `${topPos}px`;
            menu.style.maxHeight = "320px";
            menu.style.overflowY = "auto";
            menu.style.display = "block";
            menu.style.visibility = "visible";
            menu.style.zIndex = "999999";

            const toolbarW = (this as any).context?.element?.toolbar?.offsetWidth || 800;
            const menuW = menu.offsetWidth || 280;
            const leftPos = btn.offsetLeft || 0;
            if (leftPos + menuW > toolbarW) {
                menu.style.left = `${Math.max(8, toolbarW - menuW - 12)}px`;
            } else {
                menu.style.left = `${leftPos}px`;
            }
        }
    },
    setSubmenu: function (core: any) {
        const listDiv = core.util.createElement("DIV");
        listDiv.className = "se-submenu se-list-layer";
        listDiv.style.width = "280px";
        listDiv.style.maxHeight = "300px";
        listDiv.style.overflowY = "auto";
        listDiv.style.padding = "10px";
        listDiv.style.backgroundColor = "#ffffff";
        listDiv.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
        listDiv.style.borderRadius = "8px";
        listDiv.style.border = "1px solid #e5e7eb";
        listDiv.style.zIndex = "999999";

        const groups = [
            {
                name: "Checkmarks & Status",
                items: ["✓", "✔", "✅", "❌", "⚠️", "⭐", "🔔", "🎉", "🔥", "💯"],
            },
            {
                name: "Real Estate & Orders",
                items: ["🏠", "🏢", "📍", "📅", "🕒", "✉️", "📞", "💵", "💳", "📄", "📋", "🔗", "📷", "🔑", "📦"],
            },
            {
                name: "Bullets & Arrows",
                items: ["➜", "➔", "➤", "•", "▸", "◆", "✦", "★", "👉", "👇"],
            },
            {
                name: "Reactions",
                items: ["😀", "😊", "👍", "👏", "👋", "🙏", "✨", "💡", "ℹ️", "💬"],
            },
        ];

        let html = '<div style="display: flex; flex-direction: column; gap: 8px; font-family: sans-serif;">';
        for (const g of groups) {
            html += `<div style="font-size: 11px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; padding-bottom: 3px; margin-top: 2px;">${g.name}</div>`;
            html += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px;">';
            for (const item of g.items) {
                html += `<button type="button" data-emoji="${item}" style="font-size: 18px; padding: 6px 2px; border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 6px; cursor: pointer; text-align: center; transition: all 0.15s; line-height: 1;" onmouseover="this.style.backgroundColor='#EFF6FF'; this.style.borderColor='#3B82F6';" onmouseout="this.style.backgroundColor='#F9FAFB'; this.style.borderColor='#E5E7EB';">${item}</button>`;
            }
            html += "</div>";
        }
        html += "</div>";

        listDiv.innerHTML = html;
        return listDiv;
    },
};

// Custom Box / Section / Container Background Color plugin
const boxBackgroundPlugin: any = {
    name: "boxBackground",
    display: "submenu",
    title: "Box / Card Background Color",
    buttonClass: "",
    innerHTML: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/><path d="M0 20h24v4H0z"/></svg>',
    add: function (core: any, targetElement: any) {
        const listDiv = (this as any).setSubmenu(core);

        // Prevent mousedown inside submenu from closing it via document handler
        listDiv.addEventListener("mousedown", (e: MouseEvent) => {
            e.stopPropagation();
        });

        // Sync color picker with hex input
        const picker = listDiv.querySelector("._box_bg_picker") as HTMLInputElement | null;
        const hexInput = listDiv.querySelector("._box_bg_hex") as HTMLInputElement | null;

        if (picker && hexInput) {
            picker.addEventListener("input", () => {
                hexInput.value = picker.value.toUpperCase();
            });
            hexInput.addEventListener("input", () => {
                if (/^#([0-9A-F]{3}){1,2}$/i.test(hexInput.value)) {
                    picker.value = hexInput.value;
                }
            });
        }

        const applyColor = (bg: string, border?: string, textColor?: string) => {
            core.focus();
            const range = core.getRange();
            const hasSelection = range && !range.collapsed && range.toString().trim().length > 0;

            if (hasSelection && bg !== "transparent") {
                // If text is highlighted, apply background color to text
                const newNode = core.util.createElement("SPAN");
                newNode.style.backgroundColor = bg;
                if (textColor) newNode.style.color = textColor;
                core.nodeChange(newNode, ["background-color", "color"], null, null);
                if (core.history?.push) core.history.push(false);
            } else {
                // Apply to enclosing container / box / card / cell / paragraph
                const selectedNode = core.getSelectionNode();
                let container: HTMLElement | null = null;
                if (selectedNode) {
                    let curr: HTMLElement | null = selectedNode.nodeType === 1 ? (selectedNode as HTMLElement) : selectedNode.parentElement;
                    while (curr && curr !== core.context.element.wysiwyg) {
                        if (/^(DIV|TD|TH|TABLE|SECTION)$/i.test(curr.nodeName)) {
                            container = curr;
                            break;
                        }
                        curr = curr.parentElement;
                    }
                }

                if (container && container !== core.context.element.wysiwyg) {
                    if (bg === "transparent") {
                        container.style.backgroundColor = "transparent";
                        if (border) container.style.border = "none";
                    } else {
                        container.style.backgroundColor = bg;
                        if (border && border !== "transparent") {
                            container.style.border = `1px solid ${border}`;
                        }
                        if (textColor) {
                            container.style.color = textColor;
                        }
                    }
                    if (core.history?.push) core.history.push(false);
                } else {
                    // Fallback to enclosing paragraph or heading
                    let p: HTMLElement | null = selectedNode
                        ? (selectedNode.nodeType === 1 ? (selectedNode as HTMLElement) : selectedNode.parentElement)
                        : null;
                    while (p && p !== core.context.element.wysiwyg) {
                        if (/^(P|H[1-6])$/i.test(p.nodeName)) break;
                        p = p.parentElement;
                    }
                    if (p && p !== core.context.element.wysiwyg) {
                        p.style.backgroundColor = bg === "transparent" ? "transparent" : bg;
                        if (border && border !== "transparent") p.style.border = `1px solid ${border}`;
                        if (textColor) p.style.color = textColor;
                        if (core.history?.push) core.history.push(false);
                    }
                }
            }

            core.submenuOff();
            core.focus();
        };

        listDiv.addEventListener("click", (e: MouseEvent) => {
            const btn = (e.target as HTMLElement)?.closest("button[data-bg]");
            if (btn) {
                const bg = btn.getAttribute("data-bg") || "";
                const border = btn.getAttribute("data-border") || "";
                const textColor = btn.getAttribute("data-text") || "";
                applyColor(bg, border, textColor);
                return;
            }

            if ((e.target as HTMLElement)?.closest("._box_bg_apply")) {
                const hex = hexInput?.value || picker?.value || "#FFFFFF";
                applyColor(hex);
            }
        });

        core.initMenuTarget(this.name, targetElement, listDiv);
    },
    on: function () {
        const menu = (this as any).submenu;
        const btn = (this as any).submenuActiveButton;
        if (menu && btn) {
            // Overrule any negative or buggy top calculated by SunEditor
            const topPos = btn.offsetTop + btn.offsetHeight + 4;
            menu.style.top = `${topPos}px`;
            menu.style.maxHeight = "360px";
            menu.style.overflowY = "auto";
            menu.style.display = "block";
            menu.style.visibility = "visible";
            menu.style.zIndex = "999999";

            const toolbarW = (this as any).context?.element?.toolbar?.offsetWidth || 800;
            const menuW = menu.offsetWidth || 300;
            const leftPos = btn.offsetLeft || 0;
            if (leftPos + menuW > toolbarW) {
                menu.style.left = `${Math.max(8, toolbarW - menuW - 12)}px`;
            } else {
                menu.style.left = `${leftPos}px`;
            }
        }
    },
    setSubmenu: function (core: any) {
        const listDiv = core.util.createElement("DIV");
        listDiv.className = "se-submenu se-list-layer";
        listDiv.style.width = "300px";
        listDiv.style.maxHeight = "360px";
        listDiv.style.overflowY = "auto";
        listDiv.style.padding = "10px";
        listDiv.style.backgroundColor = "#ffffff";
        listDiv.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
        listDiv.style.borderRadius = "8px";
        listDiv.style.border = "1px solid #d1d5db";
        listDiv.style.zIndex = "999999";

        const bgPresets = [
            { label: "Light Green (Payment / Success)", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" },
            { label: "Light Blue (Info / Schedule)", bg: "#EFF6FF", border: "#93C5FD", text: "#1E40AF" },
            { label: "Light Gray (Details / Standard)", bg: "#F9FAFB", border: "#E5E7EB", text: "#111827" },
            { label: "Light Amber (Warning / Expiry)", bg: "#FEF3C7", border: "#FCD34D", text: "#92400E" },
            { label: "Light Red (Cancellation / Alert)", bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B" },
            { label: "Light Purple (Feature / Tour)", bg: "#F3E8FF", border: "#D8B4FE", text: "#5B21B6" },
            { label: "White Card", bg: "#FFFFFF", border: "#E5E7EB", text: "#111827" },
            { label: "Transparent (Clear Background)", bg: "transparent", border: "transparent", text: "" },
        ];

        const paletteColors = [
            "#FFFFFF", "#F3F4F6", "#E5E7EB", "#D1D5DB", "#9CA3AF", "#6B7280", "#374151", "#111827",
            "#DCFCE7", "#EFF6FF", "#FEF3C7", "#FEF2F2", "#F3E8FF", "#CCFBF1", "#FFEDD5", "#FCE7F3",
            "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#A855F7", "#14B8A6", "#F97316", "#EC4899",
        ];

        let html = '<div style="display: flex; flex-direction: column; gap: 8px; font-family: sans-serif; font-size: 12px; color: #1f2937;">';

        // Header
        html += '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px;">';
        html += '<span style="font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Box / Card Background</span>';
        html += '<button type="button" data-bg="transparent" data-border="transparent" style="font-size: 11px; font-weight: 600; color: #EF4444; background: none; border: none; cursor: pointer; text-decoration: underline; padding: 0;">Clear</button>';
        html += '</div>';

        html += '<div style="font-size: 10px; color: #6B7280; line-height: 1.3;">Click inside any box, cell, or card to change background:</div>';

        // Quick Presets
        html += '<div style="display: flex; flex-direction: column; gap: 4px;">';
        for (const preset of bgPresets) {
            html += `<button type="button" data-bg="${preset.bg}" data-border="${preset.border}" data-text="${preset.text}" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 5px 8px; border: 1px solid #E5E7EB; background: #FFFFFF; border-radius: 6px; cursor: pointer; text-align: left; font-size: 11px; font-weight: 600; color: #374151; transition: background 0.15s;" onmouseover="this.style.backgroundColor='#F3F4F6';" onmouseout="this.style.backgroundColor='#FFFFFF';">
                <span style="width: 16px; height: 16px; border-radius: 4px; background-color: ${preset.bg}; border: 1px solid ${preset.border || '#ccc'}; flex-shrink: 0; display: inline-block;"></span>
                <span style="flex: 1;">${preset.label}</span>
            </button>`;
        }
        html += '</div>';

        // Color Swatches
        html += '<div style="font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 2px;">Color Swatches</div>';
        html += '<div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;">';
        for (const c of paletteColors) {
            html += `<button type="button" data-bg="${c}" title="${c}" style="width: 100%; height: 22px; border-radius: 4px; background-color: ${c}; border: 1px solid #D1D5DB; cursor: pointer; padding: 0; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.15)'; this.style.zIndex='2';" onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1';"></button>`;
        }
        html += '</div>';

        // Custom Hex / Color Picker
        html += '<div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 2px; display: flex; gap: 6px; align-items: center;">';
        html += '<input type="color" class="_box_bg_picker" value="#DCFCE7" style="width: 28px; height: 28px; padding: 1px; border: 1px solid #D1D5DB; border-radius: 4px; cursor: pointer; background: #fff;" title="Custom Color" />';
        html += '<input type="text" class="_box_bg_hex" value="#DCFCE7" placeholder="#HEX" style="flex: 1; height: 28px; font-size: 11px; padding: 0 6px; border: 1px solid #D1D5DB; border-radius: 4px; font-family: monospace;" />';
        html += '<button type="button" class="_box_bg_apply" style="padding: 0 10px; height: 28px; font-size: 11px; font-weight: 600; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">Apply</button>';
        html += '</div>';

        html += '</div>';

        listDiv.innerHTML = html;
        return listDiv;
    },
};

export default function RichTextEditor({ value, onChange, insertText, onTextInserted }: RichTextEditorProps) {
    const editorRef = useRef<SunEditorCore | null>(null);
    const lastValueRef = useRef<string>(value);

    // Combine all standard plugins with our custom plugins
    const customPlugins = useMemo(() => {
        return {
            ...plugins,
            emoji: emojiPlugin,
            boxBackground: boxBackgroundPlugin,
        };
    }, []);

    // Insert text (dynamic tag or signature) at cursor position
    useEffect(() => {
        if (insertText && editorRef.current) {
            editorRef.current.insertHTML(insertText, true, true);
            onTextInserted?.();
        }
    }, [insertText, onTextInserted]);

    // Keep editor content in sync when value changes programmatically from outside (e.g. loading a template)
    useEffect(() => {
        if (editorRef.current && value !== undefined) {
            const currentContents = editorRef.current.getContents(false);
            if (currentContents !== value && lastValueRef.current !== value) {
                editorRef.current.setContents(value);
            }
        }
        lastValueRef.current = value;
    }, [value]);

    return (
        <div className="w-full [&_.sun-editor]:min-h-[600px] [&_.sun-editor]:!border-none [&_.sun-editor-editable]:!font-['Arial',sans-serif] [&_.sun-editor-editable]:!text-[14px] [&_.sun-editor-editable]:text-[#3d4852] [&_.sun-editor-editable]:!leading-[1.6] [&_.sun-editor-editable_h1]:!text-[20px] [&_.sun-editor-editable_h2]:!text-[16px] [&_.sun-editor-editable_h3]:!text-[15px] [&_.sun-editor-editable_table]:!w-full [&_.sun-editor-editable_table]:!border-collapse [&_.sun-editor-editable_td]:!text-[14px] [&_.sun-editor-editable_strong]:!font-bold [&_.sun-editor-editable_b]:!font-bold [&_.sun-editor-editable_a]:text-[#15803D] [&_.sun-editor-editable_a]:underline [&_.se-list-layer]:!z-[1000] [&_.se-list-layer]:!bg-white [&_.se-list-layer]:!shadow-xl">
            <SunEditor
                getSunEditorInstance={(sunEditor: SunEditorCore) => {
                    editorRef.current = sunEditor;
                    try {
                        const editable = sunEditor?.core?.context?.element?.wysiwyg as HTMLElement | undefined;
                        if (editable?.style) {
                            editable.style.fontFamily = "Arial, sans-serif";
                            editable.style.fontSize = "14px";
                            editable.style.lineHeight = "1.6";
                            editable.style.color = "#3d4852";
                        }
                    } catch {
                        // ignore
                    }
                    if (value && sunEditor.getContents(false) !== value) {
                        sunEditor.setContents(value);
                    }
                }}
                setContents={value}
                onChange={(content) => {
                    lastValueRef.current = content;
                    onChange(content);
                }}
                setOptions={{
                    plugins: customPlugins,
                    defaultStyle: "font-family: Arial, sans-serif; font-size: 14px; color: #3d4852; line-height: 1.6;",
                    height: '600px',
                    strictMode: false,
                    strictHTMLValidation: false,
                    addTagsWhitelist: '*',
                    attributesWhitelist: {
                        all: 'style|class|id|width|height|color|bgcolor|border|cellpadding|cellspacing|align|valign',
                    },
                    colorList: [
                        '#000000', '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#FFFFFF',
                        '#DC2626', '#EA580C', '#D97706', '#16A34A', '#0D9488', '#2563EB', '#4F46E5', '#7C3AED', '#DB2777',
                        '#FEE2E2', '#FFEDD5', '#FEF3C7', '#DCFCE7', '#CCFBF1', '#DBEAFE', '#E0E7FF', '#EDE9FE', '#FCE7F3',
                        '#991B1B', '#9A3412', '#92400E', '#166534', '#115E59', '#1E40AF', '#3730A3', '#5B21B6', '#9D174D',
                    ],
                    buttonList: [
                        ['undo', 'redo'],
                        ['formatBlock'],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['fontColor', 'hiliteColor', 'boxBackground'],
                        ['align'],
                        ['list'],
                        ['horizontalRule'],
                        ['table', 'link', 'image'],
                        ['emoji'],
                        ['removeFormat'],
                        ['codeView'],
                    ],
                    formats: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                }}
            />
        </div>
    );
}
