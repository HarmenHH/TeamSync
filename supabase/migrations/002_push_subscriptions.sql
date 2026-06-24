-- Push notification subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscription"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Voeg ook toe aan de delete functie
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM push_subscriptions WHERE user_id = target_user_id;
  DELETE FROM presence WHERE user_id = target_user_id;
  DELETE FROM notes WHERE user_id = target_user_id;
  DELETE FROM moment_responses WHERE user_id = target_user_id;
  DELETE FROM group_members WHERE user_id = target_user_id;
  DELETE FROM groups WHERE created_by = target_user_id;
  DELETE FROM password_reset_requests WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
