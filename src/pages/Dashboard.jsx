import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ members: 0, collected: 0, pending: 0 })
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/login')
      else { setUser(data.session.user); fetchData() }
    })
  }, [])

  const fetchData = async () => {
    const [{ count: memberCount }, { data: donations }, { data: campaigns }, { data: memberList }] =
      await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('donations').select('amount'),
        supabase.from('campaigns').select('target_amount, raised_amount'),
        supabase.from('members').select('id, full_name, city, gotra, role, created_at').order('created_at', { ascending: false }).limit(10),
      ])

    const totalCollected = donations?.reduce((s, d) => s + parseFloat(d.amount || 0), 0) ?? 0
    const totalPending = campaigns?.reduce((s, c) => s + Math.max(0, parseFloat(c.target_amount || 0) - parseFloat(c.raised_amount || 0)), 0) ?? 0

    setStats({ members: memberCount ?? 0, collected: totalCollected, pending: totalPending })
    setMembers(memberList ?? [])
    setLoading(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login') }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">Khatri Community</h1>
        <div className="flex items-center gap-4">
          <img src={user.user_metadata.avatar_url} className="w-9 h-9 rounded-full" />
          <span className="text-sm font-medium text-gray-700">{user.user_metadata.full_name}</span>
          <button onClick={handleLogout} className="text-sm bg-red-50 text-red-500 px-4 py-1.5 rounded-lg hover:bg-red-100 transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome back, {user.user_metadata.full_name?.split(' ')[0]} 👋</h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard label="Total Members" value={stats.members} color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard label="Total Collected" value={`₹ ${stats.collected.toLocaleString('en-IN')}`} color="text-green-600" bg="bg-green-50" />
          <StatCard label="Campaign Pending" value={`₹ ${stats.pending.toLocaleString('en-IN')}`} color="text-red-500" bg="bg-red-50" />
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
  <h3 className="font-semibold text-gray-700 text-lg">Recent Members</h3>
  <a href="/members" className="text-sm text-indigo-500 font-medium hover:underline">View all members →</a>
</div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-400">No members found. Add members via Supabase.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">City</th>
                  <th className="pb-2">Gotra</th>
                  <th className="pb-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-700">{m.full_name || '—'}</td>
                    <td className="py-3 text-gray-500">{m.city || '—'}</td>
                    <td className="py-3 text-gray-500">{m.gotra || '—'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        {m.role || 'member'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}