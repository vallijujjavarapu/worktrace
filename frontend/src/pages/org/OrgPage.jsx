import { useEffect, useState } from "react"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"

const roleColors = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  department_head: "bg-green-100 text-green-700",
  team_lead: "bg-yellow-100 text-yellow-700",
  employee: "bg-gray-100 text-gray-600",
}

export default function OrgPage() {
  const [employees, setEmployees] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("employees")
  const { user } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    Promise.all([
      api.get("/employees/"),
      api.get("/teams/"),
    ]).then(([empRes, teamRes]) => {
      setEmployees(empRes.data)
      setTeams(teamRes.data)
      setLoading(false)
    })
  }, [])

  // Build lookup maps
  const teamMap = {}
  teams.forEach(t => { teamMap[t.id] = t.name })
  
  const employeeMap = {}
  employees.forEach(e => { employeeMap[e.id] = e.name })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-8 flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">Organization</h2>
            <p className="text-gray-500 text-sm mt-1">
            Showing members visible to your role
            </p>
        </div>
        {["admin", "manager"].includes(user?.role) && (
         <button
            onClick={() => navigate("/admin/register")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Register Employee
        </button>
        )}
    </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("employees")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "employees"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "teams"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Teams ({teams.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : activeTab === "employees" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(emp => (
              <div
                key={emp.id}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{emp.name}</h3>
                    <p className="text-sm text-gray-500">{emp.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[emp.role]}`}>
                    {emp.role.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {emp.designation && <p>{emp.designation}</p>}
                  Team: {emp.team_id ? teamMap[emp.team_id] || `Team ${emp.team_id}` : "No team"}
            </div>
                {["admin", "manager"].includes(user?.role) && (
              <button
                  onClick={() => navigate(`/admin/employees/${emp.id}/edit`)}
                  className="mt-3 w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg font-medium"
               >
            Edit Employee
              </button>
               )}
             </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => {
              const teamMembers = employees.filter(e => e.team_id === team.id)
              return (
                <div
                  key={team.id}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {teamMembers.length} members
                    </span>
                  </div>

                  {team.team_lead_id && (
                    <p className="text-xs text-gray-500 mb-1">
                      Lead: {employeeMap[team.team_lead_id] || "Unknown"}
                    </p>
                  )}
                  {team.manager_id && (
                    <p className="text-xs text-gray-500 mb-3">
                      Manager: {employeeMap[team.manager_id] || "Unknown"}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {teamMembers.map(emp => (
                      <span
                        key={emp.id}
                        className={`text-xs px-2 py-1 rounded-full ${roleColors[emp.role]}`}
                      >
                        {emp.name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}