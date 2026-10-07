import React from 'react';

const StatCard = ({ label, value, icon: Icon, color = '#2563eb', bg = '#eff6ff', change }) => {
  return (
    <div className="stat-card" style={{ '--primary': color }}>
      <div className="stat-icon" style={{ backgroundColor: bg, color }}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-val">{value}</div>
        {change && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{change}</div>}
      </div>
    </div>
  );
};

export default StatCard;
