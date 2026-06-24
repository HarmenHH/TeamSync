import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@teamsync.app'),
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // Beveilig met een secret
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const currentDay = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'][now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Haal alle actieve momenten op voor vandaag
    const { data: moments, error: momentsError } = await supabase
      .from('moments')
      .select('*, groups(name, emoji)')
      .eq('day', currentDay)
      .eq('cancelled', false)
      .eq('recurring', true);

    if (momentsError) throw momentsError;
    if (!moments || moments.length === 0) {
      return res.status(200).json({ message: 'Geen momenten vandaag', sent: 0 });
    }

    let totalSent = 0;

    for (const moment of moments) {
      // Bereken moment-tijd in minuten
      const [hours, mins] = moment.time.split(':').map(Number);
      const momentMinutes = hours * 60 + mins;

      // Check of we nu moeten notificeren (within 5 min window)
      const notifyAt = momentMinutes - (moment.notify_before || 30);
      const diff = notifyAt - currentMinutes;

      if (diff >= 0 && diff < 5) {
        // Haal groepsleden op die push aan hebben
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', moment.group_id);

        if (membersError) continue;

        const userIds = members.map(m => m.user_id);

        // Haal push subscriptions op
        const { data: subscriptions, error: subError } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', userIds);

        if (subError || !subscriptions) continue;

        // Check wie nog niet gereageerd heeft
        const weekKey = getMonday(now).toISOString().slice(0, 10);
        const { data: responses } = await supabase
          .from('moment_responses')
          .select('user_id, status')
          .eq('moment_id', moment.id)
          .eq('week_key', weekKey);

        const respondedUserIds = (responses || []).map(r => r.user_id);

        // Stuur push naar iedereen
        for (const sub of subscriptions) {
          const hasResponded = respondedUserIds.includes(sub.user_id);

          const payload = JSON.stringify({
            title: `${moment.groups?.emoji || '📋'} ${moment.groups?.name || 'TeamSync'}`,
            body: hasResponded
              ? `${moment.label} begint over ${moment.notify_before} minuten`
              : `${moment.label} over ${moment.notify_before} min — geef je reactie!`,
            tag: `moment-${moment.id}`,
            url: '/',
          });

          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          try {
            await webpush.sendNotification(pushSubscription, payload);
            totalSent++;
          } catch (pushError) {
            if (pushError.statusCode === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', sub.user_id);
            }
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `${totalSent} notificaties verstuurd`,
      sent: totalSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Helper
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
