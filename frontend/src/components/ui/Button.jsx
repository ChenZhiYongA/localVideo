export function Button({ children, className = "", variant = "primary", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-yt-red text-white hover:bg-yt-red-dark",
    secondary: "bg-yt-surface-2 text-yt-text hover:bg-yt-surface-3",
    ghost: "text-yt-text-2 hover:bg-yt-hover",
  };
  return (
    <button type="button" className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
