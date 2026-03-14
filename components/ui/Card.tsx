interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`border border-white/10 p-4 ${className}`}>
      {children}
    </div>
  );
}
