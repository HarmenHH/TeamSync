import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function MembersScreen({ group, onNavigate }) {
  const { user } = useAuth();
  const { members, removeMember, promoteToAdmin, showToast } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  const handleRemove = (member) => {
    if (member.short === user?.short) {
      showToast('Je kunt jezelf niet verwijderen');
      return;
    }
    setConfirmDelete(member);
  };

  const confirmRemove = () => {
    if (confirmDelete) {
      removeMember(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handlePromote = (member) => {
    if (member.role === 'admin') {
      showToast('Dit lid is al admin');
      return;
    }
    promoteToAdmin(member.id);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => onNavigate('admin_dashboard', group)}
            className="text-sky-600 text-sm font-medium"
          >
            ← Terug
          </button>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-xl">
              👥
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Leden beheren</h1>
              <p className="text-xs text-slate-400">{members.length} leden • {group?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto">
        {/* Uitnodigen knop */}
        <button
          onClick={() => setShowInvite(true)}
          className="w-full mb-4 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:bg-sky-800 transition"
        >
          + Lid uitnodigen
        </button>

        {/* Ledenlijst */}
        <div className="space-y-2">
          {members.map((member) => {
            const isMe = member.short === user?.short;
            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      member.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {member.short?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm">
                          {member.name}
                          {isMe && <span className="text-slate-400"> (jij)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          member.role === 'admin'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {member.role === 'admin' ? 'Admin' : 'Lid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acties (niet voor jezelf) */}
                  {!isMe && (
                    <div className="flex items-center gap-1">
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => handlePromote(member)}
                          className="px-2 py-1.5 text-xs text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Maak admin"
                        >
                          👑
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(member)}
                        className="px-2 py-1.5 text-xs text-red-400 hover:bg-red-50 rounded-lg transition"
                        title="Verwijder"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info tekst */}
        <p className="text-xs text-slate-400 text-center mt-6">
          Admins kunnen leden beheren, momenten instellen en groepsinstellingen wijzigen.
        </p>
      </div>

      {/* Bevestigingsmodal verwijderen */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setConfirmDelete(null)}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Lid verwijderen?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Weet je zeker dat je <span className="font-semibold">{confirmDelete.name}</span> wilt
              verwijderen uit de groep? Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition"
              >
                Annuleren
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uitnodigingsmodal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowInvite(false)}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Lid uitnodigen</h3>
            <p className="text-sm text-slate-500 mb-4">
              Deel de onderstaande code met het nieuwe lid. Zij kunnen hiermee de groep joinen na registratie.
            </p>
            <div className="bg-slate-100 rounded-xl p-4 text-center mb-4">
              <p className="text-lg font-mono font-bold text-slate-800 tracking-wider">
                {group?.name?.slice(0, 3).toUpperCase() || 'GRP'}-{Math.random().toString(36).slice(2, 6).toUpperCase()}
              </p>
              <p className="text-xs text-slate-400 mt-1">Geldig voor 7 dagen</p>
            </div>
            <button
              onClick={() => {
                setShowInvite(false);
                showToast('Code gekopieerd');
              }}
              className="w-full py-2.5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition"
            >
              Kopieer code
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="w-full mt-2 py-2.5 text-slate-500 font-medium text-sm"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
