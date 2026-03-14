interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "muted";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "border-white/40 text-white",
    success: "border-green-500/40 text-green-400",
    warning: "border-yellow-500/40 text-yellow-400",
    error: "border-red-500/40 text-red-400",
    muted: "border-white/20 text-white/40",
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-mono border ${variants[variant]}`}>
      {children}
    </span>
  );
}
