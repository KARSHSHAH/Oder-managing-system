import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const MyLedger = () => {
  const { user } = useAuth();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/payments/party/${user?._id || user?.id}`);
        setLedgerData(res.data);
      } catch (err) {
        console.error('Failed to load my ledger:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchLedger();
    }
  }, [user]);

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
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Account Ledger</h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Chronological record of invoices billed and payments credited to your account
        </p>
      </div>

      {/* Snapshot Cards */}
      {ledgerData?.party && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          <div className="card" style={{ marginBottom: 0, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Opening Balance
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>
              Rs. {Number(ledgerData.party.openingBalance || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 0, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Approved Credit Limit
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>
              Rs. {Number(ledgerData.party.creditLimit || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 0, padding: '1.25rem', borderColor: '#fca5a5' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
              Current Outstanding Balance
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
              Rs. {Number(ledgerData.party.currentBalance || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', margin: 0 }}>
          <div className="card-title">
            <FileText size={20} color="#4f46e5" />
            <span>Statements & Transactions</span>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Payment Mode</th>
                <th>Order / Reference</th>
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
                    Loading transactions...
                  </td>
                </tr>
              ) : !ledgerData || ledgerData.ledger.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No transactions recorded yet
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
                        <code style={{ fontSize: '0.8rem', color: '#4f46e5' }}>
                          {entry.orderNo || entry.referenceNo || '-'}
                        </code>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{entry.remarks}</td>
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
                        {!isDebit && entry.receiptNo ? (
                          <button
                            onClick={() => handleDownloadReceipt(entry._id, entry.receiptNo)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', border: 'none' }}
                          >
                            Download
                          </button>
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
    </div>
  );
};

export default MyLedger;
