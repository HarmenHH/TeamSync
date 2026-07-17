import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const DAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

// Bepaal periode op basis van tijd
const getPeriod = (time) => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'ochtend';
  if (hour < 18) return 'middag';
  return 'avond';
};

export default function ScheduleScreen({ group, onNavigate }) {
  const { moments, addMoment, deleteMoment } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter momenten voor deze groep
  const groupMoments = moments.filter(m => m.group_id === group?.id);

  // Form state
  const [newLabel, setNewLabel] = useState('');
  const [newDay, setNewDay] = useState('Maandag');
  const [newTime, setNewTime] = useState('18:00');
  const [newNotify, setNewNotify] = useState(30);
  const [newRecurring, setNewRecurring] = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      showToast('Vul een naam in');
      return;
    }
    setSaving(true);
    try {
      await addMoment({
        group_id: group.id,
        label: newLabel.trim(),
        day: newDay,
        time: newTime,
        notify_before: newNotify,
        recurring: newRecurring,
        period: getPeriod(newTime),
      });
      // Reset form
      setNewLabel('');
      setNewDay('Maandag');
      setNewTime('18:00');
      setNewNotify(30);
      setNewRecurring(true);
      setShowForm(false);
      showToast('Moment toegevoegd ✓');
    } catch (error) {
      console.error('Fout bij opslaan:', error);
      showToast('Opslaan mislukt: ' + error.message);
    }
    setSaving(false);
  };

  const handleDelete = (moment) => {
    setConfirmDelete(moment);
  };

  const confirmDeleteMoment = async () => {
    if (confirmDelete) {
      try {
        await deleteMoment(confirmDelete.id);
        setConfirmDelete(null);
        showToast('Moment verwijderd');
      } catch (error) {
        showToast('Verwijderen mislukt');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast melding */}
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
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl">
              🕐
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Momenten & schema</h1>
              <p className="text-xs text-slate-400">{group?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto">
        {/* Bestaande momenten */}
        <div className="space-y-3 mb-6">
          {groupMoments.length === 0 && !showForm && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 text-sm">Nog geen momenten ingesteld.</p>
            </div>
          )}

          {groupMoments.map((moment) => (
            <div
              key={moment.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-sky-600">{moment.time?.slice(0, 5)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{moment.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{moment.day}</span>
                      {moment.recurring && (
                        <span className="text-xs text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded">
                          Wekelijks
                        </span>
                      )}
                      {moment.notify_before > 0 && (
                        <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                          🔔 {moment.notify_before}min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(moment)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Nieuw moment formulier */}
        {showForm ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-semibold text-slate-800">Nieuw moment</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Naam
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Bijv. Training, Vergadering"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dag
                </label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tijd
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Melding vooraf (minuten)
              </label>
              <div className="flex gap-2">
                {[0, 15, 30, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setNewNotify(mins)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                      newNotify === mins
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {mins === 0 ? 'Geen' : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">Wekelijks herhalen</span>
              <button
                onClick={() => setNewRecurring(!newRecurring)}
                className={`w-12 h-7 rounded-full transition relative ${
                  newRecurring ? 'bg-sky-500' : 'bg-slate-200'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  newRecurring ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition"
              >
                Annuleren
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 py-2.5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Toevoegen'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium hover:border-sky-300 hover:text-sky-500 transition"
          >
            + Moment toevoegen
          </button>
        )}

        {/* Info */}
        <p className="text-xs text-slate-400 text-center mt-6">
          Momenten worden getoond aan alle leden van de groep. Bij wekelijkse herhaling verschijnt het moment elke week automatisch.
        </p>
      </div>

      {/* Bevestigingsmodal verwijderen */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setConfirmDelete(null)}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Moment verwijderen?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Weet je zeker dat je <span className="font-semibold">{confirmDelete.label}</span> ({confirmDelete.day}, {confirmDelete.time?.slice(0, 5)}) wilt verwijderen?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition"
              >
                Annuleren
              </button>
              <button
                onClick={confirmDeleteMoment}
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
