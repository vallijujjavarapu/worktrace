import { useEffect, useState } from "react"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"

const statusColors = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
}

export default function RequirementsList() {
  const [requirements, setRequirements] = useState([])
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "open",
    project_id: "",
    owner_id: "",
  })
  const { user } = useAuth()

  const canCreate = ["admin", "manager", "department_head", "team_lead"].includes(user?.role)

  const fetchData = () => {
    Promise.all([
      api.get("/requirements/"),
      api.get("/projects/"),
      api.get("/employees/"),
    ]).then(([reqRes, projRes, empRes]) => {
      setRequirements(reqRes.data)
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
      await api.post("/requirements/", {
        ...form,
        project_id: parseInt(form.project_id),
        owner_id: form.owner_id ? parseInt(form.owner_id) : null,
      })
      setForm({ title: "", description: "", status: "open", project_id: "", owner_id: "" })
      setShowForm(false)
      fetchData()
    } catch {
      alert("Failed to create requirement")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (reqId, newStatus) => {
    await api.patch(`/requirements/${reqId}`, { status: newStatus })
    fetchData()
  }

  const projectMap = {}
  projects.forEach(p => { projectMap[p.id] = p.name })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Requirements</h2>
            <p className="text-gray-500 text-sm mt-1">
              Track client requirements from capture to delivery
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {showForm ? "Cancel" : "+ New Requirement"}
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">New Requirement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Requirement title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the requirement"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={form.project_id}
                    onChange={e => setForm({ ...form, project_id: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <select
                    value={form.owner_id}
                    onChange={e => setForm({ ...form, owner_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select owner</option>
                    {Object.entries(employees).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Requirement"}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : requirements.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No requirements yet</div>
        ) : (
          <div className="space-y-3">
            {requirements.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{req.title}</h4>
                    {req.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{req.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Project: {projectMap[req.project_id] || req.project_id}</span>
                      {req.owner_id && (
                        <span>Owner: {employees[req.owner_id] || req.owner_id}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <select
                      value={req.status}
                      onChange={e => handleStatusChange(req.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[req.status]}`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}