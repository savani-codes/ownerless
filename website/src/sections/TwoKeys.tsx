import { Reveal } from "../components/Reveal";
import { keys } from "../content";
import styles from "./sections.module.css";

export function TwoKeys() {
  return (
    <section className="section section--dark">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow eyebrow--dark">Safety</p>
          <h2 className="h2">Every change needs two keys.</h2>
        </Reveal>
        <div className={styles.keys}>
          {keys.map((key, i) => (
            <Reveal key={key.label} delay={i * 120} className={styles.key}>
              <span className={styles.keyLabel}>
                <KeyIcon /> {key.label}
              </span>
              <h3>{key.title}</h3>
              <p>{key.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 12h9M18 12v3M21 12v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
