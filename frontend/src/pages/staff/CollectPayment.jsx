import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { CreditCard, CheckCircle2, DollarSign, History, ArrowRight } from 'lucide-react';

const CollectPayment = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentCollections, setRecentCollections] = useState([]);

  const loadData = async () => {
    try {
      const [partiesRes, paymentsRes] = await Promise.all([
        axiosClient.get('/retail-parties'),
        axiosClient.get('/payments'),
      ]);
      setParties(partiesRes.data);
      if (partiesRes.data.length > 0 && !selectedParty) {
        setSelectedParty(partiesRes.data[0]);
      }
      setRecentCollections(paymentsRes.data);
    } catch (err) {
      console.error('Failed to load payment collection data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePartySelect = (id) => {
    const party = parties.find((p) => p._id === id);
    setSelectedParty(party || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParty) {
      alert('Please choose a retail party');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axiosClient.post('/payments', {
        retailPartyId: selectedParty._id,
        amount: Number(amount),
        mode,
        referenceNo,
        remarks: remarks || `Field payment received via ${mode}`,
      });

      alert(
        `Receipt recorded! Rs. ${amount} collected from ${selectedParty.partyName}. Remaining Balance: Rs. ${res.data.updatedBalance}`
      );

      // Reset
      setAmount('');
      setReferenceNo('');
      setRemarks('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit payment collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateReceipt = async (paymentId) => {
    try {
      await axiosClient.post(`/payments/${paymentId}/generate-receipt`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate receipt');
    }
  };

  const handleDownloadReceipt = async (paymentId, receiptNo) => {
    try {
      const res = await axiosClient.get(`/payments/${paymentId}/receipt`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${receiptNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download receipt');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Collect Field Payment</h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Record payment receipts from retail parties to immediately adjust balance and dues
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Payment Collection Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={20} color="#059669" />
              <span>Record Payment Receipt</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Retail Party *</label>
              <select
                value={selectedParty?._id || ''}
                onChange={(e) => handlePartySelect(e.target.value)}
                style={{ fontWeight: 600 }}
                required
              >
                {parties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.partyName} ({p.areaRoute}) — Bal: Rs. {p.currentBalance}
                  </option>
                ))}
              </select>
            </div>

            {selectedParty && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                    CURRENT OUTSTANDING
                  </span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626' }}>
                    Rs. {Number(selectedParty.currentBalance).toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                    CREDIT LIMIT
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Rs. {Number(selectedParty.creditLimit).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Amount Collected (Rs.) *</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={1}
                style={{ fontSize: '1.1rem', fontWeight: 700 }}
              />
            </div>

            <div className="form-group">
              <label>Payment Mode *</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit">Bank Transfer / NEFT</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reference No. / UPI Transaction ID / Cheque #</label>
              <input
                type="text"
                placeholder="e.g. UPI-987654321 or Cheque #004512"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Remarks / Notes</label>
              <input
                type="text"
                placeholder="e.g. Part payment against Sadar Bazaar order"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            >
              {isSubmitting ? 'Recording...' : 'Submit Payment Collection'}
              {!isSubmitting && <CheckCircle2 size={16} />}
            </button>
          </form>
        </div>

        {/* Recent Collections History */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <History size={20} color="#2563eb" />
              <span>Recent Collections by You</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentCollections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                No payment collections recorded yet today
              </div>
            ) : (
              recentCollections.slice(0, 8).map((pay) => (
                <div
                  key={pay._id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {pay.retailParty?.partyName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Mode: <strong>{pay.mode}</strong> •{' '}
                      {new Date(pay.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '1rem' }}>
                      + Rs. {Number(pay.amount).toLocaleString('en-IN')}
                    </div>
                    {pay.receiptNo ? (
                      <button
                        onClick={() => handleDownloadReceipt(pay._id, pay.receiptNo)}
                        className="btn btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', border: 'none' }}
                      >
                        Download Receipt
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateReceipt(pay._id)}
                        className="btn btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                      >
                        Generate Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectPayment;
