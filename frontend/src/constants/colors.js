// Single source of truth for all status/priority color coding across the app.
// Import this everywhere instead of redefining colors per-page.

export const STATUS_COLORS = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  done: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700", // alias used in some places
};

export const STATUS_HEX = {
  // Hex versions for chart libraries (recharts needs raw color values, not Tailwind classes)
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  blocked: "#ef4444",
  done: "#22c55e",
  completed: "#22c55e",
};

export const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export const REQ_STATUS_COLORS = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};