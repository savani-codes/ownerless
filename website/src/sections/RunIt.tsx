import { useState } from "react";
import { Reveal } from "../components/Reveal";
import { links, runIt } from "../content";
import styles from "./sections.module.css";

export function RunIt() {
  const commands = runIt.blocks.flatMap((block) => block.lines.filter((line) => !line.startsWith("@"))).join("\n");

  return (
    <section className="section" id="run">
      <div className={`container ${styles.run}`}>
        <Reveal className="section-head section-head--left">
          <p className="eyebrow">Run it</p>
          <h2 className="h2">From a clean clone to a broken pipeline.</h2>
          <p className="section-head__sub">{runIt.intro}</p>
          <a className="button button--outline" href={links.runIt}>
            Full instructions <span className="arrow" aria-hidden="true">→</span>
          </a>
        </Reveal>
        <Reveal delay={120} className={styles.codeWrap}>
          <CopyButton text={commands} />
          <pre className={styles.code}>
            <code>
              {runIt.blocks.map((block, i) => (
                <span key={block.comment}>
                  {i > 0 && "\n"}
                  <span className={styles.comment}># {block.comment}</span>
                  {"\n"}
                  {block.lines.map((line) => (
                    <span key={line} className={line.startsWith("@") ? styles.prompt : undefined}>
                      {line}
                      {"\n"}
                    </span>
                  ))}
                </span>
              ))}
            </code>
          </pre>
        </Reveal>
      </div>
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className={styles.copy} onClick={copy} aria-live="polite">
      {copied ? "Copied ✓" : "Copy commands"}
    </button>
  );
}
