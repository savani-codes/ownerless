import { Reveal } from "../components/Reveal";
import { RichText } from "../components/RichText";
import { steps } from "../content";
import styles from "./sections.module.css";

const TONE = { blue: "tag", peach: "tag tag--peach", amber: "tag tag--amber" } as const;

export function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">How it works</p>
          <h2 className="h2">Two people, two agents, one room.</h2>
          <p className="section-head__sub">
            Each agent is a Claude Code session with its own instructions and its own permission settings. The people
            decide; the agents do the legwork.
          </p>
        </Reveal>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 110} className={styles.card}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardText}>
                <RichText text={step.text.replace(/@(\w+)/g, "`@$1`")} />
              </p>
              <span className={TONE[step.tone]}>{step.tag}</span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
