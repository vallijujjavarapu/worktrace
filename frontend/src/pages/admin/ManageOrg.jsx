import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"

export default function ManageOrg() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [teams, setTeams] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("departments")

  const [deptForm, setDeptForm] = useState({ name: "", description: "", department_head_id: "" })
  const [teamForm, setTeamForm] = useState({ name: "", department_id: "", team_lead_id: "", manager_id: "" })
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [editingTeam, setEditingTeam] = useState(null)

  const fetchData = () => {
    Promise.all([
      api.get("/departments/"),
      api.get("/teams/"),
      api.get("/employees/"),
    ]).then(([deptRes, teamRes, empRes]) => {
      setDepartments(deptRes.data)
      setTeams(teamRes.data)
      setEmployees(empRes.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    if (user?.role !== "admin") navigate("/dashboard")
    fetchData()
  }, [])

  const empMap = {}
  employees.forEach(e => { empMap[e.id] = e.name })

  const handleDeptSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: deptForm.name,
        description: deptForm.description,
        department_head_id: deptForm.department_head_id ? parseInt(deptForm.department_head_id) : null,
      }
      if (editingDept) {
        await api.put(`/departments/${editingDept}`, payload)
      } else {
        await api.post("/departments/", payload)
      }
      setDeptForm({ name: "", description: "", department_head_id: "" })
      setShowDeptForm(false)
      setEditingDept(null)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save department")
    }
  }

  const handleTeamSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: teamForm.name,
        department_id: parseInt(teamForm.department_id),
        team_lead_id: teamForm.team_lead_id ? parseInt(teamForm.team_lead_id) : null,
        manager_id: teamForm.manager_id ? parseInt(teamForm.manager_id) : null,
      }
      if (editingTeam) {
        await api.put(`/teams/${editingTeam}`, payload)
      } else {
        await api.post("/teams/", payload)
      }
      setTeamForm({ name: "", department_id: "", team_lead_id: "", manager_id: "" })
      setShowTeamForm(false)
      setEditingTeam(null)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save team")
    }
  }

  const handleDeleteDept = async (id) => {
    if (!confirm("Delete this department? All teams inside will be affected.")) return
    try {
      await api.delete(`/departments/${id}`)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete department")
    }
  }

  const handleDeleteTeam = async (id) => {
    if (!confirm("Delete this team?")) return
    try {
      await api.delete(`/teams/${id}`)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete team")
    }
  }

  const startEditDept = (dept) => {
    setDeptForm({
      name: dept.name,
      description: dept.description,
      department_head_id: dept.department_head_id || "",
    })
    setEditingDept(dept.id)
    setShowDeptForm(true)
  }

  const startEditTeam = (team) => {
    setTeamForm({
      name: team.name,
      department_id: team.department_id,
      team_lead_id: team.team_lead_id || "",
      manager_id: team.manager_id || "",
    })
    setEditingTeam(team.id)
    setShowTeamForm(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="text-center py-20 text-gray-400">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Manage Organization</h2>
          <p className="text-gray-500 text-sm mt-1">Admin panel — create, edit and delete departments and teams</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("departments")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "departments" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "teams" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Teams ({teams.length})
          </button>
        </div>

        {activeTab === "departments" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Departments</h3>
              <button
                onClick={() => { setShowDeptForm(!showDeptForm); setEditingDept(null); setDeptForm({ name: "", description: "", department_head_id: "" }) }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {showDeptForm && !editingDept ? "Cancel" : "+ New Department"}
              </button>
            </div>

            {showDeptForm && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  {editingDept ? "Edit Department" : "New Department"}
                </h4>
                <form onSubmit={handleDeptSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        value={deptForm.name}
                        onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Department name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department Head</label>
                      <select
                        value={deptForm.department_head_id}
                        onChange={e => setDeptForm({ ...deptForm, department_head_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No head assigned</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      value={deptForm.description}
                      onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Department description"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
                      {editingDept ? "Save Changes" : "Create Department"}
                    </button>
                    {editingDept && (
                      <button
                        type="button"
                        onClick={() => { setShowDeptForm(false); setEditingDept(null) }}
                        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {departments.map(dept => (
                <div key={dept.id} className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{dept.name}</h4>
                    <p className="text-sm text-gray-500">{dept.description}</p>
                    {dept.department_head_id && (
                      <p className="text-xs text-gray-400 mt-1">Head: {empMap[dept.department_head_id] || "Unknown"}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditDept(dept)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDept(dept.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "teams" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Teams</h3>
              <button
                onClick={() => { setShowTeamForm(!showTeamForm); setEditingTeam(null); setTeamForm({ name: "", department_id: "", team_lead_id: "", manager_id: "" }) }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {showTeamForm && !editingTeam ? "Cancel" : "+ New Team"}
              </button>
            </div>

            {showTeamForm && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  {editingTeam ? "Edit Team" : "New Team"}
                </h4>
                <form onSubmit={handleTeamSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                      <input
                        value={teamForm.name}
                        onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Team name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={teamForm.department_id}
                        onChange={e => setTeamForm({ ...teamForm, department_id: e.target.value })}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Team Lead</label>
                      <select
                        value={teamForm.team_lead_id}
                        onChange={e => setTeamForm({ ...teamForm, team_lead_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No lead</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                      <select
                        value={teamForm.manager_id}
                        onChange={e => setTeamForm({ ...teamForm, manager_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No manager</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
                      {editingTeam ? "Save Changes" : "Create Team"}
                    </button>
                    {editingTeam && (
                      <button
                        type="button"
                        onClick={() => { setShowTeamForm(false); setEditingTeam(null) }}
                        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {teams.map(team => (
                <div key={team.id} className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{team.name}</h4>
                    <p className="text-sm text-gray-500">
                      Department: {departments.find(d => d.id === team.department_id)?.name || "Unknown"}
                    </p>
                    {team.team_lead_id && (
                      <p className="text-xs text-gray-400">Lead: {empMap[team.team_lead_id]}</p>
                    )}
                    {team.manager_id && (
                      <p className="text-xs text-gray-400">Manager: {empMap[team.manager_id]}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditTeam(team)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}