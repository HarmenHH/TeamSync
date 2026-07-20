import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminDashboard({ group, onNavigate }) {
  const { members, moments, addGroup, getPendingGroupJoinRequests, approveJoinRequest, declineJoinRequest } = useApp();
  const { isAdmin } = useAuth();
  const [showNewGroup, setShowNewGroup] = useState(!group);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('samen');
  const [newEmoji, setNewEmoji] = useState('📋');
  const [creating, setCreating] = useState(false);
  const [reviewing, setReviewing] = useState(null);

  const handleCreateGroup = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await addGroup({
        name: newName.trim(),
        type: newType,
        emoji: newEmoji,
        joinMode: 'admin',
        actionLabel: 'Doe mee',
        declineLabel: 'Niet vanavond',
      });
      onNavigate('groups');
    } catch (err) {
      alert('Groep aanmaken mislukt: ' + err.message);
    }
    setCreating(false);
  };

  // Nieuwe groep formulier
  if (showNewGroup && !group) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => onNavigate('groups')}
              className="text-sky-600 text-sm font-medium"
            >
              ← Terug
            </button>
            <h1 className="text-lg font-bold text-slate-800 mt-3">Nieuwe groep</h1>
          </div>
        </div>

        <div className="px-6 py-6 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Groepsnaam
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Bijv. Team Rooster"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewType('samen')}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition ${
                    newType === 'samen'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  🎯 Activiteit
                </button>
                <button
                  onClick={() => setNewType('weekrooster')}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition ${
                    newType === 'weekrooster'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  📅 Weekrooster
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Emoji
              </label>
              <div className="flex gap-2 flex-wrap">
                {['📋', '🚴', '⚽', '💼', '🎯', '🏃', '🎾', '🏊', '🎵', '📚'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewEmoji(emoji)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                      newEmoji === emoji
                        ? 'bg-sky-100 border-2 border-sky-500'
                        : 'bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={!newName.trim() || creating}
              className="w-full py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:bg-sky-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Aanmaken...' : 'Groep aanmaken'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bestaande groep beheren
  const pendingRequests = group ? getPendingGroupJoinRequests(group.id) : [];

  const handleApprove = async (reqId) => {
    setReviewing(reqId);
    try {
      await approveJoinRequest(reqId);
    } catch (err) {
      alert('Goedkeuren mislukt: ' + err.message);
    }
    setReviewing(null);
  };

  const handleDecline = async (reqId) => {
    setReviewing(reqId);
    try {
      await declineJoinRequest(reqId);
    } catch (err) {
      alert('Afwijzen mislukt: ' + err.message);
    }
    setReviewing(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => {
              if (group?.type === 'samen') onNavigate('samen_detail', group);
              else if (group?.type === 'weekrooster') onNavigate('werk_detail', group);
              else onNavigate('groups');
            }}
            className="text-sky-600 text-sm font-medium"
          >
            ← Terug
          </button>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-xl">
              {group?.emoji || '⚙️'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Beheer</h1>
              <p className="text-xs text-slate-400">{group?.name || 'Groep'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-6 py-4 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
            <p className="text-2xl font-bold text-slate-800">{members.length}</p>
            <p className="text-xs text-slate-400">Leden</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
            <p className="text-2xl font-bold text-slate-800">{moments.length}</p>
            <p className="text-xs text-slate-400">Momenten</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
            <p className="text-2xl font-bold text-slate-800">
              {group?.type === 'samen' ? '🎯' : '📅'}
            </p>
            <p className="text-xs text-slate-400">{group?.type === 'samen' ? 'Activiteit' : 'Rooster'}</p>
          </div>
        </div>
      </div>

      {/* Pending join requests */}
      {pendingRequests.length > 0 && (
        <div className="px-6 max-w-lg mx-auto mt-4">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <h3 className="font-semibold text-amber-800 text-sm mb-3">
              Toetredingsverzoeken ({pendingRequests.length})
            </h3>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">
                      {req.profiles?.display_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {req.profiles?.display_name || 'Onbekend'}
                      </p>
                      <p className="text-xs text-slate-400">@{req.profiles?.username || '—'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={reviewing === req.id}
                      className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                    >
                      Goedkeuren
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      disabled={reviewing === req.id}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                    >
                      Afwijzen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu items */}
      <div className="px-6 max-w-lg mx-auto">
        <div className="space-y-3">
          <button
            onClick={() => onNavigate('members', group)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-lg">
                👥
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800 text-sm">Leden beheren</p>
                <p className="text-xs text-slate-400">Toevoegen, verwijderen, rollen</p>
              </div>
            </div>
            <span className="text-slate-300">›</span>
          </button>

          <button
            onClick={() => onNavigate('schedule', group)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-lg">
                🕐
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800 text-sm">Momenten & schema</p>
                <p className="text-xs text-slate-400">Tijden, meldingen, herhaling</p>
              </div>
            </div>
            <span className="text-slate-300">›</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('reset_requests')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-lg">
                  🔑
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 text-sm">Reset verzoeken</p>
                  <p className="text-xs text-slate-400">Wachtwoord reset aanvragen</p>
                </div>
              </div>
              <span className="text-slate-300">›</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('settings', group)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-lg">
                ⚙️
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800 text-sm">Groepsinstellingen</p>
                <p className="text-xs text-slate-400">Naam, type, verwijderen</p>
              </div>
            </div>
            <span className="text-slate-300">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
