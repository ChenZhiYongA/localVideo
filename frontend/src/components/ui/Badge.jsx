export function Badge({ children, variant = "default", className = "" }) {
  const v =
    variant === "danger"
      ? "bg-red-900/40 text-red-300"
      : variant === "muted"
        ? "bg-yt-surface-3 text-yt-text-2"
        : "bg-yt-surface-2 text-yt-text-2";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${v} ${className}`}>{children}</span>
  );
}
