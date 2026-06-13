import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import StudentView from './pages/StudentView';
import AdminView from './pages/AdminView';
import AdminLogin from './pages/AdminLogin';

// const socket = io('http://localhost:5000');
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

export default function App() {
  const [desks, setDesks] = useState([]);
  const [connected, setConnected] = useState(false);
  const [adminAuth, setAdminAuth] = useState(
    localStorage.getItem('adminAuth') === 'true'
  );

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('desks_updated', (updatedDesks) => {
      setDesks(updatedDesks);
    });

    // fetch('/api/desks')
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/desks`)
      .then(r => r.json())
      .then(data => setDesks(data));

    return () => {
      socket.off('desks_updated');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  function handleAdminLogin() {
    localStorage.setItem('adminAuth', 'true');
    setAdminAuth(true);
  }

  function handleAdminLogout() {
    localStorage.removeItem('adminAuth');
    setAdminAuth(false);
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white">

        <nav className="bg-slate-800 px-6 py-3 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-xl text-white">DeskGuard</span>
            <span className={`ml-3 text-xs px-2 py-1 rounded-full ${connected
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'}`}>
              {connected ? '● Live' : '● Offline'}
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/"
              className="text-slate-300 hover:text-white transition-colors text-sm">
              Student View
            </Link>
            {adminAuth ? (
              <>
                <Link to="/admin"
                  className="text-slate-300 hover:text-white transition-colors text-sm">
                  Dashboard
                </Link>
                <button
                  onClick={handleAdminLogout}
                  className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/admin/login"
                className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-500/30">
                Admin Login
              </Link>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<StudentView desks={desks} />} />
          <Route path="/admin/login"
            element={adminAuth
              ? <Navigate to="/admin" />
              : <AdminLogin onLogin={handleAdminLogin} />}
          />
          <Route path="/admin"
            element={adminAuth
              ? <AdminView desks={desks} onLogout={handleAdminLogout} />
              : <Navigate to="/admin/login" />}
          />
        </Routes>

      </div>
    </BrowserRouter>
  );
}
