import { useState } from 'react';
import api from '../api';

export default function CheckInModal({ deskNumber, onClose, onCheckedIn }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim() || !studentId.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/desks/checkin', {
        desk_number: deskNumber,
        student_name: name,
        student_id: studentId,
      });
      onCheckedIn(deskNumber, studentId, name);
      onClose();
    } catch (e) {
      setError('Desk already taken. Please choose another.');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-80 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">Check In 📚</h2>
        <p className="text-slate-400 text-sm mb-4">Desk <span className="text-white font-bold">{deskNumber}</span></p>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider">Student Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider">Student ID</label>
            <input
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              placeholder="e.g. 221010123"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg py-2 text-sm font-bold transition-colors disabled:opacity-50"
          >{loading ? 'Checking in...' : 'Check In ✓'}</button>
        </div>
      </div>
    </div>
  );
}
