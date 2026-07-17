import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginScreen({ onGoRegister, onGoForgot, onShowPrivacy }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vertaal Supabase errors naar Nederlandse meldingen
  const getErrorMessage = (error) => {
    const msg = error?.toLowerCase() || '';
    if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
      return 'Gebruikersnaam of wachtwoord onjuist';
    }
    if (msg.includes('email not confirmed')) {
      return 'Je account is nog niet bevestigd. Check je e-mail.';
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
      return 'Te veel pogingen. Probeer het over een paar minuten opnieuw.';
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed')) {
      return 'Server niet bereikbaar. Controleer je internetverbinding.';
    }
    if (msg.includes('user not found')) {
      return 'Geen account gevonden met deze gegevens';
    }
    // Fallback: toon originele fout
    return error || 'Er ging iets mis. Probeer het opnieuw.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validatie
    if (!username.trim() && !password) {
      setError('Vul je gebruikersnaam en wachtwoord in');
      return;
    }
    if (!username.trim()) {
      setError('Vul je gebruikersnaam in');
      return;
    }
    if (!password) {
      setError('Vul je wachtwoord in');
      return;
    }

    setLoading(true);

    try {
      const result = await login(username.trim(), password);
      if (result.error) {
        setError(getErrorMessage(result.error));
        setLoading(false);
      }
    } catch (err) {
      setError('Server niet bereikbaar. Probeer het later opnieuw.');
      setLoading(false);
    }
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
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="voornaam.achternaam"
              autoCapitalize="none"
              autoCorrect="off"
              className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition ${
                error && !username.trim() ? 'border-red-300' : 'border-slate-200'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition ${
                error && !password ? 'border-red-300' : 'border-slate-200'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:bg-sky-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Bezig met inloggen...
              </span>
            ) : 'Inloggen'}
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
