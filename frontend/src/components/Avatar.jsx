// Deterministic color per person (same name always gets the same color),
// so it feels designed rather than random on every reload.
const PALETTE = [
  "bg-indigo-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-sky-500", "bg-violet-500",
  "bg-teal-500", "bg-orange-500",
];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsFor(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export default function Avatar({ name, size = "md" }) {
  const sizes = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorForName(
        name
      )} ${sizes[size]}`}
      title={name}
    >
      {initialsFor(name)}
    </div>
  );
}