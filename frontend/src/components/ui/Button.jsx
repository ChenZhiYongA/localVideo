export function Button({ children, className = "", variant = "primary", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-50 active:scale-[0.97]";
  const variants = {
    primary: "bg-yt-red text-white hover:brightness-110",
    secondary: "bg-yt-surface-2 text-yt-text hover:bg-yt-surface-3",
    ghost: "text-yt-text-2 hover:bg-yt-hover hover:text-yt-text",
  };
  return (
    <button type="button" className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
