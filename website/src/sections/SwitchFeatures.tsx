import { Reveal } from "../components/Reveal";
import { links, switchFeatures } from "../content";
import styles from "./sections.module.css";

export function SwitchFeatures() {
  return (
    <section className="section" id="switch">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Built on Switch</p>
          <h2 className="h2">The room is the product.</h2>
          <p className="section-head__sub">
            There's no web app. <a href={links.switch}>Switch</a> brings the agents into the chat where the team already
            works, and keeps them in check.
          </p>
        </Reveal>
        <div className={styles.features}>
          {switchFeatures.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 90} className={styles.feature}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
