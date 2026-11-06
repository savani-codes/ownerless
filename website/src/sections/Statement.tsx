import { useEffect, useState } from "react";
import { Reveal } from "../components/Reveal";
import { statement } from "../content";
import { useInView } from "../hooks/useInView";
import { useMotionAllowed } from "../hooks/useMotion";
import styles from "./sections.module.css";

export function Statement() {
  return (
    <section className="section section--rule">
      <div className="container">
        <Reveal>
          <p className="statement">
            {statement.lead} <span className="muted">{statement.muted}</span>
          </p>
        </Reveal>
        <dl className={styles.stats}>
          {statement.stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90} className={styles.stat}>
              <dt>{stat.label}</dt>
              <dd className={"accent" in stat && stat.accent ? styles.accent : ""}>
                <CountUp to={stat.value} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Counts up from a few above the target, so zero still has somewhere to come from. */
function CountUp({ to }: { to: number }) {
  const motion = useMotionAllowed();
  const [ref, inView] = useInView<HTMLSpanElement>();
  const from = to + 7;
  const [value, setValue] = useState(motion ? from : to);

  useEffect(() => {
    if (!inView || !motion) {
      if (!motion) setValue(to);
      return;
    }
    const start = performance.now();
    const duration = 900;
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [inView, motion, from, to]);

  return (
    <span ref={ref} aria-label={String(to)}>
      {value}
    </span>
  );
}
