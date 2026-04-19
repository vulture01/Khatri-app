import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = { full_name: '', username: '', city: '', gotra: '', role: 'member' }

export default function Members() {
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('created_at', { ascending: false })
    setMembers(data ?? [])
    setLoading(false)
  }

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true) }
  const openEdit = (m) => { setForm({ full_name: m.full_name, username: m.username, city: m.city, gotra: m.gotra, role: m.role }); setEditId(m.id); setShowModal(true) }

  const handleSave = async () => {
    if (!form.full_name.trim()) return alert('Full name required')
    if (editId) {
      await supabase.from('members').update(form).eq('id', editId)
    } else {
      await supabase.from('members').insert([form])
    }
    setShowModal(false)
    fetchMembers()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this member?')) return
    await supabase.from('members').delete().eq('id', id)
    fetchMembers()
  }

  const filtered = members.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.city?.toLowerCase().includes(search.toLowerCase()) ||
    m.gotra?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">Khatri Community</h1>
        <a href="/dashboard" className="text-sm text-indigo-500 hover:underline">← Dashboard</a>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Members</h2>
          <button onClick={openAdd} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            + Add Member
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, city or gotra..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-400 text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No members found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-left">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Gotra</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700">{m.full_name || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{m.username || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{m.city || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{m.gotra || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        {m.role || 'member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => openEdit(m)} className="text-indigo-500 hover:underline text-xs">Edit</button>
                      <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-6">{editId ? 'Edit Member' : 'Add Member'}</h3>
            <div className="flex flex-col gap-4">
              {[
                { key: 'full_name', label: 'Full Name', placeholder: 'e.g. Raj Khatri' },
                { key: 'username', label: 'Username', placeholder: 'e.g. rajkhatri' },
                { key: 'city', label: 'City', placeholder: 'e.g. Chennai' },
                { key: 'gotra', label: 'Gotra', placeholder: 'e.g. Kashyap' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} className="text-sm bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}