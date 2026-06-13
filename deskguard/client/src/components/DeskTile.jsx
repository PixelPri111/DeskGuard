import { useState, useEffect } from 'react';
import CheckInModal from './CheckInModal';
import axios from 'axios';

const STATUS_STYLES = {
  free: 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30 cursor-pointer',
  occupied: 'bg-red-500/20 border-red-500/50',
  away: 'bg-yellow-500/20 border-yellow-500/50',
  abandoned: 'bg-gray-500/20 border-gray-500/50',
};

const STATUS_ICONS = {
  free: '🟢',
  occupied: '🔴',
  away: '🟡',
  abandoned: '⚫',
};

export default function DeskTile({ desk }) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [myDeskNumber, setMyDeskNumber] = useState(
    localStorage.getItem('myDesk') || null
  );
  const [awayTimeLeft, setAwayTimeLeft] = useState(null);

  const isMyDesk = myDeskNumber === desk.desk_number;

  // Away countdown timer
  useEffect(() => {
    if (desk.status !== 'away' || !desk.away_since) {
      setAwayTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(desk.away_since).getTime();
      const remaining = Math.max(0, 2 * 60 * 1000 - elapsed); // 2 min in demo
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setAwayTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [desk.status, desk.away_since]);

  function handleClick() {
    if (desk.status === 'free') setShowCheckIn(true);
  }

  async function handleAway() {
    await axios.post('/api/desks/away', { desk_number: desk.desk_number });
  }

  async function handleBack() {
    await axios.post('/api/desks/back', { desk_number: desk.desk_number });
  }

  async function handleRelease() {
    await axios.post('/api/desks/release', { desk_number: desk.desk_number });
    localStorage.removeItem('myDesk');
    setMyDeskNumber(null);
  }

  function handleCheckedIn(deskNum) {
    localStorage.setItem('myDesk', deskNum);
    setMyDeskNumber(deskNum);
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`
          relative border-2 rounded-xl p-3 w-28 h-32 flex flex-col justify-between
          transition-all duration-500 select-none
          ${STATUS_STYLES[desk.status]}
        `}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <span className="font-bold text-white text-sm">{desk.desk_number}</span>
          <span className="text-base">{STATUS_ICONS[desk.status]}</span>
        </div>

        {/* Student name */}
        <div>
          {desk.student_name && (
            <p className="text-xs text-slate-300 truncate">{desk.student_name}</p>
          )}
          <p className="text-xs text-slate-500 capitalize">{desk.status}</p>
          {awayTimeLeft && (
            <p className="text-xs text-yellow-400 font-mono">{awayTimeLeft}</p>
          )}
        </div>

        {/* Away button for my occupied desk */}
        {isMyDesk && desk.status === 'occupied' && (
          <div className="absolute -top-3 -right-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleAway(); }}
              className="bg-yellow-500 text-xs text-black px-1.5 py-0.5 rounded-full font-bold hover:bg-yellow-400"
            >Away</button>
          </div>
        )}

        {/* Back button for my away desk */}
        {isMyDesk && desk.status === 'away' && (
          <div className="absolute -top-3 -right-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleBack(); }}
              className="bg-green-500 text-xs text-black px-1.5 py-0.5 rounded-full font-bold hover:bg-green-400"
            >Back</button>
          </div>
        )}

        {/* Release button */}
        {isMyDesk && (desk.status === 'occupied' || desk.status === 'away') && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRelease(); }}
            className="absolute bottom-1 right-1 text-xs text-red-400 hover:text-red-300"
          >✕</button>
        )}
      </div>

      {showCheckIn && (
        <CheckInModal
          deskNumber={desk.desk_number}
          onClose={() => setShowCheckIn(false)}
          onCheckedIn={handleCheckedIn}
        />
      )}
    </>
  );
}
