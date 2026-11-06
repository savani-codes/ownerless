import { Reveal } from "../components/Reveal";
import { architecture as a } from "../content";
import styles from "./sections.module.css";

export function Architecture() {
  return (
    <section className="section section--sand" id="architecture">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Architecture</p>
          <h2 className="h2">One tool, four systems.</h2>
          <p className="section-head__sub">
            The agents have exactly one tool: the <code>ownerless</code> CLI. It prints JSON with a link for every entity.
            Reads run freely; writes stop for a person.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div
            className={styles.arch}
            role="img"
            aria-label="Discord connects to Switch Console, which runs the investigator and operator agents. Both use the ownerless CLI, which talks to Airflow, DataHub, Postgres and Cognee."
          >
            <Node className={styles.nodeChat} title={a.chat.title} note={a.chat.note} />
            <Link />
            <Node className={styles.nodeSwitch} title={a.switch} />
            <Link />
            <div className={styles.archStack}>
              {a.agents.map((agent) => (
                <Node key={agent.title} title={agent.title} note={agent.note} />
              ))}
            </div>
            <Link />
            <Node className={styles.nodeCli} title={a.cli} mono />
            <Link />
            <div className={styles.archStack}>
              {a.systems.map((system) => (
                <Node key={system} className={styles.nodeSys} title={system} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Node({ title, note, className = "", mono = false }: { title: string; note?: string; className?: string; mono?: boolean }) {
  return (
    <div className={`${styles.node} ${className}`}>
      {mono ? <code>{title}</code> : title}
      {note && <small>{note}</small>}
    </div>
  );
}

function Link() {
  return <div className={styles.link} aria-hidden="true" />;
}
