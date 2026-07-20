import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';

export default function ResetRequestsScreen({ onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [activeRequest, setActiveRequest] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select('*, profiles(id, username, display_name, email)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  }

  const handleReset = async () => {
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }

    try {
      const profile = activeRequest?.profiles;
      if (!profile) {
        setError('Profiel niet gevonden.');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setError('Je sessie is verlopen. Log opnieuw in.');
        return;
      }

      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ requestId: activeRequest.id, newPassword }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `Reset mislukt (${response.status})`);
      }

      setSuccess(`Wachtwoord voor ${profile.display_name || profile.username} is gereset.`);
      setNewPassword('');
      setActiveRequest(null);
      loadRequests();
    } catch (err) {
      setError('Reset mislukt: ' + (err.message || 'onbekende fout'));
    }
  };

  const handleDismiss = async (req) => {
    await supabase
      .from('password_reset_requests')
      .update({ status: 'dismissed', updated_at: new Date().toISOString() })
      .eq('id', req.id);
    loadRequests();
  };

  const pending = requests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => onNavigate('groups')}
            className="text-sky-600 text-sm font-medium"
          >
            ← Terug
          </button>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl">
              🔑
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Reset verzoeken</h1>
              <p className="text-xs text-slate-400">{pending.length} open verzoeken</p>
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

        {!loading && requests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">Nog geen reset verzoeken.</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => {
              const profile = req.profiles;
              const displayName = profile?.display_name || profile?.username || req.username;
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{displayName}</p>
                      <p className="text-xs text-slate-400">@{req.username}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {req.status === 'pending' ? 'Open' :
                       req.status === 'resolved' ? 'Opgelost' : 'Genegeerd'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Aangevraagd: {new Date(req.created_at).toLocaleString('nl-NL')}
                  </p>

                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveRequest(req)}
                        className="flex-1 py-2 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700 transition"
                      >
                        Wachtwoord resetten
                      </button>
                      <button
                        onClick={() => handleDismiss(req)}
                        className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition"
                      >
                        Negeren
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {success && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-xl text-sm shadow-lg">
            {success}
          </div>
        )}
      </div>

      {/* Reset modal */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => { setActiveRequest(null); setNewPassword(''); setError(''); }}></div>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Nieuw wachtwoord</h3>
            <p className="text-sm text-slate-500 mb-4">
              Vul een nieuw wachtwoord in voor <span className="font-semibold">{activeRequest.profiles?.display_name || activeRequest.username}</span>.
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimaal 8 tekens"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-sm mb-3"
            />
            {error && (
              <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg mb-3">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setActiveRequest(null); setNewPassword(''); setError(''); }}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition"
              >
                Annuleren
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition"
              >
                Resetten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
