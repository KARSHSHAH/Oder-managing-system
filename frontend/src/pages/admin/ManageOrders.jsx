import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import Modal from '../../components/Modal';
import { Search, Download, Eye, CheckCircle2, Clock, Truck, PackageCheck, Ban } from 'lucide-react';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/orders', {
        params: { status: statusFilter || undefined, search: search || undefined },
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await axiosClient.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Wholesale Orders Management</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Process wholesale dispatch, change status lifecycle & print tax invoices
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
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
              placeholder="Search by Order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.3rem' }}
            />
          </div>

          <div style={{ width: 220 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Order # & Date</th>
                <th>Retail Party</th>
                <th>Booked By</th>
                <th>Items Qty</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Update Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No orders matching criteria
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
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.retailParty?.partyName || 'Retail Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {ord.retailParty?.areaRoute} • {ord.retailParty?.contactNo}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: ord.bookedByRole === 'retailer' ? '#fef3c7' : '#e0e7ff',
                          color: ord.bookedByRole === 'retailer' ? '#b45309' : '#3730a3',
                        }}
                      >
                        {ord.bookedByRole === 'retailer' ? 'Self-Order' : ord.bookedBy?.name || 'Staff'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {ord.items.reduce((sum, it) => sum + it.qty, 0)} Units
                    </td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      Rs. {Number(ord.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td>
                      <select
                        value={ord.status}
                        disabled={updatingId === ord._id}
                        onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 130 }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Packed">Packed</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => openDetails(ord)}
                          className="btn btn-secondary btn-sm"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {ord.status === 'Delivered' ? (
                          <button
                            onClick={() => handleDownloadInvoice(ord._id, ord.orderNo)}
                            className="btn btn-secondary btn-sm"
                            title="Download Invoice PDF"
                          >
                            <Download size={14} color="#2563eb" />
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNo || ''}`}
        maxWidth="750px"
      >
        {selectedOrder && (
          <div>
            {/* Header info */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 10,
                marginBottom: '1.25rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>RETAIL PARTY</span>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {selectedOrder.retailParty?.partyName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {selectedOrder.retailParty?.ownerName} • {selectedOrder.retailParty?.contactNo}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>PAYMENT MODE</span>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {selectedOrder.paymentMode || 'Credit'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Initial Paid: Rs. {selectedOrder.initialPaymentReceived || 0}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STATUS</span>
                <div>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="table-container" style={{ marginBottom: '1.25rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Variant</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{it.productName}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {it.variantDetails || it.variantSku}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{it.qty} {it.unitType || 'Pcs'}</td>
                      <td style={{ textAlign: 'right' }}>Rs. {it.rate}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        Rs. {Number(it.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
                    <td colSpan={4} style={{ textAlign: 'right' }}>Taxable Amount</td>
                    <td style={{ textAlign: 'right' }}>Rs. {Number(selectedOrder.taxableAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  {(selectedOrder.cgstAmount > 0 || selectedOrder.sgstAmount > 0) ? (
                    <>
                      <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
                        <td colSpan={4} style={{ textAlign: 'right' }}>CGST</td>
                        <td style={{ textAlign: 'right' }}>Rs. {Number(selectedOrder.cgstAmount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
                        <td colSpan={4} style={{ textAlign: 'right' }}>SGST</td>
                        <td style={{ textAlign: 'right' }}>Rs. {Number(selectedOrder.sgstAmount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    </>
                  ) : selectedOrder.igstAmount > 0 ? (
                    <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
                      <td colSpan={4} style={{ textAlign: 'right' }}>IGST</td>
                      <td style={{ textAlign: 'right' }}>Rs. {Number(selectedOrder.igstAmount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ) : null}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={4} style={{ textAlign: 'right' }}>Grand Total</td>
                    <td style={{ textAlign: 'right', color: '#2563eb', fontSize: '1.05rem' }}>
                      Rs. {Number(selectedOrder.grandTotal || selectedOrder.totalAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {selectedOrder.notes && (
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                <strong>Booking Notes:</strong> {selectedOrder.notes}
              </div>
            )}

            <div className="modal-footer" style={{ margin: '-1.5rem -1.75rem -1.5rem', padding: '1rem 1.75rem' }}>
              {selectedOrder.status === 'Delivered' ? (
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNo)}
                  className="btn btn-primary btn-sm"
                >
                  <Download size={14} /> Download Tax Invoice PDF
                </button>
              ) : (
                <button
                  disabled
                  className="btn btn-primary btn-sm"
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  title="Available after delivery"
                >
                  <Download size={14} /> Available after delivery
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageOrders;
