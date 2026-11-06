import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { LogoMark } from "../components/Logo";
import { RichText } from "../components/RichText";
import { useMotionAllowed } from "../hooks/useMotion";
import { type Entry, greeting, knowledge, starters } from "./knowledge";
import { answer } from "./match";
import styles from "./Companion.module.css";

type Message =
  | { from: "user"; text: string }
  | { from: "guide"; text: string[]; link?: Entry["link"]; suggestions: string[] };

const byId = new Map(knowledge.map((entry) => [entry.id, entry]));
const FALLBACK = [
  "I don't know that one yet. I only know what's in the Ownerless docs.",
  "Try one of these, or open an issue on GitHub and we'll answer there.",
];

function reply(question: string): Message {
  const entry = answer(question, knowledge);
  if (!entry) return { from: "guide", text: FALLBACK, suggestions: starters };
  return { from: "guide", text: entry.answer, link: entry.link, suggestions: entry.next ?? [] };
}

/** A small guide in the corner that answers questions about Ownerless from a local knowledge base. */
export function Companion() {
  const motion = useMotionAllowed();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: "guide", text: [greeting], suggestions: starters },
  ]);
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: motion ? "smooth" : "auto" });
  }, [messages, typing, motion]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  function ask(question: string) {
    const text = question.trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setDraft("");
    const response = reply(text);
    if (!motion) {
      setMessages((m) => [...m, response]);
      return;
    }
    setTyping(true);
    const words = response.from === "guide" ? response.text.join(" ").split(" ").length : 0;
    timer.current = window.setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [...m, response]);
      },
      Math.min(1400, 450 + words * 8),
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  const last = messages.at(-1);
  const suggestions = !typing && last?.from === "guide" ? last.suggestions : [];

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherHidden : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <LogoMark height={16} />
        <span>Ask Ownerless</span>
      </button>

      <section
        id={panelId}
        className={`${styles.panel} ${open ? styles.open : ""}`}
        role="dialog"
        aria-label="Ownerless guide"
        aria-hidden={!open}
        inert={!open}
      >
        <header className={styles.header}>
          <span className={styles.badge}>
            <LogoMark height={13} />
          </span>
          <div>
            <p className={styles.title}>Ownerless guide</p>
            <p className={styles.subtitle}>From the project docs · runs in your browser</p>
          </div>
          <button type="button" className={styles.close} onClick={close} aria-label="Close the guide">
            ×
          </button>
        </header>

        <div className={styles.log} aria-live="polite">
          {messages.map((message, i) =>
            message.from === "user" ? (
              <p key={i} className={`${styles.bubble} ${styles.user}`}>
                {message.text}
              </p>
            ) : (
              <div key={i} className={`${styles.bubble} ${styles.guide}`}>
                {message.text.map((paragraph, j) => (
                  <p key={j}>
                    <RichText text={paragraph} />
                  </p>
                ))}
                {message.link && (
                  <a className={styles.more} href={message.link.href} target="_blank" rel="noreferrer">
                    {message.link.label} ↗
                  </a>
                )}
              </div>
            ),
          )}
          {typing && (
            <span className={`${styles.bubble} ${styles.guide} ${styles.typing}`} aria-label="The guide is typing">
              <i />
              <i />
              <i />
            </span>
          )}
          <div ref={endRef} />
        </div>

        {suggestions.length > 0 && (
          <div className={styles.suggestions} aria-label="Suggested questions">
            {suggestions.map((id) => {
              const entry = byId.get(id);
              return (
                entry && (
                  <button key={id} type="button" className={styles.chip} onClick={() => ask(entry.question)}>
                    {entry.question}
                  </button>
                )
              );
            })}
          </div>
        )}

        <form className={styles.form} onSubmit={onSubmit}>
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about the agents, safety, setup…"
            aria-label="Your question"
            maxLength={200}
            autoComplete="off"
          />
          <button type="submit" className={styles.send} disabled={!draft.trim() || typing} aria-label="Send">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </section>
    </>
  );
}
