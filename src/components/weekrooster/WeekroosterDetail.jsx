import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { getMonday, formatWeekLabel, DAY_LABELS_SHORT } from '../../utils/dates.js';

export default function WeekroosterDetail({ group, onNavigate }) {
  const { user, isAdmin } = useAuth();
  const {
    members, presence, togglePresence, fillWholeWeek,
    copyPreviousWeek, clearWeek, undo, undoStack,
    getOchtend, getMiddag, getNote, hasPreviousWeekData, showToast
  } = useApp();

  const [weekOffset, setWeekOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [noteModal, setNoteModal] = useState(null);

  // Bereken de maandag van de huidige weergaveweek
  const currentMonday = useMemo(() => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [weekOffset]);

  const weekKey = currentMonday.toISOString().slice(0, 10);
  const weekLabel = formatWeekLabel(currentMonday);

  // Mijn member-data
  const myMember = members.find(m => m.short === user?.short) || members[0];
  const myName = myMember?.short || 'Jij';

  // Sorteer members: eigen naam bovenaan
  const sortedMembers = useMemo(() => {
    const me = members.filter(m => m.short === myName);
    const others = members.filter(m => m.short !== myName);
    return [...me, ...others];
  }, [members, myName]);

  // Tel aanwezigen per dag
  const dayCounts = useMemo(() => {
    return DAY_LABELS_SHORT.map((_, dayIdx) => {
      let count = 0;
      members.forEach(member => {
        if (getOchtend(weekKey, member.short, dayIdx) || getMiddag(weekKey, member.short, dayIdx)) {
          count++;
        }
      });
      return count;
    });
  }, [members, weekKey, getOchtend, getMiddag]);

  const handleToggle = (memberShort, dayIndex, period) => {
    // Alleen eigen rij bewerken (tenzij admin)
    if (memberShort !== myName && !isAdmin) {
      showToast('Je kunt alleen je eigen rij bewerken');
      return;
    }
    togglePresence(memberShort, weekKey, dayIndex, period);
  };

  const handleCellPress = (memberShort, dayIndex) => {
    // Toon notitie als die bestaat
    const note = getNote(weekKey, memberShort, dayIndex);
    if (note) {
      setNoteModal({ member: memberShort, dayIndex, note });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('groups')}
              className="text-sky-600 text-sm font-medium"
            >
              ← Terug
            </button>
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin_dashboard', group)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ⚙️ Beheer
              </button>
            )}
          </div>

          {/* Groep info */}
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-xl">
              {group?.emoji || '💼'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{group?.name || 'Weekrooster'}</h1>
              <p className="text-xs text-slate-400">Weekrooster</p>
            </div>
          </div>

          {/* Week navigatie */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">{weekLabel}</p>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-xs text-sky-600 mt-0.5"
                >
                  Naar deze week
                </button>
              )}
            </div>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Snelacties */}
      <div className="bg-white border-b border-slate-100 px-4 py-2">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-xs text-sky-600 font-medium"
            >
              {showActions ? 'Verberg acties ▾' : 'Snelacties ▸'}
            </button>
            {undoStack.length > 0 && (
              <button
                onClick={undo}
                className="text-xs text-amber-600 font-medium"
              >
                ↩ Ongedaan maken
              </button>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 mt-2 pb-1 overflow-x-auto">
              <button
                onClick={() => fillWholeWeek(myName, weekKey)}
                className="shrink-0 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200 hover:bg-green-100 transition"
              >
                ✓ Hele week
              </button>
              {hasPreviousWeekData(myName, weekKey) && (
                <button
                  onClick={() => copyPreviousWeek(myName, weekKey)}
                  className="shrink-0 px-3 py-1.5 bg-sky-50 text-sky-700 text-xs font-medium rounded-lg border border-sky-200 hover:bg-sky-100 transition"
                >
                  ⟐ Vorige week
                </button>
              )}
              <button
                onClick={() => clearWeek(myName, weekKey)}
                className="shrink-0 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 transition"
              >
                ✗ Week wissen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rooster grid */}
      <div className="px-4 py-4 max-w-2xl mx-auto overflow-x-auto">
        <div className="min-w-[360px]">
          {/* Dag headers */}
          <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1 mb-1">
            <div></div>
            {DAY_LABELS_SHORT.map((day, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs font-semibold text-slate-600">{day}</p>
                <p className="text-xs text-slate-400">{dayCounts[idx]} pers.</p>
              </div>
            ))}
          </div>

          {/* Member rijen */}
          <div className="space-y-1">
            {sortedMembers.map((member) => {
              const isMe = member.short === myName;
              return (
                <div key={member.id}>
                  {/* Naam + Ochtend rij */}
                  <div className={`grid grid-cols-[100px_repeat(5,1fr)] gap-1 ${isMe ? '' : ''}`}>
                    <div className={`flex items-center px-2 py-1 rounded-l-lg ${isMe ? 'bg-sky-50' : ''}`}>
                      <span className={`text-xs font-medium truncate ${isMe ? 'text-sky-700' : 'text-slate-600'}`}>
                        {member.short}
                        {isMe && ' (jij)'}
                      </span>
                    </div>
                    {DAY_LABELS_SHORT.map((_, dayIdx) => {
                      const isPresent = getOchtend(weekKey, member.short, dayIdx);
                      const hasNote = getNote(weekKey, member.short, dayIdx);
                      return (
                        <button
                          key={dayIdx}
                          onClick={() => handleToggle(member.short, dayIdx, 'ochtend')}
                          onDoubleClick={() => handleCellPress(member.short, dayIdx)}
                          className={`h-8 rounded-lg text-xs font-medium transition relative ${
                            isPresent
                              ? 'bg-green-400 text-white'
                              : isMe
                                ? 'bg-sky-50 text-slate-300 border border-sky-200'
                                : 'bg-slate-100 text-slate-300'
                          }`}
                        >
                          {isPresent ? 'O' : '·'}
                          {hasNote && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Middag rij */}
                  <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1">
                    <div className={`flex items-center px-2 py-1 ${isMe ? 'bg-sky-50' : ''}`}>
                      <span className="text-xs text-slate-400 pl-2">middag</span>
                    </div>
                    {DAY_LABELS_SHORT.map((_, dayIdx) => {
                      const isPresent = getMiddag(weekKey, member.short, dayIdx);
                      return (
                        <button
                          key={dayIdx}
                          onClick={() => handleToggle(member.short, dayIdx, 'middag')}
                          className={`h-8 rounded-lg text-xs font-medium transition ${
                            isPresent
                              ? 'bg-blue-400 text-white'
                              : isMe
                                ? 'bg-sky-50 text-slate-300 border border-sky-200'
                                : 'bg-slate-100 text-slate-300'
                          }`}
                        >
                          {isPresent ? 'M' : '·'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scheidingslijn (behalve na laatste) */}
                  {member.id !== sortedMembers[sortedMembers.length - 1]?.id && (
                    <div className="border-b border-slate-100 my-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span className="text-xs text-slate-500">Ochtend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-xs text-slate-500">Middag</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
            <span className="text-xs text-slate-500">Notitie</span>
          </div>
        </div>
      </div>

      {/* Notitie modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setNoteModal(null)}></div>
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-1">
              Notitie — {noteModal.member}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {DAY_LABELS_SHORT[noteModal.dayIndex]}
            </p>
            <p className="text-sm text-slate-600">{noteModal.note}</p>
            <button
              onClick={() => setNoteModal(null)}
              className="w-full mt-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-600 font-medium"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
