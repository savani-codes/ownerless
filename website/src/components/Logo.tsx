import styles from "./Logo.module.css";

/**
 * The Ownerless mark: two datasets joined through the person who owns them, with focus brackets
 * locking on to that owner. Drawn in the coordinates of the original artwork (assets/logo.png).
 *
 * `animate`: "once" locks the brackets on when it mounts, "loop" keeps searching and locking.
 */
export function LogoMark({ height = 24, animate }: { height?: number; animate?: "once" | "loop" }) {
  const motion = animate ? styles[animate] : "";
  return (
    <svg
      className={`${styles.mark} ${motion}`}
      viewBox="176 383 902 488"
      height={height}
      width={(height * 902) / 488}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <rect x="197" y="543" width="166" height="168" rx="46" strokeWidth="32" />
        <rect x="889" y="543" width="168" height="168" rx="46" strokeWidth="32" />
        <path d="M379 627H505M748 627H873" strokeWidth="30" strokeLinecap="butt" />
        <g strokeWidth="40">
          <path className={styles.tl} d="M436 507V468a60 60 0 0 1 60-60h46" />
          <path className={styles.tr} d="M710 408h48a60 60 0 0 1 60 60v39" />
          <path className={styles.bl} d="M436 746v40a60 60 0 0 0 60 60h46" />
          <path className={styles.br} d="M710 846h48a60 60 0 0 0 60-60v-40" />
        </g>
      </g>
      <rect className={styles.owner} x="505" y="505" width="243" height="243" rx="56" />
      <g className={styles.person}>
        <circle cx="626" cy="586" r="37" />
        <path d="M566 704a12 12 0 0 1-11-16c13-33 40-54 71-54s58 21 71 54a12 12 0 0 1-11 16z" />
      </g>
    </svg>
  );
}

/** The mark and the wordmark, as in the logo lockup. */
export function Logo({ height = 24, animate }: { height?: number; animate?: "once" | "loop" }) {
  return (
    <span className={styles.lockup} style={{ fontSize: height * 0.86 }}>
      <LogoMark height={height} animate={animate} />
      Ownerless
    </span>
  );
}
