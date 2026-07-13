import { useEffect, useState } from "react"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"

export default function WorkUpdates() {
  const [updates, setUpdates] = useState([])
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    update_text: "",
    blockers: "",
    project_id: "",
    task_id: "",
  })
  const { user } = useAuth()

  const fetchData = () => {
    Promise.all([
      api.get("/updates/"),
      api.get("/projects/"),
      api.get("/employees/"),
    ]).then(([updRes, projRes, empRes]) => {
      setUpdates(updRes.data)
      setProjects(projRes.data)
      const empMap = {}
      empRes.data.forEach(e => { empMap[e.id] = e.name })
      setEmployees(empMap)
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

 const handleSubmit = async (e) => {
  e.preventDefault()
  setSubmitting(true)
  try {
    await api.post("/updates/", {
      update_text: form.update_text,
      blockers: form.blockers || null,
      project_id: form.project_id ? parseInt(form.project_id) : null,
      task_id: form.task_id ? parseInt(form.task_id) : null,
    })
    setForm({ update_text: "", blockers: "", project_id: "", task_id: "" })
    setShowForm(false)
    fetchData()
  } catch (err) {
    alert(err.response?.data?.detail || "Failed to post update")
  } finally {
    setSubmitting(false)
  }
 }

  const projectMap = {}
  projects.forEach(p => { projectMap[p.id] = p.name })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Work Updates</h2>
            <p className="text-gray-500 text-sm mt-1">
              Daily and weekly progress updates
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {showForm ? "Cancel" : "+ Post Update"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Post Update</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What did you work on?
                </label>
                <textarea
                  value={form.update_text}
                  onChange={e => setForm({ ...form, update_text: e.target.value })}
                  required
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your progress today..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blockers (optional)
                </label>
                <textarea
                  value={form.blockers}
                  onChange={e => setForm({ ...form, blockers: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any blockers or issues?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Project (optional)
                  </label>
                  <select
                    value={form.project_id}
                    onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Task ID (optional)
                  </label>
                  <input
                    value={form.task_id}
                    onChange={e => setForm({ ...form, task_id: e.target.value })}
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Task ID"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Update"}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : updates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No updates yet</div>
        ) : (
          <div className="space-y-4">
            {[...updates].reverse().map(update => (
              <div
                key={update.id}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {employees[update.employee_id] || "Unknown"}
                    </span>
                    {update.project_id && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {projectMap[update.project_id] || "Project"}
                      </span>
                    )}
                    {update.task_id && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Task #{update.task_id}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(update.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{update.update_text}</p>
                {update.blockers && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-600 font-medium">Blocker: {update.blockers}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}