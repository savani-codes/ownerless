import { useEffect, useState } from "react";
import { RichText } from "../components/RichText";
import { type ThreadMessage, thread } from "../content";
import { useInView } from "../hooks/useInView";
import { useMotionAllowed } from "../hooks/useMotion";
import styles from "./Thread.module.css";

// Timeline, in ms: people "type" quickly, agents show a typing indicator first.
const PAUSE = 650;
const TYPING = 1100;
const ALLOW_AFTER = 900;

type Stage = { shown: number; typing: boolean; allowed: boolean; done: boolean };
const START: Stage = { shown: 0, typing: false, allowed: false, done: false };
const END: Stage = { shown: thread.length, typing: false, allowed: true, done: true };

/** The incident thread from the room, played back message by message when it scrolls into view. */
export function Thread() {
  const motion = useMotionAllowed();
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.3 });
  const [stage, setStage] = useState<Stage>(START);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (!motion) {
      setStage(END);
      return;
    }
    const timers: number[] = [];
    let t = 300;
    const at = (delay: number, next: Partial<Stage>) =>
      timers.push(window.setTimeout(() => setStage((s) => ({ ...s, ...next })), delay));

    setStage(START);
    thread.forEach((message, i) => {
      if (message.kind !== "human") {
        at(t, { typing: true });
        t += TYPING;
      }
      at(t, { shown: i + 1, typing: false });
      if (message.prompt) {
        t += ALLOW_AFTER;
        at(t, { allowed: true });
      }
      t += PAUSE;
    });
    at(t, { done: true });
    return () => timers.forEach(clearTimeout);
  }, [inView, motion, run]);

  const visible = thread.slice(0, stage.shown);
  const typist = stage.typing ? thread[stage.shown] : undefined;

  return (
    <figure ref={ref} className={styles.window} aria-label="An example incident thread in the #retail-incidents room">
      <div className={styles.bar}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.title}># retail-incidents</span>
        <button
          type="button"
          className={`${styles.replay} ${stage.done ? styles.replayShown : ""}`}
          onClick={() => setRun((n) => n + 1)}
          tabIndex={stage.done ? 0 : -1}
        >
          ↻ Replay
        </button>
      </div>

      <ol className={styles.thread} aria-live="polite">
        {visible.map((message, i) => (
          <Message key={`${run}-${i}`} message={message} allowed={stage.allowed} />
        ))}
        {typist && (
          <li className={styles.msg}>
            <Avatar message={typist} />
            <div>
              <p className={styles.who}>{typist.who}</p>
              <span className={styles.typing} aria-label={`${typist.who} is typing`}>
                <i />
                <i />
                <i />
              </span>
            </div>
          </li>
        )}
      </ol>
      <figcaption className={styles.caption}>Illustration of the flow. The video shows the real room.</figcaption>
    </figure>
  );
}

function Message({ message, allowed }: { message: ThreadMessage; allowed: boolean }) {
  const tagTone = message.kind === "operator" ? "tag tag--amber" : "tag";
  return (
    <li className={styles.msg}>
      <Avatar message={message} />
      <div>
        <p className={styles.who}>
          {message.who}
          {message.kind === "human" ? <span className={styles.role}>{message.role}</span> : <span className={tagTone}>{message.role}</span>}
        </p>
        <p>
          <RichText text={message.text} mentionClass={styles.mention} />
        </p>
        {message.prompt && (
          <div className={styles.prompt} role="group" aria-label="Switch permission prompt">
            <span>
              Run <code>{message.prompt}</code>?
            </span>
            <span className={styles.chips}>
              <span className={`${styles.chip} ${allowed ? styles.chipPressed : styles.chipYes}`}>
                {allowed ? "✓ Allowed by JARS" : "Allow once"}
              </span>
              {!allowed && <span className={styles.chip}>Decline</span>}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

function Avatar({ message }: { message: ThreadMessage }) {
  const tone = message.kind === "human" ? (message.who === "SAV" ? styles.avatarSav : styles.avatarJars) : styles.avatarAgent;
  const op = message.kind === "operator" ? styles.avatarOp : "";
  return (
    <span className={`${styles.avatar} ${tone} ${op}`} aria-hidden="true">
      {message.who.charAt(0).toUpperCase()}
    </span>
  );
}
