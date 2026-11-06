import type { CSSProperties, ElementType, ReactNode } from "react";
import { useInView } from "../hooks/useInView";

type Props = {
  children: ReactNode;
  /** Delay in ms, for staggering siblings. */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: Props) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? "is-visible" : ""} ${className}`.trim()}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
