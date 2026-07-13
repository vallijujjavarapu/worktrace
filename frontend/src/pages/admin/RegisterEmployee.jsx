import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"

export default function RegisterEmployee() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [selectedDept, setSelectedDept] = useState("")
  const [selectedTeamDept, setSelectedTeamDept] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    team_id: "",
    designation: "",
  })

  useEffect(() => {
    if (!["admin", "manager"].includes(user?.role)) {
      navigate("/dashboard")
    }
    Promise.all([
      api.get("/teams/"),
      api.get("/departments/"),
      api.get("/employees/"),
    ]).then(([teamRes, deptRes, empRes]) => {
      setTeams(teamRes.data)
      setDepartments(deptRes.data)
      setEmployees(empRes.data)
    })
  }, [])

  const handleTeamChange = (teamId) => {
    setForm({ ...form, team_id: teamId })
    if (teamId) {
      const team = teams.find(t => t.id === parseInt(teamId))
      if (team) {
        const dept = departments.find(d => d.id === team.department_id)
        setSelectedTeamDept(dept?.name || "")
      }
    } else {
      setSelectedTeamDept("")
    }
  }

  const getTeamManager = () => {
    if (!form.team_id) return null
    const team = teams.find(t => t.id === parseInt(form.team_id))
    if (!team?.manager_id) return null
    return employees.find(e => e.id === team.manager_id)
  }

  const getTeamLead = () => {
    if (!form.team_id) return null
    const team = teams.find(t => t.id === parseInt(form.team_id))
    if (!team?.team_lead_id) return null
    return employees.find(e => e.id === team.team_lead_id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const empRes = await api.post("/employees/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        team_id: form.team_id ? parseInt(form.team_id) : null,
        designation: form.designation || null,
      })

      // If department head, update the department
      if (form.role === "department_head" && selectedDept) {
        const dept = departments.find(d => d.id === parseInt(selectedDept))
        await api.patch(`/departments/${selectedDept}`, {
          name: dept?.name,
          description: dept?.description,
          department_head_id: empRes.data.id,
        })
      }

      setSuccess(`${form.name} registered successfully!`)
      setForm({ name: "", email: "", password: "", role: "employee", team_id: "", designation: "" })
      setSelectedTeamDept("")
      setSelectedDept("")
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to register employee")
    } finally {
      setLoading(false)
    }
  }

  const manager = getTeamManager()
  const teamLead = getTeamLead()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Register New Employee</h2>
        <p className="text-gray-500 text-sm mb-8">Add a new member to the organization</p>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@worktrace.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Temporary password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  value={form.designation}
                  onChange={e => setForm({ ...form, designation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Developer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => {
                    setForm({ ...form, role: e.target.value, team_id: "" })
                    setSelectedTeamDept("")
                    setSelectedDept("")
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="employee">Employee</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="manager">Manager</option>
                  <option value="department_head">Department Head</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {["employee", "team_lead"].includes(form.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Team</label>
                  <select
                    value={form.team_id}
                    onChange={e => handleTeamChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.role === "department_head" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Department</label>
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.role === "manager" && (
                <div className="flex items-center">
                  <p className="text-sm text-gray-400">
                    Managers are assigned to teams separately after creation
                  </p>
                </div>
              )}

              {form.role === "admin" && (
                <div className="flex items-center">
                  <p className="text-sm text-gray-400">
                    Admins have access to everything
                  </p>
                </div>
              )}
            </div>

            {/* Team info panel */}
            {form.team_id && ["employee", "team_lead"].includes(form.role) && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Team Information
                </p>
                {selectedTeamDept && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24">Department:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedTeamDept}</span>
                  </div>
                )}
                {manager && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24">Manager:</span>
                    <span className="text-sm font-medium text-gray-900">{manager.name}</span>
                    <span className="text-xs text-gray-400">({manager.designation || "Manager"})</span>
                  </div>
                )}
                {teamLead && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24">Team Lead:</span>
                    <span className="text-sm font-medium text-gray-900">{teamLead.name}</span>
                    <span className="text-xs text-gray-400">({teamLead.designation || "Team Lead"})</span>
                  </div>
                )}
                <p className="text-xs text-blue-600">
                  This employee will report to the above manager and team lead
                </p>
              </div>
            )}

            {/* Department info panel */}
            {selectedDept && form.role === "department_head" && (
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Department Information
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24">Department:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {departments.find(d => d.id === parseInt(selectedDept))?.name}
                  </span>
                </div>
                <p className="text-xs text-green-600">
                  This person will be set as the head of this department
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/org")}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register Employee"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}