import { useState, useEffect } from 'react';
import api from '../api';

export default function BookingModal({ deskNumber, studentId, studentName, onClose, onBookingSuccess }) {
  const [step, setStep] = useState('details'); // 'details' | 'slots'
  const [formName, setFormName] = useState(studentName || '');
  const [formStudentId, setFormStudentId] = useState(studentId || '');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 'slots') {
      fetchSlots();
    }
  }, [step, deskNumber]);

  async function fetchSlots() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/bookings/slots/${deskNumber}`, {
        params: { studentId: formStudentId }
      });
      setSlots(res.data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }

  async function handleBook() {
    if (!selectedSlot) return;
    if (!formName.trim() || !formStudentId.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setBooking(true);
    setError('');

    try {
      await api.post('/api/bookings/create', {
        desk_number: deskNumber,
        student_id: formStudentId,
        student_name: formName,
        booking_start: selectedSlot.start,
        booking_end: selectedSlot.end,
      });
      onBookingSuccess();
      onClose();
    } catch (e) {
      if (e.response && e.response.status === 409) {
        setError(e.response.data.error || 'Conflict detected');
      } else {
        setError('Booking failed');
      }
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
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-96 shadow-2xl max-h-[32rem] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {step === 'details' ? (
          <>
            <h2 className="text-xl font-bold text-white mb-1">Enter Details 📝</h2>
            <p className="text-slate-400 text-sm mb-4">
              Desk <span className="text-white font-bold">{deskNumber}</span> — Enter your details to view available slots
            </p>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Full Name</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Student ID</label>
                <input
                  value={formStudentId}
                  onChange={e => setFormStudentId(e.target.value)}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="e.g. 221010123"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setError('');
                  setStep('slots');
                }}
                disabled={!formName.trim() || !formStudentId.trim()}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg py-2 text-sm font-bold transition-colors disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-1">Book Desk 📅</h2>
            <p className="text-slate-400 text-sm mb-4">
              Desk <span className="text-white font-bold">{deskNumber}</span> — Select a 2-hour slot
            </p>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

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

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setStep('details');
                  setError('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleBook}
                disabled={!selectedSlot || booking}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg py-2 text-sm font-bold transition-colors disabled:opacity-50"
              >
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
