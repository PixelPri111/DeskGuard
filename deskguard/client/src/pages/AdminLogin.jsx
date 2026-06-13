import { useState } from 'react';

const ADMIN_PASSWORD = 'library123';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onLogin();
      } else {
        setError('Incorrect password. Try again.');
        setLoading(false);
      }
    }, 500);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-96 shadow-2xl">

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🧑💼</div>
          <h1 className="text-2xl font-bold text-white">Librarian Login</h1>
          <p className="text-slate-400 text-sm mt-1">
            Access the admin dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400
            text-sm rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full mt-1 bg-slate-700 border border-slate-600
                rounded-lg px-3 py-2 text-white text-sm focus:outline-none
                focus:border-blue-500"
              placeholder="Enter password"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white
              rounded-lg py-2.5 text-sm font-bold transition-colors
              disabled:opacity-50 mt-2"
          >
            {loading ? 'Logging in...' : 'Login to Dashboard →'}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700 text-center">
          <p className="text-slate-600 text-xs">
            Demo password: <span className="text-slate-400 font-mono">library123</span>
          </p>
        </div>

      </div>
    </div>
  );
}
