import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { Store, MapPin, Phone, Mail, FileText, Shield } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/retail-parties/${user?._id || user?.id}`);
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return <div style={{ padding: '2rem', color: '#64748b' }}>Loading store profile...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Store Profile & Details</h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Registered wholesale account details and billing address
        </p>
      </div>

      <div style={{ maxWidth: 800 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Store size={22} color="#4f46e5" />
              <span>{profile?.partyName}</span>
            </div>
            <span className="badge badge-active">{profile?.status?.toUpperCase()}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>PROPRIETOR NAME</span>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: 2 }}>{profile?.ownerName}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>WHOLESALE LOGIN ID</span>
              <div style={{ marginTop: 2 }}>
                <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontWeight: 700, color: '#4f46e5' }}>
                  {profile?.loginId}
                </code>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>PRIMARY CONTACT</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={15} color="#64748b" /> {profile?.contactNo}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>EMAIL</span>
              <div style={{ fontWeight: 500, fontSize: '0.95rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={15} color="#64748b" /> {profile?.email || 'N/A'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>GSTIN NUMBER</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 2 }}>
                {profile?.gstNo || 'Unregistered'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>PAN NUMBER</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 2 }}>
                {profile?.panNo || 'N/A'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ASSIGNED ROUTE</span>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 2 }}>
                {profile?.areaRoute || 'General'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>CREDIT LIMIT</span>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2, color: '#2563eb' }}>
                Rs. {Number(profile?.creditLimit).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>SHOP & BILLING ADDRESS</span>
            <div style={{ fontWeight: 500, fontSize: '0.95rem', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin size={18} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{profile?.shopAddress || 'Address on file with central warehouse.'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
