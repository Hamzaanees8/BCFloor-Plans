// components/RichTextEditor.tsx
import dynamic from "next/dynamic";
import "suneditor/dist/css/suneditor.min.css"; // Import CSS globally
import type SunEditorCore from "suneditor/src/lib/core";

import { useRef, useEffect } from "react";

const SunEditor = dynamic(() => import("suneditor-react"), {
    ssr: false,
});
interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    insertText?: string;
    onTextInserted?: () => void;
}

export default function RichTextEditor({ value, onChange, insertText, onTextInserted }: RichTextEditorProps) {
    const editorRef = useRef<SunEditorCore | null>(null);

    useEffect(() => {
        if (insertText && editorRef.current) {
            editorRef.current.insertHTML(insertText, true, true);
            onTextInserted?.();
        }
    }, [insertText, onTextInserted]);

    return (
        <div className="[&_.sun-editor]:min-h-[600px]">
            <SunEditor
                getSunEditorInstance={(sunEditor: SunEditorCore) => {
                    editorRef.current = sunEditor;
                }}
                setContents={value}
                onChange={onChange}
                setOptions={{
                    defaultStyle: "font-family: 'Alexandria', sans-serif; font-weight: 400;",
                    height: '600px',
                    buttonList: [
                        ['undo', 'redo'],
                        ['formatBlock'],
                        ['align'],
                        ['list'],
                        ['fontColor', 'hiliteColor'],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['horizontalRule'],
                        ['removeFormat'],
                        ['link', 'image'],
                        ['blockquote'],
                        ['codeView'],
                    ],
                    formats: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                }}
            />
        </div>


    );
}
