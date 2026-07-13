import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"

export default function CreateProject() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    start_date: "",
    target_end_date: "",
    department_id: "",
    team_ids: [],
  })

  useEffect(() => {
    api.get("/teams/").then(res => setTeams(res.data))
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const toggleTeam = (teamId) => {
    setForm(prev => ({
      ...prev,
      team_ids: prev.team_ids.includes(teamId)
        ? prev.team_ids.filter(id => id !== teamId)
        : [...prev.team_ids, teamId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        department_id: parseInt(form.department_id),
        start_date: form.start_date || null,
        target_end_date: form.target_end_date || null,
        team_ids: form.team_ids,
      }
      const res = await api.post("/projects/", payload)
      navigate(`/projects/${res.data.id}`)
    } catch (err) {
      alert("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h2>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department ID
                </label>
                <input
                  name="department_id"
                  value={form.department_id}
                  onChange={handleChange}
                  required
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target End Date
                </label>
                <input
                  name="target_end_date"
                  value={form.target_end_date}
                  onChange={handleChange}
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign Teams
              </label>
              {teams.length === 0 ? (
                <p className="text-gray-400 text-sm">No teams found</p>
              ) : (
                <div className="space-y-2">
                  {teams.map(team => (
                    <label
                      key={team.id}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.team_ids.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{team.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}