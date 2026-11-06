import { useEffect, useState } from "react";
import { links, nav } from "../content";
import { useScroll } from "../hooks/useMotion";
import { Logo } from "./Logo";
import styles from "./Nav.module.css";

/** Sticky header that firms up once you scroll, and highlights the section you're reading. */
export function Nav() {
  const { y, progress } = useScroll();
  const active = useActiveSection(nav.map((item) => item.id));
  const [open, setOpen] = useState(false);

  return (
    <header className={`${styles.nav} ${y > 8 ? styles.scrolled : ""}`}>
      <div className={`container ${styles.inner}`}>
        <a className={styles.brand} href="#top" aria-label="Ownerless, back to the top">
          <Logo height={22} animate="once" />
        </a>

        <nav aria-label="Main" className={`${styles.links} ${open ? styles.open : ""}`}>
          <ul>
            {nav.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "true" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <a className="button button--small" href={links.repo}>
            GitHub <span className="arrow" aria-hidden="true">→</span>
          </a>
          <button
            type="button"
            className={styles.menu}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className={styles.progress} style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
    </header>
  );
}

function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
