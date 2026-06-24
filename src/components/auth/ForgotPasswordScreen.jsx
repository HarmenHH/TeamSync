import React, { useState } from 'react';

export default function ForgotPasswordScreen({ onGoLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Vul je gebruikersnaam in.');
      return;
    }

    if (!username.includes('.')) {
      setError('Gebruikersnaam moet in het formaat voornaam.achternaam zijn.');
      return;
    }

    setLoading(true);

    // Mock: later wordt dit een insert in password_reset_requests tabel
    await new Promise(resolve => setTimeout(resolve, 800));

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📨</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Verzoek verstuurd</h1>
          <p className="text-slate-500 text-sm mb-2">
            De admin heeft een melding ontvangen om je wachtwoord te resetten.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            Neem contact op met je admin als het te lang duurt.
          </p>
          <button
            onClick={onGoLogin}
            className="w-full py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:bg-sky-800 transition"
          >
            Terug naar inloggen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Wachtwoord vergeten</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Vul je gebruikersnaam in. De admin ontvangt een melding om je wachtwoord te resetten.
          </p>
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

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Versturen...' : 'Reset aanvragen'}
          </button>
        </form>

        {/* Terug link */}
        <div className="mt-6 text-center">
          <button
            onClick={onGoLogin}
            className="text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            ← Terug naar inloggen
          </button>
        </div>
      </div>
    </div>
  );
}
