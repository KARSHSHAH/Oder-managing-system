import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal';
import { CreditCard, Plus, ArrowDownRight, ArrowUpRight, Search, FileText } from 'lucide-react';

const FinancialLedger = () => {
  const [parties, setParties] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manual payment modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payFormData, setPayFormData] = useState({
    amount: '',
    mode: 'Cash',
    referenceNo: '',
    remarks: '',
  });

  // Load parties for dropdown
  useEffect(() => {
    const loadParties = async () => {
      try {
        const res = await axiosClient.get('/retail-parties');
        setParties(res.data);
        if (res.data.length > 0) {
          setSelectedPartyId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load parties:', err);
      }
    };
    loadParties();
  }, []);

  const fetchLedger = async (partyId) => {
    if (!partyId) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`/payments/party/${partyId}`);
      setLedgerData(res.data);
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPartyId) {
      fetchLedger(selectedPartyId);
    }
  }, [selectedPartyId]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/payments', {
        retailPartyId: selectedPartyId,
        ...payFormData,
      });
      setIsPayModalOpen(false);
      setPayFormData({ amount: '', mode: 'Cash', referenceNo: '', remarks: '' });
      fetchLedger(selectedPartyId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };
  const handleGenerateReceipt = async (paymentId) => {
    try {
      await axiosClient.post(`/payments/${paymentId}/generate-receipt`);
      fetchLedger(selectedPartyId);
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Party Ledgers & Payments</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Complete audit trail of debits (order billings) and credits (payments received)
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsPayModalOpen(true)}
          disabled={!selectedPartyId}
        >
          <Plus size={18} />
          <span>Record Payment Received</span>
        </button>
      </div>

      {/* Select Party Dropdown */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
            Select Retail Party:
          </label>
          <div style={{ flex: 1, minWidth: 280, maxWidth: 450 }}>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.partyName} ({p.areaRoute}) — Bal: Rs. {p.currentBalance}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Party Balance Snapshot */}
      {ledgerData?.party && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div className="card" style={{ marginBottom: 0, padding: '1.1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Opening Balance
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>
              Rs. {Number(ledgerData.party.openingBalance || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 0, padding: '1.1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Credit Limit
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>
              Rs. {Number(ledgerData.party.creditLimit || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 0, padding: '1.1rem', borderColor: '#fca5a5' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
              Current Outstanding Balance
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
              Rs. {Number(ledgerData.party.currentBalance || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Running Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', margin: 0 }}>
          <div className="card-title">
            <FileText size={20} color="#2563eb" />
            <span>Transaction Ledger History</span>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Payment Mode</th>
                <th>Order / Ref #</th>
                <th>Remarks</th>
                <th style={{ textAlign: 'right' }}>Debit (Billed)</th>
                <th style={{ textAlign: 'right' }}>Credit (Paid)</th>
                <th style={{ textAlign: 'right' }}>Running Balance</th>
                <th style={{ textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading party transactions...
                  </td>
                </tr>
              ) : !ledgerData || ledgerData.ledger.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No transactions recorded for this party yet
                  </td>
                </tr>
              ) : (
                ledgerData.ledger.map((entry) => {
                  const isDebit = entry.type === 'Debit';
                  return (
                    <tr key={entry._id}>
                      <td style={{ color: '#475569', fontSize: '0.82rem' }}>
                        {new Date(entry.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isDebit ? '#fee2e2' : '#dcfce7',
                            color: isDebit ? '#b91c1c' : '#15803d',
                          }}
                        >
                          {isDebit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {entry.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{entry.mode}</td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: '#2563eb' }}>
                          {entry.orderNo || entry.referenceNo || '-'}
                        </code>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                        {entry.remarks}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                        {isDebit ? `Rs. ${Number(entry.amount).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        {!isDebit ? `Rs. ${Number(entry.amount).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.92rem' }}>
                        Rs. {Number(entry.runningBalance).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!isDebit ? (
                          entry.receiptNo ? (
                            <button
                              onClick={() => handleDownloadReceipt(entry._id, entry.receiptNo)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', border: 'none' }}
                            >
                              Download
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGenerateReceipt(entry._id)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Generate
                            </button>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment for: ${ledgerData?.party?.partyName || 'Retail Party'}`}
        maxWidth="500px"
      >
        <form onSubmit={handlePaymentSubmit}>
          <div className="form-group">
            <label>Amount Collected (Rs.) *</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={payFormData.amount}
              onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
              required
              min={1}
            />
          </div>

          <div className="form-group">
            <label>Payment Mode *</label>
            <select
              value={payFormData.mode}
              onChange={(e) => setPayFormData({ ...payFormData, mode: e.target.value })}
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / QR Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit">Bank Transfer / NEFT</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reference No. / UPI Txn ID / Cheque #</label>
            <input
              type="text"
              placeholder="e.g. UPI-12345678"
              value={payFormData.referenceNo}
              onChange={(e) => setPayFormData({ ...payFormData, referenceNo: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Cleared Sadar Bazaar bill"
              value={payFormData.remarks}
              onChange={(e) => setPayFormData({ ...payFormData, remarks: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '-1.5rem -1.75rem -1.5rem', padding: '1rem 1.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPayModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Payment Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FinancialLedger;
