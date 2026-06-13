import axios from 'axios';

export default function StillHereModal({ deskNumber, onClose }) {
  async function handleStillHere() {
    await axios.post('/api/desks/ping', { desk_number: deskNumber });
    onClose();
  }

  async function handleRelease() {
    await axios.post('/api/desks/release', { desk_number: deskNumber });
    localStorage.removeItem('myDesk');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-yellow-500/50 rounded-2xl p-6 w-80 shadow-2xl">
        <div className="text-4xl text-center mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-white text-center mb-1">Still Here?</h2>
        <p className="text-slate-400 text-sm text-center mb-2">
          Desk <span className="text-white font-bold">{deskNumber}</span> has been inactive.
        </p>
        <p className="text-yellow-400 text-xs text-center mb-5">
          If you don't respond, your desk will be freed for others.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleRelease}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors"
          >Release Desk</button>
          <button
            onClick={handleStillHere}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg py-2 text-sm font-bold transition-colors"
          >Yes, I'm Here! ✓</button>
        </div>
      </div>
    </div>
  );
}
