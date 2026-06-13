import axios from 'axios';

const STATUS_COLORS = {
  free: 'bg-green-500/20 text-green-400',
  occupied: 'bg-red-500/20 text-red-400',
  away: 'bg-yellow-500/20 text-yellow-400',
  abandoned: 'bg-gray-500/20 text-gray-400',
};

export default function AdminView({ desks }) {
  async function handleReset(deskNumber) {
    await axios.post('/api/admin/reset', { desk_number: deskNumber });
  }

  const stats = {
    total: desks.length,
    free: desks.filter(d => d.status === 'free').length,
    occupied: desks.filter(d => d.status === 'occupied').length,
    away: desks.filter(d => d.status === 'away').length,
    abandoned: desks.filter(d => d.status === 'abandoned').length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Librarian Dashboard 🧑💼</h1>
        <p className="text-slate-400 text-sm">Live view of all desks. Reset any desk manually.</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', count: stats.total, color: 'blue' },
          { label: 'Free', count: stats.free, color: 'green' },
          { label: 'Occupied', count: stats.occupied, color: 'red' },
          { label: 'Away', count: stats.away, color: 'yellow' },
          { label: 'Abandoned', count: stats.abandoned, color: 'gray' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold text-${color}-400`}>{count}</div>
            <div className="text-slate-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
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
