import { useEffect, useState } from 'react';
import DeskMap from '../components/DeskMap';
import CheckInModal from '../components/CheckInModal';
import StillHereModal from '../components/StillHereModal';

export default function StudentView({ desks }) {
  const [qrDesk, setQrDesk] = useState(null);
  const [showStillHere, setShowStillHere] = useState(false);
  const [myDeskNumber, setMyDeskNumber] = useState(
    localStorage.getItem('myDesk') || null
  );

  const free = desks.filter(d => d.status === 'free').length;
  const occupied = desks.filter(d => d.status === 'occupied').length;
  const away = desks.filter(d => d.status === 'away').length;
  const abandoned = desks.filter(d => d.status === 'abandoned').length;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deskParam = params.get('desk');
    if (deskParam) setQrDesk(deskParam.toUpperCase());
  }, []);

  // Watch for MY desk becoming abandoned → auto show Still Here modal
  useEffect(() => {
    const myDesk = localStorage.getItem('myDesk');
    if (!myDesk) return;
    const myDeskData = desks.find(d => d.desk_number === myDesk);
    if (myDeskData && myDeskData.status === 'abandoned') {
      setShowStillHere(true);
    }
  }, [desks]);

  function handleCheckedIn(deskNum) {
    localStorage.setItem('myDesk', deskNum);
    setMyDeskNumber(deskNum);
    setQrDesk(null);
    window.history.replaceState({}, '', '/');
  }

  const myDeskData = desks.find(d => d.desk_number === myDeskNumber);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          Library Floor — Real Time
        </h1>
        <p className="text-slate-400 text-sm">
          Click a green desk to check in. Updates live.
        </p>
      </div>

      {/* My Desk Status Bar */}
      {myDeskNumber && myDeskData && (
        <div className={`mb-6 rounded-xl p-4 border flex items-center justify-between
          ${myDeskData.status === 'abandoned'
            ? 'bg-red-500/20 border-red-500/50'
            : myDeskData.status === 'away'
            ? 'bg-yellow-500/20 border-yellow-500/50'
            : 'bg-green-500/20 border-green-500/50'
          }`}>
          <div>
            <p className="text-white font-bold text-sm">
              Your Desk: {myDeskNumber}
            </p>
            <p className="text-slate-400 text-xs capitalize">
              Status: {myDeskData.status}
            </p>
          </div>
          {myDeskData.status === 'abandoned' && (
            <button
              onClick={() => setShowStillHere(true)}
              className="bg-yellow-500 text-black text-sm font-bold px-4 py-2 rounded-lg animate-bounce"
            >
              ⚠️ Still Here?
            </button>
          )}
          {myDeskData.status === 'occupied' && (
            <p className="text-green-400 text-xs">✓ Session Active</p>
          )}
          {myDeskData.status === 'away' && (
            <p className="text-yellow-400 text-xs">⏳ Away Timer Running</p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Free', count: free, color: 'green' },
          { label: 'Occupied', count: occupied, color: 'red' },
          { label: 'Away', count: away, color: 'yellow' },
          { label: 'Abandoned', count: abandoned, color: 'gray' },
        ].map(({ label, count, color }) => (
          <div key={label}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold text-${color}-400`}>{count}</div>
            <div className="text-slate-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <DeskMap desks={desks} />

      {qrDesk && desks.length > 0 && (
        <CheckInModal
          deskNumber={qrDesk}
          onClose={() => {
            setQrDesk(null);
            window.history.replaceState({}, '', '/');
          }}
          onCheckedIn={handleCheckedIn}
        />
      )}

      {showStillHere && myDeskNumber && (
        <StillHereModal
          deskNumber={myDeskNumber}
          onClose={() => setShowStillHere(false)}
        />
      )}
    </div>
  );
}
