import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = { member_id: '', campaign_id: '', amount: '', method: 'UPI' }

export default function Donations() {
  const [donations, setDonations] = useState([])
  const [members, setMembers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: don }, { data: mem }, { data: cam }] = await Promise.all([
      supabase.from('donations').select(`
        id, amount, method, donated_at,
        members(full_name),
        campaigns(title)
      `).order('donated_at', { ascending: false }),
      supabase.from('members').select('id, full_name'),
      supabase.from('campaigns').select('id, title'),
    ])
    setDonations(don ?? [])
    setMembers(mem ?? [])
    setCampaigns(cam ?? [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.member_id || !form.amount) return alert('Member and amount required')
    await supabase.from('donations').insert([{
      member_id: form.member_id,
      campaign_id: form.campaign_id || null,
      amount: parseFloat(form.amount),
      method: form.method,
    }])
    setShowModal(false)
    setForm(EMPTY)
    fetchAll()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this donation?')) return
    await supabase.from('donations').delete().eq('id', id)
    fetchAll()
  }

  const total = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">Khatri Community</h1>
        <a href="/dashboard" className="text-sm text-indigo-500 hover:underline">← Dashboard</a>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Donations</h2>
            <p className="text-sm text-gray-500 mt-1">Total collected: <span className="text-green-600 font-semibold">₹ {total.toLocaleString('en-IN')}</span></p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            + Add Donation
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-400 text-sm">Loading...</p>
          ) : donations.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No donations yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-left">
                <tr>
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Campaign</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700">{d.members?.full_name || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{d.campaigns?.title || <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-4 text-green-600 font-semibold">₹ {parseFloat(d.amount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">{d.method}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{new Date(d.donated_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Add Donation</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Member *</label>
                <select value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Select member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Campaign (optional)</label>
                <select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">No campaign</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Payment Method</label>
                <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {['UPI', 'Cash', 'Bank Transfer', 'Cheque'].map(m => <option key={m}>{m}</option>)}
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