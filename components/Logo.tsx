type LogoProps = {
  tone?: "default" | "light";
};

export function Logo({ tone = "default" }: LogoProps) {
  const onLight = tone === "default";

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill={onLight ? "#0B1B33" : "#C4A15A"} />
        <rect x="7" y="8" width="3.5" height="16" rx="0.5" fill={onLight ? "#F7F5F1" : "#0B1B33"} />
        <rect x="7" y="14" width="18" height="3.5" rx="0.5" fill={onLight ? "#C4A15A" : "#0B1B33"} />
      </svg>
      <span
        className={`font-serif text-lg font-semibold tracking-tight ${
          onLight ? "text-navy-900" : "text-white"
        }`}
      >
        Didact Capital
      </span>
    </span>
  );
}
