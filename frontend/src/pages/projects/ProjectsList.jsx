import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

export default function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/projects/').then(res => {
      setProjects(res.data)
      setLoading(false)
    })
  }, [])

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    planned: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700',
  }

  const canCreateProject = ['admin', 'department_head'].includes(user?.role)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <p className="text-gray-500 text-sm mt-1">
              Showing projects visible to your role
            </p>
          </div>
          {canCreateProject && (
            <button
              onClick={() => navigate('/projects/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + New Project
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No projects visible to your account
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {project.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{project.team_ids?.length} team(s) assigned</span>
                  <span>
                    {project.start_date
                      ? `Started ${project.start_date}`
                      : 'No start date'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}