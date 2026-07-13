import { useEffect, useState } from "react"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"

export default function TeamSummary() {
  const { user } = useAuth()
  const [updates, setUpdates] = useState([])
  const [employees, setEmployees] = useState({})
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/updates/"),
      api.get("/employees/"),
    ]).then(([updRes, empRes]) => {
      setUpdates(updRes.data)
      const empMap = {}
      empRes.data.forEach(e => { empMap[e.id] = e.name })
      setEmployees(empMap)
      setFetching(false)
    })
  }, [])

  const generateSummary = async () => {
    setLoading(true)
    setSummary("")
    try {
      const res = await api.post("/ai/team-summary")
      setSummary(res.data.summary)
    } catch {
      setSummary("Failed to generate summary. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const canUseSummary = ["admin", "manager", "department_head"].includes(user?.role)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">AI Team Summary</h2>
          <p className="text-gray-500 text-sm mt-1">
            Intelligent summary of your team's work updates
          </p>
        </div>

        {!canUseSummary ? (
          <div className="bg-white rounded-xl p-6 border border-gray-100 text-center text-gray-400">
            This feature is available for managers and above
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Generate Summary</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Based on {updates.length} work updates from your visible team
                  </p>
                </div>
                <button
                  onClick={generateSummary}
                  disabled={loading || fetching}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : "Generate AI Summary"}
                </button>
              </div>

              {summary && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      AI Generated Summary
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {summary}
                  </p>
                </div>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-3">
              Individual Updates ({updates.length})
            </h3>
            <div className="space-y-3">
              {updates.map(update => (
                <div key={update.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {employees[update.employee_id] || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(update.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{update.update_text}</p>
                  {update.blockers && (
                    <p className="text-xs text-red-600 mt-1">
                      Blocker: {update.blockers}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}