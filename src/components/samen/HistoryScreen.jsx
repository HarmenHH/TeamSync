import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { getMonday, formatWeekLabel } from '../../utils/dates.js';

export default function HistoryScreen({ group, onNavigate }) {
  const { getGroupMoments, getGroupMembers } = useApp();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [group?.id]);

  async function loadHistory() {
    if (!group?.id) return;
    setLoading(true);

    const groupMoments = getGroupMoments(group.id);
    const groupMembers = getGroupMembers(group.id);

    if (groupMoments.length === 0) {
      setWeeks([]);
      setLoading(false);
      return;
    }

    const momentIds = groupMoments.map(m => m.id);

    const { data: allResponses } = await supabase
      .from('moment_responses')
      .select('*')
      .in('moment_id', momentIds)
      .order('week_key', { ascending: false });

    const responses = allResponses || [];

    const weekKeys = [...new Set(responses.map(r => r.week_key))];
    const thisWeekMonday = getMonday(new Date()).toISOString().slice(0, 10);
    const allWeekKeys = [thisWeekMonday, ...weekKeys.filter(k => k !== thisWeekMonday)];

    const weeksData = allWeekKeys.map(weekKey => {
      const mondayDate = new Date(weekKey);
      mondayDate.setDate(mondayDate.getDate() + weekOffsetFor(weekKey, thisWeekMonday));
      const label = formatWeekLabel(new Date(weekKey));

      const weekMoments = groupMoments.map(moment => {
        const momentResponses = responses.filter(
          r => r.moment_id === moment.id && r.week_key === weekKey
        );
        const joined = momentResponses
          .filter(r => r.status === 'join' || r.status === 'aanwezig')
          .map(r => {
            const m = groupMembers.find(gm => gm.id === r.user_id);
            return m?.display_name || m?.username || 'Onbekend';
          });
        const declined = momentResponses
          .filter(r => r.status === 'decline' || r.status === 'afwezig')
          .map(r => {
            const m = groupMembers.find(gm => gm.id === r.user_id);
            return m?.display_name || m?.username || 'Onbekend';
          });
        const respondedIds = momentResponses.map(r => r.user_id);
        const noResponse = groupMembers
          .filter(m => !respondedIds.includes(m.id))
          .map(m => m.display_name || m.username);

        return {
          id: moment.id,
          label: moment.label,
          day: moment.day,
          time: moment.time,
          joined,
          declined,
          noResponse,
          cancelled: moment.cancelled,
        };
      }).filter(m => m.joined.length > 0 || m.declined.length > 0 || m.cancelled);

      return { weekKey, week: label, moments: weekMoments };
    }).filter(w => w.moments.length > 0);

    setWeeks(weeksData);
    setLoading(false);
  }

  function weekOffsetFor(weekKey, thisWeekMonday) {
    const diff = (new Date(weekKey) - new Date(thisWeekMonday)) / (7 * 24 * 60 * 60 * 1000);
    return diff;
  }

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
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {!loading && weeks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">Nog geen geschiedenis.</p>
          </div>
        )}

        {!loading && weeks.length > 0 && (
          <div className="space-y-3">
            {weeks.map((week, weekIndex) => (
              <div key={week.weekKey} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
        )}
      </div>
    </div>
  );
}
