import { useEffect, useState } from "react"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"

const roleColors = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  department_head: "bg-green-100 text-green-700",
  team_lead: "bg-yellow-100 text-yellow-700",
  employee: "bg-gray-100 text-gray-600",
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [team, setTeam] = useState(null)
  const [department, setDepartment] = useState(null)
  const [peers, setPeers] = useState([])
  const [manager, setManager] = useState(null)
  const [teamLead, setTeamLead] = useState(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  Promise.all([
    api.get("/employees/me"),
    api.get("/employees/"),
    api.get("/teams/"),
    api.get("/departments/"),
  ]).then(([meRes, empRes, teamRes, deptRes]) => {
    const me = meRes.data
    setProfile(me)
    const allEmployees = empRes.data
    const allTeams = teamRes.data
    const allDepts = deptRes.data

    if (me.team_id) {
      const myTeam = allTeams.find(t => t.id === me.team_id)
      setTeam(myTeam)
      if (myTeam) {
        const myDept = allDepts.find(d => d.id === myTeam.department_id)
        setDepartment(myDept)
        if (myTeam.manager_id) setManager(allEmployees.find(e => e.id === myTeam.manager_id))
        if (myTeam.team_lead_id && myTeam.team_lead_id !== me.id)
          setTeamLead(allEmployees.find(e => e.id === myTeam.team_lead_id))
      }
      setPeers(allEmployees.filter(e => e.team_id === me.team_id && e.id !== me.id))
    } else if (me.role === "department_head") {
      // Find department where this person is the head
      const myDept = allDepts.find(d => d.department_head_id === me.id)
      setDepartment(myDept)
    }
    setLoading(false)
  })
}, [])

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

        {/* Profile Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {profile?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
                {profile?.designation && (
                  <p className="text-gray-600 font-medium">{profile.designation}</p>
                )}
                <p className="text-gray-400 text-sm">{profile?.email}</p>
              </div>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${roleColors[profile?.role]}`}>
              {profile?.role?.replace("_", " ")}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Employee ID</p>
              <p className="font-semibold text-gray-900">#{profile?.id}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Team</p>
              <p className="font-semibold text-gray-900">{team?.name || "No team"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Department</p>
              <p className="font-semibold text-gray-900">{department?.name || "No department"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${profile?.is_active ? "bg-green-500" : "bg-red-500"}`} />
                <p className="font-semibold text-gray-900">{profile?.is_active ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Reporting To */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Reporting To</h3>
            {!manager && !teamLead ? (
              <p className="text-gray-400 text-sm">No manager assigned</p>
            ) : (
              <div className="space-y-3">
                {manager && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {manager.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{manager.name}</p>
                      <p className="text-xs text-gray-500">{manager.designation || "Manager"}</p>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${roleColors[manager.role]}`}>
                      {manager.role.replace("_", " ")}
                    </span>
                  </div>
                )}
                {teamLead && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-600">
                        {teamLead.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{teamLead.name}</p>
                      <p className="text-xs text-gray-500">{teamLead.designation || "Team Lead"}</p>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${roleColors[teamLead.role]}`}>
                      {teamLead.role.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Team Peers */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">
              Team Peers ({peers.length})
            </h3>
            {peers.length === 0 ? (
              <p className="text-gray-400 text-sm">No peers in your team</p>
            ) : (
              <div className="space-y-3">
                {peers.map(peer => (
                  <div key={peer.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">
                        {peer.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{peer.name}</p>
                      <p className="text-xs text-gray-500">{peer.designation || peer.email}</p>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${roleColors[peer.role]}`}>
                      {peer.role.replace("_", " ")}
                    </span>
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