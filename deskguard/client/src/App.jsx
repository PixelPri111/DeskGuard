import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import StudentView from './pages/StudentView';
import AdminView from './pages/AdminView';

const socket = io('http://localhost:5000');

export default function App() {
  const [desks, setDesks] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('desks_updated', (updatedDesks) => {
      setDesks(updatedDesks);
    });

    fetch('/api/desks')
      .then(r => r.json())
      .then(data => setDesks(data));

    return () => {
      socket.off('desks_updated');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white">
        <nav className="bg-slate-800 px-6 py-3 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-xl text-white">DeskGuard</span>
            <span className={`ml-3 text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {connected ? '● Live' : '● Offline'}
            </span>
          </div>
          <div className="flex gap-4">
            <Link to="/" className="text-slate-300 hover:text-white transition-colors">Student View</Link>
            <Link to="/admin" className="text-slate-300 hover:text-white transition-colors">Admin</Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<StudentView desks={desks} />} />
          <Route path="/admin" element={<AdminView desks={desks} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
