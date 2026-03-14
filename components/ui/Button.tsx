import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, disabled, className = "", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-mono text-sm tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2",
      lg: "px-6 py-3",
    };
    const variants = {
      primary: "bg-white text-black hover:bg-white/90 border border-white",
      secondary: "bg-transparent text-white border border-white/40 hover:border-white",
      ghost: "bg-transparent text-white/60 hover:text-white border border-transparent hover:border-white/20",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {loading ? <span className="mr-2 animate-spin">⟳</span> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
