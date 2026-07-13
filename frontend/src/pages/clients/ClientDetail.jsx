import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../../api/axios"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"

export default function ClientDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: "", email: "", designation: "", phone: "" })
  const [editForm, setEditForm] = useState({ name: "", industry: "", email: "", phone: "", notes: "" })

  const canEdit = ["admin", "manager", "department_head"].includes(user?.role)
  const canAddContact = ["admin", "manager", "department_head"].includes(user?.role)
  const canDelete = user?.role === "admin"

  const fetchData = () => {
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/clients/${id}/contacts`)
    ]).then(([clientRes, contactRes]) => {
      setClient(clientRes.data)
      setEditForm({
        name: clientRes.data.name || "",
        industry: clientRes.data.industry || "",
        email: clientRes.data.email || "",
        phone: clientRes.data.phone || "",
        notes: clientRes.data.notes || "",
      })
      setContacts(contactRes.data)
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [id])

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/clients/${id}`, editForm)
      setShowEditForm(false)
      fetchData()
    } catch {
      alert("Failed to update client")
    }
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/clients/${id}/contacts`, { ...contactForm, client_id: parseInt(id) })
      setContactForm({ name: "", email: "", designation: "", phone: "" })
      setShowContactForm(false)
      fetchData()
    } catch {
      alert("Failed to add contact")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this client? This cannot be undone.")) return
    try {
      await api.delete(`/clients/${id}`)
      window.location.href = "/clients"
    } catch {
      alert("Failed to delete client")
    }
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
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Client Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{client.name}</h2>
              {client.industry && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {client.industry}
                </span>
              )}
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                {client.email && <p>Email: {client.email}</p>}
                {client.phone && <p>Phone: {client.phone}</p>}
                {client.notes && <p className="mt-2">{client.notes}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium"
                >
                  {showEditForm ? "Cancel" : "Edit"}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium"
                >
                  Delete Client
                </button>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {showEditForm && (
            <form onSubmit={handleEditSubmit} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    value={editForm.industry}
                    onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Save Changes
              </button>
            </form>
          )}
        </div>

        {/* Contacts */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Contacts ({contacts.length})</h3>
            {canAddContact && (
              <button
                onClick={() => setShowContactForm(!showContactForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                {showContactForm ? "Cancel" : "+ Add Contact"}
              </button>
            )}
          </div>

          {showContactForm && (
            <form onSubmit={handleContactSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                  placeholder="Contact name"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={contactForm.designation}
                  onChange={e => setContactForm({ ...contactForm, designation: e.target.value })}
                  placeholder="Designation"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="Email"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={contactForm.phone}
                  onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="Phone"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add Contact
              </button>
            </form>
          )}

          {contacts.length === 0 ? (
            <p className="text-gray-400 text-sm">No contacts yet</p>
          ) : (
            <div className="space-y-3">
              {contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                    {contact.designation && (
                      <p className="text-xs text-gray-500">{contact.designation}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {contact.email && <p>{contact.email}</p>}
                    {contact.phone && <p>{contact.phone}</p>}
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