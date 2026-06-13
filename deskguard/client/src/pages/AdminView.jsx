import { useEffect, useState } from 'react';
import axios from 'axios';

const STATUS_COLORS = {
  free: 'bg-green-500/20 text-green-400',
  occupied: 'bg-red-500/20 text-red-400',
  away: 'bg-yellow-500/20 text-yellow-400',
  abandoned: 'bg-gray-500/20 text-gray-400',
};

export default function AdminView({ desks, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchBookings() {
    try {
      const res = await axios.get('/api/bookings/all');
      setBookings(res.data);
      setLoadingBookings(false);
    } catch (e) {
      setLoadingBookings(false);
    }
  }

  async function handleReset(deskNumber) {
    await axios.post('/api/admin/reset', { desk_number: deskNumber });
  }

  const stats = {
    total: desks.length,
    free: desks.filter(d => d.status === 'free').length,
    occupied: desks.filter(d => d.status === 'occupied').length,
    away: desks.filter(d => d.status === 'away').length,
    abandoned: desks.filter(d => d.status === 'abandoned').length,
    utilization: Math.round((desks.filter(d => d.status !== 'free').length / desks.length) * 100),
    bookings: bookings.length,
  };

  const upcomingBookings = bookings.filter(b => 
    new Date(b.booking_start) > new Date()
  ).sort((a, b) => new Date(a.booking_start) - new Date(b.booking_start)).slice(0, 5);

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Librarian Dashboard 🧑💼</h1>
          <p className="text-slate-400 text-sm">Live desk management & booking analytics</p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs bg-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/30"
        >
          Logout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', count: stats.total, color: 'blue' },
          { label: 'Free', count: stats.free, color: 'green' },
          { label: 'Occupied', count: stats.occupied, color: 'red' },
          { label: 'Away', count: stats.away, color: 'yellow' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold text-${color}-400`}>{count}</div>
            <div className="text-slate-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Booking & Utilization Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Pending Bookings</p>
          <p className="text-4xl font-bold text-purple-400">{stats.bookings}</p>
          <p className="text-slate-500 text-xs mt-1">Active reservations</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Desk Utilization</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${stats.utilization}%` }}
              />
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.utilization}%</p>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {!loadingBookings && upcomingBookings.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Upcoming Bookings 📅</h2>
          <div className="space-y-2">
            {upcomingBookings.map(booking => (
              <div key={booking.id} className="bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-sm">
                    {booking.desk_number} — {booking.student_name}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {formatTime(booking.booking_start)} to {new Date(booking.booking_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  2h slot
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abandoned Desks Alert */}
      {stats.abandoned > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-red-400 mb-4">⚠️ Abandoned Desks ({stats.abandoned})</h2>
          <div className="space-y-2">
            {desks.filter(d => d.status === 'abandoned').map(desk => (
              <div key={desk.desk_number} className="bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="text-white font-bold text-sm">{desk.desk_number}</p>
                  <p className="text-slate-400 text-xs">
                    {desk.student_name} — Inactive
                  </p>
                </div>
                <button
                  onClick={() => handleReset(desk.desk_number)}
                  className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Desks Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">All Desks</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
              <th className="px-4 py-3 text-left">Desk</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Student ID</th>
              <th className="px-4 py-3 text-left">Checked In</th>
              <th className="px-4 py-3 text-left">Last Ping</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {desks.map((desk, i) => (
              <tr key={desk.desk_number}
                className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}>
                <td className="px-4 py-3 font-bold text-white">{desk.desk_number}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[desk.status]}`}>
                    {desk.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{desk.student_name || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{desk.student_id || '—'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {desk.checked_in_at ? new Date(desk.checked_in_at).toLocaleTimeString() : '—'}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {desk.last_ping_at ? new Date(desk.last_ping_at).toLocaleTimeString() : '—'}
                </td>
                <td className="px-4 py-3">
                  {desk.status !== 'free' && (
                    <button
                      onClick={() => handleReset(desk.desk_number)}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs px-3 py-1 rounded-lg transition-colors"
                    >Reset</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
