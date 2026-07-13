import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"
import WorkProgress from "./WorkProgress";
import { STATUS_HEX } from "../../constants/colors";
import { STATUS_COLORS, PRIORITY_COLORS, REQ_STATUS_COLORS } from "../../constants/colors";
import Avatar from "../../components/Avatar";
const categoryColors = {
  general: "bg-gray-100 text-gray-600",
  requirement: "bg-blue-100 text-blue-700",
  design: "bg-purple-100 text-purple-700",
  contract: "bg-green-100 text-green-700",
  report: "bg-yellow-100 text-yellow-700",
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestedTasks, setSuggestedTasks] = useState([])
  const [employees, setEmployees] = useState({})
  const [allEmployees, setAllEmployees] = useState([])
  const [documents, setDocuments] = useState([])
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [uploading, setUploading] = useState(false)
  const [docTitle, setDocTitle] = useState("")
  const [docCategory, setDocCategory] = useState("general")
  const [showUpload, setShowUpload] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [editProjectForm, setEditProjectForm] = useState({})
  const [showReqForm, setShowReqForm] = useState(false)
  const [reqType, setReqType] = useState("initial")
  const [reqForm, setReqForm] = useState({
    title: "",
    description: "",
    status: "open",
    owner_id: "",
    meeting_notes: "",
    is_new_requirement: false,
  })
  const [submittingReq, setSubmittingReq] = useState(false)

  const canCreateTask = ["admin", "manager", "department_head", "team_lead"].includes(user?.role)
  const canManageReqs = ["admin", "manager", "department_head", "team_lead", "employee"].includes(user?.role)

  const fetchDocuments = () =>
    api.get(`/documents/project/${id}`).then(res => setDocuments(res.data))

  const fetchRequirements = () =>
    api.get(`/requirements/?project_id=${id}`).then(res => setRequirements(res.data))

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/?project_id=${id}`),
      api.get("/employees/"),
      api.get(`/documents/project/${id}`),
      api.get(`/requirements/?project_id=${id}`),
      api.get("/teams/"),
    ]).then(([projRes, taskRes, empRes, docRes, reqRes, teamRes]) => {
      setProject(projRes.data)
      setTasks(taskRes.data)
      setDocuments(docRes.data)
      setRequirements(reqRes.data)
      setTeams(teamRes.data)
      setAllEmployees(empRes.data)
      const empMap = {}
      empRes.data.forEach(emp => { empMap[emp.id] = emp.name })
      setEmployees(empMap)
      setEditProjectForm({
        name: projRes.data.name,
        description: projRes.data.description || "",
        status: projRes.data.status,
        start_date: projRes.data.start_date || "",
        target_end_date: projRes.data.target_end_date || "",
      })
      setLoading(false)
    }).catch(err => {
      console.error("Failed to load project:", err)
      setLoading(false)
    })
  }, [id])

  const handleUpload = async (e) => {
    e.preventDefault()
    const file = fileInputRef.current?.files[0]
    if (!file || !docTitle.trim()) return
    setUploading(true)
    const formData = new FormData()
    formData.append("project_id", id)
    formData.append("title", docTitle)
    formData.append("category", docCategory)
    formData.append("file", file)
    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setDocTitle("")
      setDocCategory("general")
      fileInputRef.current.value = ""
      setShowUpload(false)
      fetchDocuments()
    } catch {
      alert("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async (docId) => {
    if (!confirm("Delete this document?")) return
    await api.delete(`/documents/${docId}`)
    fetchDocuments()
  }

 const getBaseUrl = () => import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  const handleDownload = async (docId, filename) => {
    const token = localStorage.getItem("token")
    const res = await fetch(`${getBaseUrl()}/documents/${docId}/download`, {
      headers: { Authorization: `Bearer ${token}` }
   })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePreview = async (doc) => {
   const token = localStorage.getItem("token")
   const mimeType = doc.mime_type || ""

  // PDFs and images can be previewed natively in browser
   if (mimeType.includes("pdf") || mimeType.includes("image")) {
    const res = await fetch(
      `${getBaseUrl()}/documents/${doc.id}/download?inline=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    window.open(url, "_blank")
    return
  }

  // PPTX, Word, Excel — use Microsoft Office online viewer
  // This only works if file is publicly accessible — for local dev show message
  alert(
    `"${doc.original_filename}" is a ${mimeType.split("/")[1]?.toUpperCase() || "file"} — browsers cannot preview this format directly.\n\nClick Download to open it in the appropriate app.`
  )
}

  const handleEditProject = async (e) => {
    e.preventDefault()
    await api.patch(`/projects/${id}`, editProjectForm)
    setShowEditProject(false)
    const res = await api.get(`/projects/${id}`)
    setProject(res.data)
  }

  const handleReqSubmit = async (e) => {
    e.preventDefault()
    setSubmittingReq(true)
    try {
      await api.post("/requirements/", {
        title: reqForm.title,
        description: reqForm.description,
        status: reqForm.status,
        project_id: parseInt(id),
        owner_id: reqForm.owner_id ? parseInt(reqForm.owner_id) : null,
        is_new_requirement: reqType === "new",
        meeting_notes: reqType === "new" ? reqForm.meeting_notes : null,
      })
      setReqForm({ title: "", description: "", status: "open", owner_id: "", meeting_notes: "", is_new_requirement: false })
      setShowReqForm(false)
      setSuggestedTasks([])
      fetchRequirements()
    } catch {
      alert("Failed to add requirement")
    } finally {
      setSubmittingReq(false)
    }
  }

  const handleReqStatusChange = async (reqId, newStatus) => {
    await api.patch(`/requirements/${reqId}`, { status: newStatus })
    fetchRequirements()
  }


       const analyzeRequirement = async () => {
        if (!reqForm.title) return
        setAnalyzing(true)
        try {
         const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
           model: "claude-sonnet-4-6",
           max_tokens: 1000,
           messages: [{
            role: "user",
            content: `You are a project manager analyzing a client requirement for a software project.

       Requirement: "${reqForm.title}"
       Description: "${reqForm.description || 'Not provided'}"
       Meeting notes: "${reqForm.meeting_notes || 'Not provided'}"

       Break this into 3-4 concrete development tasks. Respond ONLY with a JSON array, no other text:
       [{"title": "task title", "priority": "high|medium|low", "description": "what needs to be done"}]`
           }]
         })
       })
       const data = await response.json()
       const text = data.content?.map(c => c.text || "").join("") || "[]"
       const clean = text.replace(/```json|```/g, "").trim()
       setSuggestedTasks(JSON.parse(clean))
      } catch {
        setSuggestedTasks([])
      } finally {
        setAnalyzing(false)
      }
    }
  const initialReqs = requirements.filter(r => !r.is_new_requirement)
  const newReqs = requirements.filter(r => r.is_new_requirement)

  const ReqCard = ({ req }) => (
    <div className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{req.title}</h4>
          {req.description && (
            <p className="text-xs text-gray-500 mt-1">{req.description}</p>
          )}
          {req.meeting_notes && (
            <p className="text-xs text-blue-600 mt-1 italic">
              Meeting note: {req.meeting_notes}
            </p>
          )}
          {req.owner_id && (
             <div className="flex items-center gap-1.5 mt-1">
              <Avatar name={employees[req.owner_id] || "Unknown"} size="sm" />
              <p className="text-xs text-gray-400">
                Owner: {employees[req.owner_id] || "Unknown"}
              </p>
            </div>
          )}
        </div>
        <select
          value={req.status}
          onChange={e => handleReqStatusChange(req.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ml-4 ${REQ_STATUS_COLORS[req.status]}`}        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  )

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
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Project Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <p className="text-gray-500 mt-1">{project.description}</p>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${
              project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}>
              {project.status}
            </span>
          </div>
          <div className="mt-4 flex gap-6 text-sm text-gray-500">
            <span>Start: {project.start_date || "Not set"}</span>
            <span>End: {project.target_end_date || "Not set"}</span>
            <span>{project.team_ids?.length} team(s) assigned</span>
          </div>
          {project.team_ids?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Assigned Teams</h4>
              <div className="space-y-3">
                {project.team_ids.map(teamId => {
                  const team = teams.find(t => t.id === teamId)
                  if (!team) return null
                  const membersInTeam = allEmployees.filter(e => e.team_id === teamId)
                  return (
                    <div key={teamId} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{team.name}</p>
                        <span className="text-xs text-gray-400">{membersInTeam.length} members</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {membersInTeam.map(emp => (
                          <span key={emp.id} className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-700 pl-1 pr-2 py-0.5 rounded-full">
                            <Avatar name={emp.name} size="sm" />
                            {emp.name} {team.team_lead_id === emp.id ? "(Lead)" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {["admin", "manager", "department_head"].includes(user?.role) && (
          <button
            onClick={() => setShowEditProject(!showEditProject)}
            className="mt-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium"
          >
            {showEditProject ? "Cancel" : "Edit Project"}
          </button>
        )}

        {user?.role === "admin" && (
          <button
            onClick={async () => {
              if (!confirm("Delete this project? This cannot be undone.")) return
              await api.delete(`/projects/${id}`)
              navigate("/projects")
            }}
            className="mt-3 ml-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium"
          >
            Delete Project
          </button>
        )}

        {showEditProject && (
          <form onSubmit={handleEditProject} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={editProjectForm.name || ""}
                  onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editProjectForm.status || ""}
                  onChange={e => setEditProjectForm({ ...editProjectForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={editProjectForm.start_date || ""}
                  onChange={e => setEditProjectForm({ ...editProjectForm, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target End Date</label>
                <input
                  type="date"
                  value={editProjectForm.target_end_date || ""}
                  onChange={e => setEditProjectForm({ ...editProjectForm, target_end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Save Changes
            </button>
          </form>
        )}

        {/* Requirements */}
        <div className="mb-8 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Requirements</h3>
            {canManageReqs && (
              <button
                onClick={() => setShowReqForm(!showReqForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {showReqForm ? "Cancel" : "+ Add Requirement"}
              </button>
            )}
          </div>

          {showReqForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setReqType("initial")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    reqType === "initial" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Initial Requirement
                </button>
                <button
                  type="button"
                  onClick={() => setReqType("new")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    reqType === "new" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  New Requirement (from meeting)
                </button>
              </div>

              <form onSubmit={handleReqSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      value={reqForm.title}
                      onChange={e => setReqForm({ ...reqForm, title: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Requirement title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                    <select
                      value={reqForm.owner_id}
                      onChange={e => setReqForm({ ...reqForm, owner_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select owner</option>
                      {Object.entries(employees).map(([empId, name]) => (
                        <option key={empId} value={empId}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={reqForm.description}
                    onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the requirement"
                  />
                </div>

                {reqType === "new" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Notes</label>
                    <textarea
                      value={reqForm.meeting_notes}
                      onChange={e => setReqForm({ ...reqForm, meeting_notes: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Context from the client meeting where this was raised..."
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={analyzeRequirement}
                  disabled={analyzing}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                >
                  {analyzing ? "Analyzing..." : "✦ AI: Break into tasks"}
                </button>

                {suggestedTasks.length > 0 && (
                  <div className="mt-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <p className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide">
                      Suggested Tasks
                    </p>
                    <div className="space-y-2">
                      {suggestedTasks.map((task, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>{task.priority}</span>
                          <div>
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-gray-500 text-xs">{task.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingReq}
                  className={`px-6 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                    reqType === "new" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submittingReq ? "Adding..." : `Add ${reqType === "new" ? "New" : "Initial"} Requirement`}
                </button>
              </form>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Project Requirements ({initialReqs.length})
            </h4>
            {initialReqs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-white rounded-xl border border-gray-100 text-sm">
                No initial requirements added yet
              </div>
            ) : (
              <div className="space-y-2">
                {initialReqs.map(req => <ReqCard key={req.id} req={req} />)}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-orange-600 mb-2 uppercase tracking-wide">
              New Requirements from Client Meetings ({newReqs.length})
            </h4>
            {newReqs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-white rounded-xl border border-orange-100 text-sm">
                No new requirements raised yet
              </div>
            ) : (
              <div className="space-y-2">
                {newReqs.map(req => (
                  <div key={req.id} className="border-l-4 border-orange-400 pl-2">
                    <ReqCard req={req} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tasks ({tasks.length})</h3>
          {canCreateTask && (
            <button
              onClick={() => navigate(`/projects/${id}/tasks/new`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + New Task
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
            No tasks yet — create the first one
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                    )}
                    {task.assignee_ids?.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {task.assignee_ids.map(empId => (
                          <span key={empId} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 pl-1 pr-2 py-0.5 rounded-full">
                            <Avatar name={employees[empId] || `Employee ${empId}`} size="sm" />
                            {employees[empId] || `Employee ${empId}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>    
                      {task.priority}                   
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          <WorkProgress projectId={project.id} />
        {/* Documents */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Documents ({documents.length})</h3>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {showUpload ? "Cancel" : "+ Upload Document"}
            </button>
          </div>

          {showUpload && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      required
                      placeholder="Document title"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={docCategory}
                      onChange={e => setDocCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="requirement">Requirement</option>
                      <option value="design">Design</option>
                      <option value="contract">Contract</option>
                      <option value="report">Report</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    required
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </form>
            </div>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
              No documents uploaded yet
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
               <div key={doc.id} className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5">
                 <div className="flex items-center gap-4">
                  <div className="text-sm font-bold text-gray-400">
                    {doc.mime_type?.includes("pdf") ? "PDF" :
                     doc.mime_type?.includes("image") ? "IMG" :
                     doc.mime_type?.includes("word") ? "DOC" : "FILE"}
                  </div>
                  <Avatar name={employees[doc.uploaded_by] || "Unknown"} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {doc.original_filename} · {formatSize(doc.file_size)} ·
                      {employees[doc.uploaded_by] || "Unknown"} ·
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    {doc.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[doc.category] || categoryColors.general}`}>
                        {doc.category}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(doc.id, doc.original_filename)}
                       className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium"
                      >
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}