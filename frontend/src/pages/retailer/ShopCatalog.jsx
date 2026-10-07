import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const ShopCatalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [cart, setCart] = useState([]);
  const [paymentMode, setPaymentMode] = useState('Credit');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/products');
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product, variant) => {
    if (variant.stockQty <= 0) {
      alert('This variant is out of stock.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((it) => it.variantSku === variant.sku);
      if (existing) {
        if (existing.qty >= variant.stockQty) {
          alert(`Available stock limit reached (${variant.stockQty} pcs).`);
          return prev;
        }
        return prev.map((it) =>
          it.variantSku === variant.sku ? { ...it, qty: it.qty + 1 } : it
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
        .map((it) => {
          if (it.variantSku === sku) {
            const nextQty = it.qty + delta;
            if (nextQty > it.maxStock) {
              alert(`Only ${it.maxStock} pieces in stock`);
              return it;
            }
            return { ...it, qty: nextQty };
          }
          return it;
        })
        .filter((it) => it.qty > 0)
    );
  };

  const removeFromCart = (sku) => {
    setCart((prev) => prev.filter((it) => it.variantSku !== sku));
  };

  const cartTotal = cart.reduce((sum, it) => sum + it.qty * it.rate, 0);
  const totalPcs = cart.reduce((sum, it) => sum + it.qty, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axiosClient.post('/orders', {
        items: cart,
        paymentMode,
        initialPayment: 0,
        notes,
      });

      alert(`Order #${res.data.orderNo} confirmed! Dispatch is being scheduled.`);
      navigate('/retailer/orders');
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
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Wholesale Innerwear Catalog</h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Select products, pick sizes & colors, and order directly at your wholesale rates
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Catalog List */}
        <div>
          {/* Filters */}
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
                  placeholder="Search undergarments by brand or name..."
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
                  <option value="Thermal">Thermal Set</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', color: '#64748b' }}>Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                No products found
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div key={p._id} className="card" style={{ marginBottom: 0, padding: '1.25rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</h4>
                    <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                      {p.brand} • <span style={{ color: '#64748b' }}>{p.category}</span>
                    </div>
                    {p.description && (
                      <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                        {p.description}
                      </p>
                    )}
                  </div>

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
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
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

        {/* Cart Drawer */}
        <div style={{ position: 'sticky', top: 90 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShoppingCart size={20} color="#4f46e5" />
                <span>My Cart ({totalPcs} Units)</span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <Package size={38} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.9rem' }}>Your cart is empty.</p>
                <span style={{ fontSize: '0.75rem' }}>Click "Add to Cart" to select innerwear items.</span>
              </div>
            ) : (
              <div>
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

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 8, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span>Total Quantity:</span>
                    <strong>{totalPcs} Units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>
                    <span>Total Payable:</span>
                    <span>Rs. {Number(cartTotal).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitOrder}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label>Payment Preference</label>
                    <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                      <option value="Credit">Bill to My Wholesale Credit Ledger</option>
                      <option value="UPI">UPI on Delivery</option>
                      <option value="Cash">Cash on Delivery</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Delivery Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. Please deliver by Thursday morning"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', background: '#4f46e5' }}
                  >
                    {isSubmitting ? 'Placing Order...' : 'Confirm Self-Order'}
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

export default ShopCatalog;
