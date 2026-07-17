import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function RegisterScreen({ onGoLogin, onShowPrivacy }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-genereer gebruikersnaam uit naam
  const handleNameChange = (value) => {
    setFullName(value);
    const generated = value
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('.');
    setUsername(generated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Vul alle velden in.');
      return;
    }

    if (!username.includes('.')) {
      setError('Gebruikersnaam moet in het formaat voornaam.achternaam zijn.');
      return;
    }

    if (!email.includes('@')) {
      setError('Vul een geldig e-mailadres in.');
      return;
    }

    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    setLoading(true);
    const result = await register(username.trim().toLowerCase(), email.trim().toLowerCase(), password, fullName.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Account aangemaakt</h1>
          <p className="text-slate-500 text-sm mb-6">
            Je kunt nu inloggen met je gebruikersnaam en wachtwoord.
          </p>
          <button
            onClick={onGoLogin}
            className="w-full py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:bg-sky-800 transition"
          >
            Ga naar inloggen
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
          <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Registreren</h1>
          <p className="text-slate-500 mt-1 text-sm">Maak een nieuw account aan</p>
        </div>

        {/* Formulier */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Naam veld (nieuw) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Volledige naam
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Voornaam Achternaam"
              autoCapitalize="words"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          {/* Gebruikersnaam (auto-gegenereerd) */}
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <p className="text-xs text-slate-400 mt-1">Wordt automatisch ingevuld op basis van je naam</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="naam@voorbeeld.nl"
              autoCapitalize="none"
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
              placeholder="Minimaal 8 tekens"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Wachtwoord bevestigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Herhaal je wachtwoord"
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
            {loading ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <div className="text-sm text-slate-500">
            Al een account?{' '}
            <button
              onClick={onGoLogin}
              className="text-sky-600 hover:text-sky-700 font-medium"
            >
              Inloggen
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
