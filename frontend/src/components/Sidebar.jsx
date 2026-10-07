import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  UserCheck,
  BarChart3,
  CreditCard,
  Store,
  FileText,
  Boxes,
  FilePlus,
  History,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/parties', label: 'Retail Parties', icon: Store },
    { to: '/admin/products', label: 'Product Catalog', icon: Package },
    { to: '/admin/orders', label: 'Manage Orders', icon: ShoppingCart },
    { to: '/admin/ledger', label: 'Ledger & Payments', icon: Receipt },
    { to: '/admin/staff', label: 'Staff Accounts', icon: UserCheck },
    { to: '/admin/analytics', label: 'Business Analytics', icon: BarChart3 },
    { to: '/admin/export', label: 'Export to Busy', icon: FileText },
    { to: '/admin/purchases/upload', label: 'Purchase Bills', icon: FilePlus },
    { to: '/admin/purchases', label: 'Purchase History', icon: History },
  ];

  const staffLinks = [
    { to: '/staff/dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
    { to: '/staff/book-order', label: 'Book New Order', icon: ShoppingCart },
    { to: '/staff/orders', label: 'My Booked Orders', icon: Boxes },
    { to: '/staff/collect-payment', label: 'Collect Payment', icon: CreditCard },
    { to: '/staff/parties', label: 'Assigned Parties', icon: Users },
  ];

  const retailerLinks = [
    { to: '/retailer/dashboard', label: 'Store Dashboard', icon: LayoutDashboard },
    { to: '/retailer/shop', label: 'Order Products', icon: ShoppingCart },
    { to: '/retailer/orders', label: 'My Order History', icon: Package },
    { to: '/retailer/ledger', label: 'Account Ledger', icon: FileText },
    { to: '/retailer/profile', label: 'Store Profile', icon: Store },
  ];

  const links =
    role === 'admin'
      ? adminLinks
      : role === 'staff'
      ? staffLinks
      : retailerLinks;

  const getRoleLabel = () => {
    if (role === 'admin') return 'Business Owner';
    if (role === 'staff') return 'Sales Executive';
    if (role === 'retailer') return 'Retail Customer';
    return 'User';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">UW</div>
        <div className="sidebar-brand-text">
          <h2>Undergarments</h2>
          <span>Wholesale OMS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">
          {role?.toUpperCase()} PORTAL
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(user?.name || user?.partyName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || user?.partyName}</div>
            <div className="sidebar-user-role">{getRoleLabel()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
