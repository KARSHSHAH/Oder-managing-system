import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  Award,
  DollarSign,
  AlertOctagon,
  UserCheck,
  Percent,
  Send,
  Calendar,
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState('daily');
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [partyRanking, setPartyRanking] = useState([]);
  const [outstandingDues, setOutstandingDues] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [staffPerf, setStaffPerf] = useState([]);
  const [profitMargins, setProfitMargins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [trendRes, topProdRes, rankRes, duesRes, alertsRes, staffRes, marginRes] =
        await Promise.all([
          axiosClient.get(`/analytics/sales-trend?period=${period}`),
          axiosClient.get('/analytics/top-products'),
          axiosClient.get('/analytics/party-ranking'),
          axiosClient.get('/analytics/outstanding-dues'),
          axiosClient.get('/analytics/stock-alerts?threshold=15'),
          axiosClient.get('/analytics/staff-performance'),
          axiosClient.get('/analytics/profit-margin'),
        ]);

      setSalesTrend(trendRes.data);
      setTopProducts(topProdRes.data);
      setPartyRanking(rankRes.data);
      setOutstandingDues(duesRes.data);
      setStockAlerts(alertsRes.data);
      setStaffPerf(staffRes.data);
      setProfitMargins(marginRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleSendReminder = (party) => {
    alert(
      `Payment reminder SMS/WhatsApp simulated for ${party.partyName} (Contact: ${party.contactNo}) for outstanding dues of Rs. ${party.currentBalance}!`
    );
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#64748b' }}>Crunching wholesale analytics data...</div>;
  }

  const totalEstimatedProfit = profitMargins.reduce((sum, item) => sum + (item.estimatedProfit || 0), 0);

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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Business Analytics & Intelligence</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Comprehensive revenue tracking, margins, client rankings & inventory health
          </p>
        </div>

        {/* Period Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: period === p ? '#ffffff' : 'transparent',
                color: period === p ? '#2563eb' : '#64748b',
                boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top Banner: Profit Margin Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          borderRadius: 14,
          padding: '1.5rem 2rem',
          color: '#ffffff',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#bfdbfe', textTransform: 'uppercase' }}>
            Aggregated Net Wholesale Margin
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
            Rs. {Number(totalEstimatedProfit).toLocaleString('en-IN')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#e0f2fe' }}>
            Derived from actual item sales: (Wholesale Rate - Base Cost Price) × Sold Units
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px 18px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>Top Performing Category</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Men's Vests & Briefs</div>
          </div>
        </div>
      </div>

      {/* 1. Sales Trend Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={20} color="#2563eb" />
            <span>Sales Revenue Trend ({period.toUpperCase()})</span>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          {salesTrend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              No order data for selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `Rs.${val}`} />
                <Tooltip
                  formatter={(val) => [`Rs. ${Number(val).toLocaleString('en-IN')}`, 'Sales Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: 8, color: '#fff', border: 'none' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Top Products & Party Ranking Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Top Products */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <Award size={20} color="#f59e0b" />
              <span>Top-Selling Products</span>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th style={{ textAlign: 'right' }}>Qty Sold</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No sales recorded yet
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ color: '#64748b', fontSize: '0.78rem' }}>{p.variantDetails || p.variantSku}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{p.qty} pcs</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        Rs. {Number(p.revenue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Party Rankings */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <DollarSign size={20} color="#10b981" />
              <span>Retail Party Sales Ranking</span>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Rank & Party</th>
                  <th>Area</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {partyRanking.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No party ranking data
                    </td>
                  </tr>
                ) : (
                  partyRanking.map((party, idx) => (
                    <tr key={party._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: idx === 0 ? '#fef3c7' : '#f1f5f9',
                              color: idx === 0 ? '#b45309' : '#64748b',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <span style={{ fontWeight: 700 }}>{party.partyName}</span>
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{party.areaRoute}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{party.ordersCount}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                        Rs. {Number(party.totalPurchased).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Outstanding Dues with Reminder & Staff Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Outstanding Dues */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <AlertOctagon size={20} color="#dc2626" />
              <span>Outstanding Dues (Credit Warning)</span>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Retail Party</th>
                  <th>Credit Limit</th>
                  <th style={{ textAlign: 'right' }}>Outstanding</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {outstandingDues.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: '#15803d' }}>
                      All retail accounts have zero outstanding balance!
                    </td>
                  </tr>
                ) : (
                  outstandingDues.map((p) => {
                    const isOver = p.currentBalance > p.creditLimit;
                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.partyName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.contactNo}</div>
                        </td>
                        <td>Rs. {Number(p.creditLimit).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: isOver ? '#dc2626' : '#b45309' }}>
                          Rs. {Number(p.currentBalance).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleSendReminder(p)}
                            className="btn btn-secondary btn-sm"
                            title="Send WhatsApp/SMS Reminder"
                            style={{ color: '#2563eb' }}
                          >
                            <Send size={12} /> Remind
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <UserCheck size={20} color="#2563eb" />
              <span>Staff Booking & Collection Output</span>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Sales Staff</th>
                  <th style={{ textAlign: 'right' }}>Orders Booked</th>
                  <th style={{ textAlign: 'right' }}>Orders Value</th>
                  <th style={{ textAlign: 'right' }}>Cash Collected</th>
                </tr>
              </thead>
              <tbody>
                {staffPerf.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No staff performance data
                    </td>
                  </tr>
                ) : (
                  staffPerf.map((s) => (
                    <tr key={s.staffId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.areas?.join(', ')}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{s.ordersBooked}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        Rs. {Number(s.totalOrderValue).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                        Rs. {Number(s.totalCollected).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Product Profit Margin Breakdown */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Percent size={20} color="#10b981" />
            <span>Product Profit Margin Analysis (Wholesale Rate vs Cost Price)</span>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Product Line</th>
                <th style={{ textAlign: 'right' }}>Total Units Sold</th>
                <th style={{ textAlign: 'right' }}>Wholesale Revenue</th>
                <th style={{ textAlign: 'right' }}>Total Base Cost</th>
                <th style={{ textAlign: 'right' }}>Net Wholesale Profit</th>
                <th style={{ textAlign: 'right' }}>Gross Margin %</th>
              </tr>
            </thead>
            <tbody>
              {profitMargins.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No product margin data available yet
                  </td>
                </tr>
              ) : (
                profitMargins.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{item.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.qtySold} pcs</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      Rs. {Number(item.revenue).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>
                      Rs. {Number(item.cost).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                      Rs. {Number(item.estimatedProfit).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          background: '#ecfdf5',
                          color: '#059669',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {Number(item.marginPercentage).toFixed(1)}%
                      </span>
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

export default AnalyticsDashboard;
