import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function BloodDrop({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <motion.svg
      viewBox="0 0 24 30"
      aria-hidden="true"
      className={cn("inline-block", className)}
      initial={false}
      animate={animate ? { scale: [1, 1.09, 0.97, 1], y: [0, -1.5, 0.5, 0] } : undefined}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="bn-drop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.66 0.23 25)" />
          <stop offset="100%" stopColor="oklch(0.44 0.2 15)" />
        </linearGradient>
      </defs>
      <path
        d="M12 0.6c4.4 5.6 10.6 11.4 10.6 17.6A10.6 10.6 0 0 1 1.4 18.2C1.4 12 7.6 6.2 12 0.6Z"
        fill="url(#bn-drop)"
      />
      <ellipse
        cx="8.4"
        cy="19"
        rx="2.5"
        ry="3.4"
        fill="oklch(1 0 0 / 42%)"
        transform="rotate(-20 8.4 19)"
      />
    </motion.svg>
  );
}

export function BrandLogo({
  className,
  size = "md",
  animate = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}) {
  const text = { sm: "text-lg", md: "text-2xl", lg: "text-4xl md:text-5xl" }[size];
  const drop = { sm: "h-[0.95em]", md: "h-[1em]", lg: "h-[1.02em]" }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-display font-extrabold tracking-tight",
        text,
        className,
      )}
    >
      <span aria-hidden="true" className="inline-flex items-center">
        BLO
        <BloodDrop
          className={cn(drop, "mx-[0.04em] w-[0.72em] translate-y-[0.06em]")}
          animate={animate}
        />
        D
        <span className="text-primary">NET</span><span style={{ color: "oklch(0.9 0.15 85)" }}>+</span>
      </span>
      <span className="sr-only">BloodNet+</span>
    </span>
  );
}
