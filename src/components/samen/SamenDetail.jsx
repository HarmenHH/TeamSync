import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function SamenDetail({ group, onNavigate }) {
  const { user, isAdmin } = useAuth();
  const { moments, members, myStatus, cancelledMoments, setMomentStatus, cancelMoment, showToast } = useApp();

  const getStatusColor = (status) => {
    if (status === 'join') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'decline') return 'bg-red-50 text-red-600 border-red-200';
    return 'bg-slate-50 text-slate-500 border-slate-200';
  };

  const getStatusLabel = (status) => {
    if (status === 'join') return '✓ Doet mee';
    if (status === 'decline') return '✗ Niet vanavond';
    return '? Nog niet gereageerd';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('groups')}
              className="text-sky-600 text-sm font-medium"
            >
              ← Terug
            </button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-xl">
              {group?.emoji || '🚴'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{group?.name || 'Groep'}</h1>
              <p className="text-xs text-slate-400">Activiteit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto">
        {/* Momenten */}
        <div className="space-y-4">
          {moments.map((moment) => {
            const isCancelled = cancelledMoments[moment.id];
            const currentStatus = myStatus[moment.id];

            return (
              <div
                key={moment.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border ${isCancelled ? 'border-red-200 opacity-60' : 'border-slate-100'}`}
              >
                {/* Moment header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {moment.label}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {moment.day} • {moment.time}
                      {moment.recurring && ' • Wekelijks'}
                    </p>
                  </div>
                  {isCancelled && (
                    <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                      Afgelast
                    </span>
                  )}
                </div>

                {/* Afgelast melding */}
                {isCancelled && (
                  <p className="text-sm text-red-500 mb-3">
                    Dit moment is afgelast door de admin.
                  </p>
                )}

                {/* Actieknoppen (alleen als niet afgelast) */}
                {!isCancelled && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setMomentStatus(moment.id, 'join')}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                        currentStatus === 'join'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      {group?.actionLabel || 'Doe mee'}
                    </button>
                    <button
                      onClick={() => setMomentStatus(moment.id, 'decline')}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                        currentStatus === 'decline'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-red-500 border-red-200 hover:bg-red-50'
                      }`}
                    >
                      {group?.declineLabel || 'Niet vanavond'}
                    </button>
                  </div>
                )}

                {/* Deelnemers overzicht */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Reacties</p>
                  <div className="space-y-1.5">
                    {/* Eigen status */}
                    {currentStatus && (
                      <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${getStatusColor(currentStatus)}`}>
                        <span className="text-xs font-medium">{user?.short || 'Jij'}</span>
                        <span className="text-xs">{getStatusLabel(currentStatus)}</span>
                      </div>
                    )}

                    {/* Mock reacties van anderen */}
                    {members.slice(1, 5).map((member, idx) => {
                      const mockStatus = idx < 2 ? 'join' : idx === 2 ? 'decline' : null;
                      if (!mockStatus) return null;
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${getStatusColor(mockStatus)}`}
                        >
                          <span className="text-xs font-medium">{member.short}</span>
                          <span className="text-xs">{getStatusLabel(mockStatus)}</span>
                        </div>
                      );
                    })}

                    {/* Nog niet gereageerd */}
                    <p className="text-xs text-slate-400 mt-2">
                      {members.length - 4} leden hebben nog niet gereageerd
                    </p>
                  </div>
                </div>

                {/* Admin: afgelasten */}
                {isAdmin && !isCancelled && (
                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <button
                      onClick={() => cancelMoment(moment.id)}
                      className="text-xs text-red-400 hover:text-red-500 font-medium"
                    >
                      Moment afgelasten
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Geen momenten */}
        {moments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">Nog geen momenten ingesteld.</p>
            {isAdmin && (
              <button
                onClick={() => onNavigate('schedule', group)}
                className="mt-3 text-sm text-sky-600 font-medium"
              >
                Momenten instellen →
              </button>
            )}
          </div>
        )}

        {/* Historie link */}
        <div className="mt-6">
          <button
            onClick={() => onNavigate('history', group)}
            className="w-full py-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm text-slate-600 font-medium hover:bg-slate-50 transition"
          >
            📊 Geschiedenis bekijken
          </button>
        </div>

        {/* Admin link */}
        {isAdmin && (
          <div className="mt-3">
            <button
              onClick={() => onNavigate('admin_dashboard', group)}
              className="w-full py-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm text-slate-600 font-medium hover:bg-slate-50 transition"
            >
              ⚙️ Groep beheren
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
