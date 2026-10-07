import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import NotificationDrawer from './NotificationDrawer';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const { unreadCount, isOpen, setIsOpen } = useNotifications();

  return (
    <header className="app-header">
      <div className="header-title-area">
        <h1>{title || 'Dashboard'}</h1>
      </div>

      <div className="header-actions">
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="notif-bell-btn"
            onClick={() => setIsOpen(!isOpen)}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <NotificationDrawer />
        </div>

        {/* User Badge & Logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingLeft: 12,
            borderLeft: '1px solid #e2e8f0',
          }}
        >
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
              {user?.name || user?.partyName || 'User'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
              {user?.role === 'retailer' ? 'Retail Partner' : user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Sign out"
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
