import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"

export default function CreateTask() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projectTeamMembers, setProjectTeamMembers] = useState([])
  const [generating, setGenerating] = useState(false)

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    deliverable_link: "",
    assignee_ids: [],
  })

  useEffect(() => {
  Promise.all([
    api.get(`/projects/${id}`),
    api.get("/employees/"),
    api.get("/teams/"),
  ]).then(([projRes, empRes, teamRes]) => {
    const project = projRes.data
    const allEmps = empRes.data
    const allTeams = teamRes.data

    // Only show employees from teams assigned to this project
    const assignedTeamIds = project.team_ids || []
    const filtered = allEmps.filter(e => assignedTeamIds.includes(e.team_id))
    setProjectTeamMembers(filtered)
  })
}, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const toggleAssignee = (empId) => {
    setForm(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(empId)
        ? prev.assignee_ids.filter(id => id !== empId)
        : [...prev.assignee_ids, empId]
    }))
  }
 

  const generateDescription = async () => {
  if (!form.title) {
    alert("Enter a task title first")
    return
  }
  setGenerating(true)
  try {
    const res = await api.post("/ai/generate-task-description", {
      title: form.title
    })
    setForm({ ...form, description: res.data.description })
  } catch {
    alert("AI generation failed")
  } finally {
    setGenerating(false)
  }
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/tasks/", {
        ...form,
        project_id: parseInt(id),
        deliverable_link: form.deliverable_link || null,
      })
      navigate(`/projects/${id}`)
    } catch (err) {
      alert("Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Task title"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <button
                 type="button"
                 onClick={generateDescription}
                 disabled={generating}
                 className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                 {generating ? "Generating..." : "AI Assist"}
                </button>
              </div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deliverable Link (optional)
              </label>
              <input
                name="deliverable_link"
                value={form.deliverable_link}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assign Employees
            </label>
            {projectTeamMembers.length === 0 ? (
              <p className="text-gray-400 text-sm">No employees visible to your account</p>
            ) : (
              <div className="space-y-2">
                {projectTeamMembers.map(emp => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.assignee_ids.includes(emp.id)}
                      onChange={() => toggleAssignee(emp.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{emp.name}</span>
                    <span className="text-xs text-gray-400">{emp.role}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
