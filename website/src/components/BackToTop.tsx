import { useScroll } from "../hooks/useMotion";
import styles from "./BackToTop.module.css";

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Appears after the first screen; its ring fills as you scroll down the page. */
export function BackToTop() {
  const { y, progress } = useScroll();
  const visible = y > 600;

  return (
    <button
      type="button"
      className={`${styles.button} ${visible ? styles.visible : ""}`}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 48 48" className={styles.ring} aria-hidden="true">
        <circle cx="24" cy="24" r={RADIUS} className={styles.track} />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          className={styles.fill}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <svg viewBox="0 0 24 24" className={styles.arrow} aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
