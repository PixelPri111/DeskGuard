import DeskTileWithBooking from './DeskTileWithBooking';

export default function DeskMap({ desks, onBooking }) {
  const rows = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <span className="text-slate-400 text-sm font-medium uppercase tracking-widest">Library Map</span>
        <div className="flex gap-4 text-xs text-slate-400">
          <span>🟢 Free</span>
          <span>🔴 Occupied</span>
          <span>🟡 Away</span>
          <span>⚫ Abandoned</span>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map(row => (
          <div key={row} className="flex items-center gap-3">
            <span className="text-slate-500 font-bold w-6 text-sm">Row {row}</span>
            <div className="flex gap-3 flex-1 flex-wrap">
              {desks
                .filter(d => d.desk_number.startsWith(row))
                .map(desk => (
                  <DeskTileWithBooking 
                    key={desk.desk_number} 
                    desk={desk}
                    onBooking={onBooking}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700 text-center text-slate-500 text-xs">
        📖 Library Main Hall — Ground Floor
      </div>
    </div>
  );
}
