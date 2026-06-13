import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyBookings({ studentId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [studentId]);

  async function fetchBookings() {
    try {
      const res = await axios.get(`/api/bookings/my-bookings/${studentId}`);
      setBookings(res.data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    try {
      await axios.post('/api/bookings/cancel', { booking_id: bookingId });
      fetchBookings();
    } catch (e) {
      alert('Cancel failed');
    }
  }

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const upcomingBookings = bookings.filter(b => 
    new Date(b.booking_start) > new Date() && b.status === 'pending'
  );

  const pastBookings = bookings.filter(b => 
    b.status === 'completed' || new Date(b.booking_end) < new Date()
  );

  if (!studentId) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <p className="text-slate-400 text-sm">Check in to view your bookings</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
      <h3 className="text-lg font-bold text-white mb-4">My Bookings 📅</h3>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : upcomingBookings.length === 0 ? (
        <p className="text-slate-400 text-sm">No upcoming bookings</p>
      ) : (
        <div className="space-y-2 mb-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Upcoming</p>
          {upcomingBookings.map(booking => (
            <div key={booking.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-bold text-sm">{booking.desk_number}</p>
                  <p className="text-slate-400 text-xs">
                    {formatTime(booking.booking_start)} — {new Date(booking.booking_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  2h
                </span>
              </div>
              <button
                onClick={() => handleCancel(booking.id)}
                className="w-full text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 py-1 rounded transition-colors"
              >
                Cancel Booking
              </button>
            </div>
          ))}
        </div>
      )}

      {pastBookings.length > 0 && (
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Past Bookings</p>
          <div className="space-y-1">
            {pastBookings.slice(0, 3).map(booking => (
              <div key={booking.id} className="bg-slate-700/30 rounded p-2 text-xs text-slate-400">
                <span className="font-mono">{booking.desk_number}</span> — {formatTime(booking.booking_start)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
