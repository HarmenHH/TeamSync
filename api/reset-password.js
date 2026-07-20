import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Niet geautoriseerd' });
    }

    const anon = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: userData, error: userError } = await anon.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Ongeldige sessie' });
    }

    const adminId = userData.user.id;
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .maybeSingle();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Alleen admins mogen wachtwoorden resetten' });
    }

    const { requestId, newPassword } = req.body || {};
    if (!requestId || !newPassword) {
      return res.status(400).json({ error: 'requestId en newPassword zijn verplicht' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' });
    }

    const { data: reqRow, error: reqError } = await supabase
      .from('password_reset_requests')
      .select('id, user_id, username, status')
      .eq('id', requestId)
      .maybeSingle();

    if (reqError || !reqRow) {
      return res.status(404).json({ error: 'Resetverzoek niet gevonden' });
    }
    if (!reqRow.user_id) {
      return res.status(400).json({ error: 'Geen gebruiker gekoppeld aan dit verzoek' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      reqRow.user_id,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(500).json({ error: 'Wachtwoord bijwerken mislukt: ' + updateError.message });
    }

    await supabase
      .from('password_reset_requests')
      .update({
        status: 'resolved',
        updated_at: new Date().toISOString(),
        resolved_by: adminId,
      })
      .eq('id', requestId);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Onverwachte fout' });
  }
}
