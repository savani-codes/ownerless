import { type RefObject, useEffect, useRef, useState } from "react";

/** True once the element has scrolled into view (and stays true unless `once` is false). */
export function useInView<T extends Element>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {},
): [RefObject<T | null>, boolean] {
  const { threshold = 0.15, rootMargin = "0px 0px -8% 0px", once = true } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}
