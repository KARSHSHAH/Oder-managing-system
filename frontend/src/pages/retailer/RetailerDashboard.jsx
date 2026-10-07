import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  CreditCard,
  Package,
  FileText,
  ArrowRight,
  Download,
  AlertCircle,
} from 'lucide-react';

const RetailerDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [partyRes, ordersRes] = await Promise.all([
          axiosClient.get(`/retail-parties/${user?._id || user?.id}`),
          axiosClient.get('/orders'),
        ]);
        setProfile(partyRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to load retailer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const handleDownloadInvoice = async (orderId, orderNo) => {
    try {
      const response = await axiosClient.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
  };

  const creditLimit = profile?.creditLimit || 0;
  const currentBalance = profile?.currentBalance || 0;
  const availableCredit = Math.max(0, creditLimit - currentBalance);

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: 14,
          padding: '1.5rem 2rem',
          color: '#ffffff',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c7d2fe', textTransform: 'uppercase' }}>
            Wholesale Retailer Portal
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
            {profile?.partyName || 'Retail Customer'}
          </h2>
          <p style={{ color: '#e0e7ff', fontSize: '0.85rem' }}>
            Proprietor: <strong>{profile?.ownerName}</strong> | Route: <strong>{profile?.areaRoute}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/retailer/shop" className="btn btn-primary" style={{ background: '#4f46e5', color: '#ffffff' }}>
            <ShoppingBag size={16} /> Order Innerwear Now
          </Link>
          <Link to="/retailer/ledger" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none' }}>
            <FileText size={16} /> View My Ledger
          </Link>
        </div>
      </div>

      {/* Credit & Balances */}
      <div className="stat-grid">
        <StatCard
          label="Current Outstanding Dues"
          value={`Rs. ${Number(currentBalance).toLocaleString('en-IN')}`}
          icon={CreditCard}
          color={currentBalance > creditLimit ? '#dc2626' : '#d97706'}
          bg={currentBalance > creditLimit ? '#fef2f2' : '#fffbeb'}
        />
        <StatCard
          label="Available Credit Allowance"
          value={`Rs. ${Number(availableCredit).toLocaleString('en-IN')}`}
          icon={Package}
          color="#059669"
          bg="#ecfdf5"
        />
        <StatCard
          label="Approved Credit Limit"
          value={`Rs. ${Number(creditLimit).toLocaleString('en-IN')}`}
          icon={ShoppingBag}
          color="#2563eb"
          bg="#eff6ff"
        />
      </div>

      {/* Active & Recent Orders */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Package size={20} color="#4f46e5" />
            <span>Recent Orders & Live Status</span>
          </div>
          <Link to="/retailer/orders" className="btn btn-secondary btn-sm">
            View All Orders <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Order Date</th>
                <th>Total Items</th>
                <th>Total Value</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                    Loading orders...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    You haven't placed any orders yet. Click "Order Innerwear Now" to browse catalog!
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr key={ord._id}>
                    <td style={{ fontWeight: 700 }}>{ord.orderNo}</td>
                    <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {ord.items.reduce((s, it) => s + it.qty, 0)} pcs
                    </td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      Rs. {Number(ord.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {ord.status === 'Delivered' ? (
                        <button
                          onClick={() => handleDownloadInvoice(ord._id, ord.orderNo)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Download size={14} color="#4f46e5" /> Download Bill
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Available after delivery"
                          disabled
                          style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        >
                          <Download size={14} color="#94a3b8" /> Download Bill
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RetailerDashboard;
