import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import api from "../../api/axios"; // adjust path if your axios instance lives elsewhere
import { STATUS_HEX } from "../../constants/colors";

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkProgress({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/tasks/projects/${projectId}/my-progress`)
      .then((res) => setTasks(res.data))
      .catch((err) => console.error("Failed to load work progress:", err))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <p className="text-gray-500">Loading your progress...</p>;
  if (tasks.length === 0)
    return <p className="text-gray-500">No tasks assigned to you on this project yet.</p>;

  const chartData = tasks.map((t) => ({
    name: `#${t.id}`,
    value: 1,
    status: t.status,
    title: t.title,
    assigned_at: t.assigned_at,
  }));

  return (
    <div className="rounded-lg border p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <h3 className="mb-4 text-lg font-semibold">Your Work Progress</h3>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <PieChart width={220} height={220}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={(entry) => entry.name}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={STATUS_HEX[entry.status] || "#cbd5e1"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(_, __, props) => {
              const { title, assigned_at } = props.payload;
              return assigned_at
                ? `${title} — assigned ${formatDate(assigned_at)}`
                : title;
            }}
          />
        </PieChart>

        <div className="flex-1 space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: STATUS_HEX[t.status] || "#cbd5e1" }}
              />
              <span className="font-medium">#{t.id}</span>
              <span className="text-gray-600">{t.title}</span>
              {t.assigned_at && (
                <span className="text-xs text-gray-400">since {formatDate(t.assigned_at)}</span>
              )}
              <span className="ml-auto text-xs capitalize text-gray-400">
                {t.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}