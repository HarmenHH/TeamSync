import React, { useState } from 'react';

const MOCK_HISTORY = [
  {
    week: 'Deze week',
    moments: [
      {
        id: 1,
        label: 'Training',
        day: 'Woensdag',
        time: '18:45',
        joined: ['Sander', 'Thomas', 'Daan', 'Luuk', 'Bram'],
        declined: ['Jesse', 'Ruben'],
        noResponse: ['Stijn'],
      },
    ],
  },
  {
    week: 'Vorige week',
    moments: [
      {
        id: 2,
        label: 'Training',
        day: 'Woensdag',
        time: '18:45',
        joined: ['Sander', 'Thomas', 'Daan', 'Jesse', 'Ruben', 'Stijn'],
        declined: ['Luuk'],
        noResponse: ['Bram'],
      },
      {
        id: 3,
        label: 'Wedstrijd',
        day: 'Zaterdag',
        time: '14:00',
        joined: ['Sander', 'Thomas', 'Daan', 'Luuk', 'Bram', 'Jesse', 'Ruben'],
        declined: ['Stijn'],
        noResponse: [],
      },
    ],
  },
  {
    week: '2 weken geleden',
    moments: [
      {
        id: 4,
        label: 'Training',
        day: 'Woensdag',
        time: '18:45',
        joined: ['Sander', 'Daan', 'Luuk', 'Bram', 'Stijn'],
        declined: ['Thomas', 'Jesse'],
        noResponse: ['Ruben'],
        cancelled: true,
      },
    ],
  },
];

export default function HistoryScreen({ group, onNavigate }) {
  const [expandedWeek, setExpandedWeek] = useState(0);

  const toggleWeek = (index) => {
    setExpandedWeek(expandedWeek === index ? -1 : index);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => onNavigate('samen_detail', group)}
            className="text-sky-600 text-sm font-medium"
          >
            ← Terug
          </button>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Geschiedenis</h1>
              <p className="text-xs text-slate-400">{group?.name || 'Groep'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-lg mx-auto">
        <div className="space-y-3">
          {MOCK_HISTORY.map((week, weekIndex) => (
            <div key={weekIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Week header (klikbaar) */}
              <button
                onClick={() => toggleWeek(weekIndex)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">{week.week}</span>
                  <span className="text-xs text-slate-400">
                    {week.moments.length} moment{week.moments.length !== 1 ? 'en' : ''}
                  </span>
                </div>
                <span className="text-slate-400 text-sm">
                  {expandedWeek === weekIndex ? '▾' : '▸'}
                </span>
              </button>

              {/* Momenten (uitgeklapt) */}
              {expandedWeek === weekIndex && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  {week.moments.map((moment) => (
                    <div key={moment.id}>
                      {/* Moment header */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-slate-700">
                            {moment.label}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            {moment.day} {moment.time}
                          </span>
                        </div>
                        {moment.cancelled && (
                          <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                            Afgelast
                          </span>
                        )}
                      </div>

                      {/* Deelnemers */}
                      {!moment.cancelled && (
                        <div className="space-y-1.5">
                          {/* Meedoen */}
                          {moment.joined.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-green-500 text-xs mt-0.5">✓</span>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {moment.joined.join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Afgemeld */}
                          {moment.declined.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-red-400 text-xs mt-0.5">✗</span>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {moment.declined.join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Geen reactie */}
                          {moment.noResponse.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-slate-300 text-xs mt-0.5">?</span>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {moment.noResponse.join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Samenvatting */}
                          <p className="text-xs text-slate-400 mt-1 pt-1 border-t border-slate-50">
                            {moment.joined.length} van {moment.joined.length + moment.declined.length + moment.noResponse.length} aanwezig
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lege staat */}
        {MOCK_HISTORY.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">Nog geen geschiedenis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
