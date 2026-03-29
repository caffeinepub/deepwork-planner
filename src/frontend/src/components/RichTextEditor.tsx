import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

function syncCheckboxStates(container: HTMLElement) {
  const checkboxes = container.querySelectorAll(
    'input[type="checkbox"][data-checked]',
  );
  for (const cb of Array.from(checkboxes)) {
    (cb as HTMLInputElement).checked =
      cb.getAttribute("data-checked") === "true";
  }
}

export default function RichTextEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const prevValueRef = useRef("");

  useEffect(() => {
    if (!editorRef.current) return;
    if (readOnly) {
      editorRef.current.innerHTML = value;
      syncCheckboxStates(editorRef.current);
      prevValueRef.current = value;
    } else if (!isFocusedRef.current && prevValueRef.current !== value) {
      editorRef.current.innerHTML = value;
      syncCheckboxStates(editorRef.current);
      prevValueRef.current = value;
    }
  }, [value, readOnly]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      prevValueRef.current = html;
      onChange(html);
    }
  };

  const handleCheckboxInteraction = (
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" &&
      (target as HTMLInputElement).type === "checkbox"
    ) {
      const cb = target as HTMLInputElement;
      cb.setAttribute("data-checked", cb.checked ? "true" : "false");
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        prevValueRef.current = html;
        onChange(html);
      }
    }
  };

  const execCmd = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleInput();
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<div class="checklist-item"><input type="checkbox" data-checked="false"> <span>New task</span></div>`,
    );
    handleInput();
  };

  const richTextClasses =
    "text-sm text-foreground/90 leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_li]:my-0.5 [&_.checklist-item]:flex [&_.checklist-item]:items-center [&_.checklist-item]:gap-2 [&_.checklist-item]:my-1 [&_mark]:bg-amber-300/30 [&_mark]:text-amber-200 [&_mark]:px-0.5 [&_mark]:rounded [&_input[type=checkbox]]:cursor-pointer [&_input[type=checkbox]]:accent-violet-500";

  if (readOnly) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: checkbox interception via click delegation
      <div
        ref={editorRef}
        onClick={handleCheckboxInteraction}
        className={`rich-text-view min-h-[60px] ${richTextClasses}`}
      />
    );
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-muted/30">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/10 bg-muted/50 flex-wrap">
        {(
          [
            { label: "B", cmd: "bold", style: "font-bold" },
            { label: "I", cmd: "italic", style: "italic" },
            { label: "U", cmd: "underline", style: "underline" },
          ] as const
        ).map(({ label, cmd, style }) => (
          <button
            key={cmd}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd(cmd);
            }}
            className={`px-2 py-1 text-xs rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors ${style}`}
          >
            {label}
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-1" />
        {(
          [
            { label: "H1", block: "h1" },
            { label: "H2", block: "h2" },
          ] as const
        ).map(({ label, block }) => (
          <button
            key={block}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("formatBlock", block);
            }}
            className="px-2 py-1 text-xs rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors font-semibold"
          >
            {label}
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("insertUnorderedList");
          }}
          className="px-2 py-1 text-xs rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          title="Bullet list"
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("insertOrderedList");
          }}
          className="px-2 py-1 text-xs rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          title="Numbered list"
        >
          1. List
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("hiliteColor", "rgba(253,230,138,0.3)");
          }}
          className="px-2 py-1 text-xs rounded hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors"
          title="Highlight"
        >
          ✦ Highlight
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            insertChecklist();
          }}
          className="px-2 py-1 text-xs rounded hover:bg-white/10 text-violet-400 hover:text-violet-300 transition-colors"
          title="Checklist"
        >
          ☑ Task
        </button>
      </div>

      {/* Editor */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: checkbox interception inside contentEditable */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onClick={handleCheckboxInteraction}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          handleInput();
        }}
        data-placeholder={placeholder}
        className={`outline-none min-h-[160px] p-4 ${richTextClasses} empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50`}
      />
    </div>
  );
}
