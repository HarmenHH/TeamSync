import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function GroupList({ onNavigate, onShowPrivacy }) {
  const { user, logout, isAdmin } = useAuth();
  const { groups } = useApp();

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Hoi {user?.short || 'daar'} 👋
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
                  {isAdmin && (
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

        {/* Nieuwe groep knop (alleen admin) */}
        {isAdmin && (
          <button
            onClick={() => onNavigate('admin_dashboard', null)}
            className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium hover:border-sky-300 hover:text-sky-500 transition"
          >
            + Nieuwe groep
          </button>
        )}

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
    </div>
  );
}
