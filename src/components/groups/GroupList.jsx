import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function GroupList({ onNavigate, onShowPrivacy }) {
  const { user, profile, logout, isAdmin } = useAuth();
  const { groups, joinGroupByCode, showToast, isGroupAdmin, joinRequests } = useApp();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleGroupClick = (group) => {
    if (group.type === 'samen') {
      onNavigate('samen_detail', group);
    } else if (group.type === 'weekrooster') {
      onNavigate('werk_detail', group);
    }
  };

  const handleAdminClick = (e, group) => {
    e.stopPropagation();
    onNavigate('admin_dashboard', group);
  };

  const handleJoin = async () => {
    setJoinError('');
    if (!joinCode.trim()) {
      setJoinError('Vul een code in.');
      return;
    }
    setJoining(true);
    try {
      const group = await joinGroupByCode(joinCode);
      setShowJoinModal(false);
      setJoinCode('');
      showToast(`Verzoek verzonden voor ${group.name}. De admin keurt het goed.`);
    } catch (err) {
      setJoinError(err.message || 'Verzoek mislukt');
    }
    setJoining(false);
  };

  const myPendingRequests = joinRequests.filter(
    r => r.user_id === user?.id && r.status === 'pending'
  );
  const myDeclinedRequests = joinRequests.filter(
    r => r.user_id === user?.id && r.status === 'declined'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Hoi {profile?.display_name || 'daar'} 👋
            </h1>
            <p className="text-xs text-slate-400">Kies een groep</p>
          </div>
          <button
            onClick={() => onNavigate('account')}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition"
          >
            <span className="text-lg">👤</span>
          </button>
        </div>
      </div>

      {/* Groepen lijst */}
      <div className="px-6 py-6 max-w-lg mx-auto">
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => handleGroupClick(group)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-2xl">
                    {group.emoji || '📋'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{group.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {group.type === 'samen' ? 'Activiteit' : 'Weekrooster'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isGroupAdmin(group.id) && (
                    <button
                      onClick={(e) => handleAdminClick(e, group)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition"
                    >
                      <span className="text-base">⚙️</span>
                    </button>
                  )}
                  <span className="text-slate-300 text-lg">›</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Openstaande verzoeken */}
        {myPendingRequests.length > 0 && (
          <div className="mt-6 bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <h3 className="font-semibold text-amber-800 text-sm mb-2">
              Openstaande verzoeken
            </h3>
            <div className="space-y-2">
              {myPendingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-2 text-sm text-amber-700">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                  <span>Verzoek in afwachting</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              De groepsadmin keurt je verzoek goed.
            </p>
          </div>
        )}

        {/* Afgekeurde verzoeken */}
        {myDeclinedRequests.length > 0 && (
          <div className="mt-3 bg-red-50 rounded-2xl p-4 border border-red-200">
            <h3 className="font-semibold text-red-800 text-sm mb-2">
              Afgekeurd
            </h3>
            {myDeclinedRequests.map((req) => (
              <p key={req.id} className="text-sm text-red-700">
                Je verzoek is afgekeurd door de admin.
              </p>
            ))}
          </div>
        )}

        {/* Lid worden knop */}
        <button
          onClick={() => setShowJoinModal(true)}
          className="w-full mt-4 py-3 border-2 border-dashed border-sky-200 rounded-2xl text-sky-500 text-sm font-medium hover:border-sky-400 hover:text-sky-600 transition"
        >
          + Lid worden met code
        </button>

        {/* Nieuwe groep knop (alle gebruikers) */}
        <button
          onClick={() => onNavigate('admin_dashboard', null)}
          className="w-full mt-3 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium hover:border-sky-300 hover:text-sky-500 transition"
        >
          + Nieuwe groep
        </button>

        {/* Uitlog + privacy */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={onShowPrivacy}
            className="text-xs text-slate-400 hover:text-slate-500"
          >
            Privacy
          </button>
          <button
            onClick={logout}
            className="text-xs text-red-400 hover:text-red-500 font-medium"
          >
            Uitloggen
          </button>
        </div>
      </div>

      {/* Lid worden modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => { setShowJoinModal(false); setJoinError(''); setJoinCode(''); }}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Lid worden</h3>
            <p className="text-sm text-slate-500 mb-4">
              Vul de uitnodigingscode in die je van de groepsadmin hebt gekregen.
              Je verzoek moet daarna goedgekeurd worden.
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
              placeholder="ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-center text-2xl font-bold tracking-[0.3em] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition mb-3"
            />
            {joinError && (
              <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg mb-3">{joinError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowJoinModal(false); setJoinError(''); setJoinCode(''); }}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition"
              >
                Annuleren
              </button>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 py-2.5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition disabled:opacity-50"
              >
                {joining ? '...' : 'Verzoek versturen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
