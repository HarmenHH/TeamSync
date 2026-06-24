import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function SettingsScreen({ group, onNavigate }) {
  const { groups, setGroups, deleteGroup, showToast } = useApp();

  const [name, setName] = useState(group?.name || '');
  const [emoji, setEmoji] = useState(group?.emoji || '📋');
  const [actionLabel, setActionLabel] = useState(group?.actionLabel || 'Doe mee');
  const [declineLabel, setDeclineLabel] = useState(group?.declineLabel || 'Niet vanavond');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Groepsnaam mag niet leeg zijn');
      return;
    }
    setGroups(prev => prev.map(g =>
      g.id === group?.id
        ? { ...g, name: name.trim(), emoji, actionLabel: actionLabel.trim(), declineLabel: declineLabel.trim() }
        : g
    ));
    showToast('Instellingen opgeslagen');
  };

  const handleDelete = () => {
    if (deleteText !== group?.name) {
      showToast('Typ de groepsnaam exact over');
      return;
    }
    deleteGroup(group.id);
    onNavigate('groups');
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
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Groepsinstellingen</h1>
              <p className="text-xs text-slate-400">{group?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto space-y-6">
        {/* Basisinstellingen */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-semibold text-slate-800">Algemeen</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Groepsnaam
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Naam van de groep"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Emoji
            </label>
            <div className="flex gap-2 flex-wrap">
              {['📋', '🚴', '⚽', '💼', '🎯', '🏃', '🎾', '🏊', '🎵', '📚', '🏒', '🎳'].map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                    emoji === e
                      ? 'bg-sky-100 border-2 border-sky-500'
                      : 'bg-slate-100 border-2 border-transparent'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <div className="flex gap-2">
              <div className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 text-center ${
                group?.type === 'samen'
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 text-slate-400'
              }`}>
                🎯 Activiteit
              </div>
              <div className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 text-center ${
                group?.type === 'weekrooster'
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 text-slate-400'
              }`}>
                📅 Weekrooster
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Type kan niet gewijzigd worden na aanmaken.
            </p>
          </div>
        </div>

        {/* Samen-specifieke instellingen */}
        {group?.type === 'samen' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-semibold text-slate-800">Knoppen tekst</h3>
            <p className="text-xs text-slate-400">
              Pas de tekst aan op de actieknoppen die leden zien.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Positieve actie
              </label>
              <input
                type="text"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                placeholder="Bijv. Rijd mee, Doe mee, Ben erbij"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Negatieve actie
              </label>
              <input
                type="text"
                value={declineLabel}
                onChange={(e) => setDeclineLabel(e.target.value)}
                placeholder="Bijv. Niet vanavond, Kan niet, Sla over"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>

            {/* Preview */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Preview:</p>
              <div className="flex gap-2">
                <div className="flex-1 py-2 bg-green-50 border border-green-200 rounded-xl text-center text-xs font-medium text-green-700">
                  {actionLabel || 'Doe mee'}
                </div>
                <div className="flex-1 py-2 bg-red-50 border border-red-200 rounded-xl text-center text-xs font-medium text-red-600">
                  {declineLabel || 'Niet vanavond'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Opslaan knop */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 active:bg-sky-800 transition"
        >
          Instellingen opslaan
        </button>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 space-y-4">
          <h3 className="font-semibold text-red-600">Gevarenzone</h3>
          <p className="text-xs text-slate-500">
            Het verwijderen van een groep is permanent. Alle data (aanwezigheid, momenten, notities) wordt verwijderd.
          </p>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 border-2 border-red-200 text-red-500 font-medium rounded-xl hover:bg-red-50 transition text-sm"
            >
              Groep verwijderen
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-600 font-medium">
                Typ <span className="font-bold">"{group?.name}"</span> om te bevestigen:
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder={group?.name}
                className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmDelete(false); setDeleteText(''); }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteText !== group?.name}
                  className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Definitief verwijderen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
