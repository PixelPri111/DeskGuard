import DeskMap from '../components/DeskMap';

export default function StudentView({ desks }) {
  const free = desks.filter(d => d.status === 'free').length;
  const occupied = desks.filter(d => d.status === 'occupied').length;
  const away = desks.filter(d => d.status === 'away').length;
  const abandoned = desks.filter(d => d.status === 'abandoned').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Library Floor — Real Time</h1>
        <p className="text-slate-400 text-sm">Click a green desk to check in. Updates are live.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Free', count: free, color: 'green' },
          { label: 'Occupied', count: occupied, color: 'red' },
          { label: 'Away', count: away, color: 'yellow' },
          { label: 'Abandoned', count: abandoned, color: 'gray' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold text-${color}-400`}>{count}</div>
            <div className="text-slate-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <DeskMap desks={desks} />
    </div>
  );
}
