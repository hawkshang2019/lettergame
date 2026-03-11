import React, { useState } from 'react';
import { analytics } from './analytics';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const AdminPage = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const handleLogin = (success) => {
    if (success) {
      setIsAdminLoggedIn(true);
      setShowAdminDashboard(true);
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setShowAdminDashboard(false);
  };

  return (
    <div className="admin-page">
      {!isAdminLoggedIn && (
        <AdminLogin 
          onLogin={handleLogin}
        />
      )}
      {isAdminLoggedIn && showAdminDashboard && (
        <AdminDashboard 
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default AdminPage;