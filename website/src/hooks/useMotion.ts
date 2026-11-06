import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** False when the visitor asked their system for less motion. */
export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(() => typeof window === "undefined" || !window.matchMedia(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setAllowed(!media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return allowed;
}

/** Window scroll position and progress (0 to 1), throttled to one update per frame. */
export function useScroll(): { y: number; progress: number } {
  const [state, setState] = useState({ y: 0, progress: 0 });

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setState({ y: window.scrollY, progress: max > 0 ? Math.min(1, window.scrollY / max) : 0 });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return state;
}
