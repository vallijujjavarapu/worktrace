import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ projects: 0, tasks: 0, updates: 0 })
  const [recentTasks, setRecentTasks] = useState([])
  const [recentUpdates, setRecentUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/projects/"),
      api.get("/tasks/"),
      api.get("/updates/"),
    ]).then(([projRes, taskRes, updRes]) => {
      setStats({
        projects: projRes.data.length,
        tasks: taskRes.data.length,
        updates: updRes.data.length,
      })
      setRecentTasks(taskRes.data.slice(-3).reverse())
      setRecentUpdates(updRes.data.slice(-3).reverse())
      setLoading(false)
    })
  }, [])

  const statusColors = {
    todo: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
    blocked: "bg-red-100 text-red-700",
    done: "bg-green-100 text-green-700",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]}
          </h2>
          <p className="text-gray-500 mt-1">
            Logged in as <strong>{user?.role?.replace("_", " ")}</strong>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div
            onClick={() => navigate("/projects")}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <p className="text-sm text-gray-500 mb-1">Visible Projects</p>
            <p className="text-3xl font-bold text-blue-600">
              {loading ? "-" : stats.projects}
            </p>
          </div>
          <div
            onClick={() => navigate("/projects")}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
            <p className="text-3xl font-bold text-purple-600">
              {loading ? "-" : stats.tasks}
            </p>
          </div>
          <div
            onClick={() => navigate("/updates")}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <p className="text-sm text-gray-500 mb-1">Work Updates</p>
            <p className="text-3xl font-bold text-green-600">
              {loading ? "-" : stats.updates}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Recent Tasks */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
              <button
                onClick={() => navigate("/projects")}
                className="text-xs text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : recentTasks.length === 0 ? (
              <p className="text-gray-400 text-sm">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <p className="text-sm text-gray-700 font-medium">{task.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Updates */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Updates</h3>
              <button
                onClick={() => navigate("/updates")}
                className="text-xs text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : recentUpdates.length === 0 ? (
              <p className="text-gray-400 text-sm">No updates yet</p>
            ) : (
              <div className="space-y-3">
                {recentUpdates.map(update => (
                  <div key={update.id} className="p-2 rounded-lg">
                    <p className="text-sm text-gray-700">{update.update_text}</p>
                    {update.blockers && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Blocker: {update.blockers}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(update.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}