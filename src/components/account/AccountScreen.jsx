import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
} from '../../utils/pushNotifications.js';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function AccountScreen({ onNavigate, onShowPrivacy }) {
  const { user, profile, logout, changePassword, updateProfile } = useAuth();
  const { showToast } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const handleChangePassword = async () => {
    setError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Vul alle velden in.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Nieuw wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nieuwe wachtwoorden komen niet overeen.');
      return;
    }

    setLoading(true);
    const result = await changePassword(oldPassword, newPassword);
    if (result.error) {
      setError(result.error);
    } else {
      showToast('Wachtwoord gewijzigd');
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showToast('Naam mag niet leeg zijn');
      return;
    }
    setProfileSaving(true);
    const result = await updateProfile({ display_name: editName.trim() });
    if (result.error) {
      showToast(result.error);
    } else {
      showToast('Profiel bijgewerkt');
      setEditingProfile(false);
    }
    setProfileSaving(false);
  };

  useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (supported && user) {
      isSubscribed().then(setPushEnabled);
    }
  }, [user]);

  const handleTogglePush = async () => {
    if (!user) return;
    setPushLoading(true);
    if (!pushEnabled) {
      const result = await subscribeToPush(user.id);
      if (result.error) {
        showToast(result.error);
      } else {
        setPushEnabled(true);
        showToast('Notificaties ingeschakeld');
      }
    } else {
      const result = await unsubscribeFromPush(user.id);
      if (result.error) {
        showToast(result.error);
      } else {
        setPushEnabled(false);
        showToast('Notificaties uitgeschakeld');
      }
    }
    setPushLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => onNavigate('groups')}
            className="text-sky-600 text-sm font-medium"
          >
            ← Terug
          </button>
          <h1 className="text-lg font-bold text-slate-800 mt-3">Mijn account</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto space-y-6">
        {/* Profielkaart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-sky-600">
                {profile?.display_name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">{profile?.display_name || 'Gebruiker'}</h2>
              <p className="text-sm text-slate-400">@{profile?.username || 'onbekend'}</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">E-mail</span>
              <span className="text-sm text-slate-800">{user?.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Rol</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                profile?.role === 'admin'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {profile?.role === 'admin' ? 'Admin' : 'Lid'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Gebruikersnaam</span>
              <span className="text-sm text-slate-800 font-mono">{profile?.username || '—'}</span>
            </div>

          </div>
        </div>

        {/* Wachtwoord wijzigen */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Wachtwoord</h3>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm text-sky-600 font-medium"
              >
                Wijzigen
              </button>
            )}
          </div>

          {!showPasswordForm ? (
            <p className="text-sm text-slate-400">••••••••</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Huidig wachtwoord
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nieuw wachtwoord
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimaal 8 tekens"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Bevestig nieuw wachtwoord
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Herhaal nieuw wachtwoord"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setError('');
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition text-sm"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Bezig...' : 'Opslaan'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base">{theme === 'dark' ? '🌙' : '☀️'}</span>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Donkere modus</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Pas weergave aan</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-7 rounded-full transition ${
                theme === 'dark' ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                theme === 'dark' ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
        </div>

        {/* Push notificaties */}
        {pushSupported && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-base">🔔</span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Push notificaties</h3>
                  <p className="text-xs text-slate-400">Herinnering voor momenten</p>
                </div>
              </div>
              <button
                onClick={handleTogglePush}
                disabled={pushLoading}
                className={`relative w-12 h-7 rounded-full transition ${
                  pushEnabled ? 'bg-sky-600' : 'bg-slate-200'
                } disabled:opacity-50`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  pushEnabled ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* Extra opties */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={onShowPrivacy}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🔒</span>
              <span className="text-sm text-slate-700">Privacybeleid</span>
            </div>
            <span className="text-slate-300">›</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-red-50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🚪</span>
              <span className="text-sm text-red-500 font-medium">Uitloggen</span>
            </div>
          </button>
        </div>

        {/* App info */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-300">Aanwezigheid App v1.0</p>
          <p className="text-xs text-slate-300 mt-0.5">Made with ❤️</p>
        </div>
      </div>
    </div>
  );
}
