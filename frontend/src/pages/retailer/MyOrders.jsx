import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { Download, Search, PackageCheck } from 'lucide-react';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/orders', {
        params: { search: search || undefined },
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load my orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

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

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Wholesale Orders</h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Track dispatch progression and download GST tax invoices
        </p>
      </div>

      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          >
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.3rem' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Order # & Date</th>
                <th>Items Ordered</th>
                <th>Total Units</th>
                <th>Order Value</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Tax Bill</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading your orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ord.orderNo}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {ord.items.map((it, i) => (
                          <div key={i}>
                            {it.productName} ({it.variantDetails || it.variantSku}) × {it.qty} {it.unitType || 'Pcs'}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {ord.items.reduce((s, it) => s + it.qty, 0)} Units
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
                          title="Download Tax Invoice"
                        >
                          <Download size={14} color="#4f46e5" /> PDF
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Available after delivery"
                          disabled
                          style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        >
                          <Download size={14} color="#94a3b8" /> PDF
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

export default MyOrders;
