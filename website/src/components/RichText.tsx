import { Fragment, type ReactNode } from "react";

// A tiny inline formatter for copy in content.ts: `code`, **bold** and @@mention@.
// Deliberately not Markdown: no HTML, no links, nothing that needs sanitising.
const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|@@[\w-]+@)/g;

export function RichText({ text, mentionClass = "" }: { text: string; mentionClass?: string }) {
  const parts: ReactNode[] = text.split(TOKEN).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("@@") && part.endsWith("@"))
      return (
        <b key={i} className={mentionClass}>
          @{part.slice(2, -1)}
        </b>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
  return <>{parts}</>;
}
