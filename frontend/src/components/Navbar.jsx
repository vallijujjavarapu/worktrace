import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  department_head: 'bg-green-100 text-green-700',
  team_lead: 'bg-yellow-100 text-yellow-700',
  employee: 'bg-gray-100 text-gray-700',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <h1
          className="text-xl font-bold text-blue-600 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          WorkTrace
        </h1>
        <div className="flex gap-3 text-sm">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</button>
          <button onClick={() => navigate('/projects')} className="text-gray-600 hover:text-blue-600 font-medium">Projects</button>
          {["admin", "manager", "department_head"].includes(user?.role) && (
          <button
          onClick={() => navigate('/ai/summary')}
          className="text-gray-600 hover:text-blue-600 font-medium"
          >
          AI Summary
          </button>
          )}
          <button onClick={() => navigate('/people')} className="text-gray-600 hover:text-blue-600 font-medium">People</button>
          {["admin", "manager", "department_head"].includes(user?.role) && (
            <button onClick={() => navigate('/clients')} className="text-gray-600 hover:text-blue-600 font-medium">Clients</button>
          )}
          {["admin", "manager", "department_head"].includes(user?.role) && (
           <button onClick={() => navigate('/teams/bench')} className="text-gray-600 hover:text-blue-600 font-medium">Bench</button>
          )}
          <button onClick={() => navigate('/updates')} className="text-gray-600 hover:text-blue-600 font-medium">Updates</button>
          <button onClick={() => navigate('/org')} className="text-gray-600 hover:text-blue-600 font-medium">Org</button>
          {user?.role === "admin" && (
            <button onClick={() => navigate('/admin/org')} className="text-gray-600 hover:text-blue-600 font-medium">Admin</button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          onClick={() => navigate('/profile')}
          className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 font-medium"
        >
          {user?.name?.split(' ')[0]}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[user?.role]}`}>
          {user?.role?.replace('_', ' ')}
        </span>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">
          Logout
        </button>
      </div>
    </nav>
  )
}