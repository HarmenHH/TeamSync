-- Functie: verwijder ALLE data van een gebruiker
-- Wordt aangeroepen wanneer een account wordt verwijderd

CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Verwijder aanwezigheid/presence data
  DELETE FROM presence WHERE user_id = target_user_id;

  -- Verwijder notities
  DELETE FROM notes WHERE user_id = target_user_id;

  -- Verwijder moment-reacties
  DELETE FROM moment_responses WHERE user_id = target_user_id;

  -- Verwijder groepslidmaatschappen
  DELETE FROM group_members WHERE user_id = target_user_id;

  -- Verwijder groepen waar de user eigenaar is (en cascade)
  DELETE FROM groups WHERE created_by = target_user_id;

  -- Verwijder wachtwoord-reset verzoeken
  DELETE FROM password_reset_requests WHERE user_id = target_user_id;

  -- Verwijder het profiel
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: automatisch data wissen als auth.users entry wordt verwijderd
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM delete_user_data(OLD.id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Koppel trigger aan auth.users
DROP TRIGGER IF EXISTS on_user_deleted ON auth.users;
CREATE TRIGGER on_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();
