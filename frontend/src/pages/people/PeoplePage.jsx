import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"

const roleColors = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  department_head: "bg-green-100 text-green-700",
  team_lead: "bg-yellow-100 text-yellow-700",
  employee: "bg-gray-100 text-gray-600",
}

export default function PeoplePage() {
  const [employees, setEmployees] = useState([])
  const [teams, setTeams] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

 useEffect(() => {
  Promise.all([
    api.get("/employees/all"),
    api.get("/employees/all"),
    api.get("/teams/"),
    api.get("/departments/"),
  ]).then(([empRes, teamRes, deptRes]) => {
    setEmployees(empRes.data)
    setTeams(teamRes.data)
    setDepartments(deptRes.data)
    setLoading(false)
  })
}, [])

  const teamMap = {}
  teams.forEach(t => { teamMap[t.id] = t })

  const deptMap = {}
  departments.forEach(d => { deptMap[d.id] = d })

  const empMap = {}
  employees.forEach(e => { empMap[e.id] = e })

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.designation || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">People</h2>
          <p className="text-gray-500 text-sm mt-1">Find and view employee profiles</p>
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or designation..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(emp => {
              const team = teamMap[emp.team_id]
              const dept = team ? deptMap[team.department_id] : null
              const manager = team?.manager_id ? empMap[team.manager_id] : null
              const lead = team?.team_lead_id ? empMap[team.team_lead_id] : null

              return (
                <div
                  key={emp.id}
                  onClick={() => navigate(`/people/${emp.id}`)}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {emp.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                        {emp.designation && (
                          <p className="text-xs text-gray-500">{emp.designation}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[emp.role]}`}>
                      {emp.role.replace("_", " ")}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Team: {team?.name || "No team"}</p>
                    <p>Department: {dept?.name || "No department"}</p>
                    {manager && <p>Manager: {manager.name}</p>}
                    {lead && lead.id !== emp.id && <p>Team Lead: {lead.name}</p>}
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