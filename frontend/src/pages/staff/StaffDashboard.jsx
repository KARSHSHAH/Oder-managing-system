import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  DollarSign,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  MapPin,
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, partiesRes] = await Promise.all([
          axiosClient.get('/orders'),
          axiosClient.get('/retail-parties'),
        ]);
        setOrders(ordersRes.data);
        setParties(partiesRes.data);
      } catch (err) {
        console.error('Failed to load staff dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalBookedValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
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
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a7f3d0', textTransform: 'uppercase' }}>
            Field Sales Portal
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
            Welcome, {user?.name}!
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: '#d1fae5', fontSize: '0.85rem' }}>
            <MapPin size={16} />
            <span>Assigned Routes: {user?.areaAssigned?.join(', ') || 'General Route'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/staff/book-order" className="btn btn-primary" style={{ background: '#ffffff', color: '#065f46' }}>
            <Plus size={16} /> Book New Order
          </Link>
          <Link to="/staff/collect-payment" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
            <CreditCard size={16} /> Collect Payment
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <StatCard
          label="Total Orders Booked"
          value={orders.length}
          icon={ShoppingCart}
          color="#059669"
          bg="#ecfdf5"
        />
        <StatCard
          label="Total Booking Value"
          value={`Rs. ${Number(totalBookedValue).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="#2563eb"
          bg="#eff6ff"
        />
        <StatCard
          label="Assigned Retail Parties"
          value={parties.length}
          icon={Users}
          color="#7c3aed"
          bg="#f5f3ff"
        />
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShoppingCart size={20} color="#059669" />
            <span>My Recent Bookings</span>
          </div>
          <Link to="/staff/orders" className="btn btn-secondary btn-sm">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Retail Party</th>
                <th>Items</th>
                <th>Order Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    You haven't booked any orders yet today.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((ord) => (
                  <tr key={ord._id}>
                    <td style={{ fontWeight: 700 }}>{ord.orderNo}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.retailParty?.partyName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ord.retailParty?.ownerName}</div>
                    </td>
                    <td>{ord.items.reduce((s, it) => s + it.qty, 0)} pcs</td>
                    <td style={{ fontWeight: 800 }}>Rs. {Number(ord.totalAmount).toLocaleString('en-IN')}</td>
                    <td>
                      <OrderStatusBadge status={ord.status} />
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

export default StaffDashboard;
