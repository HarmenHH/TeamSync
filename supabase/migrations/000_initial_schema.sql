-- Profiles (uitbreiding op auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'lid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groepen
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('samen', 'weekrooster')),
  emoji TEXT DEFAULT '📋',
  action_label TEXT DEFAULT 'Doe mee',
  decline_label TEXT DEFAULT 'Niet vanavond',
  join_mode TEXT DEFAULT 'admin',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groepsleden
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'lid',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Momenten (training, wedstrijd, etc.)
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  notify_before INTEGER DEFAULT 30,
  recurring BOOLEAN DEFAULT true,
  cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reacties op momenten
CREATE TABLE moment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('join', 'decline')),
  week_key TEXT NOT NULL,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(moment_id, user_id, week_key)
);

-- Weekrooster presence
CREATE TABLE presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  day_index INTEGER NOT NULL CHECK (day_index BETWEEN 0 AND 4),
  period TEXT NOT NULL CHECK (period IN ('ochtend', 'middag')),
  present BOOLEAN DEFAULT false,
  UNIQUE(group_id, user_id, week_key, day_index, period)
);

-- Notities bij dagen
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id, week_key, day_index)
);

-- Wachtwoord reset verzoeken
CREATE TABLE password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) activeren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Basis RLS policies: leden zien alleen data van hun eigen groepen
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view group members profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can view their groups"
  ON groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view moments"
  ON moments FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view presence"
  ON presence FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own presence"
  ON presence FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own responses"
  ON moment_responses FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  USING (user_id = auth.uid());
