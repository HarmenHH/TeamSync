import React, { createContext, useContext, useState, useCallback } from 'react';
import { getMonday } from '../utils/dates.js';

const AppContext = createContext(null);

const DEFAULT_MEMBERS = [
  { id: 1, name: 'Sander Visser', short: 'Sander', role: 'admin', active: true },
  { id: 2, name: 'Thomas Bakker', short: 'Thomas', role: 'lid', active: true },
  { id: 3, name: 'Daan de Vries', short: 'Daan', role: 'lid', active: true },
  { id: 4, name: 'Luuk Jansen', short: 'Luuk', role: 'lid', active: true },
  { id: 5, name: 'Bram Mulder', short: 'Bram', role: 'lid', active: true },
  { id: 6, name: 'Jesse de Boer', short: 'Jesse', role: 'lid', active: true },
  { id: 7, name: 'Ruben Smit', short: 'Ruben', role: 'lid', active: true },
  { id: 8, name: 'Stijn Peters', short: 'Stijn', role: 'lid', active: true },
];

const DEFAULT_GROUPS = [
  { id: 1, name: 'Hockey fietsen', type: 'samen', emoji: '🚴', joinMode: 'admin', actionLabel: 'Rijd mee', declineLabel: 'Niet vanavond' },
  { id: 2, name: 'Werk — Team Dev', type: 'weekrooster', emoji: '💼', joinMode: 'admin' },
];

const DEFAULT_MOMENTS = [
  { id: 1, day: 'Woensdag', time: '18:45', label: 'Training', notifyBefore: 30, recurring: true },
  { id: 2, day: 'Zaterdag', time: '14:00', label: 'Wedstrijd', notifyBefore: 60, recurring: true },
];

function generateMockPresence() {
  const weekKey = getMonday(new Date()).toISOString().slice(0, 10);
  const data = {};
  data[weekKey] = {};
  DEFAULT_MEMBERS.forEach((member, idx) => {
    data[weekKey][member.short] = {
      ochtend: [idx < 7, idx < 8, idx < 6, idx % 2 === 0, idx < 5],
      middag: [idx < 5, idx < 7, idx < 8, idx < 6, idx < 3],
    };
  });
  return data;
}

export function AppProvider({ children }) {
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [moments, setMoments] = useState(DEFAULT_MOMENTS);
  const [presence, setPresence] = useState(generateMockPresence);
  const [notes, setNotes] = useState({});
  const [toast, setToast] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [myStatus, setMyStatus] = useState({});
  const [cancelledMoments, setCancelledMoments] = useState({});

  // Toast functie
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Presence functies
  const togglePresence = useCallback((member, weekKey, dayIndex, period) => {
    setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(presence))]);
    setPresence(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[weekKey]) updated[weekKey] = {};
      if (!updated[weekKey][member]) {
        updated[weekKey][member] = { ochtend: [false, false, false, false, false], middag: [false, false, false, false, false] };
      }
      updated[weekKey][member][period][dayIndex] = !updated[weekKey][member][period][dayIndex];
      return updated;
    });
    showToast('Opgeslagen');
  }, [presence, showToast]);

  const fillWholeWeek = useCallback((member, weekKey) => {
    setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(presence))]);
    setPresence(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[weekKey]) updated[weekKey] = {};
      updated[weekKey][member] = { ochtend: [true, true, true, true, true], middag: [true, true, true, true, true] };
      return updated;
    });
    showToast('Hele week gevuld');
  }, [presence, showToast]);

  const copyPreviousWeek = useCallback((member, weekKey) => {
    const currentMonday = new Date(weekKey);
    const prevMonday = new Date(currentMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const prevKey = prevMonday.toISOString().slice(0, 10);
    const prevData = presence[prevKey]?.[member];
    if (!prevData) {
      showToast('Geen data van vorige week');
      return;
    }
    setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(presence))]);
    setPresence(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[weekKey]) updated[weekKey] = {};
      updated[weekKey][member] = JSON.parse(JSON.stringify(prevData));
      return updated;
    });
    showToast('Vorige week gekopieerd');
  }, [presence, showToast]);

  const clearWeek = useCallback((member, weekKey) => {
    setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(presence))]);
    setPresence(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[weekKey]) updated[weekKey] = {};
      updated[weekKey][member] = { ochtend: [false, false, false, false, false], middag: [false, false, false, false, false] };
      return updated;
    });
    showToast('Week gewist');
  }, [presence, showToast]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setPresence(prev);
    setUndoStack(s => s.slice(0, -1));
    showToast('Ongedaan gemaakt');
  }, [undoStack, showToast]);

  // Presence helpers
  const getOchtend = useCallback((weekKey, member, dayIndex) => {
    return presence[weekKey]?.[member]?.ochtend?.[dayIndex] || false;
  }, [presence]);

  const getMiddag = useCallback((weekKey, member, dayIndex) => {
    return presence[weekKey]?.[member]?.middag?.[dayIndex] || false;
  }, [presence]);

  const hasPreviousWeekData = useCallback((member, weekKey) => {
    const currentMonday = new Date(weekKey);
    const prevMonday = new Date(currentMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const prevKey = prevMonday.toISOString().slice(0, 10);
    return presence[prevKey]?.[member]?.ochtend?.some(v => v) || presence[prevKey]?.[member]?.middag?.some(v => v) || false;
  }, [presence]);

  // Notes functies
  const getNoteKey = (weekKey, member, dayIndex) => `${weekKey}-${member}-${dayIndex}`;

  const getNote = useCallback((weekKey, member, dayIndex) => {
    return notes[getNoteKey(weekKey, member, dayIndex)] || '';
  }, [notes]);

  const saveNote = useCallback((weekKey, member, dayIndex, text) => {
    const key = getNoteKey(weekKey, member, dayIndex);
    if (text.trim()) {
      setNotes(prev => ({ ...prev, [key]: text }));
    } else {
      setNotes(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
    showToast('Notitie opgeslagen');
  }, [showToast]);

  const deleteNote = useCallback((weekKey, member, dayIndex) => {
    const key = getNoteKey(weekKey, member, dayIndex);
    setNotes(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    showToast('Notitie verwijderd');
  }, [showToast]);

  // Groups functies
  const addGroup = useCallback((group) => {
    const newGroup = { ...group, id: groups.length + 1 };
    setGroups(prev => [...prev, newGroup]);
    showToast('Groep aangemaakt');
    return newGroup;
  }, [groups, showToast]);

  const deleteGroup = useCallback((groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    showToast('Groep verwijderd');
  }, [showToast]);

  // Members functies
  const removeMember = useCallback((memberId) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setPresence(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        Object.keys(updated).forEach(wk => { delete updated[wk][member.short]; });
        return updated;
      });
    }
    setMembers(prev => prev.filter(m => m.id !== memberId));
    showToast('Lid verwijderd');
  }, [members, showToast]);

  const promoteToAdmin = useCallback((memberId) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: 'admin' } : m));
    showToast('Admin-rechten toegekend');
  }, [showToast]);

  // Moments functies
  const addMoment = useCallback((moment) => {
    const newMoment = { ...moment, id: moments.length + 10 };
    setMoments(prev => [...prev, newMoment]);
    showToast('Moment toegevoegd');
  }, [moments, showToast]);

  const deleteMoment = useCallback((momentId) => {
    setMoments(prev => prev.filter(m => m.id !== momentId));
    showToast('Moment verwijderd');
  }, [showToast]);

  const setMomentStatus = useCallback((momentId, status) => {
    setMyStatus(prev => ({ ...prev, [momentId]: status }));
    showToast('Reactie opgeslagen');
  }, [showToast]);

  const cancelMoment = useCallback((momentId) => {
    setCancelledMoments(prev => ({ ...prev, [momentId]: true }));
    showToast('Moment afgelast');
  }, [showToast]);

  const value = {
    // State
    groups,
    members,
    moments,
    presence,
    notes,
    toast,
    undoStack,
    myStatus,
    cancelledMoments,

    // Toast
    showToast,

    // Presence
    togglePresence,
    fillWholeWeek,
    copyPreviousWeek,
    clearWeek,
    undo,
    getOchtend,
    getMiddag,
    hasPreviousWeekData,

    // Notes
    getNote,
    saveNote,
    deleteNote,

    // Groups
    addGroup,
    deleteGroup,
    setGroups,

    // Members
    removeMember,
    promoteToAdmin,
    setMembers,

    // Moments
    addMoment,
    deleteMoment,
    setMomentStatus,
    cancelMoment,
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
