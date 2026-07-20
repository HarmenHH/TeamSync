import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AppContext = createContext();

// Helper: krijg maandag van deze week
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function AppProvider({ children }) {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState([]);
  const [moments, setMoments] = useState([]);
  const [responses, setResponses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekKey = getMonday(new Date()).toISOString().slice(0, 10);

  // Laad data wanneer user inlogt
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setGroups([]);
      setMoments([]);
      setResponses([]);
      setMembers([]);
      setLoading(false);
    }
  }, [user]);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([
      loadGroups(),
      loadMoments(),
      loadResponses(),
      loadMembers(),
    ]);
    setLoading(false);
  }

  async function loadGroups() {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('created_at');

    // Map snake_case naar camelCase
    const mapped = (data || []).map(g => ({
      ...g,
      joinMode: g.join_mode,
      actionLabel: g.action_label,
      declineLabel: g.decline_label,
    }));
    setGroups(mapped);
  }

  async function loadMoments() {
    const { data } = await supabase
      .from('moments')
      .select('*, groups(name, emoji)')
      .order('time');
    setMoments(data || []);
  }

  async function loadResponses() {
    const { data } = await supabase
      .from('moment_responses')
      .select('*')
      .eq('week_key', weekKey);
    setResponses(data || []);
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('group_members')
      .select('*, profiles(id, username, display_name, role)');
    setMembers(data || []);
  }

  // === ACTIES ===

  async function addGroup(groupData) {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: groupData.name,
        emoji: groupData.emoji,
        type: groupData.type || 'samen',
        join_mode: groupData.joinMode || 'admin',
        action_label: groupData.actionLabel || 'Doe mee',
        decline_label: groupData.declineLabel || 'Niet vanavond',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Map terug naar camelCase
    const mapped = {
      ...data,
      joinMode: data.join_mode,
      actionLabel: data.action_label,
      declineLabel: data.decline_label,
    };
    setGroups(prev => [...prev, mapped]);

    // Voeg creator toe als lid (admin rol) zodat de groep zichtbaar is
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: data.id, user_id: user.id, role: 'admin' })
      .select('*, profiles(id, username, display_name, role)')
      .single();

    if (!memberError && memberData) {
      setMembers(prev => [...prev, memberData]);
    }

    return mapped;
  }

  async function updateGroup(groupId, updates) {
    // Map camelCase naar snake_case voor Supabase
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.joinMode !== undefined) dbUpdates.join_mode = updates.joinMode;
    if (updates.actionLabel !== undefined) dbUpdates.action_label = updates.actionLabel;
    if (updates.declineLabel !== undefined) dbUpdates.decline_label = updates.declineLabel;

    const { error } = await supabase
      .from('groups')
      .update(dbUpdates)
      .eq('id', groupId);

    if (error) throw error;
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  }

  async function deleteGroup(groupId) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setMoments(prev => prev.filter(m => m.group_id !== groupId));
  }

  async function addMember(groupId, userId) {
    const { data, error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId })
      .select('*, profiles(id, username, display_name, role)')
      .single();

    if (error) throw error;
    setMembers(prev => [...prev, data]);
  }

  async function regenerateInviteCode(groupId) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const { data, error } = await supabase
      .from('groups')
      .update({
        invite_code: code,
        invite_code_updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, invite_code: code, invite_code_updated_at: data.invite_code_updated_at } : g));
    return code;
  }

  async function joinGroupByCode(code) {
    const { data: groupData, error: verifyError } = await supabase
      .rpc('verify_invite_code', { input_code: code.trim().toUpperCase() });

    if (verifyError) throw verifyError;
    if (!groupData || groupData.length === 0) {
      throw new Error('Ongeldige uitnodigingscode');
    }

    const group = groupData[0];

    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id });

    if (joinError) {
      if (joinError.code === '23505') {
        throw new Error('Je bent al lid van deze groep');
      }
      throw joinError;
    }

    await loadMembers();
    return group;
  }

  async function removeMember(groupId, userId) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
    setMembers(prev => prev.filter(m => !(m.group_id === groupId && m.user_id === userId)));
  }

  async function addMoment(momentData) {
    const { data, error } = await supabase
      .from('moments')
      .insert({ ...momentData, created_by: user.id })
      .select('*, groups(name, emoji)')
      .single();

    if (error) throw error;
    setMoments(prev => [...prev, data]);
    return data;
  }

  async function updateMoment(momentId, updates) {
    const { error } = await supabase
      .from('moments')
      .update(updates)
      .eq('id', momentId);

    if (error) throw error;
    setMoments(prev => prev.map(m => m.id === momentId ? { ...m, ...updates } : m));
  }

  async function deleteMoment(momentId) {
    const { error } = await supabase
      .from('moments')
      .delete()
      .eq('id', momentId);

    if (error) throw error;
    setMoments(prev => prev.filter(m => m.id !== momentId));
  }

  async function setResponse(momentId, status) {
    const { data, error } = await supabase
      .from('moment_responses')
      .upsert(
        {
          moment_id: momentId,
          user_id: user.id,
          week_key: weekKey,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'moment_id,user_id,week_key' }
      )
      .select()
      .single();

    if (error) throw error;

    setResponses(prev => {
      const existing = prev.findIndex(
        r => r.moment_id === momentId && r.user_id === user.id && r.week_key === weekKey
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = data;
        return updated;
      }
      return [...prev, data];
    });
  }

  // === HELPERS ===

  function getMyGroups() {
    const myGroupIds = members
      .filter(m => m.user_id === user?.id)
      .map(m => m.group_id);
    return groups.filter(g => myGroupIds.includes(g.id));
  }

  function getGroupMembers(groupId) {
    return members
      .filter(m => m.group_id === groupId)
      .map(m => m.profiles)
      .filter(Boolean);
  }

  function getGroupMoments(groupId) {
    return moments.filter(m => m.group_id === groupId);
  }

  function getMomentResponses(momentId) {
    return responses.filter(r => r.moment_id === momentId && r.week_key === weekKey);
  }

  function getMyResponse(momentId) {
    return responses.find(
      r => r.moment_id === momentId && r.user_id === user?.id && r.week_key === weekKey
    );
  }

  function getTodaysMoments() {
    const today = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'][new Date().getDay()];
    const myGroupIds = members
      .filter(m => m.user_id === user?.id)
      .map(m => m.group_id);
    return moments.filter(m => m.day === today && myGroupIds.includes(m.group_id) && !m.cancelled);
  }

  const value = {
    groups,
    setGroups,
    moments,
    responses,
    members,
    loading,
    weekKey,
    // Acties
    addGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    regenerateInviteCode,
    joinGroupByCode,
    addMoment,
    updateMoment,
    deleteMoment,
    setResponse,
    loadAllData,
    // Helpers
    getMyGroups,
    getGroupMembers,
    getGroupMoments,
    getMomentResponses,
    getMyResponse,
    getTodaysMoments,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp moet binnen AppProvider gebruikt worden');
  }
  return context;
}
