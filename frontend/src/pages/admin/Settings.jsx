import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const Settings = () => {
  const [profile, setProfile] = useState({
    businessName: '',
    address: '',
    gstin: '',
    state: '',
    invoicePrefix: 'INV-',
    bankDetails: {
      accountName: '',
      accountNo: '',
      ifsc: '',
      bankName: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get('/settings/business-profile');
      if (res.data.success && res.data.data) {
        setProfile({
          ...res.data.data,
          bankDetails: res.data.data.bankDetails || {
            accountName: '',
            accountNo: '',
            ifsc: '',
            bankName: '',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching profile', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank_')) {
      const field = name.split('_')[1];
      setProfile((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [field]: value },
      }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axiosClient.put('/settings/business-profile', profile);
      if (res.data.success) {
        setMessage('Profile updated successfully!');
      }
    } catch (error) {
      setMessage('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Business Settings</h1>
      {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">General Details</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Business Name</label>
            <input type="text" name="businessName" value={profile.businessName} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GSTIN</label>
            <input type="text" name="gstin" value={profile.gstin} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea name="address" value={profile.address} onChange={handleChange} className="w-full border p-2 rounded" rows="2"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input type="text" name="state" value={profile.state} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Prefix</label>
            <input type="text" name="invoicePrefix" value={profile.invoicePrefix} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Bank Details (For Invoice)</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Account Name</label>
            <input type="text" name="bank_accountName" value={profile.bankDetails.accountName} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Account No</label>
            <input type="text" name="bank_accountNo" value={profile.bankDetails.accountNo} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IFSC Code</label>
            <input type="text" name="bank_ifsc" value={profile.bankDetails.ifsc} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bank Name</label>
            <input type="text" name="bank_bankName" value={profile.bankDetails.bankName} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
