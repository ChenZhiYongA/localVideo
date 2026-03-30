export function Switch({ checked, onChange, disabled, label }) {
  return (
    <label className={`inline-flex items-center gap-2.5 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
          checked ? "bg-green-500" : "bg-yt-surface-3"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {label && <span className="text-sm text-yt-text">{label}</span>}
    </label>
  );
}
