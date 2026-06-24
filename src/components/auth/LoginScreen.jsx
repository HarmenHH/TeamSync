import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginScreen({ onGoRegister, onGoForgot, onShowPrivacy }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username.trim(), password);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Aanwezigheid</h1>
          <p className="text-slate-500 mt-1 text-sm">Log in om verder te gaan</p>
        </div>

        {/* Formulier */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gebruikersnaam
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="voornaam.achternaam"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:bg-sky-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-3 text-center">
          <button
            onClick={onGoForgot}
            className="text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            Wachtwoord vergeten?
          </button>

          <div className="text-sm text-slate-500">
            Nog geen account?{' '}
            <button
              onClick={onGoRegister}
              className="text-sky-600 hover:text-sky-700 font-medium"
            >
              Registreer
            </button>
          </div>
        </div>

        {/* Privacy link */}
        <div className="mt-8 text-center">
          <button
            onClick={onShowPrivacy}
            className="text-xs text-slate-400 hover:text-slate-500"
          >
            Privacybeleid
          </button>
        </div>
      </div>
    </div>
  );
}
