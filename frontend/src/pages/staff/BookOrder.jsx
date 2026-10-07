import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Package,
} from 'lucide-react';

const BookOrder = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Cart state: array of { productId, productName, variantSku, variantDetails, qty, rate, maxStock }
  const [cart, setCart] = useState([]);
  const [paymentMode, setPaymentMode] = useState('Credit');
  const [initialPayment, setInitialPayment] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [partiesRes, prodsRes] = await Promise.all([
          axiosClient.get('/retail-parties'),
          axiosClient.get('/products'),
        ]);
        setParties(partiesRes.data);
        if (partiesRes.data.length > 0) {
          setSelectedParty(partiesRes.data[0]);
        }
        setProducts(prodsRes.data);
      } catch (err) {
        console.error('Failed to load booking data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handlePartyChange = (partyId) => {
    const party = parties.find((p) => p._id === partyId);
    setSelectedParty(party || null);
  };

  const addToCart = (product, variant) => {
    if (variant.stockQty <= 0) {
      alert('This variant is currently out of stock!');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.variantSku === variant.sku);
      if (existing) {
        if (existing.qty >= variant.stockQty) {
          alert(`Cannot add more. Available stock limit reached (${variant.stockQty} pcs).`);
          return prev;
        }
        return prev.map((item) =>
          item.variantSku === variant.sku ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            productName: product.name,
            brand: product.brand,
            variantSku: variant.sku,
            variantDetails: [variant.size ? `Size: ${variant.size}` : '', variant.color ? `Color: ${variant.color}` : '']
              .filter(Boolean)
              .join(', '),
            qty: 1,
            unitType: variant.unitType || 'Pcs',
            packSize: variant.packSize || 1,
            rate: variant.wholesaleRate,
            maxStock: variant.stockQty,
          },
        ];
      }
    });
  };

  const updateCartQty = (sku, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantSku === sku) {
            const nextQty = item.qty + delta;
            if (nextQty > item.maxStock) {
              alert(`Only ${item.maxStock} pieces available in inventory`);
              return item;
            }
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (sku) => {
    setCart((prev) => prev.filter((item) => item.variantSku !== sku));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const totalPcs = cart.reduce((sum, item) => sum + item.qty, 0);

  // Credit calculation
  const currentBal = selectedParty ? selectedParty.currentBalance : 0;
  const creditLimit = selectedParty ? selectedParty.creditLimit : 0;
  const projectedBalance = currentBal + cartTotal - (Number(initialPayment) || 0);
  const isCreditExceeded = projectedBalance > creditLimit;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!selectedParty) {
      alert('Please select a retail party');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty. Add products to book order.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axiosClient.post('/orders', {
        retailPartyId: selectedParty._id,
        items: cart,
        paymentMode,
        initialPayment: Number(initialPayment) || 0,
        notes,
      });

      alert(`Order #${res.data.orderNo} successfully booked for ${selectedParty.partyName}!`);
      navigate('/staff/orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = categoryFilter ? p.category === categoryFilter : true;
    const matchSearch = search
      ? p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()))
      : true;
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Book Order for Retail Party</h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Select registered store, verify live stock & record payment terms
        </p>
      </div>

      {/* 1. Retail Party Selector & Live Credit Warning */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
          <div className="card-title">
            <span>Step 1: Select Retail Party</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Target Retail Account:
            </label>
            <select
              value={selectedParty?._id || ''}
              onChange={(e) => handlePartyChange(e.target.value)}
              style={{ fontWeight: 600, fontSize: '0.95rem' }}
            >
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.partyName} ({p.areaRoute}) — Prop: {p.ownerName}
                </option>
              ))}
            </select>
          </div>

          {selectedParty && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                background: '#f8fafc',
                padding: '0.75rem 1.25rem',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>CREDIT LIMIT</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  Rs. {Number(selectedParty.creditLimit).toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>CURRENT OUTSTANDING</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: selectedParty.currentBalance > 0 ? '#b45309' : '#059669' }}>
                  Rs. {Number(selectedParty.currentBalance).toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>AVAILABLE CREDIT</span>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: selectedParty.creditLimit - selectedParty.currentBalance < 0 ? '#dc2626' : '#2563eb',
                  }}
                >
                  Rs. {Math.max(0, selectedParty.creditLimit - selectedParty.currentBalance).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Credit Limit Warning Banner */}
        {selectedParty && isCreditExceeded && (
          <div
            className="alert alert-warning"
            style={{ marginTop: '1rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <AlertTriangle size={20} color="#b45309" />
            <div>
              <strong>Credit Limit Warning:</strong> Adding this order (Rs. {cartTotal}) will cause{' '}
              <strong>{selectedParty.partyName}</strong>'s balance to reach{' '}
              <strong>Rs. {projectedBalance.toLocaleString('en-IN')}</strong>, exceeding their credit limit of{' '}
              <strong>Rs. {creditLimit.toLocaleString('en-IN')}</strong>! Collect partial upfront payment or obtain admin approval.
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Booking Split: Product Catalog Browser + Cart Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Product Catalog */}
        <div>
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                >
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search undergarments by name, brand, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ width: 160 }}>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="">All Categories</option>
                  <option value="Bra">Bra</option>
                  <option value="Brief">Brief</option>
                  <option value="Vest">Vest</option>
                  <option value="Trunk">Trunk</option>
                  <option value="Bloomers">Bloomers</option>
                  <option value="Camisole">Camisole</option>
                  <option value="Thermal">Thermal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', color: '#64748b' }}>Loading available inventory...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                No undergarment products match your filter
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div key={p._id} className="card" style={{ marginBottom: 0, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</h4>
                      <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                        {p.brand} • <span style={{ color: '#64748b' }}>{p.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Variants Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                    {p.variants.map((v) => {
                      const isOutOfStock = v.stockQty <= 0;
                      return (
                        <div
                          key={v.sku}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            padding: '8px 10px',
                            background: isOutOfStock ? '#f8fafc' : '#ffffff',
                            opacity: isOutOfStock ? 0.6 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                              {[v.size, v.color].filter(Boolean).join(' - ') || 'Standard'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>SKU: {v.sku}</div>
                            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                                Rs. {v.wholesaleRate}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  color: v.stockQty <= 10 ? '#dc2626' : '#059669',
                                }}
                              >
                                {v.stockQty} {v.unitType || 'Pcs'} in stock
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={isOutOfStock}
                            onClick={() => addToCart(p, v)}
                            style={{ marginTop: 8, width: '100%', fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            <Plus size={12} /> {isOutOfStock ? 'Sold Out' : `Add ${v.unitType || 'Pcs'}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Order Cart & Checkout Summary */}
        <div style={{ position: 'sticky', top: 90 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShoppingCart size={20} color="#2563eb" />
                <span>Order Cart ({totalPcs} Units)</span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <Package size={40} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.9rem' }}>Cart is currently empty.</p>
                <span style={{ fontSize: '0.75rem' }}>Click "Add to Order" on products to populate items.</span>
              </div>
            ) : (
              <div>
                {/* Cart Items List */}
                <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: '1rem' }}>
                  {cart.map((item) => (
                    <div
                      key={item.variantSku}
                      style={{
                        padding: '8px 0',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {item.variantDetails || item.variantSku} @ Rs. {item.rate} / {item.unitType || 'Pcs'}
                        </div>
                      </div>

                      {/* Quantity adjuster */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.variantSku, -1)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: 20, textAlign: 'center' }}>
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.variantSku, 1)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.88rem', minWidth: 65, textAlign: 'right' }}>
                        Rs. {item.qty * item.rate}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.variantSku)}
                        style={{ color: '#ef4444', padding: 2 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Subtotals */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 8, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span>Total Quantity:</span>
                    <strong>{totalPcs} Units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>
                    <span>Order Total:</span>
                    <span>Rs. {Number(cartTotal).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment Mode & Collection at Booking */}
                <form onSubmit={handleSubmitOrder}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label>Payment Mode *</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="Credit">Credit (Add to Ledger)</option>
                      <option value="Cash">Cash on Booking</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label>Initial Payment Collected (Rs.)</label>
                    <input
                      type="number"
                      placeholder="e.g. 2000 (leave 0 if full credit)"
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(e.target.value)}
                      max={cartTotal}
                      min={0}
                    />
                    <span className="form-hint">
                      Balance due added to party's ledger: Rs.{' '}
                      {Math.max(0, cartTotal - (Number(initialPayment) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Special Instructions / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Dispatch via Sadar Bazaar tempo"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                  >
                    {isSubmitting ? 'Confirming Order...' : 'Confirm & Place Order'}
                    {!isSubmitting && <ArrowRight size={16} />}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookOrder;
