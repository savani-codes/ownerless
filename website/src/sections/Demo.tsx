import { Reveal } from "../components/Reveal";
import { demoVideoId } from "../content";
import styles from "./sections.module.css";

export function Demo() {
  return (
    <section className="section section--sand" id="demo">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Demo</p>
          <h2 className="h2">Three minutes, one thread.</h2>
        </Reveal>
        <Reveal delay={100}>
          <div className={styles.video}>
            {demoVideoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(demoVideoId)}`}
                title="Ownerless demo"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className={styles.placeholder}>
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M26 21l18 11-18 11z" fill="currentColor" />
                </svg>
                <p>The demo video lands with our submission.</p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
