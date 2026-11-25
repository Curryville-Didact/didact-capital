"use client";

import { useEffect, useState } from "react";

export function MobileFundingBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const form = document.getElementById("get-funding");
    if (!hero || !form) return;

    let heroInView = true;
    let formInView = false;

    const update = () => {
      setVisible(!heroInView && !formInView);
    };

    const heroObserver = new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
      update();
    });

    const formObserver = new IntersectionObserver(
      ([entry]) => {
        formInView = entry.isIntersecting;
        update();
      },
      { rootMargin: "0px 0px -72px 0px" },
    );

    heroObserver.observe(hero);
    formObserver.observe(form);

    return () => {
      heroObserver.disconnect();
      formObserver.disconnect();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 px-5 py-3 shadow-[0_-10px_30px_-18px_rgba(7,19,34,0.45)] backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-page items-center justify-between gap-3">
        <p className="text-sm font-semibold leading-snug text-navy-900">See what you may qualify for</p>
        <a href="#get-funding" className="btn-primary shrink-0 px-3 py-2 text-sm">
          Check Your Options
        </a>
      </div>
    </div>
  );
}
