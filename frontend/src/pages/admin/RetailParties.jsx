import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal';
import { Plus, Search, Store, Edit2, ShieldAlert, CheckCircle2, Copy } from 'lucide-react';

const RetailParties = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [newCredentials, setNewCredentials] = useState(null);

  // OTP States
  const [otpChannel, setOtpChannel] = useState('mobile');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [formData, setFormData] = useState({
    partyName: '',
    ownerName: '',
    shopAddress: '',
    contactNo: '',
    altContactNo: '',
    email: '',
    gstNo: '',
    panNo: '',
    areaRoute: 'Central Market',
    creditLimit: 50000,
    openingBalance: 0,
    status: 'active',
  });

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/retail-parties', {
        params: { search: search || undefined, area: selectedArea || undefined },
      });
      setParties(res.data);
    } catch (err) {
      console.error('Failed to fetch retail parties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [search, selectedArea]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset verification if the verified identifier changes
    if ((name === 'contactNo' && otpChannel === 'mobile') || (name === 'email' && otpChannel === 'email')) {
      setIsOtpVerified(false);
    }
  };

  const handleSendOtp = async () => {
    const identifier = otpChannel === 'mobile' ? formData.contactNo : formData.email;
    if (!identifier) {
      return alert(`Please enter ${otpChannel === 'mobile' ? 'Contact Number' : 'Email'} first.`);
    }
    try {
      setIsSendingOtp(true);
      await axiosClient.post('/otp/send', { identifier, channel: otpChannel });
      alert('OTP sent successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const identifier = otpChannel === 'mobile' ? formData.contactNo : formData.email;
    if (!otpCode) return alert('Please enter OTP');
    try {
      setIsVerifyingOtp(true);
      await axiosClient.post('/otp/verify', { identifier, otp: otpCode });
      setIsOtpVerified(true);
      alert('OTP Verified Successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/retail-parties', formData);
      setIsAddModalOpen(false);
      setNewCredentials(res.data.party);
      fetchParties();
      // Reset form
      setFormData({
        partyName: '',
        ownerName: '',
        shopAddress: '',
        contactNo: '',
        altContactNo: '',
        email: '',
        gstNo: '',
        panNo: '',
        areaRoute: 'Central Market',
        creditLimit: 50000,
        openingBalance: 0,
        status: 'active',
      });
      setIsOtpVerified(false);
      setOtpCode('');
      setOtpChannel('mobile');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create party');
    }
  };

  const handleEditClick = (party) => {
    setEditingParty(party);
    setFormData({
      partyName: party.partyName,
      ownerName: party.ownerName,
      shopAddress: party.shopAddress || '',
      contactNo: party.contactNo,
      altContactNo: party.altContactNo || '',
      email: party.email || '',
      gstNo: party.gstNo || '',
      panNo: party.panNo || '',
      areaRoute: party.areaRoute,
      creditLimit: party.creditLimit,
      status: party.status,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/retail-parties/${editingParty._id}`, formData);
      setIsEditModalOpen(false);
      setEditingParty(null);
      fetchParties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update party');
    }
  };

  const handleToggleStatus = async (party) => {
    const nextStatus = party.status === 'blocked' ? 'active' : 'blocked';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'blocked' ? 'BLOCK' : 'UNBLOCK'} ${party.partyName}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await axiosClient.put(`/retail-parties/${party._id}`, { status: nextStatus });
      fetchParties();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change status');
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Retail Parties Directory</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Manage registered B2B retailer accounts, credit allowances & outstanding dues
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          <span>Add Retail Party</span>
        </button>
      </div>

      {/* Generated Credentials Callout */}
      {newCredentials && (
        <div
          className="alert alert-info"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem',
          }}
        >
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: 4 }}>
              🎉 Retail Party Registered! Share Credentials with Customer:
            </strong>
            <div style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>
              Party: <strong>{newCredentials.partyName}</strong> | Login ID: <strong>{newCredentials.loginId}</strong> | Temporary Password: <strong>{newCredentials.temporaryPassword}</strong>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              navigator.clipboard.writeText(
                `Undergarments OMS Login:\nParty: ${newCredentials.partyName}\nLogin ID: ${newCredentials.loginId}\nPassword: ${newCredentials.temporaryPassword}`
              );
              alert('Credentials copied to clipboard!');
            }}
          >
            <Copy size={15} /> Copy Info
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
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
              placeholder="Search by party name, owner, contact, login ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.3rem' }}
            />
          </div>

          <div style={{ width: 220 }}>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="">All Area / Routes</option>
              <option value="Central Market">Central Market</option>
              <option value="North Zone">North Zone</option>
              <option value="South Market">South Market</option>
              <option value="East Extension">East Extension</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parties Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Party & Owner</th>
                <th>Login ID</th>
                <th>Contact</th>
                <th>Area / Route</th>
                <th>Credit Limit</th>
                <th>Current Balance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading retail parties...
                  </td>
                </tr>
              ) : parties.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No retail parties found. Click "+ Add Retail Party" to create one.
                  </td>
                </tr>
              ) : (
                parties.map((p) => {
                  const isOverCredit = p.currentBalance > p.creditLimit;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.partyName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Prop: {p.ownerName}</div>
                      </td>
                      <td>
                        <code
                          style={{
                            background: '#f1f5f9',
                            padding: '3px 6px',
                            borderRadius: 4,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#2563eb',
                          }}
                        >
                          {p.loginId}
                        </code>
                      </td>
                      <td>
                        <div>{p.contactNo}</div>
                        {p.email && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.email}</div>}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontWeight: 500,
                          }}
                        >
                          {p.areaRoute || 'General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        Rs. {Number(p.creditLimit).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: isOverCredit ? '#dc2626' : p.currentBalance > 0 ? '#b45309' : '#15803d',
                          }}
                        >
                          Rs. {Number(p.currentBalance).toLocaleString('en-IN')}
                        </span>
                        {isOverCredit && (
                          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>
                            Over Credit Limit!
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'active'
                              ? 'badge-active'
                              : p.status === 'blocked'
                              ? 'badge-blocked'
                              : 'badge-inactive'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => handleEditClick(p)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Details"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`btn btn-sm ${p.status === 'blocked' ? 'btn-success' : 'btn-danger'}`}
                            title={p.status === 'blocked' ? 'Unblock Party' : 'Block Party'}
                          >
                            {p.status === 'blocked' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Party Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsOtpVerified(false);
          setOtpCode('');
        }}
        title="Add New Retail Party"
        maxWidth="700px"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Party / Shop Name *</label>
              <input
                type="text"
                name="partyName"
                placeholder="e.g. Modern Undergarments Store"
                value={formData.partyName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Owner / Proprietor Name *</label>
              <input
                type="text"
                name="ownerName"
                placeholder="e.g. Rajesh Khurana"
                value={formData.ownerName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="text"
                name="contactNo"
                placeholder="e.g. 9812345678"
                value={formData.contactNo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Alternate Contact</label>
              <input
                type="text"
                name="altContactNo"
                placeholder="e.g. Landline or Secondary"
                value={formData.altContactNo}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="e.g. contact@party.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            {/* OTP Verification Section */}
            <div className="form-group" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>OTP Verification *</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Channel</label>
                  <select 
                    value={otpChannel} 
                    onChange={e => { 
                      setOtpChannel(e.target.value); 
                      setIsOtpVerified(false); 
                      setOtpCode(''); 
                    }} 
                    disabled={isOtpVerified}
                  >
                    <option value="mobile">Mobile (SMS)</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                
                {!isOtpVerified && (
                  <button type="button" className="btn btn-secondary" onClick={handleSendOtp} disabled={isSendingOtp}>
                    {isSendingOtp ? 'Sending...' : 'Send OTP'}
                  </button>
                )}

                {!isOtpVerified && (
                  <>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Enter OTP</label>
                      <input 
                        type="text" 
                        value={otpCode} 
                        onChange={e => setOtpCode(e.target.value)} 
                        placeholder="6-digit code"
                      />
                    </div>
                    <button type="button" className="btn btn-primary" onClick={handleVerifyOtp} disabled={isVerifyingOtp || !otpCode}>
                      {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                    </button>
                  </>
                )}

                {isOtpVerified && (
                  <div style={{ flex: 1, color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} /> Verified ({otpChannel === 'mobile' ? formData.contactNo : formData.email})
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Area / Delivery Route</label>
              <select
                name="areaRoute"
                value={formData.areaRoute}
                onChange={handleInputChange}
              >
                <option value="Central Market">Central Market</option>
                <option value="North Zone">North Zone</option>
                <option value="South Market">South Market</option>
                <option value="East Extension">East Extension</option>
                <option value="General">General / Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>GST Number</label>
              <input
                type="text"
                name="gstNo"
                placeholder="e.g. 07AAAAA0000A1Z5"
                value={formData.gstNo}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>PAN Number</label>
              <input
                type="text"
                name="panNo"
                placeholder="e.g. ABCDE1234F"
                value={formData.panNo}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Credit Limit (Rs.)</label>
              <input
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleInputChange}
                min={0}
              />
            </div>

            <div className="form-group">
              <label>Opening Outstanding Balance (Rs.)</label>
              <input
                type="number"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Shop & Delivery Address</label>
            <textarea
              name="shopAddress"
              rows={2}
              placeholder="Full shop address, market lane, landmark..."
              value={formData.shopAddress}
              onChange={handleInputChange}
            />
          </div>

          <div
            style={{
              padding: '0.85rem',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.8rem',
              color: '#64748b',
              marginBottom: '1.25rem',
            }}
          >
            ℹ️ Login ID and temporary password will be automatically generated upon creation.
          </div>

          <div className="modal-footer" style={{ margin: '-1.5rem -1.75rem -1.5rem', padding: '1rem 1.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!isOtpVerified}>
              Create Retail Party
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Party Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Party: ${editingParty?.partyName || ''}`}
        maxWidth="700px"
      >
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Party Name</label>
              <input
                type="text"
                name="partyName"
                value={formData.partyName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Contact No</label>
              <input
                type="text"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Area Route</label>
              <select
                name="areaRoute"
                value={formData.areaRoute}
                onChange={handleInputChange}
              >
                <option value="Central Market">Central Market</option>
                <option value="North Zone">North Zone</option>
                <option value="South Market">South Market</option>
                <option value="East Extension">East Extension</option>
                <option value="General">General / Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Credit Limit (Rs.)</label>
              <input
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Account Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Shop Address</label>
            <textarea
              name="shopAddress"
              rows={2}
              value={formData.shopAddress}
              onChange={handleInputChange}
            />
          </div>

          <div className="modal-footer" style={{ margin: '-1.5rem -1.75rem -1.5rem', padding: '1rem 1.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RetailParties;
