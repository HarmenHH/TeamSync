import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Toast from './components/ui/Toast.jsx';
import PrivacyModal from './components/ui/PrivacyModal.jsx';
import LoginScreen from './components/auth/LoginScreen.jsx';
import RegisterScreen from './components/auth/RegisterScreen.jsx';
import ForgotPasswordScreen from './components/auth/ForgotPasswordScreen.jsx';
import GroupList from './components/groups/GroupList.jsx';
import SamenDetail from './components/samen/SamenDetail.jsx';
import HistoryScreen from './components/samen/HistoryScreen.jsx';
import WeekroosterDetail from './components/weekrooster/WeekroosterDetail.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import MembersScreen from './components/admin/MembersScreen.jsx';
import ScheduleScreen from './components/admin/ScheduleScreen.jsx';
import SettingsScreen from './components/admin/SettingsScreen.jsx';
import AccountScreen from './components/account/AccountScreen.jsx';

function AppContent() {
  const { user, loading } = useAuth();
  const { toast, showToast } = useApp();
  const [screen, setScreen] = useState('groups');
  const [authScreen, setAuthScreen] = useState('login');
  const [activeGroup, setActiveGroup] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Niet ingelogd: toon auth schermen
  if (!user) {
    return (
      <>
        <Toast message={toast} onClose={() => showToast(null)} />
        <PrivacyModal show={showPrivacy} onClose={() => setShowPrivacy(false)} />
        {authScreen === 'login' && (
          <LoginScreen
            onLogin={() => setAuthScreen('login')}
            onGoRegister={() => setAuthScreen('register')}
            onGoForgot={() => setAuthScreen('forgot')}
            onShowPrivacy={() => setShowPrivacy(true)}
          />
        )}
        {authScreen === 'register' && (
          <RegisterScreen
            onGoLogin={() => setAuthScreen('login')}
            onShowPrivacy={() => setShowPrivacy(true)}
          />
        )}
        {authScreen === 'forgot' && (
          <ForgotPasswordScreen
            onGoLogin={() => setAuthScreen('login')}
          />
        )}
      </>
    );
  }

  // Ingelogd: toon app schermen
  const navigate = (newScreen, group = null) => {
    setScreen(newScreen);
    if (group !== null) setActiveGroup(group);
  };

  return (
    <>
      <Toast message={toast} onClose={() => showToast(null)} />
      <PrivacyModal show={showPrivacy} onClose={() => setShowPrivacy(false)} />

      {screen === 'groups' && (
        <GroupList
          onNavigate={navigate}
          onShowPrivacy={() => setShowPrivacy(true)}
        />
      )}
      {screen === 'samen_detail' && (
        <SamenDetail
          group={activeGroup}
          onNavigate={navigate}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen
          group={activeGroup}
          onNavigate={navigate}
        />
      )}
      {screen === 'werk_detail' && (
        <WeekroosterDetail
          group={activeGroup}
          onNavigate={navigate}
          onShowPrivacy={() => setShowPrivacy(true)}
        />
      )}
      {screen === 'admin_dashboard' && (
        <AdminDashboard
          group={activeGroup}
          onNavigate={navigate}
        />
      )}
      {screen === 'members' && (
        <MembersScreen
          group={activeGroup}
          onNavigate={navigate}
        />
      )}
      {screen === 'schedule' && (
        <ScheduleScreen
          group={activeGroup}
          onNavigate={navigate}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          group={activeGroup}
          onNavigate={navigate}
        />
      )}
      {screen === 'account' && (
        <AccountScreen
          onNavigate={navigate}
          onShowPrivacy={() => setShowPrivacy(true)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
