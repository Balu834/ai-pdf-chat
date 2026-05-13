"use client";
import { useEffect } from "react";

export default function LandingAnimations() {
  useEffect(() => {
    // ── Reveal on scroll ───────────────────────────────────────────────────
    const revealEls = document.querySelectorAll<HTMLElement>(".reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            revealObserver.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // ── Counter animations ─────────────────────────────────────────────────
    function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

    function animateCounter(el: HTMLElement) {
      const target  = parseFloat(el.dataset.target ?? "0");
      const decimal = el.dataset.decimal === "1";
      const duration = 1500;
      const start    = performance.now();

      function step(now: number) {
        const p   = Math.min((now - start) / duration, 1);
        const val = target * easeOut(p);
        el.textContent = decimal ? val.toFixed(1) : String(Math.floor(val));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = decimal ? target.toFixed(1) : String(target);
      }
      requestAnimationFrame(step);
    }

    const counters = document.querySelectorAll<HTMLElement>(".l-counter");
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCounter(e.target as HTMLElement);
            counterObserver.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => counterObserver.observe(c));

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  return null;
}
