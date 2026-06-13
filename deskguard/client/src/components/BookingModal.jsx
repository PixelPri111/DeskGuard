import { useState, useEffect } from 'react';
import axios from 'axios';

export default function BookingModal({ deskNumber, studentId, studentName, onClose, onBookingSuccess }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [deskNumber]);

  async function fetchSlots() {
    try {
      const res = await axios.get(`/api/bookings/slots/${deskNumber}`);
      setSlots(res.data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }

  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);

    try {
      await axios.post('/api/bookings/create', {
        desk_number: deskNumber,
        student_id: studentId,
        student_name: studentName,
        booking_start: selectedSlot.start,
        booking_end: selectedSlot.end,
      });
      onBookingSuccess();
      onClose();
    } catch (e) {
      alert('Booking failed');
      setBooking(false);
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-96 shadow-2xl max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-1">Book Desk 📅</h2>
        <p className="text-slate-400 text-sm mb-4">
          Desk <span className="text-white font-bold">{deskNumber}</span> — Select a 2-hour slot
        </p>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="text-slate-400 text-sm">No slots available</p>
        ) : (
          <div className="space-y-2 mb-4">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setSelectedSlot(slot)}
                disabled={!slot.available}
                className={`w-full p-3 rounded-lg text-sm transition-colors text-left ${
                  slot.available
                    ? selectedSlot === slot
                      ? 'bg-green-500/30 border border-green-500/50 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    : 'bg-red-500/10 text-red-400 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-mono">{formatTime(slot.start)}</span>
                  <span className="text-xs">
                    {slot.available ? '✓ Available' : '✗ Booked'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBook}
            disabled={!selectedSlot || booking}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg py-2 text-sm font-bold transition-colors disabled:opacity-50"
          >
            {booking ? 'Booking...' : 'Book Slot'}
          </button>
        </div>
      </div>
    </div>
  );
}
