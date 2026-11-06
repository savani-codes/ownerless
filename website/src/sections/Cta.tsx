import { LogoMark } from "../components/Logo";
import { Reveal } from "../components/Reveal";
import { links } from "../content";
import styles from "./sections.module.css";

export function Cta() {
  return (
    <section className={`section section--rule ${styles.cta}`}>
      <div className="container">
        <Reveal className={styles.ctaInner}>
          <LogoMark height={60} animate="loop" />
          <h2 className="statement">The next incident starts with a name.</h2>
          <div className="buttons">
            <a className="button" href={links.repo}>
              View on GitHub <span className="arrow" aria-hidden="true">→</span>
            </a>
            <a className="button button--outline" href={links.switch}>
              Learn about Switch
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
