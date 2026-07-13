import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_HEX } from "../../constants/colors";
const priorityColors = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
}

const actionLabels = {
  task_created: "Task created",
  status_changed: "Status changed",
  assignee_added: "Assignee added",
  comment: "Comment",
  deliverable_link_changed: "Deliverable updated",
}

const statusButtons = ["todo", "in_progress", "blocked", "done"]

export default function TaskDetail() {
  const { id } = useParams()
  const [task, setTask] = useState(null)
  const [history, setHistory] = useState([])
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = () => {
    Promise.all([
      api.get(`/tasks/${id}`),
      api.get(`/tasks/${id}/history`)
    ]).then(([taskRes, histRes]) => {
      setTask(taskRes.data)
      setHistory(histRes.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleStatusChange = async (newStatus) => {
    await api.patch(`/tasks/${id}`, { status: newStatus })
    fetchData()
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    await api.post(`/tasks/${id}/comment`, { note: comment })
    setComment("")
    setSubmitting(false)
    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20 text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          <p className="text-gray-500 mb-4">{task.description}</p>
          <div className="flex gap-2 flex-wrap">
            {statusButtons.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
                  task.status === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Activity History ({history.length} entries)
          </h3>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {history.map(entry => (
                <div key={entry.id} className="flex gap-4 text-sm border-b border-gray-50 pb-3">
                  <div className="text-gray-400 text-xs mt-0.5 whitespace-nowrap min-w-36">
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      {actionLabels[entry.action_type] || entry.action_type}
                    </span>
                    {entry.old_value && entry.new_value && (
                      <span className="text-gray-500">
                        {" "}- {entry.old_value} to {entry.new_value}
                      </span>
                    )}
                    {entry.note && (
                      <p className="text-gray-600 mt-0.5">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Add Update</h3>
          <form onSubmit={handleComment} className="flex gap-3">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment or progress update..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post"}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}