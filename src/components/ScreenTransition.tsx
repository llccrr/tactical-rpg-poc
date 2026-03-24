import { useEffect, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Unique key to trigger transition on screen change */
  transitionKey: string;
  /** Duration in ms (default 300) */
  duration?: number;
}

/**
 * Fade-in wrapper for screen transitions.
 * When transitionKey changes, the content fades in from black.
 */
export function ScreenTransition({ children, transitionKey, duration = 300 }: Props) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(0);
    const raf = requestAnimationFrame(() => setOpacity(1));
    return () => cancelAnimationFrame(raf);
  }, [transitionKey]);

  return (
    <div
      style={{
        opacity,
        transition: `opacity ${duration}ms ease-in-out`,
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
