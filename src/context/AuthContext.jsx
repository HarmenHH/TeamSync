import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  }

  async function login(username, password) {
    const email = `${username}@teamsync.app`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error('Onjuiste gebruikersnaam of wachtwoord');
    }

    return data;
  }

  async function register(username, email, password, displayName) {
    // We gebruiken username@teamsync.app als auth-email (voor login met username)
    const authEmail = `${username}@teamsync.app`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password,
    });

    if (authError) return { error: authError.message };

    if (!authData.user) return { error: 'Registratie mislukt. Probeer opnieuw.' };

    // Maak profiel aan met display_name
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        display_name: displayName || username,
        role: 'member',
      });

    if (profileError) return { error: profileError.message };

    // Log uit zodat gebruiker zelf kan inloggen
    await supabase.auth.signOut();

    return { success: true };
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function createUser(username, displayName, password, role = 'member') {
    const email = `${username}@teamsync.app`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        display_name: displayName,
        role,
      });

    if (profileError) throw profileError;

    return authData.user;
  }

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    register,
    createUser,
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth moet binnen AuthProvider gebruikt worden');
  }
  return context;
}
