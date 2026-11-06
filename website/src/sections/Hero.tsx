import { Reveal } from "../components/Reveal";
import { hero } from "../content";
import { Thread } from "./Thread";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={`section ${styles.hero}`} id="top">
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <Reveal>
            <p className="eyebrow">
              <span className={styles.dot} aria-hidden="true" />
              {hero.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="h1">{hero.title}</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className={styles.lede}>{hero.lede}</p>
          </Reveal>
          <Reveal delay={240} className="buttons">
            <a className="button" href="#demo">
              Watch the demo <span className="arrow" aria-hidden="true">→</span>
            </a>
            <a className="button button--outline" href="#how">
              How it works
            </a>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <Thread />
        </Reveal>
      </div>
    </section>
  );
}
