"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HIDDEN_TRANSFORM = (y: number) => `translate3d(0, ${y}px, 0)`;

/**
 * Reveals children once they scroll into view.
 *
 * Renders visible and only hides itself from a ref callback, after
 * confirming an IntersectionObserver is actually available. That ordering
 * is deliberate: if it rendered hidden and the observer never ran — no JS,
 * an old browser, a throttled tab — the content would be permanently
 * invisible. Failing to *visible* is the safe direction.
 *
 * Visibility is driven by direct style writes rather than React state, so
 * scrolling past a long page doesn't schedule a render per element.
 */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const cleanup = useRef<(() => void) | null>(null);

  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (!el) return;

      // Only hide if we're confident the reveal can actually fire. A
      // backgrounded/non-compositing tab can arm an observer that never
      // triggers, which would strand the content invisible.
      if (
        typeof IntersectionObserver === "undefined" ||
        document.visibilityState !== "visible" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return; // stays visible
      }

      el.style.opacity = "0";
      el.style.transform = HIDDEN_TRANSFORM(y);
      el.style.willChange = "transform, opacity";

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            el.style.transitionDelay = `${delay}ms`;
            el.style.opacity = "1";
            el.style.transform = "none";
            window.setTimeout(() => {
              el.style.willChange = "";
            }, delay + 800);
            io.disconnect();
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );

      io.observe(el);
      cleanup.current = () => io.disconnect();
    },
    [delay, y]
  );

  useEffect(() => () => cleanup.current?.(), []);

  return (
    <div
      ref={attach}
      className={cn(
        "transition-[opacity,transform] duration-[750ms] ease-out-expo",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Line-mask reveal: each child slides up from behind its own overflow
 * edge when scrolled into view. Works with arbitrary children (nested
 * gradient spans included), unlike word-splitting approaches.
 *
 * Same fail-safe ordering as Reveal — `data-shown` starts "true" and is
 * only set false once an observer is confirmed running, so text is never
 * left permanently hidden if JS doesn't execute.
 */
export function MaskReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const cleanup = useRef<(() => void) | null>(null);

  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (!el) return;

      // Same reasoning as Reveal: never hide text unless the reveal is
      // genuinely able to run.
      if (
        typeof IntersectionObserver === "undefined" ||
        document.visibilityState !== "visible" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return; // stays shown
      }

      el.dataset.shown = "false";

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            window.setTimeout(() => {
              el.dataset.shown = "true";
            }, delay);
            io.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
      );

      io.observe(el);
      cleanup.current = () => io.disconnect();
    },
    [delay]
  );

  useEffect(() => () => cleanup.current?.(), []);

  return (
    <div ref={attach} data-shown="true" className={className}>
      {children}
    </div>
  );
}

/**
 * Counts up to `value` when scrolled into view. Uses an eased rAF loop
 * rather than a fixed interval so the number decelerates into place
 * instead of ticking linearly.
 */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  duration = 1600,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let raf = 0;
    let start = 0;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();

        const step = (t: number) => {
          if (!start) start = t;
          const p = Math.min((t - start) / duration, 1);
          // easeOutExpo
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          setDisplay(Math.round(value * eased));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Subtle 3D tilt toward the cursor. Rotation is capped low (6°) — past
 * that it stops reading as depth and starts looking like a gimmick.
 * Pointer-driven only, so it never fires on touch.
 */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translate3d(0,-2px,0)`;
  }

  function reset() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cn(
        "transition-transform duration-300 ease-out-expo [transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  );
}
