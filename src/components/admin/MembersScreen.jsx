import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';

export default function MembersScreen({ group, onNavigate }) {
  const { user } = useAuth();
  const { members, addMember, removeMember } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState('');
  const [adding, setAdding] = useState(false);

  // Filter leden voor deze groep
  const groupMembers = members.filter(m => m.group_id === group?.id);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Zoek gebruikers op username
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, role')
      .ilike('username', `%${searchQuery.trim()}%`)
      .limit(10);

    if (error) {
      showToast('Zoeken mislukt');
    } else {
      // Filter out users die al lid zijn
      const existingIds = groupMembers.map(m => m.user_id);
      const filtered = (data || []).filter(p => !existingIds.includes(p.id));
      setSearchResults(filtered);
      if (filtered.length === 0) {
        showToast('Geen nieuwe gebruikers gevonden');
      }
    }
    setSearching(false);
  };

  // Voeg lid toe aan groep
  const handleAddMember = async (profile) => {
    setAdding(true);
    try {
      await addMember(group.id, profile.id);
      setSearchResults(prev => prev.filter(p => p.id !== profile.id));
      showToast(`${profile.display_name || profile.username} toegevoegd ✓`);
    } catch (error) {
      showToast('Toevoegen mislukt: ' + error.message);
    }
    setAdding(false);
  };

  // Verwijder lid uit groep
  const handleRemove = (member) => {
    if (member.user_id === user?.id) {
      showToast('Je kunt jezelf niet verwijderen');
      return;
    }
    setConfirmDelete(member);
  };

  const confirmRemove = async () => {
    if (confirmDelete) {
      try {
        await removeMember(group.id, confirmDelete.user_id);
        setConfirmDelete(null);
        showToast('Lid verwijderd');
      } catch (error) {
        showToast('Verwijderen mislukt');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm shadow-lg">
          {toast}
        </div>
      )}

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
              <p className="text-xs text-slate-400">{groupMembers.length} leden • {group?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto">

        {/* Zoek & voeg toe */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Lid toevoegen</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Zoek op gebruikersnaam..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2.5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition disabled:opacity-50 text-sm"
            >
              {searching ? '...' : 'Zoek'}
            </button>
          </div>

          {/* Zoekresultaten */}
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {profile.display_name || profile.username}
                    </p>
                    <p className="text-xs text-slate-400">@{profile.username}</p>
                  </div>
                  <button
                    onClick={() => handleAddMember(profile)}
                    disabled={adding}
                    className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    + Toevoegen
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Huidige leden */}
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Huidige leden</h3>
        <div className="space-y-2">
          {groupMembers.map((member) => {
            const profile = member.profiles;
            if (!profile) return null;
            const isMe = profile.id === user?.id;
            const displayName = profile.display_name || profile.username || 'Onbekend';

            return (
              <div
                key={member.user_id || profile.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      profile.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {displayName}
                        {isMe && <span className="text-slate-400"> (jij)</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">@{profile.username}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          profile.role === 'admin'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {profile.role === 'admin' ? 'Admin' : 'Lid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verwijder knop (niet voor jezelf) */}
                  {!isMe && (
                    <button
                      onClick={() => handleRemove(member)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 transition"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {groupMembers.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👻</div>
              <p className="text-slate-400 text-sm">Nog geen leden in deze groep.</p>
            </div>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-slate-400 text-center mt-6">
          Zoek op gebruikersnaam om leden toe te voegen. Leden moeten eerst een account aanmaken via het registratiescherm.
        </p>
      </div>

      {/* Bevestigingsmodal verwijderen */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setConfirmDelete(null)}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Lid verwijderen?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Weet je zeker dat je <span className="font-semibold">{confirmDelete.profiles?.display_name || confirmDelete.profiles?.username}</span> wilt
              verwijderen uit de groep?
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
    </div>
  );
}
