export function Spinner({ className = "h-8 w-8" }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-yt-text-3 border-t-yt-red ${className}`}
      role="status"
    />
  );
}
