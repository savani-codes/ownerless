import { Logo } from "../components/Logo";
import { links } from "../content";
import styles from "./sections.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <p className={styles.footerBrand}>
          <Logo height={18} />
        </p>
        <p>
          Built by <a href={links.jars}>JARS</a> and <a href={links.sav}>SAV</a> for the{" "}
          <a href={links.hackathon}>Flip the Switch Hackathon 2026</a>.
        </p>
        <p>
          Apache-2.0 · Uses <a href={links.switch}>Switch</a>, DataHub, Apache Airflow and Cognee. Not affiliated with them.
        </p>
      </div>
    </footer>
  );
}
