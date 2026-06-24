import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Mock user data - wordt later vervangen door Supabase auth
const MOCK_USERS = [
  { id: 1, username: 'sander.visser', name: 'Sander Visser', short: 'Sander', email: 'sander@voorbeeld.nl', role: 'admin' },
  { id: 2, username: 'thomas.bakker', name: 'Thomas Bakker', short: 'Thomas', email: 'thomas@voorbeeld.nl', role: 'lid' },
  { id: 3, username: 'daan.devries', name: 'Daan de Vries', short: 'Daan', email: 'daan@voorbeeld.nl', role: 'lid' },
  { id: 4, username: 'luuk.jansen', name: 'Luuk Jansen', short: 'Luuk', email: 'luuk@voorbeeld.nl', role: 'lid' },
  { id: 5, username: 'bram.mulder', name: 'Bram Mulder', short: 'Bram', email: 'bram@voorbeeld.nl', role: 'lid' },
  { id: 6, username: 'jesse.deboer', name: 'Jesse de Boer', short: 'Jesse', email: 'jesse@voorbeeld.nl', role: 'lid' },
  { id: 7, username: 'ruben.smit', name: 'Ruben Smit', short: 'Ruben', email: 'ruben@voorbeeld.nl', role: 'lid' },
  { id: 8, username: 'stijn.peters', name: 'Stijn Peters', short: 'Stijn', email: 'stijn@voorbeeld.nl', role: 'lid' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simuleer sessie-check bij opstarten
  useEffect(() => {
    const savedUser = null; // Later: check Supabase sessie
    setUser(savedUser);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Mock login - later: supabase.auth.signInWithPassword()
    if (!username || !password) {
      return { error: 'Vul beide velden in.' };
    }

    const foundUser = MOCK_USERS.find(u => u.username === username.toLowerCase());
    if (!foundUser) {
      // In mock mode: accepteer elke combinatie, log in als eerste user
      setUser(MOCK_USERS[0]);
      return { error: null };
    }

    setUser(foundUser);
    return { error: null };
  };

  const register = async (username, email, password) => {
    // Mock register - later: supabase.auth.signUp()
    if (!username || !email || !password) {
      return { error: 'Vul alle velden in.' };
    }
    if (password.length < 8) {
      return { error: 'Wachtwoord moet minimaal 8 tekens zijn.' };
    }
    if (!email.includes('@')) {
      return { error: 'Vul een geldig e-mailadres in.' };
    }

    return { error: null };
  };

  const logout = async () => {
    // Later: supabase.auth.signOut()
    setUser(null);
  };

  const resetPassword = async (email) => {
    // Later: supabase.auth.resetPasswordForEmail()
    if (!email || !email.includes('@')) {
      return { error: 'Vul een geldig e-mailadres in.' };
    }
    return { error: null };
  };

  const changePassword = async (oldPassword, newPassword) => {
    // Later: supabase.auth.updateUser()
    if (!oldPassword || !newPassword) {
      return { error: 'Vul alle velden in.' };
    }
    if (newPassword.length < 8) {
      return { error: 'Minimaal 8 tekens.' };
    }
    return { error: null };
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    isAdmin: user?.role === 'admin',
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
