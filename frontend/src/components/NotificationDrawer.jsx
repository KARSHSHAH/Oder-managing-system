import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationDrawer = () => {
  const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllAsRead } =
    useNotifications();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 65,
        right: 20,
        width: 380,
        maxHeight: 520,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
        border: '1px solid #e2e8f0',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.18s ease',
      }}
    >
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} color="#2563eb" />
          <strong style={{ fontSize: '0.95rem' }}>Notifications</strong>
          {unreadCount > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: 99,
                padding: '2px 7px',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Mark all as read"
              style={{
                fontSize: '0.75rem',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600,
              }}
            >
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            style={{ color: '#94a3b8', padding: 2 }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0' }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '0.88rem',
            }}
          >
            No notifications yet
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => markAsRead(notif._id)}
              style={{
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid #f8fafc',
                backgroundColor: notif.isRead ? '#ffffff' : '#f0f7ff',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: notif.isRead ? 600 : 700, fontSize: '0.88rem', color: '#0f172a' }}>
                  {notif.title}
                </div>
                {!notif.isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  margin: '4px 0 6px',
                  lineHeight: 1.35,
                }}
              >
                {notif.message}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                }}
              >
                <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {notif.link && (
                  <Link
                    to={notif.link}
                    onClick={() => setIsOpen(false)}
                    style={{
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      fontWeight: 600,
                    }}
                  >
                    View <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDrawer;
