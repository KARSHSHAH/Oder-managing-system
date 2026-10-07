import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/StatCard';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Users,
  ShoppingCart,
  Package,
  ArrowUpRight,
  Download,
} from 'lucide-react';

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, ordersRes, alertsRes] = await Promise.all([
          axiosClient.get('/analytics/overview'),
          axiosClient.get('/orders'),
          axiosClient.get('/analytics/stock-alerts?threshold=10'),
        ]);
        setOverview(ovRes.data);
        setRecentOrders(ordersRes.data.slice(0, 6));
        setStockAlerts(alertsRes.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (loading) {
    return <div style={{ padding: '2rem', color: '#64748b' }}>Loading business overview...</div>;
  }

  return (
    <div>
      {/* KPI Cards */}
      <div className="stat-grid">
        <StatCard
          label="Total Revenue"
          value={`Rs. ${Number(overview?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="#2563eb"
          bg="#eff6ff"
        />
        <StatCard
          label="Outstanding Dues"
          value={`Rs. ${Number(overview?.totalOutstanding || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="#dc2626"
          bg="#fef2f2"
        />
        <StatCard
          label="Active Parties"
          value={overview?.totalPartiesCount || 0}
          icon={Users}
          color="#059669"
          bg="#ecfdf5"
        />
        <StatCard
          label="Pending Orders"
          value={overview?.pendingOrdersCount || 0}
          icon={ShoppingCart}
          color="#d97706"
          bg="#fffbeb"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Recent Orders Table */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <ShoppingCart size={20} color="#2563eb" />
              <span>Recent Orders</span>
            </div>
            <Link to="/admin/orders" className="btn btn-secondary btn-sm">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Retail Party</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord._id}>
                      <td style={{ fontWeight: 600 }}>{ord.orderNo}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{ord.retailParty?.partyName || 'Retail Customer'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ord.retailParty?.areaRoute}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>Rs. {ord.totalAmount.toLocaleString('en-IN')}</td>
                      <td>
                        <OrderStatusBadge status={ord.status} />
                      </td>
                      <td>
                        {ord.status === 'Delivered' ? (
                          <button
                            onClick={() => handleDownloadInvoice(ord._id, ord.orderNo)}
                            className="btn btn-secondary btn-sm"
                            title="Download Invoice"
                          >
                            <Download size={14} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Available after delivery"
                            disabled
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                          >
                            <Download size={14} color="#94a3b8" />
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

        {/* Low Stock Alerts */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title" style={{ color: '#dc2626' }}>
              <AlertCircle size={20} />
              <span>Stock Radar</span>
            </div>
            <Link to="/admin/products" className="btn btn-secondary btn-sm">
              Manage
            </Link>
          </div>

          {stockAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#059669', fontSize: '0.9rem' }}>
              All inventory levels are healthy!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stockAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    background: alert.isCritical ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${alert.isCritical ? '#fee2e2' : '#fef3c7'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                      {alert.productName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      SKU: {alert.sku} {alert.size ? `(${alert.size})` : ''}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: alert.isCritical ? '#dc2626' : '#d97706',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    {alert.stockQty} left
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
