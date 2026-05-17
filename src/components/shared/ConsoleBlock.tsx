import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ConsoleBlockProps {
  label?: string;
  content: string;
  maxHeight?: string;
}

export function ConsoleBlock({ label, content, maxHeight = "none" }: ConsoleBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content.trim()) {
    return null;
  }

  return (
    <div>
      {(label || content) && (
        <div className="mb-1 flex items-center justify-between gap-2">
          {label && <p className="font-medium text-sm">{label}</p>}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 ml-auto"
            onClick={copy}
            type="button"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">Копировать</span>
          </Button>
        </div>
      )}
      <pre
        className="overflow-x-auto rounded-md bg-[var(--color-muted)] p-3 font-mono text-xs whitespace-pre-wrap"
        style={maxHeight !== "none" ? { maxHeight, overflowY: "auto" } : undefined}
      >
        {content}
      </pre>
    </div>
  );
}
