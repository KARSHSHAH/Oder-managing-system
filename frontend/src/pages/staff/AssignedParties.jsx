import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Store, Phone, MapPin, ShoppingCart, CreditCard, Search } from 'lucide-react';

const AssignedParties = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/retail-parties', {
        params: { search: search || undefined },
      });
      setParties(res.data);
    } catch (err) {
      console.error('Failed to load assigned parties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [search]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Assigned Retail Parties</h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Stores and accounts in your designated delivery routes
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
            placeholder="Search party or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.3rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ color: '#64748b' }}>Loading assigned parties...</div>
        ) : parties.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>No parties found matching criteria.</div>
        ) : (
          parties.map((party) => {
            const isOverCredit = party.currentBalance > party.creditLimit;
            return (
              <div key={party._id} className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                      {party.partyName}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Prop: <strong>{party.ownerName}</strong>
                    </div>
                  </div>
                  <span
                    style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {party.areaRoute}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} color="#94a3b8" />
                    <span>{party.contactNo}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#94a3b8" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {party.shopAddress || 'Local Market'}
                    </span>
                  </div>
                </div>

                {/* Balances */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: 8,
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>OUTSTANDING</span>
                    <div style={{ fontWeight: 800, color: isOverCredit ? '#dc2626' : '#b45309', fontSize: '1rem' }}>
                      Rs. {Number(party.currentBalance).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>CREDIT LIMIT</span>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      Rs. {Number(party.creditLimit).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/staff/book-order')}
                  >
                    <ShoppingCart size={14} /> Book Order
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/staff/collect-payment')}
                  >
                    <CreditCard size={14} /> Collect Cash
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssignedParties;
