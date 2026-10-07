import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal';
import { Plus, UserCheck, Phone, Mail, MapPin, Edit3 } from 'lucide-react';

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    areaAssigned: 'Central Market',
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/auth/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/auth/register-staff', {
        ...formData,
        areaAssigned: [formData.areaAssigned],
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        areaAssigned: 'Central Market',
      });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create staff account');
    }
  };

  const handleToggleStatus = async (staff) => {
    const nextStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await axiosClient.put(`/auth/staff/${staff._id}`, { status: nextStatus });
      fetchStaff();
    } catch (err) {
      alert('Failed to update staff status');
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Staff & Field Executives</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Manage order-booking sales personnel and assigned area routes
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add Staff Account</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ color: '#64748b' }}>Loading staff members...</div>
        ) : staffList.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>No staff members registered yet.</div>
        ) : (
          staffList.map((staff) => (
            <div key={staff._id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                    }}
                  >
                    {staff.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{staff.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                      Sales Executive
                    </span>
                  </div>
                </div>

                <span className={`badge ${staff.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                  {staff.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={15} color="#94a3b8" />
                  <span>{staff.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={15} color="#94a3b8" />
                  <span>{staff.phone || 'No phone'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={15} color="#94a3b8" />
                  <span>Routes: {staff.areaAssigned?.join(', ') || 'All Routes'}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className={`btn btn-sm ${staff.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                  onClick={() => handleToggleStatus(staff)}
                >
                  {staff.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Sales Executive"
        maxWidth="520px"
      >
        <form onSubmit={handleCreateStaff}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Amit Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address (Login Username) *</label>
            <input
              type="email"
              placeholder="e.g. amit@wholesale.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="text"
              placeholder="e.g. 9811223344"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Assigned Area / Delivery Route</label>
            <select
              value={formData.areaAssigned}
              onChange={(e) => setFormData({ ...formData, areaAssigned: e.target.value })}
            >
              <option value="Central Market">Central Market</option>
              <option value="North Zone">North Zone</option>
              <option value="South Market">South Market</option>
              <option value="East Extension">East Extension</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '-1.5rem -1.75rem -1.5rem', padding: '1rem 1.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Staff Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffManagement;
